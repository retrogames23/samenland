import { describe, it, expect } from "vitest";
import { snowCover } from "./weather";

describe("lying snow", () => {
  it("never lies outside winter", () => { expect(snowCover(Date.UTC(2026, 6, 15, 12))).toBe(0); });
  it("is not permanent through winters: some slots bare, some snowed", () => {
    const vals = [2027, 2029].flatMap((y) => Array.from({ length: 31 * 8 }, (_, i) => snowCover(Date.UTC(y, 0, 1) + i * 3 * 3600_000)));
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
    expect(coverOf(run(dry(4, 16), d))).toBe(0); // two mild days
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

describe("snow-cover days vary by winter", () => {
  it("mild and hard winters both occur, around 15–20 days on average", async () => {
    const { weatherAt } = await import("./weather");
    const falls: number[] = [];
    const days = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map((y) => {
      let cover = 0, fall = 0;
      for (let d = 0; d < 90; d++) {
        let c = false, f = false;
        for (let k = 0; k < 8; k++) { const t = Date.UTC(y, 11, 1) + d * 864e5 + k * 3 * 3600_000 + 5400_000; if (snowCover(t) > 0.05) c = true; if (weatherAt(t).kind === "snow") f = true; }
        if (c) cover++; if (f) fall++;
      }
      expect(cover).toBeLessThanOrEqual(fall); falls.push(fall); // snowfall days and lying-snow days are counted apart
      return cover;
    });
    const mean = days.reduce((a, b) => a + b, 0) / days.length;
    expect(mean).toBeGreaterThan(12); expect(mean).toBeLessThan(26);
    const fm = falls.reduce((a, b) => a + b, 0) / falls.length; // DWD Hamburg 1961–90: ~29 snowfall days Dec–Feb
    expect(fm).toBeGreaterThan(25); expect(fm).toBeLessThan(40);
    expect(Math.min(...days)).toBeLessThan(10); expect(Math.max(...days)).toBeGreaterThan(30);
  });
});
