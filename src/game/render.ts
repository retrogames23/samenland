import deerWalkUrl from "@/assets/sprites/deer-walk.webp";
import deerGrazeUrl from "@/assets/sprites/deer-graze.webp";
import boarWalkUrl from "@/assets/sprites/boar-walk.webp";
import hunterUrl from "@/assets/sprites/folk/hunter.webp";
import henUrl from "@/assets/sprites/hen.webp";
import gullUrl from "@/assets/sprites/gull.webp";
import crowUrl from "@/assets/sprites/crow.webp";
import { animalsSleeping } from "./animals";
import cowUrl from "@/assets/sprites/cow.webp";
import maypoleUrl from "@/assets/sprites/maypole.webp";
import { worldHour, clock } from "./time";
import { sheepSpots, separate, keepRight, FOOT, type Body } from "./space";
import { huntScene, lodgeDens, denOk, denBeast, denFate, startle, DEN_R, type Den, type Beast } from "./wildlife";
import { roadMotion, screenFacing } from "./motion";
import { walkersNow, walkProgress, marketOpen, type Walker } from "./wander";
import { houseLit, candleFlicker } from "./night";
import { setArtTime } from "./season-art";
import { seasonKey, seasonAt } from "./season";
import { drawBuildingSprite, drawBuildingNight, hasNightSprite, spriteBox, setSpriteTime } from "./building-sprites";
import { texture, drawNature, texSample, allTexturesReady, natureReady, setNatureTime, boatImage, sheepImage, sheepWalkImage, cartImage, cartBackImage, wagonImage, fieldRowImage, oxWalkImage, planksPattern, riderImage, stallImage, type Tex } from "./nature-sprites";
import { townOf, townPoses, sickHome, isHomeKind, mayorGoal, steeredMayor, type Pose } from "./people";
import { folkImage, walkSheet, workSheet, WALK_FRAMES, bannerCloth, JOB_WORK, type FolkSprite } from "./folk-sprites";
import { titleOfSeed } from "./economy";
import { sacksAt, breadOut, fishingNow } from "./crafts";
import { isSunday } from "./time";
import { activeRaid, RAID_LEN } from "./disasters";
import { hash, vnoise, structureAt, faceFlip, terrain, resourceAt, isWater, MAP, FLAT, links, roadProgress, isTwin, acreOf, ageHours, effAge, radiusOf, reachOf, isBlessed, signTile, tradeProfile, complement, type TradeGood, type Signpost, type Planting, type Seed, type Structure, type Kind } from "./world";

export const TW = 32, TH = 16;
export const iso = (x: number, y: number) => [(x - y) * (TW / 2), (x + y) * (TH / 2)] as const;
export const toTile = (ix: number, iy: number) => {
  const a = ix / (TW / 2), b = iy / (TH / 2);
  return [Math.round((a + b) / 2), Math.round((b - a) / 2)] as const;
};
export type Camera = { x: number; y: number; zoom: number };
type C = CanvasRenderingContext2D;
type Pt = [number, number];

const INK = "rgba(34,26,18,0.72)";
const TEX_OF: Record<string, Tex> = { deep: "water", water: "water", sand: "sand", grass: "grass", meadow: "meadow", forest: "forest", hill: "grass", fertile: "fertile", mountain: "rock" };
const TERRAIN: Record<string, [number, number, number]> = {
  deep: [205, 38, 62], water: [198, 40, 70], sand: [42, 52, 80], grass: [88, 30, 66],
  meadow: [76, 36, 70], forest: [100, 24, 58], hill: [70, 22, 62],
  fertile: [72, 38, 54], mountain: [30, 10, 60],
};
const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${h} ${s}% ${l}% / ${a})`;

// ---------- hand-drawn helpers ----------
function jit(p: Pt, sd: number, i: number, amt = 0.08): Pt {
  return [p[0] + (hash(sd, i, 71) - 0.5) * amt, p[1] + (hash(sd, i, 72) - 0.5) * amt];
}
function shape(c: C, pts: Pt[], sd: number, fill: string | null, ink = true, close = true) {
  c.beginPath();
  pts.forEach((p, i) => { const q = jit(p, sd, i); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); });
  if (close) c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (ink) { c.strokeStyle = INK; c.lineWidth = 0.55; c.lineJoin = "round"; c.lineCap = "round"; c.stroke(); }
}
function line(c: C, a: Pt, b: Pt, sd: number, w = 0.45, col = INK) {
  const p = jit(a, sd, 1, 0.3), q = jit(b, sd, 2, 0.3);
  c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo((p[0] + q[0]) / 2 + (hash(sd, 3, 7) - 0.5) * 0.6, (p[1] + q[1]) / 2, q[0], q[1]);
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
function blob(c: C, x: number, y: number, r: number, fill: string, sd: number, ink = true) {
  c.beginPath();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, rr = r * (0.88 + hash(sd, i % n, 81) * 0.24);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8;
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.closePath(); c.fillStyle = fill; c.fill();
  if (ink) { c.strokeStyle = INK; c.lineWidth = 0.5; c.stroke(); }
}

// point inside tile at (u,v) in tile units (−0.5..0.5) with height h px
const P = (cx: number, cy: number) => (u: number, v: number, h = 0): Pt => [cx + (u - v) * (TW / 2), cy + (u + v) * (TH / 2) - h];

type Pal = { wall: string; wallD: string; roof: string; roofD: string };
function gable(c: C, cx: number, cy: number, a: number, b: number, H: number, R: number, ridgeX: boolean, pal: Pal, sd: number) {
  const base = P(cx, cy);
  const p = (u: number, v: number, h = 0) => (ridgeX ? base(u, v, h) : base(v, u, h));
  const [A, B] = ridgeX ? [a, b] : [b, a];
  void A; void B;
  const oa = a * 1.08, ob = b * 1.15;
  shape(c, [p(-oa, -ob, H - 1), p(oa, -ob, H - 1), p(oa, 0, H + R), p(-oa, 0, H + R)], sd + 1, pal.roofD);
  shape(c, [p(a, -b, 0), p(a, b, 0), p(a, b, H), p(a, 0, H + R), p(a, -b, H)], sd + 2, ridgeX ? pal.wallD : pal.wall);
  shape(c, [p(-a, b, 0), p(a, b, 0), p(a, b, H), p(-a, b, H)], sd + 3, ridgeX ? pal.wall : pal.wallD);
  shape(c, [p(-oa, ob, H - 1), p(oa, ob, H - 1), p(oa, 0, H + R), p(-oa, 0, H + R)], sd + 4, pal.roof);
  // roof hatching
  c.globalAlpha = 0.45;
  const n = Math.max(3, Math.round(a * 14));
  for (let i = 1; i < n; i++) { const u = -oa + (2 * oa * i) / n; line(c, p(u, ob * 0.92, H - 0.6), p(u, 0.03, H + R - 0.4), sd + 10 + i, 0.35); }
  c.globalAlpha = 1;
  return p;
}
function box(c: C, cx: number, cy: number, a: number, b: number, H: number, wall: string, wallD: string, top: string, sd: number) {
  const p = P(cx, cy);
  shape(c, [p(a, -b, 0), p(a, b, 0), p(a, b, H), p(a, -b, H)], sd + 2, wallD);
  shape(c, [p(-a, b, 0), p(a, b, 0), p(a, b, H), p(-a, b, H)], sd + 3, wall);
  shape(c, [p(-a, -b, H), p(a, -b, H), p(a, b, H), p(-a, b, H)], sd + 4, top);
  return p;
}
function windowV(c: C, p: ReturnType<typeof P>, u: number, v: number, h: number, sd: number, lights: Light[], w = 0.05, hh = 2.2) {
  shape(c, [p(u - w, v, h), p(u + w, v, h), p(u + w, v, h + hh), p(u - w, v, h + hh)], sd, "#3e4a52");
  const q = p(u, v, h + hh / 2); lights.push({ x: q[0], y: q[1], r: 3 });
}
function doorV(c: C, p: ReturnType<typeof P>, u: number, v: number, sd: number, w = 0.06, hh = 3.4, col = "#6b4a32") {
  shape(c, [p(u - w, v, 0), p(u + w, v, 0), p(u + w, v, hh), p(u - w, v, hh)], sd, col);
}

function tree(c: C, x: number, y: number, s: number, t: number, v: number, sd: number, conifer = 0.5) {
  const sway = Math.sin(t / 1300 + v * 10) * 0.6;
  const k = v < conifer ? "fir" : v > 0.82 ? "birch" : "oak";
  if (drawNature(c, k, x, y, s, sway, hash(sd, 5, 5) > 0.5)) return;
  blob(c, x, y - 7 * s, 4 * s, hsl(100, 30, 40), sd, false);
}
/** Soft drifting smoke haze: feathered puffs with no hard edge, fading as they rise. */
function smoke(c: C, x: number, y: number, t: number, sd: number, big = 1) {
  for (let i = 0; i < 5; i++) {
    const ph = (t / (3600 * big) + hash(sd, 1, 1) + i / 5) % 1;
    const px = x + ph * 6 * big + Math.sin(ph * 5 + sd) * 1.2, py = y - ph * 16 * big, r = (1.6 + ph * 4.5) * big;
    const a = 0.22 * Math.sin(Math.PI * Math.min(1, ph * 1.3));
    const g = c.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(214,210,202,${a})`); g.addColorStop(1, "rgba(214,210,202,0)");
    c.fillStyle = g; c.fillRect(px - r, py - r, r * 2, r * 2);
  }
}

/** win: a small window pane (rendered as a warm rectangle), otherwise an open flame/forge. */
export type Light = { x: number; y: number; r: number; building?: { kind: Kind; variant: number; seed: number; flip?: boolean } };

/** Local clock hour, cached per second (house lights depend on it). */
let hrCache = { at: 0, hr: 12 };
/** A candle burns all night in homes nursing a sick villager (same derivation as people.ts). */
function sickLit(x: number, y: number): boolean {
  let best: Seed | null = null, bd = Infinity;
  for (const o of renderSeeds) { const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } }
  return !!best && sickHome(best, x * 1024 + y, renderNow);
}
const localHour = () => { const n = clock(); if (n - hrCache.at > 1000) { const d = new Date(n); hrCache = { at: n, hr: worldHour(n) }; void d; } return hrCache.hr; };
/** Hovered / selected villager ids, set by the UI so the canvas can highlight them. */
export const peopleFocus: { hover: string | null; sel: string | null } = { hover: null, sel: null };

/** Small shaded sheep (~hip height of a villager). Walking adds a trotting bob and nod; standing grazes. */
function drawSheep(c: C, x: number, y: number, flip: boolean, t: number, walking: boolean, graze: boolean, sleeping: boolean) {
  const sheet = walking ? sheepWalkImage() : null;
  const im = sheepImage(graze && !walking, sleeping); if (!im) return;
  const w = 5.2;
  // walking: real painted 4-frame leg cycle, cross-faded so steps flow; body dips on each hoof fall
  const ph = walking ? t / 230 : 0, f0 = Math.floor(ph) & 3, mix = ph - Math.floor(ph);
  const bob = sleeping ? 0 : walking ? Math.abs(Math.sin(ph * Math.PI)) * 0.04 : Math.sin(t / 1700) * 0.025;
  c.fillStyle = "rgba(30,36,22,0.32)"; c.beginPath(); c.ellipse(x, y, 2.4, 0.8, 0, 0, 7); c.fill();
  c.save(); c.translate(x, y - bob); if (flip) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  if (sheet) {
    const fw = sheet.naturalWidth / 4, fh = sheet.naturalHeight, ww = w * 1.1, h = (ww * fh) / fw;
    c.drawImage(sheet, f0 * fw, 0, fw, fh, -ww / 2, -h, ww, h);
    if (mix > 0.5) { c.globalAlpha = (mix - 0.5) * 2; c.drawImage(sheet, ((f0 + 1) & 3) * fw, 0, fw, fh, -ww / 2, -h, ww, h); }
  } else {
    const h = (w * im.naturalHeight) / im.naturalWidth;
    c.drawImage(im, -w / 2, -h * 0.95, w, h);
  }
  c.restore();
}

const roofHue = (s: Structure, slate = false) => slate ? [215, 12, 46] : [12 + s.v * 18 + (s.seed.hue % 20) - 10, 48, 50];


