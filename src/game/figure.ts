/**
 * Figure anatomy for modular walkers: the shared painted leg cycle (legs-m) always keeps its
 * natural anatomical height (LEG_RATIO of the body) and hangs from the hip; the garment hem only
 * decides how much of it the torso covers — legs are never squashed to fit a long coat.
 */
type C = CanvasRenderingContext2D;
import { WALK_FRAMES } from "./folk-sprites";

/** Hip-to-sole height as a fraction of the full figure height (anatomical ~48–52 %). */
export const LEG_RATIO = 0.5;

export interface FigureConfig {
  /** Hip column in the torso sprite (fraction of its width) — where the legs are registered. */
  hipX: number;
  /** Visible garment hem (fraction of height from the top): the torso is drawn down to here. */
  hemY: number;
  /** Anatomical hip line (fraction of height from the top) — top of the leg sprite. */
  hipY: number;
  /** Leg width multiplier for broad torsos. */
  legWidthScale: number;
  /** Extra stance gap per leg (fraction of figure height) so legs don't pinch under wide coats. */
  legSpread: number;
  /** "legs" = breeches on the shared leg cycle; "robe" = floor-length garment, stepping shoes + swaying hem;
   * "mantle" = cape over the shoulders: lower coat hangs behind the striding legs, swinging as one piece. */
  style: "legs" | "robe" | "mantle";
}

export const fig = (hipX: number, hemY: number, o: Partial<FigureConfig> = {}): FigureConfig =>
  ({ hipX, hemY, hipY: 1 - LEG_RATIO, legWidthScale: 1, legSpread: 0, style: "legs", ...o });

/** Hip bounce: body dips at foot contact, rises mid-swing (≈2.5 % of height). Negative = up. */
export const walkBob = (ph: number, h: number) => -Math.abs(Math.sin(ph)) * h * 0.025;

/** Leg-cycle frame with a non-linear phase: stance advances evenly (sole stays planted), swing catches up faster. */
export function gaitFrame(ph: number) {
  const u = (((ph / 6.2832) % 1) + 1) % 1;
  const w = u - 0.07 * Math.sin(u * 4 * Math.PI); // two steps per cycle: slower in stance, quicker in swing
  return Math.floor((((w % 1) + 1) % 1) * WALK_FRAMES) % WALK_FRAMES;
}

/** Cape figure: back of the mantle (below hemY) swings behind, legs stride in front, upper body on top. */
export function drawMantled(
  c: C, im: CanvasImageSource, sx: number, sw: number, sh: number, legs: HTMLImageElement, frame: number,
  w: number, h: number, g: FigureConfig, ph: number, dy = 0,
) {
  const end = 0.9, sway = Math.sin(ph) * w * 0.03;
  // whole lower mantle as one piece, slightly narrowed so it reads as behind the legs
  c.globalAlpha = 1;
  c.drawImage(im, sx, sh * g.hemY, sw, sh * (end - g.hemY), -w * g.hipX * 0.96 + sway, -h + h * g.hemY + dy, w * 0.96, h * (end - g.hemY));
  const fw = legs.naturalWidth / WALK_FRAMES, lh = h * (1 - g.hipY), lw = ((lh * fw) / legs.naturalHeight) * g.legWidthScale;
  c.drawImage(legs, frame * fw, 0, fw, legs.naturalHeight, -lw / 2, -lh + dy, lw, lh);
  c.drawImage(im, sx, 0, sw, sh * g.hemY, -w * g.hipX, -h + dy, w, h * g.hemY);
}

/** Draws legs (frame of the shared cycle) then the torso cut at its hem, in the figure's local frame (feet at 0,0). */
export function drawLegged(
  c: C, im: CanvasImageSource, sx: number, sw: number, sh: number, legs: HTMLImageElement, frame: number,
  w: number, h: number, g: FigureConfig, legDy = 0, torsoDy = 0,
) {
  const fw = legs.naturalWidth / WALK_FRAMES, lnh = legs.naturalHeight;
  const lh = h * (1 - g.hipY), lw = ((lh * fw) / lnh) * g.legWidthScale, s = g.legSpread * h;
  if (s > 0.001) {
    // split the pair down the middle and part the two legs
    const hf = fw / 2;
    c.drawImage(legs, frame * fw, 0, hf, lnh, -lw / 2 - s, -lh + legDy, lw / 2, lh);
    c.drawImage(legs, frame * fw + hf, 0, hf, lnh, s, -lh + legDy, lw / 2, lh);
  } else c.drawImage(legs, frame * fw, 0, fw, lnh, -lw / 2, -lh + legDy, lw, lh);
  c.drawImage(im, sx, 0, sw, sh * g.hemY, -w * g.hipX, -h + torsoDy, w, h * g.hemY);
}

/** Floor-length garment walking: two shoes step out, the lower garment sways in strips; the sprite's own feet are cut. */
export function drawRobeWalk(
  c: C, im: CanvasImageSource, sx: number, sw: number, sh: number, foot: HTMLImageElement | null,
  w: number, h: number, ph: number, top = 0.8, end = 0.93, dy = 0, swing = 0.035,
) {
  const sway = Math.sin(ph), fs = h * 0.11, fw2 = foot ? (fs * foot.naturalWidth) / foot.naturalHeight : 0;
  if (foot) for (const sd of [-1, 1]) {
    const lift = Math.max(0, Math.cos(ph) * sd) * h * 0.025;
    c.drawImage(foot, sd * sway * w * 0.16 - fw2 * 0.45, dy - fs - lift + h * 0.02, fw2, fs);
  }
  c.drawImage(im, sx, 0, sw, sh * top, -w / 2, -h + dy, w, h * top);
  const N = 4;
  for (let i = 0; i < N; i++) {
    const a = top + ((end - top) * i) / N, b = top + ((end - top) * (i + 1)) / N, dx = sway * w * swing * ((i + 1) / N);
    c.drawImage(im, sx, sh * a, sw, sh * (b - a) + 0.5, -w / 2 + dx, -h + h * a + dy, w, h * (b - a) + 0.05);
  }
}
