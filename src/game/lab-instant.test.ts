import { describe, it, expect, afterEach } from "vitest";
import { setRealm } from "./time";
import { triggerLab, clearLabEvent, resetLab } from "./lab-ctl";
import { fires } from "./disasters";
import { structureAt, MAP, type Seed } from "./world";
import { townOf } from "./people";

// Control desk on the test map: a fire set off (or ended) must show on the very next frame,
// not up to a minute later when the minute caches of structureAt / townOf roll over.
const DAY = 864e5,
  born = Date.parse("2026-01-01T00:00:00Z");
const mk = (id: string, x: number): Seed =>
  ({
    id,
    name: id,
    owner: id,
    x,
    y: 512,
    hue: 0,
    realm: "lab",
    user_id: `u-${id}`,
    created_at: new Date(born).toISOString(),
  }) as Seed;
afterEach(() => {
  resetLab();
  setRealm("europe");
});

for (const [label, seeds] of [
  ["one village", [mk("lab1", 400)]],
  ["several villages", [mk("lab1", 400), mk("lab2", 470)]],
] as const) {
  describe(`test fire shows at once (${label})`, () => {
    it("burns right after triggerLab and is gone right after clearLabEvent, within the same minute", () => {
      setRealm("lab");
      const s = seeds[0]!,
        now = born + 40 * DAY + 12 * 3.6e6 + 5000; // 5 s into the minute
      const tile = (k: number) => [k % MAP, Math.floor(k / MAP)] as const;
      // warm the caches without a fire
      for (let j = -6; j <= 6; j++)
        for (let i = -6; i <= 6; i++) structureAt(s.x + i, s.y + j, [...seeds], now);
      townOf(s, [...seeds], now);
      triggerLab("fire", now);
      const f = fires(s, now + 1000).find((x) => x.at === now)!;
      expect(f).toBeDefined();
      const burning = f.tiles
        .map(tile)
        .filter(([x, y]) => structureAt(x, y, [...seeds], now + 1000)?.fire);
      expect(burning.length).toBeGreaterThan(0);
      // the bucket chain forms at once (townOf was memoized for this minute before the trigger)
      expect(
        townOf(s, [...seeds], now + 1000).people.some((q) => q.fete?.fire && q.fete.at === now),
      ).toBe(true);
      clearLabEvent("fire");
      expect(
        f.tiles.map(tile).some(([x, y]) => structureAt(x, y, [...seeds], now + 2000)?.fire),
      ).toBe(false);
    });
  });
}
