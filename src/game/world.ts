// Pure, deterministic world + town growth logic (shared by every player).
export const MAP = 512;

export type Seed = { id: string; name: string; owner: string; x: number; y: number; hue: number; created_at: string };
export type Planting = { id: string; seed_id: string; kind: "tree" | "flower" | "lantern"; x: number; y: number; created_at: string };

export function hash(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function vnoise(x: number, y: number, s: number) {
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

export const ageHours = (s: Seed, now: number) => Math.max(0, (now - Date.parse(s.created_at)) / 3.6e6);
/** Town radius in tiles: grows with the square root of age — slow, forever. */
export const radiusOf = (hours: number) => 2 + 0.9 * Math.sqrt(hours);

export type Structure =
  | { kind: "plaza"; seed: Seed }
  | { kind: "road"; seed: Seed }
  | { kind: "house"; seed: Seed; level: number; v: number }
  | { kind: "field"; seed: Seed; v: number };

export function structureAt(x: number, y: number, seeds: Seed[], now: number): Structure | null {
  const t = terrain(x, y);
  if (!buildable(t)) return null;
  let best: Structure | null = null, bestD = Infinity;
  for (const s of seeds) {
    const dx = x - s.x, dy = y - s.y;
    const d = Math.hypot(dx, dy);
    const age = ageHours(s, now);
    const r = radiusOf(age);
    if (d > r || d >= bestD) continue;
    let st: Structure | null = null;
    if (d < 1.5) st = { kind: "plaza", seed: s };
    else {
      const road = ((dx % 5) + 5) % 5 === 0 || ((dy % 5) + 5) % 5 === 0;
      if (road && d < r - 0.5) st = { kind: "road", seed: s };
      else if (!road) {
        const birth = Math.pow(Math.max(0, d - 2) / 0.9, 2) * (0.7 + 0.6 * hash(x, y, 3));
        const density = 0.7 - 0.4 * (d / Math.max(r, 1));
        if (age >= birth && hash(x, y, 2) < density) {
          const outer = d > r * 0.72 && d > 6;
          st = outer && hash(x, y, 4) < 0.6
            ? { kind: "field", seed: s, v: hash(x, y, 6) }
            : { kind: "house", seed: s, level: Math.min(3, 1 + Math.floor((age - birth) / 96)), v: hash(x, y, 5) };
        }
      }
    }
    if (st) { best = st; bestD = d; }
  }
  return best;
}

export function townStats(s: Seed, now: number) {
  const age = ageHours(s, now);
  const r = radiusOf(age);
  let houses = 0, people = 0;
  for (let y = Math.floor(s.y - r); y <= s.y + r; y++)
    for (let x = Math.floor(s.x - r); x <= s.x + r; x++) {
      const st = structureAt(x, y, [s], now);
      if (st?.kind === "house") { houses++; people += st.level * 2 + 1; }
    }
  return { age, radius: r, houses, people };
}

export function canPlant(x: number, y: number, seeds: Seed[]): string | null {
  if (!buildable(terrain(x, y))) return "Hier ist kein festes Land.";
  for (const s of seeds) if (Math.hypot(x - s.x, y - s.y) < 24) return `Zu nah an ${s.name}.`;
  return null;
}
