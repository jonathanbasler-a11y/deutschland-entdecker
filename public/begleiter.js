// Begleiter: eigener Pixel-Hund, Bauprojekte aus Blöcken, Pixel-Bosse, Rennen gegen den eigenen Rekord.
// Alles selbst gezeichnet (Rechtecke auf einem Raster). Reine Hilfsfunktionen laufen auch in Node.
(function (root) {
  "use strict";

  /* ================= Farben ================= */
  const PAL = {
    o: "#3b2412", b: "#c47f3c", B: "#a8672c", l: "#f1c993", e: "#6e4219", k: "#1b1b1b", w: "#ffffff", p: "#ff6f9b",
    r: "#e23b3b", R: "#a82020", g: "#aeb8c2", G: "#6d7884", v: "#7b4bd6", V: "#55309f", y: "#ffd23f", Y: "#c99a00", f: "#ff8a1e",
  };
  const rectsP = (list, pal) =>
    list.map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${(pal || PAL)[c] || c}"/>`).join("");
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
  // Jedes Tier hat eine eigene Pixelfigur (Blickrichtung rechts, Raster ~23×17). Farben über pal.
  // Form: body + zwei Schwanz-/Bein-Frames fürs Wedeln und Laufen (wie beim Hund).
  const SHAPE = {
    hund: DOG,
    fuchs: {
      w: 24, h: 17,
      tailA: [[0, 4, 5, 5, "o"], [1, 5, 4, 3, "b"], [0, 8, 3, 3, "o"]],
      tailB: [[0, 6, 6, 4, "o"], [1, 7, 4, 2, "b"], [1, 9, 3, 2, "o"]],
      legsA: [[5, 12, 3, 5, "o"], [6, 12, 1, 4, "B"], [12, 12, 3, 5, "o"], [13, 12, 1, 4, "b"]],
      legsB: [[4, 12, 3, 5, "o"], [5, 12, 1, 4, "B"], [13, 12, 3, 5, "o"], [14, 12, 1, 4, "b"]],
      body: [
        [4, 8, 11, 5, "o"], [5, 9, 9, 3, "b"], [7, 11, 5, 1, "l"],
        [14, 2, 8, 9, "o"], [15, 3, 6, 7, "b"], [16, 7, 4, 2, "l"],
        [20, 5, 4, 4, "o"], [21, 6, 2, 2, "l"], [22, 5, 2, 2, "k"],
        [15, 0, 2, 3, "o"], [19, 0, 2, 3, "o"], [16, 1, 1, 1, "p"],
        [17, 4, 2, 2, "k"], [17, 4, 1, 1, "w"], [19, 9, 2, 1, "o"],
      ],
    },
    katze: {
      w: 23, h: 17,
      tailA: [[1, 1, 2, 8, "o"], [1, 1, 2, 2, "b"], [0, 0, 2, 2, "o"]],
      tailB: [[2, 2, 2, 8, "o"], [2, 2, 2, 2, "b"], [1, 1, 2, 2, "o"]],
      legsA: [[5, 13, 2, 4, "o"], [11, 13, 2, 4, "o"]],
      legsB: [[6, 13, 2, 4, "o"], [12, 13, 2, 4, "o"]],
      body: [
        [4, 8, 10, 5, "o"], [5, 9, 8, 3, "b"], [6, 10, 1, 2, "o"], [9, 10, 1, 2, "o"],
        [13, 3, 7, 8, "o"], [14, 4, 5, 6, "b"], [15, 7, 3, 2, "l"],
        [18, 5, 3, 4, "o"], [19, 6, 2, 2, "l"], [20, 5, 2, 2, "k"],
        [14, 1, 2, 3, "o"], [14, 1, 1, 2, "p"], [18, 1, 2, 3, "o"], [18, 1, 1, 2, "p"],
        [16, 5, 2, 2, "k"], [16, 5, 1, 1, "w"], [17, 10, 2, 1, "p"],
      ],
    },
    panda: {
      w: 23, h: 17,
      tailA: [[2, 8, 3, 3, "o"]],
      tailB: [[1, 9, 3, 3, "o"]],
      legsA: [[5, 13, 4, 4, "o"], [6, 13, 2, 3, "B"], [12, 13, 4, 4, "o"], [13, 13, 2, 3, "b"]],
      legsB: [[4, 13, 4, 4, "o"], [5, 13, 2, 3, "B"], [13, 13, 4, 4, "o"], [14, 13, 2, 3, "b"]],
      body: [
        [4, 7, 12, 7, "b"], [5, 8, 10, 5, "l"], [6, 12, 8, 1, "b"],
        [13, 2, 8, 8, "b"], [14, 3, 6, 6, "l"],
        [14, 0, 3, 3, "o"], [19, 0, 3, 3, "o"],
        [15, 4, 3, 3, "o"], [16, 5, 1, 1, "k"], [16, 5, 1, 1, "w"],
        [19, 5, 2, 2, "o"], [20, 5, 1, 1, "k"],
        [18, 8, 3, 2, "o"], [8, 9, 3, 3, "o"],
      ],
    },
    wolf: {
      w: 24, h: 17,
      tailA: [[0, 5, 5, 4, "o"], [1, 6, 3, 2, "b"]],
      tailB: [[0, 7, 5, 3, "o"], [1, 8, 3, 1, "b"]],
      legsA: [[5, 11, 3, 6, "o"], [6, 11, 1, 5, "B"], [13, 11, 3, 6, "o"], [14, 11, 1, 5, "b"]],
      legsB: [[4, 11, 3, 6, "o"], [5, 11, 1, 5, "B"], [14, 11, 3, 6, "o"], [15, 11, 1, 5, "b"]],
      body: [
        [4, 7, 12, 5, "o"], [5, 8, 10, 3, "b"],
        [14, 1, 8, 9, "o"], [15, 2, 6, 7, "b"], [16, 6, 4, 2, "l"],
        [20, 4, 4, 5, "o"], [21, 5, 2, 2, "l"], [22, 4, 2, 2, "k"],
        [15, 0, 2, 2, "o"], [19, 0, 2, 2, "o"],
        [17, 3, 2, 2, "k"], [17, 3, 1, 1, "w"], [19, 9, 2, 1, "o"],
      ],
    },
    tiger: {
      w: 24, h: 17,
      tailA: [[0, 5, 4, 3, "o"], [1, 6, 2, 1, "k"], [0, 7, 3, 2, "b"]],
      tailB: [[0, 7, 5, 3, "o"], [1, 8, 2, 1, "k"]],
      legsA: [[5, 12, 3, 5, "o"], [6, 12, 1, 4, "B"], [12, 12, 3, 5, "o"], [13, 12, 1, 4, "b"]],
      legsB: [[4, 12, 3, 5, "o"], [5, 12, 1, 4, "B"], [13, 12, 3, 5, "o"], [14, 12, 1, 4, "b"]],
      body: [
        [4, 8, 11, 5, "o"], [5, 9, 9, 3, "b"], [7, 9, 1, 3, "k"], [10, 9, 1, 3, "k"],
        [14, 2, 8, 9, "o"], [15, 3, 6, 7, "b"], [16, 4, 1, 5, "k"], [18, 4, 1, 4, "k"],
        [20, 5, 4, 4, "o"], [21, 6, 2, 2, "l"], [22, 5, 2, 2, "k"],
        [15, 0, 2, 3, "o"], [19, 0, 2, 3, "o"], [15, 1, 1, 1, "p"],
        [17, 4, 2, 2, "k"], [17, 4, 1, 1, "w"], [6, 10, 1, 2, "o"], [9, 10, 1, 2, "o"], [12, 10, 1, 2, "o"],
      ],
    },
    drache: {
      w: 25, h: 18,
      tailA: [[0, 8, 5, 3, "o"], [0, 7, 2, 2, "y"], [1, 9, 3, 1, "b"]],
      tailB: [[0, 9, 5, 3, "o"], [0, 8, 2, 2, "y"], [1, 10, 3, 1, "b"]],
      legsA: [[6, 13, 3, 5, "o"], [7, 13, 1, 4, "B"], [14, 13, 3, 5, "o"], [15, 13, 1, 4, "b"]],
      legsB: [[5, 13, 3, 5, "o"], [6, 13, 1, 4, "B"], [15, 13, 3, 5, "o"], [16, 13, 1, 4, "b"]],
      body: [
        [5, 8, 12, 6, "o"], [6, 9, 10, 4, "b"], [8, 7, 2, 2, "y"], [11, 7, 2, 2, "y"],
        [8, 3, 4, 6, "o"], [9, 4, 2, 4, "b"], // Hals
        [15, 1, 8, 9, "o"], [16, 2, 6, 7, "b"], [17, 6, 4, 2, "l"],
        [21, 4, 4, 5, "o"], [22, 5, 2, 2, "l"], [23, 4, 2, 2, "k"], [22, 8, 2, 2, "r"],
        [17, 0, 2, 2, "y"], [20, 0, 2, 2, "y"],
        [18, 3, 2, 2, "k"], [18, 3, 1, 1, "w"],
        [3, 5, 4, 4, "o"], [4, 6, 2, 2, "b"], // Flügel
      ],
    },
    einhorn: {
      w: 24, h: 17,
      tailA: [[1, 4, 3, 5, "o"], [2, 5, 1, 3, "p"]],
      tailB: [[0, 6, 4, 3, "o"], [1, 7, 2, 1, "p"]],
      legsA: [[5, 12, 3, 5, "o"], [6, 12, 1, 4, "B"], [12, 12, 3, 5, "o"], [13, 12, 1, 4, "b"]],
      legsB: [[4, 12, 3, 5, "o"], [5, 12, 1, 4, "B"], [13, 12, 3, 5, "o"], [14, 12, 1, 4, "b"]],
      body: [
        [4, 8, 11, 5, "o"], [5, 9, 9, 3, "b"], [6, 11, 6, 1, "l"],
        [14, 2, 8, 9, "o"], [15, 3, 6, 7, "b"], [16, 7, 4, 2, "l"],
        [20, 5, 4, 4, "o"], [21, 6, 2, 2, "l"], [22, 5, 2, 2, "k"],
        [18, -1, 2, 4, "y"], [18, -1, 1, 2, "Y"], // Horn
        [14, 1, 3, 2, "p"], [19, 1, 2, 2, "p"], // Mähne
        [17, 4, 2, 2, "k"], [17, 4, 1, 1, "w"],
      ],
    },
    pinguin: {
      w: 16, h: 18,
      tailA: [[6, 14, 3, 2, "o"]],
      tailB: [[7, 14, 3, 2, "o"]],
      legsA: [[4, 15, 3, 3, "y"], [9, 15, 3, 3, "y"]],
      legsB: [[3, 15, 3, 3, "y"], [10, 15, 3, 3, "y"]],
      body: [
        [3, 5, 10, 10, "o"], [4, 6, 8, 8, "w"], [5, 7, 6, 6, "l"],
        [2, 7, 2, 5, "o"], [12, 7, 2, 5, "o"], // Flossen
        [4, 1, 8, 6, "o"], [5, 2, 6, 4, "b"],
        [6, 3, 2, 2, "k"], [6, 3, 1, 1, "w"], [9, 3, 2, 2, "k"], [9, 3, 1, 1, "w"],
        [7, 5, 3, 2, "y"],
      ],
    },
    eule: {
      w: 18, h: 17,
      tailA: [[7, 14, 4, 2, "o"]],
      tailB: [[8, 14, 4, 2, "o"]],
      legsA: [[5, 14, 2, 3, "y"], [11, 14, 2, 3, "y"]],
      legsB: [[4, 14, 2, 3, "y"], [12, 14, 2, 3, "y"]],
      body: [
        [3, 5, 12, 10, "o"], [4, 6, 10, 8, "b"], [5, 8, 8, 5, "l"],
        [2, 6, 3, 7, "o"], [13, 6, 3, 7, "o"], // Flügel
        [4, 1, 10, 7, "o"], [5, 2, 8, 5, "b"],
        [5, 3, 3, 3, "y"], [6, 4, 1, 1, "k"], [10, 3, 3, 3, "y"], [11, 4, 1, 1, "k"],
        [8, 6, 2, 2, "k"], [4, 0, 2, 2, "o"], [12, 0, 2, 2, "o"],
      ],
    },
    hase: {
      w: 20, h: 18,
      tailA: [[2, 10, 3, 3, "l"]],
      tailB: [[1, 11, 3, 3, "l"]],
      legsA: [[5, 13, 3, 5, "o"], [11, 13, 4, 5, "o"], [12, 14, 2, 3, "B"]],
      legsB: [[4, 13, 3, 5, "o"], [12, 13, 4, 5, "o"], [13, 14, 2, 3, "B"]],
      body: [
        [4, 8, 10, 6, "o"], [5, 9, 8, 4, "b"], [6, 12, 5, 1, "l"],
        [12, 4, 7, 7, "o"], [13, 5, 5, 5, "b"], [14, 7, 3, 2, "l"],
        [16, 6, 3, 3, "o"], [17, 7, 1, 1, "p"], [17, 6, 2, 2, "k"], [17, 6, 1, 1, "w"],
        [12, -1, 2, 6, "o"], [12, 0, 1, 4, "p"], [15, -1, 2, 6, "o"], [15, 0, 1, 4, "p"],
      ],
    },
    koala: {
      w: 20, h: 17,
      tailA: [[2, 10, 2, 2, "o"]],
      tailB: [[1, 11, 2, 2, "o"]],
      legsA: [[5, 13, 4, 4, "o"], [11, 13, 4, 4, "o"]],
      legsB: [[4, 13, 4, 4, "o"], [12, 13, 4, 4, "o"]],
      body: [
        [4, 7, 12, 7, "o"], [5, 8, 10, 5, "b"], [6, 11, 7, 1, "l"],
        [6, 2, 10, 8, "o"], [7, 3, 8, 6, "b"],
        [4, 1, 4, 4, "o"], [4, 2, 3, 3, "p"], [14, 1, 4, 4, "o"], [15, 2, 3, 3, "p"],
        [8, 5, 2, 2, "k"], [8, 5, 1, 1, "w"], [12, 5, 2, 2, "k"], [12, 5, 1, 1, "w"],
        [10, 7, 2, 2, "k"],
      ],
    },
    dino: {
      w: 26, h: 17,
      tailA: [[0, 8, 7, 3, "o"], [0, 7, 2, 2, "y"], [1, 9, 5, 1, "b"]],
      tailB: [[0, 9, 7, 3, "o"], [0, 8, 2, 2, "y"], [1, 10, 5, 1, "b"]],
      legsA: [[10, 12, 4, 5, "o"], [11, 12, 2, 4, "B"], [16, 12, 3, 5, "o"], [17, 12, 1, 4, "b"]],
      legsB: [[9, 12, 4, 5, "o"], [10, 12, 2, 4, "B"], [17, 12, 3, 5, "o"], [18, 12, 1, 4, "b"]],
      body: [
        [8, 7, 10, 6, "o"], [9, 8, 8, 4, "b"],
        [14, 2, 5, 7, "o"], [15, 3, 3, 5, "b"], // Hals hoch
        [17, 0, 7, 6, "o"], [18, 1, 5, 4, "b"], [20, 2, 3, 3, "l"],
        [22, 1, 3, 3, "o"], [23, 2, 1, 1, "k"], [21, 4, 2, 2, "r"],
        [18, -1, 2, 2, "y"], [20, -1, 1, 2, "y"],
        [12, 5, 2, 2, "o"], [14, 6, 2, 2, "o"], // kurze Arme
      ],
    },
  };
  const KINDS = [
    { id: "hund", name: "Hund", word: "Hund", pal: {} },
    { id: "fuchs", name: "Fuchs", word: "Fuchs", pal: { b: "#e8742a", B: "#c45a16", o: "#4a2008", l: "#fff3e0", e: "#4a2008" } },
    { id: "katze", name: "Katze", word: "Katze", pal: { b: "#9aa3ad", B: "#7b848e", o: "#2c3138", l: "#e9edf2", e: "#2c3138" } },
    { id: "panda", name: "Panda", word: "Panda", pal: { b: "#ffffff", B: "#e8e8e8", o: "#111111", l: "#f7f7f7", e: "#111111" } },
    { id: "wolf", name: "Wolf", word: "Wolf", pal: { b: "#8e969f", B: "#6b737c", o: "#2a2f36", l: "#d9dee3", e: "#2a2f36" } },
    { id: "tiger", name: "Tiger", word: "Tiger", pal: { b: "#f0922b", B: "#d0731a", o: "#3a1c08", l: "#fff0d8", e: "#3a1c08" } },
    { id: "drache", name: "Drache", word: "Drache", pal: { b: "#4cbf5a", B: "#2f8f3a", o: "#14391a", l: "#d7f5a8", e: "#14391a" } },
    { id: "einhorn", name: "Einhorn", word: "Einhorn", pal: { b: "#f2e6ff", B: "#d9c2f2", o: "#6b4a9e", l: "#fff7ff", e: "#6b4a9e", p: "#ff8fd0" } },
    { id: "pinguin", name: "Pinguin", word: "Pinguin", pal: { b: "#2a2f36", B: "#1b1f24", o: "#111111", l: "#ffffff", e: "#111111" } },
    { id: "eule", name: "Eule", word: "Eule", pal: { b: "#8a5a2b", B: "#6e4520", o: "#3b2412", l: "#e8c48a", e: "#3b2412", y: "#f0d24a" } },
    { id: "hase", name: "Hase", word: "Hase", pal: { b: "#e8d0b0", B: "#c9a882", o: "#6e4219", l: "#fff5e6", e: "#6e4219", p: "#ffb6c8" } },
    { id: "koala", name: "Koala", word: "Koala", pal: { b: "#9aa3ad", B: "#7b848e", o: "#3a4048", l: "#e9edf2", e: "#3a4048", p: "#c5a090" } },
    { id: "dino", name: "Dino", word: "Dino", pal: { b: "#5ecf7a", B: "#3aa355", o: "#1a4d28", l: "#c8f5a8", e: "#1a4d28" } },
  ];
  const kindOf = (id) => KINDS.find((k) => k.id === id) || KINDS[0];
  const shapeOf = (id) => SHAPE[kindOf(id).id] || DOG;
  const SNACKS = [
    { id: "apfel", name: "Apfel", icon: "🍎", price: 3, full: 15 },
    { id: "keks", name: "Keks", icon: "🍪", price: 5, full: 20 },
    { id: "wurst", name: "Wurst", icon: "🌭", price: 8, full: 30 },
    { id: "eis", name: "Eis", icon: "🍦", price: 10, full: 30 },
    { id: "pizza", name: "Pizza", icon: "🍕", price: 12, full: 40 },
    { id: "kuchen", name: "Kuchen", icon: "🍰", price: 15, full: 50 },
  ];
  // Zubehör (wird als Bild auf das Tier gelegt), Zimmer (Hintergrund) und Deko
  const ACC = [
    { id: "kappe", name: "Kappe", icon: "🧢", price: 8, slot: "head" },
    { id: "hut", name: "Zylinder", icon: "🎩", price: 12, slot: "head" },
    { id: "krone", name: "Krone", icon: "👑", price: 25, slot: "head" },
    { id: "brille", name: "Sonnenbrille", icon: "🕶️", price: 10, slot: "eyes" },
    { id: "schleife", name: "Schleife", icon: "🎀", price: 8, slot: "neck" },
    { id: "kopfhoerer", name: "Kopfhörer", icon: "🎧", price: 15, slot: "ear" },
  ];
  const ROOMS = [
    { id: "wiese", name: "Wiese", price: 0, bg: "linear-gradient(#bfe6ff 0 60%, #8fd18a 60%)" },
    { id: "strand", name: "Strand", price: 15, bg: "linear-gradient(#aee2ff 0 45%, #4db6e8 45% 62%, #f4e2a8 62%)" },
    { id: "schnee", name: "Schnee", price: 15, bg: "linear-gradient(#d7e8f7 0 60%, #ffffff 60%)" },
    { id: "dschungel", name: "Dschungel", price: 20, bg: "linear-gradient(#c9f0c0 0 50%, #2f8f3a 50%)" },
    { id: "weltall", name: "Weltall", price: 30, bg: "radial-gradient(circle at 20% 30%, #fff 0 1px, transparent 2px), radial-gradient(circle at 70% 20%, #fff 0 1px, transparent 2px), linear-gradient(#1b1f4a, #3b2a6e)" },
  ];
  const DECOR = [
    { id: "pflanze", name: "Pflanze", icon: "🪴", price: 6 },
    { id: "ball", name: "Ball", icon: "⚽", price: 6 },
    { id: "bett", name: "Körbchen", icon: "🛏️", price: 12 },
    { id: "luftballon", name: "Luftballons", icon: "🎈", price: 8 },
    { id: "buch", name: "Bücher", icon: "📚", price: 10 },
    { id: "stern", name: "Stern", icon: "⭐", price: 14 },
  ];
  const roomOf = (id) => ROOMS.find((r) => r.id === id) || ROOMS[0];
  // Münzen: je 10 Punkte eine, abzüglich Ausgaben
  const coins = (xp, spent) => Math.max(0, Math.floor(xp / 10) - (spent || 0));
  const stageName = (i, kind) => (kind && kind !== "hund" ? ["Baby-", "Junger ", "Großer ", "Held-"][i].replace(/-$/, "-") + kindOf(kind).word : STAGES[i].name);
  const stageOf = (xp) => STAGES.reduce((s, x, i) => (xp >= x.xp ? i : s), 0);
  function growth(xp, kind) {
    const i = stageOf(xp), cur = STAGES[i], nx = STAGES[i + 1];
    return { stage: i, name: stageName(i, kind), next: nx ? stageName(i + 1, kind) : null, need: nx ? nx.xp - xp : 0, pct: nx ? Math.round(((xp - cur.xp) / (nx.xp - cur.xp)) * 100) : 100 };
  }
  const gearOf = (xp) => GEAR.filter((g) => xp >= g.xp).map((g) => g.id);
  // Kopfmaße je Tier in Pixel-Einheiten: Mitte (cx), Oberkante (top), Breite (w), Augenhöhe (ey), Kinn (chin).
  // Zubehör wird daran ausgerichtet und mit der Kopfbreite skaliert.
  const HEAD = {
    hund: { cx: 18, top: 2, w: 9, ey: 4, chin: 9 }, fuchs: { cx: 20, top: 3, w: 7, ey: 5, chin: 10 },
    katze: { cx: 19, top: 2, w: 8, ey: 6, chin: 10 }, panda: { cx: 18, top: 1, w: 9, ey: 5, chin: 9 },
    wolf: { cx: 19.5, top: 2, w: 8, ey: 4, chin: 10 }, tiger: { cx: 20, top: 2, w: 8, ey: 4.5, chin: 10 },
    drache: { cx: 21, top: 2, w: 8, ey: 4, chin: 9 }, einhorn: { cx: 20, top: 3, w: 8, ey: 5, chin: 10 },
    pinguin: { cx: 8, top: 1, w: 8, ey: 3.5, chin: 7 }, eule: { cx: 9, top: 1.5, w: 9, ey: 5, chin: 8 },
    hase: { cx: 16, top: 4, w: 6, ey: 6, chin: 10 }, koala: { cx: 10, top: 2, w: 9, ey: 5.5, chin: 9 },
    dino: { cx: 20, top: 1, w: 7, ey: 2.5, chin: 6 },
  };
  // Emoji an die Stelle "slot" des Kopfes H setzen; Größe richtet sich nach der Kopfbreite
  function at(H, slot, icon) {
    const g = (x, y, size) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${icon}</text>`;
    if (slot === "head") { const z = H.w * 0.78; return g(H.cx, H.top + 1.2 - 0.14 * z, z); }
    if (slot === "eyes") { const z = H.w * 0.66; return g(H.cx, H.ey + 0.6 + 0.33 * z, z); }
    if (slot === "neck") { const z = H.w * 0.42; return g(H.cx, H.chin + 0.3 + 0.33 * z, z); }
    const z = H.w * 0.95; // Kopfhörer: um den Kopf, Mitte auf Augenhöhe
    return g(H.cx, H.ey + 0.2 + 0.33 * z, z);
  }
  // Tier als SVG. Zwei Bilder für Schwanz und Beine, die CSS abwechselt (wedeln, laufen).
  function dog(xp, cls, label, kind, worn) {
    const gear = gearOf(xp), K = kindOf(kind), pal = Object.assign({}, PAL, K.pal), sh = shapeOf(K.id);
    const R = (list) => rectsP(list || [], pal);
    const on = (slot) => (worn || []).map((id) => ACC.find((x) => x.id === id)).find((x) => x && x.slot === slot);
    const ic = (t, x, y, f) => `<text x="${x}" y="${y}" font-size="${f}" text-anchor="middle">${t}</text>`;
    let s = "";
    if (K.id === "hund" && gear.includes("cape")) s += R(DOG.capeBack);
    s += `<g class="f1">${R(sh.tailA)}</g><g class="f2">${R(sh.tailB)}</g>`;
    s += `<g class="l1">${R(sh.legsA)}</g><g class="l2">${R(sh.legsB)}</g>`;
    s += R(sh.body);
    if (K.id === "hund") {
      if (gear.includes("cape")) s += R(DOG.cape);
      if (gear.includes("scarf")) s += R(DOG.scarf);
      if (gear.includes("cape")) s += R(DOG.medal);
      if (gear.includes("helm") && !on("head")) s += R(DOG.helm);
    } else {
      // Ausrüstung (Schal, Helm, Medaille) am Kopf des jeweiligen Tiers
      const H = HEAD[K.id];
      if (gear.includes("scarf") && !on("neck")) s += at(H, "neck", "🧣");
      if (gear.includes("helm") && !on("head")) s += at(H, "head", "⛑️");
      if (gear.includes("cape")) s += ic("🏅", H.cx + H.w * 0.45, H.chin + 2.2, H.w * 0.45);
    }
    // Gekauftes Zubehör sitzt am Kopf des jeweiligen Tiers (Größe und Lage aus HEAD)
    const H2 = HEAD[K.id];
    for (const slot of ["ear", "eyes", "neck", "head"]) {
      const it = on(slot);
      if (it) s += at(H2, slot, it.icon);
    }
    return `<svg class="dog k-${K.id} st${stageOf(xp)} ${cls || ""}" viewBox="0 -7 ${sh.w} ${sh.h + 7}" shape-rendering="crispEdges" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${s}</svg>`;
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
  function raceHTML(xp, kind) {
    return `<div class="race" id="race" aria-label="Rennen gegen deinen Rekord"><i id="tm"></i><span class="rlane"></span>
      <span class="runner ghost" id="rghost">${dog(0, "run", "", kind)}</span><span class="runner me" id="rme">${dog(xp, "run", "", kind)}</span><span class="rflag">🏁</span></div>`;
  }

  const api = { KINDS, kindOf, shapeOf, SHAPE, SNACKS, ACC, ROOMS, DECOR, roomOf, coins, stageName, PAL, DOG, STAGES, GEAR, BOSSES, PROJECTS, BLOCK, stageOf, growth, gearOf, dog, torch, bossSvg, bossFor, bossHp, cells, building, projectSvg, ghostTrace, ghostAt, raceGoal, pos, raceHTML };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DEBegleiter = api;
})(typeof self !== "undefined" ? self : this);
