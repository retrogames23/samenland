import { describe, it, expect } from "vitest";
import { careMissing, type Seed } from "./world";

const base = { id: "a", user_id: "u", x: 0, y: 0, created_at: new Date(0).toISOString() } as unknown as Seed;

describe("careMissing", () => {
  it("asks for one food source before the Kleinstadt step", () => {
    const m = careMissing({ ...base, bought: [] } as Seed, 1e12)!;
    expect(m.stage).toBe(2);
    expect(m.food).toBe(1);
    expect(m.health).toBe(0);
  });
  it("then asks for a second food source and one healing place", () => {
    const m = careMissing({ ...base, bought: [{ item: "fisher", at: 0 }] } as unknown as Seed, 1e12)!;
    expect(m.stage).toBe(3);
    expect(m.food).toBe(1);
    expect(m.health).toBe(1);
  });
  it("sample towns are never capped", () => {
    expect(careMissing({ ...base, user_id: null } as unknown as Seed, 1e12)).toBeNull();
  });
});
