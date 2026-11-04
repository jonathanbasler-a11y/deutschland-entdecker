// Lerninhalt der LZK "Deutschland". Alles, was die Lehrerin abfragt, steht hier.
// ACHTUNG: Zahlen/Namen (Einwohner, Kanzler) bitte mit dem Lapbook abgleichen.
const CATS = {
  states: { name: "Bundesländer", short: "Länder", ask: "Welches Bundesland ist markiert?" },
  neighbors: { name: "Nachbarländer", short: "Nachbarn", ask: "Welches Nachbarland ist markiert?" },
  water: { name: "Flüsse, Seen, Meere", short: "Gewässer", ask: "Welches Gewässer ist markiert?" },
  mountains: { name: "Gebirge und Berge", short: "Gebirge", ask: "Welches Gebirge ist markiert?" },
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
  w_starnberg: ["Starnberger"],
};

// Infotexte: nur, wo es liegt und was es ist (keine Zusatzfakten über das Lapbook hinaus).
const INFO = {
  n_dk: "Dänemark ist ein Nachbarland im Norden von Deutschland.",
  n_pl: "Polen ist ein Nachbarland im Osten von Deutschland.",
  n_cz: "Tschechien ist ein Nachbarland im Südosten von Deutschland.",
  n_at: "Österreich ist ein Nachbarland im Süden von Deutschland.",
  n_ch: "Die Schweiz ist ein Nachbarland im Süden von Deutschland.",
  n_fr: "Frankreich ist ein Nachbarland im Südwesten von Deutschland.",
  n_lu: "Luxemburg ist ein kleines Nachbarland im Westen von Deutschland.",
  n_be2: "Belgien ist ein Nachbarland im Westen von Deutschland.",
  n_nl: "Die Niederlande sind ein Nachbarland im Nordwesten von Deutschland.",
  w_rhein: "Der Rhein ist ein Fluss im Westen. Er ist der längste Fluss in Deutschland.",
  w_donau: "Die Donau ist ein Fluss im Süden von Deutschland.",
  w_elbe: "Die Elbe ist ein Fluss im Osten und Norden von Deutschland.",
  w_weser: "Die Weser ist ein Fluss im Norden von Deutschland.",
  w_neckar: "Der Neckar ist ein Fluss in Baden-Württemberg.",
  w_main: "Der Main ist ein Fluss in der Mitte von Deutschland.",
  w_bodensee: "Der Bodensee ist ein See im Süden, an der Grenze zu Österreich und der Schweiz.",
  w_chiemsee: "Der Chiemsee ist ein See in Bayern.",
  w_mueritz: "Die Müritz ist ein See in Mecklenburg-Vorpommern.",
  w_starnberg: "Der Starnberger See ist ein See in Bayern.",
  w_nordsee: "Die Nordsee ist ein Meer im Nordwesten von Deutschland.",
  w_ostsee: "Die Ostsee ist ein Meer im Nordosten von Deutschland.",
  m_bayerwald: "Der Bayerische Wald ist ein Gebirge im Osten von Bayern.",
  m_eifel: "Die Eifel ist ein Gebirge im Westen von Deutschland.",
  m_schwarzwald: "Der Schwarzwald ist ein Gebirge in Baden-Württemberg.",
  m_alpenvorland: "Das Alpenvorland liegt im Süden von Bayern und Baden-Württemberg.",
  m_harz: "Der Harz ist ein Gebirge in der Mitte von Deutschland.",
  m_rhoen: "Die Rhön ist ein Gebirge in der Mitte von Deutschland.",
  m_erzgebirge: "Das Erzgebirge ist ein Gebirge in Sachsen.",
  m_fichtelgebirge: "Das Fichtelgebirge ist ein Gebirge im Nordosten von Bayern.",
  m_alb: "Die Schwäbische Alb ist ein Gebirge in Baden-Württemberg.",
  m_thueringerwald: "Der Thüringer Wald ist ein Gebirge in Thüringen.",
  m_zugspitze: "Die Zugspitze ist ein Berg im Süden von Deutschland.",
};
const STADTSTAATEN = ["Berlin", "Hamburg", "Bremen"];
const WATER_KIND = { rhein: "Fluss", donau: "Fluss", elbe: "Fluss", weser: "Fluss", neckar: "Fluss", main: "Fluss", bodensee: "See", chiemsee: "See", mueritz: "See", starnberg: "See", nordsee: "Meer", ostsee: "Meer" };

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
    write: { q: "Welche sind die drei größten Städte in Deutschland? Schreibe alle drei.", all: ["Berlin", "Hamburg", "München"], show: "Berlin, Hamburg und München" },
    info: "Die drei größten Städte sind Berlin, Hamburg und München." },
  { id: "g_fluss", name: "Längster Fluss", q: "Welcher ist der längste Fluss in Deutschland?",
    options: ["Rhein", "Donau", "Elbe", "Neckar"], correct: 0,
    write: { q: "Welcher ist der längste Fluss in Deutschland?", answers: ["Rhein"], show: "Rhein" },
    info: "Der längste Fluss in Deutschland ist der Rhein." },
  { id: "g_meere", name: "Meere an Deutschland", q: "Welche Meere grenzen an Deutschland?",
    options: ["Nordsee und Ostsee", "Nordsee und Mittelmeer", "Ostsee und Schwarzes Meer", "Atlantik und Mittelmeer"], correct: 0,
    write: { q: "Welche Meere grenzen an Deutschland? Schreibe beide.", all: ["Nordsee", "Ostsee"], show: "Nordsee und Ostsee" },
    info: "Die Nordsee und die Ostsee grenzen an Deutschland. Österreich ist ein Land, kein Meer." },
  { id: "g_flaeche", name: "Fläche", q: "Wie groß ist Deutschland ungefähr?",
    options: ["ca. 357.000 km²", "ca. 35.000 km²", "ca. 3,5 Millionen km²", "ca. 1.000 km²"], correct: 0,
    info: "Deutschland ist 357.588 km² groß." },
  { id: "g_sprache", name: "Sprache", q: "Welche Sprache spricht man in Deutschland?",
    options: ["Deutsch", "Englisch", "Französisch", "Niederländisch"], correct: 0,
    write: { q: "Welche Sprache spricht man in Deutschland?", answers: ["Deutsch"], show: "Deutsch" },
    info: "In Deutschland spricht man Deutsch." },
  // ----- aus dem Lapbook: „Politik in Deutschland“ -----
  { id: "g_praesident", name: "Bundespräsident", q: "Wer ist der Bundespräsident von Deutschland?",
    options: ["Frank-Walter Steinmeier", "Friedrich Merz", "Olaf Scholz", "Joachim Gauck"], correct: 0,
    write: { q: "Wie heißt der Bundespräsident? Schreibe den Nachnamen.", answers: ["Steinmeier", "Frank-Walter Steinmeier", "Frank Walter Steinmeier"], show: "Frank-Walter Steinmeier" },
    info: "Der Bundespräsident ist Frank-Walter Steinmeier." },
  { id: "g_wahl", name: "Nächste Wahl", q: "Wann ist die nächste Bundestagswahl?",
    options: ["März 2029", "Februar 2029", "März 2027", "Mai 2030"], correct: 0,
    write: { q: "Wann ist die nächste Bundestagswahl? Schreibe Monat und Jahr.", answers: ["März 2029"], show: "März 2029" },
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
  { id: "g_hymne_seit", name: "Hymne: seit wann", q: "Seit wann ist die dritte Strophe unsere Nationalhymne?",
    options: ["seit 1991", "seit 1871", "seit 1949", "seit 2006"], correct: 0,
    write: { q: "Seit welchem Jahr ist die dritte Strophe unsere Nationalhymne? Schreibe die Jahreszahl.", num: [1991], show: "1991" },
    info: "Seit 1991 besteht die Hymne aus der dritten Strophe des Deutschlandliedes." },
  { id: "g_hymne_wann", name: "Hymne: wann gesungen", q: "Wann wird die Nationalhymne gesungen?",
    options: ["bei feierlichen Anlässen und vor Fußballspielen der Nationalmannschaft", "jeden Morgen in der Schule", "nur an Weihnachten", "nur an Geburtstagen"], correct: 0,
    info: "Die Hymne wird bei feierlichen politischen oder sportlichen Anlässen gesungen, zum Beispiel vor Fußballspielen der deutschen Mannschaft." },
  { id: "g_hymne_l1", name: "Hymne: Zeile 1", q: "Ergänze die Hymne: Einigkeit und Recht und Freiheit für das deutsche …",
    options: ["Vaterland", "Volk", "Land", "Glück"], correct: 0,
    write: { q: "Ergänze die Hymne: Einigkeit und Recht und Freiheit für das deutsche …", answers: ["Vaterland"], show: "Vaterland" },
    info: "Einigkeit und Recht und Freiheit für das deutsche Vaterland!" },
  { id: "g_hymne_l2", name: "Hymne: Zeile 2", q: "Ergänze die Hymne: Danach lasst uns alle streben brüderlich mit Herz und …",
    options: ["Hand", "Mut", "Seele", "Kraft"], correct: 0,
    write: { q: "Ergänze die Hymne: Danach lasst uns alle streben brüderlich mit Herz und …", answers: ["Hand"], show: "Hand" },
    info: "Danach lasst uns alle streben brüderlich mit Herz und Hand!" },
  { id: "g_hymne_l3", name: "Hymne: Zeile 3", q: "Ergänze die Hymne: Einigkeit und Recht und Freiheit sind des Glückes …",
    options: ["Unterpfand", "Vaterland", "Freude", "Heimat"], correct: 0,
    write: { q: "Ergänze die Hymne: Einigkeit und Recht und Freiheit sind des Glückes …", answers: ["Unterpfand"], show: "Unterpfand" },
    info: "Einigkeit und Recht und Freiheit sind des Glückes Unterpfand." },
  { id: "g_hymne_l4", name: "Hymne: Zeile 4", q: "Ergänze die Hymne: Blüh im Glanze dieses Glückes, blühe, deutsches …",
    options: ["Vaterland", "Land", "Volk", "Reich"], correct: 0,
    write: { q: "Ergänze die Hymne: Blüh im Glanze dieses Glückes, blühe, deutsches …", answers: ["Vaterland"], show: "Vaterland" },
    info: "Blüh im Glanze dieses Glückes, blühe, deutsches Vaterland!" },
];

