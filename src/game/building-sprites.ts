import { seasonalImage } from "./season-art";
import campfire from "@/assets/sprites/campfire.webp";
import hut from "@/assets/sprites/hut.webp";
import coop from "@/assets/sprites/coop.webp";
import fence from "@/assets/sprites/fence.webp";
import chapel from "@/assets/sprites/chapel.webp";
import watermill from "@/assets/sprites/watermill.webp";
import harbor from "@/assets/sprites/harbor.webp";
import stall from "@/assets/sprites/stall.webp";
import townhall from "@/assets/sprites/townhall.webp";
import manufactory from "@/assets/sprites/manufactory.webp";
import steamworks from "@/assets/sprites/steamworks.webp";
import station from "@/assets/sprites/station.webp";
import suburb from "@/assets/sprites/suburb.webp";
import farmhouse from "@/assets/sprites/farmhouse.webp";
import cottage from "@/assets/sprites/cottage.webp";
import barn from "@/assets/sprites/barn.webp";
import church from "@/assets/sprites/church.webp";
import mill from "@/assets/sprites/mill-body.webp";
import millSails from "@/assets/sprites/mill-sails.webp";
import inn from "@/assets/sprites/inn.webp";
import bakery from "@/assets/sprites/bakery.webp";
import townhouse from "@/assets/sprites/townhouse.webp";
import townhouse2 from "@/assets/sprites/townhouse2.webp";
import patrician from "@/assets/sprites/patrician.webp";
import villa from "@/assets/sprites/villa.webp";
import tenement from "@/assets/sprites/tenement.webp";
import workshop from "@/assets/sprites/workshop.webp";
import smithy from "@/assets/sprites/smithy.webp";
import warehouse from "@/assets/sprites/warehouse.webp";
import factory from "@/assets/sprites/factory.webp";
import sawmill from "@/assets/sprites/sawmill.webp";
import well from "@/assets/sprites/well.webp";
import market from "@/assets/sprites/market.webp";
import hay from "@/assets/sprites/hay.webp";
import fishery from "@/assets/sprites/fishery.webp";
import granary from "@/assets/sprites/granary.webp";
import infirmary from "@/assets/sprites/infirmary.webp";
import school from "@/assets/sprites/school.webp";
import markethall from "@/assets/sprites/markethall.webp";
import gatehouse from "@/assets/sprites/gatehouse.webp";
import guildhall from "@/assets/sprites/guildhall.webp";
import library from "@/assets/sprites/library.webp";
import dairy from "@/assets/sprites/dairy.webp";
import type { Kind } from "./world";

import bakeryLight from "@/assets/sprites/night/bakery.webp";
import barnLight from "@/assets/sprites/night/barn.webp";
import chapelLight from "@/assets/sprites/night/chapel.webp";
import churchLight from "@/assets/sprites/night/church.webp";
import cottageLight from "@/assets/sprites/night/cottage.webp";
import dairyLight from "@/assets/sprites/night/dairy.webp";
import factoryLight from "@/assets/sprites/night/factory.webp";
import farmhouseLight from "@/assets/sprites/night/farmhouse.webp";
import fisheryLight from "@/assets/sprites/night/fishery.webp";
import granaryLight from "@/assets/sprites/night/granary.webp";
import guildhallLight from "@/assets/sprites/night/guildhall.webp";
import harborLight from "@/assets/sprites/night/harbor.webp";
import hutLight from "@/assets/sprites/night/hut.webp";
import infirmaryLight from "@/assets/sprites/night/infirmary.webp";
import innLight from "@/assets/sprites/night/inn.webp";
import libraryLight from "@/assets/sprites/night/library.webp";
import manufactoryLight from "@/assets/sprites/night/manufactory.webp";
import markethallLight from "@/assets/sprites/night/markethall.webp";
import millLight from "@/assets/sprites/night/mill.webp";
import sawmillLight from "@/assets/sprites/night/sawmill.webp";
import schoolLight from "@/assets/sprites/night/school.webp";
import smithyLight from "@/assets/sprites/night/smithy.webp";
import stationLight from "@/assets/sprites/night/station.webp";
import steamworksLight from "@/assets/sprites/night/steamworks.webp";
import suburbLight from "@/assets/sprites/night/suburb.webp";
import townhallLight from "@/assets/sprites/night/townhall.webp";
import townhouseLight from "@/assets/sprites/night/townhouse.webp";
import townhouse2Light from "@/assets/sprites/night/townhouse2.webp";
import patricianLight from "@/assets/sprites/night/patrician.webp";
import villaLight from "@/assets/sprites/night/villa.webp";
import tenementLight from "@/assets/sprites/night/tenement.webp";
import gatehouseLight from "@/assets/sprites/night/gatehouse.webp";
import warehouseLight from "@/assets/sprites/night/warehouse.webp";
import watermillLight from "@/assets/sprites/night/watermill.webp";
import workshopLight from "@/assets/sprites/night/workshop.webp";

