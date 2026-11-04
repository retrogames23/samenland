import { householdsOf, type Household } from "./households";
import { civicWealth, estateAt, ESTATE_TAX, sickLoss, sickTaxRate, CULTURE_SICK, BEGINEN_SICK } from "./prosperity";
import type { Seed } from "./world";

export function assessHomes(homes: Household[], wealth: number) {
  return homes.reduce((total, h) => total + h.size * ESTATE_TAX[estateAt(wealth, ...h.home)], 0);
}

/** Tax follows occupied families. Visitors and the mayor's separately spawned avatar are not taxpayers. */
export function residentTax(s: Seed, seeds: Seed[], at: number) {
  const homes = householdsOf(s, seeds, at);
  const population = homes.reduce((n, h) => n + h.size, 0);
  const assessed = assessHomes(homes, civicWealth(s, at));
  const trade = s.charter?.path === "trade" && s.charter.at <= at ? Math.floor(0.15 * population) : 0;
  return { population, households: homes.length, assessed, income: assessed - sickLoss(assessed, Math.max(0.01, sickTaxRate(s, at) - (s.charter?.path === "culture" && s.charter.at <= at ? CULTURE_SICK : 0) - ((s.bought ?? []).some((b) => b.item === "beginen" && b.at <= at) ? BEGINEN_SICK : 0))) + trade };
}