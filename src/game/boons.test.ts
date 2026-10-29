import { describe, it, expect } from "vitest";
import { boonsOf, type Larder } from "./goods";
const L = (food: number, eaters: number, flows: Larder["flows"] = []): Larder => ({ flows, food, eaters, byKind: new Map() });
const f = (ware: any, stock: number, made = 0, used = 0) => ({ ware, stock, made, used, trend: 0 as const });
describe("larder boons", () => {
  it("2 meals per villager give +10 food and +5 health", () => {
    const b = boonsOf(L(20, 10));
    expect(b.food).toBe(10); expect(b.health).toBe(5);
  });
  it("an empty larder gives nothing", () => expect(boonsOf(L(0, 3))).toMatchObject({ food: 0, health: 0, wealth: 0 }));
  it("two kinds of food add +5 health", () => expect(boonsOf(L(0, 3, [f("fish", 2), f("bread", 2)])).health).toBe(5));
  it("surplus of finished goods adds +5 prosperity", () => expect(boonsOf(L(0, 3, [f("planks", 12, 5, 2)])).wealth).toBe(5));
});
