import { describe, expect, it } from "vitest";
import { maxZoom } from "./camera";

describe("camera zoom limits", () => {
  it("allows zoom 24 on every map", () => {
    expect(maxZoom(false)).toBe(24);
  });

  it("allows zoom 40 while strolling on every map", () => {
    expect(maxZoom(true)).toBe(40);
  });
});
