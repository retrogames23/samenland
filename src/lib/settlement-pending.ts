/**
 * Paket B (O2): "Abrechnung ausstehend" — one shared vocabulary for database, server and client.
 *
 * The database answers a money or resource action with `wedding settlement pending` when the wedding settlement is not
 * proven complete and the booked (lower-bound) chest does not cover the price, or when a resource booking would read
 * the chest (migration 0162: wedding_money_check, resource_refresh_try). Nothing is stored in that case — the whole
 * statement is rolled back. This is never "not enough money": the message deliberately shares no words with it, so
 * older clients that look for "not enough money" never show a pending refusal as poverty.
 *
 * The client's rule (retryOnPending): on a pending answer it syncs once (settleTreasury books the weddings and the
 * completeness proof) and retries the action at most once. Anything else — a different error, a thrown error, a
 * timeout or a lost response — is never retried here, so a request whose outcome is unknown can never be sent twice.
 */
export const SETTLEMENT_PENDING = "wedding settlement pending";
/** The server-function result code for a pending refusal (DecideCode, Nothilfe, Ratsbuch). */
export const PENDING_CODE = "pending" as const;

export const isSettlementPending = (message: unknown): boolean =>
  typeof message === "string" && message.includes(SETTLEMENT_PENDING);
/** A Supabase/PostgREST result refused as pending. */
export const dbPending = (r: { error?: { message?: string } | null } | null | undefined): boolean => isSettlementPending(r?.error?.message);
/** A server-function result refused as pending. */
export const codePending = (r: { ok: boolean; code?: string } | null | undefined): boolean => !!r && !r.ok && r.code === PENDING_CODE;

/**
 * Runs `run`; if (and only if) its result is a pending refusal, calls `sync` once and runs it once more.
 * A thrown error (network, timeout) propagates unchanged and is never retried. Returns the last result, which may
 * still be pending — the caller then shows that the action is waiting for the settlement.
 */
export async function retryOnPending<R>(run: () => PromiseLike<R>, pending: (r: R) => boolean, sync: () => PromiseLike<unknown>): Promise<R> {
  const first = await run();
  if (!pending(first)) return first;
  try { await sync(); } catch { return first; }
  return run();
}
