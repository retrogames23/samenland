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

## 2. Progressionsregel

Steuer je Kopf: `1 + s + 2w` (s = Anteil Gesellen, w = Anteil Wohlhabende). `L = estateShares(wealth)` ist die bisherige Verteilung; jede Stufe ist zusätzlich durch L nach oben begrenzt, sodass nie mehr gezahlt wird als heute.

Rang `r` = derselbe Stadtrang, der heute die Kaufsperre nach ITEM_RANK steuert. `school = owns(s, "school", now)`.

```text
Weiler/Dorf (r <= 2), sowie Kleinstadt ohne Schule:
  s = min(L.skilled, 0.04 + 0.025·n, 0.20)      w = 0
  -> 1,04 bis höchstens 1,20 M/Kopf

Kleinstadt mit Schule (r = 3):
  s = min(L.skilled, 0.35)                        w = min(L.wealthy, 0.05)
  -> höchstens 1 + 0,35 + 0,10 = 1,45 M/Kopf

Handelsstadt (r >= 4), k = min(1, Tage seit Erreichen von r4 / 14):
  s = min(L.skilled, 0.35 + k·(0.55 − 0.35))
  w = school ? min(L.wealthy, 0.05 + k·(L.wealthy − 0.05)) : 0
  -> nach 14 Tagen volle bisherige Verteilung L (max. ~2,08 M/Kopf)
```

Übergänge rechnerisch:
- Dorf -> Kleinstadt mit Schule: höchstens 1,20 -> 1,45 (+0,25 M, +20,8 %).
- Kleinstadt -> Handelsstadt: über 14 Tage linear bis L; kein Sprung an einem Tag.
- Ohne Schule bleibt w in jeder Stufe 0.

Haushaltszuordnung: `estateAt` behält den festen Kachel-Wurf `roll`; wohlhabend wenn `roll < w`, Geselle wenn `roll < w + s`. Steigende Anteile befördern also nur Haushalte, nie zurück, solange die Anteile wachsen.

## 3. SQL

Keine Migration.
- `estate_assessment` wird nur noch von `village_capped_tax_fast` (0096) für Tage vor dem ersten Steuerbeleg aufgerufen, also für die eingefrorenen Altsalden über `village_balance_legacy` (0107). Eine Änderung würde historische Kassenstände verschieben – verboten.
- Seit dem Cutover stammen Steuern ausschließlich aus `tax_receipts`, geschrieben vom Server über `residentTax()`. Die neue Regel greift damit automatisch nur für neue Belege.
- `village_civic_wealth` (Hochzeiten, Altsalden) bleibt unverändert, weil der Wohlstandswert selbst unverändert bleibt.
- Keine überladene Funktion, da kein aktueller Aufrufer sie braucht.

## 4. Betroffene TypeScript-Dateien

1. `src/game/prosperity.ts`: `ESTATE_INFRA`-Positivliste, `infraCount(s, now)`, `estateCaps(s, now)` (liefert s/w nach Abschnitt 2), `estateAt(shares, x, y)` und `estateAssessment(pop, shares)` nehmen die gedeckelten Anteile statt des Wohlstands. Wohlstandsanzeige bleibt `civicWealth`.
2. `src/game/resident-tax.ts`: Anteile einmal je Seed/Stichtag über `estateCaps` und an `estateAt` übergeben.
3. `src/game/people.ts` (`townOf`, Z. 285): dieselben Anteile für `p.estate`.
4. `src/game/world.ts` (`structureAt`, Z. 837): dieselben Anteile für `estateHouse` – Haus, Bürgerrolle und Steuer bleiben deckungsgleich.
5. `src/game/economy.ts` (`taxOnDay`, `dailyTax`): nur für Tage nach dem Cutover die neuen Anteile; davor unverändert die bisherige Formel, damit lokale Altsalden zur Datenbank passen.
6. Unverändert, erben automatisch: `src/lib/treasury.server.ts`, `src/game/simulation/engine.ts`, `model-c.ts`.
7. `src/game/i18n.ts`/Sprachdateien: nur falls das Bürgerbuch einen Hinweis „Wohlhabende erst mit Schule" zeigen soll (optional, nicht Teil der Regel).

## 5. Tests

- `prosperity.test.ts`: Positivliste exakt 13 Einträge und alle mit ITEM_RANK <= 2; ausgeschlossene Bauten zählen nicht; Kauf zählt erst ab `at`; Straße zählt erst ab Fertigstellung, max. 3; n=0 -> s=0,04; n=4 -> 0,14; n>=7 -> 0,20; w=0 ohne Schule in jedem Rang; Kleinstadt+Schule -> Kopfsteuer <= 1,45; Handelsstadt Tag 0 = Kleinstadtwerte, Tag 14 = L; nie über L.
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
