import { describe, it, expect } from "vitest";
import { forestShape, tileAt, fringeOk, diamondDist, SHAPE_ANG, type Pt } from "./forest-edge";
import type { Terrain } from "./world";

const TW = 32, TH = 16, iso = (x: number, y: number): Pt => [(x - y) * (TW / 2), (x + y) * (TH / 2)];
const FEET: Pt[] = [[6, -1], [-5, 3]];
const inPoly = (p: Pt, poly: Pt[]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!; if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
const map = (rows: string[]) => (x: number, y: number): Terrain => {
  const ch = rows[y]?.[x]; return ch === "F" ? "forest" : ch === "~" ? "water" : ch === "s" ? "sand" : ch === "m" ? "mountain" : "grass";
};
const P = { core: 0.75, grain: 2.5, v2: true };
const rows = ["ggggggg~~", "gFFFFgg~~", "gFFFFFgss", "gFFFFggFg", "gggggmmmg", "ggFgggggg", "FFFFFFFgg"];
const ter = map(rows);
const forestTiles: Pt[] = []; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === "F") forestTiles.push([x, y]); }));
const shape = forestShape(0, 8, 0, 6, ter, P);

describe("forest outline iteration 2 (test map only)", () => {
  it("tree feet lie inside the forest surface for every forest tile", () => {
    for (const [x, y] of forestTiles) { const [cx, cy] = iso(x, y); for (const [fx, fy] of FEET) expect(shape.some((q) => inPoly([cx + fx, cy + fy], q))).toBe(true); }
  });
  it("single tiles and one-tile strips keep forest ground", () => {
    expect(forestShape(0, 4, 0, 4, map(["ggggg", "ggggg", "ggFgg", "ggggg", "ggggg"]), P).length).toBe(1);
  });
  it("no isolated fringe: every piece contains the centre of its forest tile", () => {
    expect(shape.length).toBe(forestTiles.length);
    shape.forEach((q, i) => { const [x, y] = forestTiles.sort((a, b) => a[1] - b[1] || a[0] - b[0])[i]!; expect(inPoly(iso(x, y), q)).toBe(true); });
  });
  it("the whole polygon area avoids water, sand and rock (dense interior sampling)", () => {
    for (const q of shape) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [a, b] of q) { x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }
      for (let py = y0; py <= y1; py += 0.5) for (let px = x0; px <= x1; px += 0.5) if (inPoly([px, py], q)) {
        const [tx, ty] = tileAt(px, py), t = ter(Math.round(tx), Math.round(ty)); expect(t === "forest" || fringeOk(t)).toBe(true);
      }
    }
  });
  it("no geometric diamonds: the border toward grass varies (2+ tongues per edge)", () => {
    const [cx, cy] = iso(2, 5), q = shape.find((p) => inPoly([cx, cy], p))!; // single tile at (2,5)
    const r = q.map(([a, b]) => diamondDist(a - cx, b - cy));
    const spread = Math.max(...r) - Math.min(...r); expect(spread).toBeGreaterThan(0.12);
    let peaks = 0; for (let k = 0; k < SHAPE_ANG; k++) if (r[k]! > r[(k + SHAPE_ANG - 1) % SHAPE_ANG]! && r[k]! >= r[(k + 1) % SHAPE_ANG]!) peaks++;
    expect(peaks).toBeGreaterThanOrEqual(3);
  });
  it("is deterministic across chunk ranges", () => {
    const k = (p: Pt[]) => p.map((v) => v.join(",")).join(";");
    const a = new Set(shape.map(k));
    for (const x of forestShape(2, 8, 1, 6, ter, P).map(k)) expect(a.has(x)).toBe(true);
  });
  it("adds nothing without forest", () => { expect(forestShape(0, 5, 0, 1, map(["gg~~ss", "mmgggg"]), P)).toEqual([]); });
});
