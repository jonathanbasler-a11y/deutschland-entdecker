// Tagesmission, Bewegungspause, stumme Karte, Eltern-Übersicht, ruhiger Modus.
// Aufruf: node tools/e2e-features.mjs [Ordner für Screenshots]
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

async function fresh(size = { width: 1180, height: 820 }) {
  const ctx = await b.newContext({ viewport: size, hasTouch: true, serviceWorkers: "block" });
  await ctx.addInitScript(() => { window.__DE_TEST = { gateMs: 150, pauseMs: 600, pauseAfterMin: 1e9 }; });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.goto(url);
  await p.click('[data-act="skipname"]');
  return { ctx, p };
}
const shot = async (p, n) => { if (shots) await p.screenshot({ path: path.join(shots, n + ".png") }); };
const solName = (p) => p.evaluate(() => { const d = document.querySelector(".hl-poly, .hl-line").getAttribute("d"); return window.__DE.ITEMS.find((i) => i.d === d).name; });

async function answerRight(p) {
  const general = await p.$eval("#stage", (e) => e.classList.contains("general"));
  if (await p.$(".flagbox")) { for (const c of ["Schwarz", "Rot", "Gold"]) await p.click(`.fchip[data-n="${c}"]`); return; }
  if (await p.$(".opt")) {
    let sol;
    if (general) { const q = await p.textContent(".prompt h2"); sol = await p.evaluate((q) => { const g = window.__DE.ITEMS.find((i) => i.g && i.g.q === q).g; return g.options[g.correct]; }, q); }
    else sol = await solName(p);
    await p.click(`.opt:text-is("${sol}")`); return;
  }
  if (await p.$("#wi")) {
    let sol;
    if (general) { const q = await p.textContent("#wprompt"); sol = await p.evaluate((q) => { const w = window.__DE.ITEMS.find((i) => i.g && i.g.write && i.g.write.q === q).g.write; return w.num ? String(w.num[w.num.length - 2] || w.num[0]) : w.all ? w.all.join(" und ") : w.answers[0]; }, q); }
    else sol = await solName(p);
    await p.fill("#wi", sol); await p.press("#wi", "Enter"); return;
  }
  const nm = await p.textContent(".big");
  const [x, y] = await p.evaluate((nm) => {
    const it = window.__DE.ITEMS.find((i) => i.name === nm);
    const svg = document.querySelector(".stage .map");
    let x, y;
    const hit = svg.querySelector(`.hit[data-id="${it.id}"]:not(.lakehit):not(.dot)`);
    if (hit) { const pt = hit.getPointAtLength(hit.getTotalLength() / 2); x = pt.x; y = pt.y; } else [x, y] = it.label;
    const q = svg.createSVGPoint(); q.x = x; q.y = y; const r = q.matrixTransform(svg.getScreenCTM()); return [r.x, r.y];
  }, nm);
  await p.touchscreen.tap(x, y);
}
async function playRound(p, max = 30) {
  let n = 0;
  while (!(await p.$(".results")) && n < max) {
    const before = await p.textContent("#cnt");
    await answerRight(p);
    n++;
    await p.waitForFunction((b) => document.querySelector(".results") || (document.querySelector("#cnt") && document.querySelector("#cnt").textContent !== b), before, { timeout: 5000 }).catch(() => {});
  }
  return n;
}

