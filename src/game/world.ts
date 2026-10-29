import { cacheTick, worldHour, worldWeekday, type Realm } from "./time";
import { boonHours, type Decision } from "./encounters";
import { tileHits, canBurn } from "./disasters";
// Pure, deterministic world + town growth logic (shared by every player).
const ROAD_YIELDS: ReadonlySet<string> = new Set(["field", "garden", "pasture", "hay", "fence"]);
export const MAP = 1024;

export type Seed = { id: string; name: string; owner: string; x: number; y: number; hue: number; created_at: string; realm?: Realm; mayor_gender?: string | null; user_id?: string | null; blessed?: number[]; bought?: { item: string; at: number; x?: number | null; y?: number | null }[]; charter?: { path: CharterPath; at: number }; roads?: { target: string; at: number }[]; decisions?: Decision[]; votes?: { partner: string; pact: PactKind; at: number }[]; works?: { partner: string; work: WorkKind; cost: number; at: number }[]; sent?: { to: string; kind: "gift" | "aid" | "thanks"; at: number; id: string }[]; letters?: { to: string; at: number; id: string }[]; aid?: number[] };
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
/**
 * Traced rivers: each one starts at a spring in the highlands and walks downhill (with a gentle
 * meander) until it reaches the sea or joins another river. Rivers that never reach the sea are
 * discarded, so no river ever ends in the middle of a meadow. Stores, per tile, the distance to
 * the nearest river bank (negative = inside the water).
 */
let riverField: Float32Array | null = null;
let oceanMask: Uint8Array | null = null;
/** Low ground connected to the open sea (inland hollows stay dry land, never stagnant puddles). */
function ocean(): Uint8Array {
  if (oceanMask) return oceanMask;
  const m = new Uint8Array(MAP * MAP), st: number[] = [];
  for (let i = 0; i < MAP; i++) for (const k of [i, (MAP - 1) * MAP + i, i * MAP, i * MAP + MAP - 1]) if (!m[k]) { m[k] = 1; st.push(k); }
  while (st.length) {
    const k = st.pop()!, x = k % MAP, y = (k / MAP) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MAP || ny >= MAP) continue;
      const nk = ny * MAP + nx; if (!m[nk] && heightAt(nx, ny) < 0.35) { m[nk] = 1; st.push(nk); }
    }
  }
  return (oceanMask = m);
}
function rivers(): Float32Array {
  if (riverField) return riverField;
  const sea = ocean();
  const f = new Float32Array(MAP * MAP).fill(99);
  const owner = new Int32Array(MAP * MAP).fill(-1);
  let id = 0;
  for (let gy = 40; gy < MAP - 40; gy += 44) for (let gx = 40; gx < MAP - 40; gx += 44) {
    const sx = gx + Math.floor((hash(gx, gy, 61) - 0.5) * 40), sy = gy + Math.floor((hash(gx, gy, 62) - 0.5) * 40);
    const h0 = heightAt(sx, sy);
    if (h0 < 0.56 || h0 > 0.79 || hash(gx, gy, 63) > 0.7) continue;
    const me = id++;
    const path: [number, number][] = [[sx, sy]];
    const seen = new Set<number>([sy * MAP + sx]);
    let x = sx, y = sy, ok = false, pdx = 0, pdy = 0;
    for (let step = 0; step < 5000; step++) {
      let best = Infinity, bx = x, by = y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (nx < 1 || ny < 1 || nx >= MAP - 1 || ny >= MAP - 1 || seen.has(ny * MAP + nx)) continue;
        const v = heightAt(nx, ny) + (vnoise(nx / 9, ny / 9, 64 + me) - 0.5) * 0.02 - (dx * pdx + dy * pdy) * 0.004;
        if (v < best) { best = v; bx = nx; by = ny; }
      }
      if (best === Infinity) break;
      pdx = bx - x; pdy = by - y; x = bx; y = by;
      seen.add(y * MAP + x); path.push([x, y]);
      if (sea[y * MAP + x]) { ok = true; break; }
      const o = owner[y * MAP + x]!;
      if (o >= 0 && o !== me) { ok = true; break; } // confluence
    }
    if (!ok || path.length < 25) continue;
    // smooth the grid walk into a flowing curve, then let it swing in gentle meanders
    const W = 5, sm: [number, number][] = [];
    for (let i = 0; i < path.length; i++) {
      let ax = 0, ay = 0, n = 0;
      for (let j = Math.max(0, i - W); j <= Math.min(path.length - 1, i + W); j++) { ax += path[j]![0]; ay += path[j]![1]; n++; }
      sm.push([ax / n, ay / n]);
    }
    const cur: [number, number][] = [];
    for (let i = 0; i < sm.length; i++) {
      const a = sm[Math.max(0, i - 3)]!, b = sm[Math.min(sm.length - 1, i + 3)]!;
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const ramp = Math.min(1, i / 30, (sm.length - 1 - i) / 15);
      const off = (vnoise(i / 26, me * 3.1, 66) - 0.5) * 9 * ramp;
      cur.push([sm[i]![0] - ty * off, sm[i]![1] + tx * off]);
    }
    cur.push(...path.slice(-3).map(([a, b]) => [a, b] as [number, number])); // reach the actual mouth / junction
    // stamp densely along the curve: a brook at the spring, widening towards the mouth
    for (let i = 0; i + 1 < cur.length; i++) {
      const [ax, ay] = cur[i]!, [bx, by] = cur[i + 1]!;
      const seg = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 3));
      const rw = Math.min(2.8, 1.1 + i * 0.006);
      for (let s = 0; s < seg; s++) {
        const px = ax + (bx - ax) * (s / seg), py = ay + (by - ay) * (s / seg);
        const R = Math.ceil(rw + 4), ix = Math.round(px), iy = Math.round(py);
        for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++) {
          const qx = ix + ox, qy = iy + oy; if (qx < 0 || qy < 0 || qx >= MAP || qy >= MAP) continue;
          const d = Math.hypot(qx - px, qy - py) - rw, k = qy * MAP + qx;
          if (d < f[k]!) f[k] = d;
          if (d < 0) owner[k] = me;
        }
      }
    }
  }
  return (riverField = f);
}
/** Distance (tiles) from the nearest river bank; negative inside a river. */
export const riverDistAt = (x: number, y: number) => rivers()[y * MAP + x]!;
export function terrain(x: number, y: number): Terrain {
  if (x < 0 || y < 0 || x >= MAP || y >= MAP) return "deep";
  const k = y * MAP + x;
  const c = tcache[k]!;
  if (c) return TLIST[c - 1]!;
  const rv = rivers()[k]!;
  let h = heightAt(x, y);
  if (h < 0.35 && !ocean()[k]) h = 0.38;
  let t: Terrain;
  if (h < 0.3) t = "deep";
  else if (h < 0.35 || rv < 0) t = "water";
  else if (h < 0.375 || (rv < 0.8 && h < 0.7)) t = "sand";
  else if (h > 0.8) t = "mountain";
  else if (h > 0.68) t = "hill";
  else if (rv < 3.5 && h < 0.55) t = "fertile";
  else if (fbm(x / 25, y / 25, 5) > 0.58) t = "forest";
  else if (fbm(x / 18, y / 18, 7) > 0.6) t = "meadow";
  else t = "grass";
  tcache[k] = TLIST.indexOf(t) + 1;
  return t;
}
export const buildable = (t: Terrain) => t === "grass" || t === "meadow" || t === "fertile" || t === "forest" || t === "sand" || t === "hill";
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

