// Supporter decorations: purely cosmetic thanks for a voluntary contribution.
// Only the granted reward rows are stored (written by the payment webhook);
// placement next to the mayor's seat is derived here, so every client agrees.
// Rewards never touch growth, money, food or any other game mechanic.
import { LANDMARKS, SEAT_KINDS, landmarkSpots, terrain, buildable, structureAt, type Seed } from "./world";

export type RewardKey = "seal" | "vane" | "beegarden" | "lanterns" | "statue" | "linden" | "fountain" | "rosearch" | "dog";
export type Tier = 3 | 5 | 10;

/** Order matters: it is the order in which decorations take free tiles around the seat. */
export const REWARDS: { key: RewardKey; tier: Tier }[] = [
  { key: "seal", tier: 3 }, { key: "vane", tier: 3 }, { key: "beegarden", tier: 3 }, { key: "lanterns", tier: 3 },
  { key: "statue", tier: 5 }, { key: "linden", tier: 5 }, { key: "fountain", tier: 5 }, { key: "rosearch", tier: 5 },
  { key: "dog", tier: 10 },
];
export const REWARD_KEYS = REWARDS.map((r) => r.key);
/** Price ids of the payment provider and their amount in euro. */
export const SUPPORT_PRICES = { support_3: 3, support_5: 5, support_10: 10 } as const;
export type SupportPrice = keyof typeof SUPPORT_PRICES;

export function tierOf(key: string): Tier | null { return REWARDS.find((r) => r.key === key)?.tier ?? null; }
/** A contribution unlocks one reward of its tier or below. */
export function allowed(price: SupportPrice, key: string): boolean {
  const t = tierOf(key); return t !== null && SUPPORT_PRICES[price] >= t;
}
/** How many rewards a contribution unlocks: 10 € gives two, smaller amounts one. */
export function rewardSlots(price: SupportPrice): number { return SUPPORT_PRICES[price] >= 10 ? 2 : 1; }
/** A contribution may carry 1..rewardSlots distinct rewards, each within its tier. */
export function allowedSet(price: SupportPrice, keys: string[]): boolean {
  return keys.length >= 1 && keys.length <= rewardSlots(price) && new Set(keys).size === keys.length && keys.every((k) => allowed(price, k));
}
/** Rewards still selectable for a village (each one only once). */
export function openRewards(owned: Iterable<string>): RewardKey[] {
  const o = new Set(owned); return REWARD_KEYS.filter((k) => !o.has(k));
}

/** Decorations that stand on their own tile (seal is UI-only, vane sits on the seat roof). */
export const TILE_DECOR: RewardKey[] = ["statue", "linden", "fountain", "rosearch", "beegarden", "lanterns"];

const seatIdx = new Set(LANDMARKS.map((l, i) => (SEAT_KINDS.includes(l.kind) ? i : -1)).filter((i) => i >= 0));
/** World tile of the mayor's seat for a village. */
export function seatTile(s: Seed): [number, number] {
  for (const [k, idx] of landmarkSpots(s)) if (idx.some((i) => seatIdx.has(i))) { const [dx, dy] = k.split(",").map(Number); return [s.x + dx!, s.y + dy!]; }
  return [s.x + 1, s.y - 2];
}

const RING: [number, number][] = [];
for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) RING.push([dx, dy]);

const WIDE = new Set<RewardKey>(["fountain", "linden", "rosearch", "beegarden"]);
const NEIGH: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]];
const OPEN = new Set<string>(["street", "path", "square", "field", "garden", "pasture"]);
let cache: { key: string; map: Map<number, RewardKey> } | null = null;
/** tile index (y*MAP+x) -> decoration, for every village with granted rewards. Recomputed at most every 10 minutes. */
export function decorMap(seeds: Seed[], owned: Map<string, Set<string>>, now: number, MAP: number): Map<number, RewardKey> {
  const bucket = Math.floor(now / 6e5);
  const key = `${bucket}:${seeds.length}:${[...owned].map(([k, v]) => k + [...v].join()).join("|")}`;
  if (cache?.key === key) return cache.map;
  const map = new Map<number, RewardKey>();
  for (const s of seeds) {
    const mine = owned.get(s.id); if (!mine) continue;
    const [sx, sy] = seatTile(s);
    let ri = 0;
    for (const k of TILE_DECOR) {
      if (!mine.has(k)) continue;
      while (ri < RING.length) {
        const [dx, dy] = RING[ri++]!, x = sx + dx, y = sy + dy;
        if (map.has(y * MAP + x) || !buildable(terrain(x, y)) || structureAt(x, y, seeds, now)) continue;
        // larger pieces need free neighbours too, so they never press into a house or yard
        if (WIDE.has(k) && NEIGH.some(([i, j]) => { const n = structureAt(x + i, y + j, seeds, now); return (n && !OPEN.has(n.kind)) || map.has((y + j) * MAP + x + i); })) continue;
        map.set(y * MAP + x, k); break;
      }
    }
  }
  cache = { key, map }; return map;
}
