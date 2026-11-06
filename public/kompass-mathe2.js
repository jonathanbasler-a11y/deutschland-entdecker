// Kompass 4 Mathe, Teil 2: Daten und Zufall (Tabellen, Säulen, Beutel, Glücksrad), Größen (Uhr, Fahrplan, Preise, Einheiten),
// mehr Zahlen- und Musteraufgaben nach dem Format des echten Tests. Alle Lösungen werden gerechnet.
(function (root) {
  "use strict";
  const K = typeof module !== "undefined" && module.exports ? require("./kompass-logic.js") : root.DEKompass;
  const { int, pick, shuffled, fmt, fmtMoney } = K;
  const C = { bg: "#ffffff", grid: "#cdd6e3", line: "#16304f" };
  const wrap = (w, h, inner, label) => `<svg class="geo" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label || "Bild"}"><rect width="${w}" height="${h}" fill="${C.bg}"/>${inner}</svg>`;
  const regZ = (id, name, gen) => K.attachGen(id, "ma.zahlen", name, gen);
  const regG = (id, name, gen) => K.attachGen(id, "ma.groessen", name, gen);
  const regD = (id, name, gen) => K.attachGen(id, "ma.daten", name, gen);
  const regM = (id, name, gen) => K.attachGen(id, "ma.muster", name, gen);
  const num = (q, ans, tip, explain, extra) => Object.assign({ type: "num", q, ans, tip, explain }, extra || {});
  const BALL = { rot: "#e23b3b", blau: "#3b6fe2", gelb: "#f2c200", grün: "#3fae4a", weiß: "#ffffff", schwarz: "#222222" };

  /* ================= Bilder ================= */
  function clockSvg(h, m) {
    let s = `<circle cx="60" cy="60" r="54" fill="#fff" stroke="${C.line}" stroke-width="4"/>`;
    for (let i = 0; i < 60; i++) { const a = (i * 6 * Math.PI) / 180, big = i % 5 === 0, r1 = big ? 44 : 49, x1 = 60 + r1 * Math.sin(a), y1 = 60 - r1 * Math.cos(a), x2 = 60 + 52 * Math.sin(a), y2 = 60 - 52 * Math.cos(a); s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.line}" stroke-width="${big ? 2.5 : 1}"/>`; }
    for (let n = 1; n <= 12; n++) { const a = (n * 30 * Math.PI) / 180; s += `<text x="${(60 + 36 * Math.sin(a)).toFixed(1)}" y="${(60 - 36 * Math.cos(a) + 5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="${C.line}">${n}</text>`; }
    const ha = (((h % 12) + m / 60) * 30 * Math.PI) / 180, ma = (m * 6 * Math.PI) / 180;
    s += `<line x1="60" y1="60" x2="${(60 + 26 * Math.sin(ha)).toFixed(1)}" y2="${(60 - 26 * Math.cos(ha)).toFixed(1)}" stroke="${C.line}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<line x1="60" y1="60" x2="${(60 + 42 * Math.sin(ma)).toFixed(1)}" y2="${(60 - 42 * Math.cos(ma)).toFixed(1)}" stroke="#d33" stroke-width="3.5" stroke-linecap="round"/><circle cx="60" cy="60" r="4" fill="${C.line}"/>`;
    return wrap(120, 120, s, "Uhr");
  }
  function bagSvg(balls) {
    let s = `<path d="M34 22 Q38 6 50 9 Q62 6 66 22 L82 86 Q86 108 50 108 Q14 108 18 86 Z" fill="#d9c29a" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/><path d="M36 22 Q50 30 64 22" fill="none" stroke="${C.line}" stroke-width="3"/>`;
    const n = balls.length, cols = 3, rows = Math.ceil(n / cols);
    balls.forEach((c, i) => {
      const row = Math.floor(i / cols), inRow = Math.min(cols, n - row * cols), col = i % cols;
      const x = 50 + (col - (inRow - 1) / 2) * 24, y = 62 + (row - (rows - 1) / 2) * 24;
      s += `<circle cx="${x}" cy="${y}" r="10" fill="${BALL[c]}" stroke="${C.line}" stroke-width="2"/>`;
    });
    return wrap(100, 116, s, "Sack mit Kugeln");
  }
  function wheelSvg(cols) {
    const n = cols.length, R = 54;
    let s = "";
    cols.forEach((c, i) => {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
      s += `<path d="M60 60 L${(60 + R * Math.cos(a0)).toFixed(2)} ${(60 + R * Math.sin(a0)).toFixed(2)} A${R} ${R} 0 0 1 ${(60 + R * Math.cos(a1)).toFixed(2)} ${(60 + R * Math.sin(a1)).toFixed(2)} Z" fill="${BALL[c]}" stroke="${C.line}" stroke-width="2"/>`;
    });
    s += `<circle cx="60" cy="60" r="5" fill="${C.line}"/><path d="M60 2 L52 -4 L68 -4 Z" fill="${C.line}"/>`;
    return wrap(120, 124, `<g transform="translate(0,4)">${s}</g>`, "Glücksrad");
  }
  function barSvg(labels, values, unit, rows) {
    const W = 40 + labels.length * 56, H = 20 + rows * 26 + 28, base = 14 + rows * 26;
    let s = "";
    for (let k = 0; k <= rows; k++) { const y = base - k * 26; s += `<line x1="32" y1="${y}" x2="${W - 6}" y2="${y}" stroke="${C.grid}" stroke-width="1.5"/><text x="28" y="${y + 4}" text-anchor="end" font-size="11" fill="${C.line}">${k * unit}</text>`; }
    s += `<line x1="32" y1="8" x2="32" y2="${base}" stroke="${C.line}" stroke-width="2.5"/><line x1="32" y1="${base}" x2="${W - 6}" y2="${base}" stroke="${C.line}" stroke-width="2.5"/>`;
    labels.forEach((l, i) => { const x = 44 + i * 56, h = (values[i] / unit) * 26; s += `<rect x="${x}" y="${base - h}" width="36" height="${h}" fill="#6f93d0" stroke="${C.line}" stroke-width="2"/><text x="${x + 18}" y="${base + 16}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.line}">${l}</text>`; });
    return wrap(W, H, s, "Säulendiagramm");
  }
  function lineSvg(start, end, parts) {
    const W = 300, x0 = 20, x1 = 270;
    let s = `<line x1="${x0 - 10}" y1="40" x2="${x1 + 20}" y2="40" stroke="${C.line}" stroke-width="2.5"/><path d="M${x1 + 20} 40 l-8 -5 M${x1 + 20} 40 l-8 5" stroke="${C.line}" stroke-width="2.5" fill="none"/>`;
    for (let i = 0; i <= parts; i++) { const x = x0 + (i * (x1 - x0)) / parts, big = i === 0 || i === parts; s += `<line x1="${x}" y1="${big ? 28 : 33}" x2="${x}" y2="${big ? 52 : 47}" stroke="${C.line}" stroke-width="${big ? 3 : 2}"/>`; }
    s += `<text x="${x0}" y="72" text-anchor="middle" font-size="14" font-weight="700" fill="${C.line}">${fmt(start)}</text><text x="${x1}" y="72" text-anchor="middle" font-size="14" font-weight="700" fill="${C.line}">${fmt(end)}</text>`;
    return wrap(W, 82, s, "Zahlenstrahl");
  }
  const SKIP = null;

  /* ================= Zahlen und Rechnen (mehr) ================= */
  regZ("ma.luecke", "Fehlende Zahl", (r, lv) => {
    const k = int(r, 0, 3);
    if (k === 0) { const a = pick(r, [3, 4, 6, 7, 8, 9]), b = pick(r, lv <= 1 ? [2, 3, 4, 5, 10] : [20, 30, 40, 50, 100, 200, 600]); return num(`${a} · ___ = ${fmt(a * b)}`, b, "Rechne die Umkehraufgabe: Teile das Ergebnis durch die erste Zahl.", `${fmt(a * b)} : ${a} = ${b}, denn ${a} · ${b} = ${fmt(a * b)}.`); }
    if (k === 1) { const b = pick(r, [3, 4, 6, 7, 8, 9]), c = pick(r, lv <= 1 ? [5, 6, 7, 8, 9, 10, 12] : [40, 50, 60, 90, 100, 120]); return num(`___ : ${b} = ${c}`, b * c, "Umkehraufgabe: Rechne mal.", `${c} · ${b} = ${b * c}, also ${b * c} : ${b} = ${c}.`); }
    if (k === 2) { const a = int(r, 120, 890), c = a + int(r, 30, 400); return num(`${a} + ___ = ${c}`, c - a, "Umkehraufgabe: Rechne Ergebnis minus die erste Zahl.", `${c} − ${a} = ${c - a}.`); }
    const a = int(r, 20, 400), c = int(r, 100, 900); return num(`___ − ${a} = ${c}`, c + a, "Umkehraufgabe: Rechne plus.", `${c} + ${a} = ${c + a}.`);
  });
  regZ("ma.ergaenzen", "Ergänzen", (r, lv) => {
    const t = pick(r, lv <= 1 ? [100, 1000] : [1000, 1000, 10000]), a = t === 100 ? int(r, 11, 98) : t === 1000 ? int(r, 11, 98) * 10 + (r() < 0.4 ? 5 : 0) : int(r, 11, 98) * 100;
    return num(`${fmt(a)} + ___ = ${fmt(t)}`, t - a, `Ergänze erst bis zum nächsten Zehner oder Hunderter, dann bis ${fmt(t)}.`, `${fmt(a)} + ${fmt(t - a)} = ${fmt(t)}.`);
  });
  regZ("ma.mitte", "Zahl in der Mitte", (r) => {
    const a = int(r, 20, 80) * 10, b = a + int(r, 3, 30) * 10;
    return num(`Welche Zahl liegt genau in der Mitte von ${a} und ${b}?`, (a + b) / 2, "Rechne den Abstand aus und nimm die Hälfte davon. Gehe so weit von der kleineren Zahl.", `Abstand ${b - a}, Hälfte ${(b - a) / 2}. ${a} + ${(b - a) / 2} = ${(a + b) / 2}.`);
  });
  regZ("ma.buendeln", "Stellenwerttafel mit Bündeln", (r) => {
    const H = int(r, 1, 8), Z = int(r, 10, 16), E = int(r, 0, 9), v = H * 100 + Z * 10 + E;
    return num(`Schreibe als Zahl: ${H} H, ${Z} Z, ${E} E`, v, "10 Zehner sind ein Hunderter. Rechne jede Stelle einzeln: H · 100, Z · 10, E · 1.", `${H}·100 + ${Z}·10 + ${E} = ${H * 100} + ${Z * 10} + ${E} = ${v}.`);
  });
  regZ("ma.strahl", "Zahlenstrahl", (r) => {
    const s = int(r, 10, 90) * 100, parts = pick(r, [4, 5, 10]), step = 100 / parts, k = int(r, 1, parts - 1), kind = int(r, 0, 1);
    if (kind === 0) return num(`Auf dem Zahlenstrahl liegen zwischen ${fmt(s)} und ${fmt(s + 100)} genau ${parts} gleich große Abschnitte. Wie groß ist ein Abschnitt (die Schrittweite)?`, step, "Rechne den Abstand aus und teile durch die Anzahl der Abschnitte.", `${fmt(s + 100)} − ${fmt(s)} = 100, und 100 : ${parts} = ${step}.`, { fig: lineSvg(s, s + 100, parts) });
    return num(`Welche Zahl steht auf dem ${k}. kleinen Strich nach ${fmt(s)}? (${parts} gleich große Abschnitte bis ${fmt(s + 100)})`, s + k * step, "Berechne erst die Schrittweite: 100 geteilt durch die Anzahl der Abschnitte. Dann gehe so viele Schritte.", `Schrittweite ${step}: ${fmt(s)} + ${k} · ${step} = ${fmt(s + k * step)}.`, { fig: lineSvg(s, s + 100, parts), fmt: true });
  });
  regZ("ma.ratsel", "Zahlenrätsel", (r) => {
    const x = int(r, 3, 40), n = int(r, 2, 15), k = int(r, 0, 4);
    if (k === 0) return num(`Zahlenrätsel: Ich verdopple meine Zahl und addiere ${n}. So erhalte ich ${2 * x + n}. An welche Zahl denke ich?`, x, "Rechne rückwärts: erst minus, dann halbieren.", `${2 * x + n} − ${n} = ${2 * x}, und ${2 * x} : 2 = ${x}.`);
    if (k === 1) return num(`Zahlenrätsel: Von meiner Zahl ziehe ich ${n} ab und erhalte ${x}. An welche Zahl denke ich?`, x + n, "Rechne rückwärts: Das Gegenteil von minus ist plus.", `${x} + ${n} = ${x + n}.`);
    if (k === 2) return num(`Zahlenrätsel: Ich addiere ${n} zu meiner Zahl und erhalte ${x + n}. An welche Zahl denke ich?`, x, "Rechne rückwärts: Das Gegenteil von plus ist minus.", `${x + n} − ${n} = ${x}.`);
    if (k === 3) { const y = Math.max(x, Math.ceil(n / 3) + 1); return num(`Zahlenrätsel: Ich verdreifache meine Zahl und ziehe ${n} ab. So erhalte ich ${3 * y - n}. An welche Zahl denke ich?`, y, "Rechne rückwärts: erst plus, dann durch 3.", `${3 * y - n} + ${n} = ${3 * y}, und ${3 * y} : 3 = ${y}.`); }
    return num(`Zahlenrätsel: Ich halbiere meine Zahl und addiere ${n}. So erhalte ich ${x + n}. An welche Zahl denke ich?`, 2 * x, "Rechne rückwärts: erst minus, dann verdoppeln.", `${x + n} − ${n} = ${x}, und ${x} · 2 = ${2 * x}.`);
  });
  regZ("ma.tausch", "Tausch- und Nachbaraufgabe", (r) => {
    const a = int(r, 4, 9), b = int(r, 6, 9), k = int(r, 0, 2);
    if (k === 0) return num(`${a} · ${b} = ${a * b}. Nutze die Tauschaufgabe: ${b} · ${a} = ___`, a * b, "Beim Malnehmen darfst du die Zahlen tauschen.", `${b} · ${a} = ${a * b}.`);
    if (k === 1) return num(`${a} · ${b} = ${a * b}, also ${a} · ${b + 1} = ${a * b} + ___`, a, "Die Nachbaraufgabe hat einen Schritt mehr: einmal die erste Zahl dazu.", `${a} · ${b + 1} = ${a * b} + ${a} = ${a * (b + 1)}.`);
    return num(`${a} · ${b} = ${a * b}, also ${a} · ${b - 1} = ${a * b} − ___`, a, "Die Nachbaraufgabe hat einen Schritt weniger: einmal die erste Zahl weg.", `${a} · ${b - 1} = ${a * b} − ${a} = ${a * (b - 1)}.`);
  });
  regZ("ma.gerade", "Gerade und ungerade", (r) => {
    const want = r() < 0.5 ? "gerade" : "ungerade", opts = [], used = new Set();
    while (opts.length < 4) { const a = int(r, 2, 9), b = int(r, 2, 9), k = a + "+" + b; if (used.has(k)) continue; used.add(k); opts.push([a, b]); }
    const par = (p) => ((p[0] + p[1]) % 2 === 0 ? "gerade" : "ungerade"), ans = opts.map((p, i) => (par(p) === want ? i : -1)).filter((i) => i >= 0);
    if (!ans.length || ans.length === 4) return null;
    return { type: "multi", fixed: true, q: `Tippe alle Rechnungen an, deren Ergebnis ${want} ist.`, opts: opts.map((p) => `${p[0]} + ${p[1]}`), ans,
      tip: "Gerade Zahlen enden auf 0, 2, 4, 6, 8. Zwei gerade oder zwei ungerade Zahlen ergeben zusammen eine gerade Zahl.", explain: opts.map((p) => `${p[0]} + ${p[1]} = ${p[0] + p[1]}`).join(", ") };
  });
  regZ("ma.fehler", "Rechenfehler finden", (r) => {
    for (let i = 0; i < 100; i++) {
      const a = int(r, 120, 780), b = int(r, 120, 780);
      if ((a % 10) + (b % 10) < 10) continue;
      const ok = a + b, wrong = ok - 10;
      return num(`In dieser Rechnung steckt ein Fehler: ${a} + ${b} = ${wrong}. Wie lautet das richtige Ergebnis?`, ok, "Rechne schriftlich nach. Einer: Hast du den Übertrag 1 zu den Zehnern dazugerechnet?", `${a} + ${b} = ${ok}. Bei den Einern gab es einen Übertrag, der vergessen wurde, deshalb war das Ergebnis um 10 zu klein.`);
    }
    return null;
  });
  regZ("ma.umkehr", "Umkehraufgabe", (r) => {
    const a = int(r, 1800, 7800), b = int(r, 200, 1100), c = a - b;
    return { type: "choice", q: `Prüfe ${fmt(a)} − ${fmt(b)} = ${fmt(c)}. Welche Rechnung ist die Umkehraufgabe?`, opts: [`${fmt(c)} + ${fmt(b)} = ${fmt(a)}`, `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`, `${fmt(a)} + ${fmt(c)} = ${fmt(a + c)}`, `${fmt(b)} + ${fmt(c)} + ${fmt(a)} = ${fmt(a + b + c)}`], ans: 0,
      tip: "Bei der Umkehraufgabe machst du die Rechnung rückwärts: Aus minus wird plus.", explain: `${fmt(c)} + ${fmt(b)} = ${fmt(a)} bringt dich zur Ausgangszahl zurück.` };
  });
  regZ("ma.geschickt", "Geschickt rechnen", (r) => {
    const k = int(r, 0, 3), x = int(r, 120, 890);
    if (k === 0) return num(`Rechne geschickt: ${x} − 99 = ___`, x - 99, "Statt −99 rechnest du −100 und dann +1.", `${x} − 100 = ${x - 100}, dann + 1 = ${x - 99}.`);
    if (k === 1) return num(`Rechne geschickt: ${x} + 99 = ___`, x + 99, "Statt +99 rechnest du +100 und dann −1.", `${x} + 100 = ${x + 100}, dann − 1 = ${x + 99}.`);
    if (k === 2) { const m = pick(r, [8, 12, 16, 24, 32]); return num(`Rechne geschickt: 25 · ${m} = ___`, 25 * m, "25 · 4 = 100. Zerlege die zweite Zahl in 4 mal etwas.", `${m} = 4 · ${m / 4}, also 25 · 4 = 100 und 100 · ${m / 4} = ${25 * m}.`); }
    return num(`Rechne geschickt: ${x} + 199 = ___`, x + 199, "Statt +199 rechnest du +200 und dann −1.", `${x} + 200 = ${x + 200}, dann − 1 = ${x + 199}.`);
  });
  regZ("ma.verdoppeln", "Verdoppeln und Halbieren", (r) => {
    if (r() < 0.5) { const n = int(r, 12, 480); return num(`Verdopple ${n}.`, 2 * n, "Verdoppeln heißt mal 2. Rechne Hunderter, Zehner und Einer einzeln.", `${n} · 2 = ${2 * n}.`); }
    const n = int(r, 6, 245) * 2; return num(`Halbiere ${n}.`, n / 2, "Halbieren heißt geteilt durch 2.", `${n} : 2 = ${n / 2}.`);
  });
  regZ("ma.malvergleich", "Mal-Aufgaben vergleichen", (r) => {
    const a = int(r, 3, 8), b = int(r, 3, 9), k = int(r, 0, 2);
    let left, right, ans, lv = a * b, rv;
    if (k === 0) { left = `${a} · ${b}`; right = `${b} · ${a}`; rv = b * a; }
    else if (k === 1) { left = `${a} · ${b}`; right = Array(a).fill(b).join(" + "); rv = a * b; }
    else { rv = a * b + pick(r, [-3, -2, 2, 3, 0]); left = `${a} · ${b}`; right = String(rv); }
    ans = lv === rv ? 1 : lv < rv ? 0 : 2;
    return { type: "choice", fixed: true, q: `Setze <, > oder = ein: ${left} ___ ${right}`, opts: ["<", "=", ">"], ans, tip: "Rechne beide Seiten aus und vergleiche dann.", explain: `${left} = ${lv}, ${right} = ${rv}.` };
  });
  regM("ma.wachsend", "Wachsendes Muster", (r) => {
    const a = int(r, 1, 4), d = pick(r, [2, 2, 3, 4]), n = int(r, 5, 8);
    return num(`Ein Muster wächst: Figur 1 hat ${a} Plättchen, Figur 2 hat ${a + d}, Figur 3 hat ${a + 2 * d}. Wie viele Plättchen hat Figur ${n}?`, a + (n - 1) * d, `Es kommen immer ${d} Plättchen dazu. Setze die Reihe fort oder rechne ${a} + ${n - 1} · ${d}.`, `Figur ${n}: ${a} + ${n - 1} · ${d} = ${a + (n - 1) * d}.`);
  });
  regM("ma.wechsel", "Wechselmuster und Regel", (r) => {
    const p = pick(r, [20, 30, 50, 40]), q = pick(r, [10, 20, 15, 5].filter((x) => x < p)), a = int(r, 10, 60) * 5, seq = [a];
    for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? p : -q));
    const opts = [`erst +${p}, dann −${q}`, `erst −${q}, dann +${p}`, `immer +${p}`, `erst +${q}, dann −${p}`];
    return { type: "choice", q: `Welche Regel steckt in der Zahlenfolge? ${seq.join(", ")}`, opts, ans: 0, tip: "Rechne von der ersten zur zweiten Zahl, dann von der zweiten zur dritten. Wechselt die Rechnung?", explain: `${seq[0]} → ${seq[1]} ist +${p}, ${seq[1]} → ${seq[2]} ist −${q}. Dann geht es abwechselnd weiter.` };
  });
  regM("ma.mauerdeck", "Zahlenmauer: größter Deckstein", (r) => {
    const x = int(r, 1, 6) * 5, y = x + 5 * int(r, 1, 3), z = y + 5 * int(r, 1, 3);
    if (r() < 0.6) return { type: "choice", q: `Trage die Zahlen ${x}, ${y} und ${z} so in die untere Reihe einer Zahlenmauer ein, dass der Deckstein am größten wird. Welche Zahl gehört in die Mitte?`, opts: [String(z), String(y), String(x)], fixed: true, ans: 0,
      tip: "Rechne zwei Möglichkeiten aus. Die mittlere Zahl geht in beide Steine der zweiten Reihe ein.", explain: `Die mittlere Zahl wird zweimal gezählt: Deckstein = links + 2 · Mitte + rechts. Mit ${z} in der Mitte: ${x + z * 2 + y}. Mit ${x} in der Mitte nur ${y + x * 2 + z}.` };
    return { type: "choice", q: "Ergänze den Satz: Der Deckstein einer Zahlenmauer mit drei Steinen unten ist am größten, wenn …", opts: ["die größte Zahl in der Mitte steht", "die größte Zahl links steht", "die kleinste Zahl in der Mitte steht", "die Zahlen von klein nach groß geordnet sind"], ans: 0, fixed: true,
      tip: "Welche Zahl wird bei der Deckstein-Rechnung zweimal gebraucht?", explain: "Die mittlere Zahl zählt doppelt. Darum bringt dort die größte Zahl am meisten." };
  });
  regZ("ma.darstellung", "Darstellungen zur Malaufgabe", (r) => {
    const a = int(r, 3, 5), b = pick(r, [4, 5, 6, 3].filter((x) => x !== a)), things = pick(r, [["Tüten", "Gummibärchen"], ["Körbe", "Äpfel"], ["Schachteln", "Stifte"]]);
    const pool = [[`${a} · ${b}`, true], [Array(a).fill(b).join(" + "), true], [Array(b).fill(a).join(" + "), false], [`${a} + ${b}`, false], [`${b} · ${b}`, false], [`${a} · ${a}`, false]];
    const opts = shuffled(r, [pool[0], pool[1], pool[2], pool[3]].concat(r() < 0.5 ? [pool[4]] : []));
    const ans = opts.map((o, i) => (o[1] ? i : -1)).filter((i) => i >= 0);
    return { type: "multi", fixed: true, q: `Ich habe ${a} ${things[0]}. In jeder sind ${b} ${things[1]}. Welche Rechnungen passen dazu? Mehrere passen.`, opts: opts.map((o) => o[0]), ans,
      tip: `${a} ${things[0]} mit je ${b}: Das ist ${a}-mal die Zahl ${b}.`, explain: `${a} · ${b} und ${Array(a).fill(b).join(" + ")} passen. In ${Array(b).fill(a).join(" + ")} wären es ${b} ${things[0]} mit je ${a}.` };
  });

  /* ================= Größen und Messen (mehr) ================= */
  regG("ma.uhr", "Uhr lesen", (r, lv) => {
    const h = int(r, 1, 12), m = pick(r, lv <= 1 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const t = (hh, mm) => `${hh}:${String(mm).padStart(2, "0")} Uhr`;
    const opts = [t(h, m), t(m === 0 ? h : (m / 5 + 12 - 1) % 12 + 1, (h % 12) * 5), t(h === 12 ? 1 : h + 1, m), t(h, (m + 30) % 60)].filter((x, i, a) => a.indexOf(x) === i);
    while (opts.length < 4) opts.push(t(int(r, 1, 12), pick(r, [0, 15, 30, 45])));
    return { type: "choice", q: "Wie spät ist es? Lies die Uhr ab.", opts: [...new Set(opts)].slice(0, 4), ans: 0, fig: clockSvg(h, m), tip: "Der kurze Zeiger zeigt die Stunde, der lange Zeiger die Minuten. Beim langen Zeiger zählst du in 5er-Schritten.", explain: `Der kurze Zeiger steht bei ${h}, der lange bei ${m}. Es ist ${t(h, m)}.` };
  });
  regG("ma.uhrplus", "Uhrzeit und Dauer", (r, lv) => {
    const h = int(r, 6, 17), m = int(r, 0, 59), d = pick(r, lv <= 1 ? [15, 30, 45] : [25, 35, 45, 50, 55, 75]), tot = h * 60 + m + d, H = Math.floor(tot / 60), M = tot % 60, f = (x, y) => `${x}:${String(y).padStart(2, "0")}`;
    return { type: "write", q: `Samira macht sich um ${f(h, m)} Uhr auf den Heimweg. Sie braucht ${d} Minuten. Um wie viel Uhr kommt sie zu Hause an? (Schreibe so: 17:03)`, ans: [f(H, M), f(H, M).replace(":", "."), f(H, M) + " Uhr"],
      tip: "Rechne erst bis zur nächsten vollen Stunde, dann den Rest. Eine Stunde hat 60 Minuten.", explain: `${f(h, m)} + ${d} min: bis ${h + 1}:00 sind es ${60 - m} min, dann noch ${Math.max(0, d - (60 - m))} min. Ergebnis ${f(H, M)} Uhr.` };
  });
  regG("ma.gemischt", "Gemischte Einheiten", (r) => {
    const k = int(r, 0, 5);
    if (k === 0) { const m = int(r, 1, 9), cm = int(r, 1, 9) * 10; return num(`${m} m ${cm} cm = ___ cm`, m * 100 + cm, "1 m sind 100 cm.", `${m} m = ${m * 100} cm, dazu ${cm} cm: ${m * 100 + cm} cm.`, { unit: "cm" }); }
    if (k === 1) { const km = int(r, 1, 4), m = int(r, 1, 9) * 50; return num(`${km * 1000 + m} m = ${km} km ___ m`, m, "1 km sind 1000 m.", `${km * 1000 + m} m = ${km} km und ${m} m.`, { unit: "m" }); }
    if (k === 2) { const kg = int(r, 2, 8), g = int(r, 1, 9) * 50; return num(`${kg} kg ${g} g = ___ g`, kg * 1000 + g, "1 kg sind 1000 g.", `${kg} kg = ${kg * 1000} g, dazu ${g} g.`, { unit: "g", fmt: true }); }
    if (k === 3) { const l = int(r, 1, 4), ml = int(r, 1, 9) * 100; return num(`${l * 1000 + ml} ml = ${l} l ___ ml`, ml, "1 l sind 1000 ml.", `${l * 1000 + ml} ml = ${l} l und ${ml} ml.`, { unit: "ml" }); }
    if (k === 4) { const kg = int(r, 3, 9), g = int(r, 1, 9) * 100; return num(`${kg * 1000 + g} g = ${kg} kg ___ g`, g, "1 kg sind 1000 g.", `${kg * 1000 + g} g = ${kg} kg und ${g} g.`, { unit: "g" }); }
    const m = int(r, 2, 4), cm = int(r, 1, 9), cmv = pick(r, [m * 100 + cm * 10, m * 100 + cm, m * 100 + cm + 20]);
    return { type: "choice", fixed: true, q: `Setze <, > oder = ein: ${m} m ${cm} cm ___ ${cmv} cm`, opts: ["<", "=", ">"], ans: m * 100 + cm < cmv ? 0 : m * 100 + cm === cmv ? 1 : 2, tip: "Wandle zuerst alles in cm um, dann vergleiche.", explain: `${m} m ${cm} cm = ${m * 100 + cm} cm. Verglichen mit ${cmv} cm.` };
  });
  const THINGS = [
    ["Höhe einer Tür", "2 m"], ["Breite eines Fingers", "1 cm"], ["Breite einer Bleistiftspitze", "1 mm"], ["Länge eines Fußballplatzes", "100 m"], ["Weg zur Schule", "1 km"],
    ["Gewicht einer Tafel Schokolade", "100 g"], ["Gewicht eines Autos", "1 t"], ["Wasser in einer Flasche", "1 l"], ["Inhalt eines Teelöffels", "5 ml"], ["Gewicht eines Apfels", "150 g"], ["Gewicht eines Fahrrads", "14 kg"], ["Wasser in einer Badewanne", "150 l"],
  ];
  regG("ma.einheit", "Größen zuordnen", (r) => {
    const groups = [["Höhe einer Tür", "Breite eines Fingers", "Breite einer Bleistiftspitze", "Länge eines Fußballplatzes", "Weg zur Schule"], ["Gewicht einer Tafel Schokolade", "Gewicht eines Autos", "Gewicht eines Apfels", "Gewicht eines Fahrrads"], ["Wasser in einer Flasche", "Inhalt eines Teelöffels", "Wasser in einer Badewanne"]];
    const g = pick(r, groups), things = shuffled(r, g).slice(0, Math.min(4, g.length)), vals = things.map((t) => THINGS.find((x) => x[0] === t)[1]);
    const extra = THINGS.filter((x) => g.includes(x[0]) && !things.includes(x[0]));
    const right = shuffled(r, extra.length ? [...vals, extra[0][1]] : vals);
    if (new Set(right).size !== right.length) return null;
    return { type: "match", q: "Verbinde. Eine Angabe bleibt vielleicht übrig.", left: things, right, ans: things.map((t, i) => [right.indexOf(vals[i])]), tip: "Überlege: Wie groß oder schwer ist das ungefähr? Sortiere zuerst von klein nach groß.", explain: things.map((t, i) => `${t}: ${vals[i]}`).join(" · ") };
  });
  regG("ma.weitsprung", "Tabelle lesen: Weiten", (r) => {
    const names = shuffled(r, ["Ida", "Mina", "Tom", "Alex", "David", "Lara", "Ben"]).slice(0, 5), vals = shuffled(r, Array.from({ length: 18 }, (_, i) => (15 + i) / 10)).slice(0, 5);
    const a = int(r, 0, 4); let b = int(r, 0, 4); if (b === a) b = (a + 1) % 5;
    const hi = vals[a] > vals[b] ? a : b, lo = hi === a ? b : a, d = Math.round((vals[hi] - vals[lo]) * 100);
    return num(`Weitsprung beim Sportfest: ${names[hi]} ist ___ cm weiter gesprungen als ${names[lo]}.`, d, "Rechne den Unterschied in Metern aus und wandle dann in cm um (1 m = 100 cm). Oder wandle zuerst um.", `${String(vals[hi]).replace(".", ",")} m − ${String(vals[lo]).replace(".", ",")} m = ${String(Math.round((vals[hi] - vals[lo]) * 100) / 100).replace(".", ",")} m = ${d} cm.`,
      { unit: "cm", table: { head: ["Name", "Weite"], rows: names.map((n, i) => [n, `${String(vals[i].toFixed(2)).replace(".", ",")} m`]) } });
  });
  regG("ma.eisdiele", "Preisschild und Rückgeld", (r) => {
    const p = pick(r, [1.2, 1.5, 1.8, 2]), persons = int(r, 3, 5), k = pick(r, [2, 3]), pay = pick(r, [20, 50]), cost = persons * k * p;
    if (cost >= pay) return null;
    const kind = int(r, 0, 1);
    const table = { head: ["Kugeln", "Preis"], rows: [["1 Kugel", fmtMoney(p) + " €"], ["2 Kugeln", fmtMoney(2 * p) + " €"], ["3 Kugeln", "___ €"]] };
    if (kind === 0) return num(`Eisdiele: Eine Kugel Eis kostet ${fmtMoney(p)} €. Was kosten 3 Kugeln?`, 3 * p, "Rechne 3 mal den Preis für eine Kugel.", `3 · ${fmtMoney(p)} € = ${fmtMoney(3 * p)} €.`, { money: true, dec: true, unit: "€", table });
    return num(`Eisdiele: Eine Kugel kostet ${fmtMoney(p)} €. ${persons} Personen essen je ${k} Kugeln und bezahlen mit einem ${pay}-Euro-Schein. Wie viel Geld bekommen sie zurück?`, pay - cost, "Rechne erst: Wie viele Kugeln sind das alle zusammen? Dann den Preis. Dann ziehe vom Schein ab.", `${persons} · ${k} = ${persons * k} Kugeln. ${persons * k} · ${fmtMoney(p)} € = ${fmtMoney(cost)} €. ${pay} € − ${fmtMoney(cost)} € = ${fmtMoney(pay - cost)} €.`, { money: true, dec: true, unit: "€" });
  });
  regG("ma.fahrplan", "Fahrplan lesen", (r) => {
    const t0 = int(r, 7, 9) * 60 + pick(r, [0, 5, 10]), iv = pick(r, [20, 30, 40]), offs = [0, int(r, 7, 10), int(r, 18, 22), int(r, 28, 34)];
    const st = ["Schule", "Marktplatz", "Waldweg", "Schwimmbad"], f = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
    const head = ["Haltestelle", "Fahrt 1", "Fahrt 2", "Fahrt 3"], rows = st.map((s, i) => [s, ...[0, 1, 2].map((k) => f(t0 + k * iv + offs[i]))]);
    const table = { head, rows }, kind = int(r, 0, 2);
    if (kind === 0) return num("Wie viele Minuten dauert die Fahrt von der Schule bis zum Schwimmbad?", offs[3], "Rechne von der Abfahrtszeit bis zur Ankunftszeit in einer Fahrt. Zähle erst bis zur vollen Stunde.", `Von ${rows[0][1]} bis ${rows[3][1]} sind es ${offs[3]} Minuten.`, { unit: "Minuten", table });
    if (kind === 1) return num("Alle wie viele Minuten fährt der Bus?", iv, "Vergleiche zwei Abfahrtszeiten an derselben Haltestelle.", `${rows[0][1]} → ${rows[0][2]}: ${iv} Minuten.`, { unit: "Minuten", table });
    const dl = t0 + iv + offs[3] + 3, good = [0, 1, 2].filter((k) => t0 + k * iv + offs[3] <= dl), best = Math.max(...good);
    return { type: "choice", fixed: true, q: `Die Klasse muss spätestens um ${f(dl)} Uhr am Schwimmbad sein. Mit welcher Fahrt fährt sie am besten los?`, opts: ["Fahrt 1", "Fahrt 2", "Fahrt 3"], ans: best, table,
      tip: "Schau in die Zeile „Schwimmbad“. Welche Fahrt kommt noch rechtzeitig an? Nimm die späteste, die nicht zu spät kommt.", explain: `Ankunft am Schwimmbad: ${rows[3].slice(1).join(", ")}. Spätestens ${f(dl)} Uhr, also Fahrt ${best + 1}.` };
  });

  /* ================= Daten und Zufall ================= */
  const TAB = [
    { q: "Eiskugeln", row: "Kugeln", cats: ["Mo", "Di", "Mi", "Do"], what: "verkauft" },
    { q: "Bücher", row: "Bücher", cats: ["Mo", "Di", "Mi", "Do", "Fr"], what: "ausgeliehen" },
    { q: "Kinder", row: "Kinder", cats: ["Fußball", "Schwimmen", "Reiten", "Turnen"], what: "gewählt" },
  ];
  function dataSet(r, n, unit) { return shuffled(r, [1, 2, 3, 4, 5, 6, 7]).slice(0, n).map((x) => x * unit); }
  regD("ma.daten.tabelle", "Tabelle lesen", (r) => {
    const th = pick(r, TAB), vals = dataSet(r, th.cats.length, 5);
    if (new Set(vals).size < vals.length) return null;
    const table = { head: ["", ...th.cats], rows: [[th.row, ...vals.map(String)]] }, kind = int(r, 0, 3);
    const mx = vals.indexOf(Math.max(...vals)), mn = vals.indexOf(Math.min(...vals));
    if (kind === 0) return { type: "choice", q: `Die Tabelle zeigt, wie viele ${th.q} ${th.what} wurden. Was kommt am häufigsten vor?`, opts: th.cats.slice(), fixed: true, ans: mx, table, tip: "Suche in der Zeile die größte Zahl. Welcher Name steht darüber?", explain: `Die größte Zahl ist ${vals[mx]}, sie gehört zu ${th.cats[mx]}.` };
    if (kind === 1) { const i = int(r, 0, th.cats.length - 1); return num(`Wie viele ${th.q} waren es bei „${th.cats[i]}“?`, vals[i], "Suche die Spalte mit dem richtigen Namen und lies die Zahl darunter ab.", `Unter ${th.cats[i]} steht ${vals[i]}.`, { table }); }
    if (kind === 2) return num(`Wie viele ${th.q} sind es zusammen?`, vals.reduce((a, b) => a + b, 0), "Zähle alle Zahlen in der Tabelle zusammen.", `${vals.join(" + ")} = ${vals.reduce((a, b) => a + b, 0)}.`, { table });
    return num(`Wie viele mehr gibt es bei „${th.cats[mx]}“ als bei „${th.cats[mn]}“?`, vals[mx] - vals[mn], "Lies beide Zahlen ab und rechne den Unterschied aus: groß minus klein.", `${vals[mx]} − ${vals[mn]} = ${vals[mx] - vals[mn]}.`, { table });
  });
  regD("ma.daten.saeule", "Säulendiagramm lesen", (r) => {
    const th = pick(r, TAB.slice(0, 2)), unit = pick(r, [2, 3, 5]), vals = dataSet(r, th.cats.length, unit);
    if (new Set(vals).size < vals.length) return null;
    const rows = Math.max(...vals) / unit + 1, fig = barSvg(th.cats, vals, unit, rows), kind = int(r, 0, 3);
    const mx = vals.indexOf(Math.max(...vals)), mn = vals.indexOf(Math.min(...vals));
    if (kind === 0) return { type: "choice", q: "Wann wurde am wenigsten gezählt? Lies das Diagramm ab.", opts: th.cats.slice(), fixed: true, ans: mn, fig, tip: "Der kürzeste Balken gehört zum kleinsten Wert.", explain: `Der kürzeste Balken ist bei ${th.cats[mn]} (${vals[mn]}).` };
    if (kind === 1) { const i = int(r, 0, vals.length - 1); return num(`Wie viele waren es bei „${th.cats[i]}“? Lies am Balken ab.`, vals[i], "Gehe vom oberen Ende des Balkens nach links zur Zahlenleiste. Achte auf die Schrittweite der Leiste.", `Der Balken bei ${th.cats[i]} reicht bis ${vals[i]}.`, { fig }); }
    if (kind === 2) return num(`Wie viele waren es in der ganzen Woche zusammen?`, vals.reduce((a, b) => a + b, 0), "Lies jeden Balken ab und schreibe die Zahlen auf. Dann rechne zusammen.", `${vals.join(" + ")} = ${vals.reduce((a, b) => a + b, 0)}.`, { fig });
    return num(`Wie viele mehr gibt es bei „${th.cats[mx]}“ als bei „${th.cats[mn]}“?`, vals[mx] - vals[mn], "Lies beide Balken ab und rechne groß minus klein.", `${vals[mx]} − ${vals[mn]} = ${vals[mx] - vals[mn]}.`, { fig });
  });
  regD("ma.daten.diagramm", "Welches Diagramm passt?", (r) => {
    const th = pick(r, TAB.slice(0, 2)), unit = 5, vals = dataSet(r, th.cats.length, unit);
    const rows = 8, bad = (v) => { const w = v.slice(); const i = int(r, 0, v.length - 1); let j = int(r, 0, v.length - 1); if (j === i) j = (i + 1) % v.length; [w[i], w[j]] = [w[j], w[i]]; return w; };
    const a = vals, b = bad(vals), c = vals.map((v, i) => (i === 1 ? v + 5 : v));
    const opts = [a, b, c].filter((x, i, arr) => arr.findIndex((y) => y.join() === x.join()) === i);
    if (opts.length < 3) return null;
    const order = shuffled(r, [0, 1, 2]);
    return { type: "choice", fixed: true, q: "Welches Säulendiagramm passt zur Tabelle?", table: { head: ["", ...th.cats], rows: [[th.row, ...vals.map(String)]] }, opts: ["Diagramm A", "Diagramm B", "Diagramm C"], figs: order.map((i) => barSvg(th.cats, opts[i], unit, rows)), ans: order.indexOf(0),
      tip: "Vergleiche Balken für Balken mit der Tabelle. Stimmt jede Höhe?", explain: "Nur bei einem Diagramm passt jeder Balken zur Zahl in der Tabelle." };
  });
  regD("ma.daten.balkenzeichnen", "Säulen zeichnen", (r) => {
    const th = TAB[0], unit = 10, vals = th.cats.map(() => int(r, 1, 4) * unit), rows = 5, cell = 40;
    const ans = [];
    vals.forEach((v, x) => { for (let k = 0; k < v / unit; k++) ans.push([x, rows - 1 - k]); });
    return { type: "grid", bars: true, q: "Zeichne für jeden Tag den passenden Balken. 1 Kästchen nach oben = 10 Kugeln. Tippe in jeder Spalte auf das oberste Kästchen des Balkens.", table: { head: ["Tag", ...th.cats], rows: [["Kugeln", ...vals.map(String)]] },
      cols: th.cats.length, rows, cell, axis: null, given: [], ans, solCells: ans, solText: "So sehen die Balken aus (grün)", padL: 34, padB: 24, xLabels: th.cats, yLabels: Array.from({ length: rows + 1 }, (_, k) => String(k * unit)),
      tip: "Rechne: Wie viele Kästchen sind das? Teile die Anzahl durch 10. Tippe dann in der Spalte auf dieses Kästchen von unten.", explain: vals.map((v, i) => `${th.cats[i]}: ${v / unit} Kästchen`).join(", ") };
  });
  regD("ma.daten.zufall", "Sicher, möglich, unmöglich", (r, lv) => {
    const cols = pick(r, [["rot", "blau"], ["rot", "gelb"], ["blau", "grün"]]), nr = int(r, 1, 6), nb = int(r, 1, 6), balls = [...Array(nr).fill(cols[0]), ...Array(nb).fill(cols[1])];
    const k = int(r, 0, 3);
    let st, ans;
    if (k === 0) { st = `Ich ziehe eine ${cols[0]}e oder ${cols[1]}e Kugel.`; ans = "sicher"; }
    else if (k === 1) { st = `Ich ziehe eine ${pick(r, ["grün", "gelb", "schwarz", "weiß"].filter((c) => !cols.includes(c)))}e Kugel.`; ans = "unmöglich"; }
    else { const c = pick(r, cols); st = `Ich ziehe eine ${c}e Kugel.`; ans = "möglich"; }
    return { type: "choice", fixed: true, q: `In dem Sack liegen nur diese Kugeln. ${st} Passt das Wort: sicher, möglich oder unmöglich?`, opts: ["sicher", "möglich", "unmöglich"], ans: ["sicher", "möglich", "unmöglich"].indexOf(ans), fig: bagSvg(balls),
      tip: "Sicher: passiert immer. Möglich: kann passieren. Unmöglich: passiert nie. Schau, welche Farben im Sack sind.", explain: ans === "sicher" ? "Es gibt nur diese beiden Farben, also ist es sicher." : ans === "unmöglich" ? "Diese Farbe liegt nicht im Sack." : "Die Farbe liegt im Sack, aber es gibt auch andere Kugeln: möglich." };
  });
  regD("ma.daten.wahrscheinlich", "Wahrscheinlicher oder nicht", (r) => {
    const c = pick(r, [["rot", "blau"], ["gelb", "grün"]]), a = int(r, 5, 7), b = 1, balls = shuffled(r, [...Array(a).fill(c[0]), ...Array(b).fill(c[1])]);
    const which = r() < 0.5 ? 0 : 1;
    return { type: "choice", fixed: true, q: `Im Sack liegen ${a} ${c[0]}e und ${b} ${c[1]}e Kugel. Ich ziehe eine ${c[which]}e Kugel. Welches Wort passt am besten?`, opts: ["unmöglich", "unwahrscheinlich", "wahrscheinlich", "sicher"], ans: which === 0 ? 2 : 1, fig: bagSvg(balls),
      tip: "Wahrscheinlich: es sind viele von dieser Farbe. Unwahrscheinlich: es sind nur wenige.", explain: `${c[0]}: ${a} von ${a + b} Kugeln, ${c[1]}: nur ${b}. ${which === 0 ? "Rot ist viel häufiger: wahrscheinlich." : "Es gibt nur eine: unwahrscheinlich."}`.replace("Rot", c[0]) };
  });
  regD("ma.daten.sack", "Welcher Sack passt?", (r) => {
    const kind = int(r, 0, 1), cols = ["rot", "blau"];
    const bags = [Array(4).fill("blau"), ["blau", "blau", "rot", "rot"], ["rot", "rot", "rot", "rot"], ["blau", "rot", "rot", "rot"]];
    if (kind === 0) { const order = shuffled(r, [0, 1, 3]); return { type: "choice", fixed: true, q: "Es ist sicher, dass ich eine blaue Kugel ziehe. Welcher Sack passt?", opts: ["Sack A", "Sack B", "Sack C"], figs: order.map((i) => bagSvg(bags[i])), ans: order.indexOf(0), tip: "Sicher heißt: Es sind nur blaue Kugeln im Sack.", explain: "Nur wenn alle Kugeln blau sind, ist es sicher." }; }
    const order = shuffled(r, [1, 2, 0]); return { type: "choice", fixed: true, q: "Es ist möglich, dass ich eine rote Kugel ziehe, aber nicht sicher. Welcher Sack passt?", opts: ["Sack A", "Sack B", "Sack C"], figs: order.map((i) => bagSvg(bags[i])), ans: order.indexOf(1), tip: "Möglich, aber nicht sicher: Es gibt rote und auch andere Kugeln.", explain: "Im richtigen Sack liegen rote und blaue Kugeln." };
  });
  regD("ma.daten.gleich", "Gleiche Chance", (r) => {
    const a = int(r, 1, 2), n = a * int(r, 2, 3) + int(r, 0, 0), k = int(r, 2, 3), big = n * k;
    const left = [...Array(a).fill("weiß"), ...Array(n - a).fill("schwarz")];
    return num(`Bei diesem Spiel gewinnt man mit einer weißen Kugel. Im linken Sack sind ${n} Kugeln, davon ${a} weiß. Im rechten Sack sind ${big} Kugeln. Wie viele davon müssen weiß sein, damit die Chance zu gewinnen in beiden Säcken gleich ist?`, a * k, `Im rechten Sack ist alles ${k}-mal so viel. Rechne ${a} · ${k}.`, `${big} : ${n} = ${k}, also ${a} · ${k} = ${a * k} weiße Kugeln.`, { fig: bagSvg(left.slice(0, 8)) });
  });
  regD("ma.daten.glueck", "Glücksrad", (r) => {
    const cs = pick(r, [["rot", "blau", "gelb"], ["rot", "grün", "gelb"]]), n = pick(r, [6, 8]);
    const cnt = shuffled(r, pick(r, n === 6 ? [[3, 2, 1], [4, 1, 1]] : [[4, 3, 1], [4, 2, 2], [5, 2, 1]]));
    const wheel = []; cs.forEach((c, i) => wheel.push(...Array(cnt[i]).fill(c)));
    const top = cnt.indexOf(Math.max(...cnt)), kind = int(r, 0, 1);
    if (kind === 0) return { type: "choice", fixed: true, q: `Ein Glücksrad hat ${n} gleich große Felder. Welche Farbe kommt am häufigsten vor?`, opts: cs.slice(), ans: top, fig: wheelSvg(wheel), tip: "Zähle die Felder jeder Farbe.", explain: cs.map((c, i) => `${c}: ${cnt[i]}`).join(", ") + "." };
    return { type: "choice", fixed: true, q: `Ich drehe das Glücksrad. Ist es sicher, dass ich ${cs[0]} drehe?`, opts: ["Ja, das ist sicher.", "Nein, es ist nicht sicher, weil es auch andere Farben gibt."], ans: 1, fig: wheelSvg(wheel), tip: "Sicher ist es nur, wenn alle Felder dieselbe Farbe haben.", explain: `Es gibt ${cs[0]}e, aber auch andere Felder. Es ist nicht sicher.` };
  });
  regD("ma.daten.durchschnitt", "Durchschnitt", (r) => {
    const n = int(r, 3, 4), m = int(r, 3, 12), vals = []; let sum = m * n;
    for (let i = 0; i < n - 1; i++) { const v = int(r, Math.max(1, m - 4), m + 4); vals.push(v); sum -= v; }
    if (sum < 1) return null; vals.push(sum);
    if (new Set(vals).size < 2) return null;
    const things = pick(r, [["Muscheln", "sammeln Muscheln"], ["Steine", "sammeln Steine"], ["Bücher", "lesen Bücher"]]);
    return num(`${n} Kinder ${things[1]}: ${vals.join(", ")} ${things[0]}. Wie viele sind es im Durchschnitt?`, m, "Der Durchschnitt: Zähle alles zusammen und teile durch die Anzahl der Kinder.", `${vals.join(" + ")} = ${m * n}, und ${m * n} : ${n} = ${m}.`, { unit: things[0] });
  });
  regD("ma.daten.kombi", "Kombinieren", (r) => {
    const sets = [["T-Shirts", "Hosen", "Mia hat {a} T-Shirts und {b} Hosen. Wie viele verschiedene Kombinationen kann sie anziehen?"], ["Eissorten", "Soßen", "Es gibt {a} Eissorten und {b} Soßen. Wie viele verschiedene Eisbecher mit einer Sorte und einer Soße sind möglich?"], ["Hemden", "Krawatten", "Tom hat {a} Hemden und {b} Krawatten. Wie viele Kombinationen gibt es?"]];
    const [, , tpl] = pick(r, sets), a = int(r, 2, 4), b = int(r, 2, 4);
    return num(tpl.replace("{a}", a).replace("{b}", b), a * b, "Jedes von den ersten passt zu jedem von den zweiten. Zeichne eine Tabelle oder rechne mal.", `${a} · ${b} = ${a * b}.`);
  });

  const api = { clockSvg, bagSvg, wheelSvg, barSvg };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DEKompassMathe2 = api;
})(typeof self !== "undefined" ? self : this);
