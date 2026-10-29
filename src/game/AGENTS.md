# src/game rules

- Weddings: calendar in src/game/weddings.ts (dowry mirrored by DB village_dowry in village_balance); couples/kin derived in people.ts marry()/kinOf — never stored, all clients agree.
- Villager life (traits.ts, Sunday via isSunday() in time.ts, sickness/carers and wedding processions in people.ts) is derived from ids, homes and the clock; never store it — all clients see the same day.
- Disasters (src/game/disasters.ts): fires, floods and raids are a pure calendar from (seed id, time window) plus purchases; structureAt applies burning/rebuild/flood via tileHits, raid losses are mirrored by DB village_raids — never store disaster state, so all clients and the treasury agree.
- Mentor bonus (mentorHours in world.ts) is derived from links + creation dates and added to effAge outside TRADE_CAP; never stored — late joiners catch up identically on every client.
- Journeymen and messengers between towns (src/game/wander.ts) are a pure calendar from road + UTC day; never stored — all clients see the same walkers.
- Family moves (wander.ts "family") empty a source house for VACANT_DAYS; derived, not stored.
- Neighbour gifts/aid/thanks: only gift rows are stored (DB gift_guard: prices, 1/day, treasury); carts (wander.giftWalkers), faster rebuild (Seed.aid → aidFactor) and balances are derived.
- Map zoom has one render path (no detail threshold): wild nature is placed by natureAt() in render.ts, baked into ground chunks only outside possible town reach — so trees, house facing and pastures never pop while zooming.
- Personal space (src/game/space.ts): footprints + a pure separation pass at draw time (people vs. people/sheep, keep-right on roads); collisions are derived per frame, never stored — all clients agree.

- Calendar weights live in season.ts using UTC; season-art.ts caches alpha-preserving recolored images and nature/overview caches include the season key, so seasonal changes remain consistent without per-frame pixel processing.
- Goods hauling (Person.haul in people.ts) is derived from jobs and nearby buildings and animated as a pure clock cycle; never store goods or stock — all clients see the same carriers.
- Traffic and villagers use pure motion.ts headings and N-1 road segments to prevent facing flicker and overshoot.
- Animal routines in animals.ts use the realm clock; resting art and frozen dusk positions prevent nighttime motion.
- Landmarks relocate from their nominal offset to the nearest dry tile via landmarkSpots(seed) in world.ts (pure, cached) — so coastal/mountain towns never lose landmarks to water.
- Craft scenes (fisher casting, smith at anvil, mill sacks, bread basket) derive from the world clock in src/game/crafts.ts and job work sheets (JOB_WORK in folk-sprites.ts); props draw in the worker's mirrored frame so they always line up — nothing stored.
- Trade roads: every road touching a player village is a stored decision row (first_roads, DB guard: in reach, one row per direction, one under construction per village; either side suffices, build time from distance via roadHours (mirrored by DB road_done), a counter-decision halves the remaining time via roadDone); roadGate/roadCandidates/roadBuilding in world.ts derive links from them — sample-only pairs connect by themselves.
- Friend invites: only referral rows are stored (claim_referral DB function checks Weiler age, same map, new account, one per user); the 50-Taler bonus for both villages is derived via referralClaims in economy.ts and mirrored in village_balance.
- Grain storage is capped by grainCap(byKind) in goods.ts (base + per mill + per granary) and leftover grain feeds villagers as porridge; a second mill landmark appears as farming villages grow — all derived, never stored.
- Free game (src/game/wildlife.ts) lives in hashed dens on open nature map-wide; the nearest finished lodge hunts its deer dens in turn (huntTarget spacing > REGEN) and denFate empties/regrows them — pure from tiles + clock, never stored; figures are bucketed per tile in render pass 2.
