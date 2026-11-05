// Tageswechsel: Serie, Tagesmission, Hund-Begrüßung und eine Runde, die über Mitternacht läuft.
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
await ctx.addInitScript(() => { window.__DE_TEST = { pauseMs: 200, pauseAfterMin: 1e9, speakWaitMs: 50 }; });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
const ev = (expr) => p.evaluate(new Function("return (" + expr + ")"));
const at = (iso) => p.clock.setFixedTime(new Date(iso));

// Tag 1 (Dienstag), 23:50 Uhr
await p.clock.install({ time: new Date("2026-11-03T23:50:00") });
await p.goto(url);
await p.click('[data-act="skipname"]');
await p.click('[data-act="subject"][data-v="math"]');
const ans = () => ev("String(window.__DE_M.R.cur.ans)");
async function mStep() {
  const i = await ev("window.__DE_M.R.i");
  for (const d of await ans()) await p.tap(`.key[data-v="${d}"]`);
  await p.tap('.key[data-v="ok"]');
  await p.waitForFunction((i) => document.querySelector(".mresults") || window.__DE_M.R.i !== i, i, { timeout: 8000 });
}
async function playRound() { while (!(await p.$(".mresults"))) { await mStep(); await p.clock.runFor(900); } }
await p.click('[data-act="m-mission"]');
await playRound();
check((await p.textContent(".hero h1")).includes("Etappe 1"), "Dienstag: Etappe 1 geschafft");
let st = await ev("window.__DE.S");
check(st.math.mission.day === "2026-11-03" && st.math.mission.step === 1, "Mission steht auf Dienstag, Etappe 1");
check(st.pet.lastGreet === "2026-11-03", "Hund hat Dienstag begrüßt");
check((await ev("window.__DE.S.math.days['2026-11-03']")) >= 10, "Rechenaufgaben zählen für Dienstag");
await p.click('[data-act="home"]');
check((await p.textContent(".chips")).includes("🔥 1"), "Serie: 1 Tag");

// Mitternacht: eine Runde läuft über den Tageswechsel
await p.click('[data-act="m-mission"]');
await mStep();
await at("2026-11-04T00:05:00");
await p.clock.runFor(1000);
await playRound();
st = await ev("window.__DE.S");
check(errs.length === 0, "Runde über Mitternacht: kein Fehler " + errs.join(" | "));
check(!!(await p.$(".mresults")), "Runde über Mitternacht: Ergebnis kommt");
const stepAfter = st.math.mission.step;
check(stepAfter === 2 && st.math.mission.day === "2026-11-04", `Etappe nach Mitternacht zählt für den neuen Tag (Tag ${st.math.mission.day}, Etappe ${stepAfter})`);
await p.click('[data-act="home"]');

// Mittwoch: neu laden, frischer Tag
await p.reload();
await p.waitForSelector(".top");
st = await ev("window.__DE.S");
check((await p.$$(".mission .path li.done")).length === (st.math.mission.day === "2026-11-04" ? st.math.mission.step : 0), "Mission zeigt den richtigen Stand für heute");
await at("2026-11-05T08:00:00");
await p.reload();
await p.waitForSelector(".top");
check(!(await p.$(".mhome .path li.done")) , "Mittwoch: Tagesmission beginnt wieder bei Etappe 1");
check((await p.textContent(".petw")).includes("Wuff"), "Mittwoch: Hund begrüßt neu");
check((await p.textContent(".chips")).includes("🔥 2"), "Serie: Dienstag und Mittwoch (gestern geübt) = 2 Tage, noch nicht gebrochen");
await p.evaluate(() => 0);
// Freitag: zwei Tage ohne Üben -> Serie weg, Hund wartet freundlich
await at("2026-11-07T08:00:00");
await p.reload();
await p.waitForSelector(".top");
check((await p.textContent(".chips")).includes("🔥 0"), "Zwei Tage Pause: Serie 0");
check(!!(await p.$(".petw.wait")) && !(await p.textContent(".petw")).match(/traurig|schlecht|vermiss/i), "Hund wartet nur freundlich (keine Vorwürfe)");
await p.click('[data-act="subject"][data-v="de"]');
check(/LZK in\s*3\s*Tagen/.test(await p.textContent(".chips")), "LZK-Countdown: am 7.11. noch 3 Tage");
await at("2026-11-10T09:00:00");
await p.reload(); await p.waitForSelector(".top");
check((await p.textContent(".chips")).includes("LZK!"), "Am 10.11.: „LZK!“");
await at("2026-11-11T09:00:00");
await p.reload(); await p.waitForSelector(".top");
check(!(await p.textContent(".chips")).includes("LZK"), "Nach der LZK: kein Countdown");
check(errs.length === 0, "keine Konsolenfehler " + errs.join(" | "));

await b.close(); srv.close();
console.log(fails ? `${fails} Fehler` : "alle Tageswechsel-Tests ok");
process.exit(fails ? 1 : 0);
