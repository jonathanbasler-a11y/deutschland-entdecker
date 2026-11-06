// Begleiter-Hund, Bauprojekte, Boss am Ende jeder Etappe, Rennen gegen den eigenen Rekord, Effekte.
// Aufruf: node tools/e2e-begleiter.mjs [Ordner für Screenshots]
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const B = require("../public/begleiter.js");

// 0) Reine Logik
assert.deepEqual([0, 299, 300, 899, 900, 1999, 2000, 9999].map(B.stageOf), [0, 0, 1, 1, 2, 2, 3, 3]);
assert.equal(B.growth(150).pct, 50);
assert.equal(B.growth(150).need, 150);
assert.equal(B.growth(5000).next, null);
assert.deepEqual(B.gearOf(1500), ["scarf", "helm", "torch"]);
assert.ok(B.dog(2000).includes(B.PAL.v) && !B.dog(0).includes(B.PAL.v), "Umhang erst beim Held-Hund");
assert.ok(B.dog(300).includes(B.PAL.r) && !B.dog(0).includes(B.PAL.r), "Halstuch ab Junghund");
const huette = B.PROJECTS[0].size;
assert.equal(huette, 44);
assert.deepEqual(B.building(0), { done: [], cur: B.PROJECTS[0], placed: 0, bonus: 0 });
assert.deepEqual(B.building(huette + 3).done, ["huette"]);
assert.equal(B.building(huette + 3).placed, 3);
const all = B.PROJECTS.reduce((a, p) => a + p.size, 0);
assert.equal(B.building(all + 5).cur, null);
assert.equal(B.building(all + 5).bonus, 5);
// erster Block ist unten links, der letzte oben (Dach zuletzt)
const c = B.cells(B.PROJECTS[0]);
assert.equal(c[0][1], 7); assert.equal(c[c.length - 1][1], 0);
assert.equal(B.bossFor("2026-11-05", 0).id, B.bossFor("2026-11-05", 0).id);
assert.notEqual(B.bossFor("2026-11-05", 0).id, B.bossFor("2026-11-05", 1).id);
assert.deepEqual([0, 1, 2].map(B.bossHp), [3, 3, 5]);
assert.equal(B.ghostTrace([], 60000).length, 8);
assert.deepEqual(B.ghostTrace([5, 9], 60000), [5, 9]);
assert.equal(B.ghostAt([100, 200, 300], 250), 2);
assert.equal(B.raceGoal([1, 2]), 9);
assert.equal(B.raceGoal(new Array(12).fill(1)), 13);
assert.equal(B.pos(20, 9), 100);
// Jedes Tier: eigene Pixelgestalt, kein Emoji als Hauptfigur
assert.equal(B.KINDS.length, 13);
for (const k of B.KINDS) {
  const sh = B.shapeOf(k.id);
  assert.ok(sh && sh.body && sh.body.length >= 8, k.id + " hat Pixel-Körper");
  const svg = B.dog(0, "", "", k.id);
  assert.ok(svg.includes("k-" + k.id) && svg.includes("<rect"), k.id + " wird als Pixel-SVG gezeichnet");
  assert.ok(!/\p{Extended_Pictographic}/u.test(svg), k.id + " ohne Emoji-Hauptfigur");
}
assert.equal(new Set(B.KINDS.map((k) => B.dog(0, "", "", k.id))).size, 13, "alle Gestalten verschieden");
assert.notEqual(B.dog(0, "", "", "fuchs"), B.dog(0, "", "", "hund"), "Fuchs ≠ Hund");
assert.notEqual(B.dog(0, "", "", "pinguin"), B.dog(0, "", "", "eule"), "Pinguin ≠ Eule");
console.log("ok   Logik des Begleiters");

const root = path.resolve("public");
const shots = process.argv[2] || null;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const f = path.join(root, q.url === "/" ? "index.html" : q.url.split("?")[0]);
  fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { "content-type": types[path.extname(f)] || "text/plain" }), r.end(d))));
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;
let fails = 0;
const check = (cond, m) => { if (!cond) { fails++; console.log("FAIL", m); } else console.log("ok  ", m); };
const b = await chromium.launch();

