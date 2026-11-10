import { describe, it, expect } from "vitest";
import { snowCover } from "./weather";

describe("lying snow", () => {
  it("never lies outside winter", () => { expect(snowCover(Date.UTC(2026, 6, 15, 12))).toBe(0); });
  it("is not permanent through a winter: some January slots are bare, some snowed", () => {
    const vals = Array.from({ length: 31 * 8 }, (_, i) => snowCover(Date.UTC(2027, 0, 1) + i * 3 * 3600_000));
    expect(vals.some((v) => v < 0.1)).toBe(true);
    expect(vals.some((v) => v > 0.5)).toBe(true);
  });
});

import { weatherAt } from "./weather";
describe("North German rain rate", () => {
  it("autumn rains in at most a fifth of the time", () => {
    const n = 90 * 8, wet = Array.from({ length: n }, (_, i) => weatherAt(Date.UTC(2026, 9, 1) + i * 3 * 3600_000 + 5400_000)).filter((w) => w.kind === "drizzle" || w.kind === "storm").length;
    expect(wet / n).toBeLessThan(0.2);
  });
});

import { snowStep, coverOf, type SnowStep } from "./weather";
import { waySnow } from "./seasonal-props";
const run = (steps: SnowStep[], d = 0) => steps.reduce(snowStep, d);
const dry = (temp: number, n: number): SnowStep[] => Array.from({ length: n }, () => ({ kind: "clear", amount: 0, temp }));
describe("snowpack model", () => {
  it("short light shower leaves no lasting cover", () => { expect(coverOf(run([{ kind: "snow", amount: 0.65, temp: -1 }]))).toBe(0); });
  it("several hours of snowfall accumulate visibly", () => { expect(coverOf(run(Array(3).fill({ kind: "snow", amount: 0.75, temp: -2 })))).toBeGreaterThan(0.1); });
  it("a short intense fall can lay a cover", () => { expect(coverOf(run([{ kind: "snow", amount: 1, temp: -3 }]))).toBeGreaterThan(0.1); });
  it("dry frost keeps the snow for days", () => { const d = run(Array(3).fill({ kind: "snow", amount: 0.8, temp: -3 })); expect(run(dry(-4, 40), d)).toBe(d); });
  it("mild air and rain thaw it", () => {
    const d = run(Array(4).fill({ kind: "snow", amount: 0.9, temp: -3 }));
    expect(coverOf(run(dry(4, 8), d))).toBe(0);
    expect(coverOf(run(Array(3).fill({ kind: "drizzle", amount: 0.8, temp: 3 }), d))).toBe(0);
  });
});
describe("winter ways", () => {
  it("deep winter without lying or falling snow leaves the ways bare", async () => {
    const { snowCover, weatherAt } = await import("./weather");
    let bare = 0;
    for (let i = 0; i < 31 * 8; i++) {
      const t = Date.UTC(2027, 0, 1) + i * 3 * 3600_000 + 5400_000;
      if (snowCover(t) < 0.12 && weatherAt(t).kind !== "snow") { bare++; expect(waySnow(t)).toBe(0); }
    }
    expect(bare).toBeGreaterThan(0);
  });
});
