import json
from pathlib import Path
import unittest
from unittest.mock import patch
import test_ecosystem
from admin.ecosystem import ApplicationDefinition, EcosystemManager, load_registry


class SocialAccessTests(unittest.TestCase):
    def test_single_launcher_and_distinct_health_identity(self):
        app = ApplicationDefinition("chest0-social-studio", "Chest0 Social Studio", Path("/example/studio"), 8503, "run_dev.sh", "src/chest0_social_studio/web/app.py")
        self.assertEqual(app.url, "http://127.0.0.1:8503")
        self.assertEqual(app.health_url, app.url + "/api/health")
        self.assertEqual(app.command[:3], ("/bin/bash", "/example/studio/run_dev.sh", "--no-browser"))
        self.assertNotIn("streamlit", app.command)
        with patch("admin.ecosystem.urlopen") as open_url:
            response = open_url.return_value.__enter__.return_value
            response.status = 200
            response.read.return_value = b"ok"
            self.assertFalse(EcosystemManager._healthy(app))
            response.read.return_value = b"chest0-social-studio"
            self.assertTrue(EcosystemManager._healthy(app))

    def test_old_configuration_remains_valid(self):
        fixture=test_ecosystem.EcosystemManagerTests()
        fixture.setUp()
        try:
            data=json.loads(fixture.config.read_text())
            data["applications"].pop("chest0-social-studio")
            fixture.config.write_text(json.dumps(data))
            self.assertEqual(set(load_registry(fixture.config)), {"chest0-ai-studio", "chest0-quiz-studio"})
        finally:
            fixture.tearDown()

    def test_public_site_excludes_private_admin_and_config(self):
        root=Path(__file__).resolve().parents[1]
        config=(root/"_config.yml").read_text()
        for name in ("admin", "config", "run_admin.sh"):
            self.assertIn("  - " + name, config)
        self.assertNotIn("8503", (root/"index.html").read_text())
        self.assertIn("config/ecosystem.local.json", (root/".gitignore").read_text())
