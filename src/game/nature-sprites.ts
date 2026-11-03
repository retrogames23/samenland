import { seasonalImage } from "./season-art";
import { seasonKey } from "./season";
import grass from "@/assets/terrain/grass.jpg";
import meadow from "@/assets/terrain/meadow.jpg";
import forest from "@/assets/terrain/forest.jpg";
import sand from "@/assets/terrain/sand.jpg";
import water from "@/assets/terrain/water.jpg";
import fertile from "@/assets/terrain/fertile.jpg";
import rock from "@/assets/terrain/rock.jpg";
import dirt from "@/assets/terrain/dirt.jpg";
import cobble from "@/assets/terrain/cobble.jpg";
import wheat from "@/assets/terrain/wheat.jpg";
import crops from "@/assets/terrain/crops.jpg";
import oak from "@/assets/sprites/cohesive/oak.webp";
import fir from "@/assets/sprites/cohesive/fir.webp";
import birch from "@/assets/sprites/cohesive/birch.webp";
import crag from "@/assets/sprites/crag.webp";
import bush from "@/assets/sprites/cohesive/bush.webp";
import boulder from "@/assets/sprites/cohesive/boulder.webp";
import oreRock from "@/assets/sprites/ore-rock.webp";
import coalRock from "@/assets/sprites/coal-rock.webp";

type C = CanvasRenderingContext2D;
export type Tex = "grass" | "meadow" | "forest" | "sand" | "water" | "fertile" | "rock" | "dirt" | "cobble" | "wheat" | "crops";
const TEX: Record<Tex, string> = { grass, meadow, forest, sand, water, fertile, rock, dirt, cobble, wheat, crops };
/** World pixels covered by one texture repeat (before iso projection). */
// scaled to the 5-px villager: clover, flowers and cobbles stay smaller than a window or a sheep
// grass/meadow repeat wide enough that the eye never catches the wallpaper grid
const SPAN: Record<Tex, number> = { grass: 150, meadow: 140, forest: 120, sand: 110, water: 170, fertile: 70, rock: 130, dirt: 56, cobble: 26, wheat: 38, crops: 38 };

const imgs = new Map<string, HTMLImageElement>();
function img(url: string) {
  if (typeof Image === "undefined") return null;
  let i = imgs.get(url);
  if (!i) { i = new Image(); i.decoding = "async"; i.src = url; imgs.set(url, i); }
  return i.complete && i.naturalWidth ? i : null;
}

const pats = new Map<string, CanvasPattern>();
let artNow = 0;
export const setNatureTime = (now: number) => { artNow = now; };
const texRole = (t: Tex) => t === "water" ? "water" : t === "wheat" || t === "crops" ? "field" : t === "meadow" ? "flower" : "ground";
const TEX_M = typeof DOMMatrix !== "undefined" ? new DOMMatrix() : (null as unknown as DOMMatrix); // reused, no per-tile allocation
/** Texture laid on the iso ground plane (rotated 45° and squashed), anchored in world space. */
export function texture(c: C, t: Tex, shift = 0): CanvasPattern | null {
  const key = `${t}:${seasonKey(artNow)}`;
  let p = pats.get(key);
  if (!p) {
    const i = img(TEX[t]); if (!i) return null;
    p = c.createPattern(seasonalImage(i, texRole(t)), "repeat") ?? undefined; if (!p) return null;
    if (pats.size > 44) pats.clear(); pats.set(key, p);
  }
  const s = SPAN[t] / 816;
  TEX_M.setMatrixValue("none");
  p.setTransform(TEX_M.scaleSelf(1, 0.5).rotateSelf(45).translateSelf(shift, shift * 0.3).scaleSelf(s, s));
  return p;
}
/** Same texture at another scale and angle: laid over the base at low alpha it breaks the visible repeat grid. */
export function textureAlt(c: C, t: Tex): CanvasPattern | null {
  const p = texture(c, t); if (!p) return null;
  const s = SPAN[t] * 1.73 / 816;
  TEX_M.setMatrixValue("none");
  p.setTransform(TEX_M.scaleSelf(1, 0.5).rotateSelf(45 + 27).translateSelf(37, 113).scaleSelf(s, s));
  return p;
}