/** Construction site: staked plot with materials → rising walls in a timber scaffold → finished. */
function drawSite(c: C, s: Structure, cx: number, cy: number, t: number, detail: boolean) {
  const p = s.build ?? 1, sd = Math.floor(s.v * 9973);
  const box = spriteBox(s.kind, s.v);
  const w = Math.min(30, (box?.w ?? 24) * 0.75), hw = w / 2, hh = w / 4;
  // trodden, dug-up ground: a dark soil plot with a lighter trodden rim, visible from the first minute
  c.save();
  const dia = (k: number) => { c.beginPath(); c.moveTo(cx, cy - hh * k); c.lineTo(cx + hw * k, cy); c.lineTo(cx, cy + hh * k); c.lineTo(cx - hw * k, cy); c.closePath(); };
  dia(1.12); c.fillStyle = "rgba(150,120,82,0.45)"; c.fill();
  dia(0.95); c.fillStyle = "rgba(92,66,40,0.8)"; c.fill();
  for (let i = 0; i < 10; i++) { // clods of turned earth
    const a = hash(sd, i, 11) - 0.5, b = hash(sd, i, 12) - 0.5;
    c.fillStyle = i % 2 ? "rgba(60,42,24,0.7)" : "rgba(130,100,66,0.6)";
    c.beginPath(); c.ellipse(cx + (a - b) * hw * 0.9, cy + (a + b) * hh * 0.9, 0.9, 0.45, 0, 0, 7); c.fill();
  }
  // foundation trench is cut first, stones follow
  {
    const f = p > 0.15 ? Math.min(1, (p - 0.15) / 0.2) : 0, k = 0.78;
    dia(k);
    c.strokeStyle = `rgba(52,36,22,${0.75 * (1 - f)})`; c.lineWidth = 1.1; c.stroke();
    if (f > 0) { c.strokeStyle = `rgba(150,140,125,${f})`; c.lineWidth = 1.6; c.stroke(); c.strokeStyle = `rgba(60,52,44,${0.6 * f})`; c.lineWidth = 0.35; c.stroke(); }
  }
  // walls rise from the ground up
  if (p > 0.35 && box) {
    c.globalAlpha = 0.95;
    drawBuildingSprite(c, s.kind, cx, cy, s.v, Math.min(1, 0.12 + (p - 0.35) / 0.65 * 0.95));
    c.globalAlpha = 1;
  }
  c.restore();
  // material piles: full timber stack and stone blocks delivered at once, used up as the house grows
  const left = Math.max(0, 1 - p);
  if (left > 0) {
    prop(c, "logs", cx + hw * 0.95, cy + hh * 0.6, 5 + 5 * left);
    prop(c, "blocks", cx - hw * 0.95, cy + hh * 0.55, 4 + 4.5 * left);
  }
  if (!detail) return;
  // timber scaffold around the rising house
  if (p > 0.25 && p < 0.97) {
    const im = folkImage("scaffold");
    if (im) { const sw = w * 1.05, sh = (sw * im.naturalHeight) / im.naturalWidth; c.drawImage(im, cx - sw / 2, cy + hh * 1.1 - sh, sw, sh); }
  }
  // stakes and string while the plot is still being marked out
  if (p < 0.3) {
    for (const [px, py] of [[cx - hw, cy], [cx, cy + hh], [cx + hw, cy], [cx, cy - hh]] as Pt[]) {
      c.strokeStyle = "#6a4a2a"; c.lineWidth = 0.75; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 3.6); c.stroke();
    }
    c.strokeStyle = "rgba(240,230,205,0.9)"; c.lineWidth = 0.28; c.beginPath();
    c.moveTo(cx - hw, cy - 3.1); c.lineTo(cx, cy + hh - 3.1); c.lineTo(cx + hw, cy - 3.1); c.lineTo(cx, cy - hh - 3.1); c.closePath(); c.stroke();
  }
  // the town's pennant on a pole marks the plot until the house is finished
  if (p < 0.97) {
    const pole = folkImage("bannerPole"), cloth = bannerCloth(s.seed.hue);
    if (pole && cloth) {
      const ph = 15, pw = (ph * pole.naturalWidth) / pole.naturalHeight, bx = cx + hw * 0.55, by = cy - hh * 0.55;
      const sway = Math.sin(t / 700 + sd) * 0.05;
      c.fillStyle = "rgba(20,15,10,0.25)"; c.beginPath(); c.ellipse(bx + 1, by, 1.8, 0.55, 0, 0, 7); c.fill();
      c.save(); c.translate(bx, by);
      const ox = -pw * 0.195;
      c.drawImage(pole, ox, -ph, pw, ph);
      c.translate(ox + pw * 0.2, -ph * 0.85); c.transform(1, sway, 0, 1 + sway * 0.5, 0, 0);
      c.drawImage(cloth, -pw * 0.2, -ph * 0.15, pw, ph);
      c.restore();
    }
  }
  // fresh sawdust / dust puff from hammering
  if (p > 0.25 && p < 0.97 && Math.sin(t / 300 + sd) > 0.7) {
    c.fillStyle = "rgba(210,190,150,0.35)"; c.beginPath(); c.ellipse(cx + Math.sin(sd) * hw * 0.4, cy - 4 - p * 6, 1.6, 0.8, 0, 0, 7); c.fill();
  }
}
/** Burning roof: flickering glow tongues, sparks and a thick smoke column; lights the night. */
function drawFire(c: C, cx: number, cy: number, t: number, sd: number, L: Light[]) {
  smoke(c, cx + 2, cy - 22, t * 2.5, sd, 1.6); smoke(c, cx - 3, cy - 18, t * 2, sd + 7, 1.2);
  for (let i = 0; i < 7; i++) {
    const ph = (t / 380 + hash(sd, i, 3)) % 1, fx = cx + (hash(sd, i, 4) - 0.5) * 16, fy = cy - 10 - hash(sd, i, 5) * 8 - ph * 7;
    const r = (2.4 + hash(sd, i, 6) * 2.2) * (1 - ph * 0.6);
    const g = c.createRadialGradient(fx, fy, 0, fx, fy, r);
    g.addColorStop(0, `rgba(255,236,170,${0.9 - ph * 0.5})`); g.addColorStop(0.45, `rgba(250,140,40,${0.75 - ph * 0.5})`); g.addColorStop(1, "rgba(200,50,10,0)");
    c.fillStyle = g; c.beginPath(); c.ellipse(fx, fy, r * 0.7, r * 1.4, 0, 0, 7); c.fill();
  }
  for (let i = 0; i < 4; i++) { const ph = (t / 900 + i / 4 + hash(sd, i, 8)) % 1; c.fillStyle = `rgba(255,190,90,${1 - ph})`; c.fillRect(cx + Math.sin(ph * 6 + i) * 6, cy - 16 - ph * 22, 0.6, 0.6); }
  L.push({ x: cx, y: cy - 10, r: 26 });
}
/** Flood water over a tile: muddy translucent sheet with a slow shimmer. */
function drawFlood(c: C, cx: number, cy: number, t: number, sd: number) {
  const p = P(cx, cy), a = 0.5 + Math.sin(t / 1800 + sd) * 0.05;
  c.fillStyle = `rgba(92,112,104,${a})`; c.beginPath();
  const q = [p(-0.55, -0.55), p(0.55, -0.55), p(0.55, 0.55), p(-0.55, 0.55)]; c.moveTo(q[0]![0], q[0]![1]); for (const v of q) c.lineTo(v[0], v[1]); c.closePath(); c.fill();
  c.fillStyle = "rgba(220,230,225,0.18)"; c.fillRect(cx - 4 + Math.sin(t / 900 + sd) * 2, cy - 0.5, 6, 0.5);
}
/** Robber: sneaks in from the forest edge, past the houses, and out again. */
function drawRobber(c: C, X: number, Y: number, flip: boolean, t: number) {
  const im = folkImage("robber"); if (!im) return;
  const h = 5.2, w = (h * im.naturalWidth) / im.naturalHeight;
  c.fillStyle = "rgba(25,20,10,0.22)"; c.beginPath(); c.ellipse(X + 0.6, Y + 0.1, w * 0.55, 0.6, 0.1, 0, 7); c.fill();
  // sneaking: crouched torso on the shared painted leg cycle, slow careful steps
  const ph = t / 260, legs = folkImage("legsM"), crouch = 0.04 + Math.abs(Math.sin(ph * Math.PI)) * 0.05;
  c.save(); c.translate(X, Y); if (flip) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  if (legs) {
    const [hx, hem] = HIPS.robber!, fw = legs.naturalWidth / WALK_FRAMES, f = Math.floor(ph) % WALK_FRAMES;
    const lh = h * (1 - hem + 0.1), lw = (lh * fw) / legs.naturalHeight;
    c.drawImage(legs, f * fw, 0, fw, legs.naturalHeight, -lw * 0.5, -lh, lw, lh);
    c.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight * hem, -w * hx, -h + crouch, w, h * hem);
  } else c.drawImage(im, -w / 2, -h, w, h);
  c.restore();
}
const DECK_M = typeof DOMMatrix !== "undefined" ? new DOMMatrix() : (null as unknown as DOMMatrix); // reused per frame, no GC churn
export function robberAt(s: Seed, now: number): [number, number, boolean] | null {
  const r = activeRaid(s, now); if (!r) return null;
  const ph = (now - r.at) / RAID_LEN, R = Math.max(3, radiusOf(effAge(s, renderSeeds, now)) * 0.8), a = hash(s.x, s.y, Math.floor(r.at / 864e5)) * 6.28;
  const d = ph < 0.5 ? R * (1 - ph * 2) + 1.2 : R * (ph - 0.5) * 2 + 1.2, b = a + (ph < 0.5 ? 0 : 0.9);
  return [s.x + Math.cos(b) * d, s.y + Math.sin(b) * d, ph >= 0.5];
}
const huntIms: Record<string, HTMLImageElement> = {};
const huntIm = (k: string, u: string) => { if (typeof Image === "undefined") return null; let i = huntIms[k]; if (!i) { i = new Image(); i.src = u; huntIms[k] = i; } return i.complete && i.naturalWidth ? i : null; };
/** Draw frame f (0-3) of a 4-frame sheet, feet at (X,Y), facing right unless flip. */
function sheetFrame(c: C, im: HTMLImageElement, f: number, X: number, Y: number, h: number, flip: boolean, rot = 0, alpha = 1) {
  const fw = im.naturalWidth / 4, w = (h * fw) / im.naturalHeight;
  c.save(); c.globalAlpha *= alpha; c.translate(X, Y); if (flip) c.scale(-1, 1); if (rot) c.rotate(rot);
  c.drawImage(im, (f & 3) * fw, 0, fw, im.naturalHeight, -w / 2, -h, w, h); c.restore();
}
const shadow = (c: C, X: number, Y: number, r: number, a = 0.24) => { c.fillStyle = `rgba(25,20,10,${a})`; c.beginPath(); c.ellipse(X, Y, r, r * 0.3, 0, 0, 7); c.fill(); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => k * k * (3 - 2 * k);
/** Animal on the move: walk sheet indexed by distance travelled, grazing/alert sheet when standing. */
function drawBeast(c: C, walkIm: HTMLImageElement, standIm: HTMLImageElement | null, X: number, Y: number, h: number, flip: boolean, moving: number, dist: number, idle: number, alpha = 1) {
  shadow(c, X, Y, h * 0.42);
  if (moving > 0.02 || !standIm) {
    const ph = dist / 1.1, f = Math.floor(ph), bob = Math.abs(Math.sin(ph * Math.PI)) * h * 0.02;
    sheetFrame(c, walkIm, f, X, Y - bob, h, flip, 0, alpha);
  } else sheetFrame(c, standIm, idle, X, Y, h, flip, 0, alpha);
}
/** Hens around the coop: short trots, pecking, looking up; they roost inside at night. */
function drawHens(c: C, cx: number, cy: number, sd: number) {
  const im = huntIm("hen", henUrl); if (!im) return;
  const hr = localHour(); if (hr < 6 || hr > 20) return;
  for (let i = 0; i < 3; i++) {
    const n = renderNow + hash(sd, i, 7) * 1e5, g = n / 7000 + i * 2.1;
    const X = cx - 8 + i * 6 + Math.sin(g) * 3, Y = cy + 5 + Math.sin(g * 0.7 + i) * 1.5, moving = Math.abs(Math.cos(g)) > 0.8;
    const f = moving ? (Math.floor(n / 160) & 1) : (Math.floor(n / 900 + i) % 3 === 0 ? 3 : 2);
    shadow(c, X, Y, 1.1, 0.22);
    sheetFrame(c, im, f, X, Y, 1.3, Math.cos(g) < 0);
  }
}
/** Gulls circle over the coast, crows over fields: painted flap cycle, gliding between strokes. */
function drawBird(c: C, cx: number, cy: number, gull: boolean, sd: number) {
  const im = huntIm(gull ? "gull" : "crow", gull ? gullUrl : crowUrl); if (!im) return;
  const hr = localHour(); if (hr < 6 || hr > 20) return;
  const n = renderNow + hash(sd, 1, 9) * 1e6, r = 14 + hash(sd, 2, 9) * 14, a = n / (gull ? 5200 : 3800) * (hash(sd, 3, 9) < 0.5 ? 1 : -1);
  const X = cx + Math.cos(a) * r, Y = cy - 26 + Math.sin(a) * r * 0.45, dx = -Math.sin(a) * (hash(sd, 3, 9) < 0.5 ? 1 : -1);
  const cyc = (n / 140) % 12, f = cyc < 4 ? Math.floor(cyc) : 3; // a few strokes, then glide
  c.fillStyle = "rgba(25,20,10,0.12)"; c.beginPath(); c.ellipse(X, Y + 26, 1.4, 0.4, 0, 0, 7); c.fill();
  sheetFrame(c, im, f, X, Y, gull ? 3.4 : 2.8, dx < 0);
}
/** Free natural ground for game: open land, no building, site, road, field, pasture or water. */
const WILD_OK = new Set(["forest", "meadow", "grass", "hill", "fertile"]);
const freeGround = (x: number, y: number) => WILD_OK.has(terrain(x, y)) && !structureAt(x, y, renderSeeds, renderNow);
const isLodgeAt = (x: number, y: number) => { const s = structureAt(x, y, renderSeeds, renderNow); return s?.kind === "lodge" && s.build === undefined; };
/** Nearest finished lodge within reach of a den (cached a minute) — the lodge that hunts it. */
const ownerCache = new Map<number, { at: number; o: [number, number] | null }>();
function denOwner(x: number, y: number): [number, number] | null {
  const key = y * MAP + x, hit = ownerCache.get(key);
  if (hit && Math.abs(renderNow - hit.at) < 60000) return hit.o;
  let o: [number, number] | null = null, best = Infinity;
  for (let dy = -DEN_R; dy <= DEN_R; dy++) for (let dx = -DEN_R; dx <= DEN_R; dx++) {
    const d = Math.hypot(dx, dy); if (d > DEN_R || d >= best) continue;
    if (isLodgeAt(x + dx, y + dy)) { best = d; o = [x + dx, y + dy]; }
  }
  if (ownerCache.size > 4000) ownerCache.clear();
  ownerCache.set(key, { at: renderNow, o }); return o;
}
const densCache = new Map<number, { at: number; d: Den[] }>();
function densOf(lx: number, ly: number): Den[] {
  const key = ly * MAP + lx, hit = densCache.get(key);
  if (hit && Math.abs(renderNow - hit.at) < 60000) return hit.d;
  const d = lodgeDens(lx, ly, freeGround, (x, y) => { const o = denOwner(x, y); return !!o && o[0] === lx && o[1] === ly; });
  densCache.set(key, { at: renderNow, d }); return d;
}
type Bucket = Map<number, (() => void)[]>;
const putAt = (out: Bucket, x: number, y: number, f: () => void) => { const k = Math.round(y) * MAP + Math.round(x); const l = out.get(k); if (l) l.push(f); else out.set(k, [f]); };
function putBeast(out: Bucket, c: C, b: Beast) {
  const dw = huntIm("dw", deerWalkUrl), dg = huntIm("dg", deerGrazeUrl), bw = huntIm("bw", boarWalkUrl);
  if (!dw || !dg || !bw || b.alpha <= 0) return;
  putAt(out, b.x, b.y, () => {
    const [X, Y] = iso(b.x, b.y), h = b.boar ? 4.4 : 6.2, n = renderNow + b.x * 997;
    if (b.state === "dead") { shadow(c, X, Y, h * 0.5); sheetFrame(c, dg, 3, X, Y, h, !b.flip, b.fall * 1.45 * (b.flip ? 1 : -1)); return; }
    if (b.boar && b.state === "root") { shadow(c, X, Y, h * 0.5); sheetFrame(c, bw, 3, X, Y - (Math.floor(n / 500) & 1) * 0.08, h, b.flip, 0, b.alpha); return; }
    const moving = b.state === "walk" || b.state === "flee" ? 1 : 0;
    const idle = Math.floor(n / 1500) % 8 < 5 ? (Math.floor(n / 650) & 1) : 2;
    drawBeast(c, b.boar ? bw : dw, b.boar ? null : dg, X, Y, h, b.flip, moving, b.state === "flee" ? n / 170 : b.dist + n / 2000, idle, b.alpha);
  });
}
/** Free game in its dens across the whole map; dens near a lodge are hunted in turn and regrow. */
function wildFigures(x: number, y: number, out: Bucket, c: C) {
  if (!denOk(x, y, freeGround)) return;
  const hr = localHour(); if (hr < 5.5 || hr > 20.5) return;
  let b: Beast = denBeast(x, y, renderNow, freeGround);
  const o = denOwner(x, y);
  if (o) {
    const dens = densOf(o[0], o[1]), i = dens.findIndex((d) => d[0] === x && d[1] === y);
    if (i >= 0) { const f = denFate(o[0], o[1], i, dens.length, renderNow); if (f.phase !== "free") return; b = { ...b, alpha: f.alpha }; }
    b = startle(b, o[0], o[1], dens, renderNow) ?? b;
  }
  putBeast(out, c, b);
}
/** Hunt scene of one lodge, bucketed by the tile each figure stands on so it depth-sorts with the town. */
function huntFigures(lx: number, ly: number, out: Bucket, c: C, L?: Light[]) {
  const hu = huntIm("hu", hunterUrl); if (!hu) return;
  const hr = localHour(); if (hr < 5.5 || hr > 20.5) return;
  const sc = huntScene(lx, ly, renderNow, freeGround, densOf(lx, ly));
  const put = (x: number, y: number, f: () => void) => putAt(out, x, y, f);
  for (const b of sc.beasts) putBeast(out, c, b);
  const hp = sc.hunter;
  if (hp && L) { const [hx, hy] = iso(hp.x, hp.y); L.push({ x: hx, y: hy - 2, r: 7 }); }
  if (hp) put(hp.x, hp.y, () => {
    const [X, Y] = iso(hp.x, hp.y), bob = hp.walk ? Math.abs(Math.sin(renderNow / 260)) * 0.15 : 0;
    shadow(c, X, Y, 1.6, 0.3);
    sheetFrame(c, hu, hp.frame, X, Y - bob, hp.frame === 2 ? 4.1 : hp.frame === 1 ? 4.6 : 5.4, hp.flip);
  });
  const bo = sc.bolt;
  if (bo) put(bo.to[0], bo.to[1], () => {
    const [sx, sy] = iso(bo.from[0], bo.from[1]), [ex, ey] = iso(bo.to[0], bo.to[1]);
    const bx = lerp(sx, ex, bo.r), by = lerp(sy - 3, ey - 3.5, bo.r), dir = Math.sign(ex - sx) || 1;
    c.strokeStyle = "rgba(60,40,22,0.9)"; c.lineWidth = 0.18; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - dir * 1.1, by); c.stroke();
  });
}
function drawStructure(c: C, s: Structure, cx: number, cy: number, x: number, y: number, t: number, L: Light[]) {
  const sd = x * 1000 + y;
  if (SOUND_KINDS.has(s.kind) && lastSources.length < 200) lastSources.push({ x: cx, y: cy, k: s.build !== undefined ? "site" : s.kind });
  else if (s.build !== undefined && lastSources.length < 200) lastSources.push({ x: cx, y: cy, k: "site" });
  if (s.build !== undefined) { drawSite(c, s, cx, cy, t, true); return; }
  const flip = faceFlip(s.kind, x, y, (i, j) => { const k = structureAt(i, j, renderSeeds, renderNow)?.kind; return !!k && PATHLIKE.has(k); });
  if (drawBuildingSprite(c, s.kind, cx, cy, s.v, 1, flip)) {
    if (s.kind === "campfire") {
      L.push({x:cx,y:cy-3,r:7}); smoke(c,cx,cy-6,t,sd,0.25);
    }
    if (s.fire) drawFire(c, cx, cy, t, sd, L);
    if (hasNightSprite(s.kind) && (houseLit(s.kind, sd, localHour()) || (isHomeKind(s.kind) && sickLit(x, y)))) {
      L.push({ x: cx, y: cy, r: 32, building: { kind: s.kind, variant: s.v, seed: sd, flip } });
    }
    if (s.kind === "mill" || s.kind === "watermill") {
      // flour sacks pile up by the door through the workday (stack sprite revealed from the bottom)
      const n = sacksAt(localHour(), isSunday(renderNow)), im = folkImage("flourSacks");
      if (n > 0 && im) { const hh = 4.2, ww = (hh * im.naturalWidth) / im.naturalHeight, part = n / 4, sx = cx + (flip ? -7 : 7);
        c.drawImage(im, 0, im.naturalHeight * (1 - part), im.naturalWidth, im.naturalHeight * part, sx - ww / 2, cy + 3 - hh * part, ww, hh * part); }
    }
    if (s.kind === "bakery" && breadOut(localHour())) {
      const im = folkImage("breadBasket");
      if (im) { const hh = 2, ww = (hh * im.naturalWidth) / im.naturalHeight; c.drawImage(im, cx + (flip ? 6 : -6) - ww / 2, cy + 3.5 - hh, ww, hh); }
    }
    if (["steamworks", "smithy", "bakery", "inn"].includes(s.kind)) {
      smoke(c, cx + 4, cy - 18, t, sd, 0.6);
    }
    return;
  }
  const v = s.v;
  if (s.kind === "pasture") {
      const p = P(cx, cy);
      c.globalAlpha = 0.85;
      line(c, p(-0.48, 0.48, 1.5), p(0.48, 0.48, 1.5), sd, 0.5, "#6b4a32");
      line(c, p(0.48, -0.48, 1.5), p(0.48, 0.48, 1.5), sd + 1, 0.5, "#6b4a32");
      c.globalAlpha = 1;
      // with villagers on the tile, sheep and people are resolved and depth-sorted together in pass 2
      if (v > 0.35 && !sharedPasture.has(sd)) {
        const flock = sheepSpots(sd, v, renderNow).sort((a, b) => a.m.dy - b.m.dy);
        for (const { k, m } of flock) {
          drawSheep(c, cx + m.dx, cy + m.dy, m.flip, t + k * 1700, m.walking, m.graze, m.sleeping);
        }
      }
  }

}

/** Pasture tiles (x*1000+y) whose sheep are drawn with the villagers standing there. */
const sharedPasture = new Set<number>();
const LAYER: Record<string, number> = { deep: 0, water: 0, sand: 1, fertile: 2, meadow: 3, grass: 4, hill: 5, forest: 6, mountain: 7 };
const LAYER_T = ["water", "sand", "fertile", "meadow", "grass", "hill", "forest", "mountain"];
const NB8: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
const PATHLIKE: ReadonlySet<Kind> = new Set(["path", "street", "square", "well", "market", "road", "bridge", "avenue", "rail"]);

/** Whole map fits ~1000px wide at this zoom. */
export const MIN_ZOOM = 0.025;
const OVERVIEW_BELOW = 0.45;
/** Between this zoom and OVERVIEW_BELOW the overview uses the baked ground chunks. */
const CHUNKS_BELOW_OVERVIEW = 0.18;
const smoothCache = new WeakMap<object, Pt[]>();
/** Road tiles are 4-connected (stair steps); travellers follow a smoothed curve through them. */
function smoothRoad(l: { tiles: [number, number][] }): Pt[] {
  const hit = smoothCache.get(l); if (hit) return hit;
  const raw = l.tiles.map(([x, y]) => iso(x, y) as unknown as Pt);
  const R = 3;
  const out = raw.map((_, i) => {
    // shrink the smoothing window until the curve no longer cuts across water (shore bends)
    for (let r = R; r > 0; r--) {
      let sx = 0, sy = 0, c = 0;
      for (let j = Math.max(0, i - r); j <= Math.min(raw.length - 1, i + r); j++) { sx += raw[j]![0]; sy += raw[j]![1]; c++; }
      const p: Pt = [sx / c, sy / c], [tx, ty] = toTile(p[0], p[1]);
      if (!isWater(terrain(tx, ty)) || isWater(terrain(l.tiles[i]![0], l.tiles[i]![1]))) return p;
    }
    return raw[i]!;
  });
  smoothCache.set(l, out); return out;
}

/** Visible load on the cart bed, coloured by trade good. */
const LOAD: Record<TradeGood, [string, "sack" | "log" | "barrel" | "block"]> = {
  grain: ["#d4b25c", "sack"], wool: ["#e6dcc6", "sack"], salt: ["#ece8de", "sack"], fish: ["#7a6a52", "barrel"], beer: ["#6e4a2c", "barrel"],
  wood: ["#7a5232", "log"], timber: ["#c09a66", "log"], ore: ["#5a5450", "block"], stone: ["#a39d92", "block"], hides: ["#8a5a3a", "sack"], cloth: ["#8a3a3a", "sack"], ironware: ["#4b4e55", "block"],
};
function drawLoad(c: C, x: number, y: number, dx: number, dy: number, g: TradeGood) {
  const [col, shape] = LOAD[g]; const f = -screenFacing(dx, dy);
  c.save(); c.translate(x + f * 1.6, y - 6.2); c.fillStyle = col; c.strokeStyle = "rgba(30,20,12,0.7)"; c.lineWidth = 0.35;
  for (let i = 0; i < 3; i++) {
    const ox = (i - 1) * 1.7, oy = i === 1 ? -0.6 : 0;
    c.beginPath();
    if (shape === "sack") c.ellipse(ox, oy, 1.1, 0.8, 0, 0, 7);
    else if (shape === "barrel") c.ellipse(ox, oy, 0.75, 1.0, 0, 0, 7);
    else if (shape === "log") c.ellipse(ox, oy, 0.55, 0.55, 0, 0, 7);
    else c.rect(ox - 0.8, oy - 0.6, 1.6, 1.2);
    c.fill(); c.stroke();
  }
  c.restore();
}

/** Mounted messenger: 4-frame painted trot, front sheet faces right, rear sheet faces left; hooves on the ground line. */
function drawRider(c: C, x: number, y: number, dx: number, dy: number, sd: number, t: number) {
  const away = dy < -0.15 * Math.abs(dx), im = riderImage(away);
  if (!im) return;
  const H = 11, fw = im.naturalWidth / 4, W = (fw / im.naturalHeight) * H;
  const g = (t / 110 + sd * 3.17) % 4, f = Math.floor(g), u = g - f, f2 = (f + 1) & 3, lift = Math.abs(Math.sin(g * Math.PI)) * 0.25;
  c.save(); c.translate(x, y);
  const face = screenFacing(dx, dy); if (away ? face > 0 : face < 0) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.fillStyle = "rgba(20,15,10,0.36)"; c.beginPath(); c.ellipse(0, -0.2, W * 0.36, 1, 0, 0, 7); c.fill();
  c.drawImage(im, f * fw, 0, fw, im.naturalHeight, -W / 2, -H - lift, W, H);
  if (u > 0.55) { c.globalAlpha = (u - 0.55) / 0.45; c.drawImage(im, f2 * fw, 0, fw, im.naturalHeight, -W / 2, -H - lift, W, H); c.globalAlpha = 1; }
  c.restore();
}
/** Painted market stall standing on the verge (y = ground line). */
function drawStall(c: C, x: number, y: number, flip: boolean) {
  const im = stallImage(); if (!im) return;
  const H = 12, W = (im.naturalWidth / im.naturalHeight) * H;
  c.save(); c.translate(x, y); if (flip) c.scale(-1, 1);
  c.fillStyle = "rgba(20,15,10,0.3)"; c.beginPath(); c.ellipse(0, -0.5, W * 0.45, 1.6, 0, 0, 7); c.fill();
  c.drawImage(im, -W / 2, -H, W, H); c.restore();
}

