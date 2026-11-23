/**
 * P4b water concepts (display only, concept phase): a temporary switch between three looks for rivers and sea, plus
 * the sea data they share. ?water=a|b|c (or window.__setWater("a"|"b"|"c"|"main") in the test client) — without it
 * the game draws exactly as on main. Never touches terrain, rivers, coasts, floods or anything mechanical.
 */
import { MAP, hash, isWater, onGeoChange, riverDistAt, terrain, vnoise } from "./world";

export type WaterConcept = "main" | "a" | "b" | "c" | "d";
let concept: WaterConcept = (() => {
  try { const v = new URLSearchParams(location.search).get("water"); return v === "a" || v === "b" || v === "c" || v === "d" ? v : "main"; } catch { return "main"; }
})();
export const waterConcept = () => concept;
export function setWaterConcept(c: WaterConcept) { concept = c; }
if (typeof window !== "undefined") (window as unknown as { __setWater: (c: WaterConcept) => void }).__setWater = setWaterConcept;

// ---- sea: distance to land and the onshore direction (waves travel toward the coast) ----
/** 250 = not sea (land, river) — the value callers test against. Sea farther than SEA_CAP from land reads as SEA_CAP. */
export const SEA_FAR = 250;
export const SEA_CAP = 24;
const NB8: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
const dirCache = new Map<number, [number, number]>();
const blocks = new Map<number, SeaBlock | null>();
/** Cold-start and cache bookkeeping for the perf probe (?perf=1 → window.__waterStats()). */
export const waterBuild = { maskMs: 0, maskChunks: 0, regionMs: 0, regions: 0, blockMs: 0, blocks: 0 };
// Terrain class per tile (0 unknown, 1 land, 2 sea or lake, 3 river), filled lazily in 32×32 chunks: the world lookups
// are the expensive part, so each tile is asked once and only where water is actually drawn; small chunks let the
// renderer spread the work over frames (about 1 ms per chunk unthrottled).
const MC = 32, MCN = MAP / MC;
let mask = new Uint8Array(MAP * MAP), maskDone = new Uint8Array(MCN * MCN);
function maskChunk(cx: number, cy: number) {
  const t0 = performance.now();
  for (let y = cy * MC; y < cy * MC + MC; y++) for (let x = cx * MC; x < cx * MC + MC; x++) {
    const tt = terrain(x, y); mask[y * MAP + x] = !isWater(tt) ? 1 : riverDistAt(x, y) >= 0 ? 2 : 3;
  }
  maskDone[cy * MCN + cx] = 1; waterBuild.maskMs += performance.now() - t0; waterBuild.maskChunks++;
}
const cls = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= MAP || y >= MAP) return 0;
  const ci = ((y / MC) | 0) * MCN + ((x / MC) | 0); if (!maskDone[ci]) maskChunk(ci % MCN, (ci / MCN) | 0);
  return mask[y * MAP + x]!;
};
export const isSea = (x: number, y: number) => cls(x, y) === 2;
const isLand = (x: number, y: number) => cls(x, y) === 1;
// Distance to land, computed per 32×32 region from a window with a SEA_CAP margin: exact up to SEA_CAP, local, and
// cheap enough to build on first sight (the old whole-map pass cost about 1 s, 4 s with 4× throttling, in one frame).
const RS = 32, RM = SEA_CAP, RW = RS + 2 * RM;
const regions = new Map<number, Uint8Array>();
const rd = new Uint8Array(RW * RW), rq = new Int32Array(RW * RW);
function region(rx: number, ry: number): Uint8Array {
  const key = ry * 64 + rx, hit = regions.get(key); if (hit) return hit;
  const t0 = performance.now(), X0 = rx * RS - RM, Y0 = ry * RS - RM;
  // the mask pass below is timed apart (maskChunk), so subtract it again for a clean region figure
  const m0 = waterBuild.maskMs;
  let head = 0, tail = 0;
  // make sure the mask covers the window plus one tile, then read it directly (no per-tile chunk checks)
  for (let cy = Math.max(0, ((Y0 - 1) / MC) | 0); cy <= Math.min(MCN - 1, ((Y0 + RW) / MC) | 0); cy++)
    for (let cx = Math.max(0, ((X0 - 1) / MC) | 0); cx <= Math.min(MCN - 1, ((X0 + RW) / MC) | 0); cx++) if (!maskDone[cy * MCN + cx]) maskChunk(cx, cy);
  const m = (x: number, y: number) => (x < 0 || y < 0 || x >= MAP || y >= MAP ? 0 : mask[y * MAP + x]!);
  for (let j = 0; j < RW; j++) for (let i = 0; i < RW; i++) {
    const x = X0 + i, y = Y0 + j, k = j * RW + i;
    if (m(x, y) !== 2) { rd[k] = SEA_FAR; continue; }
    rd[k] = SEA_CAP;
    if (m(x + 1, y) === 1 || m(x - 1, y) === 1 || m(x, y + 1) === 1 || m(x, y - 1) === 1 || m(x + 1, y + 1) === 1 || m(x - 1, y - 1) === 1 || m(x + 1, y - 1) === 1 || m(x - 1, y + 1) === 1) { rd[k] = 1; rq[tail++] = k; }
  }
  while (head < tail) {
    const k = rq[head++]!, i = k % RW, j = (k / RW) | 0, nd = rd[k]! + 1; if (nd >= SEA_CAP) continue;
    for (const [dx, dy] of NB8) {
      const ni = i + dx, nj = j + dy; if (ni < 0 || nj < 0 || ni >= RW || nj >= RW) continue;
      const nk = nj * RW + ni; if (rd[nk]! <= nd || rd[nk] === SEA_FAR) continue;
      rd[nk] = nd; rq[tail++] = nk;
    }
  }
  const out = new Uint8Array(RS * RS);
  for (let j = 0; j < RS; j++) for (let i = 0; i < RS; i++) out[j * RS + i] = rd[(j + RM) * RW + i + RM]!;
  regions.set(key, out); waterBuild.regionMs += performance.now() - t0 - (waterBuild.maskMs - m0); waterBuild.regions++; return out;
}
onGeoChange(() => { mask = new Uint8Array(MAP * MAP); maskDone = new Uint8Array(MCN * MCN); regions.clear(); lastKey = -1; lastReg = null; dirCache.clear(); blocks.clear(); });
/** Steps from land through sea water: 1 = touches land, up to SEA_CAP for open sea, SEA_FAR = not sea. */
let lastKey = -1, lastReg: Uint8Array | null = null;
export const coastDist = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= MAP || y >= MAP) return SEA_FAR;
  const rx = (x / RS) | 0, ry = (y / RS) | 0, key = ry * 64 + rx;
  if (key !== lastKey || !lastReg) { lastReg = region(rx, ry); lastKey = key; }
  return lastReg[(y % RS) * RS + (x % RS)]!;
};
/** Unit direction (tile coords) toward the nearest coast, smoothed; open sea falls back to a steady north-westerly swell. */
export function onshore(x: number, y: number): [number, number] {
  const k = y * MAP + x, hit = dirCache.get(k); if (hit) return hit;
  // slope of the distance over a 5×5 window (land counts 0, river and outside count as the centre): 25 lookups
  // instead of the former 200, same smoothness
  const c0 = coastDist(x, y); let vx = 0, vy = 0;
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
    if (!i && !j) continue;
    const cx = x + i, cy = y + j, inside = cx >= 0 && cy >= 0 && cx < MAP && cy < MAP;
    const d = !inside ? c0 : isLand(cx, cy) ? 0 : coastDist(cx, cy), v = d >= SEA_FAR ? c0 : d;
    vx -= i * v; vy -= j * v;
  }
  const l = Math.hypot(vx, vy), out: [number, number] = l > 1e-6 ? [vx / l, vy / l] : [0.6, 0.8];
  if (dirCache.size > 120_000) dirCache.clear();
  dirCache.set(k, out); return out;
}
/** Builds the terrain-class chunks a sea block will need (its distance regions with their margins) until the
 *  deadline; true when all are there, so seaBlock() then only runs the cheap regional pass. */
