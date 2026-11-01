import { describe, it, expect } from "vitest";
import { cohortOf } from "./folk-sprites";
describe("mayor age cohorts", () => {
  it("20–34 young", () => { expect(cohortOf(20)).toBe("young"); expect(cohortOf(34)).toBe("young"); });
  it("35–49 mid", () => { expect(cohortOf(35)).toBe("mid"); expect(cohortOf(49)).toBe("mid"); });
  it("50–59 mature", () => { expect(cohortOf(50)).toBe("mature"); expect(cohortOf(59)).toBe("mature"); });
  it("60–70 old", () => { expect(cohortOf(60)).toBe("old"); expect(cohortOf(70)).toBe("old"); });
});
