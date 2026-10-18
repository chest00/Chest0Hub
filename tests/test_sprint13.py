import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from admin import registry as r

ROOT = Path(__file__).resolve().parents[1]

class Sprint13Tests(unittest.TestCase):
    def setUp(self):
        self.data = r.load(ROOT/'config/projects.registry.json')

    def test_legacy_migration_preserves_input(self):
        row = copy.deepcopy(self.data['projects'][0]);row.pop('governance')
        old = copy.deepcopy(row)
        r.validate({'schema_version':1,'projects':[row]})
        g = r.migration(row)
        self.assertEqual(row, old)
        self.assertEqual(g['availability'], 'inconnue')
        self.assertTrue(all(v=='unsupported' for v in g['capabilities'].values()))

    def test_private_future_contract_and_public_identity(self):
        before=json.loads((ROOT/'data/public/ecosystem.json').read_text())
        self.assertEqual(r.public_export(self.data),before)
        rows={x['project_id']:x for x in self.data['projects']}
        for pid in ('chest0-editions-studio','chest0-video-studio','chest0-accompagnement'):
            self.assertFalse(rows[pid]['public_visible'])
            self.assertEqual(rows[pid]['launch_id'], pid if pid=='chest0-video-studio' else None)
        g=rows['chest0-editions-studio']['governance']
        self.assertEqual(g['development'],'conception')
        self.assertEqual(g['capabilities']['export'],'planned')
        self.assertNotIn('governance',json.dumps(r.public_export(self.data)))

    def test_contract_rejects_unknown_and_false_operational(self):
        for key,value in [('contract_version',2),('development','imaginary'),('verified_on','bad'),('availability','unknown')]:
            data=copy.deepcopy(self.data);data['projects'][0]['governance'][key]=value
            with self.subTest(key=key),self.assertRaises(r.RegistryError):r.validate(data)
        data=copy.deepcopy(self.data);g=data['projects'][-3]['governance'];g['capabilities']['launch']='verified'
        with self.assertRaises(r.RegistryError):r.validate(data)

    def test_excluded_path_not_inspected(self):
        with tempfile.TemporaryDirectory() as folder:
            config=Path(folder).resolve()/'local.json'
            config.write_text(json.dumps({'applications':{'chest0-ai-studio':{'root':'/Users/jmssosse/Desktop/Projet Chest0 AI Studio'}}}))
            original=Path.is_symlink
            def guarded(path):
                self.assertNotIn('Projet Chest0 AI Studio',str(path))
                return original(path)
            with patch.object(Path,'is_symlink',guarded):
                self.assertEqual(r.availability(config)['chest0-ai-studio'],'chemin_exclu')

    def test_restore_and_user_edit_guard_in_isolation(self):
        spec=importlib.util.spec_from_file_location('s13',ROOT/'scripts/sprint13_update.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder).resolve();bundle=root/'backups/sprint13';(bundle/'before').mkdir(parents=True)
            (bundle/'before/a').write_text('old');(root/'a').write_text('new');(root/'added').write_text('added')
            files={'a':{'before':module.digest(bundle/'before/a'),'after':module.digest(root/'a')},'added':{'before':None,'after':module.digest(root/'added')}}
            (bundle/'manifest.json').write_text(json.dumps({'head':'test','files':files}))
            with patch.object(module.subprocess,'check_output',side_effect=lambda args,**kw: 'main\n' if 'branch' in args else 'test\n'):
                (root/'a').write_text('user edit')
                with self.assertRaises(RuntimeError):module.run(root,restore=True)
                self.assertTrue((root/'added').exists());self.assertEqual((root/'a').read_text(),'user edit')
                (root/'a').write_text('new');module.run(root,restore=True)
                self.assertEqual((root/'a').read_text(),'old');self.assertFalse((root/'added').exists())
                self.assertEqual((bundle/'retired/added').read_text(),'added')
