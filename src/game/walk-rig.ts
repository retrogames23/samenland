/**
 * P6 reference walker: a skeletal walk cycle for the ordinary villager ("man"), built from the painted pixels of his
 * own walk sheet (scripts/gen-man-rig.py) instead of eight hand-painted poses. P6d: limbs bend as continuous painted
 * strips (no cut at knee or elbow), the body follows in rows (lean, shoulder swing, steadier head, a tunic hem that
 * trails the thighs, a swinging belt end).
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
  warp: BodyWarp;
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

/** Pelvis height and both legs at phase u and stride level amp. */
function legsAt(u: number, amp: number): { pelvisY: number; legs: Record<Side, LegPose> } {
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
  return { pelvisY, legs };
}

export function gaitPose(u: number, amp: number): GaitPose {
  u = ((u % 1) + 1) % 1;
  const { pelvisY, legs } = legsAt(u, amp);
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
  return {
    pelvisY,
    lean,
    warp: bodyWarp(u, amp),
    legs,
    arms: { near: arm("near", 0.5), far: arm("far", 0) },
  };
}

// ---- drawing ----
// The figure is drawn from five continuous layers (scripts/gen-man-rig.py): legs and arms are painted strips unrolled
// along their bone line and rolled back onto the posed one in thin bands (knees and elbows bend smoothly, no cut
// between thigh and shin), the body is drawn in rows that shift and widen per row (lean, shoulder swing, steadier
// head, a hem that trails the thighs), feet stay rigid under the shin and the belt end swings on its knot.
const PIECE = MAN_RIG.pieces,
  RIB = MAN_RIG.ribbons,
  ROWS = MAN_RIG.rows;
type RibbonName = keyof typeof RIB;

interface Curve {
  len: number;
  at(s: number): [number, number, number];
}
/** Centre line through pts with each inner corner rounded over ±rad px of arc length; pinned to pts[1] and pts[n-2]
 *  (hip and ankle, shoulder and fingertips). Same construction as `curve` in scripts/gen-man-rig.py. */
export function ribbonCurve(pts: readonly Pt[], rad: number): Curve {
  const n = pts.length,
    ln: number[] = [],
    an: number[] = [],
    S = [0];
  for (let i = 0; i < n - 1; i++) {
    const d = sub(pts[i + 1]!, pts[i]!);
    ln.push(len(d));
    an.push(Math.atan2(d[1], d[0]));
    S.push(S[i]! + ln[i]!);
  }
  const L = S[n - 1]!;
  const theta = (s: number) => {
    let k = 0;
    while (k < ln.length - 1 && s > S[k + 1]!) k++;
    let th = an[k]!;
    for (let i = 1; i < n - 1; i++) {
      const rr = Math.min(rad, ln[i - 1]! / 2, ln[i]! / 2);
      if (s > S[i]! - rr && s < S[i]! + rr) {
        const d = ((an[i]! - an[i - 1]! + 3 * Math.PI) % (2 * Math.PI)) - Math.PI,
          t = (s - (S[i]! - rr)) / (2 * rr);
        th = an[i - 1]! + d * t * t * (3 - 2 * t);
      }
    }
    return th;
  };
  const step = 0.5,
    m = Math.ceil(L / step) + 1,
    ss = new Float64Array(m),
    cx = new Float64Array(m),
    cy = new Float64Array(m),
    th = new Float64Array(m);
  for (let i = 0; i < m; i++) {
    ss[i] = (L * i) / (m - 1);
    th[i] = theta(ss[i]!);
  }
  cx[0] = pts[0]![0];
  cy[0] = pts[0]![1];
  for (let i = 1; i < m; i++) {
    const h = ss[i]! - ss[i - 1]!,
      a = 0.5 * (th[i]! + th[i - 1]!);
    cx[i] = cx[i - 1]! + h * Math.cos(a);
    cy[i] = cy[i - 1]! + h * Math.sin(a);
  }
  const idx = (s: number) => Math.min(m - 1, Math.max(0, Math.round((s / L) * (m - 1))));
  const i1 = idx(S[1]!),
    i2 = idx(S[n - 2]!);
  const o1 = sub(pts[1]!, [cx[i1]!, cy[i1]!]);
  for (let i = 0; i < m; i++) {
    cx[i] = cx[i]! + o1[0];
    cy[i] = cy[i]! + o1[1];
  }
  const e = sub(pts[n - 2]!, [cx[i2]!, cy[i2]!]);
  for (let i = 0; i < m; i++) {
    const w = clamp((ss[i]! - ss[i1]!) / Math.max(1e-6, ss[i2]! - ss[i1]!), 0, 1);
    cx[i] = cx[i]! + e[0] * w;
    cy[i] = cy[i]! + e[1] * w;
  }
  return {
    len: L,
    at(s: number) {
      const f = clamp((s / L) * (m - 1), 0, m - 1),
        i = Math.min(m - 2, Math.floor(f)),
        k = f - i;
      return [
        cx[i]! + (cx[i + 1]! - cx[i]!) * k,
        cy[i]! + (cy[i + 1]! - cy[i]!) * k,
        th[i]! + (th[i + 1]! - th[i]!) * k,
      ];
    },
  };
}

