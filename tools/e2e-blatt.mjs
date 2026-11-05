// Mehrere Antworten in eigenen Feldern (wie bei ANTON) und die stumme Karte als ganzes Blatt.
// Aufruf: node tools/e2e-blatt.mjs [Ordner für Screenshots]
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
const check = (c, m) => { if (!c) { fails++; console.log("FAIL", m); } else console.log("ok  ", m); };
const b = await chromium.launch();

async function fresh(size = { width: 1180, height: 820 }, test = {}) {
  const ctx = await b.newContext({ viewport: size, hasTouch: true, serviceWorkers: "block" });
  await ctx.addInitScript((t) => { window.__DE_TEST = Object.assign({ gateMs: 150, pauseMs: 400, pauseAfterMin: 1e9 }, t); }, test);
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.goto(url);
  await p.click('[data-act="skipname"]');
  return { ctx, p };
}
const shot = async (p, n) => { if (shots) await p.screenshot({ path: path.join(shots, "blatt-" + n + ".png") }); };
const ev = (p, expr) => p.evaluate(new Function("return (" + expr + ")"));
async function writeRound(p, first) {
  await p.evaluate((f) => { window.__DE_TEST.forceFirst = f; }, first);
  if (!(await p.$('[data-act="mode"][data-v="write"]:visible'))) await p.click("#more > summary");
  await p.click('[data-act="mode"][data-v="write"]');
}