export function seaPrepare(bx: number, by: number, deadline: number): boolean {
  // most blocks hold no sea at all: one look at the block's own class chunk settles that without any regions
  const key = by * 4096 + bx; if (blocks.has(key)) return true;
  const cx = ((bx * 16) / MC) | 0, cy = ((by * 16) / MC) | 0; if (!maskDone[cy * MCN + cx]) { if (performance.now() > deadline) return false; maskChunk(cx, cy); }
  let any = false;
  for (let y = by * 16; y < by * 16 + 16 && !any; y++) for (let x = bx * 16; x < bx * 16 + 16; x++) if (mask[y * MAP + x] === 2) { any = true; break; }
  if (!any) { blocks.set(key, null); return true; }
  const x0 = bx * 16 - 8, x1 = bx * 16 + 23, y0 = by * 16 - 8, y1 = by * 16 + 23; // block plus the reach of onshore (2) and exposure (5)
  const rx0 = Math.max(0, (x0 / RS) | 0), rx1 = Math.min(MAP / RS - 1, (x1 / RS) | 0), ry0 = Math.max(0, (y0 / RS) | 0), ry1 = Math.min(MAP / RS - 1, (y1 / RS) | 0);
  for (let ry = ry0; ry <= ry1; ry++) for (let rx = rx0; rx <= rx1; rx++) {
    if (regions.has(ry * 64 + rx)) continue;
    const X0 = rx * RS - RM - 1, Y0 = ry * RS - RM - 1, X1 = X0 + RW + 2, Y1 = Y0 + RW + 2;
    for (let cy = Math.max(0, (Y0 / MC) | 0); cy <= Math.min(MCN - 1, (Math.max(0, Y1) / MC) | 0); cy++)
      for (let cx = Math.max(0, (X0 / MC) | 0); cx <= Math.min(MCN - 1, (Math.max(0, X1) / MC) | 0); cx++) {
        if (maskDone[cy * MCN + cx]) continue;
        if (performance.now() > deadline) return false;
        maskChunk(cx, cy);
      }
    if (performance.now() > deadline) return false;
    region(rx, ry); // one region per check (a few ms with 4× throttling), so the overrun stays small
  }
  return true;
}
/** The sea block if it is already built (undefined = not yet): lets the renderer spread cold-start work over frames. */
export const seaBlockIfReady = (bx: number, by: number) => blocks.get(by * 4096 + bx);
export type SeaBlock = { n: number; x: Int16Array; y: Int16Array; fx: Float32Array; fy: Float32Array; d: Uint8Array; minD: number };
/** Sea tiles of one 16×16 block with their onshore direction and distance to land, built once. */
export function seaBlock(bx: number, by: number): SeaBlock | null {
  const key = by * 4096 + bx, hit = blocks.get(key); if (hit !== undefined) return hit;
  const t0 = performance.now();
  const xs: number[] = [], ys: number[] = [], fx: number[] = [], fy: number[] = [], ds: number[] = [];
  for (let y = by * 16; y < by * 16 + 16 && y < MAP; y++) for (let x = bx * 16; x < bx * 16 + 16 && x < MAP; x++) {
    if (!isSea(x, y)) continue;
    const dd = coastDist(x, y), f = dd < SEA_FAR ? onshore(x, y) : [0.6, 0.8] as [number, number];
    xs.push(x); ys.push(y); fx.push(f[0]); fy.push(f[1]); ds.push(dd);
  }
  const out = xs.length ? { n: xs.length, x: Int16Array.from(xs), y: Int16Array.from(ys), fx: Float32Array.from(fx), fy: Float32Array.from(fy), d: Uint8Array.from(ds), minD: Math.min(...ds) } : null;
  blocks.set(key, out); waterBuild.blockMs += performance.now() - t0; waterBuild.blocks++; return out;
}