/** Painted ox cart: ox-less wagon + separate 4-frame ox walk cycle, both standing on the ground line. */
// layout measured in sprite pixels: wagon bottom-left origin, ox bottom-centre offset, ox scale, combo centre
// ox y = hoof line (sprite pixels below the wheel line); feet sit at FOOT·frame height inside the sheet
const CART_LAYOUT = { front: { k: 0.04, cx: 200, ox: [315, 18], os: 1.35, foot: 139 / 140 }, back: { k: 0.042, cx: 150, ox: [235, -34], os: 1.45, foot: 156 / 160 } } as const;
/** Vertical shear that tilts the painted team (drawn for the 2:1 diagonal) onto the real road slope, so ox and wagon follow steep roads. */
export function cartShear(dx: number, dy: number, away: boolean): number {
  const slope = Math.max(-1.6, Math.min(1.6, dy / Math.max(Math.abs(dx), 0.05)));
  return Math.max(-1.1, Math.min(1.1, slope - (away ? -0.5 : 0.5)));
}
function drawCart(c: C, x: number, y: number, dx: number, dy: number, _bob: number, sd: number, _cover: string, t: number) {
  const away = dy < -0.15 * Math.abs(dx);
  const wag = wagonImage(away), ox = oxWalkImage(away);
  c.save(); c.translate(x, y); if (screenFacing(dx, dy) < 0) c.scale(-1, 1);
  c.transform(1, cartShear(dx, dy, away), 0, 1, 0, 0);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  if (!wag || !ox) {
    const im = away ? cartBackImage() ?? cartImage() : cartImage();
    if (im) { const w = away ? 13 : 15, h = (w * im.naturalHeight) / im.naturalWidth; c.drawImage(im, -w / 2, -h, w, h); }
    c.restore(); return;
  }
  const L = away ? CART_LAYOUT.back : CART_LAYOUT.front, k = L.k;
  const ww = wag.naturalWidth * k, wh = wag.naturalHeight * k, wx = -L.cx * k;
  const fw = ox.naturalWidth / 4, ow = fw * k * L.os, oh = ox.naturalHeight * k * L.os;
  const oxX = wx + L.ox[0] * k, oxY = L.ox[1] * k;
  // continuous gait clock (~150 ms per pose, 0.6 s per full stride) so legs don't freeze between poses
  const g = (t / 150 + sd * 7.31) % 4, f = Math.floor(g), u = g - f, f2 = (f + 1) & 3;
  // body weight: tiny dip on each hoof contact, wagon jolts slightly behind
  const dip = Math.abs(Math.sin(g * Math.PI)) * 0.18, jolt = Math.abs(Math.sin(g * Math.PI + 1)) * 0.08;
  // contact shadows directly on the road under wheels and hooves
  c.fillStyle = "rgba(20,15,10,0.38)";
  c.beginPath(); c.ellipse(wx + ww * 0.42, -0.3, ww * 0.42, 1.2, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(oxX, oxY - 0.15, ow * 0.4, 0.9, 0, 0, 7); c.fill();
  const top = oxY - oh * L.foot + dip;
  const drawOx = () => {
    // short cross-blend into the next pose gives in-between leg positions instead of a flip-book cut
    c.drawImage(ox, f * fw, 0, fw, ox.naturalHeight, oxX - ow / 2, top, ow, oh);
    if (u > 0.55) { c.globalAlpha = (u - 0.55) / 0.45; c.drawImage(ox, f2 * fw, 0, fw, ox.naturalHeight, oxX - ow / 2, top, ow, oh); c.globalAlpha = 1; }
  };
  if (away) drawOx();
  c.drawImage(wag, wx, -wh + jolt, ww, wh);
  if (!away) drawOx();
  c.restore();
}

// ---------------- villagers ----------------
// Muted, earthy period palette (Commandos-like): no saturated toy colours.
const SKIN = ["#e2bf9f", "#d3a985", "#bf9068", "#9c6d4a", "#74492f"];
const HAIR = ["#2a1e16", "#4a3222", "#6e4a2c", "#a07a45", "#bfa36a", "#7f3c25"];
const CLOTH = ["#6b7552", "#8a4a38", "#4e5d6c", "#9c8150", "#6a5a66", "#5a6e66", "#8a6650", "#525a40", "#a07a62", "#cfc3a5"];
const PANTS = ["#3e362f", "#4b4e55", "#5a4736", "#363d47"];
/** Villagers are drawn at this fraction of their modelled size so they match doors, fences and fields. */
const PERSON_SCALE = 0.55;
/** Screen-space people currently drawn (for clicking). */
/** Screen-space traders on trade roads (for clicking). */
export const lastTraders: { x: number; y: number; from: string; to: string; good: TradeGood | null; cart: boolean; walker?: Walker; stall?: boolean }[] = [];
export const lastPeople: { x: number; y: number; q: Pose }[] = [];
/** Sound-emitting structures drawn this frame (world-screen coords), read by the audio mixer. */
export const lastSources: { x: number; y: number; k: string }[] = [];
const SOUND_KINDS = new Set(["campfire", "mill", "watermill", "smithy", "pasture", "church", "sawmill", "steamworks"]);
function limb(c: C, pts: Pt[], col: string, w: number) {
  c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(pts[0]![0], pts[0]![1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i]![0], pts[i]![1]);
  c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = w + 0.45; c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
  // soft top-left light, like painted sprite shading
  c.strokeStyle = "rgba(255,235,200,0.16)"; c.lineWidth = w * 0.35; c.stroke();
}
function bubble(c: C, x: number, y: number, icon: number) {
  c.beginPath(); c.ellipse(x, y, 2.6, 1.9, 0, 0, 7);
  c.moveTo(x - 0.6, y + 1.6); c.lineTo(x - 1.4, y + 3); c.lineTo(x + 0.3, y + 1.8);
  c.fillStyle = "#fbf6ea"; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.3; c.stroke();
  c.lineWidth = 0.3;
  if (icon === 0) { c.fillStyle = "#c0504a"; c.beginPath(); c.arc(x - 0.45, y - 0.3, 0.55, 0, 7); c.arc(x + 0.45, y - 0.3, 0.55, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - 1, y - 0.1); c.lineTo(x, y + 1); c.lineTo(x + 1, y - 0.1); c.fill(); }
  else if (icon === 1) { c.fillStyle = "#c8914f"; c.beginPath(); c.ellipse(x, y, 1.4, 0.8, 0, 0, 7); c.fill(); c.stroke(); for (const k of [-0.5, 0, 0.5]) { c.beginPath(); c.moveTo(x + k - 0.2, y - 0.5); c.lineTo(x + k + 0.2, y + 0.3); c.stroke(); } }
  else if (icon === 2) { c.fillStyle = "#f0c24f"; c.beginPath(); c.arc(x, y, 0.75, 0, 7); c.fill(); c.strokeStyle = "#d9a53a"; for (let k = 0; k < 6; k++) { const a = k * 1.047; c.beginPath(); c.moveTo(x + Math.cos(a) * 1.05, y + Math.sin(a) * 1.05); c.lineTo(x + Math.cos(a) * 1.45, y + Math.sin(a) * 1.45); c.stroke(); } }
  else if (icon === 3) { c.fillStyle = "#b8c4cf"; c.beginPath(); c.arc(x - 0.5, y - 0.2, 0.7, 0, 7); c.arc(x + 0.5, y - 0.3, 0.8, 0, 7); c.fill(); c.strokeStyle = "#5a86b0"; for (const k of [-0.6, 0.1, 0.8]) { c.beginPath(); c.moveTo(x + k, y + 0.7); c.lineTo(x + k - 0.2, y + 1.2); c.stroke(); } }
  else if (icon === 4) { c.fillStyle = INK; for (const k of [-0.9, 0, 0.9]) { c.beginPath(); c.arc(x + k, y, 0.28, 0, 7); c.fill(); } }
  else { c.fillStyle = INK; c.beginPath(); c.ellipse(x - 0.4, y + 0.6, 0.45, 0.35, -0.4, 0, 7); c.fill(); c.strokeStyle = INK; c.beginPath(); c.moveTo(x - 0.0, y + 0.6); c.lineTo(x, y - 1); c.quadraticCurveTo(x + 0.8, y - 0.7, x + 0.9, y - 0.2); c.stroke(); }
}
/** Which painted figure represents this villager right now. */
function folkOf(q: Pose): FolkSprite {
  const p = q.p;
  if (q.festive) return q.festive;
  if (p.age < 15) return "child";
  const f = p.sex === "f";
  if (q.carry) return f ? "porterF" : "porter";
  if (p.job === "builder") return f ? "builderF" : "builder";
  if (p.job === "farmer") return f ? "farmerF" : "farmer";
  if (p.job === "woodcutter") return f ? "woodcutterF" : "woodcutter";
  if (p.job === "mason") return f ? "masonF" : "mason";
  if (p.job === "priest") return "priest";
  if (p.age >= 65) return f ? "elderF" : "elder";
  return f ? "woman" : "man";
}
const HIPS: Partial<Record<FolkSprite, [number, number]>> = { man: [0.45, 0.63], farmer: [0.28, 0.66], porter: [0.47, 0.65], builder: [0.45, 0.64], woodcutter: [0.5, 0.62], mason: [0.42, 0.62], elder: [0.45, 0.7], robber: [0.47, 0.72], groom: [0.56, 0.74] };
// long robes walk like skirts: two painted shoes step under the hem
const SKIRTS: ReadonlySet<FolkSprite> = new Set(["woman", "porterF", "farmerF", "elderF", "masonF", "woodcutterF", "builderF", "bride", "priest"] as FolkSprite[]);
const TOOL_WORK: ReadonlySet<FolkSprite> = new Set(["farmer", "farmerF", "woodcutter", "woodcutterF", "mason", "masonF", "builder", "builderF"] as FolkSprite[]);
/** Men in breeches (every trade except robes/gowns) share the painted leg cycle. */
const WORK_FRAMES = 6;
const legsFor = (q: Pose) => !!HIPS[folkOf(q)];
/** Painted villager sprite: faces the walking direction, bobs while walking, sways while working. */
/** Mayor's insignia by honorary title (titleOfSeed): chain, plumed beret, own banner — drawn in the mirrored figure frame. */
function insignia(c: C, q: Pose, hgt: number) {
  if (q.p.estate === "wealthy" && q.p.age >= 16 && q.p.job !== "mayor" && !q.working && !q.carry && !q.festive) {
    const hat = folkImage("beret");
    if (hat) { const h = hgt * 0.17, w = h * hat.naturalWidth / hat.naturalHeight; c.drawImage(hat, -w / 2, -hgt * 1.03, w, h); }
  }
  if (q.p.job !== "mayor") return;
  const n = titleOfSeed(q.p.seed); if (n < 1) return;
  const ch = folkImage("chain");
  if (ch) { const h = hgt * 0.24, w = (h * ch.naturalWidth) / ch.naturalHeight; c.drawImage(ch, -w / 2 + hgt * 0.02, -hgt * 0.78, w, h); }
  const bt = n >= 2 ? folkImage("beret") : null;
  if (bt) { const h = hgt * 0.2, w = (h * bt.naturalWidth) / bt.naturalHeight; c.drawImage(bt, -w / 2 + hgt * 0.03, -hgt * 1.06, w, h); }
  if (n >= 3) {
    const pole = folkImage("bannerPole"), cloth = bannerCloth(q.p.seed.hue);
    if (pole) { const h = hgt * 1.5, w = (h * pole.naturalWidth) / pole.naturalHeight; c.drawImage(pole, hgt * 0.32 - w / 2, -h, w, h);
      if (cloth) { const ch2 = h * 0.38, cw = (ch2 * cloth.width) / cloth.height; c.drawImage(cloth, hgt * 0.32, -h * 0.95, cw, ch2); } }
  }
}
function drawFolk(c: C, X: number, Y: number, q: Pose, t: number): Pt | null {
  const k = folkOf(q), im = folkImage(k); if (!im) return null;
  const kid = k === "child", hgt = kid ? 3.2 + q.p.age * 0.08 : 5.2;
  const w = (hgt * im.naturalWidth) / im.naturalHeight;
  const face = screenFacing(q.dir[0] - q.dir[1], (q.dir[0] + q.dir[1]) / 2), ph = q.phase + hash(q.p.id, 77, 5) * 6.2832;
  const painted = q.walking && (!!walkSheet(k) || legsFor(q));
  const bob = q.walking ? Math.abs(Math.sin(ph)) * 0.07 : 0;
  // working: asymmetric tool rhythm — slow wind-up, quick stroke, short rest (not a pendulum)
  const skirt = q.walking && !painted && SKIRTS.has(k);
  let tilt = 0;
  // only trades with a visible tool stroke move while working; everyone else stands still
  // whole-sprite rocking looked like see-sawing; only painted frame cycles animate work now
  void TOOL_WORK; void tilt;
  c.fillStyle = "rgba(25,20,10,0.22)"; c.beginPath(); c.ellipse(X + 0.6, Y + 0.1, w * 0.55, 0.6, 0.1, 0, 7); c.fill();
  c.save(); c.translate(X, Y - bob); if (face < 0) c.scale(-1, 1); c.rotate(tilt);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  const jw = q.working && !q.carry && !kid ? JOB_WORK[q.p.job] : undefined;
  const fishing = q.p.job !== "fisher" || fishingNow(localHour(), isSunday(renderNow), seasonAt(renderNow).winter);
  const mow = q.working ? (workSheet(k) ?? (jw && fishing ? folkImage(q.p.sex === "f" ? jw.f : jw.m) : null)) : null;
  if (mow) {
    // painted work cycle; neighbouring frames cross-fade so the motion flows instead of flipping
    c.rotate(-tilt);
    const per = jw?.per ?? 2400, u = (((t + hash(q.p.id, 31, 9) * per) % per) / per) * WORK_FRAMES, f = Math.floor(u) % WORK_FRAMES, mix = u - Math.floor(u);
    const fw = mow.naturalWidth / WORK_FRAMES, fh = mow.naturalHeight, hh = hgt * (jw?.scale ?? (k === "farmer" ? 1.3 : 1.15)), ww = (hh * fw) / fh;
    const ease = mix * mix * (3 - 2 * mix);
    // trade props stand beside the worker in the same mirrored frame, so they always line up
    const prop = (pk: FolkSprite, dx: number, ph: number) => { const im2 = folkImage(pk); if (!im2) return; const pw = (ph * im2.naturalWidth) / im2.naturalHeight; c.drawImage(im2, dx - pw / 2, -ph + 0.2, pw, ph); };
    if (q.p.job === "fisher") prop("fishBasket", -2.2, 1.3);
    // one frame at a time: cross-fading poses that differ a lot showed double bodies and two scythes
    c.drawImage(mow, f * fw, 0, fw, fh, -ww / 2, -hh, ww, hh);
    if (q.p.job === "smith") {
      prop("anvil", 2.4, 2.2);
      // sparks fly on the strike frames (4–5) and fade on the rebound
      const sp = folkImage("sparks"), a = f === 4 ? 1 - mix * 0.4 : f === 3 ? ease : f === 5 ? 0.6 * (1 - mix) : 0;
      if (sp && a > 0.02) { const sh = 2.4, sw = (sh * sp.naturalWidth) / sp.naturalHeight; c.globalCompositeOperation = "lighter"; c.globalAlpha = a; c.drawImage(sp, 2.6 - sw / 2, -2.4 - sh * 0.75, sw, sh); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
    }
    insignia(c, q, hgt);
    c.restore();
    return [X, Y - hgt];
  }
  const sheet = q.walking ? walkSheet(k) : null;
  const legs = q.walking && !sheet && legsFor(q) ? folkImage("legsM") : null;
  const frameOf = (fw: number) => { void fw; return Math.floor((((ph / 6.2832) % 1) + 1) % 1 * WALK_FRAMES) % WALK_FRAMES; };
  if (sheet) {
    // real painted walk cycle: frame follows the stride phase (one 2π = two steps)
    const fw = sheet.naturalWidth / WALK_FRAMES, f = frameOf(fw);
    const ww = (hgt * fw) / sheet.naturalHeight;
    c.drawImage(sheet, f * fw, 0, fw, sheet.naturalHeight, -ww / 2, -hgt, ww, hgt);
  } else if (legs) {
    // modular figure: one hip-registered painted leg cycle shared by all trades, trade torso on top
    // each trade sprite: measured hip x (fraction of width) and tunic hem (fraction of height)
    const [hx, hem] = HIPS[k] ?? [0.46, 0.66];
    const fw = legs.naturalWidth / WALK_FRAMES, f = frameOf(fw);
    const lh = hgt * (1 - hem + 0.1), lw = (lh * fw) / legs.naturalHeight;
    c.drawImage(legs, f * fw, 0, fw, legs.naturalHeight, -lw * 0.5, -lh, lw, lh);
    const sw = im.naturalWidth, sh = im.naturalHeight;
    c.drawImage(im, 0, 0, sw, sh * hem, -w * hx, -hgt, w, hgt * hem);
  } else if (skirt) {
    // long skirt: two painted shoes step out under the hem, the hem sways in strips with the stride
    const foot = folkImage("footF"), sw = im.naturalWidth, sh = im.naturalHeight, top = 0.8;
    const sway = Math.sin(ph), fs = hgt * 0.11, fw2 = foot ? (fs * foot.naturalWidth) / foot.naturalHeight : 0;
    const drawFoot = (s: number) => {
      if (!foot) return;
      const fx = s * sway * w * 0.16, lift = Math.max(0, Math.cos(ph) * s) * hgt * 0.025;
      c.drawImage(foot, fx - fw2 * 0.45, bob - fs - lift + hgt * 0.02, fw2, fs);
    };
    drawFoot(-1); drawFoot(1);
    c.drawImage(im, 0, 0, sw, sh * top, -w / 2, -hgt, w, hgt * top);
    // the sprite's own painted feet (bottom ~7%) are cut off so only the stepping shoes show
    const N = 4, end = 0.93;
    for (let i = 0; i < N; i++) {
      const a = top + ((end - top) * i) / N, b = top + ((end - top) * (i + 1)) / N;
      const dx = sway * w * 0.035 * ((i + 1) / N);
      c.drawImage(im, 0, sh * a, sw, sh * (b - a) + 0.5, -w / 2 + dx, -hgt + hgt * a, w, hgt * (b - a) + 0.05);
    }
  } else {
    // standing still: slow breathing (chest rises, feet stay planted) and a rare weight shift
    const id = q.p.id, br = Math.sin(t / (1900 + hash(id, 41, 3) * 900) + id);
    const shift = Math.sin(t / (6500 + hash(id, 42, 3) * 3000) + id * 1.7);
    const sy = 1 + br * 0.012, sx = 1 - br * 0.004, lean = shift > 0.85 ? (shift - 0.85) * 0.12 : shift < -0.85 ? (shift + 0.85) * 0.12 : 0;
    c.transform(sx, 0, lean, sy, 0, 0);
    c.drawImage(im, -w / 2, -hgt, w, hgt);
  }
  insignia(c, q, hgt);
  c.restore();
  return [X, Y - hgt - bob];
}
function drawPerson(c: C, X: number, Y: number, q: Pose, t: number, simple: boolean) {
  if (q.p.job === "hunter" && q.working) return; // shown by the hunt scene at the lodge
  // workers sharing one site door stand apart instead of stacking (stable per person)
  if (q.working) { const a = hash(q.p.id, 911, 3) * 6.283; X += Math.cos(a) * 3.2; Y += Math.sin(a) * 1.6; }
  // walkers keep a stable lane beside the path centre, so people on the same route walk side by side, not stacked
  else if (q.walking) {
    const sx = q.dir[0] - q.dir[1], sy = (q.dir[0] + q.dir[1]) / 2, l = Math.hypot(sx, sy) || 1;
    const lane = (hash(q.p.id, 913, 7) - 0.5) * 5;
    X += (-sy / l) * lane; Y += (sx / l) * lane * 0.5;
  }
  const sp = drawFolk(c, X, Y, q, t);
  if (sp) { if (q.talk !== null && q.talkTurn) bubble(c, sp[0] + 1.8, sp[1] + 0.6, q.talk); return; }
  c.save(); c.translate(X, Y); c.scale(PERSON_SCALE, PERSON_SCALE); c.translate(-X, -Y);
  const head = personBody(c, X, Y, q, t, simple);
  c.restore();
  if (head && q.talk !== null && q.talkTurn) bubble(c, X + (head[0] - X) * PERSON_SCALE + 1.8, Y + (head[1] - Y) * PERSON_SCALE - 2.6, q.talk);
}
function personBody(c: C, X: number, Y: number, q: Pose, t: number, simple: boolean): Pt | null {
  const p = q.p, L = p.looks;
  const kid = p.age < 15, old = p.age >= 65;
  const s = kid ? 0.52 + p.age * 0.03 : 1;
  const sdx = (q.dir[0] - q.dir[1]), sdy = (q.dir[0] + q.dir[1]) * 0.5;
  const dl = Math.hypot(sdx, sdy) || 1;
  const fx = sdx / dl, fy = sdy / dl;
  const face = fx >= 0 ? 1 : -1, side = 0.35 + 0.65 * Math.abs(fx), away = fy < -0.35;
  const skin = SKIN[Math.floor(L.skin * SKIN.length)]!, shirt = CLOTH[Math.floor(L.shirt * CLOTH.length)]!;
  const pants = PANTS[Math.floor(L.pants * PANTS.length)]!;
  const hair = L.hair < 0 ? "#d8d4cc" : HAIR[Math.floor(L.hair * HAIR.length)]!;
  const ph = q.phase + p.id;
  const walk = q.walking ? 1 : 0;
  const bounce = walk * Math.abs(Math.cos(ph)) * 0.12 * s + (kid && q.act === "play" ? Math.max(0, Math.sin(ph * 0.5)) * 0.5 : 0);
  // shadow
  // grounded: soft ambient shadow cast to the lower right + dark contact patch under the feet
  c.fillStyle = "rgba(25,20,10,0.18)"; c.beginPath(); c.ellipse(X + 1.1 * s, Y + 0.25, 2.3 * s, 0.85 * s, 0.15, 0, 7); c.fill();
  c.fillStyle = "rgba(20,15,8,0.38)"; c.beginPath(); c.ellipse(X, Y, 1.05 * s, 0.42 * s, 0, 0, 7); c.fill();
  if (simple) {
    // Cheap but proportioned figure for mid zoom: two striding legs, tapered torso, arms, hair/hat.
    const sw = Math.sin(ph) * 0.9 * walk * s * Math.abs(fx), swy = Math.sin(ph) * 0.45 * walk * s * fy, hipY = Y - 3.5 * s - bounce, shY = hipY - 2.5 * s;
    const fem = p.sex === "f" && !kid;
    const lc = fem ? skin : pants;
    limb(c, [[X - 0.3 * s, hipY], [X - 0.3 * s - sw * face, Y - 0.2 - swy]], lc, 0.75 * s);
    limb(c, [[X + 0.3 * s, hipY], [X + 0.3 * s + sw * face, Y - 0.2 + swy]], lc, 0.75 * s);
    limb(c, [[X - 0.85 * s, shY + 0.3], [X - 0.95 * s + sw * 0.5 * face, hipY + 0.3]], shirt, 0.6 * s);
    c.beginPath(); c.moveTo(X - 0.85 * s, shY); c.lineTo(X + 0.85 * s, shY);
    if (fem) { c.lineTo(X + 1.3 * s, hipY + 2.2 * s); c.lineTo(X - 1.3 * s, hipY + 2.2 * s); }
    else { c.lineTo(X + 0.7 * s, hipY + 0.2); c.lineTo(X - 0.7 * s, hipY + 0.2); }
    c.closePath(); c.fillStyle = fem ? CLOTH[(Math.floor(L.shirt * CLOTH.length) + 3) % CLOTH.length]! : shirt; c.fill();
    c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = 0.45; c.stroke();
    if (fem) { c.beginPath(); c.moveTo(X - 0.85 * s, shY); c.lineTo(X + 0.85 * s, shY); c.lineTo(X + 0.75 * s, hipY); c.lineTo(X - 0.75 * s, hipY); c.closePath(); c.fillStyle = shirt; c.fill(); }
    limb(c, [[X + 0.85 * s, shY + 0.3], [X + 0.95 * s - sw * 0.5 * face, hipY + 0.3]], shirt, 0.6 * s);
    const hr = (kid ? 1.1 : 0.9) * s, hy = shY - hr - 0.2 * s;
    c.beginPath(); c.arc(X, hy, hr, 0, 7); c.fillStyle = skin; c.fill(); c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = 0.4; c.stroke();
    c.fillStyle = hair; c.beginPath(); c.arc(X, hy - 0.1 * hr, hr * 1.02, Math.PI * 1.02, Math.PI * 1.98); c.fill();
    if (L.hat && !kid) {
      c.fillStyle = p.job === "farmer" ? "#b89a5e" : "#3e3028";
      c.beginPath(); c.ellipse(X, hy - hr * 0.55, hr * 1.5, hr * 0.36, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(X, hy - hr * 0.9, hr * 0.8, hr * 0.5, 0, Math.PI, 0); c.fill();
    }
    return [X, hy];
  }
  const leg = (old ? 1.65 : 1.8) * s;
  const hip: Pt = [X, Y - leg * 2 - bounce];
  const stoop = old ? 0.45 * face : 0;
  const sh: Pt = [X + stoop, hip[1] - 2.5 * s];
  const legPts = (l: number): Pt[] => {
    const lp = ph + (l > 0 ? 0 : Math.PI);
    const a = Math.sin(lp) * 0.5 * walk;
    // knee bends only while the leg swings forward (cos>0); stance leg stays straight
    const bend = walk * Math.max(0, Math.cos(lp)) * 0.8;
    // swing along the real screen direction: sideways part for left/right, depth part for up/down
    const kx = Math.sin(a) * leg * fx, ky = Math.sin(a) * leg * fy * 0.5;
    const knee: Pt = [hip[0] + kx, hip[1] + Math.cos(a) * leg + ky];
    const fa = a - bend;
    const foot: Pt = [knee[0] + Math.sin(fa) * leg * fx, knee[1] + Math.cos(fa) * leg + Math.sin(fa) * leg * fy * 0.5 - walk * Math.max(0, Math.cos(lp)) * 0.35 * s];
    return [[hip[0] + l * 0.28 * s * (1 - side * 0.6), hip[1]], knee, foot];
  };
  const dress = p.sex === "f" && !kid ? true : p.sex === "f" && L.pants > 0.4;
  const legCol = dress ? skin : pants;
  // back leg & arm
  limb(c, legPts(-1), legCol, 0.75 * s);
  const armPts = (l: number): Pt[] => {
    const o: Pt = [sh[0] + l * 0.25 * s * (1 - side * 0.6), sh[1] + 0.3 * s];
    if (q.working && (p.job === "farmer" || p.job === "homemaker")) {
      const sw = Math.sin(t / 420 + p.id) * 0.6;
      return [o, [o[0] + face * 1.0 * s, o[1] + 0.9 * s + sw * 0.4], [o[0] + face * 1.9 * s, o[1] + 0.6 * s + sw]];
    }
    if (q.talk !== null && q.talkTurn && l > 0) {
      const g = Math.sin(t / 260 + p.id) * 0.3;
      return [o, [o[0] + face * 0.9 * s, o[1] + 0.9 * s], [o[0] + face * 1.7 * s, o[1] + 0.2 * s + g]];
    }
    const a = Math.sin(ph + (l > 0 ? Math.PI : 0)) * 0.5 * walk;
    const el: Pt = [o[0] + Math.sin(a) * 1.3 * s * side * face, o[1] + Math.cos(a) * 1.3 * s];
    return [o, el, [el[0] + Math.sin(a + 0.3 * walk) * 1.2 * s * side * face, el[1] + Math.cos(a + 0.3) * 1.2 * s]];
  };
  limb(c, armPts(-1), shirt, 0.62 * s);
  // torso
  c.beginPath();
  c.moveTo(sh[0] - 0.85 * s, sh[1]); c.lineTo(sh[0] + 0.85 * s, sh[1]);
  c.lineTo(hip[0] + 0.75 * s, hip[1] + 0.2); c.lineTo(hip[0] - 0.75 * s, hip[1] + 0.2); c.closePath();
  c.fillStyle = shirt; c.fill();
  { const g = c.createLinearGradient(sh[0] - 0.85 * s, 0, sh[0] + 0.85 * s, 0); g.addColorStop(0, "rgba(255,240,210,0.18)"); g.addColorStop(1, "rgba(20,12,5,0.28)"); c.fillStyle = g; c.fill(); }
  c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = 0.45; c.stroke();
  if (p.job === "mayor") {
    // chain of office with a medallion
    c.strokeStyle = "#d8b24a"; c.lineWidth = 0.32 * s; c.beginPath();
    c.moveTo(sh[0] - 0.7 * s, sh[1] + 0.1); c.quadraticCurveTo(sh[0], sh[1] + 1.6 * s, sh[0] + 0.7 * s, sh[1] + 0.1); c.stroke();
    c.fillStyle = "#f0cf68"; c.beginPath(); c.arc(sh[0], sh[1] + 0.95 * s, 0.32 * s, 0, 7); c.fill();
  }
  if (dress) {
    const sk = CLOTH[(Math.floor(L.shirt * CLOTH.length) + 3) % CLOTH.length]!;
    const fl = walk * Math.sin(ph) * 0.25;
    c.beginPath(); c.moveTo(hip[0] - 0.8 * s, hip[1] - 0.3); c.lineTo(hip[0] + 0.8 * s, hip[1] - 0.3);
    c.lineTo(hip[0] + 1.35 * s + fl, hip[1] + leg * 1.25); c.quadraticCurveTo(hip[0], hip[1] + leg * 1.4, hip[0] - 1.35 * s + fl, hip[1] + leg * 1.25); c.closePath();
    c.fillStyle = sk; c.fill(); c.stroke();
  }
  limb(c, legPts(1), legCol, 0.75 * s);
  if (dress) { /* front leg peeks out under the skirt */ }
  // head
  const hr = (kid ? 1.15 : 0.95) * s;
  const hc: Pt = [sh[0] + face * 0.1 * s + stoop * 0.6, sh[1] - hr - 0.25 * s];
  limb(c, [[sh[0], sh[1]], [hc[0], hc[1] + hr * 0.6]], skin, 0.5 * s);
  c.beginPath(); c.arc(hc[0], hc[1], hr, 0, 7); c.fillStyle = skin; c.fill(); c.strokeStyle = "rgba(22,16,10,0.85)"; c.lineWidth = 0.4; c.stroke();
  { const g = c.createRadialGradient(hc[0] - hr * 0.4, hc[1] - hr * 0.4, 0, hc[0], hc[1], hr * 1.1); g.addColorStop(0, "rgba(255,235,205,0.25)"); g.addColorStop(1, "rgba(40,20,10,0.3)"); c.fillStyle = g; c.fill(); }
  // hair
  c.fillStyle = hair; c.beginPath();
  if (away) c.arc(hc[0], hc[1], hr * 1.02, 0, 7);
  else c.arc(hc[0] - face * 0.15 * hr, hc[1] - 0.1 * hr, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95 + face * 0.2);
  c.fill();
  if (p.sex === "f" && L.hair >= 0) { c.beginPath(); c.ellipse(hc[0] - face * hr * 0.75, hc[1] + hr * 0.6, hr * 0.35, hr * 0.9, 0, 0, 7); c.fill(); }
  if (!away) { c.fillStyle = "rgba(30,20,12,0.55)"; c.beginPath(); c.arc(hc[0] + face * hr * 0.45, hc[1] - hr * 0.05, 0.12 * s, 0, 7); c.fill(); }
  if (L.hat && !kid) {
    c.fillStyle = p.job === "farmer" ? "#d9bf7a" : "#4a3a30";
    c.beginPath(); c.ellipse(hc[0], hc[1] - hr * 0.55, hr * 1.55, hr * 0.38, 0, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(hc[0], hc[1] - hr * 0.9, hr * 0.85, hr * 0.55, 0, Math.PI, 0); c.fill(); c.stroke();
  }
  // front arm with tool / stick
  const ap = armPts(1);
  limb(c, ap, shirt, 0.62 * s);
  const hand = ap[2]!;
  c.fillStyle = skin; c.beginPath(); c.arc(hand[0], hand[1], 0.32 * s, 0, 7); c.fill();
  if (q.working && (p.job === "builder" || p.job === "woodcutter" || p.job === "mason")) {
    // hammer / axe / pick swinging down in a steady rhythm
    const sw = Math.max(0, Math.sin(t / 230 + p.id)) * 1.3;
    const tip: Pt = [hand[0] + face * (1.4 - sw * 0.4) * s, hand[1] - (1.6 - sw * 1.8) * s];
    line(c, hand, tip, p.id, 0.38, "#6f533b");
    c.fillStyle = p.job === "builder" ? "#4a4440" : "#8a8f94";
    c.beginPath(); c.ellipse(tip[0], tip[1], (p.job === "builder" ? 0.45 : 0.75) * s, 0.35 * s, face * 0.6, 0, 7); c.fill();
    c.strokeStyle = "rgba(22,16,10,0.8)"; c.lineWidth = 0.25; c.stroke();
    if (sw < 0.15 && p.job !== "builder") { c.fillStyle = p.job === "mason" ? "rgba(220,215,205,0.8)" : "rgba(200,160,100,0.8)"; for (let i = 0; i < 3; i++) c.fillRect(tip[0] + (hash(p.id, i, Math.floor(t / 230)) - 0.5) * 3, tip[1] - hash(i, p.id, 7) * 2, 0.4, 0.4); }
  }
  if (q.carry) {
    // the carried good, recognisable at a glance
    const shp: Pt = [sh[0], sh[1] - 0.2 * s];
    const ink = "rgba(22,16,10,0.8)";
    c.lineWidth = 0.25;
    if (q.carry === "log") {
      c.strokeStyle = "#5e4229"; c.lineWidth = 1.15 * s; c.lineCap = "round";
      c.beginPath(); c.moveTo(shp[0] - 2.6 * s * face, shp[1] + 0.4 * s); c.lineTo(shp[0] + 2.4 * s * face, shp[1] - 0.6 * s); c.stroke();
      c.fillStyle = "#c9a26b"; c.beginPath(); c.ellipse(shp[0] + 2.4 * s * face, shp[1] - 0.6 * s, 0.45 * s, 0.55 * s, 0, 0, 7); c.fill();
      c.lineCap = "butt";
    } else if (q.carry === "stone") {
      c.fillStyle = "#a9a49c"; c.fillRect(hand[0] - 0.9 * s, hand[1] - 1.1 * s, 1.8 * s, 1.2 * s);
      c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(hand[0] - 0.9 * s, hand[1] - 1.1 * s, 1.8 * s, 0.35 * s);
      c.strokeStyle = ink; c.strokeRect(hand[0] - 0.9 * s, hand[1] - 1.1 * s, 1.8 * s, 1.2 * s);
    } else if (q.carry === "planks") {
      for (let i = 0; i < 3; i++) {
        const o = -i * 0.35 * s;
        c.strokeStyle = i % 2 ? "#c49a62" : "#b08a5a"; c.lineWidth = 0.4 * s;
        c.beginPath(); c.moveTo(shp[0] - 3 * s * face, shp[1] + 0.5 * s + o); c.lineTo(shp[0] + 2.8 * s * face, shp[1] - 0.5 * s + o); c.stroke();
      }
    } else if (q.carry === "grain" || q.carry === "bundle") {
      const g: Pt = [shp[0] - face * 0.6 * s, shp[1] - 0.6 * s];
      c.fillStyle = q.carry === "bundle" ? "#8a6f52" : "#d4b25c"; c.beginPath(); c.ellipse(g[0], g[1], 0.8 * s, 1.7 * s, face * 0.5, 0, 7); c.fill(); c.strokeStyle = ink; c.stroke();
      c.strokeStyle = "#8a6a2a"; c.lineWidth = 0.3 * s; c.beginPath(); c.moveTo(g[0] - 0.7 * s, g[1] + 0.2 * s); c.lineTo(g[0] + 0.7 * s, g[1]); c.stroke();
    } else if (q.carry === "flour") {
      const g: Pt = [shp[0] - face * 0.3 * s, shp[1] - 0.5 * s];
      c.fillStyle = "#e6dcc4"; c.beginPath(); c.ellipse(g[0], g[1], 1.3 * s, 0.9 * s, face * 0.25, 0, 7); c.fill();
      c.fillStyle = "rgba(90,70,40,0.25)"; c.beginPath(); c.ellipse(g[0], g[1] + 0.3 * s, 1.1 * s, 0.45 * s, 0, 0, Math.PI); c.fill();
      c.strokeStyle = ink; c.beginPath(); c.ellipse(g[0], g[1], 1.3 * s, 0.9 * s, face * 0.25, 0, 7); c.stroke();
    } else if (q.carry === "bread") {
      const g: Pt = [hand[0] + face * 0.4 * s, hand[1] - 0.2 * s];
      c.fillStyle = "#c79a5a"; c.beginPath(); c.moveTo(g[0] - 1.1 * s, g[1] - 0.4 * s); c.lineTo(g[0] + 1.1 * s, g[1] - 0.4 * s); c.lineTo(g[0] + 0.8 * s, g[1] + 0.5 * s); c.lineTo(g[0] - 0.8 * s, g[1] + 0.5 * s); c.closePath(); c.fill(); c.strokeStyle = ink; c.stroke();
      c.fillStyle = "#9a5a26"; for (const dx of [-0.45, 0.4]) { c.beginPath(); c.ellipse(g[0] + dx * s, g[1] - 0.55 * s, 0.45 * s, 0.28 * s, 0, 0, 7); c.fill(); }
    }
  }
  if (q.working && p.job === "farmer") line(c, [hand[0] - face * 1.2, hand[1] - 1.2], [hand[0] + face * 1.4, hand[1] + 2.6 + Math.sin(t / 420 + p.id) * 0.5], p.id, 0.4, "#7a5a3c");
  if (L.stick) line(c, hand, [hand[0] + face * 0.5, Y], p.id + 1, 0.35, "#6f533b");
  return hc;
}

let overview: HTMLCanvasElement | null = null;
let renderNow = 0;
let renderSeeds: Seed[] = [];
let overviewSeason = "";
/** Cached map picture at 1/16 iso scale, coloured from the real ground textures (terrain is static). */
function overviewMap() {
  const sk = seasonKey(renderNow);
  if (overview && overviewSeason === sk) return overview;
  const ready = allTexturesReady();
  // never rebuild every frame while textures load: keep the last picture (or a cheap one) until ready
  if (!ready && overview) return overview;
  overviewSeason = sk;
  const S = 16, W = (MAP * TW) / S, H = (MAP * TH) / S;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!; const img = g.createImageData(W, H);
  const rgb = new Map<string, [number, number, number]>();
  const tmp = document.createElement("canvas").getContext("2d")!;
  for (const [k, [h, s, l]] of Object.entries(TERRAIN)) { tmp.fillStyle = hsl(h, s, l); tmp.fillRect(0, 0, 1, 1); const d = tmp.getImageData(0, 0, 1, 1).data; rgb.set(k, [d[0]!, d[1]!, d[2]!]); }
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const ix = px * S - (MAP * TW) / 2, iy = py * S;
    // jitter the lookup so terrain borders read as soft, organic lines instead of stair steps
    const jx = (hash(px, py, 7) - 0.5) * TW * 0.9, jy = (hash(px, py, 8) - 0.5) * TH * 0.9;
    const fx = (ix + jx) / TW + (iy + jy) / TH, fy = (iy + jy) / TH - (ix + jx) / TW;
    const tx = Math.floor(fx), ty = Math.floor(fy);
    const o = (py * W + px) * 4;
    if (tx < 0 || ty < 0 || tx >= MAP || ty >= MAP) continue;
    const tr = terrain(tx, ty);
    let r: number, gg: number, b: number;
    const sm = ready ? texSample(TEX_OF[tr]!) : null;
    if (sm) { const q = ((py % sm.n) * sm.n + (px % sm.n)) * 4; r = sm.d[q]!; gg = sm.d[q + 1]!; b = sm.d[q + 2]!; }
    else { const c0 = rgb.get(tr)!; r = c0[0]; gg = c0[1]; b = c0[2]; }
    if (tr === "deep") { r *= 0.6; gg *= 0.7; b *= 0.8; }
    if (tr === "forest") { r = r * 0.8 + 18; gg = gg * 0.85 + 34; b = b * 0.8 + 12; }
    if (tr === "mountain") { const m = 0.9 + hash(tx, ty, 3) * 0.2; r *= m; gg *= m; b *= m; }
    img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // soften once more so coasts and rivers look painted, not pixelated
  const out = document.createElement("canvas"); out.width = W; out.height = H;
  const og = out.getContext("2d")!; og.filter = "blur(0.8px)"; og.drawImage(cv, 0, 0);
  overview = out;
  if (!ready) overviewSeason = "";
  return out;
}

/** Builds the overview picture in idle time so zooming out never stalls. */
export function prewarmOverview() {
  if (typeof window === "undefined") return;
  const go = () => { renderNow = renderNow || clock(); if (!allTexturesReady()) return void setTimeout(go, 400); overviewMap(); };
  const ric = (window as Window & { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
  ric ? ric(go) : setTimeout(go, 800);
}

/** Screen-space dusk + night grade shared by every zoom level; returns the night strength 0..1. */
function skyTint(c: C, w: number, h: number): number {
  const hr = worldHour(clock());
  // darkness: 0 by day, ramps through dusk (18–21:30) and dawn (5–7:30), full at night
  const sm = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const night = hr >= 12 ? sm(18, 21.5, hr) : 1 - sm(5, 7.5, hr);
  const dusk = Math.max(0, 1 - Math.abs(hr - 19) / 1.8) + Math.max(0, 1 - Math.abs(hr - 6.5) / 1.3);
  if (dusk > 0) { c.fillStyle = `rgba(240,140,80,${dusk * 0.14})`; c.fillRect(0, 0, w, h); }
  if (night > 0.02) {
    // deep indigo multiply keeps the painting legible but truly dark
    c.globalCompositeOperation = "multiply";
    c.fillStyle = `rgba(${Math.round(255 - night * 205)},${Math.round(255 - night * 195)},${Math.round(255 - night * 140)},1)`;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    c.fillStyle = `rgba(14,18,44,${night * 0.25})`; c.fillRect(0, 0, w, h);
    // cool moonlight sheen from the upper right
    const mg = c.createRadialGradient(w * 0.85, -h * 0.1, 0, w * 0.85, -h * 0.1, Math.max(w, h));
    mg.addColorStop(0, `rgba(150,170,230,${0.12 * night})`); mg.addColorStop(1, "rgba(150,170,230,0)");
    c.fillStyle = mg; c.fillRect(0, 0, w, h);
  }
  return night;
}

function drawOverview(c: C, w: number, h: number, dpr: number, cam: Camera, seeds: Seed[], now: number) {
  const z = cam.zoom * dpr;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#1f4f63"; c.fillRect(0, 0, w, h);
  c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  if (cam.zoom >= CHUNKS_BELOW_OVERVIEW) {
    // painted ground chunks keep the real textures sharp; the coarse bitmap is only for the far view
    const inv = (sx: number, sy: number) => toTile((sx - w / 2) / z + cam.x, (sy - h / 2) / z + cam.y);
    const cs = [inv(0, 0), inv(w, 0), inv(0, h), inv(w, h)];
    const x0 = Math.max(0, Math.min(...cs.map((p) => p[0])) - 2), x1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[0])) + 2);
    const y0 = Math.max(0, Math.min(...cs.map((p) => p[1])) - 2), y1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[1])) + 5);
    c.drawImage(overviewMap(), -(MAP * TW) / 2, 0, MAP * TW, MAP * TH); // under not-yet-baked chunks
    drawGroundChunks(c, x0, x1, y0, y1, z, cam.x - w / 2 / z, cam.x + w / 2 / z, cam.y - h / 2 / z, cam.y + h / 2 / z, true);
  } else c.drawImage(overviewMap(), -(MAP * TW) / 2, 0, MAP * TW, MAP * TH);
  const px = 1 / z;
  c.lineJoin = "round"; c.lineCap = "round";
  for (const l of links(seeds)) {
    const p = roadProgress(l, now); if (p <= 0) continue;
    const pts = smoothRoad(l);
    c.beginPath();
    pts.forEach(([x, y], i) => { const [a, b] = iso(x, y); i ? c.lineTo(a, b) : c.moveTo(a, b); });
    c.globalAlpha = 0.35 + 0.55 * p;
    c.strokeStyle = "rgba(60,40,20,0.5)"; c.lineWidth = Math.max(3.5 * dpr * px, 5); c.stroke();
    c.strokeStyle = texture(c, "dirt") ?? "#b89468"; c.lineWidth = Math.max(2.2 * dpr * px, 3.5); c.stroke();
    c.globalAlpha = 1;
  }
  const vx0 = cam.x - w / 2 / z, vx1 = cam.x + w / 2 / z, vy0 = cam.y - h / 2 / z, vy1 = cam.y + h / 2 / z;
  for (const s of seeds) {
    const [ix, iy] = iso(s.x, s.y);
    const R = radiusOf(effAge(s, seeds, now));
    const rr = Math.max(R * TW * 0.5, 3 * dpr * px);
    if (ix + rr < vx0 || ix - rr > vx1 || iy + rr < vy0 || iy - rr > vy1) continue;
    // settled ground under the town
    c.beginPath(); c.ellipse(ix, iy, rr * 1.05, rr * 0.55, 0, 0, 7);
    c.fillStyle = "rgba(70,55,35,0.25)"; c.fill();
    // the real buildings, at true scale, back to front
    const Ri = Math.ceil(R) + 1, step = cam.zoom < 0.12 && Ri > 14 ? 2 : 1;
    for (let d = -2 * Ri; d <= 2 * Ri; d++) for (let x = s.x - Ri; x <= s.x + Ri; x += step) {
      const y = s.x + s.y + d - x; if (y < s.y - Ri || y > s.y + Ri) continue;
      const st = structureAt(x, y, seeds, now); if (!st) continue;
      const [cx, cy] = iso(x, y);
      if (st.kind === "field") { c.fillStyle = texture(c, acreOf(x, y, st.seed).ripe ? "wheat" : "crops") ?? "#c9b46a"; diamond(c, cx, cy, step); c.fill(); }
      else if (PATHLIKE.has(st.kind) || st.kind === "square") { c.fillStyle = texture(c, st.kind === "street" || st.kind === "square" ? "cobble" : "dirt") ?? "#bfa47a"; diamond(c, cx, cy, step * 0.8); c.fill(); }
      else if (st.build !== undefined) drawSite(c, st, cx, cy, 0, false);
      else if (!FLAT.has(st.kind)) drawBuildingSprite(c, st.kind, cx, cy, st.v);
    }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  // same dusk/night grade as the close view, so zooming out never jumps to daylight
  const night = skyTint(c, w, h);
  if (night > 0.02) {
    c.globalCompositeOperation = "lighter";
    for (const s of seeds) {
      const [ix, iy] = iso(s.x, s.y);
      const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2;
      const r = Math.max(6 * dpr, radiusOf(effAge(s, seeds, now)) * TW * 0.5 * z);
      if (sx < -r || sy < -r || sx > w + r || sy > h + r) continue;
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(255,170,80,${0.22 * night})`); g.addColorStop(1, "rgba(255,140,60,0)");
      c.fillStyle = g; c.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = "source-over";
  }
  c.font = `700 ${Math.round(18 * dpr)}px Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif CJK SC', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`; c.textAlign = "center";
  const placed: [number, number][] = [];
  const order = [...seeds].sort((a, b) => effAge(b, seeds, now) - effAge(a, seeds, now));
  for (const s of order) {
    const [ix, iy] = iso(s.x, s.y);
    const R = radiusOf(effAge(s, seeds, now)) * TH * 0.5 * z;
    const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2 - R - 12 * dpr;
    const tw = c.measureText(s.name).width;
    if (placed.some(([px2, py2]) => Math.abs(px2 - sx) < tw && Math.abs(py2 - sy) < 22 * dpr)) continue; // biggest town keeps its name
    placed.push([sx, sy]);
    c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(s.name, sx, sy);
    c.fillStyle = INK; c.fillText(s.name, sx, sy);
  }
}
function diamond(c: C, cx: number, cy: number, k: number) {
  c.beginPath(); c.moveTo(cx, cy - TH / 2 * k); c.lineTo(cx + TW / 2 * k, cy); c.lineTo(cx, cy + TH / 2 * k); c.lineTo(cx - TW / 2 * k, cy); c.closePath();
}

/** Painted rowing-boat sprite (~4 m long, villagers are ~5 px tall), bobbing with a soft water shadow. */
function drawBoat(c: C, x: number, y: number, flip: boolean, t: number, sd: number) {
  const im = boatImage(); if (!im) return;
  const w = 11, h = (w * im.naturalHeight) / im.naturalWidth;
  const bob = Math.sin(t / 900 + sd) * 0.25, roll = Math.sin(t / 1300 + sd) * 0.02;
  c.save(); c.translate(x, y);
  c.fillStyle = "rgba(8,22,22,0.35)"; c.beginPath(); c.ellipse(0.6, 1.2, w * 0.46, h * 0.28, flip ? 0.45 : -0.45, 0, 7); c.fill();
  c.strokeStyle = `rgba(205,220,210,${0.16 + 0.06 * Math.sin(t / 700 + sd)})`; c.lineWidth = 0.3;
  c.beginPath(); c.ellipse(0, 0.6, w * 0.55, h * 0.36, flip ? 0.45 : -0.45, 0, 7); c.stroke();
  c.rotate(roll); if (flip) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(im, -w / 2, -h / 2 + bob - 0.6, w, h);
  c.restore();
}

/** Traveller on the open road: a real villager figure with stick and hat, striding along the road. */
const CARRY_OF: Record<TradeGood, Pose["carry"]> = { grain: "grain", wool: "bundle", wood: "log", timber: "planks", ore: "stone", stone: "stone", fish: "bundle", salt: "flour", hides: "bundle", cloth: "bundle", ironware: "bundle", beer: "bread" };
const travellers = new Map<number, Pose["p"]>();
function drawWanderer(c: C, x: number, y: number, dx: number, dy: number, t: number, sd: number, carry: Pose["carry"] = null, festive?: Pose["festive"]) {
  let p = travellers.get(sd);
  if (!p) {
    p = {
      id: sd, seed: null as never, first: "", last: "", sex: hash(sd, 1, 11) < 0.35 ? "f" : "m", age: 25 + Math.floor(hash(sd, 2, 11) * 35), job: "carter",
      home: [0, 0], work: null, workIndoor: false, speed: 0.3,
      looks: { skin: hash(sd, 3, 11), hair: hash(sd, 4, 11), shirt: hash(sd, 5, 11), pants: hash(sd, 6, 11), hat: true, stick: true }, haul: null,
    };
    travellers.set(sd, p);
  }
  // screen direction → tile direction (inverse of the iso projection used by the figure)
  const d0 = (dx + 2 * dy) / 2, d1 = (2 * dy - dx) / 2;
  const q: Pose = {
    p, x: 0, y: 0, visible: true, walking: true, dir: [d0, d1], phase: (t / 1000) * Math.PI * 2 * 0.95,
    act: "work", working: false, talk: null, talkTurn: false, carry, dest: null, festive,
  };
  drawPerson(c, x, y, q, t, false);
}

/** Road crew at the growing end of a trade road: stakes ahead, a log pile, gravel, two diggers. */
function drawRoadWorks(c: C, x: number, y: number, dx: number, dy: number, t: number, sd: number) {
  const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const nx = -dy, ny = dx;
  // survey stakes marking where the road will go next
  for (let s = 1; s <= 3; s++) {
    const px = x + dx * s * 9, py = y + dy * s * 9;
    for (const side of [-1, 1]) {
      const sx = px + nx * 3.4 * side, sy = py + ny * 1.7 * side;
      c.strokeStyle = "#5a4330"; c.lineWidth = 0.35; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy - 2.2); c.stroke();
      c.fillStyle = "#c9b48a"; c.fillRect(sx - 0.25, sy - 2.3, 0.5, 0.45);
    }
  }
  // freshly dug earth and gravel heap
  c.fillStyle = "rgba(92,70,48,0.85)"; c.beginPath(); c.ellipse(x + dx * 3, y + dy * 3, 4.2, 1.8, 0, 0, 7); c.fill();
  // material piles lie on the open south verge, never in the north shadow of tall houses
  const sv = ny >= 0 ? 1 : -1;
  prop(c, "blocks", x + nx * 5 * sv - dx * 3, y + ny * 2.5 * sv + 1.2, 6);
  prop(c, "logs", x + nx * 5.5 * sv + dx * 4, y + ny * 2.8 * sv + 1.4, 7);
  // two workers: painted mason and builder work cycles (one frame at a time, no rocking)
  for (let w = 0; w < 2; w++) {
    const wx = x + dx * (2 + w * 3) + nx * (w ? -1.5 : 1.5), wy = y + dy * (2 + w * 3) + ny * (w ? -0.8 : 0.8);
    const jw = JOB_WORK[w ? "builder" : "mason"]!, sheet = folkImage(jw.m), im = folkImage(w ? "builder" : "mason");
    if (!sheet && !im) continue;
    const h = 5.2;
    c.fillStyle = "rgba(20,15,10,0.25)"; c.beginPath(); c.ellipse(wx + 0.5, wy, 1.6, 0.55, 0, 0, 7); c.fill();
    c.save(); c.translate(wx, wy); if ((dx >= 0 ? 1 : -1) * (w ? -1 : 1) < 0) c.scale(-1, 1);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
    if (sheet) {
      const per = jw.per, u = (((t + hash(sd, w, 17) * per) % per) / per) * WORK_FRAMES, f = Math.floor(u) % WORK_FRAMES;
      const fw = sheet.naturalWidth / WORK_FRAMES, hh = h * jw.scale, ww = (hh * fw) / sheet.naturalHeight;
      c.drawImage(sheet, f * fw, 0, fw, sheet.naturalHeight, -ww / 2, -hh, ww, hh);
    } else if (im) { const iw = (h * im.naturalWidth) / im.naturalHeight; c.drawImage(im, -iw / 2, -h, iw, h); }
    c.restore();
  }
}
/** Painted prop (timber stack, stone blocks) of the given width, standing on (x, y), with a soft shadow. */
function prop(c: C, k: FolkSprite, x: number, y: number, w: number) {
  const im = folkImage(k); if (!im || w <= 0.2) return;
  const h = (w * im.naturalHeight) / im.naturalWidth;
  c.fillStyle = "rgba(20,15,10,0.28)"; c.beginPath(); c.ellipse(x + 0.4, y, w * 0.5, w * 0.16, 0, 0, 7); c.fill();
  c.drawImage(im, x - w / 2, y - h * 0.85, w, h);
}

/**
 * Straight timber bridge from bank A to bank B (≈3 m wide deck, 1 m railing): it rests on stone
 * abutments, rises slightly, and is carried by trestles on the riverbed. A rowing boat lies moored
 * at one bank beside the bridge, never crossing its piles.
 */
function drawBridgeSpan(c: C, A: Pt, B: Pt, sd: number, t: number) {
  const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  // unit perpendicular on the iso ground plane
  let nx = -uy * 2, ny = ux * 0.5; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
  const HW = 3.2; // deck half width in px
  const rise = Math.min(1.8, 0.4 + len * 0.012);
  const H = (f: number) => 1 + rise * Math.sin(Math.PI * f);
  const ground = (f: number, s: number): Pt => [A[0] + dx * f + nx * HW * s, A[1] + dy * f + ny * HW * s];
  const at = (f: number, s: number): Pt => { const g = ground(f, s); return [g[0], g[1] - H(f)]; };
  const path = (pts: Pt[]) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  const S = 20, fs = Array.from({ length: S + 1 }, (_, i) => i / S), rev = fs.slice().reverse();
  // moored boat behind the bridge (upper screen side) so it is drawn before the deck
  const back = ny > 0 ? -1 : 1;
  {
    const f = 0.22 + hash(sd, 3, 9) * 0.1, off = HW + 7;
    const bx = A[0] + dx * f + nx * off * back, by = A[1] + dy * f + ny * off * back;
    const [tx, ty] = toTile(bx, by);
    if (isWater(terrain(tx, ty))) drawBoat(c, bx, by, nx * back > 0, t, sd);
  }
  c.save(); c.lineCap = "butt"; c.lineJoin = "round";
  // shadow on the water
  path([...fs.map((f) => { const g = ground(f, 1.3); return [g[0] + 1.5, g[1] + 2] as Pt; }), ...rev.map((f) => { const g = ground(f, -1.3); return [g[0] + 1.5, g[1] + 2] as Pt; })]);
  c.fillStyle = "rgba(8,22,22,0.32)"; c.fill();
  // dressed-stone abutments on both banks
  for (const f of [0, 1]) {
    const q = [ground(f - 0.06 * (f ? -1 : 1), -1.25), ground(f + 0.04 * (f ? -1 : 1), -1.25), ground(f + 0.04 * (f ? -1 : 1), 1.25), ground(f - 0.06 * (f ? -1 : 1), 1.25)];
    path(q); c.fillStyle = texture(c, "rock") ?? "#837b6d"; c.fill();
    c.fillStyle = "rgba(30,26,20,0.35)"; c.fill();
    path(q.map(([a, b]) => [a, b - 1] as Pt)); c.fillStyle = texture(c, "rock") ?? "#9a9284"; c.fill();
  }
  // trestles: pile pairs with cross braces
  const piles = Math.max(1, Math.round(len / 16));
  for (let k = 1; k <= piles; k++) {
    const f = k / (piles + 1);
    const a = ground(f, -0.85), b = ground(f, 0.85), at0 = at(f, -0.85), at1 = at(f, 0.85);
    for (const [g, top] of [[a, at0], [b, at1]] as [Pt, Pt][]) {
      const gr = c.createLinearGradient(g[0] - 0.6, 0, g[0] + 0.6, 0); gr.addColorStop(0, "#4a3624"); gr.addColorStop(1, "#24190f");
      c.fillStyle = gr; c.fillRect(g[0] - 0.55, top[1], 1.1, g[1] - top[1] + 1.6);
      c.fillStyle = "rgba(20,40,38,0.5)"; c.fillRect(g[0] - 0.55, g[1] + 0.6, 1.1, 1); // wet waterline
      c.strokeStyle = `rgba(200,215,205,${0.14 + 0.06 * Math.sin(t / 800 + k)})`; c.lineWidth = 0.25;
      c.beginPath(); c.ellipse(g[0], g[1] + 1.6, 1.3, 0.35, 0, 0, 7); c.stroke();
    }
    c.strokeStyle = "#2e2116"; c.lineWidth = 0.35;
    c.beginPath(); c.moveTo(at0[0], at0[1] + 0.6); c.lineTo(b[0], b[1] + 0.6); c.moveTo(at1[0], at1[1] + 0.6); c.lineTo(a[0], a[1] + 0.6); c.stroke();
  }
  // stringer beam visible on the near side
  const near = -back;
  path([...fs.map((f) => at(f, near)), ...rev.map((f) => { const p = at(f, near); return [p[0], p[1] + 1] as Pt; })]);
  const sg = c.createLinearGradient(0, -1, 0, 1); sg.addColorStop(0, "#4e3925"); sg.addColorStop(1, "#2a1d12");
  c.fillStyle = sg; c.fill();
  // deck: real plank texture, planks laid across the direction of travel
  path([...fs.map((f) => at(f, -1)), ...rev.map((f) => at(f, 1))]);
  const pat = planksPattern(c);
  if (pat) {
    const ang = Math.atan2(ny, nx), s = 1.1 / 64;
    DECK_M.setMatrixValue("none"); pat.setTransform(DECK_M.translateSelf(A[0], A[1]).rotateSelf((ang * 180) / Math.PI).scaleSelf(s, s));
    c.fillStyle = pat; c.fill();
  } else { c.fillStyle = "#6e5a44"; c.fill(); }
  // light from above-left: fade the deck slightly towards the far rail
  c.fillStyle = "rgba(255,235,200,0.06)"; c.fill();
  c.strokeStyle = "rgba(25,18,10,0.55)"; c.lineWidth = 0.25; c.stroke();
  // railings: square posts + top rail + middle rail
  for (const sgn of [back, near]) {
    const posts = Math.max(3, Math.round(len / 8));
    for (let k = 0; k <= posts; k++) {
      const p = at(k / posts, sgn);
      c.fillStyle = "#2f2216"; c.fillRect(p[0] - 0.3, p[1] - 2.9, 0.6, 2.9);
      c.fillStyle = "rgba(190,160,120,0.35)"; c.fillRect(p[0] - 0.3, p[1] - 2.9, 0.22, 2.9);
    }
    for (const [hgt, w, col] of [[2.8, 0.5, "#6a4e34"], [1.5, 0.3, "#4d3824"]] as const) {
      c.strokeStyle = col; c.lineWidth = w; c.beginPath();
      fs.forEach((f, i) => { const p = at(f, sgn); i ? c.lineTo(p[0], p[1] - hgt) : c.moveTo(p[0], p[1] - hgt); }); c.stroke();
    }
  }
  c.restore();
}


type GroundEdge = { x: number; y: number; cx: number; cy: number; tr: string; r: number; coast: boolean };
/** Surf along the water line: wet sand, a resting foam lace and waves that roll in, break and fade. */
function drawSurf(c: C, shore: { a: Pt; b: Pt; w: Pt }[], t: number, live: boolean) {
  c.save(); c.lineCap = "round";
  const segs = shore.map((s) => {
    const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], l = Math.hypot(dx, dy) || 1;
    let nx = -dy / l, ny = dx / l;
    const mx = (s.a[0] + s.b[0]) / 2, my = (s.a[1] + s.b[1]) / 2;
    if (nx * (s.w[0] - mx) + ny * (s.w[1] - my) < 0) { nx = -nx; ny = -ny; }
    return { ...s, nx, ny: ny * 0.6, mx, my };
  });
  const line = (d: number, w: number, col: string, list = segs) => {
    c.beginPath(); for (const s of list) { c.moveTo(s.a[0] + s.nx * d, s.a[1] + s.ny * d); c.lineTo(s.b[0] + s.nx * d, s.b[1] + s.ny * d); }
    c.strokeStyle = col; c.lineWidth = w; c.stroke();
  };
  // wet, darkened sand just above the water line
  line(-1.2, 2.6, "rgba(50,42,28,0.22)");
  line(0.2, 1.2, "rgba(28,40,36,0.3)");
  // foam as broken flecks (never ruled lines): noise in world space decides where spume gathers
  const foam = (d: number, size: number, a: number, list: typeof segs, sd: number, drift = 0) => {
    if (a <= 0.01) return;
    c.beginPath();
    for (const s of list) {
      const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], n = Math.max(1, Math.round(Math.hypot(dx, dy) / 1.6));
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n, bx = s.a[0] + dx * f, by = s.a[1] + dy * f;
        const v = vnoise(bx * 0.22 + drift, by * 0.4, sd) * 0.7 + vnoise(bx * 0.9, by * 1.3, sd + 3) * 0.3;
        if (v < 0.5) continue;
        const jit = (vnoise(bx * 0.5, by * 0.5, sd + 7) - 0.5) * 1.4, r = size * (0.4 + (v - 0.5) * 2.2);
        const px = bx + s.nx * (d + jit), py = by + s.ny * (d + jit);
        c.moveTo(px + r, py); c.ellipse(px, py, r, r * 0.45, 0, 0, 7);
      }
    }
    c.fillStyle = `rgba(232,238,230,${a.toFixed(3)})`; c.fill();
  };
  // resting lace hugging the bank
  foam(0.8, 0.55, live ? 0.3 + 0.06 * Math.sin(t / 1300) : 0.28, segs, 11);
  if (live) {
    // two swells roll in from ~5 px out, gather into spume and dissolve on the bank
    const B = 8;
    for (let w = 0; w < 2; w++) {
      const buckets: typeof segs[] = Array.from({ length: B }, () => []);
      for (const s of segs) {
        const ph = ((t / 6400 + w / 2 + vnoise(s.mx * 0.015, s.my * 0.015, 5) * 0.8) % 1 + 1) % 1;
        buckets[Math.min(B - 1, Math.floor(ph * B))]!.push(s);
      }
      buckets.forEach((list, i) => {
        if (!list.length) return;
        const ph = (i + 0.5) / B, d = (1 - ph) * 5 + 0.9;
        foam(d, 0.35 + ph * 0.35, Math.sin(ph * Math.PI) * 0.32, list, 21 + w * 5, w * 13 + ph * 2);
      });
    }
  }
  c.restore();
}
type GroundGeom = { water: Path2D; deep: Pt[]; layers: (Path2D | null)[]; shoreLines: Path2D | null; shore: { a: Pt; b: Pt; w: Pt }[]; edges: GroundEdge[] };
const geomCache = new Map<string, GroundGeom>();
/** Terrain never changes, so the contour geometry of a tile block is built once and reused as Path2D. */
function groundGeom(x0: number, x1: number, y0: number, y1: number): GroundGeom {
  const key = `${x0},${x1},${y0},${y1}`;
  const hit = geomCache.get(key);
  if (hit) { geomCache.delete(key); geomCache.set(key, hit); return hit; }
  const nearWater = (x: number, y: number) => { if (isWater(terrain(x, y))) return true; for (const [dx, dy] of NB8) if (isWater(terrain(x + dx, y + dy))) return true; return false; };
  const water = new Path2D(), deep: Pt[] = [];
  for (let s = x0 + y0; s <= x1 + y1; s++) for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
    const y = s - x;
    if (terrain(x, y) === "deep") deep.push(iso(x, y) as Pt);
    if (!nearWater(x, y)) continue;
    const [cx, cy] = iso(x, y);
    water.moveTo(cx, cy - TH / 2 - 1); water.lineTo(cx + TW / 2 + 1, cy); water.lineTo(cx, cy + TH / 2 + 1); water.lineTo(cx - TW / 2 - 1, cy); water.closePath();
  }
  const edges: GroundEdge[] = [];
  const gx0 = x0 - 1, gy0 = y0 - 1, GW = x1 - x0 + 3, GH = y1 - y0 + 3;
  const lay = new Int8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) lay[j * GW + i] = LAYER[terrain(gx0 + i, gy0 + j)]!;
  const L_ = (x: number, y: number) => lay[(y - gy0) * GW + (x - gx0)]!;
  for (let s = x0 + y0; s <= x1 + y1; s++) for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
    const y = s - x, r = L_(x, y); if (r === 0) continue;
    let low = r, coast = false;
    for (const [dx, dy] of NB8) { const o = terrain(x + dx, y + dy); const q = LAYER[o]!; if (q < low) low = q; if (isWater(o)) coast = true; }
    if (low < r) { const [cx, cy] = iso(x, y); edges.push({ x, y, cx, cy, tr: terrain(x, y), r, coast }); }
  }
  // Soft membership field per layer: a blurred "is at least layer L" indicator plus a little noise.
  // Contours are interpolated where it crosses 0.5, so borders curve instead of following tile steps.
  const ind = (x: number, y: number, L: number) => L_(x, y) >= L ? 1 : 0;
  const memo = new Float32Array(GW * GH * 8).fill(-1);
  const M = (x: number, y: number, L: number) => {
    const k = ((y - gy0) * GW + (x - gx0)) * 8 + L; const hv = memo[k]!; if (hv >= 0) return hv;
    let s = ind(x, y, L) * 4, w = 4;
    for (const [dx, dy] of NB8) {
      const nx = x + dx, ny = y + dy; if (nx < gx0 || ny < gy0 || nx >= gx0 + GW || ny >= gy0 + GH) continue;
      const f = dx && dy ? 0.5 : 1; s += ind(nx, ny, L) * f; w += f;
    }
    const v = s / w + (vnoise(x * 0.7, y * 0.7, 71) - 0.5) * 0.22;
    memo[k] = v; return v;
  };
  const cross = (ax: number, ay: number, ma: number, bx: number, by: number, mb: number): Pt => {
    const f = Math.max(0.08, Math.min(0.92, (0.5 - ma) / (mb - ma || 1e-6)));
    const p = iso(ax + (bx - ax) * f, ay + (by - ay) * f); return [p[0], p[1]];
  };
  const shore: { a: Pt; b: Pt; w: Pt }[] = [];
  const layers: (Path2D | null)[] = [null];
  for (let L = 1; L <= 7; L++) {
    const path = new Path2D();
    let any = false;
    for (let y = gy0; y < gy0 + GH - 1; y++) for (let x = gx0; x < gx0 + GW - 1; x++) {
      const cs: [number, number][] = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
      const m = cs.map(([a, b]) => M(a, b, L));
      if (Math.max(...m) < 0.5) continue;
      const pts: Pt[] = [], xs: Pt[] = [];
      for (let k = 0; k < 4; k++) {
        const [ax, ay] = cs[k]!, [bx, by] = cs[(k + 1) & 3]!;
        const ia = m[k]! >= 0.5, ib = m[(k + 1) & 3]! >= 0.5;
        if (ia) { const p = iso(ax, ay); pts.push([p[0], p[1]]); }
        if (ia !== ib) { const q = cross(ax, ay, m[k]!, bx, by, m[(k + 1) & 3]!); pts.push(q); xs.push(q); }
      }
      if (pts.length < 3) continue;
      any = true;
      path.moveTo(pts[0]![0], pts[0]![1]); for (let k = 1; k < pts.length; k++) path.lineTo(pts[k]![0], pts[k]![1]); path.closePath();
      if (L === 1 && xs.length >= 2) {
        let wx = 0, wy = 0, n = 0;
        cs.forEach(([a, b], k) => { if (m[k]! < 0.5) { const p = iso(a, b); wx += p[0]; wy += p[1]; n++; } });
        for (let k = 0; k + 1 < xs.length; k += 2) shore.push({ a: xs[k]!, b: xs[k + 1]!, w: [wx / n, wy / n] });
      }
    }
    layers.push(any ? path : null);
  }
  let shoreLines: Path2D | null = null;
  if (shore.length) { shoreLines = new Path2D(); for (const s of shore) { shoreLines.moveTo(s.a[0], s.a[1]); shoreLines.lineTo(s.b[0], s.b[1]); } }
  const g = { water, deep, layers, shoreLines, shore, edges };
  geomCache.set(key, g);
  while (geomCache.size > 12) geomCache.delete(geomCache.keys().next().value!);
  return g;
}
/** Water + layered land for a tile range; returns border tiles for frayed edges. */
function drawGround(c: C, x0: number, x1: number, y0: number, y1: number, t: number, detail: boolean): GroundEdge[] {
  if (detail) { // live view: snap to 16-tile blocks so panning reuses the cached geometry
    x0 = Math.max(0, Math.floor(x0 / 16) * 16); y0 = Math.max(0, Math.floor(y0 / 16) * 16);
    x1 = Math.min(MAP - 1, Math.ceil((x1 + 1) / 16) * 16 - 1); y1 = Math.min(MAP - 1, Math.ceil((y1 + 1) / 16) * 16 - 1);
  }
  if (x1 < x0 || y1 < y0) return []; // view lies entirely off the island: nothing to paint
  const G = groundGeom(x0, x1, y0, y1);
  // ---- pass 0: one continuous water surface under everything (no tile seams) ----
  // Two slow, counter-drifting layers that breathe back and forth: calm, never a conveyor belt.
  const wA = Math.sin(t / 9000) * 40 + t / 30000, wB = Math.cos(t / 7000) * 30 - t / 45000;
  for (let pass = 0; pass < 2; pass++) {
    const wp = texture(c, "water", pass ? wB : wA);
    c.globalAlpha = pass ? 0.35 + 0.1 * Math.sin(t / 5000) : 1;
    c.fillStyle = wp ?? hsl(190, 30, 32); c.fill(G.water);
  }
  c.globalAlpha = 1;
  if (G.deep.length) {
    c.fillStyle = "rgba(8,30,40,0.14)"; c.beginPath();
    for (const [cx, cy] of G.deep) { c.moveTo(cx + TW * 0.8, cy); c.ellipse(cx, cy, TW * 0.8, TH * 0.8, 0, 0, 7); }
    c.fill();
  }
  // ---- pass 1: land as stacked layers (sand < fields < meadow < grass < hill < forest < rock).
  for (let L = 1; L <= 7; L++) {
    const path = G.layers[L]; if (!path) continue;
    if (L === 1 && G.shoreLines) {
      // shallow water: the sandy bed shimmers through before the bank begins
      c.save(); c.lineCap = "round"; c.lineJoin = "round";
      const band = (w: number, a: number, tex: Tex) => { c.globalAlpha = a; c.strokeStyle = texture(c, tex) ?? "#c8b48a"; c.lineWidth = w; c.stroke(G.shoreLines!); };
      band(9, 0.22, "sand"); band(5, 0.3, "sand");
      c.restore();
    }
    c.fillStyle = texture(c, TEX_OF[LAYER_T[L]!]!) ?? "#7a8a50"; c.fill(path);
  }
  if (G.shore.length) drawSurf(c, G.shore, t, detail);
  return G.edges;
}