// 1) Startseite: wenig auf einmal, Tagesmission mit 3 Etappen, Bewegungspause dazwischen
{
  const { ctx, p } = await fresh();
  await shot(p, "home");
  check(!(await p.$eval("#more", (d) => d.open)), "Selbst aussuchen ist zu Beginn zugeklappt");
  const visibleModes = await p.$$eval(".home .mode", (els) => els.filter((e) => e.checkVisibility()).length);
  check(visibleModes <= 3, `Startseite zeigt höchstens 3 große Knöpfe (${visibleModes})`);
  await p.click('[data-act="mission"]');
  check((await p.textContent("#cnt")) === "1 / 6", "Etappe 1 hat 6 Aufgaben");
  check(await p.$(".opt"), "Etappe 1 ist Auswählen");
  // Fokus nur bei Kartenfragen (Allgemeinwissen hat keine Karte)
  const focusOk = await p.evaluate(() => document.querySelector("#stage").classList.contains("general") || document.querySelector(".stage .map").classList.contains("focus"));
  check(focusOk, "Fokus: Karte außer Ziel abgedunkelt");
  await shot(p, "mission-1");
  await playRound(p);
  check((await p.textContent(".hero h1")).includes("Etappe 1 geschafft"), "Etappe 1 geschafft");
  check((await p.$$eval(".path li.done", (e) => e.length)) === 1, "Pfad zeigt 1 erledigte Etappe");
  await shot(p, "mission-result");
  await p.click('[data-act="pause"]');
  check((await p.textContent(".pause h1")) === "Bewegungspause", "Bewegungspause startet");
  check(await p.$eval("#pdone", (e) => e.disabled), "Fertig-Knopf erst nach Ablauf");
  await shot(p, "pause");
  await p.waitForSelector("#pdone:not([disabled])", { timeout: 3000 });
  await p.click("#pdone");
  check(await p.$(".big") && !(await p.$(".opt")), "Nach der Pause geht es mit Etappe 2 (Finden) weiter");
  await playRound(p);
  check((await p.textContent(".hero h1")).includes("Etappe 2 geschafft"), "Etappe 2 geschafft");
  await p.click('[data-act="mission"]');
  check(await p.$("#wi"), "Etappe 3 ist Schreiben");
  await playRound(p);
  check((await p.textContent(".hero h1")).includes("Tagesmission geschafft"), "Tagesmission geschafft");
  const st = await p.evaluate(() => window.__DE.S);
  check(st.missionsDone === 1 && st.badges.mission1, "Mission gezählt, Abzeichen vergeben");
  await p.click('[data-act="home"]');
  check(await p.$(".done-msg"), "Startseite zeigt: Mission für heute erledigt");
  check(p.errors.length === 0, "keine Konsolenfehler (Mission) " + p.errors.join(" | "));
  await ctx.close();
}

