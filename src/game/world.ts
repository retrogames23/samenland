// Pure, deterministic world + town growth logic (shared by every player).
export const MAP = 1024;

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

export type Terrain = "deep" | "water" | "sand" | "grass" | "meadow" | "fertile" | "forest" | "hill" | "mountain";
const TLIST: Terrain[] = ["deep", "water", "sand", "grass", "meadow", "fertile", "forest", "hill", "mountain"];
const tcache = new Uint8Array(MAP * MAP); // 0 = not computed, else index+1

/** Island height with an irregular, bay-and-cape coastline (domain-warped radial falloff). */
function heightAt(x: number, y: number) {
  const wx = x + (fbm(x / 160, y / 160, 21) - 0.5) * 140;
  const wy = y + (fbm(x / 160, y / 160, 22) - 0.5) * 140;
  const cx = wx / MAP - 0.5, cy = wy / MAP - 0.5;
  const ang = Math.atan2(cy, cx);
  // angular noise → deep bays and long capes
  const coast = 0.72 + (vnoise(Math.cos(ang) * 3 + 10, Math.sin(ang) * 3 + 10, 23) - 0.5) * 0.32;
  const edge = Math.max(0, Math.hypot(cx, cy) * 2 - coast) * 2.2;
  const ridge = 1 - Math.abs(fbm(x / 120, y / 120, 25) * 2 - 1); // mountain chains
  return fbm(x / 90, y / 90, 1) * 0.75 + ridge * ridge * 0.3 - edge;
}
/** 0 on a river centreline. Main rivers + narrower tributaries. */
function riverDist(x: number, y: number) {
  const main = Math.abs(fbm(x / 170, y / 170, 9) - 0.5);
  const trib = Math.abs(fbm(x / 70, y / 70, 31) - 0.5) * 1.8;
  return Math.min(main, trib);
}
export function terrain(x: number, y: number): Terrain {
  if (x < 0 || y < 0 || x >= MAP || y >= MAP) return "deep";
  const k = y * MAP + x;
  const c = tcache[k]!;
  if (c) return TLIST[c - 1]!;
  const h = heightAt(x, y);
  const rv = riverDist(x, y);
  // rivers widen as they approach the sea and vanish high in the mountains
  const w = 0.006 + Math.max(0, 0.62 - h) * 0.03;
  let t: Terrain;
  if (h < 0.3) t = "deep";
  else if (h < 0.35 || (rv < w && h < 0.74)) t = "water";
  else if (h < 0.375 || (rv < w + 0.005 && h < 0.74)) t = "sand";
  else if (h > 0.8) t = "mountain";
  else if (h > 0.68) t = "hill";
  else if (rv < w + 0.03 && h < 0.55) t = "fertile";
  else if (fbm(x / 25, y / 25, 5) > 0.58) t = "forest";
  else if (fbm(x / 18, y / 18, 7) > 0.6) t = "meadow";
  else t = "grass";
  tcache[k] = TLIST.indexOf(t) + 1;
  return t;
}
export const buildable = (t: Terrain) => t === "grass" || t === "meadow" || t === "fertile" || t === "forest" || t === "sand";
export const isWater = (t: Terrain) => t === "water" || t === "deep";

export type Resource = "ore" | "coal" | "stone";
/** Mineral deposits in the uplands (future industry bonus). Deterministic per tile. */
export function resourceAt(x: number, y: number): Resource | null {
  const t = terrain(x, y);
  if (t !== "hill" && t !== "mountain") return null;
  if (fbm(x / 14, y / 14, 41) > 0.66) return "ore";
  if (fbm(x / 16, y / 16, 43) > 0.67) return "coal";
  if (hash(x, y, 45) > 0.93) return "stone";
  return null;
}

export const ageHours = (s: Seed, now: number) => Math.max(0, (now - Date.parse(s.created_at)) / 3.6e6);

