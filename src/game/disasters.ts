/**
 * Disasters: fires, floods and raids are a pure calendar per village, derived from (seed id, time window)
 * and purchases (fire house, town guard). Nothing is stored: every client sees the same fire at the same moment.
 * Raid losses are mirrored by the database function village_raids, so the treasury stays tamper-proof.
 */
import { terrain, isWater, waterNearby, radiusOf, ageHours, MAP, type Seed } from "./world";

const H = 3.6e6, DAY = 864e5, WEEK = 7 * DAY;
export const FIRE_CHANCE = 0.3, FIRE_CHANCE_GUARDED = 0.08;
export const FIRE_REBUILD = 36 * H;
export const FLOOD_LEN = 48 * H, FLOOD_REBUILD = 48 * H, FLOOD_RICH = 14 * DAY;
export const FLOOD_FOOD_LOSS = 20, FLOOD_FOOD_GAIN = 20;
export const RAID_FIRST = 10 * DAY, RAID_EVERY = 17 * DAY, RAID_LOSS = 25, RAID_LEN = 45 * 6e4;
/** Stage (0–5) from which the fire house and the town guard can be bought. */
export const ITEM_STAGE: Record<string, number> = { firehouse: 3, guard: 4 };

const AFFECTED = new Set(["hut", "suburb", "farmhouse", "cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement", "barn", "workshop", "stall", "coop", "inn", "bakery"]);
export const canBurn = (k: string) => AFFECTED.has(k);

