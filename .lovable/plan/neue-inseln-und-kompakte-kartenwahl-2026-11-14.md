# Neue Inseln und kompakte Kartenwahl

## Stand heute
- Karten: Altenland (Europa, 92 Orte), Elbwerder (Europa II, 39), Westeroog (Amerika West, 2), Möwenwerder (Amerika Ost, 4), Sandwerder (Asien, 7), dazu die Testkarte.
- Überlauf gibt es nur Altenland -> Elbwerder ab 60 Orten (im Spiel und hart in der Datenbank).
- Die Admin-Kartenwahl ist eine Reihe einzelner Knöpfe.

## 1. Admin-Kartenwahl als Pulldown
- Die Knopfreihe wird ein schmales Auswahlfeld mit allen Karten (Name der Insel + Zeitzone, z. B. „Elbwerder · Europa II“), Testkarte am Ende.
- Verhalten bleibt gleich: Auswahl lädt die Karte sofort und wird gemerkt.

## 2. Neue Inseln (Namensvorschläge, frei erfunden, norddeutsch klingend)
| Karte | Insel | Landschaft |
|---|---|---|
| Europa III | **Störwerder** | Flussmarsch mit Prielen und Deichland, kleine Geestinsel im Norden |
| Amerika West II | **Hallighörn** | Halligkette: viele flache Inselchen mit Warften, breites Watt |
| Amerika Ost II | **Boddenholm** | Ostsee-Insel mit tief eingeschnittenen Bodden und Steilufer |
| Asien-Pazifik II | **Moorgeest** | Kompakte Insel mit Hochmoor in der Mitte und Sandrücken am Rand |

- Jede Insel bekommt eine eigene Küstenform und eigene Naturwunder.
- Pflanzen und Tiere überall Norddeutschland um 1500: Eiche, Buche, Birke, Erle, Kiefer, Weißdorn, Heide; keine Fichten. Leichte eigene Farbnuance je Insel (z. B. Moorgeest mehr Birke/Heide, Störwerder mehr Erle/Weide-Grün).
- Uhrzeit jeder II-/III-Karte = die der Mutterkarte, Tag/Nacht bleibt also pro Zeitzone gleich.
- Namen in allen acht Sprachen (Karten „… II“/„… III“).

## 3. Überlauf ab 60 Orten, hart
- Kette je Zeitzone: Altenland -> Elbwerder -> Störwerder; Westeroog -> Hallighörn; Möwenwerder -> Boddenholm; Sandwerder -> Moorgeest.
- Neue Spieler ohne Dorf landen auf der ersten Karte der Kette mit weniger als 60 Orten. Elbwerder hat 39 Orte, füllt sich also bald nach Störwerder.
- Bestehende Dörfer, Admins und die feste Europa-Zuweisung (Victoria/Johanna) bleiben unberührt.
- Die Datenbank lehnt jede Neugründung auf einer vollen Karte ab (gilt für alle Karten außer der jeweils letzten der Kette).

## Technische Details
- time.ts: Realms `europe-3`, `us-west-2`, `us-east-2`, `asia-2`; REALM_TZ von der Mutterkarte; `REALM_NEXT`-Kette + `REALM_FULL = 60` ersetzt die Europa-Sonderlogik; Game.tsx wählt über die Kette (Zählung je Karte).
- world.ts: vier neue Höhenfunktionen (eigene Seeds), ANCHORS/Wunderorte je Geo; biome.ts: vier neue Biome mit Look-Werten innerhalb norddeutscher Flora; islands.ts Namen; wonders.ts je Realm.
- Migration: `seeds_realm_check` um die vier Realms erweitern; `europe_full_guard` zu generischem `realm_full_guard` (Kettentabelle in der Funktion, Admin ausgenommen); Wunderorte der neuen Inseln in `wonder_sites` (Spiegel von wonders()); Kommentar-/AGENTS.md-Regel aktualisieren.
- Admin-Auswahl: shadcn `Select` statt Knopfreihe.
- Tests: Kette/Überlauf (59 -> bleibt, 60 -> nächste), jede neue Insel hat genug bebaubares Land und Wunder auf Land, keine Fichten-Look-Werte über Heide-Niveau.
- Kein Veröffentlichen.
