import { householdsOf, type Household } from "./households";
import { estateAt, estateOf, sharesAt, ESTATE_TAX, sickLoss } from "./prosperity";
import type { Seed } from "./world";
import { sickChance } from "./sickness";

/** Legacy assessment by plain wealth shares (kept for callers/tests that pass wealth only). */
export function assessHomes(homes: Household[], wealth: number) {
  return homes.reduce((total, h) => total + h.size * ESTATE_TAX[estateAt(wealth, ...h.home)], 0);
}
export type TaxShares = { skilled: number; wealthy: number };
/** Assessment with explicit shares; each home keeps its fixed tile roll (same hash as estateAt). */
export function assessHomesWith(homes: Household[], sh: TaxShares) {
  return homes.reduce((total, h) => total + h.size * ESTATE_TAX[estateOf(sh, ...h.home)], 0);
}
/** Shares valid at `at` from Wohlstand (real citizens + civic works bought by then). */
export function taxSharesAt(s: Seed, seeds: Seed[], at: number, knownCitizens?: number) {
  return sharesAt(s, at, knownCitizens ?? householdsOf(s, seeds, at).reduce((n, h) => n + h.size, 0));
}

/** Tax follows occupied families. Visitors and the mayor's separately spawned avatar are not taxpayers. */
export function residentTax(s: Seed, seeds: Seed[], at: number) {
  const homes = householdsOf(s, seeds, at);
  const population = homes.reduce((n, h) => n + h.size, 0);
  const assessed = assessHomesWith(homes, taxSharesAt(s, seeds, at, population).shares);
  const trade = s.charter?.path === "trade" && s.charter.at <= at ? Math.floor(0.15 * population) : 0;
  return { population, households: homes.length, assessed, income: assessed - sickLoss(assessed, sickChance(s, at)) + trade };
}
