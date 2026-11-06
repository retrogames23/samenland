import { describe, it, expect } from "vitest";
import { floods, floodLevel, floodFront, tileHits, FLOOD_LEN } from "./disasters";
import { type Seed } from "./world";

const DAY = 864e5, c0 = Date.parse("2026-01-01T00:00:00Z");
const river: Seed = { id: "dis1", name: "T", owner: "o", x: 354, y: 150, hue: 1, created_at: new Date(c0).toISOString() };
const f = [river, { ...river, id: "dis2" }, { ...river, id: "dis3" }].flatMap((s) => floods(s, c0 + 700 * DAY))[0]!;

describe("flood scene", () => {
  it("water rises after the flood starts and drains before it ends", () => {
    const t = f.tiles[0]!;
    expect(floodLevel(f, t, f.at - 1)).toBe(0);
    expect(floodLevel(f, t, f.at + 60e3)).toBeLessThan(floodLevel(f, t, f.at + FLOOD_LEN / 2));
    expect(floodLevel(f, t, f.at + FLOOD_LEN / 2)).toBe(1);
    expect(floodLevel(f, t, f.end - 60e3)).toBeLessThan(0.2);
    expect(floodLevel(f, t, f.end)).toBe(0);
  });
  it("the fascine wall lies only on dry tiles beside the water", () => {
    const { levee } = floodFront(f), wet = new Set(f.tiles);
    expect(levee.length).toBeGreaterThan(0);
    expect(levee.some((t) => wet.has(t))).toBe(false);
  });
  it("silt stays on flooded tiles after the water is gone", () => {
    const s = [river, { ...river, id: "dis2" }, { ...river, id: "dis3" }].find((x) => floods(x, c0 + 700 * DAY).some((g) => g.at === f.at))!;
    const m = tileHits(s, f.end + 3600e3);
    expect(f.tiles.some((t) => (m.get(t)?.silt ?? 0) > 0)).toBe(true);
  });
});
