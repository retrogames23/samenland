/**
 * „2 aus 5“ (Wirtschaftsumbau, Entscheidungsvorlage Dorfphase): Badestube and Beginenhof count as Gemeinwesen next to
 * herb hut, healer and library — but they can only fill the count up to TWO_OF_FIVE_CAP. Any two of the five open the
 * same growth as herb hut + healer do today, so neither of those is mandatory any more, and a third or fourth
 * Gemeinwesen never adds capacity (no new must-buy).
 *
 * One rule for all three counting places: the care gate (world.ts careStage/careMissing, mirrored in weddings.ts),
 * the household capacity that carries the resident tax (households.ts) — the legacy tax before CAP_ALL_SINCE stays
 * frozen. The classic count is never lowered: a culture town with herb hut, healer and library keeps its three.
 *
 * Purchases are counted only from twoOfFiveSince(realm) on, never back in time, so no past population, receipt or
 * chronicle changes: the lab map from TWO_OF_FIVE_LAB_SINCE, every public map only from a later release.
 */
export const GEMEINWESEN_NEW = ["badestube", "beginen"] as const;
export const TWO_OF_FIVE_CAP = 2;
export const TWO_OF_FIVE_LAB_SINCE = Date.UTC(2026, 10, 25);
export const TWO_OF_FIVE_SINCE = Date.UTC(2100, 0, 4);
export const twoOfFiveSince = (realm: string | null | undefined) =>
  realm === "lab" ? TWO_OF_FIVE_LAB_SINCE : TWO_OF_FIVE_SINCE;
export const twoOfFiveActive = (realm: string | null | undefined, now: number) =>
  now >= twoOfFiveSince(realm);

/**
 * Gemeinwesen count at `now` for a counting place whose classic list is `classic`; `own` = items bought by `now`.
 * Before the cut-over exactly the classic count; afterwards Badestube/Beginenhof raise it, but never above
 * TWO_OF_FIVE_CAP, and never lower a classic count that is already higher.
 */
export function gemeinwesenCount(
  realm: string | null | undefined,
  own: ReadonlySet<string>,
  now: number,
  classic: readonly string[],
): number {
  const c = classic.filter((i) => own.has(i)).length;
  if (!twoOfFiveActive(realm, now)) return c;
  const extra = GEMEINWESEN_NEW.filter((i) => own.has(i)).length;
  return Math.max(c, Math.min(TWO_OF_FIVE_CAP, c + extra));
}
