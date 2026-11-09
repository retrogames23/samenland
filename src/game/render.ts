import { streetHouse } from "./street-layout";
import { weatherAt, wetness, snowiness, stormDark, setWeatherPreview, type WeatherKind } from "./weather";
import deerWalkUrl from "@/assets/sprites/deer-walk.webp";
import deerGrazeUrl from "@/assets/sprites/deer-graze.webp";
import boarWalkUrl from "@/assets/sprites/boar-walk.webp";
import hunterUrl from "@/assets/sprites/folk/hunter.webp";
import hunterWalkUrl from "@/assets/sprites/folk/hunter-walk.webp";
import hunterCarryUrl from "@/assets/sprites/folk/hunter-carry.webp";
import henUrl from "@/assets/sprites/hen.webp";
import gullUrl from "@/assets/sprites/gull.webp";
import crowUrl from "@/assets/sprites/crow.webp";
import { animalsSleeping, herdAt, farmAnimalsAt, farmAnimalPose, type FarmAnimal } from "./animals";
import gooseWalkUrl from "@/assets/sprites/goose-walk4.webp";
import goatWalkUrl from "@/assets/sprites/goat-walk4.webp";
import { drawParchment } from "./parchment";
import cowUrl from "@/assets/sprites/cow.webp";
import cowWalkUrl from "@/assets/sprites/cow-walk.webp";
import pigWalkUrl from "@/assets/sprites/pig-walk.webp";
import pigRootUrl from "@/assets/sprites/pig-root.webp";
import boarRootUrl from "@/assets/sprites/boar-root.webp";
import pondUrl from "@/assets/sprites/pond.webp";
import pondWinterUrl from "@/assets/sprites/pond-winter.webp";
import flowerTuftUrl from "@/assets/sprites/flower-tuft.webp";
import pastureCloverUrl from "@/assets/sprites/pasture-clover.webp";
import gardenCabbageUrl from "@/assets/sprites/garden-cabbage.webp";
import gardenLeekUrl from "@/assets/sprites/garden-leek.webp";
import gardenBeansUrl from "@/assets/sprites/garden-beans.webp";
import pastureTussockUrl from "@/assets/sprites/pasture-tussock.webp";
import pastureTroughUrl from "@/assets/sprites/pasture-trough.webp";
import maypoleUrl from "@/assets/sprites/maypole.webp";
import { worldHour, clock } from "./time";
import { forestExtra, forestShape } from "./forest-edge";
import { forestEdge as labEdge } from "./lab-ctl";
import { sheepSpots, separate, keepRight, FOOT, type Body } from "./space";
import { huntScene, lodgeDens, denOk, denBeast, denFate, startle, DEN_R, type Den, type Beast } from "./wildlife";
import { roadMotion, screenFacing } from "./motion";
import { walkersNow, walkProgress, marketOpen, type Walker } from "./wander";
import { houseLit, candleFlicker, lampStrength } from "./night";
import { sunTimes, nightLevel, duskGlow } from "./sun";
const sunNow = () => sunTimes(clock());
import { setArtTime, seasonalImage } from "./season-art";
import { seasonKey, seasonAt } from "./season";
import { treeKind } from "./biome";
import { drawBuildingSprite, drawBuildingNight, hasNightSprite, spriteBox, setSpriteTime, type HouseStyle } from "./building-sprites";
import { townCharacter } from "./character";
import { texture, textureAlt, drawNature, texSample, allTexturesReady, natureReady, setNatureTime, boatImage, sheepImage, sheepWalkImage, cartImage, cartBackImage, cartAxisImage, wagonImage, fieldRowImage, oxWalkImage, planksPattern, riderImage, stallImage, type Tex } from "./nature-sprites";
import { townOf, feastRoute, townPosesSmooth, sickHome, isHomeKind, mayorGoal, steeredMayor, remoteMayor, ownMayorSid, type Pose, type Person } from "./people";
import { fig, drawLegged, drawRobeWalk, frameShift, drawMantled, walkBob, gaitFrame, LEG_RATIO, type FigureConfig } from "./figure";
import { folkImage, walkSheet, standSprite, walkFramesOf, walkScaleOf, mayorWalk, workSheet, WALK_FRAMES, bannerCloth, JOB_WORK, mayorSheet, type FolkSprite } from "./folk-sprites";
import { titleOfSeed } from "./economy";
import { townRank, seatKindForRank } from "./rank";
import { sacksAt, breadOut, fishingNow, workshopCraft, workshopOpen } from "./crafts";
import { fieldLook, sheafDays, farmTask, type Look } from "./rotation";
import { wayTexture } from "./winter-way";
import { sheavesOn, woodpileLevel, frost, waySnow, strawOn, springWork, laundryOut, dryingSmoke } from "./seasonal-props";
import { pealPause } from "./time";
import { isRestDay, bonfireLit, christmasNight, feastOn, FEASTS, type FeastCode } from "./feasts";
import { oxWalk, martinWalk, herdsmanWalk, type Walk } from "./feast-walkers";
import { activeRaid, RAID_LEN, tileHits, type TileHit } from "./disasters";
import { wonders, type WonderKind } from "./wonders";
import { decorMap, seatTile, type RewardKey } from "./supporter";
import { dogStep, dogTile, dogSleepsOutside, type DogPose } from "./dog";
import dogTrotU from "@/assets/sprites/support/dog-trot.webp";
import dogSitU from "@/assets/sprites/support/dog-sit.webp";
import dogSleepU from "@/assets/sprites/support/dog-sleep.webp";
import { SUPPORT_ART, SUPPORT_W } from "./support-art";
import wreckU from "@/assets/sprites/wonders/wreck.webp";
import caveU from "@/assets/sprites/wonders/cave.webp";
import oakU from "@/assets/sprites/wonders/oak.webp";
import ruinU from "@/assets/sprites/wonders/ruin.webp";
import caravanU from "@/assets/sprites/wonders/caravan.webp";
import springU from "@/assets/sprites/wonders/spring.webp";
import { courtPieces, courtPoses, inCourt, courtSite, courtCenter, COURT_LAYOUT, COURT_STRIDE, GUARD_STRIDE, type CourtPiece, type CourtPose, type CourtRole } from "./court";
import castleU from "@/assets/sprites/court/castle.webp";
import stableU from "@/assets/sprites/court/stable.webp";
import fountainU from "@/assets/sprites/court/fountain.webp";
import pavilionU from "@/assets/sprites/court/pavilion.webp";
import parterreU from "@/assets/sprites/court/rosegarden.webp";
import princeU from "@/assets/sprites/court/prince.webp";
import princessU from "@/assets/sprites/court/princess.webp";
import princeStandU from "@/assets/sprites/court/prince-stand.webp";
import heraldU from "@/assets/sprites/court/herald.webp";
import guardU from "@/assets/sprites/court/guard.webp";
import gardenerU from "@/assets/sprites/court/gardener.webp";
import courtGroomU from "@/assets/sprites/court/groom.webp";
import { heraldVisit, HERALD_RIDE_S, type PrincelyRow } from "./princely";
import { SEAT_KINDS, onGeoChange, hash, vnoise, structureAt, soloSeeds, faceFlip, terrain, resourceAt, isWater, MAP, FLAT, FOOT2, links, roadProgress, isTwin, acreOf, ageHours, viewAge, radiusOf, reachOf, isBlessed, signTile, pondTiles, tradeProfile, complement, type TradeGood, type Signpost, type Planting, type Seed, type Structure, type Kind } from "./world";

export const TW = 32, TH = 16;
export const iso = (x: number, y: number) => [(x - y) * (TW / 2), (x + y) * (TH / 2)] as const;
export const toTile = (ix: number, iy: number) => {
  const a = ix / (TW / 2), b = iy / (TH / 2);
  return [Math.round((a + b) / 2), Math.round((b - a) / 2)] as const;
};
const propTileMemo = new Map<string, readonly [number, number]>();
export type Camera = { x: number; y: number; zoom: number };
type C = CanvasRenderingContext2D;
type Pt = [number, number];

