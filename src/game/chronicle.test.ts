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

import { homesBetween, CHRON_DETAIL } from "./chronicle";
describe("small milestones", () => {
  it("lists finished homes with a family moving in", () => {
    const c = chronicle(s, [s], t0 + 20 * 864e5, t0 + 24 * 864e5);
    const homes = homesBetween(s, [s], t0 + 20 * 864e5, t0 + 24 * 864e5);
    if (homes.length <= CHRON_DETAIL) expect(c.events.filter((e) => e.code === "house").length).toBe(homes.length);
    else expect(c.events.some((e) => e.code === "houses")).toBe(true);
  });
  it("summarises more than six homes into one line", () => {
    const c = chronicle(s, [s], t0, t0 + 120 * 864e5);
    expect(c.events.filter((e) => e.code === "house").length).toBeLessThanOrEqual(CHRON_DETAIL);
  }, 20000);
});

describe("completion feasts", () => {
  const b = (item: string, d: number) => ({ item, at: t0 + d * 864e5 });
  it("treasury and guild upgrades never appear as finished buildings", () => {
    const v: Seed = { ...s, bought: [b("chest2", 1), b("rank2", 1)] };
    const c = chronicle(v, [v], t0, t0 + 3 * 864e5);
    expect(c.events.filter((e) => e.code === "bought").length).toBe(0);
  });
  it("a monument is celebrated once, only after its last step is built", () => {
    const part: Seed = { ...s, bought: [b("theater1", 1), b("theater2", 1.1)] };
    expect(chronicle(part, [part], t0, t0 + 6 * 864e5).events.filter((e) => e.code === "bought").length).toBe(0);
    const full: Seed = { ...s, bought: [b("theater1", 1), b("theater2", 1.1), b("theater3", 1.2)] };
    const ev = chronicle(full, [full], t0, t0 + 6 * 864e5).events.filter((e) => e.code === "bought");
    expect(ev.length).toBe(1);
    expect(ev[0]!.at).toBeGreaterThan(t0 + 1.2 * 864e5);
  });
});
