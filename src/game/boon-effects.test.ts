import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ENCOUNTERS, boonHours } from "./encounters";

// M1 Paket 2a (P2-E): DB boon_effects mirrors every growth answer of ENCOUNTERS exactly (growth share and hours).
type Fx = { h?: number; growth?: number };
const growth = Object.entries(
  ENCOUNTERS as unknown as Record<string, Record<string, { fx: Fx }>>,
).flatMap(([e, cs]) =>
  Object.entries(cs)
    .filter(([, o]) => o.fx.growth)
    .map(([c, o]) => ({ key: `${e}:${c}`, growth: o.fx.growth!, hours: o.fx.h! })),
);
const sql = readFileSync("drizzle/migrations/0139_boon_effects.sql", "utf8");
const db = new Map(
  [...sql.matchAll(/\('(\w+)', '(\w+)', ([\d.]+), (\d+)\)/g)].map((m) => [
    `${m[1]}:${m[2]}`,
    { growth: Number(m[3]), hours: Number(m[4]) },
  ]),
);

describe("boon_effects mirrors ENCOUNTERS", () => {
  it("the same eleven growth answers with the same share and duration", () => {
    expect(growth).toHaveLength(11);
    expect(db.size).toBe(growth.length);
    for (const g of growth)
      expect(db.get(g.key), g.key).toEqual({ growth: g.growth, hours: g.hours });
  });
  it("its window is exactly the one boonHours counts: from booking for `hours`", () => {
    const t0 = Date.UTC(2026, 5, 1),
      H = 3.6e6;
    for (const g of growth) {
      const [event, choice] = g.key.split(":") as [string, string];
      const d = [{ event, choice, cost: 0, at: t0 }];
      expect(boonHours(d, t0 + g.hours * H)).toBeCloseTo(g.growth * g.hours, 9);
      expect(boonHours(d, t0 + (g.hours + 10) * H)).toBeCloseTo(g.growth * g.hours, 9); // nothing after the end
    }
  });
});
