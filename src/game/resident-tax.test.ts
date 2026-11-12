import { describe, it, expect } from "vitest";
import { householdsOf, foodCapacity, foodCatchment } from "./households";
import { townOf } from "./people";
import { residentTax, assessHomes } from "./resident-tax";
import { economyWorldAt, type EconomyWorld } from "./economy-world";
import { stageOf, effAge, type Seed, type Kind } from "./world";

const start = Date.parse("2026-01-01T00:00:00Z"), day = 86400000;
const seed = (bought: string[] = []): Seed => ({ id: "p", name: "p", owner: "L", hue: 1, x: 306, y: 420, user_id: "u", created_at: new Date(start).toISOString(), bought: bought.map(item => ({ item, at: start })) });

describe("shared occupied households", () => {
  it("taxpayers equal displayed residents, excluding visitors and the mayor", () => {
    for (const crafts of [[], ["fisher", "hunter", "granary", "dairy", "herbs", "healer"]]) for (const d of [30, 90, 365, 730]) {
      const s = seed(crafts), at = start + d * day;
      const visible = townOf(s, [s], at).people.filter(p => p.role !== "guest" && p.role !== "mayor");
      expect(residentTax(s, [s], at).population).toBe(visible.length);
      expect(householdsOf(s, [s], at).length).toBe(visible.filter(p => p.role === "head").length);
    }
  }, 20000);
  it("untended towns retain at most 32 occupied households and stay a Dorf", () => {
    const s = seed(), at = start + 730 * day;
    expect(householdsOf(s, [s], at).length).toBeLessThanOrEqual(32);
    expect(householdsOf(s, [s], at).length).toBeGreaterThanOrEqual(24);
    expect(stageOf(effAge(s, [s], at))).toBe(2);
  });
  it("winter keeps the same household ceiling as autumn", () => {
    const s = seed(), land = new Map<Kind, unknown[]>([["field", Array(200).fill(null)]]);
    expect(foodCapacity(s, land, Date.parse("2026-07-01"))).toBe(32);
    expect(foodCapacity(s, land, Date.parse("2026-12-15"))).toBe(32);
  });
  it("households keep count and identity across the autumn→winter and winter→spring turns", () => {
    const s = seed(["fisher", "granary"]), key = (at: number) => householdsOf(s, [s], at).map(h => `${h.home}:${h.unit ?? 0}:${h.size}`);
    // Season blends over ~14 days; a few hours either side of each full turn isolates the season effect from growth.
    for (const [a, b] of [["2026-11-15T12:00:00Z", "2026-12-08T12:00:00Z"], ["2027-02-20T12:00:00Z", "2027-03-10T12:00:00Z"]] as const) {
      const before = key(Date.parse(a)), after = key(Date.parse(b));
      const lost = before.filter(h => !after.includes(h)), gained = after.filter(h => !before.includes(h));
      // Only ordinary growth/moves of a few homes over ~3 weeks; never a seasonal block of ~25 %.
      expect(lost.length).toBeLessThanOrEqual(Math.ceil(before.length * 0.05));
      expect(gained.length).toBeLessThanOrEqual(Math.ceil(before.length * 0.08));
      expect(new Set(after).size).toBe(after.length);
    }
  }, 20000);
  it("winter still raises sickness independently of housing", async () => {
    const { sickRate } = await import("./people");
    const s = seed();
    expect(sickRate(s, Date.parse("2026-12-20T12:00:00Z"))).toBeGreaterThan(sickRate(s, Date.parse("2026-07-01T12:00:00Z")));
  });
  it("ordinary, skilled and wealthy residents are assessed at 1, 2 and 3 Taler", () => {
    // Stable estate rolls .53 and .24 at wealth 100: skilled and wealthy respectively.
    expect(assessHomes([{ home: [0, 0], kind: "hut", size: 2 }], 0)).toBe(2);
    expect(assessHomes([{ home: [1, 0], kind: "hut", size: 2 }], 100)).toBe(4);
    expect(assessHomes([{ home: [0, 9], kind: "hut", size: 2 }], 100)).toBe(6);
  });
  it("pastures feed households as fully as fields", () => {
    const s = seed(["fisher"]), at = Date.parse("2026-07-01T00:00:00Z");
    const pasture = new Map<Kind, unknown[]>([["pasture", Array(100).fill(null)]]);
    const field = new Map<Kind, unknown[]>([["field", Array(100).fill(null)]]);
    expect(foodCapacity(s, pasture, at)).toBe(36);
    expect(foodCapacity(s, pasture, at)).toBe(foodCapacity(s, field, at));
  });
  it("gardens feed households as fully as fields", () => {
    const s = seed(["fisher"]), at = Date.parse("2026-07-01T00:00:00Z");
    const garden = new Map<Kind, unknown[]>([["garden", Array(100).fill(null)]]);
    const field = new Map<Kind, unknown[]>([["field", Array(100).fill(null)]]);
    expect(foodCapacity(s, garden, at)).toBe(36);
    expect(foodCapacity(s, garden, at)).toBe(foodCapacity(s, field, at));
  });
  it("mixed slope farming keeps the existing winter penalty and untended cap", () => {
    const land = new Map<Kind, unknown[]>([["field", Array(40).fill(null)], ["garden", Array(30).fill(null)], ["pasture", Array(30).fill(null)]]);
    expect(foodCapacity(seed(["fisher"]), land, Date.parse("2026-12-15T00:00:00Z"))).toBe(foodCapacity(seed(["fisher"]), land, Date.parse("2026-10-15T00:00:00Z")));
    expect(foodCapacity(seed(), land, Date.parse("2026-07-01T00:00:00Z"))).toBe(32);
    expect(foodCapacity(seed(), new Map(), Date.parse("2026-12-15T00:00:00Z"))).toBe(24);
  });
  it("future purchases and future villages cannot alter a historical world", () => {
    const s = seed(), future = new Date(start + 100 * day).toISOString();
    const input: EconomyWorld = { seeds: [s, { ...s, id: "future", x: 330, created_at: future }], purchases: [{ seed_id: s.id, item: "fisher", created_at: future }], blessings: [], charters: [], encounters: [], roads: [], votes: [], works: [], gifts: [] };
    const old = economyWorldAt(input, start + 50 * day);
    expect(old.map(s => s.id)).toEqual(["p"]);
    expect(old[0]?.bought).toEqual([]);
    expect(economyWorldAt(input, start + 101 * day)[0]?.bought?.[0]?.item).toBe("fisher");
  });
});
describe("no founding-site penalty", () => {
  it("a hill town with sparse farmland feeds as many households as flat land of the same radius", () => {
    const s = seed(["fisher", "hunter", "granary", "dairy", "herbs", "healer"]), at = Date.parse("2026-07-01T00:00:00Z");
    const flat = new Map<Kind, unknown[]>([["field", Array(foodCatchment(23.4)).fill(null)]]);
    const hill = new Map<Kind, unknown[]>([["pasture", Array(700).fill(null)]]);
    expect(foodCapacity(s, hill, at, 23.4)).toBe(foodCapacity(s, flat, at, 23.4));
  });
  it("rich farmland above the floor still counts in full", () => {
    const s = seed(["fisher", "hunter", "granary", "dairy", "herbs", "healer"]), at = Date.parse("2026-07-01T00:00:00Z");
    const rich = new Map<Kind, unknown[]>([["field", Array(foodCatchment(10) + 80).fill(null)]]);
    expect(foodCapacity(s, rich, at, 10)).toBeGreaterThan(foodCapacity(s, new Map(), at, 10));
  });
});