// 2) Stumme Karte: Schreiben, Fehler, Überspringen, Wortkasten, Fehler nochmal
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="blankpick"]'); await p.click('[data-act="bstyle"][data-v="single"]');
  await p.click('[data-act="blank"][data-v="states"]');
  check((await p.$$(".map .num")).length === 16, "16 Nummern auf der Karte");
  check((await p.textContent("#bnum")) === "Nummer 1", "Beginnt mit Nummer 1");
  const first = await p.$eval("#panel", (e) => e.dataset.cur);
  check(first === "s_sh", `Nummer 1 ist ganz im Norden (${first})`);
  await shot(p, "blank-start");
  const inp = await p.$("#bi");
  const nameOf = (id) => p.evaluate((id) => window.__DE.ITEMS.find((i) => i.id === id).name, id);
  // 1: richtig
  await p.fill("#bi", await nameOf(first)); await p.press("#bi", "Enter");
  await p.waitForFunction((f) => document.querySelector("#panel").dataset.cur !== f, first, { timeout: 3000 });
  check(await p.evaluate((e) => e === document.querySelector("#bi"), inp), "Eingabefeld bleibt (Tastatur bleibt offen)");
  check((await p.textContent("#cnt")) === "1 / 16", "Fortschritt 1 / 16");
  // 2: überspringen
  const second = await p.$eval("#panel", (e) => e.dataset.cur);
  await p.click('[data-a="skip"]');
  check((await p.$eval("#panel", (e) => e.dataset.cur)) !== second, "Später: nächste Nummer kommt");
  // 3: zweimal falsch -> rot, Enter = weiter
  const third = await p.$eval("#panel", (e) => e.dataset.cur);
  await p.fill("#bi", "qqq"); await p.press("#bi", "Enter");
  check((await p.textContent("#fb")).includes("Nicht ganz"), "Erster Fehler: Tipp");
  await p.fill("#bi", "qqq"); await p.press("#bi", "Enter");
  check((await p.textContent("#bs")) === "Weiter", "Zweiter Fehler: Weiter");
  check(await p.$eval(`.num.bad`, () => true).catch(() => false), "Nummer wird rot markiert");
  await p.press("#bi", "Enter");
  check((await p.$eval("#panel", (e) => e.dataset.cur)) !== third, "Enter führt weiter");
  // Nummer auf der Karte antippen springt dorthin
  const target = await p.evaluate(() => { const c = [...document.querySelectorAll(".map .num.open")].pop(); return c.dataset.num; });
  const [tx, ty] = await p.evaluate((id) => { const c = document.querySelector(`.map .num[data-num="${id}"] circle`); const r = c.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, target);
  await p.touchscreen.tap(tx, ty);
  check((await p.$eval("#panel", (e) => e.dataset.cur)) === target, "Antippen einer Nummer auf der Karte wählt sie aus");
  // Wortkasten
  await p.click('[data-a="bm"][data-v="bank"]');
  check((await p.$$(".wchip")).length === 16 && !(await p.$("#bi")), "Wortkasten zeigt 16 Wörter statt Eingabefeld");
  await shot(p, "blank-bank");
  const cur = await p.$eval("#panel", (e) => e.dataset.cur);
  await p.click(`.wchip[data-id="${cur}"]`);
  await p.waitForFunction((f) => document.querySelector("#panel").dataset.cur !== f, cur, { timeout: 3000 });
  check(await p.$eval(`.wchip[data-id="${cur}"]`, (e) => e.disabled), "Benutztes Wort ist durchgestrichen");
  // Rest richtig im Wortkasten
  for (let i = 0; i < 20 && !(await p.$(".results")); i++) {
    const c = await p.$eval("#panel", (e) => e.dataset.cur).catch(() => null);
    if (!c) break;
    await p.click(`.wchip[data-id="${c}"]`);
    await p.waitForFunction((f) => document.querySelector(".results") || document.querySelector("#panel").dataset.cur !== f, c, { timeout: 3000 }).catch(() => {});
  }
  await p.waitForSelector(".results", { timeout: 3000 });
  check((await p.textContent(".score")) === "15 / 16", "Ergebnis 15 / 16");
  check((await p.$$(".resultmap .num")).length === 16 && (await p.$$(".resultmap .num.bad")).length === 1, "Ergebniskarte: 16 Nummern, 1 rot");
  await shot(p, "blank-result");
  await p.click('[data-act="blankwrong"]');
  check((await p.textContent("#cnt")) === "0 / 1", "Fehler nochmal: nur 1 Nummer");
  check((await p.$eval("#panel", (e) => e.dataset.cur)) === third, "Es ist die vorher falsche Nummer");
  await p.click(`.wchip[data-id="${third}"]`);
  await p.waitForSelector(".results", { timeout: 3000 });
  check((await p.textContent(".score")) === "1 / 1", "Fehler-Runde 1 / 1");
  check(p.errors.length === 0, "keine Konsolenfehler (stumme Karte) " + p.errors.join(" | "));
  await ctx.close();
}

