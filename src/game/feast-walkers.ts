/**
 * Feast figures (stage 2): star singers, the Whitsun ox and St Martin on horseback.
 * Pure functions of town tiles + realm hour — never stored, so every client sees the same walkers.
 */
import { hash } from "./world";

export type Tile = [number, number];
export type Walk = { x: number; y: number; dx: number; dy: number; walking: boolean };

/** Position along a polyline, eased between hours t0 and t1; holds the ends outside that window. */
export function alongPath(pts: Tile[], h: number, t0: number, t1: number): Walk {
  const u0 = Math.max(0, Math.min(1, (h - t0) / (t1 - t0))), u = u0 * u0 * (3 - 2 * u0);
  const seg: number[] = []; let len = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]); seg.push(d); len += d; }
  let rest = u * len, i = 0;
  while (i < seg.length - 1 && rest > seg[i]!) { rest -= seg[i]!; i++; }
  const a = pts[i]!, b = pts[Math.min(i + 1, pts.length - 1)]!, f = seg[i] ? rest / seg[i]! : 0;
  return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, dx: b[0] - a[0], dy: b[1] - a[1], walking: h > t0 && h < t1 };
}

/** Three children aged 7–13 sing the star from door to door at Epiphany; none if fewer than three. */
export function pickStarSingers(kids: { id: number; age: number }[], key: number): number[] {
  const ok = kids.filter((k) => k.age >= 7 && k.age <= 13).sort((a, b) => hash(a.id, key, 1801) - hash(b.id, key, 1801));
  return ok.length >= 3 ? ok.slice(0, 3).map((k) => k.id) : [];
}

/** Door round: up to 12 houses, nearest-neighbour from a hashed start, so the trio never zigzags across town. */
export function starRound(doors: Tile[], key: number): Tile[] {
  if (!doors.length) return [];
  const left = [...doors], out: Tile[] = [left.splice(Math.floor(hash(key, 3, 1802) * left.length), 1)[0]!];
  while (out.length < 12 && left.length) {
    const c = out[out.length - 1]!; let bi = 0, bd = Infinity;
    left.forEach((d, i) => { const dd = Math.hypot(d[0] - c[0], d[1] - c[1]); if (dd < bd) { bd = dd; bi = i; } });
    out.push(left.splice(bi, 1)[0]!);
  }
  return out;
}
export const STAR_FROM = 10.6, STAR_STOP = 0.45;

/** Whitsun ox: led in from the edge 9.5–11 h, then stands garlanded by the birch tree until 18 h. */
export const OX_IN = 9.5, OX_AT = 11, OX_OUT = 18;
export function oxWalk(from: Tile, tree: Tile, h: number): Walk | null {
  if (h < OX_IN || h >= OX_OUT) return null;
  return alongPath([from, [tree[0] + 1, tree[1] + 0.6]], h, OX_IN, OX_AT);
}

/** St Martin rides to the church 11.4–12.4 h and stays there until the lantern walk at 17 h. */
export const MARTIN_IN = 11.4, MARTIN_AT = 12.4, MARTIN_OUT = 17;
export function martinWalk(from: Tile, church: Tile, h: number): Walk | null {
  if (h < MARTIN_IN || h >= MARTIN_OUT) return null;
  return alongPath([from, [church[0] + 0.8, church[1] + 1]], h, MARTIN_IN, MARTIN_AT);
}
