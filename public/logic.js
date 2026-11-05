// Reine Logik ohne Oberfläche: Schreibweise prüfen, Note, gewichtete Auswahl.
// Läuft im Browser und in Node (siehe tools/test-logic.mjs).
(function (root) {
  "use strict";

  // Umlaute, ß und ae/oe/ue gelten als gleich; Groß/Klein, Leer- und Bindestriche egal.
  function norm(s) {
    return String(s)
      .toLowerCase()
      .replace(/ß/g, "ss")
      .replace(/ä|ae/g, "a")
      .replace(/ö|oe/g, "o")
      .replace(/ü|ue/g, "u")
      .replace(/[^a-z0-9]/g, "");
  }

  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  // Rechtschreibung zählt in der LZK nicht, der Begriff muss nur erkennbar sein.
  // So viele Buchstaben dürfen je nach Wortlänge abweichen.
  const tolerance = (len) => (len < 4 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3);

  // Lautschlüssel: Schreibweisen, die gleich klingen, werden gleich ("Reien" = "Rhein", "Schweitz" = "Schweiz").
  function sound(s) {
    return norm(s)
      .replace(/ph/g, "f").replace(/th/g, "t").replace(/rh/g, "r").replace(/dt/g, "t")
      .replace(/chs|cks|x/g, "ks").replace(/ck/g, "k").replace(/qu/g, "kw")
      .replace(/tz/g, "z").replace(/z/g, "ts").replace(/v/g, "f").replace(/y/g, "i")
      .replace(/c(?!h)/g, "k")
      .replace(/([aeiou])h/g, "$1")
      .replace(/ie/g, "i").replace(/ey|ay|ai/g, "ei")
      .replace(/(.)\1+/g, "$1")
      .replace(/d(?=\d|$)/g, "t").replace(/g(?=\d|$)/g, "k").replace(/b(?=\d|$)/g, "p");
  }

  // names[0] ist die richtige Schreibweise, der Rest sind erlaubte Varianten.
  // others: Namen anderer Begriffe; ein Tippfehler zählt nur, wenn er keinem anderen Begriff näher ist.
  // kind: exact | case | spelling (Umlaut/Bindestrich) | typo (kleiner Schreibfehler, gilt als richtig) | wrong | empty
  function judge(input, names, others) {
    const raw = String(input || "").trim();
    if (!raw) return { ok: false, kind: "empty", canonical: names[0] };
    const n = norm(raw);
    for (const name of names) {
      if (norm(name) === n) {
        const kind = raw === name ? "exact" : raw.toLowerCase() === name.toLowerCase() ? "case" : "spelling";
        return { ok: true, kind, canonical: name };
      }
    }
    // klingt gleich -> erkannt (wenn kein anderer Begriff genauso klingt)
    const sn = sound(raw), oth = others || [];
    const sameSound = names.find((name) => sound(name) === sn);
    if (sameSound && !oth.some((o) => sound(o) === sn)) return { ok: true, kind: "typo", canonical: sameSound };
    // Abstand: das Kleinere aus Buchstaben- und Lautvergleich (Laut einen Schritt strenger,
    // damit kurze Wörter wie "Main" nicht als "Rhein" durchgehen)
    const dist = (name) => Math.min(lev(norm(name), n), lev(sound(name), sn) + 1);
    let best = null, bestD = Infinity;
    for (const name of names) {
      const d = dist(name);
      if (d < bestD) { bestD = d; best = name; }
    }
    // ein Tippfehler zählt nur, wenn kein anderer Begriff genauso nah oder näher ist
    const nearOther = oth.some((o) => dist(o) <= bestD);
    if (best && bestD <= tolerance(norm(best).length) && !nearOther) return { ok: true, kind: "typo", canonical: best };
    return { ok: false, kind: "wrong", canonical: names[0] };
  }

  // Mehrere Antworten in einer Zeile, z. B. "Nordsee und Ostsee" (Reihenfolge egal).
  function judgeAll(input, required) {
    const raw = String(input || "").trim();
    if (!raw) return { ok: false, kind: "empty", canonical: required.join(" und "), found: [], missing: required.slice() };
    const tokens = raw.split(/\s*(?:,|;|\/|&|\+|\bund\b|\s)\s*/i).filter(Boolean);
    const found = [], missing = [];
    let typo = false;
    for (const req of required) {
      const hit = tokens.map((t) => judge(t, [req], required.filter((r) => r !== req))).find((j) => j.ok);
      if (hit) { found.push(req); if (hit.kind !== "exact") typo = true; } else missing.push(req);
    }
    const ok = missing.length === 0;
    return { ok, kind: ok ? (typo ? "typo" : "exact") : found.length ? "partial" : "wrong", canonical: required.join(" und "), found, missing };
  }

  // Mehrere Felder, je eine Antwort, Reihenfolge egal (wie bei ANTON). Jedes Feld wird für sich bewertet.
  // Feld: { ok, kind: exact | case | spelling | typo | wrong | dup (schon in einem anderen Feld) | empty, canonical }
  function judgeEach(inputs, required, others) {
    const left = required.slice();
    const fields = inputs.map((v) => (String(v || "").trim() ? null : { ok: false, kind: "empty" }));
    // erst genaue Treffer, dann kleine Schreibfehler (damit ein Tippfehler keinem anderen Feld die Antwort wegnimmt)
    for (const strict of [true, false]) {
      inputs.forEach((v, k) => {
        if (fields[k]) return;
        for (const r of left) {
          const j = judge(v, [r], required.filter((x) => x !== r).concat(others || []));
          if (j.ok && (!strict || j.kind !== "typo")) { fields[k] = { ok: true, kind: j.kind, canonical: r }; left.splice(left.indexOf(r), 1); break; }
        }
      });
    }
    inputs.forEach((v, k) => {
      if (fields[k]) return;
      const dup = required.some((r) => !left.includes(r) && judge(v, [r]).ok);
      fields[k] = { ok: false, kind: dup ? "dup" : "wrong" };
    });
    return { ok: fields.every((f) => f.ok), fields, missing: left };
  }
  // "Nordsee und Ostsee" in einem Feld -> ["Nordsee", "Ostsee"]. An Leerzeichen nur trennen,
  // wenn jedes Wort für sich eine der Antworten ist ("Schwarzes Meer" bleibt zusammen).
  function splitAnswers(text, required) {
    const raw = String(text || "").trim();
    let parts = raw.split(/\s*(?:,|;|\/|&|\+|\bund\b)\s*/i).filter(Boolean);
    if (parts.length === 1 && required.length > 1) {
      const words = raw.split(/\s+/);
      if (words.length > 1 && words.length <= required.length && words.every((w) => required.some((r) => judge(w, [r]).ok))) parts = words;
    }
    return parts;
  }

  // Vergleichsbegriffe für eine Allgemein-Frage: die anderen Auswahlantworten, in einzelne Antworten zerlegt.
  // So zählt ein Schreibfehler nur, wenn er nicht genauso gut eine falsche Auswahlantwort sein könnte.
  function genOthers(g) {
    const right = (g.write && (g.write.answers || g.write.all)) || [];
    const isRight = (x) => right.some((r) => norm(r) === norm(x));
    const out = [];
    (g.options || []).forEach((o) => String(o).split(/\s*(?:,|\bund\b)\s*/).filter(Boolean).forEach((x) => { if (!isRight(x) && !out.includes(x)) out.push(x); }));
    return out;
  }

  // "84", "84 Mio.", "84 Millionen", "84.000.000" -> in Millionen
  function judgeNumber(input, accepted, show) {
    const raw = String(input || "").trim();
    if (!raw) return { ok: false, kind: "empty", canonical: show };
    // Tausenderpunkte weg, Komma als Dezimalzeichen ("84,7 Mio." oder "84.700.000")
    const m = /^(\d+(?:[.,]\d+)?)\s*(mio\.?|mill\.?|millionen|m)?$/i.exec(raw.replace(/[.\s](?=\d{3}(\D|$))/g, ""));
    if (m) {
      let v = Number(m[1].replace(",", "."));
      if (v >= 1e6) v = Math.round(v / 1e5) / 10;
      if (accepted.some((a) => Math.abs(a - v) < 0.05)) return { ok: true, kind: "exact", canonical: show };
    }
    return { ok: false, kind: "wrong", canonical: show };
  }

  // Grobe Orientierung, nicht die Note aus der Schule.
  function gradeFor(pct) {
    if (pct >= 90) return 1;
    if (pct >= 75) return 2;
    if (pct >= 60) return 3;
    if (pct >= 45) return 4;
    if (pct >= 25) return 5;
    return 6;
  }

  // n verschiedene Einträge, schwer gewichtete bevorzugt. rnd() liefert [0,1).
  function sample(list, n, weight, rnd) {
    rnd = rnd || Math.random;
    const pool = list.map((x) => ({ x, w: Math.max(0.01, weight(x)) }));
    const out = [];
    while (out.length < n && pool.length) {
      const total = pool.reduce((a, p) => a + p.w, 0);
      let r = rnd() * total, i = 0;
      for (; i < pool.length - 1; i++) {
        r -= pool[i].w;
        if (r <= 0) break;
      }
      out.push(pool[i].x);
      pool.splice(i, 1);
    }
    return out;
  }

  function shuffle(a, rnd) {
    rnd = rnd || Math.random;
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Vergleicht Eingabe und richtige Schreibweise Buchstabe für Buchstabe (längste gemeinsame Folge).
  // mine: [Zeichen, stimmt?] der Eingabe (falsch = überflüssig), right: [Zeichen, stimmt?] (falsch = fehlt/anders).
  function diffMark(input, correct) {
    const a = [...String(input || "").trim()], b = [...String(correct)];
    const A = a.map((c) => c.toLowerCase()), B = b.map((c) => c.toLowerCase());
    const m = A.length, n = B.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const okA = new Array(m).fill(false), okB = new Array(n).fill(false);
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (A[i] === B[j]) { okA[i] = okB[j] = true; i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return { mine: a.map((c, k) => [c, okA[k]]), right: b.map((c, k) => [c, okB[k]]) };
  }

  // Aus mehreren richtigen Antworten die, die der Eingabe am ähnlichsten ist.
  function closest(input, names) {
    const n = norm(input);
    return names.slice().sort((x, y) => lev(norm(x), n) - lev(norm(y), n))[0];
  }

  const api = { genOthers, sound, norm, lev, judge, judgeAll, judgeEach, splitAnswers, judgeNumber, gradeFor, sample, shuffle, diffMark, closest, tolerance };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DELogic = api;
})(typeof self !== "undefined" ? self : this);
