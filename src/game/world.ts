import { pSA } from "./perf-probe";
import { FOOD_CRAFTS } from "./food-crafts";
import { streetFront, type StreetFront } from "./street-layout";
import { worldDayStart } from "./time";
import { nearCourt, resetCourt } from "./court";
import { resetWonders } from "./wonders";
import { townCharacter, resetCharacters, type TownWay } from "./character";
import { biomeKey, type Biome } from "./biome";
import { marketBoost } from "./freimarkt";
import { bauhuetteDone } from "./vorhaben";
import { clock, cacheTick, worldHour, worldWeekday, workClock, workDone, realmGen, type Realm } from "./time";
import { labVersion } from "./lab-ctl";
import { boonHours, type Decision } from "./encounters";
import { tileHits, canBurn } from "./disasters";
import { estateOf, estateHouse, RESIDENTIAL, setMonumentHook } from "./prosperity";
import { gemeinwesenGate, gemeinwesenActive, GEMEINWESEN } from "./gemeinwesen";
// Pure, deterministic world + town growth logic (shared by every player).
const ROAD_YIELDS: ReadonlySet<string> = new Set(["field", "garden", "pasture", "hay", "fence"]);
export const MAP = 1024;

export type Seed = { civicRoads?: CivicRoad[]; id: string; name: string; owner: string; x: number; y: number; hue: number; created_at: string; renamed_at?: string | null; realm?: Realm; mayor_gender?: string | null; mayor_age?: number | null; mayor_traits?: string[] | null; user_id?: string | null; blessed?: number[]; bought?: { item: string; at: number; x?: number | null; y?: number | null }[]; charter?: { path: CharterPath; at: number }; roads?: { target: string; at: number }[]; decisions?: Decision[]; votes?: { partner: string; pact: PactKind; at: number }[]; works?: { partner: string | null; work: WorkKind; cost: number; at: number }[]; sent?: { to: string | null; kind: "gift" | "aid" | "thanks"; at: number; id: string }[]; letters?: { to: string; at: number; id: string }[]; aid?: number[]; moves?: { item: string; x: number; y: number; at: number; cost?: number }[] };
export type Planting = { id: string; seed_id: string; kind: "tree" | "flower" | "lantern" | "cherry" | "quince"; x: number; y: number; created_at: string };
export type CivicRoad = { at: number };

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
let tcache = new Uint8Array(MAP * MAP); // 0 = not computed, else index+1

/**
 * Regional geography: each biome (realm) has its own island outline, mountains and rivers.
 * Heartland (Europe + lab) keeps the original formula exactly. Existing villages on the other
 * maps are protected: their surroundings are lifted to dry lowland and no river crosses them.
 */
