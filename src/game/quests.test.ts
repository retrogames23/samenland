import { describe, expect, it } from "vitest";
import { QUESTS, QUEST_REWARD, questState } from "./quests";
import { treasury, START_TALER } from "./economy";

const ctx = { blessings: 0, purchases: 0, signposts: 0, encounters: 0, giftsSent: 0, residents: 3, stage: 0 };
const claim = (quest: string) => ({ id: quest, seed_id: "s", quest, reward: QUEST_REWARD[quest as keyof typeof QUEST_REWARD], created_at: "" });

describe("mayor's tasks", () => {
  it("has seven tasks in fixed order", () => expect([...QUESTS]).toEqual(["bless", "build", "sign", "meet", "ten", "gift", "hamlet"]));
  it("rewards 20/30/20/30/40/40/60, 240 in total", () => {
    expect(QUESTS.map((q) => QUEST_REWARD[q])).toEqual([20, 30, 20, 30, 40, 40, 60]);
    expect(QUESTS.reduce((a, q) => a + QUEST_REWARD[q], 0)).toBe(240);
  });
  it("starts with the blessing, not ready until blessed", () => {
    expect(questState([], "s", ctx)).toMatchObject({ quest: "bless", ready: false });
    expect(questState([], "s", { ...ctx, blessings: 1 })!.ready).toBe(true);
  });
  it("the next task only opens after the previous is claimed", () => {
    expect(questState([claim("bless")], "s", { ...ctx, purchases: 1 })).toMatchObject({ quest: "build", ready: true });
  });
  it("ten souls needs 10 residents", () => {
    const c = ["bless", "build", "sign", "meet"].map(claim);
    expect(questState(c, "s", { ...ctx, residents: 9 })).toMatchObject({ quest: "ten", have: 9, ready: false });
    expect(questState(c, "s", { ...ctx, residents: 10 })!.ready).toBe(true);
  });
  it("hamlet needs stage 1; chain ends after it", () => {
    const c = ["bless", "build", "sign", "meet", "ten", "gift"].map(claim);
    expect(questState(c, "s", ctx)!.ready).toBe(false);
    expect(questState(c, "s", { ...ctx, stage: 1 })!.ready).toBe(true);
    expect(questState([...c, claim("hamlet")], "s", ctx)).toBeNull();
  });
  it("claimed rewards go into the treasury", () => {
    const s = { id: "s", name: "A", owner: "o", x: 500, y: 500, hue: 0, created_at: new Date(0).toISOString() };
    expect(treasury(s, [], 0, [], [claim("bless"), claim("build")])).toBe(START_TALER + 50);
  });
});
