import { describe, expect, it } from "vitest";
import { canPlant, canPlaceSpecial, terrain, isWater, buildable, MAP, type Seed } from "./world";
import { townTiles } from "./households";
import { townOf } from "./people";

const NOW = Date.UTC(2026, 10, 8, 12, 0, 0);

/** A young village and a placeable fisher's-hut tile at the shore that lies outside the radius-based scan box. */
function farHut() {
  for (let y = 30; y < MAP - 30; y += 5) for (let x = 30; x < MAP - 30; x += 5) {
    if (canPlant(x, y, []) !== null) continue;
    const base = { id: "fh", name: "fh", owner: "t", x, y, hue: 40, user_id: "u", created_at: new Date(NOW - 3 * 864e5).toISOString() } as unknown as Seed;
    for (let dy = -15; dy <= 15; dy++) for (let dx = -15; dx <= 15; dx++) {
      const d = Math.hypot(dx, dy); if (d < 7 || d > 15) continue;
      const hx = x + dx, hy = y + dy;
      if (!buildable(terrain(hx, hy))) continue;
      let wet = false; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (isWater(terrain(hx + i, hy + j))) wet = true;
      if (!wet || canPlaceSpecial("fisher", hx, hy, base, [base], NOW) !== null) continue;
      const bare = townTiles(base, [base], NOW);
      if (hx >= bare.x0 && hx <= bare.x1 && hy >= bare.y0 && hy <= bare.y1) continue;
      return { s: { ...base, bought: [{ item: "fisher", at: NOW - 10 * 864e5, x: hx, y: hy }] } as Seed, hx, hy };
    }
  }
  throw new Error("no scenario");
}

describe("fisher's hut beyond the growth radius", () => {
  const { s, hx, hy } = farHut();
  it("is found by townTiles although it stands outside the young village's reach", () => {
    const t = townTiles(s, [s], NOW);
    expect(t.byKind.get("fishery")).toEqual([[hx, hy]]);
    expect(hx >= t.x0 && hx <= t.x1 && hy >= t.y0 && hy <= t.y1).toBe(true);
  });
  it("gets a fisher assigned", () => {
    const town = townOf(s, [s], NOW);
    expect(town.people.filter((p) => p.job === "fisher").length).toBeGreaterThan(0);
  });
  it("an unmoved village without purchases keeps its radius-based box", () => {
    const bare = { ...s, bought: [] } as Seed;
    const t = townTiles(bare, [bare], NOW);
    expect(t.x1 - t.x0).toBe(t.y1 - t.y0);
  });
});
