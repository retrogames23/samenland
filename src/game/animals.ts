import { worldHour } from "./time";
import { hash } from "./world";

/** Shared realm night: sheep rest from 21:00 through 05:59, never the viewer's local time. */
export function animalsSleeping(now: number): boolean {
  const hour = worldHour(now);
  return hour >= 21 || hour < 6;
}

/** Pure sheep routine in screen-space offsets; frozen at dusk throughout the night. */
export function sheepPose(sd: number, k: number, now: number) {
  const sleeping = animalsSleeping(now), hr = worldHour(now);
  const elapsed = hr >= 21 ? hr - 21 : hr + 3;
  const t = sleeping ? now - elapsed * 3.6e6 : now;
  const cycle = 18000 + hash(sd, k, 5) * 14000, walkMs = 3800 + hash(sd, k, 6) * 1600;
  const tt = t + hash(sd, k, 7) * cycle, i = Math.floor(tt / cycle), u = tt - i * cycle;
  // each sheep keeps its own lane on the pasture (4px apart) so the flock never stacks
  const lx = (k - 1) * 4, ly = (k % 2 ? 1.2 : -0.6);
  const spot = (j: number): [number, number] => [lx + (hash(sd, k * 31 + j, 8) - 0.5) * 3.2, ly + (hash(sd, k * 31 + j, 9) - 0.5) * 1.4];
  const a = spot(i), b = spot(i + 1), into = u - (cycle - walkMs);
  if (into > 0) {
    const f = into / walkMs, e = f * f * (3 - 2 * f);
    return { dx: a[0] + (b[0] - a[0]) * e, dy: a[1] + (b[1] - a[1]) * e, walking: !sleeping, flip: b[0] < a[0], graze: false, sleeping };
  }
  const prev = spot(i - 1);
  return { dx: a[0], dy: a[1], walking: false, flip: a[0] < prev[0], graze: !sleeping && Math.sin(u / 2300 + k) <= 0.82, sleeping };
}