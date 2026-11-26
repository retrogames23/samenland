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

/** A receipt as stored: every field the money, the guard or the rule version depends on. */
export type BookedReceipt = Pick<WeddingReceiptRow, "wedding_index" | "occurred_at" | "dowry" | "is_grand" | "is_town" | "version">;
/** The compared fields; a booked receipt must match the calendar in every one of them. */
export const RECEIPT_FIELDS = ["occurred_at", "dowry", "version", "is_grand", "is_town"] as const;
export type ReceiptField = (typeof RECEIPT_FIELDS)[number];

/**
 * Full comparison of the booked receipts with the calendar — never a count or index-range shortcut, because a
 * gap-free index range says nothing about the content of the rows.
 *  - missing:    calendar rows after the highest booked index (not settled yet) — the only rows a settlement may send
 *  - holes:      calendar indices without a receipt below the highest booked index, including a missing first one
 *                (receipts are always written oldest first, so a hole means a lost or removed record)
 *  - changed:    booked receipts whose instant, dowry, version, grand or town flag differ from the calendar
 *  - unexpected: booked receipts at an index the calendar does not have
 * Anything in holes, changed or unexpected is a divergence: nothing is written and nothing is repaired.
 */
export type ReceiptAudit = {
  missing: WeddingReceiptRow[];
  holes: number[];
  changed: { index: number; fields: ReceiptField[] }[];
  unexpected: number[];
};
export function auditReceipts(rows: WeddingReceiptRow[], booked: BookedReceipt[]): ReceiptAudit {
  const byIdx = new Map(booked.map((b) => [b.wedding_index, b]));
  const top = booked.reduce((m, b) => Math.max(m, b.wedding_index), -1);
  const expected = new Set(rows.map((r) => r.wedding_index));
  const out: ReceiptAudit = { missing: [], holes: [], changed: [], unexpected: [] };
  for (const r of rows) {
    const b = byIdx.get(r.wedding_index);
    if (!b) { if (r.wedding_index < top) out.holes.push(r.wedding_index); else out.missing.push(r); continue; }
    const fields = RECEIPT_FIELDS.filter((f) =>
      f === "occurred_at" ? Date.parse(r.occurred_at) !== Date.parse(b.occurred_at) : r[f] !== b[f]);
    if (fields.length) out.changed.push({ index: r.wedding_index, fields });
  }
  for (const b of booked) if (!expected.has(b.wedding_index)) out.unexpected.push(b.wedding_index);
  out.unexpected.sort((a, b) => a - b);
  return out;
}
/** Every index that makes a village divergent (holes, changed, unexpected), sorted. */
export const divergentIndices = (a: ReceiptAudit) =>
  [...new Set([...a.holes, ...a.changed.map((c) => c.index), ...a.unexpected])].sort((x, y) => x - y);
