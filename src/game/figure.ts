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
  /** Swing-phase foot lift as a fraction of leg length. */
  lift: number;
  /** Tiles per full gait cycle (two steps). */
  stride?: number;
  /** "legs" = breeches on the shared leg cycle; "robe" = floor-length garment, stepping shoes + swaying hem;
   * "mantle" = cape over the shoulders: lower coat hangs behind the striding legs, swinging as one piece. */
  style: "legs" | "robe" | "mantle";
}

export const fig = (hipX: number, hemY: number, o: Partial<FigureConfig> = {}): FigureConfig =>
  ({ hipX, hemY, hipY: 1 - LEG_RATIO, legWidthScale: 1, legSpread: 0, lift: 0.15, style: "legs", ...o });

/** Hip bounce: body dips at foot contact, rises mid-swing (≈2.5 % of height). Negative = up. */
export const walkBob = (ph: number, h: number) => -Math.abs(Math.sin(ph)) * h * 0.025;

/** Leg-cycle frame with a non-linear phase: stance advances evenly (sole stays planted), swing catches up faster. */
export function gaitFrame(ph: number) {
  const u = (((ph / 6.2832) % 1) + 1) % 1;
  const w = u - 0.07 * Math.sin(u * 4 * Math.PI); // two steps per cycle: slower in stance, quicker in swing
  return Math.floor((((w % 1) + 1) % 1) * WALK_FRAMES) % WALK_FRAMES;
}

/** Layered cape sprite, cut once per image (cached): back mantle without the painted legs, torso with a soft
 * hem fade, and the front ermine facings. Columns/rows are fractions of the sprite (prince.webp). */
type Layers = { back: HTMLCanvasElement; torso: HTMLCanvasElement; front: HTMLCanvasElement };
const LAYERS = new WeakMap<object, Layers | null>();
const MANTLE = { legL: 0.44, legR: 0.84, torsoEnd: 0.76, fade: 0.08, ermA: [0.4, 0.62] as const, ermB: [0.82, 1] as const, ermTop: 0.36, ermEnd: 0.84 };
function mantleLayers(im: HTMLImageElement): Layers | null {
  if (LAYERS.has(im)) return LAYERS.get(im)!;
  let out: Layers | null = null;
  try {
    const W = im.naturalWidth, H = im.naturalHeight;
    const mk = () => { const cv = document.createElement("canvas"); cv.width = W; cv.height = H; return cv; };
    const src = mk(), sc = src.getContext("2d")!; sc.drawImage(im, 0, 0);
    const d = sc.getImageData(0, 0, W, H).data;
    const back = mk(), torso = mk(), front = mk();
    const bi = new ImageData(W, H), ti = new ImageData(W, H), fi = new ImageData(W, H);
    const white = (i: number) => d[i + 3]! > 30 && d[i]! > 135 && d[i + 1]! > 125 && d[i + 2]! > 110;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, a = d[i + 3]!; if (!a) continue;
      const u = x / W, v = y / H, inLegs = u > MANTLE.legL && u < MANTLE.legR;
      const copy = (t: Uint8ClampedArray, k = 1) => { t[i] = d[i]!; t[i + 1] = d[i + 1]!; t[i + 2] = d[i + 2]!; t[i + 3] = a * k; };
      // a) back mantle: everything below the belt except the painted legs between the facings
      if (v > 0.5 && v < 0.88 && !(inLegs && v > 0.62)) copy(bi.data, Math.min(1, (0.88 - v) / 0.03));
      // d) torso down to the natural tunic hem, alpha fading out instead of a scissor cut
      if (v < 0.56 || (inLegs && v < MANTLE.torsoEnd)) copy(ti.data, Math.min(1, Math.max(0, (MANTLE.torsoEnd - v) / MANTLE.fade)));
      // e) front ermine facings (white fur incl. its black tails), lying over torso and legs
      if (v > MANTLE.ermTop && v < MANTLE.ermEnd && ((u > MANTLE.ermA[0] && u < MANTLE.ermA[1]) || (u > MANTLE.ermB[0] && u <= MANTLE.ermB[1]))) {
        let fur = false;
        for (let oy = -1; oy <= 1 && !fur; oy++) for (let ox = -1; ox <= 1 && !fur; ox++) {
          const xx = x + ox, yy = y + oy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && white((yy * W + xx) * 4)) fur = true;
        }
        if (fur) copy(fi.data, Math.min(1, (MANTLE.ermEnd - v) / 0.04));
      }
    }
    back.getContext("2d")!.putImageData(bi, 0, 0); torso.getContext("2d")!.putImageData(ti, 0, 0); front.getContext("2d")!.putImageData(fi, 0, 0);
    out = { back, torso, front };
  } catch { out = null; }
  LAYERS.set(im, out); return out;
}