/** Six eras in effective hours. Expansion slows, but never stops. */
export const STAGES = [
  { name: "Ursprung", from: 0 }, { name: "Weiler", from: 24 },
  { name: "Dorf", from: 168 }, { name: "Kleinstadt", from: 2160 },
  { name: "Handelsstadt", from: 4380 }, { name: "Metropole", from: 8760 },
] as const;
export const stageOf = (h: number) => {
  let stage = 0;
  for (let i = 1; i < STAGES.length; i++) if (h >= (STAGES[i]?.from ?? Infinity)) stage = i;
  return stage;
};
/** Mixed sqrt/log expansion: ~43 tiles at two years, continuing beyond that. */
export const radiusOf = (h: number) => 1.6 + 0.18 * Math.sqrt(Math.max(0, h)) + 3 * Math.log1p(Math.max(0, h) / 60);
/** Monotonic numeric inverse; no artificial maximum town size. */
export const birthAt = (d: number) => {
  if (d <= 1.6) return 0;
  let lo = 0, hi = 24;
  while (radiusOf(hi) < d) hi *= 2;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (radiusOf(mid) < d) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
};
export type Kind =
  | "well" | "path" | "street" | "square"
  | "farmhouse" | "barn" | "field" | "pasture" | "garden" | "hay"
  | "cottage" | "church" | "mill" | "inn" | "bakery"
  | "townhouse" | "workshop" | "smithy" | "warehouse" | "market"
  | "factory" | "sawmill" | "road" | "bridge"
  | "campfire" | "hut" | "coop" | "fence" | "chapel" | "watermill" | "harbor"
  | "stall" | "townhall" | "manufactory" | "steamworks" | "station" | "suburb" | "rail" | "avenue";
export type Structure = { kind: Kind; seed: Seed; v: number };
export const FLAT: ReadonlySet<Kind> = new Set(["path", "street", "square", "field", "pasture", "garden", "market", "road", "bridge", "rail", "avenue"]);
const CORE: Record<string, Kind> = { "1,0": "hut", "0,1": "hut", "1,1": "campfire", "-1,0": "garden", "-1,1": "field", "0,-1": "garden" };
const LANDMARKS: { dx: number; dy: number; at: number; kind: Kind }[] = [
  { dx: 2, dy: -1, at: 30, kind: "coop" }, { dx: -2, dy: 1, at: 48, kind: "barn" },
  { dx: 2, dy: -2, at: 180, kind: "chapel" }, { dx: -3, dy: -3, at: 240, kind: "watermill" },
  { dx: 3, dy: 1, at: 280, kind: "inn" }, { dx: -2, dy: 2, at: 360, kind: "bakery" },
  { dx: 0, dy: -3, at: 2160, kind: "stall" }, { dx: 4, dy: -1, at: 2300, kind: "smithy" },
  { dx: -4, dy: 1, at: 2500, kind: "warehouse" },
  { dx: 3, dy: -4, at: 4380, kind: "townhall" }, { dx: 2, dy: -2, at: 4500, kind: "church" },
  { dx: 8, dy: 6, at: 8760, kind: "manufactory" }, { dx: -7, dy: -6, at: 9200, kind: "steamworks" },
  { dx: -9, dy: 5, at: 10000, kind: "station" }, { dx: 6, dy: -9, at: 12000, kind: "factory" },
  { dx: 12, dy: 3, at: 14500, kind: "sawmill" },
];
const SPOKE_AT = [0, 0, 48, 168, 720, 2160, 4380, 8760];
const RINGS = [{ r: 5, at: 240 }, { r: 10, at: 2160 }, { r: 16, at: 4380 }, { r: 24, at: 8760 }, { r: 34, at: 15000 }];
const waterNearCache = new Map<number, boolean>();
export function waterNearby(x: number, y: number): boolean {
  const key = y * MAP + x, hit = waterNearCache.get(key); if (hit !== undefined) return hit;
  let water = false;
  for (let j = -3; j <= 3 && !water; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i,j) <= 3 && isWater(terrain(x+i,y+j))) { water = true; break; }
  waterNearCache.set(key, water); return water;
}
const birthCache = new Map<number, number>();
const tileBirth = (d: number) => { const key = Math.round(d * d); let h = birthCache.get(key); if (h === undefined) { h = birthAt(d); birthCache.set(key, h); } return h; };

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

const NOT_ANCHOR: ReadonlySet<Kind> = new Set(["path", "street", "avenue", "field", "pasture", "garden", "hay", "fence"]);
const keptCache = new Map<string, Set<number>>();
/**
 * Village paths that actually lead somewhere: raw spokes/rings are pruned from their loose ends
 * until every remaining end touches a building or the village square.
 */
