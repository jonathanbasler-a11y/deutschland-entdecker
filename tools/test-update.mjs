// Update auf dem iPad: Die alte Version ist im Speicher, die neue wird veröffentlicht, danach ohne Internet.
// Aufruf: node tools/test-update.mjs <Ordner mit der alten public/-Version>
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const oldRoot = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !fs.existsSync(path.join(oldRoot, "index.html"))) { console.log("Aufruf: node tools/test-update.mjs <alte public/-Version>"); process.exit(2); }
const newRoot = path.resolve("public");
let root = oldRoot;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const f = path.join(root, q.url === "/" ? "index.html" : q.url.split("?")[0]);
  fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { "content-type": types[path.extname(f)] || "text/plain" }), r.end(d))));
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;
let fails = 0;
const check = (c, m) => { if (!c) { fails++; console.log("FAIL", m); } else console.log("ok  ", m); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));

// 1) alte Version laden und etwas Fortschritt erzeugen
await p.goto(url);
await p.evaluate(() => navigator.serviceWorker.ready);
await p.click('[data-act="skipname"]').catch(() => {});
await p.evaluate(() => { const k = "deutschland-entdecker-v1", s = JSON.parse(localStorage.getItem(k) || "{}"); s.xp = 777; s.name = "Max"; s.askedName = true; localStorage.setItem(k, JSON.stringify(s)); });
const oldCache = await p.evaluate(async () => (await caches.keys()).join(","));
check(!(await p.evaluate(() => !!window.DEBegleiter)), "alte Version hat noch keinen Hund (Ausgangslage) [" + oldCache + "]");

// 2) neue Version ist veröffentlicht: mit Internet neu laden
root = newRoot;
await p.reload();
await p.waitForTimeout(1500);
await p.reload();
await p.waitForSelector(".top");
check(await p.evaluate(() => !!window.DEBegleiter && !!window.DERechnen), "mit Internet: neue Version wird geladen (Hund und Kopfrechnen da)");
for (let k = 0; k < 20 && (await p.evaluate(async () => (await caches.keys()).length)) !== 1; k++) await p.waitForTimeout(500);
const keys = await p.evaluate(async () => (await caches.keys()));
check(keys.length === 1, "alter Speicher wurde gelöscht: " + keys.join(","));
check((await p.evaluate(() => window.__DE.S.xp)) === 777 && (await p.textContent(".hello")).includes("Max"), "Spielstand bleibt (777 Punkte, Max)");

// 3) ohne Internet
await ctx.setOffline(true);
await p.reload();
const ok = await p.waitForSelector(".top", { timeout: 8000 }).then(() => true, () => false);
check(ok && (await p.evaluate(() => !!window.DEBegleiter && !!window.DERechnen)), "offline: neue Version startet aus dem Speicher");
if (ok) {
  await p.click('[data-act="subject"][data-v="math"]');
  check(!!(await p.$(".mhome")), "offline: Kopfrechnen öffnet sich");
  await p.tap('[data-act="m-level"][data-v="k-mal"]');
  check(!!(await p.waitForSelector(".mtask", { timeout: 3000 }).catch(() => null)), "offline: Aufgabe erscheint");
  await p.click('[data-act="m-quit"]');
  await p.click('[data-act="pet"]');
  check(!!(await p.$(".petview")), "offline: Mein Hund öffnet sich");
}
// 4) alle Dateien der neuen Version stehen im Speicher
await ctx.setOffline(false);
const files = fs.readdirSync(newRoot).filter((f) => /\.(js|css|html|webmanifest)$/.test(f) && f !== "sw.js");
const cached = await p.evaluate(async () => { const c = await caches.open((await caches.keys())[0]); return (await c.keys()).map((r) => new URL(r.url).pathname.split("/").pop() || "index.html"); });
const missing = files.filter((f) => !cached.includes(f));
check(missing.length === 0, "alle Dateien im Offline-Speicher" + (missing.length ? ", es fehlen: " + missing.join(", ") : ""));
check(errs.length === 0, "keine Fehler " + errs.join(" | "));
await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "Update-Test ok");
process.exit(fails ? 1 : 0);
