import { describe, expect, it } from "vitest";
import { MAP } from "./world";
import { QUALITY_SCALE, SEA_FAR, coastDist, isSea, nextQuality, onshore, seaBlock, surfPhase, swellPhase, waterConcept, type QualityState } from "./water-look";

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

describe("adaptive water quality (concept D)", () => {
  const run = (q: QualityState, ms: number, dur: number) => { for (let t = 0; t < dur; t += ms) q = nextQuality(q, ms); return q; };
  const full: QualityState = { level: 2, slow: 0, fast: 0, ema: 0 };
  it("drops one level only after sustained slow frames", () => {
    expect(run(full, 50, 1500).level).toBe(2); // a short hitch changes nothing
    expect(run(full, 50, 2600).level).toBe(1);
    expect(run(full, 50, 6000).level).toBe(0);
  });
  it("recovers only after a much longer run of fast frames (hysteresis)", () => {
    const low = run(full, 50, 6000);
    expect(run(low, 16, 6000).level).toBe(0);
    expect(run(low, 16, 9000).level).toBe(1);
    expect(run(low, 16, 30000).level).toBe(2);
  });
  it("holds its level in the band between the thresholds, so it never flickers", () => {
    const mid = run(full, 50, 2600); let q = mid, changes = 0, last = q.level;
    for (let i = 0; i < 2000; i++) { q = nextQuality(q, i % 2 ? 24 : 40); if (q.level !== last) { changes++; last = q.level; } }
    expect(changes).toBe(0);
  });
  it("a single huge frame (tab switch) is clamped and does not drop quality", () => {
    expect(nextQuality(full, 5000).level).toBe(2);
  });
  it("density scale rises with level", () => { expect(QUALITY_SCALE[0]).toBeLessThan(QUALITY_SCALE[1]); expect(QUALITY_SCALE[1]).toBeLessThan(QUALITY_SCALE[2]); });
});