/** Coastal towns fan inland: unit vector away from water plus a stretch that compensates lost sea area. Pure, cached. */
const shapeCache = new Map<string, { ux: number; uy: number; k: number }>();
export function landShape(s: { id: string; x: number; y: number }) {
  const ck = `${s.id}|${s.x}|${s.y}`;
  const hit = shapeCache.get(ck); if (hit) return hit;
  let land = 0, tot = 0, vx = 0, vy = 0;
  const R = 16;
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
    const d = Math.hypot(i, j); if (d > R || d < 1) continue;
    tot++;
    if (buildable(terrain(Math.round(s.x) + i, Math.round(s.y) + j))) { land++; vx += i / d; vy += j / d; }
  }
  const f = tot ? land / tot : 1, m = Math.hypot(vx, vy);
  const out = m > 1e-6 && f < 0.9 ? { ux: vx / m, uy: vy / m, k: Math.min(2.8, 1 + (0.9 - f) * 3.6) } : { ux: 1, uy: 0, k: 1 };
  shapeCache.set(ck, out);
  return out;
}
/** Town-space distance: tiles landward count as closer, so a harbour town reaches k× deeper inland. */
export function townDist(x: number, y: number, s: { id: string; x: number; y: number }): number {
  const { ux, uy, k } = landShape(s);
  const dx = x - s.x, dy = y - s.y;
  if (k === 1) return Math.hypot(dx, dy);
  let p = dx * ux + dy * uy; const q = -dx * uy + dy * ux;
  if (p > 0) p /= k;
  return Math.hypot(p, q);
}
/** Max real-tile reach of a town with town-space radius r (for bounding boxes). */
export const reachOf = (s: { id: string; x: number; y: number }, r: number) => r * landShape(s).k;
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
  | "stall" | "townhall" | "gatehouse" | "manufactory" | "steamworks" | "station" | "suburb" | "rail" | "avenue"
  | "patrician" | "villa" | "tenement" | "townhouse2" | "fachwerk" | "steinhaus" | "handwerker"
  | "fishery" | "granary" | "infirmary" | "school" | "markethall" | "guildhall" | "library" | "dairy" | "firehouse" | "guardhouse" | "lodge" | "herbhut" | "woodcamp";
/** build < 1: still a construction site (0 = staked out, 1 = finished). */
export type Structure = { kind: Kind; seed: Seed; v: number; build?: number; fire?: boolean; flood?: boolean };
/** Construction time (in growth hours) before a building at birth age `at` is finished. */
export const buildTime = (at: number) => Math.min(96, Math.max(1.5, at * 0.06));
let buildP = 1;
/** Homes that may be mirrored so their front turns toward the street (pure, all clients agree). */
export const MIRROR_KINDS: ReadonlySet<Kind> = new Set(["hut", "farmhouse", "cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement", "suburb", "barn", "workshop", "stall", "coop"]);
/**
 * Sprites face the lower-left (+y). A street only on the lower-right (+x) mirrors the house;
 * without a clear street side, a stable hash breaks the clone pattern.
 */
export function faceFlip(kind: Kind, x: number, y: number, isRoad: (x: number, y: number) => boolean): boolean {
  if (!MIRROR_KINDS.has(kind)) return false;
  const px = isRoad(x + 1, y), py = isRoad(x, y + 1);
  if (px !== py) return px;
  return hash(x, y, 91) < 0.5;
}
export const FLAT: ReadonlySet<Kind> = new Set(["path", "street", "square", "field", "pasture", "garden", "market", "road", "bridge", "rail", "avenue"]);
const CORE: Record<string, Kind> = { "1,0": "hut", "0,1": "hut", "1,1": "campfire", "-1,0": "garden", "-1,1": "field", "0,-1": "garden" };
export const LANDMARKS: { dx: number; dy: number; at: number; kind: Kind }[] = [
  { dx: 2, dy: -1, at: 30, kind: "coop" }, { dx: -2, dy: 1, at: 48, kind: "barn" },
  { dx: 2, dy: -2, at: 180, kind: "chapel" }, { dx: -3, dy: -3, at: 240, kind: "watermill" },
  { dx: 3, dy: 1, at: 280, kind: "inn" }, { dx: -2, dy: 2, at: 360, kind: "bakery" },
  { dx: 0, dy: -3, at: 2160, kind: "stall" }, { dx: 4, dy: -1, at: 2300, kind: "smithy" },
  { dx: -4, dy: 1, at: 2500, kind: "warehouse" },
  { dx: 3, dy: -4, at: 4380, kind: "townhall" }, { dx: 2, dy: -2, at: 4500, kind: "church" },
  { dx: 8, dy: 6, at: 8760, kind: "manufactory" }, { dx: -7, dy: -6, at: 9200, kind: "steamworks" },
  { dx: -9, dy: 5, at: 10000, kind: "station" }, { dx: 5, dy: 2, at: 7000, kind: "factory" },
  { dx: 12, dy: 3, at: 14500, kind: "sawmill" },
];
const lmCache = new Map<string, Map<string, number[]>>();
/**
 * Landmarks keep their nominal offset when the ground is dry; otherwise they move to the nearest
 * buildable tile (pure function of seed position), so coastal and mountain towns get them too.
 */
function landmarkSpots(s: Seed): Map<string, number[]> {
  const ck = `${s.id}:${s.x}:${s.y}`; const hit = lmCache.get(ck); if (hit) return hit;
  const out = new Map<string, number[]>(), used = new Set<string>(Object.keys(CORE)); used.add("0,0");
  const ok = (dx: number, dy: number) => !used.has(`${dx},${dy}`) && buildable(terrain(s.x + dx, s.y + dy)) && Math.hypot(dx, dy) >= 1.6;
  // the same nominal tile can host successive landmarks (chapel -> church): share its relocation
  const moved = new Map<string, string>();
  LANDMARKS.forEach((l, i) => {
    const nom = `${l.dx},${l.dy}`;
    let key = moved.get(nom);
    if (!key) {
      key = nom;
      if (!ok(l.dx, l.dy)) {
        let best = "", bs = Infinity;
        for (let j = -6; j <= 6; j++) for (let k = -6; k <= 6; k++) {
          const dx = l.dx + k, dy = l.dy + j; if (!ok(dx, dy)) continue;
          const sc = Math.hypot(k, j) + Math.hypot(dx, dy) * 0.15; if (sc < bs) { bs = sc; best = `${dx},${dy}`; }
        }
        if (best) key = best;
      }
      moved.set(nom, key); used.add(key);
    }
    const a = out.get(key) ?? []; a.push(i); out.set(key, a);
  });
  if (lmCache.size > 200) lmCache.clear();
  lmCache.set(ck, out); return out;
}
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

