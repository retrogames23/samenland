# src/lib rules
- Reads that can exceed 1000 rows use src/lib/fetch-all.ts (keyset, chunked ids, errors throw), scoped to the current map — the data API caps replies at 1000.
- Realtime handlers in Game.tsx accept rows only for the loaded map (onIds/applySign in src/game/realtime.ts) and run through LoadGate: events during a map load are held and replayed against the new ids, load results merge (mergeRows) instead of overwriting — nothing lost, nothing foreign.