let geo: Biome = "heartland";
const geoHooks: (() => void)[] = [];
/** Register a cache reset that runs when the map geography switches (admin realm change). */
export const onGeoChange = (f: () => void) => { geoHooks.push(f); };
export const geoKey = () => biomeKey();
function syncGeo() {
  const b = biomeKey();
  if (b === geo) return;
  geo = b;
  tcache = new Uint8Array(MAP * MAP); riverField = null; oceanMask = null;
  shapeCache.clear(); lmCache.clear(); waterNearCache.clear(); birthCache.clear(); keptCache.clear();
  siteCache.clear(); scaches.clear(); lastCache = null; lastSeeds = null; charCache.clear(); linkCache = []; linkKey = ""; pathCache.clear(); linkSets.clear();
  resetCourt(); resetWonders(); resetCharacters();
  for (const f of geoHooks) f();
}
/** Founded villages (realm maps besides Europe) whose ground must stay dry, buildable lowland. */
const ANCHORS: Record<Biome, [number, number][]> = {
  heartland: [],
  elbe: [],
  marsh: [], halligen: [], bodden: [], moor: [],
  westwild: [[304, 405], [330, 354]],
  westwood: [[297, 415]],
  heath: [[374, 379], [404, 411]],
  weser: [],
};
const ANCHOR_R = 30;
function anchorNear(x: number, y: number, r: number) {
  for (const [ax, ay] of ANCHORS[geo]) if (Math.hypot(x - ax, y - ay) < r) return true;
  return false;
}
function protect(x: number, y: number, h: number) {
  let w = 0;
  for (const [ax, ay] of ANCHORS[geo]) { const d = Math.hypot(x - ax, y - ay); if (d < ANCHOR_R) w = Math.max(w, 1 - d / ANCHOR_R); }
  if (!w) return h;
  const s = w * w * (3 - 2 * w), target = Math.min(0.62, Math.max(0.46, h));
  return h + (target - h) * Math.min(1, s * 1.6);
}
/** Island height with an irregular, bay-and-cape coastline (domain-warped radial falloff). */
function heightAt(x: number, y: number) {
  if (geo === "heartland") return heightEurope(x, y);
  if (geo === "elbe") return heightElbe(x, y);
  if (geo === "marsh") return heightMarsh(x, y);
  if (geo === "halligen") return heightHalligen(x, y);
  if (geo === "bodden") return heightBodden(x, y);
  if (geo === "moor") return heightMoor(x, y);
  if (geo === "weser") return heightWeser(x, y);
  const h = geo === "westwild" ? heightFjords(x, y) : geo === "westwood" ? heightCoastPlain(x, y) : heightArchipelago(x, y);
  return protect(x, y, h);
}
function heightEurope(x: number, y: number) {
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
 * Elbwerder (Europa II): a broad, squat island split by a wide estuary funnel that opens to the
 * north-west, with marsh lowland along it, a sandy Geest ridge in the south-east and a ragged bodden
 * coast to the east. Same flora as Altenland, only the land differs.
 */
function heightElbe(x: number, y: number) {
  const wx = x + (fbm(x / 170, y / 170, 521) - 0.5) * 150;
  const wy = y + (fbm(x / 170, y / 170, 522) - 0.5) * 150;
  const cx = wx / MAP - 0.5, cy = wy / MAP - 0.52;
  const ang = Math.atan2(cy, cx);
  const coast = 0.76 + (vnoise(Math.cos(ang) * 4 + 30, Math.sin(ang) * 4 + 30, 523) - 0.5) * 0.3
    + (vnoise(Math.cos(ang) * 11 + 5, Math.sin(ang) * 11 + 5, 524) - 0.5) * 0.12 * Math.max(0, Math.cos(ang)); // bodden in the east
  const edge = Math.max(0, Math.hypot(cx * 1.1, cy * 0.95) * 2 - coast) * 2.1;
  // estuary: a funnel from the north-west coast towards the centre, narrowing inland
  const ex = cx + cy * 0.9, ey = -cx * 0.9 + cy; // axis running NW -> SE
  const along = -(ex) , wid = 0.03 + Math.max(0, along) * 0.16;
  const funnel = along > -0.12 ? Math.max(0, 1 - Math.abs(ey + (vnoise(ex * 6, 1, 525) - 0.5) * 0.06) / wid) * Math.min(1, (along + 0.12) * 5) : 0;
  const ridge = 1 - Math.abs(fbm(x / 130, y / 130, 526) * 2 - 1);
  const geest = Math.max(0, ex - 0.02) * 0.6; // higher sandy ground south-east of the river
  return fbm(x / 95, y / 95, 501) * 0.72 + ridge * ridge * (0.2 + geest) - edge - funnel * 0.42;
}
/** Störwerder (Europa III): long river marsh island running W–E, a wide river with side creeks, a small Geest hump in the north. */
function heightMarsh(x: number, y: number) {
  const wx = x + (fbm(x / 150, y / 150, 621) - 0.5) * 130, wy = y + (fbm(x / 150, y / 150, 622) - 0.5) * 130;
  const cx = wx / MAP - 0.5, cy = wy / MAP - 0.5, ang = Math.atan2(cy, cx);
  const coast = 0.82 + (vnoise(Math.cos(ang) * 5 + 12, Math.sin(ang) * 5 + 12, 623) - 0.5) * 0.3;
  const edge = Math.max(0, Math.hypot(cx * 1.05, cy * 1.2) * 2 - coast) * 2.2;
  const bend = cy - 0.08 - Math.sin(cx * 7) * 0.035; // the river meanders across the island
  const river = Math.max(0, 1 - Math.abs(bend) / 0.02) * (Math.abs(cx) < 0.36 ? 1 : 0);
  const geest = Math.max(0, 0.16 - Math.hypot(cx + 0.05, cy + 0.2)) * 1.6;
  return fbm(x / 100, y / 100, 601) * 0.62 + 0.11 + geest - edge - river * 0.4;
}
/** Hallighörn (Amerika West II): a central island and a chain of flat Halligen in the north and west. */
function heightHalligen(x: number, y: number) {
  const wx = x + (fbm(x / 120, y / 120, 721) - 0.5) * 120, wy = y + (fbm(x / 120, y / 120, 722) - 0.5) * 120;
  const cx = wx / MAP - 0.55, cy = wy / MAP - 0.55, d = Math.hypot(cx, cy), ang = Math.atan2(cy, cx);
  const coast = 0.68 + (vnoise(Math.cos(ang) * 6 + 50, Math.sin(ang) * 6 + 50, 723) - 0.5) * 0.4;
  const main = fbm(x / 90, y / 90, 701) * 0.66 + 0.04 - Math.max(0, d * 2 - coast) * 2.4;
  const isl = fbm(x / 40, y / 40, 731) * 1.3 - 0.3 - Math.max(0, d - 0.3) * 2.4 - Math.max(0, cx + cy) * 1.2;
  return Math.max(main, Math.min(0.5, isl));
}
/** Boddenholm (Amerika Ost II): a compact Baltic island cut by deep shallow lagoons, chalk heights in the north-east. */
function heightBodden(x: number, y: number) {
  const wx = x + (fbm(x / 160, y / 160, 821) - 0.5) * 140, wy = y + (fbm(x / 160, y / 160, 822) - 0.5) * 140;
  const cx = wx / MAP - 0.5, cy = wy / MAP - 0.48, ang = Math.atan2(cy, cx);
  const coast = 0.78 + (vnoise(Math.cos(ang) * 3 + 70, Math.sin(ang) * 3 + 70, 823) - 0.5) * 0.28;
  const edge = Math.max(0, Math.hypot(cx, cy) * 2 - coast) * 2.3;
  const lagoon = Math.max(0, fbm(x / 70, y / 70, 824) - 0.6) * 2.2 * (Math.hypot(cx, cy) < 0.3 ? 1 : 0.4);
  const chalk = Math.max(0, cx - cy - 0.1) * 0.5;
  const ridge = 1 - Math.abs(fbm(x / 110, y / 110, 825) * 2 - 1);
  return fbm(x / 95, y / 95, 801) * 0.7 + ridge * ridge * (0.12 + chalk) - edge - lagoon;
}
/** Moorgeest (Asien-Pazifik II): a round, compact island with low bog ground in the middle and a sandy rim ridge. */
function heightMoor(x: number, y: number) {
  const wx = x + (fbm(x / 140, y / 140, 921) - 0.5) * 120, wy = y + (fbm(x / 140, y / 140, 922) - 0.5) * 120;
  const cx = wx / MAP - 0.48, cy = wy / MAP - 0.5, d = Math.hypot(cx, cy), ang = Math.atan2(cy, cx);
  const coast = 0.76 + (vnoise(Math.cos(ang) * 5 + 90, Math.sin(ang) * 5 + 90, 923) - 0.5) * 0.3;
  const edge = Math.max(0, d * 2 - coast) * 2.4;
  const rim = Math.max(0, 1 - Math.abs(d - 0.27) / 0.08) * 0.14;
  const ridge = 1 - Math.abs(fbm(x / 100, y / 100, 925) * 2 - 1);
  return fbm(x / 85, y / 85, 901) * 0.68 + ridge * ridge * 0.16 + rim - edge;
}
/**
 * Weserau (Europa IV): a tall island crossed north to south by a meandering river with a broad, low meadow valley (Aue);
 * wooded sandstone hill ridges rise on both banks, highest away from the river.
 */
function heightWeser(x: number, y: number) {
  const wx = x + (fbm(x / 150, y / 150, 1021) - 0.5) * 130, wy = y + (fbm(x / 150, y / 150, 1022) - 0.5) * 130;
  const cx = wx / MAP - 0.5, cy = wy / MAP - 0.5, ang = Math.atan2(cy, cx);
  const coast = 0.8 + (vnoise(Math.cos(ang) * 4 + 110, Math.sin(ang) * 4 + 110, 1023) - 0.5) * 0.3;
  const edge = Math.max(0, Math.hypot(cx * 1.2, cy) * 2 - coast) * 2.2;
  const bend = cx + 0.03 - Math.sin(cy * 6 + 0.5) * 0.05; // the river winds from north to south
  const river = Math.max(0, 1 - Math.abs(bend) / 0.018) * (cy < 0.36 ? 1 : 0); // opens into the sea in the north, rises in the south
  const aue = Math.max(0, 1 - Math.abs(bend) / 0.11); // flat meadow valley along the river
  const ridge = 1 - Math.abs(fbm(x / 90, y / 90, 1025) * 2 - 1);
  const hills = ridge * ridge * (0.2 + Math.min(0.24, Math.max(0, Math.abs(bend) - 0.08) * 0.9));
  return fbm(x / 95, y / 95, 1001) * 0.64 + 0.04 + hills - aue * 0.06 - edge - river * 0.6;
}
/** West isles: a long, tilted island with ragged fjords and a granite spine along its eastern side. */
function heightFjords(x: number, y: number) {
  const wx = x + (fbm(x / 130, y / 130, 221) - 0.5) * 110;
  const wy = y + (fbm(x / 130, y / 130, 222) - 0.5) * 110;
  const cx = wx / MAP - 0.47, cy = wy / MAP - 0.47;
  const rx = cx * 0.8 + cy * 0.6, ry = -cx * 0.6 + cy * 0.8; // tilt the long axis
  const ang = Math.atan2(ry, rx);
  const coast = 0.7 + (vnoise(Math.cos(ang) * 6 + 40, Math.sin(ang) * 6 + 40, 223) - 0.5) * 0.5
    + (vnoise(Math.cos(ang) * 14 + 7, Math.sin(ang) * 14 + 7, 224) - 0.5) * 0.18; // narrow fjords
  const edge = Math.max(0, Math.hypot(rx * 0.95, ry * 1.6) * 2 - coast) * 2.6;
  const ridge = 1 - Math.abs(fbm(x / 95, y / 95, 225) * 2 - 1);
  const spine = Math.max(0, rx + 0.08) * 0.55; // highlands rise towards the east
  return fbm(x / 80, y / 80, 201) * 0.7 + ridge * ridge * (0.22 + spine) - edge;
}
/** East coast: a broad, rounded land with a wide coastal plain, funnel-shaped bays and gentle hills. */
function heightCoastPlain(x: number, y: number) {
  const wx = x + (fbm(x / 200, y / 200, 321) - 0.5) * 170;
  const wy = y + (fbm(x / 200, y / 200, 322) - 0.5) * 170;
  const cx = wx / MAP - 0.47, cy = wy / MAP - 0.44;
  const ang = Math.atan2(cy, cx);
  const coast = 0.8 + (vnoise(Math.cos(ang) * 2 + 60, Math.sin(ang) * 2 + 60, 323) - 0.5) * 0.24;
  const bay = Math.max(0, vnoise(Math.cos(ang) * 5 + 3, Math.sin(ang) * 5 + 3, 324) - 0.62) * 1.4; // estuaries
  const edge = Math.max(0, Math.hypot(cx * 1.15, cy) * 2 - coast + bay) * 1.9;
  const ridge = 1 - Math.abs(fbm(x / 150, y / 150, 325) * 2 - 1);
  const inland = Math.max(0, -cx - 0.05) * 0.5; // a low range far to the west
  return fbm(x / 110, y / 110, 301) * 0.68 + ridge * ridge * (0.14 + inland) - edge;
}
/** Far isle: a crescent main island with a volcanic ridge, ringed by smaller islets. */
function heightArchipelago(x: number, y: number) {
  const wx = x + (fbm(x / 140, y / 140, 421) - 0.5) * 120;
  const wy = y + (fbm(x / 140, y / 140, 422) - 0.5) * 120;
  const cx = wx / MAP - 0.42, cy = wy / MAP - 0.42;
  const ang = Math.atan2(cy, cx), d = Math.hypot(cx, cy);
  const coast = 0.62 + (vnoise(Math.cos(ang) * 4 + 80, Math.sin(ang) * 4 + 80, 423) - 0.5) * 0.36;
  // crescent: a bay bites into the south-east side
  const bite = Math.max(0, 0.22 - Math.hypot(cx - 0.2, cy - 0.2)) * 3.2;
  const edge = Math.max(0, d * 2 - coast) * 2.4 + bite;
  const ridge = 1 - Math.abs(fbm(x / 100, y / 100, 425) * 2 - 1);
  const main = fbm(x / 85, y / 85, 401) * 0.72 + ridge * ridge * 0.36 - edge;
  // islets scattered over the surrounding sea
  const isl = fbm(x / 46, y / 46, 431) * 1.35 - 0.4 - Math.max(0, d - 0.33) * 3.2;
  return d > 0.28 ? Math.max(main, isl) : main;
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
    if (geo !== "heartland" && path.some(([px, py]) => anchorNear(px, py, 16))) continue; // never through a founded village
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
      const rw = geo === "westwood" ? Math.min(3.8, 1.2 + i * 0.008) : Math.min(2.8, 1.1 + i * 0.006);
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
export const riverDistAt = (x: number, y: number) => { syncGeo(); return rivers()[y * MAP + x]!; };
export function terrain(x: number, y: number): Terrain {
  if (x < 0 || y < 0 || x >= MAP || y >= MAP) return "deep";
  syncGeo();
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

export type Resource = "ore" | "bog" | "stone";
/** Mineral deposits in the uplands (future industry bonus). Deterministic per tile. */
export function resourceAt(x: number, y: number): Resource | null {
  const t = terrain(x, y);
  if (t !== "hill" && t !== "mountain") return null;
  if (fbm(x / 14, y / 14, 41) > 0.66) return "ore";
  if (fbm(x / 16, y / 16, 43) > 0.67) return "bog";
  if (hash(x, y, 45) > 0.93) return "stone";
  return null;
}

export const ageHours = (s: Seed, now: number) => Math.max(0, (now - Date.parse(s.created_at)) / 3.6e6);

/** Six eras in effective hours. Expansion slows, but never stops. */
export const STAGES = [
  { name: "Ursprung", from: 0 }, { name: "Weiler", from: 24 },
  { name: "Dorf", from: 168 }, { name: "Kleinstadt", from: 2160 },
  { name: "Handelsstadt", from: 4380 }, { name: "Hansestadt", from: 8760 },
] as const;
export const stageOf = (h: number) => {
  let stage = 0;
  for (let i = 1; i < STAGES.length; i++) if (h >= (STAGES[i]?.from ?? Infinity)) stage = i;
  return stage;
};
/** Mixed sqrt/log expansion: ~43 tiles at two years, continuing beyond that. */
export const radiusOf = (h: number) => 1.6 + 0.18 * Math.sqrt(Math.max(0, h)) + 3 * Math.log1p(Math.max(0, h) / 60);

/**
 * Coastal towns fan inland: unit vector away from water plus a stretch k that compensates lost sea area. Pure, cached.
 *
 * Two rules for k, chosen by founding date (a stretch can never change for a standing town: every house, ring road and
 * field is laid out in town-space distance, so a new k would move about half of its houses):
 * - founded before COAST_AREA_SINCE: the land-share estimate 1 + (0.9 − f) × 3.6 (f = buildable share within 16 tiles).
 *   It overshoots on strongly coastal sites: median 15–19 % more building land than a flat inland town of the same
 *   radius, single sites over 30 % (docs/kuesten-balance.md).
 * - founded from COAST_AREA_SINCE (and every prospective site without a founding date): the equal-area stretch — the
 *   smallest k at which the town shape holds as much buildable land as a full inland circle, averaged over
 *   COAST_AREA_RADII. Coast is then neither a bonus nor a penalty in building land; at most COAST_K_MAX.
 */
export const COAST_AREA_SINCE = Date.UTC(2026, 10, 30, 0, 0, 0); // 2026-11-30T00:00:00Z, confirmed by Stephan; publish before it
export const COAST_AREA_RADII = [8, 12, 16, 24] as const, COAST_K_MAX = 2.8;
type ShapeSeed = { id: string; x: number; y: number; created_at?: string | null };
/** Test hook, like roadSettleCfg: tests of other rules pin the cut-over; production never changes it. */
export const coastAreaCfg = { since: COAST_AREA_SINCE };
export const coastAreaRule = (s: ShapeSeed) => !s.created_at || Date.parse(s.created_at) >= coastAreaCfg.since;
/** Buildable land inside the town shape of radius R, as a share of a full circle of that radius (1 = flat inland town). */
export function coastLandShare(x: number, y: number, ux: number, uy: number, k: number, radii: readonly number[] = COAST_AREA_RADII) {
  let sum = 0;
  for (const R of radii) {
    let n = 0; const B = Math.ceil(R * k) + 1;
    for (let j = -B; j <= B; j++) for (let i = -B; i <= B; i++) {
      let p = i * ux + j * uy; const q = -i * uy + j * ux;
      if (p > 0) p /= k;
      if (Math.hypot(p, q) <= R && buildable(terrain(x + i, y + j))) n++;
    }
    sum += n / (Math.PI * R * R);
  }
  return sum / radii.length;
}
const shapeCache = new Map<string, { ux: number; uy: number; k: number }>();
export function landShape(s: ShapeSeed) {
  const area = coastAreaRule(s);
  const ck = `${s.id}|${s.x}|${s.y}|${area ? 1 : 0}`;
  const hit = shapeCache.get(ck); if (hit) return hit;
  let land = 0, tot = 0, vx = 0, vy = 0;
  const R = 16;
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
    const d = Math.hypot(i, j); if (d > R || d < 1) continue;
    tot++;
    if (buildable(terrain(Math.round(s.x) + i, Math.round(s.y) + j))) { land++; vx += i / d; vy += j / d; }
  }
  const f = tot ? land / tot : 1, m = Math.hypot(vx, vy);
  let out = m > 1e-6 && f < 0.9 ? { ux: vx / m, uy: vy / m, k: Math.min(2.8, 1 + (0.9 - f) * 3.6) } : { ux: 1, uy: 0, k: 1 };
  if (area && out.k > 1) {
    const { ux, uy } = out, X = Math.round(s.x), Y = Math.round(s.y);
    const share = (k: number) => coastLandShare(X, Y, ux, uy, k);
    let lo = 1, hi = COAST_K_MAX;
    if (share(1) >= 1) hi = 1;
    else if (share(hi) > 1) for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (share(mid) < 1) lo = mid; else hi = mid; }
    out = hi === 1 ? { ux: 1, uy: 0, k: 1 } : { ux, uy, k: hi };
  }
  shapeCache.set(ck, out);
  return out;
}
/** Town-space distance: tiles landward count as closer, so a harbour town reaches k× deeper inland. */
export function townDist(x: number, y: number, s: ShapeSeed): number {
  const { ux, uy, k } = landShape(s);
  const dx = x - s.x, dy = y - s.y;
  if (k === 1) return Math.hypot(dx, dy);
  let p = dx * ux + dy * uy; const q = -dx * uy + dy * ux;
  if (p > 0) p /= k;
  return Math.hypot(p, q);
}
/** Max real-tile reach of a town with town-space radius r (for bounding boxes). */
export const reachOf = (s: ShapeSeed, r: number) => r * landShape(s).k;
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
  | "stall" | "townhall" | "gatehouse" | "manufactory" | "steamworks" | "station" | "suburb" | "avenue"
  | "patrician" | "villa" | "tenement" | "townhouse2" | "fachwerk" | "steinhaus" | "handwerker"
  | "fishery" | "granary" | "infirmary" | "school" | "markethall" | "guildhall" | "library" | "dairy" | "firehouse" | "firerack" | "guardhouse" | "lodge" | "herbhut" | "woodcamp" | "quarry" | "belfry"
  | "backhaus" | "herberge" | "beginenhof" | "badestube" | "bigstore" | "millrow" | "stonemason" | "hammerworks" | "smokehouse" | "saltquay"
  | "theater" | "opera" | "university" | "exchange" | "orangery" | "harvesthall" | "guildtower" | "lighthouse" | "seat1" | "seat2" | "seat3";
/** build < 1: still a construction site (0 = staked out, 1 = finished). doneAt: real ms when it stands (estimate for organic growth). */
/** `burnt`: a site that is a rebuild after a fire (paint only: soot and charred beams, see burnt-site.ts). */
export type Structure = { kind: Kind; seed: Seed; v: number; build?: number; doneAt?: number | undefined; fire?: boolean; burnt?: true; flood?: boolean; wet?: number; silt?: number; levee?: number; homeKind?: Kind };
/** Construction time (in growth hours) before a building at birth age `at` is finished. */
export const buildTime = (at: number) => Math.min(96, Math.max(1.5, at * 0.06));
/** Ordinary homes, barns and workshops take a fixed short site phase (growth hours, ≈1.7 real h at base pace):
 * big towns grow slower because houses appear less often, never because each house takes longer. Finish time (birth) is unchanged. */
export const HOUSE_BUILD = 0.6;
/** Site progress of one tile evaluation; owned by the caller, never shared module state. */
type BuildOut = { p: number; at: number };
export const WELL_DIG = 0.15;
/** Homes that may be mirrored so their front turns toward the street (pure, all clients agree). */
export const MIRROR_KINDS: ReadonlySet<Kind> = new Set(["hut", "farmhouse", "cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement", "suburb", "barn", "workshop", "stall", "coop"]);
/**
 * Sprites face the lower-left (+y). Follow the neighbouring street axis on either side;
 * yard buildings without street contact share a stable four-tile block orientation.
 */
export function faceFlip(kind: Kind, x: number, y: number, isRoad: (x: number, y: number) => boolean, pre?: StreetFront | null): boolean {
  if (!MIRROR_KINDS.has(kind)) return false;
  const front = pre !== undefined ? pre : streetFront(x, y, isRoad);
  if (front) return front.axis === "x";
  // Back-yard buildings share a block orientation instead of checkerboard flips.
  return hash(Math.floor(x / 4), Math.floor(y / 4), 91) < 0.5;
}
export const FLAT: ReadonlySet<Kind> = new Set(["path", "street", "square", "field", "pasture", "garden", "market", "road", "bridge", "avenue"]);
const CORE: Record<string, Kind> = { "1,0": "hut", "0,1": "hut", "1,1": "campfire", "-1,0": "garden", "-1,1": "field", "0,-1": "garden" };
/** Kinds of the growing mayor's seat, in era order. */
export const SEAT_KINDS: readonly Kind[] = ["seat1", "seat2", "seat3", "townhall"];
export const LANDMARKS: { dx: number; dy: number; at: number; kind: Kind }[] = [
  { dx: 2, dy: -1, at: 30, kind: "coop" }, { dx: -2, dy: 1, at: 48, kind: "barn" },
  { dx: 2, dy: -2, at: 180, kind: "chapel" }, { dx: -3, dy: -3, at: 168, kind: "watermill" },
  { dx: 3, dy: 1, at: 280, kind: "inn" }, { dx: -2, dy: 2, at: 360, kind: "bakery" },
  // second mill once the fields outgrow the first (grain surplus of a grown farming village)
  { dx: -4, dy: 4, at: 420, kind: "mill" },
  // second bakery in the trade town, so a big town does not live on porridge alone
  { dx: -5, dy: -2, at: 4380, kind: "bakery" },
  { dx: 0, dy: -3, at: 2160, kind: "stall" }, { dx: 4, dy: -1, at: 2300, kind: "smithy" },
  { dx: -4, dy: 1, at: 2500, kind: "warehouse" },
  { dx: 2, dy: -2, at: 4500, kind: "church" },
  // the mayor's seat: reserved from the founding on, grows with every era (Kate -> Hof -> Amtshaus -> Rathaus-Palais)
  { dx: 1, dy: -2, at: 3, kind: "seat1" }, { dx: 1, dy: -2, at: 168, kind: "seat2" },
  { dx: 1, dy: -2, at: 2160, kind: "seat3" }, { dx: 1, dy: -2, at: 4380, kind: "townhall" },
  { dx: 8, dy: 6, at: 8760, kind: "manufactory" }, { dx: -7, dy: -6, at: 9200, kind: "steamworks" },
  { dx: -9, dy: 5, at: 10000, kind: "station" },
  { dx: 12, dy: 3, at: 2400, kind: "sawmill" },
];
/** Character landmarks: the barn and warehouse sites show the town's way (pure, visual only — no tax or roster effect). */
export function wayLandmark(kind: Kind, way: TownWay, wet: boolean): Kind {
  if (kind === "barn") return way === "workshop" ? "dairy" : way === "gateway" && wet ? "fishery" : "barn";
  if (kind === "warehouse") return way === "grain" ? "granary" : way === "gateway" && wet ? "harbor" : "warehouse";
  return kind;
}
const lmCache = new Map<string, Map<string, number[]>>();
/** Landmarks that may (or must) touch water: watermill, and barn/warehouse sites that become fishery/harbor. */
const SHORE_LANDMARKS: ReadonlySet<Kind> = new Set<Kind>(["watermill", "barn", "warehouse", "coop"]);
/**
 * Landmarks keep their nominal offset when the ground is dry; otherwise they move to the nearest
 * buildable tile (pure function of seed position), so coastal and mountain towns get them too.
 */
export function landmarkSpots(s: Seed): Map<string, number[]> {
  const ck = `${s.id}:${s.x}:${s.y}`; const hit = lmCache.get(ck); if (hit) return hit;
  const out = new Map<string, number[]>(), used = new Set<string>(Object.keys(CORE)); used.add("0,0");
  // ordinary landmarks need dry neighbours so wide sprites never hang over water; shore kinds keep the old rule
  const dry = (dx: number, dy: number) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (isWater(terrain(s.x + dx + i, s.y + dy + j))) return false; return true; };
  const ok = (dx: number, dy: number, strict = false) => !used.has(`${dx},${dy}`) && buildable(terrain(s.x + dx, s.y + dy)) && Math.hypot(dx, dy) >= 1.6 && (!strict || dry(dx, dy));
  // the same nominal tile can host successive landmarks (chapel -> church): share its relocation
  const moved = new Map<string, string>();
  LANDMARKS.forEach((l, i) => {
    const nom = `${l.dx},${l.dy}`;
    let key = moved.get(nom);
    if (!key) {
      key = nom;
      const strict = !SHORE_LANDMARKS.has(l.kind);
      if (!ok(l.dx, l.dy, strict)) {
        let best = "", bs = Infinity;
        for (let j = -6; j <= 6; j++) for (let k = -6; k <= 6; k++) {
          const dx = l.dx + k, dy = l.dy + j; if (!ok(dx, dy, strict)) continue;
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
/**
 * Road openings (a spoke at SPOKE_AT, a ring at RINGS.at) give many old lots their road at one instant. Lots whose
 * nominal birth already lies in the past used to stand finished in that same instant (Ehrenberg, Gebbingen 27.11.2026:
 * +24 / +29 houses at 240 h). From ROAD_SETTLE_SINCE such a lot is built after the opening instead: its site starts
 * at a pure per-tile offset within roadSettle(T) and takes the ordinary HOUSE_BUILD. Nothing is stored — the opening
 * hour T and the offset are derived. Openings a village had passed by ROAD_SETTLE_SINCE keep the old rule, so no
 * standing house turns back into a site.
 * Duration: twice the build time of a landmark of that era (buildTime) — 28.8 growth hours at 240 h, so on average
 * less than one site at a time even for 30 lots; later openings take longer, as landmarks do.
 *
 * RELEASE CUTOVER — 2026-11-28 12:00 UTC; publish no later than 09:00 UTC (at least three hours beforehand).
 * Openings already passed at this instant keep the old rule. Never move this date after activation: an earlier
 * date resets houses, a later one makes sites jump to finished.
 */
export const ROAD_SETTLE_OFF = Date.UTC(2100, 0, 4);
export const ROAD_SETTLE_SINCE = Date.UTC(2026, 10, 28, 12, 0, 0);
/** Test switch: the cutover in effect (tests set a real date; production always reads ROAD_SETTLE_SINCE). */
export const roadSettleCfg = { since: ROAD_SETTLE_SINCE };
export const roadSettle = (t: number) => 2 * buildTime(t);
/** A tile's share 0…1 of the settling window; hashed twice so it is independent of the tile's birth and kind hashes. */
const settleShare = (x: number, y: number) => hash((hash(x, y, 31) * 1048576) | 0, x - y, 9);
/** Finish hour of a lot that was due before opening `t` and got its road only through it; null when `t` did not open it
 *  (already on a road before, or still without one). `r` is the village radius the roads are read with. */
function settledBirth(x: number, y: number, s: Seed, t: number, r: number): number | null {
  let now = false, before = false;
  for (let j = -1; j <= 1 && !before; j++) for (let i = -1; i <= 1; i++) {
    if (!i && !j) continue;
    if (pathAt(x + i, y + j, s, t - 1e-9, r)) { before = true; break; }
    now ||= pathAt(x + i, y + j, s, t, r);
  }
  return now && !before ? t + HOUSE_BUILD + settleShare(x, y) * roadSettle(t) : null;
}
const ROAD_OPENINGS = [...new Set([...SPOKE_AT, ...RINGS.map((g) => g.at)])].filter((t) => t > 0).sort((a, b) => a - b);
/** The opening hour whose settling window contains `age`, or null (windows never overlap; see road-settle.test.ts). */
export const roadOpeningAt = (age: number): number | null => {
  for (const t of ROAD_OPENINGS) if (age >= t && age < t + roadSettle(t) + HOUSE_BUILD) return t;
  return null;
};
const waterNearCache = new Map<number, boolean>();
export function waterNearby(x: number, y: number): boolean {
  const key = y * MAP + x, hit = waterNearCache.get(key); if (hit !== undefined) return hit;
  let water = false;
  for (let j = -3; j <= 3 && !water; j++) for (let i = -3; i <= 3; i++) if (Math.hypot(i,j) <= 3 && isWater(terrain(x+i,y+j))) { water = true; break; }
  waterNearCache.set(key, water); return water;
}
/** birthAt per exact town distance. The key is d itself: a rounded key would hand every later distance in the same
 *  bucket the value of whichever distance (of any town) was asked first, so houses, households and tax would depend on
 *  what the process computed before. Bounded; clearing is safe because each value depends on its key only. */
const birthCache = new Map<number, number>();
export const BIRTH_CACHE_MAX = 1 << 20;
export const tileBirth = (d: number) => { let h = birthCache.get(d); if (h === undefined) { h = birthAt(d); if (birthCache.size >= BIRTH_CACHE_MAX) birthCache.clear(); birthCache.set(d, h); } return h; };
/** Test hook: start from an empty tile-birth cache (fresh process). */
export const resetBirthCache = () => birthCache.clear();

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

/** Near range (tiles) in which a spoke that meets water is turned landward (rock keeps the old heading). */
export const SPOKE_PROBE = 12;
/** A replacement direction counts as open land when no tile from 2 to SPOKE_OPEN along it is water (rock never excludes one). */
export const SPOKE_OPEN = 24;
const rayClear = (s: { x: number; y: number }, ang: number, to: number) => {
  const c = Math.cos(ang), n = Math.sin(ang);
  for (let t = 2; t <= to; t++) if (!buildable(terrain(Math.round(s.x + c * t), Math.round(s.y + n * t)))) return false;
  return true;
};
const rayDry = (s: { x: number; y: number }, ang: number, to: number) => {
  const c = Math.cos(ang), n = Math.sin(ang);
  for (let t = 2; t <= to; t++) if (isWater(terrain(Math.round(s.x + c * t), Math.round(s.y + n * t)))) return false;
  return true;
};
const angGap = (p: number, q: number) => { let g = Math.abs(p - q) % (Math.PI * 2); return g > Math.PI ? Math.PI * 2 - g : g; };
const spokeCache = new Map<string, number[]>();
/**
 * Base heading of each village spoke (pure from seed + terrain). Spokes keep their nominal golden-angle
 * heading unless water blocks them within SPOKE_PROBE tiles (rock never turns a spoke); those are turned, in spoke order, to the
 * open land heading farthest from every other spoke — same eight spokes, never forced across water.
 */
export function spokeDirs(s: { id: string; x: number; y: number }): number[] {
  const ck = `${s.id}|${s.x}|${s.y}`;
  const hit = spokeCache.get(ck); if (hit) return hit;
  let sn = 0; for (const ch of s.id) sn = (sn * 31 + ch.charCodeAt(0)) | 0;
  const base = hash(sn, 1, 2) * Math.PI * 2;
  const dirs = SPOKE_AT.map((_, k) => base + k * 2.39996);
  const blocked = dirs.map((a) => !rayDry(s, a, SPOKE_PROBE));
  if (blocked.some(Boolean)) {
    const open: number[] = [];
    for (let i = 0; i < 72; i++) { const a = base + (i / 72) * Math.PI * 2; if (rayDry(s, a, SPOKE_OPEN)) open.push(a); }
    const fixed = dirs.filter((_, k) => !blocked[k]);
    for (let k = 0; k < dirs.length; k++) {
      if (!blocked[k] || !open.length) continue;
      let best = dirs[k]!, bs = -Infinity;
      for (const a of open) {
        const sep = fixed.length ? Math.min(...fixed.map((f) => angGap(a, f))) : Math.PI;
        const sc = sep - angGap(a, dirs[k]!) * 0.01;
        if (sc > bs) { bs = sc; best = a; }
      }
      dirs[k] = best; fixed.push(best);
    }
  }
  if (spokeCache.size > 500) spokeCache.clear();
  spokeCache.set(ck, dirs);
  return dirs;
}

/** Range (tiles) along which a spoke is checked for an obstacle it can bend around. */
export const BEND_REACH = 40;
/** Candidate bend angles (rad), smallest first; a bend is only taken when the straight spoke hits water or rock. */
const BEND_TURNS = [0.15, 0.3, 0.45, 0.6];
type Bend = { at: number; turn: number; len: number } | null;
const bendCache = new Map<string, Bend[]>();
const bendOff = (b: Bend, d: number) => !b || d <= b.at ? 0 : b.turn * Math.min(1, (d - b.at) / b.len);
/**
 * Local obstacle bypass (pure from seed + terrain): a spoke whose straight run meets water (rock never bends one) between
 * 4 and BEND_REACH tiles bends, from 3 tiles before the obstacle, by the smallest turn whose curve stays on
 * buildable land for 12 more tiles and keeps clear of the other spokes; otherwise it ends as before.
 * Unobstructed spokes keep their exact course.
 */
export function spokeBends(s: { id: string; x: number; y: number }): Bend[] {
  const ck = `${s.id}|${s.x}|${s.y}`;
  const hit = bendCache.get(ck); if (hit) return hit;
  const dirs = spokeDirs(s);
  const ok = (d: number, a: number) => buildable(terrain(Math.round(s.x + Math.cos(a) * d), Math.round(s.y + Math.sin(a) * d)));
  let sn = 0; for (const ch of s.id) sn = (sn * 31 + ch.charCodeAt(0)) | 0;
  const out: Bend[] = dirs.map(() => null);
  dirs.forEach((a, k) => {
    let t0 = 0;
    for (let t = 2; t <= BEND_REACH; t++) {
      const tt = terrain(Math.round(s.x + Math.cos(a) * t), Math.round(s.y + Math.sin(a) * t));
      if (isWater(tt)) { t0 = t; break; }
      if (!buildable(tt)) return; // rock ends a spoke as before — mountain towns gain no extra reach
    }
    if (t0 < 4) return;
    const at = Math.max(2, t0 - 3), sg = hash(sn, k, 77) < 0.5 ? 1 : -1;
    for (const m of BEND_TURNS) for (const turn of [m * sg, -m * sg]) {
      const len = Math.max(4, at * Math.abs(turn) * 2), b = { at, turn, len };
      let good = true;
      for (let d = at; d <= at + len + 12 && good; d += 0.5) {
        const h = a + bendOff(b, d);
        if (!ok(d, h)) good = false;
        else for (let j = 0; j < dirs.length; j++) if (j !== k && angGap(h, dirs[j]! + bendOff(out[j]!, d)) < 0.25) { good = false; break; }
      }
      if (good) { out[k] = b; return; }
    }
  });
  if (bendCache.size > 500) bendCache.clear();
  bendCache.set(ck, out);
  return out;
}

function pathAt(x: number, y: number, s: Seed, age: number, r: number): boolean {
  const dx = x - s.x, dy = y - s.y, d = townDist(x, y, s);
  if (d < 0.8 || d > r + 0.5) return false; // same edge as lots/structureAt, so a finished house is never overrun later
  if (!buildable(terrain(x, y))) return false;
  const sn = seedNum(s);
  const a = Math.atan2(dy, dx);
  const dirs = spokeDirs(s), bends = spokeBends(s);
  for (let k = 0; k < SPOKE_AT.length; k++) {
    if (age < SPOKE_AT[k]!) break;
    const ang = dirs[k]! + bendOff(bends[k]!, d) + (vnoise(d * 0.18, k * 7.3, sn & 1023) - 0.5) * 1.1;
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
function keptPaths(s: Seed, age: number, r: number, open: number | null = null): Set<number> {
  const ck = `${s.id}|${Math.floor(age * 60)}|${open ?? ""}|${seedsKey(soloSeeds(s))}`; // anchors depend on purchases/charter, not only age
  const hit = keptCache.get(ck); if (hit) return hit;
  const R = Math.ceil(reachOf(s, r) + 1), cx = Math.round(s.x), cy = Math.round(s.y);
  const paths = new Set<number>(), anchor = new Set<number>();
  for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
    if (x < 0 || y < 0 || x >= MAP || y >= MAP || !buildable(terrain(x, y))) continue;
    const d = townDist(x, y, s);
    if (d > r + 0.5) continue;
    if (pathAt(x, y, s, age, r)) { paths.add(y * MAP + x); continue; }
    const k = forSeed(x, y, s, age, r, d, true, undefined, open);
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

/** Raw lot choice of a roadside village tile (stage ≤ 2), before the farmyard rule; null if the tile is no lot. */
function yardKind(x: number, y: number, s: Seed, age: number, r: number, stage: number): Kind | null {
  const h = hash(x, y, 4);
  return stage <= 1 ? weighted(h, [["farmhouse",50],["barn",25],["garden",15],["coop",10]]) : weighted(h, [["cottage",40],["handwerker",20],["farmhouse",15],["barn",10],["garden",15]]);
}
/** Share of roadside tiles that carry a house (rest: gardens/open) and radius of the free village green. */
export const PLOT_SHARE = 0.78, SQUARE_R = 2.6;
function roadsideLot(x: number, y: number, s: Seed, age: number, r: number): boolean {
  if (!buildable(terrain(x, y)) || hash(x, y, 2) > PLOT_SHARE || pathAt(x, y, s, age, r)) return false;
  const d = townDist(x, y, s);
  if (d > r + 0.5 || d < SQUARE_R) return false;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && pathAt(x + i, y + j, s, age, r)) return true;
  return false;
}
/** A barn is kept only as the yard of a neighbouring farmhouse, and the first barn of a cluster wins. */
function barnOfYard(x: number, y: number, s: Seed, age: number, r: number, stage: number): boolean {
  let farm = false;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    if (!i && !j) continue;
    if (!roadsideLot(x + i, y + j, s, age, r)) continue;
    const k = yardKind(x + i, y + j, s, age, r, stage);
    if (k === "barn" && (j < 0 || (j === 0 && i < 0))) return false;
    if (k === "farmhouse") farm = true;
  }
  return farm;
}
function forSeed(x: number, y: number, s: Seed, age: number, r: number, d: number, raw = false, out?: BuildOut, open: number | null = null): Kind | null {
  const dx = x - s.x, dy = y - s.y, stage = stageOf(age);
  // the village well is dug during the first 9 minutes: a building site, not a second campfire next to the core one at (+1,+1)
  if (dx === 0 && dy === 0) {
    if (age < WELL_DIG && out) {
      out.p = age / WELL_DIG;
      out.at = WELL_DIG;
    }
    return "well";
  }
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
    if (age < l.at && out) { out.p = 1 - (l.at - age) / buildTime(l.at); out.at = l.at; }
    if (l.kind === "watermill" && !waterNearby(x,y)) return "mill";
    return wayLandmark(l.kind, townCharacter(s).main, waterNearby(x, y));
  }
  if (stage >= 3 && d > 3 && d < r * 0.8 && waterNearby(x,y) && hash(x,y,89) > 0.985) return "harbor";
  if (pathAt(x,y,s,age,r)) {
    // a building in the way of a road just opened stands until the road reaches it, in the second half of the window
    // (when about half of the new lots are built), so an opening never removes houses at one instant either
    if (open !== null && age < open + (0.5 + 0.5 * settleShare(x, y)) * roadSettle(open) && !pathAt(x,y,s,open-1e-9,r)) {
      const was = forSeed(x, y, s, open - 1e-9, r, d, true);
      if (was && !NOT_ANCHOR.has(was)) return was;
    }
    if (!raw && !keptPaths(s, age, r, open).has(y * MAP + x)) return null;
    return stage >= 4 && d > r * 0.55 ? "avenue" : stage >= 3 && d < r * 0.6 ? "street" : "path";
  }
  if (stage >= 2 && d < SQUARE_R) return "square";
  const birth = tileBirth(d) * (0.75 + 0.5 * hash(x,y,3));
  if (age < birth - HOUSE_BUILD) return null;
  if (age < birth && out) { out.p = 1 - (birth - age) / HOUSE_BUILD; out.at = birth; }
  let near = false;
  for (let j=-1;j<=1 && !near;j++) for (let i=-1;i<=1;i++) if ((i||j) && pathAt(x+i,y+j,s,age,r)) { near=true; break; }
  // a lot that was due before the road opening and got its road only through it is built after the opening (roadSettle)
  if (near && open !== null && birth <= open) {
    const born = settledBirth(x, y, s, open, r);
    if (born !== null) {
      if (age < born - HOUSE_BUILD) near = false; // not started yet: the land stays what it was before the opening
      else if (age < born && out) { out.p = 1 - (born - age) / HOUSE_BUILD; out.at = born; }
    }
  }
  const h = hash(x,y,4);
  if (!near) {
    if (stage >= 4 && d < r * 0.5) return h < 0.45 ? "garden" : null;
    const a = acreOf(x, y, s);
    if (a.corner && h > 0.6) return weighted(h, [["hay",40],["coop",30],["fence",30]]);
    // slopes carry no ploughland: kitchen gardens and goat pastures instead of crop rows
    if (terrain(x, y) === "hill") return weighted(a.h, [["pasture",45],["garden",35],["fence",20]]);
    return weighted(a.h, [["field",72],["pasture",22],["garden",6]]);
  }
  if (hash(x,y,2)>PLOT_SHARE) return h<0.5?"garden":null;
  if (stage <= 2) {
    const k = yardKind(x, y, s, age, r, stage);
    // Hofstelle: a barn only stands beside a farmhouse it belongs to, never two barns side by side
    // decided once at the lot's own birth (radius only grows), so a finished yard never flips between barn and house
    if (k === "barn" && !barnOfYard(x, y, s, birth, radiusOf(birth), stage)) return stage <= 1 ? "farmhouse" : "cottage";
    return k;
  }
  // Stable sectors form residential, craft and market districts.
  // Quarters are assigned per 3x3 block hash (angle-free), so coastlines never decide which quarter lands on dry ground.
  const sector = hash(Math.floor(x / 3) * 73 + seedNum(s) % 10007, Math.floor(y / 3) * 97, 81);
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
/**
 * Prestige monuments, each built in paid steps (`${key}1` … `${key}${n}`); only the first step places the site.
 * The cathedral uses the "factory" kind (its historic sprite); it is no longer an automatic landmark.
 */
export const MONUMENT_DEFS = {
  belfry: { kind: "belfry", n: 4 }, theater: { kind: "theater", n: 3 }, cathedral: { kind: "factory", n: 5 },
  university: { kind: "university", n: 4 }, exchange: { kind: "exchange", n: 4 }, orangery: { kind: "orangery", n: 3 }, opera: { kind: "opera", n: 4 },
  harvest: { kind: "harvesthall", n: 3 }, guildtower: { kind: "guildtower", n: 3 }, lighthouse: { kind: "lighthouse", n: 3 },
} as const satisfies Record<string, { kind: Kind; n: number }>;
export type MonumentKey = keyof typeof MONUMENT_DEFS;
export const MONUMENT_KEYS = Object.keys(MONUMENT_DEFS) as MonumentKey[];
export const monumentSteps = (k: MonumentKey) => Array.from({ length: MONUMENT_DEFS[k].n }, (_, i) => `${k}${i + 1}`);
/** Which monument a purchase item belongs to (e.g. "opera3" → "opera"), or null. */
/** Exactly the strings the former pattern test /^([a-z]+)(\d)$/ with 1 ≤ digit ≤ n accepted: one entry per monument step. */
const MONUMENT_ITEMS = new Map<string, MonumentKey>(MONUMENT_KEYS.flatMap((k) => monumentSteps(k).map((i) => [i, k] as const)));
export const monumentOf = (item: string): MonumentKey | null => MONUMENT_ITEMS.get(item) ?? null;
export const MONUMENT_BY_KIND = new Map<Kind, MonumentKey>(MONUMENT_KEYS.map((k) => [MONUMENT_DEFS[k].kind, k]));
export const SPECIAL_KIND: Record<string, Kind> = { backhaus: "backhaus", herberge: "herberge", badestube: "badestube", beginen: "beginenhof", fisher: "fishery", granary: "granary", healer: "infirmary", school: "school", markethall: "markethall", guildhall: "guildhall", library: "library", dairy: "dairy", firehouse: "firehouse", fireorder: "firerack", guard: "guardhouse", hunter: "lodge", herbs: "herbhut", woodcamp: "woodcamp", steingrube: "quarry", bigstore: "bigstore", millrow: "millrow", stonemason: "stonemason", hammerworks: "hammerworks", smokehouse: "smokehouse", saltquay: "saltquay",
  ...Object.fromEntries(MONUMENT_KEYS.map((k) => [`${k}1`, MONUMENT_DEFS[k].kind])) };
/** Belfry steps (kept for the guild-rank requirement). */
export const MONUMENT_STEPS = ["belfry1", "belfry2", "belfry3", "belfry4"] as const;
/** Construction progress 0…1 of a monument. Paying a step is not building it: steps are built one after another,
 *  each over specialBuild work time, starting when it is paid or the previous step is finished, whichever is later —
 *  so buying all steps at once never makes the site jump ahead. */
export function monumentProgress(s: Seed, now: number, key: MonumentKey = "belfry"): number {
  const w = workClock(now);
  let sum = 0;
  for (const { start, done } of monumentChain(s, key, now)) sum += Math.min(1, Math.max(0, (w - workClock(start)) / Math.max(1, workClock(done) - workClock(start))));
  return Math.min(MONUMENT_DEFS[key].n, sum) / MONUMENT_DEFS[key].n;
}
/** The single build chain of a monument: step i starts when paid or when step i-1 stands (whichever is later) and
 *  finishes at specialDone. Always evaluated against the town alone ([s]) so map, menu, effects, Wohlstand,
 *  chronicle and finish letter share one sawmill decision and one finish time. */
/** Set while a lighthouse chain is evaluated (see lighthouseDone). */
const lightBusy = new Set<string>();
type ChainStep = { at: number; start: number; done: number };
/**
 * Evaluation scope for one synchronous top-level computation (residentTax): while it runs, build chains of
 * monuments and the Zunftturm sequence are computed once and reused. Validity:
 * - entries live only until the outermost scope returns, so seed rows pushed or replaced afterwards are never met
 *   by an old chain (nothing inside a scope mutates seeds; residentTax is pure);
 * - keyed by the seed object, the monument and the recursion-guard state of that seed (lightBusy, exBusy, operaBusy,
 *   harvestBusy, domBusy, uniBusy), because a chain evaluated inside a guard reads that monument's effects as 0;
 * - a chain is extended lazily in purchase order: step i depends only on step i-1 and the town, so the steps paid by
 *   `until` are exactly the first ones of the full sorted list; re-entry into an entry being extended falls back to
 *   the plain computation. any setRealm call inside a scope drops the memo.
 */
type ChainMemo = { ats: number[]; out: ChainStep[]; busy: boolean };
type GuildMemo = { paid: number[]; done: number[]; busy: boolean };
let scopeDepth = 0;
let chainMemo: WeakMap<Seed, Map<string, ChainMemo | GuildMemo>> | null = null, memoRealm = 0;
/** Test switch: false runs every chain without the memo (reference path for equality tests). */
export const chainMemoCfg = { on: true, hits: 0, misses: 0 };
export function withChainMemo<T>(f: () => T): T {
  if (!chainMemoCfg.on) return f();
  if (scopeDepth++ === 0) { chainMemo = new WeakMap(); memoRealm = realmGen(); }
  try { return f(); } finally { if (--scopeDepth === 0) chainMemo = null; }
}
const guardState = (id: string) =>
  (lightBusy.has(id) ? 1 : 0) | (exBusy.has(id) ? 2 : 0) | (operaBusy.has(id) ? 4 : 0) | (harvestBusy.has(id) ? 8 : 0) | (domBusy.has(id) ? 16 : 0) | (uniBusy.has(id) ? 32 : 0);
function memoOf<T extends ChainMemo | GuildMemo>(s: Seed, k: string, make: () => T): T | null {
  if (!chainMemo) return null;
  if (memoRealm !== realmGen()) { chainMemo = new WeakMap(); memoRealm = realmGen(); }
  let m = chainMemo.get(s);
  if (!m) { m = new Map(); chainMemo.set(s, m); }
  const key = `${k}|${guardState(s.id)}`;
  let e = m.get(key) as T | undefined;
  if (!e) { e = make(); m.set(key, e); }
  return e.busy ? null : e;
}
export function monumentChain(s: Seed, key: MonumentKey, until = Infinity): ChainStep[] {
  const e = memoOf<ChainMemo>(s, key, () => ({ ats: (s.bought ?? []).filter((b) => monumentOf(b.item) === key && b.at <= Infinity).map((b) => b.at).sort((a, b) => a - b), out: [], busy: false }));
  if (!e) return chainRaw(s, key, until);
  let n = 0;
  while (n < e.ats.length && e.ats[n]! <= until) n++;
  if (n > e.out.length) {
    chainMemoCfg.misses++;
    const guard = key === "lighthouse" && !lightBusy.has(s.id);
    if (guard) lightBusy.add(s.id);
    e.busy = true;
    try {
      let prev = e.out.length ? e.out[e.out.length - 1]!.done : -Infinity;
      for (let i = e.out.length; i < n; i++) {
        const at = e.ats[i]!, start = Math.max(at, prev); prev = specialDone(s, soloSeeds(s), start); e.out.push({ at, start, done: prev });
      }
    } finally { e.busy = false; if (guard) lightBusy.delete(s.id); }
  } else chainMemoCfg.hits++;
  const out: ChainStep[] = [];
  for (let i = 0; i < n; i++) { const c = e.out[i]!; out.push({ at: c.at, start: c.start, done: c.done }); }
  return out;
}
function chainRaw(s: Seed, key: MonumentKey, until: number): ChainStep[] {
  const out: ChainStep[] = [];
  let prev = -Infinity;
  const guard = key === "lighthouse" && !lightBusy.has(s.id);
  if (guard) lightBusy.add(s.id);
  try {
  for (const at of (s.bought ?? []).filter((b) => monumentOf(b.item) === key && b.at <= until).map((b) => b.at).sort((a, b) => a - b)) {
    const start = Math.max(at, prev); prev = specialDone(s, soloSeeds(s), start); out.push({ at, start, done: prev });
  }
  } finally { if (guard) lightBusy.delete(s.id); }
  return out;
}
/** Craft charter halves the construction time of bought buildings. */
/** Craft charter halves, a woodcutter's camp (ready timber) shortens build time by a quarter — both pure from purchases. */
export const WOODCAMP_BUILD = 0.75;
/** Timber at hand: once the town's own sawmill stands (effAge past its landmark age), bought builds go up faster — pure from seeds + clock. */
export const TIMBER_BUILD = 0.85;
export const SAWMILL_AGE = LANDMARKS.find((l) => l.kind === "sawmill")!.at;
export const sawmillUp = (s: Seed, seeds: Seed[], now: number) => effAge(s, seeds, now) >= SAWMILL_AGE;
/** Journeymen lodging in the Gesellenherberge lend a hand: bought builds go up faster. */
export const HERBERGE_BUILD = 0.85;
/** Paid steps of a monument by time t (each step gives part of its effect, see MONUMENT step boons). */
export const stepsPaid = (s: Seed, key: MonumentKey, t = Infinity) => (s.bought ?? []).filter((b) => b.at <= t && monumentOf(b.item) === key).length;
/** Physically finished steps of a monument by time t (same chain as map, mails and chronicle). */
export const stepsDone = (s: Seed, key: MonumentKey, t: number) => monumentChain(s, key, t).filter((c) => c.done <= t).length;
/** Zunftturm (Bauhütte): every finished step makes bought buildings and monuments 5 % faster to build. */
export const GUILDTOWER_STEP = 0.05;
/** Monument step effects (paid steps count at once, independent of the physical build):
 *  harvest (finished steps only, stepsDone): step 1 care-gate supply, grain store +10 % / +25 %, step 2 halves winter hunger,
 *  step 3 halves the winter sickness surcharge and softens the flood loss of farm produce;
 *  lighthouse (all via stepsDone): step 1 winter fishing 0.5→0.8 + one care-food building, step 2 (own gateway town)
 *  halves the distance loss beyond MIN_SEED_DISTANCE on all own roads, step 3 routed trade touching a coast +20 % and ceiling +0.05;
 *  cathedral: see cathedralDone (all finished steps only);
 *  university: see universityDone (all finished steps only);
 *  exchange: see schuettingDone (all finished steps only); orangery: from step 2 like a herb hut, step 3 sickness −0.01;
 *  opera (Artushof): step 4 roads to partners +10 % trade factor (inside the usual cap). */
export const HARVEST_GRAIN = [0, 0.1, 0.25, 0.25] as const, LIGHTHOUSE_TRANSIT = 1.2, LIGHTHOUSE_CEIL = [0, 0, 0, 0.05] as const;
/** Finished lighthouse steps, guarded: while the lighthouse's own build chain is evaluated (sawmill → effAge → trade),
 *  its effects read 0 — no self-acceleration, no recursion, identical on every client and the tax server. */
export const lighthouseDone = (s: Seed, now: number) =>
  lightBusy.has(s.id) || !(s.bought ?? []).some((b) => b.at <= now && monumentOf(b.item) === "lighthouse") ? 0 : stepsDone(s, "lighthouse", now);
const coastal = (o: Seed) => townCharacter(o).main === "gateway";
/** Leuchtturm step 2 (finished, own gateway town): every own road loses only half its distance penalty beyond MIN_SEED_DISTANCE. */
export const seaDist = (s: Seed, _o: Seed, d: number, now: number) => d > MIN_SEED_DISTANCE && coastal(s) && lighthouseDone(s, now) >= 2 ? MIN_SEED_DISTANCE + (d - MIN_SEED_DISTANCE) / 2 : d;
/** Sea and river ways that count like finished trade roads for the settlement rank (max SEA_WAYS_MAX):
 *  finished lighthouse step 1, finished fish hall/salt quay (coastal harbour), finished fisher's hut on water (inland harbour). */
export const SEA_WAYS_MAX = 2;
export function seaWays(s: Seed, now: number): number {
  let n = lighthouseDone(s, now) >= 1 ? 1 : 0;
  for (const b of s.bought ?? []) {
    if (b.at > now || !(b.item === "smokehouse" || b.item === "saltquay" || b.item === "fisher")) continue;
    if (specialDone(s, soloSeeds(s), b.at) > now) continue;
    if (b.item === "fisher") { const t = specialTile(s, "fishery"); if (!t || !waterNearby(t[0], t[1])) continue; }
    n++;
  }
  return Math.min(SEA_WAYS_MAX, n);
}
export const CATHEDRAL_SICK = 0.02, ORANGERY_SICK = 0.01, OPERA_TRADE = 0.1;
/** Finished Schütting steps, guarded like cathedralDone: while its own build chain is evaluated (sawmill → effAge →
 *  trade → transitShare/tradeCapOf) it reads 0 — no self-acceleration, no recursion. Step 1: vaulted cellar (no stock);
 *  2: arcade hall — 2 merchants, routed trade 0.80; 3: stepped gable — trade ceiling +0.05 (via softTrade only);
 *  4: weather vane — 3rd merchant, routed trade 0.85; PRESTIGE_BONUS and Wohlstand works unchanged. */
const exBusy = new Set<string>();
export const EXCHANGE_CEIL = 0.05;
export const schuettingDone = (s: Seed, now: number) => {
  if (exBusy.has(s.id) || !(s.bought ?? []).some((b) => b.at <= now && monumentOf(b.item) === "exchange")) return 0;
  exBusy.add(s.id);
  try { return stepsDone(s, "exchange", now); } finally { exBusy.delete(s.id); }
};
export const exchangeMerchants = (s: Seed, now: number) => { const n = schuettingDone(s, now); return n >= 4 ? 3 : n >= 2 ? 2 : 0; };
/** Artushof: finished steps only; operaBusy breaks effAge → trade → operaDone → stepsDone → sawmillUp → effAge (0 while busy, so the site never speeds itself up). */
const operaBusy = new Set<string>();
export const operaDone = (s: Seed, now: number) => {
  if (operaBusy.has(s.id) || !(s.bought ?? []).some((b) => b.at <= now && monumentOf(b.item) === "opera")) return 0;
  operaBusy.add(s.id);
  try { return stepsDone(s, "opera", now); } finally { operaBusy.delete(s.id); }
};
/** Artushof: step 3 doubles WAY_COMPLEMENT and lifts the ceiling +0.03 (max 0.63), step 4 +0.05 (max 0.65). */
export const OPERA_WAY = 0.1, OPERA_CEIL = [0, 0, 0, 0.03, 0.05] as const, OPERA_CEIL_MAX = [0.6, 0.6, 0.6, 0.63, 0.65] as const;
export const operaMerchants = (s: Seed, now: number) => (operaDone(s, now) >= 2 ? 2 : 0);
export const transitShare = (s: Seed, now: number) => { const n = schuettingDone(s, now); return n >= 4 ? 0.85 : n >= 2 ? 0.8 : TRANSIT_SHARE; };
/** Erntedankhalle step 1 (physically finished): counts as one more supply building for the care gate only —
 *  never foodCapacity, production or stock. */
/** While a hall's own build chain is evaluated (its sawmill check reads effAge → care gate), the hall does not count
 *  for itself — no self-acceleration and no recursion; deterministic on every client and the tax server. */
const harvestBusy = new Set<string>();
/** Lighthouse step 1 counts the same way; one shared guard covers both monuments, so neither recurses through the other. */
export const careFoodExtra = (s: Seed, now: number) => {
  if (harvestBusy.has(s.id)) return lighthouseDone(s, now) >= 1 ? 1 : 0;
  const light = lighthouseDone(s, now) >= 1 ? 1 : 0;
  if (!(s.bought ?? []).some((b) => b.at <= now && monumentOf(b.item) === "harvest")) return light;
  harvestBusy.add(s.id);
  try { return light + (stepsDone(s, "harvest", now) >= 1 ? 1 : 0); } finally { harvestBusy.delete(s.id); }
};
/** Extra health-care count from monuments (cathedral step 3+, orangery step 2+ when no herb hut). */
/** Finished Dom steps, guarded like lighthouseDone: while the cathedral's own chain is evaluated (sawmill → effAge →
 *  care gate → careHealthExtra) it reads 0 — no self-acceleration, no recursion, identical on client and tax server.
 *  Step 2: Dom portal becomes the church gathering place; 3: +1 Gemeinwesen; 4: Domspital (2 priests nurse);
 *  5: winter sickness surcharge × CATHEDRAL_WINTER, festive peal (finished structure), PRESTIGE_BONUS unchanged. */
const domBusy = new Set<string>();
export const CATHEDRAL_WINTER = 2 / 3, DOM_NURSES = 2;
export const cathedralDone = (s: Seed, now: number) => {
  if (domBusy.has(s.id) || !(s.bought ?? []).some((b) => b.at <= now && monumentOf(b.item) === "cathedral")) return 0;
  domBusy.add(s.id);
  try { return stepsDone(s, "cathedral", now); } finally { domBusy.delete(s.id); }
};
/** Finished university steps, guarded like cathedralDone (no self-acceleration, no recursion via the care gate).
 *  Step 1: the two lecturers take up teaching; 2: chancery — messengers on own roads +20 % (UNIVERSITY_MESSENGER);
 *  3: library counts as +1 Gemeinwesen; 4: PROSPER_MONUMENTS works (PRESTIGE_BONUS list unchanged). */
const uniBusy = new Set<string>();
export const UNIVERSITY_MESSENGER = 1.2;
export const universityDone = (s: Seed, now: number) => {
  if (uniBusy.has(s.id) || !(s.bought ?? []).some((b) => b.at <= now && monumentOf(b.item) === "university")) return 0;
  uniBusy.add(s.id);
  try { return stepsDone(s, "university", now); } finally { uniBusy.delete(s.id); }
};
export const careHealthExtra = (s: Seed, now: number, own: Set<string>) => (cathedralDone(s, now) >= 3 ? 1 : 0) + (universityDone(s, now) >= 3 ? 1 : 0) + (!own.has("herbs") && stepsPaid(s, "orangery", now) >= 2 ? 1 : 0);
/** Finished Zunftturm steps at time t: each step is built after the previous one with only the steps already
 *  standing at its own start speeding it — the tower never speeds its own running step. Pure, no recursion. */
export function guildtowerDone(s: Seed, t: number): number {
  const e = memoOf<GuildMemo>(s, "guildtower#", () => ({ paid: (s.bought ?? []).filter((b) => monumentOf(b.item) === "guildtower").map((b) => b.at).sort((a, b) => a - b), done: [], busy: false }));
  if (!e || e.paid.some((a) => !(a <= Infinity))) return guildtowerRaw(s, t);
  let prev = -Infinity, n = 0;
  for (let i = 0; i < e.paid.length; i++) {
    const start = Math.max(e.paid[i]!, prev); if (start > t) break;
    if (i >= e.done.length) {
      e.busy = true;
      try { e.done.push(doneWith(s, soloSeeds(s), start, i)); } finally { e.busy = false; }
    }
    prev = e.done[i]!;
    if (prev <= t) n++; else break;
  }
  return n;
}
function guildtowerRaw(s: Seed, t: number): number {
  const paid = (s.bought ?? []).filter((b) => monumentOf(b.item) === "guildtower").map((b) => b.at).sort((a, b) => a - b);
  let prev = -Infinity, n = 0;
  for (const at of paid) {
    const start = Math.max(at, prev); if (start > t) break;
    prev = doneWith(s, soloSeeds(s), start, n);
    if (prev <= t) n++; else break;
  }
  return n;
}
const buildWith = (s: Seed, mill: boolean, gt: number) => (1 - GUILDTOWER_STEP * gt) * ((s.bought ?? []).some((b) => b.item === "herberge") ? HERBERGE_BUILD : 1) * (s.charter?.path === "craft" ? SPECIAL_BUILD / 2 : SPECIAL_BUILD) * ((s.bought ?? []).some((b) => b.item === "woodcamp") ? WOODCAMP_BUILD : 1) * (mill ? TIMBER_BUILD : 1) * (s.charter?.path === "craft" && (s.bought ?? []).some((b) => b.item === "rank2") ? 0.8 : 1);
function doneWith(s: Seed, seeds: Seed[], at: number, gt: number) {
  const fast = workDone(at, buildWith(s, true, gt));
  return sawmillUp(s, seeds, fast) ? fast : workDone(at, buildWith(s, false, gt));
}
/** Build time of a bought building/monument step started at `at` (default: with every Zunftturm step finished by now). */
export const specialBuild = (s: Seed, mill = false, at = Infinity) => buildWith(s, mill, guildtowerDone(s, at));
/** Site phase of the Steingrube in builders' work hours: a pit and a hoist, far quicker than a building (production
 *  counts from the purchase anyway, DB resource_rate). */
export const QUARRY_BUILD = 1 * 3600000;
/** When a bought (non-monument) building started at `at` is finished – same rule as structureAt. `kind` only matters
 *  for the Steingrube (quarry), whose short site phase takes no build bonuses. */
export function specialDone(s: Seed, seeds: Seed[], at: number, kind?: Kind): number {
  if (kind === "quarry") return workDone(at, QUARRY_BUILD);
  // builders rest at night (workClock), the day shift makes up for it
  return marketBoost(s, at, bauhuetteDone(s, at, doneWith(s, seeds, at, guildtowerDone(s, at))));
}
/** When a fully paid monument is finished (last step + build time, same rule as structureAt), or null while steps are missing. */
export function monumentDone(s: Seed, _seeds: Seed[], key: MonumentKey): number | null {
  const chain = monumentChain(s, key);
  return chain.length < MONUMENT_DEFS[key].n ? null : chain[chain.length - 1]!.done;
}
/** The tile of each bought building kind of a seed (pure). */
export function specialTile(s: Seed, kind: Kind): [number, number] | null {
  let old: [number, number] | null = null;
  for (const [k, v] of specialSites(s)) if (v.kind === kind) { if (v.until == null) return [k % MAP, Math.floor(k / MAP)]; old ??= [k % MAP, Math.floor(k / MAP)]; }
  return old;
}
/** Farm charter: +5 % growth from the day it was sealed. */
export const FARM_BONUS = 0.05;
export const SPECIAL_BUILD = 6 * 3600000;
const CORE_SPOTS = new Set([...Object.keys(CORE), ...LANDMARKS.map((l) => `${l.dx},${l.dy}`), "0,0"]);
/** A bought site; `until` = moved away at that time, `mv` = rebuilt here by a relocation (plain build phase). */
export type Site = { kind: Kind; at: number; until?: number; mv?: true; auto?: true };
const siteCache = new Map<string, Map<number, Site>>();
/** Ensembles painted as whole complexes (courtyards, wings) stand on 2×2 tiles: the sprite sits on the
 * front (south) tile, the three tiles behind become its paved ground ("square") — nothing else grows there. */
export const FOOT2: ReadonlySet<Kind> = new Set<Kind>(["beginenhof", "university", "orangery", "factory"]);
export const FOOT2_BACK: [number, number][] = [[-1, 0], [0, -1], [-1, -1]];
function coverBack(out: Map<number, Site>, x: number, y: number, at: number, until?: number) {
  for (const [i, j] of FOOT2_BACK) { const k = (y + j) * MAP + x + i; if (!out.has(k)) out.set(k, { kind: "square", at, ...(until != null ? { until } : {}) }); }
}
/**
 * Where each bought building stands: a pure function of the seed and its purchases. The fishery
 * looks for the shore, the healer for the forest edge, the school for the village core, the granary for the fields.
 */
const siteQuick = new WeakMap<object, { id: string; x: number; y: number; mv: unknown; m: Map<number, Site> }>();
export function specialSites(s: Seed): Map<number, Site> {
  const quick = s.bought ? siteQuick.get(s.bought) : undefined;
  if (quick && quick.id === s.id && quick.x === s.x && quick.y === s.y && quick.mv === s.moves) return quick.m;
  const items = (s.bought ?? []).filter((b) => SPECIAL_KIND[b.item]);
  const key = `${s.id}:${s.x}:${s.y}:${items.map((b) => `${b.item}${b.at}@${b.x ?? ""},${b.y ?? ""}`).join(",")}|${(s.moves ?? []).map((m) => `${m.item}${m.at}@${m.x},${m.y}`).join(",")}`;
  const hit = siteCache.get(key); if (hit) { if (s.bought) siteQuick.set(s.bought, { id: s.id, x: s.x, y: s.y, mv: s.moves, m: hit }); return hit; }
  const out = new Map<number, Site>();
  // relocations (Umsetzen): original sites are placed exactly as before (no auto spot ever shifts), moves overlay them afterwards
  const ms = (s.moves ?? []).filter((m) => SPECIAL_KIND[m.item] && items.some((b) => b.item === m.item)).sort((a, c) => a.at - c.at);
  const moved = new Set(ms.map((m) => m.item));
  const firstMove = (item: string) => ms.find((m) => m.item === item)?.at;
  const seen = new Set<string>();
  let oldQuarry: (typeof items)[number] | undefined;
  for (const b of [...items].sort((a, c) => a.at - c.at)) {
    if (seen.has(b.item)) continue; seen.add(b.item);
    // a Steingrube bought before it had a place (0143, lab only) is placed last, so it can never displace another building
    if (b.item === "steingrube" && (b.x == null || b.y == null)) { oldQuarry = b; continue; }
    const kind = SPECIAL_KIND[b.item]!;
    const big = FOOT2.has(kind);
    // the player chose the spot in the build preview (for 2×2 ensembles: the front tile)
    const until = moved.has(b.item) ? firstMove(b.item) : undefined;
    const site = (at: number): Site => ({ kind, at, ...(until != null ? { until } : {}) });
    if (b.x != null && b.y != null && !out.has(b.y * MAP + b.x)) { out.set(b.y * MAP + b.x, site(b.at)); if (big) coverBack(out, b.x, b.y, b.at, until); continue; }
    let best = -1, bs = Infinity;
    for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) {
      const x = s.x + dx, y = s.y + dy, d = Math.hypot(dx, dy), k = y * MAP + x;
      if (d < 2.4 || d > 9 || out.has(k) || CORE_SPOTS.has(`${dx},${dy}`)) continue;
      if (!buildable(terrain(x, y)) || terrain(x, y) === "forest" || pathAt(x, y, s, 20000, 10)) continue;
      if (big && FOOT2_BACK.some(([i, j]) => { const xx = x + i, yy = y + j; return out.has(yy * MAP + xx) || CORE_SPOTS.has(`${xx - s.x},${yy - s.y}`) || !buildable(terrain(xx, yy)) || terrain(xx, yy) === "forest" || pathAt(xx, yy, s, 20000, 10); })) continue;
      let water = 0, forest = 0;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const t = terrain(x + i, y + j); if (isWater(t)) water++; else if (t === "forest") forest++; }
      let sc = d + hash(x, y, 777) * 1.5;
      if (kind === "fishery") sc += water ? -12 - Math.min(water, 6) : 0;
      if (kind === "lodge" || kind === "woodcamp" || kind === "herbhut") sc += forest ? -6 - Math.min(forest, 6) * 0.6 : 0;
      if (kind === "infirmary") sc += forest ? -4 - Math.min(forest, 5) * 0.5 : 0;
      if (kind === "school" || kind === "guardhouse" || MONUMENT_BY_KIND.has(kind)) sc -= d < 5 ? 2 : 0;
      if (kind === "firehouse") sc += water ? -3 : 0;
      if (kind === "granary") sc += Math.abs(d - 6);
      if (kind === "backhaus") sc += Math.abs(d - 3.5);
      // bathhouses need fresh water and much firewood: brook, river or shore first
      if (kind === "badestube") sc += water ? -8 - Math.min(water, 5) : 0;
      if (kind === "herberge") sc += pathAt(x + 1, y, s, 20000, 10) || pathAt(x, y + 1, s, 20000, 10) ? -3 : 0;
      if (sc < bs) { bs = sc; best = k; }
    }
    if (best >= 0) { out.set(best, site(b.at)); if (big) coverBack(out, best % MAP, Math.floor(best / MAP), b.at, until); }
  }
  // auto: structureAt shows it only on a tile nothing else claims (it cannot see neighbouring villages from here)
  if (oldQuarry) { const k = oldQuarrySpot(s, oldQuarry.at, out); if (k >= 0) out.set(k, { kind: "quarry", at: oldQuarry.at, auto: true }); }
  for (let i = 0; i < ms.length; i++) {
    const m = ms[i]!, kind = SPECIAL_KIND[m.item]!;
    const next = ms.slice(i + 1).find((o) => o.item === m.item);
    out.set(m.y * MAP + m.x, { kind, at: m.at, mv: true, ...(next ? { until: next.at } : {}) });
    if (FOOT2.has(kind)) for (const [i2, j] of FOOT2_BACK) out.set((m.y + j) * MAP + m.x + i2, { kind: "square", at: m.at, ...(next ? { until: next.at } : {}) });
  }
  if (siteCache.size > 200) siteCache.clear();
  siteCache.set(key, out);
  if (s.bought) siteQuick.set(s.bought, { id: s.id, x: s.x, y: s.y, mv: s.moves, m: out });
  return out;
}
/** Spot for a Steingrube bought without a position (migration 0143, lab only): the nearest buildable tile just outside
 *  the village's largest possible reach at purchase time (effAgeBound of the village alone + QUARRY_MARGIN), so it
 *  stands on land that was free then and displaces neither a bought building (`taken`) nor a grown house. Pure. */
export const QUARRY_MARGIN = 2;
function oldQuarrySpot(s: Seed, at: number, taken: Map<number, Site>): number {
  const inner = radiusOf(effAgeBound(s, soloSeeds(s), at)) + 0.5 + QUARRY_MARGIN;
  let best = -1, bs = Infinity;
  for (let dy = -Math.ceil(inner + 8); dy <= inner + 8; dy++) for (let dx = -Math.ceil(inner + 8); dx <= inner + 8; dx++) {
    const x = s.x + dx, y = s.y + dy, k = y * MAP + x, d = townDist(x, y, s);
    if (d < inner || d > inner + 8 || taken.has(k)) continue;
    if (!buildable(terrain(x, y)) || terrain(x, y) === "forest" || pathAt(x, y, s, 20000, 10)) continue;
    const sc = d + hash(x, y, 778) * 0.5;
    if (sc < bs) { bs = sc; best = k; }
  }
  return best;
}
/** Cache key that changes whenever seed positions, ages or purchases change. */
const skMemo = new WeakMap<Seed[], string>();
export const seedsKey = (seeds: Seed[]) => { let k = skMemo.get(seeds); if (k === undefined) { k = seedsKeyRaw(seeds); skMemo.set(seeds, k); } return k; };
const tup = (xs: string[] | undefined) => (xs ?? []).slice().sort().join("/");
/** Full content fingerprint of every seed input that drives growth, buildings, households and citizens (sorted tuples, order-independent). */
const seedsKeyRaw = (seeds: Seed[]) => seeds.map((s) => [s.id, s.x, s.y, s.created_at, s.user_id ?? "",
  tup(s.bought?.map((b) => `${b.item}@${b.at}@${b.x ?? ""}.${b.y ?? ""}`)),
  `${s.charter?.path ?? ""}@${s.charter?.at ?? ""}`,
  tup(s.roads?.map((r) => `${r.target}@${r.at}`)),
  tup(s.decisions?.map((d) => `${d.event}@${d.choice}@${d.cost}@${d.at}`)),
  tup(s.blessed?.map(String)),
  tup(s.votes?.map((v) => `${v.partner}@${v.pact}@${v.at}`)),
  tup(s.works?.map((w) => `${w.partner}@${w.work}@${w.cost}@${w.at}`)),
  tup(s.aid?.map(String)),
  tup(s.moves?.map((m) => `${m.item}@${m.at}@${m.x}.${m.y}`)),
  tup(s.sent?.map((g) => `${g.to}@${g.kind}@${g.at}`)),
  tup(s.civicRoads?.map((c) => String(c.at))),
].join(":")).join(";");

/** Growth hour at which the building on this tile is finished (0 for the founding core). */
/** With `seeds`, a lot settled after a road opening (roadSettle) reports that later finish hour — the hour its house
 *  really stands — so arrivals, first-name order, wedding eligibility and the chronicle follow the map. Openings under
 *  the old rule keep the nominal hour, exactly as before. */
const bornMemo = new Map<string, number>();
export function bornAt(x: number, y: number, s: Seed, seeds?: Seed[]): number {
  const dx = x - s.x, dy = y - s.y;
  if (CORE[`${dx},${dy}`] || (!dx && !dy)) return 0;
  const here = landmarkSpots(s).get(`${dx},${dy}`);
  if (here?.length) return LANDMARKS[here[here.length - 1]!]!.at;
  const b = tileBirth(Math.hypot(dx, dy)) * (0.75 + 0.5 * hash(x, y, 3));
  const was = seeds ? settledFrom(s, seeds) : Infinity;
  if (was === Infinity) return b;
  const first = ROAD_OPENINGS.findIndex((t) => t > was);
  if (first < 0) return b;
  const ck = `${s.id}|${s.x}|${s.y}|${x}|${y}|${first}|${landShape(s).k}`, hit = bornMemo.get(ck);
  if (hit !== undefined) return hit;
  // "due before the opening" exactly as the map decides it (forSeed reads the lot's birth from townDist)
  const due = tileBirth(townDist(x, y, s)) * (0.75 + 0.5 * hash(x, y, 3));
  let out = b;
  for (let n = first; n < ROAD_OPENINGS.length; n++) {
    const t = ROAD_OPENINGS[n]!;
    if (due > t) continue;
    // read with the radius at the end of the window, the widest the map uses while it settles this opening
    const v = settledBirth(x, y, s, t, radiusOf(t + roadSettle(t) + HOUSE_BUILD));
    if (v !== null) { out = v; break; }
    // already on a road by then: the nominal hour stands
    let near = false;
    for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1; i++) if ((i || j) && pathAt(x + i, y + j, s, t, radiusOf(t))) { near = true; break; }
    if (near) break;
  }
  if (bornMemo.size > 20000) bornMemo.clear();
  bornMemo.set(ck, out);
  return out;
}

// several seed sets (whole realm, single village) are queried per frame: keep one cache each instead of thrashing one
const scaches = new Map<string, Map<number, Structure | null>>();
let lastSeeds: Seed[] | null = null, lastTick = -1, lastLab = -1, lastCache: Map<number, Structure | null> | null = null;
const soloMemo = new WeakMap<Seed, Seed[]>();
/** Stable one-element seed list, so per-village queries hit the same cache every frame. */
export const soloSeeds = (s: Seed): Seed[] => { let a = soloMemo.get(s); if (!a) { a = [s]; soloMemo.set(s, a); } return a; };
/** Gated estate shares (people.ts estateSharesLive, same rule as resident tax); registered there to avoid an import cycle. */
let estateHook: ((s: Seed, seeds: Seed[], now: number) => { skilled: number; wealthy: number } | null) | null = null;
export const setEstateHook = (f: typeof estateHook) => { estateHook = f; };
/**
 * Exact spatial pre-selection for structureAt (no fixed radius): bought sites indexed by tile, and each
 * town listed in the grid cells its reach box touches. townDist >= hypot(dx,dy)/k, so a tile with
 * townDist <= r + 0.5 lies within reachOf(s, r + 0.5) real tiles. Candidates keep seed-array order (tie-break).
 * Bound to the seeds array object and the exact `now`, so it can never outlive its inputs.
 */
const PICK_CELL = 32;
type Pick = { now: number; sites: Map<number, number[]>; grid: Map<number, number[]> | null; rb: Float64Array | null };
const pickMemo = new WeakMap<Seed[], Pick[]>();
export const PICK_SLOTS = 16;
/** Test/measurement switches: cheap = gridOf sized by effAgeBound (no effAgeBase), lazyTwin = twin sites per region
 *  via the midpoint index; false restores the previous reference paths. Counters are diagnostics only. */
export const pickCfg = { cheap: true, lazyTwin: true, distPre: true, slots: PICK_SLOTS, gridSeeds: 0, twinLinks: 0, twinCells: 0, gridBuilds: 0, preSkips: 0 };
/** Test helper: forget cached structureAt results so a reference and an optimised pass never share entries. */
export function clearStructureCaches() { scaches.clear(); lastCache = null; lastSeeds = null; }
function picksOf(seeds: Seed[], now: number): Pick {
  let slots = pickMemo.get(seeds); if (!slots) { slots = []; pickMemo.set(seeds, slots); }
  const i = slots.findIndex((c) => c.now === now);
  if (i >= 0) { const c = slots[i]!; if (i > 0) { slots.splice(i, 1); slots.unshift(c); } return c; }
  const sites = new Map<number, number[]>();
  seeds.forEach((s, i) => { if (s.bought?.length) for (const k of specialSites(s).keys()) { const a = sites.get(k); if (a) a.push(i); else sites.set(k, [i]); } });
  const p: Pick = { now, sites, grid: null, rb: null };
  slots.unshift(p); while (slots.length > Math.max(1, pickCfg.slots)) slots.pop();
  return p;
}
function gridOf(p: Pick, seeds: Seed[], now: number): Map<number, number[]> {
  if (p.grid) return p.grid;
  pickCfg.gridBuilds++;
  const grid = new Map<number, number[]>();
  const rb = new Float64Array(seeds.length);
  seeds.forEach((s, i) => {
    if (now < Date.parse(s.created_at)) return;
    pickCfg.gridSeeds++;
    rb[i] = radiusOf(pickCfg.cheap ? effAgeBound(s, seeds, now) : effAgeUpper(s, seeds, now));
    const R = reachOf(s, rb[i]! + 0.5) + 1;
    const cx0 = Math.floor((s.x - R) / PICK_CELL), cx1 = Math.floor((s.x + R) / PICK_CELL);
    const cy0 = Math.floor((s.y - R) / PICK_CELL), cy1 = Math.floor((s.y + R) / PICK_CELL);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const k = cy * 65536 + cx; const a = grid.get(k); if (a) a.push(i); else grid.set(k, [i]);
    }
  });
  p.grid = grid; p.rb = rb;
  return grid;
}
const NO_PICK: number[] = [];
export function structureAt(x: number, y: number, seeds: Seed[], now: number): Structure | null {
  // labVersion: a fire or flood set off on the test map's control desk shows at once, not with the next minute
  const tick = cacheTick(now), lab = labVersion();
  let scache: Map<number, Structure | null>;
  if (seeds === lastSeeds && tick === lastTick && lab === lastLab && lastCache) scache = lastCache;
  else {
    const key = `${tick}|${lab}|${seedsKey(seeds)}`;
    let m = scaches.get(key);
    if (!m) { m = new Map(); scaches.set(key, m); if (scaches.size > 24) scaches.delete(scaches.keys().next().value!); }
    scache = m; lastSeeds = seeds; lastTick = tick; lastLab = lab; lastCache = m;
  }
  const ck = y * MAP + x;
  const c = scache.get(ck);
  if (c !== undefined) { pSA(false); return c; }
  pSA(true);
  let best: Structure | null = null;
  // an old Steingrube without a position (auto site) yields to anything else on its tile: never overwrites a building
  let autoQuarry: Structure | null = null;
  const tw = pickCfg.lazyTwin ? twinSiteGet(ck, seeds, now) : twinSites(seeds, now).get(ck);
  if (tw) { best = { kind: tw.kind, seed: tw.seed, v: hash(x, y, 5) }; scache.set(ck, best); return best; }
  const pick = picksOf(seeds, now);
  for (const si of pick.sites.get(ck) ?? NO_PICK) {
    const s = seeds[si]!;
    if (now < Date.parse(s.created_at)) continue;
    if (!s.bought?.length) continue;
    const sp = specialSites(s).get(ck);
    if (!sp || now < sp.at || (sp.until != null && now >= sp.until)) continue;
    // the fire-order rack gives way once the fire-hook shed is bought
    if (sp.kind === "firerack" && s.bought.some((b) => b.item === "firehouse" && b.at <= now)) continue;
    if (sp.kind === "square") { best = { kind: "square", seed: s, v: hash(x, y, 5) }; scache.set(ck, best); return best; }
    const mk = sp.mv ? undefined : MONUMENT_BY_KIND.get(sp.kind);
    const mill = sawmillUp(s, seeds, now);
    const p0 = mk ? monumentProgress(s, now, mk) : (workClock(now) - workClock(sp.at)) / (sp.kind === "quarry" ? QUARRY_BUILD : specialBuild(s, mill, sp.at));
    // Freimarkt carpenters may finish a running site early (marketBoost inside specialDone)
    const p = !mk && p0 < 1 && specialDone(s, seeds, sp.at, sp.kind) <= now ? 1 : p0;
    const doneAt = p < 1 ? (mk ? monumentDone(s, seeds, mk) ?? undefined : specialDone(s, seeds, sp.at, sp.kind)) : undefined;
    best = { kind: sp.kind, seed: s, v: hash(x, y, 5), ...(p < 1 ? { build: p, doneAt } : {}) };
    if (sp.auto) { autoQuarry ??= best; best = null; continue; }
    scache.set(ck, best);
    return best;
  }
  if (buildable(terrain(x, y))) {
    let bestD = Infinity;
    for (const si of gridOf(pick, seeds, now).get(Math.floor(y / PICK_CELL) * 65536 + Math.floor(x / PICK_CELL)) ?? NO_PICK) {
      const s = seeds[si]!;
      if (now < Date.parse(s.created_at)) continue;
      const d = townDist(x, y, s);
      // safe prefilter: rb is radiusOf of the grid's bound (effAgeBound or effAgeUpper, both ≥ effAge), radiusOf is monotone, so r ≤ rb; skips only candidates the check below skips too
      if (pickCfg.distPre && (d >= bestD || d > pick.rb![si]! + 0.5)) { pickCfg.preSkips++; continue; }
      const age = effAge(s, seeds, now);
      const r = radiusOf(age);
      if (d > r + 0.5 || d >= bestD) continue;
      const bo: BuildOut = { p: 1, at: 0 };
      let k = forSeed(x, y, s, age, r, d, false, bo, roadOpening(s, seeds, age));
      // watermill displaced by a bridge head moves to its refuge tile on the same shore
      const mr = millRefuge(s, seeds, now);
      if (mr && mr.x === x && mr.y === y && age >= mr.at - buildTime(mr.at)) {
        bo.p = age < mr.at ? 1 - (mr.at - age) / buildTime(mr.at) : 1; bo.at = mr.at; k = "watermill";
      }
      if (k && bo.p < 1 && (FLAT.has(k) || k === "hay" || k === "fence")) continue;
      if (k) {
        let doneAt: number | undefined;
        if (bo.p < 1) {
          // estimate: remaining growth hours ÷ current growth rate (growth hours per real hour)
          const rate = Math.max(0.05, effAge(s, seeds, now + 3.6e6) - age);
          // the stage being built now (seat1 before townhall on one tile), never the tile's last landmark
          doneAt = now + ((bo.at - age) / rate) * 3.6e6;
        }
        best = { kind: k, seed: s, v: hash(x, y, 5), ...(bo.p < 1 ? { build: Math.max(0, bo.p), doneAt } : {}) }; bestD = d;
      }
    }
  }
  // trade roads keep their corridor: fields, gardens and pastures grow around them, never over them;
  // a bridge head (dry road tile next to a water crossing) is never built over, so the bridge always stands
  if (best && best.kind !== "road" && (ROAD_YIELDS.has(best.kind) || bridgeHead(x, y, seeds, now))) {
    const rd = roadAt(x, y, seeds, now);
    if (rd) best = { kind: rd.bridge ? "bridge" : isTwin(rd.link, seeds, now) ? "street" : "road", seed: rd.link.a, v: hash(x, y, 5) };
  }
  if (best && best.build === undefined) {
    const hit = tileHits(best.seed, now).get(ck);
    if (hit?.flood) best = { ...best, flood: true, wet: hit.wet ?? 1 };
    if (hit?.silt) best = { ...best, silt: hit.silt };
    if (hit?.levee) best = { ...best, levee: hit.levee };
    if (hit && canBurn(best.kind)) {
      if (hit.fire) best = { ...best, fire: true };
      else if (hit.build !== undefined) best = { ...best, build: hit.build, ...(hit.burnt ? { burnt: true as const } : {}) };
    }
  }
  // Paint prosperity without changing household capacity or construction history.
  if (best && best.build === undefined && !best.fire && RESIDENTIAL.has(best.kind) && best.seed.user_id) {
    const sh = estateHook?.(best.seed, seeds, now);
    // shares unknown while the rank is being derived: return the unpainted house without caching it
    if (!sh) return best;
    const kind = estateHouse(best.kind, estateOf(sh, x, y));
    if (kind !== best.kind) best = { ...best, homeKind: best.kind, kind };
  }
  if (!best) {
    const rd = roadAt(x, y, seeds, now);
    if (rd) best = { kind: rd.bridge ? "bridge" : isTwin(rd.link, seeds, now) ? "street" : "road", seed: rd.link.a, v: hash(x, y, 5) };
  }
  if (!best && autoQuarry) best = autoQuarry;
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
  if (nearCourt(x, y)) return "court";
  for (const s of seeds) if (Math.hypot(x - s.x, y - s.y) < MIN_SEED_DISTANCE) return `near:${s.name}`;
  return null;
}

// ---------------- trade roads & synergy ----------------
/** Towns closer than this get a deterministic trade road. */
export const TRADE_DIST = 120;
/** Synergy bonus scale keeps its original 80-tile reach, so existing roads keep their bonus; farther roads give the +10 % floor. */
export const BONUS_DIST = 80;
/** Road is founded once the younger town is this many hours old, then built from both ends over ROAD_BUILD hours. */
export const ROAD_AT = 6;
export const ROAD_BUILD = 24;
/** Build time of a decided road in hours: half an hour per tile of distance, at least 8 h (max reach 120 tiles → 60 h). Mirrored by DB road_done. */
export const ROAD_MIN = 8, ROAD_PER_TILE = 0.5, ROAD_MAX = Math.max(ROAD_MIN, Math.round(TRADE_DIST * ROAD_PER_TILE));
export const roadHours = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.max(ROAD_MIN, Math.round(Math.hypot(a.x - b.x, a.y - b.y) * ROAD_PER_TILE));
/** since = start (t0), baseBuild = one-crew build time D, joinAt = effective counter-decision t1 (t0 <= t1 < t0 + D), doneAt = the single finish time. */
export type Link = { a: Seed; b: Seed; d: number; since: number; baseBuild: number; joinAt?: number; doneAt: number; tiles: [number, number][]; water: boolean[] };

let linkKey = "";
let linkCache: Link[] = [];
let roadIdx = new Map<number, { link: Link; i: number }>();
/** A* road geometry per seed pair (positions included): terrain never changes within a map, so a path is computed once. */
const pathCache = new Map<string, { tiles: [number, number][]; water: boolean[]; since: number } | null>();
/** Recent link sets per seed-list key, so alternating callers with different lists never re-derive. */
const linkSets = new Map<string, { links: Link[]; idx: Map<number, { link: Link; i: number }> }>();

function cachedLink(a: Seed, b: Seed, d: number): Link | null {
  const k = `${a.id}:${a.x}:${a.y}:${a.created_at}|${b.id}:${b.x}:${b.y}:${b.created_at}`;
  let p = pathCache.get(k);
  if (p === undefined) {
    const l = buildLink(a, b, d);
    p = l ? { tiles: l.tiles, water: l.water, since: l.since } : null;
    pathCache.set(k, p);
  }
  return p ? { a, b, d, since: p.since, baseBuild: ROAD_BUILD * 3.6e6, doneAt: p.since + ROAD_BUILD * 3.6e6, tiles: p.tiles, water: p.water } : null;
}

/** links() key per seeds array (same immutability assumption as seedsKey): building it was most of structureAt's cost. */
const lkMemo = new WeakMap<Seed[], string>();
export function links(seeds: Seed[]): Link[] {
  syncGeo();
  let key = lkMemo.get(seeds);
  // full content key: roadGate reads user_id, and cached Links hand out their a/b seed objects to callers
  if (key === undefined) { key = `${seeds.map((s) => s.realm ?? "").join(",")}#${seedsKey(seeds)}`; lkMemo.set(seeds, key); }
  if (key === linkKey) return linkCache;
  const hit = linkSets.get(key);
  if (hit) { linkKey = key; linkCache = hit.links; roadIdx = hit.idx; return linkCache; }
  const out = deriveLinks(seeds, nearPairs(seeds));
  const idx = new Map<number, { link: Link; i: number }>();
  for (const l of out) l.tiles.forEach(([x, y], i) => { const k = y * MAP + x; if (!idx.has(k)) idx.set(k, { link: l, i }); });
  if (linkSets.size >= 8) linkSets.delete(linkSets.keys().next().value!);
  linkSets.set(key, { links: out, idx });
  linkKey = key; linkCache = out; roadIdx = idx;
  return linkCache;
}

/**
 * Seed index pairs (i < j) within TRADE_DIST, in exactly the order of the naive double loop
 * (i ascending, then j ascending). A uniform grid with cell size TRADE_DIST limits each seed to
 * its own and the eight neighbouring cells — any pair within TRADE_DIST lies there, so the result
 * equals the naive scan. `stats` counts distance checks (tests/benchmarks only).
 */
export function nearPairs(seeds: Seed[], stats?: { checks: number }): [number, number][] {
  const C = TRADE_DIST, cells = new Map<string, number[]>();
  const cx = new Array<number>(seeds.length), cy = new Array<number>(seeds.length);
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i]!, x = Math.floor(s.x / C), y = Math.floor(s.y / C);
    cx[i] = x; cy[i] = y;
    const k = `${x},${y}`; let c = cells.get(k); if (!c) cells.set(k, (c = [])); c.push(i); // indices ascending
  }
  const out: [number, number][] = [];
  const cand: number[] = [];
  for (let i = 0; i < seeds.length; i++) {
    cand.length = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const c = cells.get(`${cx[i]! + dx},${cy[i]! + dy}`); if (!c) continue;
      for (const j of c) if (j > i) cand.push(j);
    }
    cand.sort((p, q) => p - q);
    const a = seeds[i]!;
    for (const j of cand) {
      const b = seeds[j]!;
      if (stats) stats.checks++;
      if (Math.hypot(a.x - b.x, a.y - b.y) <= TRADE_DIST) out.push([i, j]);
    }
  }
  return out;
}
/** Naive reference scan over all pairs — the specification nearPairs must equal (tests only). */
export function nearPairsNaive(seeds: Seed[], stats?: { checks: number }): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < seeds.length; i++) for (let j = i + 1; j < seeds.length; j++) {
    const a = seeds[i]!, b = seeds[j]!;
    if (stats) stats.checks++;
    if (Math.hypot(a.x - b.x, a.y - b.y) <= TRADE_DIST) out.push([i, j]);
  }
  return out;
}
/** Uncached link derivation with the naive pair scan — reference for tests, never used by the game. */
export function linksReference(seeds: Seed[]): Link[] { syncGeo(); return deriveLinks(seeds, nearPairsNaive(seeds)); }

