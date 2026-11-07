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
  it("aligns every house along the far side of a street rather than flipping randomly", () => {
    for (let y = 3; y < 10; y++) expect(faceFlip("farmhouse", 5, y, x => x === 4)).toBe(true);
    for (let x = 3; x < 10; x++) expect(faceFlip("cottage", x, 5, (_x, y) => y === 4)).toBe(false);
  });
});
