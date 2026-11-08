import { describe, expect, it } from "vitest";
import { overviewKey } from "./render";

const s = { id: "a", bought: [] } as never;
const t = Date.UTC(2026, 5, 10, 12);

describe("overview town cache key", () => {
  it("stays the same within the coarse tick", () => {
    expect(overviewKey(s, 10, 1, 1, t)).toBe(overviewKey(s, 10, 1, 1, t + 1000));
  });
  it("changes when the town grows", () => {
    expect(overviewKey(s, 10, 1, 1, t)).not.toBe(overviewKey(s, 11, 1, 1, t));
  });
  it("changes with a purchase", () => {
    expect(overviewKey(s, 10, 1, 1, t)).not.toBe(overviewKey({ id: "a", bought: [{}] } as never, 10, 1, 1, t));
  });
  it("changes with the season", () => {
    expect(overviewKey(s, 10, 1, 1, t)).not.toBe(overviewKey(s, 10, 1, 1, Date.UTC(2026, 0, 10, 12)));
  });
});
