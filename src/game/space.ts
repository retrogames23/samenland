// Derived personal space: footprints on the ground and a pure, deterministic separation pass.
// Nothing is stored — same inputs give the same result on every client.
import { sheepPose } from "./animals";

/** Ground footprint radii in screen units at zoom 1 (tile = 32x16). */
export const FOOT = { adult: 2.2, child: 1.7, sheep: 3.4, sheepY: 1.6 } as const;

export type Body = { x: number; y: number; r: number; /** how easily it gets pushed (0 = immovable) */ give: number };

/** Ground distance in iso screen space: vertical counts double, so footprints are flat ellipses. */
const gap = (a: Body, b: Body) => { const dx = b.x - a.x, dy = (b.y - a.y) * 2; return [dx, dy, Math.hypot(dx, dy)] as const; };

/** Pushes overlapping bodies apart along their connecting line (a few passes). Mutates and returns bodies. */
export function separate<T extends Body>(bodies: T[], passes = 3): T[] {
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]!, b = bodies[j]!, tot = a.give + b.give; if (tot <= 0) continue;
      let [dx, dy, d] = gap(a, b); const need = a.r + b.r;
      if (d >= need) continue;
      // exact overlap: split along a stable diagonal (by index) instead of a random direction
      if (d < 1e-6) { dx = ((i + j) & 1) ? 1 : -1; dy = 0.5; d = Math.hypot(dx, dy); }
      const push = need - d, ux = dx / d, uy = dy / d / 2;
      a.x -= ux * push * (a.give / tot); a.y -= uy * push * (a.give / tot);
      b.x += ux * push * (b.give / tot); b.y += uy * push * (b.give / tot);
    }
  }
  return bodies;
}

export const sheepCount = (v: number) => v > 0.7 ? 3 : v > 0.35 ? 2 : 0;
/** The flock on one pasture tile: poses with screen offsets, already kept apart from each other. */
export function sheepSpots(sd: number, v: number, now: number) {
  const flock = Array.from({ length: sheepCount(v) }, (_, k) => ({ k, m: sheepPose(sd, k, now) }));
  const bodies = separate(flock.map(({ m }) => ({ x: m.dx, y: m.dy, r: FOOT.sheep, give: 1 })));
  return flock.map(({ k, m }, i) => ({ k, m: { ...m, dx: bodies[i]!.x, dy: bodies[i]!.y } }));
}

/** Screen offset that keeps a traveller to the right of its heading, so oncoming traffic passes. */
export function keepRight(dx: number, dy: number, lane: number): [number, number] {
  const l = Math.hypot(dx, dy) || 1;
  return [(-dy / l) * lane, (dx / l) * lane * 0.5];
}