// ---- mid-zoom ground cache: static terrain (+ forests, crags) baked per 32x32-tile chunk ----
const CH = 32, PAD_TOP = 40;
const chunkCache = new Map<string, HTMLCanvasElement>();
// Tiles a town could ever cover: their trees/rocks are drawn live (and cleared by buildings);
// everywhere else they are baked into ground chunks — same placement either way, so zoom never changes the scene.
let maskKey = "", mask: { x: number; y: number; r2: number }[] = [];
let maskSeeds: Seed[] | null = null;
function syncMask(seeds: Seed[]) {
  if (seeds === maskSeeds) return; maskSeeds = seeds;
  const k = seeds.map((s) => s.id + s.x + "," + s.y).join("|");
  if (k !== maskKey) { maskKey = k; mask = seeds.map((s) => { const r = reachOf(s, radiusOf(30000)) + 4; return { x: s.x, y: s.y, r2: r * r }; }); chunkCache.clear(); }
}
function nearTown(x: number, y: number) {
  for (const m of mask) { const dx = x - m.x, dy = y - m.y; if (dx * dx + dy * dy <= m.r2) return true; }
  return false;
}
/** Wild trees, bushes, crags and ore rocks of one tile — the single source for every zoom level. */
function natureAt(g: C, x: number, y: number, cx: number, cy: number, t: number, free: boolean) {
  const tr = terrain(x, y);
  if (tr === "hill" || tr === "mountain") {
    const rs = resourceAt(x, y);
    if (rs) {
      drawNature(g, rs === "stone" ? "boulder" : rs, cx + (hash(x, y, 90) - 0.5) * 8, cy + 3, 0.75 + hash(x, y, 99) * 0.4, 0, hash(x, y, 95) > 0.5);
    }
  }
  if (!free) return;
  if (tr === "mountain" && hash(x, y, 26) > 0.55) drawNature(g, "crag", cx + (hash(x, y, 28) - 0.5) * 6, cy + 4, 0.55 + hash(x, y, 27) * 0.5, 0, hash(x, y, 29) > 0.5);
  if (tr === "forest") {
    if (hash(x, y, 19) > 0.35) tree(g, cx + 6, cy - 1, 0.75 + hash(x, y, 20) * 0.3, t, hash(x, y, 21), x * 17 + y, 0.6);
    tree(g, cx - 5, cy + 3, 0.85 + hash(x, y, 17) * 0.35, t, hash(x, y, 18), x * 13 + y, 0.6);
  } else if (tr === "grass" || tr === "meadow" || tr === "hill") {
    if (hash(x, y, 22) > 0.95) tree(g, cx, cy + 1, 0.9, t, hash(x, y, 23), x * 19 + y, 0.2);
    else if (hash(x, y, 22) > 0.9) drawNature(g, "bush", cx + (hash(x, y, 24) - 0.5) * 12, cy + 2, 0.8 + hash(x, y, 25) * 0.5);
  }
}
function groundChunk(ix: number, iy: number, q: number, sk: string): HTMLCanvasElement | null {
  const key = `${ix},${iy},${q},${sk}`;
  const hit = chunkCache.get(key);
  if (hit) { chunkCache.delete(key); chunkCache.set(key, hit); return hit; }
  const X0 = ix * CH, Y0 = iy * CH, X1 = Math.min(MAP - 1, X0 + CH - 1), Y1 = Math.min(MAP - 1, Y0 + CH - 1);
  // bounding box of the chunk diamond in world pixels
  const left = iso(X0, Y1)[0] - TW, right = iso(X1, Y0)[0] + TW, top = iso(X0, Y0)[1] - TH - PAD_TOP, bottom = iso(X1, Y1)[1] + TH;
  const cv = document.createElement("canvas");
  cv.width = Math.ceil((right - left) * q); cv.height = Math.ceil((bottom - top) * q);
  const g = cv.getContext("2d")!;
  g.setTransform(q, 0, 0, q, -left * q, -top * q);
  // fill only this chunk's diamond so neighbouring chunks never double-paint
  g.save();
  const a = iso(X0 - 0.5, Y0 - 0.5), b = iso(X1 + 0.5, Y0 - 0.5), d = iso(X1 + 0.5, Y1 + 0.5), e = iso(X0 - 0.5, Y1 + 0.5);
  g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.lineTo(e[0], e[1]); g.closePath(); g.clip();
  drawGround(g, X0, X1, Y0, Y1, 0, false);
  g.restore();
  let missing = false;
  for (let s = X0 + Y0; s <= X1 + Y1; s++) for (let x = Math.max(X0, s - Y1); x <= Math.min(X1, s - Y0); x++) {
    const y = s - x;
    if (nearTown(x, y)) continue;
    const [cx, cy] = iso(x, y);
    natureAt(g, x, y, cx, cy, 0, true);
  }
  if (!allTexturesReady() || !natureReady()) missing = true;
  (cv as HTMLCanvasElement & { ox?: number; oy?: number }).ox = left;
  (cv as HTMLCanvasElement & { ox?: number; oy?: number }).oy = top;
  if (missing) return cv; // not cached: re-bake once images have loaded
  chunkCache.set(key, cv);
  while (chunkCache.size > 140) chunkCache.delete(chunkCache.keys().next().value!);
  return cv;
}
function drawGroundChunks(c: C, x0: number, x1: number, y0: number, y1: number, z: number, vx0: number, vx1: number, vy0: number, vy1: number, far = false) {
  const q = z > 1.6 ? 2 : z > 0.6 ? 1 : 0.5, sk = seasonKey(renderNow);
  let baked = 0;
  const cx0 = Math.floor(x0 / CH), cx1 = Math.floor(x1 / CH), cy0 = Math.floor(y0 / CH), cy1 = Math.floor(y1 / CH);
  for (let s = cx0 + cy0; s <= cx1 + cy1; s++) for (let ix = Math.max(cx0, s - cy1); ix <= Math.min(cx1, s - cy0); ix++) {
    const iy = s - ix;
    const X0 = ix * CH, Y0 = iy * CH, X1 = X0 + CH - 1, Y1 = Y0 + CH - 1;
    if (iso(X1, Y0)[0] + TW < vx0 || iso(X0, Y1)[0] - TW > vx1 || iso(X1, Y1)[1] + TH < vy0 || iso(X0, Y0)[1] - TH - PAD_TOP > vy1) continue;
    const cached = chunkCache.has(`${ix},${iy},${q},${sk}`);
    if (!cached && baked >= 3) { // spread baking over frames; fall back to another cached quality if any
      const oq = [2, 1, 0.5].find((o) => o !== q && chunkCache.has(`${ix},${iy},${o},${sk}`));
      const lo = oq ? chunkCache.get(`${ix},${iy},${oq},${sk}`) as (HTMLCanvasElement & { ox: number; oy: number }) : undefined;
      if (lo && oq) c.drawImage(lo, lo.ox, lo.oy, lo.width / oq, lo.height / oq);
      else if (far) { /* overview bitmap already underneath */ }
      else { const [a, b] = iso(X0 + CH / 2, Y0 + CH / 2); c.fillStyle = "#7a8a50"; c.beginPath(); c.moveTo(a, b - CH * TH / 2); c.lineTo(a + CH * TW / 2, b); c.lineTo(a, b + CH * TH / 2); c.lineTo(a - CH * TW / 2, b); c.fill(); }
      continue;
    }
    if (!cached) baked++;
    const cv = groundChunk(ix, iy, q, sk) as (HTMLCanvasElement & { ox: number; oy: number }) | null;
    if (cv) c.drawImage(cv, cv.ox, cv.oy, cv.width / q, cv.height / q);
  }
}

