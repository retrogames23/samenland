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
