import { describe, expect, it } from "vitest";

// Mirrors the display-only road preselection in render.ts draw(): it must be a superset of the
// per-loop test (roadBox ± 60 world units) at every zoom, so no road, crew, bridge or cart disappears.
type Box = [number, number, number, number];
const loopKeeps = (b: Box, v: Box) => !(b[2] < v[0] - 60 || b[0] > v[1] + 60 || b[3] < v[2] - 60 || b[1] > v[3] + 60);
const nearKeeps = (b: Box, v: Box, z: number) => { const M = Math.max(60, 120 / z); return !(b[2] < v[0] - M || b[0] > v[1] + M || b[3] < v[2] - M || b[1] > v[3] + M); };
const view = (cx: number, cy: number, w: number, h: number, z: number): Box => [cx - w / 2 / z, cx + w / 2 / z, cy - h / 2 / z, cy + h / 2 / z];

describe("road preselection", () => {
  it("keeps a road crossing the view whose ends both lie outside", () => {
    const v = view(0, 0, 2560, 1800, 4);
    expect(nearKeeps([-5000, -10, 5000, 10], v, 4)).toBe(true);
  });
  it("is a superset of the per-loop test along all four edges and every zoom", () => {
    for (const z of [0.9, 1, 2, 4, 8, 24, 48]) {
      const v = view(100, 200, 2560, 1800, z);
      for (let d = -200; d <= 200; d += 0.5) {
        const boxes: Box[] = [[v[0] - 300, v[2], v[0] + d, v[3]], [v[1] - d, v[2], v[1] + 300, v[3]], [v[0], v[2] - 300, v[1], v[2] + d], [v[0], v[3] - d, v[1], v[3] + 300]];
        for (const b of boxes) if (loopKeeps(b, v)) expect(nearKeeps(b, v, z)).toBe(true);
      }
    }
  });
  it("drops roads far away", () => {
    expect(nearKeeps([5000, 5000, 5100, 5100], view(0, 0, 1280, 900, 2), 2)).toBe(false);
  });
});
