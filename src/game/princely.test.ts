import { describe, expect, it } from "vitest";
import { princelyTask, princelyClaims, PRINCELY_COUNT, PRINCELY_REWARDS } from "./princely";

describe("princely decrees", () => {
  it("has 12 decrees worth 980 Taler", () => {
    expect(PRINCELY_COUNT).toBe(12);
    expect(PRINCELY_REWARDS.reduce((a, b) => a + b, 0)).toBe(980);
  });
  it("cycles six kinds like the DB", () => {
    expect(princelyTask(1).kind).toBe("wonder");
    expect(princelyTask(7)).toEqual({ kind: "wonder", reward: 80 });
    expect(princelyTask(12)).toEqual({ kind: "road", reward: 150 });
  });
  it("only fulfilled decrees pay", () => {
    const rows = [
      { id: "a", seed_id: "s", step: 1, task: "wonder", reward: 40, accepted_at: "x", done_at: "2026-11-01T00:00:00Z" },
      { id: "b", seed_id: "s", step: 2, task: "letter", reward: 40, accepted_at: "x", done_at: null },
    ];
    expect(princelyClaims(rows).map((c) => c.reward)).toEqual([40]);
  });
});
