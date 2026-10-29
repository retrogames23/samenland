import { describe, it, expect } from "vitest";
import { roadGate, roadCandidates, roadBuilding, roadHours, type Seed } from "./world";
const mk = (id: string, user?: string, roads?: Seed["roads"], x = 0): Seed => ({ id, name: id, owner: id, x, y: 0, hue: 0, created_at: "2026-01-01T00:00:00Z", user_id: user ?? null, ...(roads ? { roads } : {}) });
const H = 3.6e6;
describe("roads are decided one by one", () => {
  it("player village without a decision gets no road", () => {
    expect(roadGate(mk("a", "u"), mk("b"))).toBeNull();
  });
  it("a decided road starts at the decision; other neighbours stay unconnected", () => {
    const a = mk("a", "u", [{ target: "b", at: 1000 }]);
    expect(roadGate(a, mk("b"))).toBe(1000);
    expect(roadGate(a, mk("c"))).toBeNull();
  });
  it("either mayor's decision connects both villages, earliest wins", () => {
    expect(roadGate(mk("a", "u"), mk("b", "v", [{ target: "a", at: 500 }]))).toBe(500);
    expect(roadGate(mk("a", "u", [{ target: "b", at: 900 }]), mk("b", "v", [{ target: "a", at: 500 }]))).toBe(500);
  });
  it("two sample villages are connected without a decision", () => {
    expect(roadGate(mk("a"), mk("b"))).toBe(-Infinity);
  });
  it("connected neighbours are no longer offered", () => {
    const a = mk("a", "u", [{ target: "b", at: 0 }]);
    expect(roadCandidates(a, [a, mk("b", undefined, undefined, 50), mk("c", undefined, undefined, 60)]).map((s) => s.id)).toEqual(["c"]);
  });
  it("the road is under construction for its distance-based build time", () => {
    const a = mk("a", "u", [{ target: "b", at: 0 }]), b = mk("b", undefined, undefined, 40);
    expect(roadBuilding(a, 19 * H, [a, b])?.target).toBe("b");
    expect(roadBuilding(a, 20 * H, [a, b])).toBeNull();
  });
});

import { roadDone, roadIncoming } from "./world";
describe("both sides may build, one is enough", () => {
  it("build time grows with distance: 8 h near, 20 h at 40 tiles, 40 h at 80 tiles", () => {
    const o = { x: 0, y: 0 };
    expect(roadHours(o, { x: 16, y: 0 })).toBe(8);
    expect(roadHours(o, { x: 40, y: 0 })).toBe(20);
    expect(roadHours(o, { x: 80, y: 0 })).toBe(40);
  });
  it("one decision finishes after the distance-based time", () => {
    expect(roadDone(mk("a", "u", [{ target: "b", at: 0 }]), mk("b", "v", undefined, 40))).toBe(20 * H);
  });
  it("joining halves the remaining time", () => {
    expect(roadDone(mk("a", "u", [{ target: "b", at: 0 }]), mk("b", "v", [{ target: "a", at: 4 * H }], 40))).toBe(12 * H);
  });
  it("neighbour sees the incoming road until it is done", () => {
    const a = mk("a", "u", [{ target: "b", at: 0 }]), b = mk("b", "v");
    expect(roadIncoming(b, [a, b], H)?.from.id).toBe("a");
    expect(roadIncoming(b, [a, b], 8 * H)).toBeNull();
  });
});
