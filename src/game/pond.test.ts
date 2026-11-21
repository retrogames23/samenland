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
  it("a moved fishery leaves no orphan pond at the old spot", () => {
    const NOW = Date.now(), at0 = NOW - 864e5 * 10, mvAt = NOW - 864e5 * 2;
    // two dry tiles a few steps apart; each needs its own pond (no water within two tiles, free neighbours)
    const clear = (cx: number, cy: number) => {
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (isWater(terrain(cx + i, cy + j))) return false;
      return [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([i, j]) => buildable(terrain(cx + i!, cy + j!)) && terrain(cx + i!, cy + j!) !== "forest");
    };
    let x = 0, y = 0, nx = 0;
    search: for (let yy = 40; yy < MAP - 40; yy += 7) for (let xx = 40; xx < MAP - 40; xx += 7) if (clear(xx, yy)) for (let d = 4; d <= 8; d++) if (clear(xx + d, yy)) { x = xx; y = yy; nx = xx + d; break search; }
    expect(nx).toBeGreaterThan(0);
    const base = { id: "p2", x: x - 2, y, created_at: new Date(NOW - 864e5 * 30).toISOString(), user_id: "u" };
    const before = { ...base, bought: [{ item: "fisher", at: at0, x, y }] } as unknown as Seed;
    const after = { ...before, moves: [{ item: "fisher", x: nx, y, at: mvAt, cost: 0 }] } as unknown as Seed;
    const old = pondTiles([before]);
    expect(old.size).toBe(1);
    const now = [...pondTiles([after])];
    expect(now.length).toBe(1);
    expect(old.has(now[0]!)).toBe(false);
    expect(Math.abs((now[0]! % MAP) - nx) + Math.abs(Math.floor(now[0]! / MAP) - y)).toBe(1);
  });
});
