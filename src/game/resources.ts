/**
 * Wirtschaft Paket 1 + 2: persistent wood and stone (Variante D with the Phase 1.3 corrections V1 and V7).
 * The database is the authority (migrations 0142/0143: resource_ledger, resource_refresh, purchase_material,
 * village_sites); this module only mirrors its rules so the client can show material needs, production and the Kontor
 * price before the player accepts. Change both sides together — resources.test.ts compares them.
 */
import { ITEMS, MONUMENT_PRICE, RANK_PRICE, TITLE_PRICE } from "./economy";
import { AUSBAU_PRICE } from "./ausbau";
import { FOUNTAIN_PRICE, isFountain } from "./civic-fountain";
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

/** Bought buildings and upgrades that use material at the full rate (price/20, price/30); chests, services and markets do not. */
export const MATERIAL_ITEMS: readonly string[] = [
  ...Object.keys(ITEMS),
  ...Object.keys(AUSBAU_PRICE),
  STEINGRUBE,
];
/**
 * A1 (migration 0145): monument steps, guild ranks and titles use material at the half rate — wood price/40, stone
 * price/60 from 500 Mark (DB purchase_material: round half up). Chests stay material-free on purpose.
 */
export const INVESTMENT_PRICE: Readonly<Record<string, number>> = {
  ...MONUMENT_PRICE,
  ...RANK_PRICE,
  ...TITLE_PRICE,
};
export const INVESTMENT_ITEMS: readonly string[] = Object.keys(INVESTMENT_PRICE);
export const isInvestment = (item: string) =>
  Object.prototype.hasOwnProperty.call(INVESTMENT_PRICE, item);
export const materialPrice = (item: string): number | null =>
  item === STEINGRUBE
    ? STEINGRUBE_PRICE
    : ((ITEMS as Record<string, number>)[item] ??
      AUSBAU_PRICE[item] ??
      INVESTMENT_PRICE[item] ??
      null);

/** Wood price/20, stone price/30 from 500 Mark (DB purchase_material: round half up). */
export function materialNeed(price: number): Record<Resource, number> {
  return {
    wood: Math.round(price / 20),
    stone: price >= STONE_FROM_PRICE ? Math.round(price / 30) : 0,
  };
}
/** A1 half rate: wood price/40, stone price/60 only from 500 Mark (DB purchase_material 0145: round half up). */
export function investmentNeed(price: number): Record<Resource, number> {
  return {
    wood: Math.round(price / 40),
    stone: price >= STONE_FROM_PRICE ? Math.round(price / 60) : 0,
  };
}
/**
 * P3b (migration 0157, Masterplan v6.1 Variante A): the Marktbrunnen steps at the Gemeindebau rate — wood price/200,
 * stone price/300 (DB purchase_material: round half up): 4.000 → 20/13, 8.000 → 40/27, 12.000 → 60/40. A normal
 * purchase with the usual store, Kontor and kontor_max — no instalments, no site. Not in MATERIAL_ITEMS (full rate).
 */
export function fountainNeed(price: number): Record<Resource, number> {
  return { wood: Math.round(price / 200), stone: Math.round(price / 300) };
}
/** Material of one purchase (DB purchase_material): the Steingrube a fixed 20 wood, A1 investments at the half rate,
 *  Marktbrunnen steps at the Gemeindebau rate, everything else by price. */
