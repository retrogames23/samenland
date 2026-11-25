import { describe, it, expect } from "vitest";
import { canPlaceSpecial, links, onRoadCourseForTest, roadAtForTest, type Seed } from "./world";

// A bought building could be put on the course of a freshly decided trade road (the course shows only once built,
// from both ends to the middle) and later cut the finished road. Placing now refuses every tile of a decided course.
const DAY = 864e5,
  H = 3.6e6;
const born = Date.parse("2026-09-01T08:00:00Z");
const mk = (id: string, x: number, y: number, roads: Seed["roads"] = []) =>
  ({
    id,
    name: id,
    owner: id,
    x,
    y,
    hue: 0,
    realm: "europe",
    user_id: `u-${id}`,
    created_at: new Date(born).toISOString(),
    roads,
    bought: [],
  }) as Seed;

describe("bought buildings keep off a decided trade road", () => {
  const decided = born + 40 * DAY,
    now = decided + 2 * H; // road decided two hours ago: its middle is not built yet
  const A = mk("a", 400, 512, [{ target: "b", at: decided }]),
    B = mk("b", 430, 512);
  const A0 = mk("a", 400, 512),
    B0 = mk("b", 430, 512);
  const course = () => {
    const l = links([A, B]).find((k) => k.a.id === "a" || k.b.id === "a");
    expect(l).toBeDefined();
    return l!.tiles;
  };

  it("the road's middle is not built yet, but its course is known", () => {
    const tiles = course(),
      [mx, my] = tiles[Math.floor(tiles.length / 2)]!;
    expect(roadAtForTest(mx, my, [A, B], now)).toBeNull();
    expect(onRoadCourseForTest(mx, my, [A, B], now)).toBe(true);
    expect(onRoadCourseForTest(mx, my, [A, B], decided - 1)).toBe(false); // not before the decision
  });

  it("every course tile within reach is refused with 'road'; built or not", () => {
    let checked = 0;
    for (const [x, y] of course()) {
      const before = canPlaceSpecial("herbs", x, y, A0, [A0, B0], now);
      if (before === "far" || before === "ground" || Math.hypot(x - A.x, y - A.y) < 1) continue; // outside reach, water or the village centre: unchanged reason
      expect(canPlaceSpecial("herbs", x, y, A, [A, B], now), `${x},${y}`).toBe("road");
      checked++;
    }
    expect(checked).toBeGreaterThan(3);
  });

  it("2×2 buildings are refused when any of their four tiles lies on the course", () => {
    const tiles = course(),
      [x, y] = tiles[Math.floor(tiles.length / 3)]!;
    // put the front tile beside the course so that one of the back tiles (x−1 / y−1) hits it
    const hits = [
      [x + 1, y],
      [x, y + 1],
      [x + 1, y + 1],
    ].map(([fx, fy]) => canPlaceSpecial("woodcamp", fx!, fy!, A, [A, B], now));
    expect(hits).toContain("road");
  });

  it("every other tile keeps exactly the answer it had without the road decision", () => {
    for (let dy = -10; dy <= 10; dy++)
      for (let dx = -10; dx <= 10; dx++) {
        const x = 400 + dx,
          y = 512 + dy;
        if (onRoadCourseForTest(x, y, [A, B], now)) continue;
        const was = canPlaceSpecial("herbs", x, y, A0, [A0, B0], now),
          is = canPlaceSpecial("herbs", x, y, A, [A, B], now);
        if (was !== is) expect(is, `${dx},${dy}`).toBe("taken"); // only a now-built road tile may newly be occupied
      }
  });
});
