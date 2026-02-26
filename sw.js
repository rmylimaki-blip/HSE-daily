const CACHE_NAME = "hse-daily-pwa-v2";
const PRECACHE_URLS = [
  "/HSE-daily/",
  "/HSE-daily/index.html",
  "/HSE-daily/manifest.json",
  "/HSE-daily/icons/icon-192.png",
  "/HSE-daily/icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put("/HSE-daily/index.html", fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match("/HSE-daily/index.html")) || (await cache.match("/HSE-daily/")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (req.method === "GET" && fresh && fresh.status === 200) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch {
      return cached || Response.error();
    }
  })());
});
