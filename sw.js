
var staticCacheName = 'mws-restaurant-cache-v';
var randomNumber = Math.floor(Math.random() * 10000);
staticCacheName += randomNumber;


self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
    return cache.addAll([
      "/",
      "index.html",
      "restaurant.html",
      "/css/main.css",
      "/css/responsive.css",
      "/js/dbhelper.js",
      "/js/main.js",
      "/js/restaurant_info.js",
      "/img/*",
      "/js/idb.js",
      "/js/register.js"
    ])
    .catch(error => {
    });
  }));
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-restaurant-') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(staticCacheName).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