function deriveLinks(seeds: Seed[], pairs: [number, number][]): Link[] {
  const out: Link[] = [];
  for (const [i, j] of pairs) {
    const a = seeds[i]!, b = seeds[j]!;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d > TRADE_DIST) continue;
    const gate = roadGate(a, b);
    if (gate === null) continue;
    const l = cachedLink(a, b, d);
    // player-decided roads start at the decision itself; only sample pairs wait for ROAD_AT
    if (l) { if (gate !== -Infinity) { const k = roadKinetics(a, b)!; l.since = k.since; l.baseBuild = k.baseBuild; if (k.joinAt !== undefined) l.joinAt = k.joinAt; l.doneAt = k.doneAt; } out.push(l); }
  }
  return out;
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
/**
 * When the road between a and b is finished: one decision is enough (ROAD_BUILD hours); if the other
 * mayor also decides while it is still being built, both crews dig towards each other and the
 * remaining time halves. Null when no road has been decided.
 */
export function roadKinetics(a: Seed, b: Seed, now = Infinity): { since: number; baseBuild: number; joinAt?: number; doneAt: number } | null {
  // earliest decision per party (multiple rows: minimum wins), only decisions taken by `now`
  const first = (x: Seed, y: Seed) => { let t = Infinity; for (const r of x.roads ?? []) if (r.target === y.id && r.at <= now) t = Math.min(t, r.at); return t; };
  const ta = first(a, b), tb = first(b, a), t0 = Math.min(ta, tb), t1 = Math.max(ta, tb);
  if (t0 === Infinity) return null;
  const baseBuild = roadHours(a, b) * 3.6e6, end = t0 + baseBuild;
  return t1 < end ? { since: t0, baseBuild, joinAt: t1, doneAt: t1 + (end - t1) / 2 } : { since: t0, baseBuild, doneAt: end };
}
/** Finish time from all decisions, or (with `now`) only from decisions taken by then. */
export function roadDone(a: Seed, b: Seed, now?: number): number | null {
  return roadKinetics(a, b, now)?.doneAt ?? null;
}
/** A neighbour building a road towards s that s has not joined yet (one decision suffices; joining halves the rest). */
export function roadIncoming(s: Seed, seeds: Seed[], now: number): { from: Seed; done: number } | null {
  for (const o of seeds) {
    if (o.id === s.id || (s.roads ?? []).some((r) => r.target === o.id && r.at <= now)) continue;
    const r = (o.roads ?? []).find((x) => x.target === s.id && x.at <= now);
    const done = r ? roadDone(s, o, now) : null;
    if (r && done && now < done) return { from: o, done };
  }
  return null;
}
/** Neighbours a village may still decide a road to (in reach, not yet connected). */
/** Standard road reach; up to TRADE_DIST only for towns with fewer than two neighbours (connected or not) inside it. Mirrored by DB first_road_guard. */
export const NEAR_ROAD_DIST = 80;
const sameRealm = (a: Seed, b: Seed) => (a.realm ?? "europe") === (b.realm ?? "europe");
/** Reach of new road decisions by s: NEAR_ROAD_DIST, or TRADE_DIST when fewer than two towns lie within NEAR_ROAD_DIST. */
export const roadReach = (s: Seed, seeds: Seed[]) =>
  seeds.filter((o) => o.id !== s.id && sameRealm(s, o) && Math.hypot(o.x - s.x, o.y - s.y) <= NEAR_ROAD_DIST).length < 2 ? TRADE_DIST : NEAR_ROAD_DIST;
