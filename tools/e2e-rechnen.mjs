// Kopfrechnen: Fach wechseln, Turm, Fehler und Tipps, Tagestraining, Blitz, Test (einzeln und Blatt),
// Eltern-Übersicht, Tastatur, Layout auf iPad-Größen.
// Aufruf: node tools/e2e-rechnen.mjs [Ordner für Screenshots]
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
  await ctx.addInitScript((t) => { window.__DE_TEST = Object.assign({ gateMs: 150, pauseMs: 600, pauseAfterMin: 1e9, speakWaitMs: 50 }, t); }, test);
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.goto(url);
  await p.click('[data-act="skipname"]');
  return { ctx, p };
}
const shot = async (p, n) => { if (shots) await p.screenshot({ path: path.join(shots, "rechnen-" + n + ".png") }); };
const R = (p, expr) => p.evaluate(new Function("return (" + expr + ")"));
const ans = (p) => R(p, "String(window.__DE_M.R.cur.ans)");
async function keys(p, s) { for (const d of s) await p.tap(`.key[data-v="${d}"]`); }
async function answer(p, right = true) {
  const a = await ans(p);
  await keys(p, right ? a : String(Number(a) + 1));
  await p.tap('.key[data-v="ok"]');
}
// richtig antworten, bis das Ergebnis kommt
async function playRound(p, max = 60) {
  let n = 0;
  while (!(await p.$(".mresults")) && n < max) {
    const i = await R(p, "window.__DE_M.R.i");
    await answer(p, true);
    await p.waitForFunction((i) => document.querySelector(".mresults") || window.__DE_M.R.i !== i, i, { timeout: 5000 }).catch(() => {});
    n++;
  }
  return n;
}
async function openParents(p) {
  await p.click('[data-act="settings"]');
  const box = await (await p.$("#gate")).boundingBox();
  await p.mouse.move(box.x + 20, box.y + 10); await p.mouse.down();
  await p.waitForSelector(".parents", { timeout: 3000 }); await p.mouse.up();
}
const setM = (p, obj) => p.evaluate((o) => Object.assign(window.__DE_M.M().set, o), obj);

