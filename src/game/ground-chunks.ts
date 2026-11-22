/**
 * Ground-chunk season swap (display only): when the season/snow key changes, the visible ground keeps the last
 * complete key until every visible chunk of the new key is baked, then swaps in one frame — no placeholder
 * diamonds, no piecewise rebuild. Pure helpers so render.ts stays a thin caller; nothing here touches mechanics.
 */
export const chunkKey = (ix: number, iy: number, q: number, sk: string) => `${ix},${iy},${q},${sk}`;
const QUALITIES = [2, 1, 0.5] as const;

/** Cached chunk to show for a tile block as [key, quality]: the displayed key first (own quality, then another), then
 *  the new key. null = nothing complete cached — the caller bakes/paints its fallback as before. */
export function pickChunk(has: (k: string) => boolean, ix: number, iy: number, q: number, sk: string, shown: string): [string, number] | null {
  for (const k of shown && shown !== sk ? [shown, sk] : [sk]) {
    const own = chunkKey(ix, iy, q, k); if (has(own)) return [own, q];
    for (const o of QUALITIES) if (o !== q) { const ok = chunkKey(ix, iy, o, k); if (has(ok)) return [ok, o]; }
  }
  return null;
}

/** Key the ground shows next frame: the new key once no visible chunk of it is missing, else unchanged. When old and new
 *  versions of the view would not both fit the cache (cap), the hold is skipped so baking can never thrash. */
export const nextShown = (shown: string, sk: string, missing: number, visible: number, cap: number) =>
  missing === 0 || !shown || visible * 2 > cap ? sk : shown;