/** May s decide a road to o? Within its own reach, or as counter-decision to a road o already decided towards s (up to TRADE_DIST). */
export const roadAllowed = (s: Seed, o: Seed, seeds: Seed[]) => {
  if (o.id === s.id || !sameRealm(s, o)) return false;
  const d = Math.hypot(o.x - s.x, o.y - s.y);
  return d <= roadReach(s, seeds) || (d <= TRADE_DIST && (o.roads ?? []).some((r) => r.target === s.id));
};
/**
 * Longest bridge a NEW trade road may need. River crossings stay short (95 % of sampled roads need at most 4 water tiles,
 * almost all at most 10); longer runs cross open sea and look like a pier across the sea. Existing roads are untouched:
 * buildLink keeps its own rule (at most 6 deep tiles), this limit only filters which new roads are offered.
 */
export const MAX_BRIDGE = 10;
/** Longest run of water tiles on the road path a–b (the same A* and cache as built roads), or null when no road can be built. */
export function roadBridge(a: Seed, b: Seed): number | null {
  const l = cachedLink(a, b, Math.hypot(a.x - b.x, a.y - b.y));
  if (!l) return null;
  let run = 0, max = 0;
  for (const w of l.water) { run = w ? run + 1 : 0; if (run > max) max = run; }
  return max;
}
/** Can a new trade road a–b be built without a sea-crossing bridge? */
export const roadReachable = (a: Seed, b: Seed) => { const r = roadBridge(a, b); return r !== null && r <= MAX_BRIDGE; };
/** New road partners: in reach, no decision yet, and reachable over land or with a river bridge (never across open sea). */
export const roadCandidates = (s: Seed, seeds: Seed[]) =>
  seeds.filter((o) => roadAllowed(s, o, seeds) && roadGate(s, o) === null && roadReachable(s, o))
    .sort((p, q) => Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y));
