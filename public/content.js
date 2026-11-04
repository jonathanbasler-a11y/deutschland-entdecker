// Lerninhalt der LZK "Deutschland". Alles, was die Lehrerin abfragt, steht hier.
// ACHTUNG: Zahlen/Namen (Einwohner, Kanzler) bitte mit dem Lapbook abgleichen.
const CATS = {
  states: { name: "Bundesländer", short: "Länder", ask: "Welches Bundesland ist markiert?" },
  neighbors: { name: "Nachbarländer", short: "Nachbarn", ask: "Welches Nachbarland ist markiert?" },
  water: { name: "Flüsse, Seen, Meere", short: "Gewässer", ask: "Welches Gewässer ist markiert?" },
  mountains: { name: "Gebirge", short: "Gebirge", ask: "Welches Gebirge ist markiert?" },
  general: { name: "Allgemeines", short: "Allgemeines", ask: "" },
};
const MAP_CATS = ["states", "neighbors", "water", "mountains"];
const TOPICS = ["states", "neighbors", "water", "mountains", "general", "all"];

// Eigene Farbe pro Bundesland: So wird die Karte bunt, wenn er sie kann.
const STATE_HUES = {
  bw: "#f4c430", by: "#4f9df7", be: "#ef6a6a", bb: "#a98bff", hb: "#ff9a5c", hh: "#35c6b8", he: "#f08ac0", mv: "#6fd486",
  ni: "#ffae3d", nw: "#52c1f5", rp: "#b7dd5c", sl: "#ff7d9a", st: "#8fa8ff", sn: "#4fd1a1", sh: "#7fd1e8", th: "#e8a35e",
};

const ALTS = {
  s_nw: ["NRW"],
  s_mv: ["Mecklenburg Vorpommern", "MV"],
  s_bw: ["Baden Württemberg"],
  m_bayerwald: ["Bayrischer Wald", "Bayerwald"],
  m_alb: ["Schwäbische Alb", "Alb"],
  m_alpenvorland: ["Alpen Vorland"],
};

const INFO = {
  n_dk: "Dänemark liegt im Norden, Hauptstadt: Kopenhagen.",
  n_pl: "Polen liegt im Osten, Hauptstadt: Warschau.",
  n_cz: "Tschechien liegt im Südosten, Hauptstadt: Prag.",
  n_at: "Österreich liegt im Süden, Hauptstadt: Wien.",
  n_ch: "Die Schweiz liegt im Süden, Hauptstadt: Bern.",
  n_fr: "Frankreich liegt im Westen, Hauptstadt: Paris.",
  n_lu: "Luxemburg ist ein kleines Land im Westen, Hauptstadt: Luxemburg.",
  n_be2: "Belgien liegt im Westen, Hauptstadt: Brüssel.",
  n_nl: "Die Niederlande liegen im Nordwesten, Hauptstadt: Amsterdam.",
  w_rhein: "Der Rhein entspringt in den Schweizer Alpen und fließt in die Nordsee.",
  w_donau: "Die Donau entspringt im Schwarzwald und fließt ins Schwarze Meer.",
  w_elbe: "Die Elbe kommt aus Tschechien, fließt an Hamburg vorbei und mündet in die Nordsee.",
  w_weser: "Die Weser fließt an Bremen vorbei und mündet in die Nordsee.",
  w_neckar: "Der Neckar fließt durch Stuttgart und mündet bei Mannheim in den Rhein.",
  w_bodensee: "Am Bodensee treffen sich drei Länder: Deutschland, Österreich und die Schweiz.",
  w_nordsee: "Die Nordsee liegt im Nordwesten von Deutschland.",
  w_ostsee: "Die Ostsee liegt im Nordosten von Deutschland.",
  m_alpenvorland: "Das Alpenvorland liegt im Süden von Bayern und Baden-Württemberg, nördlich der Alpen.",
  m_schwarzwald: "Der Schwarzwald liegt in Baden-Württemberg. Sein höchster Berg ist der Feldberg.",
  m_alb: "Die Schwäbische Alb liegt in Baden-Württemberg, zwischen Neckar und Donau.",
  m_eifel: "Die Eifel liegt im Westen, in Rheinland-Pfalz und Nordrhein-Westfalen.",
  m_harz: "Der Harz liegt in der Mitte von Deutschland. Sein höchster Berg ist der Brocken.",
  m_erzgebirge: "Das Erzgebirge liegt in Sachsen, an der Grenze zu Tschechien.",
  m_bayerwald: "Der Bayerische Wald liegt im Osten von Bayern, an der Grenze zu Tschechien.",
};
const STADTSTAATEN = ["Berlin", "Hamburg", "Bremen"];
const WATER_KIND = { rhein: "Fluss", donau: "Fluss", elbe: "Fluss", weser: "Fluss", neckar: "Fluss", bodensee: "See", nordsee: "Meer", ostsee: "Meer" };

