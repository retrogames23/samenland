import { weddingTimes } from "./weddings";
import { describe, it, expect } from "vitest";
import { eventOf, eventWeight, pendingEncounter, activeBoons, boonHours, ENCOUNTERS, encounterGap } from "./encounters";
import { treasury, START_TALER } from "./economy";
const t0 = Date.UTC(2026, 9, 1, 12), H = 3.6e6, seed = { id: "s", name: "S", owner: "o", x: 0, y: 0, hue: 0, created_at: new Date(t0).toISOString() };
describe("encounters", () => {
  it("same village and index always meet the same encounter, never twice in a row", () => {
    expect(eventOf("s", 3)).toBe(eventOf("s", 3));
    const recent: string[] = [];
    for (let n = 0; n < 120; n++) { const e = eventOf("s", n, { ageH: 1e4, season: "summer", recent: recent.slice(-4) }); expect(recent.slice(-4)).not.toContain(e); recent.push(e); }
  });
  it("first encounter after 3 minutes, then a gap of 2.5 h / 4 h / 6 h by age; never more than one open", () => {
    expect(pendingEncounter(seed, [], t0 + 2 * 60000)).toBeNull();
    expect(pendingEncounter(seed, [], t0 + 4 * 60000)).not.toBeNull();
    const d = (h: number) => [{ event: "merchant", choice: "pass", cost: 0, at: t0 + h * H }];
    expect(pendingEncounter(seed, d(1), t0 + 3.4 * H)).toBeNull();
    expect(pendingEncounter(seed, d(1), t0 + 3.6 * H)).not.toBeNull();
    expect(encounterGap(10)).toBe(2.5); expect(encounterGap(100)).toBe(4); expect(encounterGap(400)).toBe(6);
    expect(pendingEncounter(seed, d(400), t0 + 405 * H)).toBeNull();
    expect(pendingEncounter(seed, d(400), t0 + 406 * H)).not.toBeNull();
  });
  it("hosting the journeyman costs 30 Taler and boosts growth 15% for 3 days", () => {
    const d = [{ event: "journeyman", choice: "host", cost: ENCOUNTERS.journeyman.host.cost, at: t0 }];
    expect(treasury({ ...seed, decisions: d }, [], t0)).toBe(START_TALER - 30);
    expect(boonHours(d, t0 + 200 * H)).toBeCloseTo(72 * 0.15);
  });
  it("awarding the meadow earns 20 Taler; boons expire", () => {
    expect(treasury({ ...seed, decisions: [{ event: "boundary", choice: "award", cost: -20, at: t0 }] }, [], t0)).toBe(START_TALER + 20);
    const d = [{ event: "healer", choice: "invite", cost: 35, at: t0 }];
    expect(activeBoons(d, t0 + H).health).toBe(15);
    expect(activeBoons(d, t0 + 97 * H).health).toBe(0);
  });
});

describe("encounter catalogue", () => {
  it("has 23 drawable visitors plus the real wedding, the retired flood and 3 commons questions", () => {
    expect(Object.keys(ENCOUNTERS).length).toBe(32);
    const seen = new Set(Array.from({ length: 2000 }, (_, n) => eventOf("s" + n, 0)));
    expect(seen.has("wedding")).toBe(false); expect(seen.has("flood")).toBe(false);
  });
  it("everyday visitors come more often than rare highlights", () => {
    const n = (e: string) => Array.from({ length: 4000 }, (_, i) => eventOf("w" + i, 0)).filter((x) => x === e).length;
    expect(n("journeyman")).toBeGreaterThan(2 * n("painter"));
  });
  it("maypole only in spring, harvest never in spring or winter, and wolves mostly in winter", () => {
    expect(eventWeight("maypole", { ageH: 1e4, season: "summer", recent: [] })).toBe(0);
    expect(eventWeight("maypole", { ageH: 1e4, season: "spring", recent: [] })).toBeGreaterThan(0);
    expect(eventWeight("harvest", { ageH: 1e4, season: "winter", recent: [] })).toBe(0);
    expect(eventWeight("wolf", { ageH: 1e4, season: "winter", recent: [] })).toBeGreaterThan(eventWeight("wolf", { ageH: 1e4, season: "summer", recent: [] }));
  });
  it("no fair, surveyor or painter before the village (era 2); no pilgrims before the hamlet", () => {
    for (const e of ["fair", "surveyor", "painter"] as const) expect(eventWeight(e, { ageH: 100, season: "summer", recent: [] })).toBe(0);
    expect(eventWeight("pilgrims", { ageH: 10, season: "summer", recent: [] })).toBe(0);
    expect(eventWeight("fair", { ageH: 200, season: "summer", recent: [] })).toBeGreaterThan(0);
  });
});

describe("wedding encounter follows the real wedding calendar", () => {
  const D = 864e5;
  it("appears on day 2 for 3 hours, once, even right after another decision", () => {
    const d = [{ event: "merchant", choice: "pass", cost: 0, at: t0 + 2 * D - H }];
    expect(pendingEncounter(seed, d, t0 + 2 * D + H)).toBe("wedding");
    expect(pendingEncounter(seed, d, t0 + 2 * D + 3.1 * H)).not.toBe("wedding");
    const done = [...d, { event: "wedding", choice: "gift", cost: 25, at: t0 + 2 * D + H }];
    expect(pendingEncounter(seed, done, t0 + 2 * D + 2 * H)).toBeNull();
    const second = weddingTimes(seed as never, t0 + 40 * D)[1]!;
    expect(pendingEncounter(seed, [], second + H)).toBe("wedding");
  });
});

describe("visible-only encounters", () => {
  it("never offers the text-only flood encounter", () => {
    for (let n = 0; n < 200; n++) expect(eventOf("flood-check", n)).not.toBe("flood");
  });
});

import { historyDue, HISTORY } from "./encounters";
describe("historical news 1500/1501", () => {
  const seed = { id: "h", created_at: "2026-10-01T00:00:00Z" };
  it("recruiters come in winter 1500/01, once per village", () => {
    const t = Date.UTC(2026, 11, 1);
    expect(historyDue(seed, [], t)).toBe("werber");
    expect(historyDue(seed, [{ event: "werber", choice: "fodder", at: t - 1, cost: 30 }], t)).toBeNull();
  });
  it("nothing outside the windows, nothing for villages younger than a day", () => {
    expect(historyDue(seed, [], Date.UTC(2027, 3, 1))).toBeNull();
    expect(historyDue({ created_at: "2027-11-20T00:00:00Z" }, [], Date.UTC(2027, 10, 20, 12))).toBeNull();
    expect(historyDue(seed, [], Date.UTC(2027, 10, 20))).toBe("ablass");
  });
  it("windows follow the real dates of 1501 (game year = real year - 526)", () => {
    expect(new Date(HISTORY.find((h) => h.key === "weser")!.from).toISOString().slice(0, 10)).toBe("2027-05-25");
  });
});
