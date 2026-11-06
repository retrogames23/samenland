# Contributing to Samenland

Thank you for helping a small town grow!

## Ground rules

1. **Derived, not stored.** Town growth, villagers, goods, weather and events must stay pure functions of seed data and the shared clock (`clock()` in `src/game/time.ts`, never `Date.now()`), so every client sees the same world.
2. **Money logic is mirrored in the database.** Any change to taxes, prices or rewards must be made in the TypeScript code *and* the matching database function together.
3. **Historical plausibility.** The setting is Northern Germany around 1500 — no steam, rails or Baroque terms.
4. **Everything visible.** Events need a visual counterpart on the map; every person and animal is truly animated.
5. **Translations.** All UI strings go through the translation catalog — no hardcoded text in components.
6. Read the relevant `AGENTS.md` before changing a directory.

## Workflow

```sh
npm install
npm run dev
npm test
npm run lint
```

- Keep pull requests focused; describe what changes for players.
- Add or update a test when you change a game rule (prices, limits, timing).

## License

By contributing, you agree that your contributions (code and assets) are licensed under the [MIT License](LICENSE).
