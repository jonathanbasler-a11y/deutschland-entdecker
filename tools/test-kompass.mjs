// Tests der Kompass-Logik: Generatoren gegen unabhängige Nachrechnung, Deutsch-Bank, Prüfen, Sterne, Plan.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const req = createRequire(import.meta.url);
const K = req("../public/kompass-logic.js");
const D = req("../public/kompass-data.js");
K.attachBank(D.BANK);

let n = 0;
const ok = (c, m) => { n++; assert.ok(c, m); };

// Zahlen schreiben und lesen
assert.equal(K.fmt(357588), "357.588");
assert.equal(K.fmt(1000000), "1.000.000");
assert.equal(K.fmt(999), "999");
assert.equal(K.fmtMoney(12.5), "12,50");
assert.equal(K.fmtMoney(0.07), "0,07");
for (const [s, v] of [["357.588", 357588], ["357588", 357588], ["12,50", 12.5], ["1.000", 1000], [" 42 ", 42], ["0", 0]]) assert.equal(K.parseNum(s), v, s);
for (const s of ["", "abc", "1.2.3", "12a", "-5"]) ok(Number.isNaN(K.parseNum(s)), "kein gültiges Format: " + s);
// Zahlwörter: bekannte Werte
const W = { 1: "eins", 21: "einundzwanzig", 100: "einhundert", 101: "einhunderteins", 1000: "eintausend", 1001: "eintausendeins", 21000: "einundzwanzigtausend",
  346205: "dreihundertsechsundvierzigtausendzweihundertfünf", 999999: "neunhundertneunundneunzigtausendneunhundertneunundneunzig", 110011: "einhundertzehntausendelf", 70017: "siebzigtausendsiebzehn" };
for (const [v, w] of Object.entries(W)) assert.equal(K.words(+v), w, v);
// Zahlwörter eindeutig (keine zwei Zahlen gleich geschrieben)
const seen = new Map();
for (let v = 0; v < 1000000; v += 37) { const w = K.words(v); assert.ok(!seen.has(w), `${v} und ${seen.get(w)} gleich: ${w}`); seen.set(w, v); }

