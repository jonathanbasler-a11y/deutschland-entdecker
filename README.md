# Deutschland-Entdecker

Lern-App fürs iPad zur LZK „Deutschland“ (Sachunterricht, 4. Klasse, Baden-Württemberg).
Karte zum Antippen, Sterne, Punkte, Abzeichen und eine Probe-LZK mit Note.

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
Nummern auf der Karte wie im LZK-Arbeitsblatt. Zu jeder Nummer den Namen schreiben oder aus dem Wortkasten antippen.
Am Ende die ausgefüllte Karte (grün/rot) und „Nur die Fehler nochmal“.

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
node tools/e2e.mjs               # Browser-Test, spielt alle Modi durch (braucht Playwright)
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
