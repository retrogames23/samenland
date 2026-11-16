import { describe, it, expect } from "vitest";
import { structureAt, type Seed } from "./world";

const T0 = Date.parse("2026-10-29T00:00:00Z");
const DAY = 864e5;
const mk = (id: string, x: number, y: number, born: number) => ({ id, name: id, owner: "t", user_id: "u-" + id, x, y, hue: 0, realm: "europe", bought: [], created_at: new Date(born).toISOString() } as unknown as Seed);
const area = (cx: number, cy: number, r: number) => { const t: [number, number][] = []; for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) t.push([x, y]); return t; };

// Adversarial on purpose: distance 8 is far below canPlant()'s minimum of 40; it forces direct tile
// competition inside structureAt() independent of the founding guard.
// A at [572,630]; B founded 100 days later right at A's edge, close enough to win tiles if it counted early
const A = mk("hist-a", 572, 630, T0);
const BORN_B = T0 + 100 * DAY;
const B = mk("hist-b", 580, 630, BORN_B);

describe("Zukunftsdörfer wirken nicht zurück", () => {
  it("A: an unfounded village produces no structure of its own", () => {
    const now = BORN_B - DAY;
    let own = 0;
    for (const [x, y] of area(B.x, B.y, 3)) if (structureAt(x, y, [B], now)?.seed.id === B.id) own++;
    expect(own).toBe(0);
    expect(structureAt(B.x, B.y, [B], now)).toBeNull();
  });
  it("B: A's tiles are identical with and without the not-yet-founded B", () => {
    const now = T0 + 10 * DAY;
    const solo = [A], both = [A, B];
    let built = 0;
    for (const [x, y] of area(576, 630, 10)) {
      const a = structureAt(x, y, solo, now), ab = structureAt(x, y, both, now);
      expect(ab?.seed.id ?? null, `${x},${y}`).toBe(a?.seed.id ?? null);
      expect(ab?.kind ?? null, `${x},${y}`).toBe(a?.kind ?? null);
      if (a) built++;
    }
    expect(built).toBeGreaterThan(10);
  });
  it("C: at its founding moment B gets its usual campfire", () => {
    expect(structureAt(B.x, B.y, [B], BORN_B)?.kind).toBe("campfire");
    expect(structureAt(B.x, B.y, [A, B], BORN_B + 3600e3 * 24)?.seed.id).toBe(B.id);
  });
});