// Mathe-Generatoren: viele Startwerte, jede Lösung unabhängig nachgerechnet
const mathComps = K.COMPS.filter((c) => c.gen).map((c) => c.id);
ok(mathComps.length >= 17, "Mathe-Unterkompetenzen: " + mathComps.length);
const parseF = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));
for (const id of mathComps) {
  for (let seed = 1; seed <= 400; seed++) for (const lv of [1, 2, 3]) {
    const t = K.task(id, seed * 7919 + lv, lv);
    const where = `${id} seed ${seed} lv ${lv}: ${t.q}`;
    ok(t.q && t.q.length > 5 && t.tip && t.explain, "Text, Tipp, Erklärung: " + where);
    if (t.type === "num") {
      ok(Number.isFinite(t.ans) && t.ans >= 0, "Lösung ist eine Zahl ≥ 0: " + where);
      ok(t.ans <= 1000000 || id === "ma.folge", "Zahlenraum bis 1 Million: " + where);
      // die eigene Lösung wird als richtig erkannt, eine andere nicht
      ok(K.check(t, K.solution(t).replace(/ .*$/, "")).ok, "Lösung prüfbar: " + where + " → " + K.solution(t));
      ok(!K.check(t, String(t.ans + 1)).ok, "falsche Zahl abgelehnt: " + where);
    }
    if (t.type === "choice") {
      ok(t.opts.length >= 2 && new Set(t.opts).size === t.opts.length, "Antworten eindeutig: " + where);
      ok(t.ans >= 0 && t.ans < t.opts.length, "richtige Antwort vorhanden: " + where);
    }
    if (t.type === "order") ok(t.items.map(parseF).every((v, i, a) => i === 0 || a[i - 1] < v), "aufsteigend: " + where);
    // unabhängige Nachrechnung je Art
    if (id === "ma.plus") ok(t.nums.reduce((a, b) => a + b, 0) === t.ans, where);
    if (id === "ma.minus") ok(t.a - t.b === t.ans && t.ans > 0, where);
    if (id === "ma.mal") ok(t.a * t.b === t.ans, where);
    if (id === "ma.geteilt") ok(t.b * t.ans === t.a && t.b >= 2, where);
    if (id === "ma.runden") {
      const m = /Runde ([\d.]+) auf (\w+)\./.exec(t.q), v = parseF(m[1]), p = { Zehner: 10, Hunderter: 100, Tausender: 1000, Zehntausender: 10000 }[m[2]];
      ok(Math.round(v / p) * p === t.ans, where);
    }
    if (id === "ma.folge") { const s = t.seq, d = s.map((x, i) => (i ? x - s[i - 1] : 0)).slice(1); ok(s.length === 6 && t.ans === s[5], where); ok(d.every((x) => x === d[0]) || s.every((x, i) => !i || x === s[i - 1] * 2) || d.every((x, i) => x === d[i % 2]), "Regel erkennbar: " + where); }
    if (id === "ma.mauer") { const { b, m, top } = t.wall; ok(m[0] === b[0] + b[1] && m[1] === b[1] + b[2] && top === m[0] + m[1], where); }
    if (id === "ma.stelle" && /Schreibe als Zahl: [a-zäöüß]+$/.test(t.q)) ok(K.words(t.ans) === t.q.replace("Schreibe als Zahl: ", ""), where);
    if (id === "ma.stelle" && /Ziffer/.test(t.q)) ok(String(t.n).split("").reverse()[t.i] === String(t.ans), where);
    if (id === "ma.stelle" && /\d (HT|ZT|T|H|Z|E)/.test(t.q)) {
      const V = { HT: 100000, ZT: 10000, T: 1000, H: 100, Z: 10, E: 1 };
      const sum = t.q.replace("Schreibe als Zahl: ", "").split(" + ").reduce((a, p) => { const [d, k] = p.split(" "); return a + +d * V[k]; }, 0);
      ok(sum === t.ans, where);
    }
    if (id === "ma.zeit" && /Minuten sind das/.test(t.q)) {
      const [, h1, m1, h2, m2] = /Von (\d+):(\d+) Uhr bis (\d+):(\d+) Uhr/.exec(t.q).map(Number);
      ok((h2 * 60 + m2) - (h1 * 60 + m1) === t.ans, where);
    }
    if (id === "ma.geld" && t.money) ok(Math.abs(Math.round(t.ans * 100) - t.ans * 100) < 1e-6 && t.ans > 0, "Geld auf Cent genau: " + where);
    if (id === "ma.hohl" && /verteilt/.test(t.q)) { const k = +/auf (\d+) Becher/.exec(t.q)[1]; ok(t.ans * k === 1000, where); }
  }
}
// gleicher Startwert = gleiche Aufgabe
assert.deepEqual(K.task("ma.mal", 42, 2), K.task("ma.mal", 42, 2));

