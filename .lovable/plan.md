# Laufbewegungen aller Figuren bereinigen

Vier Fehler in drei Blöcken. Jeden Block teste ich danach im Figurenlabor und mit den Tests, bevor ich den nächsten anfange.

## Block 1 – Gewänder und Schuhe (Frauen, Priester, lange Roben)
- Den Rock nicht mehr bei einer festen Höhe abschneiden, sondern am tatsächlichen Saum jedes Sprites. Den Saum liest das Spiel einmal pro Bild aus dem Bild selbst und merkt ihn sich.
- Dann gibt es keine gemalten Knöchel mehr, die über den Schrittschuhen schweben, also keine doppelten Schuhe mehr.
- Bodenlange Roben (Braut, Schulzin, Prinzessin) laufen ohne Lücke über den Schuhen.
- Prüfung im Figurenlabor: Bürgerin, Bäuerin, Handwerkerinnen, Priester, Braut, Schulzin, Prinzessin.

## Block 2 – Knabe und Räuber
- Knabe: Seine Laufbilder werden an der Körpermitte ausgerichtet, so wie es bei den Beinen der Männer schon passiert. Dadurch springt er nicht mehr seitlich hin und her. Für die anderen Kinder-Sheets gilt dieselbe Ausrichtung, das schadet nicht.
- Räuber: Er bekommt denselben sauberen Vier-Bilder-Gang wie alle anderen. Außerdem duckt er sich mit dem ganzen Körper, damit sich Hüfte und Beine nicht mehr trennen.

## Block 3 – Fremde Schulzen
- Die Schrittgeschwindigkeit fremder Bürgermeister wird genauso berechnet wie beim eigenen Schulzen. Damit gleiten sie nicht mehr, sondern gehen im richtigen Takt.
- Dazu kommt ein kleiner Test, der für beide Fälle den gleichen Schritt pro Wegstrecke prüft.

## Technische Details
- `figure.ts`: `drawRobeWalk` bekommt einen pro Bild zwischengespeicherten Saum-Schnitt aus dem Alpha-Profil statt fester Werte von 0,80–0,93. Die Ausrichtung an der Körpermitte wird zu einem allgemeinen Helfer für mehrbildrige Sheets verallgemeinert.
- `render.ts`: Beim Räuber wird die Phase an `legFrame` übergeben und der Duck-Versatz auf Beine und Oberkörper gleich angewendet. Die Kinder- und Jugend-Sheets nutzen den Ausrichtungs-Helfer.
- `people.ts`: Fremde Schulzen bekommen als Phase `rm.dist / STRIDE`. Dazu ein Test in `src/game`.
- Die Hinweise in `src/assets/sprites/AGENTS.md` werden entsprechend ergänzt.
