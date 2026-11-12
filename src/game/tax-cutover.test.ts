import { describe, expect, it } from "vitest";
import { taxOnDay, taxEarned, dailyTax, treasury, assessAt, CAP_ALL_SINCE } from "./economy";
import { civicWealth, estateAssessment } from "./prosperity";
import { residentTax, taxSharesAt } from "./resident-tax";
import { rankInput, townRank } from "./rank";
import type { Seed } from "./world";

const DAY = 864e5;

describe("legacy days before the cutover stay unchanged", () => {
  const created = CAP_ALL_SINCE - 40 * DAY + 5 * 3600e3;
  const seed = () => ({ id: "cut", name: "C", owner: "o", hue: 0, x: 306, y: 420, created_at: new Date(created).toISOString(), user_id: "u", bought: [{ item: "school", at: created + DAY }] }) as unknown as Seed;
  const cutDay = Math.floor((CAP_ALL_SINCE - created) / DAY) + 1;
  it("every pre-cutover day uses the legacy estimate, independent of the network", () => {
    const s = seed(), other = { ...seed(), id: "x", user_id: null, x: 320 } as unknown as Seed;
    let sum = 0;
    for (let d = 1; d < cutDay; d++) {
      const at = created + d * DAY;
      expect(assessAt(s, 100, at)).toBe(estateAssessment(100, civicWealth(s, at)));
      const v = taxOnDay(s, d);
      expect(taxOnDay(s, d, [s, other])).toBe(v);
      sum += v;
    }
    expect(taxEarned(s, created + (cutDay - 1) * DAY)).toBe(sum);
  });
  it("the chest balance at the cutover is identical with and without the new rule", () => {
    const s = seed();
    expect(treasury(s, [], CAP_ALL_SINCE)).toBe(treasury(s, [], CAP_ALL_SINCE, [], [], Infinity));
  });
  it("from the cutover each day is booked once, equal to residentTax", () => {
    const s = seed(), at = created + cutDay * DAY;
    expect(taxOnDay(s, cutDay)).toBe(residentTax(s, [s], at).income);
    const before = treasury(s, [], at - 1), after = treasury(s, [], at);
    expect(after - before).toBeLessThanOrEqual(taxOnDay(s, cutDay));
    expect(treasury(s, [], at + DAY / 2)).toBe(after);
  });
});

describe("client fallback equals server receipts (residentTax) with the full network", () => {
  const all = ["herbs", "hunter", "fisher", "dairy", "backhaus", "granary", "healer", "herberge", "woodcamp", "bigstore", "stonemason", "smokehouse", "beginen", "markethall", "guildhall", "school"];
  const start = Date.parse("2026-01-01T00:00:00Z");
  const world = (roads: number): Seed[] => {
    const nb = (id: string, dx: number): Seed => ({ id, name: id, owner: "nb", hue: 0, x: 306 + dx, y: 420, created_at: new Date(start - 60 * DAY).toISOString() });
    const r = [{ target: "nb1", at: start + 14 * DAY }, { target: "nb2", at: start + 45 * DAY }].slice(0, roads);
    const s: Seed = { id: "p", name: "p", owner: "L", hue: 1, x: 306, y: 420, user_id: "u", created_at: new Date(start).toISOString(), bought: all.map((item) => ({ item, at: start })), roads: r, civicRoads: r.map((x) => ({ at: x.at })) };
    return [s, nb("nb1", 15), nb("nb2", -15)];
  };
  const d = Math.floor((CAP_ALL_SINCE - start) / DAY) + 3, at = start + d * DAY;
  const check = (roads: number, rank: number) => {
    const seeds = world(roads), s = seeds[0]!;
    expect(at).toBeGreaterThanOrEqual(CAP_ALL_SINCE);
    expect(rankInput(s, seeds, at).roads).toBe(roads);
    expect(townRank(s, seeds, at)).toBe(rank);
    const server = residentTax(s, seeds, at);
    expect(taxOnDay(s, d, seeds)).toBe(server.income);
    expect(dailyTax(s, d * 24, seeds)).toBe(server.income);
    return { s, seeds, server };
  };
  it("Handelsstadt (rank 4, one road): same income; without the network the rank would drop", () => {
    const { s, seeds } = check(1, 4);
    expect(townRank(s, [s], at)).toBeLessThan(4);
    expect(taxSharesAt(s, [s], at).shares.wealthy).toBeLessThan(taxSharesAt(s, seeds, at).shares.wealthy);
  }, 120000);
  it("Hansestadt (rank 5, two roads): same income, and higher than the network-less fallback", () => {
    const { s, server } = check(2, 5);
    expect(server.income).toBeGreaterThan(taxOnDay(s, d));
  }, 120000);
  it("assessment uses real households and tile rolls, not an aggregated headcount", () => {
    const seeds = world(2), s = seeds[0]!, r = residentTax(s, seeds, at);
    const sh = taxSharesAt(s, seeds, at).shares, p = r.population;
    const aggregate = p + Math.floor(p * sh.skilled) + 2 * Math.floor(p * sh.wealthy);
    expect(taxOnDay(s, d, seeds)).toBe(r.income);
    expect(r.assessed).not.toBe(aggregate);
  }, 120000);
});

