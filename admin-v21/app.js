'use strict';
(()=>{
 const token=new URLSearchParams(location.hash.slice(1)).get('token');
 history.replaceState(null,'',location.pathname);
 const $=id=>document.getElementById(id);
 const log=s=>{$('log').textContent=new Date().toLocaleTimeString('fr-FR')+' — '+s+'\n'+$('log').textContent};
 async function refresh(){
  $('status').textContent='Contrôle en cours…';
  try{
   const r=await fetch('/api/status',{headers:{'X-Chest0-Token':token||''},cache:'no-store'});
   if(!r.ok)throw Error('Accès au service refusé');
   const data=await r.json();$('count').textContent=String(data.applications.length);
   $('apps').replaceChildren();
   for(const app of data.applications){
    const box=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p');
    h.textContent=app.name;p.textContent=app.state+' · '+app.path;box.append(h,p);
    if(app.launchable){const b=document.createElement('button');b.textContent='Ouvrir';b.addEventListener('click',()=>launch(app.name));box.append(b)}
    $('apps').append(box);
   }
   $('status').textContent=data.applications.length+' application(s) repérée(s) · état fonctionnel non vérifié';log('Inventaire local actualisé');
  }catch(e){$('status').textContent='Contrôle impossible : '+e.message;log('Erreur : '+e.message)}
 }
 async function launch(name){
  if(!confirm('Demander à macOS d’ouvrir '+name+' ?'))return;
  try{const r=await fetch('/api/launch',{method:'POST',headers:{'Content-Type':'application/json','X-Chest0-Token':token||''},body:JSON.stringify({name})});const d=await r.json();if(!r.ok)throw Error(d.error);log('Ouverture demandée : '+name)}catch(e){log('Ouverture refusée : '+e.message)}
 }
 $('refresh').addEventListener('click',refresh);refresh();
})();
