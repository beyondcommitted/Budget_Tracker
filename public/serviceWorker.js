const FILES_TO_CACHE = [
  "/",
  "./index.html",
  "./db.js",
  "./styles.css",
  "./index.js",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  "./manifest.json",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Files were pre-cached successfully.");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const storedCaches = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheList) => {
        return cacheList.filter(
          (cacheItem) => !storedCaches.includes(cacheItem)
        );
      })
      .then((deleteCaches) => {
        return Promise.all(
          deleteCaches.map((deleteCaches) => {
            return caches.delete(deleteCaches);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(() => caches.match(event.request));
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        return response || fetch(event.request);
      });
    })
  );
});
