import { describe, it, expect } from "vitest";
import { TITLE_PRICE, titleOf, titleBlock, titleBoons } from "./economy";
import type { Seed } from "./world";

const H = 3.6e6, now = Date.parse("2027-06-01T00:00:00Z");
const seed = (hours: number, path?: "trade" | "farm"): Seed => ({ id: "s", name: "A", owner: "o", x: 0, y: 0, hue: 0, created_at: new Date(now - hours * H).toISOString(), ...(path ? { charter: { path, at: 0 } } : {}) } as unknown as Seed);
const rows = (...items: string[]) => items.map((item) => ({ seed_id: "s", item }));

describe("mayor titles", () => {
  it("prices match the purchase guard", () => expect(TITLE_PRICE).toEqual({ title1: 500, title2: 1200, title3: 2500 }));
  it("needs a charter, Kleinstadt age and the journeyman rank", () => {
    expect(titleBlock(seed(3000), [], now)).toBe("charter");
    expect(titleBlock(seed(2000, "trade"), rows("rank2"), now)).toBe("age");
    expect(titleBlock(seed(3000, "trade"), [], now)).toBe("rank");
    expect(titleBlock(seed(3000, "trade"), rows("rank2"), now)).toBeNull();
  });
  it("second title needs Handelsstadt and the master rank", () => {
    expect(titleBlock(seed(5000, "trade"), rows("rank2", "title1"), now)).toBe("rank");
    expect(titleBlock(seed(5000, "trade"), rows("rank2", "rank3", "title1"), now)).toBeNull();
  });
  it("titles add path bonuses", () => {
    const s = seed(9000, "farm"), p = rows("rank2", "rank3", "title1", "title2");
    expect(titleOf(s, p)).toBe(2);
    expect(titleBoons(s, p)).toEqual({ food: 15, health: 0, wealth: 0 });
  });
});
