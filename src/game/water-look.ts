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
export const SEA_FAR = 250;
const NB8: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
let dist: Uint8Array | null = null;
const dirCache = new Map<number, [number, number]>();
const blocks = new Map<number, SeaBlock | null>();
onGeoChange(() => { dist = null; dirCache.clear(); blocks.clear(); });
export const isSea = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP && y < MAP && isWater(terrain(x, y)) && riverDistAt(x, y) >= 0;
const isLand = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP && y < MAP && !isWater(terrain(x, y));
/** Steps from land through sea water (1 = touches land, SEA_FAR = open sea or not sea). Built once per map. */
function field(): Uint8Array {
  if (dist) return dist;
  const d = new Uint8Array(MAP * MAP).fill(SEA_FAR), q = new Int32Array(MAP * MAP);
  let head = 0, tail = 0;
  for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
    if (!isSea(x, y)) continue;
    for (const [dx, dy] of NB8) if (isLand(x + dx, y + dy)) { d[y * MAP + x] = 1; q[tail++] = y * MAP + x; break; }
  }
  while (head < tail) {
    const k = q[head++]!, x = k % MAP, y = (k / MAP) | 0, nd = d[k]! + 1; if (nd >= SEA_FAR) continue;
    for (const [dx, dy] of NB8) {
      const nx = x + dx, ny = y + dy, nk = ny * MAP + nx;
      if (nx < 0 || ny < 0 || nx >= MAP || ny >= MAP || d[nk]! <= nd || !isSea(nx, ny)) continue;
      d[nk] = nd; q[tail++] = nk;
    }
  }
  return (dist = d);
}
export const coastDist = (x: number, y: number) => (x < 0 || y < 0 || x >= MAP || y >= MAP ? SEA_FAR : field()[y * MAP + x]!);
/** Unit direction (tile coords) toward the nearest coast, smoothed; open sea falls back to a steady north-westerly swell. */
export function onshore(x: number, y: number): [number, number] {
  const k = y * MAP + x, hit = dirCache.get(k); if (hit) return hit;
  const d = field(); let vx = 0, vy = 0;
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
    const cx = x + i, cy = y + j; if (cx < 0 || cy < 0 || cx >= MAP || cy >= MAP) continue;
    const c = d[cy * MAP + cx]!; if (c >= SEA_FAR) continue;
    for (const [dx, dy] of NB8) {
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= MAP || ny >= MAP) continue;
      const n = isLand(nx, ny) ? 0 : d[ny * MAP + nx]!; if (n >= SEA_FAR) continue;
      const l = Math.hypot(dx, dy); vx += ((c - n) * dx) / l; vy += ((c - n) * dy) / l;
    }
  }
  const l = Math.hypot(vx, vy), out: [number, number] = l > 1e-6 ? [vx / l, vy / l] : [0.6, 0.8];
  if (dirCache.size > 120_000) dirCache.clear();
  dirCache.set(k, out); return out;
}
export type SeaBlock = { n: number; x: Int16Array; y: Int16Array; fx: Float32Array; fy: Float32Array; d: Uint8Array; minD: number };
/** Sea tiles of one 16×16 block with their onshore direction and distance to land, built once. */
export function seaBlock(bx: number, by: number): SeaBlock | null {
  const key = by * 4096 + bx, hit = blocks.get(key); if (hit !== undefined) return hit;
  const xs: number[] = [], ys: number[] = [], fx: number[] = [], fy: number[] = [], ds: number[] = [];
  for (let y = by * 16; y < by * 16 + 16 && y < MAP; y++) for (let x = bx * 16; x < bx * 16 + 16 && x < MAP; x++) {
    if (!isSea(x, y)) continue;
    const dd = coastDist(x, y), f = dd < SEA_FAR ? onshore(x, y) : [0.6, 0.8] as [number, number];
    xs.push(x); ys.push(y); fx.push(f[0]); fy.push(f[1]); ds.push(dd);
  }
  const out = xs.length ? { n: xs.length, x: Int16Array.from(xs), y: Int16Array.from(ys), fx: Float32Array.from(fx), fy: Float32Array.from(fy), d: Uint8Array.from(ds), minD: Math.min(...ds) } : null;
  blocks.set(key, out); return out;
}

/** Swell phase at a sea point (0..1 per wave): waves march onshore along the local direction, wave length and speed
 *  vary slowly in space so crests never line up into a ruled grid. */
export function swellPhase(x: number, y: number, f: [number, number], t: number, wave: number, speed: number): number {
  const along = -(x * f[0] + y * f[1]), warp = vnoise(x / 9, y / 9, 1301) * 0.9;
  return (((along / wave + warp + (t / 1000) * speed / wave) % 1) + 1) % 1;
}
/** Breaking wave cycle at a coast segment (0..1): each stretch of coast has its own slow beat. */
export const surfPhase = (mx: number, my: number, t: number, period: number) => (((t / period + vnoise(mx * 0.012, my * 0.018, 1311) * 1.7 + vnoise(mx * 0.004, my * 0.006, 1312) * 0.6) % 1) + 1) % 1;

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
/** Painted ripple variant i (0..3): different length, curvature, thickness and lean, so no two marks repeat a shape. */
export const rippleVariant = (i: number) => brush(`ripple${i}`, 96, 32, (g) => {
  const bend = [7, 4.5, 9, 3][i]!, thick = [3.2, 2.4, 2.8, 2][i]!, lean = [0, 0.18, -0.12, 0.3][i]!, span = [84, 70, 78, 60][i]!;
  const x0 = (96 - span) / 2;
  const stroke = (dy: number, col: string, wmax: number) => {
    for (let k = 0; k < 36; k++) {
      const t0 = k / 36, t1 = (k + 1) / 36, w = wmax * Math.pow(Math.sin(Math.PI * (t0 + t1) / 2), 0.8) * (1 - lean * (t0 - 0.5));
      const y = (t: number) => 17 + dy - bend * Math.sin(Math.PI * t) + lean * 10 * (t - 0.5);
      g.strokeStyle = col; g.lineWidth = Math.max(0.3, w); g.lineCap = "round"; g.beginPath(); g.moveTo(x0 + span * t0, y(t0)); g.lineTo(x0 + span * t1, y(t1)); g.stroke();
    }
  };
  stroke(3, "rgba(20,56,64,0.42)", thick * 1.3); stroke(0, "rgba(206,228,220,0.8)", thick); stroke(-0.7, "rgba(244,249,240,0.7)", thick * 0.4);
});
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
let quality: QualityState = { level: 2, slow: 0, fast: 0, ema: 0 }, lastFrame = 0;
/** Fed once per drawn frame; returns the density scale for the water layer. ?waterq=0|1|2 pins a level for tests. */
export function waterQuality(now: number): number {
  if (pinned !== null) return QUALITY_SCALE[pinned]!;
  if (lastFrame) quality = nextQuality(quality, now - lastFrame);
  lastFrame = now;
  return QUALITY_SCALE[quality.level]!;
}
export const waterQualityLevel = () => (pinned ?? quality.level);
let pinned: number | null = (() => { try { const v = new URLSearchParams(location.search).get("waterq"); return v === "0" || v === "1" || v === "2" ? Number(v) : null; } catch { return null; } })();
/** Debug/probe only: pin the water quality level (0..2) or hand it back to the adaptive control (null). */
if (typeof window !== "undefined") (window as unknown as { __setWaterQ?: (q: number | null) => void }).__setWaterQ = (q) => { pinned = q === 0 || q === 1 || q === 2 ? q : null; };
