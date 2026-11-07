import { describe, it, expect } from "vitest";
import { TITLE_PRICE, titleOf, titleBlock, titleBoons } from "./economy";
import type { Seed } from "./world";

const H = 3.6e6, now = Date.parse("2027-06-01T00:00:00Z");
const seed = (hours: number, path?: "trade" | "farm"): Seed => ({ id: "s", name: "A", owner: "o", x: 0, y: 0, hue: 0, created_at: new Date(now - hours * H).toISOString(), ...(path ? { charter: { path, at: 0 } } : {}) } as unknown as Seed);
const rows = (...items: string[]) => items.map((item) => ({ seed_id: "s", item }));

describe("mayor titles", () => {
  it("prices match the purchase guard", () => expect(TITLE_PRICE).toEqual({ title1: 500, title2: 1200, title3: 2500 }));
  it("needs a charter, Kleinstadt rank and the journeyman rank", () => {
    expect(titleBlock(seed(3000), [], 3)).toBe("charter");
    expect(titleBlock(seed(99999, "trade"), rows("rank2"), 2)).toBe("age");
    expect(titleBlock(seed(1, "trade"), [], 3)).toBe("rank");
    expect(titleBlock(seed(1, "trade"), rows("rank2"), 3)).toBeNull();
  });
  it("second title needs Handelsstadt and the master rank", () => {
    expect(titleBlock(seed(5000, "trade"), rows("rank2", "title1"), 4)).toBe("rank");
    expect(titleBlock(seed(5000, "trade"), rows("rank2", "rank3", "title1"), 4)).toBeNull();
  });
  it("Hansestadt title waits for the Hansestadt rank, never for days", () => {
    expect(titleBlock(seed(99999, "trade"), rows("rank2", "rank3", "title1", "title2"), 4)).toBe("age");
    expect(titleBlock(seed(1, "trade"), rows("rank2", "rank3", "title1", "title2"), 5)).toBeNull();
  });
  it("titles add path bonuses", () => {
    const s = seed(9000, "farm"), p = rows("rank2", "rank3", "title1", "title2");
    expect(titleOf(s, p)).toBe(2);
    expect(titleBoons(s, p)).toEqual({ food: 15, health: 0, wealth: 0 });
  });
});

import { rankBlock as rb } from "./economy";
describe("guild exams follow settlement rank, not age", () => {
  const s = { id: "g", created_at: new Date().toISOString(), charter: { path: "craft" } } as never;
  it("journeyman from Dorf, master from Handelsstadt", () => {
    expect(rb(s, [], 1, 0)).toBe("age");
    expect(rb(s, [{ seed_id: "g", item: "guildhall" }], 2, 0)).toBe(null);
    const j = [{ seed_id: "g", item: "rank2" }, { seed_id: "g", item: "belfry4" }];
    expect(rb(s, j, 3, 2)).toBe("age");
    expect(rb(s, j, 4, 2)).toBe(null);
  });
});