// Nummern wie auf den Karten im Lapbook (Gebirge und „Flüsse und Seen“).
// Zugspitze (im Lapbook ein roter Punkt) bekommt die 11, Nord- und Ostsee die 11 und 12.
const BLANK_NUM = {
  m_bayerwald: 1, m_eifel: 2, m_schwarzwald: 3, m_alpenvorland: 4, m_harz: 5, m_rhoen: 6, m_erzgebirge: 7, m_fichtelgebirge: 8, m_alb: 9, m_thueringerwald: 10, m_zugspitze: 11,
  w_rhein: 1, w_donau: 2, w_elbe: 3, w_weser: 4, w_main: 5, w_neckar: 6, w_bodensee: 7, w_chiemsee: 8, w_mueritz: 9, w_starnberg: 10, w_nordsee: 11, w_ostsee: 12,
};
// Beschriftungen, die sonst übereinander lägen (Verschiebung in Karteneinheiten)
const LABEL_SHIFT = { w_starnberg: [-62, 26], w_chiemsee: [34, 26], w_bodensee: [-10, 26] };

// Inhaltliche Fehler aus dem Lapbook: kommen in jeder Übung öfter dran, bis sie sicher sitzen.
const FOCUS = ["g_meere"];

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
  info: s.name + (STADTSTAATEN.includes(s.name) ? " ist ein Bundesland und ein Stadtstaat." : " ist ein Bundesland."),
}));
MAP.neighbors.forEach((n) => ITEMS.push({
  id: "n_" + n.id, cat: "neighbors", name: n.name, alts: ALTS["n_" + n.id] || [], d: n.d, label: n.label, small: n.small,
  skills: ["choice", "tap", "write"], info: INFO["n_" + n.id],
}));
MAP.water.forEach((w) => ITEMS.push({
  id: "w_" + w.id, cat: "water", name: w.name, alts: ALTS["w_" + w.id] || [], d: w.d, label: w.label, small: WATER_KIND[w.id] === "See",
  kind: WATER_KIND[w.id], skills: ["choice", "tap", "write"], info: INFO["w_" + w.id],
}));
MAP.mountains.forEach((m) => ITEMS.push({
  id: "m_" + m.id, cat: "mountains", name: m.name, alts: ALTS["m_" + m.id] || [],
  d: m.d, label: m.label, small: m.small, skills: ["choice", "tap", "write"], info: INFO["m_" + m.id],
  kind: m.id === "zugspitze" ? "Berg" : undefined, ask: m.id === "zugspitze" ? "Welcher Berg ist markiert?" : undefined,
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