/** The road this village decided that is still being built (only one at a time), or null. */
export function roadBuilding(s: Seed, now: number, seeds?: Seed[]): { target: string; at: number; done: number } | null {
  for (const r of (s.roads ?? []).filter((x) => x.at <= now && now < x.at + ROAD_MAX * 3.6e6).sort((a, b) => b.at - a.at)) {
    const o = seeds?.find((x) => x.id === r.target), done = o ? roadDone(s, o, now) ?? r.at + roadHours(s, o) * 3.6e6 : r.at + ROAD_BUILD * 3.6e6;
    if (now < done) return { ...r, done };
  }
  return null;
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
  // Distance from the straight line a→b: on open land every staircase is equally long on a
  // 4-connected grid, so a small pull toward the line makes roads run diagonally instead of in an L.
  const lx = bx - ax, ly = by - ay, ll = Math.hypot(lx, ly) || 1;
  const off = (x: number, y: number) => Math.abs((x - ax) * ly - (y - ay) * lx) / ll;
  const cost = (x: number, y: number) => {
    const t = terrain(x, y);
    const pull = Math.min(off(x, y), 12) * 0.12;
    if (t === "deep") return 400;
    if (isWater(t)) return 40 + pull;
    if (t === "mountain") return 250 + pull; // rock massifs: always go round, only cross if truly walled in
    if (t === "hill") return 4 + pull; // prefer valleys and the flat foot of the hills
    if (t === "forest") return 1.8 + pull;
    return 1 + vnoise(x * 0.15, y * 0.15, sn) * 0.25 + pull; // gentle meander
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
  const since = Math.max(Date.parse(a.created_at), Date.parse(b.created_at)) + ROAD_AT * 3.6e6;
  return { a, b, d, since, baseBuild: ROAD_BUILD * 3.6e6, doneAt: since + ROAD_BUILD * 3.6e6, tiles, water };
}

/** 0..1 how much of the road exists. */
export const roadProgress = (l: Link, now: number) => {
  if (now <= l.since) return 0;
  if (now >= l.doneAt) return 1;
  const p = l.joinAt === undefined || now < l.joinAt ? (now - l.since) / l.baseBuild : (l.joinAt - l.since) / l.baseBuild + 2 * (now - l.joinAt) / l.baseBuild;
  return Math.max(0, Math.min(1, p));
};

/** Seed a road tile is credited to (link.a), regardless of build progress — for exact pre-filters only. */
export function roadOwnerAt(x: number, y: number, seeds: Seed[]): string | null {
  links(seeds);
  return roadIdx.get(y * MAP + x)?.link.a.id ?? null;
}
function roadAt(x: number, y: number, seeds: Seed[], now: number) {
  links(seeds);
  const r = roadIdx.get(y * MAP + x);
  if (!r || now < r.link.since) return null;
  const n = r.link.tiles.length, half = n / 2;
  if (Math.min(r.i, n - 1 - r.i) > roadProgress(r.link, now) * half) return null;
  if (!r.link.water[r.i] && !buildable(terrain(x, y))) return null;
  return { link: r.link, i: r.i, bridge: r.link.water[r.i]! };
}

/** On the course of a trade road decided by `now` (built or still to come)? Only for placing bought buildings. */
function onRoadCourse(x: number, y: number, seeds: Seed[], now: number): boolean {
  links(seeds);
  const r = roadIdx.get(y * MAP + x);
  return !!r && now >= r.link.since;
}
export const onRoadCourseForTest = onRoadCourse;

/** Test hook for historical tile occupancy. */
export const roadAtForTest = (x: number, y: number, seeds: Seed[], now: number) => roadAt(x, y, seeds, now);

/** Dry road tile directly beside a finished water crossing of the same trade road. */
function bridgeHead(x: number, y: number, seeds: Seed[], now: number): boolean {
  const r = roadAt(x, y, seeds, now); if (!r || r.bridge) return false;
  const w = r.link.water; return !!(w[r.i - 1] || w[r.i + 1]);
}

const MILL_IDX = LANDMARKS.findIndex((l) => l.kind === "watermill");
const refugeMemo = new Map<string, { x: number; y: number; at: number } | null>();
/**
 * When a finished bridge head occupies the watermill's landmark tile, the mill moves to the nearest
 * free shore tile (dry, buildable, near water, no road, no other landmark). Pure from seeds + clock.
 */
export function millRefuge(s: Seed, seeds: Seed[], now: number): { x: number; y: number; at: number } | null {
  const spots = landmarkSpots(s);
  let key = ""; for (const [k, a] of spots) if (a.includes(MILL_IDX)) { key = k; break; }
  if (!key) return null;
  const [dx, dy] = key.split(",").map(Number) as [number, number];
  const mx = s.x + dx, my = s.y + dy;
  if (!waterNearby(mx, my) || !bridgeHead(mx, my, seeds, now)) return null;
  const ck = `${s.id}:${mx}:${my}:${seedsKey(seeds)}`;
  if (refugeMemo.has(ck)) return refugeMemo.get(ck)!;
  let best: { x: number; y: number; at: number } | null = null, bs = Infinity;
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
    const ox = dx + i, oy = dy + j, x = s.x + ox, y = s.y + oy, k = `${ox},${oy}`;
    if ((!i && !j) || spots.has(k) || CORE[k] || (!ox && !oy) || Math.hypot(ox, oy) < 1.6) continue;
    if (!buildable(terrain(x, y)) || !waterNearby(x, y) || roadOwnerAt(x, y, seeds)) continue;
    const sc = Math.hypot(i, j); if (sc < bs) { bs = sc; best = { x, y, at: LANDMARKS[MILL_IDX]!.at }; }
  }
  if (refugeMemo.size > 200) refugeMemo.clear();
  refugeMemo.set(ck, best); return best;
}

