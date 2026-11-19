/* Static app shell only. Never cache API traffic, logins, or personal entries. */
const CACHE='pattern-trainer-v8-checkin-1';
const VERSION='8.0.0-checkin1';
const BASE=self.registration.scope;
const ASSETS=['./','index.html','styles.css?v='+VERSION,'calm.css?v='+VERSION,
 'checkin.js?v='+VERSION,'app.js?v='+VERSION,'calm-content.js?v='+VERSION,'calm-core.js?v='+VERSION,
 'calm-store.js?v='+VERSION,'calm.js?v='+VERSION,'manifest.json','icon.svg','calm-evidence.html'];
const urls=ASSETS.map(path=>new URL(path,BASE).href);
const allowed=new Set(urls);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(urls.map(url=>new Request(url,{cache:'reload'})));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('pattern-trainer-')&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
async function networkShell(request){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 const cache=await caches.open(CACHE);
 try{
  const response=await fetch(request,{signal:controller.signal,cache:'no-store'});
  if(response.ok){await cache.put(new URL('index.html',BASE).href,response.clone());return response;}
  return (await cache.match(new URL('index.html',BASE).href))||response;
 }catch{
  return (await cache.match(new URL('index.html',BASE).href))||new Response('Pattern Trainer is not cached yet. Open it online once.',{status:503,headers:{'Content-Type':'text/plain'}});
 }finally{clearTimeout(timer);}
}
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url),scope=new URL(BASE);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 if(url.pathname===new URL('version.json',BASE).pathname)return;
 // Only the app's root and index are navigation fallbacks. Do not mask missing files.
 if(request.mode==='navigate'&&(url.pathname===scope.pathname||url.pathname===new URL('index.html',BASE).pathname)){
  event.respondWith(networkShell(request));return;
 }
 if(!allowed.has(url.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),cached=await cache.match(request);
  if(cached)return cached;
  const response=await fetch(request,{cache:'reload'});
  if(response.ok)await cache.put(request,response.clone());
  return response;
 })());
});
