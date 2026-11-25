// Hochzeitspaket: one wedding rule. Before weddingSwitchSince(realm) the legacy rule (herb hut + healer) stays
// bit-for-bit as on main (frozen reference below); from it the health side is exactly the care gate's Gemeinwesen
// count (gemeinwesenGate + careHealthExtra). Both switch dates are the safe placeholder 2100-01-04, so the unified
// rule is exercised with villages founded shortly before it.
import { describe, expect, it } from "vitest";
import {
  weddingCalendar, weddingDates, wedStage, wedHealth, weddingSwitchSince, WEDDING_SWITCH_SINCE, WEDDING_SWITCH_LAB_SINCE,
  dowryAt, WED_NOTABLE,
} from "./weddings";
import { weddingReceiptRows, WEDDING_RECEIPT_VERSION, WEDDING_RECEIPT_VERSION_UNIFIED } from "./wedding-receipts";
import { gemeinwesenGate } from "./gemeinwesen";
import { careHealthExtra, careStage, cathedralDone, universityDone, type Seed } from "./world";
import { civicWealth } from "./prosperity";
import { FOOD_CRAFTS } from "./food-crafts";

const D = 864e5, H = 3.6e6;
const T = WEDDING_SWITCH_SINCE;

/** Frozen copy of the legacy rule exactly as on main before this package (weddings.ts wedStage/wedPop/wedGapHours). */
function legacyCalendar(s: Seed, now: number) {
  const FOOD: readonly string[] = FOOD_CRAFTS, HEALTH = ["herbs", "healer"], NEED: [number, number][] = [[1, 0], [2, 1], [3, 2]];
  const CAP = [84, 84, 84, 150, 260];
  const own = (t: number) => new Set((s.bought ?? []).filter((b) => b.at <= t).map((b) => b.item));
  const stage = (t: number) => {
    const h = Math.max(0, (t - Date.parse(s.created_at)) / 3.6e6);
    const raw = [24, 168, 2160, 4380, 8760].filter((a) => h >= a).length;
    if (!s.user_id) return raw;
    const o = own(t), f = FOOD.filter((i) => o.has(i)).length, hl = HEALTH.filter((i) => o.has(i)).length;
    let st = 2;
    for (const [nf, nh] of NEED) { if (f >= nf && hl >= nh) st++; else break; }
    return Math.min(raw, st);
  };
  const pop = (t: number) => {
    const h = Math.max(0, (t - Date.parse(s.created_at)) / 3.6e6);
    const r = 1.6 + 0.18 * Math.sqrt(h) + 3 * Math.log(1 + h / 60);
    const p = Math.floor(3 + 0.9 * Math.pow(r, 1.6)), st = stage(t);
    return st >= 5 ? p : Math.min(p, CAP[st]!);
  };
  const gap = (t: number) => {
    const w = civicWealth(s, t), f = FOOD.filter((i) => own(t).has(i)).length;
    const days = Math.min(20, Math.max(2, 9 * Math.sqrt(40 / Math.max(10, pop(t)))));
    const cut = (1 - 0.25 * Math.min(1, Math.max(0, (w - 40) / 40))) * (1 - 0.04 * f);
    return Math.max(1, Math.floor(24 * days * cut + 0.5));
  };
  const out: { at: number; k: number; dowry: number; town: boolean; grand: boolean }[] = [];
  for (let t = Date.parse(s.created_at) + 2 * D; t <= now; t += gap(t) * H) {
    const k = out.length, town = stage(t) >= 3;
    out.push({ at: t, k, dowry: dowryAt(civicWealth(s, t)), town, grand: !town || k % WED_NOTABLE === WED_NOTABLE - 1 });
  }
  return out;
}

let n = 0;
const village = (created: number, bought: [string, number][], realm = "europe", owner: string | null = "u"): Seed =>
  ({ id: `hp-${++n}`, user_id: owner, realm, x: 500, y: 500, created_at: new Date(created).toISOString(),
     bought: bought.map(([item, at]) => ({ item, at })) }) as unknown as Seed;
const FOOD4 = ["fisher", "hunter", "granary", "dairy"];
const GEMEIN = ["herbs", "healer", "library", "badestube", "beginen"];
/** Every subset of `xs`. */
const subsets = <X,>(xs: readonly X[]) => xs.reduce<X[][]>((a, x) => a.concat(a.map((s) => [...s, x])), [[]]);

describe("Hochzeitspaket – switch dates", () => {
  it("both realms stay on the safe placeholder until the release (mirrors DB wedding_switch_since)", () => {
    expect(WEDDING_SWITCH_SINCE).toBe(Date.UTC(2100, 0, 4));
    expect(WEDDING_SWITCH_LAB_SINCE).toBe(Date.UTC(2100, 0, 4));
    expect(weddingSwitchSince("lab")).toBe(WEDDING_SWITCH_LAB_SINCE);
    for (const r of ["europe", "us-west", "asia-2", null, undefined]) expect(weddingSwitchSince(r)).toBe(WEDDING_SWITCH_SINCE);
  });
});