import { assessHomesWith, taxSharesAt } from "./resident-tax";
import { estateAt, estateOf, estateShares, gatedEstateShares, ESTATE_TAX } from "./prosperity";
import type { Household } from "./households";

describe("gated resident tax (Option A)", () => {
  const homes: Household[] = Array.from({ length: 60 }, (_, i) => ({ home: [i * 3 + 1, i * 7 + 2], size: 4 } as unknown as Household));
  const sum = (sh: { skilled: number; wealthy: number }) => homes.reduce((t, h) => t + h.size * ESTATE_TAX[estateOf(sh, ...h.home)], 0);
  it("estateAt is unchanged and equals estateOf with plain shares", () => {
    for (const w of [0, 30, 55, 80, 100]) for (const h of homes) expect(estateAt(w, ...h.home)).toBe(estateOf(estateShares(w), ...h.home));
  });
  it("each rank tier assesses through gated shares; no school keeps wealthy at 0", () => {
    for (const r of [0, 1, 2, 3, 4, 5]) for (const school of [false, true]) {
      const sh = gatedEstateShares(90, r, school, 7);
      expect(assessHomesWith(homes, sh)).toBe(sum(sh));
      if (!school || r <= 2) expect(homes.some(h => estateOf(sh, ...h.home) === "wealthy")).toBe(false);
    }
    const t3 = assessHomesWith(homes, gatedEstateShares(90, 3, true, 7)), t4 = assessHomesWith(homes, gatedEstateShares(90, 4, true, 7)), t5 = assessHomesWith(homes, gatedEstateShares(90, 5, true, 7));
    expect(t3).toBeLessThanOrEqual(t4); expect(t4).toBeLessThanOrEqual(t5);
    expect(t5).toBe(sum(estateShares(90)));
  });
  it("more infrastructure never lowers the village assessment", () => {
    let last = 0;
    for (let n = 0; n <= 8; n++) { const v = assessHomesWith(homes, gatedEstateShares(100, 2, false, n)); expect(v).toBeGreaterThanOrEqual(last); last = v; }
  });
  it("repeated assessment gives identical results", () => {
    const sh = gatedEstateShares(70, 4, true, 5);
    expect(assessHomesWith(homes, sh)).toBe(assessHomesWith(homes, sh));
  });
  it("purchases after `at` (school, infrastructure) do not count", () => {
    const at = start + 60 * day;
    const s: Seed = { ...seed(["herbs"]), bought: [{ item: "herbs", at: start }, { item: "school", at: at + 1 }, { item: "fisher", at: at + 1 }] };
    const v = taxSharesAt(s, [s], at);
    expect(v.hasSchool).toBe(false); expect(v.infra).toBe(1);
    expect(taxSharesAt(s, [s], at + 1).infra).toBe(2);
    // control town without the purchases made after `at`: identical receipt
    const control = seed(["herbs"]);
    expect(residentTax(s, [s], at)).toEqual(residentTax(control, [control], at));
  });
  it("economyWorldAt snapshot ignores later purchases for the tax shares", () => {
    const at = start + 60 * day, base = seed();
    const world: EconomyWorld = { seeds: [base], purchases: [
      { seed_id: "p", created_at: new Date(start).toISOString(), item: "herbs" },
      { seed_id: "p", created_at: new Date(at + day).toISOString(), item: "school" },
      { seed_id: "p", created_at: new Date(at + day).toISOString(), item: "fisher" },
    ], blessings: [], charters: [], encounters: [], roads: [], votes: [], works: [], gifts: [] };
    const snap = economyWorldAt(world, at), s = snap[0]!;
    const v = taxSharesAt(s, snap, at);
    expect(v.hasSchool).toBe(false); expect(v.infra).toBe(1);
    expect(s.civicRoads ?? []).toEqual([]);
  });
});

