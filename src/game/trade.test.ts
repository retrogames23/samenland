import { describe, it, expect } from "vitest";
import { complement, tradeFactor, matches, COMPLEMENT_MIN, COMPLEMENT_MAX, type Seed } from "./world";
const seed = (id: string, x: number, y: number, extra: Partial<Seed> = {}): Seed => ({ id, x, y, name: id, owner: "", created_at: "2026-01-01T00:00:00Z", ...extra }) as Seed;
describe("complementary trade", () => {
  it("same character gives 0.6", () => {
    const a = seed("a", 100, 100), b = seed("b", 100.4, 100);
    expect(matches(a, b)).toBe(0);
    expect(complement(a, b)).toBeCloseTo(COMPLEMENT_MIN);
  });
  it("factor stays within 0.6..1.5 without trade charter", () => {
    for (let i = 0; i < 40; i++) {
      const f = tradeFactor(seed("a", 20 + i * 9, 40), seed("b", 300 - i * 5, 200 + i * 3), Date.parse("2026-02-01T00:00:00Z"));
      expect(f).toBeGreaterThanOrEqual(COMPLEMENT_MIN); expect(f).toBeLessThanOrEqual(COMPLEMENT_MAX);
    }
  });
});
