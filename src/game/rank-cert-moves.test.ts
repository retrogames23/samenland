import { describe, it, expect, beforeAll } from "vitest";
import { economyWorldAt, seedMove, type EconomyWorld } from "./economy-world";
import { rankInput, townRank } from "./rank";
import { setRealm } from "./time";
import type { Seed } from "./world";

// Rank certification (certifyRank, bookNothilfe, bookEncounter) must count the village the player sees,
// relocations (building_moves) included; tax assessment still loads no moves.
const t0 = Date.UTC(2026, 0, 1),
  D = 86400000,
  iso = (ms: number) => new Date(t0 + ms).toISOString();
const world: EconomyWorld = {
  seeds: [
    { id: "a", name: "a", owner: "a", x: 420, y: 300, hue: 0, created_at: iso(0), user_id: "u" },
    { id: "b", name: "b", owner: "b", x: 432, y: 300, hue: 0, created_at: iso(D), user_id: "v" },
  ],
  purchases: [
    { seed_id: "a", item: "herbs", created_at: iso(20 * D), x: 423, y: 301 },
    { seed_id: "a", item: "backhaus", created_at: iso(30 * D), x: 418, y: 303 },
    { seed_id: "b", item: "herbs", created_at: iso(25 * D), x: 430, y: 302 },
  ],
  blessings: [],
  charters: [],
  encounters: [],
  roads: [],
  votes: [],
  works: [],
  gifts: [],
  // chronological, as loadEconomyInput reads them: one item moved twice, a second item, a neighbour's move
  moves: [
    { seed_id: "a", item: "herbs", x: 416, y: 298, cost: 10, created_at: iso(250 * D) },
    { seed_id: "b", item: "herbs", x: 435, y: 304, cost: 10, created_at: iso(255 * D) },
    { seed_id: "a", item: "backhaus", x: 424, y: 296, cost: 15, created_at: iso(270 * D) },
    { seed_id: "a", item: "herbs", x: 425, y: 305, cost: 10, created_at: iso(300 * D) },
  ],
};
const { moves: _m, ...noMoves } = world; // what loadEconomyInput returns for the tax path

/**
 * The client at time T, exactly as Game.tsx builds it: every building_moves row stored so far (created_at ≤ T),
 * in fetch order (any order; here reversed), grouped per village and mapped with the shared seedMove — no sort.
 */
const clientWorld = (T: number): Seed[] => {
  const rows = world.moves!.filter((m) => Date.parse(m.created_at) <= T).reverse();
  const mo = new Map<string, NonNullable<Seed["moves"]>>();
  for (const m of rows) {
    if (!mo.has(m.seed_id)) mo.set(m.seed_id, []);
    mo.get(m.seed_id)!.push(seedMove(m));
  }
  return economyWorldAt(noMoves, T).map((s) => (mo.get(s.id) ? { ...s, moves: mo.get(s.id)! } : s));
};
const times = [100, 251, 256, 271, 301, 330].map((d) => t0 + d * D);

describe("rank certification counts relocations", () => {
  beforeAll(() => setRealm("europe"));

  it("without moves in the input the world is unchanged (tax path)", () => {
    for (const T of times)
      for (const s of economyWorldAt(noMoves, T)) expect(s).not.toHaveProperty("moves");
  });

  it("attaches each village's moves stored by `at`, via the shared seedMove", () => {
    const at = t0 + 271 * D,
      a = economyWorldAt(world, at).find((s) => s.id === "a")!;
    expect(a.moves).toEqual([world.moves![0]!, world.moves![2]!].map(seedMove));
    expect(economyWorldAt(world, t0 + 100 * D)[0]).not.toHaveProperty("moves");
  });

  it.each(times)("at %i server citizens, homes, roads and rank equal the client's", (T) => {
    const server = economyWorldAt(world, T),
      client = clientWorld(T);
    for (const id of ["a", "b"]) {
      const s = server.find((v) => v.id === id)!,
        c = client.find((v) => v.id === id)!;
      expect(rankInput(s, server, T)).toEqual(rankInput(c, client, T));
      expect(townRank(s, server, T)).toBe(townRank(c, client, T));
    }
  });

  it("the case is real: ignoring moves gives a different count after a move", () => {
    const diff = times.filter((T) => {
      const s = economyWorldAt(world, T),
        l = economyWorldAt(noMoves, T);
      return rankInput(s[0]!, s, T).citizens !== rankInput(l[0]!, l, T).citizens;
    });
    expect(diff.length).toBeGreaterThan(0);
  });
});