const INK = "rgba(34,26,18,0.72)";
/** Base texture of a field tile under the three-field rotation. */
const LOOK_TEX: Record<Look, Tex> = { green: "crops", ripe: "wheat", stubble: "wheat", ploughed: "fertileAcker", fallow: "grass" };
/** Scythe only on ripe grain; gardens and pastures keep their usual work cycle. */
const farmReaps = (p: { work: [number, number] | null; seed: Seed }, now: number) => { const w = p.work!, st = structureAt(w[0], w[1], soloSeeds(p.seed), now); return st?.kind !== "field" || farmTask(fieldLook(acreOf(w[0], w[1], p.seed).id, now)) === "reap"; };
const fieldTex = (x: number, y: number, s: Seed, now: number): Tex => LOOK_TEX[fieldLook(acreOf(x, y, s).id, now)];
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
  const k = treeKind(v, conifer);
  if (drawNature(c, k, x, y, s, sway, hash(sd, 5, 5) > 0.5)) return;
  blob(c, x, y - 7 * s, 4 * s, hsl(100, 30, 40), sd, false);
}
let smokeWind = 0.3;
/** Soft drifting smoke haze: feathered puffs with no hard edge, fading as they rise. */
function smoke(c: C, x: number, y: number, t: number, sd: number, big = 1) {
  for (let i = 0; i < 5; i++) {
    const ph = (t / (3600 * big) + hash(sd, 1, 1) + i / 5) % 1;
    const wd = smokeWind;
    const px = x + ph * (2 + 14 * wd) * big + Math.sin(ph * 5 + sd) * 1.2, py = y - ph * (18 - 10 * wd) * big, r = (1.6 + ph * 4.5) * big;
    const a = 0.22 * Math.sin(Math.PI * Math.min(1, ph * 1.3));
    const g = c.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(214,210,202,${a})`); g.addColorStop(1, "rgba(214,210,202,0)");
    c.fillStyle = g; c.fillRect(px - r, py - r, r * 2, r * 2);
  }
}

/** win: a small window pane (rendered as a warm rectangle), otherwise an open flame/forge. */
export type Light = { x: number; y: number; r: number; building?: { kind: Kind; variant: number; seed: number; flip?: boolean; style?: HouseStyle | undefined } };

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
/** Signpost tile the UI just jumped to; a golden ring pulses there until `until`. */
export const signFocus: { k: number; until: number } = { k: -1, until: 0 };

/** Small shaded sheep (~hip height of a villager). Walking adds a trotting bob and nod; standing grazes. */
function drawSheep(c: C, x: number, y: number, flip: boolean, t: number, walking: boolean, graze: boolean, sleeping: boolean) {
  const sheet = walking ? sheepWalkImage() : null;
  const im = sheepImage(graze && !walking, sleeping); if (!im) return;
  const w = 3.2;
  // walking: real painted 4-frame leg cycle, clean cuts (no cross-fade = no ghost legs); body dips on each hoof fall
  const ph = walking ? t / 360 : 0, f0 = Math.floor(ph) & 3;
  const bob = sleeping ? 0 : walking ? Math.abs(Math.sin(ph * Math.PI)) * 0.18 : Math.sin(t / 2600) * 0.12;
  c.fillStyle = "rgba(30,36,22,0.32)"; c.beginPath(); c.ellipse(x, y, 1.7, 0.56, 0, 0, 7); c.fill();
  // zero-save: absolute matrix (world × translate × mirror), reset to the world matrix afterwards
  const B = c.getTransform(), fs = flip ? -1 : 1, ga = c.globalAlpha;
  c.setTransform(B.a * fs, B.b * fs, B.c, B.d, B.a * x + B.c * (y - bob) + B.e, B.b * x + B.d * (y - bob) + B.f);
  if (!c.imageSmoothingEnabled) c.imageSmoothingEnabled = true;
  if (sheet) {
    const fw = sheet.naturalWidth / 4, fh = sheet.naturalHeight, ww = w * 1.1, h = (ww * fh) / fw;
    c.drawImage(sheet, f0 * fw, 0, fw, fh, -ww / 2, -h, ww, h); // no torso re-centring: the head swing is real motion, shifting made it jerk
  } else {
    const h = (w * im.naturalHeight) / im.naturalWidth;
    c.drawImage(im, -w / 2, -h * 0.95, w, h);
  }
  c.globalAlpha = ga; c.setTransform(B);
}

const roofHue = (s: Structure, slate = false) => slate ? [215, 12, 46] : [12 + s.v * 18 + (s.seed.hue % 20) - 10, 48, 50];


/** Construction site: staked plot with materials → rising walls in a timber scaffold → finished. */
function drawSite(c: C, s: Structure, cx: number, cy: number, t: number, detail: boolean) {
  const p = s.build ?? 1, sd = Math.floor(s.v * 9973);
  const box = spriteBox(s.kind, s.v);
  const w = Math.min(FOOT2.has(s.kind) ? 60 : 30, (box?.w ?? 24) * 0.75), hw = w / 2, hh = w / 4;
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
    const corners: Pt[] = [[cx, cy - hh], [cx - hw, cy], [cx + hw, cy], [cx, cy + hh]];
    // hemp twine sags softly between the pegs (drawn first, the pegs stand over its knots)
    c.strokeStyle = "rgba(196,178,138,0.85)"; c.lineWidth = 0.5; c.lineCap = "round"; c.beginPath();
    const ring: Pt[] = [corners[1]!, corners[3]!, corners[2]!, corners[0]!];
    for (let i = 0; i < 4; i++) { const [ax, ay] = ring[i]!, [bx, by] = ring[(i + 1) % 4]!;
      c.moveTo(ax, ay - 3); c.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 - 2.3, bx, by - 3); }
    c.stroke();
    for (const [px, py] of corners) prop(c, "stake", px, py + 0.4, 1.5);
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
// ---- feast props: derived from feastOn + realm hour each frame, never stored ----
let fzNow: FeastCode | null = null, fzHour = 12;
/** Epiphany star singers this frame: person id -> place in the trio (0 carries the star). */
const fzStars = new Map<number, number>();
/** Door greenery: fir boughs at Christmas/Epiphany, birch "Maien" at Whitsun. */
function drawDoorGreen(c: C, x: number, y: number, birch: boolean, sd: number) {
  if (birch) {
    c.strokeStyle = "#e8e2d4"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.6, y - 8); c.stroke();
    c.strokeStyle = "#3a3026"; c.lineWidth = 0.3; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + 0.1 * i, y - 2 - i * 2); c.lineTo(x + 0.5 + 0.1 * i, y - 2 - i * 2); c.stroke(); }
    c.fillStyle = "rgba(128,170,72,0.9)";
    for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(x + 0.6 + (hash(sd, i, 81) - 0.5) * 4, y - 8 + hash(sd, i, 82) * 3, 1.3, 0.9, 0, 0, 7); c.fill(); }
  } else {
    c.fillStyle = "#2f4a2c";
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - 2.2 + i * 0.4, y - 1 - i * 1.6); c.lineTo(x, y - 4.2 - i * 1.6); c.lineTo(x + 2.2 - i * 0.4, y - 1 - i * 1.6); c.closePath(); c.fill(); }
    c.fillStyle = "#9a3328"; c.fillRect(x - 0.6, y - 1.4, 1.2, 0.9); // red woollen band
  }
}
/** Easter: a willow basket of red-dyed eggs set out on the square. */
function drawEggBasket(c: C, x: number, y: number, sd: number) {
  c.fillStyle = "rgba(30,20,10,0.25)"; c.beginPath(); c.ellipse(x, y + 0.5, 3.4, 1.2, 0, 0, 7); c.fill();
  c.fillStyle = "#8a6438"; c.beginPath(); c.ellipse(x, y - 0.6, 3, 1.4, 0, 0, Math.PI); c.lineTo(x - 3, y - 0.6); c.fill();
  const tint = ["#a8392c", "#c9a45a", "#a8392c", "#e8dcc0", "#7a4a8a"];
  for (let i = 0; i < 5; i++) { c.fillStyle = tint[Math.floor(hash(sd, i, 91) * tint.length)]!; c.beginPath(); c.ellipse(x - 2 + i, y - 1.2 - (i % 2) * 0.4, 0.6, 0.8, 0, 0, 7); c.fill(); }
  c.strokeStyle = "#5e4229"; c.lineWidth = 0.4; c.beginPath(); c.ellipse(x, y - 1, 3, 1.1, 0, 0, 7); c.stroke();
  c.beginPath(); c.arc(x, y - 1, 2.6, Math.PI, 0); c.stroke();
}
/** Masks, torches and the Corpus Christi canopy, drawn over the walking figure. */
function drawFeastKit(c: C, X: number, Y: number, q: Pose, t: number, figH?: number) {
  const f = fzNow; if (!f || !q.visible) return;
  const p = q.p, adult = p.job !== "child", h = fzHour;
  // designed for a ~10-unit figure; the sprite figure is 4.4 units tall
  const K = 0.45, top = Y - 4.4 / K;
  c.save(); c.translate(X, Y); c.scale(K, K); c.translate(-X, -Y);
  if (f === "shrovetide" && adult && h >= 15.5 && q.act === "leisure" && hash(p.id, 51, 3) < 0.7) {
    const hy = top + 1.6, tone = ["#e9dcc0", "#2a2420", "#a8392c", "#c9a45a"][Math.floor(hash(p.id, 52, 3) * 4)]!;
    c.fillStyle = tone; c.beginPath(); c.ellipse(X, hy, 1.15, 0.85, 0, 0, 7); c.fill();
    if (hash(p.id, 53, 3) < 0.5) { c.beginPath(); c.moveTo(X - 1, hy - 0.5); c.lineTo(X - 1.3, hy - 2); c.lineTo(X - 0.3, hy - 0.8); c.moveTo(X + 1, hy - 0.5); c.lineTo(X + 1.3, hy - 2); c.lineTo(X + 0.3, hy - 0.8); c.fill(); }
    c.fillStyle = "#14100c"; c.fillRect(X - 0.7, hy - 0.2, 0.4, 0.3); c.fillRect(X + 0.3, hy - 0.2, 0.4, 0.3);
  }
  const torchTime = ((f === "martinmas" || f === "candlemas") && h >= 16.8 && h < 21) || (f === "christmas" && (h >= 22 || h < 1.5));
  if (torchTime && adult && q.walking && hash(p.id, 54, 3) < 0.45) {
    const hx = X + 1.8, hy = Y - 4.6;
    c.strokeStyle = "#5e4229"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + 0.4, hy - 4); c.stroke();
    const fl = 1 + Math.sin(t / 90 + p.id) * 0.2;
    c.fillStyle = "rgba(255,190,90,0.18)"; c.beginPath(); c.arc(hx + 0.4, hy - 5, 4.5 * fl, 0, 7); c.fill();
    c.fillStyle = "#f2a63a"; c.beginPath(); c.ellipse(hx + 0.4, hy - 5, 0.8, 1.4 * fl, 0, 0, 7); c.fill();
    c.fillStyle = "#ffe7a8"; c.beginPath(); c.ellipse(hx + 0.4, hy - 4.8, 0.35, 0.7, 0, 0, 7); c.fill();
  }
  // Epiphany: paper crowns for the trio, the first one carries the star on a pole (it turns slowly)
  const si = f === "epiphany" ? fzStars.get(p.id) : undefined;
  if (si != null && h >= 10 && h < 17) {
    // children are shorter than the 4.4-unit adult: the crown sits on the child's head, not above it
    const hy = Y - 3.55 / K;
    const cr = folkImage("starCrown"); if (cr) { const w = 1.45, h = w * cr.naturalHeight / cr.naturalWidth; const head = figH != null ? Y + (figH - Y) / K : top; c.drawImage(cr, X - w / 2, head - h * 0.5, w, h); }
    if (si === 0) {
      const sp = folkImage("starPole"); if (sp) { const h = 9, w = h * sp.naturalWidth / sp.naturalHeight, sw = Math.sin(t / 700 + p.id) * 0.04;
        c.save(); c.translate(X + 1.7, Y - 2.6); c.rotate(0.12 + sw); c.drawImage(sp, -w / 2, -h, w, h); c.restore(); }
    }
  }
  // Shrovetide fools: a two-horned cap with jingling bells on top of the mask
  if (f === "shrovetide" && adult && h >= 15.5 && q.act === "leisure" && hash(p.id, 51, 3) < 0.7 && hash(p.id, 55, 3) < 0.6) {
    const hy = top + 0.4, bob = q.walking ? Math.sin(t / 120 + p.id) * 0.3 : 0;
    c.fillStyle = hash(p.id, 56, 3) < 0.5 ? "#a8392c" : "#3f5f3a"; c.beginPath(); c.moveTo(X - 1.2, hy); c.quadraticCurveTo(X - 2.2, hy - 1.6, X - 2.6, hy - 2.4 + bob); c.lineTo(X, hy - 1); c.lineTo(X + 2.6, hy - 2.4 - bob); c.quadraticCurveTo(X + 2.2, hy - 1.6, X + 1.2, hy); c.closePath(); c.fill();
    c.fillStyle = "#e3c04a"; c.beginPath(); c.arc(X - 2.6, hy - 2.4 + bob, 0.45, 0, 7); c.arc(X + 2.6, hy - 2.4 - bob, 0.45, 0, 7); c.fill();
  }
  // Martinmas lantern walk: the children carry little lanterns on sticks at dusk
  if (f === "martinmas" && !adult && h >= 16.7 && h < 19.4 && q.act === "stroll") {
    const lx = X + 2.2, ly = Y - 5.5, sw = Math.sin(t / 260 + p.id) * 0.35;
    c.strokeStyle = "#5e4229"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(X + 1.2, Y - 3.5); c.lineTo(lx, ly - 1.6); c.stroke();
    c.fillStyle = "rgba(255,190,90,0.2)"; c.beginPath(); c.arc(lx + sw, ly, 3.2, 0, 7); c.fill();
    c.fillStyle = "#f2b04a"; c.beginPath(); c.ellipse(lx + sw, ly, 0.9, 1.1, 0, 0, 7); c.fill();
    c.fillStyle = "#6b4a2a"; c.fillRect(lx + sw - 0.9, ly - 1.4, 1.8, 0.35);
  }
  if (f === "corpus" && p.job === "priest" && h >= 10.8 && h < 12.6 && q.act === "stroll") {
    const w = 5, cy = top - 2.2;
    c.strokeStyle = "#6f533b"; c.lineWidth = 0.4;
    for (const dx of [-w, w]) { c.beginPath(); c.moveTo(X + dx, Y - 1); c.lineTo(X + dx, cy); c.stroke(); }
    const sw = Math.sin(t / 400 + p.id) * 0.3;
    c.fillStyle = "#c9a45a"; c.beginPath(); c.moveTo(X - w - 0.5, cy); c.lineTo(X + w + 0.5, cy); c.lineTo(X + w + 0.5, cy + 1.6 + sw); c.lineTo(X - w - 0.5, cy + 1.6 - sw); c.closePath(); c.fill();
    c.fillStyle = "#e9dcc0"; c.fillRect(X - w - 0.5, cy - 0.8, 2 * w + 1, 0.9);
    c.strokeStyle = "#8a2a20"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(X - w, cy + 0.8); c.lineTo(X + w, cy + 0.8); c.stroke();
  }
  c.restore();
}
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
const floodMap = new Map<number, TileHit>();
/** Water depth 0..1 under a world point this frame (flooded tiles only). */
function floodDepth(x: number, y: number) { const h = floodMap.get(Math.round(y) * MAP + Math.round(x)); return h?.flood ? h.wet ?? 1 : 0; }
/** Flood water: brown sheet that rises and drains, current streaks, drifting brushwood and a soft edge. */
function drawFlood(c: C, cx: number, cy: number, t: number, sd: number, wet: number) {
  const p = P(cx, cy), e = 0.5 + wet * 0.12, a = (0.28 + wet * 0.4) + Math.sin(t / 1800 + sd) * 0.04;
  const q = [p(-e, -e), p(e, -e), p(e, e), p(-e, e)];
  const g = c.createRadialGradient(cx, cy, 1, cx, cy, 16);
  g.addColorStop(0, `rgba(104,96,70,${a})`); g.addColorStop(0.75, `rgba(96,104,88,${a * 0.85})`); g.addColorStop(1, "rgba(96,104,88,0)");
  c.fillStyle = g; c.beginPath(); c.moveTo(q[0]![0], q[0]![1]); for (const v of q) c.lineTo(v[0], v[1]); c.closePath(); c.fill();
  // current streaks drifting downstream
  c.strokeStyle = `rgba(225,228,210,${0.12 + wet * 0.14})`; c.lineWidth = 0.4;
  for (let i = 0; i < 3; i++) { const ph = (t / 5200 + hash(sd, i, 31)) % 1, x0 = cx - 9 + ph * 18, y0 = cy - 3 + hash(sd, i, 32) * 6 + ph * 2; c.globalAlpha = Math.sin(ph * Math.PI); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + 2, y0 - 0.6, x0 + 4.5, y0 + 0.2); c.stroke(); }
  c.globalAlpha = 1;
  // drifting brushwood and straw tufts
  if (wet > 0.4 && hash(sd, 1, 33) < 0.35) { const ph = (t / 14000 + hash(sd, 2, 33)) % 1, dx = cx - 7 + ph * 14, dy = cy + (hash(sd, 3, 33) - 0.5) * 4 + Math.sin(t / 700 + sd) * 0.3;
    c.globalAlpha = Math.sin(ph * Math.PI); const im = folkImage("floodDrift");
    if (im) { const w = 5.2, h = (w * im.naturalHeight) / im.naturalWidth; c.drawImage(im, dx - w / 2, dy - h * 0.6, w, h); }
    c.globalAlpha = 1; }
  c.fillStyle = `rgba(232,236,225,${0.14 + wet * 0.1})`; c.fillRect(cx - 4 + Math.sin(t / 900 + sd) * 2, cy - 0.5, 6, 0.5);
}
/** Silt the flood leaves on fields: grey-brown mud patches that fade over a few days. */
function drawSilt(c: C, cx: number, cy: number, sd: number, silt: number) {
  for (let i = 0; i < 3; i++) { c.fillStyle = `rgba(108,96,72,${0.3 * silt})`; c.beginPath(); c.ellipse(cx + (hash(sd, i, 41) - 0.5) * 12, cy + (hash(sd, i, 42) - 0.5) * 5, 3 + hash(sd, i, 43) * 3, 1.2 + hash(sd, i, 44), 0.1, 0, 7); c.fill(); }
}
/** Fascine wall: brushwood bundles and earth piled along the dry edge of the water. */
function drawLevee(c: C, cx: number, cy: number, sd: number, lv: number) {
  const im = folkImage("fascine"); if (!im) return;
  c.fillStyle = "rgba(25,20,10,0.22)"; c.beginPath(); c.ellipse(cx, cy + 0.8, 8.5 * Math.min(1, lv + 0.3), 1.8, 0, 0, 7); c.fill();
  // the wall grows bundle by bundle: reveal the painted segment from left to right
  const w = 17, h = (w * im.naturalHeight) / im.naturalWidth, f = Math.min(1, 0.25 + lv * 0.75), flip = hash(sd, 7, 52) < 0.5;
  c.save(); c.translate(cx, cy); if (flip) c.scale(-1, 1);
  c.drawImage(im, 0, 0, im.naturalWidth * f, im.naturalHeight, -w / 2, -h + 1.5, w * f, h); c.restore();
}
/** Robber: sneaks in from the forest edge, past the houses, and out again. */
function drawRobber(c: C, X: number, Y: number, flip: boolean, t: number) {
  const im = folkImage("robber"); if (!im) return;
  const h = 4.4, w = (h * im.naturalWidth) / im.naturalHeight;
  c.fillStyle = "rgba(25,20,10,0.22)"; c.beginPath(); c.ellipse(X + 0.6, Y + 0.1, w * 0.55, 0.6, 0.1, 0, 7); c.fill();
  // sneaking: crouched torso on the shared painted leg cycle, slow careful steps
  const ph = t / 260, legs = folkImage("legsM"), crouch = 0.04 + Math.abs(Math.sin(ph * Math.PI)) * 0.05;
  c.save(); c.translate(X, Y); if (flip) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  if (legs) {
    // one 2π leg cycle = four painted frames at the old 260 ms per frame; crouch moves legs and torso together
    drawLegged(c, im, 0, im.naturalWidth, im.naturalHeight, legs, 0, w, h, HIPS.robber!, crouch, crouch, ph * Math.PI / 2);
  } else c.drawImage(im, -w / 2, -h, w, h);
  c.restore();
}
const DECK_M = typeof DOMMatrix !== "undefined" ? new DOMMatrix() : (null as unknown as DOMMatrix); // reused per frame, no GC churn
export function robberAt(s: Seed, now: number): [number, number, boolean] | null {
  const r = activeRaid(s, now); if (!r) return null;
  const ph = (now - r.at) / RAID_LEN, R = Math.max(3, radiusOf(viewAge(s, renderSeeds, now)) * 0.8), a = hash(s.x, s.y, Math.floor(r.at / 864e5)) * 6.28;
  const d = ph < 0.5 ? R * (1 - ph * 2) + 1.2 : R * (ph - 0.5) * 2 + 1.2, b = a + (ph < 0.5 ? 0 : 0.9);
  return [s.x + Math.cos(b) * d, s.y + Math.sin(b) * d, ph >= 0.5];
}
const huntIms: Record<string, HTMLImageElement> = {};
const huntIm = (k: string, u: string) => { if (typeof Image === "undefined") return null; let i = huntIms[k]; if (!i) { i = new Image(); i.src = u; huntIms[k] = i; } return i.complete && i.naturalWidth ? i : null; };
/** Draw frame f (0-3) of a 4-frame sheet, feet at (X,Y), facing right unless flip. */
const bodyShift = new WeakMap<HTMLImageElement, number[]>();
/** Horizontal offset (fraction of frame width) that puts each walk frame's body on one axis.
 *  Measured from the alpha centroid of the upper 60 % (torso/head) so spreading legs don't pull it; cached per sheet. */
export function walkShift(im: HTMLImageElement, f: number): number {
  let v = bodyShift.get(im);
  if (!v) {
    v = [0, 0, 0, 0];
    try {
      const fw = Math.floor(im.naturalWidth / 4), fh = im.naturalHeight, cv = document.createElement("canvas");
      cv.width = fw * 4; cv.height = fh; const g = cv.getContext("2d", { willReadFrequently: true })!; g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, fw * 4, Math.floor(fh * 0.6)).data, rows = Math.floor(fh * 0.6), cs: number[] = [];
      for (let k = 0; k < 4; k++) { let sx = 0, sa = 0;
        for (let y = 0; y < rows; y += 2) for (let x = 0; x < fw; x++) { const a = d[(y * fw * 4 + k * fw + x) * 4 + 3] ?? 0; if (a > 40) { sx += x * a; sa += a; } }
        cs.push(sa ? sx / sa : fw / 2); }
      const m = cs.reduce((a, b) => a + b, 0) / 4; v = cs.map((x) => (m - x) / fw);
    } catch { /* not decodable yet / tainted: no shift */ }
    bodyShift.set(im, v);
  }
  return v[f & 3] ?? 0;
}
/** Clean 4-step cycle frame for pre-registered sheets (one 2π = two steps). */
const step4 = (ph: number) => Math.floor(((((ph / 6.2832) % 1) + 1) % 1) * 4) & 3;
function sheetFrame(c: C, im: HTMLImageElement, f: number, X: number, Y: number, h: number, flip: boolean, rot = 0, alpha = 1, centre = false, n = 4) {
  const fw = im.naturalWidth / n, w = (h * fw) / im.naturalHeight, ox = centre ? walkShift(im, f) * w : 0;
  c.save(); c.globalAlpha *= alpha; c.translate(X, Y); if (flip) c.scale(-1, 1); if (rot) c.rotate(rot);
  c.drawImage(im, (f % n) * fw, 0, fw, im.naturalHeight, -w / 2 + ox, -h, w, h); c.restore();
}
const shadow = (c: C, X: number, Y: number, r: number, a = 0.24) => { c.fillStyle = `rgba(25,20,10,${a})`; c.beginPath(); c.ellipse(X, Y, r, r * 0.3, 0, 0, 7); c.fill(); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => k * k * (3 - 2 * k);
/** Animal on the move: walk sheet indexed by distance travelled, grazing/alert sheet when standing. */
/** Walk sheets (boar, pig, deer, cow) are clean 4-phase cycles; rooting poses live in separate *-root sprites. */
const BOAR_GAIT = [0, 1, 2, 3];
const DEER_GAIT = [0, 1, 2, 3];
function drawBeast(c: C, walkIm: HTMLImageElement, standIm: HTMLImageElement | null, X: number, Y: number, h: number, flip: boolean, moving: number, dist: number, idle: number, alpha = 1, seq?: number[]) {
  shadow(c, X, Y, h * 0.42);
  if (moving > 0.02 || !standIm) {
    const ph = dist / 1.1, k = Math.floor(ph), f = seq ? (seq[k & 3] ?? 0) : k & 3, bob = Math.abs(Math.sin(ph * Math.PI)) * h * 0.02;
    sheetFrame(c, walkIm, f, X, Y - bob, h, flip, 0, alpha); // hooves stay put: no head-centroid shifting
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
    const [X, Y] = iso(b.x, b.y), h = b.boar ? 2.7 : 4.9, n = renderNow + b.x * 997;
    if (b.state === "dead") { shadow(c, X, Y, h * 0.5); sheetFrame(c, dg, 3, X, Y, h, !b.flip, b.fall * 1.45 * (b.flip ? 1 : -1)); return; }
    if (b.boar && b.state === "root") { shadow(c, X, Y, h * 0.5); sheetFrame(c, huntIm("br", boarRootUrl) ?? bw, 0, X, Y - (Math.floor(n / 500) & 1) * 0.08, h, b.flip, 0, b.alpha, false, 1); return; }
    const moving = b.state === "walk" || b.state === "flee" ? 1 : 0;
    const idle = Math.floor(n / 1500) % 8 < 5 ? (Math.floor(n / 650) & 1) : 2;
    drawBeast(c, b.boar ? bw : dw, b.boar ? null : dg, X, Y, h, b.flip, moving, b.state === "flee" ? n / 170 : b.dist + n / 2000, idle, b.alpha, b.boar ? BOAR_GAIT : DEER_GAIT);
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
    const [X, Y] = iso(hp.x, hp.y);
    shadow(c, X, Y, 1.6, 0.3);
    // walking legs: real 4-phase sheets (crossbow shouldered / deer carried); kneel and idle keep the pose sheet
    const ws = hp.walk ? huntIm(hp.frame === 3 ? "huc" : "huw", hp.frame === 3 ? hunterCarryUrl : hunterWalkUrl) : null;
    if (ws) { const k = Math.floor(renderNow / 300); sheetFrame(c, ws, k & 3, X, Y - (k & 1 ? 0 : 0.08), 5.4, hp.flip); }
    else sheetFrame(c, hu, hp.frame, X, Y, 5.4, hp.flip);
  });
  const bo = sc.bolt;
  if (bo) put(bo.to[0], bo.to[1], () => {
    const [sx, sy] = iso(bo.from[0], bo.from[1]), [ex, ey] = iso(bo.to[0], bo.to[1]);
    const bx = lerp(sx, ex, bo.r), by = lerp(sy - 3, ey - 3.5, bo.r), dir = Math.sign(ex - sx) || 1;
    c.strokeStyle = "rgba(60,40,22,0.9)"; c.lineWidth = 0.18; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - dir * 1.1, by); c.stroke();
  });
}
/** Static pasture fence paths per tile (rails, post shadow, post, post highlight). */
const fenceCache = new Map<number, Path2D[]>();
/** Visual house style from the town terrain character; plains keep the classic art. */
const houseStyle = (s: Structure): HouseStyle | undefined => { const m = townCharacter(s.seed).main; return m === "grain" ? undefined : m; };
function drawStructure(c: C, s: Structure, cx: number, cy: number, x: number, y: number, t: number, L: Light[]) {
  const behind = s.build === undefined && isHomeKind(s.kind);
  // firewood is stacked against the north wall, so the house in front hides most of it
  if (behind) { const lv = woodpileLevel(renderNow), im = folkImage("woodpile"); if (im && hash(x, y, 81) < 0.7) {
    const w = 9, h = (w * im.naturalHeight) / im.naturalWidth, vis = 0.45 + 0.55 * lv, sx = cx - 7, sy = cy - 4;
    c.drawImage(im, 0, im.naturalHeight * (1 - vis), im.naturalWidth, im.naturalHeight * vis, sx - w / 2, sy - h * vis, w, h * vis); } }
  drawStructureBase(c, s, cx, cy, x, y, t, L);
  if (s.build === undefined) seasonalTrace(c, s, cx, cy, x, y, t, L);
}
/** Seasonal and craft traces in front of a finished structure (pure from tile, calendar and clock). */
function seasonalTrace(c: C, s: Structure, cx: number, cy: number, x: number, y: number, t: number, L: Light[]) {
  const sd = x * 1000 + y, now = renderNow, k = s.kind;
  if (k === "field") { const n = sheafDays(acreOf(x, y, s.seed).id, now) ? sheavesOn(sd, now) || 1 : 0; for (let i = 0; i < n; i++) prop(c, "sheaf", cx + (hash(x, y, 90 + i) - 0.5) * 12, cy + (hash(x, y, 95 + i) - 0.5) * 5, 3.2); return; }
  if (k === "garden" && springWork(now) && hash(x, y, 82) < 0.5) { prop(c, "wattle", cx + 5, cy + 3, 8); return; }
  if (k === "pasture" && frost(now) && hash(x, y, 83) < 0.3) { prop(c, "iceTrough", cx + 2, cy + 1, 6); return; }
  if (k === "well" && frost(now)) { prop(c, "iceTrough", cx + 6, cy + 3, 5); return; }
  if (isHomeKind(k)) {
    if (laundryOut(sd, now) && hash(x, y, 84) < 0.5) prop(c, "laundry", cx + 8, cy + 4, 8);
    if (strawOn(now) && hash(x, y, 85) < 0.18) prop(c, "strawWrap", cx - 9, cy + 5, 3.4);
    if (dryingSmoke(sd, now) && hash(x, y, 86) < 0.4) smoke(c, cx - 3, cy - 16, t, sd, 0.45);
    return;
  }
  if (k === "workshop" || k === "guildhall" || k === "manufactory") {
    if (!workshopOpen(localHour(), isRestDay(now))) return;
    const ox = cx + 8, oy = cy + 4;
    if (workshopCraft(sd) === "cooper") {
      prop(c, "cooper", ox, oy, 7);
      L.push({ x: ox - 1, y: oy - 1, r: 6 }); smoke(c, ox - 1, oy - 4, t, sd, 0.3);
    } else {
      prop(c, "loom", ox, oy, 6.5);
      // the beater swings against the cloth in the weaver's rhythm
      const im = folkImage("loom"); if (im) { const w = 6.5, h = (w * im.naturalHeight) / im.naturalWidth, by = oy - h * 0.85 + h * 0.45, sw = Math.sin(t / 380 + sd) * 0.5;
        c.strokeStyle = "rgba(70,48,28,0.9)"; c.lineWidth = 0.35; c.beginPath(); c.moveTo(ox - w * 0.25 + sw, by); c.lineTo(ox + w * 0.2 + sw, by - h * 0.12); c.stroke(); }
    }
  }
}
/** Murky mirror image of a house standing in flood water: flipped at its base, squashed, rippling, clipped to the tile. */
function drawReflection(c: C, s: Structure, cx: number, cy: number, t: number, flip: boolean, style: HouseStyle | undefined) {
  const b = spriteBox(s.kind, s.v, style); if (!b) return;
  const wet = s.wet ?? 1, by = cy + b.base, h = Math.min(b.h, 34) * 0.42;
  c.save();
  c.beginPath(); c.ellipse(cx, by + h * 0.45, b.w * 0.55, h * 0.6, 0, 0, 7); c.clip();
  c.globalAlpha = 0.22 * wet;
  const sw = Math.sin(t / 650 + cx * 0.3) * 0.04;
  c.transform(1, 0, sw, -0.42, -sw * by, by * 1.42 + 0.6);
  drawBuildingSprite(c, s.kind, cx, cy, s.v, 1, flip, style);
  c.restore();
  // ripple bands breaking up the mirror
  c.strokeStyle = `rgba(225,228,212,${0.18 * wet})`; c.lineWidth = 0.3;
  for (let i = 0; i < 3; i++) { const yy = by + 1 + i * 1.6, o = Math.sin(t / 900 + i * 2 + cx) * 1.5; c.beginPath(); c.moveTo(cx - b.w * 0.35 + o, yy); c.lineTo(cx + b.w * 0.3 + o, yy); c.stroke(); }
}
const GROUNDED = new Set<string>(["well"]);
/** Depth-correct night window layer for the current frame (null by day). */
let lit: { cv: HTMLCanvasElement; c: CanvasRenderingContext2D } | null = null;
let litStore: { cv: HTMLCanvasElement; c: CanvasRenderingContext2D } | null = null;
function beginLit(w: number, h: number, on: boolean) {
  lit = null;
  if (!on || typeof document === "undefined") return;
  if (!litStore) { const cv = document.createElement("canvas"); const cc = cv.getContext("2d"); if (!cc) return; litStore = { cv, c: cc }; }
  const L = litStore;
  if (L.cv.width !== w || L.cv.height !== h) { L.cv.width = w; L.cv.height = h; }
  L.c.setTransform(1, 0, 0, 1, 0, 0); L.c.globalCompositeOperation = "source-over"; L.c.clearRect(0, 0, w, h);
  lit = L;
}
/** Player towns: the mayor's seat is painted by the real settlement rank (townRank), never by elapsed time. Paint-only. */
const seatRankMemo = new Map<string, { r: number; at: number }>();
function seatByRank(s: Structure): Structure {
  if (!s.seed.user_id || s.build !== undefined || !SEAT_KINDS.includes(s.kind)) return s;
  let m = seatRankMemo.get(s.seed.id);
  if (!m || Math.abs(renderNow - m.at) > 60_000) { m = { r: townRank(s.seed, renderSeeds, renderNow), at: renderNow }; seatRankMemo.set(s.seed.id, m); }
  const kind = seatKindForRank(m.r);
  return kind === s.kind ? s : { ...s, kind };
}
function drawStructureBase(c: C, s: Structure, cx: number, cy: number, x: number, y: number, t: number, L: Light[]) {
  s = seatByRank(s);
  const sd = x * 1000 + y;
  // 2×2 ensembles stand on their front tile: centre the sprite over all four tiles
  if (FOOT2.has(s.kind)) cy -= TH / 2;
  if (SOUND_KINDS.has(s.kind) && lastSources.length < 200) lastSources.push({ x: cx, y: cy, k: s.build !== undefined ? "site" : s.kind });
  else if (s.build !== undefined && lastSources.length < 200) lastSources.push({ x: cx, y: cy, k: "site" });
  // town bell: from the Kleinstadt seat (Amtshaus with bell gable) on, plus belfry, church and cathedral
  if (s.build === undefined && BELL_KINDS.has(s.kind) && lastSources.length < 200) lastSources.push({ x: cx, y: cy, k: "bell" });
  if (s.build !== undefined) { drawSite(c, s, cx, cy, t, true); return; }
  const flip = faceFlip(s.kind, x, y, (i, j) => { const k = structureAt(i, j, renderSeeds, renderNow)?.kind; return !!k && PATHLIKE.has(k); });
  const style = houseStyle(s);
  // free-standing objects without a plinth get a soft ground-contact shadow so they never look like floating
  if (GROUNDED.has(s.kind)) { c.fillStyle = "rgba(30,22,12,0.28)"; c.beginPath(); c.ellipse(cx + 0.5, cy + 3.2, 3.6, 1.5, 0, 0, 7); c.fill(); c.fillStyle = "rgba(30,22,12,0.14)"; c.beginPath(); c.ellipse(cx + 1.4, cy + 3.6, 4.6, 2, 0, 0, 7); c.fill(); }
  // plinthless thatched hut: soft contact shadow along the foundation, cast down-right (light from upper left)
  if (s.kind === "hut" && !s.flood) { c.fillStyle = "rgba(30,22,12,0.22)"; c.beginPath(); c.ellipse(cx + 0.8, cy + 3.4, 9.6, 3.2, 0, 0, 7); c.fill(); c.fillStyle = "rgba(30,22,12,0.12)"; c.beginPath(); c.ellipse(cx + 2, cy + 4.2, 11, 3.8, 0, 0, 7); c.fill(); }
  if (s.flood && !FLAT.has(s.kind)) drawReflection(c, s, cx, cy, t, flip, style);
  if (drawBuildingSprite(c, s.kind, cx, cy, s.v, 1, flip, style)) {
    // window light lives on its own layer: every building drawn later (in front) erases the lights behind it
    if (lit) { lit.c.setTransform(c.getTransform()); lit.c.globalCompositeOperation = "destination-out"; drawBuildingSprite(lit.c, s.kind, cx, cy, s.v, 1, flip, style); }
    if (s.kind === "campfire") {
      L.push({x:cx,y:cy-3,r:7}); smoke(c,cx,cy-6,t,sd,0.25);
    }
    // plain thatched hut: hearth smoke rises animated from the roof hole (no chimney, painted smoke removed)
    if (s.kind === "hut" && !style && !s.fire) smoke(c, cx + (flip ? 0.33 : -0.33), cy - 4.6, t, sd, 0.35);
    if (s.fire) drawFire(c, cx, cy, t, sd, L);
    if (hasNightSprite(s.kind) && (houseLit(s.kind, sd, localHour(), sunNow().rise, sunNow().set) || (stormDark(renderNow) > 0.4 && STORM_LIT.has(s.kind) && localHour() >= 7 && localHour() < 20) || (isHomeKind(s.kind) && (sickLit(x, y) || christmasNight(renderNow))))) {
      if (lit) { lit.c.globalCompositeOperation = "source-over"; drawBuildingNight(lit.c, s.kind, cx, cy, s.v, candleFlicker(t, sd) * lampStrength(s.kind), flip, style); }
    }
    if (s.kind === "mill" || s.kind === "watermill") {
      // flour sacks pile up by the door through the workday (stack sprite revealed from the bottom)
      const n = sacksAt(localHour(), isRestDay(renderNow)), im = folkImage("flourSacks");
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
      const lp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      // wattle fence only along the outer edge of the paddock: posts with sagging rails, never a tile grid
      const isPas = (i: number, j: number) => structureAt(x + i, y + j, renderSeeds, renderNow)?.kind === "pasture";
      const edges: [number, number, Pt, Pt, Pt, Pt][] = [
        [0, 1, p(-0.5, 0.5), p(0.5, 0.5), p(-0.5, 0.5, 1.6), p(0.5, 0.5, 1.6)],
        [1, 0, p(0.5, -0.5), p(0.5, 0.5), p(0.5, -0.5, 1.6), p(0.5, 0.5, 1.6)],
      ];
      // fence geometry is static: built once per tile + open-edge mask as Path2D, then four strokes per tile
      const mask = (isPas(0, 1) ? 0 : 1) | (isPas(1, 0) ? 0 : 2);
      if (mask) {
        const fkey = (y * MAP + x) * 4 + mask;
        let fp = fenceCache.get(fkey);
        if (!fp) {
          fp = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
          for (const [ei, [, , a, b]] of edges.entries()) {
            if (!(mask & (1 << ei))) continue;
            // Schafhürden (c. 1500): dense hazel/willow wattle woven round stakes, no sawn rails
            const posts = 3, rods = 7;
            for (let n = 0; n < posts; n++) {
              const f0 = n / posts, f1 = (n + 1) / posts, tilt = (hash(sd, n, 79) - 0.5) * 0.15;
              for (let r = 0; r < rods; r++) {
                const hgt = 0.15 + (r / (rods - 1)) * 1.25 + (hash(sd, n * 9 + r, 76) - 0.5) * 0.08 + tilt * (r / rods);
                // woven over-under: each rod bows out between sail stakes, alternating phase per row
                const ph = (r + n) & 1 ? 1 : -1, sag = 0.06 + hash(sd, n * 9 + r, 77) * 0.06;
                const A = lp(a, b, f0), B = lp(a, b, f1), Q1 = lp(a, b, f0 + (f1 - f0) / 3), Q2 = lp(a, b, f0 + (2 * (f1 - f0)) / 3);
                fp[0]!.moveTo(A[0], A[1] - hgt);
                fp[0]!.bezierCurveTo(Q1[0], Q1[1] - hgt + sag * ph, Q2[0], Q2[1] - hgt - sag * ph, B[0], B[1] - hgt);
              }
              // thin intermediate sail stakes the rods are woven round
              for (const f of [1 / 3, 2 / 3]) { const S = lp(a, b, f0 + (f1 - f0) * f); fp[3]!.moveTo(S[0], S[1] - 0.05); fp[3]!.lineTo(S[0], S[1] - 1.45); }
            }
            for (let n = 0; n <= posts; n++) {
              const A = lp(a, b, n / posts), lean = (hash(sd, n, 78) - 0.5) * 0.3;
              fp[1]!.moveTo(A[0], A[1]); fp[1]!.lineTo(A[0] + 0.6, A[1] + 0.2);
              fp[2]!.moveTo(A[0], A[1]); fp[2]!.lineTo(A[0] + lean, A[1] - 1.9);
            }
          }
          fenceCache.set(fkey, fp); if (fenceCache.size > 3000) fenceCache.clear();
        }
        c.lineCap = "round";
        c.strokeStyle = "rgba(40,28,16,0.25)"; c.lineWidth = 0.5; c.stroke(fp[1]!);
        c.strokeStyle = "rgba(96,72,46,1)"; c.lineWidth = 0.14; c.stroke(fp[3]!);
        c.strokeStyle = "rgba(108,84,56,0.95)"; c.lineWidth = 0.2; c.stroke(fp[0]!);
        c.strokeStyle = "rgba(150,122,88,0.55)"; c.lineWidth = 0.07; c.stroke(fp[0]!);
        c.strokeStyle = "rgba(74,52,32,1)"; c.lineWidth = 0.4; c.stroke(fp[2]!);
      }
      // with villagers on the tile, sheep and people are resolved and depth-sorted together in pass 2
      if (v > 0.35 && herdAt(x, y) === "cow") drawCow(c, cx, cy, renderNow, sd, 1);
      else if (v > 0.35 && !sharedPasture.has(sd)) {
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
const PATHLIKE: ReadonlySet<Kind> = new Set(["path", "street", "square", "well", "market", "road", "bridge", "avenue"]);

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
  // water crossings: road meets the bridge exactly at its abutments (raw bank tile centres, as drawBridgeSpan
  // uses) and traffic runs straight along the deck between them, never beside it through the river
  const wet = (i: number) => isWater(terrain(l.tiles[i]![0], l.tiles[i]![1]));
  for (let i = 0; i < raw.length; i++) {
    if (!wet(i)) continue;
    let j = i; while (j + 1 < raw.length && wet(j + 1)) j++;
    const s0 = Math.max(0, i - 1), s1 = Math.min(raw.length - 1, j + 1), A = raw[s0]!, B = raw[s1]!;
    for (let k = s0; k <= s1; k++) { const f = s1 === s0 ? 0 : (k - s0) / (s1 - s0); out[k] = [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f]; }
    // ease the approach on each bank so the band bends into the abutment instead of kinking
    for (const [k, p] of [[s0 - 1, A], [s1 + 1, B]] as const) if (k >= 0 && k < raw.length && !wet(k)) out[k] = [(out[k]![0] + p[0]) / 2, (out[k]![1] + p[1]) / 2];
    i = j;
  }
  smoothCache.set(l, out); return out;
}
const boxCache = new WeakMap<object, [number, number, number, number]>();
const spanCache = new WeakMap<object, [Pt, Pt][]>();
/** Deck height above the road at screen point (x, y) if it lies on one of the link's bridges (same arch as drawBridgeSpan), else null. */
function deckLift(l: { tiles: [number, number][] }, x: number, y: number): number | null {
  let spans = spanCache.get(l);
  if (!spans) {
    spans = []; const n = l.tiles.length, wet = (i: number) => isWater(terrain(l.tiles[i]![0], l.tiles[i]![1]));
    for (let i = 0; i < n; i++) { if (!wet(i)) continue; let j = i; while (j + 1 < n && wet(j + 1)) j++; const A = l.tiles[Math.max(0, i - 1)]!, B = l.tiles[Math.min(n - 1, j + 1)]!; spans.push([iso(A[0], A[1]) as unknown as Pt, iso(B[0], B[1]) as unknown as Pt]); i = j; }
    spanCache.set(l, spans);
  }
  for (const [A, B] of spans) {
    const dx = B[0] - A[0], dy = B[1] - A[1], len2 = dx * dx + dy * dy || 1, f = ((x - A[0]) * dx + (y - A[1]) * dy) / len2;
    if (f < -0.02 || f > 1.02) continue;
    if (Math.hypot(A[0] + dx * f - x, A[1] + dy * f - y) > 6) continue;
    const rise = Math.min(1.8, 0.4 + Math.sqrt(len2) * 0.012), ff = Math.max(0, Math.min(1, f));
    return Math.min(1, ff * 12, (1 - ff) * 12) * (1 + rise * Math.sin(Math.PI * ff));
  }
  return null;
}
/** Chaikin corner cutting (endpoints kept): turns the averaged road polyline into a soft curve. */
export function chaikin(p: Pt[], rounds = 2): Pt[] {
  let a = p;
  for (let r = 0; r < rounds && a.length > 2; r++) {
    const o: Pt[] = [a[0]!];
    for (let i = 0; i + 1 < a.length; i++) {
      const [x0, y0] = a[i]!, [x1, y1] = a[i + 1]!;
      o.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    o.push(a[a.length - 1]!); a = o;
  }
  return a;
}
type Ribbon = { path: Path2D; tufts: [number, number, number][]; blades?: Path2D; pebbles?: Path2D; rutA?: Path2D; rutB?: Path2D };
// deterministic depth order with hysteresis: near-ties keep last frame's order, exact ties break by id
const DEPTH_HYST = 0.75;
const depthWas = new Map<string, number>();
export function sortDepth<T extends { x: number; y: number }>(items: T[], id: (t: T) => string): T[] {
  const keyed = items.map((it) => { const k = id(it), was = depthWas.get(k); const y = was !== undefined && Math.abs(was - it.y) < DEPTH_HYST ? was : it.y; depthWas.set(k, y); return { it, k, y }; });
  keyed.sort((a, b) => a.y - b.y || (a.k < b.k ? -1 : a.k > b.k ? 1 : 0));
  for (let i = 0; i < keyed.length; i++) items[i] = keyed[i]!.it;
  if (depthWas.size > 4000) depthWas.clear();
  return items;
}
const runMemo = new WeakMap<object, { seeds: Seed[]; tick: number; runs: [number, number][]; key: string }>();
const ribbonCache = new WeakMap<object, Map<string, Ribbon>>();

/** Built, dry stretches of a trade road drawn as one smooth band with frayed verges, instead of per-tile strokes. */
function drawRoadRibbon(c: C, l: { tiles: [number, number][] }, seeds: Seed[], now: number) {
  const pts = smoothRoad(l), n = l.tiles.length;
  const on = (i: number) => { const st = structureAt(l.tiles[i]![0], l.tiles[i]![1], seeds, now); return st?.kind === "road"; };
  const joins = (i: number) => { if (i < 0 || i >= n) return false; const st = structureAt(l.tiles[i]![0], l.tiles[i]![1], seeds, now); return !!st && PATHLIKE.has(st.kind); };
  // the built runs only change with the cache tick: sample the tiles once per minute, not every frame
  const rk = Math.floor(now / 60000), rm = runMemo.get(l);
  let runs: [number, number][], key: string;
  if (rm && rm.seeds === seeds && rm.tick === rk) { runs = rm.runs; key = rm.key; }
  else {
    runs = [];
    for (let i = 0; i < n; i++) {
      if (!on(i)) continue;
      let j = i; while (j + 1 < n && on(j + 1)) j++;
      // reach half into the joining street / bridge so the band meets it without a gap
      runs.push([joins(i - 1) ? i - 1 : i, joins(j + 1) ? j + 1 : j]); i = j;
    }
    key = runs.map((r) => r.join("-")).join(",");
    runMemo.set(l, { seeds, tick: rk, runs, key });
  }
  if (!runs.length) return;
  let byKey = ribbonCache.get(l); if (!byKey) ribbonCache.set(l, (byKey = new Map()));
  let rb = byKey.get(key);
  if (!rb) {
    const path = new Path2D(), tufts: [number, number, number][] = [], rutA = new Path2D(), rutB = new Path2D();
    for (const [a, b] of runs) {
      let seg = pts.slice(a, b + 1);
      if (seg.length === 1) { const [x, y] = seg[0]!; path.moveTo(x + 0.01, y); path.lineTo(x, y); continue; }
      // run ends that join a street/bridge stop halfway, at the shared tile edge
      if (a < b && joins(a) && !on(a)) seg[0] = [(seg[0]![0] + seg[1]![0]) / 2, (seg[0]![1] + seg[1]![1]) / 2];
      const m = seg.length - 1;
      if (a < b && joins(b) && !on(b)) seg[m] = [(seg[m]![0] + seg[m - 1]![0]) / 2, (seg[m]![1] + seg[m - 1]![1]) / 2];
      seg = chaikin(seg);
      path.moveTo(seg[0]![0], seg[0]![1]);
      for (let k = 1; k < seg.length; k++) path.lineTo(seg[k]![0], seg[k]![1]);
      // grass tufts and pebbles scattered along both verges (pure hash, same on every client)
      for (let k = 1; k < seg.length; k += 3) {
        const [x0, y0] = seg[k - 1]!, [x1, y1] = seg[k]!, d = Math.hypot(x1 - x0, y1 - y0) || 1;
        const nx = -(y1 - y0) / d, ny = (x1 - x0) / d, hx = Math.round(x1 * 3), hy = Math.round(y1 * 3);
        const side = hash(hx, hy, 611) < 0.5 ? -1 : 1, off = 2.5 + hash(hx, hy, 612) * 0.9;
        tufts.push([x1 + nx * off * side, y1 + ny * off * side * 0.6, hash(hx, hy, 613)]);
      }
      // winter wheel tracks: two centre-lines offset either side of the band, slowly wandering;
      // they are only guides for a noise-masked material stroke, never drawn as lines themselves
      for (const [side, ref] of [[-1, rutA], [1, rutB]] as [number, Path2D][]) {
        for (let k = 0; k < seg.length; k++) {
          const a = seg[Math.max(0, k - 1)]!, b = seg[Math.min(seg.length - 1, k + 1)]!, d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          const nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d, [px, py] = seg[k]!;
          const o = side * (0.95 + (hash(Math.round(px * 2), Math.round(py * 2), 720 + side) - 0.5) * 0.35);
          if (k === 0) ref.moveTo(px + nx * o, py + ny * o * 0.6); else ref.lineTo(px + nx * o, py + ny * o * 0.6);
        }
      }
    }
    rb = { path, tufts, rutA, rutB };
    byKey.set(key, rb);
    if (byKey.size > 250) byKey.delete(byKey.keys().next().value!);
  }
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  const ws = waySnow(now), dirt = texture(c, "dirt", 0, !!ws) ?? "#c49e6c";
  if (ws) {
    // winter trade road: one continuous band of packed grey snow (procedural texture, ragged noise verge);
    // the ruts are only a change of material inside it, slush/earth and ice show in irregular patches
    const fr = wayTexture(c, "fringe"), pk = wayTexture(c, "pack"), rt = wayTexture(c, "rut"), sl = wayTexture(c, "slush"), ic = wayTexture(c, "ice");
    const fresh = ws === 3 ? 0.45 : ws === 2 ? 0.75 : 1;
    if (fr && pk && rt && sl && ic) {
      c.strokeStyle = fr; c.globalAlpha = 0.85 * fresh + 0.1; c.lineWidth = 7.6; c.stroke(rb.path);
      c.strokeStyle = pk; c.globalAlpha = 0.85 * fresh + 0.15; c.lineWidth = 5.6; c.stroke(rb.path);
      c.strokeStyle = sl; c.lineWidth = 4.4; c.globalAlpha = (ws === 1 ? 1 : ws === 2 ? 0.8 : 0.45); c.stroke(rb.path);
      c.strokeStyle = rt; c.lineWidth = 1.6; c.globalAlpha = 0.9 * fresh; c.stroke(rb.rutA!);
      c.lineWidth = 1.4; c.globalAlpha = 0.75 * fresh; c.stroke(rb.rutB!);
      c.strokeStyle = ic; c.lineWidth = 4.4; c.globalAlpha = 0.4; c.stroke(rb.path);
      c.globalAlpha = 1;
    }
  } else {
    c.strokeStyle = "rgba(70,52,30,0.16)"; c.lineWidth = 6.6; c.stroke(rb.path); // trodden, soft verge
    c.strokeStyle = dirt; c.lineWidth = 4.6; c.stroke(rb.path);
    c.strokeStyle = "rgba(60,45,28,0.10)"; c.lineWidth = 1.4; c.stroke(rb.path); // worn centre line
  }
  c.restore();
  if (!rb.blades) { // verge tufts and pebbles are static: two cached paths, two draw calls per road
    const bl = new Path2D(), pb = new Path2D();
    for (const [x, y, h] of rb.tufts) {
      if (h < 0.55) for (let b = -1; b <= 1; b++) { bl.moveTo(x + b * 0.4, y); bl.lineTo(x + b * 0.8, y - 1.1 - h * 0.8); }
      else { pb.moveTo(x + 0.45, y); pb.ellipse(x, y, 0.45, 0.25, 0, 0, 7); }
    }
    rb.blades = bl; rb.pebbles = pb;
  }
  c.strokeStyle = "rgba(78,96,46,0.5)"; c.lineWidth = 0.35; c.stroke(rb.blades);
  c.fillStyle = "hsla(32,14%,46%,0.5)"; c.fill(rb.pebbles!);
}
/** Screen-space bounds of a smoothed road (cached per link object). */
function roadBox(l: { tiles: [number, number][] }): [number, number, number, number] {
  const hit = boxCache.get(l); if (hit) return hit;
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of smoothRoad(l)) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; }
  const box: [number, number, number, number] = [a, b, c, d]; boxCache.set(l, box); return box;
}

/** Visible load on the cart bed, coloured by trade good. */
const LOAD: Record<TradeGood, [string, "sack" | "log" | "barrel" | "block"]> = {
  grain: ["#d4b25c", "sack"], wool: ["#e6dcc6", "sack"], salt: ["#ece8de", "sack"], fish: ["#7a6a52", "barrel"], beer: ["#6e4a2c", "barrel"],
  wood: ["#7a5232", "log"], timber: ["#c09a66", "log"], ore: ["#5a5450", "block"], stone: ["#a39d92", "block"], hides: ["#8a5a3a", "sack"], cloth: ["#8a3a3a", "sack"], ironware: ["#4b4e55", "block"],
};
function drawLoad(c: C, x: number, y: number, dx: number, dy: number, g: TradeGood) {
  const shape = LOAD[g][1], f = -screenFacing(dx, dy);
  // painted cargo: sacks, cloth bales, barrels, timber, stone, ore crates
  const k: FolkSprite = g === "cloth" ? "loadBale" : shape === "sack" ? "loadSack" : shape === "barrel" ? "loadBarrel"
    : shape === "log" ? "logs" : g === "stone" ? "blocks" : "loadCrate";
  const im = folkImage(k); if (!im) return;
  const n = k === "logs" || k === "blocks" || k === "loadCrate" ? 2 : 3, W = n === 3 ? 1.9 : 2.6;
  const bx = x + f * 1.6, by = y - 5.4;
  for (let i = 0; i < n; i++) {
    const ox = (i - (n - 1) / 2) * W * 0.8, oy = n === 3 && i === 1 ? -0.7 : 0, h = (W * im.naturalHeight) / im.naturalWidth;
    c.drawImage(im, bx + ox - W / 2, by + oy - h, W, h);
  }
}

/** Mounted messenger: 4-frame painted trot, front sheet faces right, rear sheet faces left; hooves on the ground line. */
/** St Martin: the shared rider sprite with his red cloak (half of it cut off for the beggar) over the shoulders. */
function drawMartin(c: C, x: number, y: number, w: Walk, t: number) {
  drawRider(c, x, y, w.dx, w.dy, 5, w.walking ? t : 0);
  const sw = w.walking ? Math.sin(t / 160) * 0.3 : 0, d = screenFacing(w.dx, w.dy) < 0 ? 1 : -1;
  c.fillStyle = "#a12f25"; c.beginPath(); c.moveTo(x - 0.8, y - 9.6); c.lineTo(x + 0.9, y - 9.6); c.lineTo(x + 0.6 + d * 1.8 + sw, y - 6.6); c.lineTo(x - 0.4 + d * 0.6, y - 6.9); c.closePath(); c.fill();
}
const RIDER_MS = 190;
function drawRider(c: C, x: number, y: number, dx: number, dy: number, sd: number, t: number) {
  const away = dy < -0.15 * Math.abs(dx), im = riderImage(away);
  if (!im) return;
  const H = 11, fw = im.naturalWidth / 4, W = (fw / im.naturalHeight) * H;
  // calm trot: RIDER_MS per pose, two lifts per 4-pose cycle (diagonal pairs), clean cuts
  const g = (t / RIDER_MS + sd * 3.17) % 4, f = Math.floor(g) & 3, lift = Math.abs(Math.sin(g * Math.PI / 2)) * 0.25;
  c.save(); c.translate(x, y);
  const face = screenFacing(dx, dy); if (away ? face > 0 : face < 0) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.fillStyle = "rgba(20,15,10,0.36)"; c.beginPath(); c.ellipse(0, -0.2, W * 0.36, 1, 0, 0, 7); c.fill();
  c.drawImage(im, f * fw, 0, fw, im.naturalHeight, -W / 2 + walkShift(im, f) * W, -H - lift, W, H);
  c.restore();
}
// ---------------- the prince's messenger (heraldVisit in princely.ts) ----------------
let heraldRows: PrincelyRow[] = [];
/** Decree rows from the UI; the messenger's visit is derived from them and the clock. */
export function setHeraldRows(r: PrincelyRow[]) { heraldRows = r; }
/** Screen position of each village's messenger this frame (tap target). */
export const heraldSpots = new Map<string, { x: number; y: number }>();
const heraldPaths = new Map<string, [number, number][]>();
/** Approach in tile coordinates: the last stretch of the village's first road, else open land from a hashed side. */
function heraldPath(sd: Seed, seeds: Seed[], goal: [number, number]): [number, number][] {
  const key = `${sd.id}:${seeds.length}:${goal[0]}:${goal[1]}`, hit = heraldPaths.get(key); if (hit) return hit;
  const l = links(seeds).find((k) => k.a.id === sd.id || k.b.id === sd.id);
  let pts: [number, number][];
  if (l && l.tiles.length > 4) {
    const tl = l.a.id === sd.id ? [...l.tiles].reverse() : l.tiles, n = tl.length;
    pts = tl.slice(Math.max(0, n - 16)).map(([x, y]) => [x, y] as [number, number]);
  } else {
    const a = hash(sd.x, sd.y, 77) * Math.PI * 2;
    pts = [[goal[0] + Math.cos(a) * 15, goal[1] + Math.sin(a) * 15]];
  }
  pts.push(goal);
  if (heraldPaths.size > 64) heraldPaths.clear();
  heraldPaths.set(key, pts); return pts;
}
const polyLen = (P: [number, number][]) => { let d = 0; for (let i = 1; i < P.length; i++) d += Math.hypot(P[i]![0] - P[i - 1]![0], P[i]![1] - P[i - 1]![1]); return d; };
function polyAt(P: [number, number][], s: number) {
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]!, b = P[i]!, d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s <= d || i === P.length - 1) { const u = d ? Math.min(1, Math.max(0, s / d)) : 1; return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, dir: [(b[0] - a[0]) / (d || 1), (b[1] - a[1]) / (d || 1)] as [number, number] }; }
    s -= d;
  }
  const e = P[P.length - 1]!; return { x: e[0], y: e[1], dir: [1, 0] as [number, number] };
}
/** Mounted herald: distance-driven trot with cross-faded frames, dust under the hooves while moving;
 * standing he breathes and shifts his weight, a wax-seal glint above marks the dispatch; a lantern at night. */
function drawHerald(c: C, x: number, y: number, dx: number, dy: number, gait: number | null, speed: number, t: number, waiting: boolean, night: boolean, sk: number) {
  const away = dy < -0.15 * Math.abs(dx), im = riderImage(away);
  if (!im) return;
  const H = 11, fw = im.naturalWidth / 4, W = (fw / im.naturalHeight) * H, nh = im.naturalHeight;
  c.save(); c.translate(x, y);
  // dust kicked up behind the hooves, stronger at a full trot
  if (speed > 0.05) {
    const bx = -dx / (Math.hypot(dx, dy) || 1), by = -dy / (Math.hypot(dx, dy) || 1);
    for (let i = 0; i < 4; i++) {
      const age = (t / 520 + i / 4 + sk * 0.13) % 1, r = 0.6 + age * 2.2;
      c.fillStyle = `rgba(150,128,96,${(1 - age) * 0.22 * Math.min(1, speed)})`;
      c.beginPath(); c.ellipse(bx * age * 5 + (i - 1.5) * 0.7, by * age * 2.5 - 0.4 - age * 1.4, r, r * 0.6, 0, 0, 7); c.fill();
    }
  }
  const face = screenFacing(dx, dy); if (away ? face > 0 : face < 0) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.fillStyle = "rgba(20,15,10,0.36)"; c.beginPath(); c.ellipse(0, -0.2, W * 0.36, 1, 0, 0, 7); c.fill();
  if (gait !== null) { // crisp frame steps (no cross-fade ghosting), a small bounce on each stride
    const g = ((gait % 4) + 4) % 4, f = Math.floor(g), lift = Math.abs(Math.sin(g * Math.PI)) * 0.25 * Math.min(1, speed);
    c.drawImage(im, f * fw, 0, fw, nh, -W / 2, -H - lift, W, H);
  } else {
    // standing: slow breath and an occasional weight shift — one clean frame, never doubled
    const br = Math.sin(t / 1300 + sk), cyc = (t / 1000 + sk) % 7.3, shift = cyc > 5.6 && cyc < 6.4 ? Math.sin(((cyc - 5.6) / 0.8) * Math.PI) : 0;
    c.save(); c.translate(shift * 0.12, 0); c.transform(1 - br * 0.004, 0, 0, 1 + br * 0.012, 0, 0);
    c.drawImage(im, 0, 0, fw, nh, -W / 2, -H, W, H);
    c.restore();
  }
  if (waiting) { // soft golden glint above the rider marks the waiting dispatch
    const pulse = 0.5 + 0.5 * Math.sin(t / 600 + sk), gy = -H - 1.6 + Math.sin(t / 900 + sk) * 0.2;
    const gl = c.createRadialGradient(0, gy, 0, 0, gy, 2.2);
    gl.addColorStop(0, `rgba(255,220,150,${0.3 + pulse * 0.35})`); gl.addColorStop(1, "rgba(255,220,150,0)");
    c.fillStyle = gl; c.beginPath(); c.arc(0, gy, 2.2, 0, 7); c.fill();
    c.fillStyle = `rgb(${150 + pulse * 40},30,26)`; c.beginPath(); c.arc(0, gy, 0.45, 0, 7); c.fill();
  }
  if (night) { // lantern on a short pole by the saddle
    const lx = -W * 0.18, ly = -H * 0.62 + (gait !== null ? Math.sin(t / 140) * 0.15 : 0);
    const gl = c.createRadialGradient(lx, ly, 0, lx, ly, 1.4); gl.addColorStop(0, "rgba(255,200,110,0.35)"); gl.addColorStop(1, "rgba(255,200,110,0)");
    c.fillStyle = gl; c.beginPath(); c.arc(lx, ly, 1.4, 0, 7); c.fill();
    c.fillStyle = "#3a2c1e"; c.fillRect(lx - 0.4, ly - 0.55, 0.8, 1.1);
    c.fillStyle = "#ffd98a"; c.fillRect(lx - 0.25, ly - 0.4, 0.5, 0.8);
  }
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
const CART_LAYOUT = { front: { k: 0.04, cx: 200, ox: [305, 18], os: 1.07, foot: 139 / 140 }, back: { k: 0.042, cx: 150, ox: [216, -44], os: 0.89, foot: 156 / 160 } } as const;
const WAGON_RES = 2;
/** Vertical shear that tilts the painted team (drawn for the 2:1 diagonal) onto the real road slope, so ox and wagon follow steep roads. */
export function cartShear(dx: number, dy: number, away: boolean): number {
  const slope = Math.max(-1.6, Math.min(1.6, dy / Math.max(Math.abs(dx), 0.05)));
  return Math.max(-1.1, Math.min(1.1, slope - (away ? -0.5 : 0.5)));
}
/** Carts currently shown head-on/from behind; hysteresis keeps them from flipping views on gently curving roads. */
const cartAxis = new Set<number | string>();
/** Figures shown as parchment silhouettes last frame (occlusion hysteresis). */
const ghostWas = new Set<number>();
/** Head-on view enters above a dy/dx ratio of 1.05 and only leaves below 0.75. */
export function cartAxisView(dx: number, dy: number, was: boolean): boolean {
  const r = Math.abs(dy) / Math.max(Math.abs(dx), 0.05);
  return was ? r > 0.75 : r > 1.05;
}
/** Carts currently shown from behind (hysteresis so slight slopes don't flip front/back every frame). */
const cartAway = new Set<number | string>();
export function cartAwayView(dx: number, dy: number, was: boolean): boolean {
  const r = dy / Math.max(Math.abs(dx), 0.05);
  return was ? r < 0.05 : r < -0.3;
}
function drawCart(c: C, x: number, y: number, dx: number, dy: number, _bob: number, sd: number, _cover: string, t: number, key: number | string = sd) {
  const away = cartAwayView(dx, dy, cartAway.has(key));
  if (away) cartAway.add(key); else cartAway.delete(key);
  if (cartAway.size > 256) cartAway.clear();
  const baseA = c.globalAlpha; // inherit road fade; step blend multiplies it and restores it
  // steep stretches (steeper than the 2:1 diagonal): painted head-on / from-behind view instead of a tilted side view
  const axis = cartAxisView(dx, dy, cartAxis.has(key));
  if (axis) cartAxis.add(key); else cartAxis.delete(key);
  if (cartAxis.size > 256) cartAxis.clear();
  if (axis) {
    const back = dy < 0, im = cartAxisImage(back);
    if (im) {
      // one shared scale for both steep sheets: front ox withers stand 172 px above its hooves → 5.0 units like the side views;
      // the rear ox's horn span (97 px) equals the front ox's (96 px), so the same scale gives it the same physical size
      const iw = im.naturalWidth, ih = im.naturalHeight, k = 5 / 172, h = ih * k, w = iw * k;
      // gait clock: 0.6 s per stride, legs alternate (left lifts while right plants)
      const g = (t / 300 + sd * 0.731) % 1, ph = g * Math.PI * 2;
      const liftL = Math.max(0, Math.sin(ph)) * 0.55, liftR = Math.max(0, -Math.sin(ph)) * 0.55;
      const dip = Math.abs(Math.sin(ph)) * 0.12; // body settles a hair on each hoof contact
      c.save(); c.translate(x, y); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
      // two ground contacts: wheels (row of their rim bottoms) and hooves (front only)
      const wheelRow = back ? 527 : 322, wy = -(ih - wheelRow) * k;
      c.fillStyle = "rgba(20,15,10,0.36)";
      c.beginPath(); c.ellipse(-w * 0.4, wy, w * 0.11, 0.55, 0, 0, 7); c.fill();
      c.beginPath(); c.ellipse(w * 0.4, wy, w * 0.11, 0.55, 0, 0, 7); c.fill();
      if (!back) { c.beginPath(); c.ellipse(0, -0.25, w * 0.2, 0.7, 0, 0, 7); c.fill(); }
      const x0 = -w / 2, y0 = -h;
      if (back) {
        // ox seen from behind: its forequarters (rows 0..140) nod with the stride, wagon stays put
        const cut = 160; // ox body above the canvas top
        c.drawImage(im, 0, cut, iw, ih - cut, x0, y0 + cut * k, w, (ih - cut) * k);
        c.drawImage(im, 0, 0, iw, cut, x0, y0 + dip * 1.5, w, cut * k);
      } else {
        // head-on: legs (rows below LEG) step in turn, body above dips gently
        const LEG = 405, mid = iw / 2, lh = (ih - LEG) * k;
        c.drawImage(im, 0, LEG, mid, ih - LEG, x0, y0 + LEG * k - liftL, mid * k, lh);
        c.drawImage(im, mid, LEG, iw - mid, ih - LEG, x0 + mid * k, y0 + LEG * k - liftR, (iw - mid) * k, lh);
        c.drawImage(im, 0, 0, iw, LEG + 2, x0, y0 + dip, w, (LEG + 2) * k);
      }
      c.restore(); return;
    }
  }
  const wag = wagonImage(away), ox = oxWalkImage(away);
  c.save(); c.translate(x, y); if (screenFacing(dx, dy) < 0) c.scale(-1, 1);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  if (!wag || !ox) {
    const im = away ? cartBackImage() ?? cartImage() : cartImage();
    if (im) { const w = away ? 13 : 15, h = (w * im.naturalHeight) / im.naturalWidth; c.drawImage(im, -w / 2, -h, w, h); }
    c.restore(); return;
  }
  const L = away ? CART_LAYOUT.back : CART_LAYOUT.front, k = L.k;
  // wagon art is painted at WAGON_RES× the layout's sprite-pixel grid (sharper texture, same size on screen)
  const ww = (wag.naturalWidth / WAGON_RES) * k, wh = (wag.naturalHeight / WAGON_RES) * k, wx = -L.cx * k;
  const fw = ox.naturalWidth / 4, ow = fw * k * L.os, oh = ox.naturalHeight * k * L.os;
  const oxX = wx + L.ox[0] * k, oxY = L.ox[1] * k;
  // continuous gait clock (~150 ms per pose, 0.6 s per full stride) so legs don't freeze between poses
  const g = (t / 150 + sd * 7.31) % 4, f = Math.floor(g);
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
// slot pool behind lastPeople: entries are reused across frames instead of allocating one per villager per frame
const peopleSlots: { x: number; y: number; q: Pose }[] = [];
const pushPerson = (x: number, y: number, q: Pose) => { const i = lastPeople.length; const o = peopleSlots[i] ?? (peopleSlots[i] = { x, y, q }); o.x = x; o.y = y; o.q = q; lastPeople.push(o); };
/** Sound-emitting structures drawn this frame (world-screen coords), read by the audio mixer. */
export const lastSources: { x: number; y: number; k: string }[] = [];
/** Trades that stop for a breath when the bell rings (field, site, wood and workshop). */
const PEAL_JOBS: ReadonlySet<string> = new Set(["farmer", "builder", "mason", "woodcutter", "sawyer", "crafter", "smith", "homemaker"]);
const BELL_KINDS = new Set(["seat3", "townhall", "belfry", "church", "factory"]);
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
const SACK_LOADS: ReadonlySet<string> = new Set(["grain", "flour", "bundle"]);
/** Which painted figure represents this villager right now. */
function folkOf(q: Pose): FolkSprite {
  const p = q.p;
  if (q.festive) return q.festive;
  if (p.age < 6) return "toddler"; // 1500: boys and girls alike wear the linen smock until about six
  if (p.age < 11) return p.sex === "f" ? "girl" : "child";
  if (p.age < 16) return p.sex === "f" ? "youthF" : "youth"; // 11–15: doublet and hose / maid's dress and coif
  const f = p.sex === "f";
  // 1500: sacks and bales go on the shoulder of a stooped day-labourer/miller's lad (porter sprite carries its own sack);
  // other loads are drawn as a prop on a plain figure — the craft tool stays at the workplace
  if (q.carry && p.job !== "priest" && p.job !== "mayor" && p.age < 65) {
    if (SACK_LOADS.has(q.carry)) return f ? "porterF" : "porter";
    if (p.job === "builder" || p.job === "farmer" || p.job === "woodcutter" || p.job === "mason") return f ? "woman" : "man";
  }
  if (p.job === "builder") return f ? "builderF" : "builder";
  if (p.job === "farmer") return f ? "farmerF" : "farmer";
  if (p.job === "woodcutter") return f ? "woodcutterF" : "woodcutter";
  if (p.job === "mason") return f ? "masonF" : "mason";
  if (p.job === "priest") return "priest";
  if (p.job === "watchman" && !f && p.age < 65) return "watchman"; // 1500: civic watch — plain iron hat, wool tunic, spear and horn (never the prince's guard)
  if (p.age >= 65) return f ? "elderF" : "elder";
  // 1500: patrician households wear a fur-trimmed Schaube and beret / fine gown with Flemish hood
  if (p.estate === "wealthy" && p.job !== "mayor") return f ? "wealthyF" : "wealthy";
  return f ? "woman" : "man";
}
// hipX = hip column, hemY = tunic hem (measured on the sprites); legs keep LEG_RATIO height regardless of hem
const HIPS: Partial<Record<FolkSprite, FigureConfig>> = {
  man: fig(0.438, 0.556, { legs: "dark" }), wealthy: fig(0.425, 0.635, { legs: "dark" }), farmer: fig(0.51, 0.71, { legs: "linen" }), porter: fig(0.437, 0.676, { legs: "linen" }), builder: fig(0.472, 0.653, { legs: "grey" }),
  woodcutter: fig(0.453, 0.67, { legs: "grey" }), mason: fig(0.4, 0.62, { legs: "grey" }), elder: fig(0.47, 0.68, { legWidthScale: 1.04, legs: "dark", keep: [[0.84, 0.96, 0.95]] }),
  robber: fig(0.45, 0.665, { legs: "dark" }), watchman: fig(0.58, 0.635, { legs: "dark", keep: [[0.17, 0.245, 1.0]] }), youth: fig(0.5, 0.58, { legs: "dark" }), groom: fig(0.56, 0.74, { legWidthScale: 1.06, legs: "linen" }),
};
const LEG_IMG = { m: "legsM", grey: "legsGrey", dark: "legsDark", linen: "legsLinen", red: "legsRed" } as const;
/** Leg cycle in the outfit's colour (falls back to the shared brown breeches while loading). */
const legsImg = (g: FigureConfig) => folkImage(LEG_IMG[g.legs ?? "m"]) ?? folkImage("legsM");
const DEFAULT_FIG = fig(0.46, 0.66);
// hanging front hand reaches just below the doublet hem: keep it whole over the legs (measured on all four cohorts)
const MAYOR_LEGS = fig(0.503, 0.58, { keep: [[0.37, 0.49, 0.605]] });
// long robes walk like skirts: two painted shoes step under the hem
// measured skirt centre (fraction of sprite width): shoes step under the body, not under a carried tool
const ROBE_HIP: Partial<Record<FolkSprite, number>> = { farmerF: 0.31, masonF: 0.46, elderF: 0.46, woman: 0.46, wealthyF: 0.5, priest: 0.46, woodcutterF: 0.47, porterF: 0.48, bride: 0.49, builderF: 0.51, youthF: 0.5 };
const SKIRTS: ReadonlySet<FolkSprite> = new Set(["woman", "wealthyF", "porterF", "farmerF", "elderF", "masonF", "woodcutterF", "builderF", "bride", "priest", "youthF"] as FolkSprite[]);
const TOOL_WORK: ReadonlySet<FolkSprite> = new Set(["farmer", "farmerF", "woodcutter", "woodcutterF", "mason", "masonF", "builder", "builderF"] as FolkSprite[]);
/** Men in breeches (every trade except robes/gowns) share the painted leg cycle. */
const WORK_FRAMES = 6;
const legsFor = (q: Pose) => !!HIPS[folkOf(q)];
/** Painted villager sprite: faces the walking direction, bobs while walking, sways while working. */
/** Mayor's insignia by honorary title (titleOfSeed): fur collar, judge's staff, own banner — drawn in the mirrored figure frame. */
function insignia(c: C, q: Pose, hgt: number) {
  // rain or snow: adults out of doors pull up a wool Gugel (hood with shoulder cape), each by own tolerance
  const wxs = Math.max(wetness(renderNow), snowiness(renderNow));
  if (wxs > 0.15 && q.p.age >= 12 && q.p.job !== "mayor" && !q.festive && !q.working && hash(q.p.id, 78, 5) < wxs * 1.4) {
    return;
  }
  if (q.p.job !== "mayor") return;
  const n = titleOfSeed(q.p.seed); if (n < 1) return;
  // 1500: fur-trimmed Schaube collar (title 1) and judge's staff (title 2) instead of chain and plumed beret
  const ch = folkImage("collar");
  if (ch) { const h = hgt * 0.15, w = (h * ch.naturalWidth) / ch.naturalHeight; c.drawImage(ch, -w / 2 + hgt * 0.02, -hgt * 0.84, w, h); }
  const st = n >= 2 ? folkImage("staff") : null;
  if (st) { const h = hgt * 0.95, w = (h * st.naturalWidth) / st.naturalHeight; c.drawImage(st, -hgt * 0.3 - w / 2, -h * 0.97, w, h); }
  if (n >= 3) {
    const pole = folkImage("bannerPole"), cloth = bannerCloth(q.p.seed.hue);
    if (pole) { const h = hgt * 1.5, w = (h * pole.naturalWidth) / pole.naturalHeight; c.drawImage(pole, hgt * 0.32 - w / 2, -h, w, h);
      if (cloth) { const ch2 = h * 0.38, cw = (ch2 * cloth.width) / cloth.height; c.drawImage(cloth, hgt * 0.32, -h * 0.95, cw, ch2); } }
  }
}
/** World matrix of the main canvas while villagers are drawn: lets drawFolk place sprites without save()/getTransform(). */
let folkCtx: C | null = null, folkM: DOMMatrix | null = null, folkFrame = -1;
function drawFolk(c: C, X: number, Y: number, q: Pose, t: number): Pt | null {
  const k = folkOf(q), im = folkImage(k); if (!im) return null;
  const kid = k === "child" || k === "girl" || k === "toddler", teen = k === "youth" || k === "youthF";
  const hgt = kid ? 2.7 + q.p.age * 0.07 : teen ? 3.5 + (q.p.age - 11) * 0.17 : 4.4;
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
  c.fillStyle = "rgba(25,20,10,0.22)"; c.beginPath(); c.ellipse(X + 0.6, Y + 0.1, w * (q.working ? 0.75 : 0.55), q.working ? 0.75 : 0.6, 0.1, 0, 7); c.fill();
  // zero-save placement: one absolute matrix (world × translate × mirror) instead of save/translate/scale/rotate/restore
  const B = c === folkCtx ? folkM! : c.getTransform(), fs = face < 0 ? -1 : 1;
  // walkers lean into wind and rain a little (display only)
  const lean = q.walking ? -0.09 * Math.max(wetness(renderNow), snowiness(renderNow)) * weatherAt(renderNow).wind : 0;
  c.setTransform(B.a * fs, B.b * fs, B.a * fs * lean + B.c, B.b * fs * lean + B.d, B.a * X + B.c * (Y - bob) + B.e, B.b * X + B.d * (Y - bob) + B.f);
  if (!c.imageSmoothingEnabled) c.imageSmoothingEnabled = true;
  // frost and snow: a faint breath puff rises before the face every few seconds
  if (snowiness(renderNow) > 0.15 || (frost(renderNow) && !q.walking)) {
    const u = ((t / 1000 + hash(q.p.id, 79, 5) * 4) % 4) / 4;
    if (u < 0.45) { const k = u / 0.45; c.fillStyle = `rgba(240,244,250,${0.35 * (1 - k)})`; c.beginPath(); c.ellipse(hgt * 0.16 + k * 0.9, -hgt * 0.86 - k * 0.8, 0.35 + k * 0.5, 0.25 + k * 0.35, 0, 0, 7); c.fill(); }
  }
  const bowed = q.working && pealPause(renderNow) && PEAL_JOBS.has(q.p.job);
  const jw = q.working && !bowed && !q.carry && !kid ? JOB_WORK[q.p.job] : undefined;
  const fishing = q.p.job !== "fisher" || fishingNow(localHour(), isRestDay(renderNow), seasonAt(renderNow).winter);
  const reap = q.p.job !== "farmer" || !q.p.work || farmReaps(q.p, renderNow);
  const mow = q.working && !bowed ? ((reap ? workSheet(k) : null) ?? (jw && fishing ? folkImage(q.p.job === "mayor" ? mayorSheet(q.p.sex, q.p.age) : q.p.sex === "f" ? jw.f : jw.m) : null)) : null;
  if (mow) {
    // painted work cycle; neighbouring frames cross-fade so the motion flows instead of flipping
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
    c.setTransform(B);
    return [X, Y - hgt];
  }
  // the mayor keeps his robe of office (first frame of his talk cycle) when standing and walking,
  // so the figure never swaps to a plain villager on the first step; walking steps shoes under the hem
  const robe = q.p.job === "mayor" && !q.festive ? folkImage(mayorSheet(q.p.sex, q.p.age)) : null;
  if (robe) {
    const fw = robe.naturalWidth / WORK_FRAMES, fh = robe.naturalHeight, hh = hgt * 1.01, ww = (hh * fw) / fh;
    if (q.walking && q.p.sex === "f") {
      drawRobeWalk(c, robe, 0, fw, fh, folkImage("footF"), ww, hh, ph, 0.8, 0.93, bob, 0.035, 0.45);
    } else if (q.walking) {
      // whole-body painted walk cycle per age cohort; the torso+legs composite is only a loading fallback
      const ws = mayorWalk(q.p.sex, q.p.age), legs = folkImage("legsM");
      if (ws) {
        const sfw = ws.naturalWidth / 4, sww = (hgt * sfw) / ws.naturalHeight;
        drawSheetFrame(c, ws, step4(ph), sfw, sww, hgt, 0);
      } else if (legs) {
        const f = gaitFrame(ph);
        drawLegged(c, robe, 0, fw, fh, legs, f, ww, hh, MAYOR_LEGS, bob, bob, ph);
      } else c.drawImage(robe, 0, 0, fw, fh, -ww / 2, -hh, ww, hh);
    } else c.drawImage(robe, 0, 0, fw, fh, -ww / 2, -hh, ww, hh);
    insignia(c, q, hgt);
    c.setTransform(B);
    return [X, Y - hgt - bob];
  }
  const sheet = q.walking ? walkSheet(k) : null;
  const legs = q.walking && !sheet && legsFor(q) ? legsImg(HIPS[k] ?? DEFAULT_FIG) : null;
  const frameOf = (fw: number) => { void fw; return gaitFrame(ph); };
  if (sheet) {
    // real painted walk cycle: frame follows the stride phase (one 2π = two steps)
    const n = walkFramesOf(k), fw = sheet.naturalWidth / n, f = n === 4 ? step4(ph) : frameOf(fw), sh = hgt * walkScaleOf(k);
    const ww = (sh * fw) / sheet.naturalHeight, dx = n === 4 ? 0 : -(frameShift(sheet)[f] ?? 0) * ww;
    drawSheetFrame(c, sheet, f, fw, ww, sh, dx);
  } else if (legs) {
    // modular figure: one hip-registered painted leg cycle shared by all trades, trade torso on top
    // each trade sprite: measured hip x (fraction of width) and tunic hem (fraction of height)
    const g = HIPS[k] ?? DEFAULT_FIG, f = frameOf(legs.naturalWidth / WALK_FRAMES);
    const yb = walkBob(ph, hgt);
    drawLegged(c, im, 0, im.naturalWidth, im.naturalHeight, legs, f, w, hgt, g, yb, yb, ph);
  } else if (skirt) {
    drawRobeWalk(c, im, 0, im.naturalWidth, im.naturalHeight, folkImage("footF"), w, hgt, ph, 0.8, 0.93, bob, 0.035, ROBE_HIP[k] ?? 0.5);
  } else {
    // standing still: slow breathing (chest rises, feet stay planted) and a rare weight shift
    const id = q.p.id, br = Math.sin(t / (1900 + hash(id, 41, 3) * 900) + id);
    const shift = Math.sin(t / (6500 + hash(id, 42, 3) * 3000) + id * 1.7);
    const sy = 1 + br * 0.012, sx = 1 - br * 0.004, lean = shift > 0.85 ? (shift - 0.85) * 0.12 : shift < -0.85 ? (shift + 0.85) * 0.12 : 0;
    c.transform(sx, 0, lean, sy, 0, 0);
    // real standing pose: both boots planted side by side under the trade torso (no frozen mid-stride)
    // whole-body figures stand in the passing frame of their own walk sheet (feet together, same body as walking)
    const ws4 = !q.working && walkFramesOf(k) === 4 && k !== "toddler" ? walkSheet(k) : null;
    const stand = !ws4 && !q.working && k !== "watchman" && legsFor(q) ? folkImage("legsStand") : null;
    const st = ws4 ? standSprite(k) : null;
    if (st) { const sh = hgt * walkScaleOf(k) * 0.985, sw = (sh * st.naturalWidth) / st.naturalHeight; c.drawImage(st, -sw / 2, -sh, sw, sh); }
    else if (ws4) { const sfw = ws4.naturalWidth / 4, sh = hgt * walkScaleOf(k); drawSheetFrame(c, ws4, 1, sfw, (sh * sfw) / ws4.naturalHeight, sh, 0); }
    else if (stand) drawLegged(c, im, 0, im.naturalWidth, im.naturalHeight, stand, 0, w, hgt, HIPS[k] ?? DEFAULT_FIG);
    else c.drawImage(im, -w / 2, -hgt, w, hgt);
  }
  insignia(c, q, hgt);
  c.setTransform(B);
  return [X, Y - hgt - bob];
}
/** People carrying a hand lantern this frame (night walkers on far paths, the strolling mayor). */
const lanternFolk = new Set<number>();
/** Screen facing of a villager's body; every separately drawn hand/shoulder prop uses it so props never flip apart from the body. */
const bodyFace = (q: Pose) => screenFacing(q.dir[0] - q.dir[1], (q.dir[0] + q.dir[1]) / 2);
/** Painted horn lantern (tinned iron, horn panes) hanging from the hand at hip height, swinging gently; the caller pushes its light. */
function drawHandLantern(c: C, X: number, Y: number, q: Pose, t: number) {
  const im = folkImage("hornLantern"); if (!im) return;
  const f = bodyFace(q);
  // the hand by the hip on the forward side, riding the same stride bob as the body
  const bob = q.walking ? Math.abs(Math.sin(q.phase + hash(q.p.id, 77, 5) * 6.2832)) * 0.07 : 0;
  const hx = X + f * 0.72, hy = Y - 2.3 - bob;
  const sw = Math.sin(q.phase * 2 + q.p.id) * (q.walking ? 0.12 : 0.03);
  const h = 0.8, w = (im.naturalWidth / im.naturalHeight) * h;
  c.save(); c.translate(hx, hy); c.rotate(sw);
  // short bail from fist to lantern ring, so it visibly hangs from the hand
  c.strokeStyle = "rgba(40,30,20,0.85)"; c.lineWidth = 0.09; c.beginPath(); c.moveTo(0, -0.12); c.lineTo(0, 0.02); c.stroke();
  c.globalAlpha = 0.9 + Math.sin(t / 90 + q.p.id) * 0.1; // candle flicker
  c.drawImage(im, -w / 2, -0.05, w, h);
  c.restore();
}
/** Painted load sprites per good: [sprite, source crop (fractions x,y,w,h), width as share of body height, hold]. */
const CARRY_ART: Record<NonNullable<Pose["carry"]>, [FolkSprite, [number, number, number, number], number, "shoulder" | "hand"] | null> = {
  grain: ["loadSack", [0, 0, 1, 1], 0.23, "shoulder"],
  flour: ["loadSack", [0, 0, 1, 1], 0.23, "shoulder"],
  bundle: ["loadBale", [0, 0, 1, 1], 0.32, "shoulder"],
  log: ["logs", [0.36, 0.48, 0.64, 0.52], 0.5, "shoulder"],
  stone: ["blocks", [0.25, 0, 0.48, 0.5], 0.2, "hand"],
  bread: ["breadBasket", [0, 0, 1, 1], 0.24, "hand"],
  planks: null,
};
/** A carried good as a painted prop on the wearer's own figure: shoulder loads ride the torso, hand loads hang at the hip; both bob with the stride. */
function drawCarryProp(c: C, X: number, Y: number, q: Pose, hgt: number) {
  if (!q.carry) return;
  const fk = folkOf(q); if (fk === "porter" || fk === "porterF") return; // sack painted on the porter
  const f = bodyFace(q);
  const bob = q.walking ? Math.abs(Math.sin(q.phase + hash(q.p.id, 77, 5) * 6.2832)) * hgt * 0.015 : 0;
  const sw = q.walking ? Math.sin(q.phase * 2 + q.p.id) * hgt * 0.012 : 0;
  const art = CARRY_ART[q.carry];
  if (!art) {
    // planks: three boards over the shoulder
    const sx = X - f * hgt * 0.05, sy = Y - hgt * 0.8 - bob;
    c.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const o = -i * hgt * 0.025;
      c.strokeStyle = i % 2 ? "#c49a62" : "#a07a4a"; c.lineWidth = hgt * 0.035;
      c.beginPath(); c.moveTo(sx - f * hgt * 0.32, sy + hgt * 0.06 + o); c.lineTo(sx + f * hgt * 0.3, sy - hgt * 0.06 + o); c.stroke();
    }
    c.lineCap = "butt";
    return;
  }
  const [k, [cx, cy, cw, ch], share, hold] = art;
  const im = folkImage(k); if (!im) return;
  const iw = im.naturalWidth, ih = im.naturalHeight;
  const w = hgt * share, h = (w * ch * ih) / (cw * iw);
  // shoulder: resting on the back shoulder, a little behind the neck; hand: held at hip height on the leading side
  const bx = hold === "shoulder" ? X - f * hgt * 0.1 : X + f * hgt * 0.17 + sw;
  const by = hold === "shoulder" ? Y - hgt * 0.7 - bob : Y - hgt * 0.4 - bob;
  const B = c.getTransform();
  c.translate(bx, by);
  if (f < 0) c.scale(-1, 1);
  if (hold === "shoulder" && q.carry === "log") c.rotate(-0.25);
  c.drawImage(im, cx * iw, cy * ih, cw * iw, ch * ih, -w / 2, hold === "shoulder" ? -h * 0.6 : -h * 0.3, w, h);
  c.setTransform(B);
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
  if (fzNow) drawFeastKit(c, X, Y, q, t, sp?.[1]);
  if (sp && q.carry) drawCarryProp(c, X, Y, q, Y - sp[1]);
  if (sp && q.p.seed && lanternFolk.has(q.p.id * 7919 + q.p.seed.id.length)) drawHandLantern(c, X, Y, q, t);
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
/** Cached map picture at 1/16 iso scale, coloured from the real ground textures (terrain is static).
 * Built in row slices within a per-call time budget so zooming out never stalls a frame; until the fine
 * picture is done, the previous one (or a cheap 1/64 preview built at once) is shown. */
type OvJob = { sk: string; ready: boolean; S: number; W: number; H: number; cv: HTMLCanvasElement; g: CanvasRenderingContext2D; img: ImageData; py: number; rgb: Map<string, [number, number, number]> };
let ovJob: OvJob | null = null;
function ovStart(sk: string, ready: boolean, S: number): OvJob {
  const W = Math.round((MAP * TW) / S), H = Math.round((MAP * TH) / S);
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!; const img = g.createImageData(W, H);
  const rgb = new Map<string, [number, number, number]>();
  const tmp = document.createElement("canvas").getContext("2d")!;
  for (const [k, [h, s, l]] of Object.entries(TERRAIN)) { tmp.fillStyle = hsl(h, s, l); tmp.fillRect(0, 0, 1, 1); const d = tmp.getImageData(0, 0, 1, 1).data; rgb.set(k, [d[0]!, d[1]!, d[2]!]); }
  return { sk, ready, S, W, H, cv, g, img, py: 0, rgb };
}
/** Fill rows until `budget` ms are used; returns the finished, softened picture or null. */
function ovStep(j: OvJob, budget: number): HTMLCanvasElement | null {
  const { S, W, H, img, rgb, ready } = j, t0 = performance.now();
  for (; j.py < H; j.py++) {
    const py = j.py;
    for (let px = 0; px < W; px++) {
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
    if ((py & 7) === 7 && performance.now() - t0 > budget) { j.py++; return null; }
  }
  j.g.putImageData(img, 0, 0);
  // soften once more so coasts and rivers look painted, not pixelated
  const out = document.createElement("canvas"); out.width = W; out.height = H;
  const og = out.getContext("2d")!; og.filter = `blur(${(0.8 * 16) / S}px)`; og.drawImage(j.cv, 0, 0);
  return out;
}
/** Advance the fine overview by up to `budget` ms; always returns something drawable. */
function overviewMap(budget = 6) {
  const sk = seasonKey(renderNow);
  if (overview && overviewSeason === sk) return overview;
  const ready = allTexturesReady();
  // never restart every frame while textures load: keep the last picture until they are ready
  if (!ready && overview) return overview;
  if (!overview) { const q = ovStep(ovStart(sk, false, 64), Infinity)!; overview = q; overviewSeason = ""; }
  if (!ovJob || ovJob.sk !== sk || ovJob.ready !== ready) ovJob = ovStart(sk, ready, 16);
  const done = ovStep(ovJob, budget);
  if (done) { overview = done; overviewSeason = ovJob.ready ? sk : ""; ovJob = null; }
  return overview!;
}

/** Builds the overview picture in idle time so zooming out never stalls. */
export function prewarmOverview() {
  if (typeof window === "undefined") return;
  const ric = (window as Window & { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
  const later = (f: () => void) => (ric ? ric(f) : setTimeout(f, 50));
  const go = () => {
    renderNow = renderNow || clock();
    if (!allTexturesReady()) return void setTimeout(go, 400);
    overviewMap(8);
    if (overviewSeason !== seasonKey(renderNow)) later(go);
  };
  later(go);
}

/** Crafts that need light to work: their windows glow by day under a dark storm sky. */
const STORM_LIT: ReadonlySet<string> = new Set(["bakery", "smithy", "inn", "workshop", "guildhall", "chapel", "church"]);
/** Weather veil (weather.ts, display only): gloom, mist banks, scrolling rain/snow tiles, rare lightning. */
let wxTiles: { rain?: HTMLCanvasElement; snow?: HTMLCanvasElement } = {};
function wxTile(kind: "rain" | "snow"): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const have = wxTiles[kind]; if (have) return have;
  const cv = document.createElement("canvas"); cv.width = cv.height = 256;
  const g = cv.getContext("2d")!;
  for (let i = 0; i < (kind === "rain" ? 140 : 90); i++) {
    const x = hash(i, 1, 41) * 256, y = hash(i, 2, 41) * 256, a = 0.25 + 0.35 * hash(i, 3, 41);
    if (kind === "rain") {
      g.strokeStyle = `rgba(200,210,225,${a})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 14); g.stroke();
    } else {
      const r = 0.8 + 1.4 * hash(i, 4, 41); g.fillStyle = `rgba(250,250,255,${a + 0.3})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }
  wxTiles[kind] = cv; return cv;
}
function drawWeather(c: C, w: number, h: number, dpr: number, t: number, night: number) {
  const wx = weatherAt(clock());
  smokeWind = wx.wind;
  if (wx.amount <= 0.01) return;
  const dim = 1 - night * 0.6; // drawn above the night grade, so keep it soft after dark
  if (wx.gloom > 0) { c.fillStyle = `rgba(70,78,90,${wx.gloom * (1 - night)})`; c.fillRect(0, 0, w, h); }
  const sec = t / 1000;
  if (wx.kind === "mist" || wx.kind === "drizzle" || wx.kind === "snow") {
    const banks = wx.kind === "mist" ? 5 : 2, a0 = (wx.kind === "mist" ? 0.32 : 0.14) * wx.amount * (1 - night * 0.75);
    for (let i = 0; i < banks; i++) {
      const bx = ((hash(i, 7, 43) * 1.4 + sec * 0.004 * (1 + i * 0.3)) % 1.4 - 0.2) * w, by = (0.2 + 0.7 * hash(i, 8, 43)) * h, r = Math.max(w, h) * (0.35 + 0.2 * hash(i, 9, 43));
      const g = c.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, `rgba(225,228,230,${a0})`); g.addColorStop(1, "rgba(225,228,230,0)");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
  }
  if (wx.kind === "drizzle" || wx.kind === "storm" || wx.kind === "snow") {
    const tile = wxTile(wx.kind === "snow" ? "snow" : "rain"); if (!tile) return;
    const pat = c.createPattern(tile, "repeat"); if (!pat) return;
    const snow = wx.kind === "snow", sc = dpr * (snow ? 1 : 1.2);
    const layers = wx.kind === "storm" ? 2 : 1;
    for (let k = 0; k < layers; k++) {
      const sp = snow ? 28 : 520 + k * 160, drift = snow ? Math.sin(sec * 0.4 + k) * 20 + sec * 12 * wx.wind : -sp * 0.2 * (0.5 + wx.wind);
      const ox = (snow ? drift : drift * sec) % 256, oy = (sec * sp) % 256;
      c.globalAlpha = Math.min(1, wx.amount * (snow ? 0.9 : 0.55) * (k ? 0.6 : 1) * dim);
      c.setTransform(sc * (1 + k * 0.4), 0, 0, sc * (1 + k * 0.4), (ox + k * 97) * sc, (oy + k * 53) * sc);
      c.fillStyle = pat; c.fillRect(-256, -256, w / sc + 512, h / sc + 512);
    }
    c.globalAlpha = 1; c.setTransform(1, 0, 0, 1, 0, 0);
  }
  if (wx.kind === "storm") {
    const slot = Math.floor(sec / 9), ph = sec - slot * 9;
    if (hash(slot, 5, 47) < 0.35 && ph < 0.25) { c.fillStyle = `rgba(235,240,255,${(0.25 - ph) * 1.2 * wx.amount})`; c.fillRect(0, 0, w, h); }
  }
}

/** Screen-space dusk + night grade shared by every zoom level; returns the night strength 0..1. */
function skyTint(c: C, w: number, h: number): number {
  // darkness follows the real sunrise/sunset of the realm (sun.ts, DST via the zone clock)
  const nowC = clock(), night = nightLevel(nowC), dusk = duskGlow(nowC);
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

/** Display-only bitmap cache of each town's overview buildings: rebaked when its look can change (radius, step, resolution, purchases, season, coarse clock). */
const OV_TICK = 30_000, OV_MAX = 48, OV_PX = 2048, OV_WARM = 15_000;
const ovCache = new Map<string, { key: string; cv: HTMLCanvasElement | OffscreenCanvas; ox: number; oy: number; k: number }>();
let ovT0 = -1;
export function overviewKey(s: Pick<Seed, "id" | "bought">, Ri: number, step: number, k: number, now: number, warm = 0): string {
  return `${s.id}|${Ri}|${step}|${k}|${s.bought?.length ?? 0}|${seasonKey(now)}|${Math.floor(now / OV_TICK)}|${warm}`;
}
function drawOverviewTown(c: C, s: Seed, Ri: number, step: number, z: number, ix: number, iy: number, now: number, paint: (g: C) => void): boolean {
  if (typeof document === "undefined" && typeof OffscreenCanvas === "undefined") return false;
  const pn = performance.now(); if (ovT0 < 0) ovT0 = pn;
  const warm = pn - ovT0 < OV_WARM ? Math.floor(pn / 2000) : 0; // sprites still arriving: rebake every 2 s at first
  const k = Math.min(4, 2 ** Math.ceil(Math.log2(Math.max(z, 1 / 64))));
  const ox = ix - (Ri + 1) * TW, oy = iy - Ri * TH - 160;
  const ww = 2 * (Ri + 1) * TW, hh = 2 * Ri * TH + 200;
  const kk = Math.min(k, OV_PX / ww, OV_PX / hh);
  const key = overviewKey(s, Ri, step, kk, now, warm);
  let e = ovCache.get(s.id);
  if (!e || e.key !== key) {
    const W = Math.max(1, Math.ceil(ww * kk)), H = Math.max(1, Math.ceil(hh * kk));
    let cv = e?.cv;
    if (!cv || cv.width !== W || cv.height !== H) {
      if (typeof document !== "undefined") { const el = document.createElement("canvas"); el.width = W; el.height = H; cv = el; }
      else cv = new OffscreenCanvas(W, H);
    }
    const g = cv.getContext("2d") as C | null; if (!g) return false;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    g.setTransform(kk, 0, 0, kk, -ox * kk, -oy * kk);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    paint(g);
    e = { key, cv, ox, oy, k: kk };
    ovCache.delete(s.id); ovCache.set(s.id, e);
    while (ovCache.size > OV_MAX) ovCache.delete(ovCache.keys().next().value!);
  } else { ovCache.delete(s.id); ovCache.set(s.id, e); }
  c.drawImage(e.cv as CanvasImageSource, e.ox, e.oy, e.cv.width / e.k, e.cv.height / e.k);
  return true;
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
    const y0 = Math.max(0, Math.min(...cs.map((p) => p[1])) - 2), y1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[1])) + 8);
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
    const R = radiusOf(viewAge(s, seeds, now));
    const rr = Math.max(R * TW * 0.5, 3 * dpr * px);
    if (ix + rr < vx0 || ix - rr > vx1 || iy + rr < vy0 || iy - rr > vy1) continue;
    // settled ground under the town
    c.beginPath(); c.ellipse(ix, iy, rr * 1.05, rr * 0.55, 0, 0, 7);
    c.fillStyle = "rgba(70,55,35,0.25)"; c.fill();
    // the real buildings, at true scale, back to front — baked per town into a reusable bitmap
    const Ri = Math.ceil(R) + 1, step = cam.zoom < 0.12 && Ri > 14 ? 2 : 1;
    const paint = (g: C) => {
      for (let d = -2 * Ri; d <= 2 * Ri; d++) for (let x = s.x - Ri; x <= s.x + Ri; x += step) {
        const y = s.x + s.y + d - x; if (y < s.y - Ri || y > s.y + Ri) continue;
        const st = structureAt(x, y, seeds, now); if (!st) continue;
        const [cx, cy] = iso(x, y);
        if (st.kind === "field") { g.fillStyle = texture(g, fieldTex(x, y, st.seed, now)) ?? "#c9b46a"; diamond(g, cx, cy, step); g.fill(); }
        else if (PATHLIKE.has(st.kind) || st.kind === "square") { g.fillStyle = texture(g, st.kind === "street" || st.kind === "square" ? "cobble" : "dirt") ?? "#bfa47a"; diamond(g, cx, cy, step * 0.8); g.fill(); }
        else if (st.build !== undefined) drawSite(g, st, cx, cy, 0, false);
        else if (!FLAT.has(st.kind)) drawBuildingSprite(g, st.kind, cx, FOOT2.has(st.kind) ? cy - TH / 2 : cy, st.v);
      }
    };
    if (!drawOverviewTown(c, s, Ri, step, z, ix, iy, now, paint)) paint(c);
  }
  { // the prince's seat, at true scale like the towns
    const cs0 = courtSite();
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const cp = courtPieces().get((cs0.y + j) * MAP + cs0.x + i); if (cp) { const [cx, cy] = iso(cs0.x + i, cs0.y + j); drawCourtPiece(c, cp, cx, cy, []); } }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  // same dusk/night grade as the close view, so zooming out never jumps to daylight
  const night = skyTint(c, w, h);
  drawWeather(c, w, h, dpr, performance.now(), night);
  if (night > 0.02) {
    c.globalCompositeOperation = "lighter";
    for (const s of seeds) {
      const [ix, iy] = iso(s.x, s.y);
      const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2;
      const r = Math.max(6 * dpr, radiusOf(viewAge(s, seeds, now)) * TW * 0.5 * z);
      if (sx < -r || sy < -r || sx > w + r || sy > h + r) continue;
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, `rgba(255,170,80,${0.22 * night})`); g.addColorStop(1, "rgba(255,140,60,0)");
      c.fillStyle = g; c.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = "source-over";
  }
  c.font = `700 ${Math.round(18 * dpr)}px Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif CJK SC', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`; c.textAlign = "center";
  const placed: [number, number][] = [];
  const cl = drawCourtLabel(c, cam, w, h, z, dpr, 7 * TH * z + 12 * dpr, 18); if (cl) placed.push(cl);
  c.font = `700 ${Math.round(18 * dpr)}px Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif CJK SC', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`;
  const order = [...seeds].sort((a, b) => viewAge(b, seeds, now) - viewAge(a, seeds, now));
  for (const s of order) {
    const [ix, iy] = iso(s.x, s.y);
    const R = radiusOf(viewAge(s, seeds, now)) * TH * 0.5 * z;
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
      prop(c, "stake", sx, sy + 0.3, 0.95);
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
    const h = 4.4;
    c.fillStyle = "rgba(20,15,10,0.25)"; c.beginPath(); c.ellipse(wx + 0.5, wy, 1.6, 0.55, 0, 0, 7); c.fill();
    c.save(); c.translate(wx, wy); if ((dx >= 0 ? 1 : -1) * (w ? -1 : 1) < 0) c.scale(-1, 1);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
    if (sheet && !pealPause(renderNow)) {
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
    const pileIm = folkImage("bridgePile");
    for (const [g, top] of [[a, at0], [b, at1]] as [Pt, Pt][]) {
      // painted oak pile: iron band under the deck, mossy wet foot in the river
      const ph = g[1] - top[1] + 1.6;
      if (pileIm) c.drawImage(pileIm, g[0] - 0.65, top[1], 1.3, ph);
      else { c.fillStyle = "#3a2a1b"; c.fillRect(g[0] - 0.55, top[1], 1.1, ph); }
      c.fillStyle = "rgba(20,40,38,0.35)"; c.fillRect(g[0] - 0.65, g[1] + 0.9, 1.3, 0.7); // wet waterline
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
      c.strokeStyle = pat ?? col; c.lineWidth = w * 1.2; c.beginPath();
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
type GroundGeom = { forestX: Path2D | null; water: Path2D; deep: Pt[]; layers: (Path2D | null)[]; shoreLines: Path2D | null; shore: { a: Pt; b: Pt; w: Pt }[]; edges: GroundEdge[] };
const geomCache = new Map<string, GroundGeom>();
/** Terrain never changes, so the contour geometry of a tile block is built once and reused as Path2D. */
function groundGeom(x0: number, x1: number, y0: number, y1: number): GroundGeom {
  const ed = labEdge();
  const key = `${x0},${x1},${y0},${y1}${ed ? `|e${ed.core},${ed.grain}${ed.v2 ? "v2" : ""}` : ""}`;
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
  // Pilot 3 prototype (test map only): forest core diamonds + organic fringe, baked with the chunk
  let forestX: Path2D | null = null;
  if (ed?.v2) {
    // iteration 2: the combined outline REPLACES the hard layer-6 contour (never drawn on top of it)
    const polys = forestShape(gx0, gx0 + GW - 1, gy0, gy0 + GH - 1, terrain, ed);
    const fp = new Path2D(); for (const q of polys) { fp.moveTo(q[0]![0], q[0]![1]); for (let k = 1; k < q.length; k++) fp.lineTo(q[k]![0], q[k]![1]); fp.closePath(); }
    layers[6] = polys.length ? fp : null;
  } else if (ed) {
    const polys = forestExtra(gx0, gx0 + GW - 1, gy0, gy0 + GH - 1, terrain, ed);
    if (polys.length) { forestX = new Path2D(); for (const q of polys) { forestX.moveTo(q[0]![0], q[0]![1]); for (let k = 1; k < q.length; k++) forestX.lineTo(q[k]![0], q[k]![1]); forestX.closePath(); } }
  }
  const g = { forestX, water, deep, layers, shoreLines, shore, edges };
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
    if (L === 6 && G.forestX) { c.fillStyle = texture(c, "forest") ?? "#7a8a50"; c.fill(G.forestX); }
    const path = G.layers[L]; if (!path) continue;
    if (L === 1 && G.shoreLines) {
      // shallow water: the sandy bed shimmers through before the bank begins
      c.save(); c.lineCap = "round"; c.lineJoin = "round";
      const band = (w: number, a: number, tex: Tex) => { c.globalAlpha = a; c.strokeStyle = texture(c, tex) ?? "#c8b48a"; c.lineWidth = w; c.stroke(G.shoreLines!); };
      band(9, 0.22, "sand"); band(5, 0.3, "sand");
      c.restore();
    }
    const tx = TEX_OF[LAYER_T[L]!]!;
    // hills: soft relief — shadow cast down-right onto the lower land, sunlit rim at the upper-left edge
    let rim: Path2D | null = null;
    if (L === 5) {
      rim = new Path2D(); rim.addPath(path); rim.addPath(path, { a: 1, b: 0, c: 0, d: 1, e: 2.5, f: 3.5 });
      c.save(); c.clip(rim, "evenodd"); c.translate(2.5, 3.5); c.fillStyle = "rgba(40,34,14,0.26)"; c.fill(path); c.restore();
    }
    c.fillStyle = texture(c, tx) ?? "#7a8a50"; c.fill(path);
    if (rim) {
      c.save(); c.clip(path); c.clip(rim, "evenodd"); c.fillStyle = "rgba(250,236,170,0.22)"; c.fill(path); c.restore();
      c.save(); c.clip(path); c.globalAlpha = 0.18; c.fillStyle = "rgb(214,190,120)"; c.fill(path); c.restore(); // drier upland tint
    }
    if (L >= 3 && L <= 5) { // grassland: break the tiling with a rotated second layer + soft macro light patches
      c.save(); c.clip(path);
      const alt = textureAlt(c, tx);
      if (alt) { c.globalAlpha = VEG.altAlpha; c.fillStyle = alt; c.fill(path); }
      const M = 7;
      for (let gy = Math.floor(y0 / M); gy <= Math.ceil(y1 / M); gy++) for (let gx = Math.floor(x0 / M); gx <= Math.ceil(x1 / M); gx++) {
        const h = hash(gx, gy, 311), mx = (gx + hash(gx, gy, 312)) * M, my = (gy + hash(gx, gy, 313)) * M;
        const [px, py] = iso(mx, my), rad = TW * (2.5 + hash(gx, gy, 314) * 3);
        const dark = h < 0.5, a = 0.05 + Math.abs(h - 0.5) * 0.14;
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, rad);
        gr.addColorStop(0, dark ? `rgba(40,58,20,${a})` : `rgba(236,222,150,${a})`); gr.addColorStop(1, "rgba(0,0,0,0)");
        c.save(); c.translate(px, py); c.scale(1, 0.5); c.globalAlpha = 1; c.fillStyle = gr;
        c.beginPath(); c.arc(0, 0, rad, 0, Math.PI * 2); c.fill(); c.restore();
      }
      c.restore();
    }
  }
  if (G.shore.length) drawSurf(c, G.shore, t, detail);
  return G.edges;
}

// ---- mid-zoom ground cache: static terrain (+ forests, crags) baked per 32x32-tile chunk ----
const CH = 16, PAD_TOP = 40; // 16 tiles: one bake costs a quarter of the old 32-tile chunk, so panning never stalls on a big raster
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
/**
 * Wild meadow in 2.5D: upright grass blades (vertical, lit from the upper left) and, on flower meadows,
 * small blossoms on stalks — pure hash per tile, so baked chunks and the live view agree.
 */
/**
 * Ground vegetation scale & frequency in one place (world px; a villager is 5 px tall, a sheep ~3 px).
 * `p` = chance per tile/slot, `w`/`h` = base size + random extra. Ground textures carry no plants (see AGENTS.md).
 */
export const VEG = {
  altAlpha: 0.42,                                   // textureAlt overlay strength
  blade: { slots: 3, slotsMeadow: 5, skip: 0.25, h: 1.1, hx: 1.1 },
  flower: { slots: 2, p: 0.35, h: 1.6, hx: 0.7 },   // meadow wildflowers: knee high
  clover: { slots: 1, p: 0.3, w: 1.6, wx: 0.6 },    // pasture clover: low patches
  tussock: { p: 0.18, w: 1.9, wx: 0.6 },            // coarse tussocks: rare
};
function wildTurfPaths(g: C, x: number, y: number, cx: number, cy: number, tr: string) {
  const B = VEG.blade, n = tr === "meadow" ? B.slotsMeadow : B.slots;
  g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const h = hash(x, y, 820 + i); if (h < B.skip) continue;
    // stay inside the iso diamond: u,v in tile space, projected with the 2:1 ratio
    const u = hash(x, y, 830 + i) - 0.5, v = hash(x, y, 840 + i) - 0.5;
    const px = cx + (u - v) * TW * 0.42, py = cy + (u + v) * TH * 0.42;
    const tall = B.h + h * B.hx;
    g.fillStyle = "rgba(30,24,10,0.14)"; g.beginPath(); g.ellipse(px + 0.5, py + 0.15, 1.2, 0.35, 0, 0, 7); g.fill();
    g.strokeStyle = tr === "hill" ? "rgba(92,104,58,0.85)" : "rgba(70,100,40,0.85)"; g.lineWidth = 0.32; g.beginPath();
    // low tuft: blades rise from one root and arch outward (curved, unequal lean), never straight vertical strokes
    const lean = (hash(x, y, 850 + i) - 0.5) * 0.6;
    for (let b = -2; b <= 2; b++) {
      const s = b * 0.42 + lean, top = tall * (1 - Math.abs(b) * 0.2);
      g.moveTo(px + b * 0.12, py);
      g.quadraticCurveTo(px + b * 0.18 + s * 0.2, py - top * 0.75, px + b * 0.25 + s * 1.15, py - top * (b ? 0.82 : 1));
    }
    g.stroke();
    g.strokeStyle = "rgba(190,200,120,0.5)"; g.lineWidth = 0.14; g.beginPath(); g.moveTo(px - 0.15, py - 0.1); g.quadraticCurveTo(px - 0.3, py - tall * 0.5, px - 0.75 + lean, py - tall * 0.72); g.stroke();
  }
  // flower meadow: painted wildflower clumps standing upright on the turf (season-thinned), never baked into the ground texture
  const fl = tr === "meadow" ? huntIm("flowerTuft", flowerTuftUrl) : null, w = seasonAt(renderNow);
  if (fl) {
    const bloom = Math.max(0, 1 - w.winter * 1.2 - w.autumn * 0.7);
    const F = VEG.flower;
    for (let i = 0; i < F.slots; i++) {
      if (hash(x, y, 860 + i) > bloom * F.p) continue;
      const u = hash(x, y, 870 + i) - 0.5, v = hash(x, y, 880 + i) - 0.5;
      const px = cx + (u - v) * TW * 0.36, py = cy + (u + v) * TH * 0.36, fh = F.h + hash(x, y, 890 + i) * F.hx, fw = fh * fl.width / fl.height;
      g.fillStyle = "rgba(30,24,10,0.2)"; g.beginPath(); g.ellipse(px + 0.3, py, fw * 0.4, 0.25, 0, 0, 7); g.fill();
      g.drawImage(fl, px - fw / 2, py - fh, fw, fh);
    }
  }
}
/** Pre-rendered turf tiles (terrain × variant): one drawImage per tile instead of ~40 path ops. */
const TURF_VARIANTS = 12, TURF_S = 3, TURF_W = TW + 4, TURF_UP = 6, TURF_H = TH + TURF_UP + 2;
const turfSprites = new Map<string, HTMLCanvasElement>();
function turfSprite(tr: string, v: number): HTMLCanvasElement {
  const key = tr + v + seasonKey(renderNow); let cv = turfSprites.get(key);
  if (!cv) {
    cv = document.createElement("canvas"); cv.width = TURF_W * TURF_S; cv.height = TURF_H * TURF_S;
    const g = cv.getContext("2d")!; g.setTransform(TURF_S, 0, 0, TURF_S, 0, 0);
    wildTurfPaths(g, 9001 + v, 4243, TURF_W / 2, TURF_UP + TH / 2, tr);
    if (tr !== "meadow" || huntIm("flowerTuft", flowerTuftUrl)) { if (turfSprites.size > 200) turfSprites.clear(); turfSprites.set(key, cv); }
  }
  return cv;
}
function wildTurf(g: C, x: number, y: number, cx: number, cy: number, tr: string) {
  if (tr !== "grass" && tr !== "meadow" && tr !== "hill" && tr !== "fertile") return;
  const sp = turfSprite(tr, Math.floor(hash(x, y, 819) * TURF_VARIANTS));
  g.drawImage(sp, cx - TURF_W / 2, cy - TURF_UP - TH / 2, TURF_W, TURF_H);
}
// ---------------- farmland: live base fill (world-anchored textures) + cached detail sprites ----------------
type Pt2 = [number, number];
const NS4: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const lerp2 = (a: Pt2, b: Pt2, f: number): Pt2 => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
/** Organic acre outline: outer sides bow gently, outer corners are rounded off (hashes from the variant coords). */
function acrePath(c: C, cx: number, cy: number, hx: number, hy: number, outer: boolean[]) {
  const pp = P(cx, cy);
  const q = [pp(-0.52, -0.52), pp(0.52, -0.52), pp(0.52, 0.52), pp(-0.52, 0.52)];
  const round = (k: number) => outer[(k + 3) & 3]! && outer[k]!;
  c.beginPath();
  const st0 = round(0) ? lerp2(q[0]!, q[1]!, 0.35) : q[0]!; c.moveTo(st0[0], st0[1]);
  for (let k = 0; k < 4; k++) {
    const A = q[k]!, Bq = q[(k + 1) & 3]!, Cq = q[(k + 2) & 3]!, k1 = (k + 1) & 3;
    const end = round(k1) ? lerp2(Bq, A, 0.35) : Bq;
    if (outer[k]) {
      const mid = lerp2(A, Bq, 0.5), wob = (hash(hx * 2 + NS4[k]![0], hy * 2 + NS4[k]![1], 77) - 0.5) * 0.25;
      const ctl = lerp2(mid, [cx, cy], wob);
      c.quadraticCurveTo(ctl[0], ctl[1], end[0], end[1]);
    } else c.lineTo(end[0], end[1]);
    if (round(k1)) { const nx = lerp2(Bq, Cq, 0.35); c.quadraticCurveTo(Bq[0], Bq[1], nx[0], nx[1]); }
  }
  c.closePath();
  return q;
}
type AgriSpec = { kind: "field" | "garden" | "pasture"; ripe: boolean; look?: Look | undefined; along: boolean; outer: boolean[]; winter: boolean; hx: number; hy: number; k2: number };
/** Furrows, plants, wattle, bean poles, tufts and troughs — everything except the textured base fill. */
let gCabbage: HTMLImageElement | null = null, gLeek: HTMLImageElement | null = null, gBeans: HTMLImageElement | null = null;
let pastureClover: HTMLImageElement | null = null, pastureTussock: HTMLImageElement | null = null, pastureTrough: HTMLImageElement | null = null;
function agriDetail(c: C, cx: number, cy: number, a: AgriSpec) {
  const pp = P(cx, cy), { hx: x, hy: y, ripe, along, outer } = a;
  if (a.kind === "pasture") {
    const k2 = a.k2, d0 = pp(-k2, -k2), d1 = pp(k2, -k2), d2 = pp(k2, k2), d3 = pp(-k2, k2);
    c.save(); c.beginPath(); c.moveTo(d0[0], d0[1]); c.lineTo(d1[0], d1[1]); c.lineTo(d2[0], d2[1]); c.lineTo(d3[0], d3[1]); c.closePath(); c.clip(); c.lineCap = "round";
    // trodden earth: soft, blurred patches where the herd stands and walks (no hard strokes)
    for (let n = 0; n < 2; n++) {
      if (hash(x, y, 703 + n) < 0.35) continue;
      const [tx, ty] = pp((hash(x, y, 706 + n) - 0.5) * 0.7, (hash(x, y, 708 + n) - 0.5) * 0.7), rr = 3 + hash(x, y, 710 + n) * 3;
      const gr = c.createRadialGradient(tx, ty, 0, tx, ty, rr);
      gr.addColorStop(0, "rgba(118,92,58,0.42)"); gr.addColorStop(0.6, "rgba(130,104,66,0.18)"); gr.addColorStop(1, "rgba(130,104,66,0)");
      c.save(); c.translate(tx, ty); c.scale(1, 0.5); c.translate(-tx, -ty); c.fillStyle = gr; c.beginPath(); c.arc(tx, ty, rr, 0, 7); c.fill(); c.restore();
    }
    c.restore();
    // painted standing plants: clover patches and coarse tussocks the cattle avoid
    const stamp = (im: HTMLImageElement | null, u: number, v: number, wd: number, sd: number) => {
      if (!im) return; const [px, py] = pp(u, v), h = wd * im.height / im.width;
      c.fillStyle = "rgba(30,24,10,0.2)"; c.beginPath(); c.ellipse(px + 0.3, py, wd * 0.38, 0.3, 0, 0, 7); c.fill();
      if (hash(x, y, sd) < 0.5) c.drawImage(im, px - wd / 2, py - h * 0.95, wd, h);
      else { c.save(); c.translate(px, 0); c.scale(-1, 1); c.drawImage(im, -wd / 2, py - h * 0.95, wd, h); c.restore(); }
    };
    const Cl = VEG.clover, Tu = VEG.tussock;
    if (!a.winter) for (let n = 0; n < Cl.slots; n++) if (hash(x, y, 750 + n) < Cl.p) stamp(pastureClover, (hash(x, y, 752 + n) - 0.5) * 0.8, (hash(x, y, 754 + n) - 0.5) * 0.8, Cl.w + hash(x, y, 756 + n) * Cl.wx, 758 + n);
    if (hash(x, y, 760) < Tu.p) stamp(pastureTussock, (hash(x, y, 761) - 0.5) * 0.7, (hash(x, y, 762) - 0.5) * 0.7, Tu.w + hash(x, y, 763) * Tu.wx, 764);
    if (hash(x, y, 740) > 0.8 && pastureTrough) { // hollowed log trough
      const im = pastureTrough, wd = 7, h = wd * im.height / im.width, [ox, oy] = pp(0.15, -0.15);
      c.fillStyle = "rgba(25,18,10,0.28)"; c.beginPath(); c.ellipse(ox + 0.8, oy + 0.3, wd * 0.45, 1, 0, 0, 7); c.fill();
      c.drawImage(im, ox - wd / 2, oy - h * 0.8, wd, h);
    }
    return;
  }
  c.save(); const q = acrePath(c, cx, cy, x, y, outer); c.clip(); c.lineCap = "round";
  if (a.kind === "garden") {
    // raised beds: soft shadowed paths between mounded, lit earth ridges
    for (let k = -2; k <= 2; k++) {
      const f = k / 4, [a0, a1] = along ? [pp(-0.6, f), pp(0.6, f)] : [pp(f, -0.6), pp(f, 0.6)];
      c.strokeStyle = "rgba(22,14,6,0.32)"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(a0[0], a0[1] + 1.2); c.lineTo(a1[0], a1[1] + 1.2); c.stroke();
      c.strokeStyle = "rgba(92,62,36,0.55)"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke();
      c.strokeStyle = "rgba(168,128,84,0.35)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(a0[0] - 0.2, a0[1] - 0.7); c.lineTo(a1[0] - 0.2, a1[1] - 0.7); c.stroke();
    }
  } else {
    for (let k = -2; k <= 2; k++) {
      const f = k / 4, [a0, a1] = along ? [pp(-0.6, f), pp(0.6, f)] : [pp(f, -0.6), pp(f, 0.6)];
      c.strokeStyle = "rgba(35,24,12,0.38)"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(a0[0], a0[1] + 0.9); c.lineTo(a1[0], a1[1] + 0.9); c.stroke();
      c.strokeStyle = ripe ? "rgba(255,230,160,0.22)" : "rgba(170,140,100,0.25)"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(a0[0], a0[1] - 0.3); c.lineTo(a1[0], a1[1] - 0.3); c.stroke();
    }
  }
  c.restore();
  if (a.kind === "garden") {
    if (!a.winter && gCabbage && gLeek) for (let k = -2; k <= 2; k++) {
      const bed = hash(x * 3 + k, y, 659) < 0.55 ? gCabbage : gLeek, cab = bed === gCabbage;
      for (let m = -2; m <= 2; m++) {
        const h = hash(x * 7 + k, y * 5 + m, 660); if (h < 0.18) continue;
        const f = k / 4, gg = m * 0.22 + (h - 0.5) * 0.06, [px, py] = along ? pp(gg, f) : pp(f, gg);
        const w = (cab ? 2.6 : 1.7) * (0.8 + h * 0.35), hgt = w * bed.height / bed.width;
        c.fillStyle = "rgba(20,14,6,0.25)"; c.beginPath(); c.ellipse(px + 0.4, py + 0.2, w * 0.45, 0.6, 0, 0, 7); c.fill();
        c.save(); c.translate(px, py); if (h > 0.6) c.scale(-1, 1); c.drawImage(bed, -w / 2, -hgt * (cab ? 0.8 : 0.95), w, hgt); c.restore();
      }
    }
    c.lineCap = "round";
    for (let k = 0; k < 4; k++) if (outer[k]) {
      const A = q[k]!, Bq = q[(k + 1) & 3]!;
      c.strokeStyle = "rgba(25,18,10,0.25)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(A[0] + 0.4, A[1] + 0.3); c.lineTo(Bq[0] + 0.4, Bq[1] + 0.3); c.stroke();
      c.strokeStyle = "#7a5a36"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(A[0], A[1] - 0.45); c.lineTo(Bq[0], Bq[1] - 0.45); c.stroke();
      c.strokeStyle = "rgba(200,165,110,0.6)"; c.lineWidth = 0.22; c.beginPath(); c.moveTo(A[0], A[1] - 0.7); c.lineTo(Bq[0], Bq[1] - 0.7); c.stroke();
    }
    if (hash(x, y, 670) > 0.62 && !a.winter && gBeans) {
      const [bx, by] = pp((hash(x, y, 671) - 0.5) * 0.4, (hash(x, y, 672) - 0.5) * 0.4), w = 3.4, hgt = w * gBeans.height / gBeans.width;
      c.fillStyle = "rgba(25,18,10,0.22)"; c.beginPath(); c.ellipse(bx + 1.2, by + 0.3, 2.2, 0.6, 0, 0, 7); c.fill();
      c.drawImage(gBeans, bx - w / 2, by - hgt * 0.97, w, hgt);
    }
  } else {
    const row = fieldRowImage(ripe), grows = a.look === undefined || a.look === "green" || a.look === "ripe";
    if (a.look === "fallow") {
      c.strokeStyle = "rgba(96,110,52,0.75)"; c.lineWidth = 0.3; c.lineCap = "round"; c.beginPath();
      for (let n = 0; n < 7; n++) { const [px, py] = pp((hash(x, y, 810 + n) - 0.5) * 0.9, (hash(x, y, 820 + n) - 0.5) * 0.9); for (let b = -1; b <= 1; b++) { c.moveTo(px + b * 0.3, py); c.lineTo(px + b * 0.45, py - 0.7); } }
      c.stroke();
      c.fillStyle = "rgba(230,215,120,0.85)"; for (let n = 0; n < 4; n++) { const [px, py] = pp((hash(x, y, 830 + n) - 0.5) * 0.9, (hash(x, y, 840 + n) - 0.5) * 0.9); c.beginPath(); c.arc(px, py - 0.8, 0.35, 0, 7); c.fill(); }
    } else if (a.look === "stubble") {
      // reaped rows: pale straw stubble with a dark foot, plus a few loose straw wisps
      for (let k = -3; k <= 3; k++) for (let m = -6; m <= 6; m++) {
        const f = k / 6, g = m * 0.09 + (hash(x * 3 + k, y + m, 850) - 0.5) * 0.04, [px, py] = along ? pp(g, f) : pp(f, g), hh = 0.7 + hash(x + k, y * 3 + m, 851) * 0.5;
        c.strokeStyle = "rgba(70,50,24,0.45)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(px, py + 0.15); c.lineTo(px + 0.1, py - hh * 0.4); c.stroke();
        c.strokeStyle = "rgba(222,192,120,0.9)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(px + 0.05, py - hh * 0.3); c.lineTo(px + 0.2, py - hh); c.stroke();
      }
      c.strokeStyle = "rgba(236,210,140,0.8)"; c.lineWidth = 0.25;
      for (let n = 0; n < 6; n++) { const [px, py] = pp((hash(x, y, 860 + n) - 0.5) * 0.9, (hash(x, y, 870 + n) - 0.5) * 0.9), a = hash(x, y, 880 + n) * 3; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * 1.4, py + Math.sin(a) * 0.5); c.stroke(); }
    } else if (a.look === "ploughed") {
      // mounded furrow ridges: shadowed trough below, sunlit crest from the upper left
      for (let k = -3; k <= 3; k++) {
        const f = k / 6, wob = (hash(x, y, 895 + k) - 0.5) * 0.04, [a0, a1] = along ? [pp(-0.6, f + wob), pp(0.6, f - wob)] : [pp(f + wob, -0.6), pp(f - wob, 0.6)];
        const mx = (a0[0] + a1[0]) / 2, my = (a0[1] + a1[1]) / 2 + (hash(x, y, 897 + k) - 0.5) * 0.6;
        c.strokeStyle = "rgba(30,18,8,0.4)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(a0[0], a0[1] + 1); c.quadraticCurveTo(mx, my + 1, a1[0], a1[1] + 1); c.stroke();
        c.strokeStyle = "rgba(160,118,74,0.45)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(a0[0] - 0.2, a0[1] - 0.4); c.quadraticCurveTo(mx - 0.2, my - 0.4, a1[0] - 0.2, a1[1] - 0.4); c.stroke();
      }
      // turned clods along the furrows: dark shadow side, lit top
      for (let k = -3; k <= 3; k++) for (let m = -5; m <= 5; m++) {
        const f = k / 6 + 0.04, g = m * 0.1 + (hash(x + k, y * 7 + m, 890) - 0.5) * 0.06, [px, py] = along ? pp(g, f) : pp(f, g), r = 0.45 + hash(x * 7 + k, y + m, 891) * 0.35;
        c.fillStyle = "rgba(40,26,14,0.55)"; c.beginPath(); c.ellipse(px + 0.2, py + 0.15, r, r * 0.5, 0, 0, 7); c.fill();
        c.fillStyle = "rgba(150,110,70,0.6)"; c.beginPath(); c.ellipse(px - 0.1, py - 0.1, r * 0.7, r * 0.32, 0, 0, 7); c.fill();
      }
    }
    if (row && !a.winter && grows) {
      const w = ripe ? 3.4 : 3.1, hgt = (w * row.height) / row.width, flipRow = !along;
      for (let k = -3; k <= 3; k++) for (let m = -5; m <= 5; m += 2) {
        const f = k / 6, gg = m * 0.085 + (hash(x * 5 + k, y * 3 + m, 640) - 0.5) * 0.05;
        const [px, py] = along ? pp(gg, f) : pp(f, gg);
        c.fillStyle = "rgba(30,22,10,0.22)"; c.beginPath(); c.ellipse(px + 0.6, py + 0.3, w * 0.42, 1.2, 0, 0, 7); c.fill();
        c.save(); c.translate(px, py); if (flipRow) c.scale(-1, 1);
        c.drawImage(row, -w / 2, -hgt * 0.92, w, hgt); c.restore();
      }
    }
  }
  // field balk: a few grass tufts along the outer edges
  c.strokeStyle = "rgba(78,96,46,0.5)"; c.lineWidth = 0.35; c.lineCap = "round"; c.beginPath();
  for (let k = 0; k < 4; k++) if (outer[k]) for (let n = 0; n < 3; n++) {
    const f = 0.2 + 0.3 * n + (hash(x, y, 500 + k * 3 + n) - 0.5) * 0.15;
    const p = lerp2(q[k]!, q[(k + 1) & 3]!, f);
    for (let b = -1; b <= 1; b++) { c.moveTo(p[0] + b * 0.35, p[1]); c.lineTo(p[0] + b * 0.7, p[1] - 0.9 - hash(x + b, y + n, 510 + k) * 0.6); }
  }
  c.stroke();
}
const AGRI_VARIANTS = 6, AGRI_S = 3, AGRI_W = 48, AGRI_UP = 20, AGRI_H = 34;
const agriSprites = new Map<string, HTMLCanvasElement>();
/** Set when an agri detail sprite could not be built yet (art loading): the flat chunk being baked is then not complete. */
let agriMiss = false;
function agriSprite(a: AgriSpec, key: string): HTMLCanvasElement | null {
  gCabbage = huntIm("gCab", gardenCabbageUrl); gLeek = huntIm("gLeek", gardenLeekUrl); gBeans = huntIm("gBeans", gardenBeansUrl);
  pastureClover = huntIm("pClover", pastureCloverUrl); pastureTussock = huntIm("pTussock", pastureTussockUrl); pastureTrough = huntIm("pTrough", pastureTroughUrl);
  let cv = agriSprites.get(key);
  if (cv) return cv;
  // plant art not loaded yet: draw nothing cached (the fill is still shown) and retry next frame
  if (a.kind !== "pasture" && !a.winter && !fieldRowImage(a.kind === "field" && a.ripe)) { agriMiss = true; return null; }
  if (a.kind === "garden" && !a.winter && !(gCabbage && gLeek && gBeans)) { agriMiss = true; return null; }
  if (a.kind === "pasture" && !(pastureClover && pastureTussock && pastureTrough)) { agriMiss = true; return null; }
  cv = document.createElement("canvas"); cv.width = AGRI_W * AGRI_S; cv.height = AGRI_H * AGRI_S;
  const g = cv.getContext("2d")!; g.setTransform(AGRI_S, 0, 0, AGRI_S, 0, 0);
  agriDetail(g, AGRI_W / 2, AGRI_UP, a);
  agriSprites.set(key, cv);
  while (agriSprites.size > 500) agriSprites.delete(agriSprites.keys().next().value!);
  return cv;
}
/** One farmland tile: a textured base fill (few ops) plus one cached detail sprite. */
function drawAgri(c: C, x: number, y: number, cx: number, cy: number, st: Structure, seeds: Seed[], now: number) {
  const v = Math.floor(hash(x, y, 661) * AGRI_VARIANTS), hx = 7001 + v * 3, hy = 5003;
  const winter = seasonAt(now).winter >= 0.6;
  let a: AgriSpec, key: string;
  if (st.kind === "pasture") {
    const isP = (i: number, j: number) => structureAt(x + i, y + j, seeds, now)?.kind === "pasture";
    const k2 = 0.5 + (isP(1, 0) && isP(0, 1) && isP(-1, 0) && isP(0, -1) ? 0.06 : 0);
    const pp = P(cx, cy), d0 = pp(-k2, -k2), d1 = pp(k2, -k2), d2 = pp(k2, k2), d3 = pp(-k2, k2);
    c.beginPath(); c.moveTo(d0[0], d0[1]); c.lineTo(d1[0], d1[1]); c.lineTo(d2[0], d2[1]); c.lineTo(d3[0], d3[1]); c.closePath();
    c.fillStyle = texture(c, "grass") ?? hsl(80, 30, 60); c.fill();
    c.globalAlpha = 0.18; c.fillStyle = "rgb(150,160,90)"; c.fill(); c.globalAlpha = 1;
    a = { kind: "pasture", ripe: false, along: false, outer: [], winter, hx, hy, k2 }; key = `p${k2}|${v}`;
  } else {
    const ac = acreOf(x, y, st.seed), look = st.kind === "field" ? fieldLook(ac.id, now) : undefined, ripe = look === "ripe";
    const sameA = (i: number, j: number) => { const o = structureAt(x + i, y + j, seeds, now); return !!o && o.kind === st.kind && acreOf(x + i, y + j, o.seed).id === ac.id; };
    const outer = NS4.map(([i, j]) => !sameA(i, j));
    acrePath(c, cx, cy, hx, hy, outer);
    if (st.kind === "garden") {
      c.fillStyle = texture(c, "fertileGarten") ?? hsl(25, 35, 30); c.fill();
      c.globalAlpha = 0.5; c.fillStyle = texture(c, "dirt") ?? hsl(30, 35, 55); c.fill(); c.globalAlpha = 1;
    } else { c.fillStyle = texture(c, LOOK_TEX[look!]) ?? hsl(ripe ? 44 : 80, 50, 60); c.fill(); if (look === "stubble") { c.globalAlpha = 0.35; c.fillStyle = texture(c, "dirt") ?? hsl(30, 35, 55); c.fill(); c.globalAlpha = 1; } }
    a = { kind: st.kind as "field" | "garden", ripe, look, along: ac.along, outer, winter, hx, hy, k2: 0 };
    key = `${st.kind[0]}${look ?? ""}${+ac.along}${outer.map((o) => +o).join("")}${+winter}|${v}`;
  }
  const sp = agriSprite(a, key + seasonKey(now));
  if (sp) c.drawImage(sp, cx - AGRI_W / 2, cy - AGRI_UP, AGRI_W, AGRI_H);
}
/** Wild trees, bushes, crags and ore rocks of one tile — the single source for every zoom level. */
function natureAt(g: C, x: number, y: number, cx: number, cy: number, t: number, free: boolean, turf = true) {
  if (inCourt(x, y)) return; // the estate keeps open lawns
  const tr = terrain(x, y);
  // lone boulders only; ore/bog-iron deposits stay invisible (they have no in-game use, loose heaps looked wrong)
  if ((tr === "hill" || tr === "mountain") && resourceAt(x, y) === "stone") {
    drawNature(g, "boulder", cx + (hash(x, y, 90) - 0.5) * 8, cy + 3, 0.75 + hash(x, y, 99) * 0.4, 0, hash(x, y, 95) > 0.5);
  }
  if (!free) return;
  if (turf) wildTurf(g, x, y, cx, cy, tr);
  // snow-free rock massif: broad overlapping cliff blocks on most tiles read as one continuous range
  if (tr === "mountain" && hash(x, y, 26) > 0.18) drawNature(g, "crag", cx + (hash(x, y, 28) - 0.5) * 8, cy + 6, 0.8 + hash(x, y, 27) * 0.35, 0, hash(x, y, 29) > 0.5);
  if (tr === "forest") {
    if (hash(x, y, 19) > 0.35) tree(g, cx + 6, cy - 1, 0.75 + hash(x, y, 20) * 0.3, t, hash(x, y, 21), x * 17 + y, 0.6);
    tree(g, cx - 5, cy + 3, 0.85 + hash(x, y, 17) * 0.35, t, hash(x, y, 18), x * 13 + y, 0.6);
  } else if (tr === "hill") { // upland: wind-shaped shrubs and small rock ledges, few trees
    const h = hash(x, y, 22);
    if (h > 0.97) tree(g, cx, cy + 1, 0.8, t, hash(x, y, 23), x * 19 + y, 0.2);
    else if (h > 0.85) drawNature(g, "bush", cx + (hash(x, y, 24) - 0.5) * 12, cy + 2, 0.6 + hash(x, y, 25) * 0.4);
    else if (h > 0.76) drawNature(g, "boulder", cx + (hash(x, y, 24) - 0.5) * 10, cy + 3, 0.45 + hash(x, y, 25) * 0.35, 0, hash(x, y, 26) > 0.5);
  } else if (tr === "grass" || tr === "meadow") {
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
  while (chunkCache.size > 200) chunkCache.delete(chunkCache.keys().next().value!);
  return cv;
}
function drawGroundChunks(c: C, x0: number, x1: number, y0: number, y1: number, z: number, vx0: number, vx1: number, vy0: number, vy1: number, far = false): number {
  const q = z > 1.6 ? 2 : z > 0.6 ? 1 : 0.5, sk = seasonKey(renderNow) + (labEdge() ? `|e${labEdge()!.core},${labEdge()!.grain}${labEdge()!.v2 ? "v2" : ""}` : "");
  let baked = 0, drawn = 0;
  const cx0 = Math.floor(x0 / CH), cx1 = Math.floor(x1 / CH), cy0 = Math.floor(y0 / CH), cy1 = Math.floor(y1 / CH);
  for (let s = cx0 + cy0; s <= cx1 + cy1; s++) for (let ix = Math.max(cx0, s - cy1); ix <= Math.min(cx1, s - cy0); ix++) {
    const iy = s - ix;
    const X0 = ix * CH, Y0 = iy * CH, X1 = X0 + CH - 1, Y1 = Y0 + CH - 1;
    if (iso(X1, Y0)[0] + TW < vx0 || iso(X0, Y1)[0] - TW > vx1 || iso(X1, Y1)[1] + TH < vy0 || iso(X0, Y0)[1] - TH - PAD_TOP > vy1) continue;
    const cached = chunkCache.has(`${ix},${iy},${q},${sk}`);
    if (!cached && (baked >= 1 || frameBakes >= 1)) { // spread baking over frames; fall back to another cached quality if any
      const oq = [2, 1, 0.5].find((o) => o !== q && chunkCache.has(`${ix},${iy},${o},${sk}`));
      const lo = oq ? chunkCache.get(`${ix},${iy},${oq},${sk}`) as (HTMLCanvasElement & { ox: number; oy: number }) : undefined;
      if (lo && oq) c.drawImage(lo, lo.ox, lo.oy, lo.width / oq, lo.height / oq);
      else if (far) { /* overview bitmap already underneath */ }
      else { const [a, b] = iso(X0 + CH / 2, Y0 + CH / 2); c.fillStyle = "#7a8a50"; c.beginPath(); c.moveTo(a, b - CH * TH / 2); c.lineTo(a + CH * TW / 2, b); c.lineTo(a, b + CH * TH / 2); c.lineTo(a - CH * TW / 2, b); c.fill(); }
      continue;
    }
    if (!cached) { baked++; frameBakes++; }
    const cv = groundChunk(ix, iy, q, sk) as (HTMLCanvasElement & { ox: number; oy: number }) | null;
    if (cv) { c.drawImage(cv, cv.ox, cv.oy, cv.width / q, cv.height / q); drawn++; }
  }
  return drawn;
}

// ---------------- wonders in the wild (src/game/wonders.ts) ----------------
const WONDER_ART: Record<WonderKind, [string, number]> = { wreck: [wreckU, 36], cave: [caveU, 54], oak: [oakU, 74], ruin: [ruinU, 70], caravan: [caravanU, 24], spring: [springU, 46] };
let wonderM: Map<number, WonderKind> | null = null;
// realm switch: drop map-specific caches so no wonder or ground from the previous island lingers
onGeoChange(() => { wonderM = null; overview = null; chunkCache.clear(); geomCache.clear(); clearFlat(); });
const wonderMap = () => wonderM ??= new Map(wonders().map((w) => [w.y * MAP + w.x, w.kind]));
let wonderFound = new Set<string>();
// ---------------- supporter decorations (src/game/supporter.ts): purely cosmetic ----------------
let supportOwned = new Map<string, Set<string>>();
/** Granted supporter rewards per village id (set by the UI). */
export function setSupportOwned(m: Map<string, Set<string>>) { supportOwned = m; }
/** Last drawn dog position per village (world tiles), so the UI can react to clicks on it. */
export const dogSpots = new Map<string, { x: number; y: number }>();
const DOG_W = 2.1; // small curly dog: knee-high next to a 5.2-unit villager
/** Village dog: painted 4-frame trot cycle stepped by distance (no foot sliding), sit and curled-up sleep poses. */
function drawDog(c: C, d: DogPose, px: number, py: number, t: number, seedK: number) {
  c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  if (d.mode === "sleep") {
    const im = huntIm("dog-sleep", dogSleepU); if (im) {
      const w = DOG_W * 1.35, h = (w * im.naturalHeight) / im.naturalWidth, br = 1 + Math.sin(t / 900) * 0.025; // slow breathing
      c.translate(px, py); c.scale(1, br); c.drawImage(im, -w / 2, -h * 0.88, w, h);
    }
    c.restore(); return;
  }
  // two-step ground contact: soft cast shadow down-right (light from upper left) + dark contact under the paws
  c.fillStyle = "rgba(30,36,22,0.16)"; c.beginPath(); c.ellipse(px + 0.5, py + 0.15, DOG_W * 0.48, DOG_W * 0.15, 0, 0, 7); c.fill();
  c.fillStyle = "rgba(24,28,18,0.34)"; c.beginPath(); c.ellipse(px, py, DOG_W * 0.3, DOG_W * 0.08, 0, 0, 7); c.fill();
  if (d.mode === "sit") {
    const im = huntIm("dog-sit", dogSitU); if (im) {
      const w = DOG_W * 0.72, h = (w * im.naturalHeight) / im.naturalWidth;
      // panting / looking around: a tiny head-bob and occasional turn
      c.translate(px, py); if (d.flip) c.scale(-1, 1); // keep facing where it came from
      const pant = 1 + Math.sin(t / 240) * 0.012; // breathing compresses toward the ground, never lifts the paws
      c.scale(1, pant); c.drawImage(im, -w / 2, -h * 0.93, w, h);
    }
    c.restore(); return;
  }
  const sheet = huntIm("dog-trot", dogTrotU); if (!sheet) { c.restore(); return; }
  // stride: one painted frame per ~0.11 tiles trotting, 0.08 walking — feet plant instead of sliding
  const ph = d.dist / (d.mode === "trot" ? 0.11 : 0.08), f0 = Math.floor(ph) & 3;
  const bob = Math.abs(Math.sin(ph * Math.PI)) * (d.mode === "trot" ? 0.12 : 0.05);
  const fw = sheet.naturalWidth / 4, fh = sheet.naturalHeight, w = DOG_W, h = (w * fh) / fw;
  c.translate(px, py - bob); if (d.flip) c.scale(-1, 1);
  c.drawImage(sheet, f0 * fw, 0, fw, fh, -w / 2 + walkShift(sheet, f0) * w, -h * 0.93, w, h);
  c.restore();
}
function drawSupport(c: C, k: RewardKey, cx: number, cy: number, L: Light[], night: boolean) {
  const u = SUPPORT_ART[k], w = SUPPORT_W[k]; if (!u || !w) return;
  const im = huntIm(`support-${k}`, u); if (!im) return;
  const h = (w * im.naturalHeight) / im.naturalWidth;
  if (k === "lanterns") {
    for (const ox of [-9, 9]) { c.drawImage(im, cx + ox - w / 2, cy + 3 - h, w, h); if (night) L.push({ x: cx + ox - w * 0.15, y: cy + 3 - h * 0.78, r: 5 }); }
    return;
  }
  c.drawImage(im, cx - w / 2, cy + 6 - h, w, h);
  if (k === "statue") L.push({ x: cx, y: cy - h * 0.6, r: 2.5 });
}
function drawVane(c: C, cx: number, top: number) {
  const u = SUPPORT_ART.vane, w = SUPPORT_W.vane!; if (!u) return;
  const im = huntIm("support-vane", u); if (!im) return;
  const h = (w * im.naturalHeight) / im.naturalWidth; c.drawImage(im, cx - w / 2, top + 4 - h, w, h);
}
/** Sites the own village already explored (no more sparkle). */
export function setWonderFound(keys: Set<string>) { wonderFound = keys; }
function drawWonder(c: C, k: WonderKind, cx: number, cy: number, t: number, fresh: boolean, L: Light[]) {
  const [u, w] = WONDER_ART[k], im = huntIm(`wonder-${k}`, u);
  if (im) { const h = (w * im.naturalHeight) / im.naturalWidth; c.drawImage(im, cx - w / 2, cy + 6 - h, w, h); }
  if (k === "cave" || k === "wreck") L.push({ x: cx - 6, y: cy - 8, r: 3 });
  if (fresh) {
    // a soft golden glimmer marks a place this village has not explored yet
    const a = 0.35 + Math.sin(t / 380 + cx) * 0.25;
    c.save(); c.fillStyle = `rgba(255,214,120,${a})`;
    for (let i = 0; i < 3; i++) { const ph = t / 900 + i * 2.1, px = cx + Math.cos(ph) * 14, py = cy - 18 + Math.sin(ph * 1.3) * 8; c.beginPath(); c.arc(px, py, 1.3, 0, 7); c.fill(); }
    c.restore();
  }
}
// ---------------- the prince's seat (src/game/court.ts) ----------------
let courtName = "Fürstenhof";
/** Map label of the prince's seat in the player's language (set by the UI). */
export function setCourtLabel(n: string) { courtName = n; }
function drawCourtLabel(c: C, cam: Camera, w: number, h: number, z: number, dpr: number, lift: number, size: number) {
  const cc = courtCenter(); const [ix, iy] = iso(cc.x, cc.y);
  const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2 - lift;
  if (sx < -200 || sx > w + 200 || sy < -50 || sy > h + 50) return null;
  c.font = `italic 700 ${Math.round(size * dpr)}px Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif CJK SC', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`; c.textAlign = "center"; c.lineJoin = "round";
  c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(courtName, sx, sy);
  c.fillStyle = hsl(345, 45, 30); c.fillText(courtName, sx, sy);
  return [sx, sy] as [number, number];
}
const COURT_ART: Record<CourtPiece, string> = { castle: castleU, stable: stableU, fountain: fountainU, pavilion: pavilionU, garden: parterreU };
const COURT_FIG: Record<CourtRole, string> = { prince: princeU, princess: princessU, herald: heraldU, guard: guardU, gardener: gardenerU, groom: courtGroomU };
/** Pixel-native water: 4 baked frames of the sprite where only its own water pixels shift brightness in bands that travel downward (falling streams, basin ripples) — no vector overlay. */
let fountainFr: HTMLCanvasElement[] | null = null;
function fountainFrames(im: HTMLImageElement) {
  if (fountainFr) return fountainFr;
  if (typeof document === "undefined" || !im.naturalWidth) return null;
  const W = im.naturalWidth, H = im.naturalHeight, base = document.createElement("canvas");
  base.width = W; base.height = H; const bc = base.getContext("2d")!; bc.drawImage(im, 0, 0);
  const src = bc.getImageData(0, 0, W, H).data, out: HTMLCanvasElement[] = [];
  for (let f = 0; f < 4; f++) {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const cx = cv.getContext("2d")!, id = cx.createImageData(W, H), d = id.data; d.set(src);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, r = src[i]!, g = src[i + 1]!, b = src[i + 2]!;
      if (src[i + 3]! < 30 || b < 110 || b < r + 15) continue;
      const band = (((y >> 2) - f + ((x >> 3) & 1)) % 4 + 4) % 4;
      const k = band === 0 ? 1.22 : band === 2 ? 0.9 : 1;
      if (k === 1) continue;
      d[i] = Math.min(255, r * k); d[i + 1] = Math.min(255, g * k); d[i + 2] = Math.min(255, b * k);
    }
    cx.putImageData(id, 0, 0); out.push(cv);
  }
  return (fountainFr = out);
}
function drawCourtPiece(c: C, k: CourtPiece, cx: number, cy: number, L: Light[], t = 0) {
  const n = COURT_LAYOUT[k][2], im = huntIm(`court-${k}`, COURT_ART[k]);
  if (k === "garden") { // flat rose parterre, anchored on its back tile, spans the whole footprint
    if (im) { const w = n * TW, h = (w * im.naturalHeight) / im.naturalWidth, my = cy + ((n - 1) * TH) / 2; c.drawImage(im, cx - w / 2, my + (n * TH) / 2 - h, w, h); } // front corner on the ground, arch rises above
    return;
  }
  // centre of the footprint, the front tile sits n-1 tiles toward the viewer
  // world-pixel widths matched to 5.4px figures (church 32, farmhouse 23): castle ≈3× a church,
  // stable ≈ a big barn, fountain ≈3 people wide, pavilion ≈2.5 people tall
  const W: Record<CourtPiece, number> = { castle: 100, stable: 40, fountain: 15, pavilion: 11, garden: 0 };
  const mx = cx, my = cy - ((n - 1) * TH) / 2, w = W[k];
  const by = k === "castle" || k === "stable" ? my + (n * TH) / 2 + 2 : cy + TH / 2;
  if (im) {
    const h = (w * im.naturalHeight) / im.naturalWidth;
    const fr = k === "fountain" ? fountainFrames(im) : null;
    c.drawImage(fr ? fr[Math.floor(t / 180) % fr.length]! : im, mx - w / 2, by - h, w, h);
  }
  if (k === "castle") { L.push({ x: mx - 10, y: by - 50, r: 4 }); L.push({ x: mx + 9, y: by - 48, r: 4 }); L.push({ x: mx, y: by - 10, r: 3 }); }
  if (k === "stable") L.push({ x: mx - 8, y: by - 14, r: 2.5 });
}
let courtFrame = -1; const courtFig = new Map<number, CourtPose[]>();
function courtFigures(t: number) {
  if (courtFrame === t) return courtFig;
  courtFrame = t; courtFig.clear();
  for (const q of courtPoses(localHour(), clock())) { const k = Math.round(q.y) * MAP + Math.round(q.x); (courtFig.get(k) ?? courtFig.set(k, []).get(k)!).push(q); }
  return courtFig;
}
/** Court anatomy: legs keep LEG_RATIO height from the hip; the prince wears a floor-length ermine
 * mantle, so he walks like the princess — swaying hem, only boot tips step out (no cut through the fur). */
