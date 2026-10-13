export const LIMITS = Object.freeze({files:2000, total:1024**3, each:50*1024**2});
export function validateSelection(files) {
  if (!files.length) throw new Error('Sélectionnez au moins un fichier.');
  if (files.length > LIMITS.files) throw new Error('Maximum 2 000 fichiers par sélection.');
  if (files.reduce((n,f)=>n+f.size,0) > LIMITS.total) throw new Error('Maximum 1 Gio par sélection.');
}
export async function fingerprint(file, subtle=globalThis.crypto.subtle) {
  if (file.size > LIMITS.each) throw new Error('Fichier supérieur à 50 Mio.');
  if (!file.size) throw new Error('Fichier vide.');
  const buffer = await file.arrayBuffer();
  const digest = await subtle.digest('SHA-256',buffer);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
export function groupExact(records) {
  const byHash=new Map();
  for (const r of records) {
    const key=`${r.size}:${r.sha256}`;
    if (!byHash.has(key)) byHash.set(key,[]);
    byHash.get(key).push(r);
  }
  return [...byHash.values()].filter(g=>g.length>1);
}
export function simulation(groups) {
  return {copies:groups.reduce((n,g)=>n+g.length-1,0),bytes:groups.reduce((n,g)=>n+(g.length-1)*g[0].size,0),performed:false};
}
