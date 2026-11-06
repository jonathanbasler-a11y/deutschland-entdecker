// Spielstand überlebt Neuladen und „Update“ (neuer Cache-Name, gleiche KEY).
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
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, serviceWorkers: "block" });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(url);
await p.click('[data-act="skipname"]').catch(() => {});

const KEY = await p.evaluate(() => window.__DE.KEY);
check(KEY === "deutschland-entdecker-v1", "Speicher-KEY bleibt deutschland-entdecker-v1");

await p.evaluate(() => {
  const S = window.__DE.S;
  S.askedName = true; S.gift2 = true; S.name = "Lea"; S.xp = 888;
  S.pet = Object.assign({}, S.pet, { name: "Bao", kind: "panda", blocks: 7, worn: ["krone"], acc: ["krone"], spent: 25 });
  S.math = Object.assign({}, S.math || {}, { xp: 120, set: { tn: 20, tsec: 420 } });
  S.kompass = Object.assign({}, S.kompass || {}, { xp: 55, total: 12, missionsDone: 2 });
  window.__DE.save();
});

await p.reload();
await p.waitForSelector("#app *");
await p.click('[data-act="skipname"]').catch(() => {});
const after = await p.evaluate(() => {
  const S = window.__DE.S;
  return { key: window.__DE.KEY, name: S.name, xp: S.xp, kind: S.pet && S.pet.kind, petName: S.pet && S.pet.name, blocks: S.pet && S.pet.blocks, worn: (S.pet && S.pet.worn) || [], mxp: S.math && S.math.xp, kxp: S.kompass && S.kompass.xp, ktot: S.kompass && S.kompass.total };
});
check(after.key === "deutschland-entdecker-v1" && after.name === "Lea" && after.xp === 888, "Name und Punkte bleiben nach Neuladen");
check(after.kind === "panda" && after.petName === "Bao" && after.blocks === 7 && after.worn.includes("krone"), "Tier, Blöcke und Zubehör bleiben");
check(after.mxp === 120 && after.kxp === 55 && after.ktot === 12, "Kopfrechnen- und Kompass-Stand bleiben");

// „Update“: localStorage bleibt, auch wenn Service-Worker-Cache-Name neu wäre (KEY unverändert)
const bak = await p.evaluate(() => localStorage.getItem("deutschland-entdecker-v1-bak"));
check(!!bak && bak.includes('"kind":"panda"') && bak.includes('"xp":888'), "Zweite Kopie enthält denselben Stand");
await p.evaluate(() => { localStorage.removeItem("deutschland-entdecker-v1"); });
await p.reload();
await p.waitForSelector("#app *");
const fromBak = await p.evaluate(() => ({ xp: window.__DE.S.xp, kind: window.__DE.S.pet.kind, name: window.__DE.S.name }));
check(fromBak.xp === 888 && fromBak.kind === "panda" && fromBak.name === "Lea", "Nach Update-Szenario: Stand kommt aus der zweiten Kopie");

check(errs.length === 0, "keine Konsolenfehler " + errs.join(" | "));
await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "Fortschritt-Update-Test ok");
process.exit(fails ? 1 : 0);
