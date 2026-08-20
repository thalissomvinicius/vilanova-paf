const CACHE_NAME = "paf-shell-v1";
const APP_SHELL = [
  "/",
  "/admin",
  "/tecnico",
  "/produtor",
  "/manifest.webmanifest",
  "/manifest-tecnico.webmanifest",
  "/manifest-produtor.webmanifest",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/paf-app-192.png",
  "/paf-app-512.png",
  "/brand/logo-vilanova.png",
  "/brand/paf-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/admin")))
  );
});