/** Swell phase at a sea point (0..1 per wave): waves march onshore along the local direction, wave length and speed
 *  vary slowly in space so crests never line up into a ruled grid. */
export function swellPhase(x: number, y: number, f: [number, number], t: number, wave: number, speed: number): number {
  const along = -(x * f[0] + y * f[1]), warp = vnoise(x / 9, y / 9, 1301) * 0.9;
  return (((along / wave + warp + (t / 1000) * speed / wave) % 1) + 1) % 1;
}
/** Breaking wave cycle at a coast segment (0..1): each stretch of coast has its own slow beat. */
export const surfPhase = (mx: number, my: number, t: number, period: number) => (((t / period + vnoise(mx * 0.012, my * 0.018, 1311) * 1.7 + vnoise(mx * 0.004, my * 0.006, 1312) * 0.6) % 1) + 1) % 1;
/** D's surf beat: varies slowly along the coast (about one beat per 10–15 tiles), so neighbouring shore points are
 *  at almost the same stage and the foam line moves as one soft front instead of tearing into spikes. */
export const surfPhaseD = (x: number, y: number, t: number, period: number) => (((t / period + vnoise(x * 0.002, y * 0.003, 1321) * 1.1 + vnoise(x * 0.0009, y * 0.0012, 1322) * 0.7) % 1) + 1) % 1;

