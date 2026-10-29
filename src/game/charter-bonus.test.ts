import { describe, it, expect } from "vitest";
import { taxEarned, canBuy, attributes } from "./economy";
import { effAge, specialBuild, SPECIAL_BUILD, timberNear, TIMBER_BUILD, type Seed } from "./world";
const base: Seed = { id: "a", name: "A", owner: "o", x: 400, y: 540, hue: 0, created_at: "2026-10-01T00:00:00Z" };
const NOW = Date.parse("2026-10-21T00:00:00Z");
describe("charter bonuses", () => {
  it("trade charter adds 15% taxes from sealing on", () => {
    const t = { ...base, charter: { path: "trade" as const, at: Date.parse("2026-10-02T00:00:00Z") } };
    expect(taxEarned(t, NOW)).toBeGreaterThan(taxEarned(base, NOW) * 1.1);
  });
  it("craft charter halves build time", () => {
    expect(specialBuild({ ...base, charter: { path: "craft", at: 0 } })).toBe(SPECIAL_BUILD / 2 * (timberNear(base) ? TIMBER_BUILD : 1));
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
    expect(specialBuild({ ...base, bought: [{ item: "woodcamp", at: 0 }] })).toBe(SPECIAL_BUILD * 0.75 * (timberNear(base) ? TIMBER_BUILD : 1));
  });
});

describe("timber at hand", () => {
  it("forest nearby shortens bought builds by 15%", () => {
    expect(TIMBER_BUILD).toBe(0.85);
    let wooded: Seed | null = null, bare: Seed | null = null;
    for (let x = 20; x < 1000 && (!wooded || !bare); x += 7) {
      const s = { id: "t" + x, x, y: 400, created_at: new Date(0).toISOString() } as unknown as Seed;
      if (timberNear(s)) wooded ??= s; else bare ??= s;
    }
    expect(specialBuild(wooded!)).toBeCloseTo(specialBuild(bare!) * 0.85);
  });
});
