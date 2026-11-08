/**
 * Winter way surfaces: procedural, tileable noise textures laid on the iso ground plane (world-anchored
 * like texture()), so a trodden path reads as one continuous material with irregular alpha — never as
 * rows of ellipses or dashes. Pure functions of a fixed seed: identical on every client.
 */
type C = CanvasRenderingContext2D;
export type WayTex = "pack" | "fringe" | "slush" | "rut" | "ice";

const N = 256;
/** Periodic value noise (wraps at the tile edge, so the pattern has no seams). */
function lattice(period: number, seed: number) {
  const g = new Float32Array(period * period);
  let s = seed * 9301 + 49297;
  for (let i = 0; i < g.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; g[i] = s / 0x7fffffff; }
  return (x: number, y: number) => {
    const fx = (x / N) * period, fy = (y / N) * period, x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = (i: number, j: number) => g[((j % period + period) % period) * period + ((i % period + period) % period)]!;
    const top = a(x0, y0) + (a(x0 + 1, y0) - a(x0, y0)) * sx, bot = a(x0, y0 + 1) + (a(x0 + 1, y0 + 1) - a(x0, y0 + 1)) * sx;
    return top + (bot - top) * sy;
  };
}
function fbm(seed: number, base: number, oct: number) {
  const ls = Array.from({ length: oct }, (_, k) => lattice(base << k, seed + k * 17));
  return (x: number, y: number) => { let v = 0, a = 0.5, t = 0; for (const l of ls) { v += l(x, y) * a; t += a; a *= 0.5; } return v / t; };
}
const smooth = (e0: number, e1: number, v: number) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

function paint(kind: WayTex): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas"); cv.width = cv.height = N;
  const g = cv.getContext("2d"); if (!g) return null;
  const im = g.createImageData(N, N), d = im.data;
  const lo = fbm(11, 3, 4), hi = fbm(29, 8, 4), fine = fbm(53, 24, 3), patch = fbm(71, 4, 5);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4, l = lo(x, y), h = hi(x, y), f = fine(x, y);
    let r = 0, gg = 0, b = 0, a = 0;
    if (kind === "pack" || kind === "fringe") {
      // compacted snow: grey-beige, cloudy tone shifts, fine grain of trampled crystals
      const t = 0.55 * l + 0.3 * h + 0.15 * f;
      r = 168 + t * 42; gg = 164 + t * 42; b = 154 + t * 46;
      a = kind === "pack" ? 0.82 + (h - 0.5) * 0.3 : smooth(0.42, 0.62, 0.6 * l + 0.4 * h) * 0.75; // fringe: ragged, broken verge
    } else if (kind === "slush") {
      // earth and churned slush showing through only in scattered, irregular patches
      const m = smooth(0.6, 0.74, 0.7 * patch(x, y) + 0.3 * h);
      const wet = f;
      r = 92 + wet * 40; gg = 76 + wet * 30; b = 58 + wet * 24;
      a = m * (0.55 + f * 0.45);
    } else if (kind === "rut") {
      // darker, deeper-pressed snow with brown water in it — varies in strength, often breaks off
      const m = smooth(0.32, 0.6, 0.65 * l + 0.35 * h);
      r = 128 + f * 30; gg = 116 + f * 26; b = 100 + f * 22;
      a = m * (0.45 + 0.4 * f);
    } else {
      // icy glaze: pale, slightly blue, sparse
      const m = smooth(0.66, 0.78, 0.6 * patch(x + 97, y + 41) + 0.4 * l);
      r = 214 + f * 26; gg = 224 + f * 22; b = 232 + f * 18;
      a = m * 0.6;
    }
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = Math.round(Math.min(1, Math.max(0, a)) * 255);
  }
  g.putImageData(im, 0, 0);
  return cv;
}

/** World units covered by one repeat — large enough that no grid shows along a road. */
const SPAN: Record<WayTex, number> = { pack: 64, fringe: 46, slush: 90, rut: 38, ice: 110 };
const ANG: Record<WayTex, number> = { pack: 45, fringe: 63, slush: 21, rut: 45, ice: 72 };
const pats = new Map<WayTex, CanvasPattern>();
const M = typeof DOMMatrix !== "undefined" ? new DOMMatrix() : (null as unknown as DOMMatrix);
export function wayTexture(c: C, k: WayTex): CanvasPattern | null {
  let p = pats.get(k);
  if (!p) { const cv = paint(k); if (!cv) return null; p = c.createPattern(cv, "repeat") ?? undefined; if (!p) return null; pats.set(k, p); }
  const s = SPAN[k] / N;
  M.setMatrixValue("none");
  p.setTransform(M.scaleSelf(1, 0.5).rotateSelf(ANG[k]).scaleSelf(s, s));
  return p;
}
