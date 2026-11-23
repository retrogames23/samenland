/**
 * Wirtschaft Paket 1 + 2: persistent wood and stone (Variante D with the Phase 1.3 corrections V1 and V7).
 * The database is the authority (migrations 0142/0143: resource_ledger, resource_refresh, purchase_material,
 * village_sites); this module only mirrors its rules so the client can show material needs, production and the Kontor
 * price before the player accepts. Change both sides together — resources.test.ts compares them.
 */
import { ITEMS } from "./economy";
import { AUSBAU_PRICE } from "./ausbau";
import type { TownWay } from "./character";

export const RESOURCES = ["wood", "stone"] as const;
export type Resource = (typeof RESOURCES)[number];

/** DB resources_since(realm): the admin test map "lab" from 2026-11-23, every public map from the far future. */
export const RESOURCES_LAB_SINCE = Date.UTC(2026, 10, 23);
export const RESOURCES_SINCE = Date.UTC(2100, 0, 4);
export const resourcesSince = (realm: string) =>
  realm === "lab" ? RESOURCES_LAB_SINCE : RESOURCES_SINCE;

/** Start stock booked once when a village's resources begin (Variante D). */
export const RESOURCE_START: Record<Resource, number> = { wood: 60, stone: 30 };
/** Kontor price per unit before the location factor SITE_KONTOR (Variante D). */
export const KONTOR_PRICE: Record<Resource, number> = { wood: 4, stone: 6 };
/** Stone is needed only from this building price on (Phase 1.3, V1). */
export const STONE_FROM_PRICE = 500;

/**
 * Steingrube (Paket 2): 150 Mark and 20 wood, no stone; at most one per village. Not in ITEMS: it is no civic work and
 * never touches prosperity, tax or dowries. Unplaced; sold only where the village's resources run (DB purchase_guard,
 * migration 0143 — its price expression `300 - 150` evaluates to exactly this price; no credit is ever booked).
 */
export const STEINGRUBE = "steingrube";
export const STEINGRUBE_PRICE = 150;
export const STEINGRUBE_WOOD = 20;

/** Bought buildings and upgrades that use material; chests, monuments, services and markets do not (yet). */
export const MATERIAL_ITEMS: readonly string[] = [
  ...Object.keys(ITEMS),
  ...Object.keys(AUSBAU_PRICE),
  STEINGRUBE,
];
export const materialPrice = (item: string): number | null =>
  item === STEINGRUBE
    ? STEINGRUBE_PRICE
    : ((ITEMS as Record<string, number>)[item] ?? AUSBAU_PRICE[item] ?? null);

/** Wood price/20, stone price/30 from 500 Mark (DB purchase_material: round half up). */
export function materialNeed(price: number): Record<Resource, number> {
  return {
    wood: Math.round(price / 20),
    stone: price >= STONE_FROM_PRICE ? Math.round(price / 30) : 0,
  };
}
/** Material of one purchase (DB purchase_material): the Steingrube a fixed 20 wood, everything else by price. */
export function materialOf(item: string): Record<Resource, number> | null {
  if (item === STEINGRUBE) return { wood: STEINGRUBE_WOOD, stone: 0 };
  const p = materialPrice(item);
  return p == null ? null : materialNeed(p);
}

/**
 * Location (Phase 1.2 table, Variante D original), certified once by the trusted server from townCharacter:
 * grain = Binnenland, workshop = Wald/Hügel, gateway = Küste. Bonus of a woodcamp / Steingrube on top of the base
 * production (1 wood, 0.5 stone); the coast pays 90 % at the Kontor. No surcharges anywhere (Phase 1.3).
 */
export const SITE_WOOD: Record<TownWay, number> = { grain: 4, workshop: 6, gateway: 3 };
export const SITE_STONE: Record<TownWay, number> = { grain: 3, workshop: 4, gateway: 1 };
export const SITE_KONTOR: Record<TownWay, number> = { grain: 1, workshop: 1, gateway: 0.9 };

export type Stock = Record<Resource, number>;
export type KontorQuote = { need: Stock; missing: Stock; cost: number };
/** What the Kontor would add for a need at the given stock: only the missing units (DB resource_kontor, half up). */
export function kontorQuote(need: Stock, stock: Stock, site: TownWay | null = null): KontorQuote {
  const missing = {
    wood: Math.max(0, need.wood - stock.wood),
    stone: Math.max(0, need.stone - stock.stone),
  };
  const raw = missing.wood * KONTOR_PRICE.wood + missing.stone * KONTOR_PRICE.stone;
  return { need, missing, cost: Math.round(raw * (site ? SITE_KONTOR[site] : 1) + 1e-9) };
}

/**
 * Daily production and storage (DB resource_rate / resource_cap); `owned` = items bought before the day start,
 * `site` = certified location (null counts as Binnenland, as the DB does for display before certification).
 */
export function resourceRates(
  owned: ReadonlySet<string>,
  site: TownWay | null = null,
): Record<Resource, { rate: number; cap: number }> {
  const w = site ?? "grain",
    camp = owned.has("woodcamp"),
    store = (owned.has("granary") ? 150 : 0) + (owned.has("granary2") ? 150 : 0);
  return {
    wood: { rate: 1 + (camp ? SITE_WOOD[w] : 0), cap: 100 + (camp ? 200 : 0) + store },
    stone: { rate: 0.5 + (owned.has(STEINGRUBE) ? SITE_STONE[w] : 0), cap: 100 + store },
  };
}
/** Whole units on UTC day `day` (days since 2000-01-01) from a fractional rate (DB resource_daily). */
export const resourceDaily = (rate: number, day: number) =>
  Math.floor(rate * day) - Math.floor(rate * (day - 1));

/** What the server reports for the own village (DB resource_overview). */
export type ResourceOverview =
  | { active: false; from: string }
  | ({ active: true; from: string; next: string; site?: TownWay | null } & Record<
      Resource,
      { stock: number; rate: number; cap: number }
    >);
