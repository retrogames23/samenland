import { describe, it, expect } from "vitest";
import { walkersOn, walkProgress, SPEED } from "./wander";
import type { Link, Seed } from "./world";
const s = (id: string, x: number): Seed => ({ id, x, y: 0, name: id, created_at: "2026-01-01T00:00:00Z" } as unknown as Seed);
const l = { a: s("a", 0), b: s("b", 40), d: 40, since: 0, tiles: Array.from({ length: 40 }, (_, i) => [i, 0]), water: [] } as unknown as Link;
describe("wanderers", () => {
  it("same walkers for the same road and day", () => { expect(walkersOn(l, 20500)).toEqual(walkersOn(l, 20500)); });
  it("journeymen appear on some but not all days", () => {
    const n = Array.from({ length: 100 }, (_, d) => walkersOn(l, 20000 + d).filter((w) => w.kind === "journeyman").length).reduce((a, b) => a + b, 0);
    expect(n).toBeGreaterThan(10); expect(n).toBeLessThan(60);
  });
  it("messengers walk faster than journeymen", () => { expect(SPEED.messenger).toBeGreaterThan(SPEED.journeyman); });
  it("progress runs 0..1 between start and arrival", () => {
    const w = walkersOn(l, 20000).concat(walkersOn(l, 20001), walkersOn(l, 20002))[0]!;
    expect(walkProgress(w, w.t0)).toBe(0); expect(walkProgress(w, w.t1)).toBe(1);
  });
});
