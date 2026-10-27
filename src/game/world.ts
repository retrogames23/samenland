// Pure, deterministic world + town growth logic (shared by every player).
export const MAP = 512;

export type Seed = { id: string; name: string; owner: string; x: number; y: number; hue: number; created_at: string; user_id?: string | null };
export type Planting = { id: string; seed_id: string; kind: "tree" | "flower" | "lantern"; x: number; y: number; created_at: string };

export function hash(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, s: number) {
  let t = 0, amp = 0.5, f = 1;
  for (let i = 0; i < 4; i++) { t += vnoise(x * f, y * f, s + i) * amp; f *= 2; amp *= 0.5; }
  return t / 0.9375;
}

export type Terrain = "deep" | "water" | "sand" | "grass" | "meadow" | "forest" | "hill";
const tcache = new Map<number, Terrain>();
export function terrain(x: number, y: number): Terrain {
  if (x < 0 || y < 0 || x >= MAP || y >= MAP) return "deep";
  const k = y * MAP + x;
  const c = tcache.get(k);
  if (c) return c;
  const cx = x / MAP - 0.5, cy = y / MAP - 0.5;
  const edge = Math.max(0, Math.hypot(cx, cy) * 2 - 0.75) * 1.6;
  const h = fbm(x / 70, y / 70, 1) - edge;
  const river = Math.abs(fbm(x / 110, y / 110, 9) - 0.5);
  let t: Terrain;
  if (h < 0.3) t = "deep";
  else if (h < 0.36 || (river < 0.012 && h < 0.7)) t = "water";
  else if (h < 0.39 || river < 0.02) t = "sand";
  else if (h > 0.68) t = "hill";
  else if (fbm(x / 25, y / 25, 5) > 0.58) t = "forest";
  else if (fbm(x / 18, y / 18, 7) > 0.6) t = "meadow";
  else t = "grass";
  tcache.set(k, t);
  return t;
}
export const buildable = (t: Terrain) => t === "grass" || t === "meadow" || t === "forest" || t === "sand";
export const isWater = (t: Terrain) => t === "water" || t === "deep";

export const ageHours = (s: Seed, now: number) => Math.max(0, (now - Date.parse(s.created_at)) / 3.6e6);

/** Growth stages: Hof, Weiler, Dorf, Kleinstadt, Industrie (thresholds in hours). */
export const STAGES = [
  { name: "Hof", from: 0 },
  { name: "Weiler", from: 24 },
  { name: "Dorf", from: 120 },
  { name: "Kleinstadt", from: 480 },
  { name: "Industriestadt", from: 1440 },
] as const;
export const stageOf = (h: number) => (h >= 1440 ? 4 : h >= 480 ? 3 : h >= 120 ? 2 : h >= 24 ? 1 : 0);
/** Town radius in tiles: starts as a single farm, grows with sqrt(age) — very slowly. */
export const radiusOf = (h: number) => 1.6 + 0.45 * Math.sqrt(h);
const birthAt = (d: number) => Math.pow(Math.max(0, d - 1.6) / 0.45, 2);

export type Kind =
  | "well" | "path" | "street" | "square"
  | "farmhouse" | "barn" | "field" | "pasture" | "garden" | "hay"
  | "cottage" | "church" | "mill" | "inn" | "bakery"
  | "townhouse" | "workshop" | "smithy" | "warehouse" | "market"
  | "factory" | "sawmill";
export type Structure = { kind: Kind; seed: Seed; v: number };
export const FLAT: ReadonlySet<Kind> = new Set(["path", "street", "square", "field", "pasture", "garden", "market"]);

const CORE: Record<string, Kind> = { "1,0": "farmhouse", "0,1": "barn", "1,1": "hay", "-1,0": "field", "-1,1": "field", "0,-1": "garden" };
const LANDMARKS: { dx: number; dy: number; at: number; kind: Kind }[] = [
  { dx: 2, dy: -2, at: 110, kind: "church" },
  { dx: -3, dy: -3, at: 140, kind: "mill" },
  { dx: 3, dy: 1, at: 160, kind: "inn" },
  { dx: -2, dy: 2, at: 200, kind: "bakery" },
  { dx: 0, dy: -3, at: 480, kind: "market" },
  { dx: 4, dy: -1, at: 520, kind: "smithy" },
  { dx: -4, dy: 1, at: 600, kind: "warehouse" },
  { dx: 8, dy: 6, at: 1440, kind: "factory" },
  { dx: -7, dy: -6, at: 1500, kind: "sawmill" },
  { dx: -9, dy: 5, at: 1700, kind: "factory" },
  { dx: 6, dy: -9, at: 2200, kind: "factory" },
];
const SPOKE_AT = [0, 0, 24, 72, 150, 300, 600, 1200];
const RINGS = [{ r: 5, at: 150 }, { r: 10, at: 600 }, { r: 16, at: 1500 }, { r: 24, at: 3500 }];

function seedNum(s: Seed) { let h = 0; for (const ch of s.id) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; }

