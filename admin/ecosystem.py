"""Registre local allowlisté et gestion des processus Chest0."""

from __future__ import annotations

import ast
from dataclasses import dataclass
import json
import os
import re
from pathlib import Path
import socket
import subprocess
import threading
import time
from typing import Callable
from urllib.request import urlopen


APPLICATION_SPECS = {
    "chest0-games-studio": {"label": "Chest0 Games Studio", "port": 4188, "entrypoint": "current/runtime/server.mjs", "version_file": "installation.json", "markers": ("installation.json", "Ouvrir Chest0 Games Studio.command")},
    "chest0-editions-studio": {
        "label": "Chest0 Éditions Studio", "port": 8766, "entrypoint": "app.py",
        "version_file": "app.py", "markers": ("app.py", "automatic_export_audit.py"),
    },
    "chest0-social-studio": {
        "label": "Chest0 Social Studio",
        "port": 8503,
        "entrypoint": "run_dev.sh",
        "version_file": "src/chest0_social_studio/__init__.py",
        "markers": ("run_dev.sh", "src/chest0_social_studio/workflow/production.py"),
    },
    "chest0-market-intelligence": {
        "label": "Chest0 Market Intelligence",
        "port": 8770,
        "entrypoint": "src.cockpit_final",
        "version_file": "src/cockpit_final.py",
        "markers": ("src/cockpit_final.py",),
    },
    "chest0-blog-studio": {
        "label": "Chest0 Blog Studio",
        "port": 8765,
        "entrypoint": "scripts/launch_blog_studio.py",
        "version_file": "app/__init__.py",
        "markers": ("scripts/launch_blog_studio.py", "app/ui/local_web.py"),
    },
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


ASSISTANT_ID = "chest0-assistant"
ASSISTANT_ROOT = Path.home() / "Applications" / "Chest0Assistant"

def _assistant_definition():
    root = ASSISTANT_ROOT
    if root.is_symlink() or not root.is_dir(): return None
    for name in ("bin/chest0-assistant", "chest0_assistant/__init__.py"):
        p = root / name
        if p.is_symlink() or not p.is_file(): return None
    if not os.access(root / "bin/chest0-assistant", os.X_OK): return None
    return root

# Native GUI: intentionally outside the HTTP launcher allowlist.
# No HTTP port, no remote discovery, no forced shutdown.
PHOTO_ID = "chest0-photo-cleaner"
PHOTO_ROOT = Path.home() / "Applications" / "Chest0PhotoCleaner"
PHOTO_APP = PHOTO_ROOT / "dist" / "Chest0 Photo Cleaner.app"
PHOTO_COMMIT = "dd49c045614ab5311a31754d6f6400b121595da8"


def _photo_definition():
    """Verify a fixed macOS .app bundle; do not inspect or change Photo Cleaner sources."""
    root = PHOTO_ROOT
    if root.is_symlink() or not root.is_dir():
        return None
    bundle = PHOTO_APP
    executable = bundle / "Contents" / "MacOS" / "Chest0 Photo Cleaner"
    plist = bundle / "Contents" / "Info.plist"
    if (bundle.is_symlink() or not bundle.is_dir() or
            executable.is_symlink() or not executable.is_file() or
            not os.access(executable, os.X_OK) or not plist.is_file() or plist.is_symlink()):
        return None
    try:
        head = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"],
                              capture_output=True, text=True, timeout=3, check=True).stdout.strip()
        if head != PHOTO_COMMIT:
            return None
        import plistlib
        with plist.open("rb") as stream:
            info = plistlib.load(stream)
        if info.get("CFBundleExecutable") != "Chest0 Photo Cleaner":
            return None
    except (OSError, ValueError, subprocess.SubprocessError):
        return None
    return bundle


VIDEO_ID = "chest0-video-studio"
VIDEO_ROOT = Path.home() / "Applications" / "Chest0VideoStudio"
VIDEO_COMMIT = "b382dc29a43babbff81b51aa22a53aa43249c555"


