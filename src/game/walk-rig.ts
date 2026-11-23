/**
 * P6 reference walker: a skeletal walk cycle for the ordinary villager ("man"), built from the painted parts of his
 * own walk sheet (scripts/gen-man-rig.py) instead of eight hand-painted poses.
 *
 * The gait is solved, not keyframed: each foot's contact point is locked to the ground for the whole stance (heel
 * strike → flat foot → roll over the ball → toe-off), the swing foot follows a smooth arc to the next contact, knees
 * come from two-bone IK, and the pelvis height follows from the straight-ish stance leg (inverted-pendulum bob).
 * Arms swing against the legs with a little elbow lag. Poses are rendered once into small cached canvases
 * (RIG_FRAMES per cycle and a few stride lengths for starting and stopping); the game only draws cached frames.
 *
 * Display only: walking speed, paths and all simulation are untouched — the cycle is driven by the distance the
 * figure already moves on screen, so the planted foot stays put at any speed, zoom or frame rate.
 */
import { MAN_RIG } from "./man-rig-data";

export type Pt = [number, number];
type C = CanvasRenderingContext2D;

/** Frames per gait cycle (two steps) in the cache. Between two cached poses the drawn frame is slid back by the
 *  fraction of a frame (see rigSlide), so the planted foot stays exactly on the ground spot. */
export const RIG_FRAMES = 64;
/** Source px to slide a cached frame back so its planted foot matches the true (in-between) pose. */
export const rigSlide = (ai: number, frac: number) =>
  (-frac * (2 * STEP * (RIG_AMPS[ai] ?? 0))) / RIG_FRAMES;
/** Stride levels cached: 0 = standing, 1 = full step. Start and stop step through the shorter strides. */
export const RIG_AMPS = [0, 0.25, 0.5, 0.75, 1] as const;
/** Output cell (source px): wider than the painted sheet so a long stride never leaves the frame; pelvis at the centre. */
export const RIG_W = 200,
  RIG_H = 240,
  RIG_CX = 100;
const SHIFT = RIG_CX - 72; // source cell → output cell
export const GROUND = MAN_RIG.ground;
/** Heel-to-heel step length at full stride (source px), ≈ 0.39 of the body height (natural walking ≈ 0.4). */
export const STEP = 88;
/** Share of the cycle a foot is on the ground (natural walking ≈ 60–62 %). */
export const STANCE = 0.62;

const J = MAN_RIG.joints,
  REST = MAN_RIG.rest;
const sub = (a: readonly number[], b: readonly number[]): Pt => [a[0]! - b[0]!, a[1]! - b[1]!];
const len = (v: readonly number[]) => Math.hypot(v[0]!, v[1]!);
const rot = (v: Pt, a: number): Pt => [
  v[0] * Math.cos(a) - v[1] * Math.sin(a),
  v[0] * Math.sin(a) + v[1] * Math.cos(a),
];
const smooth = (k: number) => k * k * (3 - 2 * k);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type Side = "far" | "near";
/** Leg geometry from the painted frame: segment lengths, foot points in the foot's own frame (sole flat = angle 0). */
const LEG = (["far", "near"] as const).reduce(
  (o, s) => {
    const j = J[s],
      sole = REST[(s + "Foot") as "farFoot"];
    const heel = rot(sub(j.heel, j.ankle), -sole),
      toe = rot(sub(j.toe, j.ankle), -sole);
    const ball: Pt = [heel[0] + (toe[0] - heel[0]) * 0.72, heel[1] + (toe[1] - heel[1]) * 0.72];
    o[s] = {
      thigh: len(sub(j.knee, j.hip)),
      shin: len(sub(j.ankle, j.knee)),
      heel,
      ball,
      hipX: j.hip[0] + SHIFT,
    };
    return o;
  },
  {} as Record<Side, { thigh: number; shin: number; heel: Pt; ball: Pt; hipX: number }>,
);

