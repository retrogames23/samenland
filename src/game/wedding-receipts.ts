/**
 * Wedding receipts: the pure mapping from the wedding calendar (weddings.ts, the single source of truth)
 * to the rows of public.wedding_receipts. From weddingSwitchSince(realm) these rows are the only money record of a
 * wedding (DB village_wedding_book / village_weddings read them); before it they shadow the SQL calendar. No I/O here, so it is unit-testable and shared by the trusted
 * server (treasury.server.ts settleWeddings). Receipts are economic records, never growth state:
 * they only freeze what weddingDates already computes, at the index the calendar assigns.
 */
import type { Seed } from "./world";
import { weddingCalendarState, weddingCalendarFrom, weddingSwitchSince, type WedDate, type WeddingAnchor } from "./weddings";

export type WeddingReceiptRow = {
  seed_id: string;
  wedding_index: number;
  occurred_at: string;
  dowry: number;
  is_grand: boolean;
  is_town: boolean;
  version: number;
  /** Paket A2: instant of the next wedding as computed when this one is booked (the anchor of the continuation). */
  next_at: string;
};

/** Bump only together with a migration that explains how old receipts relate to the new rules.
 *  1 = legacy rule (weddings before weddingSwitchSince), 2 = unified rule (migration 0159, Hochzeitspaket). */
export const WEDDING_RECEIPT_VERSION = 1;
export const WEDDING_RECEIPT_VERSION_UNIFIED = 2;

const toRow = (s: Seed, w: WedDate, next: number): WeddingReceiptRow => ({
  seed_id: s.id,
  wedding_index: w.k,
  occurred_at: new Date(w.at).toISOString(),
  dowry: Math.max(0, Math.floor(w.dowry)),
  is_grand: w.grand,
  is_town: w.town,
  // same instant test as wedRuleVersion, through the one imported weddingSwitchSince (also used by planReceipts)
  version: w.at >= weddingSwitchSince(s.realm) ? WEDDING_RECEIPT_VERSION_UNIFIED : WEDDING_RECEIPT_VERSION,
  next_at: new Date(next).toISOString(),
});
/** Rows for a run of weddings; each row's next_at is the next wedding's instant, the last one's is `next`. */
const rowsOf = (s: Seed, list: WedDate[], next: number) => list.map((w, i) => toRow(s, w, i + 1 < list.length ? list[i + 1]!.at : next));

/** All weddings up to `now` as receipt rows, oldest first, indices 0..n-1 exactly as the calendar numbers them —
 *  the reference calendar recomputed from the founding (weddingCalendarState), never the lab desk's test wedding.
 *  Paket A2: once a unified-rule receipt is booked, the settlement continues from it (planReceipts) instead. */
export function weddingReceiptRows(s: Seed, now: number): WeddingReceiptRow[] {
  // Lab: before the switch the SQL calendar pays the lab's dowries and no receipts are kept; from the switch on the
  // receipts are the only record there too (the desk's local overrides never reach the calendar used here).
  const lab = s.realm === "lab", from = weddingSwitchSince(s.realm);
  const { list, next } = weddingCalendarState(s, now);
  return rowsOf(s, list, next).filter((r) => !lab || Date.parse(r.occurred_at) >= from);
}

/** A receipt as stored: every field the money, the guard or the rule version depends on. */
export type BookedReceipt = Pick<WeddingReceiptRow, "wedding_index" | "occurred_at" | "dowry" | "is_grand" | "is_town" | "version"> & {
  /** null for receipts booked before Paket A2 (migration 0160) */
  next_at?: string | null;
};
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

// ---------------------------------------------------------------------------------------------------------------
// Paket A2 — Anker-Fortsetzung (anchor continuation)
//
// Booked receipts are the history and are never recomputed. The calendar is continued from the last booked receipt:
// its index, its instant and the next instant stored with it (next_at) form the anchor (weddingCalendarFrom).
//  - Legacy part (weddings before weddingSwitchSince, version 1): the legacy rule only counts purchases dated at or
//    before each wedding, so it is stable and still compared field by field with the recomputed calendar (as is the
//    instant of the first unified-rule wedding, which the legacy gap of the last legacy wedding determines).
//  - Unified part (from the switch, version 2): later purchases can shorten monument build times in hindsight
//    (Gesellenherberge, Holzfällerlager, Handwerks-Freibrief in world.ts buildWith), so these receipts are not
//    recomputed. They are checked structurally: every one carries next_at, indices run on without a gap, and each
//    one starts exactly at the previous one's next_at (the database trigger enforces the same, migration 0160).
// Anything that does not fit is never repaired or re-booked: the village is quarantined (wedding_quarantine).
// ---------------------------------------------------------------------------------------------------------------

/** initial: no receipt yet · legacy: only receipts before the switch (reference calendar continues) · anchored: the
 *  continuation starts at the last booked unified-rule receipt. */
