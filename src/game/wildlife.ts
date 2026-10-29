/**
 * Free game and the hunt around a hunter's lodge — a pure function of the lodge tile, the free-ground
 * predicate and the shared clock. Nothing is stored, so every client sees the same deer and the same hunt.
 * Positions are in tile coordinates (floats); the renderer converts them to screen space.
 */
import { hash } from "./world";

export type Free = (x: number, y: number) => boolean;
export type BeastState = "walk" | "graze" | "root" | "flee" | "dead";
export type Beast = { boar: boolean; x: number; y: number; state: BeastState; flip: boolean; alpha: number; fall: number; dist: number };
export type HunterPose = { x: number; y: number; frame: 0 | 1 | 2 | 3; flip: boolean; walk: boolean };
export type HuntScene = { beasts: Beast[]; hunter: HunterPose | null; bolt: { from: [number, number]; to: [number, number]; r: number } | null };

export const HUNT_CYCLE = 11 * 60000;
const STEP = 70000; // an animal changes its grazing spot about every 70 s
const R_MIN = 3, R_MAX = 8;

/** Free natural tiles in a ring around the lodge whose 3x3 neighbourhood is mostly free too (room to roam). */
export function huntGrounds(lx: number, ly: number, free: Free): [number, number][] {
  const out: [number, number][] = [];
  for (let dy = -R_MAX; dy <= R_MAX; dy++) for (let dx = -R_MAX; dx <= R_MAX; dx++) {
    const d = Math.hypot(dx, dy); if (d < R_MIN || d > R_MAX) continue;
    const x = lx + dx, y = ly + dy; if (!free(x, y)) continue;
    let n = 0; for (const [a, b] of NB) if (free(x + a, y + b)) n++;
    if (n >= 6) out.push([x, y]);
  }
  return out;
}
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const;