describe("Hochzeitspaket – no retroactive change", () => {
  const c0 = Date.parse("2026-01-01T00:00:00Z"), now = c0 + 330 * D;
  it("before the switch every combination of food crafts and Gemeinwesen gives the legacy calendar exactly", () => {
    let checked = 0;
    for (const food of [0, 1, 2, 3, 4]) for (const g of subsets(GEMEIN)) {
      const bought: [string, number][] = [...FOOD4.slice(0, food).map((i, k) => [i, c0 + (5 + 9 * k) * D] as [string, number]),
        ...g.map((i, k) => [i, c0 + (12 + 17 * k) * D] as [string, number]), ["school", c0 + 40 * D]];
      const s = village(c0, bought);
      expect(weddingCalendar(s, now), `${food} food + ${g.join(",")}`).toEqual(legacyCalendar(s, now));
      checked++;
    }
    expect(checked).toBe(5 * 32);
  });
  it("unowned villages and monuments are untouched as well", () => {
    const mon = village(c0, [["fisher", c0], ["hunter", c0], ["granary", c0], ["herbs", c0], ["healer", c0],
      ["cathedral1", c0 + 20 * D], ["cathedral2", c0 + 21 * D], ["cathedral3", c0 + 22 * D], ["orangery1", c0 + 23 * D], ["orangery2", c0 + 24 * D]]);
    expect(weddingCalendar(mon, now)).toEqual(legacyCalendar(mon, now));
    const free = village(c0, [["library", c0], ["fisher", c0]], "europe", null);
    expect(weddingCalendar(free, now)).toEqual(legacyCalendar(free, now));
  });
  it("receipts before the switch keep version 1 and the legacy content", () => {
    const s = village(c0, [["fisher", c0 + D], ["hunter", c0 + D], ["herbs", c0 + D], ["library", c0 + D]]);
    const rows = weddingReceiptRows(s, now), ref = legacyCalendar(s, now);
    expect(rows.map((r) => [r.wedding_index, Date.parse(r.occurred_at), r.dowry])).toEqual(ref.map((w) => [w.k, w.at, w.dowry]));
    expect(rows.every((r) => r.version === WEDDING_RECEIPT_VERSION)).toBe(true);
  });
});