// 1) Fach wechseln, Turm, erste Runde, Stufe freischalten
{
  const { ctx, p } = await fresh();
  check((await p.$$(".subj")).length === 3, "Drei Fach-Reiter auf der Startseite");
  await p.click('[data-act="subject"][data-v="math"]');
  check(await p.$(".mhome"), "Kopfrechnen-Startseite");
  await p.reload();
  check(await p.$(".mhome"), "Fach bleibt nach Neuladen gewählt");
  check((await p.$$(".rung:not([disabled])")).length === 1, "Zu Beginn ist nur Stufe 1 offen");
  check((await p.$$(".rung")).length === 9, "9 Stufen im Turm (4 Teststufen + 5 Extras)");
  check((await p.$$(".rung .tag")).length === 5 && !!(await p.$(".ladder-sep")), "Extra-Stufen sind markiert und abgesetzt");
  check((await p.$$eval(".rung", (r) => r.slice(-4).map((x) => x.dataset.v).join(","))) === "stelle,z-mal,k-geteilt,k-mal", "Testpfad unten: 1×1 mal, 1×1 geteilt, Zehner/Hunderter, große Zahlen");
  await shot(p, "home");
  await p.tap('[data-act="m-level"][data-v="k-mal"]');
  check((await p.textContent("#cnt")) === "1 / 10", "Übungsrunde hat 10 Aufgaben");
  check((await p.$$(".numpad .key")).length === 12, "Ziffernblock mit 12 Tasten");
  await keys(p, "12"); await p.tap('.key[data-v="del"]');
  check((await p.textContent("#mans")) === "1", "Löschen nimmt die letzte Ziffer weg");
  await p.tap('.key[data-v="del"]');
  await shot(p, "task");
  await playRound(p);
  check((await p.textContent(".score")).trim() === "10 / 10", "Alles richtig: 10 / 10");
  check((await p.textContent(".gains")).includes("Stufe 2 ist frei"), "Ergebnis meldet: Stufe 2 ist frei");
  await shot(p, "result");
  await p.click('[data-act="home"]');
  check(!(await p.$('[data-v="k-geteilt"][disabled]')), "Stufe 2 jetzt offen");
  const m = await R(p, "window.__DE_M.M()");
  check(m.lv["k-mal"].stars >= 1 && m.xp > 100 && m.total === 10, "Sterne, Punkte und Anzahl gespeichert");
  check((await p.textContent(".chip")).includes("1"), "Serie zählt Rechentage mit");
  // gemeinsame Serie auch auf der Deutschland-Seite
  await p.click('[data-act="subject"][data-v="de"]');
  check((await p.$$eval(".chip", (c) => c.map((x) => x.textContent).join(" "))).includes("🔥 1"), "Deutschland-Seite zeigt dieselbe Serie");
  check((await p.$$eval(".home .mode", (els) => els.filter((e) => e.checkVisibility()).length)) <= 3, "Deutschland-Startseite unverändert ruhig");
  check(await p.evaluate(() => window.__DE.S.xp === 0), "Rechenpunkte zählen nicht als Deutschland-Punkte");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 2) Fehler: Tipp, zweiter Versuch, Lösung, Aufgabe kommt wieder; Tastatur
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="subject"][data-v="math"]');
  await p.tap('[data-act="m-level"][data-v="k-mal"]');
  const first = await R(p, "window.__DE_M.R.cur.key");
  await answer(p, false);
  check((await p.textContent("#fb")).startsWith("Nicht ganz."), "Erster Fehler: freundlicher Tipp");
  check((await p.textContent("#mans")) !== "", "falsche Zahl bleibt kurz stehen");
  // gleich nach dem Fehler weitertippen: die neue Ziffer geht nicht verloren
  await keys(p, "7");
  await p.waitForTimeout(700);
  check((await p.textContent("#mans")) === "7", "Schnell weitergetippte Ziffer bleibt stehen");
  await p.tap('.key[data-v="del"]');
  check((await p.textContent("#mans")) === "", "Feld wieder leer");
  await answer(p, false);
  check((await p.textContent("#fb")).startsWith("So geht's"), "Zweiter Fehler: Lösung mit Rechenweg");
  check((await p.textContent("#kok")) === "Weiter", "Knopf heißt jetzt Weiter");
  check((await p.textContent("#cnt")) === "1 / 11", "Aufgabe kommt später noch einmal (11 statt 10)");
  await shot(p, "solution");
  await p.keyboard.press("Enter");
  check((await R(p, "window.__DE_M.R.i")) === 1, "Enter auf der Tastatur geht weiter");
  // Tastatur: Ziffern und Enter
  const a = await ans(p);
  await p.keyboard.type(a); await p.keyboard.press("Enter");
  check((await p.textContent("#fb")).length > 0 && (await p.$(".mans.ok")), "Antwort über die Tastatur");
  await p.waitForFunction(() => window.__DE_M.R.i === 2);
  // Tipp-Knopf
  await p.tap('[data-act="m-tip"]');
  check((await p.textContent("#fb")).includes("💡"), "Tipp auf Knopfdruck");
  let sawRepeat = false;
  while (!(await p.$(".mresults"))) {
    const it = await R(p, "window.__DE_M.R.q[window.__DE_M.R.i]");
    if (it.repeat && it.t.key === first) { sawRepeat = true; check((await p.textContent("#fb")).includes("kennst du schon"), "Wiederholung wird angekündigt"); }
    const i = await R(p, "window.__DE_M.R.i");
    await answer(p, true);
    await p.waitForFunction((i) => document.querySelector(".mresults") || window.__DE_M.R.i !== i, i, { timeout: 5000 });
  }
  check(sawRepeat, "Falsche Aufgabe kam in derselben Runde wieder");
  check((await p.textContent(".score")).trim() === "9 / 10", "Gewertet wird der erste Versuch: 9 / 10");
  check(await p.$('[data-act="m-wrong"]'), "Knopf 'Nur die Fehler üben'");
  await p.click('[data-act="m-wrong"]');
  check((await p.textContent("#cnt")) === "1 / 1" && (await R(p, "window.__DE_M.R.cur.key")) === first, "Fehler-Runde mit genau der falschen Aufgabe");
  const f = await R(p, `window.__DE_M.M().facts[${JSON.stringify(first)}]`);
  check(f.w === 1 && f.last === "x", "Fehler in der Statistik gemerkt");
  await p.click('[data-act="m-quit"]');
  check(await p.$(".mhome"), "✕ führt zurück zur Startseite");
  check((await p.textContent(".weak")).length > 0, "Startseite zeigt 'Das üben wir noch'");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 3) Tagestraining: 3 Etappen, Bewegungspause, Abzeichen
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="subject"][data-v="math"]');
  await p.click('[data-act="m-mission"]');
  check((await p.textContent(".mlabel")).startsWith("Etappe 1"), "Etappe 1 startet");
  await playRound(p);
  check((await p.textContent(".results h1")).includes("Etappe 1 geschafft"), "Etappe 1 geschafft");
  await p.click('[data-act="m-pause"]');
  check(await p.$(".pause"), "Bewegungspause");
  await p.waitForSelector("#pdone:not([disabled])", { timeout: 3000 });
  await p.click("#pdone");
  check((await p.textContent(".mlabel")).startsWith("Etappe 2"), "Nach der Pause geht es mit Etappe 2 weiter");
  await playRound(p);
  await p.click('[data-act="m-mission"]');
  check((await p.textContent(".mlabel")).startsWith("Etappe 3"), "Etappe 3 (Tempo)");
  await playRound(p);
  check((await p.textContent(".results h1")).includes("Tagestraining geschafft"), "Tagestraining geschafft");
  const m = await R(p, "window.__DE_M.M()");
  const S = await R(p, "window.__DE.S");
  check(m.missionsDone === 1 && S.badges.m_mission1 && S.badges.m_start, "Training gezählt, Abzeichen vergeben");
  check(S.badges.m_combo, "Abzeichen für 10 richtig hintereinander");
  await p.click('[data-act="home"]');
  check(await p.$(".mhome .done-msg"), "Startseite: für heute geschafft");
  await p.click('[data-act="badges"]');
  check((await p.textContent(".bgroup")).includes("Kopfrechnen"), "Abzeichen-Seite zeigt zuerst Kopfrechnen");
  check((await p.$$(".bgroup")).length === 3, "Abzeichen nach Fach gegliedert");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 4) Blitzrunde
{
  const { ctx, p } = await fresh(undefined, { blitzMs: 4000 });
  await p.click('[data-act="subject"][data-v="math"]');
  await p.click('[data-act="m-blitz"]');
  check(await p.$("#tm"), "Blitz hat einen Zeitbalken");
  for (let k = 0; k < 3; k++) { const i = await R(p, "window.__DE_M.R.i"); await answer(p, true); await p.waitForFunction((i) => window.__DE_M.R.i !== i || document.querySelector(".mresults"), i); }
  await answer(p, false);
  await p.waitForSelector(".mresults", { timeout: 8000 });
  check((await p.textContent(".score")).includes("richtig"), "Blitz endet nach Ablauf der Zeit");
  check((await R(p, "window.__DE_M.M().blitzBest")) >= 3, "Blitz-Rekord gespeichert");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 5) Test-Training einzeln: Zeit läuft ab, es geht von allein weiter; Note; nur hören
{
  const { ctx, p } = await fresh(undefined, { testSecMs: 1200 });
  await p.click('[data-act="subject"][data-v="math"]');
  await setM(p, { testN: 10, testRead: false, unlockAll: true });
  await p.click('[data-act="m-test"]');
  check((await p.$$('[data-act="m-teststart"]')).length === 2, "Test: Auswahl Einzeln oder Blatt");
  await p.click('[data-act="m-teststart"][data-v="ansage"]');
  check(await p.$("#tbar:not([hidden])"), "Zeitbalken pro Aufgabe");
  const levels = await R(p, "[...new Set(window.__DE_M.R.q.map((x) => x.t.level))]");
  check(levels.length >= 2 && !levels.includes("gross"), "Test mischt die Stufen, ohne 11er–19er: " + levels.join(","));
  for (let k = 0; k < 3; k++) { const i = await R(p, "window.__DE_M.R.i"); await answer(p, true); await p.waitForFunction((i) => window.__DE_M.R.i !== i, i); }
  check(!(await p.$(".feedback.ok")), "Im Test kein richtig/falsch zwischendurch");
  await p.waitForSelector(".mresults", { timeout: 25000 });
  check((await p.textContent(".score")).trim() === "3 von 10", "Nicht beantwortete Aufgaben zählen als falsch: 3 von 10");
  check((await p.textContent(".hero p")).includes("Note"), "Test zeigt Note zur Orientierung");
  check((await p.textContent(".listcols")).includes("keine Antwort"), "Liste zeigt 'keine Antwort'");
  check((await R(p, "window.__DE_M.M().tests.length")) === 1, "Test im Verlauf");
  await shot(p, "test-result");
  // nur hören
  await setM(p, { testRead: true, listenOnly: true });
  await p.click('[data-act="m-again"]');
  check(await p.$(".mq.listen"), "Nur hören: Aufgabe wird nicht angezeigt");
  await p.click('[data-act="m-quit"]');
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 6) Test-Training als Blatt
{
  const { ctx, p } = await fresh(undefined, { sheetMs: 60000 });
  await p.click('[data-act="subject"][data-v="math"]');
  await setM(p, { testN: 10, unlockAll: true });
  await p.click('[data-act="m-test"]');
  await p.click('[data-act="m-teststart"][data-v="sheet"]');
  check((await p.$$(".scell")).length === 10, "Blatt mit 10 Aufgaben");
  check(await p.$("#sc0.sel"), "Erstes Feld ist ausgewählt");
  const q = await R(p, "window.__DE_M.R.q.map((x) => x.t.ans)");
  // 8 richtig, Nr. 3 falsch, Nr. 10 leer; ✓ springt zum nächsten leeren Feld
  for (let i = 0; i < 9; i++) {
    await keys(p, String(i === 2 ? q[i] + 1 : q[i]));
    await p.tap('.key[data-v="ok"]');
  }
  check(await p.$("#sc9.sel"), "✓ springt zum nächsten Feld");
  await p.tap("#sc2");
  check(await p.$("#sc2.sel"), "Feld antippen wählt es aus");
  await shot(p, "sheet");
  await p.click('[data-act="m-hand"]');
  await p.waitForSelector(".mresults");
  check((await p.textContent(".score")).trim() === "8 von 10", "Blatt ausgewertet: 8 von 10");
  check((await p.$$(".sgrid.done .scell.bad")).length === 2, "Blatt zeigt 2 Fehler rot");
  await shot(p, "sheet-result");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}
{
  const { ctx, p } = await fresh(undefined, { sheetMs: 1200 });
  await p.click('[data-act="subject"][data-v="math"]');
  await p.click('[data-act="m-test"]');
  await p.click('[data-act="m-teststart"][data-v="sheet"]');
  await p.waitForSelector(".mresults", { timeout: 5000 });
  check((await p.textContent(".score")).trim().startsWith("0 von"), "Blatt wird nach Ablauf der Zeit automatisch abgegeben");
  await ctx.close();
}

