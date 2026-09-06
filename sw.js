// App version — bump this on every deployment to invalidate stale caches.
// Keep in sync with APP_VERSION in index.html.
const APP_VERSION = 'v2-20250906';
const CACHE_NAME = `kc-${APP_VERSION}`;

// Minimal app shell: HTML, manifest, icons, fonts, service worker itself.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

// Dynamic image cache: all educational images are cached on first request
// so offline works across the full curriculum without manually maintaining
// a fragile precache list.
const IMAGE_CACHE = `kc-images-${APP_VERSION}`;

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
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k))
      ))
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
      // Dynamically cache educational images so offline works across the full
      // curriculum without a brittle manual precache list.
      const url = new URL(event.request.url);
      if (url.pathname.startsWith('./images/')) {
        caches.open(IMAGE_CACHE).then((cache) => cache.put(event.request, network.clone()));
      } else {
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, network.clone()));
      }
    }
    return network;
  })());
});
