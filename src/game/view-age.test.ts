import { describe, expect, it } from "vitest";
import { canPlant, effAge, viewAge, VIEW_AGE_STEP, structureAt, reachOf, radiusOf, landShape, MAP, type Seed, type Kind } from "./world";
import { townTiles } from "./households";

const NOW = Date.UTC(2026, 10, 8, 12, 0, 0);
const spot = (pred: (x: number, y: number) => boolean): [number, number] => {
  for (let y = 20; y < MAP - 20; y += 3) for (let x = 20; x < MAP - 20; x += 3) if (canPlant(x, y, []) === null && pred(x, y)) return [x, y];
  throw new Error("no spot");
};
const mk = (id: string, [x, y]: [number, number], days: number, extra: Partial<Seed> = {}): Seed =>
  ({ id, name: id, owner: "t", x, y, hue: 40, created_at: new Date(NOW - days * 864e5).toISOString(), ...extra });

/** The previous townTiles: full bounding-box scan, used as reference. */
function reference(s: Seed, seeds: Seed[], now: number) {
  const r = reachOf(s, radiusOf(effAge(s, seeds, now)));
  const x0 = Math.floor(s.x - r - 2), x1 = Math.ceil(s.x + r + 2), y0 = Math.floor(s.y - r - 2), y1 = Math.ceil(s.y + r + 2);
  const byKind = new Map<Kind, [number, number][]>(), sites: [number, number][] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const st = structureAt(x, y, seeds, now);
    if (!st || st.seed.id !== s.id) continue;
    if (st.build !== undefined) { sites.push([x, y]); continue; }
    const k = st.homeKind ?? st.kind; (byKind.get(k) ?? byKind.set(k, []).get(k)!).push([x, y]);
  }
  return { byKind, sites };
}
const flat = (m: Map<Kind, [number, number][]>) => [...m].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, v.map((t) => t.join(",")).join(" ")]);

describe("display-only view age", () => {
  const s = mk("va", spot(() => true), 120), seeds = [s];
  it("hits the same age for every frame inside one window", () => {
    const w = Math.floor(NOW / VIEW_AGE_STEP) * VIEW_AGE_STEP;
    expect(viewAge(s, seeds, w + 16)).toBe(viewAge(s, seeds, w + VIEW_AGE_STEP - 1));
    expect(viewAge(s, seeds, w + 500)).toBe(effAge(s, seeds, w));
  });
  it("moves on at the window boundary", () => {
    const w = Math.floor(NOW / VIEW_AGE_STEP) * VIEW_AGE_STEP;
    expect(viewAge(s, seeds, w + VIEW_AGE_STEP)).toBeGreaterThan(viewAge(s, seeds, w));
  });
  it("leaves the exact game age untouched", () => {
    expect(effAge(s, seeds, NOW + 777)).toBeGreaterThan(effAge(s, seeds, NOW));
  });
});

describe("townTiles circle pre-filter", () => {
  const inland = spot((x, y) => landShape({ id: "i", x, y }).k === 1);
  const coast = spot((x, y) => landShape({ id: "c", x, y }).k > 2.2);
  const cases: [string, Seed][] = [
    ["young inland", mk("i1", inland, 3)],
    ["grown inland", mk("i2", inland, 200)],
    ["young coast", mk("c1", coast, 5)],
    ["grown coast (high stretch)", mk("c2", coast, 300)],
    ["coast with bought sites", mk("c3", coast, 150, { bought: [{ item: "backhaus", at: NOW - 30 * 864e5 }, { item: "herberge", at: NOW - 2 * 3.6e6 }] } as Partial<Seed>)],
  ];
  for (const [name, s] of cases) it(`matches the full scan: ${name}`, () => {
    const a = townTiles(s, [s], NOW), b = reference(s, [s], NOW);
    expect(a.sites.map((t) => t.join(","))).toEqual(b.sites.map((t) => t.join(",")));
    expect(flat(a.byKind)).toEqual(flat(b.byKind));
  });
});
