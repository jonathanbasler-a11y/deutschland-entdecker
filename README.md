# Deutschland-Entdecker

Lern-App fürs iPad, 4. Klasse, Baden-Württemberg. Oben wählt man das Fach:
- **🗺️ Deutschland**: LZK „Deutschland“ (Sachunterricht). Karte zum Antippen, Sterne, Punkte, Abzeichen und eine Probe-LZK mit Note.
- **🧮 Kopfrechnen**: großes Einmaleins mal und geteilt, mit Zehnern und Hundertern, für den Kopfrechentest auf Zeit.

Name, Serie, Töne, ruhiger Modus, Vorlesen, Bewegungspause, Eltern-Übersicht und der Hund gelten für beide Fächer. Punkte, Ränge und Abzeichen hat jedes Fach für sich.

## Der Begleiter-Hund, Bosse und Rennen (beide Fächer)
Eigener Pixel-Stil mit eigenen Figuren, alles in `public/begleiter.js` gezeichnet.
- **Pixel-Hund**: Beim ersten Start bekommt er einen Namen. Er wächst mit den Punkten aus allen Fächern zusammen: Welpe (0), Junghund (300), Großer Hund (900), Held-Hund (2000). Dazu kommen Halstuch, Helm, Fackel und Umhang.
  - Er wedelt, wenn heute geübt wurde, begrüßt einmal am Tag und lässt sich streicheln.
  - In jeder Runde sitzt er oben in der Leiste: Bei richtigen Antworten hüpft er, bei 5 in Folge macht er einen Salto.
- **Bauprojekte**: Blöcke für Hundehütte, Garten, Turm und Brücke. Etappe geschafft +3, Boss besiegt +2 (großer Boss +3), Runde geschafft +1, neuer Rekord oder Probe +2.
- **Boss am Ende jeder Etappe** (Tagesmission Deutschland und Tagestraining Kopfrechnen):
  - 3 Herzen, in Etappe 3 sind es 5.
  - Die Boss-Aufgaben sind die Fehler aus der Etappe.
  - Bei einem Fehler blockt der Boss, und die Aufgabe kommt wieder. Der Boss kann nicht gewinnen.
  - Jeder besiegte Boss bringt einen Pokal.
  - In der Eltern-Übersicht abschaltbar.
- **Rennen gegen den eigenen Rekord** in der Blitzrunde: Ein Geister-Hund läuft den besten Lauf nach. Überholen wird gemeldet; jeder neue Rekord wird der neue Geist.
- **Steigende Töne**: Jede richtige Antwort in Folge klingt einen Halbton höher. Dazu fliegen Punkte zur Punktezahl und Pixel-Splitter.
- Der ruhige Modus schaltet Salto, Splitter und fliegende Punkte ab.

## Kopfrechnen
**Rechen-Turm** mit 8 Stufen. Ein Stern auf einer Stufe öffnet die nächste:
1. Kleines 1×1 mal (7 · 8)
2. Kleines 1×1 geteilt (56 : 7)
3. Nullen-Trick (36 · 10, 4200 : 100)
4. Mit Zehnern mal (7 · 90, 70 · 9)
5. Mit Zehnern geteilt (640 : 8, 640 : 80)
6. Mit Hundertern (7 · 900, 6300 : 9, 6300 : 900)
7. Zehner mal Zehner (70 · 90, 6300 : 70)
8. Zusatz: 11er bis 19er (13 · 7, 91 : 13, 13 · 70), Ergebnisse höchstens 999

Sterne: ★ 8 von 10 richtig, ★★ 80 % der letzten 20, ★★★ 90 % und im Mittel unter der Zielzeit. Sterne gehen nicht wieder verloren.