/** Synergy bonus one neighbour gives: +10% .. +25%, more when closer and more mature. */
export function bonusOf(d: number, neighbourAgeH: number) {
  const close = Math.max(0, Math.min(1, (BONUS_DIST - d) / (BONUS_DIST - MIN_SEED_DISTANCE)));
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
/** Towns of different ways (Kornkammer/Werkbank/Tor zur Welt) supply each other: +0.1 trade factor, still capped. */
export const WAY_COMPLEMENT = 0.1;
export const COMPLEMENT_MIN = 0.6, COMPLEMENT_MAX = 1.5, KONTOR_BONUS = 0.15;
/** 0.6 for twins in character, rising to 1.5 for a perfect fit. */
export const complement = (a: Seed, b: Seed) => COMPLEMENT_MIN + (COMPLEMENT_MAX - COMPLEMENT_MIN) * Math.min(4, matches(a, b)) / 4;
/** Trade factor town `s` gets from a road to `o`: complement, +15 % with a Hansekontor era (Handelsstadt+, real age); trade charter lifts the cap. */
export function tradeFactor(s: Seed, o: Seed, now: number) {
  let f = complement(s, o);
  const od = operaDone(s, now);
  if (townCharacter(s).main !== townCharacter(o).main) f += WAY_COMPLEMENT + (od >= 3 ? OPERA_WAY : 0);
  if (stageOf(ageHours(s, now)) >= 4) f += KONTOR_BONUS;
  if (od >= 4) f += OPERA_TRADE;
  const cap = s.charter?.path === "trade" && now > s.charter.at ? 1.75 : COMPLEMENT_MAX;
  return Math.min(cap, f);
}

/** Raw trade rate (sum of all roads, markets, transit and hub routes) before the soft cap. */
function rawTrade(s: Seed, seeds: Seed[], now: number) {
  let trade = 0;
  for (const l of links(seeds)) {
    if (now < l.since || (l.a.id !== s.id && l.b.id !== s.id)) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    trade += bonusOf(seaDist(s, o, l.d, now), ageHours(o, now)) * tradeFactor(s, o, now) * roadProgress(l, now);
    if (roadProgress(l, now) >= 1 && marketHours(now)) trade += MARKET_BONUS;
  }
  for (const r of transitRoutes(s, seeds)) if (now > r.since) trade += r.bonus(now);
  for (const r of hubRoutes(s, seeds)) if (now > r.since) trade += hubBonus(s);
  return trade;
}
/** Growth bonuses split by source (fractions, e.g. 0.1 = +10 %). `trade` is what really counts after the soft cap;
 * `raw` is the full road value, `cap` the town's ceiling and `toll` the wealth the surplus earns. */
export function speedParts(s: Seed, seeds: Seed[], now: number) {
  const bless = isBlessed(s, now) ? BLESS_BONUS : 0;
  const farm = s.charter?.path === "farm" && now > s.charter.at ? FARM_BONUS : 0;
  const raw = rawTrade(s, seeds, now), cap = tradeCapOf(s, now), trade = softTrade(raw, cap);
  return { bless, farm, trade, raw, cap, toll: tollWealth(raw, trade) };
}
/** Current growth speed multiplier: 1 + sum of all bonuses. */
export function speedOf(s: Seed, seeds: Seed[], now: number) {
  const p = speedParts(s, seeds, now);
  return 1 + p.bless + p.farm + p.trade;
}

/** Effective age: real age plus bonus hours accumulated since each road was founded (monotonic, deterministic). */
/** Up to AGE_SLOTS timestamps per seed array (LRU, most recent first), so structureAt's now / now + 1h pairs never evict each other. */
export const AGE_SLOTS = 4;
type AgeSlot = { now: number; m: Map<string, number> };
const ageMemo = new WeakMap<Seed[], AgeSlot[]>();
/** Count of real effAge computations (cache misses); test/benchmark instrumentation only. */
export const ageMemoStats = { misses: 0 };
/** Growth hours the village had at the cutover: openings up to that hour keep the old rule. Infinity while the rule is
 *  off (placeholder date), -1 for a village founded after the cutover. Pure; memoized per seeds array and cutover. */
const settleMemo = new WeakMap<Seed[], { since: number; m: Map<string, number> }>();
export function settledFrom(s: Seed, seeds: Seed[]): number {
  const since = roadSettleCfg.since;
  if (since >= ROAD_SETTLE_OFF) return Infinity;
  if (Date.parse(s.created_at) >= since) return -1;
  let c = settleMemo.get(seeds);
  if (!c || c.since !== since) { c = { since, m: new Map() }; settleMemo.set(seeds, c); }
  let was = c.m.get(s.id);
  if (was === undefined) { was = effAge(s, seeds, since); c.m.set(s.id, was); }
  return was;
}
/** The road opening this village is settling at `age` (roadOpeningAt), unless it had passed that opening by the
 *  cutover (old rule: its houses already stand). */
export function roadOpening(s: Seed, seeds: Seed[], age: number): number | null {
  const t = roadOpeningAt(age);
  return t !== null && t > settledFrom(s, seeds) ? t : null;
}
export function effAge(s: Seed, seeds: Seed[], now: number) {
  let slots = ageMemo.get(seeds);
  if (!slots) { slots = []; ageMemo.set(seeds, slots); }
  let i = 0;
  while (i < slots.length && slots[i]!.now !== now) i++;
  let c: AgeSlot;
  if (i < slots.length) { c = slots[i]!; if (i > 0) { slots.splice(i, 1); slots.unshift(c); } }
  else { c = { now, m: new Map() }; slots.unshift(c); if (slots.length > AGE_SLOTS) slots.pop(); }
  let v = c.m.get(s.id);
  if (v === undefined) { ageMemoStats.misses++; v = effAgeBase(s, seeds, now) + twinHours(s, seeds, now) * GROWTH_PACE; c.m.set(s.id, v); }
  return v;
}
/** Display-only age for drawing (culling radius, overview, robber path): the clock rounded to VIEW_AGE_STEP so every frame
 *  in the window hits the effAge memo. Never use it for growth, tax, rank or anything mirrored by the server. */
export const VIEW_AGE_STEP = 2000;
export const viewAge = (s: Seed, seeds: Seed[], now: number) => effAge(s, seeds, Math.floor(now / VIEW_AGE_STEP) * VIEW_AGE_STEP);
/** Prefilter-only upper bound on effAge for gridOf (never for growth, tax or display): twinHours is 0 unless twinSiteAt
 *  holds, and its per-link rate is at most TWIN_BONUS + max pact + WORK_BONUS + BLESS_BONUS (0.35) since the younger
 *  founding, times GROWTH_PACE. Calls no twinSince, so no bisection. */
export const twinRateMax = () => TWIN_BONUS + Math.max(...Object.values(PACT_GROWTH)) + WORK_BONUS + BLESS_BONUS;
/** Links touching each seed, in links() order (built once per links array). */
const bySeedMemo = new WeakMap<Link[], Map<string, Link[]>>();
export function linksOfSeed(seeds: Seed[], id: string): Link[] {
  const ls = links(seeds); let m = bySeedMemo.get(ls);
  if (!m) { m = new Map(); for (const l of ls) for (const k of [l.a.id, l.b.id]) { const a = m.get(k); if (a) a.push(l); else m.set(k, [l]); } bySeedMemo.set(ls, m); }
  return m.get(id) ?? [];
}
/** Cheap prefilter-only bound on effAge for gridOf; reads only the seed's own rows and its own links (no effAgeBase,
 *  no twinSiteAt, no twinSince). Proof sketch (each step is ≥ the real term):
 *  - careCeiling(v) ≤ v; base is computed exactly (age + bless + boons + farm);
 *  - trade extra = base·softTrade(..) ≤ max(0,base)·max(TRADE_CAP, max OPERA_CEIL_MAX) (tradeCapOf is capped by OPERA_CEIL_MAX);
 *  - mentorHours ≤ min(age, MENTOR_SPAN)·MENTOR_RATE;
 *  - twinHours per link ≤ (TWIN_BONUS + max pact + WORK_BONUS)·H + blessHours(s), with H the hours since the earliest of
 *    the younger founding and every vote/work row of the pair (twinSince, pact `at` and work done are never earlier). */
export function effAgeBound(s: Seed, seeds: Seed[], now: number) {
  const age = ageHours(s, now), bless = blessHours(s, now);
  let base = age + bless + boonHours(s.decisions ?? [], now);
  if (s.charter?.path === "farm" && now > s.charter.at) base += (now - s.charter.at) / 3.6e6 * FARM_BONUS;
  const ceil = Math.max(TRADE_CAP, ...OPERA_CEIL_MAX);
  let h = base + Math.max(0, base) * ceil + Math.min(age, MENTOR_SPAN) * MENTOR_RATE;
  const rate = TWIN_BONUS + Math.max(...Object.values(PACT_GROWTH)) + WORK_BONUS;
  let tw = 0;
  for (const l of linksOfSeed(seeds, s.id)) {
    const o = l.a.id === s.id ? l.b : l.a;
    let t0 = Math.max(Date.parse(l.a.created_at), Date.parse(l.b.created_at));
    for (const r of [...(s.votes ?? []), ...(s.works ?? [])]) if (r.partner === o.id) t0 = Math.min(t0, r.at);
    for (const r of [...(o.votes ?? []), ...(o.works ?? [])]) if (r.partner === s.id) t0 = Math.min(t0, r.at);
    if (now <= t0) continue;
    tw += rate * (now - t0) / 3.6e6 + bless;
  }
  return Math.max(0, h) * GROWTH_PACE + tw * GROWTH_PACE + 1e-6;
}
export function effAgeUpper(s: Seed, seeds: Seed[], now: number) {
  let h = 0;
  for (const l of links(seeds)) {
    if (l.a.id !== s.id && l.b.id !== s.id) continue;
    if (!twinSiteAt(l, seeds, now)) continue;
    h += Math.max(0, (now - Math.max(Date.parse(l.a.created_at), Date.parse(l.b.created_at))) / 3.6e6);
  }
  return effAgeBase(s, seeds, now) + (h > 0 ? twinRateMax() * GROWTH_PACE * h : 0);
}
/** Exact memo of the pure effAgeBase per seed array and timestamp (LRU of BASE_SLOTS timestamps).
 *  One historical rank check (people.ts seatFete) asks the same seed/time pair many times through
 *  gridOf/twinSites → twinSiteAt → touch; the value depends only on (seed rows, seeds array, now), so reuse is bit-identical. */
export const BASE_SLOTS = 16;
const baseMemo = new WeakMap<Seed[], AgeSlot[]>();
/** Test switch: false bypasses the memo (reference path for equality tests). */
export const baseMemoCfg = { on: true, misses: 0 };
function effAgeBase(s: Seed, seeds: Seed[], now: number) {
  if (!baseMemoCfg.on) return effAgeBaseRaw(s, seeds, now);
  let slots = baseMemo.get(seeds);
  if (!slots) { slots = []; baseMemo.set(seeds, slots); }
  let i = 0;
  while (i < slots.length && slots[i]!.now !== now) i++;
  let c: AgeSlot;
  if (i < slots.length) { c = slots[i]!; if (i > 0) { slots.splice(i, 1); slots.unshift(c); } }
  else { c = { now, m: new Map() }; slots.unshift(c); if (slots.length > BASE_SLOTS) slots.pop(); }
  let v = c.m.get(s.id);
  if (v === undefined) { baseMemoCfg.misses++; v = effAgeBaseRaw(s, seeds, now); c.m.set(s.id, v); }
  return v;
}
function effAgeBaseRaw(s: Seed, seeds: Seed[], now: number) {
  let h = ageHours(s, now) + blessHours(s, now) + boonHours(s.decisions ?? [], now);
  if (s.charter?.path === "farm" && now > s.charter.at) h += (now - s.charter.at) / 3.6e6 * FARM_BONUS;
  const base = h;
  for (const l of links(seeds)) {
    if (now < l.since || (l.a.id !== s.id && l.b.id !== s.id)) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    h += bonusOf(seaDist(s, o, l.d, now), ageHours(o, now)) * tradeFactor(s, o, now) * (now - l.since) / 3.6e6;
    // Saturday markets: 8 of 168 hours a week at MARKET_BONUS, spread evenly so growth stays smooth
    h += MARKET_BONUS * (8 / 168) * (now - l.since) / 3.6e6;
  }
  // trade passed on through a neighbour (A–B–C) and transit trade through own hub
  for (const r of transitRoutes(s, seeds)) if (now > r.since) h += r.bonus(now) * (now - r.since) / 3.6e6;
  for (const r of hubRoutes(s, seeds)) if (now > r.since) h += hubBonus(s) * (now - r.since) / 3.6e6;
  // neighbour bonuses: full value up to TRADE_CAP of the town's own age, then a soft curve up to the town's ceiling
  const extra = base > 0 ? base * softTrade(Math.max(0, h - base) / base, tradeCapOf(s, now)) : 0;
  return careCeiling(s, now, (base + extra + mentorHours(s, seeds, now)) * GROWTH_PACE);
}
/** Trade counts in full up to TRADE_CAP; above it, extra trade only approaches the town's ceiling (soft curve, never a wall). */
export const TRADE_CAP = 0.35;
/** Ceiling for every town; trade towns raise it (Tor zur Welt, trade charter, Markthalle) up to TRADE_CEIL_MAX. */
export const TRADE_CEIL = 0.4, CEIL_GATEWAY = 0.05, CEIL_CHARTER = 0.1, CEIL_MARKET = 0.05, TRADE_CEIL_MAX = 0.6;
/** Wegezoll: every 10 points of trade beyond what growth can absorb give TOLL_PER wealth, at most TOLL_MAX. */
export const TOLL_PER = 5, TOLL_MAX = 20;
export function tradeCapOf(s: Seed, now: number) {
  let c = TRADE_CEIL;
  if (s.user_id && townCharacter(s).main === "gateway") c += CEIL_GATEWAY;
  if (s.charter?.path === "trade" && now > s.charter.at) c += CEIL_CHARTER;
  if ((s.bought ?? []).some((b) => b.item === "markethall" && b.at <= now)) c += CEIL_MARKET;
  c += LIGHTHOUSE_CEIL[Math.min(3, lighthouseDone(s, now))]!;
  if (schuettingDone(s, now) >= 3) c += EXCHANGE_CEIL;
  const od = Math.min(4, operaDone(s, now));
  c += OPERA_CEIL[od]!;
  return Math.min(OPERA_CEIL_MAX[od]!, c);
}
/** Effective trade for a raw trade value: unchanged up to TRADE_CAP, then rising ever more slowly towards `cap`. */
export function softTrade(raw: number, cap: number) {
  if (raw <= TRADE_CAP) return raw;
  const room = Math.max(0, cap - TRADE_CAP);
  return room === 0 ? TRADE_CAP : TRADE_CAP + room * (1 - Math.exp(-(raw - TRADE_CAP) / room));
}
export const tollWealth = (raw: number, eff: number) => Math.min(TOLL_MAX, Math.floor(Math.max(0, raw - eff) * 10 + 1e-9) * TOLL_PER);

/** Trade networks: finished roads pass trade on through one middle town at TRANSIT_SHARE of a direct road; the hub earns TRANSIT_HUB per routed pair. */
export const TRANSIT_SHARE = 0.75, TRANSIT_HUB = 0.02;
/** Gateway towns are natural hubs: their transit trade counts GATEWAY_HUB times (character strength). */
export const GATEWAY_HUB = 1.5;
export const hubBonus = (s: Seed) => TRANSIT_HUB * (s.user_id && townCharacter(s).main === "gateway" ? GATEWAY_HUB : 1);
const roadDoneAt = (l: Link) => l.doneAt;
const other = (l: Link, id: string) => (l.a.id === id ? l.b : l.a);
export type Transit = { to: Seed; via: Seed; since: number; d: number; bonus: (now: number) => number };
/** Exact memo of transitRoutes/hubRoutes per seeds array AND per links() result: both are pure in (s, seeds) and read
 *  only the link set and the queried Seed object (keyed by object, so a changed copy never reuses a closure) (no `now`), so a new seeds array or any new link set recomputes. Results are frozen (never mutated). */
type RouteMemo = { ls: Link[]; t: Map<Seed, readonly Transit[]>; h: Map<Seed, readonly { since: number }[]> };
const routeMemo = new WeakMap<Seed[], RouteMemo>();
export const routeMemoCfg = { on: true, transitMisses: 0, hubMisses: 0, hits: 0 };
function routeSlot(seeds: Seed[]): RouteMemo {
  const ls = links(seeds); let m = routeMemo.get(seeds);
  if (!m || m.ls !== ls) { m = { ls, t: new Map(), h: new Map() }; routeMemo.set(seeds, m); }
  return m;
}
export function transitRoutes(s: Seed, seeds: Seed[]): Transit[] {
  if (!routeMemoCfg.on) return transitRoutesRaw(s, seeds);
  const m = routeSlot(seeds); let v = m.t.get(s);
  if (v) routeMemoCfg.hits++; else { routeMemoCfg.transitMisses++; v = Object.freeze(transitRoutesRaw(s, seeds)); m.t.set(s, v); }
  return v as Transit[];
}
export function hubRoutes(s: Seed, seeds: Seed[]): { since: number }[] {
  if (!routeMemoCfg.on) return hubRoutesRaw(s, seeds);
  const m = routeSlot(seeds); let v = m.h.get(s);
  if (v) routeMemoCfg.hits++; else { routeMemoCfg.hubMisses++; v = Object.freeze(hubRoutesRaw(s, seeds)); m.h.set(s, v); }
  return v as { since: number }[];
}
/** Uncached reference (also used by the equality tests). */
export function transitRoutesRaw(s: Seed, seeds: Seed[]): Transit[] {
  const ls = links(seeds), direct = new Set(ls.filter((l) => l.a.id === s.id || l.b.id === s.id).map((l) => other(l, s.id).id));
  const best = new Map<string, Transit>();
  for (const l1 of ls) {
    if (l1.a.id !== s.id && l1.b.id !== s.id) continue;
    const via = other(l1, s.id);
    for (const l2 of ls) {
      if (l2 === l1 || (l2.a.id !== via.id && l2.b.id !== via.id)) continue;
      const to = other(l2, via.id);
      if (to.id === s.id || direct.has(to.id)) continue;
      const since = Math.max(roadDoneAt(l1), roadDoneAt(l2)), d = l1.d + l2.d;
      const prev = best.get(to.id);
      if (prev && prev.since <= since) continue;
      best.set(to.id, { to, via, since, d, bonus: (now) => bonusOf(Math.min(BONUS_DIST, d), ageHours(to, now)) * tradeFactor(s, to, now) * transitShare(s, now) * ((coastal(s) || coastal(via) || coastal(to)) && lighthouseDone(s, now) >= 3 ? LIGHTHOUSE_TRANSIT : 1) });
    }
  }
  return [...best.values()];
}
/** Pairs of neighbours that trade through `s` (not linked directly), with the time both roads stood. */
export function hubRoutesRaw(s: Seed, seeds: Seed[]): { since: number }[] {
  const ls = links(seeds), mine = ls.filter((l) => l.a.id === s.id || l.b.id === s.id), out: { since: number }[] = [];
  for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) {
    const a = other(mine[i]!, s.id), b = other(mine[j]!, s.id);
    if (ls.some((l) => (l.a.id === a.id && l.b.id === b.id) || (l.a.id === b.id && l.b.id === a.id))) continue;
    out.push({ since: Math.max(roadDoneAt(mine[i]!), roadDoneAt(mine[j]!)) });
  }
  return out;
}

