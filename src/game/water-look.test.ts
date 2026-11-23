import { describe, expect, it } from "vitest";
import { MAP } from "./world";
import { QUALITY_SCALE, SEA_CAP, SEA_FAR, coastDist, crescent, isSea, nextQuality, onshore, seaBlock, surfFront, surfPhaseD, swellPhase, waterConcept, type QualityState } from "./water-look";
import { isWater, terrain } from "./world";
const isSeaOrRiver = (x: number, y: number) => isWater(terrain(x, y));

describe("water look switch", () => {
  it("uses the P4b look unless ?water=main asks for the earlier one", () => expect(waterConcept()).toBe("d"));
});

describe("sea data (real map, heartland)", () => {
  const tiles: [number, number][] = [];
  for (let by = 0; by < MAP / 16 && tiles.length < 600; by += 2) for (let bx = 0; bx < MAP / 16; bx += 2) {
    const S = seaBlock(bx, by); if (!S) continue;
    for (let i = 0; i < S.n; i += 7) if (S.d[i]! < SEA_CAP) tiles.push([S.x[i]!, S.y[i]!]);
  }
  it("finds near-coast sea water with a distance to land", () => {
    expect(tiles.length).toBeGreaterThan(100);
    for (const [x, y] of tiles) { expect(isSea(x, y)).toBe(true); expect(coastDist(x, y)).toBeGreaterThan(0); expect(coastDist(x, y)).toBeLessThan(SEA_FAR); }
  });
  it("the onshore direction leads toward the coast", () => {
    let ok = 0, n = 0;
    for (const [x, y] of tiles) {
      const f = onshore(x, y), d0 = coastDist(x, y);
      if (d0 < 4 || d0 >= SEA_CAP) continue; // beyond the cap the sea is simply "open" and keeps the steady swell
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

describe("concept D: surf front, crescents, regional coast distance", () => {
  it("the foam front comes in from offshore, climbs onto the beach and draws back; invisible at the beat's seam", () => {
    expect(surfFront(0).a).toBeLessThan(0.05); expect(surfFront(0.999).a).toBeLessThan(0.05);
    expect(surfFront(0).off).toBeCloseTo(1, 5);
    let prev = 2; for (let p = 0; p < 0.6; p += 0.01) { const f = surfFront(p); expect(f.off).toBeLessThan(prev + 1e-9); prev = f.off; expect(f.wet).toBe(0); }
    expect(Math.min(...Array.from({ length: 100 }, (_, i) => surfFront(i / 100).off))).toBeLessThan(0); // runs up onto the sand
    for (let p = 0.6; p < 1; p += 0.01) expect(surfFront(p + 0.005).off).toBeGreaterThanOrEqual(surfFront(p).off - 1e-9); // draws back
    for (let p = 0; p < 0.997; p += 0.002) { const a = surfFront(p), b = surfFront(p + 0.002); expect(Math.abs(b.off - a.off)).toBeLessThan(0.03); expect(Math.abs(b.a - a.a)).toBeLessThan(0.03); }
  });
  it("D's surf beat changes slowly along the coast, so neighbouring shore points move as one front", () => {
    for (let x = 0; x < 20000; x += 97) { const a = surfPhaseD(x, x * 0.4, 5000, 7600), b = surfPhaseD(x + 16, x * 0.4 + 8, 5000, 7600); const d = Math.abs(a - b); expect(Math.min(d, 1 - d)).toBeLessThan(0.06); }
  });
  it("a crescent is two curves between its tips, bulging the given way", () => {
    const b: number[] = []; crescent(b, 10, 20, 5, 0, 0, 4, 0.4, 0.15, 0);
    expect(b).toHaveLength(8); expect([b[0], b[1], b[4], b[5]]).toEqual([5, 20, 15, 20]);
    expect(b[3]!).toBeGreaterThan(b[7]!); expect(b[7]!).toBeGreaterThan(20); // outer curve beyond the inner, both bulge +y
  });
  it("regional distance is a consistent breadth-first distance: 1 at the shore, each step one more than a neighbour", () => {
    let checked = 0;
    for (let y = 100; y < 900 && checked < 4000; y += 7) for (let x = 100; x < 900 && checked < 4000; x += 5) {
      const d = coastDist(x, y); if (d >= SEA_FAR || d >= SEA_CAP) continue; checked++;
      let minN = 999, land = false;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { if (!i && !j) continue; if (!isSea(x + i, y + j) && coastDist(x + i, y + j) === SEA_FAR && !isSeaOrRiver(x + i, y + j)) land = true; minN = Math.min(minN, coastDist(x + i, y + j)); }
      if (land) expect(d).toBe(1); else expect(d).toBe(Math.min(SEA_CAP, minN + 1));
    }
    expect(checked).toBeGreaterThan(500);
  });
});
