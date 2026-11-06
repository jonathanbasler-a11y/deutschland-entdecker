// Kompass 4 Deutsch, Teil 2: Lesen (echte Texte mit Quelle und eigene), Rechtschreiben, mehr Sprache untersuchen.
// Die beiden Originaltexte stammen aus den veröffentlichten Kompass-4-Tests des IBBW (© IBBW), die Fragen sind
// für die App umgebaut (Antippen statt Schreiben, Kurzantworten zum Selbstprüfen). Alles andere ist selbst geschrieben.
(function (root) {
  "use strict";

  const SRC25 = "Original: Kompass 4 Deutsch 2025, © IBBW (Fragen für die App umgebaut)";
  const SRC24 = "Original: Kompass 4 Deutsch 2024, © IBBW (Fragen für die App umgebaut)";

  /* ---------- Bausteine ---------- */
  const ch = (q, right, wrong, tip, explain) => ({ type: "choice", q, opts: [right].concat(wrong), ans: 0, tip: tip || "Lies die Stelle im Text noch einmal genau.", explain: explain || `Richtig: ${right}` });
  const tf = (q, rows, tip, explain) => ({ type: "tf", q, rows: rows.map(([s, ok]) => ({ s, ok })), tip: tip || "Suche jede Aussage im Text. Steht sie dort so?", explain });
  const self = (q, model, tip) => ({ type: "self", q, model, tip: tip || "Schreibe einen ganzen Satz. Die Antwort steht im Text.", explain: "Vergleiche mit der Musterlösung." });
  const mt = (q, left, right, ans, tip, explain) => ({ type: "match", q, left, right, ans: ans.map((a) => (Array.isArray(a) ? a : [a])), tip: tip || "Lies zuerst alle Teile, dann verbinde.", explain: explain || "So passt es zusammen." });

  /* ================= Lesetexte ================= */
  const KAUGUMMI = [
    "Hast du schon einmal Kaugummi gekaut? Dann geht es dir so wie vielen",
    "Menschen. Schon vor tausenden Jahren kauten Menschen Kaugummi, um ihre",
    "Zähne gesund zu halten. Aber weißt du, was alles passieren muss, bis wir auf",
    "dem Kaugummi herumkauen können? Das ist ein langer Prozess, der heute anders",
    "verläuft als früher.",
    "Früher wurde Kaugummi aus dem milchigen Saft bestimmter Bäume hergestellt.",
    "Diese wachsen zum Beispiel im Regenwald von Mittelamerika. Um an den Saft zu",
    "gelangen, ritzten Menschen die Rinde ein. Dann tropfte eine weiße Flüssigkeit aus",
    "dem Stamm. Diese fingen Gummisammler in Eimern auf und kochten sie dann",
    "über dem Feuer, bis die Masse zäh und gummiartig wurde. Diese Masse nennt",
    "man „Chicle“.",
    "Mittlerweile wird Kaugummi meistens aus künstlichen Stoffen hergestellt. Der",
    "Grund dafür ist, dass es nicht genügend Baumsaft gibt, um Kaugummis für die",
    "ganze Welt herzustellen. Außerdem ist Chicle teuer. Deshalb stellt man die",
    "Kaumasse inzwischen fast immer aus Kunststoffen her, die dem Baumsaft sehr",
    "ähnlich sind.",
    "Diese Kaumasse wird in der Kaugummifabrik zuerst geschmolzen und dann",
    "geknetet, bis man gut darauf herumkauen kann. Anschließend mischen",
    "Maschinen Zucker und Geschmacksstoffe wie Pfefferminz dazu.",
    "Nun sind die Kaugummis fast fertig. Sie müssen nur",
    "noch geformt werden – zum Beispiel in Streifen oder",
    "Kugeln. Zum Schluss kühlen Maschinen die Kaugummis,",
    "damit sie fest werden. Ganz am Ende werden die fertigen",
    "Kaugummis verpackt und an die Geschäfte geliefert.",
    "Jetzt weißt du, was alles passieren muss, bis du auf",
    "einem Stück Kaugummi herumkauen kannst.",
  ];
  const WOLF = [
    "Mehr als 100 Jahre lang gab es in Deutschland keine Wölfe mehr. Der Mensch hatte",
    "sie alle vertrieben. Inzwischen siedeln sich die wilden Verwandten der Hunde wieder",
    "in Deutschland an. Sie stehen seit 1990 unter Schutz und dürfen nicht gejagt werden.",
    "Tierforscher feiern das als Erfolg. Es gibt aber auch viele Menschen, die Angst vor",
    "Wölfen haben.",
    "Tatsächlich ist der Wolf ein Raubtier und ein ausgezeichneter Jäger. In der Regel leben",
    "Wölfe in Wäldern, an Flussufern und in Graslandschaften. Wölfe ernähren sich von",
    "Wildtieren, die sich in ihrem Lebensraum aufhalten. Gelegentlich passiert es allerdings",
    "auch, dass Wölfe sich Nutztiere wie Schafe oder Ziegen als Beute aussuchen.",
    "Wölfe sind sehr soziale Tiere und leben oft in Gruppen, die den Familien von Menschen",
    "ähnlich sind. Diese Gruppen bezeichnet man als Rudel. Anders als bei Wölfen, die in",
    "Wildparks leben, gibt es bei freilebenden Wölfen keine klare Rangordnung. Mutter und",
    "Vater führen das Rudel an. Da Wölfe sehr scheue Tiere sind, meiden sie Begegnungen",
    "mit Menschen, wo sie nur können.",
    "Natur- und Tierschützer unterstützen die Verbreitung des Wolfes. Sie betonen, dass",
    "Wölfe zur heimischen Tierwelt gehören und für den Menschen keine Gefahr darstellen.",
  ];

  const T_KAUGUMMI = {
    passage: { title: "Wie wird Kaugummi hergestellt?", lines: KAUGUMMI }, source: SRC25,
    items: [
      self("Warum kauten die Menschen schon vor tausenden Jahren Baumsaft?", "Sie wollten ihre Zähne gesund halten (Zeilen 2 und 3)."),
      tf("Überprüfe die Aussagen mithilfe des Textes.", [["Kaugummi ist eine Erfindung der letzten 100 Jahre.", false], ["Früher wurde Kaugummi aus Baumsaft hergestellt.", true], ["Die fertigen Kaugummis werden verpackt.", true]],
        "Suche die Stelle im Text. Das Wort „tausenden“ in Zeile 2 hilft bei der ersten Aussage.",
        "1) stimmt nicht: Zeilen 2–3, schon vor tausenden Jahren. 2) stimmt: Zeilen 6–7. 3) stimmt: Zeilen 23–24."),
      ch("Was ist im Text mit „Gummisammler“ gemeint? Nur eine Antwort ist richtig.", "Menschen, die den Baumsaft für die Herstellung von Chicle sammeln",
        ["Maschinen zur Herstellung von Kaugummis", "Besondere Eimer zum Kochen von Chicle", "Menschen, die Kaugummis mit besonderen Geschmacksrichtungen sammeln"],
        "Lies Zeile 9 noch einmal: Wer fing die weiße Flüssigkeit auf?"),
      mt("Verbinde die zusammenpassenden Satzteile.", ["Heute wird Kaugummi oft aus künstlichen Stoffen hergestellt, …", "Die Kaumasse wird in Fabriken …", "Die Kaugummis werden …"],
        ["… die Chicle sehr ähnlich sind.", "… am Ende verpackt und sind bereit für den Verkauf.", "… geschmolzen und dann geknetet."], [0, 2, 1],
        "Probiere jeden Satz laut: Welches Ende klingt richtig und passt zum Text?"),
      self("Warum stellt man Kaugummi heute nicht mehr aus Chicle her? Nenne zwei Gründe.", "1) Es gibt nicht genug Baumsaft für die ganze Welt. 2) Chicle ist teuer (Zeilen 13 und 14).",
        "Das Wort „Außerdem“ in Zeile 14 zeigt dir den zweiten Grund."),
      ch("Worum geht es im 3. Absatz (ab „Mittlerweile …“)? Wähle die passende Überschrift.", "Warum Kaugummi heute künstlich hergestellt wird",
        ["Die Werbung für Kaugummi", "Wie man Kaugummi kaut", "Die Erfindung von Chicle"], "Fasse den Absatz in einem Satz zusammen. Welche Überschrift passt dazu?"),
      mt("Wie wird Kaugummi heute hergestellt? Ergänze die fehlenden Schritte im Ablaufplan.",
        ["Schritt 3 (nach dem Schmelzen)", "Schritt 5 (nach Zucker und Geschmacksstoffen)", "Schritt 7 (nach dem Kühlen)"],
        ["Kaumasse kneten", "Kaugummi formen", "Kaugummi verpacken", "Kaugummi kauen", "Baumsaft sammeln"], [0, 1, 2],
        "Lies Zeilen 17 bis 24: Die Schritte stehen in der richtigen Reihenfolge im Text.",
        "Ablauf: 1 Kaumasse herstellen, 2 schmelzen, 3 kneten, 4 Zucker und Geschmacksstoffe, 5 formen, 6 kühlen, 7 verpacken, dann liefern."),
    ],
  };

  const MINDMAP = ["Mindmap zum Text (Kurzfassung):", "Nahrung: Äpfel, Beeren, Aas, Wildtiere, Nutztiere (Schafe, Ziegen)", "Lebensraum: Wälder, Flussufer, Graslandschaften", "Aussehen: grau-braunes Fell, Gewicht bis 43 kg, Länge bis 140 cm, kurze dreieckige Ohren"];
  const T_WOLF = {
    passage: { title: "Wölfe in Deutschland", lines: WOLF, extra: MINDMAP }, source: SRC24,
    items: [
      ch("Wie sorgen die Menschen dafür, dass Wölfe sich wieder in Deutschland ansiedeln?", "Wölfe stehen unter Schutz und dürfen nicht gejagt werden.",
        ["Wölfe werden regelmäßig gefüttert.", "Es werden spezielle Schutzgebiete für Wölfe in Städten gebaut.", "Wölfe werden trainiert, um Menschen zu meiden."], "Lies Zeile 3."),
      ch("Was ist ein Rudel? Ein Rudel ist …", "eine Gruppe von Wölfen.", ["ein Bau, in dem Wölfe leben.", "ein anderes Wort für Wolfskind.", "eine Gruppe von Schafen."], "Lies Zeile 11: „Diese Gruppen bezeichnet man als Rudel.“"),
      ch("Warum finden es Natur- und Tierschützer gut, dass Wölfe sich wieder in Deutschland verbreiten?", "Wölfe gehören zur heimischen Tierwelt.",
        ["Wölfe leben nur in Wildparks.", "Wölfe sind soziale Tiere.", "Wölfe jagen nur Wildtiere."], "Lies Zeilen 15 und 16. Dort steht ihre Begründung."),
      ch("Mindmap, Zweig „Nahrung“: Was fehlt neben Äpfeln, Beeren und Aas?", "Wildtiere", ["Gras", "Fische", "Blätter"], "Lies Zeile 7 und 8: Wovon ernähren sich Wölfe?"),
      { type: "multi", q: "Mindmap, Zweig „Lebensraum“: Neben Wäldern fehlen zwei Orte. Wähle beide.", opts: ["Flussufer", "Graslandschaften", "Wildparks", "Städte"], ans: [0, 1],
        tip: "Lies Zeile 6 und 7: Wo leben Wölfe in der Regel?", explain: "In der Regel leben Wölfe in Wäldern, an Flussufern und in Graslandschaften (Zeilen 6–7)." },
      tf("Überprüfe die Aussagen mithilfe des Textes und der Mindmap.", [["Die Wölfe wurden von Bären vertrieben.", false], ["Tierforscher sehen die Ansiedlung des Wolfes als Misserfolg.", false],
        ["Tierschützer weisen darauf hin, dass Wölfe bei uns ihre Heimat haben.", true], ["Wölfe suchen den Kontakt zu Menschen.", false], ["Ein Wolf ist schwerer als 50 kg.", false], ["Beeren stehen auf dem Speiseplan der Wölfe.", true]],
        "Suche jede Aussage im Text oder in der Mindmap.",
        "Menschen vertrieben die Wölfe (Z. 1–2). Forscher feiern es als Erfolg (Z. 4). Wölfe meiden Menschen (Z. 13–14). Gewicht bis 43 kg (Mindmap). Beeren stehen in der Mindmap."),
      ch("Welche Überschrift passt zu dem Text?", "Wölfe in Deutschland", ["Der einsame Wolf", "Die Fortpflanzung der Wölfe", "Peter und der Wolf", "Hunde und Wölfe"], "Worum geht es im ganzen Text?"),
      self("Warum passt die Überschrift „Der Wolf und die sieben Geißlein“ nicht? Schreibe zwei Begründungen auf.", "Es ist ein Sachtext und kein Märchen. Es geht um echte Wölfe in Deutschland, nicht um Geißlein."),
    ],
  };

  const T_HONIG = {
    passage: { title: "Wie der Honig in das Glas kommt", paras: [
      "Bienen sind fleißige Tiere. Ein Bienenvolk lebt in einem Bienenstock und besteht aus bis zu 50 000 Tieren. Die meisten davon sind Arbeiterinnen.",
      "Im Frühling und im Sommer fliegen die Arbeiterinnen aus dem Stock. Sie suchen Blumen und trinken den süßen Saft aus den Blüten. Diesen Saft nennt man Nektar. Der Nektar kommt in einen besonderen Magen, den Honigmagen.",
      "Zurück im Stock geben die Bienen den Nektar an andere Bienen weiter. Diese lassen den Saft in den Waben ruhen. Durch die Wärme im Stock verdunstet Wasser, und aus dem dünnen Nektar wird dicker Honig. Zum Schluss verschließen die Bienen die Waben mit einer Wachsschicht.",
      "Der Imker holt die vollen Waben aus dem Stock. Er schleudert sie aus, sodass der Honig herausläuft. Danach wird der Honig gesiebt und in Gläser gefüllt. Einen Teil lässt der Imker den Bienen. Davon leben sie im Winter."] },
    items: [
      ch("Was ist Nektar?", "Der süße Saft aus Blüten", ["Der Honig in den Waben", "Das Wachs der Bienen", "Ein Gerät des Imkers"], "Lies den zweiten Absatz."),
      ch("Wohin kommt der Nektar zuerst, wenn die Biene ihn getrunken hat?", "In den Honigmagen", ["In die Wabe", "In ein Glas", "In den Stock des Imkers"], "Lies den zweiten Absatz bis zum Ende."),
      { type: "order", q: "Bringe die Schritte in die richtige Reihenfolge. Beginne mit dem ersten.", hint: "Tippe die Sätze der Reihe nach an.", items: ["Die Bienen sammeln Nektar in den Blüten.", "Die Bienen verschließen die Waben mit Wachs.", "Der Imker schleudert die Waben aus.", "Der Honig wird in Gläser gefüllt."],
        tip: "Gehe den Text von oben nach unten durch.", explain: "Erst sammeln, dann verschließen, dann schleudern, dann abfüllen." },
      tf("Stimmt die Aussage?", [["Ein Bienenvolk besteht nur aus wenigen Tieren.", false], ["Durch die Wärme im Stock wird aus Nektar dicker Honig.", true], ["Der Imker nimmt den Bienen den ganzen Honig weg.", false], ["Die Bienen verschließen die Waben mit Wachs.", true]],
        "Suche die Stelle im Text.", "Bis zu 50 000 Tiere. Wärme lässt Wasser verdunsten. Einen Teil lässt der Imker den Bienen."),
      ch("Welche Überschrift passt am besten zum Text?", "Wie Honig entsteht", ["Der Imker im Winter", "Die schönsten Blumen", "Wie Bienen fliegen lernen"], "Worum geht es im ganzen Text?"),
      self("Warum lässt der Imker den Bienen einen Teil des Honigs?", "Damit die Bienen im Winter etwas zu essen haben."),
    ],
  };

  const T_FAHRRAD = {
    passage: { title: "Das verlorene Fahrrad", paras: [
      "Am Samstagmorgen schloss Ben sein neues Fahrrad vor der Bäckerei ab. Er wollte nur schnell Brötchen für die Familie holen. In der Schlange standen viele Leute, und Ben musste lange warten.",
      "Als er endlich wieder auf die Straße trat, war sein Fahrrad weg. Ben erschrak. Sein Herz klopfte laut. Er suchte links und rechts, aber er sah nur ein altes, rostiges Rad am Zaun.",
      "Da kam Frau Kaya, die Bäckerin, aus dem Laden. „Ich habe gesehen, wie ein Junge dein Rad zur Seite geschoben hat“, sagte sie. „Es steht hinter dem Haus.“ Ben rannte hinters Haus. Dort stand sein Fahrrad, ganz sicher abgestellt. Ein Junge hatte es nur aus dem Weg gerollt, weil ein Lieferwagen anhalten musste.",
      "Ben lachte erleichtert. Er bedankte sich bei Frau Kaya und nahm sein Rad mit. Die Brötchen waren zu Hause noch warm."] },
    items: [
      ch("Was wollte Ben in der Bäckerei machen?", "Brötchen für die Familie holen", ["Frau Kaya besuchen", "Sein Fahrrad reparieren", "Einen Kuchen backen"], "Lies den ersten Absatz."),
      ch("Warum erschrak Ben?", "Sein Fahrrad war nicht mehr da.", ["Er hatte kein Geld dabei.", "Die Bäckerei war geschlossen.", "Ein Lieferwagen fuhr zu schnell."], "Lies den zweiten Absatz."),
      ch("Wer half Ben?", "Frau Kaya, die Bäckerin", ["Ein Junge mit Fahrrad", "Der Lieferwagenfahrer", "Seine Familie"], "Lies den dritten Absatz."),
      ch("Warum stand das Fahrrad hinter dem Haus?", "Ein Junge hatte es aus dem Weg gerollt, weil ein Lieferwagen anhalten musste.", ["Ben hatte es dort selbst abgestellt.", "Ein Dieb hatte es dort versteckt.", "Frau Kaya hatte es repariert."], "Lies die letzten Sätze des dritten Absatzes."),
      ch("Wie fühlt sich Ben am Ende der Geschichte?", "erleichtert", ["wütend", "traurig", "gelangweilt"], "Lies den letzten Absatz. Wie lacht Ben?"),
      tf("Stimmt die Aussage?", [["Die Geschichte spielt an einem Samstag.", true], ["Frau Kaya hat das Fahrrad gestohlen.", false], ["Ben suchte nach seinem Fahrrad.", true], ["Ben hat sein Fahrrad nicht abgeschlossen.", false]],
        "Suche die Stelle im Text.", "Samstagmorgen, Ben schloss das Rad ab, Frau Kaya half ihm."),
    ],
  };

  const T_PINGUIN = {
    passage: { title: "Pinguine", paras: [
      "Pinguine sind Vögel, die nicht fliegen können. Sie leben auf der Südhalbkugel der Erde, die meisten in der Nähe der Antarktis. Mit ihren Flügeln, die wie Flossen aussehen, schwimmen sie schnell durchs Wasser.",
      "Pinguine fressen vor allem Fische, kleine Krebse und Tintenfische. Zum Jagen tauchen sie oft viele Minuten lang. Ihre Federn liegen dicht aneinander und sind eingefettet. So bleibt das kalte Wasser draußen. Unter der Haut schützt eine dicke Fettschicht vor der Kälte.",
      "Der Kaiserpinguin ist die größte Pinguinart. Er wird über einen Meter groß. Im Winter legt das Weibchen ein einziges Ei. Danach wandert es zum Meer, um Nahrung zu holen. Das Männchen bleibt zurück und wärmt das Ei auf seinen Füßen. Es hungert dabei oft mehr als zwei Monate."] },
    items: [
      ch("Wo leben die meisten Pinguine?", "Auf der Südhalbkugel, nahe der Antarktis", ["Im Regenwald", "Am Nordpol", "In der Wüste"], "Lies den ersten Absatz."),
      ch("Wozu benutzen Pinguine ihre Flügel?", "Zum Schwimmen", ["Zum Fliegen", "Zum Graben", "Zum Klettern"], "Lies den ersten Absatz bis zum Ende."),
      tf("Stimmt die Aussage?", [["Pinguine können gut fliegen.", false], ["Die Federn der Pinguine sind eingefettet.", true], ["Der Kaiserpinguin ist die kleinste Pinguinart.", false], ["Das Männchen wärmt das Ei auf seinen Füßen.", true]],
        "Suche die Stelle im Text.", "Pinguine fliegen nicht. Federn sind eingefettet. Der Kaiserpinguin ist die größte Art."),
      { type: "multi", q: "Was schützt Pinguine vor der Kälte? Wähle zwei Antworten.", opts: ["Eine dicke Fettschicht unter der Haut", "Dicht liegende, eingefettete Federn", "Ein dickes Fell", "Ein warmes Nest aus Stroh"], ans: [0, 1],
        tip: "Lies den zweiten Absatz noch einmal.", explain: "Fettschicht und eingefettete Federn schützen vor der Kälte." },
      ch("Welche Überschrift passt am besten?", "Pinguine – Schwimmer im Eis", ["Wie Pinguine fliegen lernen", "Die Antarktis im Winter", "Ein Kaiserpinguin im Zoo"], "Worum geht es im ganzen Text?"),
      self("Warum geht das Weibchen im Winter zum Meer?", "Es holt dort Nahrung (Fische)."),
    ],
  };

  /* ================= Rechtschreiben ================= */
  const STRAT = ["Ableiten", "Verlängern", "Merken"];
  // Wort, Buchstabe(n), Strategie, Hilfswort
  const ST = [
    ["Räuber", "äu", 0, "rauben"], ["Bäcker", "ä", 0, "backen"], ["Häuser", "äu", 0, "Haus"], ["Äpfel", "Ä", 0, "Apfel"], ["bräunlich", "äu", 0, "braun"],
    ["Kälte", "ä", 0, "kalt"], ["Mäuse", "äu", 0, "Maus"], ["Wärme", "ä", 0, "warm"], ["Städte", "ä", 0, "Stadt"], ["Händler", "ä", 0, "Hand"],
    ["Berg", "g", 1, "Berge"], ["Hund", "d", 1, "Hunde"], ["Kind", "d", 1, "Kinder"], ["Dieb", "b", 1, "Diebe"], ["Zug", "g", 1, "Züge"],
    ["durstig", "g", 1, "durstige"], ["Wald", "d", 1, "Wälder"], ["Mond", "d", 1, "Monde"], ["er fliegt", "g", 1, "fliegen"], ["er tobt", "b", 1, "toben"],
    ["sie liebt", "b", 1, "lieben"], ["sie schreibt", "b", 1, "schreiben"],
  ];
  const ST_MERK = [["Vater", "V", 2], ["Vogel", "V", 2], ["viel", "V", 2]];
  const strat = ST.map(([w, l, k]) => ({ type: "choice", fixed: true, q: `Der Buchstabe „${l}“ in „${w}“: Welche Rechtschreibstrategie hilft?`, opts: STRAT, ans: k,
    tip: k === 0 ? "Ableiten: Suche ein verwandtes Wort mit a oder au." : "Verlängern: Mach das Wort länger (Mehrzahl, oder die Grundform des Verbs) und höre genau hin.",
    explain: `„${w}“ → ${STRAT[k]}: ${ST.find((x) => x[0] === w)[3]}.` }))
    .concat(ST_MERK.map(([w, l]) => ({ type: "choice", fixed: true, q: `Der Buchstabe „${l}“ in „${w}“: Welche Rechtschreibstrategie hilft?`, opts: STRAT, ans: 2,
      tip: "Manche Wörter schreibt man, wie man sie sich gemerkt hat. Ableiten und Verlängern helfen hier nicht.", explain: `„${w}“ ist ein Merkwort.` })));
  const hilf = ST.map(([w, l, k, h]) => ({ type: "write", q: `Schreibe das Wort, das beim Buchstaben „${l}“ in „${w}“ hilft (${STRAT[k].toLowerCase()}).`, ans: [h],
    tip: k === 0 ? "Suche ein verwandtes Wort." : "Mach das Wort länger.", explain: `${w} → ${h}` }));

  const gr = (txt, caps) => { const tokens = txt.split(" "); return { type: "pick", q: "Tippe alle Wörter an, die großgeschrieben werden müssen.", tokens, ans: caps,
    tip: "Groß schreibt man: das erste Wort im Satz, Nomen (Dinge, Lebewesen, Gefühle) und Namen.",
    explain: `Groß: ${caps.map((i) => tokens[i][0].toUpperCase() + tokens[i].slice(1).replace(/[.]$/, "")).join(", ")}` }; };
  const gross = [
    gr("die meisten kinder und erwachsenen essen gerne von den leckeren süßigkeiten.", [0, 2, 4, 10]),
    gr("in vielen geschichten spielen tiere eine wichtige rolle.", [0, 2, 4, 7]),
    gr("der wolf wird in märchen häufig als gemeines ungeheuer beschrieben.", [0, 1, 4, 8]),
    gr("am wochenende besucht anna ihre oma in hamburg.", [0, 1, 3, 5, 7]),
    gr("im winter liegt auf den bergen viel schnee.", [0, 1, 5, 7]),
    gr("mein bruder spielt gern mit dem ball im garten.", [0, 1, 6, 8]),
    gr("die lehrerin liest den kindern eine spannende geschichte vor.", [0, 1, 4, 7]),
    gr("am morgen trinkt papa heißen kaffee und mama grünen tee.", [0, 1, 3, 5, 7, 9]),
    gr("tom und lisa fahren im sommer nach italien.", [0, 2, 5, 7]),
    gr("viele menschen haben angst vor der dunkelheit.", [0, 1, 3, 6]),
  ];

  const fe = (txt, wrong, fixes) => { const tokens = txt.split(" "); return { type: "pick", q: "In dem Satz sind 2 Rechtschreibfehler versteckt. Tippe die falsch geschriebenen Wörter an.", tokens, ans: wrong,
    tip: "Lies Wort für Wort langsam. Sprich jedes Wort leise mit. Wo stimmen die Buchstaben nicht?", explain: `Richtig: ${fixes.join(", ")}` }; };
  const fehler = [
    fe("Am Morgen müsen Kinder in der Schule ihre Kaugummis ausspuken.", [2, 9], ["müssen", "ausspucken"]),
    fe("Der Briefträger felt vor Schreck fast vom Fahrad.", [2, 7], ["fällt", "Fahrrad"]),
    fe("Die Kinder spilen im Garten und sameln bunte Blätter.", [2, 6], ["spielen", "sammeln"]),
    fe("Im Winter ist es drausen kalt, deshalb ziehen wir warme Jaken an.", [4, 10], ["draußen", "Jacken"]),
    fe("Mein Bruder hat gestern einen spanenden Fillm gesehen.", [5, 6], ["spannenden", "Film"]),
    fe("Wir fahren im Sommer an den See und schwimen den ganzen Tag, bis die Sone untergeht.", [8, 14], ["schwimmen", "Sonne"]),
  ];

  const rede = (q, right, wrong, why) => ({ type: "choice", q, opts: [right].concat(wrong), ans: 0, tip: "Redezeichen: unten am Anfang, oben am Ende. Der Begleitsatz wird mit Doppelpunkt oder Komma abgetrennt.", explain: why });
  const wortrede = [
    rede("Welcher Satz ist richtig geschrieben?", "Karl sagt: „Ich habe Lust auf ein Eis.“", ["Karl sagt „Ich habe Lust auf ein Eis“.", "Karl sagt: Ich habe Lust auf ein Eis.", "Karl sagt: „Ich habe Lust auf ein Eis“."], "Vorangestellter Begleitsatz: Doppelpunkt, dann die Rede in Zeichen. Der Punkt steht in der Rede."),
    rede("Welcher Satz ist richtig geschrieben?", "„Sind Lollis in der Schule verboten?“, fragt Lisa.", ["„Sind Lollis in der Schule verboten“?, fragt Lisa.", "Sind Lollis in der Schule verboten?, fragt Lisa.", "„Sind Lollis in der Schule verboten?“ fragt Lisa."], "Nach der Rede mit Fragezeichen kommt ein Komma, dann der Begleitsatz."),
    rede("Welcher Satz ist richtig geschrieben?", "„Wir gehen heute ins Kino“, sagt Mia.", ["„Wir gehen heute ins Kino.“, sagt Mia.", "Wir gehen heute ins Kino, sagt Mia.", "„Wir gehen heute ins Kino“ sagt Mia."], "Nachgestellter Begleitsatz: Der Punkt entfällt, dafür steht ein Komma hinter den Zeichen."),
    rede("Welcher Satz ist richtig geschrieben?", "Papa fragt: „Wer hat den Kuchen gegessen?“", ["Papa fragt „Wer hat den Kuchen gegessen“?", "Papa fragt: Wer hat den Kuchen gegessen?", "Papa fragt: „Wer hat den Kuchen gegessen“?"], "Das Fragezeichen gehört zur Rede und steht darin."),
    rede("Welcher Satz ist richtig geschrieben?", "„Bitte seid leise!“, ruft die Lehrerin.", ["„Bitte seid leise!“ ruft die Lehrerin.", "Bitte seid leise!, ruft die Lehrerin.", "„Bitte seid leise“!, ruft die Lehrerin."], "Auch nach einem Ausrufezeichen kommt ein Komma, wenn der Begleitsatz folgt."),
    rede("Welcher Satz ist richtig geschrieben?", "Tom ruft: „Wartet auf mich!“", ["Tom ruft „Wartet auf mich“!", "Tom ruft: Wartet auf mich!", "Tom ruft: „Wartet auf mich“!"], "Das Ausrufezeichen gehört zur Rede."),
  ];

  const tr = (letters, ans) => ({ type: "write", strict: true, q: "Alle Wörter sind zusammengeschrieben. Schreibe den Satz richtig auf (Wortabstände, Groß- und Kleinschreibung, Punkt).", show: letters.split("").join(" "),
    ans: [ans, ans.replace(/\.$/, "")], tip: "Suche erst die einzelnen Wörter. Das erste Wort und Nomen schreibst du groß.", explain: ans });
  const trenne = [
    tr("UNSEREMANNSCHAFTHATDASLETZTESPIELVERLOREN", "Unsere Mannschaft hat das letzte Spiel verloren."),
    tr("MEINONKELWOHNTINEINEMALTENHAUS", "Mein Onkel wohnt in einem alten Haus."),
    tr("DIEKATZELIEGTAUFDEMWARMENSOFA", "Die Katze liegt auf dem warmen Sofa."),
    tr("LENALIESTEINSPANNENDESBUCH", "Lena liest ein spannendes Buch."),
    tr("IMGARTENWACHSENBUNTEBLUMEN", "Im Garten wachsen bunte Blumen."),
    tr("WIRSPIELENAMNACHMITTAGIMPARKTENNIS", "Wir spielen am Nachmittag im Park Tennis."),
  ];

  const sw = (q, right, wrong, tip) => ({ type: "choice", q, opts: [right].concat(wrong), ans: 0, tip, explain: `Richtig: ${right}` });
  const KV = "Nach einem kurzen Selbstlaut folgt meistens ein doppelter Mitlaut.";
  const schreib = [
    sw("Wie schreibt man das Wort richtig?", "Ball", ["Bal", "Bahl", "Balll"], KV),
    sw("Wie schreibt man das Wort richtig?", "Brücke", ["Brüke", "Brükke", "Brücce"], "Nach einem kurzen Selbstlaut steht ck statt kk."),
    sw("Wie schreibt man das Wort richtig?", "Katze", ["Kaze", "Katse", "Kazze"], "Nach einem kurzen Selbstlaut steht tz statt zz."),
    sw("Wie schreibt man das Wort richtig?", "Wiese", ["Wise", "Wihse", "Wieße"], "Ein lang gesprochenes i schreibt man meistens ie."),
    sw("Wie schreibt man das Wort richtig?", "Fuß", ["Fuss", "Fus", "Fuhs"], "Nach einem langen Selbstlaut steht ß."),
    sw("Wie schreibt man das Wort richtig?", "Schloss", ["Schlos", "Schloß", "Schlooss"], "Nach einem kurzen Selbstlaut steht ss."),
    sw("Wie schreibt man das Wort richtig?", "Mitte", ["Mite", "Mitt", "Mitthe"], KV),
    sw("Wie schreibt man das Wort richtig?", "Lied", ["Lid", "Liet", "Lihd"], "Ein lang gesprochenes i schreibt man meistens ie."),
    sw("Wie schreibt man das Wort richtig?", "Stuhl", ["Stul", "Stuhll", "Stuel"], "Manche Wörter haben ein h, das man nicht hört. Merke dir das Wort."),
    sw("Welche Buchstaben fehlen? Wortfamilie „wissen“: Ich wei_ , dass ich morgen in die Schule gehen muss.", "ß", ["ss", "s", "z"], "wissen – ich weiß: Bei dieser Wortfamilie wechselt ss zu ß."),
    sw("Welche Buchstaben fehlen? Wortfamilie „wissen“: Ihr wi_t genau, dass wir bald Ferien haben.", "ss", ["ß", "s", "tz"], "wissen – ihr wisst: Hier bleibt es bei ss."),
  ];

  /* ================= Sprache untersuchen: mehr ================= */
  const stm = (w, stem, others) => ({ type: "choice", q: `Was ist der Wortstamm von „${w}“?`, opts: [stem].concat(others), ans: 0, tip: "Der Wortstamm bleibt in allen Wörtern der Familie gleich. Streiche Vorsilben und Endungen weg.", explain: `Wortstamm von „${w}“: ${stem}` });
  const wortstamm = [
    stm("Mitfahrer", "fahr", ["mit", "er", "fahrer"]), stm("abgefahren", "fahr", ["ab", "gefahr", "ren"]), stm("verspielt", "spiel", ["ver", "spielt", "elt"]),
    stm("Spielplatz", "spiel", ["platz", "spielpl", "Spielplatz"]), stm("unfreundlich", "freund", ["un", "lich", "unfreund"]), stm("Freundschaft", "freund", ["schaft", "freundsch", "Freunds"]),
    stm("beschreiben", "schreib", ["be", "schreiben", "reiben"]), stm("Schreibtisch", "schreib", ["tisch", "schreibt", "Schreibtis"]),
  ];
  const bw = (w, best, art, why) => ({ type: "choice", fixed: true, q: `Zu welcher Wortart gehört das Bestimmungswort von „${w}“ („${best}“)?`, opts: ["Nomen", "Verb", "Adjektiv"], ans: ["Nomen", "Verb", "Adjektiv"].indexOf(art),
    tip: "Das Bestimmungswort steht vorn. Frage: Ist es ein Ding (Nomen), eine Tätigkeit (Verb) oder wie etwas ist (Adjektiv)?", explain: why || `${best}: ${art}` });
  const bestimmung = [
    bw("Schwimmbad", "schwimmen", "Verb"), bw("Vogelkäfig", "Vogel", "Nomen"), bw("Buntspecht", "bunt", "Adjektiv"), bw("Schreibtisch", "schreiben", "Verb"),
    bw("Lesebuch", "lesen", "Verb"), bw("Dunkelkammer", "dunkel", "Adjektiv"), bw("Apfelsaft", "Apfel", "Nomen"), bw("Rotkohl", "rot", "Adjektiv"),
  ];
  const ZR = ["Präteritum (schriftliche Vergangenheit)", "Perfekt (gesprochene Vergangenheit)", "Präsens (Gegenwart)"];
  const zm = (rows) => mt("Verbinde die Sätze mit den passenden Zeitformen.", rows.map((r) => r[0]), ZR, rows.map((r) => r[1]),
    "Präteritum: ein Wort (malte). Perfekt: haben/sein + ge… (hat gemalt). Präsens: jetzt (malt).", rows.map((r) => `${r[0]} → ${ZR[r[1]].split(" ")[0]}`).join(" · "));
  const zeitmatch = [
    zm([["Ich habe ein schönes Bild gemalt.", 1], ["Paula malt mit ihren neuen Stiften.", 2], ["Leyla malte einen Schmetterling.", 0]]),
    zm([["Wir sind gestern ins Kino gegangen.", 1], ["Er spielt gerade Gitarre.", 2], ["Der Hund rannte durch den Garten.", 0]]),
    zm([["Sie liest ein dickes Buch.", 2], ["Sie las ein dickes Buch.", 0], ["Sie hat ein dickes Buch gelesen.", 1]]),
    zm([["Wir backen einen Kuchen.", 2], ["Wir haben einen Kuchen gebacken.", 1], ["Wir backten einen Kuchen.", 0]]),
  ];
  const sc = (txt, cuts) => { const tokens = txt.split(" "); return { type: "cut", q: "Zerlege den Satz in Satzglieder. Tippe zwischen die Wörter, wo ein Satzglied zu Ende ist.", tokens, ans: cuts,
    tip: "Umstellprobe: Verschiebe Wortgruppen im Satz. Was beim Verschieben zusammenbleibt, ist ein Satzglied.", explain: tokens.map((w, i) => w + (cuts.includes(i) ? " |" : "")).join(" ") }; };
  const satzcut = [
    sc("Der kleine Hund spielt mit seinem Ball auf der Wiese.", [2, 3, 6]), sc("Junge Wölfe verlassen nach ein bis zwei Jahren ihr Rudel.", [1, 2, 7]),
    sc("Am Nachmittag geht Lisa mit ihrer Freundin ins Kino.", [1, 2, 3, 6]), sc("Meine Oma backt jeden Sonntag einen Kuchen.", [1, 2, 4]),
    sc("Der Bus fährt heute pünktlich zur Schule.", [1, 2, 3, 4]), sc("Im Sommer schwimmen wir im See.", [1, 2, 3]),
    sc("Tom und Ben spielen im Park Fußball.", [2, 3, 5]), sc("Die Kinder essen in der Pause ihr Frühstück.", [1, 2, 5]),
  ];
  const sg = (left, right, ans) => mt("Welche Satzglieder passen zusammen? Mehrere Verbindungen sind möglich, manchmal passt auch keine.", left, right, ans,
    "Das Prädikat muss zum Subjekt passen: ich … -e, du … -st, er/sie/es … -t, wir/sie … -en.", left.map((l, i) => `${l} ${ans[i].length ? ans[i].map((j) => right[j]).join(" / ") : "(passt nicht)"}`).join(" · "));
  const satzmatch = [
    sg(["Ein Kind …", "Wir …", "Ich …", "Viele Leute …"], ["… kauen Kaugummi."], [[], [0], [], [0]]),
    sg(["Der Hund …", "Die Hunde …", "Du …"], ["… bellt laut.", "… bellen laut.", "… bellst laut."], [[0], [1], [2]]),
    sg(["Ich …", "Wir …", "Er …", "Die Kinder …"], ["… lese ein Buch.", "… lesen ein Buch.", "… liest ein Buch."], [[0], [1], [2], [1]]),
    sg(["Mia …", "Mia und Tom …", "Du …", "Ich …"], ["… spiele Fußball.", "… spielen Fußball.", "… spielst Fußball.", "… spielt Fußball."], [[3], [1], [2], [0]]),
  ];
  const gf = (satz, form, ans) => ({ type: "write", q: `„${satz}“ Schreibe das Verb in der Grundform: ${form}`, ans: [ans], tip: "Die Grundform endet auf -en (oder -n): Sie passt in den Satz „Ich möchte …“.", explain: `Grundform: ${ans}` });
  const grundform = [
    gf("Am Nachmittag ging er zu seinem Freund Tom.", "ging →", "gehen"), gf("Sie läuft jeden Morgen durch den Park.", "läuft →", "laufen"),
    gf("Wir haben gestern einen Film gesehen.", "gesehen →", "sehen"), gf("Der Hund bellte laut.", "bellte →", "bellen"),
    gf("Ich schlafe gern lange.", "schlafe →", "schlafen"), gf("Mia aß einen Apfel.", "aß →", "essen"),
    gf("Die Vögel flogen davon.", "flogen →", "fliegen"), gf("Er nahm seine Jacke.", "nahm →", "nehmen"),
  ];
  const pt = (q, ans) => ({ type: "write", q, ans: [ans], tip: "Sprich den Satz laut mit „gestern“ oder „heute“. Welches Wort passt?", explain: ans });
  const praeteritum = [
    pt("Präteritum: wir füttern → wir ___", "fütterten"), pt("Präteritum: es schwimmt → es ___", "schwamm"), pt("Präteritum: sie spielen → sie ___", "spielten"),
    pt("Präsens: er sang → er ___", "singt"), pt("Präteritum: ich lese → ich ___", "las"), pt("Präsens: wir fuhren → wir ___", "fahren"),
    pt("Präteritum: du trinkst → du ___", "trankst"), pt("Präteritum: er geht → er ___", "ging"), pt("Präsens: sie lachten → sie ___", "lachen"), pt("Präteritum: ich male → ich ___", "malte"),
  ];
  const ve = (w, s) => ({ type: "choice", q: `Warum ist „${w}“ im Satz „${s}“ ein Verb?`, opts: [`Man kann es in der Zeit verändern (gestern … ).`, "Man kann einen Artikel davorsetzen.", "Man kann es steigern.", "Es steht am Satzanfang."], ans: 0, fixed: true,
    tip: "Verben kann man verändern: Gegenwart (rennen), Vergangenheit (rannten).", explain: `Man kann „${w}“ verändern, zum Beispiel in die Vergangenheit.` });
  const verberklaer = [
    ve("rennen", "Luis und Ali rennen über den Schulhof."), ve("lachen", "Die Kinder lachen laut."), ve("singen", "Wir singen ein Lied."), ve("backen", "Oma backt einen Kuchen."),
  ];

  /* ---------- zusätzliche Aufgaben für bestehende Bänke (werden in kompass-data.js ergänzt, falls vorhanden) ---------- */
  const EXTRA = {
    steigerung: [
      { type: "write", q: "Steigere das Adjektiv: ___ – klüger – am klügsten", ans: ["klug"], tip: "Grundform – 1. Steigerungsstufe (-er) – 2. Steigerungsstufe (am …-sten).", explain: "klug – klüger – am klügsten" },
      { type: "write", q: "Steigere das Adjektiv: jung – ___ – am jüngsten", ans: ["jünger", "juenger"], tip: "Aus u wird ü: jung – jünger.", explain: "jung – jünger – am jüngsten" },
      { type: "write", q: "Steigere das Adjektiv: stark – stärker – am ___", ans: ["stärksten", "staerksten"], tip: "2. Steigerungsstufe: am …-sten.", explain: "stark – stärker – am stärksten" },
      { type: "write", q: "Steigere das Adjektiv: schön – schöner – am ___", ans: ["schönsten", "schoensten"], tip: "2. Steigerungsstufe: am …-sten.", explain: "schön – schöner – am schönsten" },
    ],
    zusammen: [
      { type: "write", q: "Bilde zusammengesetzte Nomen. Ein Regal für Bücher ist ein ___.", ans: ["Bücherregal", "Buecherregal"], tip: "Das Wort, das sagt, was es ist, steht hinten: Regal. Das Bestimmungswort steht vorn: Bücher.", explain: "Bücherregal" },
      { type: "write", q: "Bilde zusammengesetzte Nomen. Eine Höhle, in der Räuber wohnen, ist eine ___.", ans: ["Räuberhöhle", "Raeuberhoehle"], tip: "Das Wort, das sagt, was es ist, steht hinten: Höhle.", explain: "Räuberhöhle" },
      { type: "write", q: "Bilde zusammengesetzte Nomen. Ein Haus aus Holz ist ein ___.", ans: ["Holzhaus"], tip: "Bestimmungswort vorn (Holz), Grundwort hinten (Haus).", explain: "Holzhaus" },
      { type: "write", q: "Bilde zusammengesetzte Nomen. Ein Schuh für den Sport ist ein ___.", ans: ["Sportschuh"], tip: "Bestimmungswort vorn (Sport), Grundwort hinten (Schuh).", explain: "Sportschuh" },
      { type: "write", q: "Bilde zusammengesetzte Nomen. Eine Dose für das Brot ist eine ___.", ans: ["Brotdose"], tip: "Bestimmungswort vorn (Brot), Grundwort hinten (Dose).", explain: "Brotdose" },
    ],
    luecke: [
      { type: "choice", q: "Setze das Adjektiv passend ein (fleißig): Die ___ Köche rühren um.", opts: ["fleißigen", "fleißige", "fleißiger", "fleißiges"], ans: 0, tip: "Die Köche – Mehrzahl: die fleißigen Köche.", explain: "Die fleißigen Köche rühren um." },
      { type: "choice", q: "Setze das Adjektiv passend ein (heiß): Die Köche rühren die ___ Suppe um.", opts: ["heiße", "heißen", "heißer", "heißes"], ans: 0, tip: "die Suppe – die heiße Suppe.", explain: "… die heiße Suppe um." },
      { type: "choice", q: "Setze das Adjektiv passend ein (klein): Der ___ Junge spielt im Sand.", opts: ["kleine", "kleinen", "kleiner", "kleines"], ans: 0, tip: "der Junge – der kleine Junge.", explain: "Der kleine Junge spielt im Sand." },
    ],
  };

  const BANK = {
    "de.lesen.kaugummi": { area: "de.lesen", name: "Lesetext: Kaugummi (Original 2025)", solo: true, passage: T_KAUGUMMI.passage, source: T_KAUGUMMI.source, items: T_KAUGUMMI.items },
    "de.lesen.wolf": { area: "de.lesen", name: "Lesetext: Wölfe (Original 2024)", solo: true, passage: T_WOLF.passage, source: T_WOLF.source, items: T_WOLF.items },
    "de.lesen.honig": { area: "de.lesen", name: "Lesetext: Honig", solo: true, passage: T_HONIG.passage, items: T_HONIG.items },
    "de.lesen.fahrrad": { area: "de.lesen", name: "Lesetext: Das verlorene Fahrrad", solo: true, passage: T_FAHRRAD.passage, items: T_FAHRRAD.items },
    "de.lesen.pinguin": { area: "de.lesen", name: "Lesetext: Pinguine", solo: true, passage: T_PINGUIN.passage, items: T_PINGUIN.items },
    "de.recht.strat": { area: "de.recht", name: "Strategie wählen", items: strat },
    "de.recht.hilf": { area: "de.recht", name: "Ableiten und verlängern", items: hilf },
    "de.recht.gross": { area: "de.recht", name: "Groß- und Kleinschreibung", items: gross },
    "de.recht.fehler": { area: "de.recht", name: "Fehler finden", items: fehler },
    "de.recht.rede": { area: "de.recht", name: "Wörtliche Rede", items: wortrede },
    "de.recht.trenne": { area: "de.recht", name: "Wörter trennen und schreiben", items: trenne },
    "de.recht.schreib": { area: "de.recht", name: "Richtig schreiben", items: schreib },
    "de.wortstamm": { area: "de.sprache", name: "Wortstamm", items: wortstamm },
    "de.bestimmung": { area: "de.sprache", name: "Bestimmungswort", items: bestimmung },
    "de.zeitmatch": { area: "de.sprache", name: "Zeitformen verbinden", items: zeitmatch },
    "de.satzcut": { area: "de.sprache", name: "Satzglieder trennen", items: satzcut },
    "de.satzmatch": { area: "de.sprache", name: "Subjekt und Prädikat verbinden", items: satzmatch },
    "de.grundform": { area: "de.sprache", name: "Verb in der Grundform", items: grundform },
    "de.praeteritum": { area: "de.sprache", name: "Präsens und Präteritum", items: praeteritum },
    "de.verberklaer": { area: "de.sprache", name: "Warum ist es ein Verb?", items: verberklaer },
  };

  const api = { BANK2: BANK, EXTRA };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.DEKompassText = api; if (root.DEKompass) { root.DEKompass.attachBank(BANK); root.DEKompass.extendBank(EXTRA); } }
})(typeof self !== "undefined" ? self : this);