// 3) Stumme Karte für alle Themen fehlerfrei -> Abzeichen
{
  const { ctx, p } = await fresh();
  for (const cat of ["neighbors", "water", "mountains"]) {
    await p.click('[data-act="blankpick"]'); await p.click('[data-act="bstyle"][data-v="single"]');
    await p.click(`[data-act="blank"][data-v="${cat}"]`);
    const n = await p.$$eval(".map .num", (e) => e.length);
    for (let i = 0; i < n + 2 && !(await p.$(".results")); i++) {
      const c = await p.$eval("#panel", (e) => e.dataset.cur);
      const name = await p.evaluate((id) => window.__DE.ITEMS.find((i) => i.id === id).name, c);
      await p.fill("#bi", name); await p.press("#bi", "Enter");
      await p.waitForFunction((f) => document.querySelector(".results") || document.querySelector("#panel").dataset.cur !== f, c, { timeout: 3000 });
    }
    check((await p.textContent(".score")) === `${n} / ${n}`, `Stumme Karte ${cat}: ${n} / ${n}`);
    if (cat === "mountains") check((await p.$$(".resultmap .map.show-mtn")).length === 1, "Gebirge sind auf der Ergebniskarte sichtbar");
    await p.click('[data-act="home"]');
  }
  check(await p.evaluate(() => !!window.__DE.S.badges.stumm), "Abzeichen Kartenzeichner");
  check(p.errors.length === 0, "keine Konsolenfehler (stumme Karte 2) " + p.errors.join(" | "));
  await ctx.close();
}

