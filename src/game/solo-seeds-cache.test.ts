import { describe, it, expect, afterEach } from "vitest";
import {
  monumentChain,
  guildtowerDone,
  seaWays,
  specialDone,
  soloSeeds,
  ageMemoStats,
  MONUMENT_KEYS,
  type Seed,
} from "./world";
import { setRealm } from "./time";
import { SCENARIOS, HEAVY, C0, DAY, times } from "./__ref/monument-fixtures";

/**
 * monumentChain, chainRaw, seaWays, guildtowerDone and guildtowerRaw evaluate the town alone. They used a fresh [s]
 * per call, so the identity-keyed effAge memo (via doneWith → sawmillUp) missed on every call; they now use the
 * stable soloSeeds(s). Results must stay exactly those of a fresh, never-cached copy of the same town.
 */
afterEach(() => setRealm("europe"));
const fresh = (sc: { seeds: () => Seed[] }) => sc.seeds()[0]!; // new objects: nothing cached for them yet
const eval1 = (s: Seed, t: number) => ({
  gt: guildtowerDone(s, t),
  sea: seaWays(s, t),
  sd: specialDone(s, soloSeeds(s), t),
  m: MONUMENT_KEYS.map((k) => monumentChain(s, k, t).map((c) => [c.at, c.start, c.done])),
});

describe("town-alone evaluations reuse the stable soloSeeds array", () => {
  it("soloSeeds is one array per seed object, distinct between towns", () => {
    const a = fresh(HEAVY),
      b = fresh(SCENARIOS[0]!);
    expect(soloSeeds(a)).toBe(soloSeeds(a));
    expect(soloSeeds(a)).toEqual([a]);
    expect(soloSeeds(a)).not.toBe(soloSeeds(b));
  });

  it("effAge is reused across the chain evaluations (with [s] it recomputed on every call)", () => {
    const s = fresh(HEAVY),
      ts = times(s, 40);
    for (const t of ts) eval1(s, t);
    const m0 = ageMemoStats.misses;
    for (const t of ts) eval1(s, t);
    // measured on this town: about 3000 effAge computations per query with [s], about 50 with soloSeeds
    expect((ageMemoStats.misses - m0) / ts.length).toBeLessThan(300);
  });

  for (const sc of [...SCENARIOS, HEAVY]) {
    it(`${sc.name.slice(0, 50)}: same results as a never-cached copy, past and future times, any order`, () => {
      const s = fresh(sc),
        ts = times(s, 60);
      const warm = ts.map((t) => eval1(s, t)),
        again = [...ts]
          .reverse()
          .map((t) => eval1(s, t))
          .reverse();
      const cold = ts.map((t) => eval1(fresh(sc), t));
      expect(warm).toEqual(cold);
      expect(again).toEqual(cold);
    });
  }

  it("towns evaluated interleaved do not mix", () => {
    const a = fresh(HEAVY),
      b = fresh(SCENARIOS[2]!),
      t = C0 + 300 * DAY;
    const mixed = [eval1(a, t), eval1(b, t), eval1(a, t + DAY), eval1(b, t + DAY)];
    expect(mixed).toEqual([
      eval1(fresh(HEAVY), t),
      eval1(fresh(SCENARIOS[2]!), t),
      eval1(fresh(HEAVY), t + DAY),
      eval1(fresh(SCENARIOS[2]!), t + DAY),
    ]);
  });

  it("a purchase added to the same seed object after a cached evaluation: chains follow it", () => {
    // (residentTax on an in-place mutated seed differs from a fresh copy already on main without this fix: other memos)
    const s = fresh(SCENARIOS[1]!),
      t = C0 + 320 * DAY;
    eval1(s, t);
    s.bought!.push({ item: "guildtower1", at: C0 + 240 * DAY });
    const ref = fresh(SCENARIOS[1]!);
    ref.bought!.push({ item: "guildtower1", at: C0 + 240 * DAY });
    expect(eval1(s, t)).toEqual(eval1(ref, t));
  });

  it("in another realm: warm, repeated and cold evaluations agree", () => {
    setRealm("us-west");
    const s = fresh(HEAVY),
      ts = times(s, 20);
    const warm = ts.map((t) => eval1(s, t)),
      again = ts.map((t) => eval1(s, t));
    expect(again).toEqual(warm);
    expect(warm).toEqual(ts.map((t) => eval1(fresh(HEAVY), t)));
  });
});
