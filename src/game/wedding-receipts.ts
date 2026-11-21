/**
 * Wedding receipts: the pure mapping from the wedding calendar (weddings.ts, the single source of truth)
 * to the rows of public.wedding_receipts. No I/O here, so it is unit-testable and shared by the trusted
 * server (treasury.server.ts settleWeddings). Receipts are economic records, never growth state:
 * they only freeze what weddingDates already computes, at the index the calendar assigns.
 */
import type { Seed } from "./world";
import { weddingDates } from "./weddings";

export type WeddingReceiptRow = {
  seed_id: string;
  wedding_index: number;
  occurred_at: string;
  dowry: number;
  is_grand: boolean;
  is_town: boolean;
  version: number;
};

/** Bump only together with a migration that explains how old receipts relate to the new rules. */
export const WEDDING_RECEIPT_VERSION = 1;

/** All weddings up to `now` as receipt rows, oldest first, indices 0..n-1 exactly as weddingDates numbers them. */
export function weddingReceiptRows(s: Seed, now: number): WeddingReceiptRow[] {
  // The lab realm fakes weddings through local overrides; those never become money.
  if (s.realm === "lab") return [];
  return weddingDates(s, now).map((w) => ({
    seed_id: s.id,
    wedding_index: w.k,
    occurred_at: new Date(w.at).toISOString(),
    dowry: Math.max(0, Math.floor(w.dowry)),
    is_grand: w.grand,
    is_town: w.town,
    version: WEDDING_RECEIPT_VERSION,
  }));
}

/**
 * True when exactly the indices 0..n-1 are booked. With the (seed_id, wedding_index) primary key and
 * indices >= 0, "count == n and highest == n-1" proves it, so a hole (or a stray extra index) is never
 * mistaken for a complete set, and it needs only two cheap queries instead of reading every row.
 */
export const receiptsComplete = (count: number, highest: number | null, n: number) =>
  n === 0 ? count === 0 : count === n && highest === n - 1;
