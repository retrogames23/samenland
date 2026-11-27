import { describe, it, expect, beforeAll } from "vitest";
import {
  effAge,
  structureAt,
  radiusOf,
  roadOpeningAt,
  roadOpening,
  roadSettle,
  ROAD_SETTLE_SINCE,
  HOUSE_BUILD,
  type Seed,
} from "./world";
import { setRealm } from "./time";

// Ehrenberg and Gebbingen (27.11.2026): crossing 240 growth hours opened the first ring road, and every lot along it
// whose nominal birth lay in the past stood finished at once (+24 / +29 houses, +65 / +62 residents).
// From ROAD_SETTLE_SINCE such lots are built after the opening, one ordinary site each, spread over roadSettle(T).
const HOME = new Set([
  "hut",
  "farmhouse",
  "cottage",
  "handwerker",
  "townhouse",
  "townhouse2",
  "fachwerk",
  "steinhaus",
  "patrician",
  "villa",
  "tenement",
  "suburb",
  "barn",
  "workshop",
  "stall",
  "coop",
]);
const mk = (x: number, y: number, created: number): Seed[] => [
  {
    id: `v${x}`,
    name: "a",
    owner: "a",
    x,
    y,
    hue: 0,
    created_at: new Date(created).toISOString(),
    user_id: "u",
  },
];
/** The instant at which the village has `eff` growth hours. */
const at = (seeds: Seed[], eff: number) => {
  let lo = Date.parse(seeds[0]!.created_at),
    hi = lo + 5e11;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (effAge(seeds[0]!, seeds, m) < eff) lo = m;
    else hi = m;
  }
  return Math.round(hi);
};
/** Finished buildings and running sites of the village at `eff` growth hours, by tile. */
const town = (seeds: Seed[], eff: number) => {
  const s = seeds[0]!,
    now = at(seeds, eff),
    R = Math.ceil(radiusOf(eff)) + 2;
  const done = new Map<string, string>(),
    sites = new Set<string>();
  for (let y = s.y - R; y <= s.y + R; y++)
    for (let x = s.x - R; x <= s.x + R; x++) {
      const st = structureAt(x, y, seeds, now);
      if (!st || st.seed.id !== s.id || !HOME.has(st.kind)) continue;
      if (st.build !== undefined && st.build < 1) sites.add(`${x},${y}`);
      else done.set(`${x},${y}`, st.kind);
    }
  return { done, sites };
};
const SPOTS = [
  [300, 420],
  [420, 300],
  [500, 500],
  [640, 410],
] as const;
const NEW = ROAD_SETTLE_SINCE + 864e5; // founded after the cutover: every opening follows the new rule
const OLD = Date.UTC(2020, 0, 1); // had passed every opening by the cutover: old rule

