/** 8-frame whole-body walk of the ordinary male villager ("man", man-walk8.webp: 160 × 240 px cells, centre x = 80,
 *  ground y = 237). Display only: which frame shows is driven by the distance the figure walks on screen (stepGait in
 *  walk-rig.ts with a fixed loop), never by the wall clock.
 *
 *  Measured in the painted frames (scripts: see PR): the weight-bearing boot moves back under the body by about
 *  184 cell px per loop (two steps), but in steps: it holds one spot for two frames and jumps back between the pairs
 *  (each boot is planted from frame 1 to 4 resp. 5 to 0; the feet change at 4→5 and 0→1). */

export const WALK8_FRAMES = 8;
/** Painted stride: ground one loop through the eight frames covers, in px of the sheet. */
export const WALK8_STRIDE = 184;
/** The whole sheet is drawn at one common scale so the walking man has the height of his standing picture
 *  (man-walk4 frame 1: figure 236 px of 240, the walk frames 230 px; both on ground row 237). Same factor for every
 *  frame, scaled about the ground anchor — no frame is scaled on its own and no proportion changes. */
export const WALK8_SCALE = 236 / 230;
/** The same stride in px of the figure's 240 px height (the unit stepGait counts in): the sheet is drawn larger. */
export const WALK8_LOOP = WALK8_STRIDE * WALK8_SCALE;
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

/** Source row of the hip: the legs below it are sheared to keep the planted boot on the ground (walk8PairOffset). */
export const WALK8_HIP = 130;
/** The painted boot stays on one spot of the sheet for two frames at a time (stance pairs 1–2, 3–4, 5–6, 7–0); the
 *  other boot lands at the start of the next pair. Ground covered while one pair shows, in px of the 240 px height. */
export const WALK8_PAIR = (2 * WALK8_LOOP) / WALK8_FRAMES;

/** Horizontal share of the movement on screen: the figure is painted from the side, so only that part of the ground
 *  can be taken back — full for walking across the screen, none for walking straight up or down. */
export function walk8Across(dir: readonly [number, number]): number {
  const sx = 16 * (dir[0] - dir[1]),
    sy = 8 * (dir[0] + dir[1]),
    l = Math.hypot(sx, sy);
  return l > 0 ? Math.abs(sx) / l : 0;
}

/** Stance pair shown at loop phase u (0: frames 1–2, 1: 3–4, 2: 5–6, 3: 7–0) and the share of it already shown. */
export function walk8Pair(u: number): { pair: number; p: number } {
  const v = (((u * WALK8_FRAMES - 1) % WALK8_FRAMES) + WALK8_FRAMES) % WALK8_FRAMES,
    pair = Math.floor(v / 2);
  return { pair, p: (v - 2 * pair) / 2 };
}

/** Per figure (display only): last loop phase, stance pair and ground walked since that pair began. */
const pairs = new Map<number, { u: number; pair: number; w: number }>();
/** Horizontal sole shift (px of the 240 px height, negative = backwards along the facing) that keeps the planted boot
 *  on its ground spot for the whole stance pair: half a pair's ground forward when the boot lands, half back when it
 *  lifts. Walking it is a pure function of u; on stopping (the step closes on the spot) no ground is covered, so the
 *  shift holds still, and a pair begun in place stays unsheared. Continuous inside a pair; it only resets at the foot
 *  change, where the other boot takes over. */
export function walk8PairOffset(
  id: number,
  u: number,
  walking: boolean,
  dir: readonly [number, number],
): number {
  const { pair, p } = walk8Pair(u);
  let s = pairs.get(id);
  if (!s) {
    if (pairs.size > 4096) pairs.clear();
    s = { u, pair, w: walking ? p * WALK8_PAIR : WALK8_PAIR / 2 };
    pairs.set(id, s);
  }
  const du = (((u - s.u) % 1) + 1) % 1;
  if (walking) s.w = du > 0.25 ? p * WALK8_PAIR : s.w + du * WALK8_LOOP; // a jump (new path, resync) re-anchors
  if (pair !== s.pair) s.w = walking ? p * WALK8_PAIR : WALK8_PAIR / 2;
  s.u = u;
  s.pair = pair;
  const off = Math.max(-0.5, Math.min(0.5, 0.5 - s.w / WALK8_PAIR)) * WALK8_PAIR;
  return off * walk8Across(dir);
}
/** Forgets the per-figure pair state (tests). */
export const resetWalk8Pairs = () => pairs.clear();
