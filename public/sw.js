const CACHE_NAME = "coreops-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Pre-caching core offline assets");
        // Use map/allSettled or catch on individual files to ensure install succeeds even if some assets are transient
        return Promise.allSettled(
          ASSETS_TO_CACHE.map((url) => {
            return cache.add(url).catch((err) => {
              console.warn(`[Service Worker] Failed to pre-cache asset: ${url}`, err);
            });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  // Only intercept GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Handle external API requests, hot module replacement websockets, etc.
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Handle external asset caching (images, fonts)
  if (url.origin !== self.location.origin) {
    if (event.request.destination === "image" || url.host.includes("googleapis") || url.host.includes("gstatic") || url.host.includes("unsplash")) {
      event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            }).catch(() => {
              return null; // Don't crash
            });
          });
        })
      );
    }
    return;
  }

  // For application assets (local origin)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // For navigation requests (loading index.html), do Network-First with Cache fallback
      if (event.request.mode === "navigate") {
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            return cache.match("/index.html");
          });
      }

      // For other local assets, use Stale-While-Revalidate
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            console.warn(`[Service Worker] Network fetch failed for local asset: ${event.request.url}`, err);
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
