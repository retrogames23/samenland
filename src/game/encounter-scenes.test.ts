import { describe, it, expect } from "vitest";
import { guestNow, maypoleUp, cowsOf, GUEST_H } from "./encounters";

const seed = { id: "scene-seed", created_at: "2026-01-01T00:00:00Z" };
const c0 = Date.parse(seed.created_at), H = 3.6e6;

describe("encounter scenes", () => {
  it("a welcomed visitor stays GUEST_H hours, a dismissed one leaves at once", () => {
    const at = c0 + 10 * H;
    const kept = [{ event: "minstrel", choice: "play", at, cost: 15 }];
    expect(guestNow(seed, kept, at + 1 * H)?.event).toBe("minstrel");
    expect(guestNow(seed, kept, at + GUEST_H * H + 1)?.event ?? null).not.toBe("minstrel");
    expect(guestNow(seed, [{ ...kept[0]!, choice: "pass", cost: 0 }], at + 60000)).toBeNull();
  });
  it("the maypole stands 30 days, a kept cow for good, a show cow two days", () => {
    const at = c0 + 5 * H;
    expect(maypoleUp([{ event: "maypole", choice: "pole", at, cost: 20 }], at + 29 * 864e5)).toBe(true);
    expect(maypoleUp([{ event: "maypole", choice: "pole", at, cost: 20 }], at + 31 * 864e5)).toBe(false);
    expect(cowsOf([{ event: "cow", choice: "keep", at, cost: 0 }], at + 400 * 864e5)).toBe(1);
    expect(cowsOf([{ event: "cow", choice: "show", at, cost: 10 }], at + 49 * H)).toBe(0);
    expect(cowsOf([{ event: "cow", choice: "sell", at, cost: -30 }], at + H)).toBe(0);
  });
});
