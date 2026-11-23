import { describe, it, expect, afterEach } from "vitest";
import { setRealm } from "./time";
import { canPlaceSpecial, terrain, isWater, buildable, MAP, type Seed } from "./world";

// Eschental on Störwerder (europe-3) is surrounded by sea, yet the fisher's hut could be put in the middle of the rye:
// the carp pond exception was checked per tile. A pond is now only the fallback for villages without any shore spot.
afterEach(() => setRealm("europe"));
const born = Date.now() - 864e5 * 30;
const mk = (id: string, x: number, y: number) =>
  ({
    id,
    name: id,
    owner: id,
    x,
    y,
    hue: 0,
    user_id: `u-${id}`,
    created_at: new Date(born).toISOString(),
    roads: [],
  }) as unknown as Seed;
const wetNear = (x: number, y: number, r: number) => {
  for (let j = -r; j <= r; j++)
    for (let i = -r; i <= r; i++) if (isWater(terrain(x + i, y + j))) return true;
  return false;
};

describe("fisher's hut: shore first, carp pond only without a shore spot", () => {
  it("Eschental: inland tiles are refused with 'shore', a shore tile is accepted", () => {
    setRealm("europe-3");
    const s = { ...mk("esch", 402, 498), realm: "europe-3" } as Seed,
      now = Date.now();
    let inland: [number, number] | null = null,
      shore: [number, number] | null = null;
    for (let dy = -6; dy <= 6; dy++)
      for (let dx = -6; dx <= 6; dx++) {
        const x = s.x + dx,
          y = s.y + dy;
        if (!buildable(terrain(x, y)) || Math.hypot(dx, dy) < 1.5) continue;
        if (
          !wetNear(x, y, 2) &&
          !inland &&
          [null, "shore"].includes(canPlaceSpecial("fisher", x, y, s, [s], now))
        )
          inland = [x, y];
      }
    for (let r = 1; r <= 20 && !shore; r++)
      for (let dy = -r; dy <= r && !shore; dy++)
        for (let dx = -r; dx <= r && !shore; dx++) {
          const x = s.x + dx,
            y = s.y + dy;
          if (wetNear(x, y, 2) && canPlaceSpecial("fisher", x, y, s, [s], now) === null)
            shore = [x, y];
        }
    expect(inland).not.toBeNull();
    expect(shore).not.toBeNull();
    expect(canPlaceSpecial("fisher", inland![0], inland![1], s, [s], now)).toBe("shore");
  });

  it("a village with no water in the hut's reach may still dig a carp pond", () => {
    let found: Seed | null = null;
    for (let y = 60; y < MAP - 60 && !found; y += 9)
      for (let x = 60; x < MAP - 60 && !found; x += 9) {
        if (!buildable(terrain(x, y)) || wetNear(x, y, 34)) continue;
        found = mk("dry", x, y);
      }
    expect(found).not.toBeNull();
    const s = found!,
      now = Date.now();
    let ok = false;
    for (let dy = -10; dy <= 10 && !ok; dy++)
      for (let dx = -10; dx <= 10 && !ok; dx++)
        if (
          Math.hypot(dx, dy) >= 1.5 &&
          canPlaceSpecial("fisher", s.x + dx, s.y + dy, s, [s], now) === null
        )
          ok = true;
    expect(ok).toBe(true);
  });
});
