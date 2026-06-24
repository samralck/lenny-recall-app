const CACHE_NAME = "lenny-recall-shell-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./css/styles.css",
  "./js/app.js",
  "./js/firebase-config.js",
  "./js/firebase-service.js",
  "./js/program-data.js",
  "./js/render-guide.js",
  "./js/render-plan.js",
  "./js/render-today.js",
  "./js/storage-service.js",
  "./js/sync-service.js",
  "./js/utils.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => cached))
  );
});