const COURT_GAIT: Record<CourtRole, FigureConfig> = {
  prince: fig(0.51, 0.68, { legs: "dark" }), princess: fig(0.52, 0.9, { style: "robe" }),
  herald: fig(0.41, 0.64, { legs: "dark", keep: [[0.73, 0.87, 0.96], [0, 0.35, 0.72]] }), guard: fig(0.51, 0.57, { stride: GUARD_STRIDE, legs: "grey", keep: [[0.36, 0.48, 0.84]] }),
  gardener: fig(0.44, 0.56, { legs: "grey", keep: [[0, 0.27, 0.7]] }), groom: fig(0.46, 0.58, { legs: "dark" }),
};
// the guard sprite: halberd tip only a little above the helmet (body ~88 % of the height)
const courtHeight = (r: CourtRole) => (r === "prince" ? 4.9 : r === "guard" ? 5.3 : 4.6);
function drawCourtFigure(c: C, q: CourtPose, t: number) {
  const im = huntIm(`courtfig-${q.role}`, COURT_FIG[q.role]); if (!im) return;
  // same human scale as villagers/mayors (5.2); the prince stands a touch taller
  const [px, py] = iso(q.x, q.y), h = courtHeight(q.role), w = (h * im.naturalWidth) / im.naturalHeight;
  // stride follows distance walked so feet never slide
  const ph = ((q.dist ?? 0) / (COURT_GAIT[q.role].stride ?? COURT_STRIDE)) * 6.2832;
  // shadow centred between the feet (legs hang from hipX), so the figure strides exactly over it
  const g0 = COURT_GAIT[q.role], cx0 = 0;
  c.save(); c.translate(px, py); if (q.dx < 0) c.scale(-1, 1);
  c.fillStyle = "rgba(25,20,10,0.22)"; c.beginPath(); c.ellipse(cx0, 0.1, w * 0.45, 0.6, 0, 0, 7); c.fill();
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  if (!q.walking) {
    const br = Math.sin(t / 2100 + q.x * 5); c.transform(1 - br * 0.004, 0, 0, 1 + br * 0.012, 0, 0);
    drawCourtStand(c, q.role, im, h, g0); c.restore(); return;
  }
  drawCourtWalk(c, im, q.role, w, h, ph);
  c.restore();
}
/** Standing court figure; the prince has his own dignified standing sprite (feet together, hands folded). */
function drawCourtStand(c: C, role: CourtRole, walkIm: HTMLImageElement, h: number, g: FigureConfig): number {
  const st = role === "prince" ? huntIm("courtfig-prince-stand", princeStandU) : null;
  if (st) { const w = (h * 1.04 * st.naturalWidth) / st.naturalHeight; c.drawImage(st, -w * 0.5, -h * 1.04, w, h * 1.04); return w; }
  const w = (h * walkIm.naturalWidth) / walkIm.naturalHeight; c.drawImage(walkIm, -w * (role === "prince" ? g.hipX : 0.5), -h, w, h); return w;
}
function drawCourtWalk(c: C, im: HTMLImageElement, role: CourtRole, w: number, h: number, ph: number) {
  const g = COURT_GAIT[role], nw = im.naturalWidth, nh = im.naturalHeight;
  const f = gaitFrame(ph), bob = -walkBob(ph, h);
  if (g.style === "mantle") {
    const legs = folkImage("legsM");
    if (legs) drawMantled(c, im, 0, nw, nh, legs, f, w, h, g, ph, -bob); else c.drawImage(im, -w / 2, -h - bob, w, h);
    return;
  }
  if (g.style === "robe") {
    // stately mantle: slower, heavier swing than a skirt
    drawRobeWalk(c, im, 0, nw, nh, folkImage("footF"), w, h, ph, g.hemY, 0.93, -bob, role === "prince" ? 0.025 : 0.035);
    return;
  }
  const legs = legsImg(g);
  if (legs) drawLegged(c, im, 0, nw, nh, legs, f, w, h, g, -bob, -bob, ph);
  else c.drawImage(im, -w / 2, -h - bob, w, h);
}

