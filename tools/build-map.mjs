// Builds src/mapdata.js from the raw geodata in raw/.
// Usage: node tools/build-map.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoConicConformal, geoPath } from "d3-geo";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = (f) => JSON.parse(fs.readFileSync(path.join(root, "raw", f)));

export const W = 1000, H = 1180;

// Germany outline used for fitting the projection
const laender = raw("laender.geojson");
const projection = geoConicConformal()
  .parallels([48.5, 53.5])
  .rotate([-10.4, 0]);
projection.fitExtent([[95, 110], [W - 95, H - 75]], laender);
projection.clipExtent([[-5, -5], [W + 5, H + 5]]);

// Drop points closer than TOL px to the previous emitted point.
function simplifier(tol) {
  return (out) => {
    let lx, ly, first, buf;
    return {
      point(x, y) {
        if (first) { out.point(x, y); lx = x; ly = y; first = false; buf = null; return; }
        if (Math.hypot(x - lx, y - ly) >= tol) { out.point(x, y); lx = x; ly = y; buf = null; }
        else buf = [x, y];
      },
      lineStart() { first = true; out.lineStart(); },
      lineEnd() { if (buf) out.point(buf[0], buf[1]); out.lineEnd(); },
      polygonStart() { out.polygonStart(); },
      polygonEnd() { out.polygonEnd(); },
      sphere() { out.sphere(); },
    };
  };
}
function pathFor(tol) {
  const s = simplifier(tol);
  return geoPath({ stream: (out) => projection.stream(s(out)) }).digits(1);
}
const P = pathFor(1.2);
const Pfine = pathFor(0.6);
const xy = ([lon, lat]) => projection([lon, lat]).map((v) => Math.round(v * 10) / 10);
const poly = (coords) => ({ type: "Feature", geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] } });
// d3 expects clockwise rings for spherical polygons; our hand rings are small, so fix winding.
function ring(coords) {
  // ensure clockwise in lon/lat (d3 spherical convention: exterior is clockwise)
  let a = 0;
  for (let i = 0; i < coords.length; i++) {
    const [x1, y1] = coords[i], [x2, y2] = coords[(i + 1) % coords.length];
    a += (x2 - x1) * (y2 + y1);
  }
  return a > 0 ? coords : [...coords].reverse();
}
const handPoly = (c) => poly(ring(c));

// ---------- Bundesländer ----------
const LAND_META = {
  "Baden-Württemberg": { id: "bw", label: [9.05, 48.55], capital: "Stuttgart", cap: [9.18, 48.78] },
  "Bayern": { id: "by", label: [11.45, 49.0], capital: "München", cap: [11.58, 48.14] },
  "Berlin": { id: "be", label: [13.4, 52.52], capital: "Berlin", cap: [13.4, 52.52], small: true },
  "Brandenburg": { id: "bb", label: [13.7, 52.0], capital: "Potsdam", cap: [13.06, 52.39] },
  "Bremen": { id: "hb", label: [8.8, 53.08], capital: "Bremen", cap: [8.8, 53.08], small: true },
  "Hamburg": { id: "hh", label: [10.0, 53.55], capital: "Hamburg", cap: [9.99, 53.55], small: true },
  "Hessen": { id: "he", label: [9.0, 50.6], capital: "Wiesbaden", cap: [8.24, 50.08] },
  "Mecklenburg-Vorpommern": { id: "mv", label: [12.6, 53.75], capital: "Schwerin", cap: [11.41, 53.63] },
  "Niedersachsen": { id: "ni", label: [9.4, 52.65], capital: "Hannover", cap: [9.73, 52.37] },
  "Nordrhein-Westfalen": { id: "nw", label: [7.55, 51.45], capital: "Düsseldorf", cap: [6.77, 51.23] },
  "Rheinland-Pfalz": { id: "rp", label: [7.4, 49.9], capital: "Mainz", cap: [8.27, 50.0] },
  "Saarland": { id: "sl", label: [6.95, 49.4], capital: "Saarbrücken", cap: [7.0, 49.23], small: true },
  "Sachsen-Anhalt": { id: "st", label: [11.65, 52.05], capital: "Magdeburg", cap: [11.63, 52.13] },
  "Sachsen": { id: "sn", label: [13.25, 51.1], capital: "Dresden", cap: [13.74, 51.05] },
  "Schleswig-Holstein": { id: "sh", label: [9.75, 54.2], capital: "Kiel", cap: [10.13, 54.32] },
  "Thüringen": { id: "th", label: [11.0, 50.85], capital: "Erfurt", cap: [11.03, 50.98] },
};
const states = laender.features.map((f) => {
  const m = LAND_META[f.properties.name];
  if (!m) throw new Error("unknown Land " + f.properties.name);
  return { id: m.id, name: f.properties.name, d: Pfine(f), label: xy(m.label), capital: m.capital, cap: xy(m.cap), small: !!m.small };
}).sort((a, b) => a.name.localeCompare(b.name, "de"));

