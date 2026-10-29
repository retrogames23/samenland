import { describe, it, expect } from "vitest";
import { ENCOUNTERS, saplingsOwed } from "./encounters";

describe("nurseryman saplings", () => {
  it("prices cherry at 40 and quince at 35 thaler", () => {
    expect(ENCOUNTERS.nursery.cherry.cost).toBe(40);
    expect(ENCOUNTERS.nursery.quince.cost).toBe(35);
  });
  it("grants one sapling per purchase until it is planted", () => {
    const d = [{ event: "nursery", choice: "cherry" }, { event: "nursery", choice: "pass" }];
    expect(saplingsOwed(d, [])).toEqual(["cherry"]);
    expect(saplingsOwed(d, [{ kind: "cherry" }])).toEqual([]);
  });
});