/** One walk-sheet cell, inset by SHEET_INSET source px so neighbour frames' toes never bleed in. */
const SHEET_INSET = 3;
function drawSheetFrame(c: C, sheet: HTMLImageElement, f: number, fw: number, ww: number, hgt: number, dx: number) {
  const k = SHEET_INSET, sw = fw - 2 * k, dw = (ww * sw) / fw;
  c.drawImage(sheet, f * fw + k, 0, sw, sheet.naturalHeight, -dw / 2 + dx, -hgt, dw, hgt);
}

/** Dev sprite lab: one row per figure, one card per situation it meets in the game — drawn by the real game paths. */
export type LabOpts = { boxes: boolean; lines: boolean; weather: WeatherKind | null };
export type LabCat = "mayor" | "court" | "folk" | "robe" | "kids" | "animal" | "feast" | "road";
type LabEntry = { label: string; row: string; sit: string; cat: LabCat; h: number; w?: number; night?: boolean; wx?: WeatherKind | undefined; cfg: FigureConfig | null; draw: (c: C, h: number, ph: number, now: number) => number | null };
const LAB_SEED = { id: "lab", hue: 30, bought: [], x: 0, y: 0 } as unknown as Seed;
type LabSit = "stand" | "walk" | "work" | "carry" | "carryStand" | "bucket" | "lantern" | "rain" | "storm" | "snow";
const SIT_LABEL: Record<LabSit, string> = { stand: "Stehen", walk: "Gehen", work: "Arbeit", carry: "Last tragen", carryStand: "Last · Stehen", bucket: "Löscheimer", lantern: "Nacht · Laterne", rain: "Regen", storm: "Sturm", snow: "Schnee · Frost" };
function labEntries(): LabEntry[] {
  const out: LabEntry[] = [];
  let pid = 1;
  /** A villager drawn exactly like on the map (drawFolk + bucket + lantern), in every situation the game gives them. */
  const person = (row: string, cat: LabCat, job: string, sex: "m" | "f", age: number, sits: LabSit[], o: { estate?: string; festive?: "bride" | "groom" } = {}) => {
    const id = pid++;
    const p = { id, seed: LAB_SEED, first: row, last: "", sex, age, job, home: [0, 0], work: null, workIndoor: false, speed: 1,
      looks: { skin: 0, hair: 0, shirt: 0, pants: 0, hat: false, stick: false }, estate: o.estate } as unknown as Person;
    for (const sit of sits) {
      const walking = sit === "walk" || sit === "carry" || sit === "lantern" || sit === "rain" || sit === "storm";
      const pose = (ph: number): Pose => ({ p, x: 0, y: 0, visible: true, walking, dir: [1, 0], phase: ph, act: sit === "work" ? "work" : "stroll",
        working: sit === "work", talk: null, talkTurn: false, carry: sit === "carry" || sit === "carryStand" ? "grain" : null, dest: null, festive: o.festive, bucket: sit === "bucket" });
      const k = folkOf(pose(0)), robe = SKIRTS.has(k);
      const work = sit === "work", big = work ? (JOB_WORK[job]?.scale ?? 1.3) : 1;
      out.push({
        label: `${row} · ${SIT_LABEL[sit]}`, row, sit: SIT_LABEL[sit], cat, h: 4.4 * big + (sit === "bucket" ? 0.5 : 0), w: work ? 4.6 : sit === "bucket" || sit === "lantern" ? 5.4 : 3.6,
        night: sit === "lantern", wx: sit === "rain" ? "drizzle" : sit === "storm" ? "storm" : sit === "snow" ? "snow" : undefined,
        cfg: walking ? (robe ? fig(ROBE_HIP[k] ?? 0.5, 0.8, { style: "robe" }) : HIPS[k] ?? null) : null,
        draw: (c, _h, ph, now) => {
          const q = pose(ph);
          const top = drawFolk(c, 0, 0, q, now);
          if (!top) return null;
          if (q.carry) drawCarryProp(c, 0, 0, q, -top[1]);
          if (q.bucket) drawBucket(c, 0, 0, q, now);
          if (sit === "lantern") drawHandLantern(c, 0, 0, q, now);
          return 3.6;
        },
      });
    }
  };
  const ADULT: LabSit[] = ["stand", "walk", "work", "bucket", "lantern", "rain", "storm", "snow"];
  const PLAIN: LabSit[] = ["stand", "walk", "bucket", "lantern", "rain", "storm", "snow"];
  const KID: LabSit[] = ["stand", "walk", "rain", "snow"];
  // clergy, elders and the well-to-do never haul sacks or join the bucket chain in the game
  const GENTLE: LabSit[] = ["stand", "walk", "lantern", "rain", "storm", "snow"];
  // mayors: every age cohort, standing, walking, at office talk, at night, in the rain
  for (const sex of ["m", "f"] as const) for (const age of [20, 30, 40, 50, 60, 70])
    person(`Schulze${sex === "f" ? "in" : ""} ${age}`, "mayor", "mayor", sex, age, ["stand", "walk", "work", "lantern", "rain", "snow"]);
  // men
  person("Bürger", "folk", "crafter", "m", 35, PLAIN);
  person("Wohlhabender Bürger", "folk", "crafter", "m", 45, GENTLE, { estate: "wealthy" });
  person("Kaufmann", "folk", "merchant", "m", 46, ADULT);
  person("Bauer", "folk", "farmer", "m", 35, ADULT);
  person("Holzfäller", "folk", "woodcutter", "m", 30, ADULT);
  person("Steinmetz", "folk", "mason", "m", 40, ADULT);
  person("Zimmermann", "folk", "builder", "m", 30, ADULT);
  person("Schmied", "folk", "smith", "m", 40, ADULT);
  person("Fischer", "folk", "fisher", "m", 35, ADULT);
  person("Kräutersammler", "folk", "herbalist", "m", 45, ADULT);
  person("Fuhrmann", "folk", "carter", "m", 42, ADULT);
  person("Wächter", "folk", "watchman", "m", 38, ADULT);
  person("Sackträger", "folk", "carter", "m", 30, ["carryStand", "carry"]);
  person("Bäcker", "folk", "baker", "m", 38, ADULT);
  person("Müller", "folk", "miller", "m", 44, ADULT);
  person("Wirt", "folk", "innkeeper", "m", 40, ADULT);
  person("Sägemüller", "folk", "sawyer", "m", 36, ADULT);
  person("Tagelöhner", "folk", "worker", "m", 28, ADULT);
  person("Schulmeister", "folk", "teacher", "m", 45, PLAIN);
  person("Brandmeister", "folk", "firewarden", "m", 42, ADULT);
  person("Jäger (im Ort)", "folk", "hunter", "m", 36, PLAIN);
  person("Ältester", "folk", "retired", "m", 70, GENTLE);
  person("Bräutigam", "folk", "crafter", "m", 24, ["stand", "walk"], { festive: "groom" });
  out.push({ label: "Räuber · Schleichen", row: "Räuber", sit: "Schleichen", cat: "folk", h: 4.4, w: 3.6, cfg: HIPS.robber ?? null, draw: (c, _h, _ph, now) => { drawRobber(c, 0, 0, false, now); return 3.6; } });
  // women and gowns
  person("Bürgerin", "robe", "homemaker", "f", 35, PLAIN);
  person("Sackträgerin", "robe", "carter", "f", 30, ["carryStand", "carry"]);
  person("Wohlhabende Bürgerin", "robe", "homemaker", "f", 42, GENTLE, { estate: "wealthy" });
  person("Bäuerin", "robe", "farmer", "f", 35, ADULT);
  person("Holzfällerin", "robe", "woodcutter", "f", 30, ADULT);
  person("Steinmetzin", "robe", "mason", "f", 40, ADULT);
  person("Bauarbeiterin", "robe", "builder", "f", 30, ADULT);
  person("Fischerin", "robe", "fisher", "f", 35, ADULT);
  person("Heilerin", "robe", "healer", "f", 50, ADULT);
  person("Händlerin", "robe", "merchant", "f", 40, ADULT);
  person("Bäckerin", "robe", "baker", "f", 36, ADULT);
  person("Wirtin", "robe", "innkeeper", "f", 40, ADULT);
  person("Kräuterfrau", "robe", "herbalist", "f", 48, ADULT);
  person("Magd", "robe", "worker", "f", 24, ADULT);
  person("Großmutter", "robe", "homemaker", "f", 70, GENTLE);
  person("Priester", "robe", "priest", "m", 50, GENTLE);
  person("Braut", "robe", "homemaker", "f", 22, ["stand", "walk"], { festive: "bride" });
  // children
  person("Knabe", "kids", "child", "m", 13, KID);
  person("Mädchen", "kids", "child", "f", 13, KID);
  person("Kind (Junge)", "kids", "child", "m", 8, KID);
  person("Kind (Mädchen)", "kids", "child", "f", 8, KID);
  person("Kleinkind", "kids", "child", "m", 4, KID);
  // court: standing breath pose and the walk, through the court's own draw path
  const COURT_NAME: Record<CourtRole, string> = { prince: "Fürst", princess: "Fürstin", herald: "Hofmarschall", guard: "Fürstenwache", gardener: "Hofgärtner", groom: "Stallknecht" };
  for (const r of Object.keys(COURT_GAIT) as CourtRole[]) {
    const im = () => huntIm(`courtfig-${r}`, COURT_FIG[r]), h = courtHeight(r);
    out.push(
      { label: `${COURT_NAME[r]} · Stehen`, row: COURT_NAME[r], sit: "Stehen", cat: "court", h, cfg: null, draw: (c, _h, _ph, now) => { const i = im(); if (!i) return null;
        const br = Math.sin(now / 2100); c.transform(1 - br * 0.004, 0, 0, 1 + br * 0.012, 0, 0);
        return drawCourtStand(c, r, i, h, COURT_GAIT[r]); } },
      { label: `${COURT_NAME[r]} · Gehen`, row: COURT_NAME[r], sit: "Gehen", cat: "court", h, cfg: COURT_GAIT[r], draw: (c, _h, ph) => { const i = im(); if (!i) return null;
        const w = (h * i.naturalWidth) / i.naturalHeight; drawCourtWalk(c, i, r, w, h, ph); return w; } },
    );
  }
  // the prince's mounted messenger, exactly as he rides into the village
  const HB = (sit: string, dx: number, dy: number, walk: boolean, waiting: boolean, night: boolean): LabEntry => ({
    label: `Fürstlicher Bote · ${sit}`, row: "Fürstlicher Bote", sit, cat: "court", h: 12, w: 9, night, cfg: null,
    draw: (c, _h, ph, now) => { drawHerald(c, 0, 0, dx, dy, walk ? (ph / 6.2832) * 4 : null, walk ? 1 : 0, now, waiting, night, 3); return 9; } });
  out.push(HB("Trab", 1, 0.3, true, false, false), HB("Wartet mit Erlass", 1, 0.3, false, true, false), HB("Nacht · Laterne", 1, 0.3, true, false, true), HB("Reitet fort", 1, -1, true, false, false));
  // the knighted mayor on his riding horse (own strolling mayor after princely_knight), through the same drawRider path
  for (const [sit, dx, dy, walk] of [["Steht", 1, 0.3, false], ["Reitet", 1, 0.3, true], ["Reitet fort", 1, -1, true]] as const)
    out.push({ label: `Ritterschulze · ${sit}`, row: "Ritterschulze", sit, cat: "mayor", h: 11, w: 9, cfg: null,
      draw: (c, _h, ph) => { drawRider(c, 0, 0, dx, dy, 0, walk ? (ph / 6.2832) * 4 * RIDER_MS : 0); return 9; } });
  // animals, hunters and riders: real game draw calls at the origin; ph (radians) is turned into the distance / clock each one steps by
  const A = (row: string, sit: string, h: number, w: number, draw: (c: C, ph: number, now: number) => unknown): LabEntry =>
    ({ label: `${row} · ${sit}`, row, sit, cat: "animal", h, w, cfg: null, draw: (c, _h, ph, now) => (draw(c, ph, now) === false ? null : w) });
  out.push(
    A("Reitbote", "Hinreiten", 11, 9, (c, ph) => drawRider(c, 0, 0, 1, 0.3, 0, (ph / 6.2832) * 4 * RIDER_MS)),
    A("Reitbote", "Fortreiten", 11, 9, (c, ph) => drawRider(c, 0, 0, 1, -1, 0, (ph / 6.2832) * 4 * RIDER_MS)),
    A("Jäger", "Steht", 5.4, 3, (c, _ph, now) => { const hu = huntIm("hu", hunterUrl); if (!hu) return false; const f = Math.floor(now / 1200) % 3;
      shadow(c, 0, 0, 1.6, 0.3); sheetFrame(c, hu, f, 0, 0, 5.4, false); return true; }),
    A("Jäger", "Geht", 5.4, 3, (c, ph) => { const w = huntIm("huw", hunterWalkUrl); if (!w) return false; shadow(c, 0, 0, 1.6, 0.3); sheetFrame(c, w, step4(ph), 0, 0, 5.4, false); return true; }),
    A("Jäger", "Trägt Beute", 5.4, 3, (c, ph) => { const w = huntIm("huc", hunterCarryUrl); if (!w) return false; shadow(c, 0, 0, 1.6, 0.3); sheetFrame(c, w, step4(ph), 0, 0, 5.4, false); return true; }),
    A("Schaf", "Geht", 4, 5, (c, ph) => drawSheep(c, 0, 0, false, (ph / 6.2832) * 1440, true, false, false)),
    A("Schaf", "Weidet", 4, 5, (c, _ph, now) => drawSheep(c, 0, 0, false, now, false, true, false)),
    A("Schaf", "Schläft", 3, 5, (c, _ph, now) => drawSheep(c, 0, 0, false, now, false, false, true)),
    A("Kuh", "Geht", 5.2, 7, (c, ph) => { shadow(c, 0, 0, 2.8); c.save(); const ok = cowStep(c, 5.2, step4(ph)); c.restore(); return ok; }),
    A("Kuh", "Auf der Weide", 4.6, 14, (c, _ph, now) => drawCow(c, 0, 0, now, 3, 1)),
    A("Hausschwein", "Geht", 3.6, 6, (c, ph) => { const pw = huntIm("pw", pigWalkUrl); if (!pw) return false; drawBeast(c, pw, null, 0, 0, 3.6, false, 1, (ph / 6.2832) * 4.4, 0, 1, BOAR_GAIT); return true; }),
    A("Hausschwein", "Wühlt", 3.6, 6, (c, _ph, now) => { const pw = huntIm("pw", pigWalkUrl); if (!pw) return false; shadow(c, 0, 0, 1.8); sheetFrame(c, huntIm("pr", pigRootUrl) ?? pw, 0, 0, -(Math.floor(now / 500) & 1) * 0.08, 3.6, false, 0, 1, false, 1); return true; }),
    A("Hausschwein", "Eichelmast", 3, 11, (c, _ph, now) => drawPig(c, 0, 0, now, 5)),
    A("Gans", "Geht", 2.5, 5, (c, ph) => drawFarmAnimal(c, "goose", 0, 0, 0, 0, Math.floor(ph / 6.2832 * 4) & 3)),
    A("Gans", "Am Ufer", 2.5, 18, (c, _ph, now) => drawFarmAnimal(c, "goose", 0, 0, now, 7)),
    A("Ziege", "Geht", 3.3, 6, (c, ph) => drawFarmAnimal(c, "goat", 0, 0, 0, 0, Math.floor(ph / 6.2832 * 4) & 3)),
    A("Ziege", "Bei der Hütte", 3.3, 12, (c, _ph, now) => drawFarmAnimal(c, "goat", 0, 0, now, 9)),
    A("Wildschwein", "Geht", 2.7, 4, (c, ph) => { const bw = huntIm("bw", boarWalkUrl); if (!bw) return false; drawBeast(c, bw, null, 0, 0, 2.7, false, 1, (ph / 6.2832) * 4.4, 0, 1, BOAR_GAIT); return true; }),
    A("Wildschwein", "Wühlt", 2.7, 4, (c, _ph, now) => { const bw = huntIm("bw", boarWalkUrl); if (!bw) return false; shadow(c, 0, 0, 1.35); sheetFrame(c, huntIm("br", boarRootUrl) ?? bw, 0, 0, -(Math.floor(now / 500) & 1) * 0.08, 2.7, false, 0, 1, false, 1); return true; }),
    A("Hirsch", "Geht", 4.9, 6, (c, ph) => { const dw = huntIm("dw", deerWalkUrl); if (!dw) return false; drawBeast(c, dw, null, 0, 0, 4.9, false, 1, (ph / 6.2832) * 4.4, 0, 1, DEER_GAIT); return true; }),
    A("Hirsch", "Äst", 4.9, 6, (c, _ph, now) => { const dw = huntIm("dw", deerWalkUrl), dg = huntIm("dg", deerGrazeUrl); if (!dw || !dg) return false;
      drawBeast(c, dw, dg, 0, 0, 4.9, false, 0, 0, Math.floor(now / 1500) % 8 < 5 ? (Math.floor(now / 650) & 1) : 2); return true; }),
    A("Hund", "Trabt", 2.2, 2.4, (c, ph, now) => drawDog(c, { x: 0, y: 0, mode: "trot", flip: false, dist: (ph / 6.2832) * 0.44 }, 0, 0, now, 1)),
    A("Hund", "Geht", 2.2, 2.4, (c, ph, now) => drawDog(c, { x: 0, y: 0, mode: "walk", flip: false, dist: (ph / 6.2832) * 0.32 }, 0, 0, now, 1)),
    A("Hund", "Sitzt", 2, 2, (c, _ph, now) => drawDog(c, { x: 0, y: 0, mode: "sit", flip: false, dist: 0 }, 0, 0, now, 1)),
    A("Hund", "Schläft", 1.5, 3, (c, _ph, now) => drawDog(c, { x: 0, y: 0, mode: "sleep", flip: false, dist: 0 }, 0, 0, now, 1)),
  );
  // poultry and birds of the open map
  out.push(
    A("Hühner", "Scharren", 2.4, 18, (c) => drawHens(c, 0, -5, 7)),
    A("Krähe", "Fliegt", 6, 30, (c) => drawBird(c, 0, -20, false, 3)),
    A("Möwe", "Fliegt", 6, 30, (c) => drawBird(c, 0, -20, true, 5)),
  );
  // feast figures, through the same draw paths as on feast days
  const F = (row: string, sit: string, h: number, w: number, draw: (c: C, ph: number, now: number) => unknown): LabEntry =>
    ({ label: `${row} · ${sit}`, row, sit, cat: "feast", h, w, cfg: null, draw: (c, _h, ph, now) => (draw(c, ph, now) === false ? null : w) });
  const fw = (walking: boolean): Walk => ({ x: 0, y: 0, dx: 1, dy: 0.3, walking });
  out.push(
    F("St. Martin", "Reitet", 12, 9, (c, ph) => drawMartin(c, 0, 0, fw(true), (ph / 6.2832) * 4 * RIDER_MS)),
    F("St. Martin", "Hält an der Kirche", 12, 9, (c, _ph, now) => drawMartin(c, 0, 0, fw(false), now)),
    F("Pfingstochse", "Wird geführt", 6, 8, (c, _ph, now) => drawOx(c, 0, 0, fw(true), now)),
    F("Pfingstochse", "Steht geschmückt", 6, 8, (c, _ph, now) => drawOx(c, 0, 0, fw(false), now)),
  );
  // herdsman leading the ox, and the Epiphany star singers (paper crowns, the first carries the star)
  const feastPerson = (row: string, sit: string, job: string, sex: "m" | "f", age: number, walking: boolean, star: number | null) => {
    const id = 9000 + pid++;
    const p = { id, seed: LAB_SEED, first: row, last: "", sex, age, job, home: [0, 0], work: null, workIndoor: false, speed: 1,
      looks: { skin: 0, hair: 0, shirt: 0, pants: 0, hat: false, stick: false } } as unknown as Person;
    const k = folkOf({ p, x: 0, y: 0, visible: true, walking, dir: [1, 0], phase: 0, act: "stroll", working: false, talk: null, talkTurn: false, carry: null, dest: null } as Pose);
    out.push({ label: `${row} · ${sit}`, row, sit, cat: "feast", h: star === 0 ? 7 : 4.6, w: 4.6, cfg: walking ? (SKIRTS.has(k) ? fig(ROBE_HIP[k] ?? 0.5, 0.8, { style: "robe" }) : HIPS[k] ?? null) : null,
      draw: (c, _h, ph, now) => {
        const q = { p, x: 0, y: 0, visible: true, walking, dir: [1, 0], phase: ph, act: "stroll", working: false, talk: null, talkTurn: false, carry: null, dest: null } as unknown as Pose;
        const fz0 = fzNow, fh0 = fzHour;
        if (star != null) { fzNow = "epiphany"; fzHour = 12; fzStars.set(id, star); }
        try {
          const top = drawFolk(c, 0, 0, q, now); if (!top) return null;
          if (star != null) drawFeastKit(c, 0, 0, q, now, top[1]);
          return 3.6;
        } finally { fzNow = fz0; fzHour = fh0; fzStars.delete(id); }
      } });
  };
  feastPerson("Ochsenhirte", "Führt am Halfter", "farmer", "m", 40, true, null);
  feastPerson("Ochsenhirte", "Steht beim Ochsen", "farmer", "m", 40, false, null);
  feastPerson("Sternsinger (Stern)", "Geht", "child", "m", 12, true, 0);
  feastPerson("Sternsinger (Stern)", "Steht an der Tür", "child", "m", 12, false, 0);
  feastPerson("Sternsingerin", "Geht", "child", "f", 10, true, 1);
  feastPerson("Sternsinger", "Geht", "child", "m", 8, true, 2);
  // road traffic: wanderers, carts, boats and craft yards — real game draw calls
  const R = (row: string, sit: string, h: number, w: number, draw: (c: C, ph: number, now: number) => unknown): LabEntry =>
    ({ label: `${row} · ${sit}`, row, sit, cat: "road", h, w, cfg: null, draw: (c, _h, ph, now) => (draw(c, ph, now) === false ? null : w) });
  const tw = (ph: number) => (ph / 6.2832) * 1000 / 0.95;
  out.push(
    R("Fernwanderer", "Wandert hin", 5, 3.6, (c, ph) => drawWanderer(c, 0, 0, 1, 0.3, tw(ph), 11)),
    R("Fernwanderer", "Wandert fort", 5, 3.6, (c, ph) => drawWanderer(c, 0, 0, 1, -1, tw(ph), 11)),
    R("Wanderin", "Wandert", 5, 3.6, (c, ph) => drawWanderer(c, 0, 0, 1, 0.3, tw(ph), 4)),
    R("Händler mit Last", "Wandert", 5, 4, (c, ph) => drawWanderer(c, 0, 0, 1, 0.3, tw(ph), 17, "bundle")),
    R("Ochsenkarren", "Fährt hin", 9, 14, (c, ph) => drawCart(c, 0, 0, 1, 0.3, 0, 21, "", tw(ph) * 0.6, "lab-cart-a")),
    R("Ochsenkarren", "Fährt fort", 9, 14, (c, ph) => drawCart(c, 0, 0, 1, -1, 0, 21, "", tw(ph) * 0.6, "lab-cart-b")),
    R("Ochsenkarren", "Steil zu", 16, 8, (c, ph) => drawCart(c, 0, 0, 0.1, 1, 0, 21, "", tw(ph) * 0.6, "lab-cart-c")),
    R("Ochsenkarren", "Steil fort", 16, 8, (c, ph) => drawCart(c, 0, 0, 0.1, -1, 0, 21, "", tw(ph) * 0.6, "lab-cart-d")),
    R("Ochsenkarren", "Größenvergleich", 16, 56, (c, ph) => {
      // all four cart views beside the pasture cow; dashed lines: ox shoulder 5.0, adult head 5.2
      const t = tw(ph) * 0.6;
      drawCart(c, -20, 0, 1, 0.3, 0, 21, "", t, "lab-cmp-a"); drawCart(c, -5, 0, 1, -1, 0, 21, "", t, "lab-cmp-b");
      drawCart(c, 7, 0, 0.1, 1, 0, 21, "", t, "lab-cmp-c"); drawCart(c, 15, 0, 0.1, -1, 0, 21, "", t, "lab-cmp-d");
      const cw = huntIm("cow", cowUrl); if (cw) { const W = 5.6, H = (cw.naturalHeight / cw.naturalWidth) * W; c.drawImage(cw, 22, -H, W, H); }
      c.lineWidth = 0.08; c.setLineDash([0.4, 0.3]);
      for (const [yy, col] of [[-5, "rgba(200,30,30,0.9)"], [-5.2, "rgba(30,90,200,0.9)"]] as const) { c.strokeStyle = col; c.beginPath(); c.moveTo(-28, yy); c.lineTo(28, yy); c.stroke(); }
      c.setLineDash([]);
    }),
    R("Kahn", "Treibt", 6, 13, (c, _ph, now) => drawBoat(c, 0, -1, false, now, 3)),
    R("Böttcher", "Biegt Dauben", 7, 9, (c, _ph, now) => { prop(c, "cooper", 0, 0, 7); smoke(c, -1, -4, now, 3, 0.3);
      }),
    R("Weberin", "Am Webstuhl", 7, 9, (c, _ph, now) => { prop(c, "loom", 0, 0, 6.5);
      const im = folkImage("loom"); if (im) { const w = 6.5, h = (w * im.naturalHeight) / im.naturalWidth, by = -h * 0.85 + h * 0.45, sw = Math.sin(now / 380) * 0.5;
        c.strokeStyle = "rgba(70,48,28,0.9)"; c.lineWidth = 0.35; c.beginPath(); c.moveTo(-w * 0.25 + sw, by); c.lineTo(w * 0.2 + sw, by - h * 0.12); c.stroke(); } }),
  );
  return out;
}
/**
 * Dev only (Figure-Lab "Boden"): a 5×5 pasture patch drawn through the real layer functions,
 * cumulatively: 0 base texture, 1 + textureAlt, 2 + wildTurf, 3 + pasture plants (agriDetail).
 * A 5-px scale bar marks villager height. Nothing here feeds the map.
 */
