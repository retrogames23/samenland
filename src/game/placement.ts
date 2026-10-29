import { canPlaceSpecial, type Seed } from "./world";

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