describe("road openings settle their lots one by one", () => {
  beforeAll(() => setRealm("europe"));

  it("settling windows never overlap and start exactly at the opening", () => {
    const T = [48, 168, 240, 720, 2160, 4380, 8760, 15000];
    for (const [i, t] of T.entries()) {
      expect(roadOpeningAt(t - 0.01)).not.toBe(t);
      expect(roadOpeningAt(t)).toBe(t);
      expect(roadOpeningAt(t + roadSettle(t) + HOUSE_BUILD - 0.01)).toBe(t);
      expect(roadOpeningAt(t + roadSettle(t) + HOUSE_BUILD)).toBeNull();
      if (T[i + 1]) expect(t + roadSettle(t) + HOUSE_BUILD).toBeLessThan(T[i + 1]!);
    }
    expect(roadOpeningAt(10)).toBeNull();
  });

  it("a village that had passed the opening by the cutover keeps the old rule", () => {
    const old = mk(420, 300, OLD);
    expect(roadOpening(old[0]!, old, 240.05)).toBeNull();
    expect(roadOpening(old[0]!, old, 720.05)).toBeNull();
    const young = mk(420, 300, NEW);
    expect(roadOpening(young[0]!, young, 240.05)).toBe(240);
    // mid-window at the cutover: founded so that 240 h fell one day before it — its houses stand, nothing turns back
    const mid = mk(420, 300, 0);
    mid[0]!.created_at = new Date(
      ROAD_SETTLE_SINCE - (at(mk(420, 300, OLD), 240) - OLD) - 864e5,
    ).toISOString();
    const ageAtCut = effAge(mid[0]!, mid, ROAD_SETTLE_SINCE);
    expect(ageAtCut).toBeGreaterThan(240);
    expect(ageAtCut).toBeLessThan(240 + roadSettle(240));
    const a = town(mid, ageAtCut - 0.01),
      b = town(mid, ageAtCut + 0.01),
      ref = town(mk(420, 300, OLD), ageAtCut + 0.01);
    for (const k of a.done.keys()) expect(b.done.has(k), k).toBe(true);
    expect([...b.done]).toEqual([...ref.done]);
  });

  it("the old rule really jumps at 240 h (the reported bug)", () => {
    const jumps = SPOTS.map(
      ([x, y]) => town(mk(x, y, OLD), 240.05).done.size - town(mk(x, y, OLD), 239.95).done.size,
    );
    expect(Math.max(...jumps)).toBeGreaterThanOrEqual(20);
  });

  it.each([48, 168, 240, 720])(
    "opening at %i h: no jump, sites one by one, same town afterwards",
    (T) => {
      for (const [x, y] of SPOTS) {
        const fresh = mk(x, y, NEW),
          old = mk(x, y, OLD);
        const before = town(fresh, T - 0.05),
          after = town(fresh, T + 0.05);
        // 239.95 → 240.05: at most the ordinary growth of 0.1 h, never a block of houses
        expect(after.done.size - before.done.size, `${x},${y} jump`).toBeLessThanOrEqual(1);
        // and no house is lost at the opening: a building in the new road's way stands until its turn
        // (168 h also starts a new era, which changes kinds and clears the green under either rule)
        const oldAfter = town(old, T + 0.05).done;
        let lost = 0;
        for (const k of before.done.keys())
          if (!after.done.has(k)) {
            lost++;
            expect(oldAfter.has(k), `${k} lost only where the new era itself removes it`).toBe(
              false,
            );
          }
        if (T === 240 || T === 720) expect(lost, "no era change here: nothing is lost").toBe(0);
        expect(town(old, T - 0.05).done, "identical before the opening").toEqual(before.done);
        // every house standing before the opening that the old rule keeps also stays here, in every later sample
        const end = T + roadSettle(T) + HOUSE_BUILD;
        let prev = after.done.size,
          maxStep = 0,
          sawSite = false;
        const step = roadSettle(T) / 24;
        for (let e = T + step; e < end; e += step) {
          const now = town(fresh, e),
            ref = town(old, e);
          // (a ring tile or a new era may replace a house under either rule: the old rule is the reference for that)
          for (const k of before.done.keys())
            if (ref.done.has(k)) expect(now.done.get(k), `${k} kept`).toBe(ref.done.get(k));
          // never ahead of the old rule: only what it builds too, or what stood there before the opening and waits for its turn
          for (const [k, kind] of now.done)
            expect(ref.done.has(k) || before.done.get(k) === kind, `${k} planned`).toBe(true);
          // no dip, apart from what the old rule itself takes away (rebuilds, the road's own tiles late in the window)
          const gone = [...before.done.keys()].filter((k) => !ref.done.has(k)).length;
          expect(now.done.size, `${x},${y} at ${e.toFixed(1)}: no dip`).toBeGreaterThanOrEqual(
            before.done.size - gone - 1,
          );
          maxStep = Math.max(maxStep, now.done.size - prev);
          prev = now.done.size;
          sawSite ||= now.sites.size > 0;
        }
        const total = town(old, T + 0.05).done.size - before.done.size; // what used to appear at once
        if (total >= 8) {
          expect(maxStep, `${x},${y} largest step of ${total}`).toBeLessThanOrEqual(
            Math.max(4, Math.ceil(total / 4)), // per 1/24 of the window
          );
          expect(sawSite, "houses pass through a building site").toBe(true);
        }
        // after the window the town is exactly the one the old rule builds: only the timing changed
        expect(town(fresh, end + 0.01).done).toEqual(town(old, end + 0.01).done);
      }
    },
  );

  it("later openings are covered by the same window rule (bare test villages stop growing before 2160 h)", () => {
    const old = mk(420, 300, OLD);
    expect(effAge(old[0]!, old, ROAD_SETTLE_SINCE)).toBeLessThan(2160); // care ceiling: no behavioural sample possible here
    for (const T of [2160, 4380, 8760, 15000]) expect(roadOpeningAt(T + 1)).toBe(T);
  });
});
