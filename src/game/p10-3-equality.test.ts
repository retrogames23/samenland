import { describe, it, expect, afterEach } from "vitest";
import { links, effAge, effAgeBound, structureAt, twinSites, twinSiteGet, twinSince, pickCfg, clearStructureCaches, radiusOf, reachOf, MAP, type Seed } from "./world";
import { townTiles } from "./households";
import { rankInput } from "./rank";
import { seatFete } from "./people";

// P.10.3: optimised paths (effAgeBound grid, regional twin sites) against the previous reference paths.
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
  for (const s of out) s.roads = out.filter((o) => o !== s && Math.hypot(o.x - s.x, o.y - s.y) < 90).map((o) => ({ target: o.id, at: T0 })) as Seed["roads"];
  return out;
};
const copy = (w: Seed[]) => w.map((s) => ({ ...s }));
const snap = (seeds: Seed[], t: number, x0: number, y0: number, x1: number, y1: number) => {
  const out: string[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const v = structureAt(x, y, seeds, t);
    out.push(v ? `${v.kind}|${v.seed.id}|${v.v}|${v.build ?? ""}|${v.doneAt ?? ""}` : "");
  }
  return out;
};
const withRef = <T>(f: () => T) => { pickCfg.cheap = false; pickCfg.lazyTwin = false; clearStructureCaches(); try { return f(); } finally { pickCfg.cheap = true; pickCfg.lazyTwin = true; clearStructureCaches(); } };
afterEach(() => { pickCfg.cheap = true; pickCfg.lazyTwin = true; clearStructureCaches(); });

const TIMES = [5, 30, 61, 120, 400, 800].map((d) => T0 + d * DAY + 13 * 3.6e6);

describe("P.10.3 effAgeBound", () => {
  it("is never below effAge (hub with pacts, works, blessings, mentoring; random world)", () => {
    for (const w of [hubWorld(), bigWorld()]) for (let d = 1; d <= 1200; d += 11) {
      const t = T0 + d * DAY;
      for (const s of w) expect(effAgeBound(s, w, t), `${s.id} d${d}`).toBeGreaterThanOrEqual(effAge(s, w, t));
    }
  });
});

describe("P.10.3 structureAt / townTiles / rankInput equal to reference", () => {
  for (const [name, mkW] of [["hub", hubWorld], ["random", bigWorld]] as const) it(name, () => {
    const W = mkW();
    let twinned = 0;
    for (const t of TIMES) {
      if (links(W).some((l) => { const ts = twinSince(l, W); return ts !== null && t >= ts; })) twinned++;
      for (const s of W.slice(0, 8)) {
        if (t < Date.parse(s.created_at)) continue;
        const R = Math.ceil(reachOf(s, radiusOf(effAge(s, W, t)) + 0.5)) + 3;
        const box = [s.x - R, s.y - R, s.x + R, s.y + R] as const;
        const A = copy(W), B = copy(W);
        const ref = withRef(() => ({ st: snap(A, t, ...box), tt: JSON.stringify([...townTiles(s, A, t).tiles ?? []]), ri: JSON.stringify(rankInput(s, A, t)) }));
        const opt = { st: snap(B, t, ...box), tt: JSON.stringify([...townTiles(s, B, t).tiles ?? []]), ri: JSON.stringify(rankInput(s, B, t)) };
        expect(opt.st).toEqual(ref.st); expect(opt.tt).toBe(ref.tt); expect(opt.ri).toBe(ref.ri);
      }
    }
    if (name === "hub") expect(twinned).toBeGreaterThan(2);
  });
});

describe("P.10.3 regional twin sites equal the global twinSites map", () => {
  it("every global entry, plus a ring around every midpoint, at many times", () => {
    for (const mkW of [hubWorld, bigWorld]) for (let d = 1; d <= 900; d += 13) for (const hr of [10, 20]) {
      const W = mkW(), t = T0 + d * DAY + hr * 3.6e6, g = twinSites(W, t);
      const keys = new Set(g.keys());
      for (const l of links(W)) { const [x, y] = l.tiles[Math.floor(l.tiles.length / 2)]!; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) keys.add((y + dy) * MAP + x + dx); }
      for (const k of keys) { const a = g.get(k), b = twinSiteGet(k, W, t); expect(b ? `${b.kind}|${b.seed.id}` : "", `${k}`).toBe(a ? `${a.kind}|${a.seed.id}` : ""); }
    }
  });
});

describe("P.10.3 seatFete unchanged", () => {
  it("same result as reference paths over a day grid", { timeout: 180000 }, () => {
    const W = hubWorld();
    for (const d of [3, 41, 160, 390]) for (const s of W.slice(0, 2)) {
      const t = T0 + d * DAY;
      const A = copy(W), B = copy(W);
      const r = withRef(() => JSON.stringify(seatFete(s, A, t)));
      expect(JSON.stringify(seatFete(s, B, t))).toBe(r);
    }
  });
});
