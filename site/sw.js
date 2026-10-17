// Offline support: cache the page and its assets; scripts are always fetched fresh when online.
const CACHE = 'unfollowers-v6';
const ASSETS = ['/', '/index.html', '/img/peeps.webp', '/img/resumen.webp', '/img/icon-192.png?v=2', '/img/favicon-32.png?v=2', '/manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const fresh = /\.(js|txt|webmanifest)$/.test(url.pathname) || e.request.mode === 'navigate';
  if (fresh) {
    // network first, cache as fallback
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('/'))));
  } else {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