export function drawGroundLab(c: C, stage: number, W: number, H: number, z: number, now: number) {
  const rn = renderNow; renderNow = now;
  c.save(); c.translate(W / 2, H / 2 - 2.5 * TH * z); c.scale(z, z);
  const N = 5, winter = seasonAt(now).winter >= 0.6;
  for (let s = 0; s < N * 2 - 1; s++) for (let x = 0; x < N; x++) {
    const y = s - x; if (y < 0 || y >= N) continue;
    const cx = (x - y) * TW / 2, cy = (x + y) * TH / 2, wx = 300 + x, wy = 300 + y;
    const pp = P(cx, cy), d = [pp(-0.5, -0.5), pp(0.5, -0.5), pp(0.5, 0.5), pp(-0.5, 0.5)];
    c.beginPath(); c.moveTo(d[0]![0], d[0]![1]); for (const q of d.slice(1)) c.lineTo(q[0], q[1]); c.closePath();
    c.fillStyle = texture(c, "grass") ?? "#6b7a3a"; c.fill();
    if (stage >= 1) { const alt = textureAlt(c, "grass"); if (alt) { c.globalAlpha = VEG.altAlpha; c.fillStyle = alt; c.fill(); c.globalAlpha = 1; } }
    if (stage >= 2) wildTurf(c, wx, wy, cx, cy, "grass");
  }
  if (stage >= 3) for (let s = 0; s < N * 2 - 1; s++) for (let x = 0; x < N; x++) {
    const y = s - x; if (y < 0 || y >= N) continue;
    const cx = (x - y) * TW / 2, cy = (x + y) * TH / 2, v = Math.floor(hash(300 + x, 300 + y, 661) * AGRI_VARIANTS);
    const a: AgriSpec = { kind: "pasture", ripe: false, along: false, outer: [], winter, hx: 7001 + v * 3, hy: 5003, k2: 0.5 };
    const sp = agriSprite(a, `p0.5|${v}${seasonKey(now)}`); if (sp) c.drawImage(sp, cx - AGRI_W / 2, cy - AGRI_UP, AGRI_W, AGRI_H);
  }
  if (stage >= 4) { // scale references: sheep and a cow on the patch
    const t = now / 1000;
    drawSheep(c, -10, 30, false, t, false, true, false); drawSheep(c, 14, 38, true, t, false, true, false); drawSheep(c, 4, 26, false, t, false, false, false);
    drawCow(c, -2, 46, now, 77, 0);
  }
  // scale bar: villager height (5 world px)
  c.fillStyle = "rgba(200,30,30,0.85)"; c.fillRect(-1 * TW, 2 * TH, 0.6, -5);
  c.restore(); renderNow = rn;
}
let labCache: LabEntry[] | null = null;
const labList = () => (labCache ??= labEntries());
/** Names and groups of every lab entry, in display order. */
export function labCatalog(): { label: string; row: string; sit: string; night: boolean; cat: LabCat; h: number; w: number }[] { return labList().map((e) => ({ label: e.label, row: e.row, sit: e.sit, night: !!e.night, cat: e.cat, h: e.h, w: e.w ?? e.h * 0.6 })); }
/** Draws entry i with its feet at (x, y) in canvas pixels, z pixels per world unit; ph = gait phase in radians. */
export function drawLabFigure(c: C, i: number, x: number, y: number, z: number, ph: number, now: number, o: LabOpts) {
  const e = labList()[i]; if (!e) return;
  c.save(); c.translate(x, y); c.scale(z, z); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  // the card's own weather (rain/storm/snow column) or the cabinet-wide choice; restored so the map keeps its sky
  const rn = renderNow; renderNow = now; setWeatherPreview(e.wx ?? o.weather);
  let w: number | null = null;
  try { w = e.draw(c, e.h, ph, now); } finally { setWeatherPreview(null); renderNow = rn; c.restore(); }
  if (w == null) return;
  const h = e.h * z, ww = w * z, g = e.cfg;
  c.lineWidth = 1;
  if (o.boxes) { c.strokeStyle = "rgba(0,120,255,0.8)"; c.strokeRect(x - (g ? g.hipX : 0.5) * ww, y - h, ww, h); }
  if (o.lines) {
    const line = (fy: number, col: string) => { c.strokeStyle = col; c.beginPath(); c.moveTo(x - ww * 0.8, y - h + fy * h); c.lineTo(x + ww * 0.8, y - h + fy * h); c.stroke(); };
    if (g) { line(g.style === "robe" ? 1 - LEG_RATIO : g.hipY, "rgba(220,30,30,0.9)"); line(g.hemY, "rgba(20,160,60,0.9)"); }
    // dashed ground line: soles must sit on it in stance, not slide
    c.setLineDash([4, 3]); line(1, "rgba(40,40,40,0.85)"); c.setLineDash([]);
  }
  c.fillStyle = "#e0007a"; c.beginPath(); c.arc(x, y, Math.max(1.5, Math.min(4, z * 0.12)), 0, 7); c.fill();
}
// ---------------- player rituals: festive garlands and signposts ----------------
let signSrc: Signpost[] = [], signKey = "", signSeeds: Seed[] | null = null;
const signMap = new Map<number, Signpost>();
export function setSignposts(list: Signpost[]) { signSrc = list; }
/** Tile key → signpost, rebuilt when the posts or the seed set (incl. their roads) change. */
export function signpostMap(seeds: Seed[]) {
  // hourly bucket: posts follow the growing town edge
  const k = signSrc.map((p) => p.id + p.message).join("|") + "@" + Math.floor(clock() / 3.6e6);
  if (k !== signKey || seeds !== signSeeds) {
    signKey = k; signSeeds = seeds; signMap.clear();
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
  c.fillStyle = "rgba(25,18,10,0.25)"; c.beginPath(); c.ellipse(x + 0.6, y + 0.3, 2, 0.7, 0, 0, 7); c.fill();
  c.save(); c.translate(x, y); if (sd % 2) c.scale(-1, 1); c.drawImage(im, -w * 0.47, -h * 0.97, w, h); c.restore();
}

/** Wooden pail in a fire helper's hand; while standing at the blaze, water arcs toward the flames. */
function drawBucket(c: C, x: number, y: number, q: Pose, t: number) {
  // a real pail (~30 cm) hanging from the hand at the hip, bobbing with the stride
  const f = bodyFace(q), bob = q.walking ? Math.abs(Math.sin(q.phase + hash(q.p.id, 77, 5) * 6.2832)) * 0.07 : 0;
  const sw = q.walking ? Math.sin(q.phase * 2 + q.p.id) * 0.08 : 0;
  const bx = x + f * 0.75 + sw, by = y - 2.0 - bob;
  c.save();
  const im = folkImage("loadBucket");
  if (im) { const bw = 0.95, bh = (bw * im.naturalHeight) / im.naturalWidth; c.drawImage(im, bx - bw / 2, by + 0.7 - bh, bw, bh); }
  if (!q.walking) {
    const u = ((t / 840 + q.p.id * 0.37) % 1);
    if (u < 0.5) {
      // a painted sheet of water flung from the rim: a tapering ribbon along the arc,
      // a pale highlight stroke, scattered spray, then hiss-steam where it meets the blaze
      const k = u / 0.5, arc = (s: number): [number, number] => [bx + f * (0.6 + s * 5.5), by - 1.2 - Math.sin(s * Math.PI) * 2.6 + s * 2.6];
      const head = Math.min(1, k * 1.6), tail = Math.max(0, k * 1.6 - 0.6), fade = k < 0.75 ? 1 : (1 - k) / 0.25;
      if (head > tail + 0.02) {
        const N = 10, up: [number, number][] = [], dn: [number, number][] = [];
        for (let i = 0; i <= N; i++) {
          const s = tail + ((head - tail) * i) / N, [px, py] = arc(s), wd = 0.42 * (1 - s * 0.55) * Math.sin((i / N) * Math.PI * 0.9 + 0.15);
          up.push([px, py - wd]); dn.push([px, py + wd]);
        }
        c.fillStyle = `rgba(150,182,198,${0.55 * fade})`;
        c.beginPath(); c.moveTo(up[0]![0], up[0]![1]);
        for (const p of up) c.lineTo(p[0], p[1]);
        for (let i = dn.length - 1; i >= 0; i--) c.lineTo(dn[i]![0], dn[i]![1]);
        c.closePath(); c.fill();
        c.strokeStyle = `rgba(232,240,240,${0.6 * fade})`; c.lineWidth = 0.12; c.lineCap = "round";
        c.beginPath(); for (let i = 0; i <= N; i++) { const p = up[i]!; i ? c.lineTo(p[0], p[1] + 0.08) : c.moveTo(p[0], p[1] + 0.08); } c.stroke();
      }
      // loose spray drops shed off the sheet
      for (let i = 0; i < 6; i++) {
        const s = tail + (head - tail) * hash(q.p.id, i, 811), [px, py] = arc(s), j = hash(q.p.id, i, 812) - 0.5;
        c.fillStyle = `rgba(215,230,235,${0.6 * fade})`;
        c.beginPath(); c.ellipse(px + j * 0.6, py - 0.5 - Math.abs(j) * 0.7 - k * 0.4, 0.09, 0.07, 0, 0, 7); c.fill();
      }
      // steam where the water lands
      if (head >= 1) {
        const [ex, ey] = arc(1), g = Math.min(1, (k - 0.62) / 0.2) * fade;
        for (let i = 0; i < 3; i++) {
          const r = 0.5 + i * 0.35 + k * 0.6;
          c.fillStyle = `rgba(225,225,220,${0.22 * g * (1 - i / 3)})`;
          c.beginPath(); c.ellipse(ex + (i - 1) * 0.35, ey - 0.6 - i * 0.55 - k * 0.8, r, r * 0.65, 0, 0, 7); c.fill();
        }
      }
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
/** Village pigs masting under the oaks (Allmende): root for acorns, then trot a few steps; asleep in the sty at night. */
function drawFarmAnimal(c: C, kind: FarmAnimal, x: number, y: number, now: number, sd: number, previewFrame?: number) {
  if (kind === "pig") { drawPig(c, x, y, now, sd); return; }
  const im = huntIm(kind, kind === "goose" ? gooseWalkUrl : goatWalkUrl); if (!im) return false;
  const count = kind === "goose" && previewFrame === undefined ? 3 : 1;
  for (let k = 0; k < count; k++) {
    const p = farmAnimalPose(sd, count === 1 ? 1 : k, now), h = kind === "goose" ? 1.5 : 2.1;
    const X = x + (previewFrame === undefined ? p.dx * 0.65 : 0), Y = y + (previewFrame === undefined ? Math.abs(p.dy) * 0.65 : 0); // stay in front of trees/huts on the tile
    shadow(c, X, Y, h * 0.42);
    sheetFrame(c, im, previewFrame ?? p.frame, X, Y, h, previewFrame === undefined && p.flip);
  }
  return true;
}
function drawPig(c: C, x: number, y: number, now: number, sd: number) {
  const bw = huntIm("pw", pigWalkUrl); if (!bw || animalsSleeping(now)) return;
  const CYC = 30000, WALK = 5000, tt = now + hash(sd, 1, 1503) * CYC, k = Math.floor(tt / CYC), u = tt - k * CYC;
  const spot = (j: number): [number, number] => [(hash(sd, j, 1504) - 0.5) * 6, 0.3 + hash(sd, j, 1505) * 1.5]; // only in front of the oak's foot, never behind the trunk
  const a = spot(k), b = spot(k + 1), into = u - (CYC - WALK), f = into > 0 ? into / WALK : 0, e = f * f * (3 - 2 * f);
  const X = x + a[0] + (b[0] - a[0]) * e, Y = y + a[1] + (b[1] - a[1]) * e, h = 2.4, flip = (into > 0 ? b[0] - a[0] : a[0] - spot(k - 1)[0]) < 0;
  shadow(c, X, Y, h * 0.45);
  if (into > 0) sheetFrame(c, bw, BOAR_GAIT[Math.floor((into / 1000) * 3.2) & 3] ?? 0, X, Y - Math.abs(Math.sin(into / 160)) * 0.08, h, flip);
  else sheetFrame(c, huntIm("pr", pigRootUrl) ?? bw, 0, X, Y - (Math.floor((now + sd) / 500) & 1) * 0.08, h, flip, 0, 1, false, 1);
}
/** Whitsun ox: the cow sprite led along, garlanded with birch and bright ribbons. */
/** One frame of the painted cow walk sheet (facing left like cow.webp), width w, hooves at 0. */
function cowStep(c: C, w: number, f: number, lift = 0): boolean {
  const cw = huntIm("cw", cowWalkUrl); if (!cw) return false;
  const fw = cw.naturalWidth / 4, h = (cw.naturalHeight / fw) * w;
  c.drawImage(cw, (f & 3) * fw, 0, fw, cw.naturalHeight, -w / 2, -h - lift, w, h); return true;
}
function drawOx(c: C, x: number, y: number, w: Walk, now: number) {
  const im = huntIm("cow", cowUrl); if (!im) return;
  const W = 5.6, H = (im.naturalHeight / im.naturalWidth) * W, dir = -screenFacing(w.dx - w.dy, (w.dx + w.dy) / 2); // cow art faces left: mirror when heading right on screen
  const sway = w.walking ? Math.sin(now / 420) * 0.04 : Math.sin(now / 5200) * 0.006, lift = w.walking ? Math.abs(Math.sin(now / 420)) * 0.15 : 0;
  c.save();
  c.fillStyle = "rgba(25,18,10,0.28)"; c.beginPath(); c.ellipse(x, y + 0.2, 3, 0.95, 0, 0, 7); c.fill();
  c.translate(x, y); c.scale(dir, 1); c.rotate(sway);
  if (!w.walking || !cowStep(c, W, Math.floor(now / 420), 0)) c.drawImage(im, -W / 2, -H - lift, W, H);
  // birch wreath over the shoulders, ribbons fluttering from the horns
  // a twisted birch withy draped over the neck, with small pointed leaves in three greens
  const wy = (u: number) => -H * 0.74 - lift + Math.sin(u * Math.PI) * 0.55;
  c.strokeStyle = "#6b5236"; c.lineWidth = 0.16; c.beginPath();
  for (let i = 0; i <= 10; i++) { const u = i / 10, x0 = -1.5 + u * 2.9; i ? c.lineTo(x0, wy(u)) : c.moveTo(x0, wy(u)); }
  c.stroke();
  const greens = ["#5f7d36", "#7c9a44", "#a3b85c"];
  for (let i = 0; i < 16; i++) {
    const u = i / 15, x0 = -1.5 + u * 2.9, y0 = wy(u), a = (i % 2 ? 0.9 : -0.9) + Math.sin(i * 2.3) * 0.4 + Math.sin(now / 700 + i) * 0.05;
    c.fillStyle = greens[i % 3]!; c.beginPath();
    c.moveTo(x0, y0); c.quadraticCurveTo(x0 + Math.cos(a - 0.5) * 0.3, y0 + Math.sin(a - 0.5) * 0.3, x0 + Math.cos(a) * 0.55, y0 + Math.sin(a) * 0.55);
    c.quadraticCurveTo(x0 + Math.cos(a + 0.5) * 0.3, y0 + Math.sin(a + 0.5) * 0.3, x0, y0); c.fill();
  }
  const fl = Math.sin(now / 180) * 0.5;
  for (const [k, col] of [[0, "#a8392c"], [1, "#d9b25a"], [2, "#3d5f8a"]] as const) {
    c.strokeStyle = col; c.lineWidth = 0.3; c.beginPath(); c.moveTo(W * 0.32, -H * 0.86 - lift); c.quadraticCurveTo(W * 0.15, -H * 0.6 + k * 0.3, W * 0.05 - fl - k * 0.3, -H * 0.45 + k * 0.4); c.stroke();
  }
  c.restore();
}
function drawCow(c: C, x: number, y: number, now: number, sd: number, i: number) {
  const im = huntIm("cow", cowUrl); if (!im) return;
  // shoulder just below a villager's head (person 5.2 tall), like a real cow beside a farmer
  // a cattle beast stands clearly taller and heavier than a sheep (sheep w 4.6)
  const w = 6.8, h = (im.naturalHeight / im.naturalWidth) * w;
  // walk sheet frames are wider than cow.webp: pick the width that gives the same standing height
  const cwi = huntIm("cw", cowWalkUrl), ws = cwi ? (h * cwi.naturalWidth) / 4 / cwi.naturalHeight : w;
  const night = animalsSleeping(now);
  // grazes at one spot ~40-55 s, then ambles slowly (7 s) to the next one instead of teleporting
  const CYC = 48000, WALK = 7000, tt = now + hash(sd, i, 1500) * CYC, k = Math.floor(tt / CYC), u = tt - k * CYC;
  const spot = (j: number): [number, number] => [(hash(sd, j, 1501) - 0.5) * 9 + i * 4 - 4, (hash(sd, j, 1502) - 0.5) * 3.5];
  const a = spot(k), b = spot(k + 1), into = night ? -1 : u - (CYC - WALK);
  const f = into > 0 ? into / WALK : 0, e = f * f * (3 - 2 * f), walking = into > 0;
  const dx = a[0] + (b[0] - a[0]) * e, dy = a[1] + (b[1] - a[1]) * e;
  // facing: the heading of the last walk is held while grazing; a new heading turns in over 400 ms
  // at the start of the walk (horizontal scale passes through a narrow side-on pose) — never a 1-frame flip
  const prevDir = a[0] < spot(k - 1)[0] ? -1 : 1, nextDir = b[0] < a[0] ? -1 : 1;
  // facing flips cleanly with the first step (never a squashed cardboard turn)
  const scaleX = walking ? nextDir : prevDir;
  // hooves stay on the ground: only a slow breath (body stretches a hair upward) and a gentle sway while walking
  const breath = 1 + Math.sin(now / 2600 + sd) * 0.012;
  const tilt = walking ? Math.sin(now / 1100 + sd) * 0.02 : Math.sin(now / 5200 + sd) * 0.006;
  c.save();
  c.fillStyle = "rgba(25,18,10,0.28)"; c.beginPath(); c.ellipse(x + dx, y + dy + 0.2, 3.4, 1.1, 0, 0, 7); c.fill();
  c.translate(x + dx, y + dy); c.scale(-(night ? prevDir : scaleX), 1); // cow art faces left: mirror when heading right
  if (night) c.drawImage(im, 0, im.naturalHeight * 0.45, im.naturalWidth, im.naturalHeight * 0.55, -w / 2, -h * 0.55, w, h * 0.55);
  else if (walking) { c.rotate(tilt * 0.5); if (!cowStep(c, ws, Math.floor(into / 480))) c.drawImage(im, -w / 2, -h * 0.96, w, h); }
  else { c.rotate(tilt); c.scale(1, breath); c.drawImage(im, -w / 2, -h * 0.96, w, h); }
  c.restore();
}

/** Rare orchard trees from the nurseryman: grow from staked sapling to full crown over ~3 weeks and follow the shared seasons. */
function drawRareTree(c: C, x: number, y: number, kind: "cherry" | "quince", ageH: number, now: number, t: number, sd: number) {
  const g = Math.min(1, 0.35 + Math.max(0, ageH) / 500), w = seasonAt(now);
  const leaf = folkImage(kind === "cherry" ? "treeCherry" : "treeQuince"), bare = folkImage("treeFruitBare"), bloom = folkImage("treeCherryBloom");
  if (!leaf || !bare) return;
  const h = 15 * g, sway = Math.sin(t / 1400 + sd) * 0.012 * g, flip = hash(sd, 3, 61) < 0.5;
  c.save();
  c.fillStyle = "rgba(40,50,25,0.22)"; c.beginPath(); c.ellipse(x, y + 0.4, 5.5 * g, 2.2 * g, 0, 0, 7); c.fill();
  c.translate(x, y + 0.6); if (flip) c.scale(-1, 1); c.transform(1, 0, sway, 1, 0, 0);
  const put = (im: HTMLImageElement | HTMLCanvasElement, a: number) => { if (a <= 0.02) return; c.globalAlpha = Math.min(1, a); const ww = (h * im.width) / im.height; c.drawImage(im, -ww / 2, -h, ww, h); };
  const bl = kind === "cherry" && bloom ? w.spring : 0;
  put(bare, 1);
  // autumn: same cached leaf recolour as wild trees (gold/rust), crown thins as leaves fall
  put(seasonalImage(leaf, "leaf"), (1 - w.winter) * (1 - bl) * (1 - w.autumn * 0.25));
  if (bloom) put(bloom, bl * (1 - w.winter));
  c.restore();
}

const framePool = {
  behind: new Set<object>(),
  tiles: [] as { x: number; y: number; cx: number; cy: number; st: Structure | null }[],
  folk: new Map<number, Pose[]>(),
  robbers: new Map<number, [number, number, boolean]>(),
  props: new Map<number, ((cx: number, cy: number) => void)[]>(),
  hunt: new Map<number, (() => void)[]>(),
  lights: [] as Light[],
  vip: [] as { f: (context: C) => void; x: number; y: number; k: number }[],
  occ: [] as number[], // flat [ti, left, top, right, bottom] of standing buildings
  ord: new Map<number, number>(),
  birds: [] as [number, number, number, number][],
};

/** Per-frame counters for the dev diagnostics HUD (mutated in place, no allocation). */
// ---- flat town dressing (turf, paths, squares, acres) baked per 16x16-tile chunk ----
// Each baked chunk remembers a token per tile; pass 1c compares the tokens of the tiles it already resolves
// (no extra structure lookups) and marks a chunk dirty when growth changed it. At most one bake per frame;
// chunks not baked yet are drawn tile by tile as before (identical look, the frame never waits).
const FC = 16;
type FlatChunk = { bm?: ImageBitmap | null; cv: (HTMLCanvasElement & { ox: number; oy: number }) | null; q: number; sk: string; tok: Int32Array; dirty: boolean; full: boolean; baked: number; empty: boolean };
const flatCache = new Map<number, FlatChunk>();
/** Evicts a flat chunk and frees its GPU bitmap right away instead of waiting for garbage collection. */
function dropFlat(key: number) { const e = flatCache.get(key); if (e) { e.bm?.close(); e.bm = null; e.cv = null; } flatCache.delete(key); }
function clearFlat() { for (const e of flatCache.values()) { e.bm?.close(); e.bm = null; } flatCache.clear(); }
/** Bakes (ground or flat chunk) started this frame: one per frame keeps every frame short while panning. */
let frameBakes = 0;
const flatKinds = new Map<string, number>();
const flatSet = new Set<number>();
function flatTok(x: number, y: number, st: Structure | null): number {
  const nt = nearTown(x, y);
  if (!st) return nt ? 1 : 0;
  let k = flatKinds.get(st.kind); if (k === undefined) { k = flatKinds.size + 1; flatKinds.set(st.kind, k); }
  return 2 + k * 4 + (nt ? 1 : 0) + (st.build !== undefined ? 1 << 10 : 0) + ((st.seed.id.charCodeAt(0) * 31 + st.seed.id.charCodeAt(1)) << 12) ^ (st.kind === "field" ? (1 + ["green", "ripe", "stubble", "ploughed", "fallow"].indexOf(fieldLook(acreOf(x, y, st.seed).id, renderNow))) * 0x9e3779 : 0);
}
/** Called from pass 1c for every visible tile: flags the tile's baked chunk (and edge neighbours) when its content changed. */
function flatCheck(x: number, y: number, st: Structure | null) {
  const ix = (x / FC) | 0, iy = (y / FC) | 0, e = flatCache.get(iy * 4096 + ix);
  if (!e || !e.cv && !e.empty || e.dirty) return;
  const i = (y - iy * FC) * FC + (x - ix * FC);
  if (e.tok[i] === flatTok(x, y, st)) return;
  e.dirty = true;
  // paths and acres look at their neighbours: a change on the chunk edge also refreshes the chunk next door
  for (const [dx, dy] of NB8) { const n = flatCache.get((((y + dy) / FC) | 0) * 4096 + (((x + dx) / FC) | 0)); if (n) n.dirty = true; }
}
function bakeFlat(e: FlatChunk, ix: number, iy: number, q: number, seeds: Seed[], now: number, t: number) {
  agriMiss = false;
  const X0 = ix * FC, Y0 = iy * FC, X1 = Math.min(MAP - 1, X0 + FC - 1), Y1 = Math.min(MAP - 1, Y0 + FC - 1);
  let any = false;
  const sts: (Structure | null)[] = [];
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    const st = sparePlanted(x, y, structureAt(x, y, seeds, now)), tk = flatTok(x, y, st);
    e.tok[(y - Y0) * FC + (x - X0)] = tk; sts[(y - Y0) * FC + (x - X0)] = st; if (tk) any = true;
  }
  e.empty = !any; e.cv = null;
  if (!any) return;
  const left = iso(X0, Y1)[0] - TW * 1.5, right = iso(X1, Y0)[0] + TW * 1.5, top = iso(X0, Y0)[1] - TH - 30, bottom = iso(X1, Y1)[1] + TH + 12;
  const cv = document.createElement("canvas") as HTMLCanvasElement & { ox: number; oy: number };
  cv.width = Math.ceil((right - left) * q); cv.height = Math.ceil((bottom - top) * q);
  const g = cv.getContext("2d")!;
  g.setTransform(q, 0, 0, q, -left * q, -top * q);
  for (let s = X0 + Y0; s <= X1 + Y1; s++) for (let x = Math.max(X0, s - Y1); x <= Math.min(X1, s - Y0); x++) {
    const y = s - x, [cx, cy] = iso(x, y);
    flatTile(g, x, y, cx, cy, sts[(y - Y0) * FC + (x - X0)] ?? null, seeds, now, t);
  }
  cv.ox = left; cv.oy = top; e.cv = cv; e.bm?.close(); e.bm = null;
  // snapshot into an immutable bitmap: blitting it is a plain texture copy, not a replay of the recorded sprite draws
  if (typeof createImageBitmap === "function") void createImageBitmap(cv).then((bm) => { if (e.cv === cv) e.bm = bm; else bm.close(); }, () => {});
}
// touch devices: cap bake resolution and cache size (4x chunks at DPR 2-3 exceed mobile canvas memory)
const TOUCH = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
const FLAT_QMAX = TOUCH ? 2 : 4, FLAT_KEEP = TOUCH ? 80 : 96;
function drawFlatChunks(c: C, x0: number, x1: number, y0: number, y1: number, z: number, seeds: Seed[], now: number, t: number): Set<number> {
  flatSet.clear();
  // near zoom: bake farmland/paths at screen resolution so acres stay as crisp as the buildings
  const q = Math.min(FLAT_QMAX, z > 3.2 ? 4 : z > 1.6 ? 2.5 : z > 0.6 ? 1 : 0.5), sk = seasonKey(now) + ":" + waySnow(now), ready = allTexturesReady() && natureReady();
  let bakes = 0;
  const cx0 = Math.floor(x0 / FC), cx1 = Math.floor(x1 / FC), cy0 = Math.floor(y0 / FC), cy1 = Math.floor(y1 / FC);
  for (let s = cx0 + cy0; s <= cx1 + cy1; s++) for (let ix = Math.max(cx0, s - cy1); ix <= Math.min(cx1, s - cy0); ix++) {
    const iy = s - ix, key = iy * 4096 + ix;
    let e = flatCache.get(key);
    if (!e) { e = { cv: null, q: 0, sk: "", tok: new Int32Array(FC * FC), dirty: true, full: false, baked: -1e9, empty: false }; flatCache.set(key, e); }
    else { flatCache.delete(key); flatCache.set(key, e); }
    // art still loading: bake anyway, but refresh that chunk every 2 s until it is complete
    const stale = e.dirty || e.q !== q || e.sk !== sk || (!e.full && t - e.baked > 2000);
    if (stale && bakes < 1 && frameBakes < 1) { bakes++; frameBakes++; bakeFlat(e, ix, iy, q, seeds, now, t); e.q = q; e.sk = sk; e.full = ready && !agriMiss; e.baked = t; e.dirty = false; }
    if (e.empty && e.q === q) { flatSet.add(key); continue; }
    // soft fallback: while a re-bake is pending, keep showing the previous bake scaled (never live-draw the whole chunk)
    if (e.cv && (e.q === q && e.sk === sk || e.q !== q && e.sk === sk)) { c.drawImage(e.bm ?? e.cv, e.cv.ox, e.cv.oy, e.cv.width / e.q, e.cv.height / e.q); flatSet.add(key); }
  }
  // lookahead: in frames with no bake yet, prepare one chunk just off-screen so panning finds it ready
  if (frameBakes < 1) {
    const ax0 = cx0 - 1, ax1 = cx1 + 1, ay0 = cy0 - 1, ay1 = cy1 + 1;
    outer: for (let iy = ay0; iy <= ay1; iy++) for (let ix = ax0; ix <= ax1; ix++) {
      if (ix >= cx0 && ix <= cx1 && iy >= cy0 && iy <= cy1) continue;
      if (ix < 0 || iy < 0 || ix * FC >= MAP || iy * FC >= MAP) continue;
      const key = iy * 4096 + ix;
      let e = flatCache.get(key);
      if (e && !e.dirty && e.q === q && e.sk === sk) continue;
      if (!e) { e = { cv: null, q: 0, sk: "", tok: new Int32Array(FC * FC), dirty: true, full: false, baked: -1e9, empty: false }; flatCache.set(key, e); }
      frameBakes++; bakeFlat(e, ix, iy, q, seeds, now, t); e.q = q; e.sk = sk; e.full = ready && !agriMiss; e.baked = t; e.dirty = false;
      break outer;
    }
  }
  while (flatCache.size > FLAT_KEEP) dropFlat(flatCache.keys().next().value!);
  return flatSet;
}
/** Planted rare trees keep their tile: no field, house or workshop is ever drawn over them (display only — household capacity is unchanged). Roads keep their ribbon. */
let plantedNow: Map<string, Planting> = new Map();
const KEEP_KINDS = new Set(["road", "bridge", "street"]);
export function isPlantedRare(p: Map<string, Planting>, x: number, y: number) {
  const pl = p.get(`${x},${y}`);
  return !!pl && (pl.kind === "cherry" || pl.kind === "quince");
}
let pondsNow: Set<number> = new Set();
function sparePlanted(x: number, y: number, st: Structure | null): Structure | null {
  if (pondsNow.has(y * MAP + x)) return null;
  if (!st || KEEP_KINDS.has(st.kind)) return st;
  return isPlantedRare(plantedNow, x, y) ? null : st;
}
/** Dug carp pond beside a dry-land fishery: earthen dam rim, sluice board, reeds, carp; frozen with snow in winter.
 *  The art is a 2:1 footprint (480x239) drawn exactly one tile wide, so the rim never leaves its tile. */
function drawPond(c: C, x: number, y: number, cx: number, cy: number) {
  const im = huntIm("pond", pondUrl);
  if (im) {
    const w = TW, h = (w * im.naturalHeight) / im.naturalWidth, fl = hash(x, y, 91) < 0.5, top = cy - h * 0.56;
    const sw = seasonAt(renderNow), ice = huntIm("pondWinter", pondWinterUrl);
    const B = c.getTransform();
    if (fl) { c.translate(cx * 2, 0); c.scale(-1, 1); }
    c.drawImage(seasonalImage(im, "ground"), cx - w / 2, top, w, h);
    if (ice && sw.winter > 0.02) { const a = c.globalAlpha; c.globalAlpha = a * Math.min(1, sw.winter * 1.4); c.drawImage(ice, cx - w / 2, top, w, h); c.globalAlpha = a; }
    c.setTransform(B); return;
  }
  const rx = TW * 0.4, ry = TH * 0.4;
  c.fillStyle = "rgba(92,72,44,0.55)"; c.beginPath(); c.ellipse(cx, cy + 0.6, rx + 1.6, ry + 1.1, 0, 0, 7); c.fill();
  const g = c.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
  g.addColorStop(0, "#7fa7a3"); g.addColorStop(0.55, "#4f7f80"); g.addColorStop(1, "#3c6568");
  c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.fill();
  c.strokeStyle = "rgba(230,240,232,0.35)"; c.lineWidth = 0.6;
  c.beginPath(); c.ellipse(cx - rx * 0.25, cy - ry * 0.3, rx * 0.35, ry * 0.18, 0, 3.4, 5.8); c.stroke();
  for (let i = 0; i < 3; i++) {
    const a = hash(x, y, 90 + i) * 6.28, px = cx + Math.cos(a) * rx * 0.55, py = cy + Math.sin(a) * ry * 0.55;
    c.fillStyle = "#5f8a4a"; c.beginPath(); c.ellipse(px, py, 1.6, 0.9, 0, 0.4, 6.0); c.fill();
  }
  c.strokeStyle = "#6b7f3a"; c.lineWidth = 0.7; c.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const a = 2.2 + hash(x, y, 120 + i) * 1.6, bx = cx + Math.cos(a) * rx * 0.95, by = cy + Math.sin(a) * ry * 0.95, h = 3 + hash(x, y, 140 + i) * 3;
    c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx - 0.4, by - h * 0.6, bx + (hash(x, y, 160 + i) - 0.5) * 1.5, by - h); c.stroke();
  }
}
/**
 * A dirt track in winter (ws: 1 frost, 2 light snow, 3 heavy snow): no white banks — the ground is already snowy.
 * Trodden, greyed snow of uneven width, two cart ruts where dark earth shows through in patches, and a snowy crown;
 * the heavier the snowfall, the more the ruts fill in again. Pure tile hash, same on every client.
 */
function winterTrack(c: C, x: number, y: number, cx: number, cy: number, con: [number, number][], pp: (i: number, j: number) => [number, number], wBase: number, col: string | CanvasPattern, ws: 1 | 2 | 3) {
  // footpath in winter: one continuous trodden surface (world-anchored noise texture, so neighbouring
  // tiles flow into each other), a ragged noise verge, and earth/slush only where the noise mask opens up
  void x; void y; void col;
  const fr = wayTexture(c, "fringe"), pk = wayTexture(c, "pack"), sl = wayTexture(c, "slush");
  if (!fr || !pk || !sl) return;
  const fresh = ws === 3 ? 0.5 : ws === 2 ? 0.8 : 1;
  const line = new Path2D();
  if (!con.length) { line.moveTo(cx - 0.01, cy); line.lineTo(cx + 0.01, cy); }
  for (const [i, j] of con) { const m = pp(i * 0.5, j * 0.5); line.moveTo(cx, cy); line.lineTo(m[0], m[1]); }
  c.strokeStyle = fr; c.globalAlpha = 0.85 * fresh + 0.1; c.lineWidth = wBase * 1.35; c.stroke(line);
  c.strokeStyle = pk; c.globalAlpha = 0.8 * fresh + 0.2; c.lineWidth = wBase * 0.9; c.stroke(line);
  c.strokeStyle = sl; c.globalAlpha = ws === 1 ? 0.9 : ws === 2 ? 0.65 : 0.3; c.lineWidth = wBase * 0.6; c.stroke(line);
  c.globalAlpha = 1;
}
/** Flat ground dressing of one tile (turf, ore rocks, paths, squares, acres) — drawn live or baked into a flat chunk. */
function flatTile(c: C, x: number, y: number, cx: number, cy: number, st: Structure | null, seeds: Seed[], now: number, t: number) {
    const live = nearTown(x, y);
    if (live) natureAt(c, x, y, cx, cy, t, false); // ore rocks

    if (pondsNow.has(y * MAP + x)) { drawPond(c, x, y, cx, cy); return; }
    if (!st) { if (live && !inCourt(x, y)) wildTurf(c, x, y, cx, cy, terrain(x, y)); return; }
    const sd = x * 1000 + y;
    const pp = P(cx, cy);
    if (st.kind === "bridge") {
      /* drawn as one continuous span per crossing (see drawBridgeSpan) */
    } else if (st.kind === "road") {
      /* drawn as one continuous ribbon per trade road (see drawRoadRibbon) */
    } else if (st.kind === "path" || st.kind === "street" || st.kind === "avenue") {
      const street = st.kind === "street" || st.kind === "avenue";
      const col = texture(c, street ? "cobble" : "dirt") ?? (street ? "#b3aa98" : "#c49e6c");
      const wBase = street ? 7 : 4.6;
      const isP = (i: number, j: number) => { const o = structureAt(x + i, y + j, seeds, now); return !!o && PATHLIKE.has(o.kind); };
      // Connect orthogonal neighbours; a diagonal only when no orthogonal step already links them,
      // so adjacent path tiles never form a lattice of crossing strokes.
      const con: [number, number][] = [];
      for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) if (isP(i, j)) con.push([i, j]);
      for (const [i, j] of [[1, 1], [-1, -1], [1, -1], [-1, 1]] as [number, number][]) if (isP(i, j) && !isP(i, 0) && !isP(0, j)) con.push([i, j]);
      c.lineCap = "round"; c.lineJoin = "round";
      const ws = waySnow(now);
      if (ws && !street) { winterTrack(c, x, y, cx, cy, con, pp, wBase, texture(c, "dirt", 0, true) ?? col, ws); return; }
      c.strokeStyle = col;
      for (const [i, j] of con) {
        const m = pp(i * 0.5, j * 0.5);
        c.lineWidth = wBase * (0.92 + hash(x + i, y + j, 300) * 0.16);
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(m[0], m[1]); c.stroke();
      }
      if (ws && street) {
        // paving under snow: setts stay legible, snow lies in drifts along the house side and in the joints
        c.fillStyle = "rgba(236,240,243,0.85)";
        for (const [i, j] of con) {
          const m = pp(i * 0.5, j * 0.5), dx = m[0] - cx, dy = m[1] - cy, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
          const n = 2 + ws * 2;
          for (let k = 0; k < n; k++) {
            const u = hash(x * 3 + i, y * 3 + j, 340 + k), s = hash(x + i, y + j, 350 + k) < 0.5 ? -1 : 1;
            const off = wBase * (0.3 + hash(x, y, 360 + k) * 0.18) * s;
            c.globalAlpha = 0.45 + ws * 0.12;
            c.beginPath(); c.ellipse(cx + dx * u + nx * off, cy + dy * u + ny * off * 0.6, 0.8 + hash(x, y, 370 + k) * 1.2, 0.35 + hash(x, y, 380 + k) * 0.35, 0, 0, 7); c.fill();
          }
        }
        c.globalAlpha = 1;
      }
      if (!street && !ws) {
        // cart track: two worn wheel ruts with a grassy crown between them
        for (const [i, j] of con) {
          const m = pp(i * 0.5, j * 0.5), dx = m[0] - cx, dy = m[1] - cy, d = Math.hypot(dx, dy) || 1;
          const nx = -dy / d, ny = dx / d, o = wBase * 0.24;
          c.strokeStyle = "rgba(92,112,58,0.38)"; c.lineWidth = wBase * 0.16;
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(m[0], m[1]); c.stroke();
          c.strokeStyle = "rgba(70,50,30,0.2)"; c.lineWidth = wBase * 0.14;
          for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + nx * o * s, cy + ny * o * s); c.lineTo(m[0] + nx * o * s, m[1] + ny * o * s); c.stroke(); }
        }
        c.strokeStyle = col;
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
      // paving frays into the grass: trodden earth halo, fading rim, solid core, loose setts beyond the edge
      const rx = TW * (0.56 + hash(x, y, 71) * 0.1), ry = TH * (0.56 + hash(x, y, 72) * 0.1);
      const cob = texture(c, "cobble") ?? "#d3cab6";
      c.globalAlpha = 0.35; c.fillStyle = texture(c, "dirt") ?? "#c49e6c";
      c.beginPath(); c.ellipse(cx, cy, rx * 1.12, ry * 1.12, 0, 0, 7); c.fill();
      c.fillStyle = cob;
      c.globalAlpha = 0.45; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.fill();
      c.globalAlpha = 1; c.beginPath(); c.ellipse(cx, cy, rx * 0.84, ry * 0.84, 0, 0, 7); c.fill();
      // gutter: a shallow damp channel of darker setts just inside the rim, irregular per tile
      c.strokeStyle = "rgba(58,48,36,0.22)"; c.lineWidth = 0.7;
      c.beginPath(); c.ellipse(cx, cy, rx * 0.78, ry * 0.78, 0, hash(x, y, 73) * 6.283, hash(x, y, 73) * 6.283 + 3.6 + hash(x, y, 74) * 2); c.stroke();
      for (let n = 0; n < 4; n++) { // a few worn, darker stones in the core
        c.fillStyle = "rgba(70,60,48,0.16)";
        c.beginPath(); c.ellipse(cx + (hash(x, y, 120 + n) - 0.5) * rx, cy + (hash(x, y, 130 + n) - 0.5) * ry, 1.1, 0.6, 0, 0, 7); c.fill();
      }
      c.fillStyle = cob;
      for (let n = 0; n < 5; n++) {
        const a = hash(x, y, 80 + n) * 6.283, d = 0.95 + hash(x, y, 90 + n) * 0.25;
        c.globalAlpha = 0.7; c.beginPath(); c.ellipse(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 0.9, 0.5, 0, 0, 7); c.fill();
      }
      const ws = waySnow(now);
      if (ws) {
        // snow swept to the rim and left in the joints; the busy middle stays trodden open
        c.fillStyle = "rgb(236,240,243)";
        for (let n = 0; n < 3 + ws * 3; n++) {
          const a = hash(x, y, 460 + n) * 6.283, d = 0.55 + hash(x, y, 470 + n) * 0.4;
          c.globalAlpha = 0.35 + ws * 0.15;
          c.beginPath(); c.ellipse(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 1 + hash(x, y, 480 + n) * 1.6, 0.45 + hash(x, y, 490 + n) * 0.4, 0, 0, 7); c.fill();
        }
      }
      c.globalAlpha = 1;
    } else if (st.kind === "field" || st.kind === "garden" || st.kind === "pasture") {
      drawAgri(c, x, y, cx, cy, st, seeds, now);
    }
}

