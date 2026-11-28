/**
 * Gemeindebauten (Wirtschaftsumbau P2 + P3a): Spital 1–3 (Krankensaal, Kapelle, Wirtschaftshof) and Waage 1–2
 * (Waagehaus, Tretradkran). Stage 1 from Dorf, the later stages from Kleinstadt once the previous stage stands.
 * The database is the authority (migrations 0147/0155: civic_stage_defs, civic_stages, civic_quota, civic_open,
 * civic_day inside resource_refresh_at, purchase_guard patch); this module mirrors its rules for display and effects.
 *
 * A stage runs in three phases, one site per village at a time:
 *  1. Funding: the player opens the stage and confirms a Kontor budget — only a spending limit (the most Mark the
 *     material may cost at the Kontor), never paid or reserved in advance and never raised later. Then the player pays
 *     the building price alone in instalments of their choice (purchase rows `<stage>:r<n>`). Money paid in is final.
 *  2. Material: from the first UTC day start after full funding, each day takes wood/stone from the store above
 *     CIVIC_KEEP, then from the shared daily quota (4 wood + 3 stone a day, saved up to 30 days) at the Kontor price,
 *     each day's Kontor purchase its own chest row `<stage>:kYYYYMMDD`, only within the confirmed limit and the chest;
 *     budget 0 or an exhausted limit: no Kontor purchase, the pull waits for store material — never unasked money.
 *  3. Building: when all material is in, the stage builds CIVIC[stage].days days. Then the server books a marker
 *     purchase row `<stage>` (cost 0) dated at completion. Nothing was prepaid, so nothing is refunded.
 * Effects read only that marker (bought row with at <= now), so nothing acts before the stage really stands.
 */
import type { Seed } from "./world";
import { KONTOR_PRICE, SITE_KONTOR, WAAGE_DISCOUNT, isAnkauf, kontorFactor, type Stock } from "./resources";
import type { TownWay } from "./character";

/**
 * Every Gemeindebau stage in one place (P2 + P3a, migration 0155 civic_stage_defs mirrors it — change both): Mark price,
 * build days after the material is complete, certified settlement rank to open (2 = Dorf, 3 = Kleinstadt) and the stage
 * that must already stand. One site per village at a time, whatever the chain.
 */
export const CIVIC_STAGES = ["spital1", "spital2", "spital3", "waage1", "waage2"] as const;
export type CivicStage = (typeof CIVIC_STAGES)[number];
export const CIVIC: Record<
  CivicStage,
  { price: number; days: number; rank: number; after: CivicStage | null }
> = {
  spital1: { price: 10000, days: 21, rank: 2, after: null }, // Krankensaal: sickness ×0.85
  spital2: { price: 18000, days: 35, rank: 3, after: "spital1" }, // Kapelle: sickness ×0.90 on top (×0.765)
  spital3: { price: 22000, days: 42, rank: 3, after: "spital2" }, // Wirtschaftshof: +1 wood, +0.5 stone a day
  waage1: { price: 12000, days: 14, rank: 2, after: null }, // Waagehaus: Kontor ×0.85
  waage2: { price: 18000, days: 21, rank: 3, after: "waage1" }, // Tretradkran: storage +100 wood, +100 stone
};
/** Lowest rank at which any stage can be opened (the build card's own lock). */
export const CIVIC_MIN_RANK = Math.min(...CIVIC_STAGES.map((s) => CIVIC[s].rank));
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
/** Waage 1: every Kontor price ×0.85 (resources.ts WAAGE_DISCOUNT). Spital 1/2: sickness ×0.85 / ×0.90 (sickness.ts).
 *  Spital 3: +1 wood, +0.5 stone a day; Waage 2: storage +100 each (resources.ts resourceRates). */
export const WAAGE_KONTOR = WAAGE_DISCOUNT;

export const isCivicStage = (item: string): item is CivicStage =>
  (CIVIC_STAGES as readonly string[]).includes(item);
/**
 * Money rows of a stage (instalments, daily Kontor purchases) — no building, no civic work, never a chronicle entry.
 * Every stage of Spital and Waage (spital1, spital2, …, waage1, waage2, …), so later stages need no new rule.
 */