// ---------------- player rituals: festive garlands and signposts ----------------
let signSrc: Signpost[] = [], signKey = "";
const signMap = new Map<number, Signpost>();
export function setSignposts(list: Signpost[]) { signSrc = list; }
/** Tile key → signpost, rebuilt only when the posts or the seed set change. */
export function signpostMap(seeds: Seed[]) {
  const k = signSrc.map((p) => p.id + p.message).join("|") + "#" + seeds.length;
  if (k !== signKey) {
    signKey = k; signMap.clear();
    for (const p of signSrc) { const tl = signTile(seeds, p.seed_id, p.target_id); if (tl) signMap.set(tl[1] * MAP + tl[0], p); }
  }
  return signMap;
}
/** Bunting strung across the village centre with little lanterns, swaying in the breeze. */
function drawFestive(c: C, cx: number, cy: number, t: number, sd: number, L: Light[]) {
  const cols = ["#c8553d", "#e8b04a", "#5d8a4e", "#3f6f9a", "#e9dcc0"];
  const poles: Pt[] = [[cx - 14, cy - 3], [cx, cy - 9], [cx + 14, cy - 3], [cx, cy + 6]];
  for (const [px, py] of poles) {
    line(c, [px, py], [px, py - 13], sd, 0.6, "#5a3f2a");
  }
  for (let i = 0; i < poles.length; i++) {
    const A = poles[i]!, B = poles[(i + 1) % poles.length]!;
    const a: Pt = [A[0], A[1] - 13], b: Pt = [B[0], B[1] - 13];
    const sag = 3 + Math.sin(t / 1400 + i + sd) * 0.6;
    const at = (u: number): Pt => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * sag];
    c.strokeStyle = "rgba(60,44,30,0.8)"; c.lineWidth = 0.25; c.beginPath();
    for (let k = 0; k <= 10; k++) { const p = at(k / 10); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
    c.stroke();
    for (let k = 1; k < 8; k++) {
      const p = at(k / 8), sw = Math.sin(t / 500 + k * 1.3 + i) * 0.35;
      c.fillStyle = cols[(k + i) % cols.length]!;
      c.beginPath(); c.moveTo(p[0] - 0.8, p[1]); c.lineTo(p[0] + 0.8, p[1]); c.lineTo(p[0] + sw, p[1] + 2.2); c.closePath(); c.fill();
    }
    const m = at(0.5); L.push({ x: m[0], y: m[1] + 1, r: 2.2 });
    c.fillStyle = "#ffd98a"; c.beginPath(); c.arc(m[0], m[1] + 1, 0.55, 0, 7); c.fill();
  }
}
/** Carved wooden waymark standing beside the road at the village edge. */
function drawSignpost(c: C, cx: number, cy: number, sd: number) {
  const im = folkImage("signpost"); if (!im) return;
  const x = cx + 5, y = cy + 1, h = 7, w = (h * im.naturalWidth) / im.naturalHeight;
  c.fillStyle = "rgba(25,18,10,0.25)"; c.beginPath(); c.ellipse(x + 1, y + 0.3, 2.2, 0.7, 0, 0, 7); c.fill();
  c.save(); c.translate(x, y); if (sd % 2) c.scale(-1, 1); c.drawImage(im, -w * 0.47, -h * 0.97, w, h); c.restore();
}

