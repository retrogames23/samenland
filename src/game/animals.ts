import { worldHour } from "./time";
import { hash, terrain } from "./world";

/** Share of lowland pastures grazed by cattle (Hallenhaus country c. 1500); the rest keep sheep. */
export const COW_SHARE = 0.65;
/** Which herd grazes a pasture tile: slopes and lean sand keep sheep, lowland mostly cattle. Display only. */
export function herdAt(x: number, y: number): "cow" | "sheep" {
  const t = terrain(x, y);
  if (t === "hill" || t === "sand" || t === "mountain") return "sheep";
  return hash(x, y, 1509) < COW_SHARE ? "cow" : "sheep";
}

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
  // long calm grazing stops, then an unhurried walk of a visible distance to the next tuft
  const cycle = 16000 + hash(sd, k, 5) * 12000, walkMs = 3500 + hash(sd, k, 6) * 1500;
  const tt = t + hash(sd, k, 7) * cycle, i = Math.floor(tt / cycle), u = tt - i * cycle;
  // each sheep keeps its own zone of the pasture so the flock never stacks, but roams it widely
  const lx = (k - 1) * 5, ly = (k % 2 ? 1.4 : -0.8);
  const spot = (j: number): [number, number] => {
    let x = lx + (hash(sd, k * 31 + j, 8) - 0.5) * 6, y = ly + (hash(sd, k * 31 + j, 9) - 0.5) * 3.6;
    const r = Math.abs(x) / 10.5 + Math.abs(y) / 5.2; // stay inside the fenced rhombus
    if (r > 1) { x /= r; y /= r; }
    return [x, y];
  };
  const a = spot(i), b = spot(i + 1), into = u - (cycle - walkMs);
  if (into > 0) {
    const f = into / walkMs, e = f * f * (3 - 2 * f);
    return { dx: a[0] + (b[0] - a[0]) * e, dy: a[1] + (b[1] - a[1]) * e, walking: !sleeping, flip: b[0] < a[0], graze: false, sleeping };
  }
  const prev = spot(i - 1);
  // head down most of the stop; now and then it lifts its head for a few seconds to chew and look round
  return { dx: a[0], dy: a[1], walking: false, flip: a[0] < prev[0], graze: !sleeping && Math.sin(u / 4200 + k * 1.7) <= 0.9, sleeping };
}