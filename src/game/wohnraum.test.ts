import { afterEach, describe, expect, it } from "vitest";
import { dwellingSlots, NO_PERKS, WAY_EARLY_HOME, MAX_SLOTS, type HousingPerks } from "./density";
import { housingPerks, housingSince, householdsOf, foodCapacity, HOUSING_FOOD } from "./households";
import { bauhuetteGrowth, bauhuetteHours } from "./vorhaben";
import { rankInput, rankOf, townRank } from "./rank";
import { citizensOf, townOf, resetRankMemo } from "./people";
import { guildtowerDone, type Seed, type Kind } from "./world";
import { setRealm } from "./time";

const D = 864e5, SINCE = housingSince.at;
const P = (p: Partial<HousingPerks>): HousingPerks => ({ ...NO_PERKS, ...p });
const MULTI: Kind[] = ["cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement", "suburb"];
const WAYS = ["grain", "workshop", "gateway"] as const;
afterEach(() => { housingSince.at = SINCE; resetRankMemo(); });

describe("P1-1 dwellingSlots perks", () => {
  it("cutover is a placeholder that blocks release (same rule as the Bauhütte)", () => {
    // RELEASE BLOCKER: 2026-12-01 is a placeholder, not a decided publish date. Set housingSince.at to the exact
    // publish moment before release and change this expectation with it.
    expect(new Date(SINCE).toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
  it("without perks the rule is exactly the old one, and every perk only ever adds", () => {
    const combos: Partial<HousingPerks>[] = [{ woodcamp: true }, { herberge: true }, { wayEarly: true }, { wayBig: true }, { wayBig: true, saltquay: true }, { shift: 1 }, { shift: 3 },
      { woodcamp: true, herberge: true, wayEarly: true, wayBig: true, saltquay: true, shift: 3 }];
    for (const way of WAYS) for (const kind of [...MULTI, "hut", "farmhouse"] as Kind[]) for (let r = 0; r <= 50; r++) {
      const old = dwellingSlots(way, kind, r);
      expect(dwellingSlots(way, kind, r, NO_PERKS)).toBe(old);
      for (const c of combos) {
        const n = dwellingSlots(way, kind, r, P(c));
        expect(n).toBeGreaterThanOrEqual(old);
        expect(n).toBeLessThanOrEqual(MAX_SLOTS);
      }
    }
  });
  it("Holzfällerlager: second family in half-timbered and town houses from radius 16 instead of 18", () => {
    for (const kind of ["fachwerk", "townhouse", "townhouse2"] as Kind[]) {
      expect(dwellingSlots("grain", kind, 15, P({ woodcamp: true }))).toBe(1);
      expect(dwellingSlots("grain", kind, 16, P({ woodcamp: true }))).toBe(2);
      expect(dwellingSlots("grain", kind, 16)).toBe(1);
    }
    expect(dwellingSlots("grain", "cottage", 16, P({ woodcamp: true }))).toBe(1);
    expect(dwellingSlots("grain", "patrician", 16, P({ woodcamp: true }))).toBe(1);
  });
  it("Gesellenherberge: one more family in craftsmen's houses from radius 12, capped at MAX_SLOTS", () => {
    expect(dwellingSlots("grain", "handwerker", 11, P({ herberge: true }))).toBe(1);
    expect(dwellingSlots("grain", "handwerker", 12, P({ herberge: true }))).toBe(2);
    expect(dwellingSlots("grain", "handwerker", 30, P({ herberge: true }))).toBe(4);
    expect(dwellingSlots("workshop", "handwerker", 24, P({ herberge: true }))).toBe(4);
    expect(dwellingSlots("grain", "steinhaus", 30, P({ herberge: true }))).toBe(3);
  });
  it("small way building: second family from radius 12 only in its own way's houses", () => {
    for (const way of WAYS) for (const kind of MULTI) {
      const lifted = WAY_EARLY_HOME[way].has(kind) || (way === "workshop" && ["steinhaus", "handwerker", "tenement"].includes(kind));
      expect(dwellingSlots(way, kind, 11, P({ wayEarly: true }))).toBe(1);
      expect(dwellingSlots(way, kind, 12, P({ wayEarly: true }))).toBe(lifted ? 2 : 1);
    }
    expect(dwellingSlots("grain", "cottage", 12, P({ wayEarly: true }))).toBe(2);
    expect(dwellingSlots("workshop", "patrician", 12, P({ wayEarly: true }))).toBe(2);
    expect(dwellingSlots("gateway", "steinhaus", 12, P({ wayEarly: true }))).toBe(2);
  });
  it("large way building: third family from radius 26 instead of 30; Salzkontor adds a fourth in merchant houses from 26", () => {
    expect(dwellingSlots("grain", "townhouse", 25, P({ wayBig: true }))).toBe(2);
    expect(dwellingSlots("grain", "townhouse", 26, P({ wayBig: true }))).toBe(3);
    expect(dwellingSlots("grain", "townhouse", 26)).toBe(2);
    expect(dwellingSlots("gateway", "steinhaus", 25, P({ wayBig: true, saltquay: true }))).toBe(2);
    expect(dwellingSlots("gateway", "steinhaus", 26, P({ wayBig: true, saltquay: true }))).toBe(4);
    expect(dwellingSlots("gateway", "steinhaus", 26, P({ wayBig: true }))).toBe(3);
    expect(dwellingSlots("gateway", "villa", 26, P({ wayBig: true, saltquay: true }))).toBe(3);
  });
  it("Zunftturm: each finished step brings every threshold one radius earlier", () => {
    for (const [shift, r2, r3] of [[0, 18, 30], [1, 17, 29], [2, 16, 28], [3, 15, 27]] as const) {
      expect(dwellingSlots("workshop", "townhouse", r2 - 1, P({ shift }))).toBe(1);
      expect(dwellingSlots("workshop", "townhouse", r2, P({ shift }))).toBe(2);
      expect(dwellingSlots("workshop", "townhouse", r3 - 1, P({ shift }))).toBe(2);
      expect(dwellingSlots("workshop", "townhouse", r3, P({ shift }))).toBe(3);
      expect(dwellingSlots("workshop", "steinhaus", 12 - shift, P({ shift }))).toBe(2);
      expect(dwellingSlots("workshop", "steinhaus", 24 - shift, P({ shift }))).toBe(3);
    }
    // thresholds of bought perks move too
    expect(dwellingSlots("grain", "fachwerk", 14, P({ woodcamp: true, shift: 2 }))).toBe(2);
    expect(dwellingSlots("grain", "townhouse", 24, P({ wayBig: true, shift: 2 }))).toBe(3);
  });
});

describe("P1-1 housingPerks from bought rows", () => {
  setRealm("europe");
  const t0 = Date.parse("2026-06-01T00:00:00Z");
  const town = (bought: NonNullable<Seed["bought"]>): Seed => ({ id: "eeee0000-wr", name: "W", owner: "w", user_id: "u-w", x: 166, y: 613, hue: 0, realm: "europe", created_at: new Date(t0).toISOString(), bought });
  it("nothing before the purchase, nothing before the cutover, everything from both on", () => {
    const at = SINCE + 10 * D;
    const s = town(["woodcamp", "herberge", "stonemason", "hammerworks"].map((item) => ({ item, at })));
    expect(housingPerks(s, at - 1)).toEqual(NO_PERKS);
    expect(housingPerks(s, at)).toEqual({ ...NO_PERKS, woodcamp: true, herberge: true, wayEarly: true, wayBig: true });
    // bought long before the cutover: no effect on any moment before it, full effect from it on (adds, never takes)
    const old = town(["woodcamp", "saltquay"].map((item) => ({ item, at: SINCE - 100 * D })));
    expect(housingPerks(old, SINCE - 1)).toEqual(NO_PERKS);
    expect(housingPerks(old, SINCE)).toEqual({ ...NO_PERKS, woodcamp: true, wayBig: true, saltquay: true });
  });
  it("Zunftturm shift counts finished steps only (guildtowerDone), 0 before the cutover", () => {
    const s = town([1, 2, 3].map((i) => ({ item: `guildtower${i}`, at: SINCE + i * D })));
    expect(housingPerks(s, SINCE + D).shift).toBe(0);
    for (const t of [SINCE + 2 * D, SINCE + 5 * D, SINCE + 30 * D, SINCE + 90 * D]) expect(housingPerks(s, t).shift).toBe(guildtowerDone(s, t));
    expect(housingPerks(s, SINCE + 90 * D).shift).toBe(3);
    housingSince.at = SINCE + 200 * D;
    expect(housingPerks(s, SINCE + 90 * D).shift).toBe(0);
  });
  it("Großspeicher and Fischhalle add food capacity like the other food crafts, only from the cutover", () => {
    expect(HOUSING_FOOD).toEqual(["bigstore", "smokehouse"]);
    const base = town([]), store = town([{ item: "bigstore", at: SINCE - D }]);
    expect(foodCapacity(store, new Map(), SINCE - 1, 24)).toBe(foodCapacity(base, new Map(), SINCE - 1, 24));
    expect(foodCapacity(store, new Map(), SINCE, 24)).toBeGreaterThan(foodCapacity(base, new Map(), SINCE, 24));
  });
});

describe("P1-1 in the real household roster", () => {
  setRealm("europe");
  const c0 = Date.parse("2026-01-10T00:00:00Z");
  const care = ["hunter", "herbs", "granary", "fisher", "healer", "dairy", "library"];
  const perkItems = ["woodcamp", "herberge", "stonemason", "hammerworks", "guildtower1", "guildtower2", "guildtower3"];
  // workshop sample location of the simulation, with the simulation's two sample neighbours
  const s: Seed = { id: "ffff0000-wr", name: "Hang", owner: "h", user_id: "u-h", x: 166, y: 613, hue: 0, realm: "europe", created_at: new Date(c0).toISOString(),
    bought: [...care.map((item, i) => ({ item, at: c0 + (1 + i) * D })), ...perkItems.map((item, i) => ({ item, at: c0 + (20 + 3 * i) * D }))] };
  const nb = (id: string, dx: number): Seed => ({ id, name: id, owner: "nb", x: 166 + dx, y: 613, hue: 0, realm: "europe", created_at: new Date(c0 - 60 * D).toISOString() });
  const seeds = [s, nb("nb1", 15), nb("nb2", -15)];
  const at = c0 + 200 * D;
  const run = (since: number) => { housingSince.at = since; resetRankMemo(); const hh = householdsOf(s, seeds, at); return { hh, input: rankInput(s, seeds, at), rank: townRank(s, seeds, at) }; };
  it("perks reach households, citizens and rank — never fewer families than without them", () => {
    const off = run(Infinity), on = run(c0);
    expect(on.hh.length).toBeGreaterThan(off.hh.length);
    expect(on.input.citizens).toBeGreaterThan(off.input.citizens);
    expect(on.rank).toBeGreaterThanOrEqual(off.rank);
    // every ground-floor family of the old roster is still housed
    const key = (h: { home: number[]; unit?: number }) => `${h.home.join(",")}#${h.unit ?? 0}`;
    const onKeys = new Set(on.hh.map(key));
    for (const h of off.hh) if (!h.unit) expect(onKeys.has(key(h))).toBe(true);
  });
  it("households, citizens, rank and the townOf roll agree", () => {
    const r = run(c0);
    expect(r.input.homes).toBe(r.hh.length);
    expect(r.input.citizens).toBe(r.hh.reduce((n, h) => n + h.size, 0));
    expect(r.rank).toBe(rankOf(r.input));
    expect(citizensOf(townOf(s, seeds, at)).length).toBe(r.input.citizens);
  });
  it("historical states before the cutover are unchanged", () => {
    const off = run(Infinity), cut = run(at + 1);
    expect(cut.hh).toEqual(off.hh);
    expect(cut.input).toEqual(off.input);
  });
  it("P0 Bauhütte growth is untouched by the housing perks", () => {
    const b = { bought: [{ item: "bauhuette1", at: bauhuetteGrowth.since + D }] };
    expect(bauhuetteHours(b, bauhuetteGrowth.since + 10 * D)).toBeCloseTo(48 * bauhuetteGrowth.rate, 9);
  });
});