/** Posed centre-line points for a limb strip: the rest extensions keep their length along the end segments. */
function limbPoints(name: RibbonName, joints: Pt[]): Pt[] {
  const r = RIB[name].pts,
    e0 = len(sub(r[1]!, r[0]!)),
    e1 = len(sub(r[r.length - 1]!, r[r.length - 2]!));
  const a = joints[0]!,
    b = joints[1]!,
    y = joints[joints.length - 2]!,
    z = joints[joints.length - 1]!;
  const d0 = sub(b, a),
    l0 = len(d0) || 1,
    d1 = sub(z, y),
    l1 = len(d1) || 1;
  return [
    [a[0] - (d0[0] * e0) / l0, a[1] - (d0[1] * e0) / l0],
    ...joints,
    [z[0] + (d1[0] * e1) / l1, z[1] + (d1[1] * e1) / l1],
  ];
}

/** Draws a limb strip rolled onto the posed centre line, `band` strip rows at a time (overlapping a little). */
function drawRibbon(
  c: C,
  atlas: CanvasImageSource,
  name: RibbonName,
  pts: Pt[],
  band: number,
  k: number,
) {
  const R = RIB[name],
    rect = PIECE[name].rect,
    cur = ribbonCurve(pts, R.rad),
    M = c.getTransform(),
    w = 2 * R.hw + 1,
    n = Math.min(R.len, Math.floor(cur.len) + 1);
  // straight stretches go in one draw; only where the line turns (knee, elbow) is it drawn band by band, so a pose
  // costs a few dozen draws instead of hundreds
  for (let s = 0; s < n;) {
    const [x0, y0, t0] = cur.at(s);
    let e = Math.min(n, s + band);
    while (e < n && e - s < 64 && Math.abs(cur.at(Math.min(n, e + band))[2] - t0) * R.hw < 0.35)
      e = Math.min(n, e + band);
    const h = e - s,
      [xm, ym, th] = h > band ? [x0, y0, t0] : cur.at(s + h / 2),
      nx = Math.sin(th),
      ny = -Math.cos(th),
      dx = Math.cos(th),
      dy = Math.sin(th),
      oy = h > band ? 0 : h / 2;
    c.setTransform(M);
    c.transform(nx, ny, dx, dy, xm - R.hw * nx - oy * dx, ym - R.hw * ny - oy * dy);
    c.drawImage(
      atlas,
      rect[0] * k,
      (rect[1] + s) * k,
      w * k,
      h * k,
      0,
      -0.3 * band,
      w,
      h + 0.6 * band,
    );
    s = e;
  }
  c.setTransform(M);
}

/** Rigid piece (cropped in the atlas at `origin` of the source cell) rotated about a rest pivot onto a posed one. */
function piece(
  c: C,
  atlas: CanvasImageSource,
  name: "farFoot" | "nearFoot" | "belt",
  p0: readonly number[],
  a0: number,
  p1: Pt,
  a1: number,
  k: number,
) {
  const P = PIECE[name],
    [rx, ry, rw, rh] = P.rect,
    o = P.origin;
  c.save();
  c.translate(p1[0], p1[1]);
  c.rotate(a1 - a0);
  c.translate(-p0[0]! - SHIFT, -p0[1]!);
  c.drawImage(atlas, rx * k, ry * k, rw * k, rh * k, o[0] + SHIFT, o[1], rw, rh);
  c.restore();
}