const nightUrls: Partial<Record<Kind, string>> = { bakery: bakeryLight, barn: barnLight, chapel: chapelLight, church: churchLight, cottage: cottageLight, dairy: dairyLight, factory: factoryLight, farmhouse: farmhouseLight, fishery: fisheryLight, granary: granaryLight, guildhall: guildhallLight, harbor: harborLight, hut: hutLight, infirmary: infirmaryLight, inn: innLight, library: libraryLight, manufactory: manufactoryLight, markethall: markethallLight, mill: millLight, sawmill: sawmillLight, school: schoolLight, smithy: smithyLight, station: stationLight, steamworks: steamworksLight, suburb: suburbLight, townhall: townhallLight, townhouse: townhouseLight, townhouse2: townhouse2Light, patrician: patricianLight, villa: villaLight, tenement: tenementLight, gatehouse: gatehouseLight, warehouse: warehouseLight, watermill: watermillLight, workshop: workshopLight };
const nightImages: Partial<Record<Kind, HTMLImageElement>> = {};
export const hasNightSprite = (kind: Kind) => Boolean(nightUrls[kind]);

type Sprite = { url: string; crop: [number, number, number, number]; width: number; base: number; image?: HTMLImageElement };
// Alpha bounds remove unequal transparent margins. Width is in world pixels, not screen pixels.
const sprites: Partial<Record<Kind, Sprite>> = {
  campfire: { url: campfire, crop: [0, 0, 480, 346], width: 12, base: 4 },
  hut: { url: hut, crop: [0, 0, 470, 480], width: 20, base: 4 },
  coop: { url: coop, crop: [0, 0, 480, 450], width: 22, base: 4 },
  fence: { url: fence, crop: [0, 0, 480, 256], width: 22, base: 4 },
  chapel: { url: chapel, crop: [0, 0, 471, 480], width: 24, base: 4 },
  watermill: { url: watermill, crop: [0, 0, 480, 464], width: 28, base: 4 },
  harbor: { url: harbor, crop: [0, 0, 480, 418], width: 26, base: 4 },
  stall: { url: stall, crop: [0, 0, 480, 395], width: 23, base: 4 },
  townhall: { url: townhall, crop: [0, 0, 391, 480], width: 30, base: 4 },
  manufactory: { url: manufactory, crop: [0, 0, 480, 451], width: 31, base: 4 },
  steamworks: { url: steamworks, crop: [0, 0, 480, 474], width: 27, base: 4 },
  station: { url: station, crop: [0, 0, 447, 480], width: 27, base: 4 },
  suburb: { url: suburb, crop: [0, 0, 470, 480], width: 25, base: 4 },
  farmhouse: { url: farmhouse, crop: [0, 0, 933, 799], width: 24, base: 5 },
  cottage: { url: cottage, crop: [0, 0, 996, 872], width: 22, base: 5 },
  barn: { url: barn, crop: [0, 0, 1000, 933], width: 25, base: 5 },
  church: { url: church, crop: [0, 0, 780, 943], width: 27, base: 5 },
  mill: { url: mill, crop: [0, 0, 480, 779], width: 16, base: 4 },
  inn: { url: inn, crop: [0, 0, 982, 925], width: 26, base: 5 },
  bakery: { url: bakery, crop: [0, 0, 921, 908], width: 24, base: 5 },
  townhouse: { url: townhouse, crop: [0, 0, 498, 1010], width: 19, base: 4 },
  townhouse2: { url: townhouse2, crop: [0, 0, 240, 480], width: 18, base: 4 },
  patrician: { url: patrician, crop: [0, 0, 274, 480], width: 21, base: 4 },
  villa: { url: villa, crop: [0, 0, 480, 479], width: 27, base: 4 },
  tenement: { url: tenement, crop: [0, 0, 480, 471], width: 28, base: 4 },
  workshop: { url: workshop, crop: [0, 0, 994, 857], width: 24, base: 5 },
  smithy: { url: smithy, crop: [0, 0, 1008, 868], width: 25, base: 5 },
  warehouse: { url: warehouse, crop: [0, 0, 993, 705], width: 29, base: 5 },
  factory: { url: factory, crop: [0, 0, 464, 480], width: 36, base: 4 },
  sawmill: { url: sawmill, crop: [0, 0, 1005, 747], width: 28, base: 5 },
  well: { url: well, crop: [0, 0, 677, 946], width: 12, base: 3 },
  market: { url: market, crop: [0, 0, 990, 665], width: 26, base: 5 },
  hay: { url: hay, crop: [0, 0, 966, 827], width: 15, base: 3 },
  fishery: { url: fishery, crop: [0, 0, 480, 436], width: 22, base: 4 },
  granary: { url: granary, crop: [0, 0, 480, 450], width: 25, base: 4 },
  infirmary: { url: infirmary, crop: [0, 0, 480, 477], width: 23, base: 4 },
  school: { url: school, crop: [0, 0, 480, 478], width: 24, base: 4 },
  gatehouse: { url: gatehouse, crop: [0, 0, 323, 480], width: 26, base: 4 },
  markethall: { url: markethall, crop: [0, 0, 480, 437], width: 27, base: 4 },
  guildhall: { url: guildhall, crop: [0, 0, 450, 480], width: 24, base: 4 },
  library: { url: library, crop: [0, 0, 480, 478], width: 24, base: 4 },
  dairy: { url: dairy, crop: [0, 0, 480, 424], width: 25, base: 4 },
};

