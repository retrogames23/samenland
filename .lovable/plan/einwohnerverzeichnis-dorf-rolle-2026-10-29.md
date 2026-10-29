# Einwohnerverzeichnis („Dorf-Rolle“)

## Was der Spieler bekommt
- Neuer Knopf **„Dorf-Rolle“** in der linken Leiste (über „Anleitung“), mit Schriftrollen-Symbol. Sichtbar, sobald man ein eigenes Dorf hat.
- Ein Klick öffnet ein Pergament (gleiche Optik wie Anleitung und Chronik) mit allen Bürgern des eigenen Dorfes.
- **Gruppiert nach Haushalten**: Überschrift „Familie Müller · 5 Personen“, darunter jede Person mit Vorname, Alter und Beruf (weibliche oder männliche Berufsbezeichnung), dazu eine kurze Verwandtschaftsangabe („Ehefrau von Hans“, „Sohn“, „geb. Weber“ bei eingeheirateten Frauen).
- Ganz oben steht der Dorfschulze bzw. die Dorfschulzin mit eigenem Siegel.
- Kopfzeile mit Kennzahlen: Einwohner, Haushalte, Kinder, Kranke.
- **Suche** nach Name und **Filter** nach Beruf (z. B. nur Bauern oder Kinder). Sortierung: Haushalt, Name oder Alter.
- **Klick auf eine Person**: Das Pergament schließt sich, die Kamera fährt zu ihr, falls nötig wird näher herangezoomt, und die bekannte Personenkarte öffnet sich. Wer gerade drinnen ist (schläft, arbeitet im Haus), wird am Haus gezeigt, mit dem Hinweis „ist gerade daheim“ bzw. „in der Werkstatt“.
- Auf dem Handy erscheint das Pergament als Vollbild-Liste mit der gleichen Bedienung.
- Alle Texte zweisprachig (DE/EN).

## Was es nicht wird
- Nichts wird gespeichert, die Liste wird jedes Mal aus dem Dorf berechnet. Alle Spieler sehen dieselben Bürger.
- Zunächst nur für das eigene Dorf, nicht für fremde Dörfer. Das lässt sich später leicht ergänzen.

## Technische Details
- Daten: `townOf(my, seeds, slow).people` (bereits vorhanden in Game.tsx) plus `kinOf()` für Verwandtschaft; Haushalte über `p.hh`, Rolle über `p.role`, Mädchenname über vorhandene Felder.
- Neuer State `rollOpen`; Overlay als eigene Komponente `src/components/VillageRoll.tsx`, damit Game.tsx nicht weiter wächst. Liste mit `useMemo` nur bei Öffnen/5-s-Takt berechnet, gerendert erst ab Öffnen (keine Kosten im Spielbetrieb). Bei großen Städten (>300 Bürger) Haushalte einklappbar, nur aufgeklappte rendern.
- Kamerafahrt: vorhandenes `focus(x, y)` mit `poseOf(p, town, seeds, clock())`, Zoom auf mindestens ~2, danach `setWho(p)`.
- Strings in `src/game/i18n.ts` unter `roll` (de/en).
- Test: Gruppierung zählt jede Person genau einmal und der Schulze steht zuerst.
