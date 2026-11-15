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