function keptPaths(s: Seed, age: number, r: number): Set<number> {
  const ck = `${s.id}|${Math.floor(age * 60)}`;
  const hit = keptCache.get(ck); if (hit) return hit;
  const R = Math.ceil(r + 1), cx = Math.round(s.x), cy = Math.round(s.y);
  const paths = new Set<number>(), anchor = new Set<number>();
  for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
    if (x < 0 || y < 0 || x >= MAP || y >= MAP || !buildable(terrain(x, y))) continue;
    const d = Math.hypot(x - s.x, y - s.y);
    if (d > r + 0.5) continue;
    if (pathAt(x, y, s, age, r)) { paths.add(y * MAP + x); continue; }
    const k = forSeed(x, y, s, age, r, d, true);
    if (k && !NOT_ANCHOR.has(k)) anchor.add(y * MAP + x);
  }
  const nbrs = (k: number) => { const x = k % MAP, y = (k / MAP) | 0, o: number[] = []; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) o.push((y + j) * MAP + x + i); return o; };
  const anchored = (k: number) => nbrs(k).some((n) => anchor.has(n));
  let changed = true;
  while (changed) {
    changed = false;
    for (const k of [...paths]) {
      if (anchored(k)) continue;
      if (nbrs(k).filter((n) => paths.has(n)).length <= 1) { paths.delete(k); changed = true; }
    }
  }
  if (keptCache.size > 200) keptCache.clear();
  keptCache.set(ck, paths);
  return paths;
}

function forSeed(x: number, y: number, s: Seed, age: number, r: number, d: number, raw = false): Kind | null {
  const dx = x - s.x, dy = y - s.y, stage = stageOf(age);
  if (dx === 0 && dy === 0) return age < 0.15 ? "campfire" : "well";
  const core = CORE[`${dx},${dy}`];
  if (core) {
    if (age < 0.05 && core !== "hut") return null;
    if (dx === 0 && dy === 1 && age < 2) return null;
    if (core === "hut") return stage >= 3 ? "townhouse" : stage >= 1 ? "farmhouse" : "hut";
    if (core === "campfire") return stage >= 2 ? "square" : "campfire";
    return stage >= 3 ? "square" : core;
  }
  // Later landmarks replace earlier ones at the same site.
  for (let i = LANDMARKS.length - 1; i >= 0; i--) {
    const l = LANDMARKS[i]; if (!l) continue;
    if (l.dx !== dx || l.dy !== dy || age < l.at) continue;
    return l.kind === "watermill" && !waterNearby(x,y) ? "mill" : l.kind;
  }
  if (stage >= 3 && d > 3 && d < r * 0.8 && waterNearby(x,y) && hash(x,y,89) > 0.985) return "harbor";
  if (pathAt(x,y,s,age,r)) {
    if (!raw && !keptPaths(s, age, r).has(y * MAP + x)) return null;
    return stage >= 4 && d > r * 0.55 ? "avenue" : stage >= 3 && d < r * 0.6 ? "street" : "path";
  }
  if (stage >= 2 && d < 1.6) return "square";
  if (stage === 0) return null;
  const birth = tileBirth(d) * (0.75 + 0.5 * hash(x,y,3));
  if (age < birth) return null;
  let near = false;
  for (let j=-1;j<=1 && !near;j++) for (let i=-1;i<=1;i++) if ((i||j) && pathAt(x+i,y+j,s,age,r)) { near=true; break; }
  const h = hash(x,y,4);
  if (!near) {
    if (stage >= 4 && d < r * 0.5) return h < 0.45 ? "garden" : null;
    return weighted(h, [["field",55],["pasture",20],["garden",10],["hay",4],["fence",6],["coop",5]]);
  }
  if (hash(x,y,2)>0.82) return h<0.5?"garden":null;
  if (stage <= 1) return weighted(h,[["farmhouse",50],["barn",25],["garden",15],["coop",10]]);
  if (stage === 2) return weighted(h,[["cottage",55],["farmhouse",20],["barn",10],["garden",15]]);
  // Stable sectors form residential, craft and market districts.
  const sector = ((Math.atan2(dy,dx) + Math.PI + hash(seedNum(s),1,81)*2) % (2*Math.PI))/(2*Math.PI);
  if (stage === 3) return weighted(h,[["townhouse",55],["workshop",20],["cottage",15],["stall",10]]);
  if (d < r * 0.4) return weighted(h,[["townhouse",75],["workshop",10],["stall",10],["garden",5]]);
  if (stage === 5 && d > r * 0.72 && sector < 0.55) return "suburb";
  if (sector < 0.4) return stage >= 5 ? weighted(h,[["manufactory",25],["steamworks",8],["warehouse",25],["workshop",42]]) : weighted(h,[["workshop",65],["smithy",15],["warehouse",20]]);
  return weighted(h,[["townhouse",65],["stall",15],["cottage",20]]);
}