// 1) Mehrere Antworten: ein Feld pro Antwort, jedes Feld einzeln geprüft
{
  const { ctx, p } = await fresh();
  await writeRound(p, "g_staedte");
  check((await p.$$("#mf .mi")).length === 3, "Drei größte Städte: drei Felder");
  check(await p.waitForFunction(() => document.activeElement && document.activeElement.id === "wi", null, { timeout: 1000 }).then(() => true, () => false), "Erstes Feld hat den Cursor");
  // Enter springt ins nächste Feld, prüft noch nicht
  await p.fill("#wi", "Hamburg"); await p.press("#wi", "Enter");
  check(await p.evaluate(() => document.activeElement.id === "wi1") && !(await p.$(".mrow.ok")), "Enter springt ins nächste Feld");
  // leeres Feld: erst ein Hinweis, kein Fehler
  await p.click("#ws");
  check((await p.textContent("#fb")).includes("fehlen noch 2 Antworten") && !(await p.$(".mrow.ok")), "Leere Felder: freundlicher Hinweis, noch nicht geprüft");
  await p.fill("#wi1", "Köln"); await p.fill("#wi2", "Munchen"); await p.click("#ws");
  check(!!(await p.$("#mr0.ok")) && !!(await p.$("#mr1.bad")) && !!(await p.$("#mr2.ok")), "Jedes Feld einzeln: Hamburg ✓, Köln ✗, Munchen ✓ (andere Reihenfolge erlaubt)");
  check((await p.textContent("#fb")).includes("2 von 3 richtig"), "2 von 3 richtig");
  check(await p.$eval("#wi", (e) => e.readOnly) && !(await p.$eval("#wi1", (e) => e.readOnly)), "Richtige Felder sind fest, das rote kann verbessert werden");
  await p.fill("#wi1", "Berlin"); await p.click("#ws");
  check(!!(await p.$(".feedback.ok")) && (await p.textContent("#fb")).includes("München"), "Zweiter Versuch richtig, Schreibtipp zeigt München");
  check((await ev(p, "window.__DE.R.results[0].res")) === "second", "Gewertet als zweiter Versuch");
  await p.click('[data-act="quit"]');
  // doppelt
  await writeRound(p, "g_staedte");
  await p.fill("#wi", "Berlin"); await p.fill("#wi1", "berlin"); await p.fill("#wi2", "Hamburg"); await p.click("#ws");
  check((await p.textContent("#fb")).includes("doppelt") && !!(await p.$("#mr1.bad")), "Zweimal Berlin: als doppelt erkannt");
  await p.fill("#wi1", "Bremen"); await p.click("#ws");
  check((await p.textContent("#mr1 .msol")) === "München" && (await p.textContent("#ws")) === "Weiter", "Nach dem zweiten Versuch: Lösung beim roten Feld, dann Weiter");
  await p.click('[data-act="quit"]');
  // Stadtstaaten: jetzt alle drei
  await writeRound(p, "g_stadtstaat_namen");
  check((await p.$$("#mf .mi")).length === 3 && (await p.textContent("#wprompt")).includes("alle drei"), "Stadtstaaten: alle drei in drei Feldern");
  await p.fill("#wi", "Bremen"); await p.fill("#wi1", "Hamburg"); await p.fill("#wi2", "Berlin"); await p.press("#wi2", "Enter");
  check(!!(await p.$(".feedback.ok")) && (await ev(p, "window.__DE.R.results[0].res")) === "first", "Alle drei richtig im ersten Versuch");
  await shot(p, "multi");
  await p.click('[data-act="quit"]');
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 2) Probe-LZK: nur ein Versuch, Lösung gleich im Feld
{
  const { ctx, p } = await fresh(undefined, { forceFirst: "g_meere" });
  await p.click('[data-act="mode"][data-v="probe"]');
  check((await p.$$("#mf .mi")).length === 2, "Probe-LZK: Meere mit zwei Feldern");
  await p.fill("#wi", "Nordsee"); await p.fill("#wi1", "Rhein"); await p.click("#ws");
  check(!!(await p.$("#mr0.ok")) && !!(await p.$("#mr1.bad")) && (await p.textContent("#mr1 .msol")) === "Ostsee", "Probe: ein Versuch, Lösung gleich beim roten Feld");
  check((await p.textContent("#fb")).includes("1 von 2 richtig") && (await p.textContent("#ws")) === "Weiter", "Probe: 1 von 2 richtig, dann Weiter");
  check((await ev(p, "window.__DE.R.results[0].res")) === "fail", "Probe: nicht ganz richtig zählt als Fehler");
  await p.click('[data-act="quit"]');
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 2b) Lehrer: Rechtschreibung zählt nicht, erkennbar genügt. Schreibfallen kommen trotzdem weiter dran.
{
  const { ctx, p } = await fresh(undefined, { forceFirst: "s_ni" });
  await p.click('[data-act="mode"][data-v="probe"]');
  check((await p.textContent("#wprompt")).includes("Bundesland"), "Probe-LZK: Niedersachsen schreiben");
  await p.fill("#wi", "Nidersaksen"); await p.press("#wi", "Enter");
  check(!!(await p.$(".feedback.ok")) && (await p.textContent("#fb")).includes("Niedersachsen"), "„Nidersaksen“ zählt als richtig, Schreibtipp zeigt Niedersachsen");
  check((await ev(p, "window.__DE.R.results[0].ok")) && (await ev(p, "window.__DE.R.typos")) === 1, "gewertet als richtig, als Schreibfehler markiert");
  check((await ev(p, "window.__DE.S.items.s_ni.sp")) === false, "Schreibfalle bleibt zum Üben offen");
  await p.click('[data-act="quit"]');
  await p.evaluate(() => { window.__DE_TEST.forceFirst = "s_ni"; });
  await p.click("#more > summary");
  await p.click('[data-act="mode"][data-v="write"]');
  await p.fill("#wi", "Niedersachsen"); await p.press("#wi", "Enter");
  check((await ev(p, "window.__DE.S.items.s_ni.sp")) === true, "Richtig geschrieben: Schreibfalle geschafft");
  await p.click('[data-act="quit"]');
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 3) Stumme Karte als ganzes Blatt
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="blankpick"]');
  check(await p.$('[data-act="bstyle"][data-v="sheet"][aria-pressed="true"]'), "Ganzes Blatt ist voreingestellt");
  await shot(p, "chooser");
  await p.click('[data-act="blank"][data-v="neighbors"]');
  const items = await ev(p, "window.__DE.R.q.map((it) => ({ id: it.id, name: it.name, n: window.__DE.R.nums[it.id] }))");
  check(items.length === 9 && (await p.$$(".srow input")).length === 9, "Nachbarländer: 9 Felder auf einmal");
  check((await p.$$(".map .num")).length === 9, "9 Nummern auf der Karte");
  // Nummer auf der Karte antippen -> Feld bekommt den Cursor
  const n5 = items[4];
  const box = await (await p.$(`.map .num[data-num="${n5.id}"] circle`)).boundingBox();
  await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  check(await p.evaluate((id) => document.activeElement.id === "si-" + id, n5.id) && !!(await p.$(".map .hl-poly, .map .ring")), "Nummer auf der Karte antippen: Feld aktiv, Land leuchtet");
  // alles ausfüllen, zwei falsch
  for (const [k, it] of items.entries()) await p.fill(`#si-${it.id}`, k === 1 ? "Spanien" : k === 6 ? "" : it.name);
  check((await p.$$(".map .numlab.typed")).length === 8, "Was er schreibt, steht gleich auf der Karte");
  check((await p.textContent("#cnt")) === "8 / 9", "Fortschritt zählt ausgefüllte Felder");
  await p.click("#ss");
  check((await p.textContent("#fb")).includes("1 Feld ist leer") && !(await p.$(".srow.ok")), "Leeres Feld: erst ein Hinweis");
  await p.click("#ss");
  check((await p.$$(".srow.ok")).length === 7 && (await p.$$(".srow.wrong")).length === 2, "Geprüft: 7 grün, 2 rot");
  check((await p.textContent("#fb")).includes("7 von 9 richtig"), "7 von 9 richtig");
  check((await p.$$(".map .num.ok")).length === 7, "Karte: 7 Nummern grün");
  await shot(p, "sheet-check");
  // verbessern: eins richtig, eins wieder falsch -> Lösung
  await p.fill(`#si-${items[1].id}`, items[1].name);
  await p.fill(`#si-${items[6].id}`, "Italien");
  await p.click("#ss");
  check((await p.$$(".srow.ok")).length === 8 && (await p.textContent(`#sr-${items[6].id} .ssol`)) === items[6].name, "Zweiter Versuch: 8 richtig, beim letzten steht die Lösung");
  check((await p.textContent("#ss")) === "Zur Auswertung", "Knopf: Zur Auswertung");
  await p.click("#ss");
  check(!!(await p.$(".resultmap")) && (await p.textContent(".score")).trim() === "8 / 9", "Auswertung mit Karte: 8 / 9");
  const res = await ev(p, "window.__DE.R.results.map((x) => x.res)");
  check(res.filter((x) => x === "first").length === 7 && res.includes("second") && res.includes("fail"), "Gewertet: 7 erster Versuch, 1 zweiter, 1 falsch");
  await p.click('[data-act="blankwrong"]');
  check((await p.$$(".srow input")).length === 1 && (await p.$$(".map .num.known")).length === 8, "Nur die Fehler: 1 Feld, die anderen stehen schon da");
  await p.fill(".srow input", items[6].name); await p.press(".srow input", "Enter");
  check((await p.textContent("#fb")).includes("Alles richtig"), "Enter im letzten Feld prüft: alles richtig");
  await p.click("#ss");
  check((await p.textContent(".score")).trim() === "1 / 1", "Fehler-Runde: 1 / 1");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 4) Ganzes Blatt mit Wortkasten, fehlerfrei -> Abzeichen
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="blankpick"]');
  await p.click('[data-act="blank"][data-v="neighbors"]');
  await p.click('[data-a="sm"][data-v="bank"]');
  check((await p.$$(".sheetlist .wchip")).length === 9 && await p.$eval(".srow input", (e) => e.readOnly), "Wortkasten: 9 Namen, keine Tastatur");
  const items = await ev(p, "window.__DE.R.q.map((it) => ({ id: it.id, name: it.name }))");
  await p.click(`#si-${items[0].id}`);
  await p.click(`.wchip[data-name="${items[0].name}"]`);
  check(await p.evaluate((id) => document.activeElement.id === "si-" + id, items[1].id), "Nach dem Antippen springt es ins nächste leere Feld");
  for (const it of items.slice(1)) {
    await p.click(`#si-${it.id}`);
    await p.click(`.wchip[data-name="${it.name}"]`);
  }
  check((await p.$$(".wchip.used")).length === 9, "Benutzte Namen sind ausgegraut");
  await p.click("#ss");
  check((await p.textContent("#fb")).includes("Alles richtig") && (await p.$$(".srow.ok")).length === 9, "Alles richtig");
  await p.click("#ss");
  check((await ev(p, "!!window.__DE.S.blankPerfect && !!window.__DE.S.badges.stumm")), "Abzeichen Kartenzeichner");
  // ein Name nur einmal: Antippen in einem anderen Feld nimmt ihn dort weg
  await p.click('[data-act="again"]');
  const its = await ev(p, "window.__DE.R.q.map((it) => ({ id: it.id, name: it.name }))");
  await p.click(`#si-${its[0].id}`); await p.click(`.wchip[data-name="${its[0].name}"]`);
  await p.click(`#si-${its[3].id}`); await p.click(`.wchip[data-name="${its[0].name}"]`);
  check((await p.inputValue(`#si-${its[0].id}`)) === "" && (await p.inputValue(`#si-${its[3].id}`)) === its[0].name, "Jeder Name nur einmal");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 5) Nummer für Nummer bleibt wählbar und wird gemerkt
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="blankpick"]');
  await p.click('[data-act="bstyle"][data-v="single"]');
  await p.click('[data-act="blank"][data-v="states"]');
  check(!!(await p.$("#bnum")) && !(await p.$(".srow")), "Nummer für Nummer: wie bisher");
  await p.click('[data-act="quit"]');
  await p.reload();
  await p.click('[data-act="blankpick"]');
  check(await p.$('[data-act="bstyle"][data-v="single"][aria-pressed="true"]'), "Auswahl wird gemerkt");
  await ctx.close();
}