/** Cape figure, back to front: mantle back, rear + front leg (one painted cycle), torso over the breeches,
 * ermine facings on top. Torso is never cut hard — its hem fades over the legs. */
export function drawMantled(
  c: C, im: HTMLImageElement, sx: number, sw: number, sh: number, legs: HTMLImageElement, frame: number,
  w: number, h: number, g: FigureConfig, ph: number, dy = 0,
) {
  const L = mantleLayers(im), x0 = -w * g.hipX, sway = Math.sin(ph) * w * 0.03;
  const fw = legs.naturalWidth / WALK_FRAMES, lh = h * (1 - g.hipY), lw = ((lh * fw) / legs.naturalHeight) * g.legWidthScale;
  if (!L) { c.drawImage(im, sx, 0, sw, sh, x0, -h + dy, w, h); return; }
  c.drawImage(L.back, 0, 0, sw, sh, x0 + sway, -h + dy, w, h);
  drawLegPair(c, legs, frame, lw, lh, dy, ph);
  c.drawImage(L.torso, 0, 0, sw, sh, x0, -h + dy, w, h);
  c.drawImage(L.front, 0, 0, sw, sh, x0 + sway * 0.4, -h + dy, w, h);
}

/** Swing-phase foot lift for each leg half: footY = -sin(swingPhase) · legLength · 0.15, only while that leg swings. */
export function footLifts(ph: number, lh: number, lift = 0.15): [number, number] {
  const s = Math.sin(ph), k = lh * lift;
  return [s > 0 ? -s * k : 0, s < 0 ? s * k : 0];
}
/** Paints the leg pair as two halves; the swinging leg rises (its top tucks behind the torso hem). */
/** Clean two-step cycle from the painted sheet: stride, passing, stride, passing (frames 5/6 repeat
 * strides and made the legs flick back and forth like dancing on the spot). */
export const LEG_CYCLE = [0, 1, 2, 3] as const;
export function legFrame(ph: number) {
  const u = (((ph / 6.2832) % 1) + 1) % 1;
  return LEG_CYCLE[Math.floor(u * LEG_CYCLE.length) % LEG_CYCLE.length]!;
}
/** Per-frame horizontal offset (fraction of a cell) that registers every frame's waistband on the cell centre. */
const WAIST = new WeakMap<object, number[]>();
function waistShift(legs: HTMLImageElement): number[] {
  const hit = WAIST.get(legs); if (hit) return hit;
  const out = new Array(WALK_FRAMES).fill(0);
  try {
    const W = legs.naturalWidth, H = legs.naturalHeight, fw = W / WALK_FRAMES, rows = Math.max(2, Math.round(H * 0.12));
    const cv = document.createElement("canvas"); cv.width = W; cv.height = rows;
    const g = cv.getContext("2d")!; g.drawImage(legs, 0, 0, W, rows, 0, 0, W, rows);
    const d = g.getImageData(0, 0, W, rows).data;
    for (let f = 0; f < WALK_FRAMES; f++) {
      let s = 0, n = 0;
      for (let y = 0; y < rows; y++) for (let x = Math.floor(f * fw); x < Math.floor((f + 1) * fw); x++) if (d[(y * W + x) * 4 + 3]! > 60) { s += x - f * fw; n++; }
      if (n) out[f] = (s / n - fw / 2) / fw;
    }
  } catch { /* keep zero offsets */ }
  WAIST.set(legs, out); return out;
}
export function drawLegPair(c: C, legs: HTMLImageElement, frame: number, lw: number, lh: number, dy: number, ph: number | undefined, spread = 0, lift = 0.15) {
  // the painted frames already carry the foot lift: draw each frame whole, never split at the crotch
  void lift;
  const f = ph === undefined ? frame : legFrame(ph);
  const fw = legs.naturalWidth / WALK_FRAMES, lnh = legs.naturalHeight, sw = lw + spread * 2;
  const dx = -(waistShift(legs)[f] ?? 0) * sw;
  c.drawImage(legs, f * fw, 0, fw, lnh, -sw / 2 + dx, -lh + dy, sw, lh);
}

/** Draws legs (frame of the shared cycle) then the torso cut at its hem, in the figure's local frame (feet at 0,0). */
export function drawLegged(
  c: C, im: CanvasImageSource, sx: number, sw: number, sh: number, legs: HTMLImageElement, frame: number,
  w: number, h: number, g: FigureConfig, legDy = 0, torsoDy = 0, ph?: number,
) {
  const fw = legs.naturalWidth / WALK_FRAMES, lnh = legs.naturalHeight;
  const lh = h * (1 - g.hipY), lw = ((lh * fw) / lnh) * g.legWidthScale;
  drawLegPair(c, legs, frame, lw, lh, legDy, ph, g.legSpread * h, g.lift);
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
