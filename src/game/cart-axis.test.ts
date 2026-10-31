import { describe, it, expect } from "vitest";
import { cartAxisView } from "./render";
describe("cartAxisView hysteresis", () => {
  it("enters head-on view only above 1.05", () => { expect(cartAxisView(1, 1, false)).toBe(false); expect(cartAxisView(1, 1.2, false)).toBe(true); });
  it("stays head-on until below 0.75", () => { expect(cartAxisView(1, 0.9, true)).toBe(true); expect(cartAxisView(1, 0.7, true)).toBe(false); });
});
