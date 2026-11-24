import { describe, expect, it } from "vitest";
import {
  GEMEINWESEN_NEW,
  TWO_OF_FIVE_CAP,
  TWO_OF_FIVE_LAB_SINCE,
  TWO_OF_FIVE_SINCE,
  gemeinwesenCount,
  twoOfFiveSince,
} from "./gemeinwesen";
import { HEALTH_CLASSIC, foodCapacity } from "./households";
import { residentTax } from "./resident-tax";
import { careMissing, careStage, CARE_HEALTH, type Seed } from "./world";
import type { Realm } from "./time";
import { wedStage } from "./weddings";
import { ITEMS } from "./economy";
import { ITEM_RANK } from "./disasters";
import { GEMEINWESEN_T } from "./lang/gemeinwesen";
import { LANGS } from "./i18n";

const day = 864e5,
  t0 = TWO_OF_FIVE_LAB_SINCE + day;
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

describe("„2 aus 5“: one counting rule", () => {
  it("any two of the five count as two; more never count above two; a classic three stays three", () => {
    const n = (...i: string[]) =>
      gemeinwesenCount("lab", own(...i), t0, ["herbs", "healer", "library"]);
    expect(n()).toBe(0);
    expect(n("badestube")).toBe(1);
    expect(n("herbs", "healer")).toBe(2);
    expect(n("badestube", "beginen")).toBe(2);
    expect(n("herbs", "badestube")).toBe(2);
    expect(n("healer", "beginen")).toBe(2);
    expect(n("library", "badestube")).toBe(2);
    expect(n("herbs", "healer", "badestube", "beginen")).toBe(TWO_OF_FIVE_CAP);
    expect(n("herbs", "healer", "library")).toBe(3); // culture towns keep what they have today
    expect(n("herbs", "healer", "library", "badestube", "beginen")).toBe(3);
  });
  it("before the cut-over and on public maps: exactly the classic count, Badestube/Beginenhof count nothing", () => {
    const classic = ["herbs", "healer", "library"];
    expect(
      gemeinwesenCount("lab", own("badestube", "beginen"), TWO_OF_FIVE_LAB_SINCE - 1, classic),
    ).toBe(0);
    expect(gemeinwesenCount("europe", own("badestube", "beginen"), t0, classic)).toBe(0);
    expect(gemeinwesenCount("europe", own("herbs", "healer"), t0, classic)).toBe(2);
    expect(twoOfFiveSince("lab")).toBe(TWO_OF_FIVE_LAB_SINCE);
    for (const r of ["europe", "europe-2", "us-west", "asia", null, undefined])
      expect(twoOfFiveSince(r)).toBe(TWO_OF_FIVE_SINCE);
    expect(TWO_OF_FIVE_SINCE).toBeGreaterThan(Date.UTC(2099, 0, 1));
  });
  it("the five are real Dorf-phase purchases (Badestube and Beginenhof from Dorf)", () => {
    for (const i of [...HEALTH_CLASSIC, ...GEMEINWESEN_NEW])
      expect(ITEMS[i as keyof typeof ITEMS], i).toBeGreaterThan(0);
    expect(ITEM_RANK["badestube"]).toBe(2);
    expect(ITEM_RANK["beginen"]).toBe(2);
    expect([...CARE_HEALTH].sort()).toEqual([...HEALTH_CLASSIC].sort());
  });
});

