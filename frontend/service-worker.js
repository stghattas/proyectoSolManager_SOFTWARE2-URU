const CACHE_NAME = 'sol-manager-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/pos.html',
  '/css/styles.css',
  '/js/index.js',
  '/js/api.js',
  '/js/pos_main.js',
  '/js/modules/cajero.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Solo cacheamos peticiones GET (no la API del backend de modificaciones)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna del cache si existe, sino va a la red
      return response || fetch(event.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Si no es de la API, lo guardamos en cache (opcional, por ahora solo leemos el cache base)
          if (!event.request.url.includes('/api/')) {
             cache.put(event.request, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => {
      // Offline fallback
      if (event.request.headers.get('accept').includes('text/html')) {
        return caches.match('/index.html');
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