/** Image URL of a building, for previews in menus. */
export const spriteUrl = (kind: Kind) => sprites[kind]?.url;
/** Browser images are created only when the canvas draws, never during SSR. */
/** Drawn width/height and ground offset of a building sprite (null while unknown). */
const HOME_SIZE: ReadonlySet<string> = new Set(["hut", "farmhouse", "cottage", "townhouse", "townhouse2", "patrician", "villa", "tenement", "suburb"]);
/** Homes vary ±9 % in size, other buildings ±3 %. */
const scaleOf = (kind: Kind, variant: number) => HOME_SIZE.has(kind) ? 0.91 + variant * 0.18 : 0.97 + variant * 0.06;
export function spriteBox(kind: Kind, variant: number): { w: number; h: number; base: number } | null {
  const sprite = sprites[kind]; if (!sprite) return null;
  const [, , sw, sh] = sprite.crop, w = sprite.width * scaleOf(kind, variant);
  return { w, h: w * sh / sw, base: sprite.base };
}
/** `reveal` < 1 draws only the lower part of the building (walls rising on a construction site). */
export function drawBuildingSprite(c: CanvasRenderingContext2D, kind: Kind, x: number, y: number, variant: number, reveal = 1, flip = false): boolean {
  const sprite = sprites[kind];
  if (!sprite || typeof Image === "undefined") return false;
  if (!sprite.image) {
    sprite.image = new Image();
    sprite.image.decoding = "async";
    sprite.image.src = sprite.url;
  }
  const image = sprite.image;
  if (!image.complete || !image.naturalWidth) return true; // still loading: draw nothing, never the old vector art
  const [, , sw, sh] = sprite.crop;
  const width = sprite.width * scaleOf(kind, variant);
  const height = width * sh / sw;
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  if (reveal < 1) { const top = y + sprite.base - height * reveal; c.beginPath(); c.rect(x - width, top, width * 2, height * 2); c.clip(); }
  const left = x - width / 2, top = y + sprite.base - height;
  if (flip) { c.translate(x * 2, 0); c.scale(-1, 1); }
  c.drawImage(seasonalImage(image), left, top, width, height);
  c.restore();
  if (reveal >= 1 && !flip) animate(c, kind, left, top, width / sw, x * 7 + y * 13);
  return true;
}

