import { createRequire } from "node:module";
import assert from "node:assert/strict";
const L = createRequire(import.meta.url)("../public/logic.js");

const j = (i, n) => L.judge(i, n);
// richtige Schreibweisen
assert.equal(j("Thüringen", ["Thüringen"]).kind, "exact");
assert.equal(j("thüringen", ["Thüringen"]).kind, "case");
assert.deepEqual([j("Thueringen", ["Thüringen"]).ok, j("Thueringen", ["Thüringen"]).kind], [true, "spelling"]);
assert.equal(j("Thuringen", ["Thüringen"]).ok, true);
assert.equal(j("Oesterreich", ["Österreich"]).ok, true);
assert.equal(j("Rheinland Pfalz", ["Rheinland-Pfalz"]).kind, "spelling");
assert.equal(j("Bayrischer Wald", ["Bayerischer Wald", "Bayrischer Wald"]).ok, true);
assert.equal(j("  Schwäbische Alb ", ["Schwäbische Alb"]).ok, true);
assert.equal(j("Schwaebische Alb", ["Schwäbische Alb"]).ok, true);
// Rechtschreibung ist zweitrangig: kleine Schreibfehler gelten als richtig ("typo")
const typo = (i, n, o) => { const r = L.judge(i, n, o); return r.ok && r.kind === "typo"; };
assert.ok(typo("Niedersachen", ["Niedersachsen"]));
assert.ok(typo("Hesen", ["Hessen"]));
assert.ok(typo("Harx", ["Harz"]));
assert.ok(typo("Mertz", ["Merz", "Friedrich Merz"]));
assert.equal(L.judge("Mertz", ["Merz", "Friedrich Merz"]).canonical, "Merz");
// echte Schreibfehler aus dem Lapbook
assert.ok(typo("Denemark", ["Dänemark"]));
assert.ok(typo("Niderlande", ["Niederlande"]));
assert.ok(typo("Schweitz", ["Schweiz"]));
assert.ok(typo("Österoich", ["Österreich"]));
assert.ok(typo("nidersachsen", ["Niedersachsen"]));
assert.ok(typo("Badenwürtten Berg", ["Baden-Württemberg"]));
assert.ok(typo("martz 2029", ["März 2029"]));
assert.equal(j("weser", ["Weser"]).kind, "case");
// zu weit weg bleibt falsch
assert.equal(j("Luchsenburg", ["Luxemburg"]).ok, false);
assert.equal(j("Reien", ["Rhein"]).ok, false);
assert.equal(j("Hamburg", ["Bremen"]).kind, "wrong");
assert.equal(j("Rhein", ["Donau"]).kind, "wrong");
assert.equal(j("Rot", ["Rom"]).kind, "wrong");
assert.equal(j("2029", ["März 2029"]).ok, false);
assert.equal(j("", ["Harz"]).kind, "empty");
// ein anderer Begriff ist nie ein Tippfehler des gesuchten
assert.equal(j("Sachsen", ["Sachsen-Anhalt"]).ok, false);
assert.equal(L.judge("Ostse", ["Nordsee"], ["Ostsee"]).ok, false);
assert.equal(L.judge("Bremen", ["Bremen"], ["Bayern"]).kind, "exact");
assert.equal(L.judge("Brmen", ["Bremen"], ["Bayern"]).ok, true);
assert.equal(L.judge("Main", ["Rhein"], ["Main"]).ok, false);
// mehrere Antworten in einer Zeile
const all = (i) => L.judgeAll(i, ["Nordsee", "Ostsee"]);
assert.ok(all("Nordsee und Ostsee").ok);
assert.ok(all("Ostsee, Nordsee").ok);
assert.ok(all("nordsee ostsee").ok);
assert.equal(all("Nordse und Ostse").kind, "typo");
assert.equal(all("Nordsee").kind, "partial");
assert.deepEqual(all("Nordsee").missing, ["Ostsee"]);
assert.equal(all("Österreich").kind, "wrong");
assert.equal(all("").kind, "empty");
assert.ok(L.judgeAll("Berlin, Hamburg und München", ["Berlin", "Hamburg", "München"]).ok);
assert.equal(L.judgeAll("Berlin Hamburg", ["Berlin", "Hamburg", "München"]).kind, "partial");
// Buchstaben-Vergleich
const marked = (d, side) => d[side].filter(([, ok]) => !ok).map(([c]) => c).join("");
let d = L.diffMark("Denemark", "Dänemark");
assert.equal(marked(d, "right"), "ä");
assert.equal(marked(d, "mine"), "e");
d = L.diffMark("Schweitz", "Schweiz");
assert.equal(marked(d, "right"), "");
assert.equal(marked(d, "mine"), "t");
d = L.diffMark("Bertien", "Berlin");
assert.equal(marked(d, "right"), "l");
d = L.diffMark("weser", "Weser");
assert.equal(marked(d, "right") + marked(d, "mine"), "", "nur Groß/Klein ist kein Buchstabenfehler");
assert.equal(L.diffMark("", "Harz").right.length, 4);
assert.equal(L.closest("Hamburk", ["Berlin", "Hamburg", "Bremen"]), "Hamburg");
// Zahlen
const num = (i) => L.judgeNumber(i, [83, 84, 85], "ca. 84 Millionen").ok;
assert.ok(num("84") && num("84 Mio") && num("84 Mio.") && num("84 Millionen") && num("83") && num("84.000.000") && num("84000000"));
assert.ok(!num("8") && !num("48") && !num("840") && !num("viele") && !num(""));
assert.ok(L.judgeNumber("16", [16], "16").ok && !L.judgeNumber("15", [16], "16").ok);
// Note
assert.deepEqual([100, 90, 89, 75, 60, 45, 25, 24, 0].map(L.gradeFor), [1, 1, 2, 2, 3, 4, 5, 6, 6]);
// Auswahl: eindeutig, richtige Anzahl, schwere bevorzugt
const list = Array.from({ length: 20 }, (_, i) => i);
const s = L.sample(list, 10, (x) => (x < 5 ? 10 : 1));
assert.equal(new Set(s).size, 10);
assert.equal(L.sample([1, 2], 10, () => 1).length, 2);
let hard = 0;
for (let k = 0; k < 500; k++) hard += L.sample(list, 5, (x) => (x < 5 ? 10 : 1)).filter((x) => x < 5).length;
assert.ok(hard / 500 > 3, "schwere Begriffe werden bevorzugt, Mittel " + hard / 500);
assert.equal(L.shuffle([1, 2, 3, 4]).length, 4);
console.log("logic ok");