async function fresh(size = { width: 1180, height: 820 }, test = {}, skip = true) {
  const ctx = await b.newContext({ viewport: size, hasTouch: true, serviceWorkers: "block" });
  await ctx.addInitScript((t) => { window.__DE_TEST = Object.assign({ gateMs: 150, pauseMs: 400, pauseAfterMin: 1e9, speakWaitMs: 50 }, t); }, test);
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.goto(url);
  if (skip) await p.click('[data-act="skipname"]');
  return { ctx, p };
}
const shot = async (p, n) => { if (shots) await p.screenshot({ path: path.join(shots, "begleiter-" + n + ".png") }); };
const ev = (p, expr) => p.evaluate(new Function("return (" + expr + ")"));
const S = (p) => ev(p, "window.__DE.S");

// --- Kopfrechnen-Hilfen
const mAns = (p) => ev(p, "String(window.__DE_M.R.cur.ans)");
async function mAnswer(p, right = true) {
  const a = await mAns(p);
  for (const d of right ? a : String(Number(a) + 1)) await p.tap(`.key[data-v="${d}"]`);
  await p.tap('.key[data-v="ok"]');
}
async function mStep(p, right = true) {
  const i = await ev(p, "window.__DE_M.R.i");
  await mAnswer(p, right);
  if (!right) { await mAnswer(p, false); await p.tap('.key[data-v="ok"]'); }
  await p.waitForFunction((i) => document.querySelector(".mresults") || window.__DE_M.R.i !== i, i, { timeout: 6000 });
}

// --- Deutschland-Hilfen (wie in e2e-features)
const solName = (p) => p.evaluate(() => { const d = document.querySelector(".hl-poly, .hl-line").getAttribute("d"); return window.__DE.ITEMS.find((i) => i.d === d).name; });
async function deSol(p) {
  const general = await p.$eval("#stage", (e) => e.classList.contains("general"));
  if (await p.$(".flagbox")) return { flag: true };
  if (await p.$(".opt")) {
    if (general) { const q = await p.textContent(".prompt h2"); return { opt: await p.evaluate((q) => { const g = window.__DE.ITEMS.find((i) => i.g && i.g.q === q).g; return g.options[g.correct]; }, q) }; }
    return { opt: await solName(p) };
  }
  if (await p.$("#wi")) {
    if (general) {
      const q = await p.textContent("#wprompt");
      return { write: await p.evaluate((q) => { const w = window.__DE.ITEMS.find((i) => i.g && i.g.write && i.g.write.q === q).g.write; return w.num ? String(w.num[w.num.length - 2] || w.num[0]) : w.answers[0]; }, q) };
    }
    return { write: await solName(p) };
  }
  return { tap: await p.textContent(".prompt .big") };
}
async function deAnswer(p, right = true) {
  const s = await deSol(p);
  if (s.flag) { for (const c of right ? ["Schwarz", "Rot", "Gold"] : ["Gold", "Rot", "Schwarz", "Gold", "Rot", "Schwarz"]) await p.click(`.fchip[data-n="${c}"]:not([disabled])`).catch(() => {}); if (!right) await p.click("#nx").catch(() => {}); return; }
  if (s.opt) {
    if (right) await p.click(`.opt:text-is("${s.opt}")`);
    else { const opts = await p.$$eval(".opt", (e) => e.map((x) => x.textContent)); await p.click(`.opt:text-is("${opts.find((o) => o !== s.opt)}")`); await p.click("#nx"); }
    return;
  }
  if (s.write) {
    if (right) { await p.fill("#wi", s.write); await p.press("#wi", "Enter"); }
    else { for (let k = 0; k < 2; k++) { await p.fill("#wi", "qqqq"); await p.press("#wi", "Enter"); } await p.press("#wi", "Enter"); }
    return;
  }
  const [x, y] = await p.evaluate((nm) => {
    const it = window.__DE.ITEMS.find((i) => i.name === nm);
    const svg = document.querySelector(".stage .map");
    let x, y;
    const hit = svg.querySelector(`.hit[data-id="${it.id}"]:not(.lakehit):not(.dot)`);
    if (hit) { const pt = hit.getPointAtLength(hit.getTotalLength() / 2); x = pt.x; y = pt.y; } else [x, y] = it.label;
    const q = svg.createSVGPoint(); q.x = x; q.y = y; const r = q.matrixTransform(svg.getScreenCTM()); return [r.x, r.y];
  }, s.tap);
  await p.touchscreen.tap(x, y);
}
async function deStep(p, right = true) {
  const i = await ev(p, "window.__DE.R.i");
  await deAnswer(p, right);
  await p.waitForFunction((i) => document.querySelector(".results") || window.__DE.R.i !== i, i, { timeout: 6000 });
}

