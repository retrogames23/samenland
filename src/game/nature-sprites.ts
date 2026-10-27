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

const pats = new Map<Tex, CanvasPattern>();
/** Texture laid on the iso ground plane (rotated 45° and squashed), anchored in world space. */
export function texture(c: C, t: Tex, shift = 0): CanvasPattern | null {
  let p = pats.get(t);
  if (!p) {
    const i = img(TEX[t]); if (!i) return null;
    p = c.createPattern(i, "repeat") ?? undefined; if (!p) return null;
    pats.set(t, p);
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

/** Draws a nature sprite with its foot at (x,y); sway skews the crown slightly. */
export function drawNature(c: C, k: NatureKind, x: number, y: number, scale: number, sway = 0, flip = false): boolean {
  const s = NATURE[k];
  const i = img(s.url); if (!i) return false;
  const [sx, sy, sw, sh] = s.crop;
  const w = s.width * scale, h = (w * sh) / sw;
  c.save();
  c.translate(x, y);
  c.transform(flip ? -1 : 1, 0, sway * 0.04, 1, 0, 0);
  c.fillStyle = "rgba(25,30,15,0.28)";
  c.beginPath(); c.ellipse(w * 0.12, 0, w * 0.42, w * 0.16, 0, 0, 7); c.fill();
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(i, sx, sy, sw, sh, -w / 2, -h + h * 0.02, w, h);
  c.restore();
  return true;
}