describe("Hochzeitspaket – unified rule from the switch", () => {
  // founded 2099-10-01: raw era 3 (Kleinstadt) from day 90 — 2099-12-30 — just before the switch
  const c0 = Date.UTC(2099, 9, 1), late = T + 240 * D;
  const base: [string, number][] = [["fisher", c0 + D], ["hunter", c0 + D], ["granary", c0 + D], ["school", c0 + D]];

  it("health side = care gate's Gemeinwesen count (gemeinwesenGate + careHealthExtra), food stays FOOD_CRAFTS", () => {
    for (const g of subsets(GEMEIN)) {
      const s = village(c0, [...base, ...g.map((i) => [i, c0 + 2 * D] as [string, number])]);
      for (const t of [T - H, T, T + 30 * D]) {
        const own = new Set((s.bought ?? []).filter((b) => b.at <= t).map((b) => b.item));
        const expected = t < T ? ["herbs", "healer"].filter((i) => own.has(i)).length : gemeinwesenGate(s.realm, own, t) + careHealthExtra(s, t, own);
        expect(wedHealth(s, t, own), `${g.join(",")} @${t - T}`).toBe(expected);
      }
    }
  });

  it("all stages: every food/Gemeinwesen combination reaches exactly the stage the shared rule allows", () => {
    const t = T + 200 * D; // raw era 4 (Handelsstadt) for c0
    for (const food of [0, 1, 2, 3]) for (const g of subsets(GEMEIN)) {
      const s = village(c0, [...FOOD4.slice(0, food).map((i) => [i, c0 + D] as [string, number]), ...g.map((i) => [i, c0 + D] as [string, number])]);
      const hl = g.length; // from the switch on (gemeinwesenSince public = switch placeholder) all five count
      let st = 2;
      for (const [nf, nh] of [[1, 0], [2, 1], [3, 2]] as const) { if (food >= nf && hl >= nh) st++; else break; }
      expect(wedStage(s, t), `${food} food + ${g.join(",")}`).toBe(Math.min(4, st));
    }
  });

  it("library, Badestube and Beginenhof lift the rhythm only for weddings from the switch on", () => {
    for (const g of ["library", "badestube", "beginen"]) {
      // three food crafts, no herb hut/healer: legacy health 0 (Kleinstadt cap), unified health 1 (Handelsstadt)
      const s = village(c0, [...base, [g, c0 + D]]);
      expect(wedStage(s, T - H), g).toBe(3);
      expect(wedStage(s, T + 100 * D), g).toBe(4);
      const cal = weddingCalendar(s, late), ref = legacyCalendar(s, late);
      expect(cal.filter((w) => w.at < T), g).toEqual(ref.filter((w) => w.at < T));
      expect(cal.filter((w) => w.at >= T).length, g).toBeGreaterThan(ref.filter((w) => w.at >= T).length);
    }
  });

  it("the first wedding after the switch keeps the instant the legacy rule gave it (gap fixed at the wedding before)", () => {
    const s = village(c0, [...base, ["herbs", c0 + D], ["badestube", c0 + D], ["beginen", c0 + D]]);
    const ref = legacyCalendar(s, late), cal = weddingCalendar(s, late);
    const firstAfter = ref.findIndex((w) => w.at >= T);
    expect(firstAfter).toBeGreaterThan(0);
    expect(cal.slice(0, firstAfter + 1)).toEqual(ref.slice(0, firstAfter + 1));
  });

  it("Dom and university count once step 3 is physically finished, the Klostergarten from paid step 2 without herb hut", () => {
    const dom = village(c0, [...base, ["herbs", c0 + D], ["cathedral1", T + D], ["cathedral2", T + 2 * D], ["cathedral3", T + 3 * D]]);
    const done = (() => { for (let t = T + 3 * D; t < T + 200 * D; t += H) if (cathedralDone(dom, t) >= 3) return t; return null; })();
    expect(done).not.toBeNull();
    const own = new Set((dom.bought ?? []).map((b) => b.item));
    expect(wedHealth(dom, done! - H, own)).toBe(1);
    expect(wedHealth(dom, done!, own)).toBe(2);
    const uni = village(c0, [...base, ["healer", c0 + D], ["university1", T + D], ["university2", T + 2 * D], ["university3", T + 3 * D]]);
    const udone = (() => { for (let t = T + 3 * D; t < T + 200 * D; t += H) if (universityDone(uni, t) >= 3) return t; return null; })();
    expect(udone).not.toBeNull();
    expect(wedHealth(uni, udone!, new Set((uni.bought ?? []).map((b) => b.item)))).toBe(2);
    const kg = village(c0, [...base, ["healer", c0 + D], ["orangery1", T + D], ["orangery2", T + 2 * D]]);
    expect(wedHealth(kg, T + 2 * D - 1, new Set(["healer", "orangery1"]))).toBe(1);
    expect(wedHealth(kg, T + 2 * D, new Set(["healer", "orangery1", "orangery2"]))).toBe(2);
    const kgHerbs = village(c0, [...base, ["herbs", c0 + D], ["orangery1", T + D], ["orangery2", T + 2 * D]]);
    expect(wedHealth(kgHerbs, T + 3 * D, new Set(["herbs", "orangery1", "orangery2"]))).toBe(1);
  });

  it("matches the care gate: whenever careStage reaches a stage by health, the wedding stage does too (same food)", () => {
    for (const g of subsets(GEMEIN)) {
      // food = all four FOOD_CRAFTS (CARE_FOOD only adds market hall/guild hall, not bought here)
      const s = village(c0, [...FOOD4.map((i) => [i, c0 + D] as [string, number]), ...g.map((i) => [i, c0 + D] as [string, number])]);
      const t = T + 400 * D; // raw era 5
      expect(wedStage(s, t), g.join(",")).toBe(Math.min(5, careStage(s, t)));
    }
  });

  it("receipts from the switch carry version 2; the lab map keeps receipts only from its switch on", () => {
    const s = village(c0, [...base, ["herbs", c0 + D], ["library", c0 + D]]);
    const rows = weddingReceiptRows(s, late);
    expect(rows.filter((r) => Date.parse(r.occurred_at) < T).every((r) => r.version === WEDDING_RECEIPT_VERSION)).toBe(true);
    expect(rows.filter((r) => Date.parse(r.occurred_at) >= T).every((r) => r.version === WEDDING_RECEIPT_VERSION_UNIFIED)).toBe(true);
    const lab = village(c0, [...base, ["herbs", c0 + D]], "lab");
    const labRows = weddingReceiptRows(lab, late), cal = weddingCalendar(lab, late);
    expect(labRows.length).toBeGreaterThan(0);
    expect(labRows.every((r) => Date.parse(r.occurred_at) >= WEDDING_SWITCH_LAB_SINCE)).toBe(true);
    expect(labRows.map((r) => r.wedding_index)).toEqual(cal.filter((w) => w.at >= WEDDING_SWITCH_LAB_SINCE).map((w) => w.k));
  });

  it("display and booking read one calendar (weddingDates = weddingCalendar outside the lab desk)", () => {
    const s = village(c0, [...base, ["herbs", c0 + D], ["beginen", c0 + D]]);
    expect(weddingDates(s, late)).toEqual(weddingCalendar(s, late));
    expect(weddingReceiptRows(s, late).map((r) => Date.parse(r.occurred_at))).toEqual(weddingCalendar(s, late).map((w) => w.at));
  });

  it("append-only across the switch: a later settlement only adds receipts", () => {
    const s = village(c0, [...base, ["herbs", c0 + D], ["library", c0 + 2 * D]]);
    const early = weddingReceiptRows(s, T + 10 * D), later = weddingReceiptRows(s, late);
    expect(later.slice(0, early.length)).toEqual(early);
  });
});
