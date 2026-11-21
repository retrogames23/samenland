import { describe, expect, it } from "vitest";
import { townOf, onFireTile } from "./people";
import { farmAnimalsAt } from "./animals";
import { terrain, type Seed } from "./world";

const E0 = Date.parse("2026-01-01T00:00:00Z"), day = 864e5;
const hamlet = (x: number, y: number, decisions: Seed["decisions"] = []): Seed =>
  ({ id: `h-${x}-${y}`, name: "h", owner: "L", hue: 1, x, y, created_at: new Date(E0).toISOString(), user_id: "u", decisions } as unknown as Seed);

describe("Dorfkuh und Hoftiere meiden Feuer", () => {
  it("a hamlet cow never stands on the campfire tile (x+1, y+1)", () => {
    const keep: Seed["decisions"] = [{ event: "cow", choice: "keep", at: E0 + day, cost: 0 }] as unknown as Seed["decisions"];
    let cowsSeen = 0;
    for (let i = 0; i < 40; i++) {
      const x = 200 + ((i * 37) % 200), y = 200 + ((i * 53) % 200);
      if (terrain(x, y) === "mountain" || terrain(x, y) === "water") continue;
      const s = hamlet(x, y, keep);
      const t = townOf(s, [s], E0 + 10 * day);
      for (const [cx, cy] of t.cows) {
        cowsSeen++;
        expect([cx, cy]).not.toEqual([x + 1, y + 1]);
        expect(onFireTile(cx, cy, [s], E0 + 10 * day)).toBe(false);
      }
    }
    expect(cowsSeen).toBeGreaterThan(0);
  });

  it("the campfire tile is a fire tile for every village", () => {
    const s = hamlet(300, 420);
    expect(onFireTile(301, 421, [s], E0 + day)).toBe(true);
    expect(onFireTile(305, 425, [s], E0 + day)).toBe(false);
  });

  it("farm animals are never placed on a fire tile", () => {
    // a shore village in spring: three farm animals stand in the window (measured with the same inputs)
    const s = hamlet(300, 420), now = Date.parse("2026-03-10T10:00:00Z");
    let found = 0;
    for (let y = 402; y <= 438; y++) for (let x = 282; x <= 318; x++) {
      if (farmAnimalsAt(x, y, [s], now) === null) continue;
      found++;
      expect(farmAnimalsAt(x, y, [s], now, undefined, () => true)).toBeNull();
    }
    expect(found).toBeGreaterThan(0);
  });
});