/**
 * Farmland is laid out in large acres (several tiles each) per village, so one field is far bigger than
 * a house. Pure function of seed + tile: every client sees identical parcels.
 */
export function acreOf(x: number, y: number, s: Seed) {
  const n = seedNum(s), W = 4 + Math.floor(hash(n, 1, 91) * 3), H = 3 + Math.floor(hash(n, 2, 91) * 3);
  const ox = Math.floor(hash(n, 3, 91) * W), oy = Math.floor(hash(n, 4, 91) * H);
  // stagger alternate rows so acre borders do not line up into one grid
  const by = Math.floor((y + oy) / H), sh = (by & 1) ? Math.floor(W / 2) : 0;
  const bx = Math.floor((x + ox + sh) / W);
  const h = hash(bx * 7 + n, by * 13, 92);
  return { id: bx * 100003 + by, h, ripe: hash(bx, by + n, 93) > 0.45, along: hash(bx, by + n, 94) > 0.5, corner: (x + ox + sh) % W === 0 && (y + oy) % H === 0 };
}

function pathAt(x: number, y: number, s: Seed, age: number, r: number): boolean {
  const dx = x - s.x, dy = y - s.y, d = townDist(x, y, s);
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
  const R = Math.ceil(reachOf(s, r) + 1), cx = Math.round(s.x), cy = Math.round(s.y);
  const paths = new Set<number>(), anchor = new Set<number>();
  for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
    if (x < 0 || y < 0 || x >= MAP || y >= MAP || !buildable(terrain(x, y))) continue;
    const d = townDist(x, y, s);
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
      // an end tile: its path neighbours all touch each other, so removing it cuts nothing
      const ns = nbrs(k).filter((n) => paths.has(n));
      const seen = new Set<number>(ns.slice(0, 1)), st = ns.slice(0, 1);
      while (st.length) { const a = st.pop()!; for (const b of ns) if (!seen.has(b) && Math.abs((a % MAP) - (b % MAP)) <= 1 && Math.abs(((a / MAP) | 0) - ((b / MAP) | 0)) <= 1) { seen.add(b); st.push(b); } }
      if (seen.size === ns.length) { paths.delete(k); changed = true; }
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
  const here = landmarkSpots(s).get(`${dx},${dy}`) ?? [];
  for (let n = here.length - 1; n >= 0; n--) {
    const l = LANDMARKS[here[n]!]; if (!l) continue;
    if (age < l.at - buildTime(l.at)) continue;
    if (age < l.at) buildP = 1 - (l.at - age) / buildTime(l.at);
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
  if (age < birth - buildTime(birth)) return null;
  if (age < birth) buildP = 1 - (birth - age) / buildTime(birth);
  let near = false;
  for (let j=-1;j<=1 && !near;j++) for (let i=-1;i<=1;i++) if ((i||j) && pathAt(x+i,y+j,s,age,r)) { near=true; break; }
  const h = hash(x,y,4);
  if (!near) {
    if (stage >= 4 && d < r * 0.5) return h < 0.45 ? "garden" : null;
    const a = acreOf(x, y, s);
    if (a.corner && h > 0.6) return weighted(h, [["hay",40],["coop",30],["fence",30]]);
    // slopes carry no ploughland: kitchen gardens and goat pastures instead of crop rows
    if (terrain(x, y) === "hill") return weighted(a.h, [["pasture",45],["garden",35],["fence",20]]);
    return weighted(a.h, [["field",72],["pasture",22],["garden",6]]);
  }
  if (hash(x,y,2)>0.82) return h<0.5?"garden":null;
  if (stage <= 1) return weighted(h,[["farmhouse",50],["barn",25],["garden",15],["coop",10]]);
  if (stage === 2) return weighted(h,[["cottage",40],["handwerker",20],["farmhouse",15],["barn",10],["garden",15]]);
  // Stable sectors form residential, craft and market districts.
  const sector = ((Math.atan2(dy,dx) + Math.PI + hash(seedNum(s),1,81)*2) % (2*Math.PI))/(2*Math.PI);
  if (stage === 3) return weighted(h,[["townhouse",20],["townhouse2",16],["fachwerk",16],["handwerker",10],["workshop",18],["cottage",10],["stall",10]]);
  // Districts: patrician core, workers' quarter by the crafts sector, villas on the quiet green edge.
  if (d < r * 0.4) return weighted(h,[["patrician",22],["steinhaus",18],["suburb",8],["townhouse",14],["townhouse2",14],["fachwerk",8],["workshop",6],["stall",8],["garden",4]]);
  if (sector < 0.4) {
    if (h < 0.35) return "tenement";
    const g = hash(x,y,6);
    return stage >= 5 ? weighted(g,[["manufactory",25],["steamworks",8],["warehouse",25],["workshop",42]]) : weighted(g,[["workshop",65],["smithy",15],["warehouse",20]]);
  }
  if (sector < 0.5) return weighted(h,[["tenement",40],["handwerker",18],["fachwerk",14],["townhouse",10],["townhouse2",8],["stall",10]]);
  if (d > r * 0.7 && sector > 0.55) return weighted(h,[["villa",55],["garden",25],["cottage",20]]);
  return weighted(h,[["townhouse",18],["townhouse2",18],["fachwerk",18],["steinhaus",8],["stall",12],["cottage",10],["handwerker",6],["patrician",4],["garden",6]]);
}

/** Player-bought buildings: the shop item → building kind, built over SPECIAL_BUILD real ms after purchase. */
export const SPECIAL_KIND: Record<string, Kind> = { fisher: "fishery", granary: "granary", healer: "infirmary", school: "school", markethall: "markethall", guildhall: "guildhall", library: "library", dairy: "dairy", firehouse: "firehouse", guard: "guardhouse", hunter: "lodge", herbs: "herbhut", woodcamp: "woodcamp" };
/** Craft charter halves the construction time of bought buildings. */
/** Craft charter halves, a woodcutter's camp (ready timber) shortens build time by a quarter — both pure from purchases. */
export const WOODCAMP_BUILD = 0.75;
/** Timber at hand: forest within reach of the founding tile shortens bought builds (pure from terrain). */
export const TIMBER_BUILD = 0.85;
const timberC = new Map<string, boolean>();
export function timberNear(s: Seed): boolean {
  const k = `${s.x},${s.y}`; const hit = timberC.get(k); if (hit !== undefined) return hit;
  let ok = false;
  for (let j = -12; j <= 12 && !ok; j++) for (let i = -12; i <= 12; i++) if (i * i + j * j <= 144 && terrain(s.x + i, s.y + j) === "forest") { ok = true; break; }
  if (timberC.size > 500) timberC.clear();
  timberC.set(k, ok); return ok;
}
export const specialBuild = (s: Seed) => (s.charter?.path === "craft" ? SPECIAL_BUILD / 2 : SPECIAL_BUILD) * ((s.bought ?? []).some((b) => b.item === "woodcamp") ? WOODCAMP_BUILD : 1) * (timberNear(s) ? TIMBER_BUILD : 1);
/** Farm charter: +5 % growth from the day it was sealed. */
export const FARM_BONUS = 0.05;
export const SPECIAL_BUILD = 6 * 3600000;
const CORE_SPOTS = new Set([...Object.keys(CORE), ...LANDMARKS.map((l) => `${l.dx},${l.dy}`), "0,0"]);
const siteCache = new Map<string, Map<number, { kind: Kind; at: number }>>();
/**
 * Where each bought building stands: a pure function of the seed and its purchases. The fishery
 * looks for the shore, the healer for the forest edge, the school for the village core, the granary for the fields.
 */
export function specialSites(s: Seed): Map<number, { kind: Kind; at: number }> {
  const items = (s.bought ?? []).filter((b) => SPECIAL_KIND[b.item]);
  const key = `${s.id}:${s.x}:${s.y}:${items.map((b) => `${b.item}${b.at}@${b.x ?? ""},${b.y ?? ""}`).join(",")}`;
  const hit = siteCache.get(key); if (hit) return hit;
  const out = new Map<number, { kind: Kind; at: number }>();
  const seen = new Set<string>();
  for (const b of [...items].sort((a, c) => a.at - c.at)) {
    if (seen.has(b.item)) continue; seen.add(b.item);
    const kind = SPECIAL_KIND[b.item]!;
    // the player chose the spot in the build preview
    if (b.x != null && b.y != null && !out.has(b.y * MAP + b.x)) { out.set(b.y * MAP + b.x, { kind, at: b.at }); continue; }
    let best = -1, bs = Infinity;
    for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) {
      const x = s.x + dx, y = s.y + dy, d = Math.hypot(dx, dy), k = y * MAP + x;
      if (d < 2.4 || d > 9 || out.has(k) || CORE_SPOTS.has(`${dx},${dy}`)) continue;
      if (!buildable(terrain(x, y)) || terrain(x, y) === "forest" || pathAt(x, y, s, 20000, 10)) continue;
      let water = 0, forest = 0;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const t = terrain(x + i, y + j); if (isWater(t)) water++; else if (t === "forest") forest++; }
      let sc = d + hash(x, y, 777) * 1.5;
      if (kind === "fishery") sc += water ? -12 - Math.min(water, 6) : 0;
      if (kind === "lodge" || kind === "woodcamp" || kind === "herbhut") sc += forest ? -6 - Math.min(forest, 6) * 0.6 : 0;
      if (kind === "infirmary") sc += forest ? -4 - Math.min(forest, 5) * 0.5 : 0;
      if (kind === "school" || kind === "guardhouse") sc -= d < 5 ? 2 : 0;
      if (kind === "firehouse") sc += water ? -3 : 0;
      if (kind === "granary") sc += Math.abs(d - 6);
      if (sc < bs) { bs = sc; best = k; }
    }
    if (best >= 0) out.set(best, { kind, at: b.at });
  }
  if (siteCache.size > 200) siteCache.clear();
  siteCache.set(key, out);
  return out;
}
/** Cache key that changes whenever seed positions, ages or purchases change. */
const skMemo = new WeakMap<Seed[], string>();
export const seedsKey = (seeds: Seed[]) => { let k = skMemo.get(seeds); if (k === undefined) { k = seedsKeyRaw(seeds); skMemo.set(seeds, k); } return k; };
const seedsKeyRaw = (seeds: Seed[]) => seeds.map((s) => `${s.id}:${s.x}:${s.y}:${s.created_at}:${(s.bought ?? []).map((b) => `${b.x ?? ""}.${b.y ?? ""}`).join("/")}:${s.charter?.path ?? ""}:${s.firstRoad?.target ?? ""}:${(s.works ?? []).length}`).join(";");

