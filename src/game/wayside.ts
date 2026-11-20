/** Wayside encounters on the mayor's stroll: pure placement from (map cell, time window); only "met" marks live in browser storage.
 *  Purely atmospheric — no money, growth, tax or settlers are touched. */
import { hash, terrain, isWater, townDist, radiusOf, effAge } from "./world";
import type { Seed } from "./world";

export type WayFig = "walker" | "cart" | "rider" | "deer" | "boar";
export type WayTree = "talk" | "beast";
export const WAYSIDE = {
  pilger: { fig: "walker", tree: "talk" }, spielmann: { fig: "walker", tree: "talk" }, kraemer: { fig: "walker", tree: "talk", carry: "bundle" },
  moench: { fig: "walker", tree: "talk" }, torf: { fig: "walker", tree: "talk", carry: "log" }, schaefer: { fig: "walker", tree: "talk" },
  landsknecht: { fig: "walker", tree: "talk" }, kraeuter: { fig: "walker", tree: "talk", carry: "bundle" }, fuhrmann: { fig: "cart", tree: "talk" },
  salzfuhre: { fig: "cart", tree: "talk" }, bote: { fig: "rider", tree: "talk" }, brief: { fig: "walker", tree: "talk" },
  deichbauer: { fig: "walker", tree: "talk" }, jaeger: { fig: "walker", tree: "talk" }, hirtenkind: { fig: "walker", tree: "talk" },
  koehler: { fig: "walker", tree: "talk", carry: "log" }, scholar: { fig: "walker", tree: "talk", carry: "bundle" },
  hirschkalb: { fig: "deer", tree: "beast" }, frischling: { fig: "boar", tree: "beast" }, rothirsch: { fig: "deer", tree: "beast" }, bache: { fig: "boar", tree: "beast" },
} as const satisfies Record<string, { fig: WayFig; tree: WayTree; carry?: "bundle" | "log" }>;
export type WayKey = keyof typeof WAYSIDE;
export const WAY_KEYS = Object.keys(WAYSIDE) as WayKey[];
/** Dialogue graph: each node lists the follow-up nodes; leaving is always possible on top. */
export const WAY_GRAPH: Record<WayTree, Record<string, string[]>> = {
  talk: { start: ["a", "b"], a: ["a1"], b: ["b1"], a1: [], b1: [] },
  beast: { start: ["a", "b"], a: [], b: [] },
};
export const WAY_CELL = 28, WAY_WINDOW_H = 3, WAY_CHANCE = 0.35, WAY_PAUSE_H = 4, WAY_REPEAT_D = 14, WAY_SEE = 16;
const H = 3600e3;

export type WayMemory = { last: number; met: Partial<Record<WayKey, number>> };
export type Wayside = { key: WayKey; x: number; y: number; id: string };

/** The encounter waiting near the strolling mayor, or null (rare: cooldown, chance per cell and window, no repeats for 14 days). */
export function waysideNear(mx: number, my: number, now: number, mem: WayMemory, ok: (x: number, y: number) => boolean): Wayside | null {
  if (now - mem.last < WAY_PAUSE_H * H) return null;
  const w = Math.floor(now / (WAY_WINDOW_H * H));
  const cx0 = Math.floor(mx / WAY_CELL), cy0 = Math.floor(my / WAY_CELL);
  let best: Wayside | null = null, bd = Infinity;
  for (let cy = cy0 - 1; cy <= cy0 + 1; cy++) for (let cx = cx0 - 1; cx <= cx0 + 1; cx++) {
    if (hash(cx * 7 + w, cy * 13 - w, 911) >= WAY_CHANCE) continue;
    const fresh = WAY_KEYS.filter((k) => now - (mem.met[k] ?? -Infinity) >= WAY_REPEAT_D * 24 * H);
    if (!fresh.length) continue;
    const key = fresh[Math.floor(hash(cx, cy, 917 + w) * fresh.length) % fresh.length]!;
    const x = cx * WAY_CELL + 3 + Math.floor(hash(cx, cy, 919 + w) * (WAY_CELL - 6)), y = cy * WAY_CELL + 3 + Math.floor(hash(cx, cy, 923 + w) * (WAY_CELL - 6));
    const d = Math.hypot(x - mx, y - my);
    if (d > WAY_SEE || d >= bd || !ok(x, y)) continue;
    best = { key, x, y, id: `${w}:${cx}:${cy}` }; bd = d;
  }
  return best;
}

/** Open land outside every town's reach: no water, no mountain. */
export function freeLand(x: number, y: number, seeds: Seed[], now: number) {
  const tr = terrain(x, y);
  if (isWater(tr) || tr === "mountain") return false;
  for (const s of seeds) {
    if (Math.abs(s.x - x) > 90 || Math.abs(s.y - y) > 90) continue;
    if (townDist(x, y, s) <= radiusOf(effAge(s, seeds, now)) + 4) return false;
  }
  return true;
}

const MEM_KEY = "samenland-wayside";
export function readWayMem(uid: string | null): WayMemory {
  try { const v = JSON.parse(localStorage.getItem(`${MEM_KEY}:${uid ?? ""}`) ?? "null"); if (v && typeof v.last === "number") return v; } catch { /* storage blocked */ }
  return { last: 0, met: {} };
}
export function markMet(uid: string | null, key: WayKey, now: number): WayMemory {
  const m = readWayMem(uid); m.last = now; m.met[key] = now;
  try { localStorage.setItem(`${MEM_KEY}:${uid ?? ""}`, JSON.stringify(m)); } catch { /* storage blocked */ }
  return m;
}
