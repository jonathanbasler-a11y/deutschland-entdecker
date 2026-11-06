// Kompass 4 Mathe: Raum und Form. Figuren werden als SVG gezeichnet, alle Lösungen werden gerechnet (nicht abgeschrieben).
// Würfelnetze: ein virtueller Würfel rollt über das Netz; gültig, wenn jede der 6 Seiten genau einmal unten liegt.
(function (root) {
  "use strict";
  const K = typeof module !== "undefined" && module.exports ? require("./kompass-logic.js") : root.DEKompass;
  const { int, pick, shuffled } = K;

  const C = { bg: "#ffffff", grid: "#cdd6e3", line: "#16304f", a: "#8fb8ff", b: "#ffc27a", ok: "#7bd88f", top: "#eaf1ff", left: "#9db8e8", right: "#6f93d0" };
  const wrap = (w, h, inner, label) => `<svg class="geo" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label || "Figur"}"><rect width="${w}" height="${h}" fill="${C.bg}"/>${inner}</svg>`;
  const key = (x, y) => x + "," + y;

  /* ================= Kästchenfiguren ================= */
  const norm = (cells) => { const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1])); return cells.map(([x, y]) => [x - mx, y - my]); };
  const dims = (cells) => ({ w: Math.max(...cells.map((c) => c[0])) + 1, h: Math.max(...cells.map((c) => c[1])) + 1 });
  function hasHole(cells) {
    const set = new Set(cells.map((c) => key(...c))), { w, h } = dims(cells);
    const seen = new Set(), st = [];
    for (let x = -1; x <= w; x++) for (let y = -1; y <= h; y++) if (x === -1 || y === -1 || x === w || y === h) st.push([x, y]);
    while (st.length) {
      const [x, y] = st.pop(), k = key(x, y);
      if (seen.has(k) || set.has(k) || x < -1 || y < -1 || x > w || y > h) continue;
      seen.add(k);
      st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (!set.has(key(x, y)) && !seen.has(key(x, y))) return true;
    return false;
  }
  // zusammenhängende Figur aus n Kästchen innerhalb von w x h (ohne Loch)
  function grow(r, n, w, h) {
    for (let tries = 0; tries < 200; tries++) {
      const cells = [[int(r, 0, w - 1), int(r, 0, h - 1)]], set = new Set([key(...cells[0])]);
      let guard = 0;
      while (cells.length < n && guard++ < 500) {
        const [x, y] = pick(r, cells), d = pick(r, [[1, 0], [-1, 0], [0, 1], [0, -1]]), nx = x + d[0], ny = y + d[1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || set.has(key(nx, ny))) continue;
        cells.push([nx, ny]); set.add(key(nx, ny));
      }
      if (cells.length === n && !hasHole(cells)) return norm(cells);
    }
    return norm(Array.from({ length: n }, (_, i) => [i % w, Math.floor(i / w)]));
  }
  function perimeter(cells) {
    const set = new Set(cells.map((c) => key(...c)));
    let p = 0;
    for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!set.has(key(x + dx, y + dy))) p++;
    return p;
  }
  // Kästchen mit Gitter zeichnen (Fragment). Rand dick, Kästchen dünn.
  function cellsInner(cells, cols, rows, cell, ox, oy, fill) {
    const set = new Set(cells.map((c) => key(...c)));
    let s = "";
    for (let i = 0; i <= cols; i++) s += `<line x1="${ox + i * cell}" y1="${oy}" x2="${ox + i * cell}" y2="${oy + rows * cell}" stroke="${C.grid}" stroke-width="1"/>`;
    for (let j = 0; j <= rows; j++) s += `<line x1="${ox}" y1="${oy + j * cell}" x2="${ox + cols * cell}" y2="${oy + j * cell}" stroke="${C.grid}" stroke-width="1"/>`;
    for (const [x, y] of cells) s += `<rect x="${ox + x * cell}" y="${oy + y * cell}" width="${cell}" height="${cell}" fill="${fill || C.a}" stroke="#5b7fb8" stroke-width="1"/>`;
    for (const [x, y] of cells) {
      const X = ox + x * cell, Y = oy + y * cell;
      if (!set.has(key(x, y - 1))) s += `<line x1="${X}" y1="${Y}" x2="${X + cell}" y2="${Y}" stroke="${C.line}" stroke-width="3" stroke-linecap="square"/>`;
      if (!set.has(key(x, y + 1))) s += `<line x1="${X}" y1="${Y + cell}" x2="${X + cell}" y2="${Y + cell}" stroke="${C.line}" stroke-width="3" stroke-linecap="square"/>`;
      if (!set.has(key(x - 1, y))) s += `<line x1="${X}" y1="${Y}" x2="${X}" y2="${Y + cell}" stroke="${C.line}" stroke-width="3" stroke-linecap="square"/>`;
      if (!set.has(key(x + 1, y))) s += `<line x1="${X + cell}" y1="${Y}" x2="${X + cell}" y2="${Y + cell}" stroke="${C.line}" stroke-width="3" stroke-linecap="square"/>`;
    }
    return s;
  }
  const polySvg = (cells, cols, rows, cell, label) => wrap(cols * cell + 8, rows * cell + 8, cellsInner(cells, cols, rows, cell, 4, 4), label);
  // zwei Figuren nebeneinander mit Beschriftung
  function pairSvg(a, b, cols, rows, cell) {
    const W = cols * cell, H = rows * cell + 22, gap = 24;
    const inner = `${cellsInner(a, cols, rows, cell, 6, 4, C.a)}${cellsInner(b, cols, rows, cell, 6 + W + gap, 4, C.b)}
      <text x="${6 + W / 2}" y="${H}" text-anchor="middle" font-size="16" font-weight="700" fill="${C.line}">Figur A</text>
      <text x="${6 + W + gap + W / 2}" y="${H}" text-anchor="middle" font-size="16" font-weight="700" fill="${C.line}">Figur B</text>`;
    return wrap(2 * W + gap + 12, H + 8, inner, "Figur A und Figur B");
  }

  /* ================= Würfelnetze ================= */
  // Virtueller Würfel rollt über die Felder; gültig, wenn alle 6 Seiten genau einmal unten liegen
  function isCubeNet(cells) {
    if (!cells || cells.length !== 6) return false;
    const set = new Set(cells.map((c) => key(...c)));
    if (set.size !== 6) return false;
    const roll = (o, d) => { const [t, b, n, s, e, w] = o; return d === "E" ? [w, e, n, s, t, b] : d === "W" ? [e, w, n, s, b, t] : d === "N" ? [s, n, t, b, e, w] : [n, s, b, t, e, w]; };
    const DIR = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
    const seen = new Set(), bottoms = new Set();
    (function walk(x, y, o) {
      const k = key(x, y);
      if (seen.has(k)) return;
      seen.add(k); bottoms.add(o[1]);
      for (const d of Object.keys(DIR)) { const nx = x + DIR[d][0], ny = y + DIR[d][1]; if (set.has(key(nx, ny))) walk(nx, ny, roll(o, d)); }
    })(cells[0][0], cells[0][1], [0, 1, 2, 3, 4, 5]);
    return seen.size === 6 && bottoms.size === 6;
  }
  function randomNet(r, valid, w = 6, h = 6) {
    for (let i = 0; i < 4000; i++) { const c = grow(r, 6, w, h); if (isCubeNet(c) === valid) return c; }
    return null;
  }
  const sameShape = (a, b) => {
    const canon = (cells) => {
      let best = null;
      let cur = norm(cells);
      for (let f = 0; f < 2; f++) {
        for (let k = 0; k < 4; k++) {
          cur = norm(cur.map(([x, y]) => [-y, x]));
          const s = cur.map((c) => key(...c)).sort().join(";");
          if (best === null || s < best) best = s;
        }
        cur = norm(cur.map(([x, y]) => [-x, y]));
      }
      return best;
    };
    return canon(a) === canon(b);
  };

  /* ================= Würfelgebäude (isometrisch) ================= */
  // h[z][x]: Höhe der Säule; z=0 hinten, z=2 vorne; x=0 links. Blick von vorn-rechts-oben: sichtbar sind Oberseite, Vorderseite (links im Bild), rechte Seite.
  const proj = (x, y, z, s) => [(x - z) * s * 0.866, (x + z) * s * 0.5 - y * s];
  function isoInner(h, s, tx, ty) {
    const cubes = [];
    for (let z = 0; z < h.length; z++) for (let x = 0; x < h[z].length; x++) for (let y = 0; y < h[z][x]; y++) cubes.push([x, y, z]);
    cubes.sort((a, b) => (a[0] + a[2]) - (b[0] + b[2]) || a[1] - b[1]);
    const P = (x, y, z) => { const [a, b] = proj(x, y, z, s); return `${(tx + a).toFixed(1)},${(ty + b).toFixed(1)}`; };
    let out = "";
    for (const [x, y, z] of cubes) {
      out += `<polygon points="${P(x, y + 1, z)} ${P(x + 1, y + 1, z)} ${P(x + 1, y + 1, z + 1)} ${P(x, y + 1, z + 1)}" fill="${C.top}" stroke="${C.line}" stroke-width="1.2" stroke-linejoin="round"/>`;
      out += `<polygon points="${P(x, y, z + 1)} ${P(x + 1, y, z + 1)} ${P(x + 1, y + 1, z + 1)} ${P(x, y + 1, z + 1)}" fill="${C.left}" stroke="${C.line}" stroke-width="1.2" stroke-linejoin="round"/>`;
      out += `<polygon points="${P(x + 1, y, z)} ${P(x + 1, y, z + 1)} ${P(x + 1, y + 1, z + 1)} ${P(x + 1, y + 1, z)}" fill="${C.right}" stroke="${C.line}" stroke-width="1.2" stroke-linejoin="round"/>`;
    }
    return out;
  }
  function isoSvg(h, withArrow, label) {
    const s = 22, W = 6 * 0.866 * s + 16, H = 6 * s + 12 + 8, tx = 3 * 0.866 * s + 8, ty = 3 * s + 6;
    let inner = isoInner(h, s, tx, ty);
    let width = W;
    if (withArrow) {
      width = W + 84;
      inner += `<g stroke="#6b7280" stroke-width="3" fill="none" stroke-linecap="round"><path d="M${W + 76} ${ty + 4} L${W + 14} ${ty + 4}"/><path d="M${W + 14} ${ty + 4} l9 -7 M${W + 14} ${ty + 4} l9 7"/></g><text x="${W + 45}" y="${ty - 8}" text-anchor="middle" font-size="13" fill="#374151" font-weight="700">von rechts</text>`;
    }
    return wrap(width, H, inner, label || "Würfelgebäude");
  }
  const rot = (h) => h[0].map((_, i) => h.map((row) => row[i]).reverse());
  const mirror = (h) => h.map((row) => row.slice().reverse());
  const eq = (a, b) => a.every((row, z) => row.every((v, x) => v === b[z][x]));
  const sameBuilding = (a, b) => { let c = a; for (let k = 0; k < 4; k++) { if (eq(c, b)) return true; c = rot(c); } return false; };
  const total = (h) => h.flat().reduce((a, b) => a + b, 0);
  const colMax = (h, i) => Math.max(...h.map((row) => row[i]));
  // Ansichten als Höhenlisten, von links nach rechts gesehen
  const views = (h) => ({
    front: [0, 1, 2].map((x) => colMax(h, x)),
    right: [2, 1, 0].map((z) => Math.max(...h[z])),
    left: [0, 1, 2].map((z) => Math.max(...h[z])),
    back: [2, 1, 0].map((x) => colMax(h, x)),
  });
  function viewSvg(cols) {
    const c = 22, w = cols.length * c + 8, hh = 3 * c + 8;
    let s = "";
    cols.forEach((n, i) => { for (let j = 0; j < n; j++) s += `<rect x="${4 + i * c}" y="${4 + (3 - 1 - j) * c}" width="${c}" height="${c}" fill="${C.a}" stroke="${C.line}" stroke-width="1.5"/>`; });
    s += `<line x1="2" y1="${hh - 4}" x2="${w - 2}" y2="${hh - 4}" stroke="${C.line}" stroke-width="2"/>`;
    return wrap(w, hh, s, "Ansicht");
  }
  function randomBuilding(r, lo, hi) {
    for (let i = 0; i < 500; i++) {
      const h = [0, 1, 2].map(() => [0, 1, 2].map(() => (r() < 0.2 ? 0 : int(r, 1, 3))));
      const t = total(h);
      if (t >= lo && t <= hi && h.flat().some((v) => v === 3) && h.flat().filter((v) => v === 0).length <= 3) return h;
    }
    return [[1, 3, 2], [0, 2, 3], [2, 1, 1]];
  }
  function baupland(h) { return { head: ["", "links", "mitte", "rechts"], rows: [["hinten", ...h[0]], ["mitte", ...h[1]], ["vorne", ...h[2]]] }; }

  /* ================= Spiegelachsen ================= */
  const SHAPES = [
    { n: "Rechteck", ax: 2, p: "10,30 90,30 90,70 10,70", lv: 1 },
    { n: "Quadrat", ax: 4, p: "25,25 75,25 75,75 25,75", lv: 1 },
    { n: "gleichseitiges Dreieck", ax: 3, p: "50,15 90,84.282 10,84.282", lv: 1 },
    { n: "gleichschenkliges Dreieck", ax: 1, p: "50,10 80,85 20,85", lv: 1 },
    { n: "Raute", ax: 2, p: "50,10 85,50 50,90 15,50", lv: 1 },
    { n: "Parallelogramm", ax: 0, p: "25,30 90,30 75,70 10,70", lv: 2 },
    { n: "Trapez", ax: 1, p: "30,30 70,30 90,75 10,75", lv: 2 },
    { n: "Drachen", ax: 1, p: "50,10 80,40 50,90 20,40", lv: 2 },
    { n: "Stern", ax: 4, p: "50,5 60,40 95,50 60,60 50,95 40,60 5,50 40,40", lv: 2 },
    { n: "Sechseck", ax: 6, p: "50,10 84.641,30 84.641,70 50,90 15.359,70 15.359,30", lv: 2 },
    { n: "Fünfeck", ax: 5, p: "50,10 88.042,37.639 73.511,82.361 26.489,82.361 11.958,37.639", lv: 2 },
    { n: "rechtwinkliges Dreieck", ax: 0, p: "15,15 15,85 90,85", lv: 2 },
  ];
  const shapeSvg = (sh) => wrap(100, 100, `<polygon points="${sh.p}" fill="${C.a}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>`, sh.n);

  /* ================= Aufgaben ================= */
  const reg = (id, name, gen) => K.attachGen(id, "ma.raum", name, gen);
  const LET = "ABCD";

  reg("ma.raum.flaeche", "Fläche zählen", (r, lv) => {
    const n = int(r, 6, lv <= 1 ? 11 : 16), cells = grow(r, n, 6, 5), { w, h } = dims(cells);
    return { type: "num", q: "Wie groß ist die Fläche dieser Figur? Zähle die Kästchen.", unit: "Kästchen", ans: n, fig: polySvg(cells, w, h, 26, "Figur aus Kästchen"),
      tip: "Zähle Reihe für Reihe. Tippe in Gedanken jedes Kästchen an, damit du keines vergisst.", explain: `Die Figur besteht aus ${n} Kästchen.` };
  });
  reg("ma.raum.rand", "Rand messen", (r, lv) => {
    const n = int(r, 5, lv <= 1 ? 8 : 12), cells = grow(r, n, 5, 5), { w, h } = dims(cells), p = perimeter(cells);
    return { type: "num", q: "Jedes Kästchen ist 1 cm lang und 1 cm breit. Wie lang ist der Rand der Figur?", unit: "cm", ans: p, fig: polySvg(cells, w, h, 26, "Figur aus Kästchen"),
      tip: "Gehe mit dem Finger außen um die Figur herum und zähle jede Kästchenseite.", explain: `Der Rand hat ${p} Kästchenseiten, also ${p} cm. Die Fläche hat dagegen ${n} Kästchen.` };
  });
  reg("ma.raum.vergleich", "Flächen vergleichen", (r) => {
    const kind = pick(r, [0, 1, 2]); // 0: A größer, 1: B größer, 2: gleich
    for (let i = 0; i < 300; i++) {
      const a = grow(r, int(r, 5, 9), 4, 4), b = grow(r, int(r, 5, 9), 4, 4);
      const d = a.length - b.length;
      if ((kind === 0 && d >= 1 && d <= 2) || (kind === 1 && d <= -1 && d >= -2) || (kind === 2 && d === 0 && !sameShape(a, b))) {
        return { type: "choice", fixed: true, q: "Vergleiche die Flächen. Zähle die Kästchen.", opts: ["Figur A ist größer", "Figur B ist größer", "Beide sind gleich groß"], ans: kind, fig: pairSvg(a, b, 4, 4, 24),
          tip: "Zähle die Kästchen von Figur A und von Figur B getrennt und vergleiche dann.", explain: `Figur A: ${a.length} Kästchen, Figur B: ${b.length} Kästchen.` };
      }
    }
    const a = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1]], b = [[0, 0], [1, 0], [0, 1]];
    return { type: "choice", fixed: true, q: "Vergleiche die Flächen. Zähle die Kästchen.", opts: ["Figur A ist größer", "Figur B ist größer", "Beide sind gleich groß"], ans: 0, fig: pairSvg(a, b, 4, 4, 24), tip: "Zähle die Kästchen.", explain: "A hat 5, B hat 3 Kästchen." };
  });
  reg("ma.raum.gleichgross", "Flächen gleich groß", (r, lv) => {
    for (let i = 0; i < 300; i++) {
      const n = int(r, 5, 8), a = grow(r, n, 4, 4), b = grow(r, n, 4, 4);
      if (sameShape(a, b)) continue;
      const c = grow(r, n + int(r, 1, 2), 4, 4), d = grow(r, n - int(r, 1, 2), 4, 4);
      const order = shuffled(r, [0, 1, 2, 3]), shapes = [a, b, c, d];
      const figs = order.map((i2) => polySvg(shapes[i2], 4, 4, 16, "Figur"));
      return { type: "multi", fixed: true, q: "Bei welchen Figuren sind die Flächen gleich groß? Es sind zwei. Zähle die Kästchen.", opts: LET.split("").map((l) => "Figur " + l), figs,
        ans: [0, 1].map((x) => order.indexOf(x)).sort((p, q) => p - q), tip: "Zähle bei jeder Figur die Kästchen und schreibe die Zahl daneben.", explain: `Gleich groß sind die Figuren mit ${n} Kästchen. Die anderen haben ${c.length} und ${d.length}.` };
    }
    return null;
  });
  reg("ma.raum.spiegelachse", "Spiegelachsen zählen", (r, lv) => {
    const sh = pick(r, SHAPES.filter((s) => s.lv <= (lv || 2)));
    return { type: "num", q: `Wie viele Spiegelachsen hat diese Figur? (${sh.n})`, ans: sh.ax, fig: shapeSvg(sh),
      tip: "Stell dir vor, du faltest die Figur. Wo passen beide Hälften genau aufeinander? Jede solche Faltlinie ist eine Spiegelachse.",
      explain: `Ein ${sh.n} hat ${sh.ax} Spiegelachse${sh.ax === 1 ? "" : "n"}.` };
  });
  reg("ma.raum.buchstaben", "Symmetrische Buchstaben", (r) => {
    const VERT = "AHIMOTUVWXY", HOR = "BCDEKHIOX", ONLY_H = "BCDEK", NONE = "FGJLNPQRSZ";
    const vert = r() < 0.7;
    const pool = vert ? [...shuffled(r, VERT.split("")).slice(0, 2), ...shuffled(r, [...ONLY_H, ...NONE]).slice(0, 4)] : [...shuffled(r, [...ONLY_H]).slice(0, 2), ...shuffled(r, [...VERT.replace(/[HIOX]/g, "")]).slice(0, 1), ...shuffled(r, NONE.split("")).slice(0, 3)];
    const opts = shuffled(r, pool.filter((c, i) => pool.indexOf(c) === i));
    const set = vert ? VERT : HOR;
    const ans = opts.map((c, i) => (set.includes(c) ? i : -1)).filter((i) => i >= 0);
    if (!ans.length) return null;
    return { type: "multi", fixed: true, q: vert ? "Welche Großbuchstaben haben eine senkrechte Spiegelachse? Tippe alle an." : "Welche Großbuchstaben haben eine waagerechte Spiegelachse? Tippe alle an.", opts, ans,
      tip: vert ? "Falte den Buchstaben im Kopf an einer senkrechten Linie in der Mitte. Passen beide Hälften genau aufeinander?" : "Falte den Buchstaben im Kopf an einer waagerechten Linie in der Mitte. Passen oben und unten genau aufeinander?",
      explain: `${vert ? "Senkrecht" : "Waagerecht"} symmetrisch: ${ans.map((i) => opts[i]).join(", ")}.` };
  });
  reg("ma.raum.spiegeln", "Spiegeln im Gitter", (r, lv) => {
    const cols = 8, rows = 5, half = 4;
    const cells = grow(r, int(r, 4, lv <= 1 ? 5 : 7), half, rows);
    const ans = cells.map(([x, y]) => [cols - 1 - x, y]);
    const sz = 32;
    return { type: "grid", q: "Spiegle die Figur an der gestrichelten Linie. Tippe die Kästchen auf der rechten Seite an.", cols, rows, cell: sz, axis: half, fig: null,
      given: cells, ans, solText: "So sieht das Spiegelbild aus (grün)", solCells: ans,
      tip: "Jedes Kästchen liegt rechts der Linie genauso weit entfernt wie sein Partner links. Beginne mit dem Kästchen, das der Linie am nächsten ist.",
      explain: "Jedes Kästchen liegt rechts genauso weit von der Linie entfernt wie links." };
  });
  reg("ma.raum.netz", "Würfelnetze erkennen", (r) => {
    const nv = int(r, 1, 3), valid = [], invalid = [];
    for (let i = 0; valid.length < nv && i < 30; i++) { const c = randomNet(r, true); if (c && !valid.some((v) => sameShape(v, c))) valid.push(c); }
    for (let i = 0; invalid.length < 4 - nv && i < 30; i++) { const c = randomNet(r, false); if (c && !invalid.some((v) => sameShape(v, c))) invalid.push(c); }
    if (valid.length !== nv || invalid.length !== 4 - nv) return null;
    const all = shuffled(r, [...valid.map((c) => ({ c, ok: true })), ...invalid.map((c) => ({ c, ok: false }))]);
    const figs = all.map((o) => { const d = dims(o.c); return polySvg(o.c, Math.max(d.w, 4), Math.max(d.h, 3), 16, "Figur aus sechs Quadraten"); });
    return { type: "multi", fixed: true, q: "Vier Figuren aus je sechs Quadraten. Welche kann man zu einem Würfel falten? Tippe alle gültigen Würfelnetze an.", opts: LET.split("").map((l) => "Figur " + l), figs,
      ans: all.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0),
      tip: "Falte im Kopf: Vier Quadrate in einer Reihe werden zum Ring um den Würfel. Zwei Quadrate dürfen nie auf dieselbe Seite fallen.",
      explain: `Gültig sind: ${all.map((o, i) => (o.ok ? "Figur " + LET[i] : "")).filter(Boolean).join(", ")}. Bei den anderen würden beim Falten zwei Quadrate aufeinanderliegen.` };
  });
  reg("ma.raum.netzergaenzen", "Würfelnetz ergänzen", (r) => {
    const net = randomNet(r, true, 5, 4) || [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]];
    // zwei Kästchen entfernen, Rest bleibt zusammenhängend
    let given = null, removed = null;
    for (let i = 0; i < 80 && !given; i++) {
      const idx = shuffled(r, [0, 1, 2, 3, 4, 5]).slice(0, 2), rest = net.filter((_, j) => !idx.includes(j));
      const set = new Set(rest.map((c) => key(...c))), seen = new Set(), st = [rest[0]];
      while (st.length) { const [x, y] = st.pop(), k = key(x, y); if (seen.has(k) || !set.has(k)) continue; seen.add(k); st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
      if (seen.size === 4) { given = rest; removed = idx.map((j) => net[j]); }
    }
    if (!given) return null;
    const cols = 8, rows = 7, mx = Math.min(...net.map((c) => c[0])), my = Math.min(...net.map((c) => c[1]));
    const place = (cells) => cells.map(([x, y]) => [x - mx + 2, y - my + 1]);
    const g = place(given), sol = place(removed);
    return { type: "grid", q: "Ergänze zu einem Würfelnetz. Tippe zwei Kästchen an.", cols, rows, cell: 30, axis: null, given: g, ans: sol, solCells: sol, solText: "So geht es (grün): zwei Kästchen ergänzen",
      verify: (sel) => sel.length === 2 && isCubeNet([...g, ...sel.map((s) => s.split(",").map(Number))]),
      tip: "Probiere im Kopf: Wenn du die Figur faltest, darf jede Seite des Würfels nur einmal vorkommen.", explain: "Es gibt oft mehrere Lösungen. Wichtig ist, dass beim Falten keine zwei Quadrate aufeinanderliegen." };
  });
  reg("ma.raum.gebaeude", "Würfelgebäude zählen", (r, lv) => {
    const h = randomBuilding(r, 8, 20), t = total(h), under = h.flat().filter((v) => v > 0).length, kind = int(r, 0, 2);
    const base = { fig: isoSvg(h, false, "Würfelgebäude"), table: baupland(h), tableNote: "Bauplan: In jedem Feld steht, wie viele Würfel dort übereinanderliegen." };
    if (kind === 0) return Object.assign({ type: "num", q: "Aus wie vielen Würfeln besteht das Gebäude? Es ist keiner versteckt.", unit: "Würfel", ans: t,
      tip: "Rechne Zeile für Zeile: Zähle die Zahlen im Bauplan zusammen.", explain: `${h.map((row) => row.join(" + ")).join(" + ")} = ${t} Würfel.` }, base);
    if (kind === 1) return Object.assign({ type: "num", q: "Wie viele Würfel liegen in der untersten Schicht (direkt auf dem Boden)?", unit: "Würfel", ans: under,
      tip: "Auf dem Boden liegt in jedem Feld ein Würfel, wenn dort mindestens eine 1 steht. Zähle die Felder, die nicht 0 sind.", explain: `${under} Felder sind nicht leer, also liegen ${under} Würfel unten.` }, base);
    return Object.assign({ type: "num", q: "Ein Würfel aus 3 · 3 · 3 kleinen Würfeln hat 27 Würfel. Wie viele Würfel fehlen noch?", unit: "Würfel", ans: 27 - t,
      tip: "Zähle erst, wie viele Würfel das Gebäude hat. Dann rechne 27 minus diese Zahl.", explain: `Das Gebäude hat ${t} Würfel. 27 − ${t} = ${27 - t}.` }, base);
  });
  reg("ma.raum.ansicht", "Ansicht von rechts", (r) => {
    for (let i = 0; i < 200; i++) {
      const h = randomBuilding(r, 8, 20), v = views(h), keyOf = (a) => a.join("");
      const four = [v.right, v.front, v.left, v.back];
      if (new Set(four.map(keyOf)).size < 4) continue;
      const order = shuffled(r, [0, 1, 2, 3]);
      return { type: "choice", fixed: true, q: "Welche Ansicht zeigt das Würfelgebäude von rechts? (Der Pfeil zeigt die Blickrichtung.)", opts: LET.split("").map((l) => "Ansicht " + l), figs: order.map((j) => viewSvg(four[j])), ans: order.indexOf(0),
        fig: isoSvg(h, true, "Würfelgebäude mit Pfeil von rechts"),
        tip: "Stell dich rechts neben das Gebäude. Du siehst von jeder Reihe nur die höchste Säule. Vorne ist links im Bild.",
        explain: `Von rechts sieht man (von links nach rechts) die Höhen ${v.right.join(", ")}.` };
    }
    return null;
  });
  reg("ma.raum.gleichesgebaeude", "Gleiches Gebäude finden", (r) => {
    for (let i = 0; i < 300; i++) {
      const ref = randomBuilding(r, 7, 14);
      if (sameBuilding(ref, rot(rot(ref))) && eq(ref, rot(rot(ref)))) continue;
      if ([1, 2, 3].some((k) => { let c = ref; for (let j = 0; j < k; j++) c = rot(c); return eq(c, ref); })) continue; // keine Drehsymmetrie
      let right = ref; for (let j = int(r, 1, 3); j > 0; j--) right = rot(right);
      const d1 = mirror(rot(ref));
      if (sameBuilding(ref, d1)) continue;
      const d2 = ref.map((row) => row.slice()); const zz = int(r, 0, 2), xx = int(r, 0, 2); d2[zz][xx] = d2[zz][xx] >= 3 ? 2 : d2[zz][xx] + 1;
      let d2r = d2; for (let j = int(r, 0, 3); j > 0; j--) d2r = rot(d2r);
      if (sameBuilding(ref, d2r)) continue;
      const order = shuffled(r, [0, 1, 2]), cand = [right, d1, d2r];
      return { type: "choice", fixed: true, q: "Finde das gleiche Gebäude wie im Kasten. Es ist nur gedreht, nicht verändert.", fig: isoSvg(ref, false, "Gebäude im Kasten"),
        opts: ["Gebäude 1", "Gebäude 2", "Gebäude 3"], figs: order.map((j) => isoSvg(cand[j], false, "Gebäude")), ans: order.indexOf(0),
        tip: "Zähle bei jedem Gebäude, wie viele Würfel es hat und wie hoch die höchste Säule ist. Passt etwas nicht, ist es ein anderes Gebäude.",
        explain: "Das richtige Gebäude hat genau dieselben Säulen, nur von einer anderen Seite gesehen. Bei den anderen fehlt ein Würfel, oder es ist gespiegelt." };
    }
    return null;
  });
  const KOERPER = [
    ["Würfel", 8, 12, 6], ["Quader", 8, 12, 6], ["vierseitige Pyramide", 5, 8, 5], ["Dreieckspyramide", 4, 6, 4], ["dreiseitiges Prisma", 6, 9, 5],
  ];
  reg("ma.raum.koerper", "Körper und Formen", (r) => {
    const kind = int(r, 0, 3);
    if (kind === 0) {
      const [n, e, k, f] = pick(r, KOERPER), what = int(r, 0, 2), ans = [e, k, f][what], name = ["Ecken", "Kanten", "Flächen"][what];
      return { type: "num", q: `Wie viele ${name} hat ${n === "Würfel" ? "ein" : n === "Quader" ? "ein" : n.startsWith("Dreieck") ? "eine" : n.startsWith("vier") ? "eine" : "ein"} ${n}?`, ans,
        tip: what === 0 ? "Ecken sind die Punkte, an denen Kanten zusammentreffen." : what === 1 ? "Kanten sind die Linien, an denen zwei Flächen aufeinandertreffen." : "Flächen sind die ebenen Seiten des Körpers.",
        explain: `${n}: ${e} Ecken, ${k} Kanten, ${f} Flächen.` };
    }
    if (kind === 1) {
      const all = ["Würfel", "Quader", "Kugel", "Zylinder", "Pyramide", "Kegel"], roll = ["Kugel", "Zylinder", "Kegel"];
      const opts = shuffled(r, [...shuffled(r, all.filter((x) => !roll.includes(x))).slice(0, 2), ...shuffled(r, roll).slice(0, int(r, 1, 2))]);
      return { type: "multi", fixed: true, q: "Welche Körper können rollen? Tippe alle an.", opts, ans: opts.map((o, i) => (roll.includes(o) ? i : -1)).filter((i) => i >= 0),
        tip: "Ein Körper kann rollen, wenn er eine runde Fläche hat. Körper mit lauter ebenen Flächen kippen nur.", explain: "Rollen können Kugel, Zylinder und Kegel." };
    }
    if (kind === 2) {
      const F = [["Dreieck", 3], ["Viereck", 4], ["Fünfeck", 5], ["Sechseck", 6], ["Kreis", 0], ["Quadrat", 4]], [n, e] = pick(r, F);
      return { type: "num", q: `Wie viele Ecken hat ${n === "Kreis" ? "ein" : n === "Dreieck" || n === "Viereck" || n === "Fünfeck" || n === "Sechseck" ? "ein" : "ein"} ${n}?`, ans: e,
        tip: "Ecken sind die Stellen, wo zwei gerade Seiten zusammenstoßen. Ein Kreis hat keine geraden Seiten.", explain: `${n}: ${e} Ecken.` };
    }
    // Muster mit Formen fortsetzen
    const names = shuffled(r, ["Kreis", "Dreieck", "Quadrat", "Stern"]), per = int(r, 2, 3), seq = [];
    for (let i = 0; i < per * 2 + 1; i++) seq.push(names[i % per]);
    const ans = names[(per * 2 + 1) % per], wrong = names.filter((x) => x !== ans).slice(0, 3);
    return { type: "choice", q: `Setze das Muster fort: ${seq.join(", ")}, …`, opts: [ans, ...wrong], ans: 0, tip: "Suche die Gruppe, die sich wiederholt. Welche Form kommt als Nächstes?", explain: `Es wiederholt sich: ${names.slice(0, per).join(", ")}. Als Nächstes kommt ${ans}.` };
  });

  const api = { isCubeNet, perimeter, hasHole, grow, norm, sameShape, views, rot, mirror, sameBuilding, total, SHAPES, randomNet };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DEKompassGeo = api;
})(typeof self !== "undefined" ? self : this);
