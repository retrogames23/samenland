import { describe, it, expect } from "vitest";
import { acreOf, type Seed } from "./world";
const s: Seed = { id: "abc", name: "a", owner: "o", x: 500, y: 500, hue: 0, created_at: "2026-01-01" };
describe("acres", () => {
  it("each field parcel covers many tiles (far bigger than one house)", () => {
    const n = new Map<number, number>();
    for (let y = 480; y < 520; y++) for (let x = 480; x < 520; x++) { const id = acreOf(x, y, s).id; n.set(id, (n.get(id) ?? 0) + 1); }
    const full = [...n.values()].sort((a, b) => a - b);
    expect(full[Math.floor(full.length / 2)]).toBeGreaterThanOrEqual(12);
  });
});
