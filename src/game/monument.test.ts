import { describe, expect, it } from "vitest";
import { MONUMENTS, MONUMENT_PRICE, MONUMENT_STAGE, nextMonumentStep, attributes } from "./economy";
import { monumentProgress, specialBuild, monumentOf, LANDMARKS, type Seed } from "./world";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const seed = (steps: number[]): Seed => ({ id: "m", name: "M", owner: "o", x: 500, y: 500, hue: 0, created_at: "2025-01-01T00:00:00Z",
  bought: steps.map((at, i) => ({ item: `belfry${i + 1}`, at })) });

describe("prestige belfry", () => {
  it("costs 400/500/600/700, 2200 in total", () => {
    expect(MONUMENTS.belfry.prices).toEqual([400, 500, 600, 700]);
    expect(MONUMENTS.belfry.prices.reduce((a, b) => a + b, 0)).toBe(2200);
  });
  it("unlocks from Kleinstadt (stage 3)", () => expect(MONUMENT_STAGE).toBe(3));
  it("steps are paid in order", () => {
    expect(nextMonumentStep([])).toBe("belfry1");
    expect(nextMonumentStep(["belfry1", "belfry2"])).toBe("belfry3");
    expect(nextMonumentStep(["belfry1", "belfry2", "belfry3", "belfry4"])).toBeNull();
  });
  it("each built step adds a quarter; only all four finish it", () => {
    const s1 = seed([T0]);
    expect(monumentProgress(s1, T0 + specialBuild(s1) * 10)).toBe(0.25);
    const s4 = seed([T0, T0 + 1e8, T0 + 2e8, T0 + 3e8]);
    expect(monumentProgress(s4, T0 + 3e8)).toBe(0.75);
    expect(monumentProgress(s4, T0 + 3e8 + specialBuild(s4))).toBe(1);
  });
});

describe("further prestige monuments", () => {
  it("cathedral: 5 steps of 800/1000/1200/1400/1600 from Handelsstadt", () => {
    expect(MONUMENTS.cathedral.prices).toEqual([800, 1000, 1200, 1400, 1600]);
    expect(MONUMENTS.cathedral.rank).toBe(4);
    expect(MONUMENT_PRICE["cathedral5"]).toBe(1600);
  });
  it("cathedral is no longer an automatic landmark", () => expect(LANDMARKS.some((l) => l.kind === "factory")).toBe(false));
  it("theater from Kleinstadt, opera from Metropole", () => {
    expect(MONUMENTS.theater.rank).toBe(3);
    expect(MONUMENTS.opera.rank).toBe(5);
  });
  it("university, exchange and orangery exist from Handelsstadt", () => {
    for (const k of ["university", "exchange", "orangery"] as const) expect(MONUMENTS[k].rank).toBe(4);
  });
  it("steps parse to their monument", () => {
    expect(monumentOf("opera4")).toBe("opera");
    expect(monumentOf("opera5")).toBeNull();
    expect(nextMonumentStep(["cathedral1"], "cathedral")).toBe("cathedral2");
  });
  it("a finished opera adds +25 prosperity, an unfinished one nothing", () => {
    const s: Seed = { id: "o", name: "O", owner: "o", x: 500, y: 500, hue: 0, created_at: "2025-01-01T00:00:00Z",
      bought: [1, 2, 3, 4].map((i) => ({ item: `opera${i}`, at: T0 + (i - 1) * 1e8 })) };
    const buys = (n: number) => [1, 2, 3, 4].slice(0, n).map((i) => ({ id: `${i}`, seed_id: "o", item: `opera${i}`, cost: 0, created_at: "" }));
    const done = T0 + 3e8 + specialBuild(s) * 2;
    const full = attributes(s, [s], buys(4), done).wealth;
    const none = attributes({ ...s, bought: [] }, [s], [], done).wealth;
    expect(full).toBeGreaterThan(none);
  });
});
