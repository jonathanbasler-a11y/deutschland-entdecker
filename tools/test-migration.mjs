// Alte, halbe und kaputte Spielstände: Die App muss starten, nichts abstürzen, nichts Wichtiges verlieren.
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
const KEY = "deutschland-entdecker-v1";
const today = (() => { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); })();

// Stand vor dem Kopfrechnen und dem Hund (so sah er am 4.11. aus)
const OLD = { name: "Max", askedName: true, xp: 420, items: { s_bw: { choice: 2, tap: 1, write: 1, n: 5, last: "o", t: today } }, days: { [today]: 12 }, mins: { [today]: 6 }, badges: { start: today }, probes: [{ date: today, pct: 80, grade: 2 }], blitzBest: 9, topic: "all", sound: true, speak: false, roundLen: 8, calm: false, autoRead: false, showBlitz: true, lzkDate: "2026-11-10", mission: { day: today, step: 1 }, missionsDone: 1, blankMode: "bank", ui: { more: true } };

const CASES = [
  ["Stand vor Kopfrechnen und Hund", OLD],
  ["math ist null", { ...OLD, math: null }],
  ["math ist eine Zahl", { ...OLD, math: 5 }],
  ["math ohne set und lv", { ...OLD, math: { xp: 50 } }],
  ["math mit falschen Typen", { ...OLD, math: { xp: "viel", lv: [], facts: 7, tests: {}, set: "x", mission: null } }],
  ["pet ist null", { ...OLD, pet: null }],
  ["pet ohne bosses", { ...OLD, pet: { name: "Bello", blocks: 3 } }],
  ["pet mit falschen Typen", { ...OLD, pet: { name: 12, blocks: "viel", bosses: [] } }],
  ["blitzTrace kaputt", { ...OLD, blitzTrace: "x", math: { blitzTrace: 4 } }],
  ["subject unbekannt", { ...OLD, subject: "chemie" }],
  ["subject math", { ...OLD, subject: "math" }],
  ["leeres Objekt", {}],
  ["kein JSON", "{kaputt"],
  ["Zahl statt Objekt", 5],
];

for (const [name, data] of CASES) {
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, serviceWorkers: "block" });
  await ctx.addInitScript(([k, d]) => { localStorage.setItem(k, typeof d === "string" ? d : JSON.stringify(d)); }, [KEY, data]);
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(url);
  const home = await p.waitForSelector(".top", { timeout: 4000 }).then(() => true, () => false);
  if (home && (await p.$(".modal"))) await p.click('[data-act="skipname"]').catch(() => {});
  let ok = home && errs.length === 0;
  // die wichtigsten Bildschirme einmal öffnen
  if (ok) {
    try {
      await p.click('[data-act="pet"]'); await p.waitForSelector(".petview", { timeout: 2000 });
      await p.click('[data-act="home"]');
      await p.click('[data-act="badges"]'); await p.waitForSelector(".badges", { timeout: 2000 });
      await p.click('[data-act="home"]');
      await p.click('[data-act="subject"][data-v="math"]'); await p.waitForSelector(".mhome", { timeout: 2000 });
      await p.click('[data-act="m-level"][data-v="k-mal"]'); await p.waitForSelector(".mtask", { timeout: 2000 });
      await p.click('[data-act="m-quit"]');
      await p.click('[data-act="subject"][data-v="de"]'); await p.waitForSelector(".home", { timeout: 2000 });
      await p.click('[data-act="mission"]'); await p.waitForSelector(".stage", { timeout: 2000 });
      await p.click('[data-act="quit"]');
      await p.click('[data-act="settings"]');
      const box = await (await p.$("#gate")).boundingBox();
      await p.mouse.move(box.x + 20, box.y + 10); await p.mouse.down();
      await p.waitForSelector(".parents", { timeout: 3000 }); await p.mouse.up();
      await p.click('.ptabs [data-v="math"]'); await p.waitForSelector(".x1", { timeout: 2000 });
    } catch (e) { ok = false; errs.push("Bedienung: " + String(e).split("\n")[0]); }
  }
  check(ok && errs.length === 0, `${name}: startet und alle Bildschirme öffnen sich${errs.length ? " (" + errs.slice(0, 2).join(" | ") + ")" : ""}`);
  if (name === "Stand vor Kopfrechnen und Hund") {
    const S = await p.evaluate(() => window.__DE.S);
    check(S.xp === 420 && S.name === "Max" && S.missionsDone === 1 && S.blitzBest === 9 && S.badges.start && S.items.s_bw.choice === 2, "alter Stand: Punkte, Name, Abzeichen, Sterne bleiben");
    check(S.pet && S.pet.name === "Pixel" && S.bossOn !== false, "alter Stand: Hund bekommt Standardwerte");
  }
  await ctx.close();
}

await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "alle Migrations-Tests ok");
process.exit(fails ? 1 : 0);
