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
- Growth stages, water-adjacent landmarks and rail eligibility are derived in world.ts; retain sublinear expansion and core densification rather than saving progress, so offline growth remains reproducible.
- Calendar weights live in season.ts using UTC; season-art.ts caches alpha-preserving recolored images and nature/overview caches include the season key, so seasonal changes remain consistent without per-frame pixel processing.
- World, trade and population caches include seed positions and creation timestamps, so replacing equal-sized seed sets cannot reuse stale geometry or progression.
- Construction sites are derived, not stored: a building's site phase is the buildTime() window before its birth age (Structure.build); builders/woodcutters/masons are assigned in people.ts from that — keeps every client identical.
- Goods hauling (Person.haul in people.ts) is derived from jobs and nearby buildings and animated as a pure clock cycle; never store goods or stock — all clients see the same carriers.

- Dorfsegen: blessings table with a 24h DB trigger cooldown; blessing timestamps are merged into Seed.blessed client-side and effAge adds the bonus purely — keeps growth deterministic across clients.
- Signposts sit on derived road tiles (signTile in world.ts); only the message is stored.
- Bought buildings are placed by specialSites(seed) in world.ts from purchase rows merged into Seed.bought; newcomers (Person.arrive) derive from bornAt() — both pure, so all clients agree.
