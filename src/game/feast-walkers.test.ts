import { describe, it, expect } from "vitest";
import { alongPath, pickStarSingers, starRound, oxWalk, martinWalk, herdsmanWalk } from "./feast-walkers";

describe("feast walkers", () => {
  it("star singers are three children aged 7-13, or nobody", () => {
    const kids = [{ id: 1, age: 5 }, { id: 2, age: 8 }, { id: 3, age: 12 }, { id: 4, age: 14 }, { id: 5, age: 9 }];
    const s = pickStarSingers(kids, 7);
    expect(s.sort()).toEqual([2, 3, 5]);
    expect(pickStarSingers(kids.slice(0, 3), 7)).toEqual([]);
  });
  it("door round visits at most 12 houses, deterministically", () => {
    const doors = Array.from({ length: 20 }, (_, i) => [i % 5, Math.floor(i / 5)] as [number, number]);
    expect(starRound(doors, 3)).toHaveLength(12);
    expect(starRound(doors, 3)).toEqual(starRound(doors, 3));
  });
  it("the ox only shows 9.5-18 h and stands by the tree after 11 h", () => {
    expect(oxWalk([[0, 0], [11, 0]], 9)).toBeNull();
    expect(oxWalk([[0, 0], [11, 0]], 18)).toBeNull();
    const w = oxWalk([[0, 0], [11, 0]], 12)!;
    expect(w.walking).toBe(false);
    expect(w.x).toBeCloseTo(11);
  });
  it("the herdsman walks ahead of the ox on the same path", () => {
    const P: [number, number][] = [[0, 0], [10, 0]];
    expect(herdsmanWalk(P, 10.2)!.x).toBeGreaterThan(oxWalk(P, 10.2)!.x);
    expect(herdsmanWalk(P, 18)).toBeNull();
  });
  it("St Martin rides 11.4-12.4 h and leaves at 17 h", () => {
    expect(martinWalk([[0, 0], [5, 5]], 11)).toBeNull();
    expect(martinWalk([[0, 0], [5, 5]], 12)!.walking).toBe(true);
    expect(martinWalk([[0, 0], [5, 5]], 17)).toBeNull();
  });
  it("path position is the same for the same hour", () => {
    expect(alongPath([[0, 0], [4, 0], [4, 4]], 1.5, 1, 2)).toEqual(alongPath([[0, 0], [4, 0], [4, 4]], 1.5, 1, 2));
  });
});