// 1) Willkommen: Name des Hundes, Hund auf beiden Startseiten, Begrüßung einmal am Tag
{
  const { ctx, p } = await fresh(undefined, {}, false);
  check((await p.inputValue("#dn")) === "Pixel", "Willkommen: Hund heißt zuerst Pixel");
  check(await p.$(".modal .dogrow .dog"), "Willkommen zeigt den Hund");
  await p.fill("#nm", "Max"); await p.fill("#dn", "Bello");
  await p.click('[data-act="savename"]');
  check((await S(p)).pet.name === "Bello", "Name des Hundes gespeichert");
  check((await p.textContent(".petw")).includes("Bello"), "Hund mit Namen auf der Deutschland-Startseite");
  check((await p.textContent(".petw .bubble")).includes("Wuff"), "Begrüßung: Wuff! Da bist du ja");
  await shot(p, "home");
  await p.click('[data-act="subject"][data-v="math"]');
  check(await p.$(".mhome") && (await p.textContent(".petw")).includes("Bello"), "Hund auch auf der Kopfrechnen-Startseite");
  check(!(await p.textContent(".petw")).includes("Wuff"), "Begrüßung nur einmal am Tag");
  check(await p.$(".petw.wait"), "Noch nicht geübt: Hund wartet");
  await p.tap('[data-act="m-level"][data-v="k-mal"]');
  await mStep(p); await p.click('[data-act="m-quit"]');
  check(await p.$(".petw.happy"), "Nach dem Üben: Hund freut sich (wedelt)");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 2) Wachsen, Ausrüstung, Streicheln, Umbenennen, Bauprojekt
{
  const { ctx, p } = await fresh();
  await ev(p, "(window.__DE.S.xp = 295, window.__DE.S.pet.stage = 0, true)");
  await p.click('[data-act="mode"][data-v="choice"]').catch(() => {});
  if (!(await p.$(".opt"))) { await p.click("#more > summary"); await p.click('[data-act="mode"][data-v="choice"]'); }
  await deAnswer(p, true);
  check((await p.textContent(".toast")).includes("gewachsen: Junghund"), "Wachsen wird gefeiert: Junghund");
  check((await S(p)).pet.stage === 1, "Stufe gespeichert");
  await p.click('[data-act="quit"]');
  await ev(p, "(window.__DE.S.xp = 950, true)");
  await p.click('[data-act="pet"]');
  check(await p.$(".petview .bigdog .dog.st2"), "Mein Hund: großer Hund (Stufe 3)");
  check((await p.textContent(".petmeta .stage")) === "Großer Hund", "Stufenname");
  check((await p.$$(".gitem.got")).length === 2, "Halstuch und Helm freigeschaltet");
  await p.click("#bigdog");
  check((await p.$$(".bigdog .heart")).length >= 1, "Streicheln zeigt Herzen");
  check((await S(p)).pet.petted === 1 && (await ev(p, "window.__DE_TONE.kind")) === "wuff", "Streicheln: Wuff");
  await p.fill("#dogname", "Flocke"); await p.click("#rnf .btn");
  check((await S(p)).pet.name === "Flocke" && (await p.textContent(".petmeta h2")) === "Flocke", "Umbenennen");
  check((await p.textContent(".bstat")).includes("0 von 44"), "Bauprojekt Hundehütte: abgebrochene Runde gibt keine Blöcke");
  check((await p.$$(".trophy.got")).length === 0, "Noch keine Boss-Pokale");
  await shot(p, "pet");
  // Tier wählen und Snacks (Münzen = Punkte / 10 minus Ausgaben)
  check((await p.$$(".kind")).length === 13 && (await p.textContent(".kind.on b")) === "Hund", "Tierauswahl: 13 Tiere, Hund gewählt");
  const shapes = await p.evaluate(() => [...document.querySelectorAll(".kind .dog")].map((s) => ({ id: [...s.classList].find((c) => c.startsWith("k-")), html: s.innerHTML, emo: /\p{Extended_Pictographic}/u.test(s.textContent) })));
  check(shapes.length === 13 && new Set(shapes.map((s) => s.html)).size === 13, "Alle 13 Tiere haben eine eigene Pixelgestalt");
  check(shapes.every((s) => !s.emo), "Keine Emoji-Tiere mehr (echte Pixel)");
  check(shapes[0].id === "k-hund" && shapes.some((s) => s.id === "k-fuchs") && shapes.some((s) => s.id === "k-dino"), "Klassen k-hund, k-fuchs, k-dino vorhanden");
  await p.click('.kind[data-v="fuchs"]');
  check((await S(p)).pet.kind === "fuchs" && (await p.textContent(".petview h1")) === "Mein Fuchs" && (await p.textContent(".petmeta .stage")) === "Großer Fuchs", "Fuchs gewählt: Titel und Stufenname");
  check(await p.$(".bigdog .dog.k-fuchs") && (await p.$eval(".bigdog .dog.k-fuchs", (e) => e.querySelectorAll("rect").length)) > 10, "Fuchs wird als Pixelgestalt gezeichnet");
  const c0 = await p.textContent("#coins");
  check(c0.includes("95"), "Münzen: 950 Punkte = 95 " + c0);
  await p.click('.snack[data-v="keks"]');
  check((await S(p)).pet.spent === 5 && (await S(p)).pet.fed.keks === 1 && (await p.textContent("#coins")).includes("90"), "Keks gekauft: 5 Münzen weniger");
  check((await p.getAttribute(".sat", "aria-label")).includes("20"), "Satt-Balken steigt");
  await ev(p, "(window.__DE.S.pet.spent = 90, true)");
  await p.click('[data-act="home"]'); await p.click('[data-act="pet"]');
  check((await p.isDisabled('.snack[data-v="kuchen"]')) && !(await p.isDisabled('.snack[data-v="apfel"]')), "Zu teuer: Snack gesperrt, Apfel geht");
  // Zubehör, Zimmer, Deko (Münzen wieder auffüllen)
  await ev(p, "(window.__DE.S.pet.spent = 0, true)");
  await p.click('[data-act="home"]'); await p.click('[data-act="pet"]');
  await p.click('.snack[data-v="acc:krone"]');
  let pp = (await S(p)).pet;
  check(pp.spent === 25 && pp.acc.includes("krone") && pp.worn.includes("krone") && (await p.textContent(".bigdog")).includes("👑"), "Krone gekauft und am Tier gezeichnet");
  await p.click('.snack[data-v="acc:hut"]');
  pp = (await S(p)).pet;
  check(pp.worn.length === 1 && pp.worn[0] === "hut", "Zylinder ersetzt die Krone (ein Kopf-Teil)");
  await p.click('.snack[data-v="krone"]');
  check((await S(p)).pet.worn[0] === "krone" && (await S(p)).pet.spent === 37, "Besessenes Teil wieder anziehen kostet nichts");
  await p.click('.snack[data-v="krone"]');
  check((await S(p)).pet.worn.length === 0 && !(await p.textContent(".bigdog")).includes("👑"), "Ausziehen");
  await p.click('.snack[data-v="room:weltall"]');
  pp = (await S(p)).pet;
  check(pp.room === "weltall" && pp.spent === 67 && /1b1f4a/.test(await p.getAttribute(".room", "style")), "Zimmer Weltall gekauft und bezogen");
  await p.click('.snack[data-v="wiese"]');
  check((await S(p)).pet.room === "wiese" && (await S(p)).pet.spent === 67, "Zurück zur Wiese ohne Kosten");
  await p.click('.snack[data-v="decor:stern"]');
  check((await S(p)).pet.decor.includes("stern") && (await p.$$(".decor span")).length === 1 && (await p.isDisabled('.snack[data-v="decor:stern"]')), "Deko steht im Zimmer");
  await ev(p, "(window.__DE.S.pet.spent = 1000, true)");
  await p.click('[data-act="home"]'); await p.click('[data-act="pet"]');
  check(await p.isDisabled('.snack[data-v="acc:kappe"]'), "Zu wenig Münzen: Zubehör gesperrt");
  await p.click('.kind[data-v="hund"]');
  check((await p.textContent(".petmeta .stage")) === "Großer Hund", "zurück zum Hund");
  // Spielstand überlebt: Hauptschlüssel weg -> zweite Kopie; beide weg -> IndexedDB-Spiegel
  await p.click('.kind[data-v="panda"]');
  await p.waitForTimeout(400);
  await ev(p, "(window.__DE.skipSave = true, localStorage.removeItem('deutschland-entdecker-v1'), true)");
  await p.reload(); await p.waitForSelector("#app *");
  check((await S(p)).pet.kind === "panda", "Hauptschlüssel gelöscht: Stand kommt aus der zweiten Kopie");
  await ev(p, "(window.__DE.skipSave = true, localStorage.removeItem('deutschland-entdecker-v1'), localStorage.removeItem('deutschland-entdecker-v1-bak'), true)");
  await p.reload();
  await p.waitForFunction(() => window.__DE && window.__DE.S.pet.kind === "panda", null, { timeout: 6000 }).catch(() => {});
  check((await S(p)).pet.kind === "panda", "Beide Schlüssel gelöscht: Stand kommt aus IndexedDB zurück");
  // Kaputte Schlüssel (JSON kaputt / Zahl): IndexedDB muss trotzdem wiederherstellen
  await p.click('[data-act="skipname"]').catch(() => {});
  await p.click('[data-act="pet"]');
  await p.click('.kind[data-v="tiger"]');
  await p.waitForTimeout(500);
  await ev(p, "(window.__DE.skipSave = true, localStorage.setItem('deutschland-entdecker-v1', '{kaputt'), localStorage.setItem('deutschland-entdecker-v1-bak', '5'), true)");
  await p.reload();
  await p.waitForFunction(() => window.__DE && window.__DE.S.pet && window.__DE.S.pet.kind === "tiger", null, { timeout: 8000 }).catch(() => {});
  await p.click('[data-act="skipname"]').catch(() => {});
  check((await S(p)).pet.kind === "tiger", "Kaputte Schlüssel: Stand kommt aus IndexedDB zurück");
  // Unbekanntes Zubehör in worn: Anziehen darf nicht abstürzen
  await p.click('[data-act="pet"]');
  await ev(p, "(window.__DE.S.pet.spent = 0, window.__DE.S.pet.acc = ['krone','brille'], window.__DE.S.pet.worn = ['ghost-acc', 'krone'], true)");
  await p.click('[data-act="home"]'); await p.click('[data-act="pet"]');
  await p.click('.snack[data-v="brille"]');
  check((await S(p)).pet.worn.includes("brille") && !(await S(p)).pet.worn.includes("ghost-acc"), "Unbekanntes Zubehör: Anziehen bereinigt und stürzt nicht ab");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  // Sicherungsdatei laden (Eltern-Übersicht)
  async function openParents() {
    if (!(await p.$("#gate"))) {
      if (!(await p.$('[data-act="settings"]'))) await p.click('[data-act="home"]');
      await p.click('[data-act="settings"]');
      await p.waitForSelector("#gate", { timeout: 3000 });
    }
    const box = await (await p.$("#gate")).boundingBox();
    await p.mouse.move(box.x + 20, box.y + 10); await p.mouse.down();
    await p.waitForSelector(".parents", { timeout: 3000 }); await p.mouse.up();
  }
  await openParents();
  const restore = JSON.stringify({ askedName: true, gift2: true, xp: 42, pet: { name: "BackupHund", kind: "wolf", blocks: 0, bosses: {}, lastGreet: "", petted: 0, stage: 0, gear: 0 } });
  await Promise.all([
    p.waitForFunction(() => window.__DE && window.__DE.S.pet && window.__DE.S.pet.name === "BackupHund", null, { timeout: 10000 }),
    p.setInputFiles("#bkfile", { name: "sicherung.json", mimeType: "application/json", buffer: Buffer.from(restore) }),
  ]).catch(() => {});
  check((await S(p)).pet.name === "BackupHund" && (await S(p)).pet.kind === "wolf" && (await S(p)).xp === 42, "Sicherung laden stellt Name, Tier und Punkte wieder her");
  await openParents();
  await p.setInputFiles("#bkfile", { name: "nein.json", mimeType: "application/json", buffer: Buffer.from('{"hello":1}') });
  await p.waitForTimeout(500);
  check((await S(p)).pet.name === "BackupHund" && (await S(p)).xp === 42, "Ungültige Sicherungsdatei ändert den Stand nicht");
  check(p.errors.length === 0, "keine Konsolenfehler nach Sicherung " + p.errors.join(" | "));
  await ctx.close();
}

