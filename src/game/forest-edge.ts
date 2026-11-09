/**
 * PROTOTYPE (Pilot 3, test map only): forest core + organic forest fringe.
 * Pure geometry from world tile coordinates — identical in every chunk and camera, computed
 * only while a ground chunk is baked. render.ts uses it solely when labEdge() is set (realm "lab").
 */
import type { Terrain } from "./world";

export const TW = 32, TH = 16;
export type Pt = [number, number];
export type EdgeParams = { core: number; grain: number };
const iso = (x: number, y: number): Pt => [(x - y) * (TW / 2), (x + y) * (TH / 2)];
/** inverse of iso: world pixel -> fractional tile */
export const tileAt = (px: number, py: number): Pt => [py / TH + px / TW, py / TH - px / TW];
const h = (x: number, y: number, s: number) => {
  let n = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296;
};
/** fringe may only lie on grassland/field/hill — never water, sand or rock */
export const fringeOk = (t: Terrain) => t === "grass" || t === "meadow" || t === "fertile" || t === "hill";
/** diamond "distance" of a point from a tile centre: 1 = tile corner/edge */
export const diamondDist = (dx: number, dy: number) => Math.abs(dx) / (TW / 2) + Math.abs(dy) / (TH / 2);

/** Core diamond of a forest tile scaled by `core` (0.85 = 85 % of the tile diamond). */
export function coreDiamond(x: number, y: number, core: number): Pt[] {
  const [cx, cy] = iso(x, y), a = (TW / 2) * core, b = (TH / 2) * core;
  return [[cx, cy - b], [cx + a, cy], [cx, cy + b], [cx - a, cy]];
}

/** All extra forest polygons (cores + fringe blobs) for tiles x0..x1 / y0..y1 (inclusive). */
export function forestExtra(x0: number, x1: number, y0: number, y1: number, ter: (x: number, y: number) => Terrain, p: EdgeParams): Pt[][] {
  const out: Pt[][] = [];
  const N4: Pt[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (ter(x, y) !== "forest") continue;
    out.push(coreDiamond(x, y, p.core));
    if (p.grain <= 0) continue;
    for (const [dx, dy] of N4) {
      if (!fringeOk(ter(x + dx, y + dy))) continue;
      // shared edge between the two tiles, in tile space
      const ex = x + dx * 0.5, ey = y + dy * 0.5, tx = dy !== 0 ? 1 : 0, ty = dx !== 0 ? 1 : 0;
      const n = Math.max(2, Math.round(TW * 0.56 / (p.grain * 1.6)));
      const s = 17 + (dx + 1) * 3 + (dy + 1);
      for (let i = 0; i < n; i++) {
        const k = h(x, y, s * 31 + i);
        if (k < 0.3) continue; // gaps: grass bays between tongues
        const u = (i + 0.5) / n - 0.5 + (h(x, y, s * 37 + i) - 0.5) * 0.6 / n;
        const out1 = 0.05 + h(x, y, s * 41 + i) * 0.22; // reach into the grass tile
        const cxT = ex + tx * u + dx * out1, cyT = ey + ty * u + dy * out1;
        const ct = [Math.round(cxT), Math.round(cyT)] as const;
        if (!fringeOk(ter(ct[0], ct[1])) && ter(ct[0], ct[1]) !== "forest") continue;
        const [px, py] = iso(cxT, cyT), r = p.grain * (0.6 + h(x, y, s * 43 + i) * 0.7);
        const poly: Pt[] = [];
        for (let v = 0; v < 6; v++) {
          const ang = (v / 6) * Math.PI * 2 + h(x, y, s * 47 + i) * 1.2, rr = r * (0.65 + h(x, y, s * 53 + i * 7 + v) * 0.6);
          poly.push([px + Math.cos(ang) * rr, py + Math.sin(ang) * rr * 0.55]);
        }
        if (poly.some(([a, b]) => { const [qx, qy] = tileAt(a, b), t = ter(Math.round(qx), Math.round(qy)); return t !== "forest" && !fringeOk(t); })) continue;
        out.push(poly);
      }
    }
  }
  return out;
}
