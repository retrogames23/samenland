/** Pure path sampling shared by villagers and road traffic; no frame-dependent facing state. */
export type MotionPoint = readonly [number, number];

export function pathPoint(points: readonly MotionPoint[], progress: number): [number, number] {
  if (!points.length) return [0, 0];
  const f = Math.max(0, Math.min(points.length - 1, progress));
  const i = Math.floor(f), a = points[i];
  if (!a) return [0, 0];
  const b = points[i + 1] ?? a, u = f - i;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}

/** A neighbourhood tangent suppresses staircase flips, reversing exactly on the return leg. */
export function pathHeading(points: readonly MotionPoint[], progress: number, forward = true, span = 3): [number, number] {
  const a = pathPoint(points, progress - span), b = pathPoint(points, progress + span);
  const sign = forward ? 1 : -1;
  const dx = (b[0] - a[0]) * sign, dy = (b[1] - a[1]) * sign;
  const len = Math.hypot(dx, dy);
  if (len > 0.000001) return [dx / len, dy / len];
  const c = pathPoint(points, progress), d = pathPoint(points, progress + (forward ? 1 : -1));
  const dl = Math.hypot(d[0] - c[0], d[1] - c[1]);
  return dl ? [(d[0] - c[0]) / dl, (d[1] - c[1]) / dl] : [0, sign];
}

/** Side-view sprites have two facings; near-vertical travel gets a stable deterministic tie-break. */
export function screenFacing(dx: number, dy: number): 1 | -1 {
  return Math.abs(dx) > 0.12 * Math.hypot(dx, dy) ? (dx < 0 ? -1 : 1) : (dy < 0 ? -1 : 1);
}

/** The path has N-1 segments, not N: never extrapolate past either endpoint. */
export function roadMotion(points: readonly MotionPoint[], phase: number) {
  const end = Math.max(0, points.length - 1);
  if (!end) return { position: pathPoint(points, 0), direction: [0, 1] as [number, number], forward: true, index: 0 };
  const p = ((phase % (2 * end)) + 2 * end) % (2 * end);
  const forward = p < end, progress = forward ? p : 2 * end - p;
  return { position: pathPoint(points, progress), direction: pathHeading(points, progress, forward), forward, index: Math.min(end - 1, Math.floor(progress)) };
}