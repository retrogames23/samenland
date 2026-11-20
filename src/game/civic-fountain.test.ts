import { describe, it, expect } from "vitest";
import { FOUNTAIN_PRICE, FOUNTAIN_DAYS, FOUNTAIN_RANK, fountainChain, fountainDone, nextFountainStep, FOUNTAIN_CORE } from "./civic-fountain";
import { fires } from "./disasters";
import { needRankOf, walkChest, attributes } from "./economy";
import { residentTax } from "./resident-tax";
import type { Seed } from "./world";

const DAY = 864e5, start = Date.parse("2026-01-01T00:00:00Z");
const town = (bought: { item: string; at: number }[] = []): Seed => ({ x: 532, y: 124, id: "fountain-town", name: "B", owner: "L", hue: 1, user_id: "u", created_at: new Date(start).toISOString(), bought } as Seed);

describe("Marktbrunnen mit Wasserkunst", () => {
  it("costs 4,000 / 8,000 / 12,000 marks = 24,000 and builds 14 / 21 / 30 = 65 days", () => {
    expect(Object.values(FOUNTAIN_PRICE)).toEqual([4000, 8000, 12000]);
    expect(Object.values(FOUNTAIN_PRICE).reduce((a, b) => a + b)).toBe(24000);
    expect(Object.values(FOUNTAIN_DAYS)).toEqual([14, 21, 30]);
  });
  it("opens from Handelsstadt (rank 4) only; later steps need the previous one", () => {
    expect(FOUNTAIN_RANK).toBe(4);
    expect(needRankOf("fountain1")).toBe(4);
    expect(nextFountainStep([])).toBe("fountain1");
    expect(nextFountainStep(["fountain1"])).toBe("fountain2");
    expect(nextFountainStep(["fountain1", "fountain2", "fountain3"])).toBeNull();
  });
  it("part funding: only paid steps build, the rest waits", () => {
    const s = town([{ item: "fountain1", at: start }]);
    expect(fountainChain(s)).toHaveLength(1);
    expect(fountainDone(s, start + 13 * DAY)).toBe(0);
    expect(fountainDone(s, start + 14 * DAY)).toBe(1);
    expect(fountainDone(s, start + 400 * DAY)).toBe(1);
  });
  it("full funding at once: steps build one after another, done after 65 days", () => {
    const s = town(["fountain1", "fountain2", "fountain3"].map((item) => ({ item, at: start })));
    const c = fountainChain(s);
    expect(c.map((x) => (x.done - start) / DAY)).toEqual([14, 35, 65]);
    expect(fountainDone(s, start + 64 * DAY)).toBe(2);
    expect(fountainDone(s, start + 65 * DAY)).toBe(3);
  });
  it("chest booking: a payment is a debit in walkChest, never below the cap rules, no overdraft", () => {
    const cap = () => 25000;
    expect(walkChest(10000, [{ t: 1, r: 3, v: -4000, k: "p1" }], cap)).toBe(6000);
    expect(walkChest(25000, [{ t: 1, r: 3, v: -8000, k: "p2" }, { t: 2, r: 0, v: 3000, k: "d" }], cap)).toBe(20000);
  });
  it("halves burning tiles in the market core and shortens those fires by a quarter", () => {
    const now = start + 730 * DAY, base = fires(town(), now);
    const built = fires(town(["fountain1", "fountain2"].map((item) => ({ item, at: start - 100 * DAY }))), now);
    expect(built.length).toBe(base.length);
    let core = 0;
    base.forEach((f, i) => {
      const g = built[i]!, isCore = Math.hypot(f.x - 532, f.y - 124) <= FOUNTAIN_CORE + 1.5;
      if (g.tiles.length < f.tiles.length) { core++; expect(g.tiles.length).toBe(Math.max(1, Math.ceil(f.tiles.length / 2))); expect(g.end - g.at).toBeCloseTo((f.end - f.at) * 0.75); }
      else { expect(g.tiles.length).toBe(f.tiles.length); expect(isCore || g.end - g.at === f.end - f.at).toBe(true); }
    });
    expect(core).toBeGreaterThan(0);
  });
  it("brings no income: resident tax and prosperity unchanged by the paid rows themselves", () => {
    const at = start + 200 * DAY, a = town(), b = town([{ item: "fountain1", at: at - DAY }]); // paid, not yet built
    expect(residentTax(b, [b], at)).toEqual(residentTax(a, [a], at));
    expect(attributes(b, [b], [], at).wealth).toBe(attributes(a, [a], [], at).wealth);
  });
});

import { pickFountainTile } from "./civic-fountain";
describe("Marktbrunnen placement", () => {
  const seat: [number, number] = [100, 100], centre: [number, number] = [90, 90];
  it("prefers a paved square tile next to the mayor's seat", () => {
    const kinds = new Map([["101,101", "cottage"], ["99,100", "square"], ["101,100", "square"]]);
    const t = pickFountainTile(seat, centre, (x, y) => kinds.get(`${x},${y}`) ?? null, () => true);
    expect(t).toEqual([99, 100]);
  });
  it("never stands on a field or beside a house when falling back to free ground", () => {
    const kinds = new Map<string, string>();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) kinds.set(`${100 + dx},${100 + dy}`, "field");
    kinds.set("100,98", "cottage");
    const t = pickFountainTile(seat, centre, (x, y) => kinds.get(`${x},${y}`) ?? null, () => true)!;
    expect(kinds.get(`${t[0]},${t[1]}`)).toBeUndefined();
    for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) expect(["field", "cottage"]).not.toContain(kinds.get(`${t[0] + i!},${t[1] + j!}`));
  });
  it("is deterministic and skips tiles taken by decorations", () => {
    const kinds = new Map([["99,100", "square"], ["101,100", "square"]]);
    const free = (x: number, y: number) => !(x === 99 && y === 100);
    const a = pickFountainTile(seat, centre, (x, y) => kinds.get(`${x},${y}`) ?? null, free);
    expect(a).toEqual([101, 100]);
    expect(pickFountainTile(seat, centre, (x, y) => kinds.get(`${x},${y}`) ?? null, free)).toEqual(a);
  });
});
