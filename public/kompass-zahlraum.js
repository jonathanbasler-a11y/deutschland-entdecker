// Kompass 4 Mathe: Zahlraum bis 1 Million, gebaut nach einer echten Klassenarbeit (Mathe-LZK Zahlraumerweiterung).
// Typische Stolpersteine: Nachbar-Stellenwerte (glatte Zahlen, nicht ±10/±100), Zahlenstrahl ablesen (Schrittweite, Nullen),
// Zahlveränderungen mit Plättchen (hinzu, weg, verschieben), Stellenwerttafel aus dem Zahlwort (Tausender-Teil), Zahlwörter schreiben.
// Alle Lösungen werden gerechnet.
(function (root) {
  "use strict";
  const K = typeof module !== "undefined" && module.exports ? require("./kompass-logic.js") : root.DEKompass;
  const { int, pick, shuffled, fmt, words } = K;
  const C = { bg: "#ffffff", line: "#16304f", grid: "#cdd6e3" };
  const wrap = (w, h, inner, label) => `<svg class="geo" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label || "Bild"}"><rect width="${w}" height="${h}" fill="${C.bg}"/>${inner}</svg>`;
  const reg = (id, name, gen) => K.attachGen(id, "ma.zahlen", name, gen);
  const PLACE = { 10: "Zehner", 100: "Hunderter", 1000: "Tausender", 10000: "Zehntausender", 100000: "Hunderttausender" };
  const COLS = ["HT", "ZT", "T", "H", "Z", "E"], COLNAME = ["Hunderttausender", "Zehntausender", "Tausender", "Hunderter", "Zehner", "Einer"];
  const digitsOf = (n) => String(n).padStart(6, "0").split("").map(Number);
  const pw = (col) => Math.pow(10, 5 - col); // Spalte 0 = HT = 100000

  /* ================= Bilder ================= */
  function lineSvg(a, b, M, m, arrows, labels) {
    const W = 640, x0 = 50, x1 = 590, Y = 96, X = (v) => x0 + ((v - a) / (b - a)) * (x1 - x0);
    let s = `<line x1="${x0 - 14}" y1="${Y}" x2="${x1 + 14}" y2="${Y}" stroke="${C.line}" stroke-width="2.5"/>`;
    for (let v = a; v <= b; v += m) { const major = v % M === 0; s += `<line x1="${X(v).toFixed(1)}" y1="${Y - (major ? 16 : 8)}" x2="${X(v).toFixed(1)}" y2="${Y + (major ? 16 : 8)}" stroke="${C.line}" stroke-width="${major ? 3 : 1.5}"/>`; }
    for (const v of labels) s += `<text x="${X(v).toFixed(1)}" y="${Y + 38}" text-anchor="middle" font-size="16" font-weight="700" fill="${C.line}">${fmt(v)}</text>`;
    for (const ar of arrows) { const x = X(ar.v).toFixed(1); s += `<path d="M${x} ${Y - 10} l-8 -18 h16 z" fill="#d33" stroke="${C.line}" stroke-width="1.5"/>${ar.label ? `<text x="${x}" y="${Y - 36}" text-anchor="middle" font-size="18" font-weight="800" fill="#d33">${ar.label}</text>` : ""}`; }
    return wrap(W, 146, s, "Zahlenstrahl").replace('class="geo"', 'class="geo wide"');
  }
  function tafelSvg(d) {
    const cw = 52, ch = 64, hh = 26, gap = 14, W = 6 * cw + gap + 8, H = hh + ch + 8;
    let s = "";
    d.forEach((n, i) => {
      const x = 4 + i * cw + (i >= 3 ? gap : 0);
      s += `<rect x="${x}" y="4" width="${cw}" height="${hh}" fill="#dfe8f5" stroke="${C.line}" stroke-width="2"/><text x="${x + cw / 2}" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="${C.line}">${COLS[i]}</text>`;
      s += `<rect x="${x}" y="${4 + hh}" width="${cw}" height="${ch}" fill="#fff" stroke="${C.line}" stroke-width="2"/>`;
      const rows = Math.ceil(n / 3);
      for (let j = 0; j < n; j++) {
        const row = Math.floor(j / 3), inRow = Math.min(3, n - row * 3), col = j % 3;
        s += `<circle cx="${(x + cw / 2 + (col - (inRow - 1) / 2) * 14).toFixed(1)}" cy="${(4 + hh + ch / 2 + (row - (rows - 1) / 2) * 15).toFixed(1)}" r="5.2" fill="#333"/>`;
      }
    });
    return wrap(W, H, s, "Stellenwerttafel mit Plättchen");
  }

  /* ================= Nachbar-Stellenwerte ================= */
  reg("ma.nachbarstelle", "Nachbar-Stellenwerte", (r, lv) => {
    const n = lv <= 1 ? int(r, 10001, 99999) : int(r, 100001, 999999), maxP = lv <= 1 ? 10000 : 100000, p = pick(r, [10, 100, 1000, 10000, 100000].filter((x) => x <= maxP)), name = PLACE[p];
    if (n % p === 0) return null;
    const lo = Math.floor(n / p) * p, hi = lo + p;
    return { type: "nums", fmt: true, q: `Bestimme die Nachbar${name.toLowerCase()} von ${fmt(n)}.`, fields: [{ label: `Nachbar${name.toLowerCase()} unten`, ans: lo }, { label: `Nachbar${name.toLowerCase()} oben`, ans: hi }],
      tip: `Nachbar-Stellenwerte sind glatte Zahlen. Streiche alles rechts von der ${name}stelle (Nullen!). Das ist die kleinere. Die größere hat dort eins mehr. Nicht +${fmt(p)} oder −${fmt(p)} rechnen!`,
      explain: `${fmt(lo)} < ${fmt(n)} < ${fmt(hi)}: Alle Stellen rechts von den ${name}n werden zu Nullen.` };
  });
  reg("ma.nachbarwahl", "Nachbar-Stellenwerte erkennen", (r, lv) => {
    const n = lv <= 1 ? int(r, 10001, 99999) : int(r, 100001, 999999), p = pick(r, [10, 100, 1000, 10000]), name = PLACE[p];
    if (n % p === 0) return null;
    const lo = Math.floor(n / p) * p, hi = lo + p, P2 = p * 10, lo2 = Math.floor(n / P2) * P2;
    const pair = (a, b) => `${fmt(a)} und ${fmt(b)}`, opts = [pair(lo, hi), pair(n - p, n + p), pair(n - 1, n + 1), pair(lo2, lo2 + P2)];
    if (new Set(opts).size < 4) return null;
    return { type: "choice", q: `Welche Zahlen sind die Nachbar${name.toLowerCase()} von ${fmt(n)}?`, opts, ans: 0,
      tip: "Nachbar-Stellenwerte sind glatte Zahlen mit Nullen am Ende. Sie sind nicht das Ergebnis von +10, −10, +100 oder −100.", explain: `Richtig: ${opts[0]}. Die Zahl ${pair(n - p, n + p)} entsteht nur durch Plus und Minus, sie ist nicht glatt.` };
  });

  /* ================= Zahlenstrahl ================= */
  function winOf(r, lv) {
    const k = pick(r, lv <= 1 ? [2, 3] : [2, 3, 4, 5]), M = Math.pow(10, k), m = M / 10, span = k === 5 ? 10 : pick(r, [3, 5, 10]);
    const a = k === 5 ? 0 : M * int(r, 1, Math.floor((1000000 - span * M) / M) > 60 ? 60 : Math.floor((1000000 - span * M) / M)), b = a + span * M;
    const labels = [a, b]; if (span === 10) labels.push(a + 5 * M);
    return { M, m, a, b, span, labels };
  }
  reg("ma.strahllesen", "Zahlenstrahl ablesen", (r, lv) => {
    const w = winOf(r, lv), steps = w.span * 10;
    let j = int(r, 1, steps - 1);
    if (j % 10 === 0 && r() < 0.7) j = Math.min(steps - 1, j + int(r, 1, 4));
    const v = w.a + j * w.m;
    if (r() < 0.6) return { type: "num", fmt: true, q: "Welche Zahl zeigt der Pfeil?", ans: v, fig: lineSvg(w.a, w.b, w.M, w.m, [{ v }], w.labels),
      tip: `Schaue zuerst: Ein großer Strich ist ${fmt(w.M)} weit, ein kleiner Strich ${fmt(w.m)}. Gehe vom nächsten beschrifteten Strich Schritt für Schritt zum Pfeil. Achte auf die Nullen!`,
      explain: `Kleine Schritte: ${fmt(w.m)}. Der Pfeil steht bei ${fmt(v)}.` };
    const offs = shuffled(r, [-3, -2, -1, 1, 2, 3, 10, -10]).map((o) => j + o).filter((x) => x > 0 && x < steps).slice(0, 2);
    if (offs.length < 2) return null;
    const pos = shuffled(r, [0, 1, 2]), vals = [v, w.a + offs[0] * w.m, w.a + offs[1] * w.m], arrows = pos.map((p, i) => ({ v: vals[p], label: "ABC"[i] }));
    return { type: "choice", fixed: true, q: `Welcher Pfeil zeigt die Zahl ${fmt(v)}?`, opts: ["Pfeil A", "Pfeil B", "Pfeil C"], ans: pos.indexOf(0), fig: lineSvg(w.a, w.b, w.M, w.m, arrows, w.labels),
      tip: `Ein kleiner Strich ist ${fmt(w.m)} weit. Zähle von einer beschrifteten Zahl aus bis ${fmt(v)}.`, explain: `${fmt(v)} liegt bei Pfeil ${"ABC"[pos.indexOf(0)]}.` };
  });

  /* ================= Plättchen: Zahlveränderungen ================= */
  function tafelTask(r, lv) {
    for (let i = 0; i < 200; i++) {
      const d = digitsOf(int(r, 100000, 999999)).map((x) => (r() < 0.25 ? 0 : Math.min(7, x)));
      if (d[0] === 0) d[0] = int(r, 1, 6);
      if (d.filter((x) => x > 0).length >= 4) return d;
    }
    return [4, 5, 3, 5, 0, 4];
  }
  const numOf = (d) => d.reduce((a, x, i) => a + x * pw(i), 0);
  const colWord = (i) => `${COLNAME[i]}-Spalte (${COLS[i]})`;
  reg("ma.plaettchen", "Plättchen: Zahl verändern", (r, lv) => {
    const d = tafelTask(r, lv), n = numOf(d), fig = tafelSvg(d), kind = int(r, 0, 5);
    const canAdd = [0, 1, 2, 3, 4, 5].filter((i) => d[i] < 9), canRem = [0, 1, 2, 3, 4, 5].filter((i) => d[i] > 0);
    if (kind === 0) { const i = pick(r, canAdd); return { type: "num", fmt: true, q: `Füge in der ${colWord(i)} ein Plättchen hinzu. Welche Zahl entsteht?`, ans: n + pw(i), fig, tip: `Ein Plättchen in der ${COLNAME[i]}-Spalte bedeutet ${fmt(pw(i))} mehr.`, explain: `${fmt(n)} + ${fmt(pw(i))} = ${fmt(n + pw(i))}.` }; }
    if (kind === 1) { const i = pick(r, canRem); return { type: "num", fmt: true, q: `Nimm in der ${colWord(i)} ein Plättchen weg. Welche Zahl entsteht?`, ans: n - pw(i), fig, tip: `Ein Plättchen weniger in der ${COLNAME[i]}-Spalte bedeutet ${fmt(pw(i))} weniger.`, explain: `${fmt(n)} − ${fmt(pw(i))} = ${fmt(n - pw(i))}.` }; }
    if (kind === 2) {
      const from = pick(r, canRem), to = pick(r, canAdd.filter((x) => x !== from));
      return { type: "num", fmt: true, q: `Verschiebe ein Plättchen aus der ${colWord(from)} in die ${colWord(to)}. Welche Zahl entsteht?`, ans: n - pw(from) + pw(to), fig,
        tip: "Verschieben heißt: aus einer Spalte wegnehmen und in einer anderen hinzufügen. Rechne beides.", explain: `${fmt(n)} − ${fmt(pw(from))} + ${fmt(pw(to))} = ${fmt(n - pw(from) + pw(to))}.` };
    }
    if (kind === 3) {
      // verschieben: welche Zahlen können entstehen?
      const moves = [];
      for (const f of canRem) for (const t2 of canAdd) if (f !== t2) moves.push(n - pw(f) + pw(t2));
      const valid = shuffled(r, [...new Set(moves)]).slice(0, 3);
      const bad = [n - pw(pick(r, canRem)), n + pw(pick(r, canAdd))];
      const badTwo = canRem.length > 1 ? (() => { const [x, y] = shuffled(r, canRem).slice(0, 2); return n - pw(x) - pw(y); })() : n - 2 * pw(canRem[0]);
      const invalid = [...new Set([...bad, badTwo])].filter((x) => !moves.includes(x) && x !== n && x > 0).slice(0, 2);
      const opts = shuffled(r, [...valid.map((x) => ({ x, ok: true })), ...invalid.map((x) => ({ x, ok: false }))]);
      if (valid.length < 2 || invalid.length < 1 || new Set(opts.map((o) => o.x)).size !== opts.length) return null;
      return { type: "multi", fixed: true, q: "Verschiebe genau ein Plättchen. Welche Zahlen können entstehen? Tippe alle an.", opts: opts.map((o) => fmt(o.x)), ans: opts.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0), fig,
        tip: "Beim Verschieben bleibt die Anzahl der Plättchen gleich. Ein Plättchen kommt weg und kommt in einer anderen Spalte wieder dazu. Wird nur eins weggenommen oder hinzugefügt, ist das kein Verschieben.",
        explain: `Verschieben ändert eine Spalte um −1 und eine andere um +1. ${opts.filter((o) => !o.ok).map((o) => fmt(o.x)).join(", ")} ${opts.filter((o) => !o.ok).length === 1 ? "passt" : "passen"} nicht.` };
    }
    if (kind === 4) {
      const sums = []; for (const i of canAdd) for (const j of canAdd) if (i < j || (i === j && d[i] < 8)) sums.push(n + pw(i) + pw(j));
      const valid = shuffled(r, [...new Set(sums)]).slice(0, 2), one = n + pw(pick(r, canAdd)), three = n + pw(pick(r, canAdd)) + pw(pick(r, canAdd)) + pw(pick(r, canAdd));
      const invalid = [...new Set([one, three])].filter((x) => !sums.includes(x));
      const opts = shuffled(r, [...valid.map((x) => ({ x, ok: true })), ...invalid.map((x) => ({ x, ok: false }))]);
      if (valid.length < 2 || !invalid.length || new Set(opts.map((o) => o.x)).size !== opts.length || opts.some((o) => o.x > 999999)) return null;
      return { type: "multi", fixed: true, q: "Füge genau zwei Plättchen hinzu. Welche Zahlen können entstehen? Tippe alle an.", opts: opts.map((o) => fmt(o.x)), ans: opts.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0), fig,
        tip: "Zwei Plättchen hinzufügen: zweimal etwas dazu. Der Unterschied zur Ausgangszahl ist dann die Summe zweier Stellenwerte.", explain: `Von ${fmt(n)} aus muss der Unterschied aus genau zwei Stellenwerten bestehen. ${opts.filter((o) => !o.ok).map((o) => fmt(o.x) + " (" + fmt(o.x - n) + ")").join(", ")} passt nicht.` };
    }
    const subs = []; for (const i of canRem) for (const j of canRem) if (i < j || (i === j && d[i] > 1)) subs.push(n - pw(i) - pw(j));
    const valid = shuffled(r, [...new Set(subs)]).slice(0, 2), invalid = [n - pw(pick(r, canRem)), n - pw(canRem[0]) - pw(canRem[0]) - pw(canRem[canRem.length - 1])].filter((x) => !subs.includes(x) && x > 0);
    const opts = shuffled(r, [...valid.map((x) => ({ x, ok: true })), ...invalid.map((x) => ({ x, ok: false }))]);
    if (valid.length < 2 || !invalid.length || new Set(opts.map((o) => o.x)).size !== opts.length) return null;
    return { type: "multi", fixed: true, q: "Nimm genau zwei Plättchen weg. Welche Zahlen können entstehen? Tippe alle an.", opts: opts.map((o) => fmt(o.x)), ans: opts.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0), fig,
      tip: "Zwei Plättchen weg: zweimal etwas abziehen. Der Unterschied zur Ausgangszahl besteht aus genau zwei Stellenwerten.", explain: `Von ${fmt(n)} aus muss der Unterschied aus genau zwei Stellenwerten bestehen.` };
  });

  /* ================= Stellenwerttafel und Zahlwörter ================= */
  reg("ma.tafelwort", "Stellenwerttafel eintragen", (r, lv) => {
    let n = lv <= 1 ? int(r, 10000, 99999) : int(r, 100000, 999999);
    if (r() < 0.35) { const d = digitsOf(n); d[int(r, 1, 5)] = 0; if (d[0] === 0 && lv > 1) d[0] = int(r, 1, 9); n = numOf(d); }
    if (n < 1000) return null;
    const d = digitsOf(n), word = words(n), asWord = r() < 0.75;
    return { type: "nums", digit: true, q: asWord ? `Trage die Zahl in die Stellenwerttafel ein: ${word}` : `Trage die Zahl ${fmt(n)} in die Stellenwerttafel ein.`, say: word,
      fields: d.map((x, i) => ({ label: COLS[i], ans: x })),
      tip: asWord ? "Teile beim Wort „tausend“. Davor stehen die Tausender (HT, ZT, T), dahinter H, Z und E. Wo nichts genannt wird, schreibst du eine 0. Bei „dreiundzwanzig“ sprichst du die Einer zuerst, schreibst aber die Zehner zuerst: 23." : "Von rechts: Einer, Zehner, Hunderter, Tausender … Fehlende Stellen sind 0.",
      explain: `${asWord ? word + " = " : ""}${fmt(n)}: ${d.map((x, i) => `${COLS[i]} ${x}`).join(", ")}.` };
  });
  reg("ma.zahlwortschreiben", "Zahlwort schreiben", (r, lv) => {
    const n = lv <= 1 ? int(r, 1100, 99999) : int(r, 10000, 999999);
    if (n % 1000 === 0) return null;
    const w = words(n);
    return { type: "write", words: true, q: `Schreibe die Zahl als Zahlwort (in einem Wort): ${fmt(n)}`, ans: [w],
      tip: "Schreibe von links: erst den Teil vor „tausend“, dann „tausend“, dann den Rest. Typische Stolpersteine: fünf mit f (fünfhundert), dreißig mit ß, sechzig und siebzig ohne „-en“. Zahlen unter hundert: erst die Einer, dann „und“, dann die Zehner.",
      explain: `${fmt(n)} = ${w}` };
  });
  reg("ma.verwechsel", "Zahlen nicht verwechseln", (r, lv) => {
    const n = lv <= 1 ? int(r, 10010, 99990) : int(r, 100100, 999990), s = String(n), cand = new Set();
    for (let i = 0; i < s.length - 1; i++) if (s[i] !== s[i + 1]) { const t = s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2); if (t[0] !== "0") cand.add(+t); }
    const others = shuffled(r, [...cand]).slice(0, 3);
    if (others.length < 3) return null;
    if (r() < 0.5) return { type: "choice", q: `Welche Zahl ist: ${words(n)}?`, say: words(n), opts: [fmt(n), ...others.map(fmt)], ans: 0, tip: "Schaue, wo die Nullen stehen. Teile das Zahlwort bei „tausend“.", explain: `${words(n)} = ${fmt(n)}. Die anderen Zahlen haben dieselben Ziffern, aber an anderer Stelle.` };
    return { type: "choice", q: `Wie liest man ${fmt(n)}?`, opts: [words(n), ...others.map(words)], ans: 0, tip: "Lies die Zahl in Gruppen: erst vor dem Punkt (Tausender), dann nach dem Punkt.", explain: `${fmt(n)} = ${words(n)}.` };
  });

  const api = { lineSvg, tafelSvg, numOf, digitsOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DEKompassZahlraum = api;
})(typeof self !== "undefined" ? self : this);
