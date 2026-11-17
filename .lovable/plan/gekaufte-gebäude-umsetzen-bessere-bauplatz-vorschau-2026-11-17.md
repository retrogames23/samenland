# Gekaufte Gebäude umsetzen + bessere Bauplatz-Vorschau

## Was Spieler bekommen
1. **Umsetzen (Translozieren)** gekaufter Gemeinschaftsbauten und Denkmäler. Wohnhäuser, Höfe und Äcker bleiben unantastbar.
   - Gebäude antippen → „Umsetzen“ → neuen Platz wählen (gleiche Vorschau wie beim Kauf) → bestätigen.
   - Preis **20–150 Lübische Mark**, je nach Größe:
     - kleine Bauten (Weg-Gebäude, Hütten): 20 Mark
     - mittlere (Backhaus, Herberge, Heiler, Fischerei …): 50 Mark
     - große 2×2-Bauten (Markthalle, Schule, Beginenhof …): 100 Mark
     - Denkmäler / Prachtbauten: 150 Mark
   - Danach steht am neuen Platz für 12 Stunden eine sichtbare Baustelle (mit Zimmerleuten), der alte Platz wird frei. Der Bonus des Gebäudes läuft durchgehend weiter.
   - Gleiche Platzregeln wie beim Kauf (Fischerei am Wasser usw.). Pro Gebäude höchstens einmal je 7 Tage; nur ein Umzug gleichzeitig.
2. **Bessere Bauplatz-Vorschau** beim Kauf und beim Umsetzen:
   - Die belegten Kacheln des Gebäudes (1×1 bzw. 2×2) werden auf dem Boden markiert, grün = frei, rot = gesperrt.
   - Bei einem gesperrten Platz steht kurz der Grund dabei (Wasser, Straße, anderes Gebäude, zu weit vom Dorf, kein Wasser in der Nähe …).
   - Zusätzlich dezent hervorgehoben: gute Plätze in der Umgebung (z. B. Uferkacheln für die Fischerei).

Alle Texte in allen 8 Sprachen; Währung heißt dort „Lübische Mark“.

## Was gleich bleibt
- Steuern, Wohlstand, Rang und vergangene Tagesabrechnungen ändern sich nicht rückwirkend; der neue Platz gilt erst ab dem Umzugszeitpunkt.
- Alle Spieler sehen denselben Standort (abgeleitet aus gespeicherten Umzügen, keine Zustandsspeicherung).

## Technische Details
- Neue Tabelle `building_moves` (seed_id, item, x, y, created_at), RLS nur Eigentümer schreibt, alle lesen. Preis, Abstand 7 Tage, „ein Umzug gleichzeitig“ und Kassenabzug per DB-Trigger/Funktion (wie bei Käufen), Kosten als Ausgabe in der Kassenabrechnung verbucht.
- Umzüge werden wie Käufe in `Seed.bought` gemischt; `specialSites(s)` nimmt für jedes Item den letzten Umzug mit `at ≤ now` als Position; während `at … at+12h` erscheint am neuen Platz die Baustellenphase (`Structure.build`), Bonus unverändert. Cache-Schlüssel von `specialSites` um Umzüge erweitert.
- Platzprüfung: `canPlaceSpecial` liefert schon Fehlercodes → werden als Grund angezeigt; beim Umsetzen wird das eigene alte Feld als frei behandelt.
- Vorschau: Footprint-Markierung und Kandidaten-Hervorhebung im bestehenden Ghost-Zeichnen in Game.tsx.
- Tests: Preis pro Größe, Positionswechsel erst ab Umzugszeit, Steuer vor dem Umzug unverändert, Sperrfrist.
- Nebenbei gespeichert: Währung heißt „Lübische Mark“, nie „Taler“ (Memory). Bestehende Texte mit „Taler“ prüfe ich und ersetze sie in einem eigenen Schritt nur nach Rückfrage.