/** The light-only layer uses exactly the daylight sprite's framing, scale and mirroring. */
export function drawBuildingNight(c: CanvasRenderingContext2D, kind: Kind, x: number, y: number, variant: number, intensity: number, flip = false) {
  const image = nightImages[kind], box = spriteBox(kind, variant);
  if (!image?.complete || !image.naturalWidth || !box) return;
  c.save();
  c.globalAlpha *= intensity;
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  if (flip) { c.translate(x * 2, 0); c.scale(-1, 1); }
  c.drawImage(image, x - box.w / 2, y + box.base - box.h, box.w, box.h);
  c.restore();
}

/** Starts loading every building image right away so towns appear complete. */
export function preloadBuildingSprites() {
  if (typeof Image === "undefined") return;
  for (const [kind, url] of Object.entries(nightUrls)) {
    const k = kind as Kind;
    if (!nightImages[k]) { const im = new Image(); im.decoding = "async"; im.src = url; nightImages[k] = im; }
  }
  for (const s of Object.values(sprites)) if (s && !s.image) { s.image = new Image(); s.image.decoding = "async"; s.image.src = s.url; }
}
if (typeof window !== "undefined") preloadBuildingSprites();

// ---- living overlays: moving parts painted over the still sprites (pure functions of clock time) ----
let animT = 0;
/** Set once per frame by the renderer so every overlay shares the same clock. */
export function setSpriteTime(t: number) { animT = t; }
let sailsImg: HTMLImageElement | undefined;
if (typeof Image !== "undefined") { sailsImg = new Image(); sailsImg.decoding = "async"; sailsImg.src = millSails; }

function animate(c: CanvasRenderingContext2D, kind: Kind, left: number, top: number, k: number, sd: number) {
  const t = animT, P = (u: number, v: number): [number, number] => [left + u * k, top + v * k];
  if (kind === "mill") millSailsAt(c, ...P(102, 137), 480 * k * 1.45, t, sd);
  else if (kind === "watermill") waterWheel(c, ...P(368, 318), 72 * k, t, sd);
  else if (kind === "campfire") flames(c, ...P(168, 200), 150 * k, t, sd);
}

function millSailsAt(c: CanvasRenderingContext2D, x: number, y: number, d: number, t: number, sd: number) {
  if (!sailsImg?.complete || !sailsImg.naturalWidth) return;
  // integrated angle: steady ~19 s per turn with gentle gusts (multiplying t by a gust factor made it spin wildly)
  const a = t / 3000 - (0.25 * 9000 / 3000) * Math.cos(t / 9000 + sd) + sd;
  c.save(); c.translate(x, y);
  c.transform(0.62, 0.22, 0, 1, 0, 0); // sails face the viewer at an angle, like the cap
  c.rotate(a);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(sailsImg, -d / 2, -d / 2, d, d);
  c.restore();
}

