import copy
import http.client
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from http.server import ThreadingHTTPServer
from admin import registry as r, server

ROOT=Path(__file__).resolve().parents[1]
CAT=ROOT/'config/projects.registry.json'

class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.data=r.load(CAT)
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name).resolve()
        self.config=self.root/'local.json'
        self.config.write_text(json.dumps({'applications':{}}))
    def tearDown(self):self.temp.cleanup()
    def test_catalogue_and_stable_references(self):
        self.assertEqual(len(self.data['projects']),8)
        rows={p['project_id']:p for p in self.data['projects']}
        social=rows['chest0-social-studio']
        self.assertEqual(social['stable_version'],'v1.0.0')
        self.assertEqual(social['stable_commit'],'bf8550b50648a4ed4bddbde323788cabd47b2184')
        for key in ('chest0-photo-cleaner','chest0-market-intelligence'):
            row=rows[key];self.assertIsNone(row['stable_version']);self.assertTrue(row['public_visible'])
            self.assertEqual(row['public_links'],[]);self.assertEqual(row['commercial_status'],'commercialisation_prevue')
        self.assertFalse(rows['chest0-cloud']['public_visible'])
    def test_future_project(self):
        row=copy.deepcopy(self.data['projects'][0]);row.update(project_id='future-app',launch_id=None)
        self.data['projects'].append(row)
        self.assertEqual(len(r.validate(self.data)['projects']),9)
    def test_versions_unknown_fields_duplicates(self):
        for value in (0,2,True,'1'):
            with self.subTest(value=value),self.assertRaises(r.RegistryError):r.validate({**self.data,'schema_version':value})
        row=self.data['projects'][0]
        for key,value in [('unknown','x'),('project_id','../bad'),('launch_id','/bin/bash'),('commercial_status','free-ish'),('integration_levels',['G']),('public_visible',1),('dependencies',['absent'])]:
            data=copy.deepcopy(self.data);data['projects'][0][key]=value
            with self.subTest(key=key),self.assertRaises(r.RegistryError):r.validate(data)
        self.data['projects'].append(copy.deepcopy(row))
        with self.assertRaises(r.RegistryError):r.validate(self.data)
    def test_integration_levels_non_sequential(self):
        for level in r.LEVELS:
            self.data['projects'][0]['integration_levels']=[level];r.validate(self.data)
        for state in r.COMMERCIAL:
            self.data['projects'][0]['commercial_status']=state;r.validate(self.data)
    def test_dangerous_urls_and_commands(self):
        for url in ('javascript:alert(1)','file:///private/test','https://x.com/?token=test','https://user:pass@x.com','http://x.com','https://x.com:22','https://[invalid'):
            data=copy.deepcopy(self.data);data['projects'][0]['public_links']=[url]
            with self.subTest(url=url),self.assertRaises(r.RegistryError):r.validate(data)
        self.data['projects'][0]['command']='echo unsafe'
        with self.assertRaises(r.RegistryError):r.validate(self.data)
    def test_private_projection(self):
        row=self.data['projects'][0];row['notes']='PRIVATE NOTE';row['documentation']=['https://example.org/private']
        out=r.public_export(self.data);encoded=json.dumps(out)
        for key in ('notes','repository','stable_commit','launch_id','local_status','documentation'):self.assertNotIn(key,out['projects'][0])
        self.assertNotIn('PRIVATE',encoded);self.assertNotIn('/Users/',encoded)
        self.assertEqual({p['project_id'] for p in out['projects']},{'chest0-photo-cleaner', 'chest0-quiz-studio', 'chest0-hub', 'chest0-ai-studio', 'chest0-market-intelligence', 'chest0-social-studio'})
        row['description']='/Users/person/private'
        with self.assertRaises(r.RegistryError):r.public_export(self.data)
    def test_file_corruption_bounds_version_and_duplicate_keys(self):
        path=self.root/'catalogue.json'
        for payload in ('bad','[]','{"schema_version":1,"schema_version":1,"projects":[]}','['*1500+'0'+']'*1500,' '*131073):
            path.write_text(payload)
            with self.subTest(size=len(payload)),self.assertRaises(r.RegistryError):r.load(path)
            self.assertFalse(r.admin_view(path,self.config)['ok'])
    def test_symlinks_and_hardlinks(self):
        import os
        p=self.root/'link';p.symlink_to(CAT)
        with self.assertRaises(r.RegistryError):r.load(p)
        target=self.root/'source';target.write_text(CAT.read_text());os.link(target,self.root/'hard')
        with self.assertRaises(r.RegistryError):r.load(target)
        folder=self.root/'folder';folder.symlink_to(CAT.parent,target_is_directory=True)
        with self.assertRaises(r.RegistryError):r.load(folder/CAT.name)
    def test_local_present_absent_and_traversal(self):
        here=self.root/'present';here.mkdir()
        self.config.write_text(json.dumps({'applications':{'chest0-social-studio':{'root':str(here)},'chest0-ai-studio':{'root':str(self.root/'absent')}}}))
        view=r.admin_view(CAT,self.config);self.assertTrue(view['ok'])
        rows={p['project_id']:p for p in view['projects']}
        self.assertEqual(rows['chest0-social-studio']['local_status'],'present')
        self.assertEqual(rows['chest0-ai-studio']['local_status'],'absent')
        self.assertNotIn(str(self.root),json.dumps(view))
        self.config.write_text(json.dumps({'applications':{'x':{'root':str(here/'..')}}}))
        self.assertEqual(r.availability(self.config),{})
        link=self.root/'link';link.symlink_to(here,target_is_directory=True)
        self.config.write_text(json.dumps({'applications':{'x':{'root':str(link)}}}))
        self.assertEqual(r.availability(self.config)['x'],'chemin_refuse')
    def test_catalogue_does_not_call_apps_or_spawn(self):
        with patch('socket.socket.connect',side_effect=AssertionError('network')),patch('subprocess.Popen',side_effect=AssertionError('process')):
            self.assertTrue(r.admin_view(CAT,self.config)['ok'])
    def test_http_local_end_to_end_and_access_controls(self):
        folder=self.root/'hub';(folder/'config').mkdir(parents=True)
        catalogue=folder/'config/projects.registry.json';catalogue.write_text(json.dumps(self.data))
        class Quiet(server.AdminHandler):
            def log_message(self,*args):pass
        with patch.object(server,'PROJECT_DIR',folder),patch.object(server,'ECOSYSTEM_CONFIG',self.config):
            httpd=ThreadingHTTPServer(('127.0.0.1',0),Quiet);thread=threading.Thread(target=httpd.serve_forever);thread.start()
            def get(path,host='127.0.0.1:8090',origin=None):
                conn=http.client.HTTPConnection('127.0.0.1',httpd.server_port)
                headers={'Host':host}
                if origin:headers['Origin']=origin
                conn.request('GET',path,headers=headers);reply=conn.getresponse();body=reply.read();code=reply.status;conn.close();return code,body
            try:
                code,body=get('/api/registry');self.assertEqual(code,200);self.assertEqual(len(json.loads(body)['projects']),8)
                self.assertEqual(get('/api/registry',host='evil.example')[0],403)
                self.assertEqual(get('/api/registry',origin='https://evil.example')[0],403)
                self.assertEqual(get('/config/projects.registry.json')[0],404)
                row=copy.deepcopy(self.data['projects'][0]);row.update(project_id='future-test',name='Future test',launch_id=None)
                self.data['projects'].append(row);catalogue.write_text(json.dumps(self.data))
                self.assertEqual(len(json.loads(get('/api/registry')[1])['projects']),9)
                self.assertNotIn('launch_id',json.dumps(r.public_export(self.data)))
                catalogue.write_text('invalid');self.assertFalse(json.loads(get('/api/registry')[1])['ok'])
                self.assertEqual(get('/api/status')[0],200)
            finally:httpd.shutdown();thread.join();httpd.server_close()
    def test_missing_app_does_not_disable_other_launcher(self):
        from test_ecosystem import EcosystemManagerTests
        from admin.ecosystem import EcosystemManager
        fixture=EcosystemManagerTests();fixture.setUp()
        try:
            data=json.loads(fixture.config.read_text())
            data['applications']['chest0-ai-studio']['root']=str(self.root/'missing')
            fixture.config.write_text(json.dumps(data))
            manager=EcosystemManager(fixture.config)
            with patch.object(manager,'_port_open',return_value=False):
                states={item['id']:item['state'] for item in manager.statuses()}
            self.assertEqual(states['chest0-ai-studio'],'configuration_absente')
            self.assertEqual(states['chest0-quiz-studio'],'arrêté')
            self.assertEqual(manager._application('chest0-quiz-studio').identifier,'chest0-quiz-studio')
        finally:fixture.tearDown()

    def test_public_assets_exclude_registry(self):
        self.assertIn('  - config',(ROOT/'_config.yml').read_text())
        self.assertIn('  - admin',(ROOT/'_config.yml').read_text())
        for file in ('sw.js','assets/js/app.js','assets/js/data-engine.js'):
            self.assertNotIn('projects.registry.json',(ROOT/file).read_text())
    def test_ui_renders_catalogue_with_safe_text(self):
        import subprocess
        result=subprocess.run(['node','-e',r'''
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('admin/static/admin.js','utf8');
const functions=source.slice(source.indexOf('function renderEcosystem('));
class Element {constructor(){this.children=[];this.textContent='';} append(...x){this.children.push(...x);} appendChild(x){this.append(x);} replaceChildren(){this.children=[];} addEventListener(){} }
const container=new Element();const ctx={document:{getElementById:()=>container,createElement:()=>new Element()},window:{addEventListener:()=>{},open:()=>{throw Error('No launch');}}};
vm.createContext(ctx);vm.runInContext(functions,ctx);
const registry=JSON.parse(fs.readFileSync('config/projects.registry.json','utf8'));registry.levels={A:'Référencée'};
registry.projects[0].name='<img onerror=bad>';registry.projects[0].local_status='natif';
ctx.renderEcosystem([],registry);assert.equal(container.children.length,8);assert.equal(container.children[0].children[0].textContent,'<img onerror=bad>');
ctx.renderEcosystem([{id:'chest0-social-studio',label:'Social',state:'arrêté',version:'1',port:8503,message:'Prêt',owned:false,url:'http://127.0.0.1:8503'}],registry);
assert.equal(container.children.length,8);const buttons=container.children[registry.projects.findIndex(p=>p.project_id==='chest0-social-studio')].children[4].children;assert.equal(buttons[0].disabled,false);assert.equal(buttons[2].disabled,true);
ctx.renderEcosystem([],null);assert(container.children[0].textContent.includes('indisponible'));
'''],cwd=ROOT,capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)

if __name__=='__main__':unittest.main()
