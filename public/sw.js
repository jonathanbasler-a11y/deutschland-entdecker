// Offline-Modus: mit Internet immer die neueste Version laden, ohne Internet aus dem Speicher.
const CACHE = "de-entdecker-v13";
const FILES = ["./", "index.html", "style.css", "logic.js", "rechnen-logic.js", "begleiter.js", "mapdata.js", "content.js", "fach-rechnen.js", "kompass-logic.js", "kompass-data.js", "kompass-text.js", "fach-kompass.js", "app.js", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      // höchstens 4 Sekunden auf das Netz warten, dann den Speicher nehmen
      const slow = new Promise((_, no) => setTimeout(() => no(new Error("langsam")), 4000));
      const r = await Promise.race([fetch(e.request, { cache: "no-cache" }), slow]);
      if (r && r.ok) c.put(e.request, r.clone());
      return r;
    } catch (err) {
      const hit = await c.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