/** Wooden pail in a fire helper's hand; while standing at the blaze, water arcs toward the flames. */
function drawBucket(c: C, x: number, y: number, q: Pose, t: number) {
  const sx = q.dir[0] - q.dir[1], f = sx >= 0 ? 1 : -1, bx = x + f * 2.3, by = y - 2.6;
  c.save();
  c.fillStyle = "#7a5634"; c.beginPath(); c.moveTo(bx - 1.1, by - 1.3); c.lineTo(bx + 1.1, by - 1.3); c.lineTo(bx + 0.8, by + 0.6); c.lineTo(bx - 0.8, by + 0.6); c.closePath(); c.fill();
  c.strokeStyle = "#3d2b1a"; c.lineWidth = 0.25; c.stroke();
  c.fillStyle = "#9cc3d6"; c.beginPath(); c.ellipse(bx, by - 1.3, 1.05, 0.35, 0, 0, 7); c.fill();
  if (!q.walking) {
    const u = ((t / 840 + q.p.id * 0.37) % 1);
    if (u < 0.35) {
      const k = u / 0.35; c.strokeStyle = `rgba(170,210,235,${0.8 * (1 - k)})`; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(bx + f * 0.8, by - 1.3); c.quadraticCurveTo(bx + f * (2 + k * 3), by - 4 - k, bx + f * (3 + k * 5), by - 1 + k * 2); c.stroke();
    }
  }
  c.restore();
}
/** The maypole raised after the maypole encounter: painted sprite, ribbons fluttering a little. */
function drawMaypole(c: C, x: number, y: number, t: number) {
  const im = huntIm("maypole", maypoleUrl); if (!im) return;
  const h = 40, w = (im.naturalWidth / im.naturalHeight) * h;
  c.save();
  c.fillStyle = "rgba(25,18,10,0.25)"; c.beginPath(); c.ellipse(x + 1, y + 0.3, 3.2, 1.1, 0, 0, 7); c.fill();
  c.translate(x, y); c.rotate(Math.sin(t / 1800) * 0.006); c.drawImage(im, -w / 2, -h * 0.98, w, h);
  c.restore();
}
/** A village cow from the cow encounter: grazes on a pasture (or the green), slowly turning, lying down at night. */
function drawCow(c: C, x: number, y: number, now: number, sd: number, i: number) {
  const im = huntIm("cow", cowUrl); if (!im) return;
  const w = 13, h = (im.naturalHeight / im.naturalWidth) * w;
  const step = Math.floor(now / 90000 + sd);
  const dx = (hash(sd, step, 1501) - 0.5) * 7 + i * 4 - 4, dy = (hash(sd, step, 1502) - 0.5) * 3;
  const flip = hash(sd, Math.floor(now / 240000), 1503) < 0.5, bob = Math.sin(now / 900 + sd) * 0.25;
  const night = animalsSleeping(now);
  c.save();
  c.fillStyle = "rgba(25,18,10,0.28)"; c.beginPath(); c.ellipse(x + dx, y + dy + 0.3, 5, 1.4, 0, 0, 7); c.fill();
  c.translate(x + dx, y + dy); if (flip) c.scale(-1, 1);
  if (night) c.drawImage(im, 0, im.naturalHeight * 0.45, im.naturalWidth, im.naturalHeight * 0.55, -w / 2, -h * 0.55, w, h * 0.55);
  else { c.translate(0, bob * 0.3); c.drawImage(im, -w / 2, -h * 0.96, w, h); }
  c.restore();
}

