import { describe, expect, it } from "vitest";
import { canPlant, MAP, type Seed } from "./world";
import { townPoses, townPosesSmooth, POSE_STEP } from "./people";

let sx = 0, sy = 0;
outer: for (let y = MAP / 2; y < MAP; y += 3) for (let x = MAP / 2; x < MAP; x += 3) if (canPlant(x, y, []) === null) { sx = x; sy = y; break outer; }
const NOW = Date.UTC(2026, 9, 27, 11, 0, 0);
const seed: Seed = { id: "smooth", name: "S", owner: "T", x: sx, y: sy, hue: 40, created_at: new Date(NOW - 60 * 864e5).toISOString() };
const seeds = [seed];

describe("smoothed villager poses", () => {
  it("match the exact poses at every recompute mark, so all clients still agree", () => {
    const t = Math.ceil(NOW / POSE_STEP) * POSE_STEP;
    const exact = townPoses(seed, seeds, t).map((q) => [q.p.id, q.x, q.y]);
    const smooth = townPosesSmooth(seed, seeds, t).map((q) => [q.p.id, q.x, q.y]);
    expect(smooth).toEqual(exact);
  });
  it("never place a walker further than one step from both neighbouring marks", () => {
    const t = Math.ceil(NOW / POSE_STEP) * POSE_STEP + POSE_STEP / 2;
    const a = new Map(townPoses(seed, seeds, t - POSE_STEP / 2).map((q) => [q.p.id, q]));
    for (const q of townPosesSmooth(seed, seeds, t)) {
      const r = a.get(q.p.id)!;
      expect(Math.abs(q.x - r.x) + Math.abs(q.y - r.y)).toBeLessThanOrEqual(1);
    }
  });
});
