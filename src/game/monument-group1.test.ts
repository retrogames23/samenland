import { describe, it, expect } from "vitest";
import { specialBuild, specialDone, guildtowerDone, stepsDone, monumentChain, SPECIAL_BUILD, type Seed } from "./world";
import { fires, raids } from "./disasters";
import { festJoy, weddingDates, weddingJoy } from "./weddings";
import { sickChance } from "./sickness";
import { attributes } from "./economy";

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
  it("finished step 1 shortens fires by 10 %, step 3 by 25 %", () => {
    const base = len(town([])), l1 = len(town(steps("belfry", 1))), l3 = len(town(steps("belfry", 3)));
    expect(base.length).toBeGreaterThan(0);
    l1.forEach((v, i) => expect(v / base[i]!).toBeCloseTo(0.9));
    l3.forEach((v, i) => expect(v / base[i]!).toBeCloseTo(0.75));
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
    const a = attributes(town(steps("theater", 3)), [], Date.parse("2027-04-14T12:00:00Z"));
    expect(a.wealth).toBe(attributes(town([]), [], Date.parse("2027-04-14T12:00:00Z")).wealth);
  });
});
