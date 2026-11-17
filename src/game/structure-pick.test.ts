import { describe, expect, it } from "vitest";
import { townDist, reachOf, landShape } from "./world";

// structureAt's spatial pre-selection relies on: townDist <= r + 0.5  =>  hypot(dx, dy) <= reachOf(s, r + 0.5).
describe("structureAt spatial pick bound", () => {
  it("never excludes a tile a town can claim, including stretched coastal towns", () => {
    let checked = 0, stretched = 0;
    for (let i = 0; i < 400; i++) {
      const s = { id: `t${i}`, x: 40 + ((i * 97) % 940), y: 40 + ((i * 61) % 940) };
      if (landShape(s).k > 1) stretched++;
      for (const r of [1, 4.6, 12.5, 30]) for (let dy = -90; dy <= 90; dy += 3) for (let dx = -90; dx <= 90; dx += 3) {
        const x = s.x + dx, y = s.y + dy;
        if (townDist(x, y, s) > r + 0.5) continue;
        checked++;
        expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(reachOf(s, r + 0.5) + 1e-9);
      }
    }
    expect(checked).toBeGreaterThan(1000);
    expect(stretched).toBeGreaterThan(0);
  });
});
