import { describe, it, expect } from "vitest";
import { ensembleOver } from "./inspect";
import { structureAt } from "./world";

describe("2×2 ensemble sprite cover", () => {
  it("tiles behind a finished Beginenhof count as covered, far tiles not", () => {
    const now = Date.parse("2026-06-01T12:00:00Z"), at = now - 30 * 864e5;
    const s = { id: "t", name: "T", owner: "o", hue: 0, x: 600, y: 600, created_at: new Date(at - 864e5).toISOString(), bought: [{ item: "beginen", x: 606, y: 606, at }] };
    expect(structureAt(606, 606, [s], now)?.kind).toBe("beginenhof");
    expect(ensembleOver(603, 603, [s], now)).toBe(true);
    expect(ensembleOver(602, 604, [s], now)).toBe(true);
    expect(ensembleOver(598, 598, [s], now)).toBe(false);
  });
});
