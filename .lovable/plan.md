# Variante 3 – endgültige Spezifikation (Stände-Gating)

## 1. Qualifizierende Infrastruktur (abschließende Positivliste)

Abgeglichen mit `ITEM_RANK` (src/game/disasters.ts). Es zählen genau diese 13 Käufe, je Bau einmal, ab `bought.at <= now`:

| Rang | Bauten |
|---|---|
| 0 | herbs, hunter, fisher, dairy |
| 1 | backhaus, herberge, woodcamp, granary, healer, bigstore, stonemason, smokehouse |
| 2 | beginen |

Bewusst ausgeschlossen:
- markethall, guildhall, library (Rang 0 in ITEM_RANK, aber Repräsentations-/Kulturbauten, kein Dorfgewerbe; wirken bereits über den Wohlstand).
- badestube, school, firehouse, millrow, hammerworks, saltquay (Rang 3) und guard (Rang 4): städtische Bauten, dürfen die Dorfphase nicht beeinflussen. Die Schule ist Schalter, kein Zählbau.
- rank2/rank3, title1–3, Charta, Monumente, Segen, Straßen-Beschlüsse im Bau.

Abgeschlossene Handelsstraße: ein Eintrag in `s.civicRoads`, also ein Partnerdorf, für das `roadDone(s, o)` einen Zeitpunkt liefert, mit `at <= now`. Jede Partnerstraße zählt einmal; höchstens 3 Straßen werden angerechnet (gleiche Obergrenze wie in `civicWealth`). Geplante oder im Bau befindliche Straßen zählen nicht.

`n = gezählte Bauten + min(3, fertige Straßen)`.

## 2. Progressionsregel (verbindlich: Option A, umgesetzt in `gatedEstateShares`)

Steuer je Kopf: `1 + s + 2w` (s = Anteil Gesellen, w = Anteil Wohlhabende). `L = estateShares(wealth)` ist die bisherige Verteilung; jede Stufe ist zusätzlich durch L nach oben begrenzt.

Rang `r = townRank(s, seeds, at)` (echte Bürger, bewohnte Haushalte, fertige Straßen), `school = Schulkauf mit at <= Bewertungszeitpunkt`, `n = infraCount(s, at)` (Abschnitt 1).

```text
Ohne Schule (jeder Rang) oder r <= 2:
  s = min(L.skilled, 0.04 + 0.025·n, 0.20)   w = 0      -> höchstens 1,20 M/Kopf
r = 3 mit Schule:  s = min(L.skilled, 0.35)   w = min(L.wealthy, 0.05)   -> höchstens 1,45 M/Kopf
r = 4 mit Schule:  s = min(L.skilled, 0.45)   w = min(L.wealthy, 0.15)   -> höchstens 1,75 M/Kopf
r = 5 mit Schule:  s = L.skilled              w = L.wealthy              -> volle Verteilung (~2,08 M/Kopf)
```

Feste Obergrenzen je Rang statt Timer: Für den Rang-4-Zeitpunkt ist kein Zeitstempel gespeichert, ein Gründungszeitpunkt als Ersatz ist ausgeschlossen.

**Überholt (nicht umgesetzt):** Der frühere Entwurf mit gleitendem 14-Tage-Übergang ab Handelsstadt (`k = min(1, Tage seit r4 / 14)`) ist durch Option A ersetzt.

Haushaltszuordnung: fester Kachel-Wurf `estateRoll(x, y)` über `estateOf(shares, x, y)`; wohlhabend wenn `roll < w`, Geselle wenn `roll < w + s`. Steuer (`resident-tax.ts`), Bürgerstand (`people.ts`) und Hausdarstellung (`world.ts`) nutzen dieselben Anteile aus `sharesAt` in prosperity.ts.

## 3. SQL

Keine Migration.
- `estate_assessment` wird nur noch von `village_capped_tax_fast` (0096) für Tage vor dem ersten Steuerbeleg aufgerufen, also für die eingefrorenen Altsalden über `village_balance_legacy` (0107). Eine Änderung würde historische Kassenstände verschieben – verboten.
- Seit dem Cutover stammen Steuern ausschließlich aus `tax_receipts`, geschrieben vom Server über `residentTax()`. Die neue Regel greift damit automatisch nur für neue Belege.
- `village_civic_wealth` (Hochzeiten, Altsalden) bleibt unverändert, weil der Wohlstandswert selbst unverändert bleibt.
- Keine überladene Funktion, da kein aktueller Aufrufer sie braucht.

## 4. Betroffene TypeScript-Dateien

1. `src/game/prosperity.ts`: `ESTATE_INFRA`-Positivliste, `infraCount(s, now)`, `estateCaps(s, now)` (liefert s/w nach Abschnitt 2), `estateAt(shares, x, y)` und `estateAssessment(pop, shares)` nehmen die gedeckelten Anteile statt des Wohlstands. Wohlstandsanzeige bleibt `civicWealth`.
2. `src/game/resident-tax.ts`: Anteile einmal je Seed/Stichtag über `estateCaps` und an `estateAt` übergeben.
3. `src/game/people.ts` (`townOf`): `estateSharesLive` (sharesAt + townRank, gemerkt je Minute) für `p.estate`. (umgesetzt)
4. `src/game/world.ts` (`structureAt`): dieselben Anteile über einen Hook für `estateHouse` – Haus, Bürgerrolle und Steuer bleiben deckungsgleich. (umgesetzt)
5. `src/game/economy.ts` (`taxOnDay`, `dailyTax`): nur für Tage nach dem Cutover die neuen Anteile; davor unverändert die bisherige Formel, damit lokale Altsalden zur Datenbank passen.
6. Unverändert, erben automatisch: `src/lib/treasury.server.ts`, `src/game/simulation/engine.ts`, `model-c.ts`.
7. `src/game/i18n.ts`/Sprachdateien: nur falls das Bürgerbuch einen Hinweis „Wohlhabende erst mit Schule" zeigen soll (optional, nicht Teil der Regel).

## 5. Tests

- `prosperity.test.ts`: Positivliste exakt 13 Einträge und alle mit ITEM_RANK <= 2; ausgeschlossene Bauten zählen nicht; Kauf zählt erst ab `at`; Straße zählt erst ab Fertigstellung, max. 3; n=0 -> s=0,04; n=4 -> 0,14; n>=7 -> 0,20; w=0 ohne Schule in jedem Rang; Obergrenzen je Rang 3/4/5 nach Abschnitt 2; nie über L.
- `resident-tax.test.ts`: Summe der Haushaltsstände = aggregierte Steuer; vor Cutover unverändert.
- `census.test.ts`: Bürgerbuch-Zählung = Steuerstände.
- Konsistenztest: für dieselbe Kachel liefern people.ts, world.ts und resident-tax.ts denselben Stand.
- `economy`-Regression: Saldo vor Cutover byte-identisch zum Stand vor der Änderung.
- `engine.test.ts`, `model-c.test.ts`: laufen weiter grün.

## 6. Reihenfolge

1. prosperity.ts: Liste, `infraCount`, `estateCaps` + Unit-Tests (noch ohne Aufrufer).
2. resident-tax.ts umstellen + Tests; Altsaldo-Regression.
3. people.ts und world.ts umstellen + Konsistenztest.
4. economy.ts (nur Tage nach Cutover) + Regression.
5. Simulation der 5 Profile inkl. investierendem Gelegenheitsspieler, Tag 1 bis Handelsstadt, zur Kontrolle.
6. Veröffentlichung erst nach Freigabe.