/** System C (care gate): bought infrastructure a player town needs before each later era (Kleinstadt, Handelsstadt, Hansestadt).
 * It checks purchases only — never larder stock or momentary supply — and caps further expansion, never existing households.
 * CARE_FOOD = "Versorgung" (four FOOD_CRAFTS plus market hall and guild hall, broader on purpose);
 * CARE_HEALTH = "Gemeinwesen" (herb hut, healer, library, plus careHealthExtra); from gemeinwesenSince any of the five
 * Gemeinwesen count, without a cap (gemeinwesen.ts gemeinwesenGate). */
export const CARE_FOOD: string[] = [...FOOD_CRAFTS, "markethall", "guildhall"], CARE_HEALTH = ["herbs", "healer", "library"];
export const CARE_NEED: [number, number][] = [[1, 0], [2, 1], [3, 2]];
/** Highest growth stage a town may reach with the care bought by `now` (sample towns are never gated). */
export function careStage(s: Seed, now: number) {
  if (!s.user_id) return 5;
  const own = new Set((s.bought ?? []).filter((b) => b.at <= now).map((b) => b.item));
  const f = CARE_FOOD.filter((i) => own.has(i)).length + careFoodExtra(s, now), hl = gemeinwesenGate(s.realm, own, now) + careHealthExtra(s, now, own);
  let st = 2;
  for (const [nf, nh] of CARE_NEED) { if (f >= nf && hl >= nh) st++; else break; }
  return st;
}
/** What the next care step still lacks: how many more food and health crafts, and which ones are not yet bought. */
export function careMissing(s: Seed, now: number) {
  const st = careStage(s, now), need = CARE_NEED[st - 2];
  if (!need) return null;
  const own = new Set((s.bought ?? []).filter((b) => b.at <= now).map((b) => b.item));
  const f = CARE_FOOD.filter((i) => own.has(i)).length + careFoodExtra(s, now), hl = gemeinwesenGate(s.realm, own, now) + careHealthExtra(s, now, own);
  const healthOffer: readonly string[] = gemeinwesenActive(s.realm, now) ? GEMEINWESEN : CARE_HEALTH;
  return { stage: st, food: Math.max(0, need[0] - f), health: Math.max(0, need[1] - hl),
    foodItems: CARE_FOOD.filter((i) => !own.has(i)), healthItems: healthOffer.filter((i) => !own.has(i)) };
}
/** Soft ceiling: a neglected town levels off just below the next era and resumes as soon as care is bought. */
function careCeiling(s: Seed, now: number, v: number) {
  const st = careStage(s, now);
  if (st >= 5) return v;
  const ceil = STAGES[st + 1]!.from, c0 = ceil * 0.9;
  if (v <= c0) return v;
  return c0 + (ceil - c0 - 1) * (1 - Math.exp(-(v - c0) / (ceil * 0.3)));
}
/** Global pace: a town with typical neighbours reaches Hansestadt after ~2 real years. */
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
      seed: o, factor: tradeFactor(s, o, now), bonus: bonusOf(seaDist(s, o, l.d, now), ageHours(o, now)) * tradeFactor(s, o, now),
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
/** Each side pays this half (Mark); mirrors the database guard. */
export const TWIN_WORKS: Record<WorkKind, number> = { bridge: 200, hall: 300, tower: 250 };
export const TWIN_BONUS = 0.1, PACT_WAIT = 7 * 864e5, WORK_BUILD = 48 * 3.6e6, WORK_BONUS = 0.05;
export const PACT_GROWTH: Record<PactKind, number> = { trade: 0.1, shield: 0, culture: 0.05 };
const WORK_KIND: Record<WorkKind, Kind> = { bridge: "gatehouse", hall: "markethall", tower: "church" };
const pairHash = (l: Link) => hash(l.a.x + l.b.x, l.a.y + l.b.y, 21);

