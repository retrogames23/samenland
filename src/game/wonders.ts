import { MAP, hash, terrain, buildable, isWater, type Terrain } from "./world";

/** Discoverable wonders in the wild: pure from the shared terrain, identical on every client and mirrored by DB wonder_sites. */
export type WonderKind = "wreck" | "cave" | "oak" | "ruin" | "caravan" | "spring";
export type Wonder = { key: string; kind: WonderKind; x: number; y: number };
export const WONDER_KINDS: WonderKind[] = ["wreck", "cave", "oak", "ruin", "caravan", "spring"];
/** Grid cell size (tiles); at most one wonder per cell. */
export const WONDER_CELL = 96;
/** How close (tiles) the mayor must walk to discover a wonder. */
export const WONDER_REACH = 1.8;
/** Reward for the first discoverer on a map, and for every later village (mirrors DB claim_wonder). */
export const WONDER_FIRST = 100;
export const WONDER_LATER = 40;

const near = (x: number, y: number, r: number, f: (t: Terrain) => boolean) => {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if ((i || j) && f(terrain(x + i, y + j))) return true;
  return false;
};
/** Which wonder a tile could host (ground must be walkable). */
function fits(kind: WonderKind, x: number, y: number): boolean {
  const t = terrain(x, y);
  if (!buildable(t)) return false;
  switch (kind) {
    case "wreck": return t === "sand" && near(x, y, 4, isWater);
    case "cave": return t === "hill" && near(x, y, 1, (n) => n === "mountain");
    case "oak": return (t === "meadow" || t === "grass") && !near(x, y, 2, isWater);
    case "ruin": return t === "hill" && !near(x, y, 2, (n) => n === "mountain");
    case "caravan": return t === "sand" && !near(x, y, 3, isWater);
    case "spring": return (t === "forest" || t === "meadow") && near(x, y, 1, (n) => n === "water");
  }
}

let cache: Wonder[] | null = null;
/** All wonders on the map (same terrain for every realm). */
export function wonders(): Wonder[] {
  if (cache) return cache;
  const out: Wonder[] = [];
  const n = Math.floor(MAP / WONDER_CELL);
  for (let cy = 0; cy < n; cy++) for (let cx = 0; cx < n; cx++) {
    const start = Math.floor(hash(cx, cy, 901) * WONDER_KINDS.length);
    found: for (let k = 0; k < WONDER_KINDS.length; k++) {
      const kind = WONDER_KINDS[(start + k) % WONDER_KINDS.length]!;
      for (let a = 0; a < 140; a++) {
        const x = cx * WONDER_CELL + 6 + Math.floor(hash(cx * 31 + a, cy, 903 + k) * (WONDER_CELL - 12));
        const y = cy * WONDER_CELL + 6 + Math.floor(hash(cx, cy * 31 + a, 907 + k) * (WONDER_CELL - 12));
        if (fits(kind, x, y)) { out.push({ key: `${kind}:${x}:${y}`, kind, x, y }); break found; }
      }
    }
  }
  return (cache = out);
}

export type WonderFind = { id: string; seed_id: string; site: string; realm: string; first: boolean; reward: number; created_at: string };
/** Discovery rewards as quest-like claims so balance and chronicle treat them like visit gifts. */
export const wonderClaims = (rows: WonderFind[]) => rows.map((r) => ({ id: `${r.id}:w`, seed_id: r.seed_id, quest: `wonder:${r.site}`, reward: r.reward, created_at: r.created_at }));
/** The first finder of a site on a map (earliest row), or null. */
export function firstFinder(rows: WonderFind[], site: string, realm: string): WonderFind | null {
  let best: WonderFind | null = null;
  for (const r of rows) if (r.site === site && r.realm === realm && (!best || r.created_at < best.created_at)) best = r;
  return best;
}
