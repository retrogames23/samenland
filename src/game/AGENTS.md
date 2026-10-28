# src/game rules

- Weddings: calendar in src/game/weddings.ts (dowry mirrored by DB village_dowry in village_balance); couples/kin derived in people.ts marry()/kinOf — never stored, all clients agree.
- Villager life (traits.ts, Sunday via isSunday() in time.ts, sickness/carers and wedding processions in people.ts) is derived from ids, homes and the clock; never store it — all clients see the same day.
- Disasters (src/game/disasters.ts): fires, floods and raids are a pure calendar from (seed id, time window) plus purchases; structureAt applies burning/rebuild/flood via tileHits, raid losses are mirrored by DB village_raids — never store disaster state, so all clients and the treasury agree.
- Mentor bonus (mentorHours in world.ts) is derived from links + creation dates and added to effAge outside TRADE_CAP; never stored — late joiners catch up identically on every client.
- Journeymen and messengers between towns (src/game/wander.ts) are a pure calendar from road + UTC day; never stored — all clients see the same walkers.
- Family moves (wander.ts "family") empty a source house for VACANT_DAYS; derived, not stored.
- Neighbour gifts/aid/thanks: only gift rows are stored (DB gift_guard: prices, 1/day, treasury); carts (wander.giftWalkers), faster rebuild (Seed.aid → aidFactor) and balances are derived.