/** Growth hour at which the building on this tile is finished (0 for the founding core). */
export function bornAt(x: number, y: number, s: Seed): number {
  const dx = x - s.x, dy = y - s.y;
  if (CORE[`${dx},${dy}`] || (!dx && !dy)) return 0;
  const here = landmarkSpots(s).get(`${dx},${dy}`);
  if (here?.length) return LANDMARKS[here[here.length - 1]!]!.at;
  return tileBirth(Math.hypot(dx, dy)) * (0.75 + 0.5 * hash(x, y, 3));
}

let cacheKey = "";
const scache = new Map<number, Structure | null>();
export function structureAt(x: number, y: number, seeds: Seed[], now: number): Structure | null {
  const key = `${cacheTick(now)}|${seedsKey(seeds)}`;
  if (key !== cacheKey) { cacheKey = key; scache.clear(); }
  const ck = y * MAP + x;
  const c = scache.get(ck);
  if (c !== undefined) return c;
  let best: Structure | null = null;
  const tw = twinSites(seeds, now).get(ck);
  if (tw) { best = { kind: tw.kind, seed: tw.seed, v: hash(x, y, 5) }; scache.set(ck, best); return best; }
  for (const s of seeds) {
    if (!s.bought?.length) continue;
    const sp = specialSites(s).get(ck);
    if (!sp || now < sp.at) continue;
    const p = (now - sp.at) / specialBuild(s);
    best = { kind: sp.kind, seed: s, v: hash(x, y, 5), ...(p < 1 ? { build: p } : {}) };
    scache.set(ck, best);
    return best;
  }
  if (buildable(terrain(x, y))) {
    let bestD = Infinity;
    for (const s of seeds) {
      const d = townDist(x, y, s);
      const age = effAge(s, seeds, now);
      const r = radiusOf(age);
      if (d > r + 0.5 || d >= bestD) continue;
      buildP = 1;
      const k = forSeed(x, y, s, age, r, d);
      if (k && buildP < 1 && (FLAT.has(k) || k === "hay" || k === "fence")) continue;
      if (k) { best = { kind: k, seed: s, v: hash(x, y, 5), ...(buildP < 1 ? { build: Math.max(0, buildP) } : {}) }; bestD = d; }
    }
  }
  // trade roads keep their corridor: fields, gardens and pastures grow around them, never over them
  if (best && ROAD_YIELDS.has(best.kind)) {
    const rd = roadAt(x, y, seeds, now);
    if (rd) best = { kind: rd.bridge ? "bridge" : isTwin(rd.link, seeds, now) ? "street" : "road", seed: rd.link.a, v: hash(x, y, 5) };
  }
  if (best && best.build === undefined) {
    const hit = tileHits(best.seed, now).get(ck);
    if (hit?.flood) best = { ...best, flood: true };
    if (hit && canBurn(best.kind)) {
      if (hit.fire) best = { ...best, fire: true };
      else if (hit.build !== undefined) best = { ...best, build: hit.build };
    }
  }
  if (!best) {
    const rd = roadAt(x, y, seeds, now);
    if (rd) best = { kind: rd.bridge ? "bridge" : isTwin(rd.link, seeds, now) ? "street" : "road", seed: rd.link.a, v: hash(x, y, 5) };
  }
  scache.set(ck, best);
  return best;
}

