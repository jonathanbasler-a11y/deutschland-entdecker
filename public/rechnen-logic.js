// Kopfrechnen ohne Oberfläche: Aufgaben erzeugen, Rechentricks, Sterne, gewichtete Auswahl.
// Läuft im Browser und in Node (siehe tools/test-rechnen.mjs).
(function (root) {
  "use strict";
  const L = typeof module !== "undefined" && module.exports ? require("./logic.js") : root.DELogic;

  // Der Rechen-Turm. Testpfad (path): genau das, was im Kopfrechentest der Klasse drankommt
  // (20 Aufgaben, 7 Minuten). Extra: schwerere Stufen, freiwillig, kommen im Test nicht dran.
  const LEVELS = [
    { id: "k-mal", name: "1×1: mal", short: "1×1 mal", ex: "7 · 8, 4 · 11, 9 · 1", path: true },
    { id: "k-geteilt", name: "1×1: geteilt", short: "1×1 geteilt", ex: "48 : 6, 70 : 10", path: true },
    { id: "z-mal", name: "Mal mit Zehnern und Hundertern", short: "Zehner, Hunderter", ex: "8 · 80, 3 · 400, 2 · 110", path: true },
    { id: "stelle", name: "Große Zahlen", short: "Große Zahlen", ex: "1 · 57.543, 200.000 + 20.000", path: true },
    { id: "null", name: "Nullen-Trick", short: "·10 und :100", ex: "36 · 10, 4200 : 100", extra: true },
    { id: "z-geteilt", name: "Mit Zehnern: geteilt", short: "Zehner geteilt", ex: "640 : 8, 640 : 80", extra: true },
    { id: "h", name: "Mit Hundertern", short: "Hunderter", ex: "7 · 900, 6300 : 9", extra: true },
    { id: "zz", name: "Zehner mal Zehner", short: "Zehner · Zehner", ex: "70 · 90, 6300 : 70", extra: true },
    { id: "gross", name: "11er bis 19er", short: "11er bis 19er", ex: "13 · 7, 91 : 13", extra: true },
  ];
  const LEVEL = Object.fromEntries(LEVELS.map((l, i) => [l.id, Object.assign({ n: i + 1 }, l)]));
  const MAX_GROSS = 999;

  const ri = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pick = (rnd, list) => list[Math.floor(rnd() * list.length)];
  // Anzahl Nullen am Ende
  const tz = (x) => { let n = 0; while (x > 0 && x % 10 === 0) { x /= 10; n++; } return n; };
  const pow = (z) => Math.pow(10, z);

  // Die 1×1-Aufgabe dahinter (für die Eltern-Tabelle), z. B. 640 : 80 -> 8×8. Sonst null.
  function coreOf(level, a, op, b, ans) {
    let x, y;
    if (level === "null" || level === "gross" || level === "stelle") return null;
    if (op === "·") { x = a; y = b; } else { x = b; y = ans; }
    if (level !== "k-mal" && level !== "k-geteilt") { x /= pow(tz(x)); y /= pow(tz(y)); }
    if (x < 2 || y < 2 || x > 10 || y > 10) return null;
    return Math.min(x, y) + "x" + Math.max(x, y);
  }

  function task(level, a, op, b) {
    const ans = op === "·" ? a * b : op === "+" ? a + b : a / b;
    return { level, a, op, b, ans, key: level + "|" + a + op + b, core: coreOf(level, a, op, b, ans) };
  }
  // "z-geteilt|640:80" -> Aufgabe
  function fromKey(key) {
    const m = /^([a-z-]+)\|(\d+)([·:+])(\d+)$/.exec(key);
    return m && LEVEL[m[1]] ? task(m[1], +m[2], m[3], +m[4]) : null;
  }

  const GEN = {
    // wie im Test: meist 2 bis 10, dazu ab und zu mal 1 und mal 11
    "k-mal": (r) => {
      const v = r(), k = ri(r, 2, 10), sw = r() < 0.5;
      if (v < 0.08) return sw ? task("k-mal", 1, "·", k) : task("k-mal", k, "·", 1);
      if (v < 0.2) return sw ? task("k-mal", 11, "·", k) : task("k-mal", k, "·", 11);
      return task("k-mal", k, "·", ri(r, 2, 10));
    },
    "k-geteilt": (r) => { const a = ri(r, 2, 10), b = ri(r, 2, 10); return task("k-geteilt", a * b, ":", a); },
    null: (r) => {
      const x = ri(r, 2, 99), v = ri(r, 0, 5);
      if (v === 0) return task("null", x, "·", 10);
      if (v === 1) return task("null", x, "·", 100);
      if (v === 2) return task("null", 10, "·", ri(r, 2, 99));
      if (v === 3) return task("null", x * 10, ":", 10);
      if (v === 4) return task("null", x * 100, ":", 100);
      return task("null", ri(r, 2, 99) * 100, ":", 10);
    },
    // 3 · 40, 8 · 80, 40 · 3, 3 · 400, 2 · 100, 2 · 110 (Ergebnis höchstens 1500)
    "z-mal": (r) => {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), v = r();
      if (v < 0.45) return task("z-mal", a, "·", b * 10);
      if (v < 0.65) return task("z-mal", a * 10, "·", b);
      if (v < 0.9) { const h = ri(r, 1, Math.min(9, Math.floor(15 / a))); return task("z-mal", a, "·", h * 100); }
      return task("z-mal", a, "·", 110);
    },
    // Stellenwerte: 1 · 57.543, 200.000 + 20.000, 40.000 + 400
    stelle: (r) => {
      if (r() < 0.4) { const n = ri(r, 1000, 99999); return r() < 0.5 ? task("stelle", 1, "·", n) : task("stelle", n, "·", 1); }
      const p = ri(r, 3, 5), q = ri(r, 1, p - 1), a = ri(r, 1, 9) * pow(p), b = ri(r, 1, 9) * pow(q);
      return r() < 0.75 ? task("stelle", a, "+", b) : task("stelle", b, "+", a);
    },
    "z-geteilt": (r) => { const a = ri(r, 2, 9), b = ri(r, 2, 9), p = a * b * 10; return r() < 0.5 ? task("z-geteilt", p, ":", a) : task("z-geteilt", p, ":", b * 10); },
    h: (r) => {
      const a = ri(r, 2, 9), b = ri(r, 2, 9), p = a * b * 100;
      return pick(r, [() => task("h", a, "·", b * 100), () => task("h", a * 100, "·", b), () => task("h", p, ":", a), () => task("h", p, ":", b * 100)])();
    },
    zz: (r) => { const a = ri(r, 2, 9), b = ri(r, 2, 9); return r() < 0.5 ? task("zz", a * 10, "·", b * 10) : task("zz", a * b * 100, ":", a * 10); },
    gross: (r) => {
      for (;;) {
        const n = ri(r, 11, 19), k = ri(r, 2, 10), v = ri(r, 0, 6);
        let t;
        if (v === 0) t = task("gross", n, "·", k);
        else if (v === 1) t = task("gross", k, "·", n);
        else if (v === 2) t = task("gross", n * k, ":", n);
        else if (v === 3) t = task("gross", n * k, ":", k);
        else if (v === 4) t = k < 10 ? task("gross", n, "·", k * 10) : null;
        else if (v === 5) t = k < 10 ? task("gross", n * k * 10, ":", n) : null;
        else t = k < 10 ? task("gross", n * k * 10, ":", k * 10) : null;
        if (t && Math.max(t.a, t.b, t.ans) <= MAX_GROSS) return t;
      }
    },
  };
  const makeTask = (level, rnd) => GEN[level](rnd || Math.random);

  // Wie gut sitzt eine Aufgabe? Falsch oder langsam -> kommt öfter.
  function weight(f, targetMs) {
    if (!f) return 1.6; // noch nie gesehen
    let w = 1;
    if (f.last === "x") w += 4;
    w += Math.min(4, (f.w || 0) * 1.5);
    if (f.ms && f.ms > targetMs) w += 1.5;
    if (f.n >= 3 && !f.w && f.ms && f.ms <= targetMs) w -= 0.6;
    return Math.max(0.2, w);
  }

  // n verschiedene Aufgaben aus den Stufen. facts = Statistik je Aufgabe, flat = ohne Gewichtung (Test).
  function buildRound(levels, n, facts, opt) {
    opt = opt || {};
    const rnd = opt.rnd || Math.random, target = opt.targetMs || 5000;
    facts = facts || {};
    const pool = new Map();
    for (const lv of levels) {
      for (let i = 0, tries = 0; i < Math.max(24, n * 3) && tries < 400; tries++) {
        const t = makeTask(lv, rnd);
        if (!pool.has(t.key)) { pool.set(t.key, t); i++; }
      }
    }
    if (!opt.flat) {
      // was zuletzt falsch war, kommt sicher in den Topf
      for (const [k, f] of Object.entries(facts)) {
        if (f.last !== "x" && !f.w) continue;
        const t = fromKey(k);
        if (t && levels.includes(t.level)) pool.set(k, t);
      }
    }
    const list = [...pool.values()];
    const out = L.sample(list, n, opt.flat ? () => 1 : (t) => weight(facts[t.key], target), rnd);
    return L.shuffle(out, rnd);
  }

  function parseNum(s) {
    const t = String(s == null ? "" : s).replace(/[\s.  ']/g, "");
    return /^\d{1,7}$/.test(t) ? Number(t) : NaN;
  }

  // Tausenderpunkte wie auf dem Arbeitsblatt (ab 10.000): 57.543, 200.000
  // (bei den Stellenwert-Aufgaben schon ab 1.000, damit beide Zahlen gleich aussehen)
  const fmt = (n, from) => (Math.abs(n) >= (from || 10000) ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : String(n));
  const fmtT = (t, n) => fmt(n, t.level === "stelle" ? 1000 : 10000);
  const show = (t) => fmtT(t, t.a) + " " + t.op + " " + fmtT(t, t.b);
  const speech = (t) => t.a + (t.op === "·" ? " mal " : t.op === "+" ? " plus " : " geteilt durch ") + t.b;
  const PLACE = ["Einer", "Zehner", "Hunderter", "Tausender", "Zehntausender", "Hunderttausender"];
  const nullen = (z) => (z === 1 ? "eine Null" : z === 2 ? "zwei Nullen" : z + " Nullen");

  // Rechentrick: tip verrät das Ergebnis nicht, explain zeigt den ganzen Weg.
  function help(t) {
    const { a, b, ans } = t;
    if (t.op === "+") {
      const pa = PLACE[String(a).length - 1] || "", pb = PLACE[String(b).length - 1] || "";
      return { tip: `Schau auf die Stellen: ${pa} und ${pb}. Jede Zahl steht an einer anderen Stelle.`, explain: `${fmtT(t, a)} + ${fmtT(t, b)} = ${fmtT(t, ans)}` };
    }
    if (t.op === "·" && (a === 1 || b === 1)) {
      const o = a === 1 ? b : a;
      return { tip: "Mal 1: Die Zahl bleibt genau gleich.", explain: `${fmtT(t, o)} · 1 = ${fmtT(t, ans)}` };
    }
    if (t.op === "·") {
      // Nullen-Trick: mal 10, mal 100
      const ten = [a, b].find((x) => x >= 10 && x / pow(tz(x)) === 1);
      if (ten) {
        const other = ten === a ? b : a, z = tz(ten);
        return { tip: `Mal ${ten}: Hänge ${nullen(z)} an.`, explain: `${other}, ${nullen(z)} dran: ${ans}` };
      }
      const za = tz(a), zb = tz(b);
      if (za + zb > 0) {
        const a0 = a / pow(za), b0 = b / pow(zb);
        return { tip: `Rechne zuerst ${a0} · ${b0}. Dann hängst du ${nullen(za + zb)} an.`, explain: `${a0} · ${b0} = ${a0 * b0}, dazu ${nullen(za + zb)}: ${ans}` };
      }
      const big = Math.max(a, b), small = Math.min(a, b);
      if (big > 10) {
        return { tip: `Zerlege: 10 · ${small} und ${big - 10} · ${small}, dann zusammenzählen.`, explain: `10 · ${small} = ${10 * small} und ${big - 10} · ${small} = ${(big - 10) * small}, zusammen ${ans}` };
      }
      if (small === 2) return { tip: `Verdopple ${big}.`, explain: `${big} + ${big} = ${ans}` };
      if (small === 5 || big === 5) {
        const o = small === 5 ? big : small;
        return { tip: `Rechne 10 · ${o} und nimm davon die Hälfte.`, explain: `10 · ${o} = ${10 * o}, die Hälfte davon: ${ans}` };
      }
      if (big === 9) {
        const o = a === 9 ? b : a;
        return { tip: `Rechne 10 · ${o} und nimm dann einmal ${o} weg.`, explain: `10 · ${o} = ${10 * o}, minus ${o} = ${ans}` };
      }
      if (big >= 6) {
        const o = a === big ? b : a;
        return { tip: `Rechne 5 · ${o} und dann noch ${big - 5} · ${o} dazu.`, explain: `5 · ${o} = ${5 * o} und ${big - 5} · ${o} = ${(big - 5) * o}, zusammen ${ans}` };
      }
      const steps = Array.from({ length: big }, (_, i) => (i + 1) * small);
      return { tip: `Zähle in ${small}er-Schritten.`, explain: `${steps.join(", ")}: also ${ans}` };
    }
    // geteilt
    const zd = tz(b);
    if (zd && b / pow(zd) === 1) {
      return { tip: `Geteilt durch ${b}: Nimm ${nullen(zd)} weg.`, explain: `${a}, ${nullen(zd)} weg: ${ans}` };
    }
    if (zd) {
      const a1 = a / pow(zd), b1 = b / pow(zd);
      return { tip: `Nimm bei beiden Zahlen ${nullen(zd)} weg: ${a1} : ${b1}.`, explain: `${a1} : ${b1} = ${ans}, also ${a} : ${b} = ${ans}` };
    }
    const qz = Math.min(tz(ans), tz(a));
    if (qz && ans / pow(qz) > 1) {
      const a0 = a / pow(qz), q0 = ans / pow(qz);
      return { tip: `Rechne zuerst ${a0} : ${b}. Dann hängst du ${nullen(qz)} an.`, explain: `${a0} : ${b} = ${q0}, dazu ${nullen(qz)}: ${ans}` };
    }
    return { tip: `Denk an die Malaufgabe: ${b} · ? = ${a}`, explain: `${b} · ${ans} = ${a}, also ${a} : ${b} = ${ans}` };
  }

  // Median der Zeiten richtiger Antworten
  function median(xs) {
    if (!xs.length) return Infinity;
    const s = xs.slice().sort((x, y) => x - y), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  // recent: [[1|0, ms], ...] (die letzten 20 ersten Versuche einer Stufe)
  function levelStars(recent, targetMs) {
    recent = recent || [];
    const last = (k) => recent.slice(-k);
    const okIn = (k) => last(k).filter((x) => x[0]).length;
    let s = 0;
    if (okIn(10) >= 8) s = 1;
    if (recent.length >= 20 && okIn(20) >= 16) s = 2;
    if (recent.length >= 20 && okIn(20) >= 18 && median(last(20).filter((x) => x[0]).map((x) => x[1])) <= targetMs) s = 3;
    return s;
  }

  // 20 Aufgaben wie im Kopfrechentest der Klasse: 9× 1×1 mal (mit ·11, ·10, ·1), 4× Zehner/Hunderter,
  // 1× große Zahlen, 6× 1×1 geteilt. Erst die Malaufgaben, dann die Geteiltaufgaben (wie auf dem Blatt).
  function schoolTest(rnd) {
    rnd = rnd || Math.random;
    const seen = new Set(), take = (t) => (seen.has(t.key) ? null : (seen.add(t.key), t));
    const many = (lv, n) => { const out = []; for (let k = 0; out.length < n && k < 200; k++) { const t = take(makeTask(lv, rnd)); if (t) out.push(t); } return out; };
    const k = () => ri(rnd, 2, 10), sw = () => rnd() < 0.5;
    const must = [
      sw() ? task("k-mal", 11, "·", k()) : task("k-mal", k(), "·", 11),
      sw() ? task("k-mal", 10, "·", k()) : task("k-mal", k(), "·", 10),
      task("k-mal", ri(rnd, 11, 99), "·", 1),
    ].map(take).filter(Boolean);
    const mal = L.shuffle(must.concat(many("k-mal", 9 - must.length), many("z-mal", 4)), rnd);
    return mal.concat(many("stelle", 1), L.shuffle(many("k-geteilt", 6), rnd));
  }

  const api = { schoolTest, fmt, fmtT, LEVELS, LEVEL, MAX_GROSS, makeTask, task, fromKey, coreOf, buildRound, weight, parseNum, show, speech, help, levelStars, median, tz };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DERechnen = api;
})(typeof self !== "undefined" ? self : this);