// 3) Deutschland: Boss nach Etappe 1 mit den Fehlern der Etappe; Boss blockt, verliert aber
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="mission"]');
  const wrongId = await ev(p, "window.__DE.R.cur.it.id");
  await deStep(p, false);
  for (let k = 0; k < 5; k++) await deStep(p, true);
  check(await p.$(".gbar.bossmode"), "Nach 6 Aufgaben erscheint der Boss");
  check((await p.$$("#bossbar .h.on")).length === 3, "Boss hat 3 Herzen");
  check((await ev(p, "window.__DE.R.cur.it.id")) === wrongId && (await ev(p, "window.__DE.R.cur.boss")), "Erste Boss-Aufgabe ist der Fehler der Etappe");
  if (shots) await p.waitForTimeout(1200);
  await shot(p, "boss-de");
  const len = await ev(p, "window.__DE.R.q.length");
  await deStep(p, false);
  check((await p.$$("#bossbar .h.on")).length === 3, "Falsch: der Boss blockt, kein Herz weg");
  check((await ev(p, "window.__DE.R.q.length")) === len + 1, "Geblockte Aufgabe kommt wieder");
  await deAnswer(p, true);
  check((await p.$$("#bossbar .h.on")).length === 2, "Treffer: ein Herz weg");
  await p.waitForFunction(() => !document.querySelector(".opt.ok, .write input.ok, .hl-poly.ok"), null, { timeout: 4000 }).catch(() => {});
  for (let n = 0; n < 12 && !(await p.$(".results")); n++) await deStep(p, true);
  check(await p.$(".results"), "Boss besiegt, Etappe vorbei");
  check((await p.textContent(".hero .gains")).includes("Boss besiegt"), "Ergebnis meldet den Sieg über den Boss");
  check((await p.textContent(".score")).trim() === "5 / 6", "Boss-Aufgaben zählen nicht zur Etappe (5 / 6)");
  const st = await S(p);
  check(Object.values(st.pet.bosses).reduce((a, x) => a + x, 0) === 1, "Pokal für den Boss");
  check(st.pet.blocks === 5, "Blöcke: Etappe 3 + Boss 2 = 5 (" + st.pet.blocks + ")");
  await shot(p, "boss-de-result");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 4) Kopfrechnen: Boss nach Etappe 3 hat 5 Herzen; Boss-Schalter aus
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="subject"][data-v="math"]');
  await ev(p, "(() => { const d = new Date(), pad = (n) => String(n).padStart(2, '0'); window.__DE_M.M().mission = { day: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), step: 2 }; return true; })()");
  await p.click('[data-act="subject"][data-v="math"]');
  await p.click('[data-act="m-mission"]');
  check((await p.textContent(".mlabel")).startsWith("Etappe 3"), "Etappe 3 (Tempo)");
  for (let k = 0; k < 10; k++) await mStep(p, true);
  check(await p.$(".gbar.bossmode") && (await p.$$("#bossbar .h.on")).length === 5, "Großer Boss in Etappe 3: 5 Herzen");
  check((await p.textContent(".mlabel")).includes("Boss"), "Beschriftung zeigt den Boss");
  if (shots) await p.waitForTimeout(1200);
  await shot(p, "boss-m");
  await mAnswer(p, false);
  check((await p.textContent("#fb")).includes("Der Boss blockt"), "Fehler beim Boss: Der Boss blockt");
  check((await p.$$("#bossbar .h.on")).length === 5, "Fehler kostet kein Herz");
  await mAnswer(p, true);
  check((await p.$$("#bossbar .h.on")).length === 4, "Treffer kostet ein Herz");
  await p.waitForFunction(() => window.__DE_M.R.cur && !document.querySelector(".mans.ok"), null, { timeout: 4000 });
  for (let n = 0; n < 12 && !(await p.$(".mresults")); n++) await mStep(p, true);
  check((await p.textContent(".hero .gains")).includes("Boss besiegt"), "Kopfrechnen: Boss besiegt");
  check((await p.textContent(".score")).trim() === "10 / 10", "Boss-Aufgaben zählen nicht zur Etappe (10 / 10)");
  check((await S(p)).pet.blocks === 6, "Blöcke: Etappe 3 + großer Boss 3 = 6");
  // Boss ausschalten (Eltern) -> Etappe endet direkt
  await ev(p, "(window.__DE.S.bossOn = false, window.__DE_M.M().mission.step = 0, true)");
  await p.click('[data-act="home"]');
  await p.click('[data-act="m-mission"]');
  for (let k = 0; k < 10; k++) await mStep(p, true);
  check(await p.$(".mresults") && !(await S(p)).bossOn, "Boss aus: Etappe endet nach 10 Aufgaben");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 5) Rennen gegen den eigenen Rekord (Kopfrechnen und Deutschland)
{
  const { ctx, p } = await fresh(undefined, { blitzMs: 5000 });
  await p.click('[data-act="subject"][data-v="math"]');
  await ev(p, "(window.__DE_M.M().blitzTrace = [3500, 3600], true)");
  await p.click('[data-act="m-blitz"]');
  check(await p.$("#race #rme") && await p.$("#race #rghost") && await p.$("#race #tm"), "Rennstrecke mit Hund, Geist und Zeitbalken");
  check(!(await p.$(".gbar #gdog")), "In der Blitzrunde nur ein Hund (der Läufer)");
  await mStep(p, true);
  await p.waitForTimeout(200);
  check((await ev(p, "window.__DE_M.R.passed || 0")) >= 1, "Überholen wird gemeldet");
  check((await p.textContent(".toast")).includes("überholt"), "Meldung: Du hast deinen Geist überholt");
  await shot(p, "race");
  await mStep(p, true); await mStep(p, true);
  await p.waitForSelector(".mresults", { timeout: 9000 });
  const m = await ev(p, "window.__DE_M.M()");
  check(m.blitzBest === 3 && m.blitzTrace.length === 3 && m.blitzTrace[0] < m.blitzTrace[2], "Neuer Rekord wird der neue Geist");
  // Deutschland: Geist läuft los
  await p.click('[data-act="home"]');
  await p.click('[data-act="subject"][data-v="de"]');
  await ev(p, "(window.__DE.S.blitzTrace = [200, 400, 600, 800], true)");
  await p.click("#more > summary");
  await p.click('[data-act="mode"][data-v="blitz"]');
  await p.waitForTimeout(1000);
  const left = await p.$eval("#rghost", (e) => e.style.left);
  check(/calc\((\d+(\.\d+)?)%/.test(left) && parseFloat(left.slice(5)) > 30, "Deutschland: Geist läuft mit dem alten Rekord (" + left + ")");
  await p.click('[data-act="quit"]');
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 6) Effekte: Ton steigt mit der Serie, fliegende Punkte, ruhiger Modus
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="subject"][data-v="math"]');
  await p.tap('[data-act="m-level"][data-v="k-mal"]');
  await mStep(p, true);
  check((await ev(p, "window.__DE_TONE.mult")) === 1, "Erste richtige Antwort: normaler Ton");
  await mAnswer(p, true);
  check(await p.$(".flyplus"), "Punkte fliegen zur Punktezahl");
  await p.waitForFunction(() => !document.querySelector(".mans.ok"), null, { timeout: 3000 });
  await mStep(p, true);
  const mult = await ev(p, "window.__DE_TONE.mult");
  check(mult > 1.1 && mult < 1.2, "Dritte richtige in Folge: Ton zwei Halbtöne höher (" + mult.toFixed(3) + ")");
  await mStep(p, false);
  await mStep(p, true);
  check((await ev(p, "window.__DE_TONE.mult")) === 1, "Nach einem Fehler beginnt die Tonleiter von vorn");
  await p.click('[data-act="m-quit"]');
  // ruhiger Modus
  await ev(p, "(window.__DE.S.calm = true, true)");
  await p.tap('[data-act="m-level"][data-v="k-mal"]');
  for (let k = 0; k < 5; k++) await mStep(p, true);
  check(!(await p.$(".flyplus")), "Ruhiger Modus: keine fliegenden Punkte");
  check(!(await p.$eval("#gdog", (e) => e.classList.contains("flip"))), "Ruhiger Modus: kein Salto bei 5 in Folge");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 7) Eltern: Boss-Schalter in beiden Reitern
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="settings"]');
  const box = await (await p.$("#gate")).boundingBox();
  await p.mouse.move(box.x + 20, box.y + 10); await p.mouse.down();
  await p.waitForSelector(".parents", { timeout: 3000 }); await p.mouse.up();
  check(await p.isChecked("#boss"), "Boss-Kämpfe sind an");
  await p.uncheck("#boss");
  check((await S(p)).bossOn === false, "Boss-Schalter (Deutschland) wirkt");
  await p.click('.ptabs [data-v="math"]');
  check(!(await p.isChecked("#m-boss")), "Kopfrechnen-Reiter zeigt denselben Schalter");
  await p.check("#m-boss");
  check((await S(p)).bossOn === true, "Boss-Schalter (Kopfrechnen) wirkt");
  await ctx.close();
}

