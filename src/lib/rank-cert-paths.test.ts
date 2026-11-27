import { describe, it, expect, vi, beforeEach } from "vitest";
import type { EconomyWorld } from "@/game/economy-world";

// Which inputs each server path hands to economyWorldAt: the three rank-certifying paths must include
// building_moves, the tax path must not. economyWorldAt is captured and returns no villages, so every path
// stops right after loading ("Missing village") — nothing is certified, booked or written here.
const read: string[] = [];
const tables: Record<string, unknown[]> = {
  seeds: [{ id: "s1", realm: "europe", created_at: "2026-10-01T00:00:00Z" }],
  building_moves: [
    {
      id: "m1",
      seed_id: "s1",
      item: "herbs",
      x: 1,
      y: 2,
      cost: 10,
      created_at: "2026-10-05T00:00:00Z",
    },
  ],
  tax_cutover: [{ at: "2026-10-01T00:00:00Z" }],
};
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    // Hochzeitspaket: the treasury sync first asks the database for the wedding switch (fails closed otherwise)
    rpc: (fn: string) => Promise.resolve({ data: fn === "wedding_switch_since" ? "2100-01-04T00:00:00+00:00" : null, error: null }),
    from: (table: string) => {
      const q: Record<string, unknown> = {};
      for (const k of ["select", "eq", "in", "gt", "gte", "or", "order", "limit"]) q[k] = () => q;
      q["maybeSingle"] = () =>
        Promise.resolve({ data: (tables[table] ?? [])[0] ?? null, error: null });
      q["then"] = (res: (v: unknown) => void) => {
        read.push(table);
        return Promise.resolve({ data: tables[table] ?? [], error: null }).then(res);
      };
      return q;
    },
  },
}));
const inputs: EconomyWorld[] = [];
vi.mock("@/game/economy-world", () => ({
  economyWorldAt: (w: EconomyWorld) => {
    inputs.push(w);
    return [];
  },
}));
beforeEach(() => {
  read.length = 0;
  inputs.length = 0;
});

describe("rank certification paths load relocations, tax does not", () => {
  it.each([
    ["certifyRank", async () => (await import("./treasury.server")).certifyRank("s1", "europe")],
    [
      "bookNothilfe",
      async () => (await import("./treasury.server")).bookNothilfe("s1", "europe", "u", "f", 0),
    ],
    [
      "bookEncounter",
      async () => (await import("./encounter.server")).bookEncounter("s1", "europe", "u", "e", "c"),
    ],
  ])("%s", async (_n, run) => {
    await expect(run()).rejects.toThrow("Missing village");
    expect(read).toContain("building_moves");
    expect(inputs[0]!.moves).toEqual(tables["building_moves"]);
  });

  it("calculateTreasury", async () => {
    const { calculateTreasury } = await import("./treasury.server");
    await calculateTreasury("s1", "europe").catch((e: Error) => read.push(`error:${e.message}`));
    expect(read).toContain("seeds"); // the economy input was loaded
    expect(read).not.toContain("building_moves");
    expect(inputs.length).toBeGreaterThan(0); // and assessed
    for (const w of inputs) expect(w.moves).toBeUndefined();
  });
});
