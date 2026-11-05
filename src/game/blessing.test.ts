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
  it("can be repeated after the realm's midnight", () => {
    // 2026-10-01 20:00 UTC = 22:00 Berlin; midnight Berlin is 2 h later
    const ev = Date.parse("2026-10-01T20:00:00Z"), s = seed([ev]);
    expect(blessCooldown(s, ev + 3.6e6)).toBeCloseTo(3.6e6, -3);
    expect(blessCooldown(s, ev + 2.1 * 3.6e6)).toBe(0);
  });
});
