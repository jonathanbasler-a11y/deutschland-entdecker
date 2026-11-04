// Browser-Test: spielt alle Modi durch. Aufruf: node tools/e2e.mjs [Ordner für Screenshots]
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const root = path.resolve("public");
const shots = process.argv[2] || null;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const f = path.join(root, q.url === "/" ? "index.html" : q.url.split("?")[0]);
  fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { "content-type": types[path.extname(f)] || "text/plain" }), r.end(d))));
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;

let fails = 0;
const check = (c, m) => { if (!c) { fails++; console.log("FAIL", m); } };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, serviceWorkers: "block" });
// Flaggen-Frage zuerst stellen, wenn sie in der Runde vorkommen kann (sonst bei 25 Fragen Zufall)
await ctx.addInitScript(() => { window.__DE_TEST = { forceFirst: "g_flagge" }; });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(String(e)));
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const shot = (n) => shots && p.screenshot({ path: path.join(shots, n + ".png") });
await p.goto(url);
await p.click('[data-act="skipname"]');
await p.click("#more > summary"); // Selbst aussuchen aufklappen (bleibt gespeichert)

// Anker-Punkt eines Items in Bildschirmkoordinaten
const anchor = (id) => p.evaluate((id) => {
  const svg = document.querySelector(".map");
  const it = window.__DE.ITEMS.find((i) => i.id === id);
  let x, y;
  const hit = svg.querySelector(`.hit[data-id="${id}"]:not(.lakehit):not(.dot)`);
  if (hit) { const pt = hit.getPointAtLength(hit.getTotalLength() / 2); x = pt.x; y = pt.y; }
  else { [x, y] = it.label; }
  const m = svg.getScreenCTM(), q = svg.createSVGPoint(); q.x = x; q.y = y;
  const r = q.matrixTransform(m);
  return [r.x, r.y];
}, id);
const byName = (n) => p.evaluate((n) => window.__DE.ITEMS.find((i) => i.name === n).id, n);
const unknown = [];

// Finden: pro Thema eine Runde, jedes Ziel muss am Anker getroffen werden
for (const topic of ["states", "neighbors", "water", "mountains"]) {
  await p.click(`[data-act="topic"][data-v="${topic}"]`);
  await p.click('[data-act="mode"][data-v="tap"]');
  const n = await p.evaluate(() => 0);
  for (let i = 0; i < 20; i++) {
    if (await p.$(".results")) break;
    const name = await p.textContent(".big");
    const id = await byName(name);
    const [x, y] = await anchor(id);
    await p.mouse.click(x, y);
    await p.waitForSelector(".feedback.ok", { timeout: 1500 }).catch(() => { fails++; unknown.push(topic + ":" + name); });
    await p.waitForSelector(".feedback.ok", { state: "detached", timeout: 3000 }).catch(() => {});
    if (unknown.length && unknown.at(-1).startsWith(topic + ":" + name)) { await p.mouse.click(x, y); await p.waitForTimeout(100); break; }
  }
  await p.waitForSelector(".results", { timeout: 15000 }).catch(() => {});
  if (!(await p.$(".results"))) { await p.click('[data-act="quit"]'); } else await p.click('[data-act="home"]');
}
console.log("Finden: nicht getroffen:", unknown.length ? unknown.join(", ") : "keine");

// Falscher Tipp liefert Rückmeldung, zweiter Fehler zeigt Lösung
await p.click('[data-act="topic"][data-v="states"]');
await p.click('[data-act="mode"][data-v="tap"]');
let name = await p.textContent(".big");
let wrong = name === "Bayern" ? "s_sh" : "s_by";
let [wx, wy] = await anchor(wrong);
await p.mouse.click(wx, wy);
check((await p.textContent("#fb")).includes("Versuch es noch einmal"), "erster Fehler: Hinweis");
await p.mouse.click(wx, wy);
check(await p.$("#nx"), "zweiter Fehler: Weiter-Knopf");
await shot("tap-wrong");
await p.click('[data-act="quit"]');

