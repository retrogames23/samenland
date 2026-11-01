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
- Civic estates and tax assessments are derived in prosperity.ts from historical purchases and charter, mirrored by database village_civic_wealth/village_estate_tax; temporary stock bonuses do not permanently promote residents, and homeKind preserves population when sprites upgrade.
- Occupied households are shared through game/households.ts; resident-tax.ts assesses those households on the trusted server, and immutable daily tax receipts are economic records, never stored growth. Keep legacy earnings before the cutover unchanged to protect already-spent balances.
- Agricultural household capacity treats fields, gardens and pastures equally in households.ts, shared by rendering and trusted resident taxation; seasons/care stay independent of farming art and farmland never counts below farmFloor(radius), so no founding terrain feeds fewer households than flat land.
- Town growth is a pure deterministic function of seed position + created_at (src/game/world.ts); never store growth state — every client computes the same town from the shared seed rows, so towns grow even when nobody watches.
- Rendering uses a devicePixelRatio canvas (capped at 2 on touch devices for mobile GPU load); preload compressed building sprites with per-kind sizes and ground anchors, using the same assets at every zoom level to avoid style changes while loading.
- Seed ownership is enforced in the database (seeds.user_id UNIQUE + RLS on auth.uid()); UI strings live in src/game/i18n.ts (de/en), game logic returns codes not text.
- Trade roads, synergy and twin towns are derived from seed pairs in src/game/world.ts (links/effAge); growth uses effective age, never stored state — keeps all clients identical.
- World, trade and population caches include seed positions and creation timestamps, so replacing equal-sized seed sets cannot reuse stale geometry or progression.
- Construction sites are derived, not stored: a building's site phase is the buildTime() window before its birth age (Structure.build); builders/woodcutters/masons are assigned in people.ts from that — keeps every client identical.

- Dorfsegen: blessings table with a 24h DB trigger cooldown; blessing timestamps are merged into Seed.blessed client-side and effAge adds the bonus purely — keeps growth deterministic across clients.
- Signposts sit on derived road tiles (signTile in world.ts); only the message is stored.
- Bought buildings are placed by specialSites(seed) in world.ts from purchase rows merged into Seed.bought; newcomers (Person.arrive) derive from bornAt() — both pure, so all clients agree.

- Building night lighting uses aligned, light-only sprite layers with the daylight sprite dimensions and anchors; schedules and flicker live in night.ts so windows stay aligned at every zoom without replacing daytime art.
- Encounters: the day's event is derived in src/game/encounters.ts from (seed id, UTC day); only the chosen answer is stored, with prices and one-per-day enforced by a database guard — keeps all clients identical and spending tamper-proof.
- Day/night, villager routines, lights and bell use one world clock (src/game/time.ts, Europe/Berlin); never read the client's local hour, so all players see the same scene.
- Four realms (seeds.realm: us-west/us-east/europe/asia) are separate maps, each with its own shared clock in src/game/time.ts; players land by browser UTC offset, only admins (user_roles) may override — keeps day/night shared within a map.
- Villagers, waymarks, border banners/stones and construction props are painted sprites (src/game/folk-sprites.ts); banner cloth is tinted per town hue at runtime and drawn in world space so night lighting applies — no flat vector figures next to painted art.
- Coastal towns grow in town-space distance (townDist/landShape in world.ts): landward tiles are compressed by a land-share stretch so harbour towns fan inland; bounding boxes must use reachOf(s, r).
- Village chronicle (src/game/chronicle.ts) is derived from seeds between last visit (localStorage) and now; while the owner watches, Game.tsx diffs it periodically for illustrated celebrations — no stored history. Only the scribe greeting uses AI (authenticated server function, fixed fallback).
- Subdirectories have their own AGENTS.md (src/game/AGENTS.md) – read it before changing files there.
- Village stocks (src/game/goods.ts larderOf/storedAt/chainOf) are derived from jobs, season, clock and floods; never store goods — all clients see the same larder.
- Tavern chat (chat_messages/chat_blocks) is the only free-text player table besides signposts; length, rate limit and blocking are enforced by the chat_guard DB trigger, RLS limits letters to sender/recipient. Read marks per channel live in owner-only chat_reads (merged with localStorage by max), because preview frames and other devices lose browser storage.
- Neighbourhood: Saturday markets (stalls, traders, +growth) are derived from roads and the realm clock in wander.ts/world.ts; letters store only metadata publicly (riders/arrival derived from distance) while bodies sit in a sender/recipient-only table written via the send_letter function — every client sees the same riders, only the pair reads the text.
- Brand art: src/assets/logo-keimling.png is the logo; public/favicon.png is a downscaled src/assets/logo-icon.png.
- Gift dismissal receipts live in recipient-only public.gift_reads and are merged before displaying gift overlays, with an account-scoped browser fallback; this prevents read thank-you letters replaying across browsers and map reloads.
- Inactivity: user_activity.last_active_at is touched on every visit (touch_activity RPC); the daily /api/public/idle-sweep warns after 90 days and purges village+account (purge_user_data) 7 days later — admins exempt.
- Kummerkasten: bug_reports rows + private bug-shots bucket (user-id folder) are written by the player; the daily /api/public/bug-digest sends one digest with 7-day signed image links and marks rows sent — no other read path, so reports stay private.
