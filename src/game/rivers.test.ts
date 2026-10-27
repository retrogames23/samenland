import { describe, it, expect } from "vitest";
import { MAP, terrain, isWater } from "./world";

describe("rivers", () => {
  it("every body of water is connected to the sea (no river ends in the middle of the land)", () => {
    const seen = new Uint8Array(MAP * MAP);
    const lakes: number[] = [];
    let rivers = 0;
    for (let y0 = 0; y0 < MAP; y0++) for (let x0 = 0; x0 < MAP; x0++) {
      const k0 = y0 * MAP + x0;
      if (seen[k0] || !isWater(terrain(x0, y0))) continue;
      let sea = false, size = 0;
      const st = [k0]; seen[k0] = 1;
      while (st.length) {
        const k = st.pop()!; const x = k % MAP, y = (k / MAP) | 0; size++;
        if (terrain(x, y) === "deep") sea = true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const nx = x + dx!, ny = y + dy!;
          if (nx < 0 || ny < 0 || nx >= MAP || ny >= MAP) continue;
          const nk = ny * MAP + nx;
          if (!seen[nk] && isWater(terrain(nx, ny))) { seen[nk] = 1; st.push(nk); }
        }
      }
      if (!sea && size > 6) lakes.push(size);
      if (sea) rivers++;
    }
    expect(lakes).toEqual([]);
    expect(rivers).toBeGreaterThan(0);
  });
});
