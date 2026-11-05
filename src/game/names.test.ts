import { describe, expect, it } from "vitest";
import { canPlant, MAP, type Seed } from "./world";
import { townOf } from "./people";
import { NAMES_F, NAMES_M } from "./names";

describe("names", () => {
  it("each pool covers a full Hansestadt (1500 citizens, half per sex)", () => {
    expect(new Set(NAMES_F).size).toBeGreaterThanOrEqual(750);
    expect(new Set(NAMES_M).size).toBeGreaterThanOrEqual(750);
  });
  it("no two villagers in one town share a first name", () => {
    let x = MAP / 2, y = MAP / 2;
    outer: for (let yy = MAP / 2; yy < MAP; yy += 3) for (let xx = MAP / 2; xx < MAP; xx += 3) if (canPlant(xx, yy, []) === null) { x = xx; y = yy; break outer; }
    const now = Date.UTC(2026, 9, 27, 12);
    const seed: Seed = { id: "names-seed", name: "N", owner: "T", x, y, hue: 40, created_at: new Date(now - 120 * 864e5).toISOString() };
    const firsts = townOf(seed, [seed], now).people.filter((p) => p.job !== "mayor").map((p) => p.first);
    expect(firsts.length).toBeGreaterThan(20);
    expect(new Set(firsts).size).toBe(firsts.length);
  });
});
