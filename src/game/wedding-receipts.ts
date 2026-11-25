/**
 * Wedding receipts: the pure mapping from the wedding calendar (weddings.ts, the single source of truth)
 * to the rows of public.wedding_receipts. From weddingSwitchSince(realm) these rows are the only money record of a
 * wedding (DB village_wedding_book / village_weddings read them); before it they shadow the SQL calendar. No I/O here, so it is unit-testable and shared by the trusted
 * server (treasury.server.ts settleWeddings). Receipts are economic records, never growth state:
 * they only freeze what weddingDates already computes, at the index the calendar assigns.
 */
import type { Seed } from "./world";
import { weddingCalendar, weddingSwitchSince, wedRuleVersion } from "./weddings";

export type WeddingReceiptRow = {
  seed_id: string;
  wedding_index: number;
  occurred_at: string;
  dowry: number;
  is_grand: boolean;
  is_town: boolean;
  version: number;
};

/** Bump only together with a migration that explains how old receipts relate to the new rules.
 *  1 = legacy rule (weddings before weddingSwitchSince), 2 = unified rule (migration 0159, Hochzeitspaket). */
export const WEDDING_RECEIPT_VERSION = 1;
export const WEDDING_RECEIPT_VERSION_UNIFIED = 2;

/** All weddings up to `now` as receipt rows, oldest first, indices 0..n-1 exactly as the calendar numbers them.
 *  Built from the pure calendar (weddingCalendar), never from the lab desk's test wedding. */
export function weddingReceiptRows(s: Seed, now: number): WeddingReceiptRow[] {
  // Lab: before the switch the SQL calendar pays the lab's dowries and no receipts are kept; from the switch on the
  // receipts are the only record there too (the desk's local overrides never reach the calendar used here).
  const lab = s.realm === "lab", from = weddingSwitchSince(s.realm);
  return weddingCalendar(s, now).filter((w) => !lab || w.at >= from).map((w) => ({
    seed_id: s.id,
    wedding_index: w.k,
    occurred_at: new Date(w.at).toISOString(),
    dowry: Math.max(0, Math.floor(w.dowry)),
    is_grand: w.grand,
    is_town: w.town,
    version: wedRuleVersion(s, w.at) === 2 ? WEDDING_RECEIPT_VERSION_UNIFIED : WEDDING_RECEIPT_VERSION,
  }));
}

/**
 * True when exactly the indices 0..n-1 are booked. With the (seed_id, wedding_index) primary key and
 * indices >= 0, "count == n and highest == n-1" proves it, so a hole (or a stray extra index) is never
 * mistaken for a complete set, and it needs only two cheap queries instead of reading every row.
 */
export const receiptsComplete = (count: number, highest: number | null, n: number, first = 0) =>
  n === 0 ? count === 0 : count === n && highest === first + n - 1;

/** A receipt as stored (only the fields the money reads). */
export type BookedReceipt = { wedding_index: number; occurred_at: string; dowry: number };
/** Rows of the calendar that have no receipt yet — the only rows a settlement may send. */
export function missingReceipts(rows: WeddingReceiptRow[], booked: BookedReceipt[]): WeddingReceiptRow[] {
  const have = new Set(booked.map((b) => b.wedding_index));
  return rows.filter((r) => !have.has(r.wedding_index));
}
/**
 * Booked receipts that disagree with the calendar (instant or dowry), or that the calendar does not know at all.
 * Never repaired automatically: a receipt is an economic record, so any hit stops the sweep for that village and
 * must be investigated by hand (no historical receipt is ever rewritten).
 */
export function receiptMismatches(rows: WeddingReceiptRow[], booked: BookedReceipt[]): number[] {
  const byIdx = new Map(rows.map((r) => [r.wedding_index, r]));
  const out: number[] = [];
  for (const b of booked) {
    const r = byIdx.get(b.wedding_index);
    if (!r || Date.parse(r.occurred_at) !== Date.parse(b.occurred_at) || r.dowry !== b.dowry) out.push(b.wedding_index);
  }
  return out.sort((a, b) => a - b);
}
