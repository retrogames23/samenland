import type { Seed, Kind } from "./world";

/** Civic prosperity is deliberately independent of population, stocks and world geometry.
 * The database mirrors this ledger, so a building never earns taxes before it was paid for.
 * Temporary food/store bonuses do not permanently promote households. */
export const CIVIC_BONUS: Record<string, number> = { school: 20, guildhall: 15, markethall: 15, library: 5, woodcamp: 5, guard: 5 };
export const PRESTIGE_BONUS: Record<string, number> = { belfry4: 15, theater3: 15, cathedral5: 20, university4: 10, exchange4: 20, opera4: 25 };
export const ESTATE_TAX = { ordinary: 1, skilled: 2, wealthy: 3 } as const;
export type Estate = keyof typeof ESTATE_TAX;
const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Sustainable civic wealth: historical purchases and charter; prestige matures over six hours.
 * No dependency on world.ts at runtime: structure generation may safely call this function. */
export function civicWealth(s: Seed, now: number): number {
  const h = Math.max(0, (now - Date.parse(s.created_at)) / 3.6e6);
  const stage = [24, 168, 2160, 4380, 8760].filter((a) => h >= a).length;
  const path = s.charter && s.charter.at <= now ? s.charter.path : undefined;
  const own = new Set((s.bought ?? []).filter((b) => b.at <= now).map((b) => b.item));
  let wealth = 25 + stage * 5 + (path === "craft" ? 10 : 0) + Math.min(30, (s.civicRoads ?? []).filter(r => r.at <= now).length * 10);
  for (const [item, bonus] of Object.entries(CIVIC_BONUS)) if (own.has(item)) wealth += bonus;
  for (const [item, bonus] of Object.entries(PRESTIGE_BONUS)) {
    if ((s.bought ?? []).some((b) => b.item === item && b.at + 6 * 3.6e6 <= now)) wealth += bonus;
  }
  if (own.has("rank2")) wealth += path === "trade" ? 10 : path === "craft" ? 5 : 0;
  if (own.has("rank3")) wealth += path === "trade" || path === "farm" ? 10 : path === "craft" ? 15 : 0;
  const titleBonuses: Record<string, number[]> = { trade: [5, 10, 10], craft: [5, 5, 15], culture: [0, 0, 5], farm: [0, 0, 5] };
  for (let i = 0; i < 3; i++) if (own.has(`title${i + 1}`)) wealth += path ? (titleBonuses[path]?.[i] ?? 0) : 0;
  return clamp(wealth);
}

/** At wealth 30: average 1.1; 55: 1.6; 80: 2.05. Even at 100, 15% stay ordinary.
 * Stable household rolls make promotion gradual and reversible, not an all-at-once switch. */
export function estateShares(wealth: number) {
  const w = clamp(wealth);
  const skilled = w <= 30 ? w / 300 : w <= 55 ? 0.1 + (w - 30) * 0.014 : w <= 80 ? 0.45 + (w - 55) * 0.004 : 0.55;
  const wealthy = w <= 30 ? 0 : w <= 55 ? (w - 30) * 0.003 : w <= 80 ? 0.075 + (w - 55) * 0.007 : 0.25 + (w - 80) * 0.0025;
  return { ordinary: 1 - skilled - wealthy, skilled, wealthy };
}
export function estateAt(wealth: number, x: number, y: number): Estate {
  // Own integer hash, mirrored by PostgreSQL if individual assessments are queried later.
  const roll = (((x * 7381 + y * 19391 + 7919) % 10000) + 10000) % 10000 / 10000;
  const sh = estateShares(wealth);
  return roll < sh.wealthy ? "wealthy" : roll < sh.wealthy + sh.skilled ? "skilled" : "ordinary";
}
/** Aggregate assessment retains the game's existing tax-population estimate. */
export function estateAssessment(pop: number, wealth: number) {
  const sh = estateShares(wealth);
  const wealthy = Math.floor(pop * sh.wealthy + 1e-9), skilled = Math.floor(pop * sh.skilled + 1e-9);
  return pop + skilled + 2 * wealthy;
}
export const RESIDENTIAL = new Set<Kind>(["hut", "farmhouse", "cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement", "suburb"]);
export function estateHouse(kind: Kind, estate: Estate): Kind {
  if (!RESIDENTIAL.has(kind)) return kind;
  if (estate === "wealthy") return kind === "villa" ? "villa" : "patrician";
  if (estate === "skilled") return kind === "hut" || kind === "farmhouse" || kind === "cottage" || kind === "handwerker" ? "handwerker" : "fachwerk";
  return kind === "hut" || kind === "farmhouse" ? kind : kind === "tenement" ? "tenement" : "cottage";
}
/** Sick villagers pay no tax that day (their carer still does). Tax view of sickRate (people.ts):
 * same base, herb hut and healer, but winter = Dec–Feb UTC month and no wedding-joy pause, mirrored by DB sick_tax_loss.
 * About one in SICK_SHARE residents of an afflicted household lies ill. */
export const SICK_SHARE = 0.4;
export function sickTaxRate(s: Seed, at: number): number {
  const own = (i: string) => (s.bought ?? []).some((b) => b.item === i && b.at <= at);
  const m = new Date(at).getUTCMonth(), winter = m === 11 || m < 2 ? 1 : 0;
  return Math.max(0.01, 0.06 + 0.03 * winter - (own("herbs") ? 0.015 : 0) - (own("healer") || own("infirmary") ? 0.035 : 0));
}
export const sickLoss = (assessed: number, rate: number) => Math.floor(assessed * rate * SICK_SHARE);