let cacheKey = "";
const scache = new Map<number, Structure | null>();
export function structureAt(x: number, y: number, seeds: Seed[], now: number): Structure | null {
  const key = `${Math.floor(now / 60000)}|${seeds.map(s => `${s.id}:${s.x}:${s.y}:${s.created_at}`).join(";")}`;
  if (key !== cacheKey) { cacheKey = key; scache.clear(); }
  const ck = y * MAP + x;
  const c = scache.get(ck);
  if (c !== undefined) return c;
  let best: Structure | null = null;
  if (buildable(terrain(x, y))) {
    let bestD = Infinity;
    for (const s of seeds) {
      const d = Math.hypot(x - s.x, y - s.y);
      const age = effAge(s, seeds, now);
      const r = radiusOf(age);
      if (d > r + 0.5 || d >= bestD) continue;
      const k = forSeed(x, y, s, age, r, d);
      if (k) { best = { kind: k, seed: s, v: hash(x, y, 5) }; bestD = d; }
    }
  }
  if (!best) {
    const rd = roadAt(x, y, seeds, now);
    if (rd) best = { kind: rd.bridge ? "bridge" : "road", seed: rd.link.a, v: hash(x, y, 5) };
  }
  scache.set(ck, best);
  return best;
}

export function townStats(s: Seed, seeds: Seed[], now: number) {
  const age = effAge(s, seeds, now);
  const r = radiusOf(age);
  let buildings = 0;
  for (let y = Math.floor(s.y - r); y <= s.y + r; y++)
    for (let x = Math.floor(s.x - r); x <= s.x + r; x++) {
      const st = structureAt(x, y, seeds, now);
      if (st && st.seed.id === s.id && !FLAT.has(st.kind) && st.kind !== "well" && st.kind !== "hay") buildings++;
    }
  const twins = links(seeds).filter((l) => (l.a.id === s.id || l.b.id === s.id) && isTwin(l, seeds, now)).map((l) => (l.a.id === s.id ? l.b : l.a).name);
  return { age, radius: r, buildings, stage: STAGES[stageOf(age)]!.name, speed: speedOf(s, seeds, now), twins };
}

export const MIN_SEED_DISTANCE = 40;
/** Returns an error code ("hill" | "water" | "near:<name>") or null; UI translates it. */
export function canPlant(x: number, y: number, seeds: Seed[]): string | null {
  const tt = terrain(x, y);
  if (tt === "hill" || tt === "mountain") return "hill";
  if (!buildable(tt)) return "water";
  for (const s of seeds) if (Math.hypot(x - s.x, y - s.y) < MIN_SEED_DISTANCE) return `near:${s.name}`;
  return null;
}

// ---------------- trade roads & synergy ----------------
/** Towns closer than this get a deterministic trade road. */
export const TRADE_DIST = 80;
/** Road is founded once the younger town is this many hours old, then built from both ends over ROAD_BUILD hours. */
export const ROAD_AT = 6;
export const ROAD_BUILD = 24;
export type Link = { a: Seed; b: Seed; d: number; since: number; tiles: [number, number][]; water: boolean[] };

let linkKey = "";
let linkCache: Link[] = [];
const roadIdx = new Map<number, { link: Link; i: number }>();

export function links(seeds: Seed[]): Link[] {
  const key = seeds.map((s) => `${s.id}:${s.x}:${s.y}:${s.created_at}`).join("|");
  if (key === linkKey) return linkCache;
  linkKey = key; linkCache = []; roadIdx.clear();
  for (let i = 0; i < seeds.length; i++) for (let j = i + 1; j < seeds.length; j++) {
    const a = seeds[i]!, b = seeds[j]!;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d > TRADE_DIST) continue;
    const l = buildLink(a, b, d);
    if (l) linkCache.push(l);
  }
  for (const l of linkCache) l.tiles.forEach(([x, y], i) => { const k = y * MAP + x; if (!roadIdx.has(k)) roadIdx.set(k, { link: l, i }); });
  return linkCache;
}

/**
 * Trade road follows the terrain (A* on a 4-connected grid): land is cheap, hills cost more and
 * water is very expensive, so a road only bridges a river where it truly has to cross it, taking
 * the shortest crossing from one bank to the other.
 */
