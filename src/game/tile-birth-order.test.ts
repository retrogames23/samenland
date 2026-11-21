import { describe, it, expect } from "vitest";
import { tileBirth, birthAt, resetBirthCache, type Seed } from "./world";
import { householdsOf } from "./households";
import { residentTax } from "./resident-tax";
import { setRealm } from "./time";

/**
 * tileBirth must not depend on what the process computed before: each distance gets birthAt of exactly that distance.
 * (Formerly keyed by Math.round(d²): a coastal town's stretched distance and a flat town's tile distance in the same
 * bucket shared whichever value was cached first, so houses, households and tax depended on call order.)
 */
const DAY = 864e5, C0 = Date.parse("2025-10-01T00:00:00Z");
function town(id: string, at: readonly [number, number]): Seed[] {
  const [x, y] = at;
  const s: Seed = { id, name: id, owner: "t", x, y, hue: 0, realm: "europe", user_id: "u-" + id, created_at: new Date(C0).toISOString(),
    charter: { path: "farm", at: C0 + DAY }, bought: [{ item: "hunter", at: C0 + DAY }, { item: "herbs", at: C0 + DAY }, { item: "granary", at: C0 + 3 * DAY }],
    roads: [{ target: `${id}-nb`, at: C0 + 14 * DAY }], civicRoads: [{ at: C0 + 14 * DAY }] };
  const nb: Seed = { id: `${id}-nb`, name: "nb", owner: "nb", x: x + 15, y, hue: 0, realm: "europe", created_at: new Date(C0 - 60 * DAY).toISOString() };
  return [s, nb];
}
// simulation locations: "gateway" is a coastal town (stretched town distances), "grain" and "workshop" lie inland
const LOC = { gateway: [200, 200], grain: [500, 340], workshop: [166, 613] } as const;
type Loc = keyof typeof LOC;
const DAYS = Array.from({ length: 60 }, (_, i) => C0 + (i + 1) * DAY);
/** Every day of the first 60, as the treasury and the simulation ask them: households and residentTax. */
const days = (l: Loc) => { const seeds = town(l, LOC[l]); return DAYS.map((t) => ({
  homes: householdsOf(seeds[0]!, [...seeds], t).map((h) => `${h.home.join(".")}:${h.size}`).join(","),
  tax: residentTax(seeds[0]!, [...seeds], t),
})); };

describe("tileBirth is independent of call order", () => {
  it("distances in the same former bucket get their own birthAt, in both orders", () => {
    const pairs = [[10, Math.sqrt(100.4)], [Math.sqrt(99.6), 10], [7.3, Math.sqrt(Math.round(7.3 * 7.3) + 0.3)], [2.5, Math.sqrt(6.4)]];
    for (const [a, b] of pairs) for (const order of [[a, b], [b, a]]) {
      resetBirthCache();
      for (const d of order) expect(tileBirth(d!)).toBe(birthAt(d!));
      expect(tileBirth(a!)).not.toBe(tileBirth(b!));
    }
  });

  it("another town computed first (coastal or inland): households and residentTax equal the fresh-cache result", () => {
    setRealm("europe");
    // with the former rounded key these orders changed population (e.g. grain -> workshop day 16: 79 vs 82 residents)
    for (const [first, then] of [["grain", "workshop"], ["workshop", "gateway"], ["gateway", "workshop"], ["workshop", "grain"]] as [Loc, Loc][]) {
      resetBirthCache(); const fresh = days(then);
      resetBirthCache(); days(first);
      expect(days(then)).toEqual(fresh);
    }
  });
});
