import { expect, test } from "vitest";
import { effAge, ageHours, TRADE_CAP, type Seed } from "./world";
import { farmShare } from "./people";

const E0 = Date.parse("2026-01-01T00:00:00Z");
const mk = (id: string, x: number, y: number): Seed => ({ id, name: id, owner: "L", hue: 1, x, y, created_at: new Date(E0).toISOString(), user_id: null } as Seed);

test("neighbour bonus adds at most 35% before twin bonus", () => {
  expect(TRADE_CAP).toBe(0.35);
  const seeds = [mk("a", 306, 420), mk("b", 343, 439), mk("c", 307, 460), mk("d", 343, 481)];
  const now = E0 + 3000 * 3.6e6;
  const base = ageHours(seeds[0]!, now);
  expect(effAge(seeds[0]!, seeds, now)).toBeLessThanOrEqual(base * 1.35 * 1.11);
});

test("cities farm less than villages", () => {
  expect(farmShare(10)).toBe(0.8);
  expect(farmShare(40)).toBe(0.25);
});
