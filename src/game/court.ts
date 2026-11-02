import { MAP, terrain, buildable } from "./world";
import { wonders } from "./wonders";

/** The prince's seat: one fixed estate near the map centre, pure from the shared terrain (same on every client). */
export const COURT_N = 14;
export type CourtPiece = "castle" | "stable" | "fountain" | "pavilion";
/** Footprints in local tiles: [i0, j0, size]; drawn on the front tile (i0+size-1, j0+size-1). */
export const COURT_LAYOUT: Record<CourtPiece, [number, number, number]> = {
  castle: [1, 1, 6], pavilion: [11, 6, 2], stable: [1, 8, 4], fountain: [8, 8, 2],
};
/** Settlers keep this distance (tiles) from the estate centre. */
export const COURT_GUARD = 30;

let site: { x: number; y: number } | null = null;
function ok(x: number, y: number): boolean {
  for (let j = -2; j < COURT_N + 2; j++) for (let i = -2; i < COURT_N + 2; i++) { const t = terrain(x + i, y + j); if (!buildable(t) || t === "forest") return false; }
  for (const w of wonders()) if (w.x > x - 6 && w.x < x + COURT_N + 6 && w.y > y - 6 && w.y < y + COURT_N + 6) return false;
  return true;
}
/** Top-left tile of the estate. */
export function courtSite(): { x: number; y: number } {
  if (site) return site;
  const c = MAP / 2 - COURT_N / 2;
  for (let r = 0; r < 420 && !site; r += 3) {
    for (let a = 0; a < Math.max(1, r * 2); a++) {
      const ang = (a / Math.max(1, r * 2)) * Math.PI * 2, x = Math.round(c + Math.cos(ang) * r), y = Math.round(c + Math.sin(ang) * r);
      if (x > 20 && y > 20 && x < MAP - 40 && y < MAP - 40 && ok(x, y)) { site = { x, y }; break; }
    }
  }
  return (site ??= { x: c, y: c });
}
export const courtCenter = () => { const s = courtSite(); return { x: s.x + COURT_N / 2, y: s.y + COURT_N / 2 }; };
export function inCourt(x: number, y: number) { const s = courtSite(); return x >= s.x - 1 && y >= s.y - 1 && x <= s.x + COURT_N && y <= s.y + COURT_N; }
export function nearCourt(x: number, y: number) { const c = courtCenter(); return Math.hypot(x - c.x, y - c.y) < COURT_GUARD; }
/** Solid estate footprint (castle, stable, fountain, pavilion): nobody walks through these walls. */
export function courtSolid(x: number, y: number): boolean {
  const s = courtSite(), i = x - s.x, j = y - s.y;
  if (i < 0 || j < 0 || i >= COURT_N || j >= COURT_N) return false;
  for (const [i0, j0, n] of Object.values(COURT_LAYOUT)) if (i >= i0 && j >= j0 && i < i0 + n && j < j0 + n) return true;
  return false;
}

let pieceM: Map<number, CourtPiece> | null = null;
/** Front tile key → piece drawn there. */
export function courtPieces(): Map<number, CourtPiece> {
  if (pieceM) return pieceM;
  const s = courtSite(); pieceM = new Map();
  for (const [k, [i, j, n]] of Object.entries(COURT_LAYOUT)) pieceM.set((s.y + j + n - 1) * MAP + s.x + i + n - 1, k as CourtPiece);
  return pieceM;
}

// ---------------- the court household: a pure daily routine on the realm clock ----------------
export type CourtRole = "prince" | "princess" | "herald" | "guard" | "gardener" | "groom";
export type CourtPose = { role: CourtRole; x: number; y: number; walking: boolean; dx: number; dist?: number };
type P = [number, number];
const loop = (pts: P[], period: number, t: number, phase = 0): { p: P; dx: number; walking: boolean; dist: number } => {
  const segs = pts.length, f = (((t / period + phase) % 1) + 1) % 1 * segs, k = Math.floor(f), u = f - k;
  const a = pts[k]!, b = pts[(k + 1) % segs]!;
  // linger a little at each waypoint so walks read calmly
  const w = Math.min(1, Math.max(0, (u - 0.25) / 0.75));
  // distance walked along the loop (tiles) drives the stride, so feet never slide
  let dist = Math.floor(t / period + phase) * 1000;
  for (let i = 0; i < k; i++) { const p0 = pts[i]!, p1 = pts[(i + 1) % segs]!; dist += Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); }
  dist += Math.hypot(b[0] - a[0], b[1] - a[1]) * w;
  return { p: [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w], dx: (b[0] - a[0]) - (b[1] - a[1]), walking: u > 0.25, dist };
};
// walks skirt the fountain (tiles 8–10) and pavilion (11–13 × 6–8) instead of crossing them
const GARDEN: P[] = [[8.2, 5.4], [10.6, 5.4], [10.7, 7.5], [7.6, 7.4]];
const PATROL: P[] = [[11.5, 12.6], [10.8, 10.8], [10.8, 7.6], [7.6, 7.6], [10.8, 7.6], [10.8, 10.8]];
const BEDS: P[] = [[7.6, 1.6], [7.6, 5.2], [12.4, 5.2], [12.4, 1.6]];
const YARD: P[] = [[5.4, 10.4], [5.8, 12.4], [3.2, 12.6], [5.4, 10.4]];

/** Where the court is at `hour` (realm time); `t` is ms for walking phases. */
export function courtPoses(hour: number, t: number): CourtPose[] {
  const s = courtSite(), out: CourtPose[] = [];
  const put = (role: CourtRole, r: { p: P; dx: number; walking: boolean; dist?: number }) => out.push({ role, x: s.x + r.p[0], y: s.y + r.p[1], walking: r.walking, dx: r.dx, dist: r.dist ?? 0 });
  const stay = (p: P, dx = 1) => ({ p, dx, walking: false });
  const day = hour >= 6 && hour < 21;
  if (hour >= 9 && hour < 13) put("prince", stay([7.4, 6.9]));
  else if (hour >= 13 && hour < 17) put("prince", loop(GARDEN, 9e4, t));
  else if (hour >= 17 && hour < 22) put("prince", stay([7.1, 7.6], -1));
  if (hour >= 8 && hour < 13) put("princess", loop(GARDEN, 1.1e5, t, 0.5));
  else if (hour >= 13 && hour < 17) put("princess", loop(GARDEN, 9e4, t, 0.04));
  if (hour >= 7 && hour < 21) put("herald", hour < 13 ? stay([8.2, 7.2], -1) : loop([[12, 12.2], [12.6, 11.4]], 4e4, t));
  put("guard", loop(PATROL, 7e4, t));
  put("guard", day ? loop(PATROL, 7e4, t, 0.5) : stay([12.7, 12.5]));
  if (hour >= 6 && hour < 17) put("gardener", loop(BEDS, 1.2e5, t));
  if (hour >= 6 && hour < 19) put("groom", loop(YARD, 6e4, t));
  return out;
}

// ---------------- audience: who receives a visiting mayor (pure from the realm clock) ----------------
/** Tiles from the estate centre within which a strolling mayor may ask for an audience. */
export const AUDIENCE_REACH = 9;
export type AudienceHost = "prince" | "herald" | "closed";
/** Prince in the morning hall, the steward while he walks or dines, nobody at night. */
export function audienceHost(hour: number): AudienceHost {
  if (hour >= 9 && hour < 13) return "prince";
  if (hour >= 7 && hour < 21) return "herald";
  return "closed";
}
export const atCourt = (x: number, y: number) => { const c = courtCenter(); return Math.hypot(x - c.x, y - c.y) <= AUDIENCE_REACH; };
