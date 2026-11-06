# Flut lebendiger gestalten

Heute ist die Flut nur eine trübe, flache Farbschicht auf den Uferkacheln. Die Bewohner reagieren gar nicht darauf. Ziel ist, dass man sieht, wie das Wasser kommt, steht und wieder abläuft – und wie das Dorf dagegen ankämpft.

## Was man sehen wird

1. **Wasser, das steigt und fällt**
   - Steigt in der ersten Stunde vom Fluss her landeinwärts an und weicht am Ende wieder zurück. Die Uferkacheln laufen zuerst voll.
   - Gemaltes, bräunliches Hochwasser mit Strömungsstreifen in Flussrichtung, Treibgut (Äste, Stroh, ein Fass) und weichen Rändern statt harter Rautenkanten.
   - Gebäude stehen sichtbar im Wasser: Spiegelung und eine Nässelinie an der Hauswand.
   - Bei Nacht wird das Wasser über die normale Nachtschicht mit abgedunkelt.

2. **Bewohner wehren sich (wie um 1500)**
   - Erwachsene in der Nähe verlassen ihre Arbeit und bauen am Rand des Wassers einen Damm aus Faschinen und Erdsäcken. Sie tragen Bündel, werfen sie ab und schaufeln (echte Lauf- und Arbeitsanimation).
   - Andere bringen Vieh und Hausrat landeinwärts in Sicherheit.
   - Kinder und Alte stehen abseits auf trockenem Grund.
   - Wer im Wasser steht, watet langsamer; die Füße verschwinden im Wasser.

3. **Spuren danach**
   - Nach dem Ablaufen: Schlamm- und Schlickflecken auf den Feldern, die über ein paar Tage verblassen (passt zum bestehenden Ernte-Bonus durch fruchtbaren Schlick).
   - Der Faschinendamm bleibt noch eine Weile liegen und wird dann abgebaut.
   - Zerstörte Kacheln gehen wie bisher in die Baustelle über.

4. **Kamera und Pergament**
   - „Hinschauen“ springt zum Ufer, an dem das Wasser steht, nicht zur Dorfmitte.
   - Ein leises Wasserrauschen ist zu hören, solange die Flut im Bild ist.

Spielregeln (wie oft, wie viel Schaden, Ernte) bleiben unverändert.

## Technische Details

- `disasters.ts`: reine Hilfsfunktion `floodLevel(s, tile, now)` (0..1) aus Fluss-Abstand und Flutphase für Anstieg/Ablauf; `floodFront(s, now)` liefert Damm-Kacheln (Rand der nassen Fläche) und den Kamerapunkt. Alles abgeleitet, nichts gespeichert.
- `render.ts`: `drawFlood` ersetzt durch geschichtetes Wasser (Pegel-Alpha, Strömungslinien, Treibgut-Sprites, Wandspiegelung), Schlick-Overlay nach dem Ende; Figuren in nassen Kacheln mit Fußabschnitt.
- Neue gemalte Sprites in `folk-sprites.ts`: Faschinenbündel, Erdsack-Damm (3 Ausbaustufen), Treibgut, Schlickflecken.
- `people.ts`: neue Aktivität `levee` (Bündel holen → zum Damm → abwerfen/schaufeln) und `evacuate`; Zuteilung deterministisch aus Person-ID, wie beim Brand.
- `Game.tsx`: Fokus der Flut auf `floodFront`-Punkt; Wasserrauschen im bestehenden Tonsystem.
- Tests: `floodLevel` steigt/fällt monoton, Dammkacheln liegen immer auf trockenem Rand, keine Änderung an Schaden/Ernte-Werten.
