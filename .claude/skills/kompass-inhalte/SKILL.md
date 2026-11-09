---
name: kompass-inhalte
description: Aufgaben, Proben, Eselsbrücken und Texte für die Kompass-4-Übung (Deutsch und Mathe, 4. Klasse Baden-Württemberg) in der Deutschland-Entdecker-App erstellen oder ändern. Nutzen, wenn neue Aufgabenarten, Original-Aufgaben, Eselsbrücken, Plan-Tage oder aufmunternde Texte gebaut werden, oder wenn Testmaterial (Fotos, PDFs) ausgewertet wird. Gilt für Kind mit Aufmerksamkeitsschwierigkeiten: kurze Etappen, ermutigend.
---

# Kompass-Inhalte

## Aufbau (Dateien in `public/`)
- `kompass-logic.js`: Zufall mit Startwert, Aufgabenformen, `check`, `solution`, `buildRound`, `PLAN`, `etappen`.
- Inhalte: `kompass-data.js` (Deutsch-Bank), `kompass-text.js` (Lesetexte, Rechtschreibung), `kompass-geo.js`, `kompass-mathe2.js`, `kompass-zahlraum.js` (Generatoren), `kompass-original.js` (IBBW-Originale 2025), `kompass-begriffe.js` (Fachbegriffe und Wörterbuch nach dem Lehrer-Arbeitsblatt), `kompass-merk.js` (Eselsbrücken).
- Oberfläche: `fach-kompass.js`. Neue Datei: in `index.html` **vor** `fach-kompass.js`, in `sw.js` `FILES`, und per `req(...)` in `tools/test-kompass.mjs`.
- Aufgabentypen: num, nums, choice, multi, pick, order, tf, write, match, cut, self, grid. Optional `passage`, `fig` (SVG), `table`, `tip`, `explain`, `say`.

## Regeln für neue Aufgaben
1. **Jede Aufgabe entsteht aus einem Startwert** (`K.task(compId, seed, level)`), damit Tests sie nachrechnen können. Generatoren dürfen nicht oft `null` liefern.
2. **Unabhängig nachrechnen** in `tools/test-kompass.mjs`: nicht mit dem Code des Generators, sondern aus dem Aufgabentext oder einer zweiten Rechnung (Beispiele dort: Würfelnetze durch virtuelles Rollen, Achsen numerisch, Pfeile aus dem SVG gelesen).
3. Jede Aufgabe braucht `tip` (Hilfe nach dem ersten Fehler) und `explain` (Erklärung mit Ergebnis am Ende).
4. Rechtschreibaufgaben sind streng (`strict`), Sachkunde-Aufgaben nachsichtig. Zahlwörter ohne Rücksicht auf Leerzeichen und ß/ss.
5. Neue Aufgabenart braucht einen Eintrag in `kompass-merk.js` (der Test verlangt fast volle Abdeckung).

## Quellen und Urheberrecht
- **Nur IBBW-Originale** (Kompass 4 Haupttermin) mit Quellenangabe, für die App umgebaut. Der Jahrgang 2025 gilt als guter Standard, 2024 war zu schwer.
- **Material der Lehrkraft** (zum Beispiel das Arbeitsblatt „Mein Kompass-Wörterbuch“) darf ausdrücklich genutzt werden, auch mit ihren Formulierungen (siehe `kompass-begriffe.js`). Das gilt nur, wenn der Vater es so sagt.
- **Fremdmaterial** (Übungshefte, Bonus-Proben anderer Verlage) **nicht abtippen**, nur als Themenkarte für eigene Aufgaben im gleichen Stil nutzen.
- Lapbook/LZK Deutschland: alles im Lapbook muss rein, kein Inhalt darüber hinaus.

## Eselsbrücken
- Kurz, sachlich richtig, kindgerecht, gern albern. Regel prüfen, bevor sie aufgenommen wird (zum Beispiel Netz-Regel unabhängig nachrechnen, Merksätze mit Anfangsbuchstaben im Test prüfen).
- Das Kind bewertet (👍/👎) und trägt eigene ein; die eigene kommt zuerst. Nur nach Fehlern zeigen, nie in Proben.

## Haltung und Ton
- **Ermutigend, nie vorwurfsvoll.** Fehler zeigen, was gleich wächst. Kurze Etappen mit Bewegungspause, Tagesziel mit Balken, Bonus ohne Limit.
- Proben sind wie der echte Test (3 Teile à 15 Minuten, Überspringen, Kontrolle, keine Rückmeldung während der Probe). Die Ziel-Zone (einstellbar, Standard 60 %) ist eine Orientierung. **Dem Kind gegenüber nicht von Schulart oder Empfehlung reden.**
- Selbsteinschätzung gegen Ergebnis anzeigen (Kinder überschätzen sich bei Unsicherem oft): freundlich, nie als Rüge.
- Typische Stolpersteine aus echten Arbeiten sind: Nachbar-Stellenwerte, Zahlenstrahl ablesen, Plättchen, Stellenwerttafel, Subtraktion über Nullen, Teilaufgaben auslassen. Diese Aufgabenarten kommen häufiger (siehe `FOCUS` in `kompass-logic.js`).
- **Keine Namen, Noten oder Fotos von Arbeiten ins Repository** (es ist öffentlich).

## Plan
- `PLAN` in `kompass-logic.js`: Tage mit `kind` (`full` mit `min`, `mini`, `check`, `probe-de`, `probe-ma`, `mut`, `warm`, `lzk`). Etappen pro Tag aus `etappen(kind, min)`, etwa 7 Minuten je Etappe. Die Übungszeit steigt bis zur Testlänge von 45 Minuten.
- Nach Planänderungen die Tests mit festen Tagen anpassen (`tools/e2e-kompass.mjs` nutzt Tage wie 2026-11-11 für das Training).
