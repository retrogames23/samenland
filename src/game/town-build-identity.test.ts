import { describe, it, expect } from "vitest";
import { soloSeeds, specialDone, ageMemoStats, SPECIAL_KIND, type Seed } from "./world";
import { SCENARIOS, H } from "./__ref/monument-fixtures";
import { townSnapshot } from "./__ref/town-fixture";

/**
 * The building and monument chains in world.ts evaluate a town alone. They used to pass a fresh one-element array `[s]`
 * on every call; every identity-keyed memo behind them (seedsKey, effAge, effAgeBase, links) then missed, and a full
 * town build (townOf → buildTown) grew from 0.5 s at day 100 to minutes at day 650. They now pass soloSeeds(s), the
 * stable one-element list of the same seed. These tests pin that the results are unchanged and the memos hit again.
 */
describe("soloSeeds in the building and monument chains", () => {
  it("soloSeeds is one stable [s] per seed object, and a changed seed (new object) gets its own list", () => {
    const s = SCENARIOS[0]!.seeds()[0]!;
    const a = soloSeeds(s);
    expect(a).toEqual([s]);
    expect(a[0]).toBe(s);
    expect(soloSeeds(s)).toBe(a);
    const changed: Seed = { ...s, bought: [...(s.bought ?? [])] };
    expect(soloSeeds(changed)).not.toBe(a);
    expect(soloSeeds(changed)[0]).toBe(changed);
  });

  it("specialDone on soloSeeds(s) equals specialDone on a fresh [s] at every purchase time of every scenario", () => {
    let n = 0;
    for (const sc of SCENARIOS) {
      const s = sc.seeds()[0]!;
      for (const b of s.bought ?? []) {
        if (!SPECIAL_KIND[b.item]) continue;
        for (const t of [b.at, b.at + H, b.at + 30 * H]) {
          expect(specialDone(s, soloSeeds(s), t)).toBe(specialDone(s, [s], t));
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(50);
  });
});

/**
 * Golden values of a grown 730-day town (src/game/__ref/town-fixture.json), recorded with vitest (Node, V8) on main 4c7efb2
 * BEFORE the change (fresh [s]): tax receipt, every resident (home, job, workplace, estate, sick), larder flows, surplus
 * and effAge. V8 is the engine of the production server (nitro → Cloudflare workerd); other engines (Bun/JSC, Safari)
 * round some floating-point results differently, so these values are engine-specific by design.
 */
const GOLDEN = [
  {
    day: 100,
    people: 729,
    tax: [1064, 727, 266],
    effAge: 1673.8626810070036,
    surplus: true,
    fpPeople: "d0e7fb6e37ae2f82",
    fpLarder: "8c49e366b4d536fa",
  },
  {
    day: 200,
    people: 1261,
    tax: [1940, 1259, 411],
    effAge: 3442.5409899945726,
    surplus: true,
    fpPeople: "6069f8496af06d3d",
    fpLarder: "4546740eb6e6d902",
  },
  {
    day: 300,
    people: 1899,
    tax: [3243, 1898, 529],
    effAge: 5169.319157100971,
    surplus: true,
    fpPeople: "aeb4bbee0da26ca6",
    fpLarder: "ad5fa36cc21c9cd2",
  },
];

describe("full town build of a grown town", () => {
  for (const g of GOLDEN) {
    it(`day ${g.day}: residents, larder, tax and effAge are exactly the values from before the change`, () => {
      expect(townSnapshot(g.day).values).toEqual(g);
    }, 60_000);
  }

  // a day not built above: townOf memoizes whole towns by content, a second build of the same day would be a cache hit
  it("a cold town build stays inside the effAge memo (day 250: 15,883 effAge misses with fresh [s], 2,944 now)", () => {
    const m0 = ageMemoStats.misses;
    townSnapshot(250);
    expect(ageMemoStats.misses - m0).toBeLessThan(6_000);
  }, 60_000);
});
