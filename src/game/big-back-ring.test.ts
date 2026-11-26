import { describe, it, expect, beforeAll } from "vitest";
import {
  canPlaceSpecial,
  structureAt,
  onRoadCourseForTest,
  links,
  FOOT2_RING_BACK,
  type Seed,
} from "./world";
import { setRealm } from "./time";

// Gebbingen (europe, 25.11.): a Beginenhof was placed with a trade road and a farmhouse right behind its 2×2 footprint.
// The courtyard sprite paints most of its height over those tiles, so once finished it looked built over them.
// 2×2 ensembles now need the tiles right behind them free of houses and roads (code "ring"); the front stays usable.
const DAY = 864e5;
const born = Date.parse("2025-09-01T08:00:00Z"),
  now = born + 300 * DAY;
const mk = (
  id: string,
  x: number,
  y: number,
  roads: Seed["roads"] = [],
  bought: Seed["bought"] = [],
) =>
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
    bought,
  }) as Seed;
const agri = new Set(["field", "pasture", "garden"]);
const FRONT = [
  [1, -2],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-2, 1],
] as const;

describe("2×2 ensembles keep the tiles right behind them free", () => {
  beforeAll(() => setRealm("europe"));
  const A = mk("a", 420, 300, [{ target: "b", at: born + 5 * DAY }]),
    B = mk("b", 450, 304, [{ target: "a", at: born + 5 * DAY }]);
  const W = [A, B];
  const house = (x: number, y: number) => {
    const st = structureAt(x, y, W, now);
    return !!st && !agri.has(st.kind) && st.kind !== "square";
  };
  const spots = () => {
    const out: { x: number; y: number; code: string | null }[] = [];
    for (let dy = -12; dy <= 12; dy++)
      for (let dx = -12; dx <= 12; dx++)
        out.push({
          x: A.x + dx,
          y: A.y + dy,
          code: canPlaceSpecial("beginen", A.x + dx, A.y + dy, A, W, now),
        });
    return out;
  };

  it("refuses with 'ring' when a house stands right behind", () => {
    const hit = spots().filter(
      ({ x, y, code }) => code === "ring" && FOOT2_RING_BACK.some(([i, j]) => house(x + i, y + j)),
    );
    expect(hit.length).toBeGreaterThan(5);
  });

  it("refuses with 'ring' when only a decided, not yet built trade road runs right behind", () => {
    // decided two hours ago: the course is known but not built, so no structure marks it
    // young villages, so the course crosses open ground within reach
    const young = (id: string, x: number, y: number, roads: Seed["roads"] = []) => ({
      ...mk(id, x, y, roads),
      created_at: new Date(now - 60 * DAY).toISOString(),
    });
    const A3 = young("a", A.x, A.y, [{ target: "b", at: now - 7.2e6 }]),
      B3 = young("b", A.x + 24, A.y + 3),
      W3 = [A3, B3];
    const foot = [
      [0, 0],
      [-1, 0],
      [0, -1],
      [-1, -1],
    ] as const;
    let judged = 0;
    for (let dy = -12; dy <= 12; dy++)
      for (let dx = -12; dx <= 12; dx++) {
        const x = A.x + dx,
          y = A.y + dy;
        if (!FOOT2_RING_BACK.some(([i, j]) => onRoadCourseForTest(x + i, y + j, W3, now))) continue;
        if (foot.some(([i, j]) => onRoadCourseForTest(x + i, y + j, W3, now))) continue;
        const before = canPlaceSpecial("beginen", x, y, A3, [young("a", A.x, A.y), B3], now); // same village, no road decided
        if (before !== null) continue;
        // the built road ends may occupy the footprint itself: that stays "taken" / "road", not this rule
        if (
          foot.some(([i, j]) => {
            const st = structureAt(x + i, y + j, W3, now);
            return !!st && !agri.has(st.kind);
          })
        )
          continue;
        expect(canPlaceSpecial("beginen", x, y, A3, W3, now), `${x},${y}`).toBe("ring");
        judged++;
      }
    expect(judged).toBeGreaterThan(2);
  });

  it("every accepted spot has a free back ring; houses in front alone never refuse", () => {
    const all = spots();
    for (const { x, y, code } of all.filter((s) => s.code === null))
      for (const [i, j] of FOOT2_RING_BACK) {
        expect(house(x + i, y + j), `${x},${y} back ${i},${j}`).toBe(false);
        expect(onRoadCourseForTest(x + i, y + j, W, now)).toBe(false);
      }
    const frontOnly = all.filter(
      ({ x, y, code }) => code === null && FRONT.some(([i, j]) => house(x + i, y + j)),
    );
    expect(frontOnly.length).toBeGreaterThan(0);
  });

  it("plain (1×1) bought buildings are unaffected", () => {
    for (const { x, y } of spots())
      expect(canPlaceSpecial("herbs", x, y, A, W, now)).not.toBe("ring");
  });

  it("a Beginenhof moved right in front of its old site is not refused by its own old courtyard", () => {
    const placed = spots().find((s) => s.code === null)!;
    const A2 = mk("a", A.x, A.y, A.roads, [
      { item: "beginen", at: born + 100 * DAY, x: placed.x, y: placed.y },
    ]);
    const W2 = [A2, B];
    // new front tile two tiles in front: the old front/back tiles become its back ring
    for (const [dx, dy] of [
      [2, 0],
      [0, 2],
      [2, 2],
    ] as const)
      expect(canPlaceSpecial("beginen", placed.x + dx, placed.y + dy, A2, W2, now)).not.toBe(
        "ring",
      );
  });
});