type Sprite = { url: string; crop: [number, number, number, number]; width: number };
const NATURE = {
  oak: { url: oak, crop: [0, 0, 480, 474], width: 24 },
  fir: { url: fir, crop: [0, 0, 255, 480], width: 13 },
  birch: { url: birch, crop: [0, 0, 318, 480], width: 15 },
  crag: { url: crag, crop: [0, 0, 791, 669], width: 40 },
  bush: { url: bush, crop: [0, 0, 480, 384], width: 9 },
  boulder: { url: boulder, crop: [0, 0, 480, 347], width: 12 },
  ore: { url: oreRock, crop: [0, 0, 360, 240], width: 11 },
  coal: { url: coalRock, crop: [0, 0, 360, 239], width: 11 },
} satisfies Record<string, Sprite>;
export type NatureKind = keyof typeof NATURE;
/** True once every tree/rock sprite has loaded (used before caching baked ground). */
export const natureReady = () => Object.values(NATURE).every((s) => !!img(s.url));

/** Draws a nature sprite with its foot at (x,y); sway skews the crown slightly. */
export function drawNature(c: C, k: NatureKind, x: number, y: number, scale: number, sway = 0, flip = false): boolean {
  const s = NATURE[k];
  const i = img(s.url); if (!i) return true; // loading: draw nothing rather than old art
  const [, , sw, sh] = s.crop;
  const w = s.width * scale, h = (w * sh) / sw;
  const rock = k === "crag" || k === "boulder" || k === "ore" || k === "coal";
  // rocks rest on their own painted ground footprint: no detached tree shadow, sprite sunk onto the tile
  if (!rock) { // shadow in plain world space (the ellipse is symmetric, so mirroring never mattered)
    c.fillStyle = "rgba(25,30,15,0.28)";
    c.beginPath(); c.ellipse(x + (flip ? -1 : 1) * w * 0.12, y, w * 0.42, w * 0.16, 0, 0, 7); c.fill();
  }
  if (!c.imageSmoothingEnabled) c.imageSmoothingEnabled = true;
  const im = seasonalImage(i, k === "fir" ? "fir" : rock ? "building" : "leaf"), top = rock ? -h * 0.72 : -h + h * 0.02;
  if (!flip && Math.abs(sway) < 0.01) { c.drawImage(im, x - w / 2, y + top, w, h); return true; }
  // zero-save: one absolute matrix (world × translate × mirror/sway shear), then back to the world matrix
  const B = c.getTransform(), fx = flip ? -1 : 1, sh = sway * 0.04;
  c.setTransform(B.a * fx, B.b * fx, B.a * sh + B.c, B.b * sh + B.d, B.a * x + B.c * y + B.e, B.b * x + B.d * y + B.f);
  c.drawImage(im, -w / 2, top, w, h);
  c.setTransform(B);
  return true;
}

if (typeof window !== "undefined") {
  for (const s of Object.values(NATURE)) img(s.url);
  for (const u of Object.values(TEX)) img(u);
}

const samples = new Map<string, { d: Uint8ClampedArray; n: number }>();
/** Small RGB sample grid of a texture (for the cached overview map); null until loaded. */
export function texSample(t: Tex) {
  const key = `${t}:${seasonKey(artNow)}`;
  const s = samples.get(key); if (s) return s;
  const i = img(TEX[t]); if (!i) return null;
  const n = 64, cv = document.createElement("canvas"); cv.width = cv.height = n;
  const g = cv.getContext("2d", { willReadFrequently: true })!; g.drawImage(seasonalImage(i, texRole(t)), 0, 0, n, n);
  const r = { d: g.getImageData(0, 0, n, n).data, n }; if (samples.size > 44) samples.clear(); samples.set(key, r); return r;
}
export const allTexturesReady = () => (Object.keys(TEX) as Tex[]).every((t) => texSample(t));

