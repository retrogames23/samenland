import { stepsPaid, stepsDone, cathedralDone, CATHEDRAL_WINTER, ORANGERY_SICK, type Seed } from "./world";
import { seasonAt } from "./season";
import { festJoy } from "./weddings";
import { CULTURE_SICK, BEGINEN_SICK } from "./prosperity";
import { badestubeWinter } from "./gemeinwesen";

/** Plain summer chance that a household has a sick member in a SICK_DAYS window. */
export const SICK_BASE = 0.06;
/** Extra chance at full winter (smooth season curve, same clock as the scene). */
export const SICK_WINTER = 0.03;
/** Herb hut (or orangery step 2+) and healer/infirmary, in absolute summer points. */
export const HERBS_SICK = 0.015, HEALER_SICK = 0.035;
/** Spital 1 (Gemeindebau, civic.ts): the whole risk ×0.85 from the completion marker row `spital1` on. */
export const SPITAL_SICK = 0.85;
/** Spital 2 (Kapelle, P3a): the whole risk ×0.90 on top, from its marker `spital2` on — with Spital 1 ×0.765. */
export const SPITAL2_SICK = 0.9;

/**
 * Binding sickness chance per household, shared by the live villagers (people.ts sickRate)
 * and the new daily resident tax (resident-tax.ts). Legacy tax before the cutover keeps
 * prosperity.ts sickTaxRate unchanged.
 *   risk = (SICK_BASE + SICK_WINTER·winter·(harvest step 3 ? ½ : 1)·(Badestube from gemeinwesenSince ? ½ : 1)·(Dom step 5 ? ⅔ : 1)) · Π(1 − cutᵢ),  cutᵢ = boonᵢ / SICK_BASE
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
    st("orangery") >= 3 ? ORANGERY_SICK : 0,
  ];
  const risk = SICK_BASE + SICK_WINTER * seasonAt(at).winter * (stepsDone(s, "harvest", at) >= 3 ? 0.5 : 1) * badestubeWinter(s.realm, own, at)
    * (cathedralDone(s, at) >= 5 ? CATHEDRAL_WINTER : 1);
  // Gemeindebauten (civic.ts), each from its completion marker on, multiplied: Spital 1 ×0.85, Spital 2 ×0.90
  return (
    boons.reduce((r, b) => r * (1 - b / SICK_BASE), risk) *
    (own("spital1") ? SPITAL_SICK : 1) *
    (own("spital2") ? SPITAL2_SICK : 1)
  );
}
