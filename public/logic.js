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

  // Rechtschreibung ist zweitrangig: so viele Tippfehler sind je nach Wortlänge erlaubt.
  const tolerance = (len) => (len < 4 ? 0 : len < 8 ? 1 : len < 12 ? 2 : 3);

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
    let best = null, bestD = Infinity;
    for (const name of names) {
      const d = lev(norm(name), n);
      if (d < bestD) { bestD = d; best = name; }
    }
    const nearOther = (others || []).some((o) => lev(norm(o), n) <= bestD);
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

  // Grobe Orientierung, nicht die Note der Lehrerin.
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

  const api = { norm, lev, judge, judgeAll, judgeNumber, gradeFor, sample, shuffle, diffMark, closest, tolerance };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DELogic = api;
})(typeof self !== "undefined" ? self : this);
