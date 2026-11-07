import { describe, it, expect } from "vitest";
import { seatKindForRank } from "./rank";
describe("mayor's seat follows the settlement rank", () => {
  it("Weiler keeps the Kate", () => expect(seatKindForRank(1)).toBe("seat1"));
  it("Dorf gets the Hof", () => expect(seatKindForRank(2)).toBe("seat2"));
  it("Kleinstadt gets the Amtshaus", () => expect(seatKindForRank(3)).toBe("seat3"));
  it("Handelsstadt gets the Rathaus", () => expect(seatKindForRank(4)).toBe("townhall"));
});
