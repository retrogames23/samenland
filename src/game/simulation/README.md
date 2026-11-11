# Economy simulation (offline tool)

- Run: `bun src/game/simulation/run.ts <profile|all> <charter|all> <location|base|probes|all> [days]` → one JSON per scenario in `$SIM_OUT` (default /tmp/sim-out).
- Summary: `bun src/game/simulation/report.ts <dir> <out.csv>`.
- Receipt check: `bun src/game/simulation/validate.ts <dumpDir>` recomputes stored `tax_receipts` from a JSON dump of the live tables (seeds, purchases, blessings, charters, encounters, roads, votes, works, gifts, receipts).
- Tests: `bunx vitest run src/game/simulation`.

**Game rules (imported unchanged):** `residentTax` (same call as treasury.server.ts), weddingDates (dowries), raids, townRank, all prices (ITEMS, MONUMENTS, CHEST_*, RANK_*, TITLE_*, TWIN_WORKS), rank/charter/way gates, quest and decree rewards, chest caps with the chronological cap of migration 0107 (tax → dowry → other credits → debits → raids).

**Model assumptions (profiles.ts / engine.ts):** login rhythm, reserve, purchase order (chest → care → guild → ranks → titles → civic → way → monuments), quests paid once their milestone rank is reached, decrees from Dorf on, wonder finds 50 Mark, visit gift 60 Mark, roads to two neighbours founded 60 days earlier on days 14 and 45, rank recounted every 10 days until Hansestadt (Hansestadt day ±10), realm europe. Not modelled: gifts, markets, encounters, referrals, twin works (750 Mark, reported separately).

**Saturation states:** 1 `strategyDoneDay` (profile's last purchase), 2 `unlockedDoneDay` (everything unlocked at the current rank bought), 3 `saturationDay` (every legal investment of the town bought) with `idleDays` until the end.
