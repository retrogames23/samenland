import { describe, it, expect } from "vitest";
import { rankOf, nextRankNeed } from "./rank";

describe("settlement rank from real state", () => {
  it("a founding camp with few people stays Ursprung", () => expect(rankOf({ citizens: 10, homes: 3, roads: 0 })).toBe(0));
  it("15 citizens in 4 homes make a Weiler", () => expect(rankOf({ citizens: 15, homes: 4, roads: 0 })).toBe(1));
  it("Dorf needs 120 citizens in 40 homes", () => { expect(rankOf({ citizens: 119, homes: 40, roads: 0 })).toBe(1); expect(rankOf({ citizens: 120, homes: 40, roads: 0 })).toBe(2); });
  it("Kleinstadt needs 500 citizens in 220 homes", () => { expect(rankOf({ citizens: 500, homes: 219, roads: 0 })).toBe(2); expect(rankOf({ citizens: 500, homes: 220, roads: 0 })).toBe(3); });
  it("Handelsstadt needs 1500 citizens, 430 homes and a finished trade road", () => {
    expect(rankOf({ citizens: 1500, homes: 430, roads: 0 })).toBe(3);
    expect(rankOf({ citizens: 1500, homes: 430, roads: 1 })).toBe(4);
  });
  it("Hansestadt needs 2500 citizens, 700 homes and two roads", () => {
    expect(rankOf({ citizens: 2499, homes: 700, roads: 2 })).toBe(4);
    expect(rankOf({ citizens: 2500, homes: 700, roads: 2 })).toBe(5);
  });
  it("reports what is missing for the next rank", () => expect(nextRankNeed({ citizens: 30, homes: 12, roads: 0 })).toEqual({ citizens: 90, homes: 28, roads: 0 }));
});