// ---- concept C: hand-painted brush marks, rendered once ----
const brushes = new Map<string, HTMLCanvasElement | null>();
function brush(key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement | null {
  if (brushes.has(key)) return brushes.get(key)!;
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d"); if (!g) { brushes.set(key, null); return null; }
  paint(g); brushes.set(key, cv); return cv;
}
/** A painted ripple: a tapered, slightly curved stroke with a pale lit edge and a darker shadow below. */
export const rippleBrush = () => brush("ripple", 96, 32, (g) => {
  const stroke = (dy: number, col: string, wmax: number) => {
    for (let i = 0; i < 40; i++) {
      const t0 = i / 40, t1 = (i + 1) / 40, w = wmax * Math.sin(Math.PI * (t0 + t1) / 2);
      const y0 = 16 + dy - 7 * Math.sin(Math.PI * t0), y1 = 16 + dy - 7 * Math.sin(Math.PI * t1);
      g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(6 + 84 * t0, y0); g.lineTo(6 + 84 * t1, y1); g.stroke();
    }
  };
  stroke(3.5, "rgba(18,52,60,0.55)", 4.5); stroke(0, "rgba(214,232,224,0.9)", 3.2); stroke(-0.8, "rgba(246,250,240,0.85)", 1.3);
});
/** A painted wave crest for the sea: a broad curved swell with a creamy foam cap. */
export const crestBrush = () => brush("crest", 160, 48, (g) => {
  for (let i = 0; i < 60; i++) {
    const t0 = i / 60, t1 = (i + 1) / 60, env = Math.sin(Math.PI * (t0 + t1) / 2);
    const y = (t: number) => 26 - 10 * Math.sin(Math.PI * t);
    g.lineCap = "round";
    g.strokeStyle = "rgba(14,44,58,0.45)"; g.lineWidth = 9 * env; g.beginPath(); g.moveTo(8 + 144 * t0, y(t0) + 7); g.lineTo(8 + 144 * t1, y(t1) + 7); g.stroke();
    g.strokeStyle = "rgba(120,170,172,0.55)"; g.lineWidth = 7 * env; g.beginPath(); g.moveTo(8 + 144 * t0, y(t0) + 2); g.lineTo(8 + 144 * t1, y(t1) + 2); g.stroke();
    g.strokeStyle = "rgba(244,246,236,0.92)"; g.lineWidth = 3.2 * env; g.beginPath(); g.moveTo(8 + 144 * t0, y(t0)); g.lineTo(8 + 144 * t1, y(t1)); g.stroke();
  }
});
/** A cluster of creamy foam dabs (surf lace). */
export const foamBrush = () => brush("foam", 64, 32, (g) => {
  let s = 7; const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let i = 0; i < 26; i++) {
    const x = 8 + r() * 48, y = 10 + r() * 12, rad = 2 + r() * 5;
    g.fillStyle = `rgba(${236 + r() * 14},${238 + r() * 12},${228 + r() * 14},${0.55 + r() * 0.4})`;
    g.beginPath(); g.ellipse(x, y, rad, rad * 0.55, 0, 0, 7); g.fill();
  }
});
/** Soft white sheen (concept A): elongated light that drifts on calm water. */
export const sheenSprite = () => brush("sheen", 64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(236,244,240,1)"); gr.addColorStop(0.5, "rgba(236,244,240,0.35)"); gr.addColorStop(1, "rgba(236,244,240,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});
export const shadeSprite = () => brush("shade", 64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(8,30,42,1)"); gr.addColorStop(1, "rgba(8,30,42,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});

// ---- concept D (optimised C): painted ripple variants, and an adaptive quality level with hysteresis ----
/** Breaking wave at one point of the coast, ph 0..1 (one beat): the foam front runs in from offshore, climbs a little
 *  onto the beach (negative offset) and draws back while fading. off/run are in units of the caller's run-in distance. */
export function surfFront(ph: number): { off: number; a: number; wet: number } {
  if (ph < 0.6) { // runs in, steadily at first, slowing as it climbs the beach (overshoots onto the sand)
    const u = ph / 0.6, e = u * (1.35 - 0.35 * u);
    return { off: 1 - 1.15 * e, a: Math.min(1, u / 0.18) * (0.5 + 0.5 * u), wet: 0 };
  }
  const u = (ph - 0.6) / 0.4; // draws back seaward and thins out, the sand it reached stays dark for a moment
  return { off: -0.15 + 0.45 * u, a: Math.pow(1 - u, 1.5), wet: (1 - u) * Math.min(1, u / 0.12) };
}
/** A painted crescent (ripple, wave crest) as two quadratic curves, appended to a flat buffer of 8 numbers:
 *  A, ctrl-outer, B, ctrl-inner. u is half the chord, n the bulge direction (same units), bend/thick relative to n,
 *  lean shifts the peak along the chord. Filled in batches, so hundreds of marks cost a handful of fills. */
