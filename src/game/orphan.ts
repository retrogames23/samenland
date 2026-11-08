import { ENCOUNTERS, type Decision } from "./encounters";

/**
 * The orphan boy from the barn stays visibly in the village for the effect duration of the chosen answer
 * (foster family: at a farmhouse; apprenticeship: at the smithy), then leaves with a chronicle note.
 * Pure from the decision row + clock — never stored, never counted as citizen or taxpayer.
 */
export type OrphanChoice = "adopt" | "apprentice";
export type OrphanStay = { at: number; until: number; choice: OrphanChoice };

export const orphanHours = (c: OrphanChoice) => ENCOUNTERS.orphan[c].fx.h;

/** Every orphan stay of a village, oldest first. */
export function orphanStays(decisions: readonly Decision[]): OrphanStay[] {
  return decisions
    .filter((d) => d.event === "orphan" && (d.choice === "adopt" || d.choice === "apprentice"))
    .map((d) => ({ at: d.at, until: d.at + orphanHours(d.choice as OrphanChoice) * 3.6e6, choice: d.choice as OrphanChoice }))
    .sort((a, b) => a.at - b.at);
}

/** The boy currently living in the village (at most one — the newest stay wins). */
export function orphanNow(decisions: readonly Decision[], now: number): OrphanStay | null {
  const s = orphanStays(decisions).filter((o) => o.at <= now && now < o.until);
  return s.length ? s[s.length - 1]! : null;
}
