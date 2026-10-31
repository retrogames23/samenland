import { describe, it, expect } from "vitest";
import { throughOn, THROUGH_REST } from "./wander";
import type { Link, Seed } from "./world";
const seed = (id: string, x: number): Seed => ({ id, x, y: 50, name: id, created_at: "2026-01-01T00:00:00Z" } as unknown as Seed);
const A = seed("a", 10), B = seed("b", 40), C = seed("c", 70);
const road = (a: Seed, b: Seed): Link => ({ a, b, d: 30, since: 0, build: 1, tiles: Array.from({ length: 30 }, (_, i) => [a.x + i, 50]), water: [] });
const ab = road(A, B), bc = road(B, C), all = [ab, bc];
const now = Date.parse("2026-10-31T12:00:00Z");
describe("through traffic", () => {
  it("travels A→hub→C in two legs, resting 20 min at the hub", () => {
    let found = false;
    for (let d = 20000; d < 20400 && !found; d++) {
      const l1 = throughOn(ab, all, d, now), l2 = throughOn(bc, all, d, now);
      for (const w of l1) {
        const w2 = l2.find((v) => v.sd === w.sd)!;
        expect(w2).toBeDefined();
        const hubFirst = w.to.id === "b" ? w : w2, hubLast = hubFirst === w ? w2 : w;
        expect(hubFirst.to.id).toBe("b"); expect(hubLast.from.id).toBe("b");
        expect(hubLast.t0 - hubFirst.t1).toBe(THROUGH_REST);
        found = true;
      }
    }
    expect(found).toBe(true);
  });
  it("no through traffic when a direct road exists", () => {
    const ac = road(A, C);
    for (let d = 20000; d < 20050; d++) expect(throughOn(ab, [ab, bc, ac], d, now)).toHaveLength(0);
  });
});
