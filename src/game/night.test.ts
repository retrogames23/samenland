import { describe, expect, it } from "vitest";
import { houseLit, candleFlicker } from "./night";

describe("household lighting", () => {
  it("keeps every building dark deep in the night", () => {
    for (const kind of ["cottage", "inn", "smithy", "church", "factory"]) {
      for (let seed = 0; seed < 100; seed++) {
        for (const hour of [1, 2, 3, 4, 5]) expect(houseLit(kind, seed, hour)).toBe(false);
      }
    }
  });
  it("lights some homes in the evening but not all of them", () => {
    const states = Array.from({ length: 100 }, (_, seed) => houseLit("cottage", seed, 20));
    expect(states.filter(Boolean).length).toBeGreaterThan(0);
    expect(states.filter(Boolean).length).toBeLessThan(100);
  });
  it("retains stable household schedules", () => {
    expect(houseLit("cottage", 123, 21)).toBe(houseLit("cottage", 123, 21));
    expect(houseLit("cottage", 123, 12)).toBe(false);
  });
  it("flickers gently on a seconds clock instead of milliseconds", () => {
    const first = candleFlicker(1000, 1);
    expect(Math.abs(candleFlicker(1016, 1) - first)).toBeLessThan(0.025);
    expect(Math.abs(candleFlicker(1500, 1) - first)).toBeGreaterThan(0.01);
    for (let t = 0; t < 10000; t += 16) {
      expect(candleFlicker(t, 1)).toBeGreaterThanOrEqual(0.72);
      expect(candleFlicker(t, 1)).toBeLessThanOrEqual(1);
    }
  });
});

describe("lighting around 1500", () => {
  const share = (k: string, h: number) => Array.from({ length: 1000 }, (_, s) => houseLit(k, s, h, 7, 17)).filter(Boolean).length / 1000;
  it("lights at most 40% of plain cottages in the evening", () => expect(share("cottage", 19.5)).toBeLessThanOrEqual(0.4));
  it("puts plain cottages to bed before 22:00", () => expect(share("cottage", 21.6)).toBe(0));
  it("keeps the inn lit longest", () => expect(share("inn", 23)).toBe(1));
});