export interface LegPose {
  hip: Pt;
  knee: Pt;
  ankle: Pt;
  sole: number;
  stance: boolean;
}
export interface ArmPose {
  shoulder: Pt;
  upper: number;
  lower: number;
}
export interface GaitPose {
  pelvisY: number;
  lean: number;
  legs: Record<Side, LegPose>;
  arms: Record<Side, ArmPose>;
}

/** Sole angle (screen radians, heel → toe; 0 = flat, > 0 = heel up) over the stance, and its locked contact point. */
function stanceFoot(phi: number): { sole: number; ball: boolean } {
  if (phi < 0.1) return { sole: -0.26 * (1 - smooth(phi / 0.1)), ball: false }; // heel strike, toes come down
  if (phi < 0.42) return { sole: 0, ball: false }; // flat foot
  return { sole: 0.62 * smooth((phi - 0.42) / (STANCE - 0.42)), ball: true }; // heel rises, roll over the ball
}

/** Ankle of one leg relative to its hip column, for leg phase phi (0 = heel strike) and step length S. */
export function anklePath(
  side: Side,
  phi: number,
  S: number,
): { ankle: Pt; sole: number; stance: boolean; support: number } {
  // heel lands so the ankle is 0.5·S ahead of the hip; at zero stride the ankle stands right under it
  const L = LEG[side],
    A = 0.5 * S + L.heel[0];
  const at = (p: number) => {
    const f = stanceFoot(p),
      cx = A - 2 * S * p + (f.ball ? L.ball[0] - L.heel[0] : 0),
      local = f.ball ? L.ball : L.heel;
    const off = rot(local, f.sole);
    return { ankle: [cx - off[0], GROUND - off[1]] as Pt, sole: f.sole };
  };
  // weight-bearing (straight-ish knee) until the heel rises; from heel-off the knee is already bending for the swing
  if (phi < STANCE) return { ...at(phi), stance: true, support: phi < 0.44 ? 1 : 0 };
  // swing: Hermite from toe-off to the next heel strike; end tangents match the ground speed (foot still in world)
  const s = (phi - STANCE) / (1 - STANCE),
    d = 1 - STANCE;
  const P0 = at(STANCE - 1e-6),
    P1 = at(0),
    v = -2 * S * d;
  const h00 = 2 * s ** 3 - 3 * s * s + 1,
    h10 = s ** 3 - 2 * s * s + s,
    h01 = -2 * s ** 3 + 3 * s * s,
    h11 = s ** 3 - s * s;
  const x = h00 * P0.ankle[0] + h10 * v + h01 * P1.ankle[0] + h11 * v;
  const lift = (S / STEP) * 15 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.85)), 1.3);
  const y = P0.ankle[1] + (P1.ankle[1] - P0.ankle[1]) * smooth(s) - lift;
  // sole: from toe-off through a relaxed foot to toes-up for the landing
  const sole =
    P0.sole + (P1.sole - P0.sole) * smooth(s) + 0.12 * Math.sin(Math.PI * s) * (S / STEP);
  // how much this foot still (or already) carries weight: fades out right after toe-off, in right before landing
  return { ankle: [x, y], sole, stance: false, support: 0 };
}

/** Two-bone IK: knee in front of the hip–ankle line (the figure faces +x). */
export function solveKnee(hip: Pt, ankle: Pt, a: number, b: number): Pt {
  const dx = ankle[0] - hip[0],
    dy = ankle[1] - hip[1],
    d = clamp(Math.hypot(dx, dy), Math.abs(a - b) + 1e-3, a + b - 1e-3);
  const dir = Math.atan2(dy, dx),
    alpha = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  return [hip[0] + a * Math.cos(dir - alpha), hip[1] + a * Math.sin(dir - alpha)];
}

