import type { Seed, Kind } from "./world";

/** Civic prosperity is deliberately independent of population, stocks and world geometry.
 * The database mirrors this ledger, so a building never earns taxes before it was paid for.
 * Temporary food/store bonuses do not permanently promote households. */
export const CIVIC_BONUS: Record<string, number> = { school: 20, guildhall: 15, markethall: 15, library: 10, dairy: 5, woodcamp: 5, guard: 5 };
export const PRESTIGE_BONUS: Record<string, number> = { belfry4: 15, theater3: 15, cathedral5: 20, university4: 15, exchange4: 20, orangery3: 10, opera4: 25 };
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
/** Wohlstand — the single prosperity value for HUD, villagers, house paint and new resident tax.
 * Continuous: grows with real citizens (never saturates, keeps maturing past Hansestadt) and with
 * civic works bought by then. The school helps like any work (weighted), it is never a switch. */
export const PROSPER_WORKS: Record<string, number> = {
  herbs: 1, hunter: 1, fisher: 1, dairy: 1, backhaus: 1, herberge: 1, woodcamp: 1, granary: 1, healer: 1, bigstore: 1,
  stonemason: 1, smokehouse: 1, beginen: 1, badestube: 1, school: 3, guildhall: 2, markethall: 2, library: 2, infirmary: 1, guard: 1, firehouse: 1,
};
let monumentStands: ((s: Seed, at: number, key: string) => boolean) | null = null;
export const setMonumentHook = (f: typeof monumentStands) => { monumentStands = f; };
const WORKS_FULL = 20, CIT_HALF = 1500;
export function prosperityAt(s: Seed, at: number, citizens: number): number {
  const own = new Set((s.bought ?? []).filter((b) => b.at <= at).map((b) => b.item));
  let w = 0; for (const [item, n] of Object.entries(PROSPER_WORKS)) if (own.has(item)) w += n;
  // monuments count as two works each once they physically stand (registered by world.ts)
  for (const item of Object.keys(PRESTIGE_BONUS)) if (own.has(item) && monumentStands?.(s, at, item.replace(/\d+$/, ""))) w += 2;
  const dev = citizens / (citizens + CIT_HALF), civ = Math.min(1, w / WORKS_FULL);
  return 100 * (0.7 * dev + 0.3 * civ);
}
/** Estate shares from Wohlstand: skilled linear, wealthy quadratic, so the well-to-do settle late and gradually. */
export function sharesFromProsperity(p: number) {
  const x = Math.max(0, Math.min(100, p)) / 100;
  const skilled = 0.55 * x, wealthy = 0.25 * x * x;
  return { ordinary: 1 - skilled - wealthy, skilled, wealthy };
}
/** One source for shares at `at`: used by resident tax, villagers (people.ts), house paint (world.ts) and the HUD. */
export function sharesAt(s: Seed, at: number, citizens: number) {
  const wealth = prosperityAt(s, at, citizens);
  return { wealth, citizens, shares: sharesFromProsperity(wealth) };
}
/** Fixed household roll by home tile. Own integer hash, mirrored by PostgreSQL if individual assessments are queried later. */
export const estateRoll = (x: number, y: number) => (((x * 7381 + y * 19391 + 7919) % 10000) + 10000) % 10000 / 10000;
/** Places a home tile into given shares using the fixed roll (shared by estateAt and gated tax). */
export function estateOf(sh: { skilled: number; wealthy: number }, x: number, y: number): Estate {
  const roll = estateRoll(x, y);
  return roll < sh.wealthy ? "wealthy" : roll < sh.wealthy + sh.skilled ? "skilled" : "ordinary";
}
export function estateAt(wealth: number, x: number, y: number): Estate {
  return estateOf(estateShares(wealth), x, y);
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
/** Culture charter: learned healers and clean scriptoria cut the daily sickness chance (live villagers and new tax receipts only). */
export const CULTURE_SICK = 0.02;
/** Beguines nurse the sick: fewer households fall ill (live villagers and new resident-tax receipts only, never legacy tax). */
export const BEGINEN_SICK = 0.015;
export const sickLoss = (assessed: number, rate: number) => Math.floor(assessed * rate * SICK_SHARE);

/** Village-phase tax gating (Option A): the 13 purchasable works that let skilled trades settle.
 * Representative halls, small-town buildings (bathhouse, school, firehouse …) and monuments never count. */
export const INFRA_ITEMS = ["herbs", "hunter", "fisher", "dairy", "backhaus", "herberge", "woodcamp", "granary", "healer", "bigstore", "stonemason", "smokehouse", "beginen"] as const;
const INFRA_SET = new Set<string>(INFRA_ITEMS);
export const INFRA_ROAD_CAP = 3;
/** Qualifying purchases (from purchase time, each once) plus finished roads (r.at <= now, at most three). */
export function infraCount(s: Seed, now: number): number {
  const own = new Set((s.bought ?? []).filter((b) => b.at <= now && INFRA_SET.has(b.item)).map((b) => b.item));
  const roads = Math.min(INFRA_ROAD_CAP, (s.civicRoads ?? []).filter((r) => r.at <= now).length);
  return own.size + roads;
}
/** Gated estate shares; L = estateShares(wealth) is the ceiling for every share. Pure: rank comes in as a number. */
export function gatedEstateShares(wealth: number, rank: number, hasSchool: boolean, infra: number) {
  const L = estateShares(wealth);
  let skilled: number, wealthy: number;
  if (!hasSchool || rank <= 2) { skilled = Math.min(L.skilled, 0.04 + 0.025 * Math.max(0, infra), 0.2); wealthy = 0; }
  else if (rank === 3) { skilled = Math.min(L.skilled, 0.35); wealthy = Math.min(L.wealthy, 0.05); }
  else if (rank === 4) { skilled = Math.min(L.skilled, 0.45); wealthy = Math.min(L.wealthy, 0.15); }
  else { skilled = L.skilled; wealthy = L.wealthy; }
  return { ordinary: 1 - skilled - wealthy, skilled, wealthy };
}
