import { labEvent } from "./lab-ctl";
import { aidFactor } from "./gifts";
import { townCharacter } from "./character";
/** Stone-built hill towns: fires start less often and spread to fewer roofs. */
export const STONE_FIRE = 0.6;
/**
 * Disasters: fires, floods and raids are a pure calendar per village, derived from (seed id, time window)
 * and purchases (fire house, town guard). Nothing is stored: every client sees the same fire at the same moment.
 * Raid losses are mirrored by the database function village_raids, so the treasury stays tamper-proof.
 */
import { structureAt, terrain, isWater, waterNearby, riverDistAt, radiusOf, reachOf, ageHours, MAP, type Seed } from "./world";

const H = 3.6e6, DAY = 864e5, WEEK = 7 * DAY;
export const FIRE_CHANCE = 0.3, FIRE_CHANCE_GUARDED = 0.08;
export const FIRE_REBUILD = 36 * H;
export const FLOOD_LEN = 48 * H, FLOOD_REBUILD = 48 * H, FLOOD_RICH = 14 * DAY;
export const FLOOD_FOOD_LOSS = 20, FLOOD_FOOD_GAIN = 20;
export const RAID_FIRST = 10 * DAY, RAID_EVERY = 17 * DAY, RAID_LOSS = 25, RAID_LEN = 45 * 6e4;
/** Stage (0–5) from which the fire house and the town guard can be bought. */
/** Settlement rank (townRank 0 Siedlung … 5 Hansestadt) each shop building needs — the only general purchase gate, never time; mirrors DB purchase_guard need_rank. */
export const ITEM_RANK: Record<string, number> = { herbs: 0, hunter: 0, fisher: 0, markethall: 0, guildhall: 0, library: 0, dairy: 0, backhaus: 1, herberge: 1, beginen: 2, badestube: 3, woodcamp: 1, granary: 1, healer: 1, school: 3, firehouse: 3, guard: 4, bigstore: 1, stonemason: 1, smokehouse: 1, millrow: 3, hammerworks: 3, saltquay: 3 };

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
  const c0 = Date.parse(s.created_at), out: Fire[] = [], water = hasWater(s), stone = !!s.user_id && townCharacter(s).main === "workshop";
  for (let w = 1; c0 + w * WEEK <= now; w++) {
    const at = c0 + w * WEEK + rnd(s.id, w, 11) * WEEK;
    if (at > now) break;
    const guarded = owns(s, "firehouse", at);
    const mo = new Date(at).getUTCMonth(), dry = mo >= 5 && mo <= 7 ? 1.6 : mo === 11 || mo <= 1 ? 1.1 : 0.75;
    if (rnd(s.id, w, 12) > (guarded ? FIRE_CHANCE_GUARDED : FIRE_CHANCE) * dry * (stone ? STONE_FIRE : 1)) continue;
    const r = radiusOf(ageHours(s, at)) * 0.75;
    if (r < 2) continue;
    const a = rnd(s.id, w, 13) * Math.PI * 2, d = 1.5 + rnd(s.id, w, 14) * (r - 1.5);
    const x = Math.round(s.x + Math.cos(a) * d), y = Math.round(s.y + Math.sin(a) * d);
    const n = Math.max(1, (guarded ? 1 : water ? 2 : 3 + Math.floor(rnd(s.id, w, 15) * 2)) - (stone ? 1 : 0));
    const nb = [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    const tiles = nb.slice(0, n + 2).map(([i, j]) => (y + j!) * MAP + x + i!);
    const burn = guarded ? 0.5 * H : water ? 1.5 * H : 4 * H;
    out.push({ at, end: at + burn, tiles, x, y, guarded, water, dead: !guarded && !water && rnd(s.id, w, 16) < 0.35 });
  }
  const lf = labEvent("fire");
  if (lf && lf <= now && (s.user_id || s.realm === "lab") && !scanning) {
    const [x, y] = labFireSpot(s, lf);
    const tiles = [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1]].map(([i, j]) => (y + j!) * MAP + x + i!);
    out.push({ at: lf, end: lf + 2 * H, tiles, x, y, guarded: false, water: false, dead: false });
  }
  return out;
}

/** Test fire: the burnable building nearest the town centre (found once per trigger, without fire hits). */
let scanning = false;
const spotCache = new Map<string, [number, number]>();
function labFireSpot(s: Seed, at: number): [number, number] {
  const key = `${s.id}:${at}`, hit = spotCache.get(key); if (hit) return hit;
  let spot: [number, number] = [s.x + 2, s.y + 1];
  scanning = true;
  try {
    let bd = Infinity;
    for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
      const d = Math.hypot(i, j); if (d < 1 || d >= bd) continue;
      const st = structureAt(s.x + i, s.y + j, [s], at);
      if (st && st.build === undefined && canBurn(st.kind)) { bd = d; spot = [s.x + i, s.y + j]; }
    }
  } finally { scanning = false; }
  spotCache.set(key, spot); return spot;
}

