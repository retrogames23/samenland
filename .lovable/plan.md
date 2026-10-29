# Sichtbare Warenströme: Vorräte & Produktionsketten

## Ziel
Die Wirtschaft wird greifbar: Statt nur Prozentwerten sieht man echte Güter — wie viele Säcke Mehl, Scheite Holz, Körbe Fisch das Dorf gerade hat, und welche Gebäude einander beliefern.

## Was der Spieler sieht

1. **Vorrats-Leiste im HUD** (oben, neben den Talern, aufklappbar)
   - Kleine gemalte Waren-Symbole mit Zahl: Holz, Bretter, Stein, Korn, Mehl, Brot, Fisch, Wild, Kräuter, Käse (nur was das Dorf tatsächlich hat).
   - Kleiner Trendpfeil: steigt/fällt gerade (z. B. Ernte im Herbst, Holzschlag im Winter, Verbrauch abends).
   - Klick öffnet Pergament „Vorratskammer" mit Tagesbilanz: „Heute geerntet 14 Garben, gebacken 9 Brote, verbraucht 11".

2. **Lager-Einsicht beim Klick auf Gebäude**
   - Scheune, Mühle, Bäckerei, Sägewerk, Fischerhütte, Markt usw. zeigen ihren eigenen Bestand: „5 Säcke Mehl · 2 Säcke Korn warten aufs Mahlen".
   - Produzenten zeigen „Ertrag heute" und den aktuellen Zustand (arbeitet / wartet auf Korn / Lager voll / Winterruhe).

3. **Produktionskette in der Inspektion**
   - Kleine Kette als Bildreihe: Weizenfeld → Mühle → Bäckerei → Wirtshaus, das angeklickte Gebäude hervorgehoben.
   - Jedes Glied anklickbar → Kamerafahrt zu diesem Gebäude.
   - Auf der Karte werden dabei kurz die beteiligten Gebäude markiert und die Trägerwege dazwischen als sanft leuchtender Pfad gezeigt.

4. **Bezug zu Werten**: Die Prozentwerte (Nahrung, Wohlstand) bekommen im Tooltip den Ursprung in Gütern („Nahrung 72 % — 18 Brote, 6 Körbe Fisch für 41 Bürger").

## Grundregel
Alle Bestände werden **rein aus Weltzeit, Gebäuden, Bewohnern und Jahreszeit berechnet** — nichts wird gespeichert. Jeder Spieler sieht dieselben Zahlen; das Dorf „produziert" auch, wenn niemand zuschaut.

## Technische Details
- Neues Modul `src/game/goods.ts` (rein, gecacht wie townOf): 
  - Rezept-Tabelle `CHAINS`: Kind → {input, output, Rate/Arbeiter/Stunde}; erweitert vorhandene `Good`-Liste um fish, game, herbs, cheese.
  - `stockOf(seed, seeds, now)`: Bestand = Produktion − Verbrauch über einen gleitenden Zeitraum (z. B. letzte 3 Tage), mit Arbeitszeiten aus time.ts, Saisonfaktor aus season.ts, Katastrophen (Flut → Ernteausfall) aus disasters.ts; Verteilung auf Lagergebäude nach Kapazität.
  - `chainOf(kind, seed)`: Glieder + Kachelpositionen, Träger aus `Person.haul` zur Pfad-Hervorhebung.
  - Liest Zeit nur über `clock()`.
- `inspect.ts`: Inspect um `stock`, `yieldToday`, `state`, `chain` ergänzen.
- `Game.tsx`: HUD-Vorratsleiste (useMemo im 5s-Takt wie Treasury), Vorratskammer-Pergament, Kettenreihe in der Inspektion mit Kamerafahrt; `render.ts` zeichnet Hervorhebung als Overlay.
- Gemalte Waren-Icons als ein Sprite-Sheet (kein Vektor).
- Alle Texte in `i18n.ts` (de/en); Logik liefert Codes.
- Konsistenz: `attributes()` Nahrung/Wohlstand bleiben wie sie sind, Tooltip erklärt sie über Güter (keine Balance-Änderung).
- Tests in `goods.test.ts`: deterministisch, nie negativ, Herbst > Frühling bei Korn, Flut senkt Korn, Kette Feld→Mühle→Bäckerei vorhanden, Inspektion liefert Bestand.
- AGENTS.md-Regel: Bestände sind abgeleitet, nie gespeichert.
