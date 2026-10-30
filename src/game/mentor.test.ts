import { describe, expect, it } from "vitest";
import { effAge, links, mentoring, MENTOR_SPAN, type Seed } from "./world";

const mk = (id: string, x: number, created: string, target: string): Seed => ({ id, name: id, owner: id, x, y: x === 306 ? 420 : 439, hue: 0, created_at: created, user_id: `u-${id}`, bought: ["fisher","hunter","granary","herbs","healer"].map((item) => ({ item, at: 0 })), roads: [{ target, at: Date.parse(created) }] });

describe("mentor bonus", () => {
  const old = mk("a", 306, "2026-01-01T00:00:00Z", "b");
  const young = mk("b", 343, "2026-07-01T00:00:00Z", "a");
  const seeds = [old, young];
  const since = links(seeds)[0]!.since;

  it("a young town next to an older one grows faster than alone", () => {
    const t = since + 200 * 24 * 3.6e6;
    expect(mentoring(young, seeds, t)).toBe(true);
    expect(effAge(young, seeds, t)).toBeGreaterThan(effAge(young, [young], t) * 1.3);
  });

  it("the older town gets no mentor bonus and the bonus ends after a year", () => {
    expect(mentoring(old, seeds, since + 1e9)).toBe(false);
    expect(mentoring(young, seeds, Date.parse(young.created_at) + (MENTOR_SPAN + 1) * 3.6e6)).toBe(false);
  });
});
