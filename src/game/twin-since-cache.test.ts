import { describe, expect, it, vi } from "vitest";
import type { Seed } from "./world";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const mk = (id: string, x: number, extra: Partial<Seed> = {}): Seed => ({ id, name: id, owner: id, x, y: x === 306 ? 420 : 439, hue: 0, created_at: "2026-01-01T00:00:00Z", user_id: `u-${id}`, bought: ["fisher","hunter","granary","herbs","healer"].map((item) => ({ item, at: 0 })), roads: [{ target: id === "a" ? "b" : "a", at: T0 }], ...extra });
const variants: Record<string, () => Seed[]> = {
  base: () => [mk("a", 306), mk("b", 343)],
  noRoad: () => [mk("a", 306, { roads: [] }), mk("b", 343, { roads: [] })],
  laterRoad: () => [mk("a", 306, { roads: [{ target: "b", at: T0 + 40 * 864e5 }] }), mk("b", 343, { roads: [] })],
  charter: () => [mk("a", 306, { charter: { path: "farm", at: T0 } } as Partial<Seed>), mk("b", 343)],
  blessed: () => [mk("a", 306, { blessed: [T0 + 864e5, T0 + 2 * 864e5] }), mk("b", 343)],
  founded: () => [mk("a", 306, { created_at: "2026-02-01T00:00:00Z" }), mk("b", 343)],
  fewerBuys: () => [mk("a", 306, { bought: [] }), mk("b", 343)],
};
/** Fresh module = empty caches: the uncached reference result. */
async function fresh(seeds: Seed[]) {
  vi.resetModules(); const w = await import("./world");
  const l = w.links(seeds)[0]; return l ? w.twinSince(l, seeds) : "nolink";
}

describe("twinSince content cache", () => {
  it("equals an uncached computation for every variant, in any order and array instance", async () => {
    const ref: Record<string, unknown> = {};
    for (const [k, f] of Object.entries(variants)) ref[k] = await fresh(f());
    vi.resetModules(); const w = await import("./world");
    for (const round of [0, 1]) for (const k of Object.keys(variants).sort(() => (round ? -1 : 1))) {
      const seeds = variants[k]!(); const l = w.links(seeds)[0];
      expect(l ? w.twinSince(l, seeds) : "nolink", `${k}/${round}`).toEqual(ref[k]);
    }
    expect(ref["laterRoad"]).not.toEqual(ref["base"]); // later road changes the touch moment (Roggenfeld–Dinkelwinkel case)
  });

  it("a new array with identical content hits; changed content misses; size stays bounded", async () => {
    vi.resetModules(); const w = await import("./world");
    const a = variants["base"]!(); w.twinSince(w.links(a)[0]!, a);
    const m0 = w.sinceStats.misses, b = variants["base"]!(); w.twinSince(w.links(b)[0]!, b);
    expect(w.sinceStats.misses).toBe(m0);
    const c = variants["blessed"]!(); w.twinSince(w.links(c)[0]!, c);
    expect(w.sinceStats.misses).toBe(m0 + 1);
    for (let i = 0; i < 40; i++) { const s = [mk("a", 306, { blessed: [T0 + i * 864e5] }), mk("b", 343)]; w.twinSince(w.links(s)[0]!, s); }
    expect(w.sinceStats.size()).toBeLessThanOrEqual(w.SINCE_MAX);
  });

  it("realm is part of the key", async () => {
    vi.resetModules(); const w = await import("./world");
    const a = variants["base"]!(); w.twinSince(w.links(a)[0]!, a);
    const m0 = w.sinceStats.misses;
    const b = variants["base"]!().map((s) => ({ ...s, realm: "europe-2" as Seed["realm"] }) as Seed);
    const l = w.links(b)[0]; if (l) w.twinSince(l, b);
    expect(w.sinceStats.misses).toBe(l ? m0 + 1 : m0);
  });
});
