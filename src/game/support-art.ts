import statue from "@/assets/sprites/support/statue.webp";
import linden from "@/assets/sprites/support/linden.webp";
import fountain from "@/assets/sprites/support/fountain.webp";
import rosearch from "@/assets/sprites/support/rosearch.webp";
import beegarden from "@/assets/sprites/support/beegarden.webp";
import lantern from "@/assets/sprites/support/lantern.webp";
import vane from "@/assets/sprites/support/vane.webp";
import type { RewardKey } from "./supporter";

/** Sprite per supporter decoration (seal is a UI badge only). */
export const SUPPORT_ART: Partial<Record<RewardKey, string>> = { statue, linden, fountain, rosearch, beegarden, lanterns: lantern, vane };
/** On-map width in world pixels, so decorations match the village scale. */
export const SUPPORT_W: Partial<Record<RewardKey, number>> = { statue: 22, linden: 60, fountain: 32, rosearch: 32, beegarden: 44, lanterns: 12, vane: 12 };
