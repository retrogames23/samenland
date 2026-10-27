import { describe, expect, it } from "vitest";
import { bonusOf, MIN_SEED_DISTANCE, TRADE_DIST } from "./world";

describe("trade synergy bonus", () => {
  it("is +10% for a far, young neighbour", () => {
    expect(bonusOf(TRADE_DIST, 0)).toBeCloseTo(0.1);
  });
  it("is +25% for the closest possible, mature neighbour", () => {
    expect(bonusOf(MIN_SEED_DISTANCE, 5000)).toBeCloseTo(0.25);
  });
});

import { structureAt, MAP, buildable, terrain } from "./world";
describe("village paths", () => {
  it("never end on open grass: every path end touches a building or square", () => {
    let sx = 512, sy = 512;
    outer: for (let y = 300; y < 700; y += 7) for (let x = 300; x < 700; x += 7) if (buildable(terrain(x, y))) { sx = x; sy = y; break outer; }
    const now = Date.now();
    const seed = { id: "test-paths", x: sx, y: sy, created_at: new Date(now - 400 * 3.6e6).toISOString() } as never;
    const P = new Set(["path", "street", "avenue", "square", "well", "market", "road", "bridge"]);
    const isP = (x: number, y: number) => P.has(structureAt(x, y, [seed], now)?.kind ?? "");
    for (let y = sy - 12; y <= sy + 12; y++) for (let x = sx - 12; x <= sx + 12; x++) {
      const k = structureAt(x, y, [seed], now)?.kind;
      if (k !== "path" && k !== "street") continue;
      let pn = 0, anchor = false;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) {
        const o = structureAt(x + i, y + j, [seed], now)?.kind;
        if (isP(x + i, y + j)) pn++;
        else if (o && !["field", "pasture", "garden", "hay", "fence"].includes(o)) anchor = true;
      }
      expect(pn >= 2 || anchor, `dead end at ${x},${y}`).toBe(true);
    }
    expect(MAP).toBeGreaterThan(0);
  });
});
