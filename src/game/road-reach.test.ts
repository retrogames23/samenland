import { describe, it, expect } from "vitest";
import { roadReach, roadAllowed, roadCandidates, NEAR_ROAD_DIST, TRADE_DIST, type Seed } from "./world";

const mk = (id: string, x: number, roads?: Seed["roads"]): Seed =>
  ({ id, name: id, owner: id, x, y: 300, hue: 0, created_at: new Date(0).toISOString(), user_id: "u" + id, ...(roads ? { roads } : {}) });
const ids = (l: Seed[]) => l.map((s) => s.id);

describe("dynamische Handelsstraßen-Reichweite", () => {
  it("Grenzen: Standard 80, Erweiterung 120", () => {
    expect(NEAR_ROAD_DIST).toBe(80);
    expect(TRADE_DIST).toBe(120);
  });
  it("dichtes Gebiet: zwei Nachbarn im 80er-Radius → keine Fernstraße", () => {
    const a = mk("a", 300);
    const all = [a, mk("b", 350), mk("c", 380), mk("far", 400)];
    expect(roadReach(a, all)).toBe(80);
    expect(ids(roadCandidates(a, all))).toEqual(["b", "c"]);
  });
  it("bestehende Straßen zählen als Nahbereichsverbindung", () => {
    const a = mk("a", 300, [{ target: "b", at: 0 }]);
    const all = [a, mk("b", 350), mk("c", 380), mk("far", 400)];
    expect(roadReach(a, all)).toBe(80);
    expect(ids(roadCandidates(a, all))).toEqual(["c"]);
  });
  it("Randlage mit 0 Nahbereichsverbindungen → bis 120", () => {
    const a = mk("a", 300);
    const all = [a, mk("b", 390), mk("c", 420), mk("d", 421)];
    expect(roadReach(a, all)).toBe(120);
    expect(ids(roadCandidates(a, all))).toEqual(["b", "c"]);
  });
  it("Randlage mit 1 Nahbereichsverbindung → bis 120", () => {
    const a = mk("a", 300);
    const all = [a, mk("b", 380), mk("c", 400)];
    expect(roadReach(a, all)).toBe(120);
    expect(ids(roadCandidates(a, all))).toEqual(["b", "c"]);
  });
  it("Grenze genau 80: zählt zum Nahbereich", () => {
    const a = mk("a", 300);
    expect(roadReach(a, [a, mk("b", 379), mk("c", 380)])).toBe(80);
    expect(roadReach(a, [a, mk("b", 379), mk("c", 380.5)])).toBe(120);
  });
  it("Gegenentscheidung zu begonnener Fernstraße bleibt möglich, auch im dichten Gebiet", () => {
    const edge = mk("edge", 300, [{ target: "a", at: 0 }]);
    const a = mk("a", 400);
    const all = [edge, a, mk("n1", 430), mk("n2", 450)];
    expect(roadReach(a, all)).toBe(80);
    expect(roadAllowed(a, edge, all)).toBe(true);
    expect(roadAllowed(a, mk("x", 290), [...all])).toBe(false);
    const tooFar = mk("tf", 279, [{ target: "a", at: 0 }]);
    expect(roadAllowed(a, tooFar, [...all, tooFar])).toBe(false);
  });
});
