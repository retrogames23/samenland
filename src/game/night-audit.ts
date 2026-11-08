/** Node-only audit of night light masks against their day paintings (used by night-masks.test.ts and scripts/).
 * Reads pixels only — never writes images. Findings are hints for visual review, never an automatic approval. */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const LIT = 24; // night alpha counted as light
export const SOLID = 8; // day alpha counted as building
export const DILATE = 2; // px tolerance for soft edges

export type Blob = { area: number; x: number; y: number; w: number; h: number; aspect: number; fill: number; /** centroid in silhouette box, 0..1 */ cx: number; cy: number; warn: string[] };
export type Audit = { w: number; h: number; nw: number; nh: number; hasAlpha: boolean; lit: number; silhouette: number; outside: number; opaque: boolean; blobs: Blob[] };

export const sha = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 16);

async function alpha(file: string) {
  const img = sharp(file), meta = await img.metadata();
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = new Uint8Array(info.width * info.height);
  for (let i = 0; i < a.length; i++) a[i] = data[i * 4 + 3]!;
  return { a, w: info.width, h: info.height, hasAlpha: !!meta.hasAlpha };
}

export async function audit(dayFile: string, nightFile: string): Promise<Audit> {
  const d = await alpha(dayFile), n = await alpha(nightFile), W = d.w, H = d.h;
  const res: Audit = { w: W, h: H, nw: n.w, nh: n.h, hasAlpha: n.hasAlpha, lit: 0, silhouette: 0, outside: 0, opaque: false, blobs: [] };
  if (n.w !== W || n.h !== H) return res;
  // silhouette, dilated by DILATE px
  const sil = new Uint8Array(W * H); let sx0 = W, sy0 = H, sx1 = 0, sy1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d.a[y * W + x]! > SOLID) {
    res.silhouette++; sx0 = Math.min(sx0, x); sy0 = Math.min(sy0, y); sx1 = Math.max(sx1, x); sy1 = Math.max(sy1, y);
    for (let dy = -DILATE; dy <= DILATE; dy++) for (let dx = -DILATE; dx <= DILATE; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) sil[Y * W + X] = 1; }
  }
  let full = 0;
  for (let i = 0; i < W * H; i++) if (n.a[i]! > LIT) { res.lit++; if (!sil[i]) res.outside++; if (n.a[i]! > 250) full++; }
  res.opaque = res.silhouette > 0 && full > res.silhouette * 0.6;
  // connected light areas (8-neighbourhood)
  const seen = new Uint8Array(W * H), stack: number[] = [];
  for (let i = 0; i < W * H; i++) {
    if (seen[i] || n.a[i]! <= LIT) continue;
    let area = 0, x0 = W, y0 = H, x1 = 0, y1 = 0, mx = 0, my = 0; stack.push(i); seen[i] = 1;
    while (stack.length) {
      const j = stack.pop()!, x = j % W, y = (j / W) | 0; area++; mx += x; my += y;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const k = Y * W + X; if (!seen[k] && n.a[k]! > LIT) { seen[k] = 1; stack.push(k); }
      }
    }
    if (area < 4) continue;
    const w = x1 - x0 + 1, h = y1 - y0 + 1, fill = area / (w * h), share = area / Math.max(1, res.silhouette);
    const b: Blob = { area, x: x0, y: y0, w, h, aspect: +(w / h).toFixed(2), fill: +fill.toFixed(2),
      cx: +((mx / area - sx0) / Math.max(1, sx1 - sx0)).toFixed(2), cy: +((my / area - sy0) / Math.max(1, sy1 - sy0)).toFixed(2), warn: [] };
    if (share > 0.025) b.warn.push(`large (${(share * 100).toFixed(1)} % of silhouette)`);
    if (fill > 0.9 && area > 400) b.warn.push(`rectangular (fill ${b.fill})`);
    if (b.aspect > 4 || b.aspect < 0.15) b.warn.push(`elongated (aspect ${b.aspect})`);
    res.blobs.push(b);
  }
  res.blobs.sort((a, b) => b.area - a.area);
  return res;
}
