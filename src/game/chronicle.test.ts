import { describe, it, expect } from "vitest";
import { chronicle, CHRON_LETTER } from "./chronicle";
import type { Seed } from "./world";

const s: Seed = { id: "c1", name: "Test", owner: "o", x: 320, y: 440, hue: 30, created_at: "2026-01-01T00:00:00Z" };
const t0 = Date.parse(s.created_at);

describe("chronicle", () => {
  it("the scribe's letter opens after five days away", () => { expect(CHRON_LETTER).toBe(5 * 864e5); });
  it("reports the rise to Weiler and earned taler in the first weeks", () => {
    const c = chronicle(s, [s], t0, t0 + 30 * 864e5);
    expect(c.events.some((e) => e.code === "stage" && e.stage === 1)).toBe(true);
    expect(c.taler).toBeGreaterThan(0);
    expect(c.popTo).toBeGreaterThan(c.popFrom);
  });
});
