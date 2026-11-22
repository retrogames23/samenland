import { describe, expect, it } from "vitest";
import { MAP } from "./world";
import { FLOW_BLOCK, STREAKS, TRAVEL, flowBlock, flowPatch, flowSpeed, riverFlow, seaStepsAt, streakAt, zoomKeep } from "./river-flow";

describe("river current direction (real map, heartland)", () => {
  const tiles: [number, number][] = [];
  for (let by = 0; by < MAP / FLOW_BLOCK && tiles.length < 400; by++) for (let bx = 0; bx < MAP / FLOW_BLOCK; bx++) {
    const B = flowBlock(bx, by); if (!B) continue;
    for (let i = 0; i < B.n; i += 7) tiles.push([B.x[i]!, B.y[i]!]);
  }
  it("finds connected river water with a unit downstream direction", () => {
    expect(tiles.length).toBeGreaterThan(100);
    for (const [x, y] of tiles) { const f = riverFlow(x, y)!; expect(Math.hypot(f[0], f[1])).toBeCloseTo(1, 5); }
  });
  it("points downstream: a few tiles along the current are closer to the sea", () => {
    let ok = 0, n = 0;
    for (const [x, y] of tiles) {
      const f = riverFlow(x, y)!, d0 = seaStepsAt(x, y);
      const nx = Math.round(x + f[0] * 3), ny = Math.round(y + f[1] * 3), d1 = seaStepsAt(nx, ny);
      if (d1 === 65535) continue; n++; if (d1 < d0) ok++;
    }
    expect(n).toBeGreaterThan(80);
    expect(ok / n).toBeGreaterThan(0.95);
  });
  it("follows the course smoothly: neighbouring tiles of a reach agree in direction", () => {
    let agree = 0, n = 0;
    for (const [x, y] of tiles) {
      const f = riverFlow(x, y)!, g = riverFlow(x + 1, y) ?? riverFlow(x, y + 1); if (!g) continue;
      n++; if (f[0] * g[0] + f[1] * g[1] > 0.8) agree++;
    }
    expect(agree / n).toBeGreaterThan(0.95);
  });
});

describe("crest motion", () => {
  const f: [number, number] = [0.6, -0.8];
  it("each crest drifts downstream during its run and fades to nothing at both ends (no pop)", () => {
    for (let j = 0; j < STREAKS; j++) {
      let prevAlong = -Infinity, prevCycle = -1;
      for (let t = 0; t < 40_000; t += 16) {
        const sp = 0.4, s = streakAt(10, 20, j, t, sp, f), cyc = Math.floor((t / 1000) * sp / TRAVEL);
        const along = (s.px - 10) * f[0] + (s.py - 20) * f[1];
        if (s.a > 0.2 && prevAlong > -Infinity && cyc === prevCycle) expect(along).toBeGreaterThanOrEqual(prevAlong - 0.3);
        prevAlong = along; prevCycle = cyc;
        expect(s.a).toBeGreaterThanOrEqual(0); expect(s.a).toBeLessThanOrEqual(1);
      }
    }
    // the visible strength is tiny right where a run restarts at a new place
    const sp = 0.3; let maxJump = 0, prev = streakAt(3, 4, 0, 0, sp, f);
    for (let t = 16; t < 60_000; t += 16) { const s = streakAt(3, 4, 0, t, sp, f); if (Math.hypot(s.px - prev.px, s.py - prev.py) > 0.2) maxJump = Math.max(maxJump, Math.max(s.a, prev.a)); prev = s; }
    expect(maxJump).toBeLessThan(0.05);
  });
  it("moves at a calm, visible pace: faster mid-stream than at the bank", () => {
    for (let x = 0; x < 200; x += 13) {
      const bank = flowSpeed(x, 7, -0.2), mid = flowSpeed(x, 7, -2);
      expect(mid).toBeGreaterThan(bank);
      expect(mid).toBeLessThan(0.7); expect(bank).toBeGreaterThan(0.1);
    }
  });
  it("never leaves the water: lateral offset shrinks with the room to the bank", () => {
    for (let t = 0; t < 30_000; t += 97) {
      const s = streakAt(50, 60, 1, t, 0.3, [1, 0], 0.3);
      expect(Math.abs(s.py - 60)).toBeLessThanOrEqual(0.45 * 0.3 + 1e-9);
    }
  });
  it("light bands travel with the current and change smoothly between frames", () => {
    for (let t = 0; t < 20_000; t += 16) expect(Math.abs(flowPatch(5, 9, t + 16, f, 0.4) - flowPatch(5, 9, t, f, 0.4))).toBeLessThan(0.01);
    // a band seen at one place shows up downstream a little later
    const here = flowPatch(30, 30, 10_000, f, 0.4), later = flowPatch(30 + f[0] * 2, 30 + f[1] * 2, 10_000 + 2 / (0.4 * 0.55) * 1000, f, 0.4);
    expect(Math.abs(here - later)).toBeLessThan(1e-9);
  });
  it("zoom thins crests smoothly and never changes which way they go", () => {
    for (let x = 0; x < 50; x++) {
      let prev = zoomKeep(x, 3, 1, 0.2);
      for (let k = 0.21; k <= 1; k += 0.01) { const v = zoomKeep(x, 3, 1, k); expect(v).toBeGreaterThanOrEqual(prev); expect(v - prev).toBeLessThan(0.1); prev = v; }
    }
  });
});