// 3b) Lapbook: Nummern wie im Lapbook, Buchstaben-Vergleich bei Schreibfehlern
{
  const { ctx, p } = await fresh();
  await p.click('[data-act="blankpick"]'); await p.click('[data-act="bstyle"][data-v="single"]');
  await p.click('[data-act="blank"][data-v="water"]');
  check((await p.$eval("#panel", (e) => e.dataset.cur)) === "w_rhein" && (await p.textContent("#bnum")) === "Nummer 1", "Gewässer: Nummer 1 ist der Rhein (wie im Lapbook)");
  check((await p.$$eval("#bgrid .nb-cell", (e) => e.map((x) => x.textContent).join(","))) === "1,2,3,4,5,6,7,8,9,10,11,12", "Gewässer-Nummern wie im Lapbook (1 Rhein bis 10 Starnberger See, 11/12 Meere)");
  check((await p.textContent(".prompt small")).includes("wie im Lapbook"), "Hinweis: Nummern wie im Lapbook");
  await p.click('[data-act="quit"]');
  await p.click('[data-act="blankpick"]'); await p.click('[data-act="bstyle"][data-v="single"]');
  await p.click('[data-act="blank"][data-v="mountains"]');
  check((await p.$$eval("#bgrid .nb-cell", (e) => e.map((x) => x.textContent).join(","))) === "1,2,3,4,5,6,7,8,9,10,11", "Gebirge-Nummern wie im Lapbook (1 bis 10, 11 Zugspitze)");
  check((await p.$eval("#panel", (e) => e.dataset.cur)) === "m_bayerwald", "Gebirge: Nummer 1 ist der Bayerische Wald");
  await p.click('[data-act="quit"]');
  // Nachbarländer: Nummer 1 ist Dänemark; „Denemark“ wie im Lapbook
  await p.click('[data-act="blankpick"]'); await p.click('[data-act="bstyle"][data-v="single"]');
  await p.click('[data-act="blank"][data-v="neighbors"]');
  check((await p.$eval("#panel", (e) => e.dataset.cur)) === "n_dk", "Nachbarländer: Nummer 1 ist Dänemark");
  await p.fill("#bi", "Denemark"); await p.press("#bi", "Enter");
  check(!!(await p.$(".feedback.ok")), "„Denemark“ zählt als richtig (Rechtschreibung zweitrangig)");
  check((await p.textContent("#fb")).includes("Schreibtipp"), "Freundlicher Schreibtipp");
  check((await p.$$eval(".diff mark", (e) => e.map((x) => x.textContent).join(""))) === "ä", "Vergleich markiert das fehlende ä");
  check((await p.$$eval(".diff del", (e) => e.map((x) => x.textContent).join(""))) === "e", "Vergleich streicht das falsche e");
  await shot(p, "diff");
  await p.click('[data-act="quit"]');
  // Allgemeines schreiben: „Mertz“
  await p.click("#more > summary");
  await p.click('[data-act="topic"][data-v="general"]');
  await p.evaluate(() => { window.__DE_TEST.forceFirst = "g_kanzler"; });
  await p.click('[data-act="mode"][data-v="write"]');
  check((await p.textContent("#wprompt")).includes("Bundeskanzler"), "Erste Schreibfrage: Bundeskanzler");
  await p.fill("#wi", "Mertz"); await p.press("#wi", "Enter");
  check(!!(await p.$(".feedback.ok")), "„Mertz“ zählt als richtig");
  check((await p.$$eval(".diff del", (e) => e.map((x) => x.textContent).join(""))) === "t", "Vergleich streicht das t in Mertz");
  await p.click('[data-act="quit"]');
  // Meere: ein Feld pro Meer, jedes Feld wird für sich geprüft
  await p.evaluate(() => { window.__DE_TEST.forceFirst = "g_meere"; });
  await p.click('[data-act="mode"][data-v="write"]');
  check((await p.textContent("#wprompt")).includes("Meere") && (await p.$$("#mf .mi")).length === 2, "Schreibfrage Meere mit zwei Feldern");
  await p.fill("#wi", "Österreich"); await p.fill("#wi1", "Nordsee"); await p.click("#ws");
  check(!!(await p.$("#mr0.bad")) && !!(await p.$("#mr1.ok")), "„Österreich“ ist kein Meer, Nordsee stimmt");
  check((await p.textContent("#fb")).includes("1 von 2 richtig"), "Nur Nordsee richtig: 1 von 2");
  await p.fill("#wi", "Schwarzes Meer"); await p.click("#ws");
  check((await p.textContent("#fb")).includes("Richtig ist: Nordsee und Ostsee") && (await p.textContent("#mr0 .msol")) === "Ostsee", "Nach zwei Versuchen: Ostsee steht beim roten Feld");
  await p.click('[data-act="quit"]');
  await p.click('[data-act="mode"][data-v="write"]');
  await p.fill("#wi", "Nordsee und Ostsee"); await p.press("#wi", "Enter");
  check(!!(await p.$(".feedback.ok")) && (await p.inputValue("#wi1")) === "Ostsee", "Beide in ein Feld geschrieben: wird verteilt und ist richtig");
  await p.click('[data-act="quit"]');
  // Wahl: März 2029
  await p.evaluate(() => { window.__DE_TEST.forceFirst = "g_wahl"; });
  await p.click('[data-act="mode"][data-v="write"]');
  await p.fill("#wi", "martz 2029"); await p.press("#wi", "Enter");
  check(!!(await p.$(".feedback.ok")) && (await p.textContent("#fb")).includes("März 2029"), "„martz 2029“ zählt, Tipp zeigt März 2029");
  await p.evaluate(() => { window.__DE_TEST.forceFirst = null; });
  await p.click('[data-act="quit"]');
  // neue Lapbook-Fragen sind da
  const ids = await p.evaluate(() => window.__DE.ITEMS.filter((i) => i.cat === "general").map((i) => i.id));
  check(["g_groesstes", "g_kleinstes", "g_staedte", "g_fluss", "g_meere", "g_flaeche", "g_sprache", "g_praesident", "g_wahl", "g_hymne_text", "g_hymne_melodie", "g_hymne_strophe", "g_hymne_anfang", "g_hymne_seit", "g_hymne_wann", "g_hymne_l1", "g_hymne_l2", "g_hymne_l3", "g_hymne_l4"].every((x) => ids.includes(x)), `Lapbook-Fragen vorhanden (${ids.length} Allgemein-Fragen)`);
  const mapIds = await p.evaluate(() => window.__DE.ITEMS.map((i) => i.id));
  check(["w_main", "w_chiemsee", "w_mueritz", "w_starnberg", "m_rhoen", "m_fichtelgebirge", "m_thueringerwald", "m_zugspitze"].every((x) => mapIds.includes(x)), "Lapbook-Karte: Main, Chiemsee, Müritz, Starnberger See, Rhön, Fichtelgebirge, Thüringer Wald, Zugspitze");
  check(await p.evaluate(() => window.__DE.ITEMS.find((i) => i.id === "g_wahl").g.options[0] === "März 2029"), "Wahl: März 2029");
  check(p.errors.length === 0, "keine Konsolenfehler (Lapbook) " + p.errors.join(" | "));
  await ctx.close();
}

