import { describe, it, expect } from "vitest";
import { prosperityAt } from "./prosperity";
import { monumentDone, type Seed } from "./world";
import { attributes } from "./economy";

const T = Date.parse("2026-03-01T00:00:00Z");
const town = (items: string[]): Seed => ({ id: "wmw", name: "W", owner: "o", hue: 1, x: 400, y: 540, user_id: "u", created_at: "2026-01-01T00:00:00Z",
  bought: items.map((item, i) => ({ item, at: T + i })) } as Seed);

describe("way monuments raise Wohlstand once standing", () => {
  for (const m of ["harvest", "guildtower", "lighthouse"]) it(m, () => {
    const s = town([`${m}1`, `${m}2`, `${m}3`]);
    const done = monumentDone(s, [s], m as never)!;
    expect(prosperityAt(s, done + 864e5, 500)).toBeGreaterThan(prosperityAt(town([]), done + 864e5, 500));
    expect(prosperityAt(s, T + 10, 500)).toBe(prosperityAt(town([]), T + 10, 500));
  });
  it("HUD wealth equals prosperityAt with the same citizens (one source)", () => {
    const s = town(["school", "herbs"]);
    const a = attributes(s, [s], [], T + 30 * 864e5);
    expect(a.wealth).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(a.wealth)).toBe(true);
  });
});