export function townStats(s: Seed, seeds: Seed[], now: number) {
  const age = effAge(s, seeds, now);
  const r = radiusOf(age), R = reachOf(s, r);
  let buildings = 0;
  for (let y = Math.floor(s.y - R); y <= s.y + R; y++)
    for (let x = Math.floor(s.x - R); x <= s.x + R; x++) {
      const st = structureAt(x, y, seeds, now);
      if (st && st.seed.id === s.id && st.build === undefined && !FLAT.has(st.kind) && st.kind !== "well" && st.kind !== "hay") buildings++;
    }
  const twins = links(seeds).filter((l) => (l.a.id === s.id || l.b.id === s.id) && isTwin(l, seeds, now)).map((l) => (l.a.id === s.id ? l.b : l.a).name);
  return { age, radius: r, buildings, stage: STAGES[stageOf(age)]!.name, speed: speedOf(s, seeds, now), twins };
}

export const MIN_SEED_DISTANCE = 40;
/** Returns an error code ("hill" | "water" | "near:<name>") or null; UI translates it. */
export function canPlant(x: number, y: number, seeds: Seed[]): string | null {
  const tt = terrain(x, y);
  if (isWater(tt)) return "water";
  if (tt === "mountain") return "hill";
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
  const key = seeds.map((s) => `${s.id}:${s.x}:${s.y}:${s.created_at}:${s.firstRoad?.target ?? ""}:${s.firstRoad?.at ?? ""}`).join("|");
  if (key === linkKey) return linkCache;
  linkKey = key; linkCache = []; roadIdx.clear();
  for (let i = 0; i < seeds.length; i++) for (let j = i + 1; j < seeds.length; j++) {
    const a = seeds[i]!, b = seeds[j]!;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d > TRADE_DIST) continue;
    const gate = roadGate(a, b);
    if (gate === null) continue;
    const l = buildLink(a, b, d);
    if (l) { l.since = Math.max(l.since, gate); linkCache.push(l); }
  }
  for (const l of linkCache) l.tiles.forEach(([x, y], i) => { const k = y * MAP + x; if (!roadIdx.has(k)) roadIdx.set(k, { link: l, i }); });
  return linkCache;
}

/**
 * Every road touching a player village must be decided by one of the two mayors; it starts at the
 * earliest decision. Roads between two unowned sample villages open by themselves.
 * Returns the start time, or null when no road has been decided.
 */
export function roadGate(a: Seed, b: Seed): number | null {
  if (!a.user_id && !b.user_id) return -Infinity;
  let t = Infinity;
  for (const r of a.roads ?? []) if (r.target === b.id) t = Math.min(t, r.at);
  for (const r of b.roads ?? []) if (r.target === a.id) t = Math.min(t, r.at);
  return t === Infinity ? null : t;
}
/** Neighbours a village may still decide a road to (in reach, not yet connected). */
export const roadCandidates = (s: Seed, seeds: Seed[]) =>
  seeds.filter((o) => o.id !== s.id && Math.hypot(o.x - s.x, o.y - s.y) <= TRADE_DIST && roadGate(s, o) === null)
    .sort((p, q) => Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y));
/** The road this village decided that is still being built (only one at a time), or null. */
export function roadBuilding(s: Seed, now: number): { target: string; at: number; done: number } | null {
  const r = (s.roads ?? []).filter((x) => x.at <= now && now < x.at + ROAD_BUILD * 3.6e6).sort((a, b) => b.at - a.at)[0];
  return r ? { ...r, done: r.at + ROAD_BUILD * 3.6e6 } : null;
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
  if (!r.link.water[r.i] && !buildable(terrain(x, y))) return null;
  return { link: r.link, bridge: r.link.water[r.i]! };
}

/** Synergy bonus one neighbour gives: +10% .. +25%, more when closer and more mature. */
export function bonusOf(d: number, neighbourAgeH: number) {
  const close = Math.max(0, Math.min(1, (TRADE_DIST - d) / (TRADE_DIST - MIN_SEED_DISTANCE)));
  const mature = Math.min(1, neighbourAgeH / 480);
  return 0.1 + 0.15 * close * mature;
}

// ---------------- complementary trade ----------------
export type TradeGood = "grain" | "wool" | "wood" | "ore" | "stone" | "fish" | "salt" | "hides" | "cloth" | "ironware" | "beer" | "timber";
export const TRADE_TABLE: Record<Character, { exports: TradeGood[]; imports: TradeGood[]; refined: TradeGood }> = {
  plains: { exports: ["grain", "wool"], imports: ["wood", "ore"], refined: "cloth" },
  mountain: { exports: ["stone", "ore"], imports: ["grain", "fish"], refined: "ironware" },
  coast: { exports: ["fish", "salt"], imports: ["wood", "grain"], refined: "beer" },
  forest: { exports: ["wood", "hides"], imports: ["salt", "stone"], refined: "timber" },
};
/** Raw exports/imports from geography; refined goods join the exports from the Kleinstadt era on (real age). */
export function tradeProfile(s: Seed, now: number) {
  const row = TRADE_TABLE[characterOf(s.x, s.y)];
  const exports = stageOf(ageHours(s, now)) >= 3 ? [...row.exports, row.refined] : [...row.exports];
  return { exports, imports: [...row.imports] };
}
/** How many raw goods each town supplies that the other lacks (0..4). */
export function matches(a: Seed, b: Seed) {
  const A = TRADE_TABLE[characterOf(a.x, a.y)], B = TRADE_TABLE[characterOf(b.x, b.y)];
  return A.exports.filter((g) => B.imports.includes(g)).length + B.exports.filter((g) => A.imports.includes(g)).length;
}
export const COMPLEMENT_MIN = 0.6, COMPLEMENT_MAX = 1.5, KONTOR_BONUS = 0.15;
/** 0.6 for twins in character, rising to 1.5 for a perfect fit. */
export const complement = (a: Seed, b: Seed) => COMPLEMENT_MIN + (COMPLEMENT_MAX - COMPLEMENT_MIN) * Math.min(4, matches(a, b)) / 4;
/** Trade factor town `s` gets from a road to `o`: complement, +15 % with a Hansekontor era (Handelsstadt+, real age); trade charter lifts the cap. */
export function tradeFactor(s: Seed, o: Seed, now: number) {
  let f = complement(s, o);
  if (stageOf(ageHours(s, now)) >= 4) f += KONTOR_BONUS;
  const cap = s.charter?.path === "trade" && now > s.charter.at ? 1.75 : COMPLEMENT_MAX;
  return Math.min(cap, f);
}

