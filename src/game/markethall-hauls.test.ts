import { describe, expect, it } from "vitest";
import { canPlant, MAP, structureAt, type Seed } from "./world";
import { townOf } from "./people";

function spot(): [number, number] {
  for (let y = MAP / 2; y < MAP; y += 3) for (let x = MAP / 2; x < MAP; x += 3) if (canPlant(x, y, []) === null) return [x, y];
  throw new Error("no land");
}
const [sx, sy] = spot(), E0 = Date.parse("2026-01-01T00:00:00Z"), H = 3.6e6;
// a young hamlet that bought the market hall and the smokehouse: no inn (landmark from 280 h) and no market square yet
const seed = (): Seed => ({ id: "hall-seed", name: "Gebbingen", owner: "T", x: sx, y: sy, hue: 40, created_at: new Date(E0).toISOString(), user_id: "u",
  bought: [{ item: "markethall", at: E0 + H }, { item: "smokehouse", at: E0 + 2 * H }] } as unknown as Seed);
const tiles = (s: Seed, now: number, kind: string) => {
  const out: [number, number][] = [];
  for (let y = sy - 14; y <= sy + 14; y++) for (let x = sx - 14; x <= sx + 14; x++) { const st = structureAt(x, y, [s], now); if (st && st.build === undefined && st.kind === kind) out.push([x, y]); }
  return out;
};

describe("Warentransporte zur gekauften Markthalle", () => {
  const now = E0 + 8 * 864e5, s = seed(), t = townOf(s, [s], now);
  it("the setup has a market hall and a smokehouse but no inn or market", () => {
    expect(tiles(s, now, "markethall").length).toBeGreaterThan(0);
    expect(tiles(s, now, "smokehouse").length).toBeGreaterThan(0);
    expect(tiles(s, now, "inn")).toHaveLength(0);
    expect(tiles(s, now, "market")).toHaveLength(0);
  });
  it("smokehouse fishers carry their fish bundles to the market hall", () => {
    const hall = tiles(s, now, "markethall");
    const carriers = t.people.filter((p) => p.job === "fisher" && p.haul);
    expect(carriers.length).toBeGreaterThan(0);
    for (const p of carriers) {
      expect(p.haul!.good).toBe("bundle");
      expect(p.haul!.dest).toBe("market");
      expect(hall.some(([x, y]) => x === p.haul!.to[0] && y === p.haul!.to[1])).toBe(true);
    }
  });
  it("the routes stay deterministic", () => {
    const again = townOf({ ...seed() }, [{ ...seed() }], now + 60001);
    const key = (tw: typeof t) => tw.people.filter((p) => p.haul).map((p) => `${p.id}:${p.haul!.good}:${p.haul!.dest}:${p.haul!.to}`);
    expect(key(again)).toEqual(key(t));
  });
});
