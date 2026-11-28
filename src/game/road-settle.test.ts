import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  effAge,
  structureAt,
  radiusOf,
  bornAt,
  roadOpeningAt,
  roadOpening,
  settledFrom,
  roadSettle,
  roadSettleCfg,
  ROAD_SETTLE_SINCE,
  ROAD_SETTLE_OFF,
  coastAreaCfg,
  COAST_AREA_SINCE,
  HOUSE_BUILD,
  type Seed,
} from "./world";
import { townOf } from "./people";
import { homesBetween, HOME_KINDS } from "./chronicle";
import { setRealm } from "./time";

// Ehrenberg and Gebbingen (27.11.2026): crossing 240 growth hours opened the first ring road, and every lot along it
// whose nominal birth lay in the past stood finished at once (+24 / +29 houses, +65 / +62 residents).
// From CUT such lots are built after the opening, one ordinary site each, spread over roadSettle(T).
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
      if (!st || st.seed.id !== s.id || !HOME.has(st.homeKind ?? st.kind)) continue;
      if (st.build !== undefined && st.build < 1) sites.add(`${x},${y}`);
      else done.set(`${x},${y}`, st.homeKind ?? st.kind); // homeKind: the house itself, without the prosperity paint
    }
  return { done, sites };
};
const SPOTS = [
  [300, 420],
  [420, 300],
  [500, 500],
  [640, 410],
] as const;
/** Coastal shape for every village of this run: legacy stretch (default) or equal-area (COAST_SHAPE=area). */
const COAST_SHAPE = process.env["COAST_SHAPE"] === "area" ? 0 : Infinity;
const CUT = Date.UTC(2026, 10, 30); // isolated test cutover; production has its own fixed release date
const NEW = CUT + 864e5; // founded after the cutover: every opening follows the new rule
const OLD = Date.UTC(2020, 0, 1); // had passed every opening by the cutover: old rule

