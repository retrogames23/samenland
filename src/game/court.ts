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
export const resetCourt = () => { site = null; pieceM = null; };
function ok(x: number, y: number): boolean {
  for (let j = -2; j < COURT_N + 2; j++) for (let i = -2; i < COURT_N + 2; i++) { const t = terrain(x + i, y + j); if (!buildable(t) || t === "forest") return false; }
  for (const w of wonders()) if (w.x > x - 6 && w.x < x + COURT_N + 6 && w.y > y - 6 && w.y < y + COURT_N + 6) return false;
  return true;
}
/** Top-left tile of the estate. */
export function courtSite(): { x: number; y: number } {
  terrain(0, 0); // align with the current map geography
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
/** Court stride (tiles per full gait cycle ≈ 0.4 × figure height); each leg is a whole number of cycles. */
export const COURT_STRIDE = 0.38;
/** Guards march: long calm strides (~0.6 × figure height per step). */
export const GUARD_STRIDE = 0.62;
const cycles = (a: P, b: P, st = COURT_STRIDE) => Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / st));
/** Waypoint deadzone in tiles (~3 px): closer than this counts as arrived. */
const ARRIVE = 0.1;
const loop = (pts: P[], period: number, t: number, phase = 0, st = COURT_STRIDE): { p: P; dx: number; walking: boolean; dist: number } => {
  const segs = pts.length, f = (((t / period + phase) % 1) + 1) % 1 * segs, k = Math.floor(f), u = f - k;
  const a = pts[k]!, b = pts[(k + 1) % segs]!;
  // linger a little at each waypoint so walks read calmly
  const w = Math.min(1, Math.max(0, (u - 0.25) / 0.75));
  // distance-driven stride: every leg holds a whole number of gait cycles, so the figure always
  // arrives (and rests) with closed feet instead of freezing mid-step
  let cyc = 0;
  for (let i = 0; i < k; i++) cyc += cycles(pts[i]!, pts[(i + 1) % segs]!, st);
  cyc += cycles(a, b, st) * w;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), walking = u > 0.25 && len * (1 - w) > ARRIVE;
  // facing hysteresis: a leg with little horizontal screen travel keeps the previous leg's facing
  const sdx = (s0: P, s1: P) => (s1[0] - s0[0]) - (s1[1] - s0[1]);
  let dx = sdx(a, b);
  for (let i = 1; Math.abs(dx) < 0.5 && i < segs; i++) { const p0 = pts[(k - i + segs) % segs]!, p1 = pts[(k - i + 1 + segs) % segs]!; const d = sdx(p0, p1); if (Math.abs(d) >= 0.5) dx = d; }
  return { p: [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w], dx, walking, dist: cyc * st };
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
  put("guard", loop(PATROL, 7e4, t, 0, GUARD_STRIDE));
  put("guard", day ? loop(PATROL, 7e4, t, 0.5, GUARD_STRIDE) : stay([12.7, 12.5]));
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

// ---------------- Hofdienst: two errands on the estate (mirrors DB princely_errand) ----------------
export const ERRANDS = ["gardener", "groom"] as const;
export type Errand = (typeof ERRANDS)[number];
/** Tiles within which the strolling mayor can speak to a court servant. */
export const ERRAND_REACH = 2.2;
/** Realm hours the servant is on the estate (gardener 6–17, groom 6–19). */
export const ERRAND_HOURS: Record<Errand, [number, number]> = { gardener: [6, 17], groom: [6, 19] };
/** The servant the mayor stands next to (nearest within reach), or null. */
export function errandNear(hour: number, t: number, x: number, y: number, skip: ReadonlySet<string> = new Set()): Errand | null {
  let best: Errand | null = null, bd = ERRAND_REACH;
  for (const q of courtPoses(hour, t)) {
    if (q.role !== "gardener" && q.role !== "groom") continue;
    if (skip.has(q.role)) continue;
    const d = Math.hypot(q.x - x, q.y - y);
    if (d <= bd) { bd = d; best = q.role; }
  }
  return best;
}