const FLOOD_MONTHS = new Set([2, 3, 9, 10]);
const fcache = new Map<string, number[]>();
/** River water (not sea): only rivers burst their banks. */
const riverWater = (x: number, y: number) => isWater(terrain(x, y)) && riverDistAt(x, y) < 0;
/** Cheap precheck: a river runs anywhere within the largest reach the town could ever grow to.
 *  Whether a given flood actually hits is decided by the town's extent at that hour (shoreTiles). */
const MAX_REACH = (s: Seed) => Math.ceil(reachOf(s, radiusOf(40000))) + 1;
const rvCache = new Map<number, boolean>();
export function nearRiver(s: Seed) {
  const key = s.y * MAP + s.x, hit = rvCache.get(key); if (hit !== undefined) return hit;
  const R = MAX_REACH(s); let ok = false;
  for (let j = -R; j <= R && !ok; j++) for (let i = -R; i <= R; i++)
    if (Math.hypot(i, j) <= R && riverWater(s.x + i, s.y + j)) { ok = true; break; }
  rvCache.set(key, ok); return ok;
}
function shoreTiles(s: Seed, r: number) {
  const key = `${s.id}:${s.x}:${s.y}:${Math.round(r)}`; const hit = fcache.get(key); if (hit) return hit;
  const out: number[] = []; const R = Math.ceil(r);
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
    if (Math.hypot(i, j) > r) continue;
    const x = s.x + i, y = s.y + j; if (isWater(terrain(x, y))) continue;
    let wet = false;
    for (let b = -1; b <= 1 && !wet; b++) for (let a = -1; a <= 1; a++) if (riverWater(x + a, y + b)) { wet = true; break; }
    if (wet) out.push(y * MAP + x);
  }
  if (fcache.size > 300) fcache.clear();
  fcache.set(key, out); return out;
}
export function floods(s: Seed, now: number): Flood[] {
  const lf = labEvent("flood");
  if (lf && lf <= now && (s.user_id || s.realm === "lab")) {
    let tiles = nearRiver(s) ? shoreTiles(s, reachOf(s, radiusOf(ageHours(s, lf)))) : [];
    if (!tiles.length) { tiles = []; for (let j = 2; j <= 4; j++) for (let i = -3; i <= 3; i++) if (!isWater(terrain(s.x + i, s.y + j))) tiles.push((s.y + j) * MAP + s.x + i); }
    const base = nearRiver(s) ? floodsReal(s, now) : [];
    return [...base, { at: lf, end: lf + 2 * H, tiles, ruined: tiles.filter((t) => rnd(s.id, t, 99) < 0.3), x: s.x, y: s.y }];
  }
  return floodsReal(s, now);
}
function floodsReal(s: Seed, now: number): Flood[] {
  if (!nearRiver(s)) return [];
  const c0 = Date.parse(s.created_at), out: Flood[] = [], P = 14 * DAY;
  for (let k = 1; c0 + k * P <= now; k++) {
    const start = c0 + k * P;
    if (!FLOOD_MONTHS.has(new Date(start).getUTCMonth()) || rnd(s.id, k, 21) > 0.4) continue;
    const at = start + rnd(s.id, k, 22) * (P - FLOOD_LEN);
    if (at > now) break;
    const tiles = shoreTiles(s, reachOf(s, radiusOf(ageHours(s, at))));
    if (!tiles.length) continue;
    const ruined = tiles.filter((t) => rnd(s.id, t, 23 + k) < 0.3);
    out.push({ at, end: at + FLOOD_LEN, tiles, ruined, x: s.x, y: s.y });
  }
  return out;
}

/** Integer seed hash both client and database can compute: first 8 hex digits of the id. */
export const raidHash = (id: string) => parseInt(id.replace(/-/g, "").slice(0, 8), 16) || 0;
/** Irregular raid calendar: gaps of 6–24 days, random hour, loot 12–45 Mark. Mirrored by DB village_raids. */
export function raidPlan(id: string, k: number) {
  const h = raidHash(id);
  return { gap: 6 + ((h + k * 7919) % 19), hour: (h + k * 31) % 24, loss: 12 + ((h + k * 104729) % 34) };
}
export function raids(s: Seed, now: number): Raid[] {
  const c0 = Date.parse(s.created_at), out: Raid[] = [];
  let day = 4;
  for (let k = 0; ; k++) {
    const p = raidPlan(s.id, k); day += p.gap;
    const at = c0 + day * DAY + p.hour * H;
    if (at > now) break;
    const caught = owns(s, "guard", at);
    out.push({ at, end: at + RAID_LEN, caught, loss: caught ? 0 : p.loss });
  }
  const lr = labEvent("raid");
  if (lr && lr <= now && (s.user_id || s.realm === "lab")) out.push({ at: lr, end: lr + RAID_LEN, caught: false, loss: 0 });
  return out;
}
/** Mark stolen so far (mirrors village_raids in the database). */
export const raidLoss = (s: Seed, now: number) => raids(s, now).reduce((a, r) => a + r.loss, 0);

