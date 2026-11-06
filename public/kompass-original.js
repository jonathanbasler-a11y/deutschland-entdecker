// Kompass 4: Aufgaben aus den veröffentlichten Haupttermin-Tests 2025 (© IBBW), für die App umgebaut.
// Nur Aufgaben, die ohne Bild gehen. Aufgaben mit Zeichnungen (Mathe 6, 11 bis 17, 21, 22) fehlen und werden
// im Probe-Kompass durch ähnlich gebaute Aufgaben aus den Generatoren ersetzt.
(function (root) {
  "use strict";
  const K = typeof module !== "undefined" && module.exports ? require("./kompass-logic.js") : root.DEKompass;
  if (!K) return;
  const SRC_MA = "Kompass 4 Mathematik, Haupttermin 2025, © IBBW";
  const SRC_DE = "Kompass 4 Deutsch, Haupttermin 2025, © IBBW";

  // Aufgaben mit festem Inhalt: comp bestimmt, in welche Aufgabenart die Auswertung zählt
  let n = 0;
  const T = (fach, comp, nr, t) => Object.assign({ comp, key: `orig:${fach}25:${nr}:${++n}`, seed: n, orig: `Nr. ${nr}`, source: fach === "ma" ? SRC_MA : SRC_DE, fixed: true }, t);
  const num = (fach, comp, nr, q, ans, tip, explain, x) => T(fach, comp, nr, Object.assign({ type: "num", q, ans, tip, explain }, x));
  const wr = (fach, comp, nr, q, ans, tip, explain, x) => T(fach, comp, nr, Object.assign({ type: "write", q, ans: [].concat(ans), tip, explain: explain || `Richtig: ${[].concat(ans)[0]}` }, x));

  function mathe() {
    const f = "ma";
    return [
      { name: "Teil 1: Zahlen und Rechnen", tasks: [
        num(f, "ma.plus", 1, "Rechne aus: 1691 + 268", 1959, "Rechne auf Papier untereinander.", "1691 + 268 = 1959", { paper: true, fmt: true }),
        num(f, "ma.plus", 1, "Rechne aus: 1739 − 658", 1081, "Achte auf das Minuszeichen und auf das Entbündeln.", "1739 − 658 = 1081", { paper: true, fmt: true }),
        num(f, "ma.plus", 2, "Kai fährt mit dem Auto eine Strecke von 286 Kilometern. 174 Kilometer ist er schon gefahren. Wie viele Kilometer muss Kai noch fahren?", 112, "Was ist noch übrig? Rechne 286 − 174.", "286 − 174 = 112", { unit: "km" }),
        T(f, "ma.runden", 3, { type: "nums", q: "Schreibe die Nachbarzehner von 7496.", fields: [{ label: "Nachbarzehner unten", ans: 7490 }, { label: "Nachbarzehner oben", ans: 7500 }], tip: "Zehner enden auf 0. Welche liegen direkt unter und über 7496?", explain: "7490 < 7496 < 7500" }),
        T(f, "ma.mal", 4, { type: "nums", q: "Rechne aus. Achte auf die Rechenzeichen: 5 · 18, 6 · 38 und 48 : 4.", fields: [{ label: "5 · 18", ans: 90 }, { label: "6 · 38", ans: 228 }, { label: "48 : 4", ans: 12 }], tip: "Zerlege: 6 · 38 = 6 · 40 − 6 · 2.", explain: "5 · 18 = 90, 6 · 38 = 228, 48 : 4 = 12" }),
        T(f, "ma.folge", 5, { type: "choice", q: "Welche Regel entdeckst du in der Zahlenfolge 460, 510, 490, 540, 520, 570?", opts: ["erst +50, dann −20", "erst +50, dann −30", "erst +40, dann −20", "immer +30"], ans: 0, tip: "Rechne von einer Zahl zur nächsten: 460 → 510 → 490.", explain: "460 + 50 = 510, 510 − 20 = 490, dann wieder +50 und −20." }),
        num(f, "ma.stelle", 8, "Schreibe als Zahl: 5 H 13 Z 2 E", 632, "13 Zehner sind 1 Hunderter und 3 Zehner.", "500 + 130 + 2 = 632"),
        T(f, "ma.runden", 9, { type: "nums", q: "Welche Zahl liegt genau in der Mitte? Zwischen 750 und 850, und zwischen 340 und 480.", fields: [{ label: "750 und 850", ans: 800 }, { label: "340 und 480", ans: 410 }], tip: "Rechne den Abstand aus und nimm die Hälfte.", explain: "800 und 410" }),
        wr(f, "ma.plus", 10, "Lena rechnet 478 − 97. Sie rechnet zuerst 478 − 100 = 378. Was muss sie jetzt noch rechnen? Schreibe die Rechnung auf, zum Beispiel 5 + 5.", ["378 + 3", "378+3", "3 + 378", "3+378"], "Sie hat 3 zu viel abgezogen.", "378 + 3 = 381"),
      ] },
      { name: "Teil 2: Muster, Größen und Daten", tasks: [
        num(f, "ma.folge", 7, "Zahlenmauer: Du darfst 20, 25 und 30 in die unterste Reihe schreiben. Der Deckstein ist die Summe aller Steine darunter. Wie groß kann er höchstens werden?", 105, "Die mittlere Zahl wird zweimal gezählt. Probiere, welche in die Mitte soll.", "Mit 30 in der Mitte: 20 + 30 = 50, 30 + 25 = 55, 50 + 55 = 105", { fmt: true }),
        T(f, "ma.folge", 7, { type: "self", q: "Ergänze den Satz: Der Deckstein ist am größten, wenn …", model: "… die größte Zahl in der Mitte steht, weil sie zweimal gezählt wird.", tip: "Welche Zahl wird in der Zahlenmauer zweimal gebraucht?", explain: "Die größte Zahl gehört in die Mitte." }),
        wr(f, "ma.zeit", 18, "Samira macht sich um 16:18 Uhr auf den Heimweg. Sie braucht 45 Minuten. Um wie viel Uhr kommt sie zu Hause an? Schreibe so: 12:30", ["17:03", "17.03"], "Rechne erst bis 17:00 (42 Minuten), dann noch 3 Minuten.", "16:18 + 42 min = 17:00, dazu 3 min = 17:03"),
        T(f, "ma.laenge", 19, { type: "match", q: "Verbinde. Eine Angabe bleibt übrig.", left: ["Höhe einer Tür", "Breite eines Fingers", "Breite einer Bleistiftspitze", "Länge eines Fußballplatzes"], right: ["1 mm", "100 m", "10 km", "1 cm", "2 m"], ans: [[4], [3], [0], [1]], tip: "Stell dir die Länge vor, zum Beispiel deinen Finger.", explain: "Tür 2 m, Finger 1 cm, Bleistiftspitze 1 mm, Fußballplatz 100 m, übrig bleibt 10 km." }),
        num(f, "ma.laenge", 20, "Weitsprung: Ida 1,90 m, Mina 2,50 m, Tom 2,80 m, Alex 2,10 m, David 3,00 m. Tom ist wie viele Zentimeter weiter gesprungen als Alex?", 70, "Rechne 2,80 m − 2,10 m und wandle in cm um.", "2,80 m − 2,10 m = 0,70 m = 70 cm", { unit: "cm" }),
      ] },
    ];
  }

  function deutsch() {
    const f = "de";
    const wortart = (nr, q, ans) => wr(f, "de.zusammen", nr, q, ans, "Das erste Wort ist das Bestimmungswort.", `Richtig: ${[].concat(ans)[0]}`);
    return [
      { name: "Teil 1: Lesen (Kaugummi, Original)", unit: "de.lesen.kaugummi", tasks: [] },
      { name: "Teil 2: Rechtschreiben", tasks: [
        wr(f, "de.recht.strat", 8, "Ergänze das Wort aus der Wortfamilie wissen: „Ich wei__, dass ich morgen in die Schule gehen muss.“ Schreibe das ganze Wort.", "weiß", "Ich weiß, du weißt, ihr wisst: Das Wort gehört zu wissen.", "Ich weiß.", { strict: true }),
        wr(f, "de.recht.strat", 8, "Ergänze das Wort aus der Wortfamilie wissen: „Ihr wi__t genau, dass wir bald Ferien haben.“ Schreibe das ganze Wort.", "wisst", "Ihr wisst gehört zu wissen.", "Ihr wisst.", { strict: true }),
        T(f, "de.recht.gross", 9, { type: "pick", q: "Tippe alle Wörter an, die großgeschrieben werden müssen.", tokens: "die meisten kinder und erwachsenen essen gerne von den leckeren süßigkeiten.".split(" "), ans: [0, 2, 4, 10], tip: "Satzanfang und Nomen schreibt man groß.", explain: "Die, Kinder, Erwachsenen, Süßigkeiten" }),
        wr(f, "de.recht.strat", 10, "Welches Wort hilft beim Schreiben von „bräunlich“ (ä oder e)? Schreibe das Wort, von dem du ableitest.", "braun", "Ableiten: Du suchst ein verwandtes Wort mit au.", "bräunlich kommt von braun.", { strict: true }),
        wr(f, "de.recht.strat", 10, "Wie schreibt man „er fliegt“ am Ende (g oder k)? Verlängere: Er fliegt, sie … Schreibe die Grundform.", "fliegen", "Verlängern: Mach das Wort länger, dann hörst du den Buchstaben.", "fliegen mit g.", { strict: true }),
        wr(f, "de.recht.strat", 10, "Wie schreibt man „er tobt“ am Ende (b oder p)? Verlängere und schreibe die Grundform.", "toben", "Verlängern: Mach das Wort länger.", "toben mit b.", { strict: true }),
        wr(f, "de.recht.strat", 11, "Im Satz „Am Morgen müsen Kinder in der Schule ihre Kaugummis ausspuken.“ stecken 2 Fehler. Schreibe das erste falsche Wort richtig auf.", "müssen", "Nach einem kurzen Vokal steht oft ein Doppelkonsonant.", "müssen mit ss.", { strict: true }),
        wr(f, "de.recht.strat", 11, "Schreibe nun das zweite falsche Wort richtig auf (ausspuken).", "ausspucken", "Nach einem kurzen u steht ck.", "ausspucken mit ck.", { strict: true }),
      ] },
      { name: "Teil 3: Sprache untersuchen", tasks: [
        wr(f, "de.zusammen", 14, "Ein Regal für Bücher ist ein …", "Bücherregal", "Das Bestimmungswort kommt zuerst. Nomen schreibt man groß.", "Bücherregal", { strict: true }),
        wr(f, "de.zusammen", 14, "Eine Höhle, in der Räuber wohnen, ist eine …", "Räuberhöhle", "Das Bestimmungswort kommt zuerst. Nomen schreibt man groß.", "Räuberhöhle", { strict: true }),
        T(f, "de.wortart", 15, { type: "self", q: "Erkläre, warum das Wort „rennen“ im Satz „Luis und Ali rennen über den Schulhof.“ ein Verb ist.", model: "Rennen sagt, was Luis und Ali tun. Man kann es verändern: Sie rannten.", tip: "Was sagt das Wort? Kannst du es in der Zeit verändern?", explain: "Verben sagen, was jemand tut, und lassen sich verändern." }),
        wr(f, "de.zeitform", 16, "Schreibe das Verb aus „Am Nachmittag ging er zu seinem Freund Tom.“ in der Grundform.", "gehen", "Die Grundform endet meist auf -en.", "ging → gehen"),
        wr(f, "de.steigerung", 19, "Adjektive kann man steigern. Wie heißt die Grundstufe zu „klüger“?", "klug", "Die Grundstufe ist die Form ohne -er.", "klug, klüger, am klügsten"),
        wr(f, "de.steigerung", 19, "Wie heißt die 2. Vergleichsstufe (Höchststufe) zu „klug“? Schreibe: am …", ["am klügsten", "klügsten"], "Die Höchststufe endet auf -sten.", "klug, klüger, am klügsten"),
        T(f, "de.zeitform", 20, { type: "match", q: "Verbinde die Sätze mit den passenden Zeitformen.", left: ["Ich habe ein schönes Bild gemalt.", "Paula malt mit ihren neuen Stiften.", "Leyla malte einen Schmetterling."], right: ["Präteritum (schriftliche Vergangenheit)", "Perfekt (gesprochene Vergangenheit)", "Präsens (Gegenwart)"], ans: [[1], [2], [0]], tip: "Perfekt hat „haben“ oder „sein“ und ein Partizip.", explain: "gemalt = Perfekt, malt = Präsens, malte = Präteritum" }),
        wortart(21, "Zu welcher Wortart gehört das Bestimmungswort von „Vogelkäfig“? Schreibe Nomen, Verb oder Adjektiv.", "Nomen"),
        wortart(21, "Zu welcher Wortart gehört das Bestimmungswort von „Buntspecht“? Schreibe Nomen, Verb oder Adjektiv.", "Adjektiv"),
        wr(f, "de.zeitform", 22, "Schreibe im Präteritum (schriftliche Vergangenheit): Meine Schwester und ich füttern unseren Hund. → wir …", "fütterten", "Im Präteritum bekommen regelmäßige Verben -ten.", "wir fütterten"),
        wr(f, "de.zeitform", 22, "Schreibe im Präteritum: Das Kind schwimmt sehr schnell. → es …", "schwamm", "Das ist ein unregelmäßiges Verb: schwimmen, schwamm.", "es schwamm"),
        T(f, "de.satzglied", 24, { type: "cut", q: "Zerlege den Satz in Satzglieder. Tippe zwischen die Wörter, wo ein Satzglied zu Ende ist.", tokens: "Der kleine Hund spielt mit seinem Ball auf der Wiese.".split(" "), ans: [2, 3, 6], tip: "Probe: Was kann man zusammen an den Satzanfang schieben?", explain: "Der kleine Hund | spielt | mit seinem Ball | auf der Wiese." }),
      ] },
    ];
  }

  K.original = (fach) => (fach === "de" ? deutsch() : mathe());
})(typeof window !== "undefined" ? window : globalThis);