// 3c) Entdecken: jeder einzelne Kartenbegriff lässt sich antippen
{
  const { ctx, p } = await fresh();
  await p.click("#more > summary");
  await p.click('[data-act="discover"]');
  const missed = [];
  for (const cat of ["states", "neighbors", "water", "mountains"]) {
    await p.click(`[data-act="layer"][data-v="${cat}"]`);
    const items = await p.evaluate((cat) => window.__DE.ITEMS.filter((i) => i.cat === cat).map((i) => ({ id: i.id, name: i.name })), cat);
    for (const it of items) {
      const [x, y] = await p.evaluate((id) => {
        const svg = document.querySelector(".stage .map");
        const item = window.__DE.ITEMS.find((i) => i.id === id);
        let x, y;
        const hit = svg.querySelector(`.hit[data-id="${id}"]:not(.lakehit):not(.dot)`);
        if (hit) { const pt = hit.getPointAtLength(hit.getTotalLength() / 2); x = pt.x; y = pt.y; } else [x, y] = item.label;
        const q = svg.createSVGPoint(); q.x = x; q.y = y; const r = q.matrixTransform(svg.getScreenCTM()); return [r.x, r.y];
      }, it.id);
      await p.touchscreen.tap(x, y);
      const h = await p.$eval("#info h2", (e) => e.textContent).catch(() => "");
      if (h !== it.name) missed.push(`${it.name} (bekam: ${h || "nichts"})`);
    }
  }
  check(missed.length === 0, "Alle Kartenbegriffe antippbar" + (missed.length ? ": " + missed.join(", ") : ""));
  await p.click('[data-act="layer"][data-v="mountains"]');
  await shot(p, "discover-mountains");
  await p.click('[data-act="layer"][data-v="water"]');
  await shot(p, "discover-water");
  check(p.errors.length === 0, "keine Konsolenfehler (Entdecken) " + p.errors.join(" | "));
  await ctx.close();
}

