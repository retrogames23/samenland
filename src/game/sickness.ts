import { stepsPaid, CATHEDRAL_SICK, UNIVERSITY_SICK, ORANGERY_SICK, type Seed } from "./world";
import { seasonAt } from "./season";
import { festJoy } from "./weddings";
import { CULTURE_SICK, BEGINEN_SICK } from "./prosperity";

/** Plain summer chance that a household has a sick member in a SICK_DAYS window. */
export const SICK_BASE = 0.06;
/** Extra chance at full winter (smooth season curve, same clock as the scene). */
export const SICK_WINTER = 0.03;
/** Herb hut (or orangery step 2+) and healer/infirmary, in absolute summer points. */
export const HERBS_SICK = 0.015, HEALER_SICK = 0.035;

/**
 * Binding sickness chance per household, shared by the live villagers (people.ts sickRate)
 * and the new daily resident tax (resident-tax.ts). Legacy tax before the cutover keeps
 * prosperity.ts sickTaxRate unchanged.
 *   risk = (SICK_BASE + SICK_WINTER·winter·(harvest step 3 ? ½ : 1)) · Π(1 − cutᵢ),  cutᵢ = boonᵢ / SICK_BASE
 * Each care factor removes the share of risk it removes from plain summer risk; factors multiply,
 * so every further investment still lowers sickness (no floor that swallows it). Wedding joy: 0.
 */
export function sickChance(s: Seed, at: number): number {
  if (festJoy(s, at)) return 0;
  const own = (i: string) => (s.bought ?? []).some((b) => b.item === i && b.at <= at);
  const st = (k: Parameters<typeof stepsPaid>[1]) => stepsPaid(s, k, at);
  const boons = [
    own("herbs") || st("orangery") >= 2 ? HERBS_SICK : 0,
    own("healer") || own("infirmary") ? HEALER_SICK : 0,
    s.charter?.path === "culture" && s.charter.at <= at ? CULTURE_SICK : 0,
    own("beginen") ? BEGINEN_SICK : 0,
    st("cathedral") >= 5 ? CATHEDRAL_SICK : 0,
    st("university") >= 3 ? UNIVERSITY_SICK : 0,
    st("orangery") >= 3 ? ORANGERY_SICK : 0,
  ];
  const risk = SICK_BASE + SICK_WINTER * seasonAt(at).winter * (st("harvest") >= 3 ? 0.5 : 1);
  return boons.reduce((r, b) => r * (1 - b / SICK_BASE), risk);
}
