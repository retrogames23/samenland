# Inselregister im Reiter „Dörfer"

Der bestehende Reiter „Dörfer" wird zu einer aufgeräumten Übersicht der ganzen Insel. Alle Angaben werden aus den Daten berechnet, die das Spiel ohnehin schon geladen hat. Es gibt keine neue Datenbankabfrage, keine Migration und keine Änderung an der Spielmechanik.

## Was man sieht

**Kopfbereich**
- Name der Insel, z. B. „Altenland"
- Zahl der Orte und Bürger auf der ganzen Insel
- Wie sich die Orte auf die drei Wege verteilen: Kornkammer, Werkbank, Tor zur Welt

**Sortierknöpfe**
- Nach Bürgern, Entfernung zur eigenen Stadt oder Name
- Standard: Bürger, die größten Orte zuerst

**Eine kompakte Zeile pro Ort**
- Zeichen für den Weg, Name und Rang, z. B. Weiler oder Hansestadt
- Bürger und Haushalte
- Bis zu drei Waren, die der Ort anbietet, als kleine Warensymbole
- Verbindung zur eigenen Stadt: Handelsstraße, im Bau, oder Reitminuten
- Der eigene Ort ist hervorgehoben und steht immer oben

**Aufklappen beim Antippen**
- Darunter erscheinen die bisherigen Angaben: Schulze, Alter, Boni, Mentor und Markt
- Dazu die bisherigen Knöpfe: Profil, Hinschauen, Brief und Geschenk oder Hilfe
- Diese Knöpfe behalten genau die Regeln, die sie heute haben

## Was gleich bleibt
- Der Knopf in der unteren Leiste und die Verweise aus den Aufgaben, die auf diesen Reiter zeigen
- Geschenk- und Brieflogik, Preise und alle Regeln

## Technische Details
- Neue Komponente `src/components/hud/IslandRegister.tsx`. Die Liste in `Game.tsx` (Zeile ~2386) wird durch diese Komponente ersetzt, Handler und Daten werden als Props übergeben. Das passt zur bereits beschlossenen Aufteilung von `Game.tsx`.
- Herkunft der Daten:
  - Rang, Bürger und Haushalte aus `townsCache` (`tc.rank` sowie die vorhandenen Zahlen zu Bewohnern und Haushalten)
  - Weg über `wayOf(s)`
  - Waren aus dem vorhandenen Profil bzw. aus `goods.ts`
  - Verbindung aus `links(seeds)`, Entfernung über die Koordinaten
- Inselname aus `islands.ts` bzw. dem aktuellen Realm.
- Alle neuen Texte stehen im Sprachkatalog, in allen acht Sprachen.
- Bei schmalem Bildschirm scrollt die Liste. Sortierauswahl und Aufklappzustand bleiben nur lokal und werden nirgends gespeichert.
- Prüfung: Typprüfung, Build und eine Bildschirmaufnahme im Preview mit Handybreite.
- Keine Veröffentlichung.