// 6) Layout: Blatt und Mehrfach-Felder ohne seitliches Scrollen
for (const [name, w, h] of [["iPad Air quer", 1180, 820], ["iPad Air hoch", 820, 1180], ["iPad mini quer", 1133, 744], ["Handy", 390, 844]]) {
  const { ctx, p } = await fresh({ width: w, height: h });
  const noH = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  await p.click('[data-act="blankpick"]');
  await p.click('[data-act="blank"][data-v="states"]');
  check(await noH(), `${name}: Blatt ohne seitliches Scrollen`);
  const ids = await ev(p, "window.__DE.R.q.map((it) => it.id)");
  await p.focus(`#si-${ids[15]}`);
  const vis = await p.evaluate((id) => { const r = document.getElementById("si-" + id).getBoundingClientRect(), s = document.getElementById("ss").getBoundingClientRect(); return r.bottom <= innerHeight + 1 && r.top >= 0 && s.bottom <= innerHeight + 1; }, ids[15]);
  check(vis, `${name}: letztes Feld und Prüfen-Knopf erreichbar`);
  if (w > h) check(await p.evaluate(() => { const m = document.querySelector(".stage .mapwrap").getBoundingClientRect(); return m.top >= 0 && m.bottom <= innerHeight + 1; }), `${name}: Karte bleibt ganz sichtbar`);
  if (shots && /Handy|hoch/.test(name)) await shot(p, name.replace(/\s+/g, "-") + "-sheet");
  await p.click('[data-act="quit"]');
  await writeRound(p, "g_staedte");
  check(await noH(), `${name}: Mehrfach-Felder ohne seitliches Scrollen`);
  check(p.errors.length === 0, `${name}: keine Konsolenfehler ` + p.errors.join(" | "));
  await ctx.close();
}

await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "alle Blatt-Tests ok");
process.exit(fails ? 1 : 0);
