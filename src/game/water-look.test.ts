import { describe, expect, it } from "vitest";
import { MAP } from "./world";
import { SEA_FAR, coastDist, isSea, onshore, seaBlock, surfPhase, swellPhase, waterConcept } from "./water-look";

describe("water concept switch (P4b, temporary)", () => {
  it("defaults to the main look when no ?water= switch is set", () => expect(waterConcept()).toBe("main"));
});

describe("sea data (real map, heartland)", () => {
  const tiles: [number, number][] = [];
  for (let by = 0; by < MAP / 16 && tiles.length < 600; by += 2) for (let bx = 0; bx < MAP / 16; bx += 2) {
    const S = seaBlock(bx, by); if (!S) continue;
    for (let i = 0; i < S.n; i += 37) if (S.d[i]! < 30) tiles.push([S.x[i]!, S.y[i]!]);
  }
  it("finds near-coast sea water with a distance to land", () => {
    expect(tiles.length).toBeGreaterThan(100);
    for (const [x, y] of tiles) { expect(isSea(x, y)).toBe(true); expect(coastDist(x, y)).toBeGreaterThan(0); expect(coastDist(x, y)).toBeLessThan(SEA_FAR); }
  });
  it("the onshore direction leads toward the coast", () => {
    let ok = 0, n = 0;
    for (const [x, y] of tiles) {
      const f = onshore(x, y), d0 = coastDist(x, y);
      if (d0 < 4) continue;
      const d1 = coastDist(Math.round(x + f[0] * 3), Math.round(y + f[1] * 3)); n++; if (d1 < d0) ok++;
    }
    expect(n).toBeGreaterThan(50);
    expect(ok / n).toBeGreaterThan(0.9);
  });
});

describe("wave timing", () => {
  const f: [number, number] = [0.6, 0.8];
  it("swells move onshore: a phase seen here arrives one wave-step shoreward later, continuously", () => {
    for (let t = 0; t < 20_000; t += 16) {
      const a = swellPhase(40, 50, f, t, 4, 0.3), b = swellPhase(40, 50, f, t + 16, 4, 0.3);
      const dd = Math.abs(b - a); expect(Math.min(dd, 1 - dd)).toBeLessThan(0.01);
    }
  });
  it("surf beats are continuous along the coast and in time (no ticking segments)", () => {
    for (let t = 0; t < 30_000; t += 16) { const a = surfPhase(300, 200, t, 6000), b = surfPhase(300, 200, t + 16, 6000); const dd = Math.abs(b - a); expect(Math.min(dd, 1 - dd)).toBeLessThan(0.01); }
    for (let x = 0; x < 400; x += 2) { const a = surfPhase(x, 120, 5000, 6000), b = surfPhase(x + 2, 120, 5000, 6000); const dd = Math.abs(b - a); expect(Math.min(dd, 1 - dd)).toBeLessThan(0.06); }
  });
});
