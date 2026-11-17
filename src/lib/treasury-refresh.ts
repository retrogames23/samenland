/**
 * One treasury request per refresh, never overlapping: a call during a running request is coalesced into
 * exactly one follow-up run (so changes made meanwhile are still booked), and every waiting caller gets that result.
 * A backlog beyond the server batch is worked off by later refreshes, never by an immediate repeat.
 */
export function coalescedRefresh<T>(run: () => Promise<T>): () => Promise<T> {
  let current: Promise<T> | null = null, next: Promise<T> | null = null;
  const start = (): Promise<T> => {
    const p = run().finally(() => { if (current === p) current = null; });
    current = p;
    return p;
  };
  return () => {
    if (!current) return start();
    if (!next) next = current.catch(() => undefined).then(() => { next = null; return start(); });
    return next;
  };
}
