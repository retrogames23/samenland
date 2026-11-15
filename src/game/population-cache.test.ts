import { describe, expect, it, vi } from "vitest";
import type { Seed } from "./world";

/** Cache chain regression (Dinkelwinkel 124 vs 189): cached results must equal a fresh module state for the same inputs. */
const NOW = Date.parse("2026-11-15T12:00:00Z");
const H = 3.6e6;
const base = (extra: Partial<Seed> = {}): Seed => ({ id: "dk", name: "D", owner: "o", user_id: "u", x: 354, y: 480, hue: 30,
  created_at: new Date(NOW - 682 * H).toISOString(), bought: [{ item: "hunter", at: NOW - 600 * H }, { item: "herbs", at: NOW - 590 * H }], ...extra });
const nb = (extra: Partial<Seed> = {}): Seed => ({ id: "nb", name: "N", owner: "n", user_id: "n", x: 380, y: 480, hue: 90, created_at: new Date(NOW - 900 * H).toISOString(), ...extra });
const DEC = [{ event: "wedding", choice: "feast", cost: 60, at: NOW - 300 * H }, { event: "monk", choice: "copy", cost: 45, at: NOW - 200 * H }];

type Mods = { w: typeof import("./world"); p: typeof import("./people"); h: typeof import("./households"); r: typeof import("./rank") };
const load = async (): Promise<Mods> => ({ w: await import("./world"), p: await import("./people"), h: await import("./households"), r: await import("./rank") });
const snap = (m: Mods, seeds: Seed[]) => {
  const s = seeds[0]!, t = m.p.townOf(s, seeds, NOW), cz = m.p.citizensOf(t);
  const kinds = [...m.h.townTiles(s, seeds, NOW).byKind].map(([k, v]) => `${k}:${v.length}`).sort().join(",");
  return { age: m.w.effAge(s, seeds, NOW), citizens: cz.length, homes: m.h.householdsOf(s, seeds, NOW).length, kinds, rank: m.r.rankInput(s, seeds, NOW).citizens };
};
const fresh = async (seeds: Seed[]) => { vi.resetModules(); return snap(await load(), seeds); };
/** warm the module caches with state A, then compute B in the same modules; B must equal a fresh computation of B */
async function cachedVsFresh(a: Seed[], b: Seed[]) {
  vi.resetModules(); const m = await load();
  const sa = snap(m, a); const sb = snap(m, b);
  return { sa, sb, fb: await fresh(b) };
}

describe("population cache chain", () => {
  it("A: late-loaded encounter decisions invalidate townOf/structureAt", async () => {
    const { sa, sb, fb } = await cachedVsFresh([base(), nb()], [base({ decisions: DEC }), nb()]);
    expect(sb.age).toBeGreaterThan(sa.age);
    expect(sb).toEqual(fb);
  });
  it("B: same decision count, different content", async () => {
    const other = [{ ...DEC[0]!, choice: "quiet" }, { ...DEC[1]!, at: DEC[1]!.at + H }];
    const { sb, fb } = await cachedVsFresh([base({ decisions: other }), nb()], [base({ decisions: DEC }), nb()]);
    expect(sb).toEqual(fb);
  });
  it("C: a blessing invalidates", async () => {
    const { sa, sb, fb } = await cachedVsFresh([base(), nb()], [base({ blessed: [NOW - 100 * H, NOW - 50 * H] }), nb()]);
    expect(sb.age).toBeGreaterThan(sa.age);
    expect(sb).toEqual(fb);
  });
  it("D: a new purchase updates buildings and households", async () => {
    const more = [...base().bought!, { item: "granary", at: NOW - 100 * H }, { item: "fisher", at: NOW - 90 * H }];
    const { sb, fb } = await cachedVsFresh([base(), nb()], [base({ bought: more }), nb()]);
    expect(sb).toEqual(fb);
  });
  it("E: twin pact / joint work changed at equal count", async () => {
    const v = (pact: "trade" | "faith", at: number) => [{ partner: "nb", pact, at }];
    const w = (work: "bridge" | "fair", at: number) => [{ partner: "nb", work, cost: 100, at }];
    const a = [base({ votes: v("trade", NOW - 200 * H), works: w("bridge", NOW - 150 * H) as Seed["works"] }), nb({ votes: [{ partner: "dk", pact: "trade", at: NOW - 199 * H }] })];
    const b = [base({ votes: v("faith", NOW - 100 * H), works: w("fair", NOW - 120 * H) as Seed["works"] }), nb({ votes: [{ partner: "dk", pact: "trade", at: NOW - 199 * H }] })];
    const { sb, fb } = await cachedVsFresh(a as Seed[], b as Seed[]);
    expect(sb).toEqual(fb);
  });
  it("F: road decision time changed at equal count", async () => {
    const r = (at: number) => [base({ roads: [{ target: "nb", at }] }), nb({ roads: [{ target: "dk", at }] })];
    const { sb, fb } = await cachedVsFresh(r(NOW - 400 * H), r(NOW - 100 * H));
    expect(sb).toEqual(fb);
  });
  it("G: register key changes with content at equal counts (seedsKey fingerprint)", async () => {
    vi.resetModules(); const { seedsKey } = await import("./world");
    const a = [base({ decisions: [{ ...DEC[0]!, choice: "quiet" }] }), nb()], b = [base({ decisions: [DEC[0]!] }), nb()];
    expect(seedsKey(a)).not.toBe(seedsKey(b));
    expect(seedsKey([base({ blessed: [1] }), nb()])).not.toBe(seedsKey([base({ blessed: [2] }), nb()]));
    expect(seedsKey([base({ decisions: [...DEC] }), nb()])).toBe(seedsKey([base({ decisions: [DEC[1]!, DEC[0]!] }), nb()]));
  });
  it("H: warm cache equals fresh computation for identical input", async () => {
    const full = [base({ decisions: DEC, blessed: [NOW - 50 * H] }), nb()];
    const { sb, fb } = await cachedVsFresh(full, full.map((s) => ({ ...s })));
    expect(sb).toEqual(fb);
  });
  it("I: citizens in townOf equal rankInput citizens", async () => {
    const s = await fresh([base({ decisions: DEC }), nb()]);
    expect(s.citizens).toBe(s.rank);
  });
  it("J: an older realm's seeds never leak into the current realm's results", async () => {
    vi.resetModules(); const m = await load();
    const realmA = [base({ decisions: DEC }), nb()], realmB = [base(), nb()];
    snap(m, realmB); snap(m, realmA); // late result of A computed after B
    expect(snap(m, realmB)).toEqual(await fresh(realmB));
  });
});

describe("snapshot replace", () => {
  it("drops map rows missing from a fresh snapshot, keeps rows inserted during the load and other maps' rows out", async () => {
    const { snapRows } = await import("./realtime");
    const ids = ["a"], keep = (r: { seed_id: string }) => ids.includes(r.seed_id);
    const old = [{ id: "1", seed_id: "a", created_at: "2026-11-01T00:00:00Z" }, { id: "2", seed_id: "a", created_at: "2026-11-15T12:00:00Z" }, { id: "3", seed_id: "x", created_at: "2026-11-15T12:00:00Z" }];
    const out = snapRows([{ id: "4", seed_id: "a", created_at: "2026-11-10T00:00:00Z" }], old, keep, Date.parse("2026-11-15T11:59:00Z"));
    expect(out.map((r) => r.id).sort()).toEqual(["2", "4"]);
  });
});
