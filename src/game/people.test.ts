import { describe, expect, it } from "vitest";
import { canPlant, MAP, type Seed } from "./world";
import { townOf, poseOf } from "./people";

function spot(): [number, number] {
  for (let y = MAP / 2; y < MAP; y += 3) for (let x = MAP / 2; x < MAP; x += 3) if (canPlant(x, y, []) === null) return [x, y];
  throw new Error("no land");
}
const [sx, sy] = spot();
const NOW = new Date(2026, 9, 27, 3, 0, 0).getTime(); // 03:00 local
const seed: Seed = { id: "test-seed", name: "Testdorf", owner: "T", x: sx, y: sy, hue: 40, created_at: new Date(NOW - 20 * 864e5).toISOString() };

describe("villagers", () => {
  it("the same seed and time always give the same residents", () => {
    const a = townOf(seed, [seed], NOW).people.map((p) => `${p.first} ${p.last} ${p.age} ${p.job}`);
    const b = townOf({ ...seed }, [{ ...seed }], NOW + 60001).people.map((p) => `${p.first} ${p.last} ${p.age} ${p.job}`);
    expect(a.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
  });
  it("nobody is outside at 3 in the night", () => {
    const t = townOf(seed, [seed], NOW);
    expect(t.people.filter((p) => poseOf(p, t, [seed], NOW).visible)).toHaveLength(0);
  });
  it("children never get an adult job", () => {
    for (const p of townOf(seed, [seed], NOW).people) if (p.age < 16) expect(p.job).toBe("child");
  });
});

import { structureAt, FLAT } from "./world";
describe("villager collision", () => {
  it("visible villagers never stand inside a building during a whole day", () => {
    const old: Seed = { ...seed, id: "coll", created_at: new Date(NOW - 400 * 864e5).toISOString() };
    let checked = 0;
    for (let m = 0; m < 24 * 60; m += 7) {
      const now = NOW + m * 60000, t = townOf(old, [old], now);
      for (const p of t.people) {
        const q = poseOf(p, t, [old], now);
        if (!q.visible) continue;
        const st = structureAt(Math.round(q.x), Math.round(q.y), [old], now);
        checked++;
        if (st) expect(FLAT.has(st.kind) || ["path", "street", "square", "well", "market", "road", "bridge"].includes(st.kind), `${p.first} in ${st.kind}`).toBe(true);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
