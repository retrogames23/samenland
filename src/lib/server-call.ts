// Server functions take the bearer token the browser attaches (auth-attacher.ts) and requireSupabaseAuth refuses a
// missing or invalid one before the handler runs. Such a refusal is the one thrown error whose outcome is known —
// nothing was booked — so it may be retried once with a refreshed session. Every other thrown error (timeout, network,
// server fault) stays unretried: its outcome is unknown (see settlement-pending.ts).

/** A refusal by requireSupabaseAuth (all its messages start with "Unauthorized:"; no handler throws that). */
export const isUnauthorized = (e: unknown): boolean =>
  e instanceof Error && e.message.startsWith("Unauthorized:");

/**
 * Wraps a server-function call: on an auth refusal it refreshes the session once and calls again.
 * A failed refresh is ignored — the second call then fails with the same refusal, which the caller sees.
 */
export function withFreshAuth<A extends unknown[], R>(
  call: (...a: A) => Promise<R>,
  refresh: () => PromiseLike<unknown>,
): (...a: A) => Promise<R> {
  return async (...a: A) => {
    try {
      return await call(...a);
    } catch (e) {
      if (!isUnauthorized(e)) throw e;
      try {
        await refresh();
      } catch {
        /* the retry below reports the refusal */
      }
      return call(...a);
    }
  };
}

/** Why a server call threw, for the short code shown with a generic failure text (support can tell the cases apart). */
export type CallFault = "auth" | "net" | "server";
export const callFault = (e: unknown): CallFault =>
  isUnauthorized(e)
    ? "auth"
    : e instanceof TypeError || (e instanceof Error && /fetch|network|load failed/i.test(e.message))
      ? "net"
      : "server";
