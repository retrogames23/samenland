import { describe, expect, it } from "vitest";
import {
  BADESTUBE_WINTER,
  CAPACITY_SERIES,
  GEMEINWESEN,
  GEMEINWESEN_CLASSIC,
  GEMEINWESEN_LAB_SINCE,
  GEMEINWESEN_SINCE,
  gemeinwesenActive,
  gemeinwesenCapacity,
  gemeinwesenGate,
  gemeinwesenSince,
} from "./gemeinwesen";
import { FEED_HEALTH_ITEM, foodCapacity } from "./households";
import { residentTax } from "./resident-tax";
import { careMissing, careStage, CARE_HEALTH, type Seed } from "./world";
import type { Realm } from "./time";
import { attributes, ITEMS } from "./economy";
import { ITEM_RANK } from "./disasters";
import { BADESTUBE_WINTER_T, GEMEINWESEN_T } from "./lang/gemeinwesen";
import { DICT, LANGS } from "./i18n";
import { wedStage } from "./weddings";
import { sickChance, SICK_BASE } from "./sickness";
import { seasonAt } from "./season";
import { sickLoss } from "./prosperity";

const day = 864e5,
  t0 = GEMEINWESEN_LAB_SINCE + day;
const FOOD = ["fisher", "hunter", "granary", "dairy"];
const seed = (items: string[], realm: Realm = "lab", at = t0 + day, created = t0): Seed => ({
  id: "g5",
  name: "g",
  owner: "L",
  hue: 1,
  x: 306,
  y: 420,
  user_id: "u",
  realm,
  created_at: new Date(created).toISOString(),
  bought: items.map((item) => ({ item, at })),
});
const own = (...i: string[]) => new Set(i);
/** every subset of a list (order-free) */
const subsets = (xs: readonly string[]): string[][] =>
  xs.reduce<string[][]>((acc, x) => [...acc, ...acc.map((a) => [...a, x])], [[]]);

describe("Gemeinwesen: counting rules", () => {
  it("care gate: any of the five count, without a cap", () => {
    const g = (...i: string[]) => gemeinwesenGate("lab", own(...i), t0);
    expect(g()).toBe(0);
    expect(g("badestube")).toBe(1);
    expect(g("beginen")).toBe(1);
    expect(g("badestube", "beginen")).toBe(2);
    expect(g("herbs", "badestube")).toBe(2);
    expect(g("library", "beginen")).toBe(2);
    expect(g("herbs", "healer", "badestube", "beginen")).toBe(4);
    expect(g(...GEMEINWESEN)).toBe(5);
  });
  it("capacity: series 1/1/0.25/0.25 in any order, library 1 outside the series", () => {
    expect(CAPACITY_SERIES).toEqual([1, 1, 0.25, 0.25]);
    const c = (...i: string[]) => gemeinwesenCapacity("lab", own(...i), t0);
    for (const a of ["herbs", "healer", "badestube", "beginen"]) expect(c(a), a).toBe(1);
    for (const pair of [
      ["herbs", "healer"],
      ["badestube", "beginen"],
      ["herbs", "beginen"],
      ["healer", "badestube"],
    ])
      expect(c(...pair), pair.join()).toBe(2);
    for (const three of [
      ["herbs", "healer", "badestube"],
      ["herbs", "badestube", "beginen"],
      ["healer", "badestube", "beginen"],
    ])
      expect(c(...three), three.join()).toBe(2.25);
    expect(c("herbs", "healer", "badestube", "beginen")).toBe(2.5);
    expect(c("library")).toBe(1);
    expect(c("library", "herbs", "healer")).toBe(3);
    expect(c("library", "herbs", "healer", "badestube", "beginen")).toBe(3.5);
    // as percent of the land: 10 / 10 / 2.5 / 2.5, library +10
    expect(c("herbs", "healer", "badestube", "beginen") * FEED_HEALTH_ITEM).toBeCloseTo(0.25, 9);
  });
  it("before the cut-over and on public maps: exactly today's count (herb hut, healer, library)", () => {
    for (const items of subsets(GEMEINWESEN)) {
      const o = new Set(items),
        classic = GEMEINWESEN_CLASSIC.filter((i) => o.has(i)).length;
      expect(gemeinwesenGate("lab", o, GEMEINWESEN_LAB_SINCE - 1), items.join()).toBe(classic);
      expect(gemeinwesenCapacity("lab", o, GEMEINWESEN_LAB_SINCE - 1), items.join()).toBe(classic);
      expect(gemeinwesenGate("europe", o, t0), items.join()).toBe(classic);
      expect(gemeinwesenCapacity("europe", o, t0), items.join()).toBe(classic);
    }
    expect([...CARE_HEALTH].sort()).toEqual([...GEMEINWESEN_CLASSIC].sort());
  });
  it("the new rule never lowers a count (every combination of the five)", () => {
    for (const items of subsets(GEMEINWESEN)) {
      const o = new Set(items);
      expect(gemeinwesenGate("lab", o, t0)).toBeGreaterThanOrEqual(
        gemeinwesenGate("lab", o, GEMEINWESEN_LAB_SINCE - 1),
      );
      expect(gemeinwesenCapacity("lab", o, t0)).toBeGreaterThanOrEqual(
        gemeinwesenCapacity("lab", o, GEMEINWESEN_LAB_SINCE - 1),
      );
    }
  });
  it("cut-over dates: lab 25.11.2026, every public map keeps the safe placeholder 04.01.2100", () => {
    expect(GEMEINWESEN_LAB_SINCE).toBe(Date.UTC(2026, 10, 25));
    expect(GEMEINWESEN_SINCE).toBe(Date.UTC(2100, 0, 4));
    expect(gemeinwesenSince("lab")).toBe(GEMEINWESEN_LAB_SINCE);
    for (const r of [
      "europe",
      "europe-2",
      "europe-3",
      "europe-4",
      "us-west",
      "us-west-2",
      "us-east",
      "us-east-2",
      "asia",
      "asia-2",
      null,
      undefined,
    ])
      expect(gemeinwesenSince(r), String(r)).toBe(GEMEINWESEN_SINCE);
    expect(gemeinwesenActive("europe", Date.UTC(2026, 11, 7))).toBe(false);
    expect(gemeinwesenActive("lab", GEMEINWESEN_LAB_SINCE - 1)).toBe(false);
    expect(gemeinwesenActive("lab", GEMEINWESEN_LAB_SINCE)).toBe(true);
  });
  it("the five are real Dorf-phase purchases (Badestube and Beginenhof from Dorf)", () => {
    for (const i of GEMEINWESEN) expect(ITEMS[i as keyof typeof ITEMS], i).toBeGreaterThan(0);
    expect(ITEM_RANK["badestube"]).toBe(2);
    expect(ITEM_RANK["beginen"]).toBe(2);
  });
});