// ---------- Countries ----------
const countries = raw("countries.geojson");
const NEIGH = {
  DNK: { id: "dk", name: "Dänemark", label: [9.25, 55.4] },
  POL: { id: "pl", name: "Polen", label: [16.4, 52.3] },
  CZE: { id: "cz", name: "Tschechien", label: [15.1, 49.75] },
  AUT: { id: "at", name: "Österreich", label: [14.4, 47.55] },
  CHE: { id: "ch", name: "Schweiz", label: [8.1, 46.95] },
  FRA: { id: "fr", name: "Frankreich", label: [5.6, 48.25] },
  LUX: { id: "lu", name: "Luxemburg", label: [6.12, 49.78] },
  BEL: { id: "be2", name: "Belgien", label: [4.85, 50.55] },
  NLD: { id: "nl", name: "Niederlande", label: [5.7, 52.35] },
};
const neighbors = [], others = [];
let germanyOutline = "";
for (const f of countries.features) {
  const iso = f.properties.ADM0_A3;
  const d = P(f);
  if (!d) continue;
  if (iso === "DEU") { germanyOutline = d; continue; }
  if (NEIGH[iso]) {
    const n = NEIGH[iso];
    neighbors.push({ id: n.id, name: n.name, d, label: xy(n.label), small: iso === "LUX" });
  } else others.push(d);
}
if (neighbors.length !== 9) throw new Error("expected 9 neighbours, got " + neighbors.length);