// 7) Eltern-Übersicht Kopfrechnen
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="subject"][data-v="math"]');
  await p.tap('[data-act="m-level"][data-v="k-mal"]');
  await answer(p, false); await answer(p, false); await p.tap('.key[data-v="ok"]');
  await playRound(p);
  await p.click('[data-act="home"]');
  await openParents(p);
  check(await p.$('.ptabs [data-v="math"][aria-pressed="true"]'), "Eltern-Übersicht öffnet beim gewählten Fach");
  check((await p.$$(".x1 td")).length === 81, "1×1-Tabelle mit 81 Feldern");
  check((await p.$$(".x1 td.bad")).length >= 1 && (await p.$$(".x1 td.good")).length >= 1, "Tabelle zeigt Fehler und Sicheres");
  check((await p.textContent(".parents")).includes("Wackelt noch"), "Liste 'Wackelt noch'");
  await shot(p, "parents");
  await p.selectOption("#m-tn", "30");
  await p.selectOption("#m-ts", "5");
  await p.selectOption("#m-tm", "sheet");
  await p.uncheck("#m-extras");
  await p.fill("#m-td", "2026-12-01");
  await p.dispatchEvent("#m-td", "change");
  await p.check("#m-calm");
  const s = await R(p, "window.__DE_M.M().set");
  check(s.testN === 30 && s.testSec === 5 && s.testMode === "sheet" && s.extras === false && s.testDate === "2026-12-01", "Einstellungen gespeichert");
  check(await p.evaluate(() => document.body.classList.contains("calm")), "Ruhiger Modus aus dem Kopfrechnen-Teil");
  await p.click('.ptabs [data-v="de"]');
  check((await p.textContent(".parents")).includes("Bereit für die LZK"), "Reiter Deutschland zeigt die LZK-Übersicht");
  await p.click('[data-act="home"]');
  check((await p.$$(".rung")).length === 4 && !(await p.$(".ladder-sep")), "Extra-Stufen ausgeschaltet: nur die 4 Teststufen");
  check((await p.textContent(".chips")).includes("Test in"), "Startseite zählt die Tage bis zum Test");
  await p.reload();
  check((await R(p, "window.__DE_M.M().set.testN")) === 30, "Einstellungen überstehen Neuladen");
  // Zurücksetzen (zweimal tippen)
  await openParents(p);
  await p.click('[data-act="m-reset"]');
  check((await R(p, "window.__DE_M.M().total")) > 0, "Erster Tipp löscht noch nichts");
  await p.click('[data-act="m-reset"]');
  check((await R(p, "window.__DE_M.M().total")) === 0 && (await R(p, "!window.__DE.S.badges.m_start")), "Kopfrechnen zurückgesetzt");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}

