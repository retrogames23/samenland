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
