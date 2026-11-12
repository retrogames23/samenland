import { describe, expect, it } from "vitest";
import { taxOnDay, taxEarned, treasury, assessAt, CAP_ALL_SINCE } from "./economy";
import { civicWealth, estateAssessment, sharesAt } from "./prosperity";
import { townRank } from "./rank";
import type { Seed } from "./world";

const DAY = 864e5;
const created = CAP_ALL_SINCE - 40 * DAY + 5 * 3600e3;
const seed = (bought: { item: string; at: number }[] = []) =>
  ({ id: "cut", name: "C", owner: "o", hue: 0, x: 306, y: 420, created_at: new Date(created).toISOString(), user_id: "u", bought }) as unknown as Seed;
const cutDay = Math.floor((CAP_ALL_SINCE - created) / DAY) + 1; // first settlement day at/after the cutover

describe("economy tax at the cutover", () => {
  it("days before the cutover keep the legacy assessment exactly", () => {
    const s = seed([{ item: "school", at: created + DAY }]);
    for (let d = 1; d < cutDay; d++) {
      const at = created + d * DAY;
      expect(assessAt(s, 100, at)).toBe(estateAssessment(100, civicWealth(s, at)));
    }
  });
  it("days from the cutover use the gated V3 shares with the real rank", () => {
    const s = seed();
    const at = created + cutDay * DAY;
    expect(at).toBeGreaterThanOrEqual(CAP_ALL_SINCE);
    const sh = sharesAt(s, at, townRank(s, [s], at)).shares;
    expect(sh.wealthy).toBe(0); // no school → no wealthy
    expect(assessAt(s, 100, at)).toBe(100 + Math.floor(100 * sh.skilled + 1e-9));
  });
  it("the historical tax sum up to the cutover is unchanged", () => {
    const s = seed();
    let legacy = 0;
    for (let d = 1; d < cutDay; d++) { const at = created + d * DAY; legacy += taxOnDay(s, d); expect(taxOnDay(s, d)).toBeGreaterThan(0); void at; }
    expect(taxEarned(s, created + (cutDay - 1) * DAY)).toBe(legacy);
  });
  it("the chest balance at the cutover is identical with and without the new rule", () => {
    const s = seed();
    expect(treasury(s, [], CAP_ALL_SINCE)).toBe(treasury(s, [], CAP_ALL_SINCE, [], [], Infinity));
  });
  it("each post-cutover day is booked once: balance grows by at most that day's tax", () => {
    const s = seed();
    const before = treasury(s, [], created + cutDay * DAY - 1);
    const after = treasury(s, [], created + cutDay * DAY);
    expect(after - before).toBeLessThanOrEqual(taxOnDay(s, cutDay));
    expect(treasury(s, [], created + cutDay * DAY + DAY / 2)).toBe(after);
  });
});
