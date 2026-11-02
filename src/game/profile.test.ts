import { describe, it, expect } from "vitest";
import { profileOf } from "./profile";
import type { Seed } from "./world";
const mk = (id: string, x: number, y: number): Seed => ({ id, name: id, owner: "o", x, y, hue: 0, created_at: new Date(Date.now() - 864e5).toISOString() });
describe("town profile", () => {
  it("compares only with another town, never with itself", () => {
    const a = mk("a", 0, 0), b = mk("b", 40, 10), now = Date.now();
    expect(profileOf(a, a, [a, b], now).vs).toBeNull();
    const v = profileOf(b, a, [a, b], now).vs!;
    expect(v.road).toBe(false);
    expect(v.gifts).toBe(0);
  });
});