/** Spot of animal i in time window w: its home tile or a free neighbour of it, so every path stays on open ground. */
function spot(home: [number, number], sd: number, i: number, w: number, free: Free): [number, number] {
  const opts: [number, number][] = [home];
  for (const [a, b] of NB) if (free(home[0] + a, home[1] + b)) opts.push([home[0] + a, home[1] + b]);
  const o = opts[Math.floor(hash(sd + i * 17, w, 61) * opts.length)]!;
  return [o[0] + (hash(sd, w * 3 + i, 62) - 0.5) * 0.5, o[1] + (hash(sd, w * 3 + i, 63) - 0.5) * 0.5];
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => k * k * (3 - 2 * k);
/** Screen-space facing of a tile-space move (iso x = tx - ty). */
const faceLeft = (dx: number, dy: number) => dx - dy < 0;

export function huntScene(lx: number, ly: number, sd: number, now: number, free: Free, grounds = huntGrounds(lx, ly, free)): HuntScene {
  const empty: HuntScene = { beasts: [], hunter: null, bolt: null };
  if (grounds.length < 3) return empty;
  const n = now + hash(sd, 3, 41) * HUNT_CYCLE, cyc = Math.floor(n / HUNT_CYCLE), k = (n % HUNT_CYCLE) / HUNT_CYCLE;
  const count = 2 + (hash(sd, 5, 42) < 0.5 ? 1 : 0);
  const homes = Array.from({ length: count }, (_, i) => grounds[Math.floor(hash(sd + i * 31, Math.floor(now / 864e5), 43) * grounds.length)]!);
  const target = 0; // animal 0 is always a deer and the one the hunter stalks
  const beasts: Beast[] = [];
  let tgt: [number, number] = homes[0]!;
  const cycStart = cyc * HUNT_CYCLE - hash(sd, 3, 41) * HUNT_CYCLE;
  homes.forEach((home, i) => {
    const boar = i > 0 && hash(sd, i, 44) < 0.45;
    const t = now + i * 23000, w = Math.floor(t / STEP), f = (t % STEP) / STEP;
    const a = spot(home, sd, i, w, free), b = spot(home, sd, i, w + 1, free);
    const mv = f > 0.8 ? ease((f - 0.8) / 0.2) : 0; // graze most of the window, then amble to the next spot
    let x = lerp(a[0], b[0], mv), y = lerp(a[1], b[1], mv);
    let state: BeastState = mv > 0 && mv < 1 ? "walk" : boar && hash(sd, w + i, 45) < 0.6 ? "root" : "graze";
    let flip = faceLeft(b[0] - a[0], b[1] - a[1]), alpha = 1, fall = 0;
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]) * mv * 12;
    if (i === target) {
      // during the stalk the deer stays where it grazed when the hunter set out
      const ts = cycStart + 0.3 * HUNT_CYCLE, ws = Math.floor((ts + i * 23000) / STEP);
      const s = spot(home, sd, i, ws, free); tgt = s;
      if (k >= 0.3) { x = s[0]; y = s[1]; state = "graze"; }
      if (k >= 0.62 && k < 0.72) { state = "dead"; fall = ease(Math.min(1, (k - 0.62) / 0.02)); }
      if (k >= 0.72 || k < 0.04) return; // carried off; a new deer steps out of the woods
      if (k < 0.08) alpha = (k - 0.04) / 0.04;
    } else if (k >= 0.62 && k < 0.86) {
      // startled: bolt away from the hunter into the undergrowth, come back later
      const dx = x - tgt[0], dy = y - tgt[1], l = Math.hypot(dx, dy) || 1;
      if (k < 0.7) { const r = ease((k - 0.62) / 0.08); x += dx / l * r * 3; y += dy / l * r * 3; state = "flee"; alpha = 1 - Math.max(0, (k - 0.66) / 0.04); flip = faceLeft(dx, dy); }
      else if (k < 0.8) return;
      else { const r = (k - 0.8) / 0.06; alpha = r; }
    }
    // strict ground check: never draw a beast on a blocked tile; hold at the last open spot instead
    if (!free(Math.round(x), Math.round(y))) {
      const ok = (p: [number, number]) => free(Math.round(p[0]), Math.round(p[1]));
      const back = [b, a, home].find((p) => ok(p) && Math.hypot(p[0] - x, p[1] - y) < 3.5) ?? home;
      x = back[0]; y = back[1]; if (state === "walk") state = "graze";
    }
    beasts.push({ boar, x, y, state, flip, alpha, fall, dist });
  });
  // --- hunter: out of the lodge door, stalk, kneel, shoot, shoulder the deer, carry it home ---
  const door: [number, number] = [lx + 0.6, ly + 0.6];
  const dx = tgt[0] - door[0], dy = tgt[1] - door[1], l = Math.hypot(dx, dy) || 1;
  const cover: [number, number] = [tgt[0] - dx / l * 1.4, tgt[1] - dy / l * 1.4];
  let hp: HunterPose | null = null;
  const out = faceLeft(dx, dy);
  if (k < 0.3) hp = { x: door[0], y: door[1], frame: 0, flip: (Math.floor(n / 9000) & 1) === 1, walk: false };
  else if (k < 0.55) { const r = ease((k - 0.3) / 0.25); hp = { x: lerp(door[0], cover[0], r), y: lerp(door[1], cover[1], r), frame: 1, flip: out, walk: true }; }
  else if (k < 0.64) hp = { x: cover[0], y: cover[1], frame: 2, flip: out, walk: false };
  else if (k < 0.72) { const r = ease((k - 0.64) / 0.08); hp = { x: lerp(cover[0], tgt[0] - dx / l * 0.3, r), y: lerp(cover[1], tgt[1] - dy / l * 0.3, r), frame: 0, flip: out, walk: true }; }
  else if (k < 0.95) { const r = ease((k - 0.72) / 0.23); hp = { x: lerp(tgt[0], door[0], r), y: lerp(tgt[1], door[1], r), frame: 3, flip: !out, walk: true }; }
  else hp = { x: door[0], y: door[1], frame: 0, flip: !out, walk: false };
  const bolt = k >= 0.6 && k < 0.62 ? { from: cover, to: tgt, r: (k - 0.6) / 0.02 } : null;
  return { beasts, hunter: hp, bolt };
}