/** Full pose at cycle phase u (0..1, near heel strike at 0, far at 0.5) and stride level amp (0 = standing). */
/** Pelvis height the stance legs allow at phase u (screen y; larger = lower), before the bob is softened. */
function pelvisReach(u: number, S: number) {
  const feet = { near: anklePath("near", u, S), far: anklePath("far", (u + 0.5) % 1, S) };
  // as high as the stance legs allow when almost straight
  const reach = (side: Side, k: number) => {
    const L = LEG[side],
      f = feet[side],
      m = k * (L.thigh + L.shin),
      dx = f.ankle[0];
    return f.ankle[1] - Math.sqrt(Math.max(1, m * m - dx * dx));
  };
  // only legs carrying weight bound the pelvis (the bob itself is a smooth curve, see bobAt); a swinging foot out
  // of reach is drawn in toward the hip instead
  const hard = (s: Side) => (feet[s].support === 1 ? reach(s, 0.993) : -Infinity);
  return { feet, y: Math.max(hard("near"), hard("far")) };
}
/** Pelvis bob: a smooth rise and fall twice per cycle, lowest just after each heel strike (double support),
 *  highest over the single stance leg; ≈ 2.5 % of the body height from low to high at full stride. */
const BOB = 3.6;
const bobAt = (u: number, S: number) => BOB * (S / STEP) * Math.cos(4 * Math.PI * (u - 0.06));
/** Base height per stride (cached): as high as possible while every foot stays within reach of its hip all cycle. */
const bases = new Map<number, number>();
function pelvisBase(S: number) {
  let v = bases.get(S);
  if (v !== undefined) return v;
  v = -Infinity;
  for (let i = 0; i < 256; i++) v = Math.max(v, pelvisReach(i / 256, S).y - bobAt(i / 256, S));
  bases.set(S, v);
  return v;
}

export function gaitPose(u: number, amp: number): GaitPose {
  u = ((u % 1) + 1) % 1;
  const S = STEP * amp,
    R = pelvisReach(u, S),
    feet = R.feet;
  const pelvisY = pelvisBase(S) + bobAt(u, S);
  const legs = {} as Record<Side, LegPose>;
  for (const s of ["far", "near"] as const) {
    const L = LEG[s],
      hip: Pt = [L.hipX, pelvisY],
      f = feet[s],
      ankle: Pt = [L.hipX + f.ankle[0], f.ankle[1]];
    const m = 0.998 * (L.thigh + L.shin),
      dx = ankle[0] - hip[0],
      dy = ankle[1] - hip[1],
      d = Math.hypot(dx, dy);
    if (d > m) {
      ankle[0] = hip[0] + (dx * m) / d;
      ankle[1] = hip[1] + (dy * m) / d;
    } // only ever a swinging foot
    legs[s] = {
      hip,
      knee: solveKnee(hip, ankle, L.thigh, L.shin),
      ankle,
      sole: f.sole,
      stance: f.stance,
    };
  }
  // arms against the legs: near arm forward when the far foot lands (u = 0.5); forearm lags and folds a little
  // people swing the arm further forward than back; the backswing keeps the elbow almost straight
  const dy = pelvisY - 128,
    Af = 0.36 * amp,
    Ab = 0.22 * amp,
    lag = 0.04;
  const arm = (s: Side, u0: number): ArmPose => {
    const j = s === "near" ? J.armNear : J.armFar,
      c = Math.cos(2 * Math.PI * (u - u0 - lag)),
      c2 = Math.cos(2 * Math.PI * (u - u0 - lag - 0.06));
    const upper = Math.PI / 2 - (0.04 + (c > 0 ? Af : Ab) * c),
      lower = upper - (0.12 + 0.34 * amp * Math.max(0, c2));
    return { shoulder: [j.shoulder[0] + SHIFT, j.shoulder[1] + dy], upper, lower };
  };
  const lean = 0.012 * amp + 0.006 * amp * Math.sin(4 * Math.PI * u);
  return { pelvisY, lean, legs, arms: { near: arm("near", 0.5), far: arm("far", 0) } };
}

