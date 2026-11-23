/**
 * Wirtschaft Paket 1: persistent wood and stone (Variante D with the Phase 1.3 corrections V1 and V7).
 * The database is the authority (migration 0142: resource_ledger, resource_refresh, purchase_material); this module
 * only mirrors its rules so the client can show material needs and the Kontor price before the player accepts.
 * Change both sides together — resources.test.ts compares them.
 */
import { ITEMS } from "./economy";
import { AUSBAU_PRICE } from "./ausbau";

export const RESOURCES = ["wood", "stone"] as const;
export type Resource = (typeof RESOURCES)[number];

/** DB resources_since(realm): the admin test map "lab" from 2026-11-23, every public map from the far future. */
export const RESOURCES_LAB_SINCE = Date.UTC(2026, 10, 23);
export const RESOURCES_SINCE = Date.UTC(2100, 0, 4);
export const resourcesSince = (realm: string) =>
  realm === "lab" ? RESOURCES_LAB_SINCE : RESOURCES_SINCE;

/** Start stock booked once when a village's resources begin (Variante D). */
export const RESOURCE_START: Record<Resource, number> = { wood: 60, stone: 30 };
/** Kontor price per unit, without location factor (Variante D; location markups are still open). */
export const KONTOR_PRICE: Record<Resource, number> = { wood: 4, stone: 6 };
/** Stone is needed only from this building price on (Phase 1.3, V1). */
export const STONE_FROM_PRICE = 500;

/** Bought buildings and upgrades that use material; chests, monuments, services and markets do not (yet). */
export const MATERIAL_ITEMS: readonly string[] = [
  ...Object.keys(ITEMS),
  ...Object.keys(AUSBAU_PRICE),
];
export const materialPrice = (item: string): number | null =>
  (ITEMS as Record<string, number>)[item] ?? AUSBAU_PRICE[item] ?? null;

/** Wood price/20, stone price/30 from 500 Mark (DB purchase_material: round half up). */
export function materialNeed(price: number): Record<Resource, number> {
  return {
    wood: Math.round(price / 20),
    stone: price >= STONE_FROM_PRICE ? Math.round(price / 30) : 0,
  };
}

export type Stock = Record<Resource, number>;
export type KontorQuote = { need: Stock; missing: Stock; cost: number };
/** What the Kontor would add for a need at the given stock: only the missing units, at KONTOR_PRICE. */
export function kontorQuote(need: Stock, stock: Stock): KontorQuote {
  const missing = {
    wood: Math.max(0, need.wood - stock.wood),
    stone: Math.max(0, need.stone - stock.stone),
  };
  return {
    need,
    missing,
    cost: missing.wood * KONTOR_PRICE.wood + missing.stone * KONTOR_PRICE.stone,
  };
}

/** Daily production and storage (DB resource_rate / resource_cap); `owned` = items bought before the day start. */
export function resourceRates(
  owned: ReadonlySet<string>,
): Record<Resource, { rate: number; cap: number }> {
  const camp = owned.has("woodcamp"),
    store = (owned.has("granary") ? 150 : 0) + (owned.has("granary2") ? 150 : 0);
  return {
    wood: { rate: 1 + (camp ? 4 : 0), cap: 100 + (camp ? 200 : 0) + store },
    stone: { rate: 0.5, cap: 100 + store },
  };
}
/** Whole units on UTC day `day` (days since 2000-01-01) from a fractional rate (DB resource_daily). */
export const resourceDaily = (rate: number, day: number) =>
  Math.floor(rate * day) - Math.floor(rate * (day - 1));

/** What the server reports for the own village (DB resource_overview). */
export type ResourceOverview =
  | { active: false; from: string }
  | ({ active: true; from: string; next: string } & Record<
      Resource,
      { stock: number; rate: number; cap: number }
    >);
