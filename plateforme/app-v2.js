"use strict";
(()=>{
 const $=id=>document.getElementById(id), KEY='chest0.hub.platform.v2.note', MAX=1024*1024;
 const status=(id,s)=>{$(id).textContent=s};
 const clean=s=>typeof s==='string'?s.trim():'';
 const allowedUrl=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)}catch{return false}};
 const validateRegistry=data=>{
  if(!data||data.schema_version!==1||!Array.isArray(data.projects)||data.projects.length>500)throw Error('Schéma de registre invalide');
  const ids=new Set();
  for(const p of data.projects){
   if(!p||!/^[-a-z0-9]{1,100}$/.test(p.project_id||'')||!clean(p.name)||clean(p.name).length>150||ids.has(p.project_id))throw Error('Identifiant ou nom de projet invalide ou en doublon');
   ids.add(p.project_id);
   if(p.public_links!==undefined&&(!Array.isArray(p.public_links)||p.public_links.length>20||!p.public_links.every(allowedUrl)))throw Error('Lien public non autorisé');
  }
  return data;
 };
 function download(name,content){const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
 async function registry(){const r=await fetch('../data/public/ecosystem.json',{cache:'no-store'});if(!r.ok)throw Error('Registre inaccessible');return validateRegistry(await r.json())}
 async function dashboard(){try{const d=await registry(),items=d.projects;const p=document.createElement('article'),q=document.createElement('article');p.textContent=`${items.length} applications référencées`;let fav=0;try{const local=JSON.parse(localStorage.getItem('chest0.hub.platform.v1')||'{}');fav=Array.isArray(local.favorites)?local.favorites.length:0}catch{}q.textContent=`${fav} favori(s) locaux`; $('dashboard').replaceChildren(p,q)}catch{status('dashboard','Catalogue indisponible : données non vérifiées.')}}
 try{$('note').value=localStorage.getItem(KEY)||''}catch{status('noteStatus','Stockage local indisponible.')}
 $('saveNote').addEventListener('click',()=>{try{localStorage.setItem(KEY,$('note').value.slice(0,5000));status('noteStatus','Note enregistrée uniquement dans ce navigateur.')}catch{status('noteStatus','Enregistrement impossible.')}});
 $('clearNote').addEventListener('click',()=>{if(!confirm('Effacer la note locale ?'))return;try{localStorage.removeItem(KEY);$('note').value='';status('noteStatus','Note effacée.')}catch{status('noteStatus','Effacement impossible.')}});
 $('loadRegistry').addEventListener('click',async()=>{try{$('registryEditor').value=JSON.stringify(await registry(),null,2);status('registryStatus','Registre public chargé dans l’éditeur local, sans modification du site.')}catch(e){status('registryStatus',e.message)}});
 function edited(){const t=$('registryEditor').value;if(new Blob([t]).size>MAX)throw Error('Registre trop volumineux');return validateRegistry(JSON.parse(t))}
 $('validateRegistry').addEventListener('click',()=>{try{const d=edited();status('registryStatus',`${d.projects.length} projets : structure valide. Aucune publication.`)}catch(e){status('registryStatus','Validation refusée : '+e.message)}});
 $('exportRegistry').addEventListener('click',()=>{try{download('chest0-registre-travail.json',JSON.stringify(edited(),null,2));status('registryStatus','Registre de travail exporté ; site inchangé.')}catch(e){status('registryStatus','Export refusé : '+e.message)}});
 $('exportContracts').addEventListener('click',async()=>{try{const d=await registry();download('chest0-contrats-integration.json',JSON.stringify({schema_version:1,mode:'lecture_seule',projects:d.projects.map(p=>({project_id:p.project_id,name:p.name,state:p.state||'non_renseigne',public_links:(p.public_links||[]).filter(allowedUrl)}))},null,2));status('contractStatus','Contrats exportés sans appel aux applications.')}catch(e){status('contractStatus','Export impossible : '+e.message)}});
 window.addEventListener('storage',e=>{if(e.key==='chest0.hub.platform.v1')dashboard()});
 dashboard();
})();
