import { describe, it, expect } from "vitest";
import { roadGate, ROAD_BUILD, type Seed } from "./world";
const mk = (id: string, user?: string, fr?: Seed["firstRoad"]): Seed => ({ id, name: id, owner: id, x: 0, y: 0, hue: 0, created_at: "2026-01-01T00:00:00Z", user_id: user ?? null, firstRoad: fr });
describe("first road", () => {
  it("player village without a choice gets no road", () => {
    expect(roadGate(mk("a", "u"), mk("b"))).toBeNull();
  });
  it("chosen road starts at choice, others one build period later", () => {
    const a = mk("a", "u", { target: "b", at: 1000 });
    expect(roadGate(a, mk("b"))).toBe(1000);
    expect(roadGate(a, mk("c"))).toBe(1000 + ROAD_BUILD * 3.6e6);
  });
  it("sample villages connect automatically", () => {
    expect(roadGate(mk("a"), mk("b"))).toBe(-Infinity);
  });
});
