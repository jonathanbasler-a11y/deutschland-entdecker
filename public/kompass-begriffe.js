// Kompass 4: Fachbegriffe ("Mein Kompass-Wörterbuch"). Inhalt nach dem Arbeitsblatt der Lehrkraft (zur Nutzung freigegeben).
// Ein Begriff hat: f = Fach, g = Gruppe, t = Begriff, s = kurze Erklärung (ohne den Begriff selbst, für Aufgaben),
// d = ausführliche Erklärung, ex = Beispiel. Daraus entstehen das Wörterbuch und zwei Aufgabenarten je Fach.
(function (root) {
  "use strict";
  const T = (f, g, t, s, d, ex) => ({ f, g, t, s, d, ex });
  const TERMS = [
    // ---------- Deutsch ----------
    T("de", "Wortarten", "Nomen", "Wörter für Menschen, Tiere, Pflanzen, Dinge und Gefühle; man schreibt sie groß", "Nomen bezeichnen Menschen, Tiere, Pflanzen, Dinge und Gefühle. Sie werden immer großgeschrieben. Vor einem Nomen kann oft ein Artikel stehen. Manche erkennt man an der Endung -heit, -keit und -ung. Nomen können in der Mehrzahl stehen.", "ein Hund, viele Hunde"),
    T("de", "Wortarten", "Verb", "Wörter, die sagen, was jemand tut oder was geschieht", "Verben sagen, was jemand tut oder was geschieht. Sie können ihre Form verändern.", "laufen, lachen, schlafen; ich spiele, du spielst"),
    T("de", "Wortarten", "Grundform", "So steht ein Verb im Wörterbuch; sie endet meist auf -en", "Die Grundform eines Verbs steht im Wörterbuch. Sie hat meistens die gleiche Form wie die „wir“-Form und endet häufig auf -en. Aus ihr wird zum Beispiel die Personalform „ich spiele“.", "spielen, lachen, laufen"),
    T("de", "Wortarten", "Adjektiv", "Wörter, die sagen, wie etwas oder jemand ist (Wiewörter)", "Adjektive beschreiben, wie etwas oder jemand ist. Sie heißen auch Wiewörter. Viele kann man steigern.", "schnell, freundlich, bunt"),
    T("de", "Wortarten", "Steigerung", "Drei Stufen eines Adjektivs: Grundstufe und zwei Vergleichsstufen", "Es gibt drei Steigerungsstufen: die Grundstufe, die 1. Vergleichsstufe und die 2. Vergleichsstufe. Mit ihnen vergleichen wir Dinge miteinander.", "klein, kleiner, am kleinsten"),
    T("de", "Wortarten", "Präsens", "Die Zeitform für die Gegenwart", "Im Präsens passiert etwas jetzt, in der Gegenwart.", "ich spiele"),
    T("de", "Wortarten", "Präteritum", "Die Zeitform der schriftlichen Vergangenheit", "Im Präteritum (schriftliche Vergangenheit) ist etwas schon passiert.", "ich spielte"),
    T("de", "Wörter bauen", "Zusammengesetztes Nomen", "Ein Nomen aus zwei oder mehr Wörtern, zusammen und groß geschrieben", "Zusammengesetzte Nomen bestehen aus zwei oder mehreren Wörtern, die zu einem neuen Wort verbunden werden. Sie werden zusammen- und großgeschrieben.", "Sonne und Schirm: der Sonnenschirm"),
    T("de", "Wörter bauen", "Grundwort", "Der hintere Teil eines zusammengesetzten Nomens; er sagt, um was für ein Wort es sich handelt", "Das Grundwort steht hinten und erklärt, um was für ein Wort es sich handelt.", "Sonnenschirm: Schirm"),
    T("de", "Wörter bauen", "Bestimmungswort", "Der vordere Teil eines zusammengesetzten Nomens; er erklärt genauer, um was es geht", "Das Bestimmungswort steht vorne und erklärt genauer, um was es geht.", "Sonnenschirm: Sonne (wovor der Schirm schützt)"),
    T("de", "Wörter bauen", "Wortfamilie", "Wörter mit dem gleichen Wortstamm", "Wörter gehören zu einer Wortfamilie, wenn sie den gleichen Wortstamm haben.", "spielen, Spieler, Spielplatz"),
    T("de", "Wörter bauen", "Wortstamm", "Der gemeinsame Teil aller Wörter einer Familie", "Der Wortstamm ist der Teil, den alle Wörter einer Wortfamilie gemeinsam haben.", "spiel in spielen, Spieler, Spielplatz"),
    T("de", "Rede", "Wörtliche Rede", "Das, was jemand sagt, genau aufgeschrieben und in Anführungszeichen gesetzt", "Mit der wörtlichen Rede schreiben wir genau auf, was jemand sagt. Die gesagten Wörter stehen in Anführungszeichen.", "Mia sagt: „Ich spiele gern Fußball.“"),
    T("de", "Rede", "Redesatz", "Der Teil, der zeigt, was gesagt wird", "Der Redesatz ist das, was gesagt wird.", "„Ich spiele gern Fußball.“"),
    T("de", "Rede", "Begleitsatz", "Der Teil, der zeigt, wer spricht und wie", "Der Begleitsatz sagt, wer spricht und wie.", "Mia sagt:"),
    T("de", "Satzglieder", "Satzglied", "Ein Teil des Satzes aus einem oder mehreren Wörtern, der sich gemeinsam verschieben lässt", "Ein Satz besteht aus verschiedenen Satzgliedern. Sie können aus einem oder mehreren Wörtern bestehen. Man kann sie oft gemeinsam im Satz verschieben, ohne dass sich der Sinn verändert.", "Der kleine Hund | bellt | laut"),
    T("de", "Satzglieder", "Subjekt", "Das Satzglied, nach dem man mit „Wer oder was?“ fragt", "Das Subjekt sagt uns, wer oder was etwas tut oder wem etwas geschieht. Wir fragen danach mit „Wer oder was?“.", "Der kleine Hund bellt. Wer bellt? Der kleine Hund"),
    T("de", "Satzglieder", "Prädikat", "Das Satzglied, nach dem man mit „Was tut …?“ oder „Was geschieht?“ fragt; es besteht aus mindestens einem Verb", "Das Prädikat sagt uns, was jemand tut oder was geschieht. Es besteht aus mindestens einem Verb. Wir fragen mit „Was tut …?“ oder „Was geschieht?“.", "Lena lacht. Was tut Lena? lacht"),
    T("de", "Satzglieder", "Ortsangabe", "Das Satzglied, das sagt, wo, wohin oder woher etwas geschieht", "Die Ortsangabe sagt uns, wo, wohin oder woher etwas geschieht. Wir fragen mit „Wo?“, „Wohin?“ oder „Woher?“.", "Die Kinder spielen auf dem Schulhof. Wo? auf dem Schulhof"),
    T("de", "Satzglieder", "Zeitangabe", "Das Satzglied, das sagt, wann, wie lange oder wie oft etwas geschieht", "Die Zeitangabe sagt uns, wann, wie lange oder wie oft etwas geschieht. Wir fragen mit „Wann?“, „Wie lange?“ oder „Wie oft?“.", "Am Morgen fährt Paul mit dem Bus. Wann? am Morgen"),
    T("de", "Rechtschreib-Strategien", "Verlängern", "Strategie: Das Wort länger machen, um einen Laut am Ende besser zu hören", "Beim Verlängern machen wir ein Wort länger, damit wir einen Laut am Ende besser hören. Nomen verlängern wir mit der Mehrzahl, Adjektive mit der Steigerung, Verben mit der Grundform.", "Hund, Hunde: also mit d. Kleid, Kleider. klug, klüger. sie fragt, fragen"),
    T("de", "Rechtschreib-Strategien", "Ableiten", "Strategie: Ein verwandtes Wort suchen, bei dem man den schwierigen Laut besser hört", "Beim Ableiten hilft uns ein verwandtes Wort, die richtige Schreibweise zu finden.", "Räder von Rad: also mit ä"),
    T("de", "Rechtschreib-Strategien", "Silbenkönige", "Ein anderer Name für die Vokale", "Die Vokale heißen auch Silbenkönige: a, e, i, o, u, ä, ö, ü. Es gibt kurze und lange Vokale.", "a, e, i, o, u, ä, ö, ü"),
    T("de", "Rechtschreib-Strategien", "Doppelkonsonant", "Zwei gleiche Mitlaute nach einem kurzen Vokal", "Nach einem kurzen Vokal kommen zwei Konsonanten (Wolke). Hört man nur einen Konsonanten, muss man ihn verdoppeln (Wolle). Besondere Doppelkonsonanten sind ck (Hecke) und tz (Katze).", "Wolle, Hecke, Katze"),
    // ---------- Mathe ----------
    T("ma", "Rechenarten", "Addition", "Zahlen zusammenrechnen (Plusrechnung)", "Bei der Addition rechnen wir Zahlen zusammen. Wir nennen sie auch Plusrechnung. Andere Wörter dafür: plus, und, erhöhen, dazu, mehr, hinzufügen, größer, mit, vergrößern.", "12 + 8 = 20"),
    T("ma", "Rechenarten", "Summand", "Eine Zahl, die man bei der Plusrechnung zusammenzählt", "Die Zahlen, die wir zusammenzählen, heißen Summanden.", "12 und 8 in 12 + 8 = 20"),
    T("ma", "Rechenarten", "Summe", "Das Ergebnis einer Plusrechnung", "Das Ergebnis einer Addition heißt Summe.", "20 in 12 + 8 = 20"),
    T("ma", "Rechenarten", "Subtraktion", "Eine Zahl von einer anderen abziehen (Minusrechnung)", "Bei der Subtraktion ziehen wir eine Zahl von einer anderen Zahl ab. Wir nennen sie auch Minusrechnung. Andere Wörter dafür: minus, weniger, kleiner, wegnehmen, ohne, vermindern, abziehen.", "15 − 6 = 9"),
    T("ma", "Rechenarten", "Minuend", "Die Zahl, von der man etwas abzieht", "Der Minuend ist die Zahl, von der wir abziehen.", "15 in 15 − 6 = 9"),
    T("ma", "Rechenarten", "Subtrahend", "Die Zahl, die man abzieht", "Der Subtrahend ist die Zahl, die abgezogen wird.", "6 in 15 − 6 = 9"),
    T("ma", "Rechenarten", "Differenz", "Das Ergebnis einer Minusrechnung", "Das Ergebnis einer Subtraktion heißt Differenz.", "9 in 15 − 6 = 9"),
    T("ma", "Rechenarten", "Multiplikation", "Eine Zahl mehrmals dazunehmen (Malrechnung)", "Bei der Multiplikation nehmen wir eine Zahl mehrmals dazu. Wir nennen sie auch Malrechnung. Andere Wörter dafür: verdoppeln, vervielfachen, x-mal so viel, je, malnehmen.", "4 · 3 = 12"),
    T("ma", "Rechenarten", "Faktor", "Eine Zahl, die man bei der Malrechnung malnimmt", "Die Zahlen, die wir multiplizieren, heißen Faktoren.", "4 und 3 in 4 · 3 = 12"),
    T("ma", "Rechenarten", "Produkt", "Das Ergebnis einer Malrechnung", "Das Ergebnis einer Multiplikation heißt Produkt.", "12 in 4 · 3 = 12"),
    T("ma", "Rechenarten", "Division", "Eine Zahl in gleich große Teile aufteilen (Geteiltrechnung)", "Bei der Division teilen wir eine Zahl in gleich große Teile auf oder verteilen sie gleichmäßig. Wir nennen sie auch Geteiltrechnung. Andere Wörter dafür: teilen, halbieren, durch, verteilen, aufteilen, geteilt.", "12 : 3 = 4"),
    T("ma", "Rechenarten", "Dividend", "Die Zahl, die geteilt wird", "Der Dividend ist die Zahl, die geteilt wird.", "12 in 12 : 3 = 4"),
    T("ma", "Rechenarten", "Divisor", "Die Zahl, durch die man teilt", "Der Divisor ist die Zahl, durch die geteilt wird.", "3 in 12 : 3 = 4"),
    T("ma", "Rechenarten", "Quotient", "Das Ergebnis einer Geteiltrechnung", "Das Ergebnis einer Division heißt Quotient.", "4 in 12 : 3 = 4"),
    T("ma", "Begriffe", "Nachbarzahlen", "Die Zahlen vor und nach einer Zahl, die volle Zehner, Hunderter, Tausender … sind", "Nachbarzehner, Nachbarhunderter, Nachbartausender und so weiter sind die Zahlen vor und nach einer Zahl auf dem Zahlenstrahl, die volle Zehner, Hunderter oder Tausender sind.", "373: Nachbarzehner 370 und 380, Nachbarhunderter 300 und 400"),
    T("ma", "Begriffe", "Zahlenfolge", "Mehrere Zahlen, die nach einer bestimmten Regel angeordnet sind", "Eine Zahlenfolge besteht aus mehreren Zahlen, die nach einer bestimmten Regel angeordnet sind. Um sie fortzusetzen, müssen wir die Regel erkennen: Wird addiert, subtrahiert, verdoppelt oder halbiert?", "5, 10, 15, 20: immer +5"),
    T("ma", "Wahrscheinlichkeit", "Sicheres Ereignis", "Etwas, das auf jeden Fall eintritt", "Ein sicheres Ereignis tritt auf jeden Fall ein.", "Mit einem Würfel eine Zahl von 1 bis 6 würfeln"),
    T("ma", "Wahrscheinlichkeit", "Mögliches Ereignis", "Etwas, das eintreten kann, aber nicht muss", "Ein mögliches Ereignis kann eintreten, muss aber nicht.", "Mit einem Würfel eine 3 würfeln"),
    T("ma", "Wahrscheinlichkeit", "Unmögliches Ereignis", "Etwas, das niemals eintreten kann", "Ein unmögliches Ereignis kann niemals eintreten.", "Mit einem Würfel eine 8 würfeln"),
    T("ma", "Größen", "Maßeinheit", "Die Einheit, in der man eine Größe misst", "Mit Maßeinheiten messen wir Größen: Längen (mm, cm, m, km), Gewichte (mg, g, kg, t), Zeit (s, min, h, Tag) und Hohlmaße (ml, l).", "cm, kg, min, l"),
    T("ma", "Größen", "Hohlmaße", "Maße dafür, wie viel Flüssigkeit in ein Gefäß passt", "Hohlmaße geben an, wie viel Flüssigkeit in ein Gefäß passt. Liter (l) verwendet man für große Mengen, Milliliter (ml) für kleinere. Ein Liter sind 1.000 Milliliter, ein halber Liter 500 ml und ein Viertelliter 250 ml.", "eine Flasche Wasser: l, ein Glas Saft: ml"),
    T("ma", "Körper und Formen", "Würfelgebäude", "Ein Gebäude aus mehreren kleinen Würfeln, die aufeinander oder nebeneinander stehen", "Ein Würfelgebäude besteht aus mehreren kleinen Würfeln, die aufeinander oder nebeneinander stehen.", "ein Turm aus 3 Würfeln neben einem aus 2"),
    T("ma", "Körper und Formen", "Bauplan", "Eine Zeichnung mit Zahlen, die zeigen, wie hoch jeder Würfelstapel ist", "Mit einem Bauplan erkennen wir, wie viele Würfel an jeder Stelle stehen. Die Zahlen zeigen, wie hoch die einzelnen Würfelstapel sind. So können wir ein Würfelgebäude nachbauen oder einen Bauplan zeichnen.", "2 | 3 bedeutet: ein Stapel aus 2 Würfeln, daneben einer aus 3"),
    T("ma", "Körper und Formen", "Rechteck", "Eine Form mit vier Ecken, vier Seiten und vier rechten Winkeln; gegenüberliegende Seiten sind gleich lang", "Ein Rechteck hat vier Ecken und vier Seiten. Gegenüberliegende Seiten sind gleich lang. Alle vier Winkel sind rechte Winkel.", "ein Heft"),
    T("ma", "Körper und Formen", "Quadrat", "Eine besondere Art von Rechteck mit vier gleich langen Seiten", "Ein Quadrat ist eine besondere Form des Rechtecks. Es hat vier gleich lange Seiten und vier rechte Winkel.", "ein Kästchen im Heft"),
    T("ma", "Körper und Formen", "Dreieck", "Eine Form mit drei Seiten und drei Ecken", "Ein Dreieck hat drei Seiten und drei Ecken. Die Seiten können unterschiedlich lang oder gleich lang sein, auch die Winkel können unterschiedlich groß sein.", "ein Dreieckstuch"),
    T("ma", "Körper und Formen", "Spiegelachse", "Eine gedachte Linie, die eine Figur in zwei gleich große, spiegelgleiche Hälften teilt", "Eine Spiegelachse ist eine gedachte Linie, die eine Figur in zwei gleich große, spiegelgleiche Hälften teilt. Faltet man an der Achse, liegen beide Hälften genau aufeinander. Ein Quadrat hat vier Spiegelachsen, ein Rechteck zwei. Manche Figuren haben keine.", "Quadrat: 4, Rechteck: 2"),
  ];

  // Umrechnungen aus dem Wörterbuch (Anzeige und Test)
  const UMRECHNEN = [
    ["Längen", ["1 cm = 10 mm", "1 m = 100 cm", "1 m = 1.000 mm", "1 km = 1.000 m"]],
    ["Gewichte", ["1 g = 1.000 mg", "1 kg = 1.000 g", "1 t = 1.000 kg"]],
    ["Zeit", ["1 min = 60 s", "1 h = 60 min", "1 Tag = 24 h"]],
    ["Hohlmaße", ["1 l = 1.000 ml", "½ l = 500 ml", "¼ l = 250 ml"]],
  ];

  // Aufgaben: je Begriff zwei Fragen. Falsche Antworten kommen aus derselben Gruppe, dann aus demselben Fach.
  function pool(term, key) {
    const same = TERMS.filter((x) => x.f === term.f && x.g === term.g && x !== term), rest = TERMS.filter((x) => x.f === term.f && x.g !== term.g);
    const order = same.concat(rest), out = [];
    const start = TERMS.indexOf(term) % Math.max(1, order.length);
    for (let i = 0; i < order.length && out.length < 3; i++) out.push(order[(start + i) % order.length]);
    return out.map((x) => x[key]);
  }
  function items(fach) {
    const list = [];
    for (const t of TERMS.filter((x) => x.f === fach)) {
      const a = [t.t].concat(pool(t, "t")), b = [t.s].concat(pool(t, "s"));
      list.push({ type: "choice", q: `Welcher Begriff passt? „${t.s}“`, opts: a, ans: 0, tip: `Denke an das Wörterbuch: ${t.d.split(". ")[0]}.`, explain: `${t.t}: ${t.s}.${t.ex ? " Beispiel: " + t.ex + "." : ""}`, term: t.t });
      list.push({ type: "choice", q: `Was bedeutet „${t.t}“?`, opts: b, ans: 0, tip: `Beispiel: ${t.ex}`, explain: `${t.t}: ${t.s}.`, term: t.t });
    }
    return list;
  }
  const BANK = {
    "de.begriffe": { area: "de.sprache", name: "Fachbegriffe Deutsch", items: items("de") },
    "ma.begriffe": { area: "ma.zahlen", name: "Fachbegriffe Mathe", items: items("ma") },
  };
  const api = { TERMS, UMRECHNEN, BANK };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.DEKompassBegriffe = api; if (root.DEKompass) root.DEKompass.attachBank(BANK); }
})(typeof self !== "undefined" ? self : this);
