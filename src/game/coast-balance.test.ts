// Küsten-Balance: the coastal stretch (landShape k) must give a coastal town as much building land as an inland town of
// the same growth radius — no more (the legacy rule overshot on strongly coastal sites) and no less.
// Reproducible simulation: every site of a fixed grid over the real map, solo towns under identical conditions
// (same founding time, same purchases, same effective age). COAST_REPORT=<file> writes the table of docs/kuesten-balance.md.
import { expect, test } from "vitest";
import { writeFileSync } from "node:fs";
import { COAST_AREA_SINCE, COAST_K_MAX, buildable, coastAreaRule, coastLandShare, effAge, landShape, radiusOf, reachOf, terrain, townDist, MAP, type Seed } from "./world";
import { townCharacter } from "./character";
import { HOME_SIZES, foodCapacity, occupiedHomes, townTiles } from "./households";

const D = 864e5;
const OLD = Date.UTC(2026, 0, 1), NEW = COAST_AREA_SINCE + 30 * D;
const ITEMS = ["hunter", "fisher", "granary", "dairy", "markethall", "guildhall", "herbs", "healer", "badestube", "beginen", "library"];
const mk = (x: number, y: number, born: number): Seed => ({ id: `${born === OLD ? "o" : "n"}${x}_${y}`, name: "t", owner: "L", hue: 1, x, y, created_at: new Date(born).toISOString(), user_id: `u${x}_${y}`, bought: ITEMS.map((item) => ({ item, at: born })) } as unknown as Seed);
const legacyK = (x: number, y: number) => {
  let land = 0, tot = 0;
  for (let j = -16; j <= 16; j++) for (let i = -16; i <= 16; i++) { const d = Math.hypot(i, j); if (d > 16 || d < 1) continue; tot++; if (buildable(terrain(x + i, y + j))) land++; }
  const f = land / tot;
  return f < 0.9 ? Math.min(2.8, 1 + (0.9 - f) * 3.6) : 1;
};
type Site = { x: number; y: number; way: string; k0: number };
const SITES: Site[] = [];
for (let y = 60; y < MAP - 60; y += 23) for (let x = 60; x < MAP - 60; x += 23) {
  if (!buildable(terrain(x, y))) continue;
  const way = townCharacter({ x, y }).main;
  if (way !== "workshop") SITES.push({ x, y, way, k0: legacyK(x, y) });
}
const INLAND = SITES.filter((s) => s.way === "grain" && s.k0 === 1 && (s.x + s.y) % 3 === 0);   // Kornkammer, inland
const COAST = SITES.filter((s) => s.way === "gateway" && s.k0 >= 1.6);                           // Tor zur Welt, strongly coastal
const SHORE = SITES.filter((s) => s.k0 > 1 && s.k0 < 1.6);                                       // mildly coastal

type Row = { age: number; eff: number; k: number; land: number; homes: number; cap: number; hh: number; pop: number };
function sim(st: Site, born: number, effDays: number): Row {
  const s = mk(st.x, st.y, born), seeds = [s];
  let lo = born, hi = born + 400 * D;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (effAge(s, seeds, m) < effDays * 24) lo = m; else hi = m; }
  const now = hi, eff = effAge(s, seeds, now), rad = radiusOf(eff), R = Math.ceil(reachOf(s, rad)) + 2;
  let land = 0;
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (townDist(st.x + i, st.y + j, s) <= rad + 0.5 && buildable(terrain(st.x + i, st.y + j))) land++;
  const tt = townTiles(s, seeds, now);
  const homes = Object.keys(HOME_SIZES).reduce((a, kd) => a + (tt.byKind.get(kd as never)?.length ?? 0), 0);
  const hh = occupiedHomes(s, seeds, now, tt.byKind);
  return { age: (now - born) / D, eff: eff / 24, k: landShape(s).k, land, homes, cap: foodCapacity(s, tt.byKind, now, rad), hh: hh.length, pop: hh.reduce((a, h) => a + h.size, 0) };
}
const q = (v: number[], p: number) => [...v].sort((a, b) => a - b)[Math.min(v.length - 1, Math.floor(p * v.length))]!;
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const memo = new Map<string, Row[]>();
const run = (name: string, list: Site[], born: number, eff: number) => {
  const key = `${name}|${born}|${eff}`; let r = memo.get(key);
  if (!r) { r = list.map((s) => sim(s, born, eff)); memo.set(key, r); }
  return r;
};

