import unittest
from unittest.mock import patch
from admin.ecosystem import EcosystemManager, EcosystemError, PHOTO_ID, _photo_definition

class NativeIntegrationTests(unittest.TestCase):
    def test_photo_not_certified_fails_closed(self):
        with patch("admin.ecosystem._photo_definition", return_value=None):
            manager = EcosystemManager("not-used.json")
            self.assertFalse(manager._photo_status()["can_start"])
            with self.assertRaises(EcosystemError):
                manager.start(PHOTO_ID)
    def test_photo_cannot_be_stopped_without_hub_launch(self):
        manager = EcosystemManager("not-used.json")
        with self.assertRaises(EcosystemError):
            manager.stop(PHOTO_ID)
    def test_photo_uses_fixed_open_command(self):
        from pathlib import Path
        from types import SimpleNamespace
        manager = EcosystemManager("not-used.json")
        bundle = Path("/tmp/Chest0 Photo Cleaner.app")
        with patch("admin.ecosystem._photo_definition", return_value=bundle), patch(
                "admin.ecosystem.subprocess.run", return_value=SimpleNamespace(returncode=0)) as run:
            manager.start(PHOTO_ID)
            self.assertEqual(run.call_args.args[0], ["/usr/bin/open", "-a", str(bundle)])
            self.assertTrue(manager._photo_status()["can_stop"])
            manager.stop(PHOTO_ID)
            self.assertEqual(run.call_args.args[0][0], "/usr/bin/osascript")
            self.assertFalse(manager._photo_status()["can_stop"])

if __name__ == "__main__": unittest.main()
