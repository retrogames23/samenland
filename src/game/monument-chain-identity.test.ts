import { describe, it, expect, afterEach } from "vitest";
import { monumentChain, monumentDone, stepsPaid, stepsDone, guildtowerDone, specialDone, effAge, careFoodExtra, lighthouseDone, schuettingDone, operaDone, monumentProgress, withChainMemo, chainMemoCfg, seedGuard, MONUMENT_KEYS, MONUMENT_DEFS } from "./world";
import { residentTax } from "./resident-tax";
import { prosperityAt } from "./prosperity";
import { setRealm, type Realm } from "./time";
import { SCENARIOS, C0, DAY, H, steps, times, probe, both, town } from "./__ref/monument-fixtures";

/**
 * Identity of the monument-chain memo (world.ts withChainMemo) with the plain computation (chainMemoCfg.on = false):
 * every function is evaluated once inside one memo scope (repeated and non-chronological queries share it) and once
 * on the reference path; all timestamps and tax figures must be exactly equal. The heaviest town (all general
 * monuments at once) runs in Testebene 3: src/game/simulation/monument-chain-identity.test.ts.
 */
afterEach(() => { chainMemoCfg.on = true; seedGuard.on = true; setRealm("europe"); });

describe("monument chain memo is identical to the plain computation", () => {
  it("the scenarios cover all ten monuments with every step", () => {
    for (const k of MONUMENT_KEYS) expect(Math.max(...SCENARIOS.map((sc) => stepsPaid(sc.seeds()[0]!, k)))).toBe(MONUMENT_DEFS[k].n);
  });

  for (const sc of SCENARIOS) {
    it(`${sc.name}: chains, steps, guild tower, specialDone, progress at every query time in one scope`, () => {
      const seeds = sc.seeds(), ts = times(seeds[0]!);
      const r = both(() => ts.map((t) => probe(seeds, t)));
      expect(r.memo).toEqual(r.ref);
      expect(r.hits).toBeGreaterThan(0);
      // full chains (until = Infinity) and monumentDone
      const f = both(() => MONUMENT_KEYS.map((k) => [monumentChain(seeds[0]!, k), monumentDone(seeds[0]!, seeds, k)]));
      expect(f.memo).toEqual(f.ref);
    });

    it(`${sc.name}: residentTax and prosperityAt at historical times before, during and after completion`, () => {
      const seeds = sc.seeds(), s = seeds[0]!;
      const last = Math.max(...(s.bought ?? []).map((b) => b.at));
      for (const t of [C0 + 100 * DAY, last + 2 * H, last + 3 * DAY, C0 + 430 * DAY]) {
        const r = both(() => residentTax(s, [...seeds], t));
        expect(r.memo).toEqual(r.ref);
        const p = both(() => [0, 500, r.ref.population, 4000].map((c) => prosperityAt(s, t, c)));
        expect(p.memo).toEqual(p.ref);
      }
    });
  }

  for (const realm of ["us-west", "us-east", "asia", "lab"] as Realm[]) {
    it(`realm ${realm}: craft town with Zunftturm and all modifiers, chains and residentTax`, () => {
      setRealm(realm);
      const seeds = SCENARIOS[0]!.seeds(), s = seeds[0]!;
      const ts = times(s, 30);
      const r = both(() => ts.map((t) => probe(seeds, t)));
      expect(r.memo).toEqual(r.ref);
      const t = both(() => residentTax(s, [...seeds], C0 + 400 * DAY));
      expect(t.memo).toEqual(t.ref);
    });
  }

  // mutates a cached seed in place on purpose (the memo must still follow), so the dev freeze (world.ts seedGuard) is off here
  it("changed seed data after a cached evaluation: purchases, charter, woodcamp, Herberge, Bauhütte, Freimarkt", () => {
    seedGuard.on = false;
    const seeds = SCENARIOS[1]!.seeds(), s = seeds[0]!, t = C0 + 320 * DAY;
    const check = () => { const r = both(() => ({ tax: residentTax(s, [...seeds], t), p: probe(seeds, t) })); expect(r.memo).toEqual(r.ref); return r.ref; };
    const before = check();
    s.bought!.push({ item: "guildtower1", at: C0 + 240 * DAY }); check();
    s.bought!.push({ item: "woodcamp", at: C0 + 200 * DAY }); check();
    s.bought!.push({ item: "herberge", at: C0 + 210 * DAY }); check();
    s.bought!.push({ item: "bauhuette2", at: C0 + 251 * DAY }, { item: "freimarkt3", at: C0 + 252 * DAY }); check();
    s.charter = { path: "craft", at: C0 + DAY }; check();
    s.bought!.push({ item: "rank2", at: C0 + 100 * DAY }); check();
    s.bought = s.bought!.filter((b) => !b.item.startsWith("lighthouse")); // replaced array without the lighthouse
    const after = check();
    expect(after.p.light).toBe(0);
    expect(after.p.m.find((m) => m.k === "lighthouse")!.chain).toEqual([]);
    expect(before.p.light).toBeGreaterThan(0);
  });

  it("no collisions: two seed objects with the same id and different purchases share one scope", () => {
    const [a] = SCENARIOS[2]!.seeds(), b = { ...a!, bought: [...a!.bought!, ...steps("guildtower", 3, 300, 0).map(([item, d]) => ({ item, at: C0 + d * DAY }))] };
    const c = { ...a!, id: "other", bought: a!.bought!.slice(0, 12) };
    const t = C0 + 365 * DAY;
    const r = both(() => [a!, b, c, a!, b].map((s) => ({ gt: guildtowerDone(s, t), dom: monumentChain(s, "cathedral", t), sd: specialDone(s, [s], t) })));
    expect(r.memo).toEqual(r.ref);
    expect(r.memo[0]!.dom).not.toEqual(r.memo[1]!.dom); // guild tower in b speeds the Dom
  });

  it("a realm switch inside a scope drops the memo", () => {
    const seeds = SCENARIOS[0]!.seeds(), s = seeds[0]!, t = C0 + 300 * DAY;
    const r = both(() => (["europe", "us-west", "asia", "europe"] as Realm[]).map((realm) => { setRealm(realm); return [monumentChain(s, "cathedral", t), guildtowerDone(s, t), monumentChain(s, "opera")]; }));
    expect(r.memo).toEqual(r.ref);
  });

  it("residentTax never mutates its inputs (the memo relies on it) and nested scopes stay exact", () => {
    const seeds = SCENARIOS[0]!.seeds();
    const freeze = <T>(o: T): T => { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) freeze(v); } return o; };
    seeds.forEach(freeze);
    const t = C0 + 380 * DAY;
    const r = both(() => [residentTax(seeds[0]!, [...seeds], t), withChainMemo(() => residentTax(seeds[0]!, [...seeds], t + DAY)), effAge(seeds[0]!, [...seeds], t)]);
    expect(r.memo).toEqual(r.ref);
  });
  /* Guard-state cases: chains run against the town alone, so a guard can only change a chain through the sawmill check
   * (effAge >= SAWMILL_AGE 2400). Without food crafts the care gate keeps effAge below Kleinstadt (2160) until the
   * monument's own careFoodExtra (harvest step 1, lighthouse step 1) lifts it to stage 3. A memo key without the
   * guard state (harvestBusy / lightBusy) returns wrong values here (checked by mutation: 4 of 40 and 54 of 60 cases).
   * exBusy, operaBusy, domBusy and uniBusy cannot change a chain of the town alone (trade is 0, health only moves the
   * gate above stage 3, whose ceiling lies above the sawmill age); they stay in the key in case those limits change. */
  it("harvestBusy matters: Erntedankhalle in a town without food crafts, care query before the chain", () => {
    const s = town("gh1", [500, 340], "farm", [["herbs", 1], ...steps("harvest", 3, 300, 0)])[0]!;
    const ts = Array.from({ length: 40 }, (_, i) => C0 + 300 * DAY + i * 2 * H);
    const r = both(() => ts.map((t) => [careFoodExtra(s, t), stepsDone(s, "harvest", t), monumentProgress(s, t, "harvest")]));
    expect(r.memo).toEqual(r.ref);
    expect(new Set(r.ref.map((x) => x[1])).size).toBeGreaterThan(1); // steps finish inside the window
  });

  it("lightBusy matters: Leuchtturm with Schütting or Artushof in a town without food crafts", () => {
    for (const k of ["exchange", "opera"] as const) for (const le of [0, 1, 2]) {
      const s = town(`gl-${k}-${le}`, [200, 200], "trade", [["herbs", 1], ["lighthouse1", 300], ["lighthouse2", 300 + le], ["lighthouse3", 300 + le + 0.05],
        [`${k}1`, 300 + le + 0.15], [`${k}2`, 300 + le + 0.3], [`${k}3`, 300 + le + 0.32], [`${k}4`, 300 + le + 0.34]])[0]!;
      const ts = Array.from({ length: 30 }, (_, i) => C0 + 300 * DAY + i * 3 * H);
      const r = both(() => ts.map((t) => [lighthouseDone(s, t), stepsDone(s, k, t), k === "exchange" ? schuettingDone(s, t) : operaDone(s, t), monumentProgress(s, t, k)]));
      expect(r.memo).toEqual(r.ref);
    }
  });
});
