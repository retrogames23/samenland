import { describe, expect, it } from "vitest";
import { MONUMENT_PRICE, MONUMENT_STAGE, nextMonumentStep } from "./economy";
import { monumentProgress, specialBuild, type Seed } from "./world";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const seed = (steps: number[]): Seed => ({ id: "m", name: "M", owner: "o", x: 500, y: 500, hue: 0, created_at: "2025-01-01T00:00:00Z",
  bought: steps.map((at, i) => ({ item: `belfry${i + 1}`, at })) });

describe("prestige belfry", () => {
  it("costs 400/500/600/700, 2200 in total", () => {
    expect(Object.values(MONUMENT_PRICE)).toEqual([400, 500, 600, 700]);
    expect(Object.values(MONUMENT_PRICE).reduce((a, b) => a + b, 0)).toBe(2200);
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
