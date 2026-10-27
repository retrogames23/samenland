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
