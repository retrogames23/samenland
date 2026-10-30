import { test } from "vitest";
import { townOf } from "./people";
import { structureAt, type Seed } from "./world";
const E0 = Date.parse("2026-01-01T00:00:00Z");
test("x", () => {
  for (const [x,y] of [[306,420],[343,439]]) {
  const s = { id: "a"+x, name: "a", owner: "L", hue: 1, x, y, created_at: new Date(E0).toISOString(), user_id: null } as Seed;
  for (const d of [3, 10, 30, 90, 200, 400, 700]) {
    const now = E0 + d * 864e5, t = townOf(s, [s], now), c: Record<string, number> = {};
    for (let yy = y - 40; yy <= y + 40; yy++) for (let xx = x - 40; xx <= x + 40; xx++) { const st = structureAt(xx, yy, [s], now); if (st && st.seed.id === s.id) c[st.kind] = (c[st.kind] ?? 0) + 1; }
    const hh = new Set(t.people.map(p => p.hh)).size;
    console.log(x, d, "pop", t.people.length, "hh", hh, JSON.stringify(c));
  }}
});
