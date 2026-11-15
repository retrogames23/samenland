import { describe, it, expect } from "vitest";
import { seaWays, TRADE_DIST, bonusOf, roadCandidates, type Seed } from "./world";
import { rankOf } from "./rank";

const mk = (id: string, x: number, y: number, bought: Seed["bought"] = []): Seed =>
  ({ id, name: id, owner: "o", x, y, hue: 0, created_at: new Date(0).toISOString(), user_id: "u" + id, bought });

describe("Straßenreichweite und Seewege", () => {
  it("Straßen reichen jetzt 120 Kacheln", () => {
    expect(TRADE_DIST).toBe(120);
    const a = mk("a", 300, 300);
    expect(roadCandidates(a, [a, mk("b", 415, 300), mk("c", 425, 300)]).map((s) => s.id)).toEqual(["b"]); // Randlage: 0 Nachbarn im 80er-Radius
  });
  it("Bonus bestehender Straßen bleibt gleich, über 80 Kacheln +10 %", () => {
    expect(bonusOf(40, 480)).toBeCloseTo(0.25);
    expect(bonusOf(80, 480)).toBeCloseTo(0.1);
    expect(bonusOf(110, 480)).toBeCloseTo(0.1);
  });
  it("ohne Hafenbau keine Seewege", () => expect(seaWays(mk("a", 300, 300), Date.now())).toBe(0));
  it("fertige Räucherei und Salzkontor zählen als zwei Straßen, höchstens zwei", () => {
    const s = mk("a", 300, 300, [{ item: "smokehouse", at: 0 }, { item: "saltquay", at: 1000 }]);
    expect(seaWays(s, 1e13)).toBe(2);
    expect(seaWays(s, 2000)).toBe(0); // noch im Bau
  });
  it("Seewege ersetzen Straßen beim Rang", () => {
    expect(rankOf({ citizens: 1500, homes: 430, roads: 0 })).toBe(3);
    expect(rankOf({ citizens: 1500, homes: 430, roads: 1 })).toBe(4);
  });
});