// Auswählen
await p.click('[data-act="topic"][data-v="neighbors"]');
await p.click('[data-act="mode"][data-v="choice"]');
check((await p.$$(".opt")).length === 4, "4 Antworten");
await shot("choice");
const hl = await p.$$(".hl-poly");
check(hl.length === 1, "ein Gebiet leuchtet");
const right = await p.evaluate(() => null);
await p.click(".opt >> nth=0");
check(await p.$$eval(".opt.ok", (e) => e.length === 1), "richtige Antwort grün");
await p.click('[data-act="quit"]');

// Schreiben (Karte): Umlaut-Variante und Tippfehler
await p.click('[data-act="topic"][data-v="states"]');
await p.click('[data-act="mode"][data-v="write"]');
const target = await p.evaluate(() => { const l = window.__DE.ITEMS.filter((i) => i.cat === "states"); return null; });
await shot("write");
await p.fill("#wi", "xyz");
await p.click("#ws");
check((await p.textContent("#fb")).includes("Nicht ganz"), "Schreiben falsch: Tipp");
await p.click('[data-act="quit"]');

// Schreiben exakt: erzwinge bekannte Frage über Thema mountains
await p.click('[data-act="topic"][data-v="mountains"]');
await p.click('[data-act="mode"][data-v="write"]');
for (let i = 0; i < 14; i++) {
  const nm = await p.evaluate(() => {
    const id = document.querySelector(".hl-poly") && [...document.querySelectorAll(".hl-poly")].length;
    return null;
  });
  // Lösung ermitteln: Gebiet, dessen Pfad dem Highlight entspricht
  const d = await p.getAttribute(".hl-poly", "d");
  const sol = await p.evaluate((d) => window.__DE.ITEMS.find((i) => i.d === d).name, d);
  await p.fill("#wi", sol.replace("ä", "ae").toLowerCase());
  await p.click("#ws");
  await p.waitForSelector(".feedback.ok", { timeout: 1500 }).catch(() => { fails++; console.log("FAIL write ok for", sol); });
  await p.waitForSelector(".feedback.ok", { state: "detached", timeout: 4000 }).catch(() => {});
  if (await p.$(".results")) break;
}
check(await p.$(".results"), "Schreiben-Runde endet mit Ergebnis");
await shot("results");
await p.click('[data-act="home"]');

// Allgemeines: Auswahl und Flagge. Es werden 10 von 11 Fragen gezogen, daher
// so oft wiederholen, bis die Flaggen-Aufgabe vorkam (höchstens 6 Runden).
await p.click('[data-act="topic"][data-v="general"]');
let sawFlag = false;
for (let round = 0; round < 6 && !sawFlag; round++) {
  await p.click(round === 0 ? '[data-act="mode"][data-v="choice"]' : '[data-act="again"]');
  if (round === 0) await shot("general-choice");
  for (let i = 0; i < 11; i++) {
    if (await p.$(".results")) break;
    if (await p.$(".flagbox")) {
      sawFlag = true; await shot("flag");
      for (const c of ["Schwarz", "Rot", "Gold"]) await p.click(`.fchip[data-n="${c}"]`);
      await p.waitForSelector(".feedback.ok", { timeout: 1000 });
      await p.waitForSelector(".feedback.ok", { state: "detached", timeout: 4000 });
    } else {
      const q = await p.textContent(".prompt h2");
      const sol = await p.evaluate((q) => { const g = window.__DE.ITEMS.find((i) => i.g && i.g.q === q).g; return g.options[g.correct]; }, q);
      await p.click(`.opt:text-is("${sol}")`);
      await p.waitForSelector(".opt.ok", { timeout: 1000 });
      await p.waitForTimeout(1100);
    }
  }
  await p.waitForSelector(".results", { timeout: 5000 }).catch(() => {});
  check(await p.$(".results"), "Allgemeines endet mit Ergebnis");
}
check(sawFlag, "Flaggen-Aufgabe kam vor");
await p.click('[data-act="home"]');