test("the sample holds enough inland Kornkammern and coastal gateways", () => {
  expect(INLAND.length).toBeGreaterThan(200);
  expect(COAST.length).toBeGreaterThan(40);
  expect(SHORE.length).toBeGreaterThan(40);
});

test("standing towns keep their shape: founded before the cut-over, k is the legacy land-share stretch, unchanged", () => {
  expect(new Date(COAST_AREA_SINCE).toISOString()).toBe("2026-11-30T00:00:00.000Z");   // the shipped cut-over
  expect(coastAreaRule({ id: "a", x: 0, y: 0, created_at: "2026-11-29T23:59:59.999Z" })).toBe(false);
  expect(coastAreaRule({ id: "a", x: 0, y: 0, created_at: "2026-11-30T00:00:00.000Z" })).toBe(true);
  expect(coastAreaRule({ id: "a", x: 0, y: 0, created_at: new Date(COAST_AREA_SINCE - 1).toISOString() })).toBe(false);
  expect(coastAreaRule({ id: "a", x: 0, y: 0, created_at: new Date(COAST_AREA_SINCE).toISOString() })).toBe(true);
  expect(coastAreaRule({ id: "a", x: 0, y: 0 })).toBe(true);                       // a prospective site is a new foundation
  for (const st of [...COAST, ...SHORE, ...INLAND.slice(0, 20)]) expect(landShape(mk(st.x, st.y, OLD)).k, `${st.x},${st.y}`).toBe(st.k0);
  expect(landShape(mk(451, 129, OLD)).k).toBeCloseTo(2.69, 2);                     // pinned: one strongly coastal site
});

test("new foundations: the stretch is equal-area — as much building land as a full inland circle, never more than 3 % over", () => {
  let capped = 0;
  for (const st of [...COAST, ...SHORE]) {
    const { ux, uy, k } = landShape(mk(st.x, st.y, NEW));
    expect(k).toBeGreaterThanOrEqual(1);
    expect(k).toBeLessThanOrEqual(COAST_K_MAX);
    if (k === 1) { expect(coastLandShare(st.x, st.y, 1, 0, 1), `${st.x},${st.y}`).toBeGreaterThanOrEqual(1); continue; }
    const share = coastLandShare(st.x, st.y, ux, uy, k);
    if (k === COAST_K_MAX) { capped++; expect(share).toBeLessThanOrEqual(1.03); continue; }   // a spit of land: even the widest fan stays short
    expect(share, `${st.x},${st.y}`).toBeGreaterThanOrEqual(1);
    expect(share, `${st.x},${st.y}`).toBeLessThanOrEqual(1.03);
  }
  expect(capped).toBeLessThan((COAST.length + SHORE.length) * 0.1);
  // inland is untouched by the rule
  for (const st of INLAND.slice(0, 40)) expect(landShape(mk(st.x, st.y, NEW)).k).toBe(1);
});

const ratio = (g: Row[], inl: Row[], f: (r: Row) => number, p: number) => q(g.map(f), p) / q(inl.map(f), p);
test("new foundations: the stretch depends on the site alone — not on the village id, the founding day or the order of calls", () => {
  for (const st of [...COAST.slice(0, 12), ...SHORE.slice(0, 12)]) {
    const at = (id: string, born: number) => landShape({ id, x: st.x, y: st.y, created_at: new Date(born).toISOString() });
    const a = at("id-a", COAST_AREA_SINCE), b = at("id-b", COAST_AREA_SINCE + 400 * D), c = landShape({ id: "id-c", x: st.x, y: st.y });
    expect(b).toEqual(a);
    expect(c).toEqual(a);
    expect(at("id-a", COAST_AREA_SINCE)).toBe(a);                                    // cached, the same object
    // the legacy shape of the same site is its own cache entry: one village id can never read the other rule's shape
    expect(at("id-a", COAST_AREA_SINCE - 1).k).toBe(st.k0);
    expect(at("id-a", COAST_AREA_SINCE).k).toBe(a.k);
  }
});