- **Tagestraining**: 3 Etappen à 10 Aufgaben (Aufwärmen, neue Stufe, Tempo) mit Bewegungspause dazwischen
- **Ziffernblock** auf dem Bildschirm (die iPad-Tastatur springt nicht auf); eine echte Tastatur geht auch
- **Bei Fehlern**: erst ein Rechentrick als Tipp („Rechne zuerst 64 : 8, dann eine Null dran“), beim zweiten Fehler der ganze Rechenweg. Die Aufgabe kommt in derselben Runde noch einmal und danach öfter, bis sie sitzt.
- **Belohnung**: Punkte, Serie (🔥 richtig hintereinander), Blitz-Bonus fürs schnelle Rechnen, Konfetti, Ränge und Abzeichen. Zeit wird beim Üben nur belohnt, nie bestraft.
- **Blitzrunde**: 60 Sekunden, so viele wie möglich, mit Rekord
- **Test-Training** wie in der Schule: *Einzeln* (vorgelesen, Zeit pro Aufgabe, auf Wunsch nur hören) oder als *Blatt* (alle Aufgaben, eine Gesamtzeit). Am Ende Note zur Orientierung und „Nur die Fehler üben“.
- **Eltern-Übersicht → Reiter Kopfrechnen**: Sterne je Stufe, Trefferquote und Tempo, **1×1-Tabelle** (welche Grundaufgabe hakt; 640 : 80 zählt bei 8 · 8), was noch wackelt, Test-Verlauf. Dort auch einstellen: Testart, Anzahl, Zeit, Zielzeit, Rundenlänge, Zusatzstufe an/aus, alle Stufen freischalten, Test-Datum.

## Neues Fach hinzufügen
Ein Fach ist eine eigene Datei wie `public/fach-rechnen.js`, die sich bei `window.DE_FAECHER` anmeldet
(`id`, `prefix`, `name`, `icon`, `home`, `render`, `act`, `badges`, `activeOn`, `xp`, `parents`, `bindParents`).
Hund, Boss, Rennen und Effekte stellt `core` bereit (`gdog`, `petReact`, `bossUI`, `bossOn`, `race`, `fx`, `giveBlocks`).
Ansichten und `data-act` des Fachs beginnen mit dem `prefix`. Dann die Datei in `public/index.html` vor `app.js` einbinden
und in `public/sw.js` in die Liste `FILES` eintragen (und `CACHE` hochzählen). Der Fach-Reiter erscheint von selbst.

## Was geübt wird
- Allgemeines: Einwohnerzahl, 16 Bundesländer, 3 Stadtstaaten, Begriff „Stadtstaat“, Flagge, Kanzler, EU, Hauptstadt
- 9 Nachbarländer
- 16 Bundesländer
- Rhein, Donau, Elbe, Weser, Neckar, Bodensee, Nordsee, Ostsee
- Alpenvorland, Schwarzwald, Schwäbische Alb, Eifel, Harz, Erzgebirge, Bayerischer Wald

Jeder Begriff hat bis zu 3 Sterne: **Auswählen**, **Finden** (auf der Karte antippen) und **Schreiben**.

## Für Kinder mit ADHS / Konzentrationsschwäche gestaltet
- **Tagesmission**: ein klarer nächster Schritt, 3 kurze Etappen à 6 Aufgaben, sichtbarer Fortschritt
- **Bewegungspause** (20 s) zwischen den Etappen, Pausen-Hinweis nach 15 Minuten
- **Fokus**: alles außer dem markierten Gebiet wird abgedunkelt; wenige Knöpfe auf der Startseite
- Kurze Runden (8 Fragen, einstellbar), sofortige freundliche Rückmeldung, keine Strafen
- **Ruhiger Modus** und **automatisches Vorlesen** in der Eltern-Übersicht

## Stumme Karte
Nummern auf der Karte wie im LZK-Arbeitsblatt. Zu jeder Nummer den Namen schreiben oder aus dem Wortkasten antippen. Zwei Arten:
- **📋 Ganzes Blatt** (voreingestellt, wie in der LZK):
  - Alle Nummern auf einmal mit einem Feld pro Nummer. Was er schreibt, steht gleich auf der Karte.
  - Eine Nummer auf der Karte antippen springt zum Feld, das Gebiet leuchtet. Enter springt ins nächste leere Feld.
  - „Prüfen“ bewertet jedes Feld einzeln (grün/rot). Rote Felder kann er einmal verbessern, danach steht dort die Lösung.
- **1️⃣ Nummer für Nummer**: eine Nummer nach der anderen, mit Tipps.

Am Ende die ausgefüllte Karte (grün/rot) und „Nur die Fehler nochmal“.

