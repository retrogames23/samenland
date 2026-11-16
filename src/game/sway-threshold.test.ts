import { describe, expect, it } from "vitest";
import { swayShiftPx } from "./nature-sprites";

describe("swayShiftPx", () => {
  it("rechnet Scherung in Gerätepixel um", () => {
    // sway 0.6 * 0.04 * top 19 WE * z 1 = 0.456 px
    expect(swayShiftPx(0.6, -19, 1)).toBeCloseTo(0.456, 3);
  });
  it("verdoppelt sich mit DPR 2", () => {
    expect(swayShiftPx(0.6, -19, 2)).toBeCloseTo(0.912, 3);
  });
  it("liegt bei Zoom 2 und DPR 2 über einem Pixel", () => {
    expect(swayShiftPx(0.6, -19, 4)).toBeGreaterThanOrEqual(1);
  });
  it("ohne Wind keine Verschiebung", () => {
    expect(swayShiftPx(0, -19, 4)).toBe(0);
  });
});
