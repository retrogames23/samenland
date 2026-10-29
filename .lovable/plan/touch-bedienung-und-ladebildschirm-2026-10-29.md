# Touch-Bedienung und Ladebildschirm

## Was es schon gibt
Zwei-Finger-Zoom ist bereits eingebaut. Er rechnet allerdings ohne Glättung und springt manchmal, wenn ein Finger zuerst losgelassen wird. Es fehlen drei Dinge: das Weitergleiten der Karte nach einem Wisch, eine fingergerechte Grenze zwischen Tippen und Ziehen und ein Ladebildschirm.

## 1. Geschmeidige Gesten
- **Trägheit:** Wischt man die Karte mit Schwung, gleitet sie weiter und bremst sanft ab (etwa 0,4 s). Ein neuer Fingerdruck stoppt sie sofort. Das gilt für Finger und Maus.
- **Tippen oder Ziehen:** Bei Fingern zählt eine Bewegung erst ab etwa 10 px als Ziehen, bei der Maus bleibt es bei 3 px. Außerdem gilt ein Tippen nur bis etwa 350 ms. So öffnen sich Gebäude oder Personen nicht mehr aus Versehen beim Verschieben, und ein kurzes Antippen wird nicht mehr als Ziehen verschluckt.
- **Pinch ruhiger:** Der Zoom wird auf die Grenzen begrenzt, der Mittelpunkt zwischen den Fingern bleibt fest. Hebt man einen Finger, gleitet die Karte nahtlos ohne Sprung weiter.
- **Doppeltippen** zoomt um eine Stufe an die getippte Stelle heran.

## 2. Ladebildschirm beim ersten Betreten
- Ein Pergament-Vollbild mit dem bestehenden Anleitungsbild, dem Schriftzug „Samenland“, einem Spruch („Die Felder werden bestellt …“) und einem gemalten Fortschrittsbalken in Messingfarbe, der die tatsächlich geladenen Bilder zählt.
- Er verschwindet mit einer weichen Überblendung, sobald die Kernbilder geladen sind: Gebäude, Bäume und Felsen, Dorfbewohner sowie Tiere. Nachtbilder und Jagd-Bilder laden danach im Hintergrund weiter.
- Nach spätestens 8 Sekunden öffnet sich die Karte trotzdem, damit niemand bei schlechtem Netz hängen bleibt.
- Er erscheint nur beim ersten Laden der Seite, nicht beim Kartenwechsel. Texte gibt es auf Deutsch und Englisch.

## Technische Details
- `src/game/assets.ts` (neu): `trackImage(img)` registriert jedes vorgeladene Bild. `coreProgress()` liefert {loaded, total}. Gebäude-, Natur-, Folk- und Tier-Preloader melden sich dort an, Nacht- und Jagd-Bilder werden als „spät“ markiert und nicht gezählt.
- `src/components/LoadingScreen.tsx` (neu): fragt den Fortschritt per requestAnimationFrame ab, mit 8-Sekunden-Timeout und Ausblenden über die Deckkraft.
- In `Game.tsx` kommt in den Pointer-Handlern ein Geschwindigkeitspuffer der letzten ~80 ms hinzu. Nach dem Loslassen bremst die Trägheit in der bestehenden Pan-Schleife exponentiell ab. Die Schwelle hängt von `pointerType` ab, dazu kommen eine Zeitgrenze für das Tippen und Doppeltippen. Beim Übergang vom Pinch zum Ziehen wird der Startpunkt sauber neu gesetzt.
- i18n: `loading.title`, `loading.lines[]` (de/en).