def _video_definition():
    root = VIDEO_ROOT
    if root.is_symlink() or not root.is_dir():
        return None
    # Never resolve or inspect excluded paths. This is a fixed application root.
    required = ("run_gui.py", "pyproject.toml", "src/chest0_video_studio/gui.py", ".venv/bin/python")
    if any(not (root / item).is_file() for item in required):
        return None
    # A venv Python executable is normally a symlink on macOS.
    # Continue refusing symlinks for project source/manifest files.
    if any((root / item).is_symlink() for item in required if item != ".venv/bin/python"):
        return None
    try:
        config = (root / "pyproject.toml").read_text(encoding="utf-8")
        entry = (root / "run_gui.py").read_text(encoding="utf-8")
        if not re.search(r'(?m)^name\s*=\s*"chest0-video-studio"\s*$', config):
            return None
        if not re.search(r'(?m)^version\s*=\s*"0\.35\.0"\s*$', config):
            return None
        if 'from chest0_video_studio.gui import main' not in entry:
            return None
        head = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"],
                              capture_output=True, text=True, timeout=3, check=True).stdout.strip()
        if head != VIDEO_COMMIT:
            return None
        dirty = subprocess.run(["git", "-C", str(root), "status", "--porcelain"],
                               capture_output=True, text=True, timeout=3, check=True).stdout
        # Autoriser seulement les deux fichiers de défilement produits par
        # l'installation précédente, avec empreintes exactes (aucune tolérance globale).
        allowed = {
            "src/chest0_video_studio/ui.py": "98109fe70b45acc266e5ec2d3bec5bd38f430dce3cd340939f6db609ac296dfc",
            "tests/test_scroll_layout.py": "eed3979621940054a0b54f38c2ae45ddc4792f4248b292fdfe6450f04b3c3460",
        }
        import hashlib
        for line in dirty.splitlines():
            if len(line) < 4 or line[:2] not in (" M", "??"):
                return None
            rel = line[3:]
            if rel not in allowed:
                return None
            file = root / rel
            if file.is_symlink() or not file.is_file():
                return None
            if hashlib.sha256(file.read_bytes()).hexdigest() != allowed[rel]:
                return None
    except (OSError, UnicodeError, subprocess.SubprocessError):
        return None
    return root


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
        if self.identifier == "chest0-games-studio": return f"{self.url}/__health"
        if self.identifier == "chest0-market-intelligence":
            return f"{self.url}/"
        if self.identifier in ("chest0-blog-studio", "chest0-editions-studio"):
            return f"{self.url}/health"
        return f"{self.url}/api/health" if self.identifier == "chest0-social-studio" else f"{self.url}/_stcore/health"

    @property
    def python(self) -> Path:
        return self.root / ".venv" / "bin" / "python"

    @property
    def command(self) -> tuple[str, ...]:
        if self.identifier == "chest0-games-studio":
            info = json.loads((self.root / "installation.json").read_text(encoding="utf-8"))
            node = info.get("nodeExecutable")
            if node != "/opt/homebrew/bin/node" or info.get("port") != 4188: raise EcosystemError("Installation Games non certifiée.")
            return (node, str(self.root / "current/runtime/server.mjs"), "--installation", str(self.root), "--no-open")
        if self.identifier == "chest0-market-intelligence":
            return (str(self.python), "-m", self.entrypoint)
        if self.identifier == "chest0-blog-studio":
            return (str(self.python), self.entrypoint)
        if self.identifier == "chest0-editions-studio":
            return (str(Path(__import__("sys").executable)), "-B", self.entrypoint)
        if self.identifier == "chest0-social-studio":
            return ("/bin/bash", str(self.root / "run_dev.sh"), "--no-browser", "--server.port", str(self.port))
        return (
            str(self.python), "-m", "streamlit", "run", self.entrypoint,
            "--server.address", "127.0.0.1", "--server.port", str(self.port),
            "--server.fileWatcherType", "none", "--server.headless", "true",
        )


