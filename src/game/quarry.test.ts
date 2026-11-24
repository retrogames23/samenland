import { describe, it, expect } from "vitest";
import {
  SPECIAL_KIND,
  QUARRY_BUILD,
  QUARRY_MARGIN,
  canPlaceSpecial,
  specialDone,
  specialSites,
  structureAt,
  effAgeBound,
  radiusOf,
  soloSeeds,
  townDist,
  MAP,
  type Seed,
} from "./world";
import { workDone } from "./time";
import { residentTax } from "./resident-tax";
import { resourceRates, STEINGRUBE } from "./resources";

// The Steingrube becomes a visible, placeable building (kind "quarry") in the normal purchase cycle. Price, wood, once
// and production stay with resources.ts / the DB guard; this file covers the map side.
const DAY = 864e5,
  H = 3.6e6;
const born = Date.parse("2026-10-01T08:00:00Z");
const mk = (id: string, bought: Seed["bought"] = []): Seed =>
  ({
    id,
    name: id,
    owner: id,
    x: 400,
    y: 512,
    hue: 0,
    realm: "lab",
    user_id: `u-${id}`,
    created_at: new Date(born).toISOString(),
    roads: [],
    bought,
  }) as Seed;
const tileOf = (s: Seed, kind: string) =>
  [...specialSites(s)].find(([, v]) => v.kind === kind)?.[0];

describe("Steingrube as building kind quarry", () => {
  it("is a bought building of its own kind", () => {
    expect(STEINGRUBE).toBe("steingrube");
    expect(SPECIAL_KIND[STEINGRUBE]).toBe("quarry");
  });

  it("placement follows only the general rules: reach, buildable land, free tile — no geology", () => {
    const s = mk("p"),
      now = born + 20 * DAY;
    // same answers as an ordinary small building with no placement rule of its own (herb hut) on every nearby tile
    for (let dy = -14; dy <= 14; dy++)
      for (let dx = -14; dx <= 14; dx++)
        expect(canPlaceSpecial(STEINGRUBE, s.x + dx, s.y + dy, s, [s], now), `${dx},${dy}`).toBe(
          canPlaceSpecial("herbs", s.x + dx, s.y + dy, s, [s], now),
        );
    expect(canPlaceSpecial(STEINGRUBE, s.x, s.y, s, [s], now)).toBe("taken");
    expect(canPlaceSpecial(STEINGRUBE, s.x + 40, s.y, s, [s], now)).toBe("far");
  });

  // bought at 11:00 game time: builders work by day (workClock), so the short site runs in one stretch
  it("a placed Steingrube stands where the player put it, after a short site phase", () => {
    const s0 = mk("q"),
      at = born + 20 * DAY + 1 * H,
      now = at;
    let spot: [number, number] | null = null;
    for (let d = 3; d < 8 && !spot; d++)
      for (let i = -d; i <= d && !spot; i++)
        if (canPlaceSpecial(STEINGRUBE, s0.x + i, s0.y + d, s0, [s0], now) === null)
          spot = [s0.x + i, s0.y + d];
    expect(spot).not.toBeNull();
    const s = mk("q", [{ item: STEINGRUBE, at, x: spot![0], y: spot![1] }]);
    expect(tileOf(s, "quarry")).toBe(spot![1] * MAP + spot![0]);
    const done = specialDone(s, [s], at, "quarry");
    expect(done).toBe(workDone(at, QUARRY_BUILD));
    expect(done).toBeLessThan(specialDone(s, [s], at)); // far shorter than an ordinary bought building
    const during = structureAt(spot![0], spot![1], [s], at + (done - at) / 2);
    expect(during?.kind).toBe("quarry");
    expect(during?.build).toBeGreaterThan(0);
    expect(during?.build).toBeLessThan(1);
    const after = structureAt(spot![0], spot![1], [s], done + 1000);
    expect(after?.kind).toBe("quarry");
    expect(after?.build).toBeUndefined();
  });

  it("gives no jobs, homes, prosperity or tax: resident tax equals the same village without it", () => {
    const at = born + 20 * DAY;
    // placed outside the town's possible reach, on free land
    const r = radiusOf(effAgeBound(mk("t"), soloSeeds(mk("t")), born + 200 * DAY)) + 3;
    const s = mk("t", [{ item: STEINGRUBE, at, x: 400 + Math.ceil(r), y: 512 }]),
      plain = mk("t");
    for (const d of [30, 60, 120])
      expect(residentTax(s, [s], born + d * DAY)).toEqual(
        residentTax(plain, [plain], born + d * DAY),
      );
  });

  it("production is unchanged and does not depend on the building's position", () => {
    expect(resourceRates(new Set([STEINGRUBE]), "workshop").stone.rate).toBe(4.5);
    expect(resourceRates(new Set([STEINGRUBE]), "gateway").stone.rate).toBe(1.5);
  });
});

describe("Steingruben bought before they had a place (0143, lab only)", () => {
  const at = born + 30 * DAY;
  it("stand on a free tile just outside the village as it could be at purchase time", () => {
    const s = mk("old", [{ item: STEINGRUBE, at }]);
    const k = tileOf(s, "quarry");
    expect(k).toBeDefined();
    const x = k! % MAP,
      y = Math.floor(k! / MAP);
    expect(townDist(x, y, s)).toBeGreaterThanOrEqual(
      radiusOf(effAgeBound(s, soloSeeds(s), at)) + 0.5 + QUARRY_MARGIN,
    );
    // nothing of the village stood there when it was bought
    expect(structureAt(x, y, [mk("old")], at)).toBeNull();
  });

  it("never displace a building bought later, placed or not", () => {
    const later = at + 5 * DAY;
    const ref = mk("old2", [
      { item: "herbs", at: later },
      { item: "woodcamp", at: later + DAY, x: 405, y: 515 },
    ]);
    const s = mk("old2", [{ item: STEINGRUBE, at }, ...ref.bought!]);
    const others = (m: Map<number, { kind: string }>) =>
      [...m].filter(([, v]) => v.kind !== "quarry");
    expect(others(specialSites(s))).toEqual(others(specialSites(ref)));
    expect([...specialSites(s)].filter(([, v]) => v.kind === "quarry")).toHaveLength(1);
  });

  it("only affected rows move: a placed Steingrube keeps its tile, villages without one are unchanged", () => {
    const placed = mk("pl", [
      { item: STEINGRUBE, at, x: 404, y: 516 },
      { item: "herbs", at: at + DAY },
    ]);
    expect(tileOf(placed, "quarry")).toBe(516 * MAP + 404);
    const none = mk("no", [
      { item: "herbs", at },
      { item: "woodcamp", at: at + DAY },
    ]);
    expect([...specialSites(none)].some(([, v]) => v.kind === "quarry")).toBe(false);
  });
});