describe("Gemeinwesen in the care gate and the household capacity", () => {
  it("care gate: food unchanged; any one opens Handelsstadt, any two Hansestadt; missing list offers all five", () => {
    const at = t0 + 240 * day;
    expect(careStage(seed([...FOOD, "badestube", "beginen"]), at)).toBe(
      careStage(seed([...FOOD, "herbs", "healer"]), at),
    );
    expect(careStage(seed([...FOOD, "herbs", "badestube"]), at)).toBe(5);
    expect(careStage(seed([...FOOD, "beginen"]), at)).toBe(4);
    expect(careStage(seed([...FOOD]), at)).toBe(3);
    // food still decides: without food no Gemeinwesen helps
    expect(careStage(seed(["herbs", "healer", "badestube", "beginen", "library"]), at)).toBe(2);
    expect(careStage(seed(["hunter", "herbs", "healer", "badestube"]), at)).toBe(3);
    // public maps: unchanged
    expect(careStage(seed([...FOOD, "badestube", "beginen"], "europe"), at)).toBe(3);
    const m = careMissing(seed([...FOOD, "herbs"]), at)!;
    expect(m.health).toBe(1);
    expect(m.healthItems).toEqual(["healer", "library", "badestube", "beginen"]);
    expect(careMissing(seed([...FOOD, "herbs"], "europe"), at)!.healthItems).toEqual([
      "healer",
      "library",
    ]);
  });
  it("capacity: 10/10/2.5/2.5 in any order, library +10 outside the series, public maps unchanged", () => {
    const at = t0 + 10 * day;
    const cap = (items: string[], realm: Realm = "lab") =>
      foodCapacity(seed([...FOOD, ...items], realm), new Map(), at, 20);
    const two = cap(["herbs", "healer"]);
    expect(cap(["badestube", "beginen"])).toBe(two);
    expect(cap(["herbs", "badestube"])).toBe(two);
    const three = cap(["herbs", "healer", "beginen"]),
      four = cap(["herbs", "healer", "badestube", "beginen"]);
    expect(cap(["healer", "badestube", "beginen"])).toBe(three);
    expect(three).toBeGreaterThan(two);
    expect(four).toBeGreaterThan(three);
    expect(three - two).toBeLessThan(two - cap(["herbs"]));
    expect(cap(["library", "herbs", "healer"])).toBe(cap(["library", "herbs", "healer"], "europe"));
    expect(cap(["badestube", "beginen"], "europe")).toBe(cap([], "europe"));
    expect(cap(["herbs", "healer"], "europe")).toBe(two);
  });
  it("resident tax population: the rule never costs taxpayers and Badestube + Beginenhof replace herb hut + healer", () => {
    const pop = (items: string[], realm: Realm = "lab") =>
      residentTax(
        seed([...FOOD, ...items], realm),
        [seed([...FOOD, ...items], realm)],
        t0 + 240 * day,
      ).population;
    const classic = pop(["herbs", "healer"]),
      alt = pop(["badestube", "beginen"]);
    expect(Math.abs(alt - classic) / classic).toBeLessThan(0.02); // only different building footprints
    expect(alt).toBeGreaterThan(pop(["badestube", "beginen"], "europe")); // public maps: today's rule
    for (const items of [
      ["herbs", "healer", "badestube", "beginen"],
      ["herbs", "badestube"],
      ["library", "beginen"],
    ])
      expect(pop(items), items.join()).toBeGreaterThanOrEqual(pop(items, "europe"));
  }, 60000);
});

