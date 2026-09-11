const CACHE='walsall-v7';
const CORE=['./','./index.html','./styles.css?v=4','./app.js?v=7','./manifest.webmanifest?v=5','./icon.svg?v=4'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith((async()=>{const cached=await caches.match(event.request);if(cached)return cached;try{const response=await fetch(event.request);if(response&&response.ok){const c=await caches.open(CACHE);c.put(event.request,response.clone()).catch(()=>{});}return response;}catch(e){return cached||new Response('',{status:503});}})())});
