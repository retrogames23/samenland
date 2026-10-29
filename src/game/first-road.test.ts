import { describe, it, expect } from "vitest";
import { roadGate, roadCandidates, roadBuilding, ROAD_BUILD, type Seed } from "./world";
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
  it("only one road is under construction for ROAD_BUILD hours", () => {
    const a = mk("a", "u", [{ target: "b", at: 0 }]);
    expect(roadBuilding(a, (ROAD_BUILD - 1) * H)?.target).toBe("b");
    expect(roadBuilding(a, ROAD_BUILD * H)).toBeNull();
  });
});
