/** 8-frame whole-body walk of the ordinary male villager ("man", man-walk8.webp: 160 × 240 px cells, centre x = 80,
 *  ground y = 237). Display only: which frame shows is driven by the distance the figure walks on screen (stepGait in
 *  walk-rig.ts with a fixed loop), never by the wall clock.
 *
 *  Measured in the painted frames (scripts: see PR): the weight-bearing boot moves back under the body by about
 *  184 cell px per loop (two steps), but unevenly from frame to frame (heel: 40, 10, 35, 4, 58, −8, 41, 3 px). */

export const WALK8_FRAMES = 8;
/** The whole sheet is drawn at one common scale so the walking man has the height of his standing picture
 *  (man-walk4 frame 1: figure 236 px of 240, the walk frames 230 px; both on ground row 237). Same factor for every
 *  frame, scaled about the ground anchor — no frame is scaled on its own and no proportion changes. */
export const WALK8_SCALE = 236 / 230;
/** Ground covered by one loop through the eight frames, in px of the 240 px cell (≈ the painted stride). */
export const WALK8_LOOP = 184;
/** Share of the loop each frame stays on screen. Equal shares; the painted stance travel per frame is too uneven
 *  (two frames even move the planted boot forward) to time the frames by it without some flashing past. */
export const WALK8_DUR: readonly number[] = Array.from(
  { length: WALK8_FRAMES },
  () => 1 / WALK8_FRAMES,
);
const START = WALK8_DUR.map((_, f) => WALK8_DUR.slice(0, f).reduce((a, b) => a + b, 0));
/** Loop phases where the walk can come to rest: the middle of the two passing frames (2 and 6, feet together), from
 *  where the standing picture follows without a visible change of stance. */
export const WALK8_REST: readonly number[] = [2, 6].map((f) => START[f]! + WALK8_DUR[f]! / 2);

/** Frame shown at loop phase u ∈ [0, 1), and the position inside it (0..1). */
export function walk8Frame(u: number): { f: number; frac: number } {
  const v = ((u % 1) + 1) % 1;
  let f = WALK8_FRAMES - 1;
  while (f > 0 && START[f]! > v) f--;
  return { f, frac: Math.min(1, (v - START[f]!) / WALK8_DUR[f]!) };
}

/** Body bob (fraction of 0..1) at loop phase u: down at the contact frames 0 and 4, up at the passing frames 2 and 6,
 *  following the frames rather than the raw phase so bob and picture always agree. */
export function walk8Bob(u: number): number {
  const { f, frac } = walk8Frame(u);
  return Math.abs(Math.sin(((f + frac) / WALK8_FRAMES) * 2 * Math.PI));
}
