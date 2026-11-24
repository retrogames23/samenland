# Kartenauswertung Stegzimmerei (Wirtschaftsumbau, Paket 2)

Nur Auswertung, keine Spiellogik. Grundlage ist die bestehende Verbindungslogik in `src/game/world.ts`:
`roadBridge` (dasselbe A* wie gebaute Straßen), `MAX_BRIDGE = 10` und `roadAllowed` (Reichweite 80 bzw. 120 Felder).

- `map.mts <realm> [n] [seed]`: zieht n legale Gründungsfelder (`canPlant`). Für jedes Feld wird geprüft, ob ein
  legaler Nachbarplatz in 45, 60 oder 75 Feldern Abstand (24 Richtungen) erreichbar ist: heute (Brücke ≤ 10),
  nur mit Stegzimmerei (Brücke ≤ 18) oder gar nicht. Das ist eine geografische Obergrenze, unabhängig von echten Dörfern.
- `villages.mts seeds.json`: dieselbe Frage für echte Spielerdörfer und ihre tatsächlichen Nachbarn.
  Eingabe ist ein Export von `public.seeds` (id, x, y, realm, user_id, created_at) mit den Straßen aus `first_roads`
  als `roads: [{target, at}]`. Ausgegeben wird, welche Dörfer heute keine Straße haben, aber mit +8 Brückenfeldern eine bekämen.

Ergebnis vom 24.11.2026 (`map-2026-11-24.jsonl`, 2.000 Felder je Karte, 11 Karten): 98,4–100 % der Gründungsfelder
erreichen schon heute einen Nachbarplatz. Mit Stegzimmerei kämen 0–0,35 % hinzu, alle an der Küste.