describe("wedding rhythm deliberately unchanged (separate package with DB village_weddings + parity test)", () => {
  it("wedStage ignores the cut-over: Badestube/Beginenhof/library do not count there, lab equals public maps", () => {
    const at = t0 + 240 * day;
    for (const items of [
      ["badestube", "beginen"],
      ["herbs", "badestube"],
      ["herbs", "library"],
      ["herbs", "healer"],
      [],
    ])
      expect(wedStage(seed([...FOOD, ...items]), at), items.join()).toBe(
        wedStage(seed([...FOOD, ...items], "europe"), at),
      );
    expect(wedStage(seed([...FOOD, "badestube", "beginen"]), at)).toBeLessThan(
      wedStage(seed([...FOOD, "herbs", "healer"]), at),
    );
  });
});

describe("Gemeinwesen never rewrites the past", () => {
  it("buildings bought before the cut-over count from the cut-over on, never back in time", () => {
    const created = GEMEINWESEN_LAB_SINCE - 200 * day,
      bought = GEMEINWESEN_LAB_SINCE - 150 * day;
    const s = seed([...FOOD, "badestube", "beginen"], "lab", bought, created);
    const pub = seed([...FOOD, "badestube", "beginen"], "europe", bought, created);
    const before = GEMEINWESEN_LAB_SINCE - day,
      after = GEMEINWESEN_LAB_SINCE + day;
    expect(careStage(s, before)).toBe(careStage(pub, before));
    expect(foodCapacity(s, new Map(), before, 20)).toBe(foodCapacity(pub, new Map(), before, 20));
    expect(careStage(s, after)).toBeGreaterThan(careStage(pub, after));
    expect(foodCapacity(s, new Map(), after, 20)).toBeGreaterThan(
      foodCapacity(pub, new Map(), after, 20),
    );
  });
  it("Badestube shows no HUD health points — before and after the cut-over, public maps and lab", () => {
    const hud = (items: string[], realm: Realm, at: number) => {
      const s = seed(items, realm, at - 10 * day, at - 20 * day);
      const rows = (s.bought ?? []).map((x) => ({
        seed_id: s.id,
        item: x.item,
        created_at: new Date(x.at).toISOString(),
      }));
      return attributes(s, [s], rows as never, at).health;
    };
    for (const realm of ["europe", "lab"] as Realm[])
      for (const at of [GEMEINWESEN_LAB_SINCE - 30 * day, t0 + 30 * day])
        expect(hud([...FOOD, "badestube"], realm, at), `${realm} ${at}`).toBe(
          hud([...FOOD], realm, at),
        );
  });
  it("Badestube build text promises no health points in any of the eight languages", () => {
    for (const l of LANGS) {
      const d = (DICT[l] as unknown as { items: Record<string, [string, string]> }).items[
        "badestube"
      ]![1];
      expect(d, l).not.toMatch(
        /\+\s?10|10\s?\+|＋10|健康|health|Gesundheit|santé|salud|صحة|स्वास्थ्य/i,
      );
      expect(d.length, l).toBeGreaterThan(10);
    }
  });
  it("texts exist in all eight languages", () => {
    for (const l of LANGS) {
      expect(GEMEINWESEN_T[l].length, l).toBeGreaterThan(20);
      expect(BADESTUBE_WINTER_T[l].length, l).toBeGreaterThan(20);
    }
    expect(BADESTUBE_WINTER).toBe(0.5);
  });
});