/** Craft charter: the guild masons rebuild after fire and flood twice as fast. */
export const craftRepair = (s: Seed, at: number) => (s.charter?.path === "craft" && s.charter.at <= at ? 2 : 1);
export type TileHit = { fire?: true; build?: number; flood?: true; wet?: number; silt?: number; levee?: number };
/** Silt lies on the fields for a few days after the water has gone. */
export const SILT_LEN = 4 * DAY;
/** How deep the water stands on a tile (0..1): rises from the river bank inland, then drains in reverse. */
export function floodLevel(f: Flood, tile: number, now: number) {
  if (now < f.at || now >= f.end) return 0;
  const len = f.end - f.at, rise = Math.min(H, len / 6), fall = Math.min(3 * H, len / 4);
  const tx = tile % MAP, ty = Math.floor(tile / MAP);
  // tiles touching the river itself fill first, the rest follow a little later
  let bank = false; for (let b = -1; b <= 1 && !bank; b++) for (let a = -1; a <= 1; a++) if (riverWater(tx + a, ty + b)) { bank = true; break; }
  const delay = bank ? 0 : 0.35 + rnd(String(tile), 3, 77) * 0.3;
  const up = Math.max(0, Math.min(1, ((now - f.at) / rise - delay) / (1 - delay * 0.5)));
  const down = Math.max(0, Math.min(1, ((f.end - now) / fall - delay * 0.6) / (1 - delay * 0.3)));
  return Math.min(up, down);
}
/** Dry tiles on the landward edge of the water, where villagers pile fascines, and a camera point there. */
export function floodFront(f: Flood): { levee: number[]; x: number; y: number } {
  const wet = new Set(f.tiles), levee: number[] = [];
  for (const t of f.tiles) { const x = t % MAP, y = Math.floor(t / MAP);
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { const k = (y + b) * MAP + x + a; if (!wet.has(k) && !levee.includes(k) && !isWater(terrain(x + a, y + b)) && !riverWater(x + a, y + b)) levee.push(k); } }
  const pool = f.tiles.length ? f.tiles : [f.y * MAP + f.x];
  let sx = 0, sy = 0; for (const t of pool) { sx += t % MAP; sy += Math.floor(t / MAP); }
  return { levee, x: sx / pool.length, y: sy / pool.length };
}
const tcache = new Map<string, Map<number, TileHit>>();
/** What disasters do to each tile right now: burning, rebuilding after fire/flood, or under water. */
export function tileHits(s: Seed, now: number): Map<number, TileHit> {
  const key = `${labEvent("fire") ?? 0}:${labEvent("flood") ?? 0}:${s.id}:${s.created_at}:${(s.bought ?? []).map((b) => b.item + b.at).join(",")}:${(s.aid ?? []).join(",")}:${s.charter?.path ?? ""}${s.charter?.at ?? ""}:${Math.floor(now / 6e4)}`;
  const hit = tcache.get(key); if (hit) return hit;
  const m = new Map<number, TileHit>();
  for (const f of fires(s, now)) {
    const k = aidFactor(s.aid, f.end) * craftRepair(s, f.end);
    if (now >= f.end + FIRE_REBUILD / k) continue;
    for (const t of f.tiles) {
      if (now < f.end) m.set(t, { fire: true });
      else if (!f.guarded) m.set(t, { build: ((now - f.end) * k) / FIRE_REBUILD });
    }
  }
  for (const f of floods(s, now)) {
    const k = aidFactor(s.aid, f.end) * craftRepair(s, f.end);
    if (now >= f.end + Math.max(SILT_LEN, FLOOD_REBUILD / k)) continue;
    // the fascine wall grows during the flood and is cleared away a day after the water drains
    if (now < f.end + DAY) { const lv = now < f.end ? Math.min(1, (now - f.at) / ((f.end - f.at) / 3)) : 1 - (now - f.end) / DAY; if (lv > 0.05) for (const t of floodFront(f).levee) m.set(t, { ...m.get(t), levee: lv }); }
    if (now < f.end) { for (const t of f.tiles) { const w = floodLevel(f, t, now); if (w > 0.02) m.set(t, { ...m.get(t), flood: true, wet: w }); } }
    else {
      const sl = 1 - (now - f.end) / SILT_LEN;
      if (sl > 0) for (const t of f.tiles) m.set(t, { ...m.get(t), silt: sl });
      if (now < f.end + FLOOD_REBUILD / k) for (const t of f.ruined) m.set(t, { ...m.get(t), build: ((now - f.end) * k) / FLOOD_REBUILD });
    }
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
