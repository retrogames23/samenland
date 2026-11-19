import { describe, it, expect, afterEach } from "vitest";
import { structureAt, pickCfg, clearStructureCaches, PICK_SLOTS, baseMemoCfg, type Seed } from "./world";
import { townTiles } from "./households";
import { rankInput } from "./rank";
import { seatFete, resetRankMemo } from "./people";

// P.10.5: distance prefilter (A) and multi-slot pick cache (B) against the previous paths, each alone and together.
const T0 = Date.parse("2026-01-01T00:00:00Z"), DAY = 864e5;
const care = ["fisher", "hunter", "granary", "herbs", "healer"].map((item) => ({ item, at: 0 }));
const mk = (id: string, x: number, y: number, partners: string[], extra: Partial<Seed> = {}): Seed => ({
  id, name: id, owner: id, x, y, hue: 0, created_at: new Date(T0).toISOString(), user_id: `u-${id}`,
  bought: care, roads: partners.map((target) => ({ target, at: T0 })), ...extra,
} as Seed);
const full = (partners: string[], day = 1): Partial<Seed> => ({
  votes: partners.map((partner) => ({ partner, pact: "trade", at: T0 + day * DAY })),
  works: partners.map((partner, i) => ({ partner, work: (["hall", "bridge", "tower"] as const)[i % 3], at: T0 + day * DAY })),
  blessed: Array.from({ length: 400 }, (_, i) => T0 + i * DAY + 3600e3),
} as unknown as Partial<Seed>);
const hubWorld = (): Seed[] => [
  mk("h", 320, 430, ["a", "b", "c"], full(["a", "b", "c"])),
  mk("a", 352, 440, ["h"], full(["h"])), mk("b", 300, 458, ["h"], full(["h"])),
  mk("c", 330, 398, ["h"], { created_at: new Date(T0 + 40 * DAY).toISOString(), ...full(["h"], 45) }),
  // late town with an older partner (mentoring), far pair elsewhere
  mk("m", 380, 470, ["a"], { created_at: new Date(T0 + 60 * DAY).toISOString() }),
  mk("x", 600, 300, ["y"]), mk("y", 640, 300, ["x"]),
];
const rnd = (n: number) => { let v = n; return () => (v = (v * 16807) % 2147483647) / 2147483647; };
const bigWorld = (): Seed[] => {
  const r = rnd(7), out: Seed[] = [];
  for (let i = 0; i < 24; i++) out.push(mk(`s${i}`, 150 + Math.floor(r() * 650), 150 + Math.floor(r() * 650), [],
    { created_at: new Date(T0 + Math.floor(r() * 90) * DAY).toISOString() }));
  for (const s of out) s.roads = out.filter((o) => o !== s && Math.hypot(o.x - s.x, o.y - s.y) < 90).map((o) => ({ target: o.id, at: T0 })) as NonNullable<Seed["roads"]>;
  return out;
};
const tt = (v: ReturnType<typeof townTiles>) => JSON.stringify({ ...v, byKind: [...v.byKind.entries()] }, (_k, x) => (x && typeof x === "object" && "created_at" in x ? x.id : x));
const copy = (w: Seed[]) => w.map((s) => ({ ...s }));
const snap = (seeds: Seed[], t: number, x0: number, y0: number, x1: number, y1: number) => {
  const out: string[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const v = structureAt(x, y, seeds, t);
    out.push(v ? `${v.kind}|${v.seed.id}|${v.v}|${v.build ?? ""}|${v.doneAt ?? ""}` : "");
  }
  return out;
};
type Mode = { distPre: boolean; slots: number };
const REF: Mode = { distPre: false, slots: 1 };
const run = <T>(m: Mode, f: () => T) => { pickCfg.distPre = m.distPre; pickCfg.slots = m.slots; clearStructureCaches(); resetRankMemo();
  try { return f(); } finally { pickCfg.distPre = true; pickCfg.slots = PICK_SLOTS; clearStructureCaches(); } };
afterEach(() => { pickCfg.distPre = true; pickCfg.slots = PICK_SLOTS; clearStructureCaches(); });
const MODES: [string, Mode][] = [["A", { distPre: true, slots: 1 }], ["B", { distPre: false, slots: PICK_SLOTS }], ["A+B", { distPre: true, slots: PICK_SLOTS }]];
const TIMES = [0.2, 5, 30, 61, 120, 400, 800].map((d) => T0 + d * DAY + 13 * 3.6e6);
const all = (W: Seed[], t: number) => JSON.stringify({
  st: snap(W, t, 260, 360, 420, 520), far: snap(W, t, 560, 260, 680, 340),
  tt: W.slice(0, 3).map((s) => tt(townTiles(s, W, t))), ri: W.slice(0, 3).map((s) => rankInput(s, W, t)) });

describe("P.10.5 equality", () => {
  for (const [name, m] of MODES) it(`${name}: structureAt/townTiles/rankInput identical (hub, big, reversed order)`, { timeout: 240000 }, () => {
    for (const make of [hubWorld, bigWorld, () => hubWorld().reverse()]) for (const t of TIMES) {
      const ref = run(REF, () => all(copy(make()), t));
      expect(run(m, () => all(copy(make()), t))).toBe(ref);
    }
  });
  for (const [name, m] of MODES) it(`${name}: seatFete identical`, { timeout: 240000 }, () => {
    for (const d of [3, 41, 160, 390]) for (const i of [0, 1]) {
      const t = T0 + d * DAY + 7 * 6e4;
      const ref = run(REF, () => { const W = hubWorld(); return JSON.stringify(seatFete(W[i]!, W, t)); });
      expect(run(m, () => { const W = hubWorld(); return JSON.stringify(seatFete(W[i]!, W, t)); })).toBe(ref);
    }
  });
  it("A: prefilter skips candidates and lowers effAgeBase work", () => {
    const t = T0 + 400 * DAY;
    const count = (m: Mode) => run(m, () => { baseMemoCfg.misses = 0; pickCfg.preSkips = 0; snap(bigWorld(), t, 150, 150, 800, 800); return { b: baseMemoCfg.misses, s: pickCfg.preSkips }; });
    const r = count(REF), a = count({ distPre: true, slots: 1 });
    expect(a.s).toBeGreaterThan(0); expect(a.b).toBeLessThanOrEqual(r.b);
  });
  it("B: historical times keep their grids; interleaved lookups rebuild nothing; arrays never share", () => {
    const W = hubWorld(); const ts = Array.from({ length: 11 }, (_, i) => T0 + 100 * DAY + i * 9e5);
    const builds = (m: Mode, src: Seed[]) => run(m, () => { const arr = copy(src); pickCfg.gridBuilds = 0; for (let k = 0; k < 3; k++) for (const t of ts) { clearStructureCaches(); structureAt(330, 440, arr, t); } return pickCfg.gridBuilds; });
    expect(builds({ distPre: true, slots: PICK_SLOTS }, W)).toBe(11);
    expect(builds(REF, W)).toBe(33);
    expect(builds({ distPre: true, slots: 4 }, W)).toBe(33); // eviction only costs time
    const n = run({ distPre: true, slots: PICK_SLOTS }, () => { pickCfg.gridBuilds = 0; structureAt(330, 440, W, ts[0]!); clearStructureCaches(); structureAt(330, 440, copy(W), ts[0]!); return pickCfg.gridBuilds; });
    expect(n).toBe(2);
  });
});
