import { describe, expect, it } from "vitest";
import { canPlant, MAP, structureAt, type Seed } from "./world";
import { inspectAt } from "./inspect";

function spot(): [number, number] {
  for (let y = MAP / 2; y < MAP; y += 3) for (let x = MAP / 2; x < MAP; x += 3) if (canPlant(x, y, []) === null) return [x, y];
  throw new Error("no land");
}
const [sx, sy] = spot();
const NOW = new Date(2026, 9, 27, 11, 0, 0).getTime();
const seed: Seed = { id: "insp", name: "Testdorf", owner: "T", x: sx, y: sy, hue: 40, created_at: new Date(NOW - 20 * 864e5).toISOString() };

describe("building inspection", () => {
  it("finds a home with its residents and reports site progress between 0 and 1", () => {
    let home = false, site = false;
    for (let y = sy - 8; y <= sy + 8; y++) for (let x = sx - 8; x <= sx + 8; x++) {
      const st = structureAt(x, y, [seed], NOW);
      if (!st) continue;
      const ins = inspectAt(x, y, [seed], NOW);
      if (st.build === undefined && ins?.residents.length) home = true;
      if (st.build !== undefined && ins && ins.x === x && ins.y === y) { site = true; expect(ins.build).toBeGreaterThanOrEqual(0); expect(ins.build).toBeLessThan(1); }
    }
    expect(home).toBe(true);
    void site;
  });
});
