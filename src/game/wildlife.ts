/**
 * Free game and the hunt — a pure function of den tiles, the free-ground predicate and the shared clock.
 * Deer and boar live in dens scattered over open nature, with or without a village nearby. A finished
 * hunter's lodge owns the dens closest to it and takes one deer at a time in turn; a den that lost its
 * animal stays empty for REGEN, then a new animal steps out of the woods. Nothing is stored.
 * Positions are in tile coordinates (floats); the renderer converts them to screen space.
 */
import { hash } from "./world";

export type Free = (x: number, y: number) => boolean;
export type BeastState = "walk" | "graze" | "root" | "flee" | "dead";
export type Beast = { boar: boolean; x: number; y: number; state: BeastState; flip: boolean; alpha: number; fall: number; dist: number };
export type HunterPose = { x: number; y: number; frame: 0 | 1 | 2 | 3; flip: boolean; walk: boolean };
export type HuntScene = { beasts: Beast[]; hunter: HunterPose | null; bolt: { from: [number, number]; to: [number, number]; r: number } | null };
export type Den = [number, number];

export const HUNT_CYCLE = 11 * 60000;
/** Time a hunted den needs until a new animal lives there again. */
export const REGEN = 45 * 60000;
/** Dens a lodge can reach. */
export const DEN_R = 10;
const REGEN_CYC = Math.ceil(REGEN / HUNT_CYCLE) + 1;
const STEP = 70000; // an animal changes its grazing spot about every 70 s
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const;

/** Whether a tile is a den (the animal's home); the caller still checks free ground around it. */
export const isDen = (x: number, y: number) => hash(x, y, 311) < 0.018;
/** Wild-scan order: the cheap den hash first, the costly structure lookup only for den tiles. */
export const wildCandidate = (x: number, y: number, built: (x: number, y: number) => boolean) => isDen(x, y) && !built(x, y);
export const isBoar = (x: number, y: number) => hash(x, y, 312) < 0.35;
/** A den needs open ground around it so its animal can roam. */
export function denOk(x: number, y: number, free: Free): boolean {
  if (!isDen(x, y) || !free(x, y)) return false;
  let n = 0; for (const [a, b] of NB) if (free(x + a, y + b)) n++;
  return n >= 5;
}
/** Deer dens a lodge hunts, in a fixed order; `owner` says which lodge a den belongs to (nearest lodge). */
export function lodgeDens(lx: number, ly: number, free: Free, owns: (x: number, y: number) => boolean = () => true): Den[] {
  const out: Den[] = [];
  for (let dy = -DEN_R; dy <= DEN_R; dy++) for (let dx = -DEN_R; dx <= DEN_R; dx++) {
    const d = Math.hypot(dx, dy); if (d < 2 || d > DEN_R) continue;
    const x = lx + dx, y = ly + dy;
    if (!isBoar(x, y) && denOk(x, y, free) && owns(x, y)) out.push([x, y]);
  }
  return out.sort((a, b) => hash(a[0], a[1], 77) - hash(b[0], b[1], 77));
}

const offset = (lx: number, ly: number) => hash(lx * 1000 + ly, 3, 41) * HUNT_CYCLE;
const cycleOf = (lx: number, ly: number, now: number) => Math.floor((now + offset(lx, ly)) / HUNT_CYCLE);
const cycleStart = (lx: number, ly: number, c: number) => c * HUNT_CYCLE - offset(lx, ly);
/** Hunt cycles are spaced so every den regrows before it is hunted again; returns the den index or null (rest day). */
export function huntTarget(cyc: number, len: number): number | null {
  if (len === 0) return null;
  const m = Math.max(1, Math.ceil(REGEN_CYC / len));
  return ((cyc % m) + m) % m === 0 ? Math.floor(cyc / m) % len : null;
}
/** Fate of den i of a lodge: roaming freely, part of the running hunt, or empty and regrowing (alpha fades in). */
export function denFate(lx: number, ly: number, i: number, len: number, now: number): { phase: "free" | "hunt" | "gone"; alpha: number } {
  const cyc = cycleOf(lx, ly, now);
  if (huntTarget(cyc, len) === i) return { phase: "hunt", alpha: 1 };
  const m = Math.max(1, Math.ceil(REGEN_CYC / len));
  for (let c = cyc - 1; c >= cyc - m * len; c--) {
    if (huntTarget(c, len) !== i) continue;
    const back = cycleStart(lx, ly, c) + 0.62 * HUNT_CYCLE + REGEN - now;
    if (back > 0) return { phase: "gone", alpha: 0 };
    return { phase: "free", alpha: Math.min(1, -back / 90000) };
  }
  return { phase: "free", alpha: 1 };
}