function pathAt(x: number, y: number, s: Seed, age: number, r: number): boolean {
  const dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy);
  if (d < 0.8 || d > r + 0.3) return false;
  if (!buildable(terrain(x, y))) return false;
  const sn = seedNum(s);
  const base = hash(sn, 1, 2) * Math.PI * 2;
  const a = Math.atan2(dy, dx);
  for (let k = 0; k < SPOKE_AT.length; k++) {
    if (age < SPOKE_AT[k]!) break;
    const ang = base + k * 2.39996 + (vnoise(d * 0.18, k * 7.3, sn & 1023) - 0.5) * 1.1;
    let diff = Math.abs(a - ang) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < Math.PI / 2 && d * Math.sin(diff) < 0.55) return true;
  }
  for (const ring of RINGS) {
    if (age < ring.at || ring.r > r) break;
    const wob = (vnoise(Math.cos(a) * 2 + 5, Math.sin(a) * 2 + 5, sn & 511) - 0.5) * 1.6;
    if (Math.abs(d - ring.r - wob) < 0.5) return true;
  }
  return false;
}

function weighted<T>(h: number, opts: [T, number][]): T {
  const tot = opts.reduce((a, o) => a + o[1], 0);
  let t = h * tot;
  for (const [k, w] of opts) { if ((t -= w) < 0) return k; }
  return opts[opts.length - 1]![0];
}

function forSeed(x: number, y: number, s: Seed, age: number, r: number, d: number): Kind | null {
  const dx = x - s.x, dy = y - s.y;
  const stage = stageOf(age);
  if (dx === 0 && dy === 0) return "well";
  const core = CORE[`${dx},${dy}`];
  if (core) return stage >= 3 && core !== "barn" && core !== "hay" ? "square" : core;
  for (const l of LANDMARKS) if (l.dx === dx && l.dy === dy && age >= l.at) return l.kind;
  if (pathAt(x, y, s, age, r)) return stage >= 3 && d < r * 0.6 ? "street" : "path";
  if (stage >= 2 && d < 1.6) return "square";
  const birth = birthAt(d) * (0.75 + 0.5 * hash(x, y, 3));
  if (age < birth) return null;
  let near = false;
  for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1; i++) if ((i || j) && pathAt(x + i, y + j, s, age, r)) { near = true; break; }
  const h = hash(x, y, 4), bs = stageOf(birth);
  if (!near) {
    if (stage >= 3 && d < r * 0.45) return h < 0.5 ? "garden" : null;
    return weighted(h, [["field", 55], ["pasture", bs <= 2 ? 25 : 5], ["garden", 8], ["hay", 4]]) as Kind;
  }
  if (hash(x, y, 2) > 0.78) return h < 0.5 ? "garden" : null;
  let k: Kind;
  if (bs <= 1) k = weighted(h, [["farmhouse", 50], ["barn", 25], ["garden", 15], ["hay", 10]]);
  else if (bs === 2) k = weighted(h, [["cottage", 55], ["farmhouse", 20], ["barn", 10], ["garden", 15]]);
  else if (bs === 3) k = weighted(h, [["townhouse", 60], ["workshop", 15], ["cottage", 15], ["warehouse", 10]]);
  else k = weighted(h, [["townhouse", 40], ["factory", 15], ["warehouse", 20], ["workshop", 25]]);
  // densification: old farmhouses near the centre get rebuilt as townhouses
  if (stage >= 3 && (k === "farmhouse" || k === "cottage") && d < r * 0.4 && hash(x, y, 9) < 0.6) k = "townhouse";
  return k;
}

let cacheKey = "";
const scache = new Map<number, Structure | null>();
export function structureAt(x: number, y: number, seeds: Seed[], now: number): Structure | null {
  const key = `${Math.floor(now / 60000)}|${seeds.length}`;
  if (key !== cacheKey) { cacheKey = key; scache.clear(); }
  const ck = y * MAP + x;
  const c = scache.get(ck);
  if (c !== undefined) return c;
  let best: Structure | null = null;
  if (buildable(terrain(x, y))) {
    let bestD = Infinity;
    for (const s of seeds) {
      const d = Math.hypot(x - s.x, y - s.y);
      const age = ageHours(s, now);
      const r = radiusOf(age);
      if (d > r + 0.5 || d >= bestD) continue;
      const k = forSeed(x, y, s, age, r, d);
      if (k) { best = { kind: k, seed: s, v: hash(x, y, 5) }; bestD = d; }
    }
  }
  scache.set(ck, best);
  return best;
}

export function townStats(s: Seed, now: number) {
  const age = ageHours(s, now);
  const r = radiusOf(age);
  let buildings = 0;
  for (let y = Math.floor(s.y - r); y <= s.y + r; y++)
    for (let x = Math.floor(s.x - r); x <= s.x + r; x++) {
      const st = structureAt(x, y, [s], now);
      if (st && !FLAT.has(st.kind) && st.kind !== "well" && st.kind !== "hay") buildings++;
    }
  // reset cache since it was filled with a single-seed view
  cacheKey = "";
  return { age, radius: r, buildings, stage: STAGES[stageOf(age)]!.name };
}

export const MIN_SEED_DISTANCE = 40;
/** Returns an error code ("hill" | "water" | "near:<name>") or null; UI translates it. */
export function canPlant(x: number, y: number, seeds: Seed[]): string | null {
  const tt = terrain(x, y);
  if (tt === "hill") return "hill";
  if (!buildable(tt)) return "water";
  for (const s of seeds) if (Math.hypot(x - s.x, y - s.y) < MIN_SEED_DISTANCE) return `near:${s.name}`;
  return null;
}
