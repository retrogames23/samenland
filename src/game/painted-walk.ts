/** P6c experiment: the supplied painted 12-frame walk of the ordinary villager ("man"), as a third display variant
 *  next to the skeletal rig (walk-rig.ts) and the old 8-frame sheet. Display only; frames are chosen from the
 *  distance the figure walks (stepGait with a fixed loop length), never from the wall clock. */
import { MAN_WALK12 } from "./man-walk12-data";

export const PAINTED_FRAMES = 12;
/** Frame 0 is the most upright pose (feet together, arms hanging): it doubles as the standing pose. */
export const PAINTED_STAND = 0;
/** Shortest ground stretch (cell px) a frame is shown for, so no frame flashes past. */
export const PAINTED_MIN_STEP = 4;

/** Ground (cell px of the 240 px cell) each frame stays on screen: as far as the painted front sole moves back until
 *  the next frame, so while that foot is planted it keeps its place on the ground. Where the painting moves the sole
 *  forward instead (heel roll, the hand-over to the other foot) the frame gets the minimum and the foot jumps. */
export const PAINTED_DUR: readonly number[] = MAN_WALK12.frames.map((fr, f) => {
  const next = MAN_WALK12.frames[(f + 1) % PAINTED_FRAMES]!;
  return Math.max(PAINTED_MIN_STEP, fr.heel - next.heel);
});
/** Ground one pass through the 12 frames covers (cell px): the sum of the frame stretches. */
export const PAINTED_LOOP = PAINTED_DUR.reduce((a, b) => a + b, 0);
const START = PAINTED_DUR.map((_, f) => PAINTED_DUR.slice(0, f).reduce((a, b) => a + b, 0));
// the figure slides back with the ground inside each frame; this constant keeps that shift zero on average
const MEAN = PAINTED_DUR.reduce((a, d) => a + (d * d) / 2, 0) / PAINTED_LOOP;

function locate(u: number): { f: number; frac: number } {
  const g = (((u % 1) + 1) % 1) * PAINTED_LOOP;
  let f = PAINTED_FRAMES - 1;
  while (f > 0 && START[f]! > g) f--;
  return { f, frac: Math.min(1, (g - START[f]!) / PAINTED_DUR[f]!) };
}

/** Frame shown at loop phase u ∈ [0, 1). */
export const paintedFrame = (u: number): number => locate(u).f;

/** Shift (cell px, negative = backwards) that moves the drawn figure with the ground between two frame changes, so
 *  the planted foot does not stand still for a frame and then jump; zero on average over the loop. */
export function paintedSlide(u: number): number {
  const { f, frac } = locate(u);
  return MEAN - frac * PAINTED_DUR[f]!;
}
