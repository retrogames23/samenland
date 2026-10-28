import { describe, it, expect } from "vitest";
import { faceFlip } from "./world";

describe("house facing", () => {
  it("mirrors a house whose only street is on the lower-right", () => {
    expect(faceFlip("townhouse", 5, 5, (x, y) => x === 6 && y === 5)).toBe(true);
  });
  it("keeps a house facing the lower-left street", () => {
    expect(faceFlip("townhouse", 5, 5, (x, y) => x === 5 && y === 6)).toBe(false);
  });
  it("never mirrors animated landmarks", () => {
    expect(faceFlip("mill", 5, 5, (x, y) => x === 6 && y === 5)).toBe(false);
  });
});
