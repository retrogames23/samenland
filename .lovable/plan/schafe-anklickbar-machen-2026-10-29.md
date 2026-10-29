# Schafe anklickbar machen

## Ziel
Ein Klick auf ein Schaf spielt das echte „Mäh!" und öffnet nicht mehr das Nachbarhaus.

## Umsetzung
1. **Schaf-Treffer zuerst prüfen:** Beim Klick wird – wie bei Dorfbewohnern – zuerst geprüft, ob ein Schaf an der geklickten Stelle steht (anhand seiner tatsächlichen, abgeleiteten Position und Sprite-Größe). Trifft der Klick ein Schaf, ertönt „Mäh!" und die Gebäude-Prüfung entfällt.
2. **Weide-Schutz:** Klickt man auf eine Weidenkachel (ohne Schaf zu treffen), wird nicht mehr schräg darunter nach einem Gebäude gesucht – das Handwerkerhaus öffnet sich also nicht mehr versehentlich.
3. Kein Dauer-Blöken; der Ton bleibt nur bei Klick.

## Technische Details
- Neue Funktion `sheepAt(x, y)` analog zu `personAt`, nutzt dieselbe Positionsberechnung wie das Rendern der Schafe in `render.ts` (rein abgeleitet, nichts gespeichert).
- In der Klick-Behandlung (`Game.tsx` / `inspectAt`) vor Personen-/Gebäudeprüfung aufrufen → `audio.baa(pan)`.
- In `inspectAt`: Weide-Kacheln (`pasture`) beenden die Suche statt `[1,1]` zu prüfen.
- Kleiner Test: Weidenkachel liefert kein Nachbargebäude.
