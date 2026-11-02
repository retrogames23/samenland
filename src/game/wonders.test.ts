import { describe, it, expect } from "vitest";
import { wonders, firstFinder, wonderClaims, WONDER_FIRST, WONDER_LATER, type WonderFind } from "./wonders";
import { terrain, buildable } from "./world";

describe("wonders", () => {
  it("are placed on walkable ground with unique keys", () => {
    const w = wonders();
    expect(w.length).toBeGreaterThan(40);
    expect(new Set(w.map((x) => x.key)).size).toBe(w.length);
    for (const x of w) expect(buildable(terrain(x.x, x.y))).toBe(true);
  });
  it("first finder gets 60, every later village 50 once", () => {
    expect(WONDER_FIRST).toBe(60); expect(WONDER_LATER).toBe(50);
  });
  it("first finder is the earliest row on the same map only", () => {
    const rows: WonderFind[] = [
      { id: "b", seed_id: "B", site: "oak:1:1", realm: "europe", first: false, reward: 40, created_at: "2026-11-02T00:00:00Z" },
      { id: "a", seed_id: "A", site: "oak:1:1", realm: "europe", first: true, reward: 100, created_at: "2026-11-01T00:00:00Z" },
      { id: "c", seed_id: "C", site: "oak:1:1", realm: "asia", first: true, reward: 100, created_at: "2026-10-01T00:00:00Z" },
    ];
    expect(firstFinder(rows, "oak:1:1", "europe")?.seed_id).toBe("A");
    expect(wonderClaims(rows).reduce((a, r) => a + r.reward, 0)).toBe(240);
  });
});
