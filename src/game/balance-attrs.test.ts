import { describe, it, expect } from "vitest";
import { attributes, perHead } from "./economy";
import { boonsOf, type Larder } from "./goods";
import type { Seed } from "./world";

const born = Date.UTC(2026, 3, 1, 6);
const s = { id: "b1", name: "Testdorf", x: 520, y: 480, created_at: new Date(born).toISOString(), user_id: null } as unknown as Seed;
const buy = (item: string) => ({ id: item, seed_id: "b1", item, cost: 0, created_at: new Date(born).toISOString() });
const L = (food: number, eaters: number): Larder => ({ flows: [], food, eaters, byKind: new Map() });

describe("per-capita attributes", () => {
  it("a fresh village without buildings starts low, not near the top", () => {
    const a = attributes(s, [s], [], born + 3600e3);
    expect(a.food).toBeLessThanOrEqual(40);
    expect(a.health).toBeLessThanOrEqual(40);
  });
  it("cheap huts no longer max out food and health", () => {
    const p = ["hunter", "fisher", "herbs"].map(buy);
    const a = attributes(s, [s], p, born + 3600e3, 0, { ...boonsOf(L(60, 10)) });
    expect(a.food).toBeLessThan(100);
    expect(a.health).toBeLessThan(100);
  });
  it("a hut serves 25 residents fully, its share shrinks above, never below 40 %", () => {
    expect(perHead(20)).toBe(1);
    expect(perHead(50)).toBe(0.5);
    expect(perHead(500)).toBe(0.4);
  });
  it("larder supply grows gradually with stored meals", () => {
    expect(boonsOf(L(10, 10)).supply).toBe(0.5);
    expect(boonsOf(L(20, 10)).supply).toBe(1);
  });
});