import boatUrl from "@/assets/sprites/boat.webp";
import planksUrl from "@/assets/terrain/planks.jpg";
if (typeof window !== "undefined") { img(boatUrl); img(planksUrl); }
/** Rowing-boat sprite (bow pointing upper-left in the image), null while loading. */
export const boatImage = () => img(boatUrl);
import sheepGraze from "@/assets/sprites/sheep-graze.webp";
import sheepStand from "@/assets/sprites/sheep-stand.webp";
import sheepSleep from "@/assets/sprites/sheep-sleep.webp";
import sheepWalk from "@/assets/sprites/sheep-walk.webp";
if (typeof window !== "undefined") { img(sheepGraze); img(sheepStand); img(sheepSleep); img(sheepWalk); }
/** Painted sheep sprite (facing right, feet at bottom), null while loading. */
export const sheepImage = (graze: boolean, sleeping = false) => img(sleeping ? sheepSleep : graze ? sheepGraze : sheepStand);
/** 4-frame painted sheep walk cycle (facing right, hooves on bottom edge). */
export const sheepWalkImage = () => img(sheepWalk);
import cartUrl from "@/assets/sprites/cart.webp";
import cartBackUrl from "@/assets/sprites/cart-back.webp";
import wagonUrl from "@/assets/sprites/wagon.webp";
import wagonBackUrl from "@/assets/sprites/wagon-back.webp";
import oxWalkUrl from "@/assets/sprites/ox-walk.webp";
import oxWalkBackUrl from "@/assets/sprites/ox-walk-back.webp";
import cartFrontUrl from "@/assets/sprites/cart-front.webp";
import cartAwayUrl from "@/assets/sprites/cart-away.webp";
import wandererUrl from "@/assets/sprites/wanderer.webp";
if (typeof window !== "undefined") { img(cartUrl); img(cartBackUrl); img(wagonUrl); img(wagonBackUrl); img(oxWalkUrl); img(oxWalkBackUrl); img(cartFrontUrl); img(cartAwayUrl); img(wandererUrl); }
/** Ox cart (ox facing right) and walking traveller (facing right), null while loading. */
export const cartImage = () => img(cartUrl);
/** Head-on / from-behind team for steep (north-south) road stretches. */
export const cartAxisImage = (away: boolean) => img(away ? cartAwayUrl : cartFrontUrl);
export const cartBackImage = () => img(cartBackUrl);
/** Ox-less wagons + 4-frame painted ox walk cycles (front 3/4 and rear 3/4). */
export const wagonImage = (back: boolean) => img(back ? wagonBackUrl : wagonUrl);
export const oxWalkImage = (back: boolean) => img(back ? oxWalkBackUrl : oxWalkUrl);
export const wandererImage = () => img(wandererUrl);
const plankPats = new WeakMap<C, CanvasPattern>();
/** Plank pattern; planks run along the image x-axis, 512px ≈ 8 planks. */
export function planksPattern(c: C): CanvasPattern | null {
  let p = plankPats.get(c); if (p) return p;
  const i = img(planksUrl); if (!i) return null;
  p = c.createPattern(i, "repeat") ?? undefined; if (!p) return null;
  plankPats.set(c, p); return p;
}
import wheatRow from "@/assets/sprites/wheat-row.webp";
import cropRow from "@/assets/sprites/crop-row.webp";
/** Painted standing crop rows stamped along acre furrows (wheat: horizontal row; crops: ridge running up-right). */
export const fieldRowImage = (ripe: boolean) => img(ripe ? wheatRow : cropRow);

import riderUrl from "@/assets/sprites/rider.webp";
import riderBackUrl from "@/assets/sprites/rider-back.webp";
import stallUrl from "@/assets/sprites/stall.webp";
if (typeof window !== "undefined") { img(riderUrl); img(riderBackUrl); img(stallUrl); }
/** 4-frame mounted messenger (front 3/4 facing right, rear 3/4 facing left) and a painted market stall. */
export const riderImage = (back: boolean) => img(back ? riderBackUrl : riderUrl);
export const stallImage = () => img(stallUrl);