// 7b) Wie der Kopfrechentest der Klasse: Blatt, 20 Aufgaben, 7 Minuten, gleiche Mischung; große Zahlen eintippen
{
  const { ctx, p } = await fresh(undefined, { sheetMs: 60000 });
  await p.click('[data-act="subject"][data-v="math"]');
  const s = await R(p, "window.__DE_M.M().set");
  check(s.testMode === "sheet" && s.testN === 20 && s.sheetMin === 7 && s.testLevels === "schule", "Standard: Blatt, 20 Aufgaben, 7 Minuten, wie in der Klasse");
  check((await p.textContent('[data-act="m-test"]')).includes("20 Aufgaben in 7 Minuten"), "Startseite: 20 Aufgaben in 7 Minuten");
  await p.click('[data-act="m-test"]');
  check((await p.$eval('[data-act="m-teststart"]', (b) => b.dataset.v)) === "sheet", "Test-Fenster: Blatt steht zuerst");
  await p.click('[data-act="m-teststart"][data-v="sheet"]');
  const q = await R(p, "window.__DE_M.R.q.map((x) => x.t)");
  const lv = (id) => q.filter((t) => t.level === id).length;
  check(q.length === 20 && lv("k-mal") === 9 && lv("z-mal") === 4 && lv("stelle") === 1 && lv("k-geteilt") === 6, "Mischung wie in der Klasse (9 · 1×1, 4 · Zehner/Hunderter, 1 · große Zahl, 6 · geteilt)");
  // große Zahl: 6 Stellen eintippen, mit Tausenderpunkten angezeigt
  const k = q.findIndex((t) => t.level === "stelle");
  await p.evaluate((k) => { const r = window.__DE_M.R; r.q[k].t = window.__DE_M.RL.task("stelle", 200000, "+", 20000); document.querySelector("#sc" + k + " .sq").textContent = window.__DE_M.RL.show(r.q[k].t) + " ="; }, k);
  await p.tap("#sc" + k);
  for (const d of "220000") await p.tap(`.key[data-v="${d}"]`);
  check((await p.textContent("#sa" + k)) === "220.000", "6 Stellen eingetippt, angezeigt als 220.000");
  check((await p.textContent("#sc" + k + " .sq")).includes("200.000 + 20.000"), "Aufgabe mit Tausenderpunkten wie auf dem Blatt");
  await p.click('[data-act="m-hand"]');
  await p.waitForSelector(".mresults");
  check((await p.textContent(".sgrid.done")).includes("220.000"), "Auswertung zeigt 220.000");
  check(await p.evaluate((k) => window.__DE_M.R.results[k].ok, k), "Große Zahl richtig gewertet");
  check(p.errors.length === 0, "keine Konsolenfehler " + p.errors.join(" | "));
  await ctx.close();
}
// 7c) Alte Einstellungen (Version 1) werden einmalig auf den echten Test umgestellt
{
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, serviceWorkers: "block" });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem("x")) { sessionStorage.setItem("x", "1"); localStorage.setItem("deutschland-entdecker-v1", JSON.stringify({ askedName: true, subject: "math", math: { xp: 90, lv: { "k-mal": { recent: [], stars: 2, n: 30 } }, set: { roundLen: 5, gross: false, testMode: "ansage", testN: 20, sheetMin: 5, testLevels: "auto", testDate: "2026-11-20" } } })); } });
  const p = await ctx.newPage();
  await p.goto(url);
  await p.waitForSelector(".mhome");
  const m = await R(p, "window.__DE_M.M()");
  check(m.set.v === 2 && m.set.testMode === "sheet" && m.set.sheetMin === 7 && m.set.testLevels === "schule", "Version 1 -> Blatt, 7 Minuten, wie in der Klasse");
  check(m.set.roundLen === 5 && m.set.testDate === "2026-11-20" && m.set.extras === false && m.lv["k-mal"].stars === 2 && m.xp === 90, "eigene Einstellungen, Sterne und Punkte bleiben; Zusatzstufe aus -> Extras aus");
  // spätere Wahl bleibt (nicht bei jedem Start zurückgestellt)
  await p.click('[data-act="m-test"]');
  await p.click('[data-act="m-teststart"][data-v="ansage"]');
  await p.click('[data-act="m-quit"]');
  await p.reload(); await p.waitForSelector(".mhome");
  check((await R(p, "window.__DE_M.M().set.testMode")) === "ansage", "Umstellung nur einmal: spätere Wahl bleibt");
  await ctx.close();
}

