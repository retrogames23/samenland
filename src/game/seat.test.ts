import { describe, it, expect } from "vitest";
import { structureAt, landmarkSpots, LANDMARKS, effAge, type Seed } from "./world";
import { townOf } from "./people";

const s = { id: "seat", name: "T", owner: "Anna", user_id: "u1", x: 520, y: 480, hue: 30, created_at: "2026-01-01T00:00:00Z" } as unknown as Seed;
/** Clock time at which the town reaches `h` effective growth hours. */
const at = (h: number) => { let lo = 0, hi = 1e6; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (effAge(s, [s], Date.parse(s.created_at) + m * 3.6e6) < h) lo = m; else hi = m; } return Date.parse(s.created_at) + hi * 3.6e6; };
const seatTile = () => {
  for (const [k, idx] of landmarkSpots(s)) if (idx.some((i) => LANDMARKS[i]!.kind === "seat1")) { const [dx, dy] = k.split(",").map(Number); return [s.x + dx!, s.y + dy!] as const; }
  throw new Error("no seat");
};

describe("mayor's seat", () => {
  it("is reserved from the start and grows with each era", () => {
    const [x, y] = seatTile();
    const kind = (h: number) => structureAt(x, y, [s], at(h))?.kind;
    expect(kind(10)).toBe("seat1");
    expect(kind(200)).toBe("seat2");
    expect(kind(2300)).toBe("seat3");
    expect(kind(4500)).toBe("townhall");
  });
  it("is where the mayor lives", () => {
    const [x, y] = seatTile();
    const me = townOf(s, [s], at(200)).people.find((p) => p.role === "mayor")!;
    expect(me.home).toEqual([x, y]);
  });
});
