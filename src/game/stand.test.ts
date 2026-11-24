import { describe, expect, it } from "vitest";

describe("standing pose", () => {
  it("the man never stands in a frame of the 8-step walk sheet", async () => {
    const { standSheetOf, walkSheet } = await import("./folk-sprites");
    const s = standSheetOf("man");
    expect(s).toEqual(["manStand8", 1, 0]);
    expect(s![0]).not.toBe("manWalk8");
    void walkSheet;
  });
  it("walking resumes on the 8-step cycle driven by the stride phase", async () => {
    const { walkFramesOf } = await import("./folk-sprites");
    const { step8 } = await import("./render");
    expect(walkFramesOf("man")).toBe(8);
    expect(step8(0)).toBe(0);
    expect(step8(6.2832 * 0.5)).toBe(4);
    expect(step8(6.2832 * 1.01)).toBe(0);
  });
  it("other figures keep their previous stand mapping", async () => {
    const { standSheetOf } = await import("./folk-sprites");
    expect(standSheetOf("wealthy")).toEqual(["wealthyWalk4", 4, 1]);
    expect(standSheetOf("farmer")).toEqual(["farmerWalk4", 4, 1]);
    expect(standSheetOf("toddler")).toBeNull();
    expect(standSheetOf("child")).toBeNull();
    expect(standSheetOf("woman")).toBeNull();
  });
});