export const CIVIC_MONEY_RE = /^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$/;
export const isCivicMoney = (item: string) => CIVIC_MONEY_RE.test(item);
/**
 * P4 Stiftungen (stiftung.ts, migration 0165): every purchase row of a Stiftung — deposits `stift:<bau>:<n>:r<m>`,
 * the Kontor part of the close `stift:<bau>:<n>:k` and the completion marker `stift:<bau>:<n>` (0 Mark). None is a
 * building, a civic work or a chronicle entry. The prefix keeps them off the Gemeindebau pattern above.
 */
export const STIFT_ROW_RE = /^stift:(spital|waage):[1-9][0-9]*(:r[1-9][0-9]*|:k)?$/;
export const isStiftRow = (item: string) => STIFT_ROW_RE.test(item);
/**
 * F-P2-1: does a purchase row count as a bought building for quests and the decree "build"? Mirrors DB quest_guard
 * (np) and princely_task_met (migration 0153): ordinary purchases count, a stage counts once by its completion marker
 * (`spitalN`/`waageN`); its instalments and daily Kontor rows and every Ankauf credit (P1) do not.
 */
export const countsAsBuilding = (item: string) =>
  !isAnkauf(item) && !isCivicMoney(item) && !isStiftRow(item);
/** Instalment rows only (`<stage>:r<n>`) — they pay the building price, never the Kontor. */
export const isCivicInstalment = (stage: CivicStage, item: string) =>
  new RegExp(`^${stage}:r[1-9][0-9]*$`).test(item);
export const civicDeposit = (stage: CivicStage, n: number) => `${stage}:r${n}`;

/** A stage stands (marker row dated at completion) at `at`. */
export const civicDone = (s: Pick<Seed, "bought">, stage: CivicStage, at: number) =>
  (s.bought ?? []).some((b) => b.item === stage && b.at <= at);
/** Why a stage cannot be opened yet (DB civic_open: 'rank too low', 'previous stage open'); null = open to start. */
export function civicLock(s: Pick<Seed, "bought">, stage: CivicStage, rank: number, at: number) {
  const d = CIVIC[stage];
  if (d.after && !civicDone(s, d.after, at)) return { after: d.after } as const;
  if (rank < d.rank) return { rank: d.rank } as const;
  return null;
}

/** Kontor price of units as DB resource_kontor_at: site factor, Waage factor (resources.ts kontorFactor: true = Waage 1
 *  alone, a number = the whole factor incl. an endowed Waage, stiftung.ts waageFactor), round half up. */
export function kontorCost(units: Stock, site: TownWay | null, waage: boolean | number) {
  const raw = units.wood * KONTOR_PRICE.wood + units.stone * KONTOR_PRICE.stone;
  return Math.round(raw * (site ? SITE_KONTOR[site] : 1) * kontorFactor(waage) + 1e-9);
}
/** Largest sensible Kontor budget: the whole material of the stage bought at the Kontor (DB civic_open checks it). */
export const civicBudgetMax = (stage: CivicStage, site: TownWay | null, waage: boolean | number) =>
  kontorCost(civicNeed(stage), site, waage);

/** Range for raising the Kontor limit of an open stage later (DB civic_raise_budget): above the current limit, at most the
 *  whole material at today's Kontor price; null once the material is complete or the limit is already the full price.
 *  The new limit only acts from the next booked day on and is never paid in advance. */
export function civicRaiseRange(
  row: Pick<CivicRow, "budget" | "need_wood" | "need_stone" | "material_at">,
  site: TownWay | null,
  waage: boolean | number,
) {
  if (row.material_at) return null;
  const max = kontorCost({ wood: row.need_wood, stone: row.need_stone }, site, waage);
  return max > row.budget ? { min: row.budget + 1, max } : null;
}

/** One stage as the database reports it (table civic_stages). */
export type CivicRow = {
  item: CivicStage;
  price: number;
  budget: number;
  need_wood: number;
  need_stone: number;
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
