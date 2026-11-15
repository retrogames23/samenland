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
    const v = (pact: "trade" | "culture", at: number) => [{ partner: "nb", pact, at }];
    const w = (work: "bridge" | "hall", at: number) => [{ partner: "nb", work, cost: 100, at }];
    const a = [base({ votes: v("trade", NOW - 200 * H), works: w("bridge", NOW - 150 * H) as NonNullable<Seed["works"]> }), nb({ votes: [{ partner: "dk", pact: "trade", at: NOW - 199 * H }] })];
    const b = [base({ votes: v("culture", NOW - 100 * H), works: w("hall", NOW - 120 * H) as NonNullable<Seed["works"]> }), nb({ votes: [{ partner: "dk", pact: "trade", at: NOW - 199 * H }] })];
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
  it("J: a late result of realm A, arriving while B loads, is dropped and B stays exact", async () => {
    vi.resetModules(); const m = await load(); const { LoadGate } = await import("./realtime");
    const gate = new LoadGate(); let state: Seed[] = [];
    const realmA = [base({ decisions: DEC }), nb()], realmB = [base(), nb()];
    let releaseA!: () => void; const slowA = new Promise<void>((r) => { releaseA = r; });
    const loadRealm = async (rows: Seed[], wait?: Promise<void>) => { const e = gate.begin(); if (wait) await wait; gate.end(e, () => { state = rows; }); };
    const a = loadRealm(realmA, slowA); const b = loadRealm(realmB);
    await b; snap(m, state); releaseA(); await a;
    expect(state).toBe(realmB);
    expect(snap(m, state)).toEqual(await fresh(realmB));
  });
  it("links() cache reacts to user_id with identical roads", async () => {
    vi.resetModules(); const w = await import("./world");
    const pair = (u: string | null = null) => [base({ user_id: u }), nb({ user_id: u })] as Seed[];
    expect(w.roadGate(pair()[0]!, pair()[1]!)).toBe(-Infinity);
    expect(w.roadGate(pair("u")[0]!, pair("u")[1]!)).toBeNull();
    const sample = w.links(pair()).length, owned = w.links(pair("u")).length;
    expect(sample).toBeGreaterThan(0);
    expect(owned).toBe(0);
    expect(w.links(pair()).length).toBe(sample);
  });
});

describe("snapshot replace", () => {
  it("a full snapshot replaces the map's rows; no old local row survives, foreign rows drop", async () => {
    const { snapRows } = await import("./realtime");
    const keep = (r: { seed_id: string }) => r.seed_id === "a";
    const out = snapRows([{ id: "4", seed_id: "a" }, { id: "5", seed_id: "x" }], keep);
    expect(out.map((r) => r.id)).toEqual(["4"]);
  });
});

describe("refreshMap (tab wake-up)", () => {
  type Row = { id: string; seed_id: string };
  const setup = async () => {
    const { LoadGate, refreshMap, snapRows } = await import("./realtime");
    const gate = new LoadGate(); const st = { enc: [] as Row[], votes: [] as Row[], works: [] as Row[] };
    const insert = (r: Row) => gate.run(() => { if (!st.enc.some((x) => x.id === r.id)) st.enc = [...st.enc, r]; });
    let ids = ["a"];
    const refresh = (data: { enc: Row[]; votes: Row[]; works: Row[] }, wait?: Promise<void>) => refreshMap(gate, async () => { await wait; return data; },
      (d) => { const k = (x: Row) => ids.includes(x.seed_id); st.enc = snapRows(d.enc, k); st.votes = snapRows(d.votes, k); st.works = snapRows(d.works, k); });
    return { gate, st, insert, refresh, setIds: (x: string[]) => { ids = x; } };
  };
  it("applies a refresh without realm switch, votes and works included, deleted rows gone", async () => {
    const t = await setup(); t.st.enc = [{ id: "old", seed_id: "a" }];
    expect(await t.refresh({ enc: [{ id: "e1", seed_id: "a" }], votes: [{ id: "v1", seed_id: "a" }], works: [{ id: "w1", seed_id: "a" }] })).toBe(true);
    expect(t.st).toEqual({ enc: [{ id: "e1", seed_id: "a" }], votes: [{ id: "v1", seed_id: "a" }], works: [{ id: "w1", seed_id: "a" }] });
  });
  it("drops a late answer after a realm switch", async () => {
    const t = await setup(); let rel!: () => void; const wait = new Promise<void>((r) => { rel = r; });
    const p = t.refresh({ enc: [{ id: "A", seed_id: "a" }], votes: [], works: [] }, wait);
    const e = t.gate.begin(); t.setIds(["b"]); t.gate.end(e, () => { t.st.enc = [{ id: "B", seed_id: "b" }]; });
    rel(); expect(await p).toBe(false);
    expect(t.st.enc).toEqual([{ id: "B", seed_id: "b" }]);
  });
  it("keeps realtime inserts that arrive during the refresh", async () => {
    const t = await setup(); let rel!: () => void; const wait = new Promise<void>((r) => { rel = r; });
    const p = t.refresh({ enc: [{ id: "e1", seed_id: "a" }], votes: [], works: [] }, wait);
    t.insert({ id: "rt", seed_id: "a" }); expect(t.st.enc).toEqual([]);
    rel(); await p;
    expect(t.st.enc.map((r) => r.id)).toEqual(["e1", "rt"]);
  });
  it("is skipped while a map load runs", async () => {
    const t = await setup(); t.gate.begin();
    expect(await t.refresh({ enc: [{ id: "x", seed_id: "a" }], votes: [], works: [] })).toBe(false);
    expect(t.st.enc).toEqual([]);
  });
});
