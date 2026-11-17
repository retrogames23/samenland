import { canPlaceSpecial, specialSites, monumentOf, monumentDone, specialDone, SPECIAL_KIND, MAP, type Seed } from "./world";

const H = 3600000, DAY = 24 * H;
/** One relocation per building per week (mirrors DB building_move_guard). */
export const MOVE_COOLDOWN = 7 * DAY;
/** Only one relocation at a time per village (mirrors DB building_move_guard). */
export const MOVE_BUSY = 12 * H;

const SMALL = new Set(["herbs", "hunter", "fisher", "fireorder", "woodcamp"]);
const MEDIUM = new Set(["backhaus", "herberge", "granary", "healer", "badestube", "firehouse", "guard", "dairy", "library", "bigstore", "stonemason", "smokehouse"]);
const LARGE = new Set(["beginen", "school", "markethall", "guildhall", "millrow", "hammerworks", "saltquay"]);

/** Price in Lübische Mark for moving a bought building (by size; mirrors DB move_price). */
export function moveCost(item: string): number | null {
  if (SMALL.has(item)) return 20;
  if (MEDIUM.has(item)) return 50;
  if (LARGE.has(item)) return 100;
  if (/^(belfry|theater|cathedral|university|exchange|orangery|opera|harvest|guildtower|lighthouse)1$/.test(item)) return 150;
  return null;
}

/** The purchase item standing on a bought building of this kind in the seed, or null. */
export function itemOfKind(s: Seed, kind: string): string | null {
  const b = (s.bought ?? []).find((x) => SPECIAL_KIND[x.item] === kind && moveCost(x.item) != null);
  return b ? b.item : null;
}

export type MoveBlock = "unbuilt" | "cooldown" | "busy";
/** Why this building cannot be moved right now (null = it may). */
export function moveBlock(s: Seed, item: string, now: number): MoveBlock | null {
  if (moveCost(item) == null) return "unbuilt";
  const first = (s.bought ?? []).filter((b) => b.item === item).reduce((a, b) => Math.min(a, b.at), Infinity);
  if (!(first <= now)) return "unbuilt";
  const mk = monumentOf(item);
  if (mk) { const d = monumentDone(s, [s], mk); if (d == null || d > now) return "unbuilt"; }
  else if (specialDone(s, [s], first) > now) return "unbuilt";
  const moves = s.moves ?? [];
  if (moves.some((m) => m.item === item && now - m.at < MOVE_COOLDOWN)) return "cooldown";
  if (moves.some((m) => now - m.at < MOVE_BUSY)) return "busy";
  return null;
}

/** Placement check for a relocation: the normal building rules, plus no spot this village's bought buildings ever used. */
export function canMoveTo(item: string, x: number, y: number, s: Seed, seeds: Seed[], now: number): string | null {
  const e = canPlaceSpecial(item, x, y, s, seeds, now);
  if (e) return e;
  if (specialSites(s).has(y * MAP + x)) return "taken";
  return null;
}
