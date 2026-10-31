import { describe, it, expect } from "vitest";
import { rankOf, nextRankNeed } from "./rank";

describe("settlement rank from real state", () => {
  it("a founding camp with few people stays Ursprung", () => expect(rankOf({ citizens: 10, homes: 3, roads: 0 })).toBe(0));
  it("15 citizens in 4 homes make a Weiler", () => expect(rankOf({ citizens: 15, homes: 4, roads: 0 })).toBe(1));
  it("an unfed village of ~84 citizens in 24 homes stays a Dorf", () => expect(rankOf({ citizens: 84, homes: 24, roads: 0 })).toBe(2));
  it("Handelsstadt needs a finished trade road", () => {
    expect(rankOf({ citizens: 200, homes: 60, roads: 0 })).toBe(3);
    expect(rankOf({ citizens: 200, homes: 60, roads: 1 })).toBe(4);
  });
  it("reports what is missing for the next rank", () => expect(nextRankNeed({ citizens: 30, homes: 12, roads: 0 })).toEqual({ citizens: 10, homes: 0, roads: 0 }));
});