function waterWheel(c: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, sd: number) {
  const a = t / 1800 + sd;
  c.save(); c.translate(x, y); c.transform(0.82, 0.12, 0, 1.12, 0, 0);
  // dark hollow of the wheel, hiding the painted still spokes
  c.fillStyle = "rgba(36,30,24,0.92)"; c.beginPath(); c.arc(0, 0, r * 0.93, 0, 7); c.fill();
  c.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const q = a + (i * Math.PI) / 4, cx = Math.cos(q), sy = Math.sin(q);
    c.strokeStyle = "#5a4130"; c.lineWidth = r * 0.07;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(cx * r * 0.86, sy * r * 0.86); c.stroke();
    // paddle
    c.strokeStyle = "#6e5038"; c.lineWidth = r * 0.16;
    c.beginPath(); c.moveTo(cx * r * 0.78, sy * r * 0.78); c.lineTo(cx * r * 0.98, sy * r * 0.98); c.stroke();
  }
  c.strokeStyle = "#4a3426"; c.lineWidth = r * 0.09; c.beginPath(); c.arc(0, 0, r * 0.86, 0, 7); c.stroke();
  c.strokeStyle = "rgba(160,120,80,0.5)"; c.lineWidth = r * 0.025; c.beginPath(); c.arc(0, 0, r * 0.82, Math.PI * 1.05, Math.PI * 1.6); c.stroke();
  c.fillStyle = "#3a2a1e"; c.beginPath(); c.arc(0, 0, r * 0.13, 0, 7); c.fill();
  c.restore();
  // water spilling over the paddles and splashing below
  for (let i = 0; i < 9; i++) {
    const ph = (t / 700 + i / 9 + sd * 0.1) % 1;
    const px = x + r * (0.55 + 0.15 * Math.sin(i * 2.3)), py = y - r * 0.9 + ph * r * 2;
    c.fillStyle = `rgba(215,232,238,${0.55 * (1 - ph)})`;
    c.fillRect(px, py, r * 0.035, r * 0.12);
  }
  for (let i = 0; i < 5; i++) {
    const ph = (t / 900 + i / 5) % 1;
    c.fillStyle = `rgba(230,240,240,${0.35 * (1 - ph)})`;
    c.beginPath(); c.ellipse(x + r * (0.2 + i * 0.12), y + r * 1.02, r * (0.06 + ph * 0.14), r * (0.025 + ph * 0.05), 0, 0, 7); c.fill();
  }
}

function flames(c: CanvasRenderingContext2D, x: number, y: number, h: number, t: number, sd: number) {
  c.save();
  // breathing glow on stones and ground
  const fl = 0.75 + 0.15 * Math.sin(t / 110 + sd) + 0.1 * Math.sin(t / 47 + sd * 3);
  const g = c.createRadialGradient(x, y - h * 0.1, 0, x, y - h * 0.1, h * 0.9);
  g.addColorStop(0, `rgba(255,170,70,${0.28 * fl})`); g.addColorStop(1, "rgba(255,140,50,0)");
  c.globalCompositeOperation = "lighter"; c.fillStyle = g; c.fillRect(x - h, y - h, h * 2, h * 2);
  // flickering tongues
  for (let i = 0; i < 6; i++) {
    const ph = t / (90 + i * 23) + i * 1.7 + sd;
    const hx = x + (i - 2.5) * h * 0.07, tall = h * (0.42 + 0.22 * Math.abs(Math.sin(ph)) + 0.08 * Math.sin(ph * 2.7));
    const sway = Math.sin(ph * 1.3) * h * 0.06, w = h * (0.1 + 0.03 * Math.sin(ph * 0.7));
    const fg = c.createLinearGradient(hx, y, hx, y - tall);
    fg.addColorStop(0, "rgba(255,120,30,0.55)"); fg.addColorStop(0.5, "rgba(255,190,70,0.4)"); fg.addColorStop(1, "rgba(255,230,140,0)");
    c.fillStyle = fg; c.beginPath();
    c.moveTo(hx - w, y);
    c.quadraticCurveTo(hx - w * 0.9, y - tall * 0.5, hx + sway, y - tall);
    c.quadraticCurveTo(hx + w * 0.9, y - tall * 0.5, hx + w, y);
    c.closePath(); c.fill();
  }
  // sparks rising and drifting
  for (let i = 0; i < 7; i++) {
    const ph = (t / 1400 + i / 7 + (sd % 1)) % 1;
    const sx = x + Math.sin(i * 4.1 + ph * 6) * h * 0.18 + ph * h * 0.12, sy = y - h * 0.3 - ph * h * 0.9;
    c.fillStyle = `rgba(255,${200 - ph * 80},90,${0.9 * (1 - ph)})`;
    c.fillRect(sx, sy, h * 0.012, h * 0.012);
  }
  c.restore();
}