// ---- drawing ----
const CELL = MAN_RIG.parts.reduce((o, p, i) => ((o[p] = i), o), {} as Record<string, number>);
/** Places one atlas part: rotate its rest segment (pivot p0, angle a0) onto the posed one (pivot p1, angle a1). */
function part(
  c: C,
  atlas: CanvasImageSource,
  name: string,
  p0: readonly number[],
  a0: number,
  p1: Pt,
  a1: number,
) {
  c.save();
  c.translate(p1[0], p1[1]);
  c.rotate(a1 - a0);
  c.translate(-p0[0]! - SHIFT, -p0[1]!);
  c.drawImage(atlas, CELL[name]! * 160, 0, 160, 240, SHIFT, 0, 160, 240);
  c.restore();
}
export function drawGaitPose(c: C, atlas: CanvasImageSource, P: GaitPose) {
  const ang = (a: Pt, b: Pt) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const arm = (s: Side) => {
    const j = s === "near" ? J.armNear : J.armFar,
      A = P.arms[s],
      pre = s === "near" ? "armNear" : "armFar";
    const elbowL = len(sub(j.elbow, j.shoulder)),
      elbow: Pt = [
        A.shoulder[0] + elbowL * Math.cos(A.upper),
        A.shoulder[1] + elbowL * Math.sin(A.upper),
      ];
    part(c, atlas, pre + "Lower", j.elbow, REST[(pre + "Lower") as "armNearLower"], elbow, A.lower);
    part(
      c,
      atlas,
      pre + "Upper",
      j.shoulder,
      REST[(pre + "Upper") as "armNearUpper"],
      A.shoulder,
      A.upper,
    );
  };
  const leg = (s: Side) => {
    const j = J[s],
      L = P.legs[s];
    part(c, atlas, s + "Foot", j.ankle, REST[(s + "Foot") as "farFoot"], L.ankle, L.sole);
    part(
      c,
      atlas,
      s + "Shin",
      j.knee,
      REST[(s + "Shin") as "farShin"],
      L.knee,
      ang(L.knee, L.ankle),
    );
    part(
      c,
      atlas,
      s + "Thigh",
      j.hip,
      REST[(s + "Thigh") as "farThigh"],
      L.hip,
      ang(L.hip, L.knee),
    );
  };
  arm("far");
  leg("far");
  leg("near");
  // torso and head ride the pelvis, leaning a touch into the walk around the hips
  c.save();
  c.translate(RIG_CX, P.pelvisY);
  c.rotate(P.lean);
  c.translate(-RIG_CX, -128);
  c.drawImage(atlas, CELL["torso"]! * 160, 0, 160, 240, SHIFT, 0, 160, 240);
  c.restore();
  arm("near");
}

/** Cache scales (cell heights 60 / 120 / 240 px): a cell is never drawn at less than about half its height, so
 *  shrinking stays cheap and sharp at every zoom; full resolution only for close-ups such as the figure lab. */
export const RIG_SCALES = [0.25, 0.5, 1] as const;
/** Scale index for a figure drawn `px` canvas pixels tall. */
export const rigScaleFor = (px: number) => (px <= 55 ? 0 : px <= 140 ? 1 : 2);
const frames = new Map<number, HTMLCanvasElement>();
/** Upper bound for the cell cache; least recently drawn cells are dropped first (a full-resolution walk cycle is
 *  ~12 MB, so close-ups on high-density phones still fit while zooming out sheds the big cells). */
export const RIG_CACHE_MAX_BYTES = 16e6;
let cacheBytes = 0;
/** At most this many cells are built per rendered frame; beyond that the nearest cell already built is shown, so a
 *  crowd appearing at once spreads the (≈1 ms on a slow phone) cell builds over a few frames instead of one hitch. */
export const RIG_BUILDS_PER_FRAME = 4;
let budgetT = NaN,
  built = 0;
/** Cached frame for (amp level index, frame, scale index); built once on first use, then only drawn. `now` (the
 *  render frame's time) enables the per-frame build budget. */
