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

import { terrain } from "./world";
describe("forest clearing", () => {
  it("a bought building may stand on a forest tile near the village", () => {
    const now = Date.now();
    for (let y = 100; y < 900; y += 5) for (let x = 100; x < 900; x += 5) {
      if (terrain(x + 2, y) !== "forest") continue;
      const s = { id: "f", x, y, name: "F", created_at: new Date(now - 3600e3 * 200).toISOString() } as never;
      const e = canPlaceSpecial("herbs", x + 2, y, s, [s], now);
      expect(e === null || e === "taken").toBe(true);
      expect(canPlaceSpecial("herbs", x, y, s, [s], now)).toBe("taken");
      return;
    }
  });
});
