# Eigene Handy-Steuerung für Samenland

## Was heute hakt
- **Bauen:** Ein Tipp auf die Karte kauft das Gebäude sofort. Eine Vorschau gibt es vorher nicht, denn sie hängt am Mauszeiger, und den hat ein Handy nicht. Wer danebentippt, verliert Taler, oder es passiert einfach nichts.
- **Kleine Ziele:** Häuser, Leute und Wege sind bei normalem Zoom nur wenige Millimeter groß.
- **Kein Überblick:** Die Minikarte und der Kronen-Knopf sind auf dem Handy ausgeblendet. Fenster und Menüs liegen oft übereinander.

## 1. Bauen in drei Schritten: Antippen, Schieben, Bestätigen
1. Du wählst im Bau-Menü ein Gebäude. Die Karte zoomt nah an dein Dorf heran, und die Vorschau steht schon auf dem nächsten passenden freien Platz.
2. Ein Tipp setzt die Vorschau an eine andere Stelle, kauft aber noch nichts. Du kannst sie auch mit dem Finger schieben. Die Karte bewegt sich dabei nicht mit. Ein grüner oder roter Rahmen zeigt, ob der Platz passt. Darunter steht der Grund, zum Beispiel „Zu nah am Wasser“.
3. Unten erscheint eine Leiste mit Pfeiltasten, um die Vorschau Feld für Feld zu verschieben. Dazu kommen „Abbrechen“ und ein großer Knopf „Hier bauen · 300 Taler“. Erst dieser Knopf kauft das Gebäude.
- Am Computer bleibt alles wie bisher (Klick = Bauen). Die neue Leiste erscheint nur auf dem Handy.

## 2. Unteres Fach statt schwebender Fenster
- Haus-, Personen- und Aufgaben-Fenster öffnen sich auf dem Handy als Fach, das von unten hereingleitet. Zieht man es nach unten, schließt es sich.
- Es ist immer nur ein Fach offen. Öffnest du ein neues, schließt sich das alte. Die Karte darüber bleibt frei.
- Die Schulzen-Aufgabe wird zu einem kleinen Abzeichen oben. Ein Tipp darauf öffnet sie im Fach.

## 3. Gut erreichbare Daumen-Leiste
- Unten liegen feste große Knöpfe (mindestens 44 px): Bauen, Mein Dorf, Schulze, Chronik, Mehr.
- Unter „Mehr“ findest du Einstellungen, Chat, Briefe und Einladen.
- Die Knöpfe halten Abstand zum Home-Balken des iPhones.

## 4. Großzügigere Berührung
- Tippflächen werden größer: Zum Treffen zählt ein Umkreis von etwa einem Fingerbreit. Liegen mehrere Ziele darin, wird das nächstgelegene gewählt.
- Wer etwas lange gedrückt hält, sieht eine Lupe mit dem Namen darunter. Lässt man los, öffnet sich das Ziel.
- Ein Doppeltipp zoomt heran.
- Den Schulzen steuerst du mit dem Knopf „Schulze“ in der Leiste: Danach zählt der nächste Tipp als Laufziel, und eine Wegmarke zeigt es an.

## Technische Details
- Neuer Hook `useIsMobile` (Pointer coarse + Breite < 768) steuert Layout und Eingabemodus. Die Spiellogik bleibt unverändert.
- In `Game.tsx`: Wenn `placing` aktiv ist, setzt ein Touch-Tap oder -Drag den neuen Zustand `ghost: [x,y]`, statt `buy` aufzurufen. Ein Drag, der auf der Vorschau beginnt, verschiebt die Vorschau statt die Kamera. Die Vorschau in `render.ts` liest `ghost ?? hover`. `buy()` läuft nur über den Bestätigen-Knopf. Den Startplatz liefert eine Suche mit `canPlaceSpecial` spiralförmig um die Dorfmitte.
- Neue Komponenten in `src/components/mobile/`: `BottomSheet` (eigene Drag-Geste und `env(safe-area-inset-bottom)`), `ThumbBar`, `PlaceBar`. Inspektion, Person und Quest rendern auf dem Handy in `BottomSheet`. Ein gemeinsamer Zustand `sheet` sorgt dafür, dass immer nur ein Fach offen ist.
- Hit-Test: `personAt` und `inspectAt` bekommen bei Touch einen Radius von etwa 22 CSS-px und wählen das nächste Ziel.
- Alle neuen Texte stehen im Übersetzungskatalog, in allen 8 Sprachen.
- Tests: Die Suche nach dem ersten freien Bauplatz bekommt einen Test, außerdem die Regel „Tippen kauft auf Touch nicht“, als reine Funktion. Danach folgt ein Playwright-Check im Handy-Format (390×844).
