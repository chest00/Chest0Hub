"""Registre local allowlisté et gestion des processus Chest0."""

from __future__ import annotations

import ast
from dataclasses import dataclass
import json
from pathlib import Path
import socket
import subprocess
import threading
import time
from typing import Callable
from urllib.request import urlopen


APPLICATION_SPECS = {
    "chest0-quiz-studio": {
        "label": "Chest0 Quiz Studio",
        "port": 8501,
        "entrypoint": "app/main.py",
        "version_file": "app/version.py",
        "markers": ("app/main.py", "app/quiz_exchange.py"),
    },
    "chest0-ai-studio": {
        "label": "Chest0 AI Studio",
        "port": 8502,
        "entrypoint": "app.py",
        "version_file": "src/version.py",
        "markers": ("app.py", "src/integration/quiz_exchange.py"),
    },
}


class EcosystemError(RuntimeError):
    """Erreur contrôlée destinée à l'API locale."""


@dataclass(frozen=True)
class ApplicationDefinition:
    identifier: str
    label: str
    root: Path
    port: int
    entrypoint: str
    version_file: str

    @property
    def url(self) -> str:
        return f"http://127.0.0.1:{self.port}"

    @property
    def health_url(self) -> str:
        return f"{self.url}/_stcore/health"

    @property
    def python(self) -> Path:
        return self.root / ".venv" / "bin" / "python"

    @property
    def command(self) -> tuple[str, ...]:
        return (
            str(self.python), "-m", "streamlit", "run", self.entrypoint,
            "--server.address", "127.0.0.1", "--server.port", str(self.port),
            "--server.fileWatcherType", "none", "--server.headless", "true",
        )


def load_registry(config_path: str | Path) -> dict[str, ApplicationDefinition]:
    path = Path(config_path)
    if not path.is_file():
        raise EcosystemError("Configuration locale absente.")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise EcosystemError("Configuration locale illisible.") from exc
    if not isinstance(payload, dict) or set(payload) != {"applications"}:
        raise EcosystemError("Structure de configuration locale invalide.")
    configured = payload["applications"]
    if not isinstance(configured, dict) or set(configured) != set(APPLICATION_SPECS):
        raise EcosystemError("La configuration doit définir exactement les applications autorisées.")

    result: dict[str, ApplicationDefinition] = {}
    for identifier, spec in APPLICATION_SPECS.items():
        item = configured[identifier]
        if not isinstance(item, dict) or set(item) != {"root"}:
            raise EcosystemError(f"Configuration invalide pour {spec['label']}.")
        raw_root = item["root"]
        if not isinstance(raw_root, str) or not raw_root.strip():
            raise EcosystemError(f"Racine invalide pour {spec['label']}.")
        root = Path(raw_root).expanduser().resolve()
        if not root.is_dir():
            raise EcosystemError(f"Application indisponible : {spec['label']}.")
        if any(not (root / marker).is_file() for marker in spec["markers"]):
            raise EcosystemError(f"La racine ne correspond pas à {spec['label']}.")
        if not (root / ".venv" / "bin" / "python").is_file():
            raise EcosystemError(f"Environnement Python indisponible : {spec['label']}.")
        result[identifier] = ApplicationDefinition(
            identifier=identifier,
            label=str(spec["label"]),
            root=root,
            port=int(spec["port"]),
            entrypoint=str(spec["entrypoint"]),
            version_file=str(spec["version_file"]),
        )
    return result


def read_version(application: ApplicationDefinition) -> str | None:
    """Lit une affectation littérale __version__ sans exécuter le fichier."""
    try:
        tree = ast.parse(
            (application.root / application.version_file).read_text(encoding="utf-8")
        )
    except (OSError, SyntaxError):
        return None
    for node in tree.body:
        if isinstance(node, ast.Assign):
            names = [target.id for target in node.targets if isinstance(target, ast.Name)]
            if "__version__" in names and isinstance(node.value, ast.Constant):
                value = node.value.value
                return str(value) if isinstance(value, str) and value else None
    return None