/** Growth bonuses split by source (fractions, e.g. 0.1 = +10 %). */
export function speedParts(s: Seed, seeds: Seed[], now: number) {
  const bless = isBlessed(s, now) ? BLESS_BONUS : 0;
  const farm = s.charter?.path === "farm" && now > s.charter.at ? FARM_BONUS : 0;
  let trade = 0;
  for (const l of links(seeds)) {
    if (now < l.since || (l.a.id !== s.id && l.b.id !== s.id)) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    trade += bonusOf(l.d, ageHours(o, now)) * tradeFactor(s, o, now) * roadProgress(l, now);
    if (roadProgress(l, now) >= 1 && marketHours(now)) trade += MARKET_BONUS;
  }
  return { bless, farm, trade };
}
/** Current growth speed multiplier: 1 + sum of all bonuses. */
export function speedOf(s: Seed, seeds: Seed[], now: number) {
  const p = speedParts(s, seeds, now);
  return 1 + p.bless + p.farm + p.trade;
}

/** Effective age: real age plus bonus hours accumulated since each road was founded (monotonic, deterministic). */
const ageMemo = new WeakMap<Seed[], { now: number; m: Map<string, number> }>();
export function effAge(s: Seed, seeds: Seed[], now: number) {
  let c = ageMemo.get(seeds);
  if (!c || c.now !== now) { c = { now, m: new Map() }; ageMemo.set(seeds, c); }
  let v = c.m.get(s.id);
  if (v === undefined) { v = effAgeBase(s, seeds, now) + twinHours(s, seeds, now) * GROWTH_PACE; c.m.set(s.id, v); }
  return v;
}
function effAgeBase(s: Seed, seeds: Seed[], now: number) {
  let h = ageHours(s, now) + blessHours(s, now) + boonHours(s.decisions ?? [], now);
  if (s.charter?.path === "farm" && now > s.charter.at) h += (now - s.charter.at) / 3.6e6 * FARM_BONUS;
  const base = h;
  for (const l of links(seeds)) {
    if (now < l.since || (l.a.id !== s.id && l.b.id !== s.id)) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    h += bonusOf(l.d, ageHours(o, now)) * tradeFactor(s, o, now) * (now - l.since) / 3.6e6;
    // Saturday markets: 8 of 168 hours a week at MARKET_BONUS, spread evenly so growth stays smooth
    h += MARKET_BONUS * (8 / 168) * (now - l.since) / 3.6e6;
  }
  // neighbour bonuses speed growth, but never more than TRADE_CAP of the town's own age
  return (base + Math.min(Math.max(0, h - base), base * TRADE_CAP) + mentorHours(s, seeds, now)) * GROWTH_PACE;
}
export const TRADE_CAP = 0.35;
/** Global pace: a town with typical neighbours reaches Metropole after ~2 real years. */
export const GROWTH_PACE = 0.35;

/** Mentor: a young town linked to a clearly older town grows MENTOR_RATE faster during its first MENTOR_SPAN hours. */
export const MENTOR_RATE = 0.5, MENTOR_SPAN = 365 * 24, MENTOR_GAP = 30 * 24 * 3.6e6;
export function mentorOf(s: Seed, seeds: Seed[], now: number): Seed | undefined {
  const born = Date.parse(s.created_at);
  let best: Seed | undefined, since = Infinity;
  for (const l of links(seeds)) {
    if (now < l.since || (l.a.id !== s.id && l.b.id !== s.id)) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    if (born - Date.parse(o.created_at) < MENTOR_GAP) continue;
    if (l.since < since) { since = l.since; best = o; }
  }
  return best;
}
function mentorHours(s: Seed, seeds: Seed[], now: number) {
  const born = Date.parse(s.created_at);
  let since = Infinity;
  for (const l of links(seeds)) {
    if (now < l.since || (l.a.id !== s.id && l.b.id !== s.id)) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    if (born - Date.parse(o.created_at) >= MENTOR_GAP) since = Math.min(since, l.since);
  }
  if (since === Infinity) return 0;
  const end = Math.min(now, born + MENTOR_SPAN * 3.6e6), start = Math.max(since, born);
  return Math.max(0, end - start) / 3.6e6 * MENTOR_RATE;
}
/** True while the mentor bonus is active for s. */
export const mentoring = (s: Seed, seeds: Seed[], now: number) =>
  now < Date.parse(s.created_at) + MENTOR_SPAN * 3.6e6 && mentorHours(s, seeds, now) > 0;

/** Trade partners of a town with the goods flowing each way. */
export function tradePartners(s: Seed, seeds: Seed[], now: number) {
  const mine = tradeProfile(s, now);
  return links(seeds).filter((l) => now >= l.since && (l.a.id === s.id || l.b.id === s.id)).map((l) => {
    const o = l.a.id === s.id ? l.b : l.a, theirs = tradeProfile(o, now);
    return {
      seed: o, factor: tradeFactor(s, o, now), bonus: bonusOf(l.d, ageHours(o, now)) * tradeFactor(s, o, now),
      buy: theirs.exports.filter((g) => mine.imports.includes(g)), sell: mine.exports.filter((g) => theirs.imports.includes(g)),
    };
  });
}
/** Imports nobody delivers yet, with the nearest town (any distance) that could. */
export function tradeHints(s: Seed, seeds: Seed[], now: number) {
  const got = new Set(tradePartners(s, seeds, now).flatMap((p) => p.buy));
  return tradeProfile(s, now).imports.filter((g) => !got.has(g)).map((g) => {
    const o = seeds.filter((x) => x.id !== s.id && TRADE_TABLE[characterOf(x.x, x.y)].exports.includes(g))
      .sort((p, q) => Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y))[0];
    return { good: g, from: o ?? null };
  });
}