/** Body warp at phase u: per source row, the back and front edge shift (cell px) and the vertical offset. */
export interface BodyWarp {
  twist: number; // shoulder line forward (+) / back (−), cell px at shoulder height
  hemF: number; // hem front edge, cell px (+ = forward)
  hemB: number; // hem back edge
  head: number; // extra vertical offset of the head (steadier than the hips)
  shoulderDy: number; // shoulders settle a moment after the hips
  belt: number; // belt end swing (radians)
}
/** Forward angle of each thigh (radians, knee ahead of the hip > 0), relative to the standing pose. */
const STAND = legsAt(0, 0).legs;
// the pelvis height of every cached stride is worked out once at load (256 samples each), not in a frame's first build
for (const a of RIG_AMPS) pelvisBase(STEP * a);
const thighOf = (l: LegPose) => Math.atan2(l.knee[0] - l.hip[0], l.knee[1] - l.hip[1]);
function thighs(u: number, amp: number): [number, number] {
  const L = legsAt(u, amp).legs;
  return [thighOf(L.near) - thighOf(STAND.near), thighOf(L.far) - thighOf(STAND.far)];
}
export function bodyWarp(u: number, amp: number): BodyWarp {
  if (amp <= 0) return { twist: 0, hemF: 0, hemB: 0, head: 0, shoulderDy: 0, belt: 0 }; // standing: the painted body
  const S = STEP * amp,
    cyc = (x: number) => ((x % 1) + 1) % 1;
  const bob = bobAt(u, S);
  // the cloth follows the thighs a little late; the front is pushed by the leading thigh, the back trails the other
  const lag = 0.07,
    [tn, tf] = thighs(cyc(u - lag), amp);
  const hemLen = ROWS.hem - ROWS.hemTop;
  return {
    twist: 1.6 * amp * Math.cos(2 * Math.PI * (u - 0.5 - 0.03)),
    hemF: 0.3 * hemLen * Math.sin(Math.max(0, tn, tf)),
    hemB: 0.24 * hemLen * Math.sin(Math.min(0, tn, tf)),
    head: -0.4 * bob,
    shoulderDy: 0.25 * (bobAt(cyc(u - 0.05), S) - bob),
    belt: 0.09 * amp * Math.sin(4 * Math.PI * (u - 0.14)),
  };
}

/** Horizontal shift of the back (x0) and front (x1) edge and the vertical shift of body row y (source px). */
function rowWarp(y: number, P: GaitPose, B: BodyWarp): [number, number, number] {
  const lean = -(y - 128) * Math.sin(P.lean);
  // chest: shoulders swing against the hips, fading out toward the belt
  const ch = smooth(clamp((ROWS.belt - y) / (ROWS.belt - ROWS.shoulder), 0, 1));
  // hem: from the hem top down the cloth follows the thighs more and more
  const hm = Math.pow(clamp((y - ROWS.hemTop) / (ROWS.hem - ROWS.hemTop), 0, 1.15), 1.3);
  // head and shoulders: the head rides 60 % of the bob, the neck blends
  const hd = smooth(clamp((ROWS.neck + 6 - y) / 14, 0, 1));
  const back = lean + ch * B.twist * 0.35 + hm * B.hemB,
    front = lean + ch * B.twist + hm * B.hemF,
    dy = hd * B.head + ch * B.shoulderDy;
  return [back, front, dy];
}

/** Where a painted body point ends up (cell px) under the row warp. */
function warpPoint(p: readonly number[], P: GaitPose, B: BodyWarp): Pt {
  const [b0, f0, dy] = rowWarp(p[1]!, P, B),
    o = PIECE.body.origin,
    w = PIECE.body.rect[2],
    k = (p[0]! - o[0]) / w;
  return [p[0]! + SHIFT + b0 + (f0 - b0) * k, p[1]! + dy + (P.pelvisY - 128)];
}

function drawBody(
  c: C,
  atlas: CanvasImageSource,
  P: GaitPose,
  B: BodyWarp,
  band: number,
  k: number,
) {
  const [rx, ry, rw, rh] = PIECE.body.rect,
    [ox, oy] = PIECE.body.origin,
    off = P.pelvisY - 128;
  // rows whose shift differs by less than a third of a pixel are drawn together
  for (let y = 0; y < rh;) {
    const w0 = rowWarp(oy + y, P, B);
    let e = Math.min(rh, y + band);
    while (e < rh && e - y < 48) {
      const w1 = rowWarp(oy + Math.min(rh, e + band), P, B);
      if (
        Math.abs(w1[0] - w0[0]) > 0.35 ||
        Math.abs(w1[1] - w0[1]) > 0.35 ||
        Math.abs(w1[2] - w0[2]) > 0.35
      )
        break;
      e = Math.min(rh, e + band);
    }
    const h = e - y,
      [b0, f0, dy] = rowWarp(oy + y + h / 2, P, B);
    c.drawImage(
      atlas,
      rx * k,
      (ry + y) * k,
      rw * k,
      h * k,
      ox + SHIFT + b0,
      oy + y + dy + off - 0.35,
      rw + f0 - b0,
      h + 0.7,
    );
    y = e;
  }
}

