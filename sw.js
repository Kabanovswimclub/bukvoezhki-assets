const CACHE='bukvoezhka-clay-v3';
const CORE=['./','./index.html','./style.css','./words.js','./app.js','./splash.js','./menu.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./assets/clay/meadow-bg.png','./assets/clay/story-card.png','./assets/clay/stork-nest.png','./assets/clay/stork-flying.png','./assets/clay/hedgehog-ball.png','./assets/clay/letter-a.png','./assets/clay/letter-i.png','./assets/clay/letter-s.png','./assets/clay/letter-t.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||req.headers.has('range')) return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  const isCode=/\.(?:html|css|js|webmanifest)$/.test(url.pathname)||url.pathname.endsWith('/');
  if(isCode){
    event.respondWith(fetch(req).then(response=>{
      if(response.ok){ const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(req,copy)); }
      return response;
    }).catch(()=>caches.match(req)));
  } else {
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
      if(response.ok){ const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(req,copy)); }
      return response;
    })));
  }
});