export type WeddingClass = "initial" | "legacy" | "anchored";
export type QuarantineReason = "legacy_divergent" | "unanchored" | "chain_break";
export type AnchorField = ReceiptField | "next_at";
export type AnchorAudit = {
  /** rows to book (after the highest booked index) */
  missing: WeddingReceiptRow[];
  /** legacy part: indices without a receipt below the highest booked index */
  holes: number[];
  /** legacy part: receipts that differ from the (stable) recomputed calendar */
  changed: { index: number; fields: AnchorField[] }[];
  /** legacy part: receipts at an index the recomputed legacy calendar does not have */
  unexpected: number[];
  /** unified part: receipts without next_at (cannot anchor a continuation) */
  unanchored: number[];
  /** unified part: index gap, instant not equal to the previous next_at, wrong first instant or wrong version */
  chain: number[];
};
export type ReceiptPlan = {
  kind: WeddingClass;
  anchor: WeddingAnchor | null;
  /** rows to book, oldest first, each with next_at (empty when quarantined) */
  rows: WeddingReceiptRow[];
  audit: AnchorAudit;
  quarantine: { reason: QuarantineReason; indices: number[] } | null;
};
const sameInstant = (a: string, b: string) => Date.parse(a) === Date.parse(b);
/** Every index that makes the village non-reconstructible, sorted. */
export const anchorDivergent = (a: AnchorAudit) =>
  [...new Set([...a.holes, ...a.changed.map((c) => c.index), ...a.unexpected, ...a.unanchored, ...a.chain])].sort((x, y) => x - y);

/**
 * The one decision of Paket A2: classify the booked receipts, check them, and compute what is still to book.
 * Pure (no I/O); the trusted server (treasury.server.ts settleWeddings) and its tests use it.
 */
export function planReceipts(s: Seed, booked: BookedReceipt[], now: number): ReceiptPlan {
  const sw = weddingSwitchSince(s.realm);
  const ref = weddingReceiptRows(s, now);
  const sorted = [...booked].sort((a, b) => a.wedding_index - b.wedding_index);
  const unified = (r: { occurred_at: string }) => Date.parse(r.occurred_at) >= sw;
  const legacyBooked = sorted.filter((b) => !unified(b)), newBooked = sorted.filter(unified);
  const top = sorted.length ? sorted[sorted.length - 1]!.wedding_index : -1;
  const audit: AnchorAudit = { missing: [], holes: [], changed: [], unexpected: [], unanchored: [], chain: [] };

  // 1) stable legacy part: full comparison with the recomputed calendar (and next_at where it was stored)
  const legacyRef = ref.filter((r) => !unified(r));
  const byIdx = new Map(legacyBooked.map((b) => [b.wedding_index, b]));
  for (const r of legacyRef) {
    const b = byIdx.get(r.wedding_index);
    if (!b) { if (r.wedding_index < top) audit.holes.push(r.wedding_index); continue; }
    const fields: AnchorField[] = RECEIPT_FIELDS.filter((f) => (f === "occurred_at" ? !sameInstant(r.occurred_at, b.occurred_at) : r[f] !== b[f]));
    if (b.next_at != null && !sameInstant(b.next_at, r.next_at)) fields.push("next_at");
    if (fields.length) audit.changed.push({ index: r.wedding_index, fields });
  }
  const legacyIdx = new Set(legacyRef.map((r) => r.wedding_index));
  for (const b of legacyBooked) if (!legacyIdx.has(b.wedding_index)) audit.unexpected.push(b.wedding_index);

  // 2) unified part: structural chain from the stable first instant on; never recomputed
  let anchor: WeddingAnchor | null = null;
  if (newBooked.length) {
    const first = ref.find(unified);
    newBooked.forEach((b, i) => {
      if (b.next_at == null) audit.unanchored.push(b.wedding_index);
      const p = newBooked[i - 1];
      const linked = i === 0
        ? !!first && first.wedding_index === b.wedding_index && sameInstant(first.occurred_at, b.occurred_at)
        : b.wedding_index === p!.wedding_index + 1 && p!.next_at != null && sameInstant(b.occurred_at, p!.next_at);
      if (!linked || b.version !== WEDDING_RECEIPT_VERSION_UNIFIED) audit.chain.push(b.wedding_index);
    });
    const last = newBooked[newBooked.length - 1]!;
    if (last.next_at != null) anchor = { k: last.wedding_index, at: Date.parse(last.occurred_at), next: Date.parse(last.next_at) };
  }

  const kind: WeddingClass = !sorted.length ? "initial" : newBooked.length ? "anchored" : "legacy";
  const bad = anchorDivergent(audit);
  if (bad.length) {
    const reason: QuarantineReason = audit.unanchored.length ? "unanchored" : audit.chain.length ? "chain_break" : "legacy_divergent";
    return { kind, anchor: null, rows: [], audit, quarantine: { reason, indices: bad } };
  }
  // 3) what is still to book: the continuation from the anchor, or the reference calendar after the highest receipt
  let rows: WeddingReceiptRow[];
  if (anchor) { const { list, next } = weddingCalendarFrom(s, anchor, now); rows = rowsOf(s, list, next); }
  else rows = ref.filter((r) => r.wedding_index > top);
  audit.missing = rows;
  return { kind, anchor, rows, audit, quarantine: null };
}