describe("residentTax integration (real rank, school, infrastructure)", () => {
  const at = start + 120 * day;
  const infra = ["herbs", "hunter", "fisher", "dairy", "backhaus", "granary", "healer"];
  const town = (extra: Seed["bought"] = [], roads: { at: number }[] = []): Seed =>
    ({ ...seed(), bought: [...infra.map(item => ({ item, at: start })), ...(extra ?? [])], civicRoads: roads } as Seed);
  it("residentTax equals the manual assessment from real rank, school and infrastructure", async () => {
    const { townRank } = await import("./rank");
    const { civicWealth, infraCount, sickLoss, sickTaxRate } = await import("./prosperity");
    for (const s of [town(), town([{ item: "school", at: start }])]) {
      const homes = householdsOf(s, [s], at), pop = homes.reduce((n, h) => n + h.size, 0);
      const sh = gatedEstateShares(civicWealth(s, at), townRank(s, [s], at), s.bought!.some(b => b.item === "school"), infraCount(s, at));
      const assessed = assessHomesWith(homes, sh);
      const r = residentTax(s, [s], at);
      expect(r.population).toBe(pop); expect(r.households).toBe(homes.length);
      expect(r.assessed).toBe(assessed);
      expect(r.income).toBe(assessed - sickLoss(assessed, Math.max(0.01, sickTaxRate(s, at))));
      // Estates stay 1/2/3 Taler: assessed lies between pop×1 and pop×3.
      expect(r.assessed).toBeGreaterThanOrEqual(pop); expect(r.assessed).toBeLessThanOrEqual(pop * 3);
    }
  }, 30000);
  it("a road finished after `at` and a later purchase leave the historical tax unchanged", () => {
    const base = residentTax(town(), [town()], at);
    const later = town([{ item: "stonemason", at: at + 1 }, { item: "school", at: at + 1 }], [{ at: at + 1 }]);
    expect(taxSharesAt(later, [later], at).infra).toBe(infra.length);
    expect(residentTax(later, [later], at)).toEqual(base);
    expect(taxSharesAt(later, [later], at + 1).infra).toBe(infra.length + 2);
  }, 30000);
  it("trade charter bonus stays 15 % of population, unchanged", () => {
    const s = { ...town(), charter: { path: "trade", at: start } } as Seed, plain = town();
    const r = residentTax(s, [s], at), p = residentTax(plain, [plain], at);
    expect(r.income - p.income).toBe(Math.floor(0.15 * r.population));
  }, 30000);
  it("estate prices stay 1, 2 and 3 Taler", () => { expect(ESTATE_TAX).toEqual({ ordinary: 1, skilled: 2, wealthy: 3 }); });
});

