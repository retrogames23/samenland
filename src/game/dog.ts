// Village dog (10 € supporter reward): purely cosmetic. Only the reward row and the chosen name are stored;
// the dog's routine is derived from the world clock and the mayor's pose. Its smooth chase position is local
// per client (like the steered mayor), so it never feeds back into the game.
import { hash } from "./world";

export type DogPose = { x: number; y: number; mode: "trot" | "walk" | "sit" | "sleep"; flip: boolean; dist: number };
type St = DogPose & { t: number; tx: number; ty: number; wait: number; moving: boolean; side: number; tile: number };
const state = new Map<string, St>();

/** Night: the dog sleeps on its sheepskin by the mayor's door. */
export const dogAsleep = (hour: number) => hour >= 22 || hour < 6;

/**
 * Advance the dog of one village to wall time `now`.
 * home: tile in front of the mayor's seat; mayor: the mayor's current pose (if visible); free: walkable test.
 */
export function dogStep(sid: string, home: [number, number], mayor: { x: number; y: number; walking: boolean } | null,
  hour: number, now: number, free: (x: number, y: number) => boolean): DogPose {
  let s = state.get(sid);
  if (!s) { s = { x: home[0], y: home[1] + 0.3, mode: "sit", flip: false, dist: 0, t: now, tx: home[0], ty: home[1], wait: 0, moving: false, side: -0.45, tile: -1 }; state.set(sid, s); }
  const dt = Math.min(0.25, Math.max(0, (now - s.t) / 1000)); s.t = now;
  const asleep = dogAsleep(hour);
  const awayMayor = mayor && Math.hypot(mayor.x - home[0], mayor.y - home[1]) > 3;
  if (asleep) { s.tx = home[0]; s.ty = home[1] + 0.3; }
  else if (mayor && (mayor.walking || awayMayor)) {
    // heel: trail just behind and beside the mayor, a little side-step every few seconds
    const side = hash(Math.floor(now / 4000), 3, 771) < 0.5 ? -0.45 : 0.45;
    s.side += (side - s.side) * Math.min(1, dt * 1.5); // glide to the other side instead of jumping
    s.tx = mayor.x + s.side; s.ty = mayor.y + 0.35;
  } else if (Math.hypot(s.tx - s.x, s.ty - s.y) < 0.15 && (s.wait -= dt) <= 0) {
    // romp: hashed sniffing spots around the house, with short sitting pauses in between
    const k = Math.floor(now / 1000);
    for (let i = 0; i < 6; i++) {
      const a = hash(k, i, 772) * Math.PI * 2, r = 0.8 + hash(k, i, 773) * 2.6;
      const x = home[0] + Math.cos(a) * r, y = home[1] + Math.sin(a) * r * 0.9;
      if (free(Math.round(x), Math.round(y))) { s.tx = x; s.ty = y; break; }
    }
    s.wait = 1.5 + hash(k, 9, 774) * 5;
  }
  const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
  if (d > 14) { s.x = s.tx; s.y = s.ty; } // left far behind (camera jump, knight's gallop): catch up out of sight
  const heel = !!mayor && !asleep && (mayor.walking || awayMayor);
  // hysteresis: stop when close, only start again once clearly behind — no sit/trot flicker at heel
  const stop = heel ? 0.4 : 0.08, go = heel ? 0.75 : 0.15;
  s.moving = s.moving ? d > stop : d > go;
  if (s.moving && d <= 14) {
    const sp = d > 2 ? 2.4 : d > 0.9 ? 1.1 : 0.45; // trot to catch up, amble at the mayor's pace when close
    const m = Math.min(Math.max(0, d - stop * 0.5), sp * dt);
    s.x += (dx / d) * m; s.y += (dy / d) * m; s.dist += m;
    const sx = dx - dy; if (Math.abs(sx) > 0.25 * Math.max(0.3, Math.min(1, d))) s.flip = sx < 0; // dead zone on iso diagonals
    s.mode = sp > 1 ? "trot" : "walk";
  } else s.mode = asleep && d < 0.3 ? "sleep" : "sit";
  return { x: s.x, y: s.y, mode: s.mode, flip: s.flip, dist: s.dist };
}

/** Depth tile with hysteresis: only switch rows/columns once the dog is 0.2 past the seam. */
export function dogTile(sid: string, x: number, y: number, map: number): number {
  const s = state.get(sid); const rx = Math.round(x), ry = Math.round(y);
  if (!s) return ry * map + rx;
  if (s.tile >= 0) {
    const ox = s.tile % map, oy = Math.floor(s.tile / map);
    if (Math.abs(x - ox) < 0.7 && Math.abs(y - oy) < 0.7) return s.tile;
  }
  s.tile = ry * map + rx; return s.tile;
}
