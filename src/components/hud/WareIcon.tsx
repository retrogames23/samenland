import sheet from "@/assets/goods-icons.webp";
import { WARES, type Ware } from "@/game/goods";

/** Painted goods icon cut from the 5×2 sheet. */
export function WareIcon({ ware, size = 20 }: { ware: Ware; size?: number }) {
  const i = WARES.indexOf(ware), c = i % 5, r = Math.floor(i / 5);
  return (
    <span
      aria-hidden
      className="inline-block shrink-0"
      style={{ width: size, height: size, backgroundImage: `url(${sheet})`, backgroundSize: `${size * 5}px ${size * 2}px`, backgroundPosition: `-${c * size}px -${r * size}px` }}
    />
  );
}
