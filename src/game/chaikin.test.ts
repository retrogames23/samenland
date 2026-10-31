import { describe, it, expect } from "vitest";
import { chaikin } from "./render";
describe("road ribbon smoothing", () => {
  it("keeps the road's endpoints so it still meets both towns", () => {
    const o = chaikin([[0, 0], [10, 0], [10, 10]]);
    expect(o[0]).toEqual([0, 0]); expect(o[o.length - 1]).toEqual([10, 10]);
  });
  it("cuts the stair corner instead of passing through it", () => {
    const o = chaikin([[0, 0], [10, 0], [10, 10]]);
    expect(o.some(([x, y]) => x === 10 && y === 0)).toBe(false);
  });
});
