/** Painted sprites for villagers, waymarks, border stones/banners and construction props. */
import man from "@/assets/sprites/folk/man.webp";
import manWalk from "@/assets/sprites/folk/man-walk.webp";
import legsM from "@/assets/sprites/folk/legs-m.webp";
import woman from "@/assets/sprites/folk/woman.webp";
import child from "@/assets/sprites/folk/child.webp";
import elder from "@/assets/sprites/folk/elder.webp";
import builder from "@/assets/sprites/folk/builder.webp";
import builderF from "@/assets/sprites/folk/builder-f.webp";
import woodcutter from "@/assets/sprites/folk/woodcutter.webp";
import mason from "@/assets/sprites/folk/mason.webp";
import farmer from "@/assets/sprites/folk/farmer.webp";
import porter from "@/assets/sprites/folk/porter.webp";
import priest from "@/assets/sprites/folk/priest.webp";
import bride from "@/assets/sprites/folk/bride.webp";
import groom from "@/assets/sprites/folk/groom.webp";
import robber from "@/assets/sprites/folk/robber.webp";
import stone from "@/assets/sprites/folk/stone.webp";
import signpost from "@/assets/sprites/folk/signpost.webp";
import scaffold from "@/assets/sprites/folk/scaffold.webp";
import logs from "@/assets/sprites/folk/logs.webp";
import blocks from "@/assets/sprites/folk/blocks.webp";
import bannerPole from "@/assets/sprites/folk/banner-pole.webp";
import bannerClothUrl from "@/assets/sprites/folk/banner-cloth.webp";

const URLS = { man, manWalk, legsM, woman, child, elder, builder, builderF, woodcutter, mason, farmer, porter, priest, bride, groom, robber, stone, signpost, scaffold, logs, blocks, bannerPole, bannerCloth: bannerClothUrl };
export type FolkSprite = keyof typeof URLS;
const cache = new Map<string, HTMLImageElement>();
function load(u: string) {
  let i = cache.get(u);
  if (!i) { i = new Image(); i.decoding = "async"; i.src = u; cache.set(u, i); }
  return i.complete && i.naturalWidth ? i : null;
}
if (typeof window !== "undefined") for (const u of Object.values(URLS)) load(u);
export const folkImage = (k: FolkSprite) => load(URLS[k]);

/** Banner cloth tinted to a town hue (multiply over the undyed linen), cached per hue. */
const tinted = new Map<number, HTMLCanvasElement>();
export function bannerCloth(hue: number): HTMLCanvasElement | null {
  const h = Math.round(hue) % 360;
  const hit = tinted.get(h); if (hit) return hit;
  const im = folkImage("bannerCloth"); if (!im) return null;
  const cv = document.createElement("canvas"); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
  const g = cv.getContext("2d")!;
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = "multiply"; g.fillStyle = `hsl(${h},60%,52%)`; g.fillRect(0, 0, cv.width, cv.height);
  g.globalCompositeOperation = "destination-in"; g.drawImage(im, 0, 0);
  tinted.set(h, cv); return cv;
}

/** Painted walk cycles: horizontal strips of WALK_FRAMES frames (contact, down, passing, up, …). */
export const WALK_FRAMES = 6;
const WALKS: Partial<Record<FolkSprite, FolkSprite>> = {}; // men now use the shared legs-m cycle in render.ts
export const walkSheet = (k: FolkSprite) => { const w = WALKS[k]; return w ? folkImage(w) : null; };