// 8) Layout: Hund, Boss und Mein Hund ohne seitliches Scrollen
for (const [name, w, h] of [["iPad Air quer", 1180, 820], ["iPad Air hoch", 820, 1180], ["iPad mini quer", 1133, 744], ["Handy", 390, 844]]) {
  const { ctx, p } = await fresh({ width: w, height: h });
  const noH = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  const inView = (sel) => p.$$eval(sel, (els) => els.length > 0 && els.every((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1; }));
  check(await noH() && await inView(".petw"), `${name}: Startseite mit Hund, kein seitliches Scrollen`);
  await p.click('[data-act="subject"][data-v="math"]');
  await p.click('[data-act="m-mission"]');
  for (let k = 0; k < 10; k++) await mStep(p, true);
  check(await inView("#bossbar .boss") && await inView("#bossbar .hearts"), `${name}: Boss und Herzen sichtbar`);
  check(await inView(".mtask") && await inView(".numpad .key"), `${name}: Aufgabe und Ziffernblock beim Boss sichtbar`);
  check(await noH(), `${name}: Boss ohne seitliches Scrollen`);
  if (shots && /Handy|hoch/.test(name)) await shot(p, name.replace(/\s+/g, "-") + "-boss");
  await p.click('[data-act="m-quit"]');
  await p.click('[data-act="pet"]');
  check(await noH(), `${name}: Mein Hund ohne seitliches Scrollen`);
  if (shots && /Handy/.test(name)) await shot(p, name.replace(/\s+/g, "-") + "-pet");
  check(p.errors.length === 0, `${name}: keine Konsolenfehler ` + p.errors.join(" | "));
  await ctx.close();
}

