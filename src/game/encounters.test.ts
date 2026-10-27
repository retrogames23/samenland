import { describe, it, expect } from "vitest";
import { eventOf, pendingEncounter, activeBoons, boonHours, ENCOUNTERS, dayOf } from "./encounters";
import { treasury, START_TALER } from "./economy";
const t0 = Date.UTC(2026, 9, 1, 12), H = 3.6e6, seed = { id: "s", name: "S", owner: "o", x: 0, y: 0, hue: 0, created_at: new Date(t0).toISOString() };
describe("encounters", () => {
  it("same village and day always meet the same encounter, never twice in a row", () => {
    expect(eventOf("s", t0)).toBe(eventOf("s", t0 + H));
    for (let d = 0; d < 120; d++) expect(eventOf("s", t0 + d * 24 * H)).not.toBe(eventOf("s", t0 + (d - 1) * 24 * H));
  });
  it("first encounter after 6 hours, one decision per day", () => {
    expect(pendingEncounter(seed, [], t0 + 5 * H)).toBeNull();
    expect(pendingEncounter(seed, [], t0 + 7 * H)).not.toBeNull();
    const d = [{ event: "merchant", choice: "pass", cost: 0, at: t0 + 7 * H }];
    expect(dayOf(t0 + 8 * H)).toBe(dayOf(t0 + 7 * H));
    expect(pendingEncounter(seed, d, t0 + 8 * H)).toBeNull();
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
  it("has 24 encounters, each shown once per 24-day round", () => {
    expect(Object.keys(ENCOUNTERS).length).toBe(24);
    const t0 = Date.UTC(2026, 0, 1); const H = 3.6e6;
    const round = Math.floor(dayOf(t0) / 24) * 24;
    const seen = new Set(Array.from({ length: 24 }, (_, d) => eventOf("s", (round + d) * 24 * H + H)));
    expect(seen.size).toBe(24);
  });
});