// Allgemeine Fragen. options + correct = Auswahl, write = Schreiben (nur wenn sinnvoll).
const GENERAL = [
  { id: "g_einwohner", name: "Einwohnerzahl", q: "Wie viele Menschen leben ungefähr in Deutschland?",
    options: ["ca. 8 Millionen", "ca. 38 Millionen", "ca. 84 Millionen", "ca. 150 Millionen"], correct: 2,
    write: { q: "Wie viele Millionen Menschen leben ungefähr in Deutschland? Schreibe die Zahl.", num: [83, 84, 85], show: "ca. 84 Millionen" },
    info: "In Deutschland leben ungefähr 84 Millionen Menschen." },
  { id: "g_laender", name: "Zahl der Bundesländer", q: "Aus wie vielen Bundesländern besteht Deutschland?",
    options: ["9", "12", "16", "20"], correct: 2,
    write: { q: "Aus wie vielen Bundesländern besteht Deutschland? Schreibe die Zahl.", num: [16], show: "16" },
    info: "Deutschland hat 16 Bundesländer." },
  { id: "g_stadtstaaten", name: "Zahl der Stadtstaaten", q: "Wie viele Stadtstaaten hat Deutschland?",
    options: ["1", "3", "5", "16"], correct: 1,
    write: { q: "Wie viele Stadtstaaten hat Deutschland? Schreibe die Zahl.", num: [3], show: "3" },
    info: "Deutschland hat 3 Stadtstaaten: Berlin, Hamburg und Bremen." },
  { id: "g_stadtstaat_namen", name: "Welche Stadtstaaten", q: "Welche drei Bundesländer sind Stadtstaaten?",
    options: ["Berlin, Hamburg, Bremen", "Berlin, München, Köln", "Hamburg, Bremen, Kiel", "Bremen, Dresden, Berlin"], correct: 0,
    write: { q: "Nenne einen der drei Stadtstaaten.", answers: STADTSTAATEN, show: "Berlin, Hamburg oder Bremen" },
    info: "Die Stadtstaaten sind Berlin, Hamburg und Bremen." },
  { id: "g_stadtstaat_begriff", name: "Was ist ein Stadtstaat", q: "Was ist ein Stadtstaat?",
    options: ["Eine Stadt, die zugleich ein eigenes Bundesland ist", "Die größte Stadt in einem Bundesland", "Eine Stadt am Meer", "Eine Stadt mit mehr als 1 Million Menschen"], correct: 0,
    info: "Ein Stadtstaat ist eine Stadt, die zugleich ein eigenes Bundesland ist." },
  { id: "g_flagge", name: "Flagge", q: "Baue die Flagge von Deutschland. Tippe die Farben von oben nach unten.", flag: true,
    info: "Die Flagge von Deutschland ist Schwarz-Rot-Gold, von oben nach unten." },
  { id: "g_kanzler", name: "Bundeskanzler", q: "Wer ist der aktuelle Bundeskanzler von Deutschland?",
    options: ["Friedrich Merz", "Olaf Scholz", "Angela Merkel", "Robert Habeck"], correct: 0,
    write: { q: "Wie heißt der aktuelle Bundeskanzler? Schreibe den Nachnamen.", answers: ["Merz", "Friedrich Merz"], show: "Friedrich Merz" },
    info: "Der aktuelle Bundeskanzler ist Friedrich Merz." },
  { id: "g_eu", name: "Mitglied der EU", q: "Ist Deutschland Mitglied der Europäischen Union (EU)?",
    options: ["Ja", "Nein"], correct: 0,
    info: "Ja, Deutschland ist Mitglied der EU." },
  { id: "g_hauptstadt", name: "Hauptstadt", q: "Wie heißt die Hauptstadt von Deutschland?",
    options: ["Hamburg", "München", "Berlin", "Bonn"], correct: 2,
    write: { q: "Wie heißt die Hauptstadt von Deutschland?", answers: ["Berlin"], show: "Berlin" },
    info: "Die Hauptstadt von Deutschland ist Berlin." },
  { id: "g_nachbarn", name: "Zahl der Nachbarländer", q: "Wie viele Nachbarländer hat Deutschland?",
    options: ["5", "7", "9", "12"], correct: 2,
    write: { q: "Wie viele Nachbarländer hat Deutschland? Schreibe die Zahl.", num: [9], show: "9" },
    info: "Deutschland hat 9 Nachbarländer." },
  { id: "g_waehrung", name: "Währung", q: "Wie heißt das Geld in Deutschland?",
    options: ["Euro", "Dollar", "Franken", "Mark"], correct: 0,
    write: { q: "Wie heißt das Geld in Deutschland?", answers: ["Euro"], show: "Euro" },
    info: "In Deutschland bezahlt man mit Euro." },
];

