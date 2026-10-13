// Scope-specific shell cache; never cache selected photos or exported reports.
const PREFIX='chest0-photo-web-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+'s16-final-v1';
const ASSETS=['./','./index.html','./style.css','./app.js','./core.mjs','./worker.js','./manifest.webmanifest','./icon.svg','./icons/icon-192.png','./icons/icon-512.png','./product.html','./help.html'];
const urls=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
// No skipWaiting or clients.claim: an analysis keeps its original worker/shell.
// Keep the previous scope cache for deployment rollback; do not delete Hub caches.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>{
  const previous=keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE);
  return Promise.all(previous.slice(0,-1).map(k=>caches.delete(k)));
})));
self.addEventListener('fetch',event=>{if(event.request.method==='GET'&&urls.has(event.request.url)){
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request)).then(hit=>hit||fetch(event.request)));
}});