export function materialOf(item: string): Record<Resource, number> | null {
  if (item === STEINGRUBE) return { wood: STEINGRUBE_WOOD, stone: 0 };
  if (isFountain(item)) return fountainNeed(FOUNTAIN_PRICE[item]);
  if (isInvestment(item)) return investmentNeed(INVESTMENT_PRICE[item]!);
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
/** Waage 1 (Gemeindebau, civic.ts) makes every Kontor price 15 % cheaper (DB resource_kontor_at). */
export const WAAGE_DISCOUNT = 0.85;
/** The Waage factor on a Kontor price: false = none, true = Waage 1 alone (×0.85), a number = the whole factor as
 *  stiftung.ts waageFactor gives it (Waage 1 and, while the Waage is endowed, P4, another ×0.85). */
export const kontorFactor = (waage: boolean | number) =>
  typeof waage === "number" ? waage : waage ? WAAGE_DISCOUNT : 1;
export function kontorQuote(
  need: Stock,
  stock: Stock,
  site: TownWay | null = null,
  waage: boolean | number = false,
): KontorQuote {
  const missing = {
    wood: Math.max(0, need.wood - stock.wood),
    stone: Math.max(0, need.stone - stock.stone),
  };
  const raw = missing.wood * KONTOR_PRICE.wood + missing.stone * KONTOR_PRICE.stone;
  return {
    need,
    missing,
    cost: Math.round(raw * (site ? SITE_KONTOR[site] : 1) * kontorFactor(waage) + 1e-9),
  };
}

/** Gemeindebauten P3a (migration 0155, DB resource_rate/resource_cap): Spital 3 (Wirtschaftshof) adds 1 wood and
 *  0.5 stone a day, Waage 2 (Tretradkran) 100 storage for each — both from their completion marker on. */
export const SPITAL3_RATE: Stock = { wood: 1, stone: 0.5 };
export const WAAGE2_STORE = 100;
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
    farm = owned.has("spital3"),
    store =
      (owned.has("granary") ? 150 : 0) +
      (owned.has("granary2") ? 150 : 0) +
      (owned.has("waage2") ? WAAGE2_STORE : 0);
  return {
    wood: {
      rate: 1 + (camp ? SITE_WOOD[w] : 0) + (farm ? SPITAL3_RATE.wood : 0),
      cap: 100 + (camp ? 200 : 0) + store,
    },
    stone: {
      rate: 0.5 + (owned.has(STEINGRUBE) ? SITE_STONE[w] : 0) + (farm ? SPITAL3_RATE.stone : 0),
      cap: 100 + store,
    },
  };
}
/** Whole units on UTC day `day` (days since 2000-01-01) from a fractional rate (DB resource_daily). */
export const resourceDaily = (rate: number, day: number) =>
  Math.floor(rate * day) - Math.floor(rate * (day - 1));

/**
 * Ankauf (P1, migration 0151): what a day's production would add above the storage cap is bought by the Kontor at half
 * its base price — wood 2, stone 3 Mark (DB ankauf_price; no location factor, no Waage discount). One server-booked
 * purchase row `ankauf:YYYYMMDD` per village and UTC day with negative cost, dated at that day start; the chest walk
 * (treasury/walkChest, DB village_balance_walk) books it as income below the chest cap, the rest is lost like surplus
 * tax. From ankauf_since(realm) on (lab: the next UTC day start after the migration ran; public maps 2100-01-04),
 * never for earlier days. The client never inserts these rows; it only shows them.
 */
export const ANKAUF_SHARE = 0.5;
export const ANKAUF_PRICE: Record<Resource, number> = {
  wood: KONTOR_PRICE.wood * ANKAUF_SHARE,
  stone: KONTOR_PRICE.stone * ANKAUF_SHARE,
};
const ANKAUF_RE = /^ankauf:[0-9]{8}$/;
/** Server-booked overflow credit (no building, no civic work, never a chronicle entry). */
export const isAnkauf = (item: string) => ANKAUF_RE.test(item);
/** Item of the credit for the UTC day that starts at `dayStart` (ms). */
export const ankaufItem = (dayStart: number) =>
  `ankauf:${new Date(dayStart).toISOString().slice(0, 10).replace(/-/g, "")}`;
/** Mark for one day's overflow (DB ankauf_book: wood·2 + stone·3). */
export const ankaufMark = (over: Stock) =>
  over.wood * ANKAUF_PRICE.wood + over.stone * ANKAUF_PRICE.stone;
/**
 * One production day of one resource as DB resource_refresh_at books it: the day's whole units (resourceDaily) fill
 * the room below the cap left by the stock before the day start; the rest is the overflow the Kontor buys.
 */
export function resourceDay(rate: number, cap: number, stockBefore: number, day: number) {
  const units = resourceDaily(rate, day),
    prod = Math.min(units, Math.max(cap - stockBefore, 0));
  return { prod, over: units - prod };
}

/** What the server reports for the own village (DB resource_overview). */
export type ResourceOverview =
  | { active: false; from: string }
  | ({
      active: true;
      from: string;
      next: string;
      site?: TownWay | null;
      /** Paket B (0162): the daily booking waits for the wedding settlement (an open Gemeindebau reads the chest) — the
       *  stocks shown are the last booked ones */
      pending?: boolean;
      /** P1 (0151): start of the Ankauf on this map, price per unit and the newest credit */
      ankauf?: {
        since: string;
        wood: number;
        stone: number;
        last: { at: string; mark: number } | null;
      };
    } & Record<Resource, { stock: number; rate: number; cap: number }>);
