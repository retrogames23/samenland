# Economy simulation (offline tool)

Run: `bun src/game/simulation/run.ts <profile|all> <charter|all> <location|all> [days]` → JSON per scenario in `$SIM_OUT` (default /tmp/sim-out). Tests: `bunx vitest run src/game/simulation`.

**Game rules (imported unchanged):** taxOnDay (estate tax), weddingDates (dowries), townRank, prices (ITEMS, MONUMENTS, CHEST_*, RANK_*, TITLE_*), rank gates (ITEM_RANK, *_STAGE), charter/way gates (canBuy, canBuyWay), quest and decree rewards, chest caps with surplus lost at the moment's cap.

**Model assumptions (profiles.ts / engine.ts):** login rhythm, reserve, purchase order (chest → care → guild → ranks → titles → civic → way → monuments), quests paid as soon as their milestone rank is reached, decrees from Dorf on, wonder finds 50 Mark, visit gift 60 Mark, roads to two older neighbours on days 14 and 45, rank recounted every 10 days until Hansestadt, no raids/gifts/market/encounters/referrals, estate tax instead of the trusted resident-tax receipts.

Output per scenario: rank days, Hansestadt day, saturation day (all regular purchases bought), first/regular overflow, gross/booked/lost/spent, tax share, phases (until Hansestadt / until saturation / after), daily rows and a full booking ledger.
