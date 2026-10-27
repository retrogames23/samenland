import farmhouse from "@/assets/sprites/farmhouse.webp";
import cottage from "@/assets/sprites/cottage.webp";
import barn from "@/assets/sprites/barn.webp";
import church from "@/assets/sprites/church.webp";
import mill from "@/assets/sprites/mill.webp";
import inn from "@/assets/sprites/inn.webp";
import bakery from "@/assets/sprites/bakery.webp";
import townhouse from "@/assets/sprites/townhouse.webp";
import workshop from "@/assets/sprites/workshop.webp";
import smithy from "@/assets/sprites/smithy.webp";
import warehouse from "@/assets/sprites/warehouse.webp";
import factory from "@/assets/sprites/factory.webp";
import sawmill from "@/assets/sprites/sawmill.webp";
import well from "@/assets/sprites/well.webp";
import market from "@/assets/sprites/market.webp";
import hay from "@/assets/sprites/hay.webp";
import type { Kind } from "./world";

type Sprite = { url: string; crop: [number, number, number, number]; width: number; base: number; image?: HTMLImageElement };
// Alpha bounds remove unequal transparent margins. Width is in world pixels, not screen pixels.
const sprites: Partial<Record<Kind, Sprite>> = {
  farmhouse: { url: farmhouse, crop: [0, 0, 933, 799], width: 24, base: 5 },
  cottage: { url: cottage, crop: [0, 0, 996, 872], width: 22, base: 5 },
  barn: { url: barn, crop: [0, 0, 1000, 933], width: 25, base: 5 },
  church: { url: church, crop: [0, 0, 780, 943], width: 27, base: 5 },
  mill: { url: mill, crop: [0, 0, 649, 978], width: 23, base: 4 },
  inn: { url: inn, crop: [0, 0, 982, 925], width: 26, base: 5 },
  bakery: { url: bakery, crop: [0, 0, 921, 908], width: 24, base: 5 },
  townhouse: { url: townhouse, crop: [0, 0, 498, 1010], width: 19, base: 4 },
  workshop: { url: workshop, crop: [0, 0, 994, 857], width: 24, base: 5 },
  smithy: { url: smithy, crop: [0, 0, 1008, 868], width: 25, base: 5 },
  warehouse: { url: warehouse, crop: [0, 0, 993, 705], width: 29, base: 5 },
  factory: { url: factory, crop: [0, 0, 958, 923], width: 29, base: 5 },
  sawmill: { url: sawmill, crop: [0, 0, 1005, 747], width: 28, base: 5 },
  well: { url: well, crop: [0, 0, 677, 946], width: 12, base: 3 },
  market: { url: market, crop: [0, 0, 990, 665], width: 26, base: 5 },
  hay: { url: hay, crop: [0, 0, 966, 827], width: 15, base: 3 },
};

/** Browser images are created only when the canvas draws, never during SSR. */
export function drawBuildingSprite(c: CanvasRenderingContext2D, kind: Kind, x: number, y: number, variant: number): boolean {
  const sprite = sprites[kind];
  if (!sprite || typeof Image === "undefined") return false;
  if (!sprite.image) {
    sprite.image = new Image();
    sprite.image.decoding = "async";
    sprite.image.src = sprite.url;
  }
  const image = sprite.image;
  if (!image.complete || !image.naturalWidth) return false;
  const [sx, sy, sw, sh] = sprite.crop;
  const width = sprite.width * (0.97 + variant * 0.06);
  const height = width * sh / sw;
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  c.drawImage(image, sx, sy, sw, sh, x - width / 2, y + sprite.base - height, width, height);
  c.restore();
  return true;
}