// ---------------- twin towns ----------------
export type PactKind = "trade" | "shield" | "culture";
export const PACTS: PactKind[] = ["trade", "shield", "culture"];
export type WorkKind = "bridge" | "hall" | "tower";
/** Each side pays this half (Taler); mirrors the database guard. */
export const TWIN_WORKS: Record<WorkKind, number> = { bridge: 200, hall: 300, tower: 250 };
export const TWIN_BONUS = 0.1, PACT_WAIT = 7 * 864e5, WORK_BUILD = 48 * 3.6e6, WORK_BONUS = 0.05;
export const PACT_GROWTH: Record<PactKind, number> = { trade: 0.1, shield: 0, culture: 0.05 };
const WORK_KIND: Record<WorkKind, Kind> = { bridge: "gatehouse", hall: "markethall", tower: "church" };
const pairHash = (l: Link) => hash(l.a.x + l.b.x, l.a.y + l.b.y, 21);

const sinceMemo = new WeakMap<Seed[], Map<string, number | null>>();
/** First moment (minute precision) the outskirts of both towns touch; null if not within three years. Pure. */
export function twinSince(l: Link, seeds: Seed[]): number | null {
  let m = sinceMemo.get(seeds); if (!m) { m = new Map(); sinceMemo.set(seeds, m); }
  const k = `${l.a.id}|${l.b.id}`;
  if (m.has(k)) return m.get(k)!;
  const touch = (t: number) => radiusOf(effAgeBase(l.a, seeds, t)) + radiusOf(effAgeBase(l.b, seeds, t)) >= l.d;
  let lo = Math.max(Date.parse(l.a.created_at), Date.parse(l.b.created_at)), hi = lo + 3 * 365 * 864e5;
  let r: number | null = null;
  if (touch(hi)) {
    if (touch(lo)) hi = lo;
    else while (hi - lo > 60000) { const mid = (lo + hi) / 2; if (touch(mid)) hi = mid; else lo = mid; }
    r = Math.ceil(hi / 60000) * 60000;
  }
  m.set(k, r);
  return r;
}
/** Two towns whose outskirts touch become a twin town. */
export function isTwin(l: Link, seeds: Seed[], now: number) {
  const t = twinSince(l, seeds);
  return t !== null && now >= t;
}
export function twinLinks(s: Seed, seeds: Seed[], now: number) {
  return links(seeds).filter((l) => (l.a.id === s.id || l.b.id === s.id) && isTwin(l, seeds, now));
}
const latest = <T extends { partner: string; at: number }>(xs: T[] | undefined, id: string, now: number) =>
  (xs ?? []).filter((v) => v.partner === id && v.at <= now).sort((a, b) => b.at - a.at)[0];

/** Agreed pact between two twins, derived from both votes; sample towns follow the player, silence for 7 days adopts the partner's choice. */
export function pactOf(s: Seed, o: Seed, seeds: Seed[], now: number): { kind: PactKind; at: number } | null {
  const l = links(seeds).find((k) => (k.a.id === s.id && k.b.id === o.id) || (k.a.id === o.id && k.b.id === s.id));
  if (!l) return null;
  const ts = twinSince(l, seeds); if (ts === null || now < ts) return null;
  const mine = latest(s.votes, o.id, now), theirs = latest(o.votes, s.id, now);
  let r: { kind: PactKind; at: number } | null = null;
  if (!s.user_id && !o.user_id) r = { kind: PACTS[Math.floor(pairHash(l) * 3) % 3]!, at: ts };
  else if (!o.user_id || !s.user_id) { const v = mine ?? theirs; r = v ? { kind: v.pact, at: v.at } : null; }
  else if (mine && theirs) {
    if (mine.pact === theirs.pact) r = { kind: mine.pact, at: Math.max(mine.at, theirs.at) };
    else { const nw = mine.at > theirs.at ? mine : theirs; r = { kind: nw.pact, at: nw.at + PACT_WAIT }; }
  } else { const v = mine ?? theirs; r = v ? { kind: v.pact, at: v.at + PACT_WAIT } : null; }
  return r && r.at <= now ? r : null;
}
/** What the town still has to decide for the pact with `o`: "vote" (no vote yet), "wait" (partner differs or has not voted) or null. */
export function pactPending(s: Seed, o: Seed, seeds: Seed[], now: number) {
  if (pactOf(s, o, seeds, now)) return null;
  const mine = latest(s.votes, o.id, now), theirs = latest(o.votes, s.id, now);
  if (!mine) return "vote" as const;
  if (theirs && theirs.pact !== mine.pact && theirs.at > mine.at) return "vote" as const;
  return "wait" as const;
}
/** Joint building: both halves paid (sample towns pay instantly), then WORK_BUILD hours of construction. */
export function workOf(s: Seed, o: Seed, now: number) {
  const a = latest(s.works, o.id, now), b = latest(o.works, s.id, now) ?? (a && !o.user_id ? { ...a } : undefined);
  const work = a?.work ?? b?.work ?? null;
  const start = a && b ? Math.max(a.at, b.at) : null;
  return { work, mine: !!a, theirs: !!b, start, done: start !== null ? start + WORK_BUILD : null };
}
/** Weekly market day at the gate and monthly twin festival (UTC days, from the pair). */
export const marketDay = (_l: Link, now: number) => worldWeekday(now) === 6;
/** Saturday market stalls stand 9–17 (realm clock) at every open road's midpoint. */
export const marketHours = (now: number) => { const h = worldHour(now) % 24; return worldWeekday(now) === 6 && h >= 9 && h < 17; };
/** Extra growth for both towns while their Saturday market is open (inside the trade cap). */
export const MARKET_BONUS = 0.05;
export const festivalDate = (l: Link) => 1 + Math.floor(pairHash(l) * 28);
export const festivalDay = (l: Link, at: number) => new Date(at).getUTCDate() === festivalDate(l);
const utcDay = (t: number) => Math.floor(t / 864e5);