export function rigFrame(
  atlas: HTMLImageElement,
  ai: number,
  f: number,
  si = 0,
  now?: number,
): HTMLCanvasElement | null {
  const base = (si * RIG_AMPS.length + ai) * RIG_FRAMES,
    key = base + (ai === 0 ? 0 : f),
    hit = frames.get(key);
  if (hit) {
    frames.delete(key);
    frames.set(key, hit);
    return hit;
  } // keep Map order = recency
  if (typeof document === "undefined") return null;
  if (now !== undefined) {
    if (now !== budgetT) {
      budgetT = now;
      built = 0;
    }
    if (built >= RIG_BUILDS_PER_FRAME)
      for (let d = 1; d < RIG_FRAMES / 2; d++) {
        const a =
          frames.get(base + ((f + d) % RIG_FRAMES)) ??
          frames.get(base + ((f - d + RIG_FRAMES) % RIG_FRAMES));
        if (a) return a;
      }
    built++;
  }
  const sc = RIG_SCALES[si] ?? 0.5,
    cv = document.createElement("canvas");
  cv.width = Math.round(RIG_W * sc);
  cv.height = Math.round(RIG_H * sc);
  const g = cv.getContext("2d");
  if (!g) return null;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.scale(sc, sc);
  drawGaitPose(g, atlas, gaitPose(f / RIG_FRAMES, RIG_AMPS[ai]!));
  frames.set(key, cv);
  cacheBytes += cv.width * cv.height * 4;
  for (const [k, old] of frames) {
    if (cacheBytes <= RIG_CACHE_MAX_BYTES) break;
    frames.delete(k);
    cacheBytes -= old.width * old.height * 4;
    old.width = old.height = 0;
  }
  return cv;
}
export const rigCacheSize = () => frames.size;
/** Bytes held by the cell cache (RGBA). */
export const rigCacheBytes = () => cacheBytes;

// ---- driving the cycle from the distance the figure moves ----
/** Per-figure gait state (display only): cycle phase, stride level, last seen path phase. */
type GaitState = { last: number; u: number; amp: number; t: number; v: number };
const state = new Map<number, GaitState>();
let lastPrune = 0;
/** Advances one figure's gait from its path phase (distance-driven, as the game already moves it). `pxPerPhase` is how
 *  many source px the figure travels on screen per unit of path phase; returns cycle phase and stride level index. */
export function stepGait(
  id: number,
  pathPhase: number,
  walking: boolean,
  pxPerPhase: number,
  now: number,
  seed: number,
  loop?: number,
): { u: number; ai: number } {
  let s = state.get(id);
  if (!s) {
    s = { last: pathPhase, u: loop ? 0 : seed, amp: walking ? 1 : 0, t: now, v: walking ? 200 : 0 };
    state.set(id, s);
  }
  const dt = Math.min(0.25, Math.max(0, (now - s.t) / 1000)),
    dp = pathPhase - s.last;
  s.t = now;
  s.last = pathPhase;
  const dpx = Math.abs(dp) < 60 ? Math.abs(dp) * pxPerPhase : 0; // a jump (re-sync, new path) is not a walk
  if (dt > 0) s.v += (dpx / dt - s.v) * Math.min(1, dt / 0.15);
  if (now - lastPrune > 5000) {
    lastPrune = now;
    for (const [k, g] of state) if (now - g.t > 10000) state.delete(k);
  }
  if (loop) {
    // fixed-stride frame sequence (a painted loop covering `loop` source px of ground): the loop follows the distance;
    // on stopping it finishes the current loop in place and rests at its start (the standing frame)
    s.amp = walking ? 1 : 0;
    if (walking) s.u = (s.u + dpx / loop) % 1;
    else if (s.u > 0) s.u = s.u + dt / 0.35 >= 1 ? 0 : s.u + dt / 0.35;
    return { u: s.u, ai: walking || s.u > 0 ? RIG_AMPS.length - 1 : 0 };
  }
  const target = walking ? clamp(s.v / 120, 0.25, 1) : 0,
    rate = dt / 0.3;
  s.amp += clamp(target - s.amp, -rate, rate);
  const ai = Math.round(s.amp * (RIG_AMPS.length - 1));
  // feet stay planted: the cycle advances by the distance over the length of two steps at the drawn stride
  if (ai > 0) s.u = (s.u + dpx / (2 * STEP * RIG_AMPS[ai]!)) % 1;
  return { u: s.u, ai };
}
export const gaitStateSize = () => state.size;
/** Forgets all per-figure gait state (tests and the comparison harness). */
export const resetGait = () => state.clear();
