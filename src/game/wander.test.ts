import { describe, it, expect } from "vitest";
import { homeDraw, walkersOn, walkProgress, SPEED } from "./wander";
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
describe("remote weddings", () => {
  it("brides walk now and then (roughly every few weeks per road)", () => {
    const n = Array.from({ length: 400 }, (_, d) => walkersOn(l, 20000 + d).filter((w) => w.kind === "bridal").length).reduce((a, b) => a + b, 0);
    expect(n).toBeGreaterThan(4); expect(n).toBeLessThan(40);
  });
  it("both brides and grooms move to their spouse", () => {
    const sx = new Set<string>();
    for (let d = 0; d < 1200; d++) for (const w of walkersOn(l, 20000 + d)) if (w.kind === "bridal") sx.add(w.sex);
    expect([...sx].sort()).toEqual(["f", "m"]);
  });
  it("the couple settles in the more attractive town", () => {
    const old = s("o", 0); old.created_at = "2024-01-01T00:00:00Z";
    const mid = s("m", 40); mid.created_at = "2025-06-01T00:00:00Z";
    const r = { ...l, a: old, b: mid } as Link;
    const at = Date.parse("2026-10-01T00:00:00Z");
    expect(homeDraw(r, at)).toBe(-1);
    for (let d = 0; d < 300; d++) for (const w of walkersOn(r, 20400 + d)) if (w.kind === "bridal") expect(w.to.id).toBe("o");
  });
});

describe("family moves", () => {
  it("families only move toward the more attractive town", async () => {
    const { homeDraw: hd } = await import("./wander");
    for (let d = 0; d < 600; d++) for (const w of walkersOn(l, 20000 + d)) if (w.kind === "family") {
      const dir = hd(l, (20000 + d) * 864e5);
      expect(dir).not.toBe(0);
      expect(w.to.id).toBe(dir > 0 ? l.b.id : l.a.id);
    }
  });
});
