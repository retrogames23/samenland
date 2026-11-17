import { canPlaceSpecial, buildable, terrain, structureAt, SPECIAL_KIND, FOOT2, type Seed } from "./world";

/** Nearest tile around the village centre where `item` may stand (spiral search), or null. */
export function firstFreeSite(item: string, own: Seed, seeds: Seed[], now: number, max = 24): [number, number] | null {
  if (canPlaceSpecial(item, own.x, own.y, own, seeds, now) === null) return [own.x, own.y];
  for (let r = 1; r <= max; r++) {
    let best: [number, number] | null = null, bd = Infinity;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = own.x + dx, y = own.y + dy;
      if (canPlaceSpecial(item, x, y, own, seeds, now) !== null) continue;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (best) return best;
  }
  return null;
}

/** What a tap does while placing: on touch it only moves the preview, buying needs the confirm button. */
export function placeTap(touch: boolean): "move" | "buy" {
  return touch ? "move" : "buy";
}

/** Tiles a building of `item` would cover with its front tile at (x, y): 1×1, or 2×2 for ensembles (front + three behind). */
export function footprint(item: string, x: number, y: number): [number, number][] {
  const kind = SPECIAL_KIND[item];
  return kind && FOOT2.has(kind) ? [[x, y], [x - 1, y], [x, y - 1], [x - 1, y - 1]] : [[x, y]];
}

/** Per tile of the footprint: may the ground there carry the building (no water/mountain, no standing building)? */
export function footTileFree(x: number, y: number, seeds: Seed[], now: number): boolean {
  if (!buildable(terrain(x, y))) return false;
  const st = structureAt(x, y, seeds, now);
  return !st || st.kind === "field" || st.kind === "pasture" || st.kind === "garden";
}

/** Every spot around the village where `item` may stand right now (for the faint "good places" hint while placing). */
export function goodSpots(item: string, own: Seed, seeds: Seed[], now: number, ok: (x: number, y: number) => boolean, max = 24): [number, number][] {
  const out: [number, number][] = [];
  for (let dy = -max; dy <= max; dy++) for (let dx = -max; dx <= max; dx++) {
    const x = own.x + dx, y = own.y + dy;
    if (ok(x, y)) out.push([x, y]);
  }
  return out;
}
