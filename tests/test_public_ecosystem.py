import copy,json,hashlib,subprocess,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from admin import registry
from scripts import export_public_projects as export
ROOT=Path(__file__).resolve().parents[1]

class PublicEcosystemTests(unittest.TestCase):
    def test_explicit_export_is_current_and_deterministic(self):
        self.assertTrue(export.generate(ROOT))
        self.assertEqual(export.encoded(ROOT),export.encoded(ROOT))
        rows=json.loads(export.encoded(ROOT))['projects']
        self.assertEqual({p['project_id'] for p in rows},{'chest0-photo-cleaner', 'chest0-quiz-studio', 'chest0-hub', 'chest0-ai-studio', 'chest0-market-intelligence', 'chest0-social-studio'})
        for row in rows:self.assertEqual(set(row),set(registry.PUBLIC_KEYS))
        for word in ('/Users/','launch_id','stable_commit','repository','notes','chest0-cloud'):
            self.assertNotIn(word,export.encoded(ROOT).decode())
    def test_six_projects_order_and_confirmed_descriptions(self):
        rows=json.loads(export.encoded(ROOT))['projects']
        self.assertEqual([p['project_id'] for p in rows],['chest0-hub','chest0-ai-studio','chest0-quiz-studio','chest0-social-studio','chest0-photo-cleaner','chest0-market-intelligence'])
        social,market=rows[3],rows[5]
        self.assertEqual(social['state'],'stable');self.assertEqual(social['platforms'],['macOS local'])
        self.assertEqual(market['state'],'developpement');self.assertEqual(market['platforms'],[])
        self.assertIn('Périmètre visé',market['description']);self.assertIn('sans envoi d’ordres financiers réels',market['description'])
        self.assertEqual(social['public_links'],[]);self.assertEqual(market['public_links'],[])
        self.assertNotIn('mes-demarches-de-vie',[p['project_id'] for p in rows])
        self.assertNotIn('chest0-cloud',[p['project_id'] for p in rows])

    def test_development_and_future_platforms(self):
        row=next(p for p in json.loads(export.encoded(ROOT))['projects'] if p['project_id']=='chest0-photo-cleaner')
        self.assertEqual(row['state'],'developpement');self.assertEqual(row['public_links'],[])
        self.assertEqual(row['platforms'],['macOS prévu','Windows prévu','Android ultérieur','Web/PWA à étudier'])
        self.assertEqual(row['commercial_status'],'commercialisation_prevue')
    def test_false_visibility_excludes_previously_public_project(self):
        data=registry.load(ROOT/'config/projects.registry.json');data['projects'][0]['public_visible']=False
        self.assertNotIn('chest0-hub',{p['project_id'] for p in registry.public_export(data)['projects']})
    def test_private_cloud_cannot_be_exported(self):
        data=registry.load(ROOT/'config/projects.registry.json')
        row=next(p for p in data['projects'] if p['project_id']=='chest0-cloud');row['public_visible']=True
        with self.assertRaises(registry.RegistryError):registry.public_export(data)
    def test_atomic_export_preserves_editorial_and_rejects_symlink(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp).resolve();(root/'data').mkdir();(root/'config').mkdir()
            (root/'config/projects.registry.json').write_bytes((ROOT/'config/projects.registry.json').read_bytes())
            editorial=root/'data/projects.json';editorial.write_text('Preserved editorial')
            self.assertFalse(export.generate(root));export.generate(root,write=True)
            self.assertEqual(editorial.read_text(),'Preserved editorial')
            path=root/'data/public/ecosystem.json';before=path.read_bytes()
            with patch.object(export.os,'replace',side_effect=OSError('simulated')):
                with self.assertRaises(OSError):export.generate(root,write=True)
            self.assertEqual(path.read_bytes(),before)
            path.unlink();path.symlink_to(editorial)
            with self.assertRaises(registry.RegistryError):export.generate(root,write=True)
            self.assertEqual(editorial.read_text(),'Preserved editorial')
    def test_source_edit_does_not_update_export_silently(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp).resolve();(root/'data').mkdir();(root/'config').mkdir()
            source=root/'config/projects.registry.json';source.write_bytes((ROOT/'config/projects.registry.json').read_bytes())
            export.generate(root,write=True);dest=root/'data/public/ecosystem.json';before=dest.read_bytes()
            data=json.loads(source.read_text());data['projects'][0]['name']='Changed';source.write_text(json.dumps(data))
            self.assertFalse(export.generate(root));self.assertEqual(dest.read_bytes(),before)
    def test_browser_renders_safely_and_rejects_invalid_data(self):
        js=r'''
const fs=require('fs'),vm=require('vm'),assert=require('assert');
class E {constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.textContent='';} append(...x){this.children.push(...x);} appendChild(x){this.append(x);} replaceChildren(){this.children=[];} setAttribute(){} }
const container=new E('div');const ctx={URL,console,window:{location:{pathname:'/pages/projets.html'}},document:{readyState:'loading',addEventListener(){},getElementById:()=>container,createElement:t=>new E(t)}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/js/data-engine.js','utf8'),ctx);
const engine=ctx.window.Chest0Data;const data=JSON.parse(fs.readFileSync('data/public/ecosystem.json','utf8'));
const editorial=JSON.parse(fs.readFileSync('data/projects.json','utf8'));
engine.loadJson=async name=>name==='projects.json'?editorial:data;
(async()=>{
 await engine.renderProjects('grid');assert.equal(container.children.length,6);
 for(const id of ['chest0-social-studio','chest0-market-intelligence']){const card=container.children.find(e=>e.dataset.contentId===id);assert(card);assert(!card.children.some(e=>e.tag==='a'));}
 const photo=container.children.find(e=>e.dataset.contentId==='chest0-photo-cleaner');assert(photo);assert(!photo.children.some(e=>e.tag==='a'));
 const hub=container.children.find(e=>e.dataset.contentId==='chest0-hub');assert(hub.children.some(e=>e.tag==='details'));assert(hub.children.some(e=>e.tag==='a'));
 data.projects[3].description='<img src=x onerror=bad>';data.projects[5].description='<script>bad</script>';await engine.renderProjects('grid');assert.equal(container.children[3].children[3].textContent,'<img src=x onerror=bad>');assert.equal(container.children[5].children[3].textContent,'<script>bad</script>');
 data.projects[0].name='<img src=x onerror=bad>';await engine.renderProjects('grid');assert.equal(container.children[0].children[1].textContent,'<img src=x onerror=bad>');
 for (const mutation of [d=>d.schema_version=9,d=>d.projects[0].notes='private',d=>d.projects[0].state='prive',d=>d.projects[0].public_links=['javascript:bad'],d=>d.projects[0].platforms='invalid',d=>d.projects.push(d.projects[0])]){
  const d=structuredClone(data);mutation(d);assert.throws(()=>engine.publicProjects(d));
 }
 engine.loadJson=async()=>{throw Error('offline without cache');};await engine.renderProjects('grid');assert(container.textContent.includes('indisponible'));
})().catch(e=>{console.error(e);process.exitCode=1;});
'''
        run=subprocess.run(['node','-e',js],cwd=ROOT,capture_output=True,text=True)
        self.assertEqual(run.returncode,0,run.stderr)
    def test_public_export_precached_and_offline_readable(self):
        script=r"""
const fs=require('fs'),vm=require('vm'),assert=require('assert');const handlers={};let shell=[];
const offline={json:async()=>JSON.parse(fs.readFileSync('data/public/ecosystem.json','utf8'))};
const ctx={URL,self:{location:{origin:'https://chest0.fr'},addEventListener:(n,fn)=>handlers[n]=fn,skipWaiting(){},clients:{claim(){}}},
 caches:{open:async()=>({addAll:async a=>{shell=a;}}),match:async request=>request.url.endsWith('/data/public/ecosystem.json')?offline:undefined},fetch:async()=>{throw Error('offline');}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
(async()=>{let installed;handlers.install({waitUntil:p=>installed=p});await installed;assert(shell.includes('./data/public/ecosystem.json'));
 let response;handlers.fetch({request:{method:'GET',url:'https://chest0.fr/data/public/ecosystem.json'},respondWith:p=>response=p});
 assert.equal((await (await response).json()).projects.length,6);assert(shell.every(p=>!p.includes('config/')&&!p.includes('admin/')));
})().catch(e=>{console.error(e);process.exitCode=1;});
"""
        run=subprocess.run(['node','-e',script],cwd=ROOT,capture_output=True,text=True)
        self.assertEqual(run.returncode,0,run.stderr)

    def test_published_boundaries_and_pwa(self):
        config=(ROOT/'_config.yml').read_text()
        for name in ('admin','config','scripts','tests','backups'):self.assertIn('  - '+name,config)
        sw=(ROOT/'sw.js').read_text();self.assertIn('./data/public/ecosystem.json',sw)
        for forbidden in ('projects.registry.json','ecosystem.local.json'):
            self.assertNotIn(forbidden,sw);self.assertNotIn(forbidden,(ROOT/'assets/js/data-engine.js').read_text())
        html=(ROOT/'pages/projets.html').read_text();self.assertIn('aria-live="polite"',html);self.assertIn('<noscript>',html)
        css=(ROOT/'assets/css/style.css').read_text();self.assertIn('.project-history summary:focus-visible',css)

if __name__=='__main__':unittest.main()
