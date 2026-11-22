import { describe, it, expect } from "vitest";
import { townOf, townPoses } from "./people";
import type { Seed } from "./world";

// Players saw ~30 villagers "whispering" on one spot on a Sunday afternoon: a young hamlet has only the campfire as a
// gathering spot, and every adult's free time went there. The overflow now stays at its own doorstep.
const born = Date.parse("2026-10-01T10:00:00Z");
const sunday1500 = (days: number) => {
  let t = born + days * 864e5;
  while (new Date(t).getUTCDay() !== 0) t += 864e5;
  return Math.floor(t / 864e5) * 864e5 + 14 * 3.6e6;
};
const mk = (id: string): Seed =>
  ({
    id,
    name: id,
    owner: id,
    x: 400,
    y: 512,
    hue: 0,
    realm: "europe",
    user_id: `u-${id}`,
    created_at: new Date(born).toISOString(),
  }) as Seed;

describe("Sunday afternoon: no crowd on one tile", () => {
  for (const days of [4, 14, 25, 40]) {
    it(`village ~${days} days old`, () => {
      const s = mk(`crowd${days}`),
        now = sunday1500(days);
      const t = townOf(s, [s], now),
        out = townPoses(s, [s], now).filter((q) => q.act === "leisure" && !q.walking);
      expect(out.length).toBeGreaterThan(15); // people still enjoy the afternoon outdoors
      const per = new Map<string, number>();
      for (const q of out) {
        const k = `${Math.round(q.x)},${Math.round(q.y)}`;
        per.set(k, (per.get(k) ?? 0) + 1);
      }
      expect(Math.max(...per.values())).toBeLessThanOrEqual(10);
      expect(new Set(t.meets.map((m) => m.join(","))).size).toBe(t.meets.length); // no doubled gathering spots
    });
  }
});
