// Realtime isolation for the loaded map: pure filters + a load gate, so events never leak across maps
// and events arriving while a map loads are held, then replayed against the new map's ids.
export const onIds = (ids: readonly string[], ...xs: (string | null | undefined)[]) => xs.some((x) => !!x && ids.includes(x));

/** fresh rows win (both filtered by keep); older local rows survive only if they belong to the current map (events seen during load) */
export function mergeRows<T extends { id: string }>(fresh: T[], old: T[], keep: (r: T) => boolean): T[] {
  const m = new Map(fresh.filter(keep).map((r) => [r.id, r]));
  for (const r of old) if (!m.has(r.id) && keep(r)) m.set(r.id, r);
  return [...m.values()];
}

/**
 * Full snapshot of the loaded map: it replaces the old state completely (deletes/updates win, foreign rows drop).
 * Inserts racing the query are not kept from old local state: they arrive as realtime events, held by the
 * LoadGate while the snapshot loads and replayed right after it is applied (gate.end applies first, then replays).
 */
export function snapRows<T extends { id: string }>(fresh: T[], keep: (r: T) => boolean): T[] {
  const m = new Map(fresh.filter(keep).map((r) => [r.id, r]));
  return [...m.values()];
}

/**
 * seeds DELETE: Realtime sends only the primary key in `old` (no REPLICA IDENTITY FULL), so realm is unknown —
 * judged by id alone: an id not on the loaded map (other realm) changes nothing. Returns the new ids, or null if foreign.
 */
export function dropSeedId(ids: readonly string[], ev: { old?: { id?: string } | null }): string[] | null {
  const id = ev.old?.id; return id && ids.includes(id) ? ids.filter((x) => x !== id) : null;
}
/** companion rows of a deleted village: drop every row naming it in one of cols (same as abandon_village deletes) */
export function withoutSeed<T>(rows: T[], id: string, ...cols: (keyof T)[]): T[] {
  return rows.some((r) => cols.some((c) => r[c] === id)) ? rows.filter((r) => !cols.some((c) => r[c] === id)) : rows;
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
  /** epoch of the newest load, to tag async work started outside a load (e.g. realtime follow-ups) */
  get epochNow() { return this.epoch; }
  isCurrent(epoch: number) { return epoch === this.epoch; }
  /** a load or refresh is running (events are being held) */
  get busy() { return this.loading; }
  /** true if this load is still the newest; then applies its snapshot (if given) and replays held events after it */
  end(epoch: number, apply?: () => void) {
    if (epoch !== this.epoch) return false;
    apply?.();
    this.loading = false;
    const p = this.pending; this.pending = [];
    for (const f of p) f();
    return true;
  }
}

/**
 * Re-read part of the loaded map (tab woke up, failed save) through the same gate as a map load:
 * events are held meanwhile and replayed after the snapshot; a newer load/refresh makes this one stale,
 * so a late answer for map A never lands on map B. Skipped while a load runs (that load covers it).
 */
export async function refreshMap<R>(gate: LoadGate, fetch: () => Promise<R>, apply: (r: R) => void): Promise<boolean> {
  if (gate.busy) return false;
  const e = gate.begin();
  let r: R | undefined, ok = false;
  try { r = await fetch(); ok = true; } catch { /* keep the old state */ }
  return gate.end(e, ok ? () => apply(r as R) : undefined) && ok;
}