// Allgemeines schreiben: Zahlen
await p.click('[data-act="mode"][data-v="write"]');
for (let i = 0; i < 12; i++) {
  if (await p.$(".results")) break;
  const q = await p.textContent(".prompt h2");
  const sol = await p.evaluate((q) => { const w = window.__DE.ITEMS.find((i) => i.g && i.g.write && i.g.write.q === q).g.write; return w.num ? String(w.num[w.num.length > 1 ? 1 : 0]) : w.all ? w.all.join(" und ") : w.answers[0]; }, q);
  await p.fill("#wi", sol);
  await p.click("#ws");
  await p.waitForSelector(".feedback.ok", { timeout: 1500 }).catch(() => { fails++; console.log("FAIL gen write", q, sol); });
  await p.waitForSelector(".feedback.ok", { state: "detached", timeout: 4000 }).catch(() => {});
}
await p.waitForSelector(".results", { timeout: 5000 }).catch(() => {});
await p.click('[data-act="home"]').catch(() => {});

// Probe-LZK: 22 Fragen, nur eine Chance
await p.click('[data-act="topic"][data-v="all"]');
await p.click('[data-act="mode"][data-v="probe"]');
let count = 0;
while (!(await p.$(".results")) && count < 40) {
  count++;
  if (await p.$(".opt")) await p.click(".opt >> nth=0");
  else if (await p.$(".fchip")) { for (const c of ["Rot", "Schwarz", "Gold"]) await p.click(`.fchip[data-n="${c}"]`); }
  else if (await p.$("#wi")) { await p.fill("#wi", "falsch"); await p.click("#ws"); }
  else { const [x, y] = await anchor("s_by"); await p.mouse.click(x, y); }
  await p.waitForSelector("#nx, #ws.next, .results", { timeout: 3000 }).catch(() => {});
  if (await p.$("#nx")) await p.click("#nx");
  else if (await p.$("#ws.next")) await p.click("#ws.next");
  else await p.waitForTimeout(1300);
}
check(count === 22, "Probe hat 22 Fragen, war " + count);
check((await p.textContent(".score")).startsWith("Note"), "Probe zeigt Note");
await shot("probe-result");
await p.click('[data-act="home"]');

// Blitz
await p.click('[data-act="topic"][data-v="states"]');
await p.click('[data-act="mode"][data-v="blitz"]');
for (let i = 0; i < 3; i++) {
  const name = await p.textContent(".big");
  const [x, y] = await anchor(await byName(name));
  await p.mouse.click(x, y);
  await p.waitForTimeout(600);
}
await shot("blitz");
check((await p.textContent("#cnt")).includes("3"), "Blitz zählt Treffer");
await p.click('[data-act="quit"]');

// Entdecken
await p.click('[data-act="discover"]');
const [dx, dy] = await anchor("s_he");
await p.mouse.click(dx, dy);
check((await p.textContent("#info h2")) === "Hessen", "Entdecken zeigt Hessen");
await shot("discover");
await p.click('[data-act="layer"][data-v="water"]');
const [rx, ry] = await anchor("w_rhein");
await p.mouse.click(rx, ry);
check((await p.textContent("#info h2")) === "Rhein", "Entdecken zeigt Rhein");
await p.click('[data-act="layer"][data-v="mountains"]');
const [mx, my] = await anchor("m_harz");
await p.mouse.click(mx, my);
check((await p.textContent("#info h2")) === "Harz", "Entdecken zeigt Harz");
await shot("discover-mtn");
await p.click('[data-act="home"]');

// Home mit Fortschritt, Abzeichen, Speicher
await shot("home");
await p.click('[data-act="badges"]');
await shot("badges");
await p.click('[data-act="home"]');
const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("deutschland-entdecker-v1")));
check(saved.xp > 0 && Object.keys(saved.items).length > 5, "Fortschritt gespeichert");

// Hochformat
await p.setViewportSize({ width: 820, height: 1180 });
await p.waitForTimeout(200);
await shot("home-portrait");
await p.click('[data-act="topic"][data-v="states"]');
await p.click('[data-act="mode"][data-v="write"]');
await shot("write-portrait");

check(errors.length === 0, "Konsolenfehler: " + errors.join(" | "));
console.log(fails ? `${fails} Fehler` : "alle Browser-Tests ok");
await b.close(); srv.close();
process.exit(fails ? 1 : 0);
