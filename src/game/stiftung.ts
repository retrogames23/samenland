/**
 * P4 Stiftungen (Wirtschaftsumbau, Masterplan v6.7 Abschnitt 4.1, Entscheidungen D2/D6/D10a/D11 vom 27.11.2026).
 * The database is the authority (migration 0165: stift_stages, stift_open, stift_deposit, stift_close, purchase_guard
 * patch, resource_kontor_at); this module mirrors its rules for display and for the two effects.
 *
 * A Stiftung belongs to a Bau — the Spital or the Waage complex (G0), endowable once its stage 1 stands. One stage:
 *  1. Öffnen: free. The price is fixed then: STIFT_TAX_DAYS × the last booked daily tax. One open stage per Bau, at
 *     least STIFT_PAUSE_DAYS between two openings at the same Bau, and only while at most STIFT_OPEN_REST_DAYS of
 *     Stiftungszeit are left.
 *  2. Einzahlen: any number of deposits, each a deliberate player action (rows `stift:<bau>:<n>:r<m>`), at least
 *     1 Mark, at most the rest and the chest; final. Never an automatic debit.
 *  3. Stiften: the player closes the fully paid stage: STIFT_NEED from the store above CIVIC_KEEP, the rest from the
 *     free quota at the Kontor price, paid in the same click (row `stift:<bau>:<n>:k`); the marker `stift:<bau>:<n>`
 *     (0 Mark) is dated at the close. Not enough material: nothing happens.
 * Baustellen-Vorrang (D2): no opening, no deposit and no Kontor part while a Gemeindebau is opened and not fully paid.
 * Reservierung (D6): the open Gemeindebau's missing material stays reserved in the shared quota until it is complete.
 *
 * Stiftungszeit (D11, additive — Implementierungsauftrag Abschnitt 2.1): each close gives its Bau STIFT_DAYS days,
 *   Ende_neu = max(Abschluss, Ende_alt) + 14 Tage,
 * in instants (14 × 24 h), never calendar days. The Bau is endowed while now < Ende; then ONE factor STIFT_FACTOR
 * acts (Spital: sickness, Waage: Kontor prices), however many stages are in store — more stages only move the end.
 * The store never exceeds STIFT_MAX_DAYS. Every close row carries its own end, booked once and never changed (DB
 * stift_stages.until_at); stiftSpans recomputes the same ends from the marker rows alone, and for a past instant the
 * end booked by then decides — a later close never changes an earlier day.
 */
import type { Seed } from "./world";
import type { TownWay } from "./character";
import { CIVIC_KEEP, civicDone, kontorCost, type CivicRow } from "./civic";
import { WAAGE_DISCOUNT, type Stock } from "./resources";

export * from "./stiftungszeit";
export { STIFT_ROW_RE, isStiftRow } from "./civic";
import {
  STIFT_FACTOR,
  STIFT_NEED,
  STIFT_OPEN_REST_MS,
  STIFT_PAUSE_MS,
  stiftEndowed,
  stiftPrice,
  stiftRest,
  stiftSince,
  type StiftBau,
} from "./stiftungszeit";

/** The whole Waage factor on Kontor prices at `at` (DB resource_kontor_at): Waage 1 ×0.85, endowed another ×0.85. */
export function waageFactor(s: Pick<Seed, "bought">, at: number): number {
  return (
    (civicDone(s, "waage1", at) ? WAAGE_DISCOUNT : 1) *
    (stiftEndowed(s, "waage", at) ? STIFT_FACTOR : 1)
  );
}

/** Baustellen-Vorrang (D2): the Gemeindebau stage that is opened and not fully paid, if any (DB: funded_at IS NULL). */
export const stiftVorrang = (civic: readonly Pick<CivicRow, "item" | "price" | "funded_at">[]) =>
  civic.find((c) => !c.funded_at) ?? null;

