import { describe, expect, it } from "vitest";
import { LoadGate, applySign, mergeRows, onIds } from "./realtime";

const ids = ["a", "b"];
describe("realtime isolation", () => {
  it("letters: foreign ignored, one side on map accepted", () => {
    expect(onIds(ids, "x", "y")).toBe(false);
    expect(onIds(ids, "a", "y")).toBe(true);
    expect(onIds(ids, "x", "b")).toBe(true);
  });
  it("signposts: foreign insert/update ignored, local works, delete safe", () => {
    const s0 = [{ id: "1", seed_id: "a", message: "hi" }];
    expect(applySign(s0, { eventType: "INSERT", new: { id: "2", seed_id: "x", message: "f" } }, ids)).toBe(s0);
    expect(applySign(s0, { eventType: "UPDATE", new: { id: "1", seed_id: "x", message: "f" } }, ids)).toBe(s0);
    const s1 = applySign(s0, { eventType: "UPDATE", new: { id: "1", seed_id: "a", message: "neu" } }, ids);
    expect(s1).toEqual([{ id: "1", seed_id: "a", message: "neu" }]);
    expect(applySign(s1, { eventType: "INSERT", new: { id: "3", seed_id: "b", message: "z" } }, ids)).toHaveLength(2);
    expect(applySign(s1, { eventType: "DELETE", old: { id: "9" } }, ids)).toBe(s1);
    expect(applySign(s1, { eventType: "DELETE", old: { id: "1" } }, ids)).toEqual([]);
  });
  it("map switch: events during load are held, then filtered by the new ids", () => {
    const g = new LoadGate(); let cur = ["old"]; const got: string[] = [];
    const ev = (seed: string) => g.run(() => { if (onIds(cur, seed)) got.push(seed); });
    const e = g.begin();
    ev("new1"); ev("old"); ev("foreign");
    expect(got).toEqual([]);
    cur = ["new1"];
    expect(g.end(e)).toBe(true);
    expect(got).toEqual(["new1"]);
    ev("new1"); expect(got).toEqual(["new1", "new1"]);
  });
  it("map switch: only the newest load releases", () => {
    const g = new LoadGate(); const got: number[] = [];
    const e1 = g.begin(); g.run(() => got.push(1)); const e2 = g.begin();
    expect(g.end(e1)).toBe(false); expect(got).toEqual([]);
    expect(g.end(e2)).toBe(true); expect(got).toEqual([1]);
  });
  it("load result never drops events seen meanwhile nor keeps foreign rows", () => {
    const fresh = [{ id: "1", s: "a" }];
    const old = [{ id: "2", s: "a" }, { id: "3", s: "x" }, { id: "1", s: "stale" }];
    expect(mergeRows(fresh, old, (r) => onIds(ids, r.s))).toEqual([{ id: "1", s: "a" }, { id: "2", s: "a" }]);
  });
});

// simulates loadRealm: every state write is guarded by isCurrent(epoch)
async function load(g: LoadGate, st: { ids: string[]; seeds: string[] }, ids: string[], wait: Promise<void>, late?: Promise<string[]>) {
  const e = g.begin(); const live = () => g.isCurrent(e);
  try {
    await wait; if (!live()) return;
    st.ids = ids; st.seeds = mergeRows(ids.map((id) => ({ id })), st.seeds.map((id) => ({ id })), (r) => onIds(st.ids, r.id)).map((r) => r.id);
    late?.then((xs) => { if (live()) st.seeds = [...st.seeds, ...xs]; });
  } finally { g.end(e); }
}
const later = () => { let go!: () => void; const p = new Promise<void>((r) => (go = r)); return { p, go }; };

describe("stale map loads", () => {
  it("A starts, B starts and finishes first: A never overwrites B", async () => {
    const g = new LoadGate(); const st = { ids: [] as string[], seeds: [] as string[] };
    const a = later(), b = later();
    const pa = load(g, st, ["a1"], a.p); const pb = load(g, st, ["b1"], b.p);
    b.go(); await pb; a.go(); await pa;
    expect(st).toEqual({ ids: ["b1"], seeds: ["b1"] });
  });
  it("A finishes first: A keeps the buffer closed, B releases it against B's ids", async () => {
    const g = new LoadGate(); const st = { ids: [] as string[], seeds: [] as string[] }; const got: string[] = [];
    const a = later(), b = later();
    const pa = load(g, st, ["a1"], a.p); const pb = load(g, st, ["b1"], b.p);
    g.run(() => { for (const x of ["a1", "b1"]) if (onIds(st.ids, x)) got.push(x); });
    a.go(); await pa; expect(got).toEqual([]); expect(st.ids).toEqual([]);
    b.go(); await pb; expect(got).toEqual(["b1"]);
  });
  it("late sub-query results of a stale load are dropped", async () => {
    const g = new LoadGate(); const st = { ids: [] as string[], seeds: [] as string[] };
    const sub = later(); const late = sub.p.then(() => ["foreign"]);
    await load(g, st, ["a1"], Promise.resolve(), late);
    await load(g, st, ["b1"], Promise.resolve());
    sub.go(); await late; await Promise.resolve();
    expect(st.seeds).toEqual(["b1"]);
  });
  it("mergeRows filters fresh rows too", () => {
    expect(mergeRows([{ id: "1", s: "x" }], [], (r) => onIds(ids, r.s))).toEqual([]);
  });
});

describe("late follow-ups after a map switch", () => {
  it("late errands of a superseded load are dropped", async () => {
    const g = new LoadGate(); let done: string[] = ["kept"];
    const q = later();
    const e1 = g.begin();
    const res = q.p.then(() => { if (g.isCurrent(e1)) done = ["old-map"]; }); // loadErrands(e1)
    g.end(e1);
    const e2 = g.begin(); g.end(e2);
    q.go(); await res;
    expect(done).toEqual(["kept"]);
  });
  it("late realtime letter body is dropped after a map switch", async () => {
    const g = new LoadGate(); let cur = ["a"]; const bodies: Record<string, string> = {};
    const q = later();
    const n = { id: "L1", from_seed: "a", to_seed: "x" };
    const e = g.epochNow;
    const res = q.p.then(() => { if (g.isCurrent(e) && onIds(cur, n.from_seed, n.to_seed)) bodies[n.id] = "text"; });
    const e2 = g.begin(); cur = ["b"]; g.end(e2);
    q.go(); await res;
    expect(bodies).toEqual({});
  });
  it("realtime letter body still arrives without a switch", async () => {
    const g = new LoadGate(); const bodies: Record<string, string> = {};
    const e = g.epochNow;
    await Promise.resolve().then(() => { if (g.isCurrent(e) && onIds(["a"], "a")) bodies["L"] = "t"; });
    expect(bodies).toEqual({ L: "t" });
  });
});
