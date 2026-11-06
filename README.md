# Samenland

**A slow, cozy, shared settlement game set in Northern Germany around 1500.**

Plant a single seed somewhere on a large shared map — and watch a hamlet grow, in real time, into a village, a market town and eventually a Hanseatic city. Your town keeps growing whether you are watching or not. Every now and then you step in: you decide on trade roads, answer visitors, commission buildings and walk through the streets as the village mayor (*Schulze*).

Live: **https://samenland.app**

## Features

- **Real-time, deterministic growth** – towns are a pure function of their seed position and founding time, so every player sees exactly the same town, even offline.
- **Shared multiplayer maps** – four regional realms, each with its own clock; neighbouring towns connect by trade roads and slowly grow together.
- **Living villagers** – every resident has a home, a craft, a daily routine, Sundays, weddings, illness and feasts, all derived from the shared clock.
- **Historical setting** – Northern Germany c. 1500: church feasts, three-field rotation, guilds, the prince's court, fires, floods and raids.
- **Day, night, seasons and weather** – real sunrise/sunset times per realm, seasonal art and atmospheric weather.
- **Isometric painted look** – 2:1 isometric canvas renderer with sprites, night window layers and depth-sorted occlusion.
- **Eight languages** – German, English, French, Spanish, Arabic (RTL), Hindi, Simplified Chinese and Japanese.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, SSR, server functions) on Vite 8
- TypeScript, Tailwind CSS v4
- HTML5 Canvas renderer (no game engine)
- Supabase-compatible backend (Postgres, auth, realtime) via Lovable Cloud
- Vitest for tests

## Getting started

Requirements: Node.js 20+ (or [Bun](https://bun.sh)).

```sh
git clone <this-repository-url>
cd samenland
npm install        # or: bun install
npm run dev        # starts the dev server on http://localhost:8080
npm test           # runs the test suite
```

The app expects backend credentials in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`). Database migrations live in `supabase/migrations/`.

## Project structure

```text
src/
  game/         simulation, economy, villagers, seasons, weather and the canvas renderer
    lang/       game texts and translation catalogs
  components/   React UI (HUD, windows, overlays)
  routes/       TanStack routes and server endpoints
  assets/       sprites, music and sound
supabase/       database migrations and configuration
```

Design rules for each area are documented in the `AGENTS.md` files throughout the repository — please read them before changing game logic. The key principle: **game state is derived, not stored.** Growth, villagers, goods and events are computed from seeds and the shared clock; the database stores only player decisions.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Samenland — the source code **and all assets** (sprites, illustrations, music, sounds, texts) — is released under the [MIT License](LICENSE).

Built with [Lovable](https://lovable.dev/invite/LN0I260).