/** The drawing of pose P in back-to-front steps (far arm, far leg, near leg, body, belt end + near arm), so a cell can
 *  be built a step at a time across frames. */
function gaitSteps(
  c: C,
  atlas: CanvasImageSource,
  P: GaitPose,
  scale: number,
  k: number,
): (() => void)[] {
  const B = P.warp,
    band = Math.max(1, Math.round(1 / scale)); // one output pixel per band: the overlap pattern stays below a pixel
  const arm = (s: Side) => {
    const name = s === "near" ? "armNear" : "armFar",
      j = J[name],
      A = P.arms[s],
      sh = warpPoint(j.shoulder, P, B);
    const lu = len(sub(j.elbow, j.shoulder)),
      ll = len(sub(j.wrist, j.elbow)),
      lh = len(sub(j.tip, j.wrist));
    const restLower = Math.atan2(j.wrist[1] - j.elbow[1], j.wrist[0] - j.elbow[0]),
      restHand = Math.atan2(j.tip[1] - j.wrist[1], j.tip[0] - j.wrist[0]);
    const elbow: Pt = [sh[0] + lu * Math.cos(A.upper), sh[1] + lu * Math.sin(A.upper)],
      wrist: Pt = [elbow[0] + ll * Math.cos(A.lower), elbow[1] + ll * Math.sin(A.lower)],
      ha = A.lower + (restHand - restLower),
      tip: Pt = [wrist[0] + lh * Math.cos(ha), wrist[1] + lh * Math.sin(ha)];
    drawRibbon(c, atlas, name, limbPoints(name, [sh, elbow, wrist, tip]), band, k);
  };
  const leg = (s: Side) => {
    const j = J[s],
      L = P.legs[s];
    piece(
      c,
      atlas,
      s === "near" ? "nearFoot" : "farFoot",
      j.ankle,
      MAN_RIG.rest[s === "near" ? "nearFoot" : "farFoot"],
      L.ankle,
      L.sole,
      k,
    );
    drawRibbon(c, atlas, s, limbPoints(s, [L.hip, L.knee, L.ankle]), band, k);
  };
  return [
    () => arm("far"),
    () => leg("far"),
    () => leg("near"),
    () => drawBody(c, atlas, P, B, band, k),
    () => {
      const pv = warpPoint(MAN_RIG.beltPivot, P, B);
      piece(c, atlas, "belt", MAN_RIG.beltPivot, 0, pv, B.belt + P.lean, k);
      arm("near");
    },
  ];
}
/** Draws pose P (cell px). `scale` is the cell's output scale (sets the band size), `k` the atlas pre-scale. */
export function drawGaitPose(c: C, atlas: CanvasImageSource, P: GaitPose, scale = 1, k = 1) {
  for (const step of gaitSteps(c, atlas, P, scale, k)) step();
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
/** Cells started per rendered frame at most (bounds the canvases made in one frame). */
export const RIG_BUILDS_PER_FRAME = 4;
/** Time (ms) per rendered frame for building cells. A cell is built in GAIT_STEPS steps (≈ 0.1–0.3 ms each on a
 *  desktop, ≈ 0.1–1.4 ms on a slow phone); a step starts only if its expected cost (per cell size, mean plus twice the
 *  scatter) still fits, so building rarely runs past the budget — the first step of a frame always runs, so the cache
 *  keeps filling. A running step cannot be interrupted: a step that takes far longer than usual still overshoots. */
export const RIG_BUILD_MS = 2.5;
const GAIT_STEPS = 5;
/** Expected cost of each build step (ms) per cell size, a running average of the measured ones: a full-size step
 *  costs several times a small one, so one shared average under-estimated the big cells. */
const stepCosts = RIG_SCALES.map(() => new Array<number>(GAIT_STEPS + 1).fill(0.3));
/** …and how much they scatter (running mean deviation): a step is planned at its mean plus twice its scatter, so
 *  the uneven steps (a bent leg needs more bands than a straight one) rarely run past the budget. */
const stepDevs = RIG_SCALES.map(() => new Array<number>(GAIT_STEPS + 1).fill(0.3));
const expected = (si: number, i: number) => {
  const m = stepCosts[si]![i]!;
  return Math.max(1.25 * m, m + 2 * stepDevs[si]![i]!);
};
function learn(si: number, i: number, dt: number) {
  const c = stepCosts[si]!,
    d = stepDevs[si]!;
  d[i] = d[i]! * 0.8 + Math.abs(dt - c[i]!) * 0.2;
  c[i] = c[i]! * 0.8 + dt * 0.2;
}
let spent = 0,
  steps = 0,
  started = 0,
  maxStep = 0,
  budgetT = NaN;
/** Cells being built: the canvas and the remaining steps; at most a few, the oldest is dropped. */
interface Job {
  cv: HTMLCanvasElement;
  run: (() => void)[];
  i: number;
}
const jobs = new Map<number, Job>();
const MAX_JOBS = 8;
const clock = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** The atlas pre-scaled once per cache scale (high-quality shrink): the many small draws of a pose then copy at about
 *  1:1 with plain bilinear filtering, which is several times cheaper than shrinking every band. */
const atlasScaled = new Map<number, { src: HTMLImageElement; cv: HTMLCanvasElement }>();
function atlasFor(im: HTMLImageElement, sc: number): { img: CanvasImageSource; k: number } {
  if (sc === 1) return { img: im, k: 1 };
  const hit = atlasScaled.get(sc);
  if (hit && hit.src === im) return { img: hit.cv, k: sc };
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(im.naturalWidth * sc);
  cv.height = Math.ceil(im.naturalHeight * sc);
  const g = cv.getContext("2d");
  if (!g || !cv.width) return { img: im, k: 1 };
  g.imageSmoothingQuality = "high";
  g.drawImage(im, 0, 0, cv.width, cv.height);
  atlasScaled.set(sc, { src: im, cv });
  return { img: cv, k: sc };
}
function finish(key: number, cv: HTMLCanvasElement) {
  frames.set(key, cv);
  cacheBytes += cv.width * cv.height * 4;
  for (const [k, old] of frames) {
    if (cacheBytes <= RIG_CACHE_MAX_BYTES) break;
    frames.delete(k);
    cacheBytes -= old.width * old.height * 4;
    old.width = old.height = 0;
  }
}

/** A finished cell to show while the wanted one is still being built: the nearest pose of the same stride and size,
 *  else the same pose at another size, else the nearest stride (standing, a shorter step). Null only while the cache is
 *  still empty — then the first cell is finished at once (once per session). */
function standIn(ai: number, f: number, si: number): HTMLCanvasElement | null {
  const base = (si * RIG_AMPS.length + ai) * RIG_FRAMES;
  for (let d = 0; d < RIG_FRAMES / 2 && ai > 0; d++) {
    const a =
      frames.get(base + ((f + d) % RIG_FRAMES)) ??
      frames.get(base + ((f - d + RIG_FRAMES) % RIG_FRAMES));
    if (a) return a;
  }
  for (let o = 0; o < RIG_SCALES.length; o++) {
    const a = frames.get((o * RIG_AMPS.length + ai) * RIG_FRAMES + (ai === 0 ? 0 : f));
    if (a) return a;
  }
  for (let d = 1; d < RIG_AMPS.length; d++)
    for (const b of [ai - d, ai + d]) {
      if (b < 0 || b >= RIG_AMPS.length) continue;
      for (let o = 0; o < RIG_SCALES.length; o++) {
        const oo = (si + o) % RIG_SCALES.length,
          a = frames.get((oo * RIG_AMPS.length + b) * RIG_FRAMES + (b === 0 ? 0 : f));
        if (a) return a;
      }
    }
  return null;
}

/** Cached frame for (amp level index, frame, scale index); built once on first use, then only drawn. Without `now`
 *  the cell is built at once (tests, tools); with `now` (the render frame's time) it is built a step at a time within
 *  the per-frame budget and a stand-in is returned meanwhile. */
export function rigFrame(
  atlas: HTMLImageElement,
  ai: number,
  f: number,
  si = 0,
  now?: number,
): HTMLCanvasElement | null {
  const key = (si * RIG_AMPS.length + ai) * RIG_FRAMES + (ai === 0 ? 0 : f),
    hit = frames.get(key);
  if (hit) {
    frames.delete(key);
    frames.set(key, hit);
    return hit;
  } // keep Map order = recency
  if (typeof document === "undefined") return null;
  if (now !== undefined && now !== budgetT) {
    budgetT = now;
    spent = 0;
    steps = 0;
    started = 0;
    maxStep = 0;
  }
  let job = jobs.get(key);
  if (!job) {
    if (
      now !== undefined &&
      (started >= RIG_BUILDS_PER_FRAME || (steps > 0 && spent + expected(si, 0) > RIG_BUILD_MS))
    )
      return standIn(ai, f, si);
    const t0 = clock(),
      sc = RIG_SCALES[si] ?? 0.5,
      cv = document.createElement("canvas");
    cv.width = Math.round(RIG_W * sc);
    cv.height = Math.round(RIG_H * sc);
    const g = cv.getContext("2d");
    if (!g) return null;
    g.imageSmoothingEnabled = true;
    g.scale(sc, sc);
    const A = atlasFor(atlas, sc);
    g.imageSmoothingQuality = A.k === 1 ? "high" : "low";
    job = { cv, run: gaitSteps(g, A.img, gaitPose(f / RIG_FRAMES, RIG_AMPS[ai]!), sc, A.k), i: 0 };
    jobs.set(key, job);
    if (jobs.size > MAX_JOBS) jobs.delete(jobs.keys().next().value!);
    started++;
    const dt = clock() - t0;
    learn(si, 0, dt);
    spent += dt;
    steps++;
    maxStep = Math.max(maxStep, dt);
  }
  while (job.i < job.run.length) {
    if (now !== undefined && steps > 0 && spent + expected(si, job.i + 1) > RIG_BUILD_MS) break;
    const t0 = clock();
    job.run[job.i]!();
    const dt = clock() - t0;
    learn(si, job.i + 1, dt);
    spent += dt;
    steps++;
    maxStep = Math.max(maxStep, dt);
    job.i++;
  }
  if (job.i < job.run.length) {
    const s = standIn(ai, f, si);
    if (s) return s;
    while (job.i < job.run.length) job.run[job.i++]!(); // nothing to show yet: finish this first cell now
  }
  jobs.delete(key);
  finish(key, job.cv);
  return job.cv;
}
/** Building effort of the current rendered frame (ms) — for tests and diagnostics. */
export const rigBuildSpent = () => spent;
/** Expected cost per build step (ms; [0] = new canvas) — diagnostics. */
export const rigStepCosts = (si = 0) => (stepCosts[si] ?? []).slice();
/** Build bookkeeping of the current rendered frame — diagnostics only. */
export const rigBuildStats = () => ({ spent, steps, started, maxStep, jobs: jobs.size });
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
): { u: number; ai: number } {
  let s = state.get(id);
  if (!s) {
    s = { last: pathPhase, u: seed, amp: walking ? 1 : 0, t: now, v: walking ? 200 : 0 };
    state.set(id, s);
  }
  const dt = Math.min(0.25, Math.max(0, (now - s.t) / 1000)),
    dp = pathPhase - s.last;
  s.t = now;
  s.last = pathPhase;
  const dpx = Math.abs(dp) < 60 ? Math.abs(dp) * pxPerPhase : 0; // a jump (re-sync, new path) is not a walk
  if (dt > 0) s.v += (dpx / dt - s.v) * Math.min(1, dt / 0.15);
  const target = walking ? clamp(s.v / 120, 0.25, 1) : 0,
    rate = dt / 0.3;
  s.amp += clamp(target - s.amp, -rate, rate);
  const ai = Math.round(s.amp * (RIG_AMPS.length - 1));
  // feet stay planted: the cycle advances by the distance over the length of two steps at the drawn stride
  if (ai > 0) s.u = (s.u + dpx / (2 * STEP * RIG_AMPS[ai]!)) % 1;
  if (now - lastPrune > 5000) {
    lastPrune = now;
    for (const [k, g] of state) if (now - g.t > 10000) state.delete(k);
  }
  return { u: s.u, ai };
}
export const gaitStateSize = () => state.size;
/** Forgets all per-figure gait state (tests and the comparison harness). */
export const resetGait = () => state.clear();
