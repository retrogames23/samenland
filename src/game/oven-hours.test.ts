import { describe, it, expect } from "vitest";
import { ovenLit } from "./crafts";

describe("oven fire follows working hours", () => {
  it("bakery oven is cold at midnight and evening, lit before dawn", () => {
    expect(ovenLit("bakery", 0)).toBe(false);
    expect(ovenLit("bakery", 22)).toBe(false);
    expect(ovenLit("bakery", 3.5)).toBe(true);
    expect(ovenLit("bakery", 17)).toBe(false);
  });
  it("communal bakehouse burns only by day", () => {
    expect(ovenLit("backhaus", 4)).toBe(false);
    expect(ovenLit("backhaus", 10)).toBe(true);
    expect(ovenLit("backhaus", 15)).toBe(false);
  });
  it("other chimneys are unaffected", () => expect(ovenLit("smithy", 2)).toBe(true));
});
