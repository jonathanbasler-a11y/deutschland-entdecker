// Kompass 4: Fach wechseln, Plan nach Datum, Startcheck, Trainingstag mit 3 Etappen und Boss,
// alle Aufgabentypen richtig und falsch, Übung je Bereich, Speicher, Eltern-Übersicht, iPad-Größen.
// Aufruf: node tools/e2e-kompass.mjs [Ordner für Screenshots]
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

async function fresh(day, size = { width: 1180, height: 820 }, test = {}) {
  const ctx = await b.newContext({ viewport: size, hasTouch: true, serviceWorkers: "block" });
  await ctx.addInitScript((t) => { window.__DE_TEST = Object.assign({ gateMs: 150, pauseMs: 600, pauseAfterMin: 1e9, kSeed: 1000 }, t); }, test);
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date(day + "T16:00:00"));
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.goto(url);
  await p.click('[data-act="skipname"]');
  await p.click('[data-act="subject"][data-v="kompass"]');
  return { ctx, p };
}
const shot = async (p, n) => { if (shots) await p.screenshot({ path: path.join(shots, "kompass-" + n + ".png") }); };
const cur = (p) => p.evaluate(() => { const r = window.__DE_K.R; return r && r.cur ? JSON.parse(JSON.stringify(r.cur)) : null; });
const sol = (p) => p.evaluate(() => window.__DE_K.K.solution(window.__DE_K.R.cur));
async function keys(p, s) { for (const d of s) await p.tap(`.key[data-v="${d}"]`); }

