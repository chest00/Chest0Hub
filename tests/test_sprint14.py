"""Native Video launcher: no HTTP assumption, no forced shutdown."""
import unittest
from unittest.mock import patch
from admin.ecosystem import EcosystemManager, EcosystemError, VIDEO_ID

class FakeVideo:
    def poll(self): return None

class Sprint14Tests(unittest.TestCase):
    def test_no_stop_even_when_owned(self):
        manager = EcosystemManager('/nonexistent')
        manager._processes[VIDEO_ID] = FakeVideo()
        with self.assertRaisesRegex(EcosystemError, 'interdit'):
            manager.stop(VIDEO_ID)
        manager.shutdown()
        self.assertIn(VIDEO_ID, manager._processes)

    def test_fail_closed_without_certification(self):
        manager = EcosystemManager('/nonexistent')
        with patch('admin.ecosystem._video_definition', return_value=None):
            status = manager._video_status()
            self.assertFalse(status['can_start'])
            self.assertIsNone(status['port'])
            with self.assertRaisesRegex(EcosystemError, 'non certifié'):
                manager.start(VIDEO_ID)

    def test_launch_uses_fixed_python_and_never_stop(self):
        from pathlib import Path
        import tempfile
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            calls=[]
            def popen(command, **kwargs):
                calls.append((command,kwargs)); return FakeVideo()
            manager=EcosystemManager('/nonexistent', popen=popen)
            with patch('admin.ecosystem._video_definition', return_value=root):
                result=manager.start(VIDEO_ID)
                self.assertEqual(result['state'],'lancé_non_vérifié')
                self.assertFalse(result['can_stop'])
                self.assertEqual(calls[0][0],[str(root/'.venv/bin/python'),'run_gui.py'])
                self.assertTrue(calls[0][1]['start_new_session'])