const ITEMS = [];
MAP.states.forEach((s) => ITEMS.push({
  id: "s_" + s.id, cat: "states", name: s.name, alts: ALTS["s_" + s.id] || [], d: s.d, label: s.label, small: s.small,
  skills: ["choice", "tap", "write"], hue: STATE_HUES[s.id],
  info: s.name + (STADTSTAATEN.includes(s.name) ? " ist ein Stadtstaat." : " ist ein Bundesland.") + " Hauptstadt: " + s.capital + ".",
}));
MAP.neighbors.forEach((n) => ITEMS.push({
  id: "n_" + n.id, cat: "neighbors", name: n.name, alts: [], d: n.d, label: n.label, small: n.small,
  skills: ["choice", "tap", "write"], info: INFO["n_" + n.id],
}));
MAP.water.forEach((w) => ITEMS.push({
  id: "w_" + w.id, cat: "water", name: w.name, alts: [], d: w.d, label: w.label, small: w.id === "bodensee",
  kind: WATER_KIND[w.id], skills: ["choice", "tap", "write"], info: INFO["w_" + w.id],
}));
MAP.mountains.forEach((m) => ITEMS.push({
  id: "m_" + m.id, cat: "mountains", name: m.name === "Bayerischer Wald" ? "Bayerischer Wald" : m.name, alts: ALTS["m_" + m.id] || [],
  d: m.d, label: m.label, skills: ["choice", "tap", "write"], info: INFO["m_" + m.id],
}));
GENERAL.forEach((g) => ITEMS.push({
  id: g.id, cat: "general", name: g.name, alts: [], g, skills: g.write ? ["choice", "write"] : ["choice"], info: g.info,
}));
const BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const SKILL_NAME = { choice: "Auswählen", tap: "Finden", write: "Schreiben" };

const RANKS = [
  { xp: 0, name: "Kartenleser" },
  { xp: 150, name: "Wegfinder" },
  { xp: 400, name: "Entdecker" },
  { xp: 800, name: "Kartenprofi" },
  { xp: 1500, name: "Deutschland-Profi" },
];
const LZK_DATE = "2026-11-10";
