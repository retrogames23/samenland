/**
 * Gemeinwesen (Wirtschaftsumbau): Kräuterhütte, Heiler, Bibliothek, Badestube and Beginenhof are the five Gemeinwesen.
 *
 * From the cut-over (gemeinwesenSince, checked against `now`, never against the purchase date):
 * - Care gate (world.ts careStage/careMissing): any of the five count, without a cap; Handelsstadt needs 1, Hansestadt 2
 *   (CARE_NEED, unchanged), plus careHealthExtra (Dom, Universität, Klostergarten) as before. Food is unchanged.
 * - Household capacity (households.ts, carries the resident tax): Kräuterhütte, Heiler, Badestube and Beginenhof form a
 *   series in any order — the first two count CAPACITY_SERIES 1 each, the third and fourth 0.25 each (× FEED_HEALTH_ITEM
 *   = 10/10/2.5/2.5 %); the library keeps its full unit outside the series (+10 %).
 * - Badestube halves the winter surcharge of sickness (sickness.ts), multiplicative with Erntedankhalle step 3.
 * Before the cut-over every count is exactly today's (Kräuterhütte, Heiler, Bibliothek). Buildings bought earlier count
 * from the cut-over on, so no past population, receipt or chronicle changes; the new rule never lowers a count.
 *
 * Deliberately NOT here: the wedding rhythm (weddings.ts wedStage) keeps its own count, because DB village_weddings
 * mirrors it exactly; it moves to gemeinwesenGate only in a separate package that changes TypeScript and SQL together
 * with a parity test.
 */
export const GEMEINWESEN = ["herbs", "healer", "library", "badestube", "beginen"] as const;
/** Today's Gemeinwesen (care gate and capacity before the cut-over). */
export const GEMEINWESEN_CLASSIC = ["herbs", "healer", "library"] as const;
/** The capacity series (any order) and its weights; the library stays outside with weight 1. */
export const CAPACITY_SERIES_ITEMS = ["herbs", "healer", "badestube", "beginen"] as const;
export const CAPACITY_SERIES = [1, 1, 0.25, 0.25] as const;
export const LIBRARY_WEIGHT = 1;
/** Lab map from 25.11.2026; public maps keep the safe placeholder until the real date is set (target 30.11. or 7.12.2026). */
export const GEMEINWESEN_LAB_SINCE = Date.UTC(2026, 10, 25);
export const GEMEINWESEN_SINCE = Date.UTC(2100, 0, 4);
export const gemeinwesenSince = (realm: string | null | undefined) =>
  realm === "lab" ? GEMEINWESEN_LAB_SINCE : GEMEINWESEN_SINCE;
export const gemeinwesenActive = (realm: string | null | undefined, now: number) =>
  now >= gemeinwesenSince(realm);

/** Gemeinwesen count of the care gate at `now` (without careHealthExtra); `own` = items bought by `now`. */
export function gemeinwesenGate(
  realm: string | null | undefined,
  own: ReadonlySet<string>,
  now: number,
): number {
  const list: readonly string[] = gemeinwesenActive(realm, now) ? GEMEINWESEN : GEMEINWESEN_CLASSIC;
  return list.filter((i) => own.has(i)).length;
}

/** Capacity units at `now` (each unit = FEED_HEALTH_ITEM of the land): series 1/1/0.25/0.25 plus the library. */
export function gemeinwesenCapacity(
  realm: string | null | undefined,
  own: ReadonlySet<string>,
  now: number,
): number {
  if (!gemeinwesenActive(realm, now)) return GEMEINWESEN_CLASSIC.filter((i) => own.has(i)).length;
  const n = CAPACITY_SERIES_ITEMS.filter((i) => own.has(i)).length;
  let units = own.has("library") ? LIBRARY_WEIGHT : 0;
  for (let k = 0; k < n; k++) units += CAPACITY_SERIES[k]!;
  return units;
}

/** Badestube factor on the winter surcharge of sickness (multiplies with Erntedankhalle step 3). */
export const BADESTUBE_WINTER = 0.5;
export const badestubeWinter = (
  realm: string | null | undefined,
  own: (i: string) => boolean,
  now: number,
) => (gemeinwesenActive(realm, now) && own("badestube") ? BADESTUBE_WINTER : 1);
