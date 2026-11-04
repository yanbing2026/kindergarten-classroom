// App version — bump this whenever ANY precached resource changes (HTML,
// JS, CSS, question banks). Keep identical to APP_VERSION in index.html (v2-20261103-feedback).
const APP_VERSION = 'v2-20261103-feedback';
const CACHE_NAME = `kc-${APP_VERSION}`;

// Images have their own version so a code/content release does not force
// every tablet to download the 96-image curriculum again.
const IMAGE_CACHE_VERSION = 'v1';
const IMAGE_CACHE = `kc-images-${IMAGE_CACHE_VERSION}`;

// The shell must cover everything the first render needs, not just the HTML.
// `test_offline_shell.js` parses index.html and fails when a local script or
// stylesheet is missing here.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './shared/main.css',
  './shared/app.css',
  './shared/grade-page.js',
  './js/cloud-api.js',
  './js/data-layer.js',
  './js/skill-engine.js',
  './js/blipola-runtime.js',
  './data/kindergarten/core.js',
  './data/kindergarten/content.js',
  './data/grade-1/ela.js',
  './data/grade-1/math.js',
  './data/grade-1/science.js',
  './data/grade-1/social-studies.js',
  './data/grade-1/writing.js',
  './data/grade-1/extra.js',
  './data/grade-1/core.js',
  './data/grade-2/core.js',
  './data/grade-2/ela.js',
  './data/grade-2/math.js',
  './data/grade-2/science.js',
  './data/grade-2/social-studies.js',
  './data/grade-2/writing.js',
  './pre-k/index.html',
  './kindergarten/index.html',
  './grade-1/index.html',
  './grade-2/index.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

// Map a navigation URL to the cached document that should answer it. A single
// './' fallback is wrong for /grade-2/: the address bar keeps the subpath, so
// relative data/ and js/ URLs would resolve under /grade-2/ and 404 offline.
function shellPathFor(url) {
  const path = url.pathname.replace(/\/index\.html$/, '/');
  if (path.endsWith('/grade-2/')) return './grade-2/index.html';
  if (path.endsWith('/grade-1/')) return './grade-1/index.html';
  if (path.endsWith('/kindergarten/')) return './kindergarten/index.html';
  if (path.endsWith('/pre-k/')) return './pre-k/index.html';
  return './index.html';
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // addAll is all-or-nothing: one missing file would leave the PWA with no
    // offline shell at all. Add individually so a typo degrades to a partial
    // shell that can still be repaired on the next update.
    const results = await Promise.allSettled(APP_SHELL.map((path) => cache.add(path)));
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn('[sw] precache failed', APP_SHELL[index], result.reason);
      }
    });
    // Do not skipWaiting here: a new shell should wait for the update prompt
    // instead of swapping code under a child mid-answer. SKIP_WAITING is sent
    // by index.html when the grown-up taps "Update now".
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([CACHE_NAME, IMAGE_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const reqUrl = new URL(event.request.url);
  if (reqUrl.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    // Network-first for navigations so HTML updates are picked up promptly,
    // with a path-aware cached document when the network is unavailable.
    if (event.request.mode === 'navigate') {
      try {
        const network = await fetch(event.request);
        if (network && network.status === 200) {
          const copy = network.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return network;
      } catch (error) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const shell = await caches.match(shellPathFor(reqUrl));
        return shell || (await caches.match('./index.html')) || Response.error();
      }
    }

    // Cache-first for static assets, updating the cache in the background.
    const cached = await caches.match(event.request);
    if (cached) {
      fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          cachePutFor(reqUrl, event.request, response);
        }
      }).catch(() => {});
      return cached;
    }
    const network = await fetch(event.request);
    if (network && network.status === 200) cachePutFor(reqUrl, event.request, network.clone());
    return network;
  })());
});

function cachePutFor(reqUrl, request, response) {
  const name = reqUrl.pathname.includes('/images/') ? IMAGE_CACHE : CACHE_NAME;
  caches.open(name).then((cache) => cache.put(request, response)).catch(() => {});
}
