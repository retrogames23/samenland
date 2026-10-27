import { describe, it, expect } from "vitest";
import { blessHours, isBlessed, blessCooldown, type Seed } from "./world";

const t0 = Date.parse("2026-10-01T00:00:00Z");
const seed = (blessed: number[]): Seed => ({ id: "a", name: "A", owner: "o", x: 10, y: 10, hue: 0, created_at: "2026-09-01T00:00:00Z", blessed });

describe("daily blessing", () => {
  it("gives +10 % growth for exactly 24 hours", () => {
    const s = seed([t0]);
    expect(blessHours(s, t0 + 12 * 3.6e6)).toBeCloseTo(1.2);
    expect(blessHours(s, t0 + 48 * 3.6e6)).toBeCloseTo(2.4);
    expect(isBlessed(s, t0 + 23 * 3.6e6)).toBe(true);
    expect(isBlessed(s, t0 + 25 * 3.6e6)).toBe(false);
  });
  it("can be repeated once per day", () => {
    const s = seed([t0]);
    expect(blessCooldown(s, t0 + 20 * 3.6e6)).toBeCloseTo(4 * 3.6e6);
    expect(blessCooldown(s, t0 + 24 * 3.6e6)).toBe(0);
  });
});