function buildLink(a: Seed, b: Seed, d: number): Link | null {
  const sn = (seedNum(a) ^ seedNum(b)) & 4095;
  const ax = Math.round(a.x), ay = Math.round(a.y), bx = Math.round(b.x), by = Math.round(b.y);
  const pad = 24;
  const x0 = Math.max(0, Math.min(ax, bx) - pad), y0 = Math.max(0, Math.min(ay, by) - pad);
  const x1 = Math.min(MAP - 1, Math.max(ax, bx) + pad), y1 = Math.min(MAP - 1, Math.max(ay, by) + pad);
  const W = x1 - x0 + 1, H = y1 - y0 + 1, N = W * H;
  const cost = (x: number, y: number) => {
    const t = terrain(x, y);
    if (t === "deep") return 400;
    if (isWater(t)) return 40;
    if (t === "mountain") return 30;
    if (t === "hill") return 2.5;
    if (t === "forest") return 1.8;
    return 1 + vnoise(x * 0.15, y * 0.15, sn) * 0.6; // gentle meander
  };
  const g = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const heap: [number, number][] = [];
  const push = (f: number, i: number) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p]![0] <= heap[k]![0]) break; [heap[p], heap[k]] = [heap[k]!, heap[p]!]; k = p; } };
  const pop = () => { const top = heap[0]!, last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l; if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k]!, heap[m]!]; k = m; } } return top; };
  const s0 = (ay - y0) * W + (ax - x0), goal = (by - y0) * W + (bx - x0);
  g[s0] = 0; push(0, s0);
  while (heap.length) {
    const [, i] = pop(); if (done[i]) continue; done[i] = 1;
    if (i === goal) break;
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx; if (done[j]) continue;
      const ng = g[i]! + cost(nx + x0, ny + y0);
      if (ng < g[j]!) { g[j] = ng; from[j] = i; push(ng + Math.abs(nx + x0 - bx) + Math.abs(ny + y0 - by), j); }
    }
  }
  if (from[goal] === -1 && goal !== s0) return null;
  const rev: number[] = []; for (let i = goal; i !== -1; i = from[i]!) rev.push(i);
  const tiles: [number, number][] = [], water: boolean[] = [];
  let deep = 0;
  for (let k = rev.length - 1; k >= 0; k--) {
    const i = rev[k]!, x = (i % W) + x0, y = ((i / W) | 0) + y0, t = terrain(x, y);
    if (t === "deep") deep++;
    tiles.push([x, y]); water.push(isWater(t));
  }
  if (deep > 6) return null; // no roads across the open sea
  return { a, b, d, since: Math.max(Date.parse(a.created_at), Date.parse(b.created_at)) + ROAD_AT * 3.6e6, tiles, water };
}

/** 0..1 how much of the road exists. */
export const roadProgress = (l: Link, now: number) => Math.max(0, Math.min(1, (now - l.since) / (ROAD_BUILD * 3.6e6)));

function roadAt(x: number, y: number, seeds: Seed[], now: number) {
  links(seeds);
  const r = roadIdx.get(y * MAP + x);
  if (!r || now < r.link.since) return null;
  const n = r.link.tiles.length, half = n / 2;
  if (Math.min(r.i, n - 1 - r.i) > roadProgress(r.link, now) * half) return null;
  if (!r.link.water[r.i] && !buildable(terrain(x, y)) && terrain(x, y) !== "hill") return null;
  return { link: r.link, bridge: r.link.water[r.i]! };
}

/** Synergy bonus one neighbour gives: +10% .. +25%, more when closer and more mature. */
export function bonusOf(d: number, neighbourAgeH: number) {
  const close = Math.max(0, Math.min(1, (TRADE_DIST - d) / (TRADE_DIST - MIN_SEED_DISTANCE)));
  const mature = Math.min(1, neighbourAgeH / 480);
  return 0.1 + 0.15 * close * mature;
}

/** Current growth speed multiplier: 1 + sum of neighbour bonuses. */
export function speedOf(s: Seed, seeds: Seed[], now: number) {
  let sp = 1;
  for (const l of links(seeds)) {
    if (now < l.since || (l.a.id !== s.id && l.b.id !== s.id)) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    sp += bonusOf(l.d, ageHours(o, now)) * roadProgress(l, now);
  }
  return sp;
}

/** Effective age: real age plus bonus hours accumulated since each road was founded (monotonic, deterministic). */
export function effAge(s: Seed, seeds: Seed[], now: number) {
  let h = ageHours(s, now);
  const base = h;
  for (const l of links(seeds)) {
    if (now < l.since || (l.a.id !== s.id && l.b.id !== s.id)) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    h += bonusOf(l.d, ageHours(o, now)) * (now - l.since) / 3.6e6;
  }
  return Math.max(base, h);
}

/** Two towns whose outskirts touch become a twin town. */
export function isTwin(l: Link, seeds: Seed[], now: number) {
  return radiusOf(effAge(l.a, seeds, now)) + radiusOf(effAge(l.b, seeds, now)) >= l.d;
}

/** Rails unlock only when BOTH linked settlements enter the industrial era. */
export const railReady = (l: Link, seeds: Seed[], now: number) => stageOf(effAge(l.a,seeds,now)) >= 5 && stageOf(effAge(l.b,seeds,now)) >= 5;
