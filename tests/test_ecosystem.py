from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from admin.ecosystem import (
    APPLICATION_SPECS,
    ApplicationDefinition,
    EcosystemError,
    EcosystemManager,
    load_registry,
    read_version,
)


class FakeProcess:
    def __init__(self, *, running=True, timeout=False):
        self.returncode = None if running else 1
        self.timeout = timeout
        self.terminated = False
        self.killed = False

    def poll(self):
        return self.returncode

    def terminate(self):
        self.terminated = True
        if not self.timeout:
            self.returncode = 0

    def wait(self, timeout=None):
        if self.timeout and not self.killed:
            import subprocess
            raise subprocess.TimeoutExpired("fake", timeout)
        return self.returncode

    def kill(self):
        self.killed = True
        self.returncode = -9


class EcosystemManagerTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        roots = {}
        for identifier, spec in APPLICATION_SPECS.items():
            app_root = self.root / identifier
            for marker in spec["markers"]:
                target = app_root / marker
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("", encoding="utf-8")
            python = app_root / ".venv/bin/python"
            python.parent.mkdir(parents=True)
            python.write_text("", encoding="utf-8")
            version = app_root / spec["version_file"]
            version.parent.mkdir(parents=True, exist_ok=True)
            version.write_text('__version__ = "9.8.7"\n', encoding="utf-8")
            roots[identifier] = {"root": str(app_root)}
        self.config = self.root / "ecosystem.local.json"
        self.config.write_text(json.dumps({"applications": roots}), encoding="utf-8")

    def tearDown(self):
        self.temporary.cleanup()

    def test_registry_is_exact_allowlist_with_fixed_ports_and_commands(self):
        registry = load_registry(self.config)
        self.assertEqual(set(registry), set(APPLICATION_SPECS))
        self.assertEqual(registry["chest0-quiz-studio"].port, 8501)
        self.assertEqual(registry["chest0-ai-studio"].port, 8502)
        for application in registry.values():
            self.assertIsInstance(application.command, tuple)
            self.assertIn("--server.port", application.command)
            self.assertNotIn("shell=True", " ".join(application.command))

    def test_missing_invalid_unknown_and_wrong_root_are_rejected(self):
        with self.assertRaisesRegex(EcosystemError, "absente"):
            load_registry(self.root / "missing.json")
        self.config.write_text("[]", encoding="utf-8")
        with self.assertRaisesRegex(EcosystemError, "Structure"):
            load_registry(self.config)
        self.setUp_config_again()
        manager = EcosystemManager(self.config)
        with self.assertRaisesRegex(EcosystemError, "non autorisée"):
            manager.start("unknown")
        payload = json.loads(self.config.read_text())
        payload["applications"]["chest0-quiz-studio"]["root"] = str(self.root)
        self.config.write_text(json.dumps(payload), encoding="utf-8")
        with self.assertRaisesRegex(EcosystemError, "ne correspond pas"):
            load_registry(self.config)

    def setUp_config_again(self):
        roots = {
            identifier: {"root": str(self.root / identifier)}
            for identifier in APPLICATION_SPECS
        }
        self.config.write_text(json.dumps({"applications": roots}), encoding="utf-8")

    def test_version_is_read_without_execution(self):
        application = load_registry(self.config)["chest0-quiz-studio"]
        version_path = application.root / application.version_file
        version_path.write_text(
            '__version__ = "2.0.0"\nraise RuntimeError("ne doit pas être exécuté")\n',
            encoding="utf-8",
        )
        self.assertEqual(read_version(application), "2.0.0")

    def test_status_never_exposes_path_command_or_pid(self):
        manager = EcosystemManager(self.config)
        with patch.object(manager, "_port_open", return_value=False):
            serialized = json.dumps(manager.statuses())
        self.assertNotIn(str(self.root), serialized)
        self.assertNotIn("command", serialized)
        self.assertNotIn("pid", serialized.casefold())

    def test_start_uses_fixed_arguments_and_stop_only_owned_process(self):
        calls = []
        process = FakeProcess()

        def popen(arguments, **kwargs):
            calls.append((arguments, kwargs))
            return process

        manager = EcosystemManager(self.config, popen=popen, health_timeout=0.1)
        with patch.object(manager, "_port_open", return_value=False), patch.object(manager, "_healthy", return_value=True):
            status = manager.start("chest0-quiz-studio")
        self.assertEqual(status["state"], "opérationnel")
        self.assertTrue(status["owned"])
        arguments, options = calls[0]
        self.assertIsInstance(arguments, list)
        self.assertEqual(arguments[arguments.index("--server.port") + 1], "8501")
        self.assertEqual(arguments[arguments.index("--server.headless") + 1], "true")
        self.assertNotIn("shell", options)
        manager.stop("chest0-quiz-studio")
        self.assertTrue(process.terminated)
        with self.assertRaisesRegex(EcosystemError, "ne détient pas"):
            manager.stop("chest0-quiz-studio")

    def test_forced_stop_and_shutdown_cleanup(self):
        process = FakeProcess(timeout=True)
        manager = EcosystemManager(self.config)
        manager._processes["chest0-ai-studio"] = process
        manager.stop("chest0-ai-studio")
        self.assertTrue(process.terminated)
        self.assertTrue(process.killed)
        self.assertFalse(manager._processes)

    def test_unknown_occupied_port_is_never_killed(self):
        manager = EcosystemManager(self.config, popen=lambda *a, **k: self.fail("launch forbidden"))
        with patch.object(manager, "_port_open", return_value=True), patch.object(manager, "_healthy", return_value=False):
            with self.assertRaisesRegex(EcosystemError, "Port déjà occupé"):
                manager.start("chest0-ai-studio")

    def test_ui_has_guide_and_no_file_uploader(self):
        root = Path(__file__).parents[1]
        html = (root / "admin/templates/index.html").read_text(encoding="utf-8")
        js = (root / "admin/static/admin.js").read_text(encoding="utf-8")
        self.assertIn("Écosystème local", html)
        self.assertIn("Chest0 Hub ne lit pas et ne transfère pas le paquet", html)
        self.assertIn("Importer un quiz Chest0", html)
        self.assertIn("Lancer démarre l’application en arrière-plan", js)
        self.assertIn("Ouvrir l’affiche dans le navigateur", js)
        self.assertIn("Arrêter ferme uniquement le processus lancé par Hub", js)
        self.assertNotIn("file_uploader", html + js)
        self.assertNotIn("shell=True", (root / "admin/ecosystem.py").read_text())

    def test_admin_launcher_disables_bytecode_and_certification_uses_ast(self):
        root = Path(__file__).parents[1]
        launcher = (root / "run_admin.sh").read_text(encoding="utf-8")
        validation = (root / "scripts/validate.sh").read_text(encoding="utf-8")
        self.assertIn("PYTHONDONTWRITEBYTECODE=1 python3 -B admin/server.py", launcher)
        self.assertIn("ast.parse", validation)
        self.assertNotIn("py_compile", validation)
        self.assertIn("fichier Python compilé indésirable détecté", validation)


if __name__ == "__main__":
    unittest.main()
