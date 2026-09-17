/* Service Worker: die Seite offline verfuegbar halten.
   Zuerst aus dem Zwischenspeicher ausliefern, im Hintergrund auffrischen. */

/* Der Name muss sich bei jedem Umbau aendern - beim Wechsel wirft
   "activate" alle aelteren Zwischenspeicher weg. Sonst wuerden geloeschte
   Dateien noch wochenlang vom Handy ausgeliefert. */
const CACHE = "arbeitszeit-v4";

const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => {
      const fresh = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit || caches.match("index.html"));
      return hit || fresh;
    })
  );
});