describe("treasury walks the same tax as residentTax with the network", () => {
  const start = Date.parse("2026-01-01T00:00:00Z");
  const items = ["herbs", "hunter", "fisher", "dairy", "backhaus", "granary", "healer", "herberge", "woodcamp", "bigstore", "stonemason", "smokehouse", "beginen", "markethall", "guildhall", "school", "chest2", "chest3", "chest4"];
  const mk = (roadAt: number | null): Seed[] => {
    const r = roadAt == null ? [] : [{ target: "nb1", at: roadAt }];
    const s = { id: "tw", name: "t", owner: "L", hue: 1, x: 306, y: 420, user_id: "u", created_at: new Date(start).toISOString(), bought: items.map((item) => ({ item, at: start })), roads: r, civicRoads: r.map((x) => ({ at: x.at })) } as unknown as Seed;
    return [s, { id: "nb1", name: "n", owner: "nb", hue: 0, x: 321, y: 420, created_at: new Date(start - 60 * DAY).toISOString() } as unknown as Seed];
  };
  const purchases = items.map((item, i) => ({ id: `p${i}`, seed_id: "tw", item, cost: 0, created_at: new Date(start).toISOString() }));
  // a large pre-cutover spend empties the chest, so the cap leaves room for the whole cutover-day tax
  purchases.push({ id: "drain", seed_id: "tw", item: "x", cost: 1e6, created_at: new Date(CAP_ALL_SINCE - 3600e3).toISOString() });
  const d = Math.floor((CAP_ALL_SINCE - start) / DAY) + 1, at = start + d * DAY;
  it("the cutover day's booking equals residentTax with the trade road", () => {
    const seeds = mk(start + 14 * DAY), s = seeds[0]!;
    const inc = treasury(s, purchases, at, [], [], CAP_ALL_SINCE, seeds) - treasury(s, purchases, at - 1, [], [], CAP_ALL_SINCE, seeds);
    expect(inc).toBe(residentTax(s, seeds, at).income);
    expect(residentTax(s, seeds, at).income).not.toBe(residentTax(s, [s], at).income);
  }, 120000);
  it("changing a road's completion time (same counts) re-assesses instead of reusing the memo", () => {
    const a = mk(start + 14 * DAY), b = mk(at + DAY);
    expect(taxOnDay(a[0]!, d, a)).toBe(residentTax(a[0]!, a, at).income);
    expect(taxOnDay(b[0]!, d, b)).toBe(residentTax(b[0]!, b, at).income);
  }, 120000);
});

describe("a settlement day exactly at CAP_ALL_SINCE", () => {
  const start = CAP_ALL_SINCE - 10 * DAY;
  const s = { id: "edge", name: "t", owner: "L", hue: 1, x: 306, y: 420, user_id: "u", created_at: new Date(start).toISOString(), bought: [], roads: [{ target: "nb1", at: start + DAY }], civicRoads: [{ at: start + DAY }] } as unknown as Seed;
  const seeds = [s, { id: "nb1", name: "n", owner: "nb", hue: 0, x: 321, y: 420, created_at: new Date(start - 60 * DAY).toISOString() } as unknown as Seed];
  it("is booked once in the walk with the full network", () => {
    const full = residentTax(s, seeds, CAP_ALL_SINCE).income;
    expect(full).not.toBe(residentTax(s, [s], CAP_ALL_SINCE).income);
    const before = treasury(s, [], CAP_ALL_SINCE - 1, [], [], CAP_ALL_SINCE, seeds);
    const at = treasury(s, [], CAP_ALL_SINCE, [], [], CAP_ALL_SINCE, seeds);
    expect(at - before).toBe(full);
    expect(treasury(s, [], CAP_ALL_SINCE + DAY / 2, [], [], CAP_ALL_SINCE, seeds)).toBe(at);
  }, 120000);
});
