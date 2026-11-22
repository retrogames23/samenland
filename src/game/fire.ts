/**
 * Fire look (display only): one smooth intensity per fire drives flame size, glow and the light it casts, so they
 * always move together; a pre-rendered, seamlessly looping strip of wavering flame frames replaces the stretched
 * single picture; glow and smoke puffs are cached sprites instead of a new gradient per fire and frame.
 * Nothing here touches mechanics — fires, ovens and feasts are decided elsewhere.
 */
import { hash } from "./world";

export type FireKind = "hearth" | "campfire" | "blaze";
/** rate: intensity knots per second (how lively), size/lean: flame response, glow/light: how strongly glow and cast light follow. */
export const FIRE: Record<FireKind, { rate: number; size: number; lean: number; glow: number; light: number; speed: number }> = {
  hearth: { rate: 2.4, size: 0.12, lean: 0.05, glow: 0.18, light: 0.14, speed: 1.3 }, // forge, oven mouth: quick, contained
  campfire: { rate: 1.7, size: 0.2, lean: 0.08, glow: 0.26, light: 0.22, speed: 1 }, // open fire, bonfire: breathing
  blaze: { rate: 1.1, size: 0.26, lean: 0.11, glow: 0.3, light: 0.28, speed: 0.75 }, // burning house: slow heavy surges
};

/** Smooth 1-D value noise in 0..1: smoothstep between hashed knots — continuous in value and slope (no kinks or jumps). */
export function noise1(x: number, seed: number): number {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = hash(i, seed | 0, 917), b = hash(i + 1, seed | 0, 917);
  return a + (b - a) * u;
}
/** Fire intensity 0..1 at time t (ms): three octaves of smooth noise; the fastest carries little weight, so brightness
 *  never strobes. The same value scales flame, glow and light. */
export function fireLevel(kind: FireKind, t: number, seed: number): number {
  const s = (t / 1000) * FIRE[kind].rate, k = Math.floor(seed * 7919) | 0;
  return 0.55 * noise1(s, k) + 0.3 * noise1(s * 2.3 + 17.3, k + 1) + 0.15 * noise1(s * 4.7 + 41.7, k + 2);
}
/** Response factor around 1 for an intensity: 1 ± amount. */
export const swing = (lvl: number, amount: number) => 1 + amount * (lvl * 2 - 1);

// ---- flame strip: N frames of the painted flame, warped by rising waves that loop seamlessly ----
export const FLAME_FRAMES = 24, FLAME_W = 112, FLAME_H = 192, FLAME_PAD = 10;
/** Horizontal offset (frame px) of row v (0 tip .. 1 base) in frame f: waves travel up, grow toward the tip, and are
 *  periodic in f so frame N-1 flows into frame 0. */
