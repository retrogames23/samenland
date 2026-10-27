import farmhouse from "@/assets/sprites/farmhouse.png";
import cottage from "@/assets/sprites/cottage.png";
import barn from "@/assets/sprites/barn.png";
import church from "@/assets/sprites/church.png";
import mill from "@/assets/sprites/mill.png";
import inn from "@/assets/sprites/inn.png";
import bakery from "@/assets/sprites/bakery.png";
import townhouse from "@/assets/sprites/townhouse.png";
import workshop from "@/assets/sprites/workshop.png";
import smithy from "@/assets/sprites/smithy.png";
import warehouse from "@/assets/sprites/warehouse.png";
import factory from "@/assets/sprites/factory.png";
import sawmill from "@/assets/sprites/sawmill.png";
import well from "@/assets/sprites/well.png";
import market from "@/assets/sprites/market.png";
import hay from "@/assets/sprites/hay.png";
import type { Kind } from "./world";

type Sprite = { url: string; crop: [number, number, number, number]; width: number; base: number; image?: HTMLImageElement };
// Alpha bounds remove unequal transparent margins. Width is in world pixels, not screen pixels.
const sprites: Partial<Record<Kind, Sprite>> = {
  farmhouse: { url: farmhouse, crop: [46, 96, 933, 799], width: 24, base: 5 },
  cottage: { url: cottage, crop: [17, 59, 996, 872], width: 22, base: 5 },
  barn: { url: barn, crop: [19, 16, 1000, 933], width: 25, base: 5 },
  church: { url: church, crop: [158, 20, 780, 943], width: 27, base: 5 },
  mill: { url: mill, crop: [146, 13, 649, 978], width: 23, base: 4 },
  inn: { url: inn, crop: [15, 15, 982, 925], width: 26, base: 5 },
  bakery: { url: bakery, crop: [64, 30, 921, 908], width: 24, base: 5 },
  townhouse: { url: townhouse, crop: [263, 5, 498, 1010], width: 19, base: 4 },
  workshop: { url: workshop, crop: [13, 28, 994, 857], width: 24, base: 5 },
  smithy: { url: smithy, crop: [8, 0, 1008, 868], width: 25, base: 5 },
  warehouse: { url: warehouse, crop: [16, 151, 993, 705], width: 29, base: 5 },
  factory: { url: factory, crop: [32, 24, 958, 923], width: 29, base: 5 },
  sawmill: { url: sawmill, crop: [10, 75, 1005, 747], width: 28, base: 5 },
  well: { url: well, crop: [178, 24, 677, 946], width: 12, base: 3 },
  market: { url: market, crop: [15, 153, 990, 665], width: 26, base: 5 },
  hay: { url: hay, crop: [25, 72, 966, 827], width: 15, base: 3 },
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