describe("road openings settle their lots one by one", () => {
  beforeAll(() => {
    setRealm("europe");
    roadSettleCfg.since = CUT;
    // this suite compares villages founded before and after its own cut-over at the same (partly coastal) sites: both
    // get one coastal shape, so only the settling rule differs. It runs under BOTH shapes — here with the legacy
    // stretch, in road-settle-area.test.ts with the equal-area stretch of new foundations (coast-balance.test.ts).
    coastAreaCfg.since = COAST_SHAPE;
  });
  afterAll(() => {
    roadSettleCfg.since = ROAD_SETTLE_SINCE;
    coastAreaCfg.since = COAST_AREA_SINCE;
  });

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
    mid[0]!.created_at = new Date(CUT - (at(mk(420, 300, OLD), 240) - OLD) - 864e5).toISOString();
    const ageAtCut = effAge(mid[0]!, mid, CUT);
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
          // a site stands for HOUSE_BUILD hours only; the 24 samples above are hours apart and catch one by luck.
          // Sampling at half a build time cannot miss a site that exists.
          for (let e = T; e < end && !sawSite; e += HOUSE_BUILD / 2) sawSite = town(fresh, e).sites.size > 0;
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
    expect(effAge(old[0]!, old, CUT)).toBeLessThan(2160); // care ceiling: no behavioural sample possible here
    for (const T of [2160, 4380, 8760, 15000]) expect(roadOpeningAt(T + 1)).toBe(T);
  });

  it("ships the fixed UTC cutover on 2026-11-28 at 12:00", () => {
    expect(ROAD_SETTLE_SINCE).toBe(Date.UTC(2026, 10, 28, 12, 0, 0));
    expect(ROAD_SETTLE_SINCE).toBeLessThan(ROAD_SETTLE_OFF);
  });

  it("production cutover keeps openings before it old and settles openings after it", () => {
    roadSettleCfg.since = ROAD_SETTLE_SINCE;
    try {
      for (const [x, y] of SPOTS) {
        const span = at(mk(x, y, OLD), 240) - OLD;
        const before = mk(x, y, ROAD_SETTLE_SINCE - span - 60_000);
        const after = mk(x, y, ROAD_SETTLE_SINCE - span + 60_000);
        const beforeSeed = before[0], afterSeed = after[0];
        if (!beforeSeed || !afterSeed) throw new Error("Missing cutover test seed");
        expect(at(before, 240)).toBeLessThan(ROAD_SETTLE_SINCE);
        expect(at(after, 240)).toBeGreaterThan(ROAD_SETTLE_SINCE);
        expect(roadOpening(beforeSeed, before, 240.05)).toBeNull();
        expect(roadOpening(afterSeed, after, 240.05)).toBe(240);
      }
    } finally {
      roadSettleCfg.since = CUT;
    }
  });

  it("with the explicit off switch every village follows the old rule", () => {
    roadSettleCfg.since = ROAD_SETTLE_OFF;
    try {
      const fresh = mk(420, 300, NEW);
      expect(roadOpening(fresh[0]!, fresh, 240.05)).toBeNull();
      expect(town(fresh, 240.05).done.size - town(fresh, 239.95).done.size).toBeGreaterThanOrEqual(
        15,
      );
      expect(bornAt(423, 304, fresh[0]!, fresh)).toBe(bornAt(423, 304, fresh[0]!));
    } finally {
      roadSettleCfg.since = CUT;
    }
  });

  it("bornAt reports the hour the house really stands; the old rule keeps the nominal hour", () => {
    for (const [x, y] of SPOTS) {
      const fresh = mk(x, y, NEW),
        old = mk(x, y, OLD),
        s = fresh[0]!,
        T = 240,
        end = T + roadSettle(T) + HOUSE_BUILD;
      const step = roadSettle(T) / 48;
      const prev = town(fresh, T - 0.05);
      const seen = new Set(prev.done.keys());
      let late = 0;
      // (a coop or barn may stand on a lot without a road and give way to the house built after the opening)
      for (const [k, kind] of prev.done) {
        if (!HOME_KINDS.has(kind as never)) continue;
        const [tx, ty] = k.split(",").map(Number);
        // not moved behind this opening: an earlier opening's hour, or the nominal hour as before
        const b = bornAt(tx!, ty!, s, fresh);
        expect(b <= T || b === bornAt(tx!, ty!, s), `${k} stood before`).toBe(true);
      }
      for (let e = T + step; e <= end + step; e += step) {
        const now = town(fresh, e);
        for (const [k, kind] of now.done) {
          // first time standing (a house rebuilt after a fire stood before)
          if (seen.has(k) || !HOME_KINDS.has(kind as never)) continue;
          seen.add(k);
          const [tx, ty] = k.split(",").map(Number),
            b = bornAt(tx!, ty!, s, fresh);
          // houses settled by this opening (their hour differs from the nominal one)
          if (b > T && b !== bornAt(tx!, ty!, s)) {
            late++;
            expect(b, `${k} finished in this step`).toBeGreaterThan(e - step - 1e-6);
            expect(b).toBeLessThanOrEqual(e + 1e-6);
          }
        }
      }
      expect(late, `${x},${y}`).toBeGreaterThanOrEqual(8);
      const R = Math.ceil(radiusOf(end)) + 2;
      for (let ty = y - R; ty <= y + R; ty++)
        for (let tx = x - R; tx <= x + R; tx++) {
          // the old village keeps every hour up to its age at the cutover; only openings still ahead of it settle
          const b = bornAt(tx, ty, old[0]!, old);
          expect(
            b === bornAt(tx, ty, old[0]!) || b > settledFrom(old[0]!, old),
            `${tx},${ty}`,
          ).toBe(true);
        }
    }
  });

  it("new families sort after everyone already there (first-name order), and the chronicle lists the new houses", () => {
    const fresh = mk(500, 500, NEW),
      s = fresh[0]!,
      T = 240,
      end = T + roadSettle(T) + HOUSE_BUILD;
    // first names go out in bornAt order: a family moving into a house built after the opening must sort after the
    // residents already there, or it would take their names. With the nominal hour it sorted far ahead of them.
    let ids = new Set(townOf(s, fresh, at(fresh, T - 0.05)).people.map((p) => p.id));
    let arrived = 0,
      nominalEarly = 0;
    for (let e = T + 2; e <= end + 2; e += 2) {
      const people = townOf(s, fresh, at(fresh, e)).people;
      for (const p of people) {
        if (ids.has(p.id)) continue;
        arrived++;
        expect(bornAt(p.home[0], p.home[1], s, fresh), `${p.first} at ${e}`).toBeGreaterThan(T);
        if (bornAt(p.home[0], p.home[1], s) < T) nominalEarly++;
      }
      ids = new Set(people.map((p) => p.id));
    }
    expect(arrived).toBeGreaterThan(0);
    expect(nominalEarly).toBeGreaterThan(0);
    const built = homesBetween(s, fresh, at(fresh, T), at(fresh, end + 0.01));
    const grown = town(fresh, end + 0.01).done.size - town(fresh, T - 0.05).done.size;
    expect(built.length).toBeGreaterThanOrEqual(15);
    expect(built.length).toBeGreaterThanOrEqual(Math.floor(grown * 0.5));
    // spread over the window, not one instant
    expect(built[built.length - 1]!.at - built[0]!.at).toBeGreaterThan(
      (at(fresh, end) - at(fresh, T)) / 2,
    );
  });
});
