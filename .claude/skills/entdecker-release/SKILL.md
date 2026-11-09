---
name: entdecker-release
description: Änderungen an der Lern-App Deutschland-Entdecker (Kompass, Kopfrechnen, LZK, Tier) liefern, testen und veröffentlichen. Nutzen bei jeder Änderung an public/ oder tools/ in diesem Repository, bei rotem CI, beim Anheben der Versionsnummer und vor jedem Merge. Gilt nur für dieses Repository, nicht für andere Apps.
---

# Deutschland-Entdecker liefern

Die App ist eine Vanilla-JS-PWA ohne Build (Ordner `public/`), veröffentlicht über GitHub Pages. Der Vater hat erlaubt: **nach grünem CI selbst mergen.**

## Ablauf
1. **Neuer Branch von `main`** (`claude/<thema>`). Nach einem Squash-Merge nie auf dem alten Branch weiterarbeiten.
2. **Ändern. Dann Version und Cache gemeinsam erhöhen:** `public/version.js` (`n`) und `CACHE = "de-entdecker-v<n>"` in `public/sw.js` müssen gleich sein. Neue Dateien in `public/index.html` **und** in `FILES` in `sw.js` eintragen (`tools/test-version.mjs` erzwingt beides).
3. **Lokal prüfen**, nur was zum Änderungsbereich passt:
   - Kompass-Logik/Inhalte: `node tools/test-kompass.mjs` (schnell), dann `node tools/e2e-kompass.mjs` (ca. 4 Minuten, im Hintergrund laufen lassen, nie doppelt starten).
   - Tier/Speicher/Version: `tools/e2e-begleiter.mjs`, `tools/test-progress-update.mjs`, `tools/test-migration.mjs`.
   - Kopfrechnen: `tools/test-rechnen.mjs`, `tools/e2e-rechnen.mjs`.
   - Immer: `tools/test-offline.mjs`, `tools/test-version.mjs`.
4. **Commit** mit den Attributionszeilen aus der Sitzung, **Push**, **Draft-PR** gegen `main`, PR-Aktivität abonnieren.
5. **CI abwarten** (ca. 16 bis 18 Minuten, alle Suiten). Bei grün: aus dem Draft nehmen und **squash-mergen**.
6. Nach dem Merge dauert die Veröffentlichung ein paar Minuten. Der Nutzer prüft oben rechts in der App die Versionsnummer.

## Rotes CI
- Zuerst das Log lesen (`get_job_logs`, Ende), die genaue `FAIL`-Zeile finden.
- **Einmal** wiederholen, um ein Zufallsproblem zu bestätigen. Ein zweiter Fehlschlag ist echt.
- Zufallsabhängige Tests wurden hier mehrfach zur Falle. Ursache suchen, nie den Test abschalten:
  - Aufgaben mit Faktor 1 oder 11 haben keine 1×1-Aufgabe dahinter (Eltern-Tabelle Kopfrechnen).
  - Lange Aufgaben mit `white-space: nowrap` schoben auf dem Handy die Seite seitlich (Rechenblatt).
- Tests mit Zeit: Playwright setzt die Uhr fest (`p.clock.setFixedTime`), echte Timer laufen weiter. Testschalter in `window.__DE_TEST` nutzen (`kSeed`, `kRoundLen`, `kProbeMs`, `kText`, `pauseMs`, `gift`).

## Spielstand nie verlieren
- `KEY` bleibt unverändert. Neue Felder immer mit Standardwert und Migration (`KS()`-Merge, `defaults()`).
- Jede Änderung am Speichern braucht Tests in `test-progress-update.mjs` und `test-migration.mjs`.
- Sicherung ist mehrfach: zweite Kopie, IndexedDB-Spiegel, Sicherungsdatei (Version antippen oder Eltern-Übersicht). Das Geschenk (`gift2`) wird nur einmal vergeben und läuft in Tests nur mit `__DE_TEST.gift`.

## Fallen
- Der Sicherheits-Check der Umgebung blockiert gelegentlich Befehle mit Heredoc oder Skript als Fehlalarm. Dann die Edit-Werkzeuge benutzen, nichts umgehen.
- Repository und Pages-Seite sind **öffentlich**. Keine Namen des Kindes, keine Noten oder Fotos von Arbeiten ins Repository.
