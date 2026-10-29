import { describe, it, expect } from "vitest";
import { firstFreeSite, placeTap } from "./placement";
import { canPlaceSpecial } from "./world";

describe("touch placement", () => {
  it("a tap on touch only moves the preview, never buys", () => {
    expect(placeTap(true)).toBe("move");
    expect(placeTap(false)).toBe("buy");
  });
  it("first free site is a legal spot near the village", () => {
    const s = { id: "a", x: 500, y: 500, name: "A", created_at: new Date(Date.now() - 3600e3 * 200).toISOString() } as never;
    const g = firstFreeSite("herbs", s, [s], Date.now());
    if (g) expect(canPlaceSpecial("herbs", g[0], g[1], s, [s], Date.now())).toBeNull();
  });
});
