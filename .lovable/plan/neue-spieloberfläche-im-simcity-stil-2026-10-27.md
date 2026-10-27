# Neue Spieloberfläche im SimCity-Stil

## Ziel
Die verstreuten Panels (Login oben links, Dorfliste, „Mein Dorf“-Kasten, Einzelknöpfe oben rechts) werden durch eine klare, gemütliche Spiel-Oberfläche ersetzt: eine obere Leiste mit den wichtigsten Werten und ein Bau-Menü am linken Rand. Optik: warmes Holz/Pergament passend zur detaillierten Grafik, keine flache Standard-Optik.

## Aufbau

```text
+--------------------------------------------------------------+
| [Wappen] Dönerville  | 12G 34S 56K (+18/Tag) | Bewohner 42 |  |
| Nahrung ▓▓░ Gesundh. ▓▓▓ Wohlst. ▓░░ | Datum/Jahreszeit | ⚙ 🔊 ⛶ |
+----+---------------------------------------------------------+
|Bau |                                                         |
| 🏠 |                                                         |
| 🐟 |                  Spielwelt                              |
| 🌾 |                                                         |
| ⛪ |                                    [Info-Karte rechts]  |
| 🔔 |                                                         |
| 🪧 |                                                         |
+----+------------------------------[Minikarte / Zoom +/-]-----+
```

### 1. Obere Leiste (wie SimCity)
- Links: Dorfname mit Wappen, Epoche (Weiler … Metropole).
- Mitte: Kasse in Gold/Silber/Kupfer mit täglicher Steuer, Bewohnerzahl, drei kleine Balken für Nahrung, Gesundheit, Wohlstand.
- Rechts: Datum und Jahreszeit, Tageszeit, Knöpfe für Ton, Vollbild, Einstellungen (Sprache, Konto/Abmelden).
- Ohne Anmeldung: Leiste zeigt „Anmelden“-Knopf statt Kasse; Anmeldung öffnet sich als Fenster (Google, Apple, E-Mail).

### 2. Bau-Menü links
Senkrechte Leiste mit Symbol-Kategorien; Klick klappt ein Fach mit Karten aus:
- **Gebäude:** Fischerhütte, Scheune, Heiler(in), Schule – Bild, Preis, Bonus, Kaufen-Knopf (ausgegraut bei zu wenig Geld oder falscher Epoche).
- **Zuwendung:** Glocke läuten / Brunnen schmücken mit Abklingzeit.
- **Wegweiser:** Grüße an Nachbardörfer.
- **Dörfer:** Liste aller Dörfer zum Hinspringen (ersetzt die bisherige Dorfliste).
- **Samen setzen** für Spieler ohne Dorf.

### 3. Info-Karten
Bewohner-, Gebäude-, Baustellen- und Wegweiser-Karten erscheinen einheitlich gestaltet rechts unten (mobil als Blatt von unten).

### 4. Unten rechts
Kleine Minikarte (vorhandene Übersichtskarte) mit Kamera-Rahmen, Klick springt dorthin; Zoom-Knöpfe + / – / „Zu meinem Dorf“.

### 5. Smartphone
- Obere Leiste kompakt: Geld, Bewohner, Menü-Knopf.
- Bau-Menü wird zur unteren Symbolleiste; Fächer öffnen sich als Blatt von unten.
- Kein Vollbild-Knopf (wie bisher).

## Technische Details
- `Game.tsx` (822 Zeilen) wird aufgeteilt in `src/components/hud/`: `TopBar`, `BuildMenu` (+ Fächer `BuildingsTab`, `RitualsTab`, `SignsTab`, `TownsTab`), `InfoCard`, `Minimap`, `AuthDialog`. Spiel-Zustand bleibt in `Game.tsx`, wird per Props übergeben.
- Neue Design-Tokens in `src/styles.css` (Holz-, Pergament-, Messingtöne, Schatten); keine fest codierten Farben.
- Alle neuen Texte in `src/game/i18n.ts` (de/en).
- Spiel-Logik, Datenbank und Kaufregeln bleiben unverändert; vorhandene Tests müssen weiter grün sein.
- Prüfung per Screenshot auf Desktop- und Smartphone-Größe, angemeldet und abgemeldet.