/** Rare orchard trees from the nurseryman: grow from staked sapling to full crown over ~3 weeks and follow the shared seasons. */
function drawRareTree(c: C, x: number, y: number, kind: "cherry" | "quince", ageH: number, now: number, t: number, sd: number) {
  const g = Math.min(1, 0.35 + Math.max(0, ageH) / 500), w = seasonAt(now);
  const sway = Math.sin(t / 1400 + sd) * 0.5 * g;
  c.save();
  c.fillStyle = "rgba(40,50,25,0.22)"; c.beginPath(); c.ellipse(x, y + 0.5, 6 * g, 2.6 * g, 0, 0, 7); c.fill();
  const th = 9 * g;
  c.strokeStyle = "#5e4630"; c.lineCap = "round"; c.lineWidth = 1.4 * g + 0.4;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 0.6, y - th * 0.6, x + sway * 0.4, y - th); c.stroke();
  if (g < 0.6) { c.strokeStyle = "#a88a5f"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x + 1.6, y + 0.3); c.lineTo(x + 1.6, y - th * 0.9); c.stroke(); }
  const leaf = kind === "cherry" ? [104, 34, 38] : [92, 36, 40];
  const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i]! - v) * k);
  let col = leaf;
  col = mix(col, kind === "cherry" ? [345, 62, 82] : [40, 30, 90], w.spring * 0.85);
  col = mix(col, kind === "cherry" ? [12, 62, 46] : [44, 66, 50], w.autumn);
  const bare = w.winter;
  const cx = x + sway, cy = y - th - 3.2 * g, R = 5.2 * g;
  if (bare < 0.95) {
    c.globalAlpha = 1 - bare * 0.9;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.28 + sd, r = R * (0.5 + hash(sd, i, 3) * 0.35);
      const px = cx + Math.cos(a) * R * 0.55, py = cy + Math.sin(a) * R * 0.38;
      const gr = c.createRadialGradient(px - r * 0.3, py - r * 0.4, 0.2, px, py, r);
      gr.addColorStop(0, hsl(col[0]!, col[1]!, Math.min(92, col[2]! + 14))); gr.addColorStop(1, hsl(col[0]!, col[1]!, col[2]! - 8));
      c.fillStyle = gr; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill();
    }
    // fruit in late summer/autumn
    const fruit = Math.max(w.autumn, w.summer * 0.4) * (g > 0.6 ? 1 : 0);
    if (fruit > 0.1) for (let i = 0; i < 6; i++) {
      c.fillStyle = kind === "cherry" ? "#a3172a" : "#e2b628"; c.globalAlpha = fruit * (1 - bare);
      c.beginPath(); c.arc(cx + (hash(sd, i, 7) - 0.5) * R * 1.4, cy + (hash(sd, i, 8) - 0.3) * R * 0.8, kind === "cherry" ? 0.55 : 0.9, 0, 7); c.fill();
    }
    // drifting cherry petals in spring
    if (kind === "cherry" && w.spring > 0.3) for (let i = 0; i < 3; i++) {
      const ph = (t / 5000 + hash(sd, i, 9)) % 1;
      c.globalAlpha = w.spring * (1 - ph) * 0.8; c.fillStyle = "#f6c6d4";
      c.fillRect(cx + (hash(sd, i, 10) - 0.5) * R * 2 + ph * 3, cy + ph * (th + 3), 0.6, 0.6);
    }
  }
  if (bare > 0.05) {
    c.globalAlpha = bare; c.strokeStyle = "#5e4630"; c.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.55; c.beginPath(); c.moveTo(x + sway * 0.4, y - th); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.8); c.stroke(); }
    c.fillStyle = "#f4f6f8"; c.beginPath(); c.ellipse(cx, cy - R * 0.5, R * 0.8, R * 0.25, 0, 0, 7); c.fill();
  }
  c.restore();
}

