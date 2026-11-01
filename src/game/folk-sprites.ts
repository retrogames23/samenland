/** Painted sprites for villagers, waymarks, border stones/banners and construction props. */
import man from "@/assets/sprites/folk/man.webp";
import manWalk from "@/assets/sprites/folk/man-walk.webp";
import legsM from "@/assets/sprites/folk/legs-m.webp";
import woman from "@/assets/sprites/folk/woman.webp";
import child from "@/assets/sprites/folk/child.webp";
import childWalk from "@/assets/sprites/folk/child-walk.webp";
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
import porterF from "@/assets/sprites/folk/porter-f.webp";
import farmerF from "@/assets/sprites/folk/farmer-f.webp";
import woodcutterWork from "@/assets/sprites/folk/woodcutter-work.webp";
import woodcutterFWork from "@/assets/sprites/folk/woodcutter-f-work.webp";
import masonWork from "@/assets/sprites/folk/mason-work.webp";
import masonFWork from "@/assets/sprites/folk/mason-f-work.webp";
import builderWork from "@/assets/sprites/folk/builder-work.webp";
import builderFWork from "@/assets/sprites/folk/builder-f-work.webp";
import gatherWork from "@/assets/sprites/folk/gather-work.webp";
import gatherFWork from "@/assets/sprites/folk/gather-f-work.webp";
import talkWork from "@/assets/sprites/folk/talk-work.webp";
import talkFWork from "@/assets/sprites/folk/talk-f-work.webp";
import talkWorkYoung from "@/assets/sprites/folk/talk-work-young.webp";
import talkWorkMid from "@/assets/sprites/folk/talk-work-mid.webp";
import talkWorkOld from "@/assets/sprites/folk/talk-work-old.webp";
import talkFWorkMid from "@/assets/sprites/folk/talk-f-work-mid.webp";
import talkFWorkMature from "@/assets/sprites/folk/talk-f-work-mature.webp";
import talkFWorkOld from "@/assets/sprites/folk/talk-f-work-old.webp";
import farmerMow from "@/assets/sprites/folk/farmer-mow.webp";
import farmerFMow from "@/assets/sprites/folk/farmer-f-mow.webp";
import elderF from "@/assets/sprites/folk/elder-f.webp";
import masonF from "@/assets/sprites/folk/mason-f.webp";
import woodcutterF from "@/assets/sprites/folk/woodcutter-f.webp";
import footF from "@/assets/sprites/folk/foot-f.webp";
import robber from "@/assets/sprites/folk/robber.webp";
import stone from "@/assets/sprites/folk/stone.webp";
import signpost from "@/assets/sprites/folk/signpost.webp";
import scaffold from "@/assets/sprites/folk/scaffold.webp";
import logs from "@/assets/sprites/folk/logs.webp";
import blocks from "@/assets/sprites/folk/blocks.webp";
import bannerPole from "@/assets/sprites/folk/banner-pole.webp";
import fisherCast from "@/assets/sprites/folk/fisher-cast.webp";
import fisherFCast from "@/assets/sprites/folk/fisher-f-cast.webp";
import smithHammer from "@/assets/sprites/folk/smith-hammer.webp";
import anvil from "@/assets/sprites/folk/anvil.webp";
import chain from "@/assets/sprites/folk/chain.webp";
import beret from "@/assets/sprites/folk/beret.webp";
import flourSacks from "@/assets/sprites/folk/flour-sacks.webp";
import breadBasket from "@/assets/sprites/folk/bread-basket.webp";
import fishBasket from "@/assets/sprites/folk/fish-basket.webp";
import sparks from "@/assets/sprites/folk/sparks.webp";
import bannerClothUrl from "@/assets/sprites/folk/banner-cloth.webp";

const URLS = { man, manWalk, legsM, woman, child, childWalk, elder, builder, builderF, woodcutter, mason, farmer, farmerMow, farmerFMow, porter, priest, bride, groom, robber, porterF, farmerF, elderF, masonF, woodcutterF, footF, stone, signpost, scaffold, logs, blocks, bannerPole, bannerCloth: bannerClothUrl, fisherCast, fisherFCast, smithHammer, anvil, chain, beret, flourSacks, breadBasket, fishBasket, sparks, woodcutterWork, woodcutterFWork, masonWork, masonFWork, builderWork, builderFWork, gatherWork, gatherFWork, talkWork, talkFWork, talkWorkYoung, talkWorkMid, talkWorkOld, talkFWorkMid, talkFWorkMature, talkFWorkOld };
export type FolkSprite = keyof typeof URLS;
/** Mayor age cohorts 20–70: same 6-frame robe sheet layout per cohort, so standing, talking and walking all age together. */
export type Cohort = "young" | "mid" | "mature" | "old";
export const cohortOf = (age: number): Cohort => age < 35 ? "young" : age < 50 ? "mid" : age < 60 ? "mature" : "old";
const MAYOR_SHEETS: Record<"m" | "f", Record<Cohort, FolkSprite>> = {
  m: { young: "talkWorkYoung", mid: "talkWorkMid", mature: "talkWork", old: "talkWorkOld" },
  f: { young: "talkFWork", mid: "talkFWorkMid", mature: "talkFWorkMature", old: "talkFWorkOld" },
};
export const mayorSheet = (sex: string, age: number): FolkSprite => MAYOR_SHEETS[sex === "f" ? "f" : "m"][cohortOf(age)];
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
const WALKS: Partial<Record<FolkSprite, FolkSprite>> = { child: "childWalk" }; // men now use the shared legs-m cycle in render.ts
/** Painted 6-frame harvest cycles (scythe for men, sickle and sheaf for women), feet centred in each frame. */
const WORKS: Partial<Record<FolkSprite, FolkSprite>> = { farmer: "farmerMow" as FolkSprite, farmerF: "farmerFMow" as FolkSprite };
export const workSheet = (k: FolkSprite) => { const w = WORKS[k]; return w ? folkImage(w) : null; };
export const walkSheet = (k: FolkSprite) => { const w = WALKS[k]; return w ? folkImage(w) : null; };

/** Trade work cycles keyed by job (fishers and smiths wear ordinary clothes, so the sprite alone can't pick them).
 *  scale: frame height relative to figure height (rods/raised hammers reach above the head); per: cycle ms. */
export const JOB_WORK: Record<string, { m: FolkSprite; f: FolkSprite; scale: number; per: number }> = {
  fisher: { m: "fisherCast", f: "fisherFCast", scale: 1.6, per: 9000 },
  smith: { m: "smithHammer", f: "smithHammer", scale: 1.22, per: 1500 },
  woodcutter: { m: "woodcutterWork", f: "woodcutterFWork", scale: 1.15, per: 1800 },
  mason: { m: "masonWork", f: "masonFWork", scale: 1.12, per: 1600 },
  builder: { m: "builderWork", f: "builderFWork", scale: 1.15, per: 1400 },
  herbalist: { m: "gatherWork", f: "gatherFWork", scale: 1.01, per: 7000 },
  healer: { m: "gatherWork", f: "gatherFWork", scale: 1.01, per: 8000 },
  hunter: { m: "gatherWork", f: "gatherFWork", scale: 1.01, per: 9000 },
  merchant: { m: "talkWork", f: "talkFWork", scale: 1.01, per: 8000 },
  carter: { m: "talkWork", f: "talkFWork", scale: 1.01, per: 9000 },
  watchman: { m: "talkWork", f: "talkFWork", scale: 1.01, per: 10000 },
  mayor: { m: "talkWork", f: "talkFWork", scale: 1.01, per: 9000 },
};
