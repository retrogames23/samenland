import { describe, it, expect } from "vitest";
import { structureAt, type Seed } from "./world";

const start = Date.parse("2026-01-01T00:00:00Z"), day = 864e5;
const town = (id: string, x = 436, y = 124): Seed => ({ id, x, y, name: "Q", owner: "L", hue: 1, user_id: "u", created_at: new Date(start).toISOString(), bought: [] });
const kindsOf = (s: Seed, at: number) => {
  const out = new Map<string, string>();
  for (let y = s.y - 30; y <= s.y + 30; y++) for (let x = s.x - 30; x <= s.x + 30; x++) {
    const st = structureAt(x, y, [s], at);
    if (st && st.seed.id === s.id && st.build === undefined) out.set(`${x},${y}`, st.kind);
  }
  return out;
};
const tenements = (m: Map<string, string>) => [...m].filter(([, k]) => k === "tenement").map(([t]) => t.split(",").map(Number) as [number, number]);

describe("angle-free town quarters", () => {
  const s = town("quarters"), at = start + 730 * day;
  it("workers' rows lie in every compass direction, not one fixed sector", () => {
    const rows = tenements(kindsOf(s, at));
    expect(rows.length).toBeGreaterThan(10);
    const sides = new Set(rows.map(([x, y]) => (Math.abs(x - s.x) > Math.abs(y - s.y) ? (x > s.x ? "E" : "W") : (y > s.y ? "S" : "N"))));
    const land = new Set([...kindsOf(s, at).keys()].map(t => { const [x, y] = t.split(",").map(Number); return Math.abs(x! - s.x) > Math.abs(y! - s.y) ? (x! > s.x ? "E" : "W") : (y! > s.y ? "S" : "N"); }));
    expect(sides).toEqual(land);
  });
  it("a building keeps its quarter between simulation steps", () => {
    const a = kindsOf(s, at), b = kindsOf(s, at + 60_000);
    for (const [t, k] of a) if (b.has(t)) expect(b.get(t)).toBe(k);
  });
  it("different seeds give different but reproducible layouts", () => {
    const other = town("quarters-b");
    const a1 = tenements(kindsOf(s, at)).map(t => t.join(",")).sort();
    const a2 = tenements(kindsOf(town("quarters"), at)).map(t => t.join(",")).sort();
    const b = tenements(kindsOf(other, at)).map(t => t.join(",")).sort();
    expect(a2).toEqual(a1);
    expect(b).not.toEqual(a1);
  });
});