describe("Badestube: the real effect (controlled conditions)", () => {
  // winter and summer in the lab after the cut-over; the same purchases on a public map keep today's rule (placeholder 2100)
  const WIN = Date.UTC(2027, 0, 20, 12),
    SUM = Date.UTC(2027, 6, 15, 12),
    OLD_WIN = Date.UTC(2026, 0, 20, 12);
  const C0 = Date.UTC(2025, 0, 1);
  const HALL = [0, 1, 2].map((i) => ({ item: `harvest${i + 1}`, at: Date.UTC(2025, 2, 1) + i }));
  const town = (items: string[], realm: Realm = "lab", hall = false, id = "bad"): Seed => ({
    id,
    name: "B",
    owner: "o",
    hue: 1,
    x: 400,
    y: 540,
    user_id: null,
    realm,
    created_at: new Date(C0).toISOString(),
    bought: [
      ...items.map((item, k) => ({ item, at: C0 + (1 + k) * day })),
      ...(hall ? HALL : []),
    ].sort((a, b) => a.at - b.at),
  });
  // winter part of the risk: the year-round care cuts multiply both seasons alike, summer has no winter term
  const surcharge = (s: Seed, at: number) => sickChance(s, at) - sickChance(s, SUM);
  it("winter: exactly half the surcharge; summer: no effect", () => {
    expect(seasonAt(WIN).winter).toBeGreaterThan(0.9);
    expect(seasonAt(SUM).winter).toBe(0);
    const plain = surcharge(town([]), WIN),
      bad = surcharge(town(["badestube"]), WIN);
    expect(plain).toBeGreaterThan(0.02);
    expect(bad).toBeCloseTo(plain / 2, 12);
    expect(sickChance(town(["badestube"]), SUM)).toBeCloseTo(sickChance(town([]), SUM), 12);
  });
  it("with Erntedankhalle step 3: each halves, both together leave a quarter (multiplicative)", () => {
    const plain = surcharge(town([]), WIN);
    expect(surcharge(town([], "lab", true), WIN)).toBeCloseTo(plain / 2, 12);
    expect(surcharge(town(["badestube"], "lab", true), WIN)).toBeCloseTo(plain / 4, 12);
    expect(sickChance(town(["badestube"], "lab", true), SUM)).toBeCloseTo(
      sickChance(town([]), SUM),
      12,
    );
  });
  it("not before the cut-over, not on public maps (placeholder), harvest hall unchanged there", () => {
    expect(sickChance(town(["badestube"]), OLD_WIN)).toBeCloseTo(sickChance(town([]), OLD_WIN), 12);
    expect(sickChance(town(["badestube"], "europe"), WIN)).toBeCloseTo(
      sickChance(town([], "europe"), WIN),
      12,
    );
    expect(surcharge(town([], "europe", true), WIN)).toBeCloseTo(
      surcharge(town([], "europe"), WIN) / 2,
      12,
    );
  });
  it("independent of the order of the Gemeinwesen and never applied twice", () => {
    const five = ["herbs", "healer", "library", "badestube", "beginen"];
    const perms = (xs: string[]): string[][] =>
      xs.length <= 1
        ? [xs]
        : xs.flatMap((x, i) =>
            perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]),
          );
    const ref = sickChance(town(five), WIN);
    for (const p of perms(five)) expect(sickChance(town(p), WIN), p.join()).toBeCloseTo(ref, 12);
    // a second Badestube row (e.g. after a move or a duplicate) does not halve again
    expect(sickChance(town([...five, "badestube"]), WIN)).toBeCloseTo(ref, 12);
    // with every care building the Badestube still halves exactly the winter part
    const noBad = town(["herbs", "healer", "library", "beginen"]);
    expect(surcharge(town(five), WIN)).toBeCloseTo(surcharge(noBad, WIN) / 2, 12);
  });
  it("the productive resident tax uses it: winter income rises, households equal", () => {
    const at = t0 + 55 * day; // 20.01.2027: winter, young village (space binds, capacity does not)
    expect(seasonAt(at).winter).toBeGreaterThan(0.9);
    const lab = seed([...FOOD, "herbs", "badestube"], "lab", t0 + day, t0),
      pub = { ...lab, realm: "europe" } as Seed;
    const a = residentTax(lab, [lab], at),
      b = residentTax(pub, [pub], at);
    expect(a.households).toBe(b.households);
    expect(a.assessed).toBe(b.assessed);
    expect(sickChance(lab, at)).toBeLessThan(sickChance(pub, at));
    expect(a.income).toBe(a.assessed - sickLoss(a.assessed, sickChance(lab, at)));
    expect(a.income).toBeGreaterThanOrEqual(b.income);
  });
});