/** Growth hours from being a twin: +10 % since touching, pact and joint work bonuses, doubled blessings on festival days. */
function twinHours(s: Seed, seeds: Seed[], now: number) {
  let h = 0;
  for (const l of links(seeds)) {
    if (l.a.id !== s.id && l.b.id !== s.id) continue;
    const ts = twinSince(l, seeds); if (ts === null || now < ts) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    h += TWIN_BONUS * (now - ts) / 3.6e6;
    const p = pactOf(s, o, seeds, now);
    if (p) h += PACT_GROWTH[p.kind] * (now - p.at) / 3.6e6;
    const w = workOf(s, o, now);
    if (w.done !== null && now > w.done) h += WORK_BONUS * (now - w.done) / 3.6e6;
    for (const b of s.blessed ?? []) {
      if (b < ts || b > now || !festivalDay(l, b)) continue;
      if ((o.blessed ?? []).some((x) => utcDay(x) === utcDay(b)) || !o.user_id) h += Math.min(now - b, BLESS_MS) / 3.6e6 * BLESS_BONUS;
    }
  }
  return h;
}
/** Gate square, border well, market stalls and the joint building on the twin road's midpoint. Pure. */
const siteMemo = new WeakMap<Seed[], { key: number; map: Map<number, { kind: Kind; seed: Seed }> }>();
export function twinSites(seeds: Seed[], now: number) {
  const key = cacheTick(now), c = siteMemo.get(seeds);
  if (c && c.key === key) return c.map;
  const map = new Map<number, { kind: Kind; seed: Seed }>();
  for (const l of links(seeds)) {
    if (!isTwin(l, seeds, now) || l.tiles.length < 7) continue;
    const m = Math.floor(l.tiles.length / 2);
    const put = (i: number, kind: Kind, dx = 0, dy = 0) => {
      const t = l.tiles[i]; if (!t || l.water[i]) return;
      const x = t[0] + dx, y = t[1] + dy;
      if (dx || dy) { if (!buildable(terrain(x, y))) return; }
      map.set(y * MAP + x, { kind, seed: i < m ? l.a : l.b });
    };
    put(m, "well"); put(m - 1, "square"); put(m + 1, "square");
    if (marketHours(now)) { put(m - 2, "market"); put(m + 2, "market"); }
    const w = workOf(l.a, l.b, now);
    if (w.work && w.done !== null && now >= w.done) {
      const [ax, ay] = l.tiles[m - 1]!, [bx, by] = l.tiles[m + 1]!;
      const px = -Math.sign(by - ay) * 2, py = Math.sign(bx - ax) * 2;
      put(m, WORK_KIND[w.work], px || 2, py);
    }
  }
  siteMemo.set(seeds, { key, map });
  return map;
}
/** Twin pair whose gate stands on (or next to) this tile. */
export function twinGateAt(x: number, y: number, seeds: Seed[], now: number) {
  return links(seeds).find((l) => {
    if (!isTwin(l, seeds, now)) return false;
    const t = l.tiles[Math.floor(l.tiles.length / 2)]; return !!t && Math.hypot(t[0] - x, t[1] - y) <= 2;
  }) ?? null;
}



// ---------------- daily blessing (bell / decorated well) ----------------
/** A blessing lasts 24 h and speeds growth by 10 % meanwhile; derived from the blessing timestamps only. */
export const BLESS_MS = 24 * 3.6e6;
export const BLESS_BONUS = 0.1;
export function blessHours(s: Seed, now: number) {
  let h = 0;
  for (const b of s.blessed ?? []) if (b <= now) h += Math.min(now - b, BLESS_MS) / 3.6e6 * BLESS_BONUS;
  return h;
}
export function isBlessed(s: Seed, now: number) { return (s.blessed ?? []).some((b) => b <= now && now - b < BLESS_MS); }
/** Ms until the owner may bless again (0 = now). */
export function blessCooldown(s: Seed, now: number) {
  const last = Math.max(-Infinity, ...(s.blessed ?? []));
  return Math.max(0, last + BLESS_MS - now);
}

// ---------------- signposts on trade roads ----------------
export type Signpost = { id: string; seed_id: string; target_id: string; user_id: string; message: string };
/** Road tile where a town's signpost towards a neighbour stands: a few steps out of town along the road. */
export function signTile(seeds: Seed[], fromId: string, toId: string): [number, number] | null {
  const l = links(seeds).find((k) => (k.a.id === fromId && k.b.id === toId) || (k.b.id === fromId && k.a.id === toId));
  if (!l || l.tiles.length < 4) return null;
  const from = l.a.id === fromId ? l.a : l.b;
  // first road tile outside the town's core, so the post stands at the village edge
  const order = l.a.id === fromId ? l.tiles : [...l.tiles].reverse();
  const i = order.findIndex(([x, y]) => Math.hypot(x - from.x, y - from.y) >= 7);
  return order[i < 0 ? Math.min(3, order.length - 1) : i]!;
}

/**
 * Can the player place a bought building here? Returns an error code ("far" | "ground" | "taken" | "shore") or null.
 * Free ground means buildable, not forest, no path and no standing building; fields and meadows may be built over.
 */
export function canPlaceSpecial(item: string, x: number, y: number, s: Seed, seeds: Seed[], now: number): string | null {
  const kind = SPECIAL_KIND[item]; if (!kind) return "ground";
  const d = townDist(x, y, s);
  // the fisher walks to the shore, so his hut may stand well outside the village
  const reach = radiusOf(effAge(s, seeds, now)) + 2;
  if (d > (kind === "fishery" ? Math.max(16, reach + 12) : Math.max(4, reach)) || d < 1) return "far";
  const tt = terrain(x, y);
  if (!buildable(tt) || tt === "forest") return "ground";
  const st = structureAt(x, y, seeds, now);
  if (st && !(st.kind === "field" || st.kind === "pasture" || st.kind === "garden")) return "taken";
  if (kind === "fishery") {
    let w = false;
    for (let j = -2; j <= 2 && !w; j++) for (let i = -2; i <= 2; i++) if (isWater(terrain(x + i, y + j))) { w = true; break; }
    if (!w) return "shore";
  }
  return null;
}

// ---------------- village character from geography ----------------
export type Character = "plains" | "mountain" | "coast" | "forest";
const charCache = new Map<string, Character>();
/** Dominant landscape within 14 tiles of the seed; pure function of position. */
export function characterOf(x: number, y: number): Character {
  const key = `${x}:${y}`;
  const hit = charCache.get(key); if (hit) return hit;
  const sc = { plains: 0, mountain: 0, coast: 0, forest: 0 };
  const R = 14;
  for (let j = -R; j <= R; j += 2) for (let i = -R; i <= R; i += 2) {
    if (i * i + j * j > R * R) continue;
    const t = terrain(x + i, y + j);
    if (t === "water" || t === "deep") sc.coast += 1.6;
    else if (t === "hill" || t === "mountain") sc.mountain += resourceAt(x + i, y + j) ? 2.2 : 1.3;
    else if (t === "forest") sc.forest += 1;
    else if (t === "fertile") sc.plains += 1.4;
    else if (t === "grass" || t === "meadow") sc.plains += 0.55;
  }
  const c = (Object.keys(sc) as Character[]).reduce((a, b) => (sc[b] > sc[a] ? b : a));
  charCache.set(key, c);
  return c;
}

// ---------------- village charter (player-chosen path) ----------------
export type CharterPath = "trade" | "craft" | "culture" | "farm";
export const CHARTER_PATHS: CharterPath[] = ["trade", "craft", "culture", "farm"];
/** Hours of real age before a village may seal its charter (Weiler stage). */
export const CHARTER_FROM = 24;
/** Path that fits each landscape best; any path stays valid. */
export const CHARTER_FIT: Record<Character, CharterPath> = { plains: "farm", forest: "farm", mountain: "craft", coast: "trade" };
export const charterReady = (createdAt: string, now: number) => (now - Date.parse(createdAt)) / 3.6e6 >= CHARTER_FROM;
export const charterFits = (c: Character, p: CharterPath) => CHARTER_FIT[c] === p;
