import { describe, expect, it } from "vitest";
import { VORHABEN, vorhabenPrice, nextVorhaben, vorhabenReady, vorhabenOpen, careFactor, isPaved, lastDayTax, vorhabenOf } from "./vorhaben";
import { needRankOf } from "./economy";
import type { Seed } from "./world";

const H = 3.6e6, D = 864e5;
const seed = (id: string, bought: { item: string; at: number }[] = []) => ({ id, bought } as unknown as Seed);

describe("Gemeindevorhaben", () => {
  it("rank gates: Bauhütte and Armenspeisung from Weiler, Wegeausbau from Dorf, Bürgerfest from Kleinstadt", () => {
    expect([needRankOf("bauhuette1"), needRankOf("armen3"), needRankOf("pflaster1"), needRankOf("fest2")]).toEqual([1, 1, 2, 3]);
    expect(vorhabenPrice("fest", 2, 1000)).toBe(0);
    expect(vorhabenPrice("pflaster", 1, 1000)).toBe(0);
  });
  it("price is the rank floor or a share of the daily tax, rounded to 10 Mark", () => {
    expect(vorhabenPrice("bauhuette", 1, 0)).toBe(60);
    expect(vorhabenPrice("bauhuette", 3, 1004)).toBe(1000);
    expect(vorhabenPrice("armen", 2, 300)).toBe(150);
    expect(vorhabenPrice("armen", 2, 100)).toBe(80);
    expect(vorhabenPrice("fest", 3, 1000)).toBe(3000);
    expect(vorhabenPrice("pflaster", 2, 300)).toBe(600);
  });
  it("pauses: Bauhütte 3 days, Armenspeisung 7, Bürgerfest 14; numbering continues", () => {
    expect([VORHABEN.bauhuette.gap, VORHABEN.armen.gap, VORHABEN.fest.gap]).toEqual([3 * D, 7 * D, 14 * D]);
    const s = seed("a", [{ item: "armen1", at: 0 }]);
    expect(vorhabenReady(s, "armen")).toBe(7 * D);
    expect(nextVorhaben("armen", ["armen1", "fest1"])).toBe("armen2");
    expect(vorhabenOf("freimarkt1")).toBeNull();
  });
  it("Armenspeisung halves sickness for 48 h, Bürgerfest clears it for 24 h", () => {
    const s = seed("a", [{ item: "armen1", at: 0 }, { item: "fest1", at: 100 * H }]);
    expect(careFactor(s, 47 * H)).toBe(0.5);
    expect(careFactor(s, 49 * H)).toBe(1);
    expect(careFactor(s, 110 * H)).toBe(0);
    expect(vorhabenOpen(s, "fest", 125 * H)).toBe(false);
  });
  it("paving covers the village's finished roads in finishing order", () => {
    const a = seed("a", [{ item: "pflaster1", at: 10 * D }]), b = seed("b"), c = seed("c");
    const l1 = { a, b, doneAt: 5 * D }, l2 = { a, b: c, doneAt: 2 * D };
    const all = [l1, l2];
    expect(isPaved(l2, all, 11 * D)).toBe(true);
    expect(isPaved(l1, all, 11 * D)).toBe(false);
    expect(isPaved(l2, all, 9 * D)).toBe(false);
  });
  it("uses the newest booked tax receipt", () => expect(lastDayTax({ 3: 100, 7: 250, 5: 999 })).toBe(250));
});