// 8) Layout: Aufgabe und Ziffernblock ohne Scrollen, kein seitliches Scrollen
const DEVICES = [["iPad Air quer", 1180, 820], ["iPad Air hoch", 820, 1180], ["iPad mini quer", 1133, 744], ["iPad mini hoch", 744, 1133], ["iPad 9 quer", 1080, 810], ["Handy", 390, 844]];
for (const [name, w, h] of DEVICES) {
  const { ctx, p } = await fresh({ width: w, height: h });
  const noH = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  const inView = (sel) => p.$$eval(sel, (els) => els.every((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1; }));
  await p.click('[data-act="subject"][data-v="math"]');
  check(await noH(), `${name}: Startseite ohne seitliches Scrollen`);
  if (h < 900 && w > h) check(await inView(".mission .mode.big"), `${name}: Tagestraining-Knopf sofort sichtbar`);
  await setM(p, { unlockAll: true });
  await p.click('[data-act="subject"][data-v="math"]'); // neu zeichnen
  await p.tap('[data-act="m-level"][data-v="zz"]');
  check(await inView(".mtask"), `${name}: Aufgabe sichtbar`);
  check(await inView(".numpad .key"), `${name}: ganzer Ziffernblock sichtbar`);
  await answer(p, false); await answer(p, false);
  check(await inView("#kok"), `${name}: Weiter-Knopf nach Lösung sichtbar`);
  check(await noH(), `${name}: Aufgabe ohne seitliches Scrollen`);
  if (shots && /Handy|Air/.test(name)) await shot(p, name.replace(/\s+/g, "-") + "-task");
  await p.click('[data-act="m-quit"]');
  // ungünstigster Fall: 40 Aufgaben mit allen Stufen, jedes Feld mit dem vollen Ergebnis gefüllt
  await setM(p, { testN: 40, testLevels: "all" });
  await p.click('[data-act="m-test"]');
  await p.click('[data-act="m-teststart"][data-v="sheet"]');
  check(await inView(".spad .key"), `${name}: Blatt: Ziffernblock sichtbar`);
  check(await inView("#sc0"), `${name}: Blatt: erste Aufgabe sichtbar`);
  await p.evaluate(() => window.__DE_M.R.q.forEach((x, i) => { document.getElementById("sa" + i).textContent = x.t.ans; }));
  check(await noH(), `${name}: Blatt ohne seitliches Scrollen`);
  if (shots && /Handy|hoch/.test(name)) await shot(p, name.replace(/\s+/g, "-") + "-sheet");
  check(p.errors.length === 0, `${name}: keine Konsolenfehler ` + p.errors.join(" | "));
  await ctx.close();
}

await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "alle Kopfrechnen-Tests ok");
process.exit(fails ? 1 : 0);