// ---------- Water ----------
const rivers = raw("rivers.geojson"), riversEu = raw("rivers_eu.geojson"), lakes = raw("lakes.geojson"), lakesEu = raw("lakes_eu.geojson");
function riverPath(features, { minLat = -90, extra = [] } = {}) {
  const lines = [];
  for (const f of features) {
    const g = f.geometry;
    const parts = g.type === "LineString" ? [g.coordinates] : g.coordinates;
    for (const line of parts) {
      let cur = [];
      for (const c of line) {
        if (c[1] >= minLat) cur.push(c);
        else { if (cur.length > 1) lines.push(cur); cur = []; }
      }
      if (cur.length > 1) lines.push(cur);
    }
  }
  for (const e of extra) lines.push(e);
  return P({ type: "Feature", geometry: { type: "MultiLineString", coordinates: lines } });
}
const pick = (src, re) => src.features.filter((f) => re.test(f.properties.name || ""));
const water = [
  { id: "rhein", name: "Rhein", kind: "Fluss", d: riverPath(pick(rivers, /^(Rhein|Rhine)$/)), label: xy([7.35, 50.55]) },
  { id: "donau", name: "Donau", kind: "Fluss", d: riverPath(pick(rivers, /^(Danube|Donau)$/)), label: xy([12.2, 48.86]) },
  { id: "elbe", name: "Elbe", kind: "Fluss", d: riverPath(pick(rivers, /^Elbe$/), { extra: [[[10.0, 53.53], [9.95, 53.545], [9.7, 53.56], [9.48, 53.66], [9.25, 53.83], [9.0, 53.9], [8.75, 53.88], [8.55, 53.95]]] }), label: xy([11.95, 52.55]) },
  { id: "weser", name: "Weser", kind: "Fluss", d: riverPath(pick(rivers, /^Weser$/), { minLat: 51.415, extra: [[[8.8, 53.08], [8.65, 53.17], [8.5, 53.3], [8.52, 53.45], [8.57, 53.55], [8.48, 53.7]]] }), label: xy([9.0, 52.3]) },
  { id: "neckar", name: "Neckar", kind: "Fluss", d: riverPath(pick(riversEu, /^Neckar$/)), label: xy([9.55, 48.95]) },
  { id: "main", name: "Main", kind: "Fluss", d: riverPath(pick(rivers, /^Main$/)), label: xy([10.45, 50.12]) },
];
for (const w of water) if (!w.d) throw new Error("no geometry for " + w.name);
const bodensee = lakes.features.find((f) => f.properties.name === "Bodensee");
water.push({ id: "bodensee", name: "Bodensee", kind: "See", d: Pfine(bodensee), label: xy([9.35, 47.6]), small: true });
// weitere Seen aus dem Lapbook
const lake = (src, re) => { const f = src.features.find((x) => re.test((x.properties.name || "") + "|" + (x.properties.name_de || ""))); if (!f) throw new Error("Kein See " + re); return f; };
water.push({ id: "chiemsee", name: "Chiemsee", kind: "See", d: Pfine(lake(lakesEu, /chiemsee/i)), label: xy([12.45, 47.87]), small: true });
water.push({ id: "mueritz", name: "Müritz", kind: "See", d: Pfine(lake(lakes, /^Müritz/)), label: xy([12.68, 53.43]), small: true });
water.push({ id: "starnberg", name: "Starnberger See", kind: "See", d: Pfine(lake(lakesEu, /Starnberger/)), label: xy([11.32, 47.9]), small: true });
// Seas: rough hit polygons, drawn below the land so only the water part shows.
water.push({
  id: "nordsee", name: "Nordsee", kind: "Meer", label: xy([7.0, 54.45]),
  d: P(handPoly([[2.0, 51.2], [2.0, 57.0], [8.0, 57.0], [8.4, 55.6], [8.9, 54.6], [9.2, 53.7], [8.6, 53.3], [6.5, 53.2], [4.5, 52.4], [3.5, 51.3]])),
});
water.push({
  id: "ostsee", name: "Ostsee", kind: "Meer", label: xy([12.6, 54.75]),
  d: P(handPoly([[9.75, 54.25], [10.0, 57.0], [20.0, 57.0], [20.0, 54.0], [14.8, 53.6], [12.0, 53.9], [10.7, 53.8]])),
});