/**
 * Reservierung (D6): what the open Gemeindebau stage with incomplete material still needs stays reserved in the shared
 * quota; a Stiftung gets only the part above it (DB stift_free_quota). Ends when that stage's material is complete.
 */
export function stiftReserved(
  civic: readonly Pick<
    CivicRow,
    "need_wood" | "need_stone" | "wood_got" | "stone_got" | "material_at"
  >[],
): Stock {
  const r = { wood: 0, stone: 0 };
  for (const c of civic)
    if (!c.material_at) {
      r.wood += Math.max(0, c.need_wood - c.wood_got);
      r.stone += Math.max(0, c.need_stone - c.stone_got);
    }
  return r;
}
export function stiftFreeQuota(quota: Stock | null, reserved: Stock): Stock {
  return {
    wood: Math.max(0, (quota?.wood ?? 0) - reserved.wood),
    stone: Math.max(0, (quota?.stone ?? 0) - reserved.stone),
  };
}

/** What a close would take (DB stift_close): store above the kept stock first, the rest from the free quota. */
export type StiftPlan = { store: Stock; kontor: Stock; short: Stock; cost: number; ok: boolean };
export function stiftPlan(
  stock: Stock,
  free: Stock,
  site: TownWay | null,
  waage: number,
): StiftPlan {
  const store = {
    wood: Math.min(STIFT_NEED.wood, Math.max(0, stock.wood - CIVIC_KEEP.wood)),
    stone: Math.min(STIFT_NEED.stone, Math.max(0, stock.stone - CIVIC_KEEP.stone)),
  };
  const want = { wood: STIFT_NEED.wood - store.wood, stone: STIFT_NEED.stone - store.stone };
  const short = {
    wood: Math.max(0, want.wood - free.wood),
    stone: Math.max(0, want.stone - free.stone),
  };
  const ok = short.wood === 0 && short.stone === 0;
  return { store, kontor: want, short, cost: kontorCost(want, site, waage), ok };
}

/** One stage as the database reports it (table stift_stages). */
export type StiftRow = {
  bau: StiftBau;
  nr: number;
  price: number;
  paid: number;
  opened_at: string;
  funded_at: string | null;
  done_at: string | null;
  until_at: string | null;
  kontor: number | null;
};

/** Why a new stage cannot be opened at a Bau now (DB stift_open); null = may be opened. Checked in the DB's order. */
export type StiftOpenLock =
  | { why: "inactive" }
  | { why: "bau" }
  | { why: "vorrang"; item: string; rest: number }
  | { why: "open" }
  | { why: "pause"; from: number }
  | { why: "full"; rest: number; from: number }
  | { why: "tax" };
export function stiftOpenLock(a: {
  realm: string | null | undefined;
  seed: Pick<Seed, "bought">;
  bau: StiftBau;
  rows: readonly StiftRow[];
  civic: readonly Pick<CivicRow, "item" | "price" | "funded_at">[];
  civicPaid: number;
  lastTax: number | null;
  now: number;
}): StiftOpenLock | null {
  if (a.now < stiftSince(a.realm)) return { why: "inactive" };
  if (!civicDone(a.seed, `${a.bau}1`, a.now)) return { why: "bau" };
  const v = stiftVorrang(a.civic);
  if (v) return { why: "vorrang", item: v.item, rest: Math.max(0, v.price - a.civicPaid) };
  const mine = a.rows.filter((r) => r.bau === a.bau);
  if (mine.some((r) => !r.done_at)) return { why: "open" };
  const last = Math.max(-Infinity, ...mine.map((r) => Date.parse(r.opened_at)));
  if (a.now < last + STIFT_PAUSE_MS) return { why: "pause", from: last + STIFT_PAUSE_MS };
  const rest = stiftRest(a.seed, a.bau, a.now);
  if (rest > STIFT_OPEN_REST_MS)
    return { why: "full", rest, from: a.now + (rest - STIFT_OPEN_REST_MS) };
  if (a.lastTax == null || stiftPrice(a.lastTax) < 1) return { why: "tax" };
  return null;
}
