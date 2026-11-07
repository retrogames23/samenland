import { describe, it, expect } from "vitest";
import { VARIANT_KINDS, VARIANT_COUNT, variantSlot, variantPaintingCount } from "./building-sprites";

describe("house variants", () => {
  it("farmhouse and cottage get three paintings per style", () => {
    expect([...VARIANT_KINDS]).toEqual(["farmhouse", "cottage"]);
    expect(VARIANT_COUNT).toBe(3);
    for (const kind of VARIANT_KINDS) for (const style of ["grain", "workshop", "gateway"] as const) {
      expect(variantPaintingCount(kind, style), `${style} ${kind}`).toBe(3);
    }
  });
  it("tiles spread over all three slots", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(variantSlot(i / 200));
    expect([...seen].sort()).toEqual([0, 1, 2]);
  });
});
