const CACHE = 'kenko-v1';
const ASSETS = [
  '/index.html',
  '/manifest.json'
];

// Install - cache core files
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, cache fallback
self.addEventListener('fetch', function(e){
  // Skip Firebase requests - always need network
  if(e.request.url.includes('firebase') ||
     e.request.url.includes('gstatic') ||
     e.request.url.includes('googleapis')){
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(function(res){
        // Update cache with fresh response
        const clone = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return res;
      })
      .catch(function(){
        // Offline fallback
        return caches.match(e.request);
      })
  );
});
