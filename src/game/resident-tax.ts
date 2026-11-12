import { householdsOf, type Household } from "./households";
import { estateAt, estateOf, sharesAt, ESTATE_TAX, sickLoss, sickTaxRate, CULTURE_SICK, BEGINEN_SICK } from "./prosperity";
import { townRank, rankOf } from "./rank";
import { links } from "./world";
import type { Seed } from "./world";

/** Legacy assessment by plain wealth shares (kept for callers/tests that pass wealth only). */
export function assessHomes(homes: Household[], wealth: number) {
  return homes.reduce((total, h) => total + h.size * ESTATE_TAX[estateAt(wealth, ...h.home)], 0);
}
export type TaxShares = { skilled: number; wealthy: number };
/** Assessment with explicit shares; each home keeps its fixed tile roll (same hash as estateAt). */
export function assessHomesWith(homes: Household[], sh: TaxShares) {
  return homes.reduce((total, h) => total + h.size * ESTATE_TAX[estateOf(sh, ...h.home)], 0);
}
/** Gated shares valid at `at`: civic wealth, real rank, school bought by then, qualifying infrastructure. */
export function taxSharesAt(s: Seed, seeds: Seed[], at: number, knownRank?: number) {
  return sharesAt(s, at, knownRank ?? townRank(s, seeds, at));
}

/** Tax follows occupied families. Visitors and the mayor's separately spawned avatar are not taxpayers. */
export function residentTax(s: Seed, seeds: Seed[], at: number) {
  const homes = householdsOf(s, seeds, at);
  const population = homes.reduce((n, h) => n + h.size, 0);
  // same rank inputs as townRank (citizens, occupied dwellings, finished roads) from the roster already in hand
  const roads = links(seeds).filter((l) => (l.a.id === s.id || l.b.id === s.id) && at >= l.since).length;
  const rank = rankOf({ citizens: population, homes: homes.length, roads });
  const assessed = assessHomesWith(homes, taxSharesAt(s, seeds, at, rank).shares);
  const trade = s.charter?.path === "trade" && s.charter.at <= at ? Math.floor(0.15 * population) : 0;
  return { population, households: homes.length, assessed, income: assessed - sickLoss(assessed, Math.max(0.01, sickTaxRate(s, at) - (s.charter?.path === "culture" && s.charter.at <= at ? CULTURE_SICK : 0) - ((s.bought ?? []).some((b) => b.item === "beginen" && b.at <= at) ? BEGINEN_SICK : 0))) + trade };
}
