const CACHE = "game-rules-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./rules.html",
  "./rule.html",
  "./favorites.html",
  "./styles.css",
  "./app.js",
  "./rules.json",
  "./check_categories.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
