import { describe, it, expect } from "vitest";
import { questHeads } from "./quests";

const ctx = { blessings: 0, purchases: 0, signposts: 0, encounters: 1, giftsSent: 0, residents: 0, stage: 0 };
const claims = [{ id: "1", seed_id: "s", quest: "meet", reward: 30, created_at: "" }];

describe("lonely towns", () => {
  it("skip the signpost quest without pay when no neighbour is in reach", () => {
    const h = questHeads(claims, "s", { ...ctx, reach: 0 }).find((x) => x.quest === "sign")!;
    expect(h.ready).toBe(true);
    expect(h.reward).toBe(0);
  });
  it("still pay 20 for the signpost quest with a neighbour", () => {
    const h = questHeads(claims, "s", { ...ctx, reach: 1, signposts: 1 }).find((x) => x.quest === "sign")!;
    expect(h.reward).toBe(20);
  });
});
