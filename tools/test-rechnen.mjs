// Tests der Kopfrechen-Logik (ohne Browser).
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const R = createRequire(import.meta.url)("../public/rechnen-logic.js");

// kleiner fester Zufall, damit Fehler wiederholbar sind
// (mulberry32: gleichmäßig genug, dass auch seltene Kombinationen vorkommen)
function seeded(s) { return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = seeded(42);

assert.equal(R.LEVELS.length, 9);
// Testpfad (was im Kopfrechentest drankommt) zuerst, dann die freiwilligen Extras
assert.deepEqual(R.LEVELS.filter((l) => l.path).map((l) => l.id), ["k-mal", "k-geteilt", "z-mal", "stelle"]);
assert.deepEqual(R.LEVELS.filter((l) => l.extra).map((l) => l.id), ["null", "z-geteilt", "h", "zz", "gross"]);
assert.ok(R.LEVELS.every((l) => !!l.path !== !!l.extra), "jede Stufe ist entweder Testpfad oder Extra");
assert.ok(R.LEVEL["k-mal"].n === 1 && R.LEVEL.stelle.n === 4 && R.LEVEL.gross.n === 9);

// 1) Jede Stufe: Ergebnis stimmt, Teilen geht auf, Schlüssel passt
const seen = {};
for (const lv of R.LEVELS) {
  seen[lv.id] = new Set();
  for (let i = 0; i < 5000; i++) {
    const t = R.makeTask(lv.id, rnd);
    assert.equal(t.level, lv.id);
    assert.ok(Number.isInteger(t.a) && Number.isInteger(t.b) && Number.isInteger(t.ans), "ganze Zahlen " + t.key);
    assert.ok(t.a >= 1 && t.b >= 1 && t.ans >= 1, "keine 0 " + t.key);
    // mal 1 nur im 1×1 und bei den großen Zahlen (wie im Test: 99 · 1, 1 · 57.543)
    if (lv.id !== "k-mal" && lv.id !== "stelle") assert.ok(t.a >= 2 && t.b >= 2, "keine 1er außer im 1×1: " + t.key);
    if (t.op === "·") assert.equal(t.a * t.b, t.ans);
    else if (t.op === "+") assert.equal(t.a + t.b, t.ans);
    else { assert.equal(t.a % t.b, 0, "Teilen ohne Rest " + t.key); assert.equal(t.a / t.b, t.ans); }
    assert.deepEqual(R.fromKey(t.key), t, "fromKey " + t.key);
    if (lv.id === "gross") assert.ok(Math.max(t.a, t.b, t.ans) <= 999, "11er-19er höchstens 999: " + t.key);
    if (lv.id === "gross") assert.ok([t.a, t.b, t.ans].some((x) => x >= 11 && x <= 19), "11er-19er-Reihe: " + t.key);
    if (lv.id === "k-mal") assert.ok(Math.max(t.a, t.b) <= 11, "1×1 mal bis 11: " + t.key);
    if (lv.id === "k-geteilt") assert.ok(Math.max(t.b, t.ans) <= 10, "1×1 geteilt: " + t.key);
    if (lv.id === "z-mal") assert.ok(t.op === "·" && t.ans <= 1500, "Zehner/Hunderter mal höchstens 1500: " + t.key);
    if (lv.id === "stelle") {
      if (t.op === "+") { const pa = String(t.a).replace(/0+$/, ""), pb = String(t.b).replace(/0+$/, ""); assert.ok(pa.length === 1 && pb.length === 1 && String(t.a).length !== String(t.b).length, "Stellenwert-Plus mit glatten Zahlen an verschiedenen Stellen: " + t.key); }
      else assert.ok(t.a === 1 || t.b === 1, "große Zahl mal 1: " + t.key);
      assert.ok(t.ans < 1000000, "unter einer Million: " + t.key);
    }
    seen[lv.id].add(R.show(t));
  }
}
// die Beispiele des Lehrplans und alle Aufgaben aus den beiden Kopfrechentests der Klasse kommen vor
const has = (lv, s) => assert.ok(seen[lv].has(s), `${lv}: ${s} kommt vor`);
has("k-mal", "7 · 8"); has("k-geteilt", "56 : 7");
has("z-mal", "7 · 90"); has("z-mal", "70 · 9");
// Test 1: 5·6 3·5 3·7 7·7 9·10 9·8 6·8 2·6 10·3 3·3 4·11 5·5 2·7 7·4 8·5 2·10 2·100 2·110 5·8; 99·1 (siehe unten)
for (const x of ["5 · 6", "3 · 5", "3 · 7", "7 · 7", "9 · 10", "9 · 8", "6 · 8", "2 · 6", "10 · 3", "3 · 3", "4 · 11", "5 · 5", "2 · 7", "7 · 4", "8 · 5", "2 · 10", "5 · 8"]) has("k-mal", x);
for (const x of ["2 · 100", "2 · 110"]) has("z-mal", x);
// Test 2: 2·10 3·9 4·8 5·7 6·6 7·9 8·80 9·60 10·5 11·4 3·4 3·40 3·400; 48:6 24:3 30:5 36:4 70:10 56:7 72:9
for (const x of ["2 · 10", "3 · 9", "4 · 8", "5 · 7", "6 · 6", "7 · 9", "10 · 5", "11 · 4", "3 · 4"]) has("k-mal", x);
for (const x of ["8 · 80", "9 · 60", "3 · 40", "3 · 400"]) has("z-mal", x);
for (const x of ["48 : 6", "24 : 3", "30 : 5", "36 : 4", "70 : 10", "56 : 7", "72 : 9"]) has("k-geteilt", x);
// Ausnahmen aus der Mail: 1 · 57.543 und 200.000 + 20.000 (gleiche Art)
assert.ok([...seen.stelle].some((x) => /^1 · \d{2}\.\d{3}$/.test(x)), "1 · 57.543-artig");
for (let i = 0; i < 60000; i++) seen.stelle.add(R.show(R.makeTask("stelle", rnd)));
has("stelle", "200.000 + 20.000");
has("z-geteilt", "640 : 8"); has("z-geteilt", "640 : 80"); has("z-geteilt", "630 : 9"); has("z-geteilt", "630 : 90");
has("h", "7 · 900"); has("h", "6300 : 9"); has("h", "6300 : 900");
has("zz", "70 · 90"); has("zz", "6300 : 70");
has("gross", "13 · 7"); has("gross", "91 : 13"); has("gross", "13 · 70"); has("gross", "910 : 13"); has("gross", "910 : 70");
has("null", "36 · 10"); has("null", "4200 : 100");
assert.ok(![...seen.gross].some((s) => s === "19 · 60"), "19 · 60 = 1140 ist zu groß");

// 2) 1×1-Kern für die Eltern-Tabelle
const core = (k) => R.fromKey(k).core;
assert.equal(core("z-geteilt|640:80"), "8x8");
assert.equal(core("z-geteilt|630:9"), "7x9");
assert.equal(core("z-mal|70·9"), "7x9");
assert.equal(core("zz|6300:70"), "7x9");
assert.equal(core("h|7·900"), "7x9");
assert.equal(core("k-mal|8·7"), "7x8");
assert.equal(core("k-geteilt|70:7"), "7x10");
assert.equal(core("null|36·10"), null);
assert.equal(core("gross|13·7"), null);

// 3) Runden: richtige Länge, keine Doppelten, gemischte Stufen
for (let k = 0; k < 200; k++) {
  const r = R.buildRound(["k-mal", "z-geteilt", "gross"], 10, {}, { rnd });
  assert.equal(r.length, 10);
  assert.equal(new Set(r.map((t) => t.key)).size, 10);
}
const mix = R.buildRound(["k-mal", "z-mal", "h", "zz"], 40, {}, { rnd, flat: true });
assert.equal(new Set(mix.map((t) => t.level)).size, 4, "Test-Mix enthält alle Stufen");

// 4) Gewichtung: was falsch war, kommt öfter
const facts = { "k-mal|7·8": { n: 3, w: 2, last: "x", ms: 9000 }, "k-mal|6·7": { n: 2, w: 1, last: "x", ms: 9000 } };
let hit = 0;
for (let k = 0; k < 300; k++) hit += R.buildRound(["k-mal"], 10, facts, { rnd }).filter((t) => facts[t.key]).length;
assert.ok(hit / 300 > 1.2, "Fehler-Aufgaben kommen bevorzugt, Mittel " + hit / 300);
assert.ok(R.weight({ n: 5, w: 0, last: "o", ms: 2000 }, 5000) < R.weight(undefined, 5000), "Sicheres seltener als Neues");
assert.ok(R.weight({ n: 2, w: 0, last: "o", ms: 9000 }, 5000) > R.weight({ n: 2, w: 0, last: "o", ms: 2000 }, 5000), "Langsames öfter");
// Fehler aus anderer Stufe kommen nicht in eine fremde Runde
for (let k = 0; k < 50; k++) assert.ok(R.buildRound(["zz"], 10, facts, { rnd }).every((t) => t.level === "zz"));

// 4b) Kopfrechentest wie in der Klasse: 20 Aufgaben, feste Mischung
for (let k = 0; k < 300; k++) {
  const t = R.schoolTest(rnd), lv = (id) => t.filter((x) => x.level === id).length;
  assert.equal(t.length, 20);
  assert.equal(new Set(t.map((x) => x.key)).size, 20, "keine doppelten Aufgaben");
  assert.deepEqual([lv("k-mal"), lv("z-mal"), lv("stelle"), lv("k-geteilt")], [9, 4, 1, 6]);
  assert.ok(t.some((x) => x.a === 11 || x.b === 11), "mal 11 dabei");
  assert.ok(t.some((x) => x.level === "k-mal" && (x.a === 10 || x.b === 10)), "mal 10 dabei");
  assert.ok(t.some((x) => x.level === "k-mal" && x.b === 1 && x.a > 10), "99 · 1-artig dabei");
  assert.ok(t.slice(14).every((x) => x.op === ":") && t.slice(0, 14).every((x) => x.op !== ":"), "erst mal, dann geteilt (wie auf dem Blatt)");
}
// Tausenderpunkte wie auf dem Blatt
assert.equal(R.fmt(57543), "57.543");
assert.equal(R.fmt(220000), "220.000");
assert.equal(R.fmt(6300), "6300");
assert.equal(R.show(R.task("stelle", 200000, "+", 20000)), "200.000 + 20.000");
assert.equal(R.show(R.task("stelle", 8000, "+", 60000)), "8.000 + 60.000", "Stellenwerte: beide Zahlen mit Punkt");
assert.equal(R.show(R.task("stelle", 1, "·", 57543)), "1 · 57.543");
assert.equal(R.task("stelle", 200000, "+", 20000).ans, 220000);
assert.equal(R.parseNum("220.000"), 220000);
assert.equal(R.parseNum("220000"), 220000);

// 5) Eingabe lesen
assert.equal(R.parseNum("630"), 630);
assert.equal(R.parseNum(" 6 300 "), 6300);
assert.equal(R.parseNum("6.300"), 6300);
assert.ok(Number.isNaN(R.parseNum("")) && Number.isNaN(R.parseNum("6,3")) && Number.isNaN(R.parseNum("abc")));

// 6) Rechentricks: Tipp verrät nichts, Erklärung endet mit dem Ergebnis
const h = (k) => R.help(R.fromKey(k));
assert.equal(h("z-geteilt|640:8").tip, "Rechne zuerst 64 : 8. Dann hängst du eine Null an.");
assert.equal(h("z-geteilt|640:80").tip, "Nimm bei beiden Zahlen eine Null weg: 64 : 8.");
assert.equal(h("z-mal|7·90").tip, "Rechne zuerst 7 · 9. Dann hängst du eine Null an.");
assert.equal(h("zz|70·90").explain, "7 · 9 = 63, dazu zwei Nullen: 6300");
assert.equal(h("h|6300:9").tip, "Rechne zuerst 63 : 9. Dann hängst du zwei Nullen an.");
assert.equal(h("zz|6300:70").tip, "Nimm bei beiden Zahlen eine Null weg: 630 : 7.");
assert.equal(h("gross|13·7").explain, "10 · 7 = 70 und 3 · 7 = 21, zusammen 91");
assert.equal(h("gross|13·70").tip, "Rechne zuerst 13 · 7. Dann hängst du eine Null an.");
assert.equal(h("gross|910:13").tip, "Rechne zuerst 91 : 13. Dann hängst du eine Null an.");
assert.equal(h("gross|91:13").tip, "Denk an die Malaufgabe: 13 · ? = 91");
assert.equal(h("k-mal|7·8").tip, "Rechne 5 · 7 und dann noch 3 · 7 dazu.");
assert.equal(h("k-mal|9·6").explain, "10 · 6 = 60, minus 6 = 54");
assert.equal(h("k-mal|2·6").tip, "Verdopple 6.");
assert.equal(h("k-mal|5·8").explain, "10 · 8 = 80, die Hälfte davon: 40");
assert.equal(h("null|36·10").tip, "Mal 10: Hänge eine Null an.");
assert.equal(h("null|4200:100").tip, "Geteilt durch 100: Nimm zwei Nullen weg.");
assert.equal(h("k-mal|4·11").explain, "10 · 4 = 40 und 1 · 4 = 4, zusammen 44");
assert.equal(h("k-mal|99·1").tip, "Mal 1: Die Zahl bleibt genau gleich.");
assert.equal(h("stelle|1·57543").explain, "57.543 · 1 = 57.543");
assert.equal(h("stelle|200000+20000").tip, "Schau auf die Stellen: Hunderttausender und Zehntausender. Jede Zahl steht an einer anderen Stelle.");
assert.equal(h("stelle|200000+20000").explain, "200.000 + 20.000 = 220.000");
assert.equal(h("z-mal|2·110").tip, "Rechne zuerst 2 · 11. Dann hängst du eine Null an.");
assert.equal(R.speech(R.fromKey("stelle|200000+20000")), "200000 plus 20000");
for (const lv of R.LEVELS) {
  for (let i = 0; i < 3000; i++) {
    const t = R.makeTask(lv.id, rnd), x = R.help(t);
    assert.ok(x.tip && x.explain, "Hilfe für " + t.key);
    assert.ok(x.explain.endsWith(String(t.ans)) || x.explain.endsWith(R.fmtT(t, t.ans)), "Erklärung endet mit Ergebnis: " + t.key + " -> " + x.explain);
    // zweistellige Ergebnisse stehen nicht im Tipp (außer sie sind Teil der Aufgabe)
    if (t.ans >= 10 && ![t.a, t.b].includes(t.ans)) assert.ok(!new RegExp("(^|\\D)" + t.ans + "(\\D|$)").test(x.tip), "Tipp verrät nicht: " + t.key + " -> " + x.tip);
  }
}
assert.equal(R.speech(R.fromKey("z-geteilt|640:80")), "640 geteilt durch 80");
assert.equal(R.speech(R.fromKey("z-mal|7·90")), "7 mal 90");

// 7) Sterne
const run = (oks, ms = 3000) => oks.map((o) => [o, ms]);
assert.equal(R.levelStars([], 5000), 0);
assert.equal(R.levelStars(run([1, 1, 1, 1, 1, 1, 1, 0, 0, 0]), 5000), 0);
assert.equal(R.levelStars(run([1, 1, 1, 1, 1, 1, 1, 1, 0, 0]), 5000), 1);
assert.equal(R.levelStars(run(Array(20).fill(1).fill(0, 0, 4)), 5000), 2);
assert.equal(R.levelStars(run(Array(20).fill(1).fill(0, 0, 2)), 5000), 3);
assert.equal(R.levelStars(run(Array(20).fill(1), 7000), 5000), 2, "zu langsam: kein dritter Stern");
assert.equal(R.median([3, 1, 2]), 2);

console.log("rechnen ok");
