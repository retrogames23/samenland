// Realtime isolation for the loaded map: pure filters + a load gate, so events never leak across maps
// and events arriving while a map loads are held, then replayed against the new map's ids.
export const onIds = (ids: readonly string[], ...xs: (string | null | undefined)[]) => xs.some((x) => !!x && ids.includes(x));

/** fresh rows win (both filtered by keep); older local rows survive only if they belong to the current map (events seen during load) */
export function mergeRows<T extends { id: string }>(fresh: T[], old: T[], keep: (r: T) => boolean): T[] {
  const m = new Map(fresh.filter(keep).map((r) => [r.id, r]));
  for (const r of old) if (!m.has(r.id) && keep(r)) m.set(r.id, r);
  return [...m.values()];
}

/** signposts: INSERT/UPDATE only for the map, DELETE only removes the matching id */
export function applySign<T extends { id: string; seed_id: string }>(s: T[], ev: { eventType: string; new?: Partial<T> | null; old?: Partial<T> | null }, ids: readonly string[]): T[] {
  if (ev.eventType === "DELETE") { const id = ev.old?.id; return id && s.some((x) => x.id === id) ? s.filter((x) => x.id !== id) : s; }
  const n = ev.new as T | undefined;
  if (!n?.id || !onIds(ids, n.seed_id)) return s;
  return [...s.filter((x) => x.id !== n.id), n];
}

/** holds events while a map loads; only the newest load releases them */
export class LoadGate {
  private epoch = 0;
  private loading = false;
  private pending: (() => void)[] = [];
  begin() { this.loading = true; return ++this.epoch; }
  /** run now, or hold until the running load finishes */
  run(fn: () => void) { if (this.loading) this.pending.push(fn); else fn(); }
  /** false once a newer load has begun — a stale load must not touch any state */
  isCurrent(epoch: number) { return epoch === this.epoch; }
  /** true if this load is still the newest; then replays held events */
  end(epoch: number) {
    if (epoch !== this.epoch) return false;
    this.loading = false;
    const p = this.pending; this.pending = [];
    for (const f of p) f();
    return true;
  }
}
