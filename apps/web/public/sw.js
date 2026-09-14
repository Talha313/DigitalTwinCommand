// Bump this version when changing the offline page or icons.
const CACHE = "dtcc-pwa-v1";
const ASSETS = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  // Let updates wait until existing windows close. Never reload an active call.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("dtcc-pwa-") && key !== CACHE)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // No API responses, credentials, transcripts, or call actions in Cache Storage.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ws/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match("/offline.html")) || Response.error();
    }));
  } else if (ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE).then(async (cache) =>
      (await cache.match(request)) || fetch(request)));
  }
});