def read_git_head(application: ApplicationDefinition) -> str | None:
    try:
        result = subprocess.run(
            ["git", "-C", str(application.root), "rev-parse", "--short=8", "HEAD"],
            check=True, capture_output=True, text=True, timeout=3,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    value = result.stdout.strip()
    return value if value and all(character in "0123456789abcdef" for character in value) else None


class EcosystemManager:
    def __init__(
        self,
        config_path: str | Path,
        *,
        popen: Callable = subprocess.Popen,
        health_timeout: float = 15.0,
    ) -> None:
        self.config_path = Path(config_path)
        self._popen = popen
        self.health_timeout = health_timeout
        self._processes: dict[str, subprocess.Popen] = {}
        self._lock = threading.RLock()

    def _registry(self) -> dict[str, ApplicationDefinition]:
        return load_registry(self.config_path)

    def _application(self, identifier: str) -> ApplicationDefinition:
        try:
            return self._registry()[identifier]
        except KeyError as exc:
            raise EcosystemError("Application non autorisée.") from exc

    @staticmethod
    def _port_open(port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.settimeout(0.2)
            return probe.connect_ex(("127.0.0.1", port)) == 0

    @staticmethod
    def _healthy(application: ApplicationDefinition) -> bool:
        try:
            with urlopen(application.health_url, timeout=0.5) as response:
                return response.status == 200 and response.read(32).strip().lower() == b"ok"
        except Exception:
            return False

    def _public_status(self, application: ApplicationDefinition, state: str, owned: bool) -> dict:
        return {
            "id": application.identifier,
            "label": application.label,
            "version": read_version(application) or "indéterminée",
            "head": read_git_head(application),
            "port": application.port,
            "url": application.url,
            "state": state,
            "owned": owned,
            "message": {
                "arrêté": "Application prête à être lancée.",
                "démarrage": "Démarrage en cours.",
                "opérationnel": "Application opérationnelle.",
                "déjà_actif": "Application déjà active hors de cette session Hub.",
                "port_occupé": "Port déjà occupé par un service non reconnu.",
                "erreur": "Le processus s’est arrêté de manière inattendue.",
            }.get(state, "Application indisponible."),
        }

    def statuses(self) -> list[dict]:
        try:
            registry = self._registry()
        except EcosystemError as exc:
            return [{
                "id": identifier, "label": str(spec["label"]), "version": "indéterminée",
                "head": None, "port": int(spec["port"]),
                "url": f"http://127.0.0.1:{spec['port']}",
                "state": "configuration_absente", "owned": False, "message": str(exc),
            } for identifier, spec in APPLICATION_SPECS.items()]

        result = []
        with self._lock:
            for identifier, application in registry.items():
                process = self._processes.get(identifier)
                if process is not None and process.poll() is not None:
                    self._processes.pop(identifier, None)
                    process = None
                    state = "erreur" if not self._port_open(application.port) else "port_occupé"
                elif process is not None:
                    state = "opérationnel" if self._healthy(application) else "démarrage"
                elif self._port_open(application.port):
                    state = "déjà_actif" if self._healthy(application) else "port_occupé"
                else:
                    state = "arrêté"
                result.append(self._public_status(application, state, process is not None))
        return result

    def start(self, identifier: str) -> dict:
        application = self._application(identifier)
        with self._lock:
            process = self._processes.get(identifier)
            if process is not None and process.poll() is None:
                return self._public_status(application, "opérationnel" if self._healthy(application) else "démarrage", True)
            if self._port_open(application.port):
                state = "déjà_actif" if self._healthy(application) else "port_occupé"
                raise EcosystemError(self._public_status(application, state, False)["message"])
            environment = None
            if identifier == "chest0-ai-studio":
                import os
                environment = {**os.environ, "PYTORCH_ENABLE_MPS_FALLBACK": "1"}
            try:
                process = self._popen(
                    list(application.command), cwd=str(application.root), env=environment,
                    stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL, start_new_session=True,
                )
            except OSError as exc:
                raise EcosystemError("Démarrage impossible.") from exc
            self._processes[identifier] = process

        deadline = time.monotonic() + self.health_timeout
        while time.monotonic() < deadline:
            if process.poll() is not None:
                with self._lock:
                    self._processes.pop(identifier, None)
                raise EcosystemError("Démarrage impossible.")
            if self._healthy(application):
                return self._public_status(application, "opérationnel", True)
            time.sleep(0.1)
        self.stop(identifier)
        raise EcosystemError("L’application n’a pas répondu dans le délai prévu.")

    def stop(self, identifier: str) -> dict:
        application = self._application(identifier)
        with self._lock:
            process = self._processes.get(identifier)
            if process is None or process.poll() is not None:
                self._processes.pop(identifier, None)
                raise EcosystemError("Hub ne détient pas ce processus : arrêt refusé.")
            process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=3)
        finally:
            with self._lock:
                self._processes.pop(identifier, None)
        return self._public_status(application, "arrêté", False)

    def shutdown(self) -> None:
        with self._lock:
            identifiers = list(self._processes)
        for identifier in identifiers:
            try:
                self.stop(identifier)
            except EcosystemError:
                pass