/** Spot of a den's animal in time window w: its den or a free neighbour, so every path stays on open ground. */
function spot(home: Den, i: number, w: number, free: Free): [number, number] {
  const sd = home[0] * 1000 + home[1];
  const opts: [number, number][] = [home];
  for (const [a, b] of NB) if (free(home[0] + a, home[1] + b)) opts.push([home[0] + a, home[1] + b]);
  const o = opts[Math.floor(hash(sd + i * 17, w, 61) * opts.length)]!;
  return [o[0] + (hash(sd, w * 3 + i, 62) - 0.5) * 0.5, o[1] + (hash(sd, w * 3 + i, 63) - 0.5) * 0.5];
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => k * k * (3 - 2 * k);
const faceLeft = (dx: number, dy: number) => dx - dy < 0;

/** The roaming animal of a den at `now`. */
export function denBeast(x: number, y: number, now: number, free: Free): Beast {
  const home: Den = [x, y], boar = isBoar(x, y), i = Math.floor(hash(x, y, 64) * 5);
  const t = now + hash(x, y, 65) * STEP, w = Math.floor(t / STEP), f = (t % STEP) / STEP;
  const a = spot(home, i, w, free), b = spot(home, i, w + 1, free);
  const mv = f > 0.8 ? ease((f - 0.8) / 0.2) : 0;
  let px = lerp(a[0], b[0], mv), py = lerp(a[1], b[1], mv);
  let state: BeastState = mv > 0 && mv < 1 ? "walk" : boar && hash(x, y + w, 45) < 0.6 ? "root" : "graze";
  if (!free(Math.round(px), Math.round(py))) { px = x; py = y; state = "graze"; }
  return { boar, x: px, y: py, state, flip: faceLeft(b[0] - a[0], b[1] - a[1]), alpha: 1, fall: 0, dist: Math.hypot(b[0] - a[0], b[1] - a[1]) * mv * 12 };
}

/** Free animals near the shot bolt: returns the startled pose, or null when undisturbed. */
export function startle(bst: Beast, lx: number, ly: number, dens: Den[], now: number): Beast | null {
  const cyc = cycleOf(lx, ly, now), ti = huntTarget(cyc, dens.length); if (ti === null) return null;
  const k = (now + offset(lx, ly)) / HUNT_CYCLE - cyc; if (k < 0.62 || k >= 0.86) return null;
  const tg = dens[ti]!, dx = bst.x - tg[0], dy = bst.y - tg[1], l = Math.hypot(dx, dy) || 1;
  if (l > 5) return null;
  if (k >= 0.7 && k < 0.8) return { ...bst, alpha: 0 };
  if (k >= 0.8) return { ...bst, alpha: (k - 0.8) / 0.06 };
  const r = ease((k - 0.62) / 0.08);
  return { ...bst, x: bst.x + dx / l * r * 3, y: bst.y + dy / l * r * 3, state: "flee", flip: faceLeft(dx, dy), alpha: 1 - Math.max(0, (k - 0.66) / 0.04) };
}

/** The running hunt of a lodge: the chosen deer, the hunter stalking, shooting and carrying it home. */
export function huntScene(lx: number, ly: number, now: number, free: Free, dens: Den[] = lodgeDens(lx, ly, free)): HuntScene {
  const cyc = cycleOf(lx, ly, now), ti = huntTarget(cyc, dens.length);
  if (ti === null) return { beasts: [], hunter: null, bolt: null };
  const k = (now + offset(lx, ly)) / HUNT_CYCLE - cyc, den = dens[ti]!;
  const start = cycleStart(lx, ly, cyc);
  const s = denBeast(den[0], den[1], start + 0.3 * HUNT_CYCLE, free); // where it grazed when the hunter set out
  const beasts: Beast[] = [];
  const tgt: [number, number] = [s.x, s.y];
  if (k < 0.72) {
    const b = k < 0.3 ? denBeast(den[0], den[1], now, free) : { ...s, state: "graze" as BeastState };
    if (k >= 0.62) { b.state = "dead"; b.fall = ease(Math.min(1, (k - 0.62) / 0.02)); }
    beasts.push(b);
  }
  const door: [number, number] = [lx + 0.6, ly + 0.6];
  const dx = tgt[0] - door[0], dy = tgt[1] - door[1], l = Math.hypot(dx, dy) || 1;
  const cover: [number, number] = [tgt[0] - dx / l * 1.4, tgt[1] - dy / l * 1.4];
  const out = faceLeft(dx, dy);
  let hp: HunterPose;
  if (k < 0.3) hp = { x: door[0], y: door[1], frame: 0, flip: (Math.floor(now / 9000) & 1) === 1, walk: false };
  else if (k < 0.55) { const r = ease((k - 0.3) / 0.25); hp = { x: lerp(door[0], cover[0], r), y: lerp(door[1], cover[1], r), frame: 1, flip: out, walk: true }; }
  else if (k < 0.64) hp = { x: cover[0], y: cover[1], frame: 2, flip: out, walk: false };
  else if (k < 0.72) { const r = ease((k - 0.64) / 0.08); hp = { x: lerp(cover[0], tgt[0] - dx / l * 0.3, r), y: lerp(cover[1], tgt[1] - dy / l * 0.3, r), frame: 0, flip: out, walk: true }; }
  else if (k < 0.95) { const r = ease((k - 0.72) / 0.23); hp = { x: lerp(tgt[0], door[0], r), y: lerp(tgt[1], door[1], r), frame: 3, flip: !out, walk: true }; }
  else hp = { x: door[0], y: door[1], frame: 0, flip: !out, walk: false };
  const bolt = k >= 0.6 && k < 0.62 ? { from: cover, to: tgt, r: (k - 0.6) / 0.02 } : null;
  return { beasts, hunter: hp, bolt };
}