// aktuelle Aufgabe beantworten (richtig oder falsch), egal welcher Typ
async function answer(p, right = true) {
  const t = await cur(p);
  if (t.type === "num") {
    let s = (await sol(p)).replace(/ .*$/, "").replace(/\./g, "");
    if (!right) s = String(Number(s.replace(",", ".")) + 1).replace(".", ",");
    await keys(p, s);
    return p.tap('.key[data-v="ok"]');
  }
  if (t.type === "choice") {
    if (right) return p.tap(`.kopts .opt[data-v="${t.ans}"]`);
    // eine falsche Antwort, die noch nicht gesperrt ist
    const i = await p.evaluate((a) => [...document.querySelectorAll(".kopts .opt")].map((b) => +b.dataset.v).find((v) => v !== a && !document.querySelector(`.kopts .opt[data-v="${v}"]`).disabled), t.ans);
    return p.tap(`.kopts .opt[data-v="${i}"]`);
  }
  if (t.type === "pick" || t.type === "multi") {
    const n = (t.tokens || t.opts).length;
    const want = right ? t.ans : [...Array(n).keys()].filter((i) => !t.ans.includes(i)).slice(0, 1);
    for (const i of want) await p.tap(`[data-act="k-tog"][data-v="${i}"]`);
    return p.tap("#kgo");
  }
  if (t.type === "order") {
    const pool = await p.evaluate(() => window.__DE_K.R.pool);
    const seq = right ? t.items : t.items.slice().reverse();
    for (const x of seq) await p.tap(`[data-act="k-ord"][data-v="${pool.indexOf(x)}"]`);
    return p.tap("#kgo");
  }
  if (t.type === "write") { await p.fill("#kwi", right ? t.ans[0] : "xyz"); return p.press("#kwi", "Enter"); }
  if (t.type === "tf") {
    for (let i = 0; i < t.rows.length; i++) await p.tap(`[data-act="k-tf"][data-v="${i}:${(right ? t.rows[i].ok : !t.rows[i].ok) ? 1 : 0}"]`);
    return p.tap("#kgo");
  }
  if (t.type === "match") {
    for (let i = 0; i < t.left.length; i++) {
      if (right) { for (const j of t.ans[i]) await p.tap(`[data-act="k-mat"][data-v="${i}:${j}"]`); continue; }
      // falsch: in Zeile 0 eine falsche Antwort wählen, die anderen leer lassen
      if (i === 0) { const j = t.right.findIndex((_, k) => !t.ans[0].includes(k)); await p.tap(`[data-act="k-mat"][data-v="0:${j >= 0 ? j : 0}"]`); }
    }
    return p.tap("#kgo");
  }
  if (t.type === "cut") {
    const want = right ? t.ans : [t.ans.includes(0) ? 1 : 0];
    for (const i of want) await p.tap(`[data-act="k-gap"][data-v="${i}"]`);
    return p.tap("#kgo");
  }
  if (t.type === "nums") {
    for (let i = 0; i < t.fields.length; i++) {
      const a = t.fields[i].ans, s = String(right || i > 0 ? a : t.digit ? (a + 1) % 10 : a + 1);
      await keys(p, s.replace(/\D/g, ""));
      if (!t.digit && i < t.fields.length - 1) await p.tap('.key[data-v="ok"]');
    }
    return p.tap('.key[data-v="ok"]');
  }
  if (t.type === "grid") {
    if (right) for (const c of t.ans) await p.tap(`[data-act="k-cell"][data-v="${c.join(",")}"]`);
    else {
      const used = new Set([...t.given, ...t.ans].map((c) => c.join(",")));
      let wrong = null;
      for (let x = 0; x < t.cols && !wrong; x++) for (let y = 0; y < t.rows && !wrong; y++) if (!used.has(x + "," + y)) wrong = x + "," + y;
      await p.tap(`[data-act="k-cell"][data-v="${wrong}"]`);
    }
    return p.tap("#kgo");
  }
  if (t.type === "self") {
    await p.fill("#kst", "meine Antwort");
    await p.tap('[data-act="k-self-go"]');
    return p.tap(`[data-act="k-self"][data-v="${right ? 1 : 0}"]`);
  }
  throw new Error("unbekannter Typ " + t.type);
}
const view = (p) => p.evaluate(() => window.__DE.S && document.querySelector(".kresults") ? "results" : document.querySelector(".kgame") ? "game" : "other");
async function playRound(p, max = 80) {
  let n = 0;
  while ((await view(p)) === "game" && n < max) {
    const i = await p.evaluate(() => window.__DE_K.R.i);
    await answer(p, true);
    await p.waitForFunction((i) => document.querySelector(".kresults") || window.__DE_K.R.i !== i, i, { timeout: 6000 }).catch(() => {});
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

// 1) Startseite am 6.11.: Plan, Startcheck
{
  const { ctx, p } = await fresh("2026-11-06");
  check((await p.$$(".kcal li")).length === 14, "Plan hat 14 Tage (6.–19.11.)");
  check((await p.textContent(".kcal li.cur")).includes("6."), "Heute (6.11.) ist markiert");
  check((await p.textContent(".chip.lzk")).includes("12 Tagen"), "Countdown: Kompass in 12 Tagen");
  check(!!(await p.$('[data-act="k-check"]')), "Heute: Startcheck");
  check((await p.$$(".karea")).length === 8 && (await p.$$(".karea[disabled]")).length === 0, "8 Bereiche, alle bereit");
  await shot(p, "home");
  await p.click('[data-act="k-check"]');
  check((await p.textContent("#cnt")) === "1 / 16", "Startcheck: 16 Aufgaben");
  await shot(p, "check-1");
  // ein Fehler im Startcheck: nur ein Versuch, Lösung wird gezeigt
  await answer(p, false);
  check(!!(await p.$("#knx")) && (await p.textContent("#fb")).includes("Lösung"), "Startcheck: ein Versuch, dann Lösung");
  await p.tap("#knx");
  const n = await playRound(p);
  check((await view(p)) === "results" && n === 15, `Startcheck endet nach 16 Aufgaben (${n + 1})`);
  check((await p.textContent(".hero h1")).includes("Startcheck geschafft"), "Startcheck geschafft");
  check((await p.textContent(".hero .score")) === "15 / 16", "15 von 16 richtig");
  await shot(p, "check-result");
  const st = await p.evaluate(() => window.__DE.S);
  check(st.kompass.done["2026-11-06"] && st.badges.k_check, "Plan-Tag erledigt, Abzeichen Kompass-Start");
  check(Object.keys(st.kompass.comp).length >= 14, "Fortschritt je Aufgabenart gespeichert");
  await p.click('[data-act="home"]');
  check((await p.textContent(".kcal li.cur")).includes("✓") && !!(await p.$(".done-msg")), "Startseite: heute erledigt");
  await p.reload();
  check((await p.evaluate(() => window.__DE.S.kompass.total)) === 16 && !!(await p.$(".khome")), "Speicher übersteht Neuladen, Fach bleibt gewählt");
  check(p.errors.length === 0, "keine Konsolenfehler (Startcheck) " + p.errors.join(" | "));
  await ctx.close();
}

// 2) Trainingstag 11.11.: 3 Etappen mit Boss und Bewegungspause
{
  const { ctx, p } = await fresh("2026-11-11", undefined, { kRoundLen: 3 });
  check((await p.textContent(".mission h2")).includes("Training") && (await p.$$(".mission .path li")).length === 4, "Trainingstag: Pfad mit 3 Etappen");
  await p.click('[data-act="k-mission"]');
  check((await p.textContent(".mlabel")).includes("Etappe 1 · Deutsch"), "Etappe 1: Deutsch");
  const comps1 = [];
  for (let i = 0; i < 3; i++) { comps1.push((await cur(p)).comp); const j = await p.evaluate(() => window.__DE_K.R.i); await answer(p, true); await p.waitForFunction((j) => window.__DE_K.R.i !== j || document.querySelector(".kresults"), j, { timeout: 6000 }); }
  check(comps1.every((c) => c.startsWith("de.")), "Etappe 1 nur Deutsch: " + comps1.join(", "));
  check(await p.evaluate(() => !!window.__DE_K.R.boss), "Boss erscheint am Ende der Etappe");
  await shot(p, "boss");
  await playRound(p);
  check((await p.textContent(".hero h1")).includes("Etappe 1 geschafft"), "Etappe 1 geschafft");
  check((await p.textContent(".gains")).includes("besiegt"), "Boss besiegt");
  await p.click('[data-act="k-pause"]');
  // Uhr steht im Test fest: Pause überspringen (gleicher Weg wie "Fertig")
  check((await p.textContent(".pause h1")) === "Bewegungspause", "Bewegungspause zwischen den Etappen");
  await p.click('[data-act="pausedone"]:not(#pdone)');
  check((await p.textContent(".mlabel")).includes("Etappe 2 · Mathe"), "nach der Pause: Etappe 2 Mathe");
  check((await cur(p)).comp.startsWith("ma."), "Etappe 2 ist Mathe");
  await playRound(p);
  await p.click('[data-act="k-mission"]');
  check((await p.textContent(".mlabel")).includes("Etappe 3 · Gemischt"), "Etappe 3 gemischt");
  await playRound(p);
  check((await p.textContent(".hero h1")).includes("Für heute geschafft"), "Für heute geschafft");
  check(await p.evaluate(() => window.__DE.S.kompass.done["2026-11-11"] === true && window.__DE.S.kompass.missionsDone === 1), "Tag im Plan abgehakt");
  check(await p.evaluate(() => window.__DE.S.pet.blocks >= 9), "Blöcke für den Hund");
  check(p.errors.length === 0, "keine Konsolenfehler (Training) " + p.errors.join(" | "));
  await ctx.close();
}

// 3) Jede Aufgabenart: richtig, einmal falsch (Tipp), zweimal falsch (Lösung, kommt wieder)
{
  const { ctx, p } = await fresh("2026-11-12");
  const seenTypes = new Set();
  for (const area of ["de.sprache", "ma.zahlen", "ma.groessen", "ma.muster"]) {
    // „Zahlen ordnen“ (Reihenfolge) kommt zufällig: dort so lange üben, bis sie dran war
    for (let round = 0; area === "ma.zahlen" ? round < 15 && !seenTypes.has("order") : round < 3; round++) {
      await p.click(`[data-act="k-area"][data-v="${area}"]`);
      for (let k = 0; k < 40 && (await view(p)) === "game"; k++) {
        const t = await cur(p);
        if (!seenTypes.has(t.type)) {
          seenTypes.add(t.type);
          await answer(p, false);
          const hint = await p.textContent("#fb");
          check(hint.includes("💡") && !(await p.$("#knx")), `${t.type}: erster Fehler gibt Tipp (${t.comp})`);
          await answer(p, false);
          check(!!(await p.$("#knx")) && (await p.textContent("#fb")).includes("Lösung"), `${t.type}: zweiter Fehler zeigt Lösung`);
          check((await p.$$eval("button", (bs) => bs.filter((x) => x.textContent.trim() === "Weiter").length)) === 1, `${t.type}: genau ein Weiter-Knopf`);
          if (t.type === "num") check((await p.textContent("#mans")).replace(/\./g, "") === (await sol(p)).replace(/ .*$/, "").replace(/\./g, ""), "Zahl: Lösung steht im Feld");
          await shot(p, "solution-" + t.type);
          const len = await p.evaluate(() => window.__DE_K.R.q.length);
          await p.tap("#knx");
          check((await p.evaluate(() => window.__DE_K.R.q.some((x) => x.repeat))) && len >= 7, `${t.type}: Aufgabe kommt noch einmal`);
          continue;
        }
        const i = await p.evaluate(() => window.__DE_K.R.i);
        await answer(p, true);
        await p.waitForFunction((i) => document.querySelector(".kresults") || window.__DE_K.R.i !== i, i, { timeout: 6000 }).catch(() => {});
      }
      await p.click('[data-act="home"]');
    }
  }
  check(["num", "choice", "pick", "order", "write"].every((x) => seenTypes.has(x)), "alle Aufgabentypen vorgekommen: " + [...seenTypes].join(", "));
  // Geld mit Komma
  const money = await p.evaluate(() => { const K = window.__DE_K.K; for (let s = 0; s < 200; s++) { const t = K.task("ma.geld", s); if (t.money) return s; } return -1; });
  check(money >= 0, "Geld-Aufgabe mit Komma gefunden");
  check(p.errors.length === 0, "keine Konsolenfehler (Aufgabentypen) " + p.errors.join(" | "));
  await ctx.close();
}

// 3b) Neue Aufgabentypen gezielt: verbinden, trennen, selbst prüfen, Lesetext
{
  const { ctx, p } = await fresh("2026-11-12");
  const back = async () => { await p.click('[data-act="k-quit"]'); await p.click('[data-act="subject"][data-v="kompass"]').catch(() => {}); };
  const cases = [["de.satzmatch", "match"], ["de.zeitmatch", "match"], ["de.satzcut", "cut"], ["de.recht.trenne", "write"], ["de.recht.gross", "pick"], ["de.recht.rede", "choice"],
    ["ma.raum.spiegeln", "grid"], ["ma.raum.netzergaenzen", "grid"], ["ma.raum.netz", "multi"], ["ma.raum.ansicht", "choice"], ["ma.raum.gleichesgebaeude", "choice"], ["ma.raum.gebaeude", "num"], ["ma.raum.flaeche", "num"],
    ["ma.nachbarstelle", "nums"], ["ma.tafelwort", "nums"], ["ma.plaettchen", "*"], ["ma.strahllesen", "*"], ["ma.zahlwortschreiben", "write"], ["ma.verwechsel", "choice"],
    ["ma.daten.balkenzeichnen", "grid"], ["ma.daten.zufall", "choice"], ["ma.daten.diagramm", "choice"], ["ma.einheit", "match"], ["ma.uhr", "choice"]];
  for (const [id, type] of cases) {
    await p.evaluate((id) => window.__DE_K.play([id]), id);
    check(type === "*" || (await cur(p)).type === type, `${id}: Typ ${type}`);
    await answer(p, false);
    check((await p.textContent("#fb")).includes("💡"), `${id}: erster Fehler gibt Tipp`);
    await answer(p, false);
    check(!!(await p.$("#knx")) && (await p.textContent("#fb")).includes("Lösung"), `${id}: zweiter Fehler zeigt Lösung`);
    check((await p.$$eval("button", (bs) => bs.filter((x) => x.textContent.trim() === "Weiter").length)) === 1, `${id}: genau ein Weiter-Knopf`);
    await shot(p, "solution-" + id);
    await back();
    await p.evaluate((id) => window.__DE_K.play([id]), id);
    await answer(p, true);
    check(!!(await p.$(".kcard.good")), `${id}: richtig wird grün`);
    await back();
  }
  // Lesetext (Original 2025): Kurzantwort zum Selbstprüfen, dann stimmt / stimmt nicht
  await p.evaluate(() => window.__DE_K.play(["de.lesen.kaugummi"]));
  check(!!(await p.$("#kpass:not([hidden])")) && (await p.textContent("#kpass")).includes("Kaugummi"), "Lesetext steht über der Frage");
  check((await p.textContent("#kpass .ksrc")).includes("IBBW"), "Quelle des Originaltexts steht dabei");
  check((await p.textContent("#kpass .ln")) === "5", "Zeilennummer 5 steht am Rand");
  check((await cur(p)).type === "self", "Kaugummi 1: Kurzantwort zum Selbstprüfen");
  await p.fill("#kst", "Um die Zähne gesund zu halten.");
  await p.tap('[data-act="k-self-go"]');
  check((await p.textContent(".kmodel")).includes("Zähne"), "Musterlösung wird gezeigt");
  await p.tap('[data-act="k-self"][data-v="1"]');
  check(!!(await p.$(".kcard.good")), "Selbstprüfung: Ja zählt als richtig");
  await p.waitForFunction(() => window.__DE_K.R.i === 1, null, { timeout: 4000 });
  check((await cur(p)).type === "tf" && (await p.textContent(".ktf")).includes("stimmt nicht"), "Kaugummi 2: stimmt / stimmt nicht");
  await shot(p, "lesen-tf");
  const n = await playRound(p);
  check((await view(p)) === "results", `Leseeinheit endet mit Ergebnis (${n + 2} Fragen)`);
  check(await p.evaluate(() => window.__DE.S.kompass.comp["de.lesen.kaugummi"].n === 7), "Fortschritt je Text gespeichert (7 Fragen)");
  await p.click('[data-act="home"]');
  // Bereich Lesen startet den am wenigsten geübten Text
  await p.click('[data-act="k-area"][data-v="de.lesen"]');
  const lab = await p.textContent(".mlabel");
  check(/Lesetext/.test(lab) && !lab.includes("Kaugummi"), "Lesen: nächster Text ist ein anderer: " + lab);
  await shot(p, "lesen");
  check(p.errors.length === 0, "keine Konsolenfehler (neue Typen) " + p.errors.join(" | "));
  await ctx.close();
}

// 3c) Könnerblatt: Pflanzenstufen wie in der Schule, "Das übe ich als Nächstes" startet die Aufgabenart
{
  const { ctx, p } = await fresh("2026-11-12");
  await p.click('[data-act="k-konner"]');
  check(!!(await p.$(".konnerview")) && (await p.textContent(".konnerview h1")) === "Mein Könnerblatt", "Könnerblatt öffnet");
  check((await p.$$(".konnertab thead th")).length >= 10 && (await p.textContent(".konnertab thead")).includes("🌸"), "Stufen Samen bis Blume");
  check((await p.$$(".konnertab tbody tr:not(.area)")).length >= 100, "viele „Ich kann“-Zeilen (" + (await p.$$(".konnertab tbody tr:not(.area)")).length + ")");
  check((await p.textContent(".konnerview .muted")).includes("Noch nichts"), "Ohne Übung: noch nichts zu üben");
  // eine Aufgabenart falsch üben -> sie steht unter „Als Nächstes“
  await p.click('[data-act="home"]');
  await p.evaluate(() => window.__DE_K.play(["ma.nachbarstelle"]));
  await answer(p, false); await answer(p, false);
  await p.click('[data-act="k-quit"]'); await p.click('[data-act="subject"][data-v="kompass"]').catch(() => {});
  await p.click('[data-act="k-konner"]');
  check(!!(await p.$('.konnerview [data-act="k-comp"][data-v="ma.nachbarstelle"]')), "Falsch geübte Aufgabenart steht unter „Das übe ich als Nächstes“");
  check((await p.$$(".konnertab td.on")).length >= 1, "Pflanze der geübten Aufgabenart steht in der Tabelle");
  await p.click('.konnerview [data-act="k-comp"][data-v="ma.nachbarstelle"]');
  check((await cur(p)).comp === "ma.nachbarstelle", "Knopf startet genau diese Aufgabenart");
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Könnerblatt/Aufgabe ohne seitliches Scrollen");
  await shot(p, "konner");
  check(p.errors.length === 0, "keine Konsolenfehler (Könnerblatt) " + p.errors.join(" | "));
  await ctx.close();
}

// 4) Eltern-Übersicht und Hochformat
{
  const { ctx, p } = await fresh("2026-11-07", { width: 820, height: 1180 });
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Startseite hochkant: kein seitliches Scrollen");
  await shot(p, "home-portrait");
  await p.click('[data-act="k-mission"]');
  check((await p.textContent(".mlabel")).includes("Etappe"), "7.11.: kurze Etappe");
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Aufgabe hochkant: kein seitliches Scrollen");
  await shot(p, "task-portrait");
  await playRound(p);
  check(await p.evaluate(() => window.__DE.S.kompass.done["2026-11-07"] === true), "kurze Etappe erledigt den Tag");
  await p.click('[data-act="home"]');
  await openParents(p);
  const tabs = await p.$$('[data-act="ptab"]');
  for (const t of tabs) if ((await t.textContent()).includes("Kompass")) await t.click();
  check((await p.textContent(".parents")).includes("Kompass 4: Stand"), "Eltern-Übersicht: Kompass-Stand");
  await shot(p, "parents");
  check(p.errors.length === 0, "keine Konsolenfehler (Eltern) " + p.errors.join(" | "));
  await ctx.close();
}

// 5) Handy-Breite und LZK-Tag
{
  const { ctx, p } = await fresh("2026-11-10", { width: 390, height: 844 });
  check((await p.textContent(".mission h2")).includes("LZK-Tag"), "10.11.: LZK-Tag");
  await p.click('[data-act="k-mission"]');
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Handy: kein seitliches Scrollen");
  await playRound(p);
  check((await view(p)) === "results" && !(await p.evaluate(() => !!window.__DE_K.R.boss)), "Mut-Runde ohne Boss");
  check(p.errors.length === 0, "keine Konsolenfehler (Handy) " + p.errors.join(" | "));
  await ctx.close();
}

await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "alle Kompass-Tests ok");
process.exit(fails ? 1 : 0);
