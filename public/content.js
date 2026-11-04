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
  n_cz: ["Tschechische Republik"],
  m_alb: ["Schwäbische Alb", "Alb"],
  m_alpenvorland: ["Alpen Vorland"],
};

const INFO = {
  n_dk: "Dänemark liegt im Norden, Hauptstadt: Kopenhagen.",
  n_pl: "Polen liegt im Osten, Hauptstadt: Warschau.",
  n_cz: "Tschechien liegt im Südosten, Hauptstadt: Prag.",
  n_at: "Österreich liegt im Süden, Hauptstadt: Wien.",
  n_ch: "Die Schweiz liegt im Süden, Hauptstadt: Bern.",
  n_fr: "Frankreich liegt im Südwesten, Hauptstadt: Paris.",
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
    write: { q: "Wie viele Millionen Menschen leben ungefähr in Deutschland? Schreibe die Zahl.", num: [80, 81, 82, 83, 84, 85], show: "ca. 84 Millionen" },
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

  // ----- aus dem Lapbook: „Allgemeines zu Deutschland“ -----
  { id: "g_groesstes", name: "Größtes Bundesland", q: "Welches ist das größte Bundesland?",
    options: ["Bayern", "Niedersachsen", "Baden-Württemberg", "Nordrhein-Westfalen"], correct: 0,
    write: { q: "Welches ist das größte Bundesland?", answers: ["Bayern"], show: "Bayern" },
    info: "Bayern ist das größte Bundesland." },
  { id: "g_kleinstes", name: "Kleinstes Bundesland", q: "Welches ist das kleinste Bundesland?",
    options: ["Bremen", "Saarland", "Hamburg", "Berlin"], correct: 0,
    write: { q: "Welches ist das kleinste Bundesland?", answers: ["Bremen"], show: "Bremen" },
    info: "Bremen ist das kleinste Bundesland." },
  { id: "g_staedte", name: "Drei größte Städte", q: "Welche sind die drei größten Städte in Deutschland?",
    options: ["Berlin, Hamburg, München", "Berlin, Köln, Stuttgart", "Hamburg, Bremen, Kiel", "München, Frankfurt, Dresden"], correct: 0,
    write: { q: "Nenne eine der drei größten Städte in Deutschland.", answers: ["Berlin", "Hamburg", "München"], show: "Berlin, Hamburg oder München" },
    info: "Die drei größten Städte sind Berlin, Hamburg und München." },
  { id: "g_fluss", name: "Längster Fluss", q: "Welcher ist der längste Fluss in Deutschland?",
    options: ["Rhein", "Donau", "Elbe", "Neckar"], correct: 0,
    write: { q: "Welcher ist der längste Fluss in Deutschland?", answers: ["Rhein"], show: "Rhein" },
    info: "Der längste Fluss in Deutschland ist der Rhein." },
  { id: "g_meere", name: "Meere an Deutschland", q: "Welche Meere grenzen an Deutschland?",
    options: ["Nordsee und Ostsee", "Nordsee und Mittelmeer", "Ostsee und Schwarzes Meer", "Atlantik und Mittelmeer"], correct: 0,
    write: { q: "Nenne ein Meer, das an Deutschland grenzt.", answers: ["Nordsee", "Ostsee"], show: "Nordsee oder Ostsee" },
    info: "Die Nordsee und die Ostsee grenzen an Deutschland. Österreich ist ein Land, kein Meer." },
  { id: "g_flaeche", name: "Fläche", q: "Wie groß ist Deutschland ungefähr?",
    options: ["ca. 357.000 km²", "ca. 35.000 km²", "ca. 3,5 Millionen km²", "ca. 1.000 km²"], correct: 0,
    info: "Deutschland ist 357.588 km² groß." },
  { id: "g_sprache", name: "Sprache", q: "Welche Sprache spricht man in Deutschland?",
    options: ["Deutsch", "Englisch", "Französisch", "Niederländisch"], correct: 0,
    write: { q: "Welche Sprache spricht man in Deutschland?", answers: ["Deutsch"], show: "Deutsch" },
    info: "In Deutschland spricht man Deutsch." },
  { id: "g_berg", name: "Höchster Berg", q: "Wie heißt der höchste Berg Deutschlands?",
    options: ["Zugspitze", "Feldberg", "Brocken", "Watzmann"], correct: 0,
    write: { q: "Wie heißt der höchste Berg Deutschlands?", answers: ["Zugspitze"], show: "Zugspitze" },
    info: "Die Zugspitze in den Alpen ist der höchste Berg Deutschlands." },
  // ----- aus dem Lapbook: „Politik in Deutschland“ -----
  { id: "g_praesident", name: "Bundespräsident", q: "Wer ist der Bundespräsident von Deutschland?",
    options: ["Frank-Walter Steinmeier", "Friedrich Merz", "Olaf Scholz", "Joachim Gauck"], correct: 0,
    write: { q: "Wie heißt der Bundespräsident? Schreibe den Nachnamen.", answers: ["Steinmeier", "Frank-Walter Steinmeier", "Frank Walter Steinmeier"], show: "Frank-Walter Steinmeier" },
    info: "Der Bundespräsident ist Frank-Walter Steinmeier." },
  { id: "g_wahl", name: "Nächste Wahl", q: "Wann ist die nächste Bundestagswahl?",
    options: ["2029", "2026", "2027", "2031"], correct: 0,
    write: { q: "In welchem Jahr ist die nächste Bundestagswahl? Schreibe die Jahreszahl.", num: [2029], show: "2029" },
    info: "Die nächste Bundestagswahl ist im März 2029." },
  // ----- aus dem Lapbook: „Die Nationalhymne“ -----
  { id: "g_hymne_text", name: "Hymne: Text", q: "Wer hat den Text der Nationalhymne geschrieben?",
    options: ["Heinrich Hoffmann von Fallersleben", "Joseph Haydn", "Johann Wolfgang von Goethe", "Friedrich Schiller"], correct: 0,
    write: { q: "Wer hat den Text der Nationalhymne geschrieben?", answers: ["Heinrich Hoffmann von Fallersleben", "Hoffmann von Fallersleben"], show: "Heinrich Hoffmann von Fallersleben" },
    info: "Den Text hat Heinrich Hoffmann von Fallersleben geschrieben." },
  { id: "g_hymne_melodie", name: "Hymne: Melodie", q: "Wer hat die Melodie der Nationalhymne komponiert?",
    options: ["Joseph Haydn", "Heinrich Hoffmann von Fallersleben", "Wolfgang Amadeus Mozart", "Ludwig van Beethoven"], correct: 0,
    write: { q: "Wer hat die Melodie der Nationalhymne komponiert?", answers: ["Joseph Haydn", "Haydn", "Josef Haydn"], show: "Joseph Haydn" },
    info: "Die Melodie ist von Joseph Haydn." },
  { id: "g_hymne_strophe", name: "Hymne: Strophe", q: "Welche Strophe des Deutschlandliedes ist unsere Nationalhymne?",
    options: ["die dritte Strophe", "die erste Strophe", "die zweite Strophe", "alle drei Strophen"], correct: 0,
    info: "Seit 1991 besteht die Hymne aus der dritten Strophe des Deutschlandliedes." },
  { id: "g_hymne_anfang", name: "Hymne: Anfang", q: "Wie beginnt die Nationalhymne?",
    options: ["Einigkeit und Recht und Freiheit", "Freude, schöner Götterfunken", "Kein schöner Land in dieser Zeit", "Der Mond ist aufgegangen"], correct: 0,
    info: "Die Hymne beginnt mit: Einigkeit und Recht und Freiheit für das deutsche Vaterland." },
];

