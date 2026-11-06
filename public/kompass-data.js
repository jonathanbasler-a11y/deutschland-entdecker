// Kompass 4 Deutsch: Aufgabenbank (eigene Aufgaben im Stil der Vorjahrestests).
// Meldet sich bei kompass-logic.js an; in Node: require(...).BANK
(function (root) {
  "use strict";

  /* ---------- Sätze mit Wortarten: N Nomen, V Verb, A Adjektiv, x anderes ---------- */
  // Jeder Satz: Wörter mit Wortart; subj/pred: Positionen von Subjekt und Prädikat (falls angegeben)
  const S = (txt, tags, subj, pred) => ({ words: txt.split(" "), tags: tags.split(" "), subj, pred });
  const SAETZE = [
    S("Der kleine Hund bellt laut.", "x A N V A", [0, 1, 2], [3]),
    S("Im Garten wachsen bunte Blumen.", "x N V A N"),
    S("Meine Schwester liest ein spannendes Buch.", "x N V x A N", [0, 1], [2]),
    S("Am Morgen trinkt Opa heißen Tee.", "x N V N A N", [3], [2]),
    S("Die müden Kinder schlafen tief.", "x A N V A", [0, 1, 2], [3]),
    S("Der Fuchs schleicht leise durch den dunklen Wald.", "x N V A x x A N", [0, 1], [2]),
    S("Lisa malt ein rotes Haus mit einem großen Fenster.", "N V x A N x x A N", [0], [1]),
    S("Im Sommer schwimmen wir oft im warmen See.", "x N V x x x A N", [3], [2]),
    S("Der Bäcker backt frische Brötchen.", "x N V A N", [0, 1], [2]),
    S("Die Katze fängt eine schnelle Maus.", "x N V x A N", [0, 1], [2]),
    S("Unser Lehrer erklärt die Aufgabe genau.", "x N V x N A", [0, 1], [2]),
    S("Tom und Ben spielen im Park Fußball.", "N x N V x N N", [0, 1, 2], [3]),
    S("Die Klasse hat einen Ausflug gemacht.", "x N V x N V", [0, 1], [2, 5]),
    S("Morgen fährt Mia mit dem Zug nach Berlin.", "x V N x x N x N", [2], [1]),
  ];
  const clean = (w) => w.replace(/[.,!?]$/, "");
  const WA = { N: ["Nomen", "Nomen schreibt man groß. Du kannst einen Artikel davorsetzen: der, die, das."], V: ["Verben", "Verben sagen, was jemand tut oder was passiert."], A: ["Adjektive", "Adjektive sagen, wie etwas ist."] };
  const wortart = [];
  for (const s of SAETZE) {
    for (const k of ["N", "V", "A"]) {
      const ans = s.tags.map((t, i) => (t === k ? i : -1)).filter((i) => i >= 0);
      if (!ans.length) continue;
      wortart.push({ type: "pick", q: `Tippe alle ${WA[k][0]} an.`, tokens: s.words.map(clean), ans,
        tip: WA[k][1], explain: `${WA[k][0]}: ${ans.map((i) => clean(s.words[i])).join(", ")}` });
    }
  }
  const satzglied = [];
  for (const s of SAETZE) {
    if (s.pred) satzglied.push({ type: "pick", q: "Tippe das Prädikat an. Es kann aus zwei Teilen bestehen.", tokens: s.words.map(clean), ans: s.pred,
      tip: "Das Prädikat ist das Verb im Satz. Frage: Was tut jemand?", explain: `Prädikat: ${s.pred.map((i) => clean(s.words[i])).join(" … ")}` });
    if (s.subj) satzglied.push({ type: "pick", q: "Tippe das Subjekt an (alle Wörter, die dazugehören).", tokens: s.words.map(clean), ans: s.subj,
      tip: "Frage: Wer oder was tut etwas? Der Artikel gehört mit dazu.", explain: `Subjekt: ${s.subj.map((i) => clean(s.words[i])).join(" ")}` });
  }

  /* ---------- Zeitformen ---------- */
  const ZF = ["Präsens", "Präteritum", "Perfekt", "Futur"];
  const zf = (s, z) => ({ type: "choice", fixed: true, q: `In welcher Zeitform steht der Satz? „${s}“`, opts: ZF, ans: ZF.indexOf(z),
    tip: "Präsens: jetzt. Präteritum: früher, ein Wort (ging). Perfekt: früher, zwei Teile (ist gegangen). Futur: später (wird gehen).",
    explain: `„${s}“ steht im ${z}.` });
  const zeitform = [
    zf("Ich spiele Fußball.", "Präsens"), zf("Wir spielten im Garten.", "Präteritum"), zf("Er hat einen Brief geschrieben.", "Perfekt"),
    zf("Sie wird morgen kommen.", "Futur"), zf("Die Kinder liefen nach Hause.", "Präteritum"), zf("Ich bin nach Hause gegangen.", "Perfekt"),
    zf("Der Hund schläft im Körbchen.", "Präsens"), zf("Wir werden ins Kino gehen.", "Futur"), zf("Mama kaufte Brot.", "Präteritum"),
    zf("Du hast gut gesungen.", "Perfekt"),
  ];
  const vf = (q, opts, explain, tip) => ({ type: "choice", q, opts, ans: 0, tip, explain });
  const verbform = [
    vf("Setze ins Präteritum: „Wir gehen ins Kino.“ → Wir ___ ins Kino.", ["gingen", "gehen", "sind gegangen", "gehten"], "Präteritum von gehen: wir gingen.", "Präteritum ist ein Wort und erzählt von früher."),
    vf("Setze ins Präteritum: „Ich esse einen Apfel.“ → Ich ___ einen Apfel.", ["aß", "esse", "esste", "gegessen"], "Präteritum von essen: ich aß.", "Manche Verben ändern sich ganz: essen – aß."),
    vf("Setze ins Präteritum: „Sie schreibt einen Brief.“ → Sie ___ einen Brief.", ["schrieb", "schreibte", "schreibt", "geschrieben"], "Präteritum von schreiben: sie schrieb.", "Sprich laut: Gestern … sie einen Brief."),
    vf("Setze ins Präteritum: „Er läuft schnell.“ → Er ___ schnell.", ["lief", "laufte", "läuft", "gelaufen"], "Präteritum von laufen: er lief.", "Sprich laut: Gestern … er schnell."),
    vf("Setze ins Perfekt: „Wir sehen einen Film.“ → Wir haben einen Film ___.", ["gesehen", "gesieht", "sahen", "sehen"], "Perfekt: wir haben … gesehen.", "Im Perfekt steht hinten das Partizip mit ge-."),
    vf("Setze ins Perfekt: „Ich fahre Rad.“ → Ich bin Rad ___.", ["gefahren", "gefahrt", "fuhr", "fahre"], "Perfekt: ich bin … gefahren.", "Im Perfekt steht hinten das Partizip mit ge-."),
    vf("Setze ins Präteritum: „Die Kinder singen ein Lied.“ → Die Kinder ___ ein Lied.", ["sangen", "singten", "gesungen", "singen"], "Präteritum von singen: sie sangen.", "Sprich laut: Gestern … die Kinder ein Lied."),
    vf("Setze ins Präteritum: „Er bringt das Paket.“ → Er ___ das Paket.", ["brachte", "bringte", "brang", "gebracht"], "Präteritum von bringen: er brachte.", "Sprich laut: Gestern … er das Paket."),
    vf("Setze ins Futur: „Morgen regnet es.“ → Morgen ___ es regnen.", ["wird", "hat", "ist", "war"], "Futur: es wird regnen.", "Futur bildest du mit werden."),
  ];

  /* ---------- Wortfamilien ---------- */
  const wf = (stamm, list, odd) => ({ type: "choice", q: `Welches Wort gehört NICHT zur Wortfamilie „${stamm}“?`, opts: [odd].concat(list), ans: 0,
    tip: "Wörter einer Wortfamilie haben den gleichen Wortstamm.", explain: `„${odd}“ hat einen anderen Wortstamm. ${list.join(", ")} gehören zu „${stamm}“.` });
  const wortfamilie = [
    wf("fahren", ["Fahrrad", "Fahrer", "Abfahrt"], "Farbe"),
    wf("spielen", ["Spielplatz", "Spieler", "verspielt"], "Spiegel"),
    wf("wohnen", ["Wohnung", "Bewohner", "wohnlich"], "Wolke"),
    wf("Sonne", ["sonnig", "Sonnenschein", "Sonnenblume"], "Sohn"),
    wf("schreiben", ["Schreibtisch", "Schreiber", "beschreiben"], "Schrank"),
    wf("lesen", ["Leser", "Lesebuch", "vorlesen"], "Lehrer"),
    wf("Kind", ["kindlich", "Kindheit", "Kindergarten"], "Kino"),
    wf("backen", ["Bäcker", "Bäckerei", "Backofen"], "Bach"),
    wf("Haus", ["Häuschen", "Hausaufgabe", "Haustür"], "Hase"),
    wf("kalt", ["Kälte", "erkälten", "eiskalt"], "Kante"),
  ];

  /* ---------- Zusammengesetzte Wörter ---------- */
  const zw = (a, b, ans) => ({ type: "write", q: `Bilde ein zusammengesetztes Nomen: ${a} + ${b}`, ans: [ans], art: true,
    tip: "Schreibe beide Wörter zusammen. Das neue Nomen schreibt man groß, das zweite Wort klein.", explain: `${a} + ${b} = ${ans}` });
  const zart = (w, art) => ({ type: "choice", fixed: true, q: `Welcher Artikel gehört zu „${w}“?`, opts: ["der", "die", "das"], ans: ["der", "die", "das"].indexOf(art),
    tip: "Bei zusammengesetzten Nomen bestimmt das letzte Wort den Artikel.", explain: `${art} ${w}` });
  const zteil = (w, right, wrong) => ({ type: "choice", q: `Aus welchen Wörtern besteht „${w}“?`, opts: [right].concat(wrong), ans: 0,
    tip: "Suche zwei Wörter, die du kennst.", explain: `${w} = ${right}` });
  const zusammen = [
    zw("das Haus", "die Tür", "Haustür"), zw("die Schule", "die Tasche", "Schultasche"), zw("der Apfel", "der Baum", "Apfelbaum"),
    zw("die Sonne", "die Brille", "Sonnenbrille"), zw("die Hand", "der Schuh", "Handschuh"), zw("der Zahn", "die Bürste", "Zahnbürste"),
    zw("der Winter", "die Jacke", "Winterjacke"), zw("der Regen", "der Schirm", "Regenschirm"),
    zart("Haustür", "die"), zart("Apfelbaum", "der"), zart("Schulbuch", "das"), zart("Sonnenbrille", "die"), zart("Kinderzimmer", "das"), zart("Fußball", "der"),
    zteil("Fahrradhelm", "Fahrrad + Helm", ["Fahr + Radhelm", "Fahrradh + Elm", "fahren + Rad"]),
    zteil("Geburtstagskuchen", "Geburtstag + Kuchen", ["Geburt + Stagskuchen", "Geburtstags + Kuchen + Torte", "Tag + Kuchen"]),
  ];

  /* ---------- Steigerung ---------- */
  const st = (a, b, c, ask) => {
    const show = [a, b, c].map((w, i) => (i === ask ? "___" : w)).join(" – ");
    return { type: "write", q: `Steigere das Adjektiv: ${show}`, ans: [[a, b, c][ask]],
      tip: "Grundform – 1. Steigerungsstufe (-er) – 2. Steigerungsstufe (am …-sten).", explain: `${a} – ${b} – ${c}` };
  };
  const steigerung = [
    st("groß", "größer", "am größten", 2), st("klein", "kleiner", "am kleinsten", 2), st("hoch", "höher", "am höchsten", 1),
    st("gut", "besser", "am besten", 1), st("viel", "mehr", "am meisten", 2), st("alt", "älter", "am ältesten", 1),
    st("warm", "wärmer", "am wärmsten", 2), st("lang", "länger", "am längsten", 1), st("kurz", "kürzer", "am kürzesten", 2),
    st("schnell", "schneller", "am schnellsten", 2),
  ];

  /* ---------- Lückentext: Wort in der richtigen Form ---------- */
  const lf = (q, opts, explain, tip) => ({ type: "choice", q: `Setze das Wort in der richtigen Form ein: ${q}`, opts, ans: 0, explain, tip: tip || "Lies den ganzen Satz und sprich ihn mit jeder Antwort laut." });
  const luecke = [
    lf("Die Kinder ___ (spielen) im Hof.", ["spielen", "spielt", "spielst", "spiele"], "Die Kinder spielen im Hof."),
    lf("Du ___ (lesen) ein Buch.", ["liest", "lest", "lesen", "lese"], "Du liest ein Buch."),
    lf("Mein Bruder ___ (fahren) mit dem Bus.", ["fährt", "fahrt", "fahren", "fähre"], "Mein Bruder fährt mit dem Bus."),
    lf("Ich ___ (haben) einen Hund.", ["habe", "hat", "hast", "haben"], "Ich habe einen Hund."),
    lf("Wir ___ (sein) im Zoo.", ["sind", "seid", "ist", "bin"], "Wir sind im Zoo."),
    lf("Ihr ___ (laufen) sehr schnell.", ["lauft", "läuft", "laufen", "läufst"], "Ihr lauft sehr schnell."),
    lf("Ich sehe einen ___ (groß) Elefanten.", ["großen", "große", "großer", "großes"], "Ich sehe einen großen Elefanten."),
    lf("Das ist ein ___ (schön) Bild.", ["schönes", "schöne", "schönen", "schöner"], "Das ist ein schönes Bild."),
    lf("Im Stall stehen drei ___ (Pferd).", ["Pferde", "Pferden", "Pferd", "Pferds"], "Im Stall stehen drei Pferde.", "Mehrzahl: Wie heißt es bei mehreren?"),
    lf("Auf dem Baum sitzen zwei ___ (Vogel).", ["Vögel", "Vogels", "Vogeln", "Vogel"], "Auf dem Baum sitzen zwei Vögel.", "Mehrzahl: Wie heißt es bei mehreren?"),
  ];

  const BANK = {
    "de.wortart": { area: "de.sprache", name: "Wortarten", items: wortart },
    "de.satzglied": { area: "de.sprache", name: "Subjekt und Prädikat", items: satzglied },
    "de.zeitform": { area: "de.sprache", name: "Zeitformen erkennen", items: zeitform },
    "de.verbform": { area: "de.sprache", name: "Verben in der Zeitform", items: verbform },
    "de.wortfamilie": { area: "de.sprache", name: "Wortfamilien", items: wortfamilie },
    "de.zusammen": { area: "de.sprache", name: "Zusammengesetzte Nomen", items: zusammen },
    "de.steigerung": { area: "de.sprache", name: "Adjektive steigern", items: steigerung },
    "de.luecke": { area: "de.sprache", name: "Wörter in der richtigen Form", items: luecke },
  };

  const api = { BANK, SAETZE };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.DEKompassData = api; if (root.DEKompass) root.DEKompass.attachBank(BANK); }
})(typeof self !== "undefined" ? self : this);
