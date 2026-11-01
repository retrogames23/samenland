import { describe, expect, it } from "vitest";
import { questProgress, QUEST_REWARD, QUESTS } from "./quests";

const base = { blessings: 9, purchases: 8, signposts: 1, encounters: 1, giftsSent: 6, residents: 200, stage: 5, roads: 2 };
describe("way quests", () => {
  it("buy6 needs the small way building besides six purchases", () => {
    expect(questProgress("buy6", base)).toEqual([5, 6]);
    expect(questProgress("buy6", { ...base, waySmall: true })).toEqual([6, 6]);
  });
  it("metro needs the metropolis and the big way building", () => {
    expect(questProgress("metro", base)).toEqual([1, 2]);
    expect(questProgress("metro", { ...base, wayBig: true })).toEqual([2, 2]);
  });
  it("keeps 2770 Taler in total", () => {
    expect(QUESTS.reduce((a, q) => a + QUEST_REWARD[q], 0)).toBe(2770);
  });
});
