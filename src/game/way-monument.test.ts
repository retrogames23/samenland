import { describe, it, expect } from "vitest";
import { MONUMENTS, MONUMENT_PRICE } from "./economy";

const WAY = ["harvest", "guildtower", "lighthouse"] as const;

describe("way monuments", () => {
  it("each town character has exactly one", () => {
    expect(WAY.map((k) => MONUMENTS[k].way)).toEqual(["grain", "workshop", "gateway"]);
  });
  it("all cost 450/600/750 Taler (mirrors purchase guard)", () => {
    for (const k of WAY) expect([1, 2, 3].map((i) => MONUMENT_PRICE[`${k}${i}`])).toEqual([450, 600, 750]);
  });
  it("give the same bonus total of 25", () => {
    for (const k of WAY) { const m = MONUMENTS[k]; expect((m.food ?? 0) + (m.health ?? 0) + (m.wealth ?? 0)).toBe(25); }
  });
});
