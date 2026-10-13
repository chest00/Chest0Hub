import {validateSelection,simulation} from './core.mjs';
const $=id=>document.getElementById(id);
let files=[],worker=null,result=null,previews=[];
const supported=globalThis.isSecureContext&&!!globalThis.crypto?.subtle&&!!globalThis.Worker;
const folderSupported='webkitdirectory' in $('folder');
const format=n=>{const unit=n<1024?'o':n<1024**2?'Kio':'Mio';const value=unit==='o'?n:unit==='Kio'?n/1024:n/1024**2;return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(value)+' '+unit;};
function revoke(){for(const url of previews) URL.revokeObjectURL(url); previews=[];}
function clearResults(){revoke();result=null;$('groups').replaceChildren();$('errors').replaceChildren();$('export').disabled=true;$('simulation').hidden=true;$('summary').textContent='Lancez une analyse pour comparer les empreintes des fichiers.';}
function busy(value){$('cancel').disabled=!value;$('analyze').disabled=value||!files.length||!supported;$('files').disabled=value||!supported;$('folder').disabled=value||!supported||!folderSupported;}
function cancel(){if(worker){worker.terminate();worker=null;}busy(false);}
function select(event){cancel();clearResults();files=Array.from(event.target.files);$('progress').value=0;try{validateSelection(files);$('selection').textContent=`${files.length} fichier(s) sélectionné(s) · ${format(files.reduce((n,f)=>n+f.size,0))}`;$('status').textContent='Prêt à analyser.';}catch(error){files=[];$('selection').textContent=error.message;}busy(false);}
$('files').addEventListener('change',select);$('folder').addEventListener('change',select);
$('cancel').onclick=()=>{cancel();clearResults();$('status').textContent='Analyse annulée. Aucun résultat partiel conservé. Aucun fichier modifié.';};
$('clear').onclick=()=>{cancel();clearResults();files=[];$('files').value='';$('folder').value='';$('selection').textContent='Aucun fichier sélectionné.';$('status').textContent='Session effacée. Aucun fichier modifié.';$('progress').value=0;busy(false);};
function show(data){
  result=data;
  $('summary').textContent=`${data.groups.length} groupe(s) de doublons exacts · ${data.records.length} fichier(s) analysé(s) · ${data.errors.length} non analysé(s).`;
  for(const e of data.errors){const li=document.createElement('li');li.textContent=`${e.name} : ${e.error}`;$('errors').append(li);}
  for(const [index,group] of data.groups.entries()){
    const section=document.createElement('article');section.className='group';
    const heading=document.createElement('h3');heading.textContent=`Groupe ${index+1} · ${group.length} fichiers identiques`;section.append(heading);
    const hash=document.createElement('p');hash.className='hash';hash.textContent=`SHA-256 · ${group[0].sha256}`;section.append(hash);
    const list=document.createElement('ul');list.className='files-list';
    for(const r of group){const li=document.createElement('li');const details=document.createElement('div');details.className='file-details';details.textContent=r.name;const small=document.createElement('small');small.textContent=format(r.size)+' · lecture seule';details.append(small);li.append(details);
      const button=document.createElement('button');button.className='secondary';button.textContent='Aperçu';button.onclick=()=>{for(const old of document.querySelectorAll('.preview')){old.parentElement.querySelector('button').disabled=false;old.remove();}revoke();button.disabled=true;const img=document.createElement('img');img.className='preview';img.alt=`Aperçu de ${r.name}`;const url=URL.createObjectURL(files[r.id]);previews.push(url);img.onload=()=>{URL.revokeObjectURL(url);previews=previews.filter(value=>value!==url);};img.onerror=()=>{img.remove();button.textContent='Aperçu indisponible';URL.revokeObjectURL(url);previews=previews.filter(value=>value!==url);};img.src=url;li.prepend(img);};li.append(button);list.append(li);}
    section.append(list);$('groups').append(section);
  }
  const plan=simulation(data.groups);$('simulation').hidden=false;$('simulation').textContent=`Simulation uniquement : ${plan.copies} copie(s) identique(s), ${format(plan.bytes)} potentiellement redondants. Aucun fichier déplacé ou supprimé. Vérifiez les fichiers avant toute action manuelle.`;
  $('export').disabled=false;
}
$('analyze').onclick=()=>{clearResults();busy(true);$('progress').value=0;$('status').textContent='Analyse locale en cours…';
  try{worker=new Worker('./worker.js',{type:'module'});worker.onmessage=({data})=>{if(data.type==='progress'){$('progress').max=data.total;$('progress').value=data.done;$('status').textContent=`Analyse locale : ${data.done} / ${data.total}`;}else if(data.type==='done'){cancel();show(data);$('status').textContent='Analyse terminée. Aucun fichier modifié.';$('summary').focus();}else{cancel();$('status').textContent=data.error;}};worker.onerror=()=>{cancel();clearResults();$('status').textContent='Erreur du worker. Aucun fichier modifié. Réessayez avec une sélection plus petite.';};worker.postMessage({files});}catch(error){cancel();clearResults();$('status').textContent=error.message;}};
$('export').onclick=()=>{if(!result)return;const report={version:1,mode:'READ_ONLY',algorithm:'SHA-256',groups:result.groups,errors:result.errors,simulation:simulation(result.groups)};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='chest0-doublons.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
if(!('webkitdirectory' in $('folder'))){$('folder').disabled=true;$('folder').parentElement.title='Sélection de dossiers indisponible ; utilisez la sélection de fichiers.';}
if(!globalThis.isSecureContext||!globalThis.crypto?.subtle||!globalThis.Worker){$('files').disabled=true;$('folder').disabled=true;$('status').textContent='Navigateur incompatible : HTTPS ou localhost, Web Crypto et Workers requis.';}
if('serviceWorker' in navigator && globalThis.isSecureContext){navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(()=>navigator.serviceWorker.ready).then(()=>{$('offline').textContent='Interface disponible hors ligne après cette première ouverture. Aucune photo mise en cache.';}).catch(()=>{$('offline').textContent='Mode hors ligne indisponible dans ce navigateur.';});}else{$('offline').textContent='Mode hors ligne indisponible.';}
window.addEventListener('pagehide',()=>{cancel();revoke();});
