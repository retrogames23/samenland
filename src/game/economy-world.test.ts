import { describe, it, expect } from "vitest";
import { economyWorldAt, type EconomyWorld } from "./economy-world";
import { economyWorldAtLegacy } from "./__ref/economy-world-legacy";
import { links, transitRoutes, hubRoutes, type Seed } from "./world";
import { residentTax } from "./resident-tax";
import { townRank, rankInput } from "./rank";

const t0 = Date.UTC(2026, 9, 1);
const iso = (ms: number) => new Date(t0 + ms).toISOString();
const H = 3.6e6;
const seed = (id: string, x: number, y: number, at: number, user = true): Seed => ({ id, name: id, owner: id, x, y, hue: 0, created_at: iso(at), ...(user ? { user_id: "u" + id } : {}) });
const world: EconomyWorld = {
  seeds: [seed("a", 300, 420, 0), seed("b", 315, 420, H), seed("c", 330, 420, 2 * H), seed("d", 300, 440, 3 * H, false), seed("e", 600, 600, 4 * H)],
  // reversed input order and identical timestamps on purpose
  purchases: [
    { seed_id: "a", item: "hunter", created_at: iso(30 * H), x: null, y: null },
    { seed_id: "a", item: "backhaus", created_at: iso(20 * H), x: 301, y: 421 },
    { seed_id: "a", item: "herbs", created_at: iso(20 * H), x: 302, y: 421 },
    { seed_id: "b", item: "granary", created_at: iso(25 * H) },
  ],
  blessings: [{ seed_id: "a", created_at: iso(40 * H) }, { seed_id: "a", created_at: iso(10 * H) }, { seed_id: "b", created_at: iso(10 * H) }],
  charters: [{ seed_id: "a", path: "trade", created_at: iso(50 * H) }, { seed_id: "a", path: "farm", created_at: iso(5 * H) }],
  encounters: [{ seed_id: "a", event: "x", choice: "y", cost: 5, created_at: iso(12 * H) }, { seed_id: "a", event: "z", choice: "n", cost: 0, created_at: iso(12 * H) }],
  roads: [
    { seed_id: "a", target_id: "b", created_at: iso(24 * H) }, // mutual
    { seed_id: "b", target_id: "a", created_at: iso(30 * H) },
    { seed_id: "c", target_id: "b", created_at: iso(48 * H) }, // one-sided
    { seed_id: "a", target_id: "b", created_at: iso(26 * H) }, // duplicate decision
  ],
  votes: [], works: [],
  gifts: [{ id: "g1", from_seed: "b", to_seed: "a", kind: "aid", created_at: iso(60 * H) }, { id: "g2", from_seed: "a", to_seed: "b", kind: "gift", created_at: iso(61 * H) }],
};

describe("indexed economyWorldAt equals the legacy scan", () => {
  // different cacheTick values: hours, days, and before/after every event
  const times = [0, H, 6 * H, 20 * H, 20 * H + 1, 26 * H, 49 * H, 3 * 24 * H, 7 * 24 * H, 30 * 24 * H].map(d => t0 + d);
  it.each(times)("at %i: every seed field, network, tax and rank match", (at) => {
    const a = economyWorldAtLegacy(world, at), b = economyWorldAt(world, at);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(JSON.stringify(links(b).map(l => [l.a.id, l.b.id, l.since]))).toBe(JSON.stringify(links(a).map(l => [l.a.id, l.b.id, l.since])));
    for (let i = 0; i < a.length; i++) {
      expect(JSON.stringify(transitRoutes(b[i]!, b).map(r => [r.since, r.bonus(at)]))).toBe(JSON.stringify(transitRoutes(a[i]!, a).map(r => [r.since, r.bonus(at)])));
      expect(JSON.stringify(hubRoutes(b[i]!, b).map(r => r.since))).toBe(JSON.stringify(hubRoutes(a[i]!, a).map(r => r.since)));
      expect(residentTax(b[i]!, b, at)).toEqual(residentTax(a[i]!, a, at));
      expect(rankInput(b[i]!, b, at)).toEqual(rankInput(a[i]!, a, at));
      expect(townRank(b[i]!, b, at)).toBe(townRank(a[i]!, a, at));
    }
  });
  it("keeps the input order of same-time purchases and the first charter row", () => {
    const s = economyWorldAt(world, t0 + 60 * 24 * H).find(x => x.id === "a")!;
    expect(s.bought!.map(b => b.item)).toEqual(["backhaus", "herbs", "hunter"]);
    expect(s.charter!.path).toBe("trade");
    expect(s.aid).toEqual([t0 + 60 * H]);
  });
  it("gives civic roads to both ends of a decided road and none to unconnected seeds", () => {
    const w = economyWorldAt(world, t0 + 60 * 24 * H);
    expect(w.find(x => x.id === "a")!.civicRoads!.length).toBe(1);
    expect(w.find(x => x.id === "b")!.civicRoads!.length).toBe(2);
    expect(w.find(x => x.id === "e")!.civicRoads).toEqual([]);
  });
});