function rnd(id: string, n: number, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  h = Math.imul(h ^ n, 2246822519); h ^= h >>> 13; h = Math.imul(h, 3266489917); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const owns = (s: Seed, item: string, t: number) => (s.bought ?? []).some((b) => b.item === item && b.at <= t);
/** Water within reach of the village core: bucket chains put fires out much faster. */
export const hasWater = (s: Seed) => waterNearby(s.x, s.y);

export type Fire = { at: number; end: number; tiles: number[]; x: number; y: number; dead: boolean; guarded: boolean; water: boolean };
export type Flood = { at: number; end: number; tiles: number[]; ruined: number[]; x: number; y: number };
export type Raid = { at: number; end: number; loss: number; caught: boolean };

export function fires(s: Seed, now: number): Fire[] {
  const c0 = Date.parse(s.created_at), out: Fire[] = [], water = hasWater(s);
  for (let w = 1; c0 + w * WEEK <= now; w++) {
    const at = c0 + w * WEEK + rnd(s.id, w, 11) * WEEK;
    if (at > now) break;
    const guarded = owns(s, "firehouse", at);
    if (rnd(s.id, w, 12) > (guarded ? FIRE_CHANCE_GUARDED : FIRE_CHANCE)) continue;
    const r = radiusOf(ageHours(s, at)) * 0.75;
    if (r < 2) continue;
    const a = rnd(s.id, w, 13) * Math.PI * 2, d = 1.5 + rnd(s.id, w, 14) * (r - 1.5);
    const x = Math.round(s.x + Math.cos(a) * d), y = Math.round(s.y + Math.sin(a) * d);
    const n = guarded ? 1 : water ? 2 : 3 + Math.floor(rnd(s.id, w, 15) * 2);
    const nb = [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    const tiles = nb.slice(0, n + 2).map(([i, j]) => (y + j!) * MAP + x + i!);
    const burn = guarded ? 0.5 * H : water ? 1.5 * H : 4 * H;
    out.push({ at, end: at + burn, tiles, x, y, guarded, water, dead: !guarded && !water && rnd(s.id, w, 16) < 0.35 });
  }
  return out;
}

const FLOOD_MONTHS = new Set([2, 3, 9, 10]);
const fcache = new Map<string, number[]>();
function shoreTiles(s: Seed, r: number) {
  const key = `${s.id}:${s.x}:${s.y}:${Math.round(r)}`; const hit = fcache.get(key); if (hit) return hit;
  const out: number[] = []; const R = Math.ceil(r);
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
    if (Math.hypot(i, j) > r) continue;
    const x = s.x + i, y = s.y + j; if (isWater(terrain(x, y))) continue;
    let wet = false;
    for (let b = -1; b <= 1 && !wet; b++) for (let a = -1; a <= 1; a++) if (isWater(terrain(x + a, y + b))) { wet = true; break; }
    if (wet) out.push(y * MAP + x);
  }
  if (fcache.size > 300) fcache.clear();
  fcache.set(key, out); return out;
}
export function floods(s: Seed, now: number): Flood[] {
  if (!hasWater(s)) return [];
  const c0 = Date.parse(s.created_at), out: Flood[] = [], P = 14 * DAY;
  for (let k = 1; c0 + k * P <= now; k++) {
    const start = c0 + k * P;
    if (!FLOOD_MONTHS.has(new Date(start).getUTCMonth()) || rnd(s.id, k, 21) > 0.4) continue;
    const at = start + rnd(s.id, k, 22) * (P - FLOOD_LEN);
    if (at > now) break;
    const tiles = shoreTiles(s, radiusOf(ageHours(s, at)));
    if (!tiles.length) continue;
    const ruined = tiles.filter((t) => rnd(s.id, t, 23 + k) < 0.3);
    out.push({ at, end: at + FLOOD_LEN, tiles, ruined, x: s.x, y: s.y });
  }
  return out;
}

export function raids(s: Seed, now: number): Raid[] {
  const c0 = Date.parse(s.created_at), out: Raid[] = [];
  for (let at = c0 + RAID_FIRST; at <= now; at += RAID_EVERY) {
    const caught = owns(s, "guard", at);
    out.push({ at, end: at + RAID_LEN, caught, loss: caught ? 0 : RAID_LOSS });
  }
  return out;
}
/** Taler stolen so far (mirrors village_raids in the database). */
export const raidLoss = (s: Seed, now: number) => raids(s, now).reduce((a, r) => a + r.loss, 0);

export type TileHit = { fire?: true; build?: number; flood?: true };
const tcache = new Map<string, Map<number, TileHit>>();
/** What disasters do to each tile right now: burning, rebuilding after fire/flood, or under water. */
export function tileHits(s: Seed, now: number): Map<number, TileHit> {
  const key = `${s.id}:${s.created_at}:${(s.bought ?? []).map((b) => b.item + b.at).join(",")}:${Math.floor(now / 6e4)}`;
  const hit = tcache.get(key); if (hit) return hit;
  const m = new Map<number, TileHit>();
  for (const f of fires(s, now)) {
    if (now >= f.end + FIRE_REBUILD) continue;
    for (const t of f.tiles) {
      if (now < f.end) m.set(t, { fire: true });
      else if (!f.guarded) m.set(t, { build: (now - f.end) / FIRE_REBUILD });
    }
  }
  for (const f of floods(s, now)) {
    if (now >= f.end + FLOOD_REBUILD) continue;
    if (now < f.end) for (const t of f.tiles) m.set(t, { ...m.get(t), flood: true });
    else for (const t of f.ruined) m.set(t, { build: (now - f.end) / FLOOD_REBUILD });
  }
  if (tcache.size > 200) tcache.clear();
  tcache.set(key, m); return m;
}

/** Food effect of floods: harvest lost while under water, rich silt harvests afterwards. */
export function floodFood(s: Seed, now: number) {
  let v = 0;
  for (const f of floods(s, now)) {
    if (now < f.end) v -= FLOOD_FOOD_LOSS;
    else if (now < f.end + FLOOD_RICH) v += FLOOD_FOOD_GAIN;
  }
  return v;
}
/** Robber currently in the village (for the map). */
export const activeRaid = (s: Seed, now: number) => raids(s, now).find((r) => now >= r.at && now < r.end) ?? null;
