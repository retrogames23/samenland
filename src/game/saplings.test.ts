import { describe, it, expect } from "vitest";
import { ENCOUNTERS, saplingsOwed } from "./encounters";

describe("nurseryman saplings", () => {
  it("saplings are free: a rare tree is decoration only", () => {
    expect(ENCOUNTERS.nursery.cherry.cost).toBe(0);
    expect(ENCOUNTERS.nursery.quince.cost).toBe(0);
  });
  it("grants one sapling per purchase until it is planted", () => {
    const d = [{ event: "nursery", choice: "cherry" }, { event: "nursery", choice: "pass" }];
    expect(saplingsOwed(d, [])).toEqual(["cherry"]);
    expect(saplingsOwed(d, [{ kind: "cherry" }])).toEqual([]);
  });
});
