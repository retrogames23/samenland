import { describe, it, expect } from "vitest";
import { raids, raidLoss, fires, floodFood, floods, nearRiver, RAID_LOSS } from "./disasters";
import { waterNearby, riverDistAt, MAP, type Seed } from "./world";

const DAY = 864e5, c0 = Date.parse("2026-01-01T00:00:00Z");
const base: Seed = { id: "dis1", name: "T", owner: "o", x: 400, y: 540, hue: 1, created_at: new Date(c0).toISOString() };

describe("disasters", () => {
  it("raids come at irregular gaps of 6–24 days with 12–45 Taler loot", () => {
    const u = { ...base, id: "9f3a12c4-0000-4000-8000-000000000000" };
    const r = raids(u, c0 + 365 * DAY);
    const gaps = r.slice(1).map((x, i) => (x.at - r[i]!.at) / DAY);
    expect(gaps.every((g) => g > 5 && g < 25)).toBe(true);
    expect(new Set(gaps.map(Math.round)).size).toBeGreaterThan(3);
    expect(r.every((x) => x.loss >= 12 && x.loss <= 45)).toBe(true);
    expect(raids(u, c0 + 9.9 * DAY)).toHaveLength(0);
  });
  it("a town guard bought before a raid catches the robber", () => {
    const u = { ...base, id: "9f3a12c4-0000-4000-8000-000000000000" };
    const at = raids(u, c0 + 365 * DAY)[1]!.at;
    const s = { ...u, bought: [{ item: "guard", at: at - 1 }] };
    expect(raids(s, c0 + 365 * DAY).slice(1).every((x) => x.caught && x.loss === 0)).toBe(true);
    expect(raids(s, c0 + 365 * DAY)[0]!.loss).toBeGreaterThan(0);
  });
  it("with a fire house no fire ever destroys houses for rebuilding", () => {
    const s = { ...base, bought: [{ item: "firehouse", at: c0 }] };
    expect(fires(s, c0 + 400 * DAY).every((f) => f.guarded && !f.dead)).toBe(true);
  });
  it("floods cost food while under water and bring richer harvests after", () => {
    const river = { ...base, x: 354, y: 150 };
    const wet = [river, { ...river, id: "dis2" }, { ...river, id: "dis3" }].flatMap((s) => floods(s, c0 + 700 * DAY).map((f) => [s, f] as const));
    expect(wet.length).toBeGreaterThan(0);
    for (const [s, f] of wet.slice(0, 3)) {
      expect(floodFood(s, f.at + 3600e3)).toBeLessThan(0);
      expect(floodFood(s, f.end + DAY)).toBeGreaterThan(0);
    }
  });
  it("a village founded near a river can flood", () => {
    expect(nearRiver({ ...base, x: 354, y: 150 })).toBe(true);
  });
  it("a village founded 24 tiles from a river floods once its outskirts reach the bank", () => {
    const far = { ...base, id: "a392", x: 392, y: 150 };
    expect(floods(far, c0 + 700 * DAY).length).toBeGreaterThan(0);
  });
  it("a sea-coast village only floods on river banks, never along the sea", () => {
    const coast = { ...base, x: 264, y: 150 };
    expect(waterNearby(coast.x, coast.y)).toBe(true);
    const tiles = floods(coast, c0 + 700 * DAY).flatMap((f) => f.tiles);
    expect(tiles.every((t) => riverDistAt(t % MAP, Math.floor(t / MAP)) < 2)).toBe(true);
  });
  it("a dry inland village never floods", () => {
    expect(floods(base, c0 + 700 * DAY)).toHaveLength(0);
  });
});
