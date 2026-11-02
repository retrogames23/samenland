import { describe, it, expect } from "vitest";
import { rankOf, nextRankNeed } from "./rank";

describe("settlement rank from real state", () => {
  it("a founding camp with few people stays Ursprung", () => expect(rankOf({ citizens: 10, homes: 3, roads: 0 })).toBe(0));
  it("15 citizens in 4 homes make a Weiler", () => expect(rankOf({ citizens: 15, homes: 4, roads: 0 })).toBe(1));
  it("a month-old town of 163 citizens in 57 homes is still a Dorf", () => expect(rankOf({ citizens: 163, homes: 57, roads: 6 })).toBe(2));
  it("Kleinstadt needs 280 citizens in 100 homes", () => expect(rankOf({ citizens: 280, homes: 100, roads: 0 })).toBe(3));
  it("Handelsstadt needs 750 citizens, 260 homes and a finished trade road", () => {
    expect(rankOf({ citizens: 750, homes: 260, roads: 0 })).toBe(3);
    expect(rankOf({ citizens: 750, homes: 260, roads: 1 })).toBe(4);
  });
  it("Metropole needs 1500 citizens, 430 homes and two roads", () => {
    expect(rankOf({ citizens: 1499, homes: 430, roads: 2 })).toBe(4);
    expect(rankOf({ citizens: 1500, homes: 430, roads: 2 })).toBe(5);
  });
  it("reports what is missing for the next rank", () => expect(nextRankNeed({ citizens: 30, homes: 12, roads: 0 })).toEqual({ citizens: 50, homes: 16, roads: 0 }));
});
