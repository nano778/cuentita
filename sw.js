// la cuentita: guarda una copia de la app para poder abrirla sin internet.
// Primero intenta la red (asi siempre ves la ultima version) y, si no hay conexion, usa la copia.
const CACHE = 'cuentita-v1';
const BASICOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICOS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const propio = u.origin === self.location.origin;
  const fuente = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!propio && !fuente) return;          // el servidor (script.google.com) no se toca
  e.respondWith(
    fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
