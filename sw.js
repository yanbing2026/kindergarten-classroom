const CACHE_NAME = 'kc-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './images/words/apple.png',
  './images/words/axe.png',
  './images/words/bat.png',
  './images/words/bed.png',
  './images/words/bee.png',
  './images/words/boat.png',
  './images/words/book.png',
  './images/words/bow.png',
  './images/words/bread.png',
  './images/words/cake.png',
  './images/words/cat.png',
  './images/words/chest.png',
  './images/words/cow.png',
  './images/words/cube.png',
  './images/words/dog.png',
  './images/words/egg.png',
  './images/words/fox.png',
  './images/words/gate.png',
  './images/words/gem.png',
  './images/words/gold.png',
  './images/words/iron.png',
  './images/words/log.png',
  './images/words/map.png',
  './images/words/mine.png',
  './images/words/pig.png',
  './images/words/shield.png',
  './images/words/slime.png',
  './images/words/sword.png',
  './images/words/torch.png',
  './images/words/web.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return fetch(event.request);
    if (event.request.method !== 'GET') return fetch(event.request);

    // Network-first for page navigations so HTML/level updates are always fresh.
    if (event.request.mode === 'navigate') {
      try {
        const network = await fetch(event.request);
        if (network && network.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, network.clone()));
        }
        return network;
      } catch (e) {
        return (await caches.match(event.request)) || (await caches.match('./')) || Response.error();
      }
    }

    // Cache-first for static assets, updating the cache in the background.
    const cached = await caches.match(event.request);
    if (cached) {
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
      }).catch(() => {});
      return cached;
    }
    const network = await fetch(event.request);
    if (network && network.status === 200) {
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, network.clone()));
    }
    return network;
  })());
});