// Deutsch-Bank
const deComps = Object.keys(D.BANK);
ok(deComps.length >= 8, "Deutsch-Unterkompetenzen");
for (const s of D.SAETZE) ok(s.words.length === s.tags.length, "Wortarten passen zum Satz: " + s.words.join(" "));
for (const id of deComps) {
  const list = D.BANK[id].items;
  ok(list.length >= 6, `${id}: genug Aufgaben (${list.length})`);
  for (let i = 0; i < list.length; i++) {
    const t = K.task(id, i, 2), where = `${id} #${i}: ${t.q}`;
    ok(t.tip && t.explain, "Tipp und Erklärung: " + where);
    if (t.type === "pick") ok(t.ans.length && t.ans.every((j) => j >= 0 && j < t.tokens.length), where);
    if (t.type === "choice") { ok(new Set(t.opts).size === t.opts.length, "Antworten eindeutig: " + where); ok(K.check(t, t.ans).ok, where); }
    if (t.type === "write") { ok(t.ans.length && K.check(t, t.ans[0]).ok, where); ok(!K.check(t, "xyz").ok, where); }
    if (t.type === "pick") { ok(K.check(t, t.ans.slice().reverse()).ok, "Reihenfolge beim Antippen egal: " + where); ok(!K.check(t, t.ans.slice(1)).ok || t.ans.length === 0, "fehlendes Wort ist falsch: " + where); }
  }
}
// gemischte Antworten: richtige Antwort folgt beim Mischen
for (let seed = 0; seed < 50; seed++) { const t = K.task("de.wortfamilie", seed); ok(/Farbe|Spiegel|Wolke|Sohn|Schrank|Lehrer|Kino|Bach|Hase|Kante/.test(t.opts[t.ans]), "Mischen behält die Lösung: " + t.q); }
// Zeitformen bleiben in fester Reihenfolge
ok(K.task("de.zeitform", 3).opts.join() === "Präsens,Präteritum,Perfekt,Futur", "Zeitformen in fester Reihenfolge");

// Prüfen: Groß/klein
const zw = K.task("de.zusammen", 0);
ok(K.check(zw, "Haustür").ok && K.check(zw, "haustür").ok, "Zusammengesetztes Nomen: Groß/klein nicht streng");
ok(K.check({ type: "write", ans: ["Haustür"], strict: true }, "haustür").caseOnly, "streng: Groß/klein zählt");
ok(!K.check({ type: "write", ans: ["Haustür"], strict: true }, "haustür").ok, "streng: klein geschrieben ist falsch");
// Reihenfolge, richtig/falsch
ok(K.check({ type: "order", items: ["a", "b"] }, ["a", "b"]).ok && !K.check({ type: "order", items: ["a", "b"] }, ["b", "a"]).ok, "Reihenfolge");
ok(K.check({ type: "tf", rows: [{ ok: true }, { ok: false }] }, [true, false]).ok, "richtig/falsch");

// Sterne
assert.equal(K.starsFor([]), 0);
assert.equal(K.starsFor([1, 1, 1, 0]), 1);
assert.equal(K.starsFor([1, 1, 1, 1, 1, 1, 0, 1]), 2);
assert.equal(K.starsFor([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), 3);
assert.equal(K.starsFor([1, 1, 1, 1, 1, 1, 1, 1, 0, 0]), 2);
// Runden: schwache Unterkompetenz kommt öfter
const stats = { "ma.mal": { n: 10, stars: 3, recent: [1] }, "ma.plus": { n: 10, stars: 0, recent: [0] } };
let cMal = 0, cPlus = 0;
for (let s = 0; s < 200; s++) for (const t of K.buildRound(["ma.mal", "ma.plus"], 6, stats, s)) { if (t.comp === "ma.mal") cMal++; else cPlus++; }
ok(cPlus > cMal * 1.5, `schwache Kompetenz öfter (plus ${cPlus}, mal ${cMal})`);
const round = K.buildRound(K.compsOf("de"), 8, {}, 5);
ok(round.length === 8 && new Set(round.map((t) => t.comp)).size >= 5, "Runde mischt Unterkompetenzen");

// Plan
ok(K.PLAN.length === 14 && K.PLAN[0].day === "2026-11-06" && K.PLAN[K.PLAN.length - 1].day === "2026-11-19", "Plan 6.–19.11.");
ok(K.planFor("2026-11-18").kind === "warm" && K.planFor("2026-11-10").kind === "lzk" && !K.planFor("2026-12-01"), "Plan nach Datum");
ok(K.etappen("full").length === 3 && K.etappen("mini").length === 1, "Etappen je Tag");
ok(K.compsOf("de").every((id) => id.startsWith("de.")) && K.compsOf("ma").every((id) => id.startsWith("ma.")), "Fächer getrennt");

console.log(`kompass ok (${n} Prüfungen)`);
