import { describe, expect, it } from "vitest";
import { civicRoadsOf, type RoadRow } from "./civic-roads";
import { civicRoadsReference } from "./__ref/civic-roads-legacy";
import type { Seed } from "./world";

const H = 3.6e6, T0 = Date.parse("2026-11-01T00:00:00Z");
let rnd = 1; const r = () => ((rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648);
const seed = (i: number, x: number, y: number, age = 0): Seed => ({ id: `s${String(i).padStart(4, "0")}`, name: `n${i}`, owner: "o", hue: 0, x, y, created_at: new Date(T0 - age * H).toISOString() });
const row = (a: Seed, b: Seed, h: number): RoadRow => ({ seed_id: a.id, target_id: b.id, created_at: new Date(T0 + h * H).toISOString() });
const same = (seeds: Seed[], rows: RoadRow[]) => expect(civicRoadsOf(seeds, rows)).toEqual(civicRoadsReference(seeds, rows));
function world(n: number, roadShare: number, seedNo: number) {
  rnd = seedNo;
  const seeds = Array.from({ length: n }, (_, i) => seed(i, Math.floor(r() * 1000), Math.floor(r() * 1000), Math.floor(r() * 2000)));
  const rows: RoadRow[] = [];
  for (const a of seeds) if (r() < roadShare) for (let k = 1 + Math.floor(r() * 3); k--;) { const b = seeds[Math.floor(r() * n)]!; if (b !== a) rows.push(row(a, b, r() * 400 - 200)); }
  return { seeds, rows };
}
const shuffle = <T,>(a: T[]) => { const c = [...a]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [c[i], c[j]] = [c[j]!, c[i]!]; } return c; };

describe("civicRoadsOf equals the former all-pairs computation", () => {
  const [a, b, c] = [seed(1, 100, 100), seed(2, 130, 100, 500), seed(3, 160, 140, 90)];
  it("no decisions", () => { same([a, b, c], []); expect(civicRoadsOf([a, b, c], [])).toEqual([[], [], []]); });
  it("one side decided", () => same([a, b, c], [row(a, b, 0)]));
  it("both sides decided (joined, halves remaining time)", () => same([a, b, c], [row(a, b, 0), row(b, a, 2)]));
  it("both sides, late counter-decision", () => same([a, b, c], [row(a, b, 0), row(b, a, 500)]));
  it("several decisions of one village, also duplicates", () => same([a, b, c], [row(a, b, 5), row(a, c, 1), row(a, b, -3)]));
  it("unfinished (future) and finished roads", () => same([a, b, c], [row(a, b, 1e4), row(c, a, -1e4)]));
  it("targets outside the map and self-roads", () => same([a, b], [row(a, c, 0), row(a, a, 0)]));
  it("concrete timestamp: 30 tiles → 15 h", () => expect(civicRoadsOf([a, b], [row(a, b, 0)])).toEqual([[{ at: T0 + 15 * H }], [{ at: T0 + 15 * H }]]));
  it.each([2, 7, 30, 60, 92, 100, 250])("random world of %i villages, any input order", (n) => {
    for (let k = 0; k < 3; k++) {
      const w = world(n, 0.4, n * 7 + k);
      same(w.seeds, w.rows);
      same(shuffle(w.seeds), shuffle(w.rows));
    }
  });
});
