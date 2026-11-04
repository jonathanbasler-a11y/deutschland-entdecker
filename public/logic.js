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

  // names[0] ist die richtige Schreibweise, der Rest sind erlaubte Varianten.
  // kind: exact | case | spelling (richtig, aber Hinweis) | close (knapp daneben) | wrong | empty
  function judge(input, names) {
    const raw = String(input || "").trim();
    if (!raw) return { ok: false, kind: "empty", canonical: names[0] };
    const n = norm(raw);
    for (const name of names) {
      if (norm(name) === n) {
        const kind = raw === name ? "exact" : raw.toLowerCase() === name.toLowerCase() ? "case" : "spelling";
        return { ok: true, kind, canonical: name };
      }
    }
    for (const name of names) {
      const t = norm(name);
      if (t.length >= 5 && lev(t, n) <= 1) return { ok: false, kind: "close", canonical: names[0] };
    }
    return { ok: false, kind: "wrong", canonical: names[0] };
  }

  // "84", "84 Mio.", "84 Millionen", "84.000.000" -> in Millionen
  function judgeNumber(input, accepted, show) {
    const raw = String(input || "").trim();
    if (!raw) return { ok: false, kind: "empty", canonical: show };
    const m = /^(\d+)\s*(mio\.?|mill\.?|millionen|m)?$/i.exec(raw.replace(/[.\s](?=\d{3}(\D|$))/g, ""));
    if (m) {
      let v = Number(m[1]);
      if (v >= 1e6) v = Math.round(v / 1e6);
      if (accepted.includes(v)) return { ok: true, kind: "exact", canonical: show };
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

  const api = { norm, lev, judge, judgeNumber, gradeFor, sample, shuffle };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DELogic = api;
})(typeof self !== "undefined" ? self : this);
