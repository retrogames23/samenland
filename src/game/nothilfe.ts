/**
 * Zimmerleute-Nothilfe — the headman hires carpenters for one concrete fire or flood ruin.
 * Only the purchase row `nothilfe-f<ms>` / `nothilfe-w<ms>` is stored (<ms> = floored start of the event), written
 * solely by the trusted server function (callNothilfe), which recomputes the event; the DB purchase_guard checks
 * price, rank, money, server origin and once per event (unique index). From the moment of payment the rest of
 * that rebuild runs twice as fast, so the remaining time halves exactly — pure from rows and clock.
 */
import type { Seed } from "./world";

export const NOTHILFE_PRICE = 80;
/** Settlement rank (Weiler) — mirrors DB need_rank. */
export const NOTHILFE_RANK = 1;
/** Speed of the remaining rebuild after payment (2 = remaining time halves). */
export const NOTHILFE_SPEED = 2;
export type NotKind = "f" | "w";
export const nothilfeItem = (kind: NotKind, at: number) => `nothilfe-${kind}${Math.floor(at)}`;
const RE = /^nothilfe-([fw])([0-9]+)$/;
export const isNothilfe = (item: string) => RE.test(item);
/** Payment moment for this event, or null. */
export function nothilfeAt(s: Pick<Seed, "bought">, kind: NotKind, at: number): number | null {
  const key = nothilfeItem(kind, at);
  const b = (s.bought ?? []).find((x) => x.item === key);
  return b ? b.at : null;
}
/**
 * Progress 0..1 with the help applied: before payment the plain curve, afterwards the rest runs NOTHILFE_SPEED× faster.
 * A payment after the rebuild was done (raw ≥ 1) or before the ruin existed has no effect.
 */
export function helpedProgress(raw: (t: number) => number, paid: number | null, end: number, now: number): number {
  const p = raw(now);
  if (paid == null || paid < end || now <= paid) return p;
  const pb = raw(paid);
  if (pb >= 1) return p;
  return pb + NOTHILFE_SPEED * (p - pb);
}
