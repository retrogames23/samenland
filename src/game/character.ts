import { MAP, terrain, type Terrain } from "./world";

export type TownWay = "grain" | "workshop" | "gateway";
export type TownCharacter = {
  main: TownWay;
  side: TownWay | null;
  mix: Readonly<Record<TownWay, number>>;
};
const ORDER: TownWay[] = ["grain", "workshop", "gateway"];
const cache = new Map<string, TownCharacter>();

/** Equal-area terrain shares; woodland belongs to the land-based food route.
 * Sand is shore, not a penalty; no age, purchases or stored growth enter this label. */
export function characterFromTerrain(tiles: readonly Terrain[]): TownCharacter {
  const counts = { grain: 0, workshop: 0, gateway: 0 };
  for (const t of tiles) {
    const way = t === "hill" || t === "mountain" ? "workshop"
      : t === "sand" || t === "water" || t === "deep" ? "gateway" : "grain";
    counts[way]++;
  }
  const total = tiles.length || 1;
  const mix = Object.freeze({ grain: counts.grain / total, workshop: counts.workshop / total, gateway: counts.gateway / total });
  const ranked = [...ORDER].sort((a, b) => counts[b] - counts[a]);
  const main = ranked[0] ?? "grain", second = ranked[1] ?? "workshop";
  return Object.freeze({ main, side: mix[second] >= 0.25 ? second : null, mix });
}

/** Fixed founding circle, radius 14, sampled every two tiles; map edges never count as ocean. */
export function townCharacter(seed: { x: number; y: number }): TownCharacter {
  const x = Math.round(seed.x), y = Math.round(seed.y), key = `${x}:${y}`;
  const hit = cache.get(key); if (hit) return hit;
  const tiles: Terrain[] = [];
  for (let dy = -14; dy <= 14; dy += 2) for (let dx = -14; dx <= 14; dx += 2) {
    if (dx * dx + dy * dy > 196 || x + dx < 0 || y + dy < 0 || x + dx >= MAP || y + dy >= MAP) continue;
    tiles.push(terrain(x + dx, y + dy));
  }
  const result = characterFromTerrain(tiles);
  cache.set(key, result);
  return result;
}