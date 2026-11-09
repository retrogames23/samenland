/**
 * PROTOTYPE (Pilot 3, test map only): forest core + organic forest fringe.
 * Pure geometry from world tile coordinates — identical in every chunk and camera, computed
 * only while a ground chunk is baked. render.ts uses it solely when labEdge() is set (realm "lab").
 */
import type { Terrain } from "./world";

export const TW = 32, TH = 16;
export type Pt = [number, number];
export type EdgeParams = { core: number; grain: number; v2?: boolean };
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

// ---------------------------------------------------------------------------------------------
// Iteration 2: one combined forest outline replacing the hard contour of layer 6 (test map only).
// Every forest tile contributes a star-shaped polygon around its centre: toward forest neighbours it
// overlaps them (so the area is one connected surface), toward grassland its radius follows a
// world-anchored smooth noise (2–4 lobes per edge = tongues + grass bays), toward water/sand/rock it
// stays inside its own tile. Because each lobe grows out of its tile's centre, no fringe piece can
// ever be isolated, and tree feet (≤ 0.69 diamond distance) always lie inside (radius ≥ core + 0.05).
const vn = (x: number, y: number, s: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = h(xi, yi, s), b = h(xi + 1, yi, s), c = h(xi, yi + 1, s), d = h(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
export const SHAPE_ANG = 48;
/** grain (2.5 fine … 6 coarse) -> how far tongues may reach beyond the tile edge, in tile-diamond units */
export const reachOf = (grain: number) => Math.min(0.42, 0.18 + grain * 0.04);
const dirOf = (k: number): Pt => { const th = (k / SHAPE_ANG) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), n = Math.abs(c) + Math.abs(s); return [(c / n) * (TW / 2), (s / n) * (TH / 2)]; };
const DIRS: Pt[] = Array.from({ length: SHAPE_ANG }, (_, k) => dirOf(k));
const tileOf = (px: number, py: number) => { const [a, b] = tileAt(px, py); return [Math.round(a), Math.round(b)] as const; };

/** Star polygons forming the whole forest surface for tiles x0..x1 / y0..y1 (inclusive). */
export function forestShape(x0: number, x1: number, y0: number, y1: number, ter: (x: number, y: number) => Terrain, p: EdgeParams): Pt[][] {
  const out: Pt[][] = [], reach = reachOf(p.grain), base = p.core + 0.08;
  const R = new Float32Array(SHAPE_ANG), kind = new Int8Array(SHAPE_ANG); // 0 forest, 1 grass, 2 forbidden
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (ter(x, y) !== "forest") continue;
    const [cx, cy] = iso(x, y);
    for (let k = 0; k < SHAPE_ANG; k++) {
      const [dx, dy] = DIRS[k]!, [nx, ny] = tileOf(cx + dx * 1.04, cy + dy * 1.04), t = ter(nx, ny);
      if (t === "forest") { kind[k] = 0; R[k] = 1.12; continue; }
      // world-anchored noise sampled at the tile border point: neighbouring tiles agree on positions
      const [bx, by] = tileAt(cx + dx, cy + dy);
      const n = vn(bx * 0.9, by * 0.9, 811) * 0.75 + vn(bx * 2.4, by * 2.4, 812) * 0.25; // few large tongues/bays
      if (fringeOk(t)) { kind[k] = 1; R[k] = 0.74 + (1 + reach - 0.74) * Math.min(1, Math.max(0, (n - 0.25) * 1.9)); } // bays cut into the old edge down to the tree zone
      else { kind[k] = 2; R[k] = 0.9 + 0.08 * n; }
    }
    // circular smoothing removes radial steps (no spikes, no straight diamond facets)
    for (let pass = 0; pass < 2; pass++) { const c = R.slice(); for (let k = 0; k < SHAPE_ANG; k++) R[k] = (c[(k + SHAPE_ANG - 1) % SHAPE_ANG]! + 2 * c[k]! + c[(k + 1) % SHAPE_ANG]!) / 4; }
    const poly: Pt[] = [];
    for (let k = 0; k < SHAPE_ANG; k++) {
      let r = Math.max(R[k]!, 0.72); // tree feet ≤ 0.69 stay on forest floor
      if (kind[k] === 0) r = Math.max(r, 1.06);
      if (kind[k] === 2) r = Math.min(r, 0.98);
      const [dx, dy] = DIRS[k]!;
      // never reach onto forbidden ground anywhere along the ray
      for (let f = 0.9; f <= r; f += 0.04) { const [tx, ty] = tileOf(cx + dx * f, cy + dy * f), t = ter(tx, ty); if (t !== "forest" && !fringeOk(t)) { r = Math.min(r, Math.max(p.core + 0.05, f - 0.04)); break; } }
      poly.push([cx + dx * r, cy + dy * r]);
    }
    out.push(poly);
  }
  return out;
}
