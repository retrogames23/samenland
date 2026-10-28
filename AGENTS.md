<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Samenland game
- Town growth is a pure deterministic function of seed position + created_at (src/game/world.ts); never store growth state — every client computes the same town from the shared seed rows, so towns grow even when nobody watches.
- Rendering uses a full-resolution (devicePixelRatio) canvas; preload compressed building sprites with per-kind sizes and ground anchors, using the same assets at every zoom level to avoid style changes while loading.
- Seed ownership is enforced in the database (seeds.user_id UNIQUE + RLS on auth.uid()); UI strings live in src/game/i18n.ts (de/en), game logic returns codes not text.
- Trade roads, synergy and twin towns are derived from seed pairs in src/game/world.ts (links/effAge); growth uses effective age, never stored state — keeps all clients identical.
- Villagers (src/game/people.ts) are a pure function of seed, buildings and clock time; never store them — every client sees the same people.
- Growth stages and water-adjacent landmarks are derived in world.ts; the world stays pre-industrial (no steam, no rails) so old and young towns share one era; retain sublinear expansion and core densification rather than saving progress, so offline growth remains reproducible.
- Calendar weights live in season.ts using UTC; season-art.ts caches alpha-preserving recolored images and nature/overview caches include the season key, so seasonal changes remain consistent without per-frame pixel processing.
- World, trade and population caches include seed positions and creation timestamps, so replacing equal-sized seed sets cannot reuse stale geometry or progression.
- Construction sites are derived, not stored: a building's site phase is the buildTime() window before its birth age (Structure.build); builders/woodcutters/masons are assigned in people.ts from that — keeps every client identical.
- Goods hauling (Person.haul in people.ts) is derived from jobs and nearby buildings and animated as a pure clock cycle; never store goods or stock — all clients see the same carriers.
- Traffic and villagers use pure motion.ts headings and N-1 road segments to prevent facing flicker and overshoot.
- Animal routines in animals.ts use the realm clock; resting art and frozen dusk positions prevent nighttime motion.

- Dorfsegen: blessings table with a 24h DB trigger cooldown; blessing timestamps are merged into Seed.blessed client-side and effAge adds the bonus purely — keeps growth deterministic across clients.
- Signposts sit on derived road tiles (signTile in world.ts); only the message is stored.
- Bought buildings are placed by specialSites(seed) in world.ts from purchase rows merged into Seed.bought; newcomers (Person.arrive) derive from bornAt() — both pure, so all clients agree.

- Building night lighting uses aligned, light-only sprite layers with the daylight sprite dimensions and anchors; schedules and flicker live in night.ts so windows stay aligned at every zoom without replacing daytime art.
- Encounters: the day's event is derived in src/game/encounters.ts from (seed id, UTC day); only the chosen answer is stored, with prices and one-per-day enforced by a database guard — keeps all clients identical and spending tamper-proof.
- Day/night, villager routines, lights and bell use one world clock (src/game/time.ts, Europe/Berlin); never read the client's local hour, so all players see the same scene.
- Four realms (seeds.realm: us-west/us-east/europe/asia) are separate maps, each with its own shared clock in src/game/time.ts; players land by browser UTC offset, only admins (user_roles) may override — keeps day/night shared within a map.
- Twin towns: touch time (twinSince), pacts, joint works, gate sites and festival bonuses are derived in world.ts from seeds + twin_votes/twin_works rows (DB guard charges halves); never store twin state — all clients agree.
- Landmarks relocate from their nominal offset to the nearest dry tile via landmarkSpots(seed) in world.ts (pure, cached) — so coastal/mountain towns never lose landmarks to water.
- Villagers, waymarks, border banners/stones and construction props are painted sprites (src/game/folk-sprites.ts); banner cloth is tinted per town hue at runtime and drawn in world space so night lighting applies — no flat vector figures next to painted art.
- Admin test map (realm "lab") warps the game clock via clock() in src/game/time.ts; all game code must read time through clock(), never Date.now(), so the time-lapse applies everywhere.
- Coastal towns grow in town-space distance (townDist/landShape in world.ts): landward tiles are compressed by a land-share stretch so harbour towns fan inland; bounding boxes must use reachOf(s, r).
- Village chronicle (src/game/chronicle.ts) is derived from seeds between last visit (localStorage) and now; while the owner watches, Game.tsx diffs it periodically for illustrated celebrations — no stored history. Only the scribe greeting uses AI (authenticated server function, fixed fallback).
- Subdirectories have their own AGENTS.md (src/game/AGENTS.md) – read it before changing files there.