describe("gated shares across real ranks (Dorf, Handelsstadt, Hansestadt)", () => {
  const all = ["herbs", "hunter", "fisher", "dairy", "backhaus", "granary", "healer", "herberge", "woodcamp", "bigstore", "stonemason", "smokehouse", "beginen", "markethall", "guildhall"];
  const world = (roads: number, school: boolean, items = all): Seed[] => {
    const nb = (id: string, dx: number): Seed => ({ id, name: id, owner: "nb", hue: 0, x: 306 + dx, y: 420, created_at: new Date(start - 60 * day).toISOString() });
    const r = [{ target: "nb1", at: start + 14 * day }, { target: "nb2", at: start + 45 * day }].slice(0, roads);
    const s: Seed = { ...seed(), bought: [...items.map(item => ({ item, at: start })), ...(school ? [{ item: "school", at: start }] : [])], roads: r, civicRoads: r.map(x => ({ at: x.at })) };
    return [s, nb("nb1", 15), nb("nb2", -15)];
  };
  const check = async (seeds: Seed[], at: number, rank: number) => {
    const { townRank } = await import("./rank");
    const { civicWealth, infraCount, estateShares } = await import("./prosperity");
    const s = seeds[0]!, v = taxSharesAt(s, seeds, at);
    expect(townRank(s, seeds, at)).toBe(rank);
    expect(v.rank).toBe(rank);
    expect(v.infra).toBe(infraCount(s, at));
    expect(v.shares).toEqual(gatedEstateShares(civicWealth(s, at), rank, v.hasSchool, v.infra));
    const L = estateShares(v.wealth);
    expect(v.shares.skilled).toBeLessThanOrEqual(L.skilled); expect(v.shares.wealthy).toBeLessThanOrEqual(L.wealthy);
    const homes = householdsOf(s, seeds, at);
    expect(residentTax(s, seeds, at).assessed).toBe(assessHomesWith(homes, v.shares));
    return v;
  };
  it("Dorf (rank 2): 4 % + 2.5 % per work, capped at 20 %, no wealthy even with a school", async () => {
    const at = start + 40 * day;
    const few = await check(world(1, true, ["herbs", "hunter", "fisher"]), at, 2);
    expect(few.infra).toBe(4); expect(few.hasSchool).toBe(true);
    expect(few.shares.skilled).toBeCloseTo(Math.min(0.14, estateShares(few.wealth).skilled), 10); expect(few.shares.wealthy).toBe(0);
    const many = await check(world(1, true), at, 2);
    expect(many.infra).toBeGreaterThanOrEqual(7); expect(many.shares.skilled).toBeLessThanOrEqual(0.2); expect(many.shares.wealthy).toBe(0);
  }, 60000);
  it("Handelsstadt (rank 4, one road): school caps skilled at 45 %, wealthy at 15 %; without school wealthy 0", async () => {
    const at = start + 300 * day;
    const v = await check(world(1, true), at, 4);
    expect(v.hasSchool).toBe(true);
    expect(v.shares.skilled).toBeCloseTo(Math.min(0.45, estateShares(v.wealth).skilled), 10);
    expect(v.shares.wealthy).toBeCloseTo(Math.min(0.15, estateShares(v.wealth).wealthy), 10);
    const n = await check(world(1, false), at, 4);
    expect(n.hasSchool).toBe(false); expect(n.shares.wealthy).toBe(0); expect(n.shares.skilled).toBeLessThanOrEqual(0.2);
  }, 120000);
  it("Hansestadt (rank 5, two roads, school): full shares L", async () => {
    const at = start + 300 * day;
    const v = await check(world(2, true), at, 5);
    expect(v.shares.skilled).toBeCloseTo(estateShares(v.wealth).skilled, 10);
    expect(v.shares.wealthy).toBeCloseTo(estateShares(v.wealth).wealthy, 10);
  }, 120000);
  it("citizen estate, painted house and tax agree tile by tile", async () => {
    await import("./rank");
    const { structureAt } = await import("./world");
    const { estateHouse } = await import("./prosperity");
    const seeds = world(2, true), s = seeds[0]!, at = start + 120 * day;
    const sh = taxSharesAt(s, seeds, at).shares;
    expect(sh.wealthy).toBeGreaterThan(0);
    const people = townOf(s, seeds, at).people.filter(p => p.role !== "guest" && p.role !== "mayor");
    const byHome = new Map<string, string>();
    let painted = 0;
    for (const p of people) {
      const e = estateOf(sh, ...p.home);
      expect(p.estate).toBe(e);
      byHome.set(`${p.home}`, e);
      const st = structureAt(p.home[0], p.home[1], seeds, at);
      if (st && st.build === undefined && !st.fire) { expect(st.kind).toBe(estateHouse(st.homeKind ?? st.kind, e)); if (st.homeKind) painted++; }
    }
    expect(painted).toBeGreaterThan(0);
    const homes = householdsOf(s, seeds, at);
    const fromPeople = homes.reduce((t, h) => t + h.size * ESTATE_TAX[byHome.get(`${h.home}`) as keyof typeof ESTATE_TAX], 0);
    expect(residentTax(s, seeds, at).assessed).toBe(fromPeople);
  }, 60000);
});
