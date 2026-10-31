import { describe, it, expect } from "vitest";
import { taxEarned, canBuy, attributes } from "./economy";
import { effAge, specialBuild, SPECIAL_BUILD, TIMBER_BUILD, sawmillUp, SAWMILL_AGE, type Seed } from "./world";
const base: Seed = { id: "a", name: "A", owner: "o", x: 400, y: 540, hue: 0, created_at: "2026-10-01T00:00:00Z" };
const NOW = Date.parse("2026-10-21T00:00:00Z");
describe("charter bonuses", () => {
  it("trade charter adds 15% taxes from sealing on", () => {
    const t = { ...base, charter: { path: "trade" as const, at: Date.parse("2026-10-02T00:00:00Z") } };
    expect(taxEarned(t, NOW)).toBeGreaterThan(taxEarned(base, NOW) * 1.1);
  });
  it("craft charter halves build time", () => {
    expect(specialBuild({ ...base, charter: { path: "craft", at: 0 } })).toBe(SPECIAL_BUILD / 2);
  });
  it("farm charter speeds growth", () => {
    const f = { ...base, charter: { path: "farm" as const, at: Date.parse("2026-10-02T00:00:00Z") } };
    expect(effAge(f, [f], NOW)).toBeGreaterThan(effAge(base, [base], NOW));
  });
  it("culture charter raises health", () => {
    const c = { ...base, charter: { path: "culture" as const, at: 0 } };
    expect(attributes(c, [c], [], NOW).health).toBe(attributes(base, [base], [], NOW).health + 15);
  });
  it("guild buildings need the matching charter", () => {
    expect(canBuy("dairy", "farm")).toBe(true);
    expect(canBuy("dairy", "trade")).toBe(false);
    expect(canBuy("dairy", undefined)).toBe(false);
    expect(canBuy("school", undefined)).toBe(true);
  });
});

describe("woodcutter's camp", () => {
  it("shortens build time by a quarter", () => {
    expect(specialBuild({ ...base, bought: [{ item: "woodcamp", at: 0 }] })).toBe(SPECIAL_BUILD * 0.75);
  });
});

describe("timber at hand", () => {
  it("own sawmill shortens bought builds by 15%", () => {
    expect(specialBuild(base, true)).toBeCloseTo(specialBuild(base) * 0.85);
    expect(TIMBER_BUILD).toBe(0.85);
  });
  it("sawmill stands once the town passes its landmark age", () => {
    expect(SAWMILL_AGE).toBe(2400);
    expect(sawmillUp(base, [base], NOW)).toBe(false);
  });
});
