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
import oak from "@/assets/sprites/oak.webp";
import fir from "@/assets/sprites/fir.webp";
import birch from "@/assets/sprites/birch.webp";
import crag from "@/assets/sprites/crag.webp";
import bush from "@/assets/sprites/bush.webp";

type C = CanvasRenderingContext2D;
export type Tex = "grass" | "meadow" | "forest" | "sand" | "water" | "fertile" | "rock" | "dirt" | "cobble" | "wheat" | "crops";
const TEX: Record<Tex, string> = { grass, meadow, forest, sand, water, fertile, rock, dirt, cobble, wheat, crops };
/** World pixels covered by one texture repeat (before iso projection). */
const SPAN: Record<Tex, number> = { grass: 150, meadow: 150, forest: 150, sand: 130, water: 170, fertile: 150, rock: 150, dirt: 70, cobble: 46, wheat: 60, crops: 60 };

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
  const m = new DOMMatrix().scale(1, 0.5).rotate(45).translate(shift, shift * 0.3).scale(s, s);
  p.setTransform(m);
  return p;
}

type Sprite = { url: string; crop: [number, number, number, number]; width: number };
const NATURE = {
  oak: { url: oak, crop: [0, 0, 716, 726], width: 24 },
  fir: { url: fir, crop: [0, 0, 358, 763], width: 13 },
  birch: { url: birch, crop: [0, 0, 459, 744], width: 15 },
  crag: { url: crag, crop: [0, 0, 791, 669], width: 40 },
  bush: { url: bush, crop: [0, 0, 490, 454], width: 9 },
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
  c.save();
  c.translate(x, y);
  c.transform(flip ? -1 : 1, 0, sway * 0.04, 1, 0, 0);
  c.fillStyle = "rgba(25,30,15,0.28)";
  c.beginPath(); c.ellipse(w * 0.12, 0, w * 0.42, w * 0.16, 0, 0, 7); c.fill();
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(seasonalImage(i, k === "fir" ? "fir" : k === "crag" ? "building" : "leaf"), -w / 2, -h + h * 0.02, w, h);
  c.restore();
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
if (typeof window !== "undefined") { img(sheepGraze); img(sheepStand); }
/** Painted sheep sprite (facing right, feet at bottom), null while loading. */
export const sheepImage = (graze: boolean) => img(graze ? sheepGraze : sheepStand);
const plankPats = new WeakMap<C, CanvasPattern>();
/** Plank pattern; planks run along the image x-axis, 512px ≈ 8 planks. */
export function planksPattern(c: C): CanvasPattern | null {
  let p = plankPats.get(c); if (p) return p;
  const i = img(planksUrl); if (!i) return null;
  p = c.createPattern(i, "repeat") ?? undefined; if (!p) return null;
  plankPats.set(c, p); return p;
}