export function flameWave(v: number, f: number): number {
  const p = (2 * Math.PI * f) / FLAME_FRAMES, up = Math.pow(1 - v, 1.6);
  return FLAME_W * 0.085 * up * (0.62 * Math.sin(p + v * 7.5) + 0.38 * Math.sin(2 * p - v * 12.5 + 1.3));
}
/** Source row (0..1) for frame row v: the tip licks up and down a little, the base stays put. */
export function flameStretch(v: number, f: number): number {
  const p = (2 * Math.PI * f) / FLAME_FRAMES;
  return Math.min(1, Math.max(0, 1 - (1 - v) * (1 + 0.07 * Math.sin(p + v * 3) + 0.04 * Math.sin(3 * p + 1.1))));
}
const strips = new WeakMap<HTMLImageElement, HTMLCanvasElement | null>();
/** Built once per flame image (one-off cost, ~200 KB per strip); null outside the browser. */
export function flameStrip(im: HTMLImageElement): HTMLCanvasElement | null {
  if (strips.has(im)) return strips.get(im)!;
  if (typeof document === "undefined" || !im.complete || !im.naturalWidth) return null;
  const cv = document.createElement("canvas"); cv.width = FLAME_W * FLAME_FRAMES; cv.height = FLAME_H;
  const g = cv.getContext("2d"); if (!g) { strips.set(im, null); return null; }
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  const iw = im.naturalWidth, ih = im.naturalHeight, band = 2, inner = FLAME_W - FLAME_PAD * 2;
  for (let f = 0; f < FLAME_FRAMES; f++) for (let y = 0; y < FLAME_H; y += band) {
    const v = (y + band / 2) / FLAME_H, sv = flameStretch(v, f);
    const narrow = 1 + 0.05 * Math.sin((2 * Math.PI * f) / FLAME_FRAMES * 2 + v * 5) * (1 - v);
    const w = inner * narrow, x = f * FLAME_W + (FLAME_W - w) / 2 + flameWave(v, f);
    g.drawImage(im, 0, Math.min(ih - 1, sv * ih), iw, Math.max(1, (ih * band) / FLAME_H), x, y, w, band);
  }
  strips.set(im, cv); return cv;
}
/** Frame position (float, 0..N) of one flame tongue: steady rise plus noise-modulated drift — never a fixed loop rhythm. */
export function flamePhase(kind: FireKind, t: number, seed: number): number {
  const s = t / 1000, k = Math.floor(seed * 7919) | 0;
  const ph = s * FIRE[kind].speed * 9 + hash(k, 3, 919) * FLAME_FRAMES + noise1(s * 0.45, k + 7) * FLAME_FRAMES * 0.7;
  return ((ph % FLAME_FRAMES) + FLAME_FRAMES) % FLAME_FRAMES;
}

// ---- cached soft sprites (glow, night lamp light, smoke puffs) ----
type Stops = [number, string][];
const sprites = new Map<string, HTMLCanvasElement | null>();
function radialSprite(key: string, stops: Stops, S = 64): HTMLCanvasElement | null {
  if (sprites.has(key)) return sprites.get(key)!;
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas"); cv.width = cv.height = S;
  const g = cv.getContext("2d"); if (!g) { sprites.set(key, null); return null; }
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  sprites.set(key, cv); return cv;
}
/** Warm fire glow (alpha 1 at the centre; scale with globalAlpha). */
export const glowSprite = () => radialSprite("glow", [[0, "rgba(255,170,70,1)"], [1, "rgba(255,140,50,0)"]]);
/** Night light pool: the former per-light gradient (0.7 / 0.32 / 0 at alpha 1). */
export const lampSprite = () => radialSprite("lamp", [[0, "rgba(255,190,100,0.7)"], [0.25, "rgba(255,150,60,0.32)"], [1, "rgba(255,130,50,0)"]], 128);
/** Smoke puff, pale chimney smoke or dark soot from a burning roof. */
export const puffSprite = (dark = false) => dark
  ? radialSprite("soot", [[0, "rgba(78,72,66,1)"], [1, "rgba(78,72,66,0)"]], 32)
  : radialSprite("puff", [[0, "rgba(214,210,202,1)"], [1, "rgba(214,210,202,0)"]], 32);
/** Draws a cached soft sprite centred at (x, y) with radius r and the given alpha (no allocation). */
export function soft(c: CanvasRenderingContext2D, sp: HTMLCanvasElement | null, x: number, y: number, r: number, alpha: number, ry = r) {
  if (!sp || alpha <= 0.002 || r <= 0) return;
  const a = c.globalAlpha, q = c.imageSmoothingQuality; c.globalAlpha = a * Math.min(1, alpha);
  c.imageSmoothingQuality = "low"; // a soft gradient needs no high-quality resampling
  c.drawImage(sp, x - r, y - ry, r * 2, ry * 2);
  c.globalAlpha = a; c.imageSmoothingQuality = q;
}

/** Where flames break through a burning roof: fractions across the painting's width, spread over its middle, jittered
 *  per building so neighbouring fires never line up. */
export function blazeSpots(width: number, seed: number): number[] {
  const n = Math.max(2, Math.min(4, Math.round(width / 8)));
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(0.24 + (0.52 * (i + 0.5)) / n + (hash(Math.floor(seed * 97) | 0, i, 931) - 0.5) * (0.36 / n));
  return out;
}
