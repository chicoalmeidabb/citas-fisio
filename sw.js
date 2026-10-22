/* Service worker: permite instalar la app y abrirla aunque falle la conexión.
   Los datos (hoja de Google) siempre se piden a internet; solo se guarda la propia aplicación. */
const VERSION = 'citas-fisio-v2';
const ARCHIVOS = ['./', 'index.html', 'piramidal.html', 'three.min.js', 'OrbitControls.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.all(ARCHIVOS.map(a => c.add(a).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;          // Apps Script, fuentes, etc.: sin tocar
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(r, copia)); }
        return res;
      })
      .catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
