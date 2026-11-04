import { describe, it, expect } from "vitest";
import { pondTiles, canPlaceSpecial, terrain, isWater, buildable, MAP, type Seed } from "./world";
const dry = () => { for (let y = 40; y < MAP - 40; y += 7) for (let x = 40; x < MAP - 40; x += 7) {
  let ok = buildable(terrain(x, y)) && terrain(x, y) !== "forest";
  for (let j = -3; j <= 3 && ok; j++) for (let i = -3; i <= 3; i++) if (isWater(terrain(x + i, y + j))) { ok = false; break; }
  if (ok) return [x, y] as const; } throw new Error("no dry tile"); };
describe("Karpfenteich", () => {
  it("a fishery away from water may be placed and digs a pond beside it", () => {
    const [x, y] = dry();
    const s = { id: "p1", x: x - 2, y, created_at: new Date(Date.now() - 864e5 * 30).toISOString(), user_id: "u", bought: [{ item: "fisher", at: 0, x, y }] } as unknown as Seed;
    expect(canPlaceSpecial("fisher", x, y, s, [s], Date.now())).not.toBe("shore");
    const p = [...pondTiles([s])];
    expect(p.length).toBe(1);
    expect(Math.abs((p[0]! % MAP) - x) + Math.abs(Math.floor(p[0]! / MAP) - y)).toBe(1);
  });
});
