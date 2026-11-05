// Begleiter: eigener Pixel-Hund, Bauprojekte aus Blöcken, Pixel-Bosse, Rennen gegen den eigenen Rekord.
// Alles selbst gezeichnet (Rechtecke auf einem Raster). Reine Hilfsfunktionen laufen auch in Node.
(function (root) {
  "use strict";

  /* ================= Farben ================= */
  const PAL = {
    o: "#3b2412", b: "#c47f3c", B: "#a8672c", l: "#f1c993", e: "#6e4219", k: "#1b1b1b", w: "#ffffff", p: "#ff6f9b",
    r: "#e23b3b", R: "#a82020", g: "#aeb8c2", G: "#6d7884", v: "#7b4bd6", V: "#55309f", y: "#ffd23f", Y: "#c99a00", f: "#ff8a1e",
  };
  const rects = (list, pal) => list.map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${(pal || PAL)[c] || c}"/>`).join("");
  const svg = (w, h, inner, cls, label) => `<svg class="${cls || ""}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${inner}</svg>`;

  /* ================= Hund ================= */
  // Blickrichtung rechts, Raster 23 x 17
  const DOG = {
    w: 23, h: 17,
    tailA: [[1, 3, 3, 6, "o"], [2, 4, 1, 4, "b"]],
    tailB: [[0, 6, 5, 3, "o"], [1, 7, 3, 1, "b"]],
    legsA: [[4, 12, 4, 5, "o"], [5, 12, 2, 4, "B"], [12, 12, 4, 5, "o"], [13, 12, 2, 4, "b"]],
    legsB: [[3, 12, 4, 5, "o"], [4, 12, 2, 4, "B"], [13, 12, 4, 5, "o"], [14, 12, 2, 4, "b"]],
    body: [
      [3, 7, 13, 6, "o"], [4, 8, 11, 4, "b"], [6, 11, 7, 1, "l"], [4, 8, 4, 1, "l"],
      [13, 1, 8, 9, "o"], [14, 2, 6, 7, "b"], [15, 6, 4, 2, "l"],
      [19, 4, 4, 5, "o"], [19, 5, 3, 3, "l"], [21, 4, 2, 2, "k"],
      [12, 1, 3, 7, "o"], [13, 2, 1, 5, "e"], [14, 2, 1, 3, "e"],
      [17, 3, 2, 2, "k"], [17, 3, 1, 1, "w"],
      [18, 8, 3, 1, "o"], [19, 9, 1, 2, "p"],
    ],
    // Ausrüstung
    scarf: [[13, 8, 5, 2, "r"], [14, 10, 3, 1, "r"], [15, 11, 1, 1, "R"], [13, 8, 5, 1, "R"]],
    helm: [[13, 0, 8, 2, "G"], [14, 0, 6, 1, "g"], [12, 1, 2, 2, "G"], [16, -2, 2, 2, "r"]],
    capeBack: [[0, 6, 5, 6, "V"], [1, 7, 3, 5, "v"]],
    cape: [[4, 6, 10, 3, "v"], [4, 6, 10, 1, "V"], [4, 9, 2, 1, "V"]],
    medal: [[15, 10, 2, 2, "y"], [15, 10, 1, 1, "Y"]],
  };
  const STAGES = [
    { xp: 0, name: "Welpe" },
    { xp: 300, name: "Junghund" },
    { xp: 900, name: "Großer Hund" },
    { xp: 2000, name: "Held-Hund" },
  ];
  const GEAR = [
    { id: "scarf", name: "Halstuch", xp: 300 },
    { id: "helm", name: "Helm", xp: 900 },
    { id: "torch", name: "Fackel", xp: 1400 },
    { id: "cape", name: "Umhang", xp: 2000 },
  ];
  const stageOf = (xp) => STAGES.reduce((s, x, i) => (xp >= x.xp ? i : s), 0);
  function growth(xp) {
    const i = stageOf(xp), cur = STAGES[i], nx = STAGES[i + 1];
    return { stage: i, name: cur.name, next: nx ? nx.name : null, need: nx ? nx.xp - xp : 0, pct: nx ? Math.round(((xp - cur.xp) / (nx.xp - cur.xp)) * 100) : 100 };
  }
  const gearOf = (xp) => GEAR.filter((g) => xp >= g.xp).map((g) => g.id);
  // Hund als SVG. Zwei Bilder für Schwanz und Beine, die CSS abwechselt (wedeln, laufen).
  function dog(xp, cls, label) {
    const gear = gearOf(xp);
    let s = "";
    if (gear.includes("cape")) s += rects(DOG.capeBack);
    s += `<g class="f1">${rects(DOG.tailA)}</g><g class="f2">${rects(DOG.tailB)}</g>`;
    s += `<g class="l1">${rects(DOG.legsA)}</g><g class="l2">${rects(DOG.legsB)}</g>`;
    s += rects(DOG.body);
    if (gear.includes("cape")) s += rects(DOG.cape);
    if (gear.includes("scarf")) s += rects(DOG.scarf);
    if (gear.includes("cape")) s += rects(DOG.medal);
    if (gear.includes("helm")) s += rects(DOG.helm);
    return `<svg class="dog st${stageOf(xp)} ${cls || ""}" viewBox="0 -2 ${DOG.w} ${DOG.h + 2}" shape-rendering="crispEdges" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${s}</svg>`;
  }
  const torch = () => svg(4, 9, rects([[1, 3, 2, 6, "o"], [1, 4, 2, 5, "e"], [0, 0, 4, 4, "f"], [1, 1, 2, 2, "y"], [1, 0, 1, 1, "y"]]), "torch");

  /* ================= Bosse (eigene Figuren) ================= */
  const BOSSES = [
    { id: "glibber", name: "Glibberklotz", pal: { a: "#2f8f3a", b: "#5fd35f", c: "#b6f5a8", d: "#3aa33a" },
      px: [[1, 3, 14, 13, "a"], [2, 4, 12, 11, "b"], [3, 5, 3, 2, "c"], [6, 10, 4, 3, "d"], [4, 7, 2, 3, "#1b1b1b"], [10, 7, 2, 3, "#1b1b1b"], [4, 7, 1, 1, "#fff"], [10, 7, 1, 1, "#fff"], [6, 12, 4, 1, "#1b1b1b"], [3, 15, 2, 1, "a"], [11, 15, 2, 1, "a"]] },
    { id: "golem", name: "Felsbrocken-Golem", pal: { a: "#3f434a", b: "#8b8f96", c: "#5d6168", d: "#5aa64a" },
      px: [[2, 2, 12, 13, "a"], [3, 3, 10, 11, "b"], [0, 7, 3, 6, "a"], [1, 8, 1, 4, "b"], [13, 7, 3, 6, "a"], [14, 8, 1, 4, "b"], [5, 6, 2, 1, "#ff8a1e"], [9, 6, 2, 1, "#ff8a1e"], [6, 9, 4, 1, "a"], [4, 11, 3, 1, "c"], [9, 4, 1, 2, "c"], [3, 3, 3, 1, "d"], [11, 12, 2, 1, "d"], [3, 15, 3, 1, "a"], [10, 15, 3, 1, "a"]] },
    { id: "fledermaus", name: "Höhlen-Fledermaus", pal: { a: "#2a1340", b: "#6b3fa0", c: "#9b6fd0" },
      px: [[0, 4, 6, 5, "a"], [1, 5, 5, 3, "b"], [10, 4, 6, 5, "a"], [10, 5, 5, 3, "b"], [0, 9, 2, 2, "a"], [14, 9, 2, 2, "a"], [5, 3, 6, 9, "a"], [6, 4, 4, 7, "c"], [5, 1, 2, 3, "a"], [9, 1, 2, 3, "a"], [6, 5, 1, 2, "#ff3b3b"], [9, 5, 1, 2, "#ff3b3b"], [7, 8, 1, 2, "#fff"], [8, 8, 1, 2, "#fff"], [6, 12, 1, 2, "a"], [9, 12, 1, 2, "a"]] },
    { id: "krabbe", name: "Lava-Krabbe", pal: { a: "#6b1a08", b: "#e2552b", c: "#ffd23f" },
      px: [[3, 7, 10, 6, "a"], [4, 8, 8, 4, "b"], [0, 3, 4, 4, "a"], [1, 4, 2, 2, "b"], [12, 3, 4, 4, "a"], [13, 4, 2, 2, "b"], [2, 6, 2, 3, "a"], [12, 6, 2, 3, "a"], [5, 4, 1, 4, "a"], [10, 4, 1, 4, "a"], [5, 3, 2, 2, "#fff"], [9, 3, 2, 2, "#fff"], [6, 4, 1, 1, "#1b1b1b"], [9, 4, 1, 1, "#1b1b1b"], [6, 9, 1, 1, "c"], [9, 10, 1, 1, "c"], [3, 13, 1, 2, "a"], [6, 13, 1, 2, "a"], [9, 13, 1, 2, "a"], [12, 13, 1, 2, "a"]] },
  ];
  const bossSvg = (b, cls) => svg(16, 16, rects(b.px, b.pal), "boss " + (cls || ""), b.name);
  // je Tag und Etappe ein anderer Boss
  function bossFor(day, step) {
    const n = String(day).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return BOSSES[(n + step) % BOSSES.length];
  }
  const bossHp = (step) => (step >= 2 ? 5 : 3);

  /* ================= Blöcke und Bauprojekte ================= */
  const BLOCK = {
    g: ["#5aa64a", "#8a5a2b"], d: ["#8a5a2b", "#6e4520"], w: ["#b07a3c", "#8a5a2b"], s: ["#8d9196", "#6b6f75"], G: ["#bfeaff", "#7cc6e8"],
    y: ["#ffd23f", "#c99a00"], r: ["#c0392b", "#8e2a20"], l: ["#3f9b47", "#2c7233"], t: ["#7a4a1f", "#5a3515"], f: ["#ff5c8a", "#5aa64a"], u: ["#5c8cff", "#5aa64a"], a: ["#3d8fd6", "#2b6ca8"],
  };
  const PROJECTS = [
    { id: "huette", name: "Hundehütte", rows: ["....rr....", "...rrrr...", "..rrrrrr..", ".rrrrrrrr.", "..wwyyww..", "..ww..ww..", "..ww..ww..", "gggggggggg"] },
    { id: "garten", name: "Garten", rows: ["........lll.", ".......lllll", "........t...", "f.u.f...t...", "wwwwwww.t.ww", "gggggggggggg"] },
    { id: "turm", name: "Turm", rows: ["s.ss.s", "ssssss", ".sGGs.", ".ssss.", ".sGss.", ".ssss.", ".ssGs.", ".ssss.", ".swws.", "gggggg"] },
    { id: "bruecke", name: "Brücke", rows: ["w.w.w.w.w.w.w.", "wwwwwwwwwwwwww", "ss..........ss", "ss..........ss", "ssaaaaaaaaaass", "ssaaaaaaaaaass"] },
  ];
  // Bau-Reihenfolge: von unten nach oben, links nach rechts
  const cells = (p) => { const out = []; for (let y = p.rows.length - 1; y >= 0; y--) for (let x = 0; x < p.rows[y].length; x++) if (p.rows[y][x] !== ".") out.push([x, y, p.rows[y][x]]); return out; };
  PROJECTS.forEach((p) => { p.size = cells(p).length; });
  // Wie weit sind die Bauprojekte bei insgesamt n Blöcken?
  function building(n) {
    let left = n;
    const done = [];
    for (const p of PROJECTS) {
      if (left >= p.size) { done.push(p.id); left -= p.size; continue; }
      return { done, cur: p, placed: left, bonus: 0 };
    }
    return { done, cur: null, placed: 0, bonus: left };
  }
  function projectSvg(p, placed, cls) {
    const w = p.rows[0].length, h = p.rows.length, list = cells(p);
    let s = "";
    list.forEach(([x, y, c], i) => {
      const [main, dark] = BLOCK[c];
      if (i < placed) {
        s += `<rect x="${x}" y="${y}" width="1" height="1" fill="${dark}"/><rect x="${x + 0.08}" y="${y + 0.08}" width="0.84" height="0.84" fill="${main}"/>`;
        if (c === "g") s += `<rect x="${x}" y="${y + 0.35}" width="1" height="0.65" fill="${dark}"/>`;
        if (i === placed - 1) s += `<rect class="newblock" x="${x}" y="${y}" width="1" height="1" fill="#fff"/>`;
      } else s += `<rect x="${x + 0.1}" y="${y + 0.1}" width="0.8" height="0.8" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="0.06" stroke-dasharray="0.15 0.12"/>`;
    });
    return `<svg class="project ${cls || ""}" viewBox="-0.2 -0.2 ${w + 0.4} ${h + 0.4}" shape-rendering="crispEdges" role="img" aria-label="${p.name}: ${Math.min(placed, p.size)} von ${p.size} Blöcken">${s}</svg>`;
  }

  /* ================= Rennen gegen den eigenen Rekord ================= */
  // trace: Zeitpunkte (ms seit Start) der Treffer im besten Lauf. Ohne Lauf: leichte Vorgabe.
  function ghostTrace(trace, totalMs) {
    if (trace && trace.length) return trace;
    return Array.from({ length: 8 }, (_, i) => Math.round(((i + 1) / 9) * totalMs));
  }
  const ghostAt = (trace, t) => trace.filter((x) => x <= t).length;
  const raceGoal = (trace) => Math.max(trace.length, 8) + 1;
  const pos = (n, goal) => Math.min(100, Math.round((n / goal) * 1000) / 10);
  function raceHTML(xp) {
    return `<div class="race" id="race" aria-label="Rennen gegen deinen Rekord"><i id="tm"></i><span class="rlane"></span>
      <span class="runner ghost" id="rghost">${dog(0, "run")}</span><span class="runner me" id="rme">${dog(xp, "run")}</span><span class="rflag">🏁</span></div>`;
  }

  const api = { PAL, DOG, STAGES, GEAR, BOSSES, PROJECTS, BLOCK, stageOf, growth, gearOf, dog, torch, bossSvg, bossFor, bossHp, cells, building, projectSvg, ghostTrace, ghostAt, raceGoal, pos, raceHTML };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DEBegleiter = api;
})(typeof self !== "undefined" ? self : this);
