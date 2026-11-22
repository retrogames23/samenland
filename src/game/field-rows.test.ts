import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { ROWS_PER_TILE, ROW_PERIOD, RIDGE, flatQ, lineOffset, rowHeightFactor, rowOffsets, rowPhase } from "./field-rows";

describe("field rows (world-anchored, continuous across tiles)", () => {
  it("six evenly spaced rows per tile with period one tile: no doubled row and no gap at the seam", () => {
    const f = rowOffsets();
    expect(f).toHaveLength(ROWS_PER_TILE);
    const all = [-1, 0, 1].flatMap((t) => f.map((v) => v + t)).sort((a, b) => a - b);
    for (let i = 1; i < all.length; i++) expect(all[i]! - all[i - 1]!).toBeCloseTo(1 / ROWS_PER_TILE, 9);
    for (const v of f) { expect(v).toBeGreaterThan(-0.5); expect(v).toBeLessThan(0.5); }
  });
  it("the row look is periodic over 24 lines, so one composed surface covers every acre; ridges fit the period", () => {
    for (let l = -50; l < 80; l++) {
      expect(rowPhase(l, true)).toBe(rowPhase(l + ROW_PERIOD, true));
      expect(rowHeightFactor(l, false)).toBe(rowHeightFactor(l + ROW_PERIOD, false));
      expect(lineOffset(l + ROW_PERIOD) - lineOffset(l)).toBeCloseTo(ROW_PERIOD / ROWS_PER_TILE, 9);
    }
    expect(ROW_PERIOD % RIDGE).toBe(0);
    expect(ROW_PERIOD % ROWS_PER_TILE).toBe(0);
  });
  it("a row line keeps its phase and height in every tile it crosses; different lines differ", () => {
    const seen = new Set<number>();
    for (let line = 0; line < ROW_PERIOD; line++) {
      expect(rowPhase(line, true)).toBe(rowPhase(line, true));
      expect(rowPhase(line, true)).toBeGreaterThanOrEqual(0); expect(rowPhase(line, true)).toBeLessThan(1024);
      const h = rowHeightFactor(line, false); expect(h).toBeGreaterThanOrEqual(0.9); expect(h).toBeLessThanOrEqual(1.1);
      seen.add(Math.round(rowPhase(line, true)));
    }
    expect(seen.size).toBeGreaterThan(20); // 24 lines per period on 1024 phases
    expect(rowPhase(5, true)).not.toBe(rowPhase(5, false));
  });
});

describe("flat bake resolution", () => {
  it("keeps the measured resolution steps (no extra cache memory) and rises monotonically with zoom", () => {
    let prev = 0;
    for (let z = 0.3; z <= 4.6; z += 0.01) { const q = flatQ(z, 4); expect(q).toBeGreaterThanOrEqual(prev); prev = q; }
    expect([0.5, 1, 2.5, 4].map((z) => flatQ(z + 0.05, 4))).toEqual([0.5, 1, 2.5, 4]);
  });
  it("respects the touch memory cap", () => {
    for (let z = 0.3; z <= 12; z += 0.1) expect(flatQ(z, 2)).toBeLessThanOrEqual(2);
  });
});

describe("painted row strips (scripts/check-field-rows.py)", () => {
  const report = JSON.parse((() => { try { return execFileSync("python3", ["scripts/check-field-rows.py"], { encoding: "utf8" }); } catch (e) { return (e as { stdout: string }).stdout; } })()) as Record<string, string[]>;
  it("all four looks exist", () => expect(Object.keys(report).sort()).toEqual(["row-furrow.webp", "row-green.webp", "row-ripe.webp", "row-stubble.webp"]));
  for (const [file, errs] of Object.entries(report)) it(`${file}: size, opaque coverage, seamless wrap, ground line`, () => expect(errs).toEqual([]));
});
