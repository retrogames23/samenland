import { describe, it, expect, beforeAll } from "vitest";
import { economyWorldAt, type EconomyWorld } from "./economy-world";
import { rankInput, townRank } from "./rank";
import { setRealm } from "./time";
import type { Seed } from "./world";

// Rank certification (certifyRank, bookNothilfe, bookEncounter) must count the village the player sees,
// relocations (building_moves) included; tax assessment still loads no moves.
const t0 = Date.UTC(2026, 0, 1),
  D = 86400000,
  iso = (ms: number) => new Date(t0 + ms).toISOString();
const base: Seed[] = [
  { id: "a", name: "a", owner: "a", x: 420, y: 300, hue: 0, created_at: iso(0), user_id: "u" },
];
const world: EconomyWorld = {
  seeds: base,
  purchases: [{ seed_id: "a", item: "herbs", created_at: iso(20 * D), x: 423, y: 301 }],
  blessings: [],
  charters: [],
  encounters: [],
  roads: [],
  votes: [],
  works: [],
  gifts: [],
  moves: [
    { seed_id: "a", item: "herbs", x: 416, y: 298, cost: 10, created_at: iso(250 * D) },
    { seed_id: "a", item: "herbs", x: 425, y: 305, cost: 10, created_at: iso(400 * D) }, // later than `now`
  ],
};
const now = t0 + 251 * D;
const { moves: _m, ...noMoves } = world; // what loadEconomyInput returns for the tax path
/** The client's merge (Game.tsx): every building_moves row of the village, unfiltered, as Seed.moves. */
const clientWorld = (): Seed[] => {
  const s = economyWorldAt(noMoves, now);
  return s.map((v) => ({
    ...v,
    moves: world.moves!.map((m) => ({
      item: m.item,
      x: m.x,
      y: m.y,
      at: Date.parse(m.created_at),
      cost: m.cost ?? 0,
    })),
  }));
};

describe("rank certification counts relocations", () => {
  beforeAll(() => setRealm("europe"));

  it("without moves in the input the world is unchanged (tax path)", () => {
    const w = economyWorldAt(noMoves, now);
    expect(w[0]).not.toHaveProperty("moves");
  });

  it("attaches only moves made by `at`, in the client's shape", () => {
    const w = economyWorldAt(world, now);
    expect(w[0]!.moves).toEqual([{ item: "herbs", x: 416, y: 298, at: t0 + 250 * D, cost: 10 }]);
    expect(economyWorldAt(world, t0 + 100 * D)[0]).not.toHaveProperty("moves");
  });

  it("server citizens and rank equal the client's after a move", () => {
    const server = economyWorldAt(world, now),
      client = clientWorld(),
      legacy = economyWorldAt(noMoves, now);
    const c = rankInput(client[0]!, client, now);
    expect(rankInput(server[0]!, server, now)).toEqual(c);
    expect(townRank(server[0]!, server, now)).toBe(townRank(client[0]!, client, now));
    // the case is real: ignoring the move gives a different count (the old mismatch)
    expect(rankInput(legacy[0]!, legacy, now).citizens).not.toBe(c.citizens);
  });
});
