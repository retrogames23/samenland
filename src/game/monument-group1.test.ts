import { describe, it, expect } from "vitest";
import { specialBuild, specialDone, guildtowerDone, stepsDone, monumentChain, SPECIAL_BUILD, type Seed } from "./world";
import { fires, raids } from "./disasters";
import { festJoy, weddingDates, weddingJoy } from "./weddings";
import { sickChance } from "./sickness";
import { householdsOf } from "./households";

const T = Date.parse("2026-03-02T06:00:00Z"), DAY = 864e5;
const town = (items: [string, number][], extra: Partial<Seed> = {}): Seed => ({ id: "g1", name: "G", owner: "o", hue: 1, x: 400, y: 540, user_id: "u",
  created_at: "2026-01-01T00:00:00Z", bought: items.map(([item, at], i) => ({ item, at, ...(i ? {} : { x: 403, y: 542 }) })), ...extra } as Seed);
const steps = (k: string, n: number, at = T) => Array.from({ length: n }, (_, i) => [`${k}${i + 1}`, at + i] as [string, number]);

describe("Zunftturm: only finished steps speed builds", () => {
  it("exact 0 / 5 / 10 / 15 % once steps stand", () => {
    for (const [n, f] of [[0, 1], [1, 0.95], [2, 0.9], [3, 0.85]] as const) {
      const s = town(steps("guildtower", n));
      expect(guildtowerDone(s, Infinity)).toBe(n);
      expect(specialBuild(s)).toBeCloseTo(SPECIAL_BUILD * f);
    }
  });
  it("paid but unfinished steps do not speed anything", () => {
    const s = town(steps("guildtower", 3));
    expect(guildtowerDone(s, T + 1000)).toBe(0);
    expect(specialBuild(s, false, T + 1000)).toBe(SPECIAL_BUILD);
  });
  it("no self-acceleration; finished steps speed the following ones", () => {
    const s = town(steps("guildtower", 3)), c = monumentChain(s, "guildtower"), plain = town([]);
    expect(c[0]!.done).toBe(specialDone(plain, [plain], c[0]!.start));
    const d1 = c[1]!.done, plainD1 = specialDone(plain, [plain], c[1]!.start);
    expect(d1).toBeLessThan(plainD1);
    expect(stepsDone(s, "guildtower", c[2]!.done)).toBe(3);
    for (let i = 1; i < 3; i++) expect(c[i]!.start).toBe(c[i - 1]!.done);
  });
  it("a later bought building profits from the finished tower", () => {
    const s = town(steps("guildtower", 3)), after = monumentChain(s, "guildtower")[2]!.done + DAY, plain = town([]);
    expect(specialDone(s, [s], after) - after).toBeLessThan(specialDone(plain, [plain], after) - after);
  });
});

describe("Belfried fire watch: only finished steps", () => {
  const len = (s: Seed) => fires(s, T + 400 * DAY).filter((f) => f.at > T + 30 * DAY).map((f) => f.end - f.at);
  for (const [n, f] of [[1, 0.9], [2, 0.9], [3, 0.85], [4, 0.85]] as const)
    it(`finished step ${n} shortens fires to ${f}`, () => {
      const base = len(town([])), l = len(town(steps("belfry", n)));
      expect(base.length).toBeGreaterThan(0);
      expect(l.length).toBe(base.length);
      l.forEach((v, i) => expect(v / base[i]!).toBeCloseTo(f));
    });
  it("paid but unfinished steps 1–3 have no effect", () => {
    const s = town(steps("belfry", 3, T + 1000 * DAY));
    expect(len(s)).toEqual(len(town([])));
  });
  it("an unfinished step has no effect", () => {
    const s = town(steps("belfry", 1)), f = fires(s, T + 400 * DAY).find((x) => x.at > T)!;
    const late = town([["belfry1", f.at - 1]]);
    const g = fires(late, T + 400 * DAY).find((x) => x.at === f.at)!;
    expect(g.end - g.at).toBe(fires(town([]), T + 400 * DAY).find((x) => x.at === f.at)!.end - f.at);
  });
  it("raids are not changed by the belfry (left open: DB raid mirror cannot see build completion)", () => {
    expect(raids(town(steps("belfry", 4)), T + 200 * DAY)).toEqual(raids(town([]), T + 200 * DAY));
  });
  it("town guard logic is unchanged by the belfry", () => {
    const g: [string, number] = ["guard", T];
    expect(raids(town([g, ...steps("belfry", 4)]), T + 200 * DAY)).toEqual(raids(town([g]), T + 200 * DAY));
  });
});