// Nummern wie auf den Karten im Lapbook (Gebirge und „Flüsse und Seen“).
// Lücken gehören zu Dingen, die nicht in der LZK abgefragt werden (z. B. 5 Main, 6 Rhön).
const BLANK_NUM = {
  m_bayerwald: 1, m_eifel: 2, m_schwarzwald: 3, m_alpenvorland: 4, m_harz: 5, m_erzgebirge: 7, m_alb: 9,
  w_rhein: 1, w_donau: 2, w_elbe: 3, w_weser: 4, w_neckar: 6, w_bodensee: 7, w_nordsee: 11, w_ostsee: 12,
};

// Schreibfallen: so stand es im Lapbook. Diese Begriffe kommen beim Schreiben öfter dran.
const LAPBOOK_SPELLING = {
  n_dk: "Denemark", n_nl: "Niderlande", n_lu: "Luchsenburg", n_ch: "Schweitz", n_at: "Österoich",
  s_ni: "nidersachsen", s_bw: "Badenwürtten Berg",
  w_rhein: "Reien (längster Fluss)", w_weser: "weser",
  g_hauptstadt: "Bertien", g_kanzler: "Mertz", g_meere: "Österreich (ist kein Meer)", g_wahl: "martz 2029",
  g_praesident: "Frank walter (Nachname fehlt)", g_fluss: "Reien",
};

const ITEMS = [];
MAP.states.forEach((s) => ITEMS.push({
  id: "s_" + s.id, cat: "states", name: s.name, alts: ALTS["s_" + s.id] || [], d: s.d, label: s.label, small: s.small,
  skills: ["choice", "tap", "write"], hue: STATE_HUES[s.id],
  info: s.name + (STADTSTAATEN.includes(s.name) ? " ist ein Stadtstaat." : " ist ein Bundesland.") + " Hauptstadt: " + s.capital + ".",
}));
MAP.neighbors.forEach((n) => ITEMS.push({
  id: "n_" + n.id, cat: "neighbors", name: n.name, alts: ALTS["n_" + n.id] || [], d: n.d, label: n.label, small: n.small,
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
