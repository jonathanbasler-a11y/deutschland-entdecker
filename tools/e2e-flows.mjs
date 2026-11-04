// Abläufe: perfekte Probe-LZK, Schwächen-Modus, Einstellungen, Speicher, Serie, Countdown.
// Aufruf: node tools/e2e-flows.mjs
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const root = path.resolve("public");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const f = path.join(root, q.url === "/" ? "index.html" : q.url.split("?")[0]);
  fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { "content-type": types[path.extname(f)] || "text/plain" }), r.end(d))));
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;
let fails = 0;
const check = (c, m) => { if (!c) { fails++; console.log("FAIL", m); } else console.log("ok  ", m); };
const b = await chromium.launch();

async function fresh(time) {
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, serviceWorkers: "block" });
  const p = await ctx.newPage();
  if (time) await p.clock.setFixedTime(new Date(time));
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.goto(url);
  return { ctx, p };
}

// Beantwortet die aktuelle Frage richtig, egal welcher Art.
async function answerRight(p) {
  if (await p.$(".flagbox")) { for (const c of ["Schwarz", "Rot", "Gold"]) await p.click(`.fchip[data-n="${c}"]`); return; }
  const hlD = await p.$eval(".hl-poly, .hl-line", (e) => e.getAttribute("d")).catch(() => null);
  const general = await p.$eval("#stage", (e) => e.classList.contains("general"));
  if (await p.$(".opt")) {
    let sol;
    if (general) { const q = await p.textContent(".prompt h2"); sol = await p.evaluate((q) => { const g = window.__DE.ITEMS.find((i) => i.g && i.g.q === q).g; return g.options[g.correct]; }, q); }
    else sol = await p.evaluate((d) => window.__DE.ITEMS.find((i) => i.d === d).name, hlD);
    await p.click(`.opt:text-is("${sol}")`); return;
  }
  if (await p.$("#wi")) {
    let sol;
    if (general) { const q = await p.textContent("#wprompt"); sol = await p.evaluate((q) => { const w = window.__DE.ITEMS.find((i) => i.g && i.g.write && i.g.write.q === q).g.write; return w.num ? String(w.num[w.num.length - 2] || w.num[0]) : w.answers[0]; }, q); }
    else sol = await p.evaluate((d) => window.__DE.ITEMS.find((i) => i.d === d).name, hlD);
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
async function playRound(p, max = 40) {
  let n = 0;
  while (!(await p.$(".results")) && n < max) {
    const before = await p.textContent("#cnt");
    await answerRight(p);
    n++;
    await p.waitForFunction((b) => document.querySelector(".results") || (document.querySelector("#cnt") && document.querySelector("#cnt").textContent !== b), before, { timeout: 5000 }).catch(() => {});
  }
  return n;
}

// 1) Name, perfekte Probe-LZK, Abzeichen, Speicher nach Neuladen
{
  const { ctx, p } = await fresh("2026-11-05T15:00:00");
  await p.fill("#nm", "Max");
  await p.press("#nm", "Enter");
  check((await p.textContent(".hello h1")).includes("Hallo Max"), "Name wird begrüßt");
  check((await p.textContent(".chip.lzk")).includes("5 Tagen"), "Countdown am 5.11.: 5 Tage");
  await p.click('[data-act="topic"][data-v="all"]');
  await p.click('[data-act="mode"][data-v="probe"]');
  const n = await playRound(p);
  check(n === 22, `Probe hat 22 Fragen (${n})`);
  check((await p.textContent(".score")) === "Note 1", "Perfekte Probe ergibt Note 1");
  check((await p.textContent(".hero p")).includes("22 von 22"), "22 von 22 richtig");
  const st = await p.evaluate(() => window.__DE.S);
  check(st.badges.probe1 && st.badges.probe2 && st.badges.start, "Abzeichen Fehlerfrei, Probe bestanden, Erster Schritt");
  const xp = st.xp;
  check(xp >= 220, `Punkte vergeben (${xp})`);
  await p.click('[data-act="home"]');
  await p.reload();
  check((await p.textContent(".hello h1")).includes("Hallo Max") && (await p.evaluate(() => window.__DE.S.xp)) === xp, "Fortschritt übersteht Neuladen");
  check(!(await p.$(".modal")), "Namensfrage kommt nach Neuladen nicht wieder");

  // Schwächen-Modus: zwei Runden richtig, Sterne steigen
  const starsBefore = await p.evaluate(() => Object.values(window.__DE.S.items).reduce((a, e) => a + ["choice", "tap", "write"].filter((k) => e[k] >= 1).length, 0));
  await p.click('[data-act="mode"][data-v="mix"]');
  await playRound(p);
  check(await p.$(".results"), "Schwächen-Runde endet");
  check((await p.textContent(".score")) === "12 / 12", "Schwächen-Runde 12/12");
  await p.click('[data-act="again"]');
  await playRound(p);
  const starsAfter = await p.evaluate(() => Object.values(window.__DE.S.items).reduce((a, e) => a + ["choice", "tap", "write"].filter((k) => e[k] >= 1).length, 0));
  check(starsAfter >= starsBefore + 20, `Sterne steigen (${starsBefore} -> ${starsAfter})`);
  await p.click('[data-act="home"]');
  const pills = await p.$$eval(".weak .pill", (e) => e.length);
  check(pills > 0, "Startseite zeigt, was noch zu üben ist");

  // Einstellungen: Name ändern, Ton aus, Zurücksetzen mit Bestätigung
  await p.click('[data-act="settings"]');
  await p.fill("#nm2", "Moritz");
  await p.uncheck("#snd");
  await p.click('[data-act="savesettings"]');
  check((await p.textContent(".hello h1")).includes("Hallo Moritz"), "Name in Einstellungen geändert");
  check((await p.evaluate(() => window.__DE.S.sound)) === false, "Ton ausgeschaltet");
  await p.click('[data-act="settings"]');
  await p.click('[data-act="reset"]');
  check((await p.evaluate(() => window.__DE.S.xp)) > 0, "Erster Tipp auf Zurücksetzen löscht noch nichts");
  await p.click('[data-act="reset"]');
  check((await p.evaluate(() => window.__DE.S.xp)) === 0 && !(await p.$(".modal")), "Zweiter Tipp setzt zurück");
  check(p.errors.length === 0, "keine Konsolenfehler (1) " + p.errors.join(" | "));
  await ctx.close();
}

// 2) Serie über Tage und Countdown am und nach dem LZK-Tag
{
  const { ctx, p } = await fresh("2026-11-08T10:00:00");
  await p.click('[data-act="skipname"]');
  await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("deutschland-entdecker-v1"));
    s.days = { "2026-11-06": 5, "2026-11-07": 8 };
    localStorage.setItem("deutschland-entdecker-v1", JSON.stringify(s));
  });
  await p.reload();
  check((await p.textContent(".chips")).includes("🔥 2"), "Serie 2 (gestern + vorgestern, heute noch nicht)");
  await p.click('[data-act="topic"][data-v="states"]');
  await p.click('[data-act="mode"][data-v="choice"]');
  await answerRight(p);
  await p.waitForTimeout(300);
  check(await p.evaluate(() => !!window.__DE.S.badges.serie3), "Abzeichen 3 Tage in Folge nach Üben am 3. Tag");
  await p.click('[data-act="quit"]');
  check((await p.textContent(".chips")).includes("🔥 3"), "Serie 3");
  check(p.errors.length === 0, "keine Konsolenfehler (2) " + p.errors.join(" | "));
  await ctx.close();
}
{
  const { ctx, p } = await fresh("2026-11-10T07:00:00");
  await p.click('[data-act="skipname"]');
  check((await p.textContent(".chip.lzk")).includes("LZK"), "Am 10.11.: Heute LZK");
  await ctx.close();
}
{
  const { ctx, p } = await fresh("2026-11-11T07:00:00");
  await p.click('[data-act="skipname"]');
  check(!(await p.$(".chip.lzk")), "Nach dem 10.11.: kein Countdown");
  await ctx.close();
}
{
  const { ctx, p } = await fresh("2026-11-09T21:00:00");
  await p.click('[data-act="skipname"]');
  check((await p.textContent(".chip.lzk")).includes("1 Tag"), "Am 9.11. abends: 1 Tag");
  await ctx.close();
}

await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "alle Ablauf-Tests ok");
process.exit(fails ? 1 : 0);