// 6) Geschenk: 5000 Punkte einmalig, 24 Stunden dreifache Punkte (Zusatz wird nur im Zeitfenster gesammelt)
{
  const { ctx, p } = await fresh({ width: 1180, height: 820 }, { gift: true });
  check((await S(p)).gift === 5000 && (await ev(p, "window.__DE.totalXp()")) === 5000, "Geschenk: 5000 Punkte");
  const bo = (await S(p)).boost;
  check(bo && bo.mult === 3 && bo.until - Date.now() > 23 * 3600000, "Aufholbonus für 24 Stunden gesetzt");
  check((await ev(p, "(window.__DE.S.xp += 100, window.__DE.totalXp())")) === 5300, "Im Bonus zählen 100 Punkte dreifach (5300)");
  await ev(p, "(window.__DE.S.boost.until = Date.now() - 1, window.__DE.S.xp += 100, window.__DE.totalXp())");
  check((await ev(p, "window.__DE.totalXp()")) === 5400, "Nach dem Bonus zählen Punkte einfach (5400)");
  await p.click('[data-act="pet"]');
  check(!(await p.$(".boostline")), "Abgelaufener Bonus wird nicht mehr angezeigt");
  await ev(p, "(window.__DE.S.boost.until = Date.now() + 3600000, true)");
  await p.click('[data-act="home"]'); await p.click('[data-act="pet"]');
  check(await p.$(".boostline"), "Laufender Bonus steht beim Tier");
  await p.reload(); await p.waitForSelector("#app *");
  check((await S(p)).gift === 5000, "Geschenk kommt nur einmal (auch nach Neuladen)");
  await ctx.close();
}

await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "alle Begleiter-Tests ok");
process.exit(fails ? 1 : 0);
