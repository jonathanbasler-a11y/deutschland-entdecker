// Geräte-Test: Layout und Bedienung per Fingertipp auf mehreren iPad-Größen, in Chromium und WebKit.
// Aufruf: node tools/e2e-devices.mjs [chromium|webkit] [Ordner für Screenshots]
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const pw = createRequire(import.meta.url)("playwright");
const engine = process.argv[2] || "chromium";
const shots = process.argv[3] || null;
const root = path.resolve("public");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const f = path.join(root, q.url === "/" ? "index.html" : q.url.split("?")[0]);
  fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { "content-type": types[path.extname(f)] || "text/plain" }), r.end(d))));
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;

const DEVICES = [
  ["iPad Air quer", 1180, 820], ["iPad Air hoch", 820, 1180],
  ["iPad 9 quer", 1080, 810], ["iPad 9 hoch", 810, 1080],
  ["iPad mini quer", 1133, 744], ["iPad mini hoch", 744, 1133],
  ["iPad Pro 13 quer", 1366, 1024], ["Handy", 390, 844],
];
let fails = 0;
const check = (c, m) => { if (!c) { fails++; console.log("  FAIL", m); } };
const b = await pw[engine].launch();

for (const [name, w, h] of DEVICES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, deviceScaleFactor: 1, serviceWorkers: "block" });
  await ctx.addInitScript(() => { window.__DE_TEST = { blitzMs: 2500 }; });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.goto(url);
  await p.click('[data-act="skipname"]');
  const slug = name.replace(/\s+/g, "-");
  const noHScroll = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  const inView = (sel) => p.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1; });
  const anchor = (id) => p.evaluate((id) => {
    const svg = document.querySelector(".stage .map");
    const it = window.__DE.ITEMS.find((i) => i.id === id);
    let x, y;
    const hit = svg.querySelector(`.hit[data-id="${id}"]:not(.lakehit):not(.dot)`);
    if (hit) { const pt = hit.getPointAtLength(hit.getTotalLength() / 2); x = pt.x; y = pt.y; } else [x, y] = it.label;
    const q = svg.createSVGPoint(); q.x = x; q.y = y;
    const r = q.matrixTransform(svg.getScreenCTM());
    return [r.x, r.y];
  }, id);
  const byName = (n) => p.evaluate((n) => window.__DE.ITEMS.find((i) => i.name === n).id, n);

  check(await noHScroll(), `${name}: Startseite scrollt seitlich`);
  if (shots) await p.screenshot({ path: path.join(shots, `${engine}-${slug}-home.png`) });

  // Finden per Fingertipp: Frage und ganze Karte ohne Scrollen sichtbar, Ziel wird getroffen
  await p.click('[data-act="topic"][data-v="all"]');
  await p.click('[data-act="mode"][data-v="tap"]');
  if (w >= 700) {
    check(await inView(".big"), `${name}: Name der Aufgabe nicht sichtbar`);
    check(await inView(".stage .mapwrap"), `${name}: Karte nicht ganz sichtbar`);
  }
  check(await noHScroll(), `${name}: Finden scrollt seitlich`);
  for (let i = 0; i < 3; i++) {
    const nm = await p.textContent(".big");
    const [x, y] = await anchor(await byName(nm));
    await p.touchscreen.tap(x, y);
    const ok = await p.waitForSelector(".feedback.ok", { timeout: 1500 }).then(() => true, () => false);
    check(ok, `${name}: Fingertipp auf ${nm} nicht erkannt`);
    await p.waitForSelector(".feedback.ok", { state: "detached", timeout: 3000 }).catch(() => {});
  }
  if (shots) await p.screenshot({ path: path.join(shots, `${engine}-${slug}-tap.png`) });
  await p.click('[data-act="quit"]');

  // Kleine Ziele: Tipp knapp neben Bremen/Hamburg/Berlin zählt
  await p.click('[data-act="topic"][data-v="states"]');
  await p.click('[data-act="mode"][data-v="tap"]');
  const near = await p.evaluate(() => {
    const svg = document.querySelector(".stage .map");
    const out = {};
    for (const id of ["s_hb", "s_hh", "s_be"]) {
      const it = window.__DE.ITEMS.find((i) => i.id === id);
      const q = svg.createSVGPoint(); q.x = it.label[0] + 20; q.y = it.label[1] - 4;
      const r = q.matrixTransform(svg.getScreenCTM());
      const top = [...document.elementsFromPoint(r.x, r.y)].find((e) => e.dataset && e.dataset.id && e.dataset.id.startsWith("s_"));
      out[id] = top && top.dataset.id;
    }
    return out;
  });
  check(near.s_hb === "s_hb" && near.s_hh === "s_hh" && near.s_be === "s_be", `${name}: kleine Ziele ${JSON.stringify(near)}`);
  await p.click('[data-act="quit"]');

  // Schreiben mit simulierter Tastatur: Karte passt in den sichtbaren Bereich, Feld bleibt erhalten
  await p.click('[data-act="mode"][data-v="write"]');
  const kb = Math.round(h * 0.45);
  await p.evaluate((v) => { document.documentElement.style.setProperty("--vvh", v + "px"); window.__DE_fit(); }, h - kb);
  await p.waitForTimeout(100);
  if (w >= 700) {
    const box = await p.$eval(".stage .mapwrap", (e) => e.getBoundingClientRect().bottom);
    check(box <= h - kb + 2, `${name}: Karte reicht unter die Tastatur (${Math.round(box)} > ${h - kb})`);
    check(await p.$eval("#wi", (e) => e.getBoundingClientRect().bottom <= innerHeight * 0.55 + 1 || e.getBoundingClientRect().bottom <= innerHeight - innerHeight * 0.45), `${name}: Eingabefeld unter der Tastatur`);
  }
  if (shots) await p.screenshot({ path: path.join(shots, `${engine}-${slug}-write-kb.png`) });
  const inp1 = await p.$("#wi");
  const d = await p.getAttribute(".hl-poly, .hl-line", "d");
  const sol = await p.evaluate((d) => window.__DE.ITEMS.find((i) => i.d === d).name, d);
  await p.fill("#wi", sol);
  await p.press("#wi", "Enter");
  await p.waitForSelector(".feedback.ok", { timeout: 1500 });
  await p.waitForSelector(".feedback.ok", { state: "detached", timeout: 4000 });
  check(await p.evaluate((e) => e === document.querySelector("#wi"), inp1), `${name}: Eingabefeld wurde ersetzt (Tastatur schließt)`);
  check((await p.inputValue("#wi")) === "", `${name}: Feld nicht geleert`);
  // falsch, falsch, dann Enter = Weiter
  await p.fill("#wi", "qqq"); await p.press("#wi", "Enter");
  await p.fill("#wi", "qqq"); await p.press("#wi", "Enter");
  check((await p.textContent("#ws")) === "Weiter", `${name}: kein Weiter nach zwei Fehlern`);
  const before = await p.textContent("#cnt");
  await p.press("#wi", "Enter");
  check((await p.textContent("#cnt")) !== before, `${name}: Enter führt nicht weiter`);
  await p.evaluate(() => { document.documentElement.style.removeProperty("--vvh"); window.__DE_fit(); });
  check(await p.$eval(".stage .mapwrap", (e) => e.style.height === "" || document.querySelector(".stage.writing")), `${name}: Kartengröße nicht zurückgesetzt`);
  await p.click('[data-act="quit"]');

  // Blitz bis zum Ende spielen (verkürzt): kein Absturz am Rundenende
  await p.click('[data-act="mode"][data-v="blitz"]');
  for (let i = 0; i < 30 && !(await p.$(".results")); i++) {
    // nicht warten: die Runde kann jederzeit enden
    const nm = await p.$eval(".big", (e) => e.textContent).catch(() => null);
    if (!nm) break;
    const [x, y] = await anchor(await byName(nm)).catch(() => [0, 0]);
    await p.touchscreen.tap(x, y).catch(() => {});
    await p.waitForTimeout(150);
  }
  await p.waitForSelector(".results", { timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(800);
  check(await p.$(".results"), `${name}: Blitz endet nicht mit Ergebnis`);
  await p.click('[data-act="home"]');

  // Entdecken und Ergebnis-Seiten ohne seitliches Scrollen
  await p.click('[data-act="discover"]');
  check(await noHScroll(), `${name}: Entdecken scrollt seitlich`);
  if (shots) await p.screenshot({ path: path.join(shots, `${engine}-${slug}-discover.png`) });
  await p.click('[data-act="home"]');
  await p.click('[data-act="badges"]');
  check(await noHScroll(), `${name}: Abzeichen scrollt seitlich`);
  await p.click('[data-act="home"]');

  check(errors.length === 0, `${name}: Konsolenfehler ${errors.join(" | ")}`);
  console.log(`${engine} ${name}: ${errors.length ? "Fehler" : "ok"}`);
  await ctx.close();
}
await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "alle Geräte-Tests ok");
process.exit(fails ? 1 : 0);
