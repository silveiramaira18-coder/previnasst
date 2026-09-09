/* Previna SST — cache do app para uso em campo sem internet. */
const CACHE = "previna-sst-v1";
const ESSENCIAIS = ["/", "/manifest.json", "/favicon.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ESSENCIAIS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copia)).catch(() => {});
        return resp;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(req)) || (await cache.match("/")) || Response.error();
      }),
  );
});
