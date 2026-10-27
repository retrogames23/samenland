# Entscheidungen als Pergament-Popups

## Ziel
Die obere Leiste zeigt keine Entscheidungs-Knöpfe mehr. Steht eine Entscheidung an, öffnet sich von selbst ein illustriertes Pergament über dem Spiel. Was noch nicht ansteht, ist unsichtbar.

## Verhalten
1. **Keine Knöpfe mehr unter dem Dorfnamen** (erste Straße, Besuch, Charta entfallen).
2. **Automatische Popups, eines nach dem anderen**, in fester Reihenfolge:
   1. Erste Straße: sobald dein Dorf noch keine gewählt hat und Nachbarn in Reichweite liegen.
   2. Dorf-Charta: erst wenn sie wirklich erlassen werden kann (Dorf mindestens 24 Stunden alt). Vorher gibt es keinen Hinweis.
   3. Besuch am Dorfplatz: sobald die Begegnung des Tages ansteht.
3. **„Später“-Knopf** in jedem Popup: schließt es bis zum nächsten Laden der Seite oder für eine Stunde. So nervt nichts, und nichts geht verloren.
4. **Kleines Siegel als Erinnerung:** Wurde ein Popup vertagt, erscheint dezent ein Wachssiegel am Rand. Ein Klick öffnet die Entscheidung wieder. Steht nichts an, ist auch das Siegel weg.
5. Nur für den eigenen, angemeldeten Dorfbesitzer.

## Illustrierte Begegnungen
- Zu jeder der 6 Begegnungen ein eigenes gemaltes Bild mit den beteiligten Personen: Geselle auf der Walz, Gewürzhändler mit Karren, zwei streitende Bauern am Grenzstein, Sammler an der Kapellenruine, Erntefest mit Garbe und Kräuterfrau.
- Dazu je ein Bild für die erste Straße (Wegebauer mit Karte) und die Charta (Schulze mit Siegel und Urkunde).
- Der Stil passt zu den warmen, detailreichen Gebäudebildern, wirkt wie mit Tusche und Aquarell auf altes Papier gezeichnet und hat ausgefranste Ränder.
- **Neues Pergament-Fenster:** Papyrus- bzw. Pergament-Struktur, gerissene Ränder, Tusche-Überschrift und Siegel. Das Bild steht oben, darunter folgen Geschichte, Antworten mit Preis und Wirkung und die Chronik.
- Auf dem Handy wird das Bild kleiner, und die Antworten stehen untereinander.

## Technische Details
- `Game.tsx`: Die drei Knöpfe in der oberen Leiste entfernen. Ein abgeleiteter `pendingDecision`-Wert (`road | charter | encounter | null`) nutzt `roadCandidates`, `charterReady` und `pendingEncounter`. Ein Effekt öffnet das passende Modal automatisch. Die Vertagung wird pro Typ und Tag in sessionStorage gemerkt. Dazu kommt ein schwebendes Siegel-Element für vertagte Entscheidungen.
- Neue gemeinsame Komponente `Parchment.tsx`, die die drei bestehenden Modals nutzen. Die Pergament-Struktur kommt per CSS (Tokens in `styles.css`, Verlaufsflecken, maskierte Ränder), es gibt keine hartkodierten Farben.
- 8 Illustrationen nach `src/assets/encounters/*.webp` mit Komprimierung. Die Zuordnung `event → Bild` liegt in einem kleinen Modul.
- Neue Texte zweisprachig in `i18n.ts` („Später“, Siegel-Tooltip).
- Kleiner Test: Die Charta gilt vor 24 Stunden nicht als anstehend, die Reihenfolge der Entscheidungen bleibt fest.
