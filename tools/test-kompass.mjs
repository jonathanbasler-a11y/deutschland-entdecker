// Tests der Kompass-Logik: Generatoren gegen unabhängige Nachrechnung, Deutsch-Bank, Prüfen, Sterne, Plan.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const req = createRequire(import.meta.url);
const K = req("../public/kompass-logic.js");
const D = req("../public/kompass-data.js");
K.attachBank(D.BANK);
const T = req("../public/kompass-text.js");
req("../public/kompass-geo.js");
K.attachBank(T.BANK2); K.extendBank(T.EXTRA);

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
// Neue Aufgabentypen und Lesetexte
for (const id of Object.keys(T.BANK2)) {
  const def = T.BANK2[id], list = K.COMP[id].list;
  ok(list.length >= (id.startsWith("de.lesen.") ? 6 : 4), `${id}: genug Aufgaben (${list.length})`);
  if (id.startsWith("de.lesen.")) { ok(def.solo && def.passage && (def.passage.lines || def.passage.paras).length >= 3, "Lesetext hat Text: " + id); ok(K.unitTasks(id).length === list.length, "Leseeinheit: " + id); }
  for (let i = 0; i < list.length; i++) {
    const t = K.task(id, i, 2), where = `${id} #${i}: ${t.q}`;
    ok(t.tip && t.explain && t.q, "Tipp, Erklärung, Frage: " + where);
    if (t.type === "choice") { ok(new Set(t.opts).size === t.opts.length && t.ans >= 0 && t.ans < t.opts.length, "Antworten eindeutig: " + where); ok(K.check(t, t.ans).ok && !K.check(t, (t.ans + 1) % t.opts.length).ok, where); }
    if (t.type === "multi") ok(t.ans.length >= 1 && t.ans.every((j) => j < t.opts.length) && K.check(t, t.ans).ok && !K.check(t, []).ok, where);
    if (t.type === "pick") ok(t.ans.every((j) => j < t.tokens.length) && K.check(t, t.ans).ok && !K.check(t, t.ans.slice(1)).ok, where);
    if (t.type === "write") ok(K.check(t, t.ans[0]).ok && !K.check(t, "xyzxyz").ok, where);
    if (t.type === "tf") ok(t.rows.length >= 3 && K.check(t, t.rows.map((r) => r.ok)).ok && !K.check(t, t.rows.map((r) => !r.ok)).ok, where);
    if (t.type === "order") ok(new Set(t.items).size === t.items.length && K.check(t, t.items.slice()).ok && !K.check(t, t.items.slice().reverse()).ok, where);
    if (t.type === "match") {
      ok(t.left.length === t.ans.length && t.ans.every((a) => a.every((j) => j < t.right.length)), "Verbinden: Antworten gültig: " + where);
      ok(K.check(t, t.ans).ok, "Verbinden: Lösung wird erkannt: " + where);
      ok(!K.check(t, t.left.map(() => [])).ok || t.ans.every((a) => !a.length), "Verbinden: leer ist falsch: " + where);
      ok(K.solution(t).length > 5, where);
    }
    if (t.type === "cut") ok(t.ans.every((j) => j >= 0 && j < t.tokens.length - 1) && K.check(t, t.ans).ok && !K.check(t, []).ok, "Trennen: " + where);
    if (t.type === "self") ok(t.model && K.check(t, true).ok && !K.check(t, false).ok && K.solution(t) === t.model, "Selbstprüfen: " + where);
  }
}
// Raum und Form: Figuren, Würfelnetze, Ansichten
const G = req("../public/kompass-geo.js");
{
  // Würfelnetze: von 35 freien Sechser-Figuren sind genau 11 gültig
  const canon = (c) => G.norm(c).map((x) => x.join(",")).sort().join(";");
  let cur = [[[0, 0]]];
  for (let n = 1; n < 6; n++) {
    const nxt = new Map();
    for (const c of cur) { const set = new Set(c.map((x) => x.join(","))); for (const [x, y] of c) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (set.has((x + dx) + "," + (y + dy))) continue; const nc = G.norm([...c, [x + dx, y + dy]]); nxt.set(canon(nc), nc); } }
    cur = [...nxt.values()];
  }
  const free = []; for (const c of cur) if (!free.some((f) => G.sameShape(f, c))) free.push(c);
  ok(cur.length === 216 && free.length === 35, `216 feste und 35 freie Sechser-Figuren (${cur.length}, ${free.length})`);
  ok(free.filter(G.isCubeNet).length === 11, "genau 11 gültige Würfelnetze");
  ok(G.isCubeNet([[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]]) && !G.isCubeNet([[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]]) && !G.isCubeNet([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1]]), "Kreuz gültig, 2×3 und 5er-Reihe ungültig");
  // Rand und Ansichten
  ok(G.perimeter([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]) === 10 && G.perimeter([[0, 0], [1, 0], [0, 1]]) === 8, "Rand: 2×3 = 10, Winkel aus 3 = 8");
  const tower = [[0, 0, 0], [0, 0, 0], [3, 0, 0]];
  const v = G.views(tower);
  ok(v.front.join() === "3,0,0" && v.right.join() === "3,0,0" && v.left.join() === "0,0,3" && v.back.join() === "0,0,3", "Ansichten eines Turms vorne links stimmen");
  const asym = [[1, 3, 2], [0, 2, 3], [2, 1, 1]];
  ok(G.sameBuilding(asym, G.rot(G.rot(asym))) && !G.sameBuilding(asym, G.mirror(asym)), "Gedrehtes Gebäude ist gleich, gespiegeltes nicht");
  // Spiegelachsen jeder Figur unabhängig nachgerechnet (Spiegelung an Geraden durch den Mittelpunkt)
  for (const sh of G.SHAPES) {
    const pts = sh.p.split(" ").map((s) => s.split(",").map(Number)), cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    let n = 0;
    for (let a = 0; a < 180; a += 0.5) {
      const t = (a * Math.PI) / 180, c = Math.cos(2 * t), s = Math.sin(2 * t);
      const refl = pts.map(([x, y]) => [cx + (x - cx) * c + (y - cy) * s, cy + (x - cx) * s - (y - cy) * c]);
      if (refl.every(([x, y]) => pts.some(([px, py]) => Math.hypot(px - x, py - y) < 0.01))) n++;
    }
    ok(n === sh.ax, `${sh.n}: ${sh.ax} Spiegelachsen (nachgerechnet ${n})`);
  }
  for (const id of K.compsOfArea("ma.raum")) {
    for (let seed = 1; seed <= 250; seed++) for (const lv of [1, 2]) {
      const t = K.task(id, seed * 131 + lv, lv), where = `${id} ${seed}: ${t.q}`;
      ok(t.q && t.tip && t.explain, "Text, Tipp, Erklärung: " + where);
      if (t.type === "num") ok(Number.isInteger(t.ans) && t.ans >= 0 && K.check(t, String(t.ans)).ok && !K.check(t, String(t.ans + 1)).ok, "Zahl: " + where);
      if (t.type === "choice") ok(new Set(t.opts).size === t.opts.length && K.check(t, t.ans).ok && (!t.figs || t.figs.length === t.opts.length), "Auswahl: " + where);
      if (t.type === "multi") ok(t.ans.length >= 1 && t.ans.length < t.opts.length && K.check(t, t.ans).ok && (!t.figs || t.figs.length === t.opts.length), "Mehrfach: " + where);
      if (t.type === "grid") {
        const g = new Set(t.given.map((c) => c.join(",")));
        ok(t.ans.every((c) => c[0] >= 0 && c[1] >= 0 && c[0] < t.cols && c[1] < t.rows && !g.has(c.join(","))), "Raster: Lösung liegt im Feld: " + where);
        ok(K.check(t, t.ans.map((c) => c.join(","))).ok && !K.check(t, []).ok, "Raster: Lösung wird erkannt: " + where);
      }
      if (id === "ma.raum.flaeche") ok((t.fig.match(/stroke="#5b7fb8"/g) || []).length === t.ans, "Fläche = Kästchen im Bild: " + where);
      if (id === "ma.raum.spiegeln") ok(t.given.length === t.ans.length && t.given.every(([x, y]) => t.ans.some(([a, b]) => a === t.cols - 1 - x && b === y)), "Spiegelbild stimmt: " + where);
      if (id === "ma.raum.netzergaenzen") {
        const full = [...t.given, ...t.ans];
        ok(G.isCubeNet(full) && K.check(t, t.ans.map((c) => c.join(","))).ok, "Netz ergänzen: Lösung ist ein Würfelnetz: " + where);
        const bad = t.ans.map((c) => [c[0], c[1]]); bad[1] = [bad[0][0] + 5, bad[0][1]];
        ok(!K.check(t, [bad[0].join(","), "0,0"]).ok || G.isCubeNet([...t.given, bad[0], [0, 0]]), "Netz ergänzen: falsche Wahl wird erkannt: " + where);
      }
    }
  }
}
// Mathe 2: Daten und Zufall, Größen, mehr Zahlen. Jede Lösung wird aus dem Aufgabentext unabhängig nachgerechnet.
req("../public/kompass-mathe2.js");
{
  const NEW = K.COMPS.filter((c) => c.gen && /^ma\.(luecke|ergaenzen|mitte|buendeln|strahl|ratsel|tausch|gerade|fehler|umkehr|geschickt|verdoppeln|malvergleich|wachsend|wechsel|mauerdeck|darstellung|uhr|uhrplus|gemischt|einheit|weitsprung|eisdiele|fahrplan|daten\.)/.test(c.id)).map((c) => c.id);
  ok(NEW.length >= 33, "neue Mathe-Aufgabenarten: " + NEW.length);
  const mins = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const nums = (s) => (s.match(/\d+(?:[.,]\d+)?/g) || []).map((x) => Number(x.replace(/\./g, "").replace(",", ".")));
  const counts = {};
  for (const id of NEW) {
    for (let seed = 1; seed <= 300; seed++) for (const lv of [1, 2]) {
      const t = K.task(id, seed * 53 + lv, lv), where = `${id} ${seed}: ${t.q}`;
      counts[id] = (counts[id] || 0) + 1;
      ok(t.q && t.tip && t.explain, "Text, Tipp, Erklärung: " + where);
      if (t.type === "num") ok(Number.isFinite(t.ans) && t.ans >= 0 && K.check(t, t.money ? K.fmtMoney(t.ans) : String(t.ans)).ok && !K.check(t, String(t.ans + 1)).ok, "Zahl: " + where);
      if (t.type === "choice") ok(new Set(t.opts).size === t.opts.length && t.ans >= 0 && t.ans < t.opts.length && K.check(t, t.ans).ok && (!t.figs || t.figs.length === t.opts.length), "Auswahl: " + where);
      if (t.type === "multi") ok(t.ans.length >= 1 && t.ans.length < t.opts.length && K.check(t, t.ans).ok, "Mehrfach: " + where);
      if (t.type === "match") ok(K.check(t, t.ans).ok && new Set(t.right).size === t.right.length, "Verbinden: " + where);
      if (t.type === "write") ok(K.check(t, t.ans[0]).ok && !K.check(t, "xyzxyz").ok, "Schreiben: " + where);
      if (t.type === "grid") ok(t.ans.every((c) => c[0] < t.cols && c[1] < t.rows) && K.check(t, t.ans.map((c) => c.join(","))).ok, "Raster: " + where);
      if (t.table) ok(t.table.rows.every((row) => row.length === t.table.head.length), "Tabelle rechteckig: " + where);
      let m;
      if (id === "ma.luecke") {
        if ((m = /^(\d+) · ___ = ([\d.]+)$/.exec(t.q))) ok(+m[1] * t.ans === nums(m[2])[0], where);
        else if ((m = /^___ : (\d+) = (\d+)$/.exec(t.q))) ok(t.ans / +m[1] === +m[2], where);
        else if ((m = /^(\d+) \+ ___ = (\d+)$/.exec(t.q))) ok(+m[1] + t.ans === +m[2], where);
        else if ((m = /^___ − (\d+) = (\d+)$/.exec(t.q))) ok(t.ans - +m[1] === +m[2], where);
        else ok(false, "unbekanntes Format " + where);
      }
      if (id === "ma.ergaenzen") { m = /^([\d.]+) \+ ___ = ([\d.]+)$/.exec(t.q); ok(m && nums(m[1])[0] + t.ans === nums(m[2])[0], where); }
      if (id === "ma.mitte") { const [a, b] = nums(t.q); ok(t.ans - a === b - t.ans && a < t.ans && t.ans < b, where); }
      if (id === "ma.buendeln") { const [H, Z, E] = nums(t.q); ok(H * 100 + Z * 10 + E === t.ans, where); }
      if (id === "ma.strahl" && /Schrittweite/.test(t.q)) { const [a, , p] = nums(t.q); ok(t.ans * p === 100, where); }
      if (id === "ma.ratsel") {
        const n = nums(t.q), f = /verdopple/.test(t.q) ? (x) => 2 * x + n[0] : /verdreifache/.test(t.q) ? (x) => 3 * x - n[0] : /halbiere/.test(t.q) ? (x) => x / 2 + n[0] : /ziehe/.test(t.q) ? (x) => x - n[0] : (x) => x + n[0];
        const given = n[n.length - 1], sols = []; for (let x = 0; x <= 400; x++) if (f(x) === given) sols.push(x);
        ok(sols.length === 1 && sols[0] === t.ans, "Zahlenrätsel eindeutig: " + where);
      }
      if (id === "ma.tausch") { const [a, b, c, d] = nums(t.q); if (/Tausch/.test(t.q)) ok(t.ans === a * b, where); else ok(t.ans === a && (/\+ ___/.test(t.q) ? a * (b + 1) === c + t.ans : a * (b - 1) === c - t.ans), where); }
      if (id === "ma.gerade") { const want = /ungerade/.test(t.q) ? 1 : 0; ok(t.opts.every((o, i) => { const [a, b] = nums(o); return t.ans.includes(i) === ((a + b) % 2 === want); }), where); }
      if (id === "ma.fehler") { const [a, b, w] = nums(t.q); ok(t.ans === a + b && w !== t.ans, where); }
      if (id === "ma.umkehr") { const [a, b, c] = nums(t.q); ok(c === a - b && t.opts[t.ans].replace(/\./g, "") === `${c} + ${b} = ${a}`, where); }
      if (id === "ma.geschickt") { const n = nums(t.q); ok((/− 99/.test(t.q) && t.ans === n[0] - 99) || (/\+ 99/.test(t.q) && t.ans === n[0] + 99) || (/\+ 199/.test(t.q) && t.ans === n[0] + 199) || (/25 ·/.test(t.q) && t.ans === 25 * n[1]), where); }
      if (id === "ma.verdoppeln") { const [n] = nums(t.q); ok(/Verdopple/.test(t.q) ? t.ans === 2 * n : t.ans * 2 === n, where); }
      if (id === "ma.malvergleich") { const body = /: (.*) ___ (.*)$/.exec(t.q), val = (s) => (s.includes("+") ? s.split(" + ").reduce((x, y) => x + +y, 0) : s.includes("·") ? s.split(" · ").reduce((x, y) => x * +y, 1) : +s), l = val(body[1]), r2 = val(body[2]); ok(t.opts[t.ans] === (l < r2 ? "<" : l === r2 ? "=" : ">"), where); }
      if (id === "ma.wachsend") { const n = nums(t.q), d = n[3] - n[1]; ok(n[5] - n[3] === d && t.ans === n[1] + (n[6] - 1) * d, where); }
      if (id === "ma.wechsel") { const seq = nums(t.q.split("? ")[1]); const p = seq[1] - seq[0], q = seq[1] - seq[2]; ok(t.opts[t.ans] === `erst +${p}, dann −${q}` && seq[3] - seq[2] === p && seq[4] - seq[3] === -q, where); }
      if (id === "ma.mauerdeck" && /Mitte gehört/.test(t.q)) { const n = nums(t.q), mx = Math.max(n[0], n[1], n[2]); ok(+t.opts[t.ans] === mx, where); }
      if (id === "ma.uhrplus") { const [h, m, d] = [...t.q.match(/(\d+):(\d+)/).slice(1).map(Number), +/braucht (\d+)/.exec(t.q)[1]], tot = h * 60 + m + d; ok(t.ans[0] === `${Math.floor(tot / 60)}:${String(tot % 60).padStart(2, "0")}`, where); }
      if (id === "ma.gemischt" && t.type === "num") { const n = nums(t.q); if (/m .* cm = ___ cm/.test(t.q)) ok(n[0] * 100 + n[1] === t.ans, where); else if (/kg .* g = ___ g/.test(t.q)) ok(n[0] * 1000 + n[1] === t.ans, where); else if (/___ m$/.test(t.q) && /km/.test(t.q)) ok(n[0] === n[1] * 1000 + t.ans, where); else if (/___ ml$/.test(t.q)) ok(n[0] === n[1] * 1000 + t.ans, where); else if (/kg ___ g/.test(t.q)) ok(n[0] === n[1] * 1000 + t.ans, where); }
      if (id === "ma.weitsprung") { const row = (name) => t.table.rows.find((x) => x[0] === name)[1], names = t.table.rows.map((x) => x[0]), hi = names.find((n) => t.q.startsWith(`Weitsprung beim Sportfest: ${n} `)), lo = names.find((n) => t.q.endsWith(`als ${n}.`)); ok(Math.round((nums(row(hi))[0] - nums(row(lo))[0]) * 100) === t.ans, where); }
      if (id === "ma.eisdiele" && /zurück/.test(t.q)) { const n = nums(t.q); const p = n[0], persons = n[1], k = n[2], pay = n[3]; ok(Math.abs(pay - persons * k * p - t.ans) < 0.001, where); }
      if (id === "ma.eisdiele" && /3 Kugeln/.test(t.q) && !/zurück/.test(t.q)) ok(Math.abs(3 * nums(t.q)[0] - t.ans) < 0.001, where);
      if (id === "ma.fahrplan") {
        const rows = t.table.rows;
        if (/dauert/.test(t.q)) ok(mins(rows[3][1]) - mins(rows[0][1]) === t.ans, where);
        else if (/Alle wie viele/.test(t.q)) ok(mins(rows[0][2]) - mins(rows[0][1]) === t.ans, where);
        else { const dl = mins(/um (\d+:\d+) Uhr/.exec(t.q)[1]); const ok2 = [1, 2, 3].filter((c) => mins(rows[3][c]) <= dl); ok(t.ans === Math.max(...ok2) - 1, where); }
      }
      if (id === "ma.daten.durchschnitt") { const n = nums(t.q), cnt = n[0], v = n.slice(1); ok(v.length === cnt && v.reduce((a, b) => a + b, 0) / cnt === t.ans, where); }
      if (id === "ma.daten.kombi") { const [a, b] = nums(t.q); ok(a * b === t.ans, where); }
      if (id === "ma.daten.gleich") { const [n, a, big] = nums(t.q); ok(t.ans / big === a / n, where); }
      if (id === "ma.daten.tabelle") {
        const vals = t.table.rows[0].slice(1).map(Number), cats = t.table.head.slice(1);
        if (/am häufigsten/.test(t.q)) ok(vals[t.ans] === Math.max(...vals), where);
        else if (/zusammen/.test(t.q)) ok(t.ans === vals.reduce((a, b) => a + b, 0), where);
        else if (/mehr/.test(t.q)) { const [x, y] = [...t.q.matchAll(/„([^“]+)“/g)].map((q) => vals[cats.indexOf(q[1])]); ok(t.ans === x - y, where); }
        else { const c = /„([^“]+)“/.exec(t.q)[1]; ok(t.ans === vals[cats.indexOf(c)], where); }
      }
      if (id === "ma.daten.balkenzeichnen") { const vals = t.table.rows[0].slice(1).map(Number), top = (x) => t.ans.filter((c) => c[0] === x).length; ok(vals.every((v, x) => top(x) * 10 === v), "Balken passen zur Tabelle: " + where); }
    }
  }
  ok(Object.keys(counts).length === NEW.length, "alle neuen Arten erzeugt");
  ok(K.compsOfArea("ma.daten").length === 11, "Daten und Zufall: 11 Arten (" + K.compsOfArea("ma.daten").length + ")");
}
// Einzelfälle, die stimmen müssen
ok(K.task("de.recht.gross", 0).ans.length === 4, "Groß: Satz 1 hat 4 Wörter");
ok(K.check(K.task("de.recht.trenne", 0), "Unsere Mannschaft hat das letzte Spiel verloren.").ok, "Wörter trennen: richtiger Satz");
ok(!K.check(K.task("de.recht.trenne", 0), "unsere mannschaft hat das letzte spiel verloren").ok, "Wörter trennen: klein ist falsch");
ok(K.check(K.task("de.recht.trenne", 0), "Unsere Mannschaft hat das letzte Spiel verloren").ok, "Wörter trennen: Punkt darf fehlen");
ok(!K.compsOf("de").some((id) => id.startsWith("de.lesen.")), "Lesetexte sind nicht in den gemischten Etappen");
ok(K.compsOfArea("de.lesen").length === 5 && K.compsOfArea("de.recht").length === 7, "Bereiche Lesen (5 Texte) und Rechtschreiben (7 Arten)");
// Prüfen, dass Verbinden-Aufgaben aus dem Test stimmen (Kaugummi)
{ const t = K.task("de.lesen.kaugummi", 3); ok(t.type === "match" && K.check(t, [[0], [2], [1]]).ok && !K.check(t, [[0], [1], [2]]).ok, "Kaugummi: Satzteile verbinden"); }
{ const t = K.task("de.satzmatch", 0); ok(K.check(t, [[], [0], [], [0]]).ok && !K.check(t, [[0], [0], [0], [0]]).ok, "Satzglieder: Ein Kind kauen = falsch"); }
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
