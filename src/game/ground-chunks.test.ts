import { describe, expect, it } from "vitest";
import { chunkKey, nextShown, pickChunk } from "./ground-chunks";

/**
 * Mirrors drawGroundChunks (render.ts): LRU cache with cap, one bake per frame, pickChunk decides what is drawn,
 * nextShown swaps the displayed season key once every visible chunk of the new key is baked.
 */
function world(view: [number, number][], cap = 200, q = 1) {
  const cache = new Map<string, string>();
  let shown = "";
  const has = (k: string) => cache.has(k);
  const touch = (k: string) => { const v = cache.get(k)!; cache.delete(k); cache.set(k, v); };
  /** One frame: returns what each visible chunk showed ("placeholder" if nothing). */
  function frame(sk: string, cells = view): string[] {
    let baked = 0, missing = 0;
    const out: string[] = [];
    for (const [ix, iy] of cells) {
      const cur = chunkKey(ix, iy, q, sk);
      if (!cache.has(cur)) {
        if (baked < 1) { baked++; cache.set(cur, sk); while (cache.size > cap) cache.delete(cache.keys().next().value!); }
        if (!cache.has(cur)) missing++;
      } else if (shown !== sk) touch(cur);
      const pick = pickChunk(has, ix, iy, q, sk, shown);
      if (pick) { touch(pick[0]); out.push(cache.get(pick[0])!); } else out.push("placeholder");
    }
    shown = nextShown(shown, sk, missing, cells.length, cap);
    return out;
  }
  return { frame, cache, shownKey: () => shown };
}
const grid = (n: number) => Array.from({ length: n * n }, (_, i) => [i % n, Math.floor(i / n)] as [number, number]);
/** Frames until the whole view shows sk (all baked and swapped in). */
const settle = (w: ReturnType<typeof world>, sk: string, max = 500) => { for (let i = 0; i < max; i++) { const f = w.frame(sk); if (w.shownKey() === sk && f.every((x) => x === sk)) return i; } throw new Error("never settled"); };

describe("ground chunks across a season change (P2b)", () => {
  it("keeps the complete old season on screen and swaps every chunk in one frame", () => {
    const w = world(grid(6));
    settle(w, "A");
    const frames: string[][] = [];
    for (let i = 0; i < 60; i++) frames.push(w.frame("B"));
    const swap = frames.findIndex((f) => f.every((x) => x === "B"));
    expect(swap).toBeGreaterThan(0);
    for (const f of frames.slice(0, swap)) expect(f.every((x) => x === "A")).toBe(true); // no mixture, no placeholder
    for (const f of frames.slice(swap)) expect(f.every((x) => x === "B")).toBe(true);
  });

  it("never paints a placeholder while a valid old chunk exists, also during the baking", () => {
    const w = world(grid(8));
    settle(w, "A");
    for (let i = 0; i < 100; i++) expect(w.frame("B")).not.toContain("placeholder");
  });

  it("rapid changes never bring back an intermediate or stale key", () => {
    const w = world(grid(6));
    settle(w, "A");
    for (let i = 0; i < 10; i++) expect(w.frame("B").every((x) => x === "A")).toBe(true); // B only partly baked
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) for (const x of w.frame("C")) seen.add(x);
    expect(seen.has("B")).toBe(false);
    expect([...seen].sort()).toEqual(["A", "C"]);
    expect(w.shownKey()).toBe("C");
  });

  it("chunks newly scrolled into view without an old version show the new key, not a placeholder once baked", () => {
    const w = world(grid(4));
    settle(w, "A");
    const wider = grid(5);
    for (let i = 0; i < 40; i++) w.frame("B", wider);
    expect(w.frame("B", wider).every((x) => x === "B")).toBe(true);
  });

  it("stays within the cache cap and skips the hold when old and new views cannot both fit (no thrashing)", () => {
    const view = grid(12); // 144 visible chunks: 288 > cap 200
    const w = world(view, 200);
    settle(w, "A");
    expect(w.cache.size).toBeLessThanOrEqual(200);
    const n = settle(w, "B");
    expect(n).toBeLessThan(view.length + 5); // one bake per frame, never re-baking evicted chunks forever
    expect(w.cache.size).toBeLessThanOrEqual(200);
    expect(w.frame("B").every((x) => x === "B")).toBe(true);
  });

  it("old season versions are evicted after the swap (memory bounded by the LRU cap)", () => {
    const w = world(grid(6), 80);
    for (const sk of ["A", "B", "C", "D", "E"]) { settle(w, sk); for (let i = 0; i < 3; i++) w.frame(sk); }
    expect(w.cache.size).toBeLessThanOrEqual(80);
    expect([...w.cache.values()].filter((v) => v === "A").length).toBe(0);
  });
});