test("the defect, measured on the legacy rule: strongly coastal sites hold clearly more building land and more people than inland", () => {
  for (const eff of [11, 16, 28]) {
    const inl = run("inland", INLAND, OLD, eff), co = run("coast", COAST, OLD, eff);
    expect(ratio(co, inl, (r) => r.land, 0.5), `land eff ${eff}`).toBeGreaterThan(1.1);
    expect(ratio(co, inl, (r) => r.pop, 0.9), `p90 eff ${eff}`).toBeGreaterThan(1.07);
  }
}, 300000);

test("new foundations: a coastal Tor zur Welt and an inland Kornkammer of the same effective age hold the same land and about the same people", () => {
  for (const eff of [11, 16, 28]) {
    const inl = run("inland", INLAND, NEW, eff), co = run("coast", COAST, NEW, eff), sh = run("shore", SHORE, NEW, eff);
    for (const [name, g] of [["coast", co], ["shore", sh]] as const) {
      const land = ratio(g, inl, (r) => r.land, 0.5);
      expect(land, `${name} land eff ${eff}`).toBeGreaterThan(0.97);
      expect(land, `${name} land eff ${eff}`).toBeLessThan(1.06);
      const med = ratio(g, inl, (r) => r.pop, 0.5);
      expect(med, `${name} median eff ${eff}`).toBeGreaterThan(0.94);
      expect(med, `${name} median eff ${eff}`).toBeLessThan(1.06);
      // the upper tail: within 8 % up to 16 days; at 28 days a rest of about 10 % remains (denser streets on a fanned
      // shape — docs/kuesten-balance.md), clearly below the legacy rule
      expect(ratio(g, inl, (r) => r.pop, 0.9), `${name} p90 eff ${eff}`).toBeLessThan(eff < 28 ? 1.08 : 1.12);
    }
    // the fix acts where the defect was: the strong coast's lead in the upper tail shrinks against the legacy rule
    const inl0 = run("inland", INLAND, OLD, eff), co0 = run("coast", COAST, OLD, eff);
    expect(ratio(co, inl, (r) => r.pop, 0.9)).toBeLessThan(ratio(co0, inl0, (r) => r.pop, 0.9) - 0.02);
    expect(ratio(co, inl, (r) => r.land, 0.5)).toBeLessThan(ratio(co0, inl0, (r) => r.land, 0.5) - 0.08);
    // identical conditions: the same effective age and the same food capacity for both characters
    expect(mean(co.map((r) => r.eff))).toBeCloseTo(mean(inl.map((r) => r.eff)), 1);
    expect(q(co.map((r) => r.cap), 0.5)).toBe(q(inl.map((r) => r.cap), 0.5));
  }
}, 600000);

test("report (COAST_REPORT=<file>)", () => {
  const file = process.env["COAST_REPORT"]; if (!file) return;
  const out: string[] = ["| effAge | Regel | Gruppe | n | Alter (Tage) | k | Bauland p50 | Häuser p50 | Nahrungskapazität p50 | Haushalte p50 | Bürger p10 / p50 / p90 / max |", "|---|---|---|---|---|---|---|---|---|---|---|"];
  for (const eff of [5, 11, 16, 28]) for (const [rule, born] of [["alt", OLD], ["neu", NEW]] as const)
    for (const [name, list] of [["Kornkammer Binnenland", INLAND], ["Tor zur Welt, starke Küste", COAST], ["leichte Küste", SHORE]] as const) {
      const r = run(name === "Kornkammer Binnenland" ? "inland" : name === "leichte Küste" ? "shore" : "coast", list, born, eff), p = r.map((x) => x.pop);
      out.push(`| ${eff} Tage | ${rule} | ${name} | ${r.length} | ${mean(r.map((x) => x.age)).toFixed(0)} | ${mean(r.map((x) => x.k)).toFixed(2)} | ${q(r.map((x) => x.land), 0.5)} | ${q(r.map((x) => x.homes), 0.5)} | ${q(r.map((x) => x.cap), 0.5)} | ${q(r.map((x) => x.hh), 0.5)} | ${q(p, 0.1)} / ${q(p, 0.5)} / ${q(p, 0.9)} / ${Math.max(...p)} |`);
    }
  writeFileSync(file, out.join("\n") + "\n");
}, 900000);
