import walker from "@/assets/sprites/wayside/vignette/walker.webp.asset.json";
import cart from "@/assets/sprites/wayside/vignette/cart.webp.asset.json";
import rider from "@/assets/sprites/wayside/vignette/rider.webp.asset.json";
import beast from "@/assets/sprites/wayside/vignette/beast.webp.asset.json";
import craft from "@/assets/sprites/wayside/vignette/craft.webp.asset.json";
import type { WayVignette } from "./wayside";
export const WAY_VIGNETTE: Record<WayVignette, string> = { walker: walker.url, cart: cart.url, rider: rider.url, beast: beast.url, craft: craft.url };
