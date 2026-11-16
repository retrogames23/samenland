import { describe, expect, it } from "vitest";
import { links, linksReference, nearPairs, nearPairsNaive, TRADE_DIST, MAP, type Seed } from "./world";

// Equivalence of the spatial-grid pair scan in links() with the naive all-pairs reference.
const mk = (id: string, x: number, y: number, o: Partial<Seed> = {}) =>
  ({ id, name: id, owner: "t", user_id: null, x, y, hue: 0, realm: "europe", bought: [], created_at: "2026-01-01T00:00:00.000Z", ...o } as unknown as Seed);
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
const same = (s: Seed[]) => expect(nearPairs(s)).toEqual(nearPairsNaive(s));
const snap = (ls: ReturnType<typeof links>) => ls.map((l) => ({ a: l.a.id, b: l.b.id, d: l.d, since: l.since, baseBuild: l.baseBuild, joinAt: l.joinAt, doneAt: l.doneAt, tiles: l.tiles, water: l.water }));

describe("nearPairs equals the naive scan", () => {
  it("1000 synthetic towns (deterministic)", () => { const r = rng(7); same(Array.from({ length: 1000 }, (_, i) => mk("s" + i, Math.floor(r() * MAP), Math.floor(r() * MAP)))); });
  it("2500 synthetic towns", () => { const r = rng(11); same(Array.from({ length: 2500 }, (_, i) => mk("s" + i, Math.floor(r() * MAP), Math.floor(r() * MAP)))); });
  it("exactly on, just below and just above TRADE_DIST", () => {
    const s = [mk("a", 200, 200), mk("on", 200 + TRADE_DIST, 200), mk("below", 200, 200 + TRADE_DIST - 0.001), mk("above", 200 - TRADE_DIST - 0.001, 200), mk("diag", 200 + 72, 200 + 96)];
    const p = nearPairs(s); same(s);
    expect(p).toContainEqual([0, 1]); expect(p).toContainEqual([0, 2]); expect(p).toContainEqual([0, 4]); expect(p).not.toContainEqual([0, 3]);
  });
  it("both sides of a cell border, integer and negative cell coordinates", () => {
    const C = TRADE_DIST;
    same([mk("l", C - 0.1, C), mk("r", C + 0.1, C), mk("e", C, C), mk("e2", 2 * C, 2 * C), mk("n", -5, -5), mk("n2", 3, -C - 1), mk("n3", -C, 0)]);
    expect(nearPairs([mk("l", C - 0.1, C), mk("r", C + 0.1, C)])).toEqual([[0, 1]]);
  });
  it("many towns in one cell and a very uneven distribution", () => {
    const r = rng(3);
    const s = [...Array.from({ length: 400 }, (_, i) => mk("c" + i, 500 + r() * 30, 500 + r() * 30)), ...Array.from({ length: 50 }, (_, i) => mk("w" + i, r() * MAP, r() * MAP)), ...Array.from({ length: 200 }, (_, i) => mk("k" + i, 10 + r() * 5, 900 + r() * 200))];
    same(s);
  });
});

describe("links() equals the naive reference", () => {
  const t0 = Date.parse("2026-03-01T00:00:00Z"), h = 3.6e6;
  const base = (): Seed[] => [
    mk("A", 300, 400), mk("B", 340, 410), mk("C", 380, 430), mk("D", 330, 470),
    mk("P1", 360, 380, { user_id: "u1", roads: [{ target: "A", at: t0 }, { target: "B", at: t0 + 2 * h }] } as Partial<Seed>),
    mk("P2", 400, 400, { user_id: "u2", roads: [{ target: "P1", at: t0 + 5 * h }] } as Partial<Seed>),
    mk("P3", 420, 450, { user_id: "u3" }),
    mk("P4", 450, 420, { user_id: "u4", roads: [{ target: "P2", at: t0 }] } as Partial<Seed>),
    mk("Far", 900, 900),
  ];
  it("sample and player villages with mixed road decisions, incl. P2 kinetics", () => {
    const s = base();
    // P2 counter-decision while P4's road is being built: joinAt/doneAt must match
    (s[5] as { roads: unknown[] }).roads.push({ target: "P4", at: t0 + h });
    const got = snap(links(s)), ref = snap(linksReference(s));
    expect(got).toEqual(ref);
    expect(got.length).toBeGreaterThan(0);
    expect(got.some((l) => l.joinAt !== undefined)).toBe(true);
  });
  it("representative synthetic map (120 towns, mostly sample villages)", () => {
    const r = rng(42);
    const s = Array.from({ length: 120 }, (_, i) => mk("m" + i, 150 + Math.floor(r() * 700), 150 + Math.floor(r() * 700), i % 4 ? {} : { user_id: "u" + i } as Partial<Seed>));
    expect(snap(links(s))).toEqual(snap(linksReference(s)));
  }, 120_000);
});

describe("performance (measured, logged)", () => {
  it.each([1000, 2500])("%i towns", (n) => {
    const r = rng(n); const s = Array.from({ length: n }, (_, i) => mk("s" + i, Math.floor(r() * MAP), Math.floor(r() * MAP)));
    const sn = { checks: 0 }, sg = { checks: 0 };
    let t = performance.now(); const a = nearPairsNaive(s, sn); const tn = performance.now() - t;
    t = performance.now(); const b = nearPairs(s, sg); const tg = performance.now() - t;
    expect(b).toEqual(a);
    expect(sg.checks).toBeLessThan(sn.checks);
    console.log(`[perf] n=${n} MAP=${MAP} naive checks=${sn.checks} ${tn.toFixed(1)}ms | grid checks=${sg.checks} ${tg.toFixed(1)}ms | pairs=${a.length}`);
  });
});