// ---------- Mountains (hand-drawn approximations) ----------
const MOUNTAINS = [
  { id: "alpenvorland", name: "Alpenvorland", label: [11.6, 48.1], ring: [[9.0, 47.82], [9.25, 48.04], [9.75, 48.24], [10.05, 48.36], [10.8, 48.64], [11.4, 48.7], [12.1, 48.9], [12.9, 48.76], [13.4, 48.52], [13.0, 48.22], [12.85, 47.95], [12.9, 47.72], [12.3, 47.68], [11.6, 47.58], [11.0, 47.56], [10.4, 47.56], [9.75, 47.57], [9.3, 47.68]] },
  { id: "schwarzwald", name: "Schwarzwald", label: [8.15, 48.15], ring: [[8.7, 48.9], [8.4, 48.92], [8.22, 48.78], [8.0, 48.52], [7.88, 48.2], [7.82, 47.95], [7.68, 47.65], [8.2, 47.62], [8.45, 47.75], [8.5, 48.05], [8.43, 48.45], [8.75, 48.62]] },
  { id: "alb", name: "Schwäbische Alb", label: [9.55, 48.42], ring: [[8.68, 48.05], [8.85, 48.3], [9.2, 48.5], [9.65, 48.68], [10.1, 48.86], [10.5, 48.92], [10.55, 48.7], [10.2, 48.58], [9.95, 48.44], [9.7, 48.3], [9.2, 48.12], [8.8, 47.97]] },
  { id: "eifel", name: "Eifel", label: [6.8, 50.3], ring: [[6.25, 50.62], [6.75, 50.65], [7.15, 50.55], [7.45, 50.38], [7.15, 50.12], [6.75, 49.92], [6.4, 50.05], [6.15, 50.35]] },
  { id: "harz", name: "Harz", label: [10.85, 51.72], ring: [[10.25, 51.8], [10.45, 51.92], [10.8, 51.87], [11.2, 51.75], [11.45, 51.62], [11.3, 51.52], [10.85, 51.53], [10.4, 51.62], [10.22, 51.7]] },
  { id: "erzgebirge", name: "Erzgebirge", label: [13.15, 50.62], ring: [[12.3, 50.38], [12.5, 50.58], [12.9, 50.7], [13.35, 50.82], [13.75, 50.85], [14.0, 50.83], [13.95, 50.72], [13.5, 50.55], [13.1, 50.45], [12.7, 50.35]] },
  { id: "bayerwald", name: "Bayerischer Wald", label: [13.1, 49.0], ring: [[12.4, 49.15], [12.8, 49.33], [13.2, 49.15], [13.55, 48.95], [13.83, 48.78], [13.6, 48.6], [13.3, 48.65], [12.95, 48.85], [12.5, 49.0]] },
  // weitere Gebirge aus dem Lapbook
  { id: "rhoen", name: "Rhön", label: [9.98, 50.47], ring: [[9.75, 50.62], [9.98, 50.72], [10.2, 50.62], [10.25, 50.4], [10.08, 50.22], [9.85, 50.25], [9.7, 50.42]] },
  { id: "fichtelgebirge", name: "Fichtelgebirge", label: [11.9, 50.04], ring: [[11.7, 50.15], [11.95, 50.18], [12.15, 50.05], [12.05, 49.92], [11.8, 49.92], [11.65, 50.02]] },
  { id: "thueringerwald", name: "Thüringer Wald", label: [10.8, 50.72], ring: [[10.25, 51.0], [10.5, 50.98], [10.9, 50.78], [11.25, 50.58], [11.42, 50.47], [11.25, 50.4], [10.85, 50.6], [10.48, 50.8], [10.2, 50.92]] },
  // Zugspitze: höchster Berg, als kleiner Punkt
  { id: "zugspitze", name: "Zugspitze", label: [10.985, 47.421], small: true, ring: Array.from({ length: 12 }, (_, i) => [10.985 + 0.07 * Math.cos((i * Math.PI) / 6), 47.421 + 0.045 * Math.sin((i * Math.PI) / 6)]) },
];
const mountains = MOUNTAINS.map((m) => ({ id: m.id, name: m.name, d: P(handPoly(m.ring)), label: xy(m.label), small: !!m.small }));
const alpen = { name: "Alpen", d: P(handPoly([[5.8, 45.5], [6.8, 46.5], [7.9, 46.9], [9.0, 47.15], [9.6, 47.4], [10.2, 47.5], [11.0, 47.5], [12.0, 47.62], [12.9, 47.68], [14.0, 47.82], [15.5, 47.9], [16.3, 47.85], [17.0, 45.5]])), label: xy([12.3, 47.25]) };

const sea = `M0,0H${W}V${H}H0Z`;
const out = { W, H, sea, others, germany: germanyOutline, neighbors, states, water, mountains, alpen };
const js = "// generated by tools/build-map.mjs - do not edit\nconst MAP = " + JSON.stringify(out) + ";\n";
fs.writeFileSync(path.join(root, "public", "mapdata.js"), js);
console.log("mapdata.js", (js.length / 1024).toFixed(0) + " KB");
