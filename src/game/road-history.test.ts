import { describe, it, expect } from "vitest";
import { roadProgress, roadDone, roadBuilding, roadIncoming, links, roadHours, roadAtForTest, transitRoutes, hubRoutes, ROAD_BUILD, ROAD_AT, type Link, type Seed } from "./world";

const H = 3.6e6;
const mk = (id: string, x: number, roads?: Seed["roads"], user: string | null = "u-" + id, y = 0): Seed =>
  ({ id, name: id, owner: id, x, y, hue: 0, created_at: "2026-01-01T00:00:00Z", user_id: user, ...(roads ? { roads } : {}) }) as Seed;
// reference: A decides at 0 h, base 20 h (40 tiles), B joins at 8 h → done at 14 h
const A = mk("a", 0, [{ target: "b", at: 0 }]), B = mk("b", 40, [{ target: "a", at: 8 * H }]);
const ref: Link = { a: A, b: B, d: 40, since: 0, baseBuild: 20 * H, joinAt: 8 * H, doneAt: 14 * H, tiles: [], water: [] };

describe("P2 historische Straßenbaukinetik", () => {
  it("1 Normalfortschritt vor Beitritt: 20 % bei 4 h", () => expect(roadProgress(ref, 4 * H)).toBeCloseTo(0.2, 12));
  it("2 stetig beim Beitritt (±1 ms)", () => {
    expect(roadProgress(ref, 8 * H)).toBeCloseTo(0.4, 12);
    expect(roadProgress(ref, 8 * H - 1)).toBeCloseTo(0.4, 6);
    expect(roadProgress(ref, 8 * H + 1)).toBeCloseTo(0.4, 6);
    expect(roadProgress(ref, 8 * H + 1) - roadProgress(ref, 8 * H)).toBeCloseTo(2 * (roadProgress(ref, 8 * H) - roadProgress(ref, 8 * H - 1)), 12);
  });
  it("3 doppeltes Tempo: 70 % bei 11 h", () => expect(roadProgress(ref, 11 * H)).toBeCloseTo(0.7, 12));
  it("4 exakt fertig bei 14 h und danach", () => { expect(roadProgress(ref, 14 * H)).toBe(1); expect(roadProgress(ref, 15 * H)).toBe(1); expect(roadProgress(ref, 14 * H - 1)).toBeLessThan(1); });
  it("5/6 Gegenentscheidung bei oder nach Fertigstellung beschleunigt nicht", () => {
    expect(roadDone(A, mk("b", 40, [{ target: "a", at: 20 * H }]))).toBe(20 * H);
    expect(roadDone(A, mk("b", 40, [{ target: "a", at: 25 * H }]))).toBe(20 * H);
  });
  it("roadDone historisch", () => {
    expect(roadDone(A, B, 4 * H)).toBe(20 * H);
    expect(roadDone(A, B, 8 * H)).toBe(14 * H);
    expect(roadDone(A, B, 10 * H)).toBe(14 * H);
    expect(roadDone(A, B)).toBe(14 * H);
  });
  it("7 roadBuilding-Prognose: 20 h bei 4 h, 14 h bei 8 h", () => {
    expect(roadBuilding(A, 4 * H, [A, B])?.done).toBe(20 * H);
    expect(roadBuilding(A, 8 * H, [A, B])?.done).toBe(14 * H);
  });
  it("8 roadIncoming: vorhanden bei 4 h, weg bei 8 h", () => {
    expect(roadIncoming(B, [A, B], 4 * H)?.from.id).toBe("a");
    expect(roadIncoming(B, [A, B], 8 * H)).toBeNull();
  });
  it("12 mehrfache Einträge: frühester je Partei zählt", () => {
    const a2 = mk("a", 0, [{ target: "b", at: 6 * H }, { target: "b", at: 0 }]);
    const b2 = mk("b", 40, [{ target: "a", at: 30 * H }, { target: "a", at: 8 * H }]);
    expect(roadDone(a2, b2)).toBe(14 * H);
  });
});

describe("P2 Link-Ableitung, Kacheln, Transit, Samples", () => {
  const sA = mk("pa", 500, [{ target: "pb", at: 0 }], "u1", 500), sB = mk("pb", 540, [{ target: "pa", at: 8 * H }], "u2", 500);
  const sAsolo = mk("pa", 500, [{ target: "pb", at: 0 }], "u1", 500), sBsolo = mk("pb", 540, undefined, "u2", 500);
  it("Link trägt since/baseBuild/joinAt/doneAt", () => {
    const l = links([sA, sB])[0]!;
    expect(l).toMatchObject({ since: 0, baseBuild: roadHours(sA, sB) * H, joinAt: 8 * H, doneAt: 14 * H });
  });
  it("9 Kacheln bei 4 h identisch mit und ohne späteren Beitritt", () => {
    const l = links([sA, sB])[0]!;
    expect(l.tiles.length).toBeGreaterThan(10);
    const occ = (seeds: Seed[], t: number) => l.tiles.map(([x, y]) => roadAtForTest(x, y, seeds, t) !== null);
    const solo = occ([sAsolo, sBsolo], 4 * H), both = occ([sA, sB], 4 * H);
    expect(both).toEqual(solo);
    expect(both.some(Boolean)).toBe(true);
    expect(occ([sA, sB], 11 * H).filter(Boolean).length).toBeGreaterThan(occ([sAsolo, sBsolo], 11 * H).filter(Boolean).length);
  });
  it("10 Transit/Hub erst nach tatsächlicher Fertigstellung", () => {
    const c = mk("pc", 580, [{ target: "pb", at: 0 }], "u3", 500);
    const b = mk("pb", 540, [{ target: "pa", at: 8 * H }], "u2", 500);
    const seeds = [sA, b, c], ls = links(seeds);
    const done = Math.max(...ls.map((l) => l.doneAt));
    expect(transitRoutes(sA, seeds)[0]?.since).toBe(done);
    expect(hubRoutes(b, seeds)[0]?.since).toBe(done);
  });
  it("11 Sample-Straßen unverändert", () => {
    const x = mk("sa", 500, undefined, null, 500), y = mk("sb", 530, undefined, null, 500);
    const l = links([x, y])[0]!, start = Date.parse(x.created_at) + ROAD_AT * H;
    expect(l.since).toBe(start);
    expect(l.baseBuild).toBe(ROAD_BUILD * H);
    expect(l.joinAt).toBeUndefined();
    expect(l.doneAt).toBe(start + ROAD_BUILD * H);
    expect(roadProgress(l, start + ROAD_BUILD * H / 2)).toBeCloseTo(0.5, 12);
    expect(roadProgress(l, start + ROAD_BUILD * H)).toBe(1);
  });
});