## Fragen mit mehreren Antworten
Zum Beispiel die drei größten Städte, die drei Stadtstaaten, Nord- und Ostsee: Für jede Antwort gibt es ein eigenes Feld, wie bei ANTON.
- Die Reihenfolge ist egal, jedes Feld wird für sich geprüft.
- Richtige Felder bleiben grün. Nur die roten werden verbessert, danach steht die Lösung daneben.
- Doppelte Antworten werden erkannt. Schreibt er alles in ein Feld („Nordsee und Ostsee“), wird es auf die Felder verteilt.

## Eltern-Übersicht
Einstellungen → „Für Eltern: gedrückt halten“. Zeigt Bereitschaft je Thema, was noch wackelt, Übungszeit der letzten 7 Tage,
Probe-LZK-Verlauf und alle Begriffe. Dort auch: Rundenlänge, ruhiger Modus, Vorlesen, Blitzrunde, LZK-Datum, Zurücksetzen.

## Aufs iPad
1. Die Seite in **Safari** öffnen.
2. Teilen → **Zum Home-Bildschirm**.
3. Danach läuft die App im Vollbild, auch ohne Internet. Der Fortschritt bleibt auf dem iPad gespeichert.

## Inhalte ändern
Alle Zahlen und Namen stehen in `public/content.js` (z. B. Kanzler, Einwohnerzahl, Schreibvarianten).
Bitte mit dem Lapbook abgleichen.

## Entwickeln
```
npm install
node tools/build-map.mjs   # Karte aus raw/ neu erzeugen (Rohdaten: Natural Earth, siehe unten)
node tools/test-logic.mjs        # Tests der Auswertung
node tools/test-rechnen.mjs      # Tests der Rechen-Logik (Aufgaben, Rechentricks, Sterne)
node tools/e2e.mjs               # Browser-Test, spielt alle Modi durch (braucht Playwright)
node tools/e2e-rechnen.mjs       # Kopfrechnen: Turm, Fehler, Tagestraining, Blitz, Test, Eltern, iPad-Größen
node tools/e2e-begleiter.mjs     # Hund, Bauprojekte, Boss am Ende der Etappe, Rennen gegen den Rekord, Effekte
node tools/e2e-blatt.mjs         # mehrere Antworten in eigenen Feldern, stumme Karte als ganzes Blatt
node tools/test-migration.mjs    # alte, halbe und kaputte Spielstände
node tools/test-tageswechsel.mjs # Mitternacht, Serie, Tagesmission, LZK-Countdown
node tools/monkey.mjs 300 1      # zufälliges Durchklicken (Schritte, Startwert); prüft auch Schrift ≥ 16 px in Eingabefeldern
node tools/test-update.mjs <alte public/>  # Update über eine ältere Version, dann offline (von Hand: z. B. git archive <alter Commit> public)
node tools/e2e-flows.mjs         # Probe-LZK, Schwächen-Modus, Einstellungen, Speicher, Serie, Countdown
node tools/e2e-features.mjs      # Tagesmission, Bewegungspause, stumme Karte, Eltern-Übersicht
node tools/e2e-devices.mjs       # iPad-Größen quer/hoch, Fingertipps, Tastatur, kleine Ziele
node tools/test-offline.mjs      # funktioniert ohne Internet
```
Alle Tests laufen auch bei GitHub, bei jedem Pull Request und vor jeder Veröffentlichung.
`public/` ist die fertige App. Der Workflow `.github/workflows/pages.yml` veröffentlicht sie über GitHub Pages.

## Kartendaten
- Länder, Flüsse, Seen: [Natural Earth](https://www.naturalearthdata.com/) (gemeinfrei)
- Bundesländer: [isellsoap/deutschlandGeoJSON](https://github.com/isellsoap/deutschlandGeoJSON) (Daten des Bundesamts für Kartographie und Geodäsie)
- Gebirge, Nord- und Ostsee: von Hand vereinfacht nachgezeichnet, also nur ungefähre Lage.

Die Rohdaten (`raw/`) sind nicht im Repo. Sie liegen unter
`nvkelso/natural-earth-vector/geojson` (`ne_10m_admin_0_countries`, `ne_10m_rivers_lake_centerlines`, `ne_10m_rivers_europe`,
`ne_10m_lakes`, `ne_10m_lakes_europe` für Chiemsee und Starnberger See) und `isellsoap/deutschlandGeoJSON/2_bundeslaender/3_mittel.geo.json`.
