# Economy simulation (offline tool)

- Run: `bun src/game/simulation/run.ts <profile|all> <charter|all> <location|base|probes|all> [days]` → one JSON per scenario in `$SIM_OUT` (default /tmp/sim-out).
- Summary: `bun src/game/simulation/report.ts <dir> <out.csv>`.
- Receipt check: `bun src/game/simulation/validate.ts <dumpDir>` recomputes stored `tax_receipts` from a JSON dump of the live tables (seeds, purchases, blessings, charters, encounters, roads, votes, works, gifts, receipts).
- Tests: `bunx vitest run src/game/simulation`.

**Game rules (imported unchanged):** `residentTax` (same call as treasury.server.ts), weddingDates (dowries), raids, townRank, all prices (ITEMS, MONUMENTS, CHEST_*, RANK_*, TITLE_*, TWIN_WORKS), rank/charter/way gates, quest and decree rewards, chest caps with the chronological cap of migration 0107 (tax → dowry → other credits → debits → raids).

**Model assumptions (profiles.ts / engine.ts):** login rhythm, reserve, purchase order (chest → care → guild → ranks → titles → civic → way → monuments), quests paid once their milestone rank is reached, decrees from Dorf on, wonder finds 50 Mark, visit gift 60 Mark, roads to two neighbours founded 60 days earlier on days 14 and 45, rank recounted every 10 days until Hansestadt (Hansestadt day ±10), realm europe. Not modelled: gifts, markets, encounters, referrals, twin works (750 Mark, reported separately).

**Saturation states:** 1 `strategyDoneDay` (profile's last purchase), 2 `unlockedDoneDay` (everything unlocked at the current rank bought), 3 `saturationDay` (every legal investment of the town bought) with `idleDays` until the end.

## Model C (voluntary municipal projects)
`bun src/game/simulation/model-c.ts <profile|all> <charter|all> <location|base> [tax_only|surplus_only|hybrid|all] [rate|all] [days]`
Replays the base run's daily rows (real residentTax, chest caps) and adds a voluntary tax diversion (default 0 %, only from Handelsstadt, only while a project is chosen) and/or manual donations above the profile reserve. Prints CSV; the `errors` column counts days where a balance identity failed (must be 0). Catalog: 12 projects, 374,500 Mark local share, 490,000 Mark total value.

Each stage stores `totalCost`, `localCost`, and `buildDays`; project and catalog sums are derived from these stages. Only the local share is funded by Model C. Existing regional projects retain their financing ratio, apportioned proportionally across stages.

Model C computes its own raids with `raidPlan`, ignoring base-row `raid`. The optional `seedId` selects the calendar (default zero hash, matching engine simulation seeds). Purchase timestamps are integer simulation days; protection starts when the own guard is purchased and applies only to attacks at or after that timestamp, including equality. Raids are booked after credits, purchases and donations, capped by the own remaining balance; the event hour is preserved for protection checks.

| Project | Total value per stage | Local share per stage | Build days per stage |
| --- | --- | --- | --- |
| Fountain | 4,000 / 8,000 / 12,000 | 4,000 / 8,000 / 12,000 | 14 / 21 / 30 |
| Spital | 10,000 / 18,000 / 22,000 | 10,000 / 18,000 / 22,000 | 21 / 35 / 42 |
| Bridge | 16,000 / 24,000 | 8,000 / 12,000 | 28 / 42 |

Project choice: the player picks the next project via `choose({ day, rank, available })` or a pre-planned `order` list (CLI passes the full catalog order). Without a pick nothing is diverted or donated. A pick is locked until it is fully funded and its build days have passed; only then is the player asked again. Completed projects are no longer available.
