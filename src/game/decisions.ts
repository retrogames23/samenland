import journeyman from "@/assets/encounters/journeyman.webp";
import merchant from "@/assets/encounters/merchant.webp";
import boundary from "@/assets/encounters/boundary.webp";
import ruin from "@/assets/encounters/ruin.webp";
import harvest from "@/assets/encounters/harvest.webp";
import healer from "@/assets/encounters/healer.webp";
import road from "@/assets/encounters/road.webp";
import charter from "@/assets/encounters/charter.webp";
import { pickDecision } from "./decision-order";

export const ART: Record<string, string> = { journeyman, merchant, boundary, ruin, harvest, healer, road, charter };
export { pickDecision };
