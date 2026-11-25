/**
 * Gemeindebauten Stufe 1 (Wirtschaftsumbau P2): Spital 1 (Krankensaal) and Waage 1 (Waagehaus), from Dorf.
 * The database is the authority (migration 0147: civic_stages, civic_quota, civic_open, civic_day inside
 * resource_refresh_at, purchase_guard patch); this module mirrors its rules for display and for the game effects.
 *
 * A stage runs in three phases, one site per village at a time:
 *  1. Funding: the player opens the stage and names a Kontor budget (the most Mark the material may cost at the Kontor),
 *     then pays price + budget in instalments (purchase rows `<stage>:r<n>`). Money paid in is final.
 *  2. Material: from the first UTC day start after full funding, each day takes wood/stone from the store above
 *     CIVIC_KEEP, then from the shared daily quota (4 wood + 3 stone a day, saved up to 30 days) at the Kontor price,
 *     paid from the prepaid budget only — never from the chest without the player's prior consent.
 *  3. Building: when all material is in, the stage builds CIVIC[stage].days days. Then the server books a marker
 *     purchase row `<stage>` (cost 0) dated at completion and refunds the unused budget (`<stage>:refund`, negative cost).
 * Effects read only that marker (bought row with at <= now), so nothing acts before the stage really stands.
 */
import type { Seed } from "./world";
import { KONTOR_PRICE, SITE_KONTOR, WAAGE_DISCOUNT, type Stock } from "./resources";
import type { TownWay } from "./character";

export const CIVIC_STAGES = ["spital1", "waage1"] as const;
export type CivicStage = (typeof CIVIC_STAGES)[number];
/** Mark price, build days after the material is complete, certified settlement rank to open (2 = Dorf). */
export const CIVIC: Record<CivicStage, { price: number; days: number; rank: number }> = {
  spital1: { price: 10000, days: 21, rank: 2 },
  waage1: { price: 12000, days: 14, rank: 2 },
};
/** Material of a Gemeindebau stage: wood price/200, stone price/300 (round half up, as DB round()). */
export const CIVIC_WOOD_PER = 200,
  CIVIC_STONE_PER = 300;
export const civicNeed = (stage: CivicStage): Stock => ({
  wood: Math.round(CIVIC[stage].price / CIVIC_WOOD_PER),
  stone: Math.round(CIVIC[stage].price / CIVIC_STONE_PER),
});
/** Shared daily Kontor quota for Gemeindebauten (and later Stiftungen): per day, saved up to CIVIC_QUOTA_DAYS days. */
export const CIVIC_QUOTA: Stock = { wood: 4, stone: 3 };
export const CIVIC_QUOTA_DAYS = 30;
export const CIVIC_QUOTA_MAX: Stock = {
  wood: CIVIC_QUOTA.wood * CIVIC_QUOTA_DAYS,
  stone: CIVIC_QUOTA.stone * CIVIC_QUOTA_DAYS,
};
/** Store kept back for ordinary buildings; a stage only takes what lies above it. */
export const CIVIC_KEEP: Stock = { wood: 40, stone: 30 };
/** Waage 1: every Kontor price ×0.85 (resources.ts WAAGE_DISCOUNT). Spital 1: sickness ×0.85 (sickness.ts SPITAL_SICK). */
export const WAAGE_KONTOR = WAAGE_DISCOUNT;

export const isCivicStage = (item: string): item is CivicStage =>
  (CIVIC_STAGES as readonly string[]).includes(item);
/** Money rows of a stage (instalments and the refund) — no building, no civic work, never a chronicle entry. */
export const isCivicMoney = (item: string) => /^(spital1|waage1):(r[1-9][0-9]*|refund)$/.test(item);
export const civicDeposit = (stage: CivicStage, n: number) => `${stage}:r${n}`;

/** A stage stands (marker row dated at completion) at `at`. */
export const civicDone = (s: Pick<Seed, "bought">, stage: CivicStage, at: number) =>
  (s.bought ?? []).some((b) => b.item === stage && b.at <= at);

/** Kontor price of units as DB resource_kontor_at: site factor, Waage discount, round half up. */
export function kontorCost(units: Stock, site: TownWay | null, waage: boolean) {
  const raw = units.wood * KONTOR_PRICE.wood + units.stone * KONTOR_PRICE.stone;
  return Math.round(raw * (site ? SITE_KONTOR[site] : 1) * (waage ? WAAGE_KONTOR : 1) + 1e-9);
}
/** Largest sensible Kontor budget: the whole material of the stage bought at the Kontor (DB civic_open checks it). */
export const civicBudgetMax = (stage: CivicStage, site: TownWay | null, waage: boolean) =>
  kontorCost(civicNeed(stage), site, waage);

/** One stage as the database reports it (table civic_stages). */
export type CivicRow = {
  item: CivicStage;
  price: number;
  budget: number;
  need_wood: number;
  need_stone: number;
  paid: number;
  wood_got: number;
  stone_got: number;
  kontor_spent: number;
  opened_at: string;
  funded_at: string | null;
  material_at: string | null;
  done_at: string | null;
};
export type CivicPhase = "funding" | "material" | "building" | "done";
export function civicPhase(r: CivicRow, now: number): CivicPhase {
  if (!r.funded_at) return "funding";
  if (!r.material_at || !r.done_at) return "material";
  return Date.parse(r.done_at) > now ? "building" : "done";
}