export const renderStats = { tiles: 0, folk: 0, chunks: 0 };
let vignette: { w: number; h: number; c: C; g: CanvasGradient } | null = null;
export function draw(
  c: C, w: number, h: number, dpr: number, cam: Camera, seeds: Seed[], plantings: Map<string, Planting>,
  now: number, hover: [number, number] | null, ghostOk: boolean | null,
) {
  renderNow = now; renderSeeds = seeds; syncMask(seeds); setArtTime(now); setNatureTime(now); plantedNow = plantings; pondsNow = pondTiles(seeds);
  lastPeople.length = 0; lastTraders.length = 0; lastSources.length = 0;
  signpostMap(seeds);
  if (cam.zoom < OVERVIEW_BELOW) return drawOverview(c, w, h, dpr, cam, seeds, now);
  const t = performance.now(); setSpriteTime(t);
  const worldLinks = links(seeds); // one lookup per frame: the cache key itself serialises every seed
  const z = cam.zoom * dpr;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = hsl(205, 30, 58); c.fillRect(0, 0, w, h);
  c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z);

  const inv = (sx: number, sy: number) => toTile((sx - w / 2) / z + cam.x, (sy - h / 2) / z + cam.y);
  const cs = [inv(0, 0), inv(w, 0), inv(0, h), inv(w, h)];
  const x0 = Math.max(0, Math.min(...cs.map((p) => p[0])) - 2), x1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[0])) + 2);
  const y0 = Math.max(0, Math.min(...cs.map((p) => p[1])) - 2), y1 = Math.min(MAP - 1, Math.max(...cs.map((p) => p[1])) + 8);
  // One rendering path at every map zoom: no threshold where trees, house facing or pastures switch.
  // Ground always comes from baked chunks (2x supersampled at close zoom): repainting textures,
  // gradients and clips per tile every frame blew the 16 ms budget while panning.
  const detail = true, sharp = false;
  const cs0x = cam.x - w / 2 / z, cs1x = cam.x + w / 2 / z, cs0y = cam.y - h / 2 / z, cs1y = cam.y + h / 2 / z;
  const L = framePool.lights; L.length = 0;
  beginLit(w, h, nightLevel(clock()) > 0.02);
  // pooled per-frame buffers: slots and maps are reused across frames to keep GC pauses out of the loop
  const tiles = framePool.tiles; let nTiles = 0;
  // flood water, fascines and silt also reach open meadow and the wild river bank (no structure there)
  const floodWild = floodMap; floodWild.clear();
  for (const sd of seeds) { if (Math.abs(sd.x - (x0 + x1) / 2) > (x1 - x0) / 2 + 40 || Math.abs(sd.y - (y0 + y1) / 2) > (y1 - y0) / 2 + 40) continue;
    for (const [k, v] of tileHits(sd, now)) if ((v.flood || v.silt || v.levee) && !floodWild.has(k)) floodWild.set(k, v); }

  const edges: GroundEdge[] = [];
  frameBakes = 0;
  renderStats.chunks = drawGroundChunks(c, x0, x1, y0, y1, z, cs0x, cs1x, cs0y, cs1y);
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
  const flatDone = drawFlatChunks(c, x0, x1, y0, y1, z, seeds, now, t);
  for (let s = x0 + y0; s <= x1 + y1; s++) {
    for (let x = Math.max(x0, s - y1); x <= Math.min(x1, s - y0); x++) {
      const y = s - x;
      const [cx, cy] = iso(x, y);
      // diamond culling: the tile rectangle's corners lie off-canvas; tall sprites rise from below, so keep a deep bottom margin
      if (cx < cs0x - 56 || cx > cs1x + 56 || cy < cs0y - 28 || cy > cs1y + 96) continue; // margins: widest sprite half-width / tallest sprite height
      const st = sparePlanted(x, y, structureAt(x, y, seeds, now));
      { const slot = tiles[nTiles] ?? (tiles[nTiles] = { x: 0, y: 0, cx: 0, cy: 0, st: null }); slot.x = x; slot.y = y; slot.cx = cx; slot.cy = cy; slot.st = st; nTiles++; }
      if (!detail) {
        if (st && !FLAT.has(st.kind)) { /* drawn in pass 2 */ }
        else if (st?.kind === "field") { c.fillStyle = texture(c, fieldTex(x, y, st.seed, now)) ?? hsl(44, 45, 66); diamond(c, cx, cy, 1.06); c.fill(); } // slight overlap: no grid seams between acre tiles
        else if (st && (PATHLIKE.has(st.kind) || st.kind === "square")) { c.fillStyle = texture(c, st.kind === "street" || st.kind === "square" ? "cobble" : "dirt") ?? "#cdb084"; diamond(c, cx, cy, 0.85); c.fill(); }
        continue;
      }
      flatCheck(x, y, st);
      if (!flatDone.has(((y / FC) | 0) * 4096 + ((x / FC) | 0))) {
        // chunk not baked yet: on touch draw only a cheap base fill for the frame or two until the bake lands
        if (!TOUCH) flatTile(c, x, y, cx, cy, st, seeds, now, t);
        else if (st?.kind === "field" || st?.kind === "garden") { c.fillStyle = texture(c, st.kind === "field" ? fieldTex(x, y, st.seed, now) : "dirt") ?? hsl(44, 45, 66); diamond(c, cx, cy, 1.0); c.fill(); }
        else if (st && (PATHLIKE.has(st.kind) || st.kind === "square" || st.kind === "market" || st.kind === "well")) { c.fillStyle = texture(c, st.kind === "path" ? "dirt" : "cobble") ?? "#cdb084"; diamond(c, cx, cy, 0.7); c.fill(); }
      }
    }
  }
  // ---- trade roads as one continuous ribbon each (the tile steps stay logic only) ----
  for (const l of worldLinks) {
    const bx = roadBox(l); if (bx[2] < cs0x - 60 || bx[0] > cs1x + 60 || bx[3] < cs0y - 60 || bx[1] > cs1y + 60) continue;
    if (roadProgress(l, now) <= 0) continue;
    drawRoadRibbon(c, l, seeds, now);
  }

  // ---- villagers, bucketed by tile for depth sorting ----
  const folk = framePool.folk; folk.clear();
  lastPeople.length = 0; lastTraders.length = 0;
  const folkOn = cam.zoom >= 0.9; // villagers are sub-pixel below this; skipping them changes nothing visible
  const steer = steeredMayor();
  const dogMayors = new Map<string, Pose>();
  let ownPose: Pose | null = null, ownDrawn = false;
  lanternFolk.clear();
  if (folkOn) for (const sd of seeds) {
    // generous margin: strollers and the steered mayor wander well beyond the built-up edge — never cull them at the border
    const r = reachOf(sd, radiusOf(viewAge(sd, seeds, now))) + 24;
    const mine = steer && steer.sid === sd.id && steer.x >= x0 - 2 && steer.x <= x1 + 2 && steer.y >= y0 - 2 && steer.y <= y1 + 2;
    const rm = mine ? null : remoteMayor(sd.id);
    const live = !!rm && rm.x >= x0 - 2 && rm.x <= x1 + 2 && rm.y >= y0 - 2 && rm.y <= y1 + 2;
    if (!mine && !live && (sd.x + r < x0 || sd.x - r > x1 || sd.y + r < y0 || sd.y - r > y1)) continue;
    const r0 = reachOf(sd, radiusOf(viewAge(sd, seeds, now)));
    const darkOut = nightLevel(now) > 0.35;
    for (const q of townPosesSmooth(sd, seeds, now)) {
      const k = Math.round(q.y) * MAP + Math.round(q.x);
      // out in the open at dusk: a small lantern glow keeps the figure readable on dark fields
      // only night walkers on far paths (and the strolling mayor) carry a visible hand lantern; the light comes from it
      const ownStrolling = !!steer && q.p.role === "mayor" && q.act === "stroll" && sd.id === steer.sid;
      if (ownStrolling && darkOut && q.mounted) { const [lx, ly] = iso(q.x, q.y); L.push({ x: lx, y: ly - 4, r: 4 }); }
      // the own strolling mayor keeps his lantern lit even while standing, so he never vanishes in the dark wood
      if (darkOut && !q.mounted && q.p.age >= 14 && (ownStrolling || (q.walking && Math.hypot(q.x - sd.x, q.y - sd.y) > r0 * 0.8))) {
        lanternFolk.add(q.p.id * 7919 + sd.id.length);
        const [lx, ly] = iso(q.x, q.y); L.push({ x: lx + ((q.dir[0] - q.dir[1]) >= 0 ? 0.72 : -0.72), y: ly - 1.9, r: 4 });
      }
      if (!folk.has(k)) folk.set(k, []);
      folk.get(k)!.push(q);
      if (q.p.role === "mayor" && sd.id === ownMayorSid()) ownPose = q;
      if (q.p.role === "mayor" && supportOwned.get(sd.id)?.has("dog")) dogMayors.set(sd.id, q);
    }
  }
  const robbers = framePool.robbers; robbers.clear();
  if (detail) for (const sd of seeds) { const r = robberAt(sd, now); if (r) robbers.set(Math.round(r[1]) * MAP + Math.round(r[0]), r); }
  const simpleFolk = cam.zoom < 2.2;
  const goal = mayorGoal(now), goalK = goal ? goal[1] * MAP + goal[0] : -1;
  // encounter props: the raised maypole on the square and the village's cows (derived in townOf)
  const props = framePool.props; props.clear();
  const addProp = (k: number, f: (cx: number, cy: number) => void) => (props.get(k) ?? props.set(k, []).get(k)!).push(f);
  // road crews join the tile depth order, so houses in front hide them instead of the crew floating on roofs
  if (detail) for (const l of worldLinks) {
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
  const fz = feastOn(now), fzProps = !!fz && (FEASTS[fz].scene === "fire" || fz === "pentecost" || fz === "christmas" || fz === "epiphany" || fz === "martinmas");
  fzNow = fz; fzHour = worldHour(now); fzStars.clear();
  if (detail) for (const sd of seeds) {
    if (!sd.decisions?.length && !fzProps) continue;
    const r = reachOf(sd, radiusOf(viewAge(sd, seeds, now))) + 2;
    if (sd.x + r < x0 || sd.x - r > x1 || sd.y + r < y0 || sd.y - r > y1) continue;
    const tw = townOf(sd, seeds, now);
    if (tw.maypole) addProp(tw.maypole[1] * MAP + tw.maypole[0], (cx, cy) => drawMaypole(c, cx, cy, t));
    tw.stars.forEach((id, i) => fzStars.set(id, i));
    // Whitsun ox led in to the birch tree; St Martin rides to the church (feast-walkers.ts)
    const oxPath = fz === "pentecost" && tw.maypole ? feastRoute(tw, [tw.maypole[0] + 1, tw.maypole[1] + 1], hash(sd.x, sd.y, 1811), seeds) : null;
    const ox = oxPath ? oxWalk(oxPath, fzHour) : null, hd = oxPath ? herdsmanWalk(oxPath, fzHour) : null;
    const herd = hd ? tw.people.find((p) => p.job === "farmer" && p.sex === "m" && p.age >= 18) ?? tw.people.find((p) => p.sex === "m" && p.age >= 16) : undefined;
    if (ox) { const [px, py] = iso(ox.x, ox.y); addProp(Math.round(ox.y) * MAP + Math.round(ox.x), () => drawOx(c, px, py, ox, now)); }
    if (hd && herd && ox) {
      const [hx, hy] = iso(hd.x, hd.y), [ox2, oy2] = iso(ox.x, ox.y);
      const q = { p: herd, x: hd.x, y: hd.y, visible: true, walking: hd.walking, dir: [hd.dx, hd.dy], phase: t / 170, act: "stroll", working: false, talk: null, talkTurn: false, carry: null, dest: null } as unknown as Pose;
      addProp(Math.round(hd.y) * MAP + Math.round(hd.x), () => {
        // halter rope from his hand to the ox's head, sagging a little
        c.strokeStyle = "rgba(92,66,40,0.9)"; c.lineWidth = 0.22; c.beginPath(); c.moveTo(hx, hy - 2.2);
        c.quadraticCurveTo((hx + ox2) / 2, Math.max(hy, oy2) - 1.2, ox2 + (hx > ox2 ? 1.8 : -1.8), oy2 - 2.6); c.stroke();
        drawFolk(c, hx, hy, q, t);
      });
    }
    const mtPath = fz === "martinmas" && tw.church ? feastRoute(tw, [tw.church[0] + 1, tw.church[1] + 1], hash(sd.x, sd.y, 1812), seeds) : null;
    const mt = mtPath ? martinWalk(mtPath, fzHour) : null;
    if (mt) { const [px, py] = iso(mt.x, mt.y), f = (context: C) => drawMartin(context, px, py, mt, t); addProp(Math.round(mt.y) * MAP + Math.round(mt.x), () => f(c)); }
    // Easter / St John's fire: the stacked pile by day, flames and glow in the evening
    if (tw.bonfire) { const bf = tw.bonfire, lit = bonfireLit(now); addProp(bf[1] * MAP + bf[0], (cx, cy) => { prop(c, "logs", cx, cy + 1, 9); if (lit) drawFire(c, cx, cy + 9, t, bf[0] * 31 + bf[1], L); }); }
    // door greenery (fir at Christmas/Epiphany, birch Maien at Whitsun) beside each lived-in house
    if (fz === "christmas" || fz === "epiphany" || fz === "pentecost") {
      const seen = new Set<number>(), birch = fz === "pentecost";
      for (const pp of tw.people) { const hx = Math.round(pp.home[0]), hy = Math.round(pp.home[1]), k = hy * MAP + hx; if (seen.has(k) || hx < x0 || hx > x1 || hy < y0 || hy > y1) continue; seen.add(k); addProp(k, (cx, cy) => drawDoorGreen(c, cx + 6, cy + 3, birch, k)); }
    }
    // Easter: egg baskets set out on the green and by the well
    if (fz === "easter") for (const [i, sp0] of [tw.meet, tw.well].entries()) { const k = sp0[1] * MAP + sp0[0]; addProp(k, (cx, cy) => { drawEggBasket(c, cx - 5 + i * 9, cy + 3, k); drawEggBasket(c, cx + 3 - i * 7, cy + 5, k + 1); }); }
    tw.cows.forEach((cw, i) => addProp(cw[1] * MAP + cw[0], (cx, cy) => drawCow(c, cx, cy, now, cw[0] * 31 + cw[1] + i * 7, i)));
    tw.pigs.forEach((pg, i) => addProp(pg[1] * MAP + pg[0], (cx, cy) => drawPig(c, cx, cy, now, pg[0] * 31 + pg[1] + i * 7)));
    // footbridge site: timber stacked on the bank while the crew works
    if (tw.steg && now < tw.steg.done && (sd.decisions ?? []).some((d) => d.event === "steg" && d.at <= now)) { const a = tw.steg.a; addProp(a[1] * MAP + a[0], (cx, cy) => prop(c, "logs", cx + 4, cy + 1, 7)); }
  }
  // supporter dogs: romp by the mayor's seat, heel when the mayor walks, sleep by the door at night
  dogSpots.clear();
  if (folkOn) for (const sd of seeds) {
    if (!supportOwned.get(sd.id)?.has("dog")) continue;
    const [hx, hy] = seatTile(sd), mq = dogMayors.get(sd.id);
    const near = mq || (hx >= x0 - 4 && hx <= x1 + 4 && hy >= y0 - 4 && hy <= y1 + 4); if (!near) continue;
    const d = dogStep(sd.id, [hx, hy + 1], mq ? { x: mq.x, y: mq.y, walking: mq.walking } : null, worldHour(now), now, freeGround);
    if (d.mode === "sleep" && !dogSleepsOutside(now)) continue; // indoors by the hearth outside summer
    dogSpots.set(sd.id, { x: d.x, y: d.y });
    const [px, py] = iso(d.x, d.y), sk = sd.x * 7 + sd.y;
    addProp(dogTile(sd.id, d.x, d.y, MAP), () => drawDog(c, d, px, py, t, sk));
  }

  // ---- bridges: one straight span per water crossing, abutment to abutment ----
  // bridges join the tile depth order at their shallowest visible tile: the north bank stays behind the railing, the south bank in front
  const bridgeInDepth = (ts: readonly (readonly [number, number])[], f: () => void) => {
    let best = -1, bd = Infinity;
    for (const [x, y] of ts) {
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const [cx, cy] = iso(x, y);
      if (cx < cs0x - 56 || cx > cs1x + 56 || cy < cs0y - 28 || cy > cs1y + 96) continue;
      if (x + y < bd) { bd = x + y; best = y * MAP + x; }
    }
    if (best < 0) f(); else addProp(best, () => f());
  };
  if (detail) for (const l of worldLinks) {
    // off-screen road: none of its bridges can show (same margin as the span test below)
    { const bx = roadBox(l); if (bx[2] < cs0x - 60 || bx[0] > cs1x + 60 || bx[3] < cs0y - 60 || bx[1] > cs1y + 60) continue; }
    const n = l.tiles.length;
    for (let i = 0; i < n; i++) {
      if (!l.water[i]) continue;
      let j = i; while (j + 1 < n && l.water[j + 1]) j++;
      const s0 = Math.max(0, i - 1), s1 = Math.min(n - 1, j + 1);
      const A = l.tiles[s0]!, B = l.tiles[s1]!;
      const [ax, ay] = iso(A[0], A[1]), [bx, by] = iso(B[0], B[1]);
      // cheap screen test first; the costly build-state lookups only run for visible crossings
      if (Math.max(ax, bx) > cs0x - 60 && Math.min(ax, bx) < cs1x + 60 && Math.max(ay, by) > cs0y - 60 && Math.min(ay, by) < cs1y + 60) {
        const built = [s0, s1].every((k) => { const st = structureAt(l.tiles[k]![0], l.tiles[k]![1], seeds, now); return !!st && PATHLIKE.has(st.kind); })
          && structureAt(l.tiles[i]![0], l.tiles[i]![1], seeds, now)?.kind === "bridge";
        if (built) bridgeInDepth(l.tiles.slice(i, j + 1), () => drawBridgeSpan(c, [ax, ay], [bx, by], A[0] * 31 + A[1], t));
      }
      i = j;
    }
  }
  // Allmende footbridge over the mill stream, once the village (or its carpenter) has finished it
  if (detail) for (const sd of seeds) {
    if (!sd.decisions?.some((d) => d.event === "steg")) continue;
    const tw = townOf(sd, seeds, now), sg = tw.steg; if (!sg || now < sg.done) continue;
    const [ax, ay] = iso(sg.a[0], sg.a[1]), [bx, by] = iso(sg.b[0], sg.b[1]);
    if (Math.max(ax, bx) > cs0x - 60 && Math.min(ax, bx) < cs1x + 60 && Math.max(ay, by) > cs0y - 60 && Math.min(ay, by) < cs1y + 60)
      bridgeInDepth([sg.a, sg.b], () => drawBridgeSpan(c, [ax, ay], [bx, by], sg.a[0] * 31 + sg.a[1], t));
  }

  // road traffic, messengers and stalls join the tile depth order: houses in front hide them (no object above a front roof)
  const vip = framePool.vip; vip.length = 0;
  // anchor (ax, ay): depth point on the road centre line, so the keep-right lane offset never tips a cart into a house's tile
  const roadProp = (x: number, y: number, a: number, f: (context: C) => void, important = false, id?: string, ax = x, ay = y) => {
    let [tx, ty] = toTile(ax, ay);
    x = ax; y = ay;
    if (id !== undefined) { // depth-bucket hysteresis: a cart on a tile seam keeps its bucket until clearly past it, so roofs don't flicker it in and out
      const fa = (x / (TW / 2) + y / (TH / 2)) / 2, fb = (y / (TH / 2) - x / (TW / 2)) / 2;
      const prev = propTileMemo.get(id);
      if (prev && (prev[0] !== tx || prev[1] !== ty) && Math.abs(fa - prev[0]) < 0.72 && Math.abs(fb - prev[1]) < 0.72) [tx, ty] = prev;
      propTileMemo.set(id, [tx, ty]);
      if (propTileMemo.size > 4000) propTileMemo.clear();
    }
    addProp(ty * MAP + tx, () => { c.globalAlpha = a; f(c); c.globalAlpha = 1; });
    if (important) vip.push({ f, x, y, k: ty * MAP + tx });
  };
  // the prince's messenger: rides in along the village's road, waits by the mayor's seat, rides off (pure from decree rows + clock)
  heraldSpots.clear();
  if (folkOn && heraldRows.length) for (const sd of seeds) {
    const v = heraldVisit(heraldRows, sd.id, Date.now()); if (!v) continue;
    const [hx, hy] = seatTile(sd);
    if (hx < x0 - 20 || hx > x1 + 20 || hy < y0 - 20 || hy > y1 + 20) continue;
    let goal: [number, number] = [hx + 0.5, hy + 2.5];
    for (const [ox, oy] of [[0, 2], [1, 2], [2, 1], [-1, 2], [2, 2], [0, 3], [3, 1], [1, 3], [-2, 2], [3, 3]] as const) {
      const st = structureAt(hx + ox, hy + oy, seeds, now);
      if (!isWater(terrain(hx + ox, hy + oy)) && (!st || PATHLIKE.has(st.kind))) { goal = [hx + ox, hy + oy]; break; }
    }
    const path = heraldPath(sd, seeds, goal);
    const P = v.phase === "leave" ? [...path].reverse() : path;
    const len = polyLen(P), ride = HERALD_RIDE_S * 1000;
    // arrival eases out to a standstill, departure eases in from it; the gait follows distance so hooves never slide
    const s = v.phase === "arrive" ? len * (1 - (1 - v.p) ** 2.2) : v.phase === "leave" ? len * v.p ** 2 : len;
    const speed = v.phase === "arrive" ? 2.2 * (1 - v.p) ** 1.2 : v.phase === "leave" ? 2 * v.p : 0;
    const at = polyAt(P, s), [px, py] = iso(at.x, at.y);
    const dir = v.phase === "wait" ? polyAt(P, len - 0.01).dir : at.dir;
    const [sx, sy] = iso(at.x + dir[0], at.y + dir[1]), ddx = sx - px, ddy = sy - py;
    const gait = speed > 0.02 ? s / 0.24 : null, night = worldHour(now) >= 19 || worldHour(now) < 7;
    const fade = v.phase === "arrive" ? Math.min(1, v.t / 1500) : v.phase === "leave" ? Math.min(1, (ride - v.t) / 1500) : 1;
    // small saddle lantern: a modest glow ahead of the horse, low enough that rider and horse stay readable
    if (night) L.push({ x: px + (ddx >= 0 ? -2 : 2), y: py - 4, r: 2.6 });
    heraldSpots.set(sd.id, { x: px, y: py });
    roadProp(px, py, fade, (context) => drawHerald(context, px, py, ddx, ddy, gait, speed, t, v.phase === "wait", night, sd.x * 13 + sd.y), true, `herald:${sd.id}`);
  }
  // ---- life on the trade roads ----
  if (detail) for (const l of worldLinks) {
    { const bx = roadBox(l); if (bx[2] < cs0x - 60 || bx[0] > cs1x + 60 || bx[3] < cs0y - 60 || bx[1] > cs1y + 60) continue; } // off-screen road: skip its traffic
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
      const lift = deckLift(l, x, y); // on a bridge: keep to the deck centre and ride on the planks
      let [ox, oy] = keepRight(dx, dy, lift === null ? (cart ? 3.2 : 4.2) : cart ? 0.4 : 1.2);
      if (lift !== null) oy -= lift;
      if (cart) roadProp(x + ox, y + oy, fade, () => drawCart(c, x + ox, y + oy, dx, dy, bob, sn + k, "", t, `t${l.a.id}:${l.b.id}:${k}`), false, `t${l.a.id}:${l.b.id}:${k}`, x, y);
      else roadProp(x + ox, y + oy, fade, () => drawWanderer(c, x + ox, y + oy, dx, dy, t, sn + k, good ? CARRY_OF[good] : null), false, `p${sn}:${k}`);
      lastTraders.push({ x, y, from: from.name, to: to.name, good, cart });
    }
    // journeymen and messengers on their way to the neighbour
    if (n >= 2) for (const w of walkersNow(l, now, worldLinks)) {
      const end = n - 1, pr = walkProgress(w, now) * end, fwd = w.from.id === l.a.id;
      // roadMotion's second half (phase end..2·end) already runs b→a with a reversed heading
      const m = roadMotion(pts, fwd ? Math.min(pr, end - 1e-6) : end + pr);
      const fade = roadFade(l, m.index, false);
      if (fade <= 0) continue;
      const cartW = w.kind === "family" || w.kind === "gift" || w.kind === "aid" || w.kind === "transit", lift2 = deckLift(l, m.position[0], m.position[1]);
      let [ox2, oy2] = keepRight(m.direction[0], m.direction[1], lift2 === null ? (cartW ? 3.2 : 4.2) : cartW ? 0.4 : 1.2);
      if (lift2 !== null) oy2 -= lift2;
      const x = m.position[0] + ox2, y = m.position[1] + oy2;
      if (x < cs0x - 40 || x > cs1x + 40 || y < cs0y - 40 || y > cs1y + 40) continue;
      if (w.kind === "family" || w.kind === "gift" || w.kind === "aid") { roadProp(x, y, fade, () => drawCart(c, x, y, m.direction[0], m.direction[1], Math.sin(t / 220) * 0.3, w.sd, "", t * 0.8, `w${w.kind}:${w.sd}:${w.from.id}:${w.to.id}`), false, `w${w.kind}:${w.sd}:${w.from.id}:${w.to.id}`, m.position[0], m.position[1]); lastTraders.push({ x, y, from: w.from.name, to: w.to.name, good: null, cart: true, walker: w }); continue; }
      const wid = `w${w.kind}:${w.sd}:${w.from.name}`;
      if (w.kind === "transit") { const src = w.origin ?? w.from, ex = tradeProfile(src, now).exports, gd = ex[w.sd % Math.max(1, ex.length)] ?? null; roadProp(x, y, fade, () => drawCart(c, x, y, m.direction[0], m.direction[1], Math.sin(t / 220) * 0.3, w.sd, "", t, `${wid}:${w.to.id}`), false, `${wid}:${w.to.id}`, m.position[0], m.position[1]); lastTraders.push({ x, y, from: src.name, to: (w.dest ?? w.to).name, good: gd, cart: true }); continue; }
      if (w.kind === "rider") { roadProp(x, y, fade, (context) => drawRider(context, x, y, m.direction[0], m.direction[1], w.sd, t), true, wid); lastTraders.push({ x, y, from: w.from.name, to: w.to.name, good: null, cart: false, walker: w }); continue; }
      if (w.kind === "trader") { const ex = tradeProfile(w.p0 ? w.to : w.from, now).exports, gd = ex[w.sd % Math.max(1, ex.length)] ?? null; roadProp(x, y, fade, () => drawWanderer(c, x, y, m.direction[0], m.direction[1], t * 0.7, w.sd, gd ? CARRY_OF[gd] : "bundle"), false, wid); lastTraders.push({ x, y, from: w.from.name, to: w.to.name, good: gd, cart: false, walker: w }); continue; }
      roadProp(x, y, fade, (context) => drawWanderer(context, x, y, m.direction[0], m.direction[1], t * (w.kind === "messenger" || w.kind === "letter" ? 1.4 : w.kind === "bridal" ? 0.6 : 0.8), w.sd, w.kind === "journeyman" ? "bundle" : null, w.kind === "bridal" ? (w.sex === "m" ? "groom" : "bride") : undefined), w.kind === "messenger" || w.kind === "letter", wid);
      lastTraders.push({ x, y, from: (w.origin ?? w.from).name, to: (w.dest ?? w.to).name, good: null, cart: false, walker: w });
    }
    c.globalAlpha = 1;
  }
  c.globalAlpha = 1;

  // Saturday market: visiting traders set up painted stalls on the host village's square around the well, 9–17 realm time
  if (marketOpen(now)) {
    const guests = new Map<Seed, Seed[]>();
    for (const l of worldLinks) {
      if (l.tiles.length < 7 || roadProgress(l, now) < 1) continue;
      for (const [h, g] of [[l.a, l.b], [l.b, l.a]] as const) { const arr = guests.get(h) ?? []; arr.push(g); guests.set(h, arr); }
    }
    const RING: [number, number][] = [[1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [0, 2], [-2, 0], [0, -2], [2, 1], [1, 2], [-2, 1], [1, -2]];
    for (const [host, gs] of guests) {
      const [hx, hy] = iso(host.x, host.y);
      if (hx < cs0x - 80 || hx > cs1x + 80 || hy < cs0y - 80 || hy > cs1y + 80) continue;
      const want = Math.min(4, gs.length * 2);
      let placed = 0;
      for (const [dx, dy] of RING) {
        if (placed >= want) break;
        const tx = host.x + dx, ty = host.y + dy;
        if (isWater(terrain(tx, ty))) continue;
        const st = structureAt(tx, ty, seeds, now);
        if (st && (!FLAT.has(st.kind) || st.build !== undefined)) continue;
        if (st && (st.kind === "field" || st.kind === "pasture" || st.kind === "garden" || st.kind === "bridge")) continue;
        const owner = gs[placed % gs.length]!;
        const [X, Y] = iso(tx, ty);
        const fl = hash(tx, ty, 77) < 0.5;
        // bound to its own tile: houses further south are drawn later and hide it, never the other way round
        addProp(ty * MAP + tx, (cx, cy) => drawStall(c, cx, cy + 2, fl));
        const ex = tradeProfile(owner, now).exports;
        lastTraders.push({ x: X, y: Y, from: owner.name, to: host.name, good: ex[0] ?? null, cart: false, stall: true });
        placed++;
      }
    }
  }

  // ---- pass 2: standing objects in depth order ----
  const hunt = framePool.hunt; hunt.clear();
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
  renderStats.tiles = nTiles; { let n = 0; for (const v of folk.values()) n += v.length; renderStats.folk = n; }
  const birds = framePool.birds; birds.length = 0; // gulls over the coast, crows over fields, drawn on top
  const occ = framePool.occ, ord = framePool.ord; occ.length = 0; ord.clear();
  // supporter decorations: one lookup per frame instead of a fresh cache key per empty tile
  const decor = supportOwned.size ? decorMap(seeds, supportOwned, now, MAP) : null, decorNight = worldHour(now) >= 19 || worldHour(now) < 7;
  type Item = Body & { q?: Pose; sh?: { k: number; m: ReturnType<typeof sheepSpots>[number]["m"] } };
  for (let ti = 0; ti < nTiles; ti++) {
    const { x, y, cx, cy, st: original } = tiles[ti]!;
    // Change only the paint used by this depth pass, never the simulation's tile.
    const st = original ? streetHouse(original, x, y, (rx, ry) => {
      const k = structureAt(rx, ry, seeds, now)?.kind;
      return !!k && PATHLIKE.has(k);
    }) : original;
    ord.set(y * MAP + x, ti);
    if (st?.kind === "avenue" && hash(x,y,92)>0.5) drawNature(c,"oak",cx+9,cy+2,0.22);
    if (!detail) {
      if (st?.build !== undefined) drawSite(c, st, cx, cy, t, false);
      else if (st && !FLAT.has(st.kind)) drawBuildingSprite(c, st.kind, cx, FOOT2.has(st.kind) ? cy - TH / 2 : cy, st.v);
      continue; // forests and crags are baked into the ground chunks
    }
    if (!st && (sharp || nearTown(x, y))) natureAt(c, x, y, cx, cy, t, true, false); // turf already lies in the flat pass
    if (!original && !floodWild.get(y * MAP + x)?.flood && !inCourt(x, y)) {
      const animal = farmAnimalsAt(x, y, seeds, now, pondsNow);
      if (animal) drawFarmAnimal(c, animal, cx, cy, now, x * 31 + y);
    }
    if (st?.kind === "coop" && st.build === undefined) drawHens(c, cx, cy, x * 31 + y);
    if (hash(x, y, 501) < 0.006) { const tr = st ? null : terrain(x, y); if (tr === "water" || (tr === "sand" && hash(x, y, 502) < 0.5)) birds.push([cx, cy, 1, x * 7 + y]); }
    if (st?.kind === "field" && hash(x, y, 503) < 0.02) birds.push([cx, cy, 0, x * 7 + y]);
    const wh = st ?? floodWild.get(y * MAP + x);
    if (wh?.silt && !wh.flood) drawSilt(c, cx, cy, x * 7 + y, wh.silt);
    if (wh?.flood) { drawFlood(c, cx, cy, t, x * 7 + y, wh.wet ?? 1); if ((x + y) % 3 === 0 && lastSources.length < 200) lastSources.push({ x: cx, y: cy, k: "flood" }); }
    if (wh?.levee && !wh.flood) drawLevee(c, cx, cy + 4, x * 7 + y, wh.levee);
    const fk = folk.get(y * MAP + x);
    const sdT = x * 1000 + y, flock = fk && st?.kind === "pasture" && st.build === undefined && !st.flood && herdAt(x, y) === "sheep" ? sheepSpots(sdT, st.v, now) : [];
    if (flock.length) sharedPasture.add(sdT); else sharedPasture.delete(sdT);
    // figures on the north half of a building tile stand behind its wall: draw them before the building
    const behindSet = framePool.behind; behindSet.clear();
    let items: Item[] = [];
    const drawItem = (it: Item) => {
        if (it.sh) { const m = it.sh.m; drawSheep(c, it.x, it.y, m.flip, t + it.sh.k * 1700, m.walking, m.graze, m.sleeping); return; }
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
        const fig = (context: C) => q.mounted ? drawRider(context, px, py, q.dir[0], q.dir[1], 0, q.walking ? t * 0.8 : 0) : drawPerson(context, px, py, q, t, simpleFolk);
        // rescued sheep trots alongside, on the side away from the viewer
        if (q.lead) { const sx = px - q.dir[0] * 2.2 + 2.4, sy = py - q.dir[1] * 1.1 - 0.6; drawSheep(c, sx, sy, q.dir[0] < 0, t + q.p.id * 997, q.walking, false, false); }
        // wading: feet vanish below the water line, a ripple ring rings the shins
        const wd = floodDepth(q.x, q.y);
        if (wd > 0.12) {
          const cut = py - 0.4 - wd * 1.4;
          fig(c);
          // muddy water laps over the shoes instead of clipping the sprite
          c.fillStyle = `rgba(104,92,68,${0.55 + 0.3 * wd})`; c.beginPath(); c.ellipse(px, py - 0.2, 2.2, 0.6 + wd * 0.5, 0, 0, 7); c.fill();
          const rp = (((t / 700 + q.p.id * 0.37) % 1) + 1) % 1;
          c.strokeStyle = `rgba(230,232,218,${0.45 * (1 - rp) * wd})`; c.lineWidth = 0.35;
          c.beginPath(); c.ellipse(px, cut + 0.2, 1.6 + rp * 2.2, 0.55 + rp * 0.7, 0, 0, 7); c.stroke();
          c.fillStyle = `rgba(110,100,76,${0.35 * wd})`; c.beginPath(); c.ellipse(px, cut + 0.2, 1.5, 0.5, 0, 0, 7); c.fill();
          if (q.walking) { c.fillStyle = `rgba(240,240,228,${0.5 * wd})`; c.fillRect(px + q.dir[0] * 1.4 - 0.5, cut - 0.1, 1, 0.3); }
        } else fig(c);
        pushPerson(px, py, q);
        if (q === ownPose) ownDrawn = true;
        if (hov || sel || (q.p.role === "mayor" && q.p.seed.id === ownMayorSid())) vip.push({ f: fig, x: px, y: py, k: y * MAP + x });
        if (q.bucket) drawBucket(c, px, py, q, t);
        if (hov && !sel) {
          c.font = "600 4px system-ui, sans-serif"; c.textAlign = "center";
          const w = c.measureText(q.p.first).width + 3;
          c.fillStyle = "rgba(40,32,24,0.75)"; c.fillRect(px - w / 2, py - 11, w, 5);
          c.fillStyle = "#f6ecd6"; c.fillText(q.p.first, px, py - 7.3);
        }
    };
    if (fk) {
      // personal space: people step aside for each other and for sheep; standing folk yield less than walkers
      // stable order by id: the push result no longer depends on schedule order, so crowds don't swap places each frame
      const fs = [...fk].sort((a, b) => (a.p.id < b.p.id ? -1 : a.p.id > b.p.id ? 1 : 0));
      items = fs.map((q) => { const [px, py] = iso(q.x, q.y); return { x: px, y: py, r: q.p.age < 15 ? FOOT.child : FOOT.adult, give: q.walking ? 1 : 0.25, q }; });
      for (const sh of flock) items.push({ x: cx + sh.m.dx, y: cy + sh.m.dy, r: FOOT.sheep, give: 0.15, sh });
      separate(items);
      sortDepth(items, (it) => (it.q ? `p${it.q.p.id}` : `s${it.sh!.k}`));
      if (folkFrame !== t || !folkM) { folkM = c.getTransform(); folkFrame = t; }
      folkCtx = c;
      if (st && st.build === undefined && !FLAT.has(st.kind)) for (const it of items) if (it.y < cy - 1.5) { behindSet.add(it); drawItem(it); }
    }
    if (st) {
      drawStructure(c, st, cx, cy, x, y, t, L);
      if (st.build === undefined && SEAT_KINDS.includes(st.kind) && supportOwned.get(st.seed.id)?.has("vane")) { const b = spriteBox(st.kind, st.v, houseStyle(st)); if (b) drawVane(c, cx, cy + b.base - b.h); }
      if (st.build === undefined && !FLAT.has(st.kind)) { const b = spriteBox(st.kind, st.v, houseStyle(st)); if (b && b.h > 8) { const oy = FOOT2.has(st.kind) ? cy - TH / 2 : cy; occ.push(ti, cx - b.w / 2, oy + b.base - b.h, cx + b.w / 2, oy + b.base - 2); } }
    }
    for (const f of hunt.get(y * MAP + x) ?? []) f();
    for (const f of props.get(y * MAP + x) ?? []) f(cx, cy);
    const rb = robbers.get(y * MAP + x);
    if (rb) { const [px, py] = iso(rb[0], rb[1]); drawRobber(c, px, py, rb[2], t); vip.push({ f: (context) => drawRobber(context, px, py, rb[2], t), x: px, y: py, k: y * MAP + x }); }
    if (st && (x === st.seed.x && y === st.seed.y) && isBlessed(st.seed, now)) drawFestive(c, cx, cy, t, x * 7 + y, L);
    if (signMap.has(y * MAP + x)) {
      const focused = signFocus.k === y * MAP + x && Date.now() < signFocus.until;
      if (focused) {
        const a = 0.55 + Math.sin(t / 220) * 0.3;
        c.save(); c.strokeStyle = `rgba(255,205,110,${a})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(cx + 5, cy + 1, 10, 5, 0, 0, 7); c.stroke();
        c.fillStyle = `rgba(255,214,140,${a * 0.35})`; c.fill(); c.restore();
      }
      drawSignpost(c, cx, cy, x * 13 + y);
      // small lantern on the post, so it reads at night; brighter while the UI points at it
      L.push({ x: cx + 5, y: cy - 6, r: focused ? 7 : 2.5 });
      if (focused) L.push({ x: cx + 5, y: cy + 1, r: 6 });
    }
    if (!st) { const cp = courtPieces().get(y * MAP + x); if (cp) drawCourtPiece(c, cp, cx, cy, L, t); for (const q of courtFigures(t).get(y * MAP + x) ?? []) drawCourtFigure(c, q, t); }
    if (!st) { const wk = wonderMap().get(y * MAP + x); if (wk) drawWonder(c, wk, cx, cy, t, !wonderFound.has(`${wk}:${x}:${y}`), L); }
    if (!st && decor) { const dk = decor.get(y * MAP + x); if (dk) drawSupport(c, dk, cx, cy, L, decorNight); }
    { const pl = plantings.get(`${x},${y}`); if (pl && (pl.kind === "cherry" || pl.kind === "quince") && !st) drawRareTree(c, cx, cy, pl.kind, (now - Date.parse(pl.created_at)) / 3.6e6, now, t, x * 31 + y); }
    if (y * MAP + x === goalK) {
      // golden waymark where the player's mayor is heading
      const pu = 1 + Math.sin(now / 260) * 0.08;
      c.save(); c.globalAlpha = 0.85; c.strokeStyle = "#d9a520"; c.lineWidth = 1.6;
      c.beginPath(); c.ellipse(cx, cy, 9 * pu, 4.5 * pu, 0, 0, Math.PI * 2); c.stroke();
      c.globalAlpha = 0.35; c.fillStyle = "#f3d27a"; c.beginPath(); c.ellipse(cx, cy, 5, 2.5, 0, 0, Math.PI * 2); c.fill(); c.restore();
    }
    if (fk) {
      for (const it of items) if (!behindSet.has(it)) drawItem(it);
      folkCtx = null;
    }
    if (hover && hover[0] === x && hover[1] === y) {
      c.beginPath(); c.moveTo(cx, cy - TH / 2); c.lineTo(cx + TW / 2, cy); c.lineTo(cx, cy + TH / 2); c.lineTo(cx - TW / 2, cy); c.closePath();
      c.fillStyle = ghostOk === false ? "rgba(180,80,60,0.18)" : "rgba(255,240,200,0.14)"; c.fill();
    }
  }
  // safety net: the own mayor must never vanish — if the tile pass missed him (culling at a zoom edge,
  // rounding onto an unlisted tile), draw him now at his true spot
  if (ownPose && !ownDrawn) {
    const [px, py] = iso(ownPose.x, ownPose.y);
    if (px > cs0x - 20 && px < cs1x + 20 && py > cs0y - 20 && py < cs1y + 30) {
      const q = ownPose;
      q.mounted ? drawRider(c, px, py, q.dir[0], q.dir[1], 0, q.walking ? t * 0.8 : 0) : drawPerson(c, px, py, q, t, simpleFolk);
    }
  }
  for (const [bx, by, gull, sd] of birds) drawBird(c, bx, by, gull === 1, sd);
  // own steered mayor: located even when villagers are culled at far zoom, marked in screen space below
  if (steer && !ownPose) { const sd = seeds.find((s) => s.id === steer.sid); if (sd) ownPose = townPosesSmooth(sd, seeds, now).find((q) => q.p.role === "mayor") ?? null; }
  // parchment silhouette: key figures (own strolling mayor, hovered/selected folk, robbers, messengers) shine faintly through buildings in front
  // only where a building drawn later actually covers the figure, clipped to that roof: in the open the figure stays crisp
  for (const v of vip) {
    const o = ord.get(v.k) ?? -1;
    let hit = false;
    // hysteresis: once shown as a silhouette, the figure must step 2 px clear before it switches back (no edge chatter)
    const was = ghostWas.has(v.k), m = was ? -2 : 1;
    c.save(); c.beginPath();
    for (let i = 0; i < occ.length; i += 5) {
      if (occ[i]! <= o) continue;
      const l = occ[i + 1]!, tp = occ[i + 2]!, rr = occ[i + 3]!, bt = occ[i + 4]!;
      if (v.x > l + m && v.x < rr - m && v.y - 6 < bt - m && v.y > tp + m) { c.rect(l, tp, rr - l, bt - tp); hit = true; }
    }
    // no rectangular clip: sprite boxes include transparent gable corners, so a hard clip sliced heads/feet with straight edges
    if (hit) {
      drawParchment(c, v.x, v.y, z, v.f);
      ghostWas.add(v.k);
    } else ghostWas.delete(v.k);
    c.restore();
  }
  if (ghostWas.size > 64) ghostWas.clear();


  // border banners in both town colours and the carved border stone at the twin gate
  for (const l of worldLinks) {
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
  // vignette gradient only rebuilt when the canvas size changes
  if (!vignette || vignette.w !== w || vignette.h !== h || vignette.c !== c) {
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(20,15,10,0)"); g.addColorStop(1, "rgba(20,15,10,0.32)");
    vignette = { w, h, c, g };
  }
  c.fillStyle = vignette.g; c.fillRect(0, 0, w, h);

  const night = skyTint(c, w, h);
  drawWeather(c, w, h, dpr, performance.now(), night);
  if (night > 0.02) {
    c.globalCompositeOperation = "lighter";
    if (lit) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = night; c.drawImage(lit.cv, 0, 0); c.restore(); }
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
        drawBuildingNight(c, l.building.kind, l.x, l.y, l.building.variant, night * fl, l.building.flip, l.building.style);
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
  // focused signpost: bright ring above the night mask so it is never swallowed by darkness
  if (Date.now() < signFocus.until && signMap.has(signFocus.k)) {
    const fx = signFocus.k % MAP, fy = Math.floor(signFocus.k / MAP);
    const [ix, iy] = iso(fx, fy);
    const sx = (ix + 5 - cam.x) * z + w / 2, sy = (iy + 1 - cam.y) * z + h / 2;
    const a = 0.6 + Math.sin(t / 220) * 0.3, pu = 1 + Math.sin(t / 300) * 0.1;
    c.save(); c.strokeStyle = `rgba(255,210,120,${a})`; c.lineWidth = 2.5 * dpr;
    c.beginPath(); c.ellipse(sx, sy, 13 * z * pu, 6.5 * z * pu, 0, 0, 7); c.stroke(); c.restore();
    // the post itself stays readable above roofs in front and the night mask while pointed at
    c.save(); c.setTransform(z, 0, 0, z, w / 2 - cam.x * z, h / 2 - cam.y * z); c.globalAlpha = 0.92;
    drawSignpost(c, ix, iy, fx * 13 + fy); c.restore();
  }

  // own steered mayor: a small golden diamond floats above his actual position (not his goal), constant screen size
  // so it stays findable when zoomed out; drawn above roofs and the night mask. The goal is a ground ellipse — never confused.
  if (steer && ownPose) {
    const [px, py] = iso(ownPose.x, ownPose.y);
    const sx = (px - cam.x) * z + w / 2, sy = (py - (ownPose.mounted ? 15 : 9.5) - cam.y) * z + h / 2 - 6 * dpr + Math.sin(t / 380) * 1.5 * dpr;
    if (sx > -20 && sx < w + 20 && sy > -20 && sy < h + 20) {
      const rx = 5 * dpr, ry = 7 * dpr;
      c.save(); c.globalAlpha = 0.92; c.lineJoin = "round";
      c.beginPath(); c.moveTo(sx, sy - ry); c.lineTo(sx + rx, sy); c.lineTo(sx, sy + ry); c.lineTo(sx - rx, sy); c.closePath();
      c.fillStyle = "#e8b84a"; c.fill(); c.lineWidth = 1.5 * dpr; c.strokeStyle = "rgba(60,40,18,0.85)"; c.stroke();
      c.beginPath(); c.moveTo(sx, sy - ry * 0.6); c.lineTo(sx + rx * 0.45, sy); c.lineTo(sx, sy); c.closePath(); c.fillStyle = "rgba(255,240,200,0.7)"; c.fill();
      c.restore();
    }
  }

  c.font = `700 ${Math.round(22 * dpr)}px Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif CJK SC', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`; c.textAlign = "center";
  c.lineJoin = "round";
  for (const sd of seeds) {
    const [ix, iy] = iso(sd.x, sd.y);
    const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2 - 22 * z - 8 * dpr;
    c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(sd.name, sx, sy);
    c.fillStyle = INK; c.fillText(sd.name, sx, sy);
  }
  drawCourtLabel(c, cam, w, h, z, dpr, 110 * z + 8 * dpr, 22);
  // twin towns get a joint ribbon label between them
  c.font = `600 ${Math.round(17 * dpr)}px Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif CJK SC', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`;
  for (const l of worldLinks) {
    if (!isTwin(l, seeds, now)) continue;
    const [ix, iy] = iso((l.a.x + l.b.x) / 2, (l.a.y + l.b.y) / 2);
    const sx = (ix - cam.x) * z + w / 2, sy = (iy - cam.y) * z + h / 2;
    const txt = `${l.a.name} ∞ ${l.b.name}`;
    c.lineWidth = 4 * dpr; c.strokeStyle = "rgba(246,238,220,0.9)"; c.strokeText(txt, sx, sy);
    c.fillStyle = hsl(20, 45, 38); c.fillText(txt, sx, sy);
  }
}