/** twinSince results per world content (realm list + seedsKey, the same full key as links()), so new Seed[] instances
 *  of an identical historical state reuse them; any change to growth inputs yields a new key. Bounded LRU:
 *  SINCE_MAX covers a 7-day treasury batch plus live map/solo sets with headroom. */
export const SINCE_MAX = 128;
const sinceStore = new Map<string, Map<string, number | null>>();
const sinceMemo = new WeakMap<Seed[], Map<string, number | null>>();
export const sinceStats = { calls: 0, hits: 0, misses: 0, size: () => sinceStore.size };
function sinceMap(seeds: Seed[]) {
  let m = sinceMemo.get(seeds);
  if (m) return m;
  const key = `${seeds.map((s) => s.realm ?? "").join(",")}#${seedsKey(seeds)}`;
  m = sinceStore.get(key);
  if (m) sinceStore.delete(key);
  else { m = new Map(); if (sinceStore.size >= SINCE_MAX) sinceStore.delete(sinceStore.keys().next().value!); }
  sinceStore.set(key, m); sinceMemo.set(seeds, m);
  return m;
}
/** First moment (minute precision) the outskirts of both towns touch; null if not within three years. Pure. */
export function twinSince(l: Link, seeds: Seed[]): number | null {
  const m = sinceMap(seeds); sinceStats.calls++;
  const k = `${l.a.id}|${l.b.id}`;
  if (m.has(k)) { sinceStats.hits++; return m.get(k)!; }
  sinceStats.misses++;
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
  if (!twinSiteAt(l, seeds, now)) return false; // no touch yet ⇒ twinSince > now (monotone R), skips the bisection
  const t = twinSince(l, seeds);
  return t !== null && now >= t;
}
export function twinLinks(s: Seed, seeds: Seed[], now: number) {
  return links(seeds).filter((l) => (l.a.id === s.id || l.b.id === s.id) && isTwin(l, seeds, now));
}
const latest = <T extends { partner: string | null; at: number }>(xs: T[] | undefined, id: string, now: number) =>
  (xs ?? []).filter((v) => v.partner === id && v.at <= now).sort((a, b) => b.at - a.at)[0];

/** Agreed pact between two twins, derived from both votes; sample towns follow the player, silence for 7 days adopts the partner's choice. */
export function pactOf(s: Seed, o: Seed, seeds: Seed[], now: number): { kind: PactKind; at: number } | null {
  const l = links(seeds).find((k) => (k.a.id === s.id && k.b.id === o.id) || (k.a.id === o.id && k.b.id === s.id));
  if (!l) return null;
  if (!twinSiteAt(l, seeds, now)) return null;
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
    if (!twinSiteAt(l, seeds, now)) continue;
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
/** Direct point-in-time twin check for twinSites only (same bounds as twinSince: not before the younger town's founding,
 *  and a pair that has not touched within three years never becomes a twin later). Because R(t) grows monotonically,
 *  this equals isTwin except in the accepted window between the exact touch and twinSince's minute round-up, where the
 *  gate sites may appear earlier: below 2 min (bisection stops at a 60 s bracket, then rounds up to the minute). twinSince/isTwin stay the reference for every other mechanic. */
export function twinSiteAt(l: Link, seeds: Seed[], now: number) {
  const lo = Math.max(Date.parse(l.a.created_at), Date.parse(l.b.created_at)), hi = lo + 3 * 365 * 864e5;
  if (now < lo) return false;
  const touch = (t: number) => radiusOf(effAgeBase(l.a, seeds, t)) + radiusOf(effAgeBase(l.b, seeds, t)) >= l.d;
  return now > hi ? touch(hi) : touch(now);
}
/** Gate square, border well, market stalls and the joint building on the twin road's midpoint. Pure. */
const siteMemo = new WeakMap<Seed[], { key: number; map: Map<number, { kind: Kind; seed: Seed }> }>();
export function twinSites(seeds: Seed[], now: number) {
  const key = cacheTick(now), c = siteMemo.get(seeds);
  if (c && c.key === key) return c.map;
  const map = new Map<number, { kind: Kind; seed: Seed }>();
  for (const l of links(seeds)) {
    if (l.tiles.length < 7 || !twinSiteAt(l, seeds, now)) continue;
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
/** Regional twin sites: links indexed by midpoint cell; a tile's entry only comes from links whose midpoint lies within
 *  2 tiles, so a cell is evaluated from the neighbouring midpoints in links() order (same last-writer as twinSites).
 *  Per seeds array an LRU of TW_SLOTS ticks, each reusing the first `now` of its tick like twinSites. */
const TW_CELL = 8, TW_SLOTS = 16;
const midMemo = new WeakMap<Link[], Map<number, number[]>>();
const twLazy = new WeakMap<Seed[], { key: number; now: number; cells: Map<number, Map<number, { kind: Kind; seed: Seed }>> }[]>();
export function twinSiteGet(ck: number, seeds: Seed[], now: number) {
  const ls = links(seeds);
  let mid = midMemo.get(ls);
  if (!mid) {
    const mm = new Map<number, number[]>(); mid = mm;
    ls.forEach((l, i) => { if (l.tiles.length < 7) return; const [x, y] = l.tiles[Math.floor(l.tiles.length / 2)]!;
      const k = Math.floor(y / TW_CELL) * 65536 + Math.floor(x / TW_CELL); const a = mm.get(k); if (a) a.push(i); else mm.set(k, [i]); });
    midMemo.set(ls, mm);
  }
  const key = cacheTick(now);
  let slots = twLazy.get(seeds); if (!slots) { slots = []; twLazy.set(seeds, slots); }
  let si = slots.findIndex((c) => c.key === key), slot;
  if (si < 0) { slot = { key, now, cells: new Map() }; slots.unshift(slot); if (slots.length > TW_SLOTS) slots.pop(); }
  else { slot = slots[si]!; if (si > 0) { slots.splice(si, 1); slots.unshift(slot); } }
  const x = ck % MAP, y = Math.floor(ck / MAP), cx = Math.floor(x / TW_CELL), cy = Math.floor(y / TW_CELL), cell = cy * 65536 + cx;
  let map = slot.cells.get(cell);
  if (!map) {
    map = new Map(); pickCfg.twinCells++;
    const t = slot.now, idx: number[] = [];
    for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) for (const i of mid.get(yy * 65536 + xx) ?? []) idx.push(i);
    idx.sort((a, b) => a - b);
    const x0 = cx * TW_CELL, y0 = cy * TW_CELL;
    for (const i of idx) {
      const l = ls[i]!; pickCfg.twinLinks++;
      if (!twinSiteAt(l, seeds, t)) continue;
      const m = Math.floor(l.tiles.length / 2);
      const put = (j: number, kind: Kind, dx = 0, dy = 0) => {
        const tt = l.tiles[j]; if (!tt || l.water[j]) return;
        const px = tt[0] + dx, py = tt[1] + dy;
        if (px < x0 || px >= x0 + TW_CELL || py < y0 || py >= y0 + TW_CELL) return;
        if (dx || dy) { if (!buildable(terrain(px, py))) return; }
        map!.set(py * MAP + px, { kind, seed: j < m ? l.a : l.b });
      };
      put(m, "well"); put(m - 1, "square"); put(m + 1, "square");
      if (marketHours(t)) { put(m - 2, "market"); put(m + 2, "market"); }
      const w = workOf(l.a, l.b, t);
      if (w.work && w.done !== null && t >= w.done) {
        const [ax, ay] = l.tiles[m - 1]!, [bx, by] = l.tiles[m + 1]!;
        const px = -Math.sign(by - ay) * 2, py = Math.sign(bx - ax) * 2;
        put(m, WORK_KIND[w.work], px || 2, py);
      }
    }
    slot.cells.set(cell, map);
  }
  return map.get(ck);
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
  const day = worldDayStart(now);
  return last >= day ? day + 24 * 3.6e6 - now : 0;
}

// ---------------- signposts on trade roads ----------------
export type Signpost = { id: string; seed_id: string; target_id: string; user_id: string; message: string };
/** Road tile where a town's signpost towards a neighbour stands: a few steps out of town along the road. */
export function signTile(seeds: Seed[], fromId: string, toId: string, now = clock()): [number, number] | null {
  const l = links(seeds).find((k) => (k.a.id === fromId && k.b.id === toId) || (k.b.id === fromId && k.a.id === toId));
  if (!l || l.tiles.length < 4) return null;
  const from = l.a.id === fromId ? l.a : l.b;
  // the post moves out with the town edge: just beyond the current reach, at most 40 % of the way
  const order = l.a.id === fromId ? l.tiles : [...l.tiles].reverse();
  const edge = Math.ceil(reachOf(from, radiusOf(effAge(from, seeds, now)))) + 2;
  const span = Math.hypot(l.a.x - l.b.x, l.a.y - l.b.y);
  const dist = Math.max(6, Math.min(edge, span * 0.4));
  const i = order.findIndex(([x, y]) => Math.hypot(x - from.x, y - from.y) >= dist);
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
  if (d > (kind === "fishery" ? Math.max(16, reach + 12) : Math.max(4, reach))) return "far";
  // the village well/campfire itself is occupied, not "far"
  if (d < 1) return "taken";
  // woodland is cleared for a bought building: its trees are simply not drawn under a structure
  const tt = terrain(x, y);
  if (!buildable(tt)) return "ground";
  // the whole course of a decided trade road stays free, also the part not yet built: a building put there would cut it
  if (onRoadCourse(x, y, seeds, now)) return "road";
  const st = structureAt(x, y, seeds, now);
  const agri = (k?: Kind) => k === "field" || k === "pasture" || k === "garden";
  if (st && !agri(st.kind)) return "taken";
  // 2×2 ensembles: the three tiles behind the front tile must be free ground too
  if (FOOT2.has(kind)) for (const [i, j] of FOOT2_BACK) {
    const xx = x + i, yy = y + j, t2 = terrain(xx, yy);
    if (!buildable(t2)) return "ground";
    if (onRoadCourse(xx, yy, seeds, now)) return "road";
    const b = structureAt(xx, yy, seeds, now);
    if (b && !agri(b.kind)) return "taken";
  }
  // 2×2 ensembles paint beyond their diamond: keep one free ring between them and any other bought building
  if (bigClash(kind, x, y, seeds)) return "taken";
  // ...and the tiles right behind it free of houses and roads: the courtyard sprite paints most of its height over them,
  // so a house or road there looks built over (it paints nothing in front, so the front ring stays usable)
  if (FOOT2.has(kind)) for (const [i, j] of FOOT2_RING_BACK) {
    const xx = x + i, yy = y + j;
    if (onRoadCourse(xx, yy, seeds, now)) return "ring";
    const b = structureAt(xx, yy, seeds, now);
    // the ensemble's own old site (a relocation) and other bought sites are bigClash's business
    if (b && !agri(b.kind) && b.kind !== kind && b.kind !== "square") return "ring";
  }
  // the fisher belongs at the water: a carp pond only where the village cannot place the hut on any shore spot
  if (kind === "fishery" && !waterBeside(x, y) && shoreSpotFor(item, s, seeds, now)) return "shore";
  // the carp pond must not cover a standing building (it would be hidden yet still block the way)
  if (kind === "fishery" && !waterBeside(x, y)) { const p = pondSpot(x, y); if (p) { const b = structureAt(p[0], p[1], seeds, now); if (b && !agri(b.kind)) return "taken"; } }
  // away from water the fisher digs a carp pond beside his hut, so it needs one free neighbour tile
  if (kind === "fishery" && !waterBeside(x, y) && !pondSpot(x, y)) return "shore";
  return null;
}

/** Ring tiles behind a 2×2 ensemble (front tile at 0,0; footprint −1..0): the back column and row. Measured on the four
 *  ensemble sprites, these carry most of the painted area outside the footprint; the front ring carries none. */
export const FOOT2_RING_BACK: readonly (readonly [number, number])[] = [[-2, -2], [-2, -1], [-2, 0], [-1, -2], [0, -2]];
/** Tiles of a placement (2×2 for ensembles) and their one-tile ring; a clash when another bought site of a different kind
 * sits in the ring of a 2×2 ensemble — so wide courtyard sprites never paint over a neighbouring bought house. */
function bigClash(kind: Kind, x: number, y: number, seeds: Seed[]): boolean {
  const big = FOOT2.has(kind);
  const x0 = big ? x - 2 : x - 1, y0 = big ? y - 2 : y - 1, x1 = x + 1, y1 = y + 1;
  for (const o of seeds) {
    if (!o.bought?.length) continue;
    for (const [k, v] of specialSites(o)) {
      if (v.until != null || v.kind === kind) continue;
      const sx = k % MAP, sy = Math.floor(k / MAP);
      if (sx < x0 || sx > x1 || sy < y0 || sy > y1) continue;
      // a plain building only clashes with a 2×2 ensemble (its front tile or its paved back tiles)
      if (big || FOOT2.has(v.kind) || v.kind === "square") return true;
    }
  }
  return false;
}
const shoreMemo = new Map<string, boolean>();
/** Whether `item` (a fishery) could stand on some shore tile (water within 2) inside its placement reach right now (per map).
 *  Only shore tiles are tried, and for them canPlaceSpecial never comes back here. Memoized per map, minute and seed set. */
function shoreSpotFor(item: string, s: Seed, seeds: Seed[], now: number): boolean {
  const key = `${item}|${s.id}|${realmGen()}|${cacheTick(now)}|${seedsKey(seeds)}`; // realmGen: terrain is per map
  const hit = shoreMemo.get(key); if (hit !== undefined) return hit;
  const R = Math.ceil(Math.max(16, radiusOf(effAge(s, seeds, now)) + 2 + 12)) + 2;
  let found = false;
  for (let dy = -R; dy <= R && !found; dy++) for (let dx = -R; dx <= R && !found; dx++) {
    const x = s.x + dx, y = s.y + dy;
    if (!waterBeside(x, y)) continue;
    if (canPlaceSpecial(item, x, y, s, seeds, now) === null) found = true;
  }
  if (shoreMemo.size > 64) shoreMemo.clear();
  shoreMemo.set(key, found); return found;
}
const waterBeside = (x: number, y: number) => {
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (isWater(terrain(x + i, y + j))) return true;
  return false;
};
/** Neighbour tile of a dry-land fishery where its dug carp pond lies; pure function of the hut tile. */
function pondSpot(x: number, y: number): [number, number] | null {
  const nb: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const o = Math.floor(hash(x, y, 4711) * 4);
  for (let k = 0; k < 4; k++) {
    const [i, j] = nb[(o + k) % 4]!, t = terrain(x + i, y + j);
    if (buildable(t) && t !== "forest") return [x + i, y + j];
  }
  return null;
}
const pondCache = new Map<string, Set<number>>();
/** Carp-pond tiles of every fishery that stands away from water (Karpfenteich) — derived, never stored. */
export function pondTiles(seeds: Seed[]): Set<number> {
  const key = seedsKey(seeds); const hit = pondCache.get(key); if (hit) return hit;
  const out = new Set<number>();
  for (const s of seeds) for (const [k, v] of specialSites(s)) {
    // a hut moved away (until) no longer has its pond: only the rebuilt hut digs a new one
    if (v.kind !== "fishery" || v.until != null) continue;
    const x = k % MAP, y = Math.floor(k / MAP);
    if (waterBeside(x, y)) continue;
    const p = pondSpot(x, y); if (p) out.add(p[1] * MAP + p[0]);
  }
  if (pondCache.size > 20) pondCache.clear();
  pondCache.set(key, out);
  return out;
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
setMonumentHook((s, at, key) => monumentProgress(s, at, key as MonumentKey) >= 1);
/** Test-only read access to two internal functions (twin regression tests compare against the pre-P.8d reference). Never call from game code. */
export const __twinTestHooks = { effAgeBase, twinHours };