def load_registry(config_path: str | Path, only: str | None = None) -> dict[str, ApplicationDefinition]:
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
    required = set(APPLICATION_SPECS) - {"chest0-social-studio", "chest0-blog-studio", "chest0-market-intelligence", "chest0-editions-studio"}
    if not isinstance(configured, dict) or not required <= set(configured) or not set(configured) <= set(APPLICATION_SPECS):
        raise EcosystemError("La configuration doit définir exactement les applications autorisées.")

    result: dict[str, ApplicationDefinition] = {}
    for identifier, spec in APPLICATION_SPECS.items():
        if identifier not in configured or (only is not None and identifier != only):
            continue
        item = configured[identifier]
        if not isinstance(item, dict) or set(item) != {"root"}:
            raise EcosystemError(f"Configuration invalide pour {spec['label']}.")
        raw_root = item["root"]
        if not isinstance(raw_root, str) or not raw_root.strip():
            raise EcosystemError(f"Racine invalide pour {spec['label']}.")
        root = Path(raw_root).expanduser()
        if str(root).startswith('/Users/jmssosse/Desktop/Projet Chest0 AI Studio'):
            raise EcosystemError("Chemin exclu du périmètre autorisé.")
        if not root.is_absolute() or '..' in root.parts or root.is_symlink():
            raise EcosystemError("Chemin local refusé.")
        root = root.resolve()
        if not root.is_dir():
            raise EcosystemError(f"Application indisponible : {spec['label']}.")
        if any(not (root / marker).is_file() for marker in spec["markers"]):
            raise EcosystemError(f"La racine ne correspond pas à {spec['label']}.")
        if identifier not in ("chest0-social-studio", "chest0-editions-studio", "chest0-games-studio") and not (root / ".venv" / "bin" / "python").is_file():
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
    if application.identifier == "chest0-games-studio":
        try: return str(json.loads((application.root / "installation.json").read_text(encoding="utf-8"))["version"])
        except (OSError, ValueError, KeyError): return None
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
        self._photo_opened_by_hub = False
        self._lock = threading.RLock()

    def _registry(self) -> dict[str, ApplicationDefinition]:
        return load_registry(self.config_path)

    def _application(self, identifier: str) -> ApplicationDefinition:
        try:
            return load_registry(self.config_path, only=identifier)[identifier]
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
                if application.identifier == "chest0-games-studio":
                    payload = json.loads(response.read(4096))
                    info = json.loads((application.root / "installation.json").read_text(encoding="utf-8"))
                    return response.status == 200 and payload.get("appId") == info.get("appId") and payload.get("installId") == info.get("installId") and payload.get("releaseId") == info.get("releaseId")
                if application.identifier == "chest0-market-intelligence":
                    # La page d'accueil doit identifier explicitement le cockpit.
                    # Un autre service sur le même port ne doit pas être reconnu.
                    page = response.read(131072).decode("utf-8", errors="replace").lower()
                    return response.status == 200 and "chest0" in page and "market" in page
                if application.identifier in ("chest0-blog-studio", "chest0-editions-studio"):
                    payload = json.loads(response.read(4096))
                    expected_service = "Chest0 Blog Studio" if application.identifier == "chest0-blog-studio" else "Chest0 Éditions Studio"
                    return response.status == 200 and payload.get("service") == expected_service and payload.get("status") == "ok"
                expected = b"chest0-social-studio" if application.identifier == "chest0-social-studio" else b"ok"
                return response.status == 200 and response.read(64).strip().lower() == expected
        except Exception:
            return False

    def _verified_external_blog_pid(self, application: ApplicationDefinition) -> int | None:
        """Return the sole listening PID only when executable, cwd and health all match."""
        if application.identifier != "chest0-blog-studio" or not self._healthy(application):
            return None
        try:
            found = subprocess.run(
                ["lsof", "-nP", "-tiTCP:%d" % application.port, "-sTCP:LISTEN"],
                capture_output=True, text=True, timeout=3, check=True,
            )
            pids = set(found.stdout.split())
            if len(pids) != 1 or not next(iter(pids)).isdigit():
                return None
            pid = int(next(iter(pids)))
            if pid <= 1 or pid == __import__("os").getpid():
                return None
            command = subprocess.run(
                ["ps", "-p", str(pid), "-o", "command="],
                capture_output=True, text=True, timeout=3, check=True,
            ).stdout.strip()
            cwd_output = subprocess.run(
                ["lsof", "-a", "-p", str(pid), "-d", "cwd", "-Fn"],
                capture_output=True, text=True, timeout=3, check=True,
            ).stdout.splitlines()
            cwd = [line[1:] for line in cwd_output if line.startswith("n")]
            if len(cwd) != 1 or Path(cwd[0]).resolve() != application.root.resolve():
                return None
            # The process must explicitly be the known Blog Studio entrypoint.
            if not (
                "scripts/launch_blog_studio.py" in command
                or ("-m app.ui.local_web" in command and str(application.python) in command)
            ):
                return None
            return pid
        except (OSError, ValueError, subprocess.SubprocessError):
            return None

    def _public_status(self, application: ApplicationDefinition, state: str, owned: bool) -> dict:
        return {
            "manageable": owned or (state == "déjà_actif" and self._verified_external_blog_pid(application) is not None),
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

    def assistant_capabilities(self):
        root = _assistant_definition()
        if root is None: raise EcosystemError("Assistant absent")
        try:
            response = subprocess.run([str(root / "bin/chest0-assistant"), "capacites"],
                capture_output=True, timeout=5, check=True)
            if len(response.stdout) > 32768: raise ValueError()
            data = json.loads(response.stdout)
            if data.get("app_id") != ASSISTANT_ID or data.get("schema_version") != 1: raise ValueError()
            if data.get('publication') is not False or not isinstance(data.get('actions'),list):raise ValueError()
            return {k:data[k] for k in ('app_id','schema_version','version','actions','publication','ai_local_optional') if k in data}
        except (OSError, ValueError, subprocess.SubprocessError) as exc:
            raise EcosystemError("Capacités Assistant indisponibles") from exc

    def _assistant_status(self):
        root = _assistant_definition()
        process = self._processes.get(ASSISTANT_ID)
        running = process is not None and process.poll() is None
        capabilities=None
        if root:
            try:capabilities=self.assistant_capabilities()
            except EcosystemError:root=None
        failed=process is not None and process.poll() not in (None,0)
        return {"id":ASSISTANT_ID,"label":"Chest0 Assistant","version":capabilities.get("version","indéterminée") if capabilities else "indéterminée",
            "head":None,"port":None,"url":None,"mode":"native_gui","owned":running,
            "manageable":False,"can_start":root is not None and not running,"can_stop":False,
            "state":"lancé_non_vérifié" if running else "erreur" if failed else "prêt_non_testé" if root else "configuration_absente",
            "message":"Fenêtre à vérifier dans Assistant ; aucune publication depuis Hub."}

    def _start_assistant(self):
        with self._lock:
            state=self._assistant_status()
            if state['state']=='configuration_absente':raise EcosystemError('Installation Assistant indisponible ou incompatible.')
            if not state["can_start"]:return state
            root = _assistant_definition()
            self.assistant_capabilities()
            try:
                self._processes[ASSISTANT_ID] = self._popen([str(root / "bin/chest0-assistant"), "interface"],
                    cwd=str(root), stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL, start_new_session=True)
            except OSError as exc: raise EcosystemError("Lancement Assistant impossible") from exc
            return self._assistant_status()

    def _video_status(self) -> dict:
        root = _video_definition()
        with self._lock:
            process = self._processes.get(VIDEO_ID)
            if process is not None and process.poll() is not None:
                self._processes.pop(VIDEO_ID, None)
                process = None
        state = "lancé_non_vérifié" if process is not None else (
            "prêt_non_testé" if root is not None else "configuration_absente"
        )
        return {
            "id": VIDEO_ID, "label": "Chest0 Video Studio", "version": "0.35.0" if root else "indéterminée",
            "head": VIDEO_COMMIT[:8] if root else None, "port": None, "url": None,
            "state": state, "owned": process is not None, "manageable": False,
            "mode": "native_gui", "can_start": root is not None and process is None,
            "can_stop": False,
            "message": {
                "lancé_non_vérifié": "Processus graphique lancé ; fenêtre et travaux non vérifiés. Arrêt Hub interdit.",
                "prêt_non_testé": "Lancement graphique disponible ; validation réelle sur Mac nécessaire.",
                "configuration_absente": "Installation Video Studio non certifiée : lancement désactivé.",
            }[state],
        }

    def _start_video(self) -> dict:
        with self._lock:
            existing = self._processes.get(VIDEO_ID)
            if existing is not None and existing.poll() is None:
                return self._video_status()
            root = _video_definition()
            if root is None:
                raise EcosystemError("Video Studio non certifié : lancement refusé.")
            environment = dict(os.environ)
            environment["PYTHONPATH"] = str(root / "src")
            environment["PYTHONDONTWRITEBYTECODE"] = "1"
            try:
                process = self._popen(
                    [str(root / ".venv/bin/python"), "run_gui.py"],
                    cwd=str(root), env=environment, stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
            except OSError as exc:
                raise EcosystemError("Lancement graphique impossible.") from exc
            self._processes[VIDEO_ID] = process
            return self._video_status()

    def _photo_status(self) -> dict:
        bundle = _photo_definition()
        # `open -a` exits after submitting the launch request. No process ownership
        # or running state is inferred, and the Hub never stops Photo Cleaner.
        return {
            "id": PHOTO_ID, "label": "Chest0 Photo Cleaner", "version": "non vérifiée",
            "head": PHOTO_COMMIT[:8] if bundle else None,
            "port": None, "url": None, "mode": "native_app",
            "state": "prêt_non_testé" if bundle else "configuration_absente",
            "owned": self._photo_opened_by_hub, "manageable": False, "can_start": bundle is not None,
            "can_stop": bool(bundle and self._photo_opened_by_hub),
            "message": ("Application macOS détectée ; ouverture à confirmer."
                        if bundle else "Application compilée non certifiée."),
        }

    def _start_photo(self) -> dict:
        bundle = _photo_definition()
        if bundle is None:
            raise EcosystemError("Photo Cleaner non certifié : lancement refusé.")
        try:
            result = subprocess.run(["/usr/bin/open", "-a", str(bundle)],
                                    capture_output=True, timeout=12, check=False)
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise EcosystemError("Ouverture Photo Cleaner impossible.") from exc
        if result.returncode:
            raise EcosystemError("macOS a refusé l'ouverture de Photo Cleaner.")
        self._photo_opened_by_hub = True
        status = self._photo_status()
        status["message"] = "Demande d'ouverture transmise à macOS ; fenêtre non vérifiée."
        return status

    def statuses(self) -> list[dict]:
        registry = {}
        result = []
        for identifier, spec in APPLICATION_SPECS.items():
            try:
                registry[identifier] = self._application(identifier)
            except EcosystemError as exc:
                result.append({
                    "id": identifier, "label": str(spec["label"]), "version": "indéterminée",
                    "head": None, "port": int(spec["port"]),
                    "url": f"http://127.0.0.1:{spec['port']}",
                    "state": "configuration_absente", "owned": False, "message": str(exc),
                })

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
        result.append(self._assistant_status())
        result.append(self._video_status())
        result.append(self._photo_status())
        return result

    def start(self, identifier: str) -> dict:
        if identifier == ASSISTANT_ID: return self._start_assistant()
        if identifier == PHOTO_ID:
            return self._start_photo()
        if identifier == VIDEO_ID:
            return self._start_video()
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
        if identifier == ASSISTANT_ID: raise EcosystemError("Fermez Assistant depuis sa fenêtre.")
        if identifier == PHOTO_ID:
            if not self._photo_opened_by_hub:
                raise EcosystemError("Photo Cleaner non ouvert depuis cette session Hub : fermeture refusée.")
            bundle = _photo_definition()
            if bundle is None:
                raise EcosystemError("Application Photo Cleaner non certifiée.")
            # Apple Event de fermeture normale, jamais de signal ni de kill.
            # Le nom est fixe, issu du bundle certifié.
            try:
                result = subprocess.run(
                    ["/usr/bin/osascript", "-e", 'tell application "Chest0 Photo Cleaner" to quit'],
                    capture_output=True, timeout=15, check=False)
            except (OSError, subprocess.TimeoutExpired) as exc:
                raise EcosystemError("Fermeture normale indisponible.") from exc
            if result.returncode:
                raise EcosystemError("macOS a refusé la demande de fermeture normale.")
            self._photo_opened_by_hub = False
            return self._photo_status()
        if identifier == VIDEO_ID:
            raise EcosystemError("Arrêt Video Studio interdit : travaux potentiellement actifs.")
        application = self._application(identifier)
        with self._lock:
            process = self._processes.get(identifier)
            if process is None or process.poll() is not None:
                self._processes.pop(identifier, None)
                if identifier != "chest0-blog-studio":
                    raise EcosystemError("Hub ne détient pas ce processus : arrêt refusé.")
                pid = self._verified_external_blog_pid(application)
                if pid is None or self._verified_external_blog_pid(application) != pid:
                    raise EcosystemError("Processus externe non vérifiable : arrêt refusé.")
                import os
                import signal
                try:
                    os.kill(pid, signal.SIGTERM)
                except (OSError, ProcessLookupError) as exc:
                    raise EcosystemError("Arrêt du processus externe impossible.") from exc
                for _ in range(50):
                    if not self._port_open(application.port):
                        return self._public_status(application, "arrêté", False)
                    time.sleep(0.1)
                raise EcosystemError("Arrêt demandé, mais le port reste occupé. Aucun arrêt forcé.")
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
            if identifier in (VIDEO_ID, ASSISTANT_ID):
                # Native GUI outlives Hub: never terminate video jobs.
                continue
            try:
                self.stop(identifier)
            except EcosystemError:
                pass
