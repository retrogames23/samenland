import { describe, it, expect } from "vitest";
import { setChosenTraits, traitsOf, traitClash } from "./traits";
import { cohortOf } from "./folk-sprites";

describe("mayor profile", () => {
  it("chosen traits override derived ones, max 2", () => {
    setChosenTraits(-777, ["pious", "curious", "owl"]);
    expect(traitsOf(-777)).toEqual(["pious", "curious"]);
    setChosenTraits(-777, null);
  });
  it("opposites clash", () => { expect(traitClash("early", "owl")).toBe(true); expect(traitClash("early", "pious")).toBe(false); });
  it("age picks cohort sprite", () => { expect(cohortOf(20)).toBe("young"); expect(cohortOf(45)).toBe("mid"); expect(cohortOf(55)).toBe("mature"); expect(cohortOf(70)).toBe("old"); });
});
