// Kompass 4: reine Logik ohne Oberfläche (läuft im Browser und in Node, siehe tools/test-kompass.mjs).
// Mathe-Aufgaben werden mit einem Startwert erzeugt, damit Tests sie nachrechnen können.
(function (root) {
  "use strict";

  /* ================= Zufall mit Startwert ================= */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = (r, list) => list[Math.floor(r() * list.length)];
  function shuffled(r, list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ================= Zahlen schreiben und lesen ================= */
  // 357588 -> "357.588"
  const fmt = (n) => (n < 0 ? "-" : "") + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  // Geld: 12.5 -> "12,50"
  const fmtMoney = (n) => { const c = Math.round(n * 100); return fmt(Math.floor(c / 100)) + "," + String(c % 100).padStart(2, "0"); };
  // Eingabe lesen: Tausenderpunkte und Leerzeichen weg, Komma als Dezimalzeichen
  function parseNum(s) {
    let t = String(s == null ? "" : s).trim().replace(/\s/g, "");
    if (!t) return NaN;
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, "");
    t = t.replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
    return Number(t);
  }
  const EINER = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
  const ZEHNER = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
  function w100(n, last) {
    if (n < 20) return n === 1 ? (last ? "eins" : "ein") : EINER[n];
    const u = n % 10, t = Math.floor(n / 10);
    return (u ? (u === 1 ? "ein" : EINER[u]) + "und" : "") + ZEHNER[t];
  }
  function w1000(n, last) {
    const h = Math.floor(n / 100), r = n % 100;
    return (h ? (h === 1 ? "ein" : EINER[h]) + "hundert" : "") + (r ? w100(r, last) : "");
  }
  // 346205 -> "dreihundertsechsundvierzigtausendzweihundertfünf"
  function words(n) {
    if (n === 0) return "null";
    const th = Math.floor(n / 1000), r = n % 1000;
    return (th ? w1000(th, false) + "tausend" : "") + (r ? w1000(r, true) : "");
  }
  const STELLEN = [
    { k: "E", name: "Einer", v: 1 }, { k: "Z", name: "Zehner", v: 10 }, { k: "H", name: "Hunderter", v: 100 },
    { k: "T", name: "Tausender", v: 1000 }, { k: "ZT", name: "Zehntausender", v: 10000 }, { k: "HT", name: "Hunderttausender", v: 100000 },
  ];

  /* ================= Bereiche und Unterkompetenzen ================= */
  const AREAS = [
    { id: "de.sprache", fach: "de", name: "Sprache untersuchen", icon: "🔤", ready: true },
    { id: "de.lesen", fach: "de", name: "Lesen", icon: "📖", ready: true, unit: true },
    { id: "de.recht", fach: "de", name: "Rechtschreiben", icon: "✏️", ready: true },
    { id: "ma.zahlen", fach: "ma", name: "Zahlen und Rechnen", icon: "🔢", ready: true },
    { id: "ma.groessen", fach: "ma", name: "Größen und Messen", icon: "📏", ready: true },
    { id: "ma.muster", fach: "ma", name: "Muster und Strukturen", icon: "🔁", ready: true },
    { id: "ma.raum", fach: "ma", name: "Raum und Form", icon: "🔷", ready: true },
    { id: "ma.daten", fach: "ma", name: "Daten und Zufall", icon: "📊", ready: true },
  ];
  const COMPS = [];
  const comp = (id, area, name, gen) => COMPS.push({ id, area, name, gen });

  /* ================= Mathe: Generatoren ================= */
  // Jede Aufgabe: { key, comp, type, q, ans, ... , tip, explain }. type: num | choice | order
  // Zahlen und Rechnen
  comp("ma.stelle", "ma.zahlen", "Stellenwerte", (r, lv) => {
    const n = lv <= 1 ? int(r, 10000, 99999) : int(r, 100000, 999999);
    const kind = int(r, 0, 2);
    const digits = String(n).split("").reverse().map(Number);
    if (kind === 0) {
      const i = int(r, 1, String(n).length - 1), s = STELLEN[i];
      return { type: "num", q: `Welche Ziffer steht in ${fmt(n)} an der ${s.name}stelle?`, ans: digits[i], n, i,
        tip: `Zähle von rechts: Einer, Zehner, Hunderter, Tausender, Zehntausender, Hunderttausender.`,
        explain: `In ${fmt(n)} steht an der ${s.name}stelle die ${digits[i]}.` };
    }
    if (kind === 1) {
      // Zahl aus Stellenwerten bauen, manche Stellen fehlen (Null)
      const parts = [];
      let ans = 0;
      for (let i = String(n).length - 1; i >= 0; i--) {
        const d = digits[i];
        if (!d) continue;
        if (i < String(n).length - 1 && r() < 0.25) continue;
        parts.push(`${d} ${STELLEN[i].k}`);
        ans += d * STELLEN[i].v;
      }
      return { type: "num", q: `Schreibe als Zahl: ${parts.join(" + ")}`, ans, fmt: true,
        tip: "HT = Hunderttausender, ZT = Zehntausender, T = Tausender, H = Hunderter, Z = Zehner, E = Einer. Wo nichts steht, schreibst du eine 0.",
        explain: `${parts.join(" + ")} = ${fmt(ans)}` };
    }
    return { type: "num", q: `Schreibe als Zahl: ${words(n)}`, ans: n, fmt: true, say: words(n),
      tip: "Teile das Zahlwort beim Wort „tausend“: Was davor steht, sind die Tausender.",
      explain: `${words(n)} = ${fmt(n)}` };
  });
  comp("ma.vergleich", "ma.zahlen", "Zahlen ordnen", (r, lv) => {
    const base = lv <= 1 ? int(r, 10, 99) * 1000 : int(r, 100, 999) * 1000;
    const set = new Set();
    while (set.size < 4) {
      const v = base + pick(r, [0, 1, 1, 10, 100, 1000, 10000]) * int(r, -9, 9) + int(r, 0, 999);
      if (v > 0 && v < 1000000) set.add(v);
    }
    const items = [...set].sort((a, b) => a - b);
    return { type: "order", q: "Ordne die Zahlen. Beginne mit der kleinsten.", items: items.map(fmt),
      tip: "Vergleiche von links: Wer hat an der größten Stelle die kleinere Ziffer?",
      explain: items.map(fmt).join(" < ") };
  });
  comp("ma.runden", "ma.zahlen", "Runden", (r, lv) => {
    const n = lv <= 1 ? int(r, 1000, 99999) : int(r, 10000, 999999);
    const places = lv <= 1 ? [10, 100, 1000] : [100, 1000, 10000];
    const p = pick(r, places), name = { 10: "Zehner", 100: "Hunderter", 1000: "Tausender", 10000: "Zehntausender" }[p];
    const ans = Math.round(n / p) * p;
    return { type: "num", q: `Runde ${fmt(n)} auf ${name}.`, ans, fmt: true,
      tip: `Schau auf die Stelle rechts neben den ${name}n: 0 bis 4 abrunden, 5 bis 9 aufrunden.`,
      explain: `${fmt(n)} ≈ ${fmt(ans)}` };
  });
  comp("ma.nachbar", "ma.zahlen", "Nachbarzahlen", (r, lv) => {
    const n = int(r, lv <= 1 ? 1001 : 10001, 999998);
    const kind = int(r, 0, 3);
    if (kind === 0) return { type: "num", q: `Welche Zahl kommt direkt vor ${fmt(n)}? (Vorgänger)`, ans: n - 1, fmt: true, tip: "Der Vorgänger ist um 1 kleiner.", explain: `${fmt(n - 1)}, ${fmt(n)}` };
    if (kind === 1) return { type: "num", q: `Welche Zahl kommt direkt nach ${fmt(n)}? (Nachfolger)`, ans: n + 1, fmt: true, tip: "Der Nachfolger ist um 1 größer.", explain: `${fmt(n)}, ${fmt(n + 1)}` };
    const p = kind === 2 ? 100 : 1000, name = p === 100 ? "Hunderter" : "Tausender";
    const m = n % p === 0 ? n + 1 : n, lo = Math.floor(m / p) * p;
    const up = r() < 0.5;
    return { type: "num", q: `${fmt(m)} liegt zwischen zwei ${name}zahlen. Welche ist die ${up ? "größere" : "kleinere"}?`, ans: up ? lo + p : lo, fmt: true,
      tip: `Welche glatten ${name}zahlen liegen direkt davor und danach?`,
      explain: `${fmt(lo)} < ${fmt(m)} < ${fmt(lo + p)}` };
  });
  const paper = "Rechne auf Papier wie im Test und tippe das Ergebnis ein.";
  comp("ma.plus", "ma.zahlen", "Schriftlich plus", (r, lv) => {
    const k = lv >= 3 && r() < 0.5 ? 3 : 2;
    const lim = lv <= 1 ? 99999 : 499999;
    const nums = Array.from({ length: k }, () => int(r, lv <= 1 ? 1000 : 10000, Math.floor(lim / k)));
    const ans = nums.reduce((a, b) => a + b, 0);
    return { type: "num", q: nums.map(fmt).join(" + ") + " = ?", nums, ans, fmt: true, paper: true,
      tip: "Schreibe die Zahlen genau untereinander: Einer unter Einer. Übertrag nicht vergessen!",
      explain: `${nums.map(fmt).join(" + ")} = ${fmt(ans)}` };
  });
  comp("ma.minus", "ma.zahlen", "Schriftlich minus", (r, lv) => {
    const a = int(r, lv <= 1 ? 5000 : 50000, lv <= 1 ? 99999 : 999999), b = int(r, Math.floor(a / 10), a - 1);
    return { type: "num", q: `${fmt(a)} − ${fmt(b)} = ?`, a, b, ans: a - b, fmt: true, paper: true,
      tip: "Untereinander schreiben, große Zahl oben. Von rechts nach links rechnen, Übertrag beachten.",
      explain: `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}` };
  });
  comp("ma.mal", "ma.zahlen", "Schriftlich mal", (r, lv) => {
    const a = lv <= 1 ? int(r, 102, 999) : int(r, 1002, 9999), b = lv <= 1 ? int(r, 3, 9) : int(r, 12, 89);
    if (a * b >= 1000000) return COMP["ma.mal"].gen(r, 1);
    return { type: "num", q: `${fmt(a)} · ${b} = ?`, a, b, ans: a * b, fmt: true, paper: true,
      tip: b >= 10 ? `Rechne ${fmt(a)} · ${Math.floor(b / 10)}0 und ${fmt(a)} · ${b % 10} und zähle beides zusammen.` : `Von rechts: Einer mal ${b}, dann Zehner mal ${b} … Übertrag merken.`,
      explain: b >= 10 ? `${fmt(a)} · ${Math.floor(b / 10) * 10} = ${fmt(a * Math.floor(b / 10) * 10)}, ${fmt(a)} · ${b % 10} = ${fmt(a * (b % 10))}, zusammen ${fmt(a * b)}` : `${fmt(a)} · ${b} = ${fmt(a * b)}` };
  });
  comp("ma.geteilt", "ma.zahlen", "Schriftlich geteilt", (r, lv) => {
    const b = int(r, 2, 9), ans = lv <= 1 ? int(r, 21, 199) : int(r, 102, 1999);
    const a = ans * b;
    return { type: "num", q: `${fmt(a)} : ${b} = ?`, a, b, ans, fmt: true, paper: true,
      tip: `Wie oft passt die ${b} in die ersten Ziffern? Dann malnehmen, abziehen, nächste Ziffer herunterholen.`,
      explain: `${fmt(a)} : ${b} = ${fmt(ans)}, denn ${fmt(ans)} · ${b} = ${fmt(a)}` };
  });
  comp("ma.kopf", "ma.zahlen", "Geschickt rechnen", (r, lv) => {
    const kind = int(r, 0, 3);
    if (kind === 0) { const x = int(r, 2, 9), y = int(r, 2, 9) * pick(r, [10, 100, 1000]); return { type: "num", q: `${x} · ${fmt(y)} = ?`, ans: x * y, fmt: true, tip: `Rechne ${x} · ${y / (y % 1000 === 0 ? 1000 : y % 100 === 0 ? 100 : 10)} und hänge die Nullen an.`, explain: `${x} · ${fmt(y)} = ${fmt(x * y)}` }; }
    if (kind === 1) { const x = int(r, 2, 9), q = int(r, 2, 9) * pick(r, [10, 100]); const a = x * q; return { type: "num", q: `${fmt(a)} : ${x} = ?`, ans: q, fmt: true, tip: `Denk an das kleine 1×1: Wie viel mal ${x}?`, explain: `${fmt(a)} : ${x} = ${fmt(q)}` }; }
    if (kind === 2) { const a = int(r, 2, 9) * 1000 + int(r, 1, 9) * 100, b = int(r, 1, 9) * 1000 + int(r, 1, 9) * 100; return { type: "num", q: `${fmt(a)} + ${fmt(b)} = ?`, ans: a + b, fmt: true, tip: "Erst die Tausender, dann die Hunderter.", explain: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}` }; }
    const n = pick(r, [25, 50]) * int(r, 2, 8), m = pick(r, [4, 2, 8]); return { type: "num", q: `${n} · ${m} = ?`, ans: n * m, fmt: true, tip: "Zerlege geschickt, zum Beispiel 25 · 4 = 100.", explain: `${n} · ${m} = ${fmt(n * m)}` };
  });
  comp("ma.ueberschlag", "ma.zahlen", "Überschlagen", (r) => {
    const a = int(r, 1100, 9800), b = int(r, 1100, 9800);
    const ra = Math.round(a / 1000) * 1000, rb = Math.round(b / 1000) * 1000, est = ra + rb;
    const opts = [est, est * 10, Math.max(1000, est - 3000), est + 4000].map(fmt);
    const uniq = [...new Set(opts)];
    return { type: "choice", q: `Überschlage: ${fmt(a)} + ${fmt(b)} ist ungefähr …`, opts: uniq, ans: 0,
      tip: "Runde beide Zahlen auf Tausender und rechne dann.", explain: `${fmt(ra)} + ${fmt(rb)} = ${fmt(est)}` };
  });

  // Größen und Messen
  const conv = (q, ans, unit, tip, explain, extra) => Object.assign({ type: "num", q, ans, unit, tip, explain, fmt: true }, extra || {});
  comp("ma.laenge", "ma.groessen", "Längen", (r) => {
    const k = int(r, 0, 3);
    if (k === 0) { const km = int(r, 1, 9), m = int(r, 0, 9) * 100 + int(r, 0, 1) * 50; return conv(`${km} km ${m} m = ? m`, km * 1000 + m, "m", "1 km = 1.000 m", `${km} km = ${fmt(km * 1000)} m, plus ${m} m = ${fmt(km * 1000 + m)} m`); }
    if (k === 1) { const m = int(r, 1, 9), cm = int(r, 1, 99); return conv(`${m} m ${cm} cm = ? cm`, m * 100 + cm, "cm", "1 m = 100 cm", `${m} m = ${m * 100} cm, plus ${cm} cm = ${m * 100 + cm} cm`); }
    if (k === 2) { const cm = int(r, 2, 40), mm = int(r, 1, 9); return conv(`${cm} cm ${mm} mm = ? mm`, cm * 10 + mm, "mm", "1 cm = 10 mm", `${cm} cm = ${cm * 10} mm, plus ${mm} mm = ${cm * 10 + mm} mm`); }
    const m = int(r, 2, 19) * 1000; return conv(`${fmt(m)} m = ? km`, m / 1000, "km", "1.000 m = 1 km", `${fmt(m)} m : 1.000 = ${m / 1000} km`);
  });
  comp("ma.gewicht", "ma.groessen", "Gewichte", (r) => {
    const k = int(r, 0, 2);
    if (k === 0) { const kg = int(r, 1, 9), g = int(r, 1, 9) * 100 + pick(r, [0, 50]); return conv(`${kg} kg ${g} g = ? g`, kg * 1000 + g, "g", "1 kg = 1.000 g", `${kg} kg = ${fmt(kg * 1000)} g, plus ${g} g = ${fmt(kg * 1000 + g)} g`); }
    if (k === 1) { const t = int(r, 1, 9), kg = int(r, 1, 9) * 100; return conv(`${t} t ${kg} kg = ? kg`, t * 1000 + kg, "kg", "1 t = 1.000 kg", `${t} t = ${fmt(t * 1000)} kg, plus ${kg} kg = ${fmt(t * 1000 + kg)} kg`); }
    const g = int(r, 2, 12) * 1000; return conv(`${fmt(g)} g = ? kg`, g / 1000, "kg", "1.000 g = 1 kg", `${fmt(g)} g = ${g / 1000} kg`);
  });
  comp("ma.geld", "ma.groessen", "Geld", (r) => {
    const k = int(r, 0, 2);
    if (k === 0) { const e = int(r, 1, 30), c = int(r, 1, 99); return conv(`${e},${String(c).padStart(2, "0")} € = ? ct`, e * 100 + c, "ct", "1 € = 100 ct", `${e} € = ${e * 100} ct, plus ${c} ct = ${e * 100 + c} ct`); }
    if (k === 1) {
      const p1 = int(r, 120, 1890) / 100, p2 = int(r, 120, 1890) / 100, sum = Math.round((p1 + p2) * 100) / 100;
      return conv(`Ein Buch kostet ${fmtMoney(p1)} €, ein Spiel ${fmtMoney(p2)} €. Wie viel kostet beides zusammen?`, sum, "€", "Rechne erst die Euro, dann die Cent. 100 ct sind 1 €.", `${fmtMoney(p1)} € + ${fmtMoney(p2)} € = ${fmtMoney(sum)} €`, { dec: true, money: true });
    }
    const pay = pick(r, [10, 20, 50]), price = int(r, 150, pay * 100 - 50) / 100, back = Math.round((pay - price) * 100) / 100;
    return conv(`Du kaufst etwas für ${fmtMoney(price)} € und bezahlst mit ${pay} €. Wie viel bekommst du zurück?`, back, "€", "Rechne vom Preis aus bis zum Schein weiter (Ergänzen).", `${pay},00 € − ${fmtMoney(price)} € = ${fmtMoney(back)} €`, { dec: true, money: true });
  });
  const hm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  comp("ma.zeit", "ma.groessen", "Zeit", (r) => {
    const k = int(r, 0, 3);
    if (k === 0) { const h = int(r, 1, 4), m = int(r, 5, 55); return conv(`${h} h ${m} min = ? min`, h * 60 + m, "min", "1 h = 60 min", `${h} · 60 min = ${h * 60} min, plus ${m} min = ${h * 60 + m} min`); }
    if (k === 1) { const min = int(r, 2, 9); return conv(`${min} min = ? s`, min * 60, "s", "1 min = 60 s", `${min} · 60 s = ${min * 60} s`); }
    if (k === 2) {
      const s = int(r, 7 * 12, 15 * 12) * 5, d = int(r, 7, 30) * 5, e = s + d;
      return conv(`Von ${hm(s)} Uhr bis ${hm(e)} Uhr. Wie viele Minuten sind das?`, d, "min", "Rechne erst bis zur vollen Stunde, dann weiter.", `Von ${hm(s)} bis ${hm(e)} sind es ${d} Minuten.`);
    }
    const s = int(r, 13 * 12, 18 * 12) * 5, d = int(r, 9, 30) * 5, e = s + d;
    const opts = [...new Set([hm(e), hm(e + 10), hm(e - 10), hm(s + d + 60)])];
    return { type: "choice", q: `Der Film beginnt um ${hm(s)} Uhr und dauert ${d >= 60 ? `${Math.floor(d / 60)} h ${d % 60} min` : d + " min"}. Wann endet er?`, opts: opts.map((o) => o + " Uhr"), ans: 0,
      tip: "Erst die vollen Stunden dazu, dann die Minuten.", explain: `${hm(s)} Uhr + ${d} min = ${hm(e)} Uhr` };
  });
  comp("ma.hohl", "ma.groessen", "Liter und Milliliter", (r) => {
    const k = int(r, 0, 1);
    if (k === 0) { const l = int(r, 1, 9), ml = int(r, 1, 9) * 100 + pick(r, [0, 50]); return conv(`${l} l ${ml} ml = ? ml`, l * 1000 + ml, "ml", "1 l = 1.000 ml", `${l} l = ${fmt(l * 1000)} ml, plus ${ml} ml = ${fmt(l * 1000 + ml)} ml`); }
    const n = pick(r, [4, 5, 8, 10]), each = 1000 / n * int(r, 1, 1);
    return conv(`Eine 1-Liter-Flasche wird gleichmäßig auf ${n} Becher verteilt. Wie viel Milliliter kommen in jeden Becher?`, each, "ml", "1 l = 1.000 ml. Teile 1.000 durch die Zahl der Becher.", `1.000 ml : ${n} = ${each} ml`);
  });
  comp("ma.sach", "ma.groessen", "Sachaufgaben", (r) => {
    const k = int(r, 0, 3);
    if (k === 0) { const kids = int(r, 18, 28), price = int(r, 4, 12), bus = int(r, 80, 240); const ans = kids * price + bus; return { type: "num", q: `${kids} Kinder fahren in den Zoo. Der Eintritt kostet ${price} € pro Kind. Der Bus kostet ${bus} €. Wie viel kostet der Ausflug zusammen?`, ans, unit: "€", fmt: true, tip: "Erst den Eintritt für alle Kinder ausrechnen, dann den Bus dazu.", explain: `${kids} · ${price} € = ${kids * price} €, plus ${bus} € = ${ans} €` }; }
    if (k === 1) { const packs = int(r, 3, 9), per = pick(r, [6, 8, 12]), eat = int(r, 2, per * packs - 5); const ans = packs * per - eat; return { type: "num", q: `Lena kauft ${packs} Packungen mit je ${per} Muffins. ${eat} Muffins werden gegessen. Wie viele sind noch übrig?`, ans, unit: "Muffins", tip: "Wie viele Muffins sind es insgesamt? Dann die gegessenen abziehen.", explain: `${packs} · ${per} = ${packs * per}, minus ${eat} = ${ans}` }; }
    if (k === 2) { const total = int(r, 4, 12) * 12, per = pick(r, [4, 6, 12]); const ans = total / per; return { type: "num", q: `Für das Schulfest werden ${total} Würstchen gekauft. In eine Packung passen ${per} Würstchen. Wie viele Packungen sind das?`, ans, unit: "Packungen", tip: "Geteilt-Aufgabe: Wie oft passt die Packungsgröße in die Gesamtzahl?", explain: `${total} : ${per} = ${ans}` }; }
    const km = int(r, 12, 45), days = int(r, 3, 6); const ans = km * days * 2; return { type: "num", q: `Papa fährt jeden Tag ${km} km zur Arbeit und wieder zurück nach Hause. Wie viele Kilometer sind das an ${days} Tagen?`, ans, unit: "km", tip: "Hin und zurück ist doppelt so weit.", explain: `${km} km · 2 = ${km * 2} km pro Tag, mal ${days} = ${ans} km` };
  });

  // Muster und Strukturen
  comp("ma.folge", "ma.muster", "Zahlenfolgen", (r, lv) => {
    const k = int(r, 0, lv <= 1 ? 1 : 3);
    let seq, rule;
    if (k === 0) { const s = int(r, 10, 500), d = pick(r, [25, 50, 125, 250, 300, 1000]); seq = [0, 1, 2, 3, 4, 5].map((i) => s + i * d); rule = `immer + ${fmt(d)}`; }
    else if (k === 1) { const d = pick(r, [25, 75, 150, 500]), s = int(r, 6, 20) * d; seq = [0, 1, 2, 3, 4, 5].map((i) => s - i * d); rule = `immer − ${fmt(d)}`; }
    else if (k === 2) { const s = int(r, 2, 9); seq = [0, 1, 2, 3, 4, 5].map((i) => s * 2 ** i); rule = "immer · 2 (verdoppeln)"; }
    else { const a = int(r, 3, 9), b = int(r, 1, 4), s = int(r, 10, 60); seq = [s]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? a : -b)); rule = `abwechselnd + ${a} und − ${b}`; }
    return { type: "num", q: `Wie geht die Folge weiter? ${seq.slice(0, 5).map(fmt).join(", ")}, …`, ans: seq[5], seq, fmt: true,
      tip: "Was passiert von einer Zahl zur nächsten? Rechne die Unterschiede aus.", explain: `Regel: ${rule}. Die nächste Zahl ist ${fmt(seq[5])}.` };
  });
  comp("ma.mauer", "ma.muster", "Zahlenmauern", (r, lv) => {
    const b = [int(r, 5, lv <= 1 ? 40 : 300), int(r, 5, lv <= 1 ? 40 : 300), int(r, 5, lv <= 1 ? 40 : 300)];
    const m = [b[0] + b[1], b[1] + b[2]], top = m[0] + m[1];
    const k = int(r, 0, 1);
    if (k === 0) return { type: "num", q: `Zahlenmauer: Unten stehen ${b.join(", ")}. Jeder Stein ist die Summe der zwei Steine darunter. Welche Zahl steht ganz oben?`, ans: top, wall: { b, m, top, hide: "top" }, tip: "Erst die mittlere Reihe ausrechnen, dann oben.", explain: `${b[0]} + ${b[1]} = ${m[0]}, ${b[1]} + ${b[2]} = ${m[1]}, ${m[0]} + ${m[1]} = ${top}` };
    return { type: "num", q: `Zahlenmauer: Oben steht ${top}, in der Mitte ${m[0]} und ?. Unten stehen ${b.join(", ")}. Welche Zahl fehlt in der Mitte?`, ans: m[1], wall: { b, m, top, hide: "m1" }, tip: "Rechne von oben: oben minus der bekannte Mittelstein, oder unten die zwei rechten Steine plus.", explain: `${top} − ${m[0]} = ${m[1]} (oder ${b[1]} + ${b[2]} = ${m[1]})` };
  });

  const COMP = Object.fromEntries(COMPS.map((c) => [c.id, c]));

  /* ================= Deutsch: Aufgaben aus der Bank (kompass-data.js) ================= */
  // Die Bank liefert pro Unterkompetenz eine Liste fertiger Aufgaben.
  function attachBank(bank) {
    for (const [id, def] of Object.entries(bank)) {
      if (COMP[id]) continue;
      const c = { id, area: def.area, name: def.name, list: def.items, solo: !!def.solo, passage: def.passage || null, source: def.source || "" };
      COMPS.push(c);
      COMP[id] = c;
    }
  }

  // Generator von außen anmelden (Geometrie): gen(r, lv) liefert eine Aufgabe
  function attachGen(id, area, name, gen) {
    if (COMP[id]) return;
    const c = { id, area, name, gen };
    COMPS.push(c); COMP[id] = c;
  }
  // Zusätzliche Aufgaben an bestehende Deutsch-Bänke anhängen (Schlüssel ohne "de.")
  function extendBank(extra) {
    for (const [k, items] of Object.entries(extra || {})) { const c = COMP["de." + k]; if (c && c.list && !c.extended) { c.list.push(...items); c.extended = true; } }
  }

  // Eine Aufgabe zu einer Unterkompetenz. seed bestimmt die Aufgabe eindeutig.
  function task(compId, seed, lv) {
    const c = COMP[compId];
    if (!c) return null;
    const r = rng(seed);
    let t;
    if (c.gen) { for (let k = 0; k < 8 && !t; k++) t = c.gen(k ? rng(seed + k * 7919) : r, lv || 2); if (!t) throw new Error("Aufgabe nicht erzeugt: " + compId + " " + seed); }
    else { const i = seed % c.list.length; t = Object.assign({}, c.list[i]); t.idx = i; }
    if (c.passage) t.passage = c.passage;
    if (c.source) t.source = c.source;
    t.comp = compId;
    t.key = compId + ":" + seed;
    t.seed = seed;
    if ((t.type === "choice" || t.type === "multi") && !t.fixed) {
      // Antworten mischen, richtige Positionen mitführen
      const order = shuffled(rng(seed + 7), t.opts.map((_, i) => i));
      const ans = t.type === "choice" ? [t.ans] : t.ans;
      t.opts = order.map((i) => t.opts[i]);
      if (t.figs) t.figs = order.map((i) => t.figs[i]);
      const na = order.map((i, j) => (ans.includes(i) ? j : -1)).filter((j) => j >= 0);
      t.ans = t.type === "choice" ? na[0] : na;
    }
    return t;
  }

  // Leseeinheit: alle Fragen zu einem Text der Reihe nach
  const unitTasks = (compId) => { const c = COMP[compId]; return c ? c.list.map((_, i) => task(compId, i)) : []; };

  /* ================= Auswertung ================= */
  // gibt { ok, partial } zurück
  function check(t, given) {
    if (t.type === "num") {
      const v = parseNum(given);
      return { ok: isFinite(v) && Math.abs(v - t.ans) < 0.005 };
    }
    if (t.type === "choice") return { ok: given === t.ans };
    if (t.type === "multi" || t.type === "pick") {
      const g = [...new Set(given || [])].sort((a, b) => a - b), a = t.ans.slice().sort((x, y) => x - y);
      return { ok: g.length === a.length && g.every((x, i) => x === a[i]) };
    }
    if (t.type === "order") return { ok: Array.isArray(given) && given.join("|") === t.items.join("|") };
    // verbinden: je Zeile die Menge der gewählten Antworten (kann auch leer sein)
    if (t.type === "match") {
      const g = given || [];
      return { ok: t.left.every((_, i) => { const a = (g[i] || []).slice().sort((x, y) => x - y).join(), b = t.ans[i].slice().sort((x, y) => x - y).join(); return a === b; }) };
    }
    // Raster antippen: Menge der Kästchen "x,y" (oder eigene Prüffunktion, z. B. Würfelnetz)
    if (t.type === "grid") {
      const g = [...new Set(given || [])];
      if (t.verify) return { ok: !!t.verify(g) };
      const a = t.ans.map((c) => c.join(","));
      return { ok: g.length === a.length && a.every((x) => g.includes(x)) };
    }
    // Trennstriche zwischen Wörtern: Menge der Lücken (Lücke i liegt hinter Wort i)
    if (t.type === "cut") { const g = [...new Set(given || [])].sort((x, y) => x - y).join(), a = t.ans.slice().sort((x, y) => x - y).join(); return { ok: g === a }; }
    // Kurzantwort: das Kind vergleicht selbst mit der Musterlösung (true/false)
    if (t.type === "self") return { ok: given === true };
    if (t.type === "tf") return { ok: Array.isArray(given) && t.rows.every((row, i) => given[i] === row.ok) };
    // mehrere Zahlenfelder (z. B. Nachbar nach unten / nach oben, Stellenwerttafel Ziffer für Ziffer)
    if (t.type === "nums") {
      const g = given || [];
      return { ok: t.fields.every((f, i) => { const v = parseNum(g[i]); return isFinite(v) && Math.abs(v - f.ans) < 0.005; }) };
    }
    if (t.type === "write" && t.words) {
      // Zahlwörter: Groß/klein, Leerzeichen, Bindestriche egal; ß = ss
      const nw = (x) => String(x || "").toLowerCase().replace(/ß/g, "ss").replace(/[\s.\-]/g, "");
      return { ok: t.ans.some((a) => nw(a) === nw(given)) };
    }
    if (t.type === "write") {
      const g = String(given || "").trim().replace(/\s+/g, " ");
      // streng: genau so (Groß/klein zählt); sonst Groß/klein am Wortanfang egal
      const ok = t.ans.some((a) => (t.strict ? g === a : g.toLowerCase() === a.toLowerCase()));
      return { ok, caseOnly: !ok && t.ans.some((a) => g.toLowerCase() === a.toLowerCase()) };
    }
    return { ok: false };
  }
  // Lösung als Text
  function solution(t) {
    if (t.type === "num") return (t.money ? fmtMoney(t.ans) : t.fmt ? fmt(t.ans) : String(t.ans).replace(".", ",")) + (t.unit ? " " + t.unit : "");
    if (t.type === "choice") return t.opts[t.ans];
    if (t.type === "multi") return t.ans.map((i) => t.opts[i]).join(", ");
    if (t.type === "pick") return t.ans.map((i) => t.tokens[i]).join(", ");
    if (t.type === "order") return t.items.join(" → ");
    if (t.type === "match") return t.left.map((l, i) => `${l} ${t.ans[i].length ? t.ans[i].map((j) => t.right[j]).join(" / ") : "(nichts)"}`).join(" · ");
    if (t.type === "nums") return t.digit ? t.fields.map((f) => f.ans).join(" ") : t.fields.map((f) => `${f.label}: ${fmt(f.ans)}`).join(" · ");
    if (t.type === "grid") return t.solText || "siehe Markierung";
    if (t.type === "cut") return t.tokens.map((w, i) => w + (t.ans.includes(i) ? " |" : "")).join(" ");
    if (t.type === "self") return t.model;
    if (t.type === "tf") return t.rows.map((x) => `${x.s}: ${x.ok ? "richtig" : "falsch"}`).join(" · ");
    if (t.type === "write") return t.ans[0];
    return "";
  }

  /* ================= Fortschritt je Unterkompetenz ================= */
  // recent: letzte Ergebnisse (1/0), höchstens 10. Sterne gehen nicht wieder verloren.
  function starsFor(recent) {
    const n = recent.length, ok = recent.filter(Boolean).length, acc = n ? ok / n : 0;
    if (n >= 10 && acc >= 0.9) return 3;
    if (n >= 8 && acc >= 0.75) return 2;
    if (n >= 4 && acc >= 0.6) return 1;
    return 0;
  }
  // Gewicht für die Auswahl: wenig Sterne, zuletzt falsch, noch nie geübt -> öfter
  function weight(st) {
    if (!st || !st.n) return 4;
    const last = st.recent && st.recent.length ? st.recent[st.recent.length - 1] : 1;
    return 1 + (3 - (st.stars || 0)) * 1.5 + (last ? 0 : 3);
  }
  // Schwerpunkte nach der Mathe-LZK vom 22.10.2026 (Zahlraum): kommen etwas öfter dran
  const FOCUS = new Set(["ma.nachbarstelle", "ma.nachbarwahl", "ma.strahllesen", "ma.plaettchen", "ma.tafelwort"]);
  // n Aufgaben aus den erlaubten Unterkompetenzen, schwache öfter; seeds fortlaufend
  function buildRound(compIds, n, stats, seed, lv) {
    const r = rng(seed);
    const ids = compIds.filter((id) => COMP[id]);
    const out = [], used = {};
    for (let i = 0; i < n && ids.length; i++) {
      const w = ids.map((id) => (weight(stats[id]) * (FOCUS.has(id) ? 1.8 : 1)) / (1 + (used[id] || 0) * 1.5));
      const total = w.reduce((a, b) => a + b, 0);
      let x = r() * total, k = 0;
      for (; k < ids.length - 1; k++) { x -= w[k]; if (x <= 0) break; }
      const id = ids[k];
      used[id] = (used[id] || 0) + 1;
      out.push(task(id, Math.floor(r() * 1e9), lv));
    }
    return out;
  }

  /* ================= Zwei-Wochen-Plan ================= */
  // kind: check (Startcheck), mini (eine Etappe), lzk (nur freiwillig), full (3 Etappen), probe-de, probe-ma, mut, warm
  const PLAN = [
    { day: "2026-11-06", kind: "check", title: "Startcheck", text: "Deutsch und Mathe, je 8 Aufgaben. Wir schauen, was du schon kannst." },
    { day: "2026-11-07", kind: "mini", title: "Kurze Etappe", text: "Eine Etappe mit 6 Aufgaben, ca. 8 Minuten." },
    { day: "2026-11-08", kind: "mini", title: "Kurze Etappe", text: "Eine Etappe mit 6 Aufgaben, ca. 8 Minuten." },
    { day: "2026-11-09", kind: "mini", title: "Kurze Etappe", text: "Eine Etappe mit 6 Aufgaben. Morgen ist die LZK, viel Glück!" },
    { day: "2026-11-10", kind: "lzk", title: "LZK-Tag", text: "Heute ist die LZK. Kompass hat Pause. Wenn du magst: eine freiwillige Mut-Runde." },
    { day: "2026-11-11", kind: "full", title: "Training", text: "3 Etappen mit Bewegungspause, ca. 20 Minuten." },
    { day: "2026-11-12", kind: "full", title: "Training", text: "3 Etappen mit Bewegungspause, ca. 20 Minuten." },
    { day: "2026-11-13", kind: "full", title: "Training", text: "3 Etappen mit Bewegungspause, ca. 20 Minuten." },
    { day: "2026-11-14", kind: "full", title: "Training", text: "3 Etappen mit Bewegungspause, ca. 20 Minuten." },
    { day: "2026-11-15", kind: "probe-de", title: "Probe-Kompass Deutsch", text: "Wie der echte Test, in 3 Blöcken mit Pausen." },
    { day: "2026-11-16", kind: "probe-ma", title: "Probe-Kompass Mathe", text: "Wie der echte Test, in 3 Blöcken mit Pausen." },
    { day: "2026-11-17", kind: "mut", title: "Mut-Tag", text: "Nur Lieblingsaufgaben und Test-Tipps. Nichts Neues." },
    { day: "2026-11-18", kind: "warm", title: "Kompass Deutsch", text: "5 Minuten Aufwärmen. Du schaffst das!" },
    { day: "2026-11-19", kind: "warm", title: "Kompass Mathe", text: "5 Minuten Aufwärmen. Du schaffst das!" },
  ];
  const planFor = (day) => PLAN.find((p) => p.day === day) || null;
  // Etappen des Tages: [Bereich-Auswahl, Name]
  function etappen(kind) {
    if (kind === "mini") return [{ name: "Etappe", areas: ["de", "ma"], n: 6 }];
    if (kind === "full") return [{ name: "Deutsch", areas: ["de"], n: 6 }, { name: "Mathe", areas: ["ma"], n: 6 }, { name: "Gemischt", areas: ["de", "ma"], n: 6 }];
    if (kind === "lzk" || kind === "mut") return [{ name: "Mut-Runde", areas: ["de", "ma"], n: 5, easy: true }];
    if (kind === "warm") return [{ name: "Aufwärmen", areas: ["de", "ma"], n: 4, easy: true }];
    // Proben (kommen noch): bis dahin wie ein Training
    return [{ name: "Deutsch", areas: ["de"], n: 6 }, { name: "Mathe", areas: ["ma"], n: 6 }, { name: "Gemischt", areas: ["de", "ma"], n: 6 }];
  }
  // Lesetexte (solo) laufen nur als eigene Leseeinheit, nicht in den gemischten Etappen
  const compsOf = (fach) => COMPS.filter((c) => { const a = AREAS.find((x) => x.id === c.area); return a && a.ready && !c.solo && (!fach || a.fach === fach); }).map((c) => c.id);
  const compsOfArea = (areaId) => COMPS.filter((c) => c.area === areaId).map((c) => c.id);

  const api = { rng, int, pick, shuffled, fmt, fmtMoney, parseNum, words, STELLEN, AREAS, COMPS, COMP, attachBank, attachGen, extendBank, task, unitTasks, check, solution, starsFor, weight, buildRound, PLAN, planFor, etappen, compsOf, compsOfArea };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DEKompass = api;
})(typeof self !== "undefined" ? self : this);
