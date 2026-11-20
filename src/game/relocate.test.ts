import { describe, expect, it } from "vitest";
import { canPlant, MAP, structureAt, specialSites, SPECIAL_BUILD, type Seed } from "./world";
import { moveCost, moveBlock, canMoveTo, MOVE_COOLDOWN } from "./relocate";
import { goodSpots } from "./placement";

function spot(): [number, number] {
  for (let y = MAP / 2; y < MAP; y += 3) for (let x = MAP / 2; x < MAP; x += 3) if (canPlant(x, y, []) === null) return [x, y];
  throw new Error("no land");
}
const [sx, sy] = spot();
const NOW = new Date(2026, 9, 27, 11, 0, 0).getTime();
const H = 3600000, DAY = 24 * H;
const base: Seed = { id: "mv", name: "Umzug", owner: "T", x: sx, y: sy, hue: 40, created_at: new Date(NOW - 60 * DAY).toISOString() };

describe("relocation price by building size (Lübische Mark)", () => {
  it("small 20, medium 50, large 100, monument 150", () => {
    expect(moveCost("herbs")).toBe(20);
    expect(moveCost("backhaus")).toBe(50);
    expect(moveCost("school")).toBe(100);
    expect(moveCost("belfry1")).toBe(150);
    expect(moveCost("rank2")).toBeNull();
  });
});

describe("moving a bought building", () => {
  const bought = { item: "backhaus", at: NOW - 10 * DAY };
  const s0: Seed = { ...base, bought: [bought] };
  const [k0] = [...specialSites(s0).keys()];
  const ox = k0! % MAP, oy = Math.floor(k0! / MAP);
  const [nx, ny] = goodSpots("backhaus", s0, [s0], NOW, (x, y) => canMoveTo("backhaus", x, y, s0, [s0], NOW) === null)[0]!;
  const moveAt = NOW - H;
  const s1: Seed = { ...s0, moves: [{ item: "backhaus", x: nx, y: ny, at: moveAt, cost: 50 }] };

  it("before the move the building stands on its old spot only", () => {
    expect(structureAt(ox, oy, [s1], moveAt - 1)?.kind).toBe("backhaus");
    expect(structureAt(nx, ny, [s1], moveAt - 1)?.kind).not.toBe("backhaus");
  });
  it("after the move the old spot is free and the new spot is a building site, later finished", () => {
    expect(structureAt(ox, oy, [s1], NOW)?.kind).not.toBe("backhaus");
    expect(structureAt(nx, ny, [s1], NOW)?.kind).toBe("backhaus");
    expect(structureAt(nx, ny, [s1], NOW)?.build).toBeLessThan(1);
    expect(structureAt(nx, ny, [s1], NOW + 3 * SPECIAL_BUILD)?.build).toBeUndefined();
  });
  it("one move per building per week, one move at a time", () => {
    expect(moveBlock(s0, "backhaus", NOW)).toBeNull();
    expect(moveBlock(s1, "backhaus", NOW)).toBe("cooldown");
    expect(moveBlock(s1, "backhaus", moveAt + MOVE_COOLDOWN)).toBeNull();
  });
  it("a spot the building used before cannot be chosen again", () => {
    expect(canMoveTo("backhaus", ox, oy, s1, [s1], NOW)).toBe("taken");
  });
  it("an unfinished building cannot be moved", () => {
    expect(moveBlock({ ...base, bought: [{ item: "backhaus", at: NOW - H }] }, "backhaus", NOW)).toBe("unbuilt");
  });
});

import { treeGuard } from "./relocate";
describe("planted trees block building", () => {
  it("refuses a tile with a planted tree, passes others through", () => {
    const ok = () => null;
    const g = treeGuard(ok, [{ x: 351, y: 478 }]);
    expect(g("fireorder", 351, 478, {} as never, [], 0)).toBe("taken");
    expect(g("fireorder", 355, 481, {} as never, [], 0)).toBeNull();
  });
});
