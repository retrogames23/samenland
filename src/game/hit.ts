/** Shared pointer hit-test for drawn villagers (hover and click use the same function). */
export type HitFig<T> = { x: number; y: number; q: { p: T } };

/** Visible body in world units: feet at (x, y), head about 11 units above, ~2.5 to each side. */
export const BODY_HALF_W = 2.5;
export const BODY_H = 11;
/** Max tolerance around the body, in CSS pixels. */
export const HIT_PX_MOUSE = 24;
export const HIT_PX_TOUCH = 34;

/**
 * Figure under a world point. Distance is measured to the figure's head-to-foot box, capped at the
 * pixel tolerance. A point inside several bodies picks the front-most one (largest y, drawn last).
 */
export function personHit<T>(figs: readonly HitFig<T>[], wx: number, wy: number, zoom: number, coarse: boolean): T | null {
  const tol = Math.max(3, (coarse ? HIT_PX_TOUCH : HIT_PX_MOUSE) / zoom);
  let inside: HitFig<T> | null = null, near: HitFig<T> | null = null, nd = tol;
  for (const f of figs) {
    const dx = Math.max(0, Math.abs(wx - f.x) - BODY_HALF_W);
    const dy = wy > f.y ? wy - f.y : wy < f.y - BODY_H ? f.y - BODY_H - wy : 0;
    const d = Math.hypot(dx, dy);
    if (d === 0) { if (!inside || f.y > inside.y) inside = f; }
    else if (d < nd) { nd = d; near = f; }
  }
  return (inside ?? near)?.q.p ?? null;
}