export function crescent(buf: number[], x: number, y: number, ux: number, uy: number, nx: number, ny: number, bend: number, thick: number, lean: number) {
  const lx = ux * lean, ly = uy * lean;
  buf.push(x - ux, y - uy, x + nx * 2 * bend + lx, y + ny * 2 * bend + ly, x + ux, y + uy, x + nx * 2 * (bend - thick) + lx, y + ny * 2 * (bend - thick) + ly);
}
/** Soft elongated light, pre-rotated into SHEEN_DIRS directions once, so it can be drawn axis-aligned: a rotated
 *  drawImage costs 3–7× more in software rasterisers than an axis-aligned one. Aspect is baked in (about 3.4:1). */
export const SHEEN_DIRS = 16;
export const sheenDir = (i: number) => brush(`sheenDir${i}`, 96, 96, (g) => {
  const a = (i / SHEEN_DIRS) * Math.PI; g.translate(48, 48); g.rotate(a); g.scale(1, 0.3);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 44); gr.addColorStop(0, "rgba(220,240,232,0.9)"); gr.addColorStop(0.5, "rgba(206,232,224,0.4)"); gr.addColorStop(1, "rgba(200,228,220,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 44, 0, Math.PI * 2); g.fill();
});
/** Index of the pre-rotated sheen for a screen direction. */
export const sheenIndex = (dx: number, dy: number) => { let a = Math.atan2(dy, dx); if (a < 0) a += Math.PI; return Math.round((a / Math.PI) * SHEEN_DIRS) % SHEEN_DIRS; };
/** Adaptive water quality: 2 full, 1 reduced, 0 minimal. Drops after sustained slow frames, recovers only after a
 *  longer run of fast ones (hysteresis), so the detail never flickers between levels. Pure state machine. */
export type QualityState = { level: number; slow: number; fast: number; ema: number };
export const QUALITY_SLOW_MS = 40, QUALITY_FAST_MS = 26, QUALITY_DROP_AFTER = 2000, QUALITY_RISE_AFTER = 8000;
export function nextQuality(q: QualityState, frameMs: number): QualityState {
  const dt = Math.min(frameMs, 250), ema = q.ema ? q.ema * 0.9 + dt * 0.1 : dt;
  let { level, slow, fast } = q;
  if (ema > QUALITY_SLOW_MS) { slow += dt; fast = 0; } else if (ema < QUALITY_FAST_MS) { fast += dt; slow = 0; } else { slow = 0; fast = 0; }
  if (slow > QUALITY_DROP_AFTER && level > 0) { level--; slow = 0; }
  if (fast > QUALITY_RISE_AFTER && level < 2) { level++; fast = 0; }
  return { level, slow, fast, ema };
}
export const QUALITY_SCALE = [0.4, 0.65, 1] as const;
let quality: QualityState = { level: 2, slow: 0, fast: 0, ema: 0 }, lastFrame = 0, lastGap = 16;
/** Time between the last two water frames (ms): lets first-sight building scale with how slow frames already are. */
export const waterFrameGap = () => lastGap;
/** Fed once per drawn frame; returns the density scale for the water layer. ?waterq=0|1|2 pins a level for tests. */
export function waterQuality(now: number): number {
  if (lastFrame) lastGap = now - lastFrame;
  if (pinned !== null) { lastFrame = now; return QUALITY_SCALE[pinned]!; }
  if (lastFrame) quality = nextQuality(quality, now - lastFrame);
  lastFrame = now;
  return QUALITY_SCALE[quality.level]!;
}
export const waterQualityLevel = () => (pinned ?? quality.level);
let pinned: number | null = (() => { try { const v = new URLSearchParams(location.search).get("waterq"); return v === "0" || v === "1" || v === "2" ? Number(v) : null; } catch { return null; } })();
/** Debug/probe only: pin the water quality level (0..2) or hand it back to the adaptive control (null). */
if (typeof window !== "undefined") (window as unknown as { __setWaterQ?: (q: number | null) => void }).__setWaterQ = (q) => { pinned = q === 0 || q === 1 || q === 2 ? q : null; };

/** Sizes of the water caches (entries) and their rough memory, for the perf probe. All are bounded: blocks by the map
 *  (64 × 64), distance regions by the map (32 × 32), the direction cache by a hard cap, the class mask is a byte per tile. */
export function waterCacheStats() {
  let tiles = 0; for (const b of blocks.values()) if (b) tiles += b.n;
  return { seaBlocks: blocks.size, seaTiles: tiles, dirs: dirCache.size, regions: regions.size, maskBytes: mask.byteLength, approxBytes: mask.byteLength + regions.size * RS * RS + tiles * 17 + dirCache.size * 64 + blocks.size * 96 };
}