export function draw(
  c: C, w: number, h: number, dpr: number, cam: Camera, seeds: Seed[], plantings: Map<string, Planting>,
  now: number, hover: [number, number] | null, ghostOk: boolean | null,
) {
  renderNow = now; renderSeeds = seeds; syncMask(seeds); setArtTime(now); setNatureTime(now);
  lastPeople.length = 0; lastTraders.length = 0; lastSources.length = 0;
  signpostMap(seeds);
  if (cam.zoom < OVERVIEW_BELOW) return drawOverview(c, w, h, dpr, cam, seeds, now);
  const t = performance.now(); setSpriteTime(t);
  const z = cam.zoom * dpr;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = hsl(205, 30, 58); c.fillRect(0, 0, w, h);
  c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z);

  const inv = (sx: number, sy: number) => toTile((sx - w / 2) / z + cam.x, (sy - h / 2) / z + cam.y);
  const cs = [inv(0, 0), inv(w, 0), inv(0, h), inv(w, h)];
  const x0 = Math.max(0, Math.min(...cs.map((p) => p[0])) - 2), x1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[0])) + 2);
  const y0 = Math.max(0, Math.min(...cs.map((p) => p[1])) - 2), y1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[1])) + 5);
  // One rendering path at every map zoom: no threshold where trees, house facing or pastures switch.
  const detail = true, sharp = cam.zoom >= 1.3; // sharp: ground painted per tile (crisper texture only)
  const cs0x = cam.x - w / 2 / z, cs1x = cam.x + w / 2 / z, cs0y = cam.y - h / 2 / z, cs1y = cam.y + h / 2 / z;
  const L: Light[] = [];
  const tiles: { x: number; y: number; cx: number; cy: number; st: Structure | null }[] = [];

  let edges: GroundEdge[] = [];
  if (sharp) edges = drawGround(c, x0, x1, y0, y1, t, true);
  else drawGroundChunks(c, x0, x1, y0, y1, z, cs0x, cs1x, cs0y, cs1y);
  // frayed edges: a few grass tufts and pebbles breaking up the borderline
  if (detail) {
    for (const e of edges) {
      if (e.x < x0 || e.x > x1 || e.y < y0 || e.y > y1) continue;
      const n = hash(e.x, e.y, 401) < 0.5 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const a = hash(e.x, e.y, 410 + i) * Math.PI * 2;
        const px = e.cx + Math.cos(a) * TW * 0.42, py = e.cy + Math.sin(a) * TH * 0.42;
        if (e.r >= 2) {
          c.strokeStyle = "rgba(78,96,46,0.45)"; c.lineWidth = 0.35; c.beginPath();
          for (let b = -1; b <= 1; b++) { c.moveTo(px + b * 0.4, py); c.lineTo(px + b * 0.8, py - 1.2 - hash(e.x, i, b + 5) * 0.6); }
          c.stroke();
        } else {
          // fine, varied gravel instead of grey marbles
          for (let g = 0; g < 4; g++) {
            const gx = px + (hash(e.x, e.y, 420 + g + i * 4) - 0.5) * 3, gy = py + (hash(e.x, e.y, 430 + g + i * 4) - 0.5) * 1.4;
            const l = 38 + hash(e.x, g, 440 + i) * 22;
            c.fillStyle = `hsla(32,14%,${l}%,0.55)`; c.beginPath(); c.ellipse(gx, gy, 0.35 + hash(g, e.y, 450) * 0.3, 0.22, 0, 0, 7); c.fill();
          }
        }
      }
    }
  }

  // ---- pass 1c: flat things on the ground ----
  for (let s = x0 + y0; s <= x1 + y1; s++) {
    for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
      const y = s - x;
      const [cx, cy] = iso(x, y);
      const st = structureAt(x, y, seeds, now);
      tiles.push({ x, y, cx, cy, st });
      if (!detail) {
        c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
        if (st && !FLAT.has(st.kind)) { /* drawn in pass 2 */ }
        else if (st?.kind === "field") { c.fillStyle = texture(c, acreOf(x, y, st.seed).ripe ? "wheat" : "crops") ?? hsl(44, 45, 66); c.fill(); }
        else if (st && (PATHLIKE.has(st.kind) || st.kind === "square")) { c.fillStyle = texture(c, st.kind === "street" || st.kind === "square" ? "cobble" : "dirt") ?? "#cdb084"; diamond(c, cx, cy, 0.85); c.fill(); }
        continue;
      }
      const live = sharp || nearTown(x, y);
      if (live) natureAt(c, x, y, cx, cy, t, false); // ore rocks

      if (!st) continue;
      const sd = x * 1000 + y;
      const pp = P(cx, cy);
      if (st.kind === "bridge") {
        /* drawn as one continuous span per crossing (see drawBridgeSpan) */
      } else if (st.kind === "path" || st.kind === "street" || st.kind === "road" || st.kind === "avenue" || st.kind === "rail") {
        const street = st.kind === "street" || st.kind === "avenue";
        const col = texture(c, street ? "cobble" : "dirt") ?? (street ? "#b3aa98" : "#c49e6c");
        const wBase = street ? 7 : 4.6;
        const isP = (i: number, j: number) => { const o = structureAt(x + i, y + j, seeds, now); return !!o && PATHLIKE.has(o.kind); };
        // Connect orthogonal neighbours; a diagonal only when no orthogonal step already links them,
        // so adjacent path tiles never form a lattice of crossing strokes.
        const con: [number, number][] = [];
        for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) if (isP(i, j)) con.push([i, j]);
        for (const [i, j] of [[1, 1], [-1, -1], [1, -1], [-1, 1]] as [number, number][]) if (isP(i, j) && !isP(i, 0) && !isP(0, j)) con.push([i, j]);
        c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = col;
        for (const [i, j] of con) {
          const m = pp(i * 0.5, j * 0.5);
          c.lineWidth = wBase * (0.92 + hash(x + i, y + j, 300) * 0.16);
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(m[0], m[1]); c.stroke();
        }
        if (con.length === 1) {
          // dead end: the track tapers out into the grass instead of stopping abruptly
          const [i, j] = con[0]!; const e = pp(-i * 0.3, -j * 0.3);
          c.globalAlpha = 0.6; c.lineWidth = wBase * 0.55; c.beginPath(); c.moveTo(cx, cy); c.lineTo(e[0], e[1]); c.stroke(); c.globalAlpha = 1;
        } else {
          c.fillStyle = col; c.beginPath(); c.ellipse(cx, cy, wBase * 0.5, wBase * 0.32, 0, 0, 7); c.fill();
        }
        if (!street && hash(x, y, 34) > 0.6) { c.fillStyle = "rgba(60,45,28,0.12)"; c.beginPath(); c.ellipse(cx + (hash(x, y, 33) - 0.5) * 3, cy, 1.3, 0.5, 0, 0, 7); c.fill(); }
      } else if (st.kind === "square" || st.kind === "market" || st.kind === "well") {
        c.beginPath(); c.ellipse(cx, cy, TW * (0.56 + hash(x, y, 71) * 0.1), TH * (0.56 + hash(x, y, 72) * 0.1), 0, 0, 7);
        c.fillStyle = texture(c, "cobble") ?? "#d3cab6"; c.fill();
      } else if (st.kind === "field" || st.kind === "garden") {
        // Neighbouring plots merge into one acre: fill slightly past the tile, edge only towards non-fields.
        const ac = acreOf(x, y, st.seed), ripe = st.kind === "field" && ac.ripe;
        const q = [pp(-0.52, -0.52), pp(0.52, -0.52), pp(0.52, 0.52), pp(-0.52, 0.52)];
        const sameA = (i: number, j: number) => { const o = structureAt(x + i, y + j, seeds, now); return !!o && o.kind === st.kind && acreOf(x + i, y + j, o.seed).id === ac.id; };
        // organic acre outline: outer sides bow gently, outer corners are rounded off
        const NS: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        const outer = NS.map(([i, j]) => !sameA(i, j));
        const lerp = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        const round = (k: number) => outer[(k + 3) & 3]! && outer[k]!;
        c.beginPath();
        const st0 = round(0) ? lerp(q[0]!, q[1]!, 0.35) : q[0]!; c.moveTo(st0[0], st0[1]);
        for (let k = 0; k < 4; k++) {
          const A = q[k]!, Bq = q[(k + 1) & 3]!, Cq = q[(k + 2) & 3]!, k1 = (k + 1) & 3;
          const end = round(k1) ? lerp(Bq, A, 0.35) : Bq;
          if (outer[k]) {
            const mid = lerp(A, Bq, 0.5), wob = (hash(x * 2 + NS[k]![0], y * 2 + NS[k]![1], 77) - 0.5) * 0.25;
            const ctl = lerp(mid, [cx, cy], wob);
            c.quadraticCurveTo(ctl[0], ctl[1], end[0], end[1]);
          } else c.lineTo(end[0], end[1]);
          if (round(k1)) { const nx = lerp(Bq, Cq, 0.35); c.quadraticCurveTo(Bq[0], Bq[1], nx[0], nx[1]); }
        }
        c.closePath();
        c.fillStyle = texture(c, ripe ? "wheat" : "crops") ?? hsl(ripe ? 44 : 80, 50, 60); c.fill();
        const same = (i: number, j: number) => { const o = structureAt(x + i, y + j, seeds, now); return !!o && o.kind === st.kind && acreOf(x + i, y + j, o.seed).id === ac.id; };
        if (st.kind === "field") {
          // furrows run the full length of the acre, continuing seamlessly across its tiles
          // modelled ridges: shaded trough below, sunlit crest above
          c.save(); c.clip(); c.lineCap = "round";
          for (let k = -2; k <= 2; k++) {
            const f = k / 4;
            const [a0, a1] = ac.along ? [pp(-0.6, f), pp(0.6, f)] : [pp(f, -0.6), pp(f, 0.6)];
            c.strokeStyle = "rgba(35,24,12,0.38)"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(a0[0], a0[1] + 0.9); c.lineTo(a1[0], a1[1] + 0.9); c.stroke();
            c.strokeStyle = ripe ? "rgba(255,230,160,0.22)" : "rgba(170,140,100,0.25)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(a0[0], a0[1] - 0.3); c.lineTo(a1[0], a1[1] - 0.3); c.stroke();
          }
          c.restore();
          // standing plants on every ridge, back to front, fringing past the acre edge like real stalks
          const row = fieldRowImage(ripe);
          if (row && seasonAt(now).winter < 0.6) {
            const w = ripe ? 15 : 13, hgt = (w * row.height) / row.width, flipRow = !ac.along;
            for (let k = -2; k <= 2; k++) for (let m = -1; m <= 1; m += 2) {
              const f = k / 4, g = m * 0.26 + (hash(x * 5 + k, y * 3 + m, 640) - 0.5) * 0.08;
              const [px, py] = ac.along ? pp(g, f) : pp(f, g);
              c.fillStyle = "rgba(30,22,10,0.22)"; c.beginPath(); c.ellipse(px + 0.6, py + 0.3, w * 0.42, 1.2, 0, 0, 7); c.fill();
              c.save(); c.translate(px, py); if (flipRow) c.scale(-1, 1);
              c.drawImage(row, -w / 2, -hgt * 0.92, w, hgt); c.restore();
            }
          }
        }
        // field balk: a few grass tufts along the outer edges instead of a ruled line
        c.strokeStyle = "rgba(78,96,46,0.5)"; c.lineWidth = 0.35; c.lineCap = "round"; c.beginPath();
        for (let k = 0; k < 4; k++) if (outer[k] && !same(NS[k]![0], NS[k]![1])) for (let n = 0; n < 3; n++) {
          const f = 0.2 + 0.3 * n + (hash(x, y, 500 + k * 3 + n) - 0.5) * 0.15;
          const p = lerp(q[k]!, q[(k + 1) & 3]!, f);
          for (let b = -1; b <= 1; b++) { c.moveTo(p[0] + b * 0.35, p[1]); c.lineTo(p[0] + b * 0.7, p[1] - 0.9 - hash(x + b, y + n, 510 + k) * 0.6); }
        }
        c.stroke();
      } else if (st.kind === "pasture") {
        c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
        c.fillStyle = texture(c, "meadow") ?? hsl(84, 34, 70, 0.6); c.fill();
      }
    }
  }

  // ---- villagers, bucketed by tile for depth sorting ----
  const folk = new Map<number, Pose[]>();
  lastPeople.length = 0; lastTraders.length = 0;
  const folkOn = cam.zoom >= 0.9; // villagers are sub-pixel below this; skipping them changes nothing visible
  const steer = steeredMayor();
  if (folkOn) for (const sd of seeds) {
    // generous margin: strollers and the steered mayor wander well beyond the built-up edge — never cull them at the border
    const r = reachOf(sd, radiusOf(effAge(sd, seeds, now))) + 14;
    const mine = steer && steer.sid === sd.id && steer.x >= x0 - 2 && steer.x <= x1 + 2 && steer.y >= y0 - 2 && steer.y <= y1 + 2;
    if (!mine && (sd.x + r < x0 || sd.x - r > x1 || sd.y + r < y0 || sd.y - r > y1)) continue;
    const r0 = reachOf(sd, radiusOf(effAge(sd, seeds, now)));
    for (const q of townPoses(sd, seeds, now)) {
      const k = Math.round(q.y) * MAP + Math.round(q.x);
      // out in the open at dusk: a small lantern glow keeps the figure readable on dark fields
      if (Math.hypot(q.x - sd.x, q.y - sd.y) > r0 * 0.8 || (steer && q.p.role === "mayor" && q.act === "stroll")) { const [lx, ly] = iso(q.x, q.y); L.push({ x: lx, y: ly - 2, r: 7 }); }
      if (!folk.has(k)) folk.set(k, []);
      folk.get(k)!.push(q);
    }
  }
  const robbers = new Map<number, [number, number, boolean]>();
  if (detail) for (const sd of seeds) { const r = robberAt(sd, now); if (r) { robbers.set(Math.round(r[1]) * MAP + Math.round(r[0]), r); const [lx, ly] = iso(r[0], r[1]); L.push({ x: lx, y: ly - 2, r: 4 }); } }
  const simpleFolk = cam.zoom < 2.2;
  const goal = mayorGoal(now), goalK = goal ? goal[1] * MAP + goal[0] : -1;
  // encounter props: the raised maypole on the square and the village's cows (derived in townOf)
  const props = new Map<number, ((cx: number, cy: number) => void)[]>();
  const addProp = (k: number, f: (cx: number, cy: number) => void) => (props.get(k) ?? props.set(k, []).get(k)!).push(f);
  // road crews join the tile depth order, so houses in front hide them instead of the crew floating on roofs
  if (detail) for (const l of links(seeds)) {
    const prog = roadProgress(l, now);
    if (prog <= 0 || prog >= 1) continue;
    const pts = smoothRoad(l), n = pts.length, k = Math.min(n - 2, Math.floor(prog * n / 2));
    const sn = l.a.x * 7 + l.b.y * 13;
    for (const [i, j] of [[k, k + 1], [n - 1 - k, n - 2 - k]] as const) {
      const [ax, ay] = pts[i]!, [bx, by] = pts[Math.max(0, Math.min(n - 1, j))]!;
      if (ax < cs0x - 40 || ax > cs1x + 40 || ay < cs0y - 40 || ay > cs1y + 40) continue;
      const [tx, ty] = toTile(ax, ay);
      addProp(ty * MAP + tx, () => drawRoadWorks(c, ax, ay, bx - ax, by - ay, t, sn + i));
    }
  }
  if (detail) for (const sd of seeds) {
    if (!sd.decisions?.length) continue;
    const r = reachOf(sd, radiusOf(effAge(sd, seeds, now))) + 2;
    if (sd.x + r < x0 || sd.x - r > x1 || sd.y + r < y0 || sd.y - r > y1) continue;
    const tw = townOf(sd, seeds, now);
    if (tw.maypole) addProp(tw.maypole[1] * MAP + tw.maypole[0], (cx, cy) => drawMaypole(c, cx, cy, t));
    tw.cows.forEach((cw, i) => addProp(cw[1] * MAP + cw[0], (cx, cy) => drawCow(c, cx, cy, now, cw[0] * 31 + cw[1] + i * 7, i)));
  }

  // ---- bridges: one straight span per water crossing, abutment to abutment ----
  if (detail) for (const l of links(seeds)) {
    const n = l.tiles.length;
    for (let i = 0; i < n; i++) {
      if (!l.water[i]) continue;
      let j = i; while (j + 1 < n && l.water[j + 1]) j++;
      const s0 = Math.max(0, i - 1), s1 = Math.min(n - 1, j + 1);
      const A = l.tiles[s0]!, B = l.tiles[s1]!;
      const built = [s0, s1].every((k) => { const st = structureAt(l.tiles[k]![0], l.tiles[k]![1], seeds, now); return !!st && PATHLIKE.has(st.kind); })
        && structureAt(l.tiles[i]![0], l.tiles[i]![1], seeds, now)?.kind === "bridge";
      if (built) {
        const [ax, ay] = iso(A[0], A[1]), [bx, by] = iso(B[0], B[1]);
        if (Math.max(ax, bx) > cs0x - 60 && Math.min(ax, bx) < cs1x + 60 && Math.max(ay, by) > cs0y - 60 && Math.min(ay, by) < cs1y + 60)
          drawBridgeSpan(c, [ax, ay], [bx, by], A[0] * 31 + A[1], t);
      }
      i = j;
    }
  }

  // road traffic, messengers and stalls join the tile depth order: houses in front hide them (no object above a front roof)
  const vip: (() => void)[] = [];
  const roadProp = (x: number, y: number, a: number, f: () => void, important = false) => {
    const [tx, ty] = toTile(x, y);
    addProp(ty * MAP + tx, () => { c.globalAlpha = a; f(); c.globalAlpha = 1; });
    if (important) vip.push(f);
  };
  // ---- life on the trade roads ----
  if (detail) for (const l of links(seeds)) {
    const prog = roadProgress(l, now);
    if (prog <= 0) continue;
    if (prog < 1) continue; // road crews are drawn in the tile depth pass above
    const pts = smoothRoad(l);
    const n = pts.length;
    const mature = Math.min(1, Math.min(ageHours(l.a, now), ageHours(l.b, now)) / 240);
    // more traffic the better the towns complement each other; traders rest at night (shared world clock)
    const hr = worldHour(now), night = hr < 5 || hr >= 22;
    const count = night ? (mature > 0.5 ? 1 : 0) : 1 + Math.round(mature * 3 * complement(l.a, l.b));
    const sn = l.a.x * 7 + l.b.y * 13;
    // share of open-road tiles in a 5-tile window: 1 on the open road, ramps to 0 just inside the town edge
    const openMemo = new Map<number, boolean>();
    const roadFade = (_l: typeof l, idx: number, twinOk: boolean) => {
      let open = 0;
      for (let d = -2; d <= 2; d++) {
        const j = Math.max(0, Math.min(l.tiles.length - 1, idx + d));
        let ok = openMemo.get(j);
        if (ok === undefined) { const st = structureAt(l.tiles[j]![0], l.tiles[j]![1], seeds, now); ok = !!st && (st.kind === "road" || st.kind === "bridge" || (twinOk && st.kind === "street")); openMemo.set(j, ok); }
        if (ok) open++;
      }
      const f = open / 5;
      return f * f * (3 - 2 * f);
    };
    for (let k = 0; k < count; k++) {
      const secsPerTile = hash(sn, k, 3) < 0.55 ? 1.6 + hash(sn, k, 1) * 1.2 : 3.2 + hash(sn, k, 1) * 1.2;
      if (n < 2) continue;
      const motion = roadMotion(pts, t / 1000 / secsPerTile + hash(sn, k, 2) * (n - 1) * 2);
      const fwd = motion.forward, i = motion.index;
      // travellers show on open road and fade in/out over the last tiles into town – no popping
      const twin = isTwin(l, seeds, now);
      const fade = roadFade(l, i, twin);
      if (fade <= 0) continue;
      const [x, y] = motion.position;
      if (x < cs0x - 40 || x > cs1x + 40 || y < cs0y - 40 || y > cs1y + 40) continue;
      const bob = Math.sin(t / 180 + k) * 0.4;
      const [dx, dy] = motion.direction;
      const from = fwd ? l.a : l.b, to = fwd ? l.b : l.a, ex = tradeProfile(from, now).exports;
      const good = ex[Math.floor(hash(sn, k, 5) * ex.length)] ?? null, cart = !twin && hash(sn, k, 3) < 0.55; // twins: porters walk straight from workshop to workshop
      // oncoming traffic passes on the right: carts keep a wide lane, walkers the verge
      const [ox, oy] = keepRight(dx, dy, cart ? 3.2 : 4.2);
      if (cart) roadProp(x + ox, y + oy, fade, () => drawCart(c, x + ox, y + oy, dx, dy, bob, sn + k, "", t));
      else roadProp(x + ox, y + oy, fade, () => drawWanderer(c, x + ox, y + oy, dx, dy, t, sn + k, good ? CARRY_OF[good] : null));
      lastTraders.push({ x, y, from: from.name, to: to.name, good, cart });
    }
    // journeymen and messengers on their way to the neighbour
    if (n >= 2) for (const w of walkersNow(l, now)) {
      const end = n - 1, pr = walkProgress(w, now) * end, fwd = w.from.id === l.a.id;
      // roadMotion's second half (phase end..2·end) already runs b→a with a reversed heading
      const m = roadMotion(pts, fwd ? Math.min(pr, end - 1e-6) : end + pr);
      const fade = roadFade(l, m.index, false);
      if (fade <= 0) continue;
      const cartW = w.kind === "family" || w.kind === "gift" || w.kind === "aid", [ox2, oy2] = keepRight(m.direction[0], m.direction[1], cartW ? 3.2 : 4.2);
      const x = m.position[0] + ox2, y = m.position[1] + oy2;
      if (x < cs0x - 40 || x > cs1x + 40 || y < cs0y - 40 || y > cs1y + 40) continue;
      if (w.kind === "family" || w.kind === "gift" || w.kind === "aid") { roadProp(x, y, fade, () => drawCart(c, x, y, m.direction[0], m.direction[1], Math.sin(t / 220) * 0.3, w.sd, "", t * 0.8)); lastTraders.push({ x, y, from: w.from.name, to: w.to.name, good: null, cart: true, walker: w }); continue; }
      if (w.kind === "rider") { roadProp(x, y, fade, () => drawRider(c, x, y, m.direction[0], m.direction[1], w.sd, t), true); lastTraders.push({ x, y, from: w.from.name, to: w.to.name, good: null, cart: false, walker: w }); continue; }
      if (w.kind === "trader") { const ex = tradeProfile(w.p0 ? w.to : w.from, now).exports, gd = ex[w.sd % Math.max(1, ex.length)] ?? null; roadProp(x, y, fade, () => drawWanderer(c, x, y, m.direction[0], m.direction[1], t * 0.7, w.sd, gd ? CARRY_OF[gd] : "bundle")); lastTraders.push({ x, y, from: w.from.name, to: w.to.name, good: gd, cart: false, walker: w }); continue; }
      roadProp(x, y, fade, () => drawWanderer(c, x, y, m.direction[0], m.direction[1], t * (w.kind === "messenger" || w.kind === "letter" ? 1.4 : w.kind === "bridal" ? 0.6 : 0.8), w.sd, w.kind === "journeyman" ? "bundle" : null, w.kind === "bridal" ? (w.sex === "m" ? "groom" : "bride") : undefined), w.kind === "messenger" || w.kind === "letter");
      lastTraders.push({ x, y, from: w.from.name, to: w.to.name, good: null, cart: false, walker: w });
    }
    c.globalAlpha = 1;
  }
  c.globalAlpha = 1;

  // Saturday market: painted stalls on both verges of every open road's midpoint, 9–17 realm time
  if (marketOpen(now)) for (const l of links(seeds)) {
    const n = l.tiles.length; if (n < 7 || roadProgress(l, now) < 1) continue;
    // nearest dry stretch to the midpoint, so stalls never stand on a bridge or over water
    let m = -1;
    for (let d = 0, c0 = Math.floor(n / 2); d < n / 2 && m < 0; d++) for (const q of [c0 - d, c0 + d]) if (m < 0 && q >= 2 && q < n - 2 && !l.water[q - 2] && !l.water[q - 1] && !l.water[q] && !l.water[q + 1] && !l.water[q + 2]) m = q;
    if (m < 0) continue;
    const a = l.tiles[m - 1]!, b = l.tiles[m + 1]!, mid = l.tiles[m]!;
    const tx = b[0] - a[0], ty = b[1] - a[1], len = Math.hypot(tx, ty) || 1, px = -ty / len, py = tx / len;
    const stalls: [number, number, Seed][] = [[mid[0] + px * 1.6, mid[1] + py * 1.6, l.a], [mid[0] - px * 1.6, mid[1] - py * 1.6, l.b]];
    if (n >= 11) stalls.push([mid[0] + px * 1.6 + tx / len * 2, mid[1] + py * 1.6 + ty / len * 2, l.b], [mid[0] - px * 1.6 - tx / len * 2, mid[1] - py * 1.6 - ty / len * 2, l.a]);
    for (const [sx, sy, owner] of stalls) {
      const [X, Y] = iso(sx, sy);
      if (X < cs0x - 40 || X > cs1x + 40 || Y < cs0y - 40 || Y > cs1y + 40) continue;
      { const fl = hash(Math.round(sx), Math.round(sy), 77) < 0.5; roadProp(X, Y + TH / 2, 1, () => drawStall(c, X, Y + TH / 2, fl)); }
      const ex = tradeProfile(owner, now).exports;
      lastTraders.push({ x: X, y: Y, from: owner.name, to: (owner === l.a ? l.b : l.a).name, good: ex[0] ?? null, cart: false, stall: true });
    }
  }

  // ---- pass 2: standing objects in depth order ----
  const hunt = new Map<number, (() => void)[]>();
  // lodges and dens just off-screen still send hunters and game into view (no popping at the screen edge)
  if (detail) {
    const M = DEN_R + 2;
    for (let y = Math.max(0, y0 - M); y <= Math.min(MAP - 1, y1 + M); y++) for (let x = Math.max(0, x0 - M); x <= Math.min(MAP - 1, x1 + M); x++) {
      const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1;
      const st = structureAt(x, y, seeds, now);
      if (st?.kind === "lodge" && st.build === undefined) huntFigures(x, y, hunt, c, L);
      else if (!st && (inside || (x >= x0 - 4 && x <= x1 + 4 && y >= y0 - 4 && y <= y1 + 4))) wildFigures(x, y, hunt, c);
    }
  }
  const birds: [number, number, number, number][] = []; // gulls over the coast, crows over fields, drawn on top
  for (const { x, y, cx, cy, st } of tiles) {
    if (st?.kind === "avenue" && hash(x,y,92)>0.5) drawNature(c,"oak",cx+9,cy+2,0.22);
    if (!detail) {
      if (st?.build !== undefined) drawSite(c, st, cx, cy, t, false);
      else if (st && !FLAT.has(st.kind)) drawBuildingSprite(c, st.kind, cx, cy, st.v);
      continue; // forests and crags are baked into the ground chunks
    }
    if (!st && (sharp || nearTown(x, y))) natureAt(c, x, y, cx, cy, t, true);
    if (st?.kind === "coop" && st.build === undefined) drawHens(c, cx, cy, x * 31 + y);
    if (hash(x, y, 501) < 0.006) { const tr = st ? null : terrain(x, y); if (tr === "water" || (tr === "sand" && hash(x, y, 502) < 0.5)) birds.push([cx, cy, 1, x * 7 + y]); }
    if (st?.kind === "field" && hash(x, y, 503) < 0.02) birds.push([cx, cy, 0, x * 7 + y]);
    if (st?.flood) drawFlood(c, cx, cy, t, x * 7 + y);
    const fk = folk.get(y * MAP + x);
    const sdT = x * 1000 + y, flock = fk && st?.kind === "pasture" && st.build === undefined ? sheepSpots(sdT, st.v, now) : [];
    if (flock.length) sharedPasture.add(sdT); else sharedPasture.delete(sdT);
    if (st) drawStructure(c, st, cx, cy, x, y, t, L);
    for (const f of hunt.get(y * MAP + x) ?? []) f();
    for (const f of props.get(y * MAP + x) ?? []) f(cx, cy);
    const rb = robbers.get(y * MAP + x);
    if (rb) { const [px, py] = iso(rb[0], rb[1]); drawRobber(c, px, py, rb[2], t); vip.push(() => drawRobber(c, px, py, rb[2], t)); }
    if (st && (x === st.seed.x && y === st.seed.y) && isBlessed(st.seed, now)) drawFestive(c, cx, cy, t, x * 7 + y, L);
    if (signMap.has(y * MAP + x)) drawSignpost(c, cx, cy, x * 13 + y);
    { const pl = plantings.get(`${x},${y}`); if (pl && (pl.kind === "cherry" || pl.kind === "quince") && !st) drawRareTree(c, cx, cy, pl.kind, (now - Date.parse(pl.created_at)) / 3.6e6, now, t, x * 31 + y); }
    if (y * MAP + x === goalK) {
      // golden waymark where the player's mayor is heading
      const pu = 1 + Math.sin(now / 260) * 0.08;
      c.save(); c.globalAlpha = 0.85; c.strokeStyle = "#d9a520"; c.lineWidth = 1.6;
      c.beginPath(); c.ellipse(cx, cy, 9 * pu, 4.5 * pu, 0, 0, Math.PI * 2); c.stroke();
      c.globalAlpha = 0.35; c.fillStyle = "#f3d27a"; c.beginPath(); c.ellipse(cx, cy, 5, 2.5, 0, 0, Math.PI * 2); c.fill(); c.restore();
    }
    if (fk) {
      // personal space: people step aside for each other and for sheep; standing folk yield less than walkers
      type Item = Body & { q?: Pose; sh?: (typeof flock)[number] };
      const items: Item[] = fk.map((q) => { const [px, py] = iso(q.x, q.y); return { x: px, y: py, r: q.p.age < 15 ? FOOT.child : FOOT.adult, give: q.walking ? 1 : 0.5, q }; });
      for (const sh of flock) items.push({ x: cx + sh.m.dx, y: cy + sh.m.dy, r: FOOT.sheep, give: 0.15, sh });
      separate(items).sort((a, b) => a.y - b.y);
      for (const it of items) {
        if (it.sh) { const m = it.sh.m; drawSheep(c, it.x, it.y, m.flip, t + it.sh.k * 1700, m.walking, m.graze, m.sleeping); continue; }
        const q = it.q!, px = it.x, py = it.y;
        // golden glow under the player's own strolling mayor so he is easy to spot anywhere
        if (steer && q.p.role === "mayor" && q.act === "stroll" && q.p.seed.id === steer.sid) {
          const pu = 1 + Math.sin(t / 420) * 0.1;
          c.save();
          const g = c.createRadialGradient(px, py, 0.5, px, py, 9 * pu);
          g.addColorStop(0, "rgba(255,214,120,0.55)"); g.addColorStop(0.55, "rgba(243,210,122,0.28)"); g.addColorStop(1, "rgba(243,210,122,0)");
          c.fillStyle = g; c.beginPath(); c.ellipse(px, py, 9 * pu, 4.5 * pu, 0, 0, 7); c.fill();
          c.strokeStyle = "rgba(217,165,32,0.8)"; c.lineWidth = 0.7;
          c.beginPath(); c.ellipse(px, py, 6.5 * pu, 3.2 * pu, 0, 0, 7); c.stroke();
          c.restore();
        }
        const pk = `${q.p.seed.id}:${q.p.id}`, sel = peopleFocus.sel === pk, hov = peopleFocus.hover === pk;
        if (sel || hov) {
          const pulse = 0.5 + Math.sin(t / 300) * 0.15;
          c.fillStyle = `rgba(255,214,140,${sel ? 0.35 : pulse * 0.4})`; c.beginPath(); c.ellipse(px, py, 4, 2, 0, 0, 7); c.fill();
          c.strokeStyle = sel ? "rgba(255,226,160,0.95)" : "rgba(255,236,190,0.7)"; c.lineWidth = sel ? 0.8 : 0.6; c.stroke();
        }
        drawPerson(c, px, py, q, t, simpleFolk); lastPeople.push({ x: px, y: py, q });
        if (hov || sel || (steer && q.p.role === "mayor" && q.act === "stroll" && q.p.seed.id === steer.sid)) vip.push(() => drawPerson(c, px, py, q, t, simpleFolk));
        if (q.bucket) drawBucket(c, px, py, q, t);
        if (hov && !sel) {
          c.font = "600 4px system-ui, sans-serif"; c.textAlign = "center";
          const w = c.measureText(q.p.first).width + 3;
          c.fillStyle = "rgba(40,32,24,0.75)"; c.fillRect(px - w / 2, py - 11, w, 5);
          c.fillStyle = "#f6ecd6"; c.fillText(q.p.first, px, py - 7.3);
        }
      }
    }
    if (hover && hover[0] === x && hover[1] === y) {
      c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
      c.fillStyle = ghostOk === false ? "rgba(180,80,60,0.18)" : "rgba(255,240,200,0.14)"; c.fill();
    }
  }
  for (const [bx, by, gull, sd] of birds) drawBird(c, bx, by, gull === 1, sd);
  // parchment silhouette: key figures (own strolling mayor, hovered/selected folk, robbers, messengers) shine faintly through buildings in front
  if (vip.length) { c.save(); c.globalAlpha = 0.38; c.filter = "sepia(1) brightness(1.25)"; for (const f of vip) f(); c.restore(); }


  // border banners in both town colours and the carved border stone at the twin gate
  for (const l of links(seeds)) {
    if (!isTwin(l, seeds, now)) continue;
    const g = l.tiles[Math.floor(l.tiles.length / 2)]; if (!g) continue;
    const [gx, gy] = iso(g[0], g[1]);
    if (gx < cs0x - 40 || gx > cs1x + 40 || gy < cs0y - 40 || gy > cs1y + 40) continue;
    const pole = folkImage("bannerPole");
    for (const [k, sd] of [[-1, l.a], [1, l.b]] as const) {
      const cloth = bannerCloth(sd.hue); if (!pole || !cloth) continue;
      const h = 17, w = (h * pole.naturalWidth) / pole.naturalHeight, bx = gx + k * 8, by = gy + 1;
      const sway = Math.sin(t / 700 + k) * 0.04;
      c.fillStyle = "rgba(20,15,10,0.25)"; c.beginPath(); c.ellipse(bx + 1, by, 2, 0.6, 0, 0, 7); c.fill();
      c.save(); c.translate(bx, by); if (k < 0) c.scale(-1, 1);
      const ox = -w * 0.195;
      c.drawImage(pole, ox, -h, w, h);
      c.translate(ox + w * 0.2, -h * 0.85); c.transform(1, sway, 0, 1 + sway * 0.5, 0, 0);
      c.drawImage(cloth, -w * 0.2, -h * 0.15, w, h);
      c.restore();
    }
    prop(c, "stone", gx + 3.5, gy + 3, 3.4);
  }

  // ---- paper, light, labels (screen space) ----
  c.setTransform(1, 0, 0, 1, 0, 0);
  const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, "rgba(20,15,10,0)"); vg.addColorStop(1, "rgba(20,15,10,0.32)");
  c.fillStyle = vg; c.fillRect(0, 0, w, h);

  const night = skyTint(c, w, h);
  if (night > 0.02) {
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < L.length; i++) {
      const l = L[i];
      if (!l) continue;
      const sx = (l.x - cam.x) * z + w / 2, sy = (l.y - cam.y) * z + h / 2;
      const r = l.r * z * 2.2;
      if (sx < -r || sy < -r || sx > w + r || sy > h + r) continue;
      // Window light is painted from the actual image, never guessed wall coordinates.
      const fl = candleFlicker(t, l.building?.seed ?? l.x * 7 + l.y * 13);
      if (l.building) {
        c.save();
        c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z);
        drawBuildingNight(c, l.building.kind, l.x, l.y, l.building.variant, night * fl, l.building.flip);
        c.restore();
        continue;
      }
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(255,190,100,${0.7 * night * fl})`);
      g.addColorStop(0.25, `rgba(255,150,60,${0.32 * night * fl})`);
      g.addColorStop(1, "rgba(255,130,50,0)");
      c.fillStyle = g; c.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = "source-over";
  }

  c.font = `700 ${Math.round(22 * dpr)}px Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif CJK SC', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`; c.textAlign = "center";
  c.lineJoin = "round";
  for (const sd of seeds) {
    const [ix, iy] = iso(sd.x, sd.y);
    const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2 - 22 * z - 8 * dpr;
    c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(sd.name, sx, sy);
    c.fillStyle = INK; c.fillText(sd.name, sx, sy);
  }
  // twin towns get a joint ribbon label between them
  c.font = `600 ${Math.round(17 * dpr)}px Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif CJK SC', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`;
  for (const l of links(seeds)) {
    if (!isTwin(l, seeds, now)) continue;
    const [ix, iy] = iso((l.a.x + l.b.x) / 2, (l.a.y + l.b.y) / 2);
    const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2;
    const txt = `${l.a.name} ∞ ${l.b.name}`;
    c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(txt, sx, sy);
    c.fillStyle = hsl(20, 45, 38); c.fillText(txt, sx, sy);
  }
}