describe("„2 aus 5“ in all three counting places", () => {
  it("household capacity (Haushaltskapazität): any two give the same capacity, a third or fourth adds nothing", () => {
    const cap = (items: string[], realm: Realm = "lab") =>
      foodCapacity(seed(items, realm), new Map(), t0 + 10 * day, 20);
    const two = cap([...FOOD, "herbs", "healer"]);
    expect(cap([...FOOD, "badestube", "beginen"])).toBe(two);
    expect(cap([...FOOD, "herbs", "badestube"])).toBe(two);
    expect(cap([...FOOD, "healer", "beginen"])).toBe(two);
    expect(cap([...FOOD, "herbs", "healer", "badestube", "beginen"])).toBe(two);
    expect(cap([...FOOD, "herbs"])).toBeLessThan(two);
    // public maps unchanged: Badestube and Beginenhof add no capacity there
    expect(cap([...FOOD, "badestube", "beginen"], "europe")).toBe(cap([...FOOD], "europe"));
    expect(cap([...FOOD, "herbs", "healer"], "europe")).toBe(two);
  });
  it("care gate (Versorgung): Badestube + Beginenhof open the eras like herb hut + healer; the missing list offers all five", () => {
    const at = t0 + 240 * day;
    expect(careStage(seed([...FOOD, "badestube", "beginen"]), at)).toBe(
      careStage(seed([...FOOD, "herbs", "healer"]), at),
    );
    expect(careStage(seed([...FOOD, "herbs", "badestube"]), at)).toBe(5);
    expect(careStage(seed([...FOOD, "herbs"]), at)).toBe(4);
    expect(careStage(seed([...FOOD, "badestube", "beginen"], "europe"), at)).toBe(3);
    const m = careMissing(seed([...FOOD, "hunter", "herbs"]), at)!;
    expect(m.health).toBe(1);
    expect(m.healthItems).toEqual(["healer", "library", "badestube", "beginen"]);
    expect(careMissing(seed([...FOOD, "herbs"], "europe"), at)!.healthItems).toEqual([
      "healer",
      "library",
    ]);
  });
  it("the care mirror of the wedding rhythm follows the same rule", () => {
    const at = t0 + 240 * day;
    expect(wedStage(seed([...FOOD, "badestube", "beginen"]), at)).toBe(
      wedStage(seed([...FOOD, "herbs", "healer"]), at),
    );
    expect(wedStage(seed([...FOOD, "badestube", "beginen"], "europe"), at)).toBeLessThan(
      wedStage(seed([...FOOD, "herbs", "healer"], "europe"), at),
    );
  });
  it("resident tax (Steuerbevölkerung): two of five carry the same taxpayers; herb hut + healer are no longer a must", () => {
    const pop = (items: string[], realm: Realm = "lab") =>
      residentTax(
        seed([...FOOD, ...items], realm),
        [seed([...FOOD, ...items], realm)],
        t0 + 240 * day,
      ).population;
    const classic = pop(["herbs", "healer"]),
      alt = pop(["badestube", "beginen"]),
      all = pop(["herbs", "healer", "badestube", "beginen"]);
    const one = pop(["herbs"]);
    expect(Math.abs(alt - classic) / classic).toBeLessThan(0.02); // only different building footprints
    expect(all).toBeLessThanOrEqual(classic); // a third and fourth Gemeinwesen add no taxpayers
    expect(alt).toBeGreaterThan(one * 1.05);
    expect(pop(["badestube", "beginen"], "europe")).toBeLessThan(one); // public maps: unchanged rules
  }, 60000);
});

describe("„2 aus 5“ never rewrites the past", () => {
  it("purchases from before the cut-over count only from the cut-over, never back in time", () => {
    const created = TWO_OF_FIVE_LAB_SINCE - 200 * day,
      bought = TWO_OF_FIVE_LAB_SINCE - 150 * day;
    const s = seed([...FOOD, "badestube", "beginen"], "lab", bought, created);
    const pub = seed([...FOOD, "badestube", "beginen"], "europe", bought, created);
    const before = TWO_OF_FIVE_LAB_SINCE - day,
      after = TWO_OF_FIVE_LAB_SINCE + day;
    expect(careStage(s, before)).toBe(careStage(pub, before));
    expect(foodCapacity(s, new Map(), before, 20)).toBe(foodCapacity(pub, new Map(), before, 20));
    expect(foodCapacity(s, new Map(), after, 20)).toBeGreaterThan(
      foodCapacity(pub, new Map(), after, 20),
    );
  });
  it("a culture town with herb hut, healer and library keeps its capacity", () => {
    const c = (realm: Realm) =>
      foodCapacity(
        seed([...FOOD, "herbs", "healer", "library"], realm),
        new Map(),
        t0 + 10 * day,
        20,
      );
    expect(c("lab")).toBe(c("europe"));
  });
  it("the build-card line exists in all eight languages", () => {
    for (const l of LANGS) expect(GEMEINWESEN_T[l].length, l).toBeGreaterThan(20);
  });
});