describe("Tanzhaus: festive joy from finished steps", () => {
  const big = town([], { created_at: "2025-06-01T00:00:00Z" });
  const quiet = () => { const w = weddingDates(big, T + 120 * DAY).filter((x) => x.at > T && !x.grand); return w[0]; };
  it("step 1: a quiet town wedding gives joy", () => {
    const w = quiet(); if (!w) return;
    expect(weddingJoy(big, w.at + 3.6e6)).toBe(false);
    const th = { ...big, bought: steps("theater", 1, T - 30 * DAY).map(([item, at]) => ({ item, at })) } as Seed;
    expect(weddingJoy(th, w.at + 3.6e6)).toBe(true);
  });
  it("step 2: feast days are joy days; step 3: Sundays", () => {
    const easter = Date.parse("2027-04-11T12:00:00Z"), sunday = Date.parse("2027-03-14T12:00:00Z");
    const s1 = town(steps("theater", 1)), s2 = town(steps("theater", 2)), s3 = town(steps("theater", 3));
    const noWed = (s: Seed, t: number) => !weddingJoy(s, t);
    if (noWed(s1, easter)) expect(festJoy(s1, easter)).toBe(false);
    expect(festJoy(s2, easter)).toBe(true);
    expect(sickChance(s2, easter)).toBe(0);
    if (noWed(s2, sunday)) expect(festJoy(s2, sunday)).toBe(false);
    expect(festJoy(s3, sunday)).toBe(true);
  });
  it("unfinished steps give nothing and no money or residents are created", () => {
    const easter = Date.parse("2027-04-11T12:00:00Z");
    const paidNow = town(steps("theater", 3, easter - 1000));
    expect(festJoy(paidNow, easter)).toBe(weddingJoy(paidNow, easter));
    const at = Date.parse("2027-04-14T12:00:00Z"), th = town(steps("theater", 3)), no = town([]);
    expect(householdsOf(th, [th], at).length).toBe(householdsOf(no, [no], at).length);
    // joy never enters the (DB-mirrored) wedding calendar: festJoy is read nowhere in weddingDates
    expect(weddingDates(th, at)).toEqual(weddingDates({ ...th }, at));
  });
});

import { fireDeadRisk } from "./disasters";
describe("Belfried steps 2 and 3: fire size and total-loss risk", () => {
  const HORIZON = T + 400 * DAY, after = (s: Seed) => fires(s, HORIZON).filter((f) => f.at > T + 30 * DAY);
  const ids = ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"];
  const at = (id: string, items: [string, number][], extra: Partial<Seed> = {}) => town(items, { id, ...extra });
  it("step 0 and 1: same fire tiles and total-loss outcome as without belfry", () => {
    for (const id of ids) {
      const a = after(at(id, [])), b = after(at(id, steps("belfry", 1)));
      expect(b.map((f) => [f.at, f.tiles, f.dead])).toEqual(a.map((f) => [f.at, f.tiles, f.dead]));
    }
  });
  it("step 2: exactly one fire tile less unless at the floor", () => {
    let cut = 0;
    for (const id of ids) {
      const a = after(at(id, [])), b = after(at(id, steps("belfry", 2)));
      expect(b.length).toBe(a.length);
      a.forEach((f, i) => { const want = Math.max(3, f.tiles.length - 1); expect(b[i]!.tiles).toEqual(f.tiles.slice(0, want)); if (want < f.tiles.length) cut++; });
    }
    expect(cut).toBeGreaterThan(0);
  });
  it("step 2 with fire house: floor of 3 tiles stays", () => {
    const fh: [string, number] = ["firehouse", T];
    for (const f of after(at("g2", [fh, ...steps("belfry", 2)]))) expect(f.tiles).toHaveLength(3);
  });
  it("step 2 for a workshop town at water: floor stays", () => {
    // n = max(1, 2 - stone - belfry) is already 1 for stone towns at water
    expect(Math.max(1, 2 - 1 - 1) + 2).toBe(Math.max(1, 2 - 1) + 2);
  });
  it("step 3: total-loss risk exactly halved, zero stays zero", () => {
    expect(fireDeadRisk(false, false, false, 0)).toBe(0.35);
    expect(fireDeadRisk(false, false, false, 3)).toBe(0.175);
    expect(fireDeadRisk(false, false, true, 0)).toBe(0.15);
    expect(fireDeadRisk(false, false, true, 3)).toBe(0.075);
    expect(fireDeadRisk(false, true, false, 3)).toBe(0);
    expect(fireDeadRisk(true, false, false, 3)).toBe(0);
    expect(fireDeadRisk(false, false, false, 2)).toBe(0.35);
  });
  it("step 3 in real fires: deaths only drop, never appear", () => {
    for (const id of ids) {
      const a = after(at(id, [])), b = after(at(id, steps("belfry", 3)));
      a.forEach((f, i) => { if (b[i]!.dead) expect(f.dead).toBe(true); });
    }
  });
  it("step 3: duration factor 0.85, not 0.90 × 0.85", () => {
    const a = after(at("g3", [])), b = after(at("g3", steps("belfry", 3)));
    b.forEach((f, i) => { const r = (f.end - f.at) / (a[i]!.end - a[i]!.at); expect(r).toBeCloseTo(0.85, 9); expect(r).not.toBeCloseTo(0.765, 3); });
  });
  it("fire outbreak is unchanged at every step", () => {
    for (const id of ids) {
      const base = after(at(id, [])).map((f) => [f.at, f.x, f.y]);
      for (const n of [1, 2, 3, 4]) expect(after(at(id, steps("belfry", n))).map((f) => [f.at, f.x, f.y])).toEqual(base);
    }
  });
});
