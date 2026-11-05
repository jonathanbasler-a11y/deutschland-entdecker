// Zufälliges Durchklicken: tippt wild durch alle Bildschirme und sucht Abstürze, Konsolenfehler,
// Sackgassen (nichts mehr zum Antippen) und seitliches Scrollen. Mit festem Zufall, also wiederholbar.
// Aufruf: node tools/monkey.mjs [Schritte je Lauf, Standard 300] [Startwert]
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const STEPS = +process.argv[2] || 300, SEED0 = +process.argv[3] || 1;
const root = path.resolve("public");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const f = path.join(root, q.url === "/" ? "index.html" : q.url.split("?")[0]);
  fs.readFile(f, (e, d) => (e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { "content-type": types[path.extname(f)] || "text/plain" }), r.end(d))));
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;
const rng = (s) => () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const DEVICES = [["iPad quer", 1180, 820], ["iPad hoch", 820, 1180], ["Handy", 390, 844]];
const WORDS = ["Bayern", "Rhein", "Berlin", "Nordsee", "x", "", "  ", "123", "84,7", "Österreich", "a".repeat(40), "<b>", "Harz", "Hessen", "Merz"];
// niemals: alles zurücksetzen löschen
const SKIP = /^(reset|m-reset)$/;
let fails = 0;
const b = await chromium.launch();

for (const [name, w, h] of DEVICES) {
  const rnd = rng(SEED0 * 7919 + w);
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, serviceWorkers: "block" });
  await ctx.addInitScript(() => { window.__DE_TEST = { gateMs: 100, pauseMs: 300, blitzMs: 4000, testSecMs: 1500, sheetMs: 20000, speakWaitMs: 50, pauseAfterMin: 1 }; });
  const p = await ctx.newPage();
  const errs = [], log = [];
  p.on("pageerror", (e) => errs.push("pageerror: " + String(e).split("\n")[0]));
  p.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text()));
  p.on("dialog", (d) => d.dismiss().catch(() => {}));
  await p.goto(url);
  let stuck = 0, steps = 0;
  const pickTarget = () => p.evaluate((skip) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(e).visibility !== "hidden" && !e.disabled && e.checkVisibility(); };
    const sel = "[data-act], [data-a], .key, .opt, .fchip, .wchip, .scell, .nb-cell, input:not([type=checkbox]):not([type=date]), .map .num, summary, select";
    const els = [...document.querySelectorAll(sel)].filter((e) => vis(e) && !(e.dataset && (skip.test(e.dataset.act || "") )) && !e.readOnly);
    return els.map((e, i) => { const r = e.getBoundingClientRect(); return { i, tag: e.tagName.toLowerCase(), act: (e.dataset && (e.dataset.act || e.dataset.a)) || e.className, x: r.left + r.width / 2, y: r.top + r.height / 2, input: e.tagName === "INPUT" }; });
  }, SKIP.source ? SKIP : SKIP).catch(() => []);
  for (let s = 0; s < STEPS; s++) {
    steps = s;
    const list = await pickTarget();
    if (!list.length) {
      stuck++;
      if (stuck > 3) { errs.push(`Sackgasse nach ${s} Schritten (nichts zum Antippen), zuletzt: ${log.slice(-4).join(" > ")}`); break; }
      await p.waitForTimeout(600);
      continue;
    }
    stuck = 0;
    // Eingabefelder, Antworttasten und Karte bevorzugt, damit Runden auch zu Ende gehen
    const answers = list.filter((x) => /key|opt|fchip|wchip|scell|nb-cell|num|^(opt|word|chip|jump|srow|sword|m-key|m-cell|m-tip|next|skip)$/.test(String(x.act)) || x.input || x.tag === "input");
    const inGame = await p.evaluate(() => !!document.querySelector(".stage, .mstage, .msheet")).catch(() => false);
    const pool = inGame && answers.length && rnd() < 0.75 ? answers : list;
    const t = pool[Math.floor(rnd() * pool.length)];
    log.push(`${t.tag}:${t.act}`);
    try {
      if (t.input) {
        // iPad-Safari zoomt die Seite, wenn ein Eingabefeld mit Schrift unter 16 px den Cursor bekommt
        const fs = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && e.tagName === "INPUT" ? parseFloat(getComputedStyle(e).fontSize) : 99; }, [t.x, t.y]);
        if (fs < 16) { errs.push(`Eingabefeld mit Schrift ${fs}px (unter 16px: iPad zoomt beim Antippen), bei: ${log.slice(-3).join(" > ")}`); break; }
        await p.touchscreen.tap(t.x, t.y);
        await p.keyboard.type(WORDS[Math.floor(rnd() * WORDS.length)], { delay: 0 });
        if (rnd() < 0.7) await p.keyboard.press("Enter");
      } else if (rnd() < 0.15) {
        // auf die Karte tippen (Finden-Aufgaben)
        const m = await p.$(".stage .map");
        if (m) { const bb = await m.boundingBox(); if (bb) await p.touchscreen.tap(bb.x + rnd() * bb.width, bb.y + rnd() * bb.height); }
      } else {
        await p.touchscreen.tap(t.x, t.y);
      }
    } catch (e) { /* Element verschwunden: egal */ }
    if (rnd() < 0.08) await p.keyboard.press(["Enter", "Backspace", "5", "Tab"][Math.floor(rnd() * 4)]).catch(() => {});
    await p.waitForTimeout(25 + Math.floor(rnd() * 60));
    if (s % 20 === 0) {
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth).catch(() => 0);
      if (ov > 1) errs.push(`seitliches Scrollen (+${ov}px) nach: ${log.slice(-3).join(" > ")}`);
    }
    if (errs.length) break;
  }
  const st = await p.evaluate(() => ({ xp: window.__DE.S.xp, m: (window.__DE.S.math || {}).total, blocks: (window.__DE.S.pet || {}).blocks, subject: window.__DE.S.subject })).catch(() => ({}));
  const ok = errs.length === 0;
  if (!ok) fails++;
  console.log(ok ? "ok  " : "FAIL", `${name}: ${steps + 1} Schritte, Punkte ${st.xp}, Rechenaufgaben ${st.m}, Blöcke ${st.blocks}`);
  errs.slice(0, 3).forEach((e) => console.log("     ", e));
  if (!ok) { await p.screenshot({ path: path.resolve(`monkey-${name.replace(/\s+/g, "-")}.png`) }).catch(() => {}); console.log("      letzte Schritte:", log.slice(-8).join(" > ")); }
  await ctx.close();
}
await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "Monkey-Test ok");
process.exit(fails ? 1 : 0);
