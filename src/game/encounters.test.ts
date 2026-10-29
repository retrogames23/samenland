import { describe, it, expect } from "vitest";
import { eventOf, pendingEncounter, activeBoons, boonHours, ENCOUNTERS, encounterGap } from "./encounters";
import { treasury, START_TALER } from "./economy";
const t0 = Date.UTC(2026, 9, 1, 12), H = 3.6e6, seed = { id: "s", name: "S", owner: "o", x: 0, y: 0, hue: 0, created_at: new Date(t0).toISOString() };
describe("encounters", () => {
  it("same village and index always meet the same encounter, never twice in a row", () => {
    expect(eventOf("s", 3)).toBe(eventOf("s", 3));
    for (let n = 1; n < 120; n++) expect(eventOf("s", n)).not.toBe(eventOf("s", n - 1));
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
  it("has 25 encounters, each shown once per round of 25", () => {
    expect(Object.keys(ENCOUNTERS).length).toBe(25);
    const seen = new Set(Array.from({ length: 24 }, (_, n) => eventOf("s", 48 + n)));
    expect(seen.size).toBe(25);
  });
});