// 4) Eltern-Übersicht: Tür, Inhalte, Einstellungen wirken
{
  const { ctx, p } = await fresh();
  // etwas Fortschritt erzeugen, mit einem Fehler
  await p.click('[data-act="mission"]');
  // gezielt eine falsche Antwort wählen (nicht einfach die erste, die kann richtig sein)
  const general = await p.$eval("#stage", (e) => e.classList.contains("general"));
  let sol;
  if (await p.$(".flagbox")) sol = null;
  else if (general) { const q = await p.textContent(".prompt h2"); sol = await p.evaluate((q) => { const g = window.__DE.ITEMS.find((i) => i.g && i.g.q === q).g; return g.options[g.correct]; }, q); }
  else sol = await solName(p);
  if (sol) {
    const opts = await p.$$eval(".opt", (e) => e.map((x) => x.textContent));
    await p.click(`.opt:text-is("${opts.find((o) => o !== sol)}")`);
  } else {
    for (const c of ["Rot", "Schwarz", "Gold", "Rot", "Schwarz", "Gold"]) await p.click(`.fchip[data-n="${c}"]`).catch(() => {});
  }
  await p.waitForSelector("#nx", { timeout: 3000 });
  await p.click("#nx");
  await playRound(p);
  await p.click('[data-act="home"]');
  // kurzes Antippen öffnet nicht
  await p.click('[data-act="settings"]');
  await p.click("#gate");
  await p.waitForTimeout(300);
  check(!(await p.$(".parents")), "Kurzes Tippen öffnet die Eltern-Übersicht nicht");
  const box = await (await p.$("#gate")).boundingBox();
  await p.mouse.move(box.x + 20, box.y + 10); await p.mouse.down();
  await p.waitForSelector(".parents", { timeout: 3000 }); await p.mouse.up();
  check(true, "Gedrückt halten öffnet die Eltern-Übersicht");
  const txt = await p.textContent(".parents");
  check(/Bereit für die LZK/.test(txt) && /\d+ %/.test(txt), "Zeigt Bereitschaft in Prozent");
  check((await p.$$(".barrow")).length === 5, "5 Themen-Balken");
  const trapRows = await p.$$eval(".parents section", (secs) => { const s = secs.find((x) => x.textContent.includes("Schreibfallen aus dem Lapbook")); return s ? s.querySelectorAll("tbody tr").length : 0; });
  check(trapRows === 15, `Schreibfallen aus dem Lapbook: 15 Wörter (${trapRows})`);
  check((await p.$$(".day")).length === 7, "7 Tage Übungszeit");
  check((await p.$$eval(".parents section:nth-of-type(2) tbody tr", (r) => r.length)) > 0, "Liste 'Wackelt noch' hat Einträge");
  await shot(p, "parents");
  await p.selectOption("#rl", "5");
  await p.check("#calm");
  await p.uncheck("#bz");
  await p.fill("#lzk", "2026-11-12");
  await p.dispatchEvent("#lzk", "change");
  const st = await p.evaluate(() => window.__DE.S);
  check(st.roundLen === 5 && st.calm === true && st.showBlitz === false && st.lzkDate === "2026-11-12", "Einstellungen gespeichert");
  check(await p.evaluate(() => document.body.classList.contains("calm")), "Ruhiger Modus aktiv");
  await p.click('[data-act="home"]');
  await p.click("#more > summary");
  check(!(await p.$('[data-act="mode"][data-v="blitz"]')), "Blitzrunde ausgeblendet");
  await p.click('[data-act="topic"][data-v="states"]');
  await p.click('[data-act="mode"][data-v="choice"]');
  check((await p.textContent("#cnt")) === "1 / 5", "Runde hat jetzt 5 Fragen");
  check(await p.$eval(".hl-poly", (e) => getComputedStyle(e).animationName === "none"), "Ruhiger Modus: Markierung blinkt nicht");
  await p.click('[data-act="quit"]');
  check(p.errors.length === 0, "keine Konsolenfehler (Eltern) " + p.errors.join(" | "));
  await ctx.close();
}

// 5) Hochformat iPad: stumme Karte und Eltern-Übersicht ohne seitliches Scrollen
{
  const { ctx, p } = await fresh({ width: 820, height: 1180 });
  await p.click('[data-act="blankpick"]'); await p.click('[data-act="bstyle"][data-v="single"]');
  await p.click('[data-act="blank"][data-v="states"]');
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Stumme Karte hochkant: kein seitliches Scrollen");
  await shot(p, "blank-portrait");
  await p.click('[data-act="quit"]');
  await p.click('[data-act="settings"]');
  const box = await (await p.$("#gate")).boundingBox();
  await p.mouse.move(box.x + 20, box.y + 10); await p.mouse.down();
  await p.waitForSelector(".parents", { timeout: 3000 }); await p.mouse.up();
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Eltern-Übersicht hochkant: kein seitliches Scrollen");
  const t5 = await p.textContent(".parents section:nth-of-type(2)");
  check(t5.includes("noch nie geübt") && (await p.$$(".parents section:nth-of-type(2) tbody tr")).length === 0, "Ohne Übung: 'Wackelt noch' listet nichts Ungeübtes");
  await shot(p, "parents-portrait");
  check(p.errors.length === 0, "keine Konsolenfehler (hochkant) " + p.errors.join(" | "));
  await ctx.close();
}

await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "alle Funktions-Tests ok");
process.exit(fails ? 1 : 0);
