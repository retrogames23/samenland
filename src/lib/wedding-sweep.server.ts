/**
 * Hochzeitspaket: controlled settlement sweep for wedding receipts (one realm, one bounded batch per request).
 *
 * Same calendar and same booking as the treasury sync (settleWeddings): only indices without a receipt are sent,
 * existing receipts are never rewritten, parallel runs cannot double-book (PK + ignoreDuplicates, UNIQUE instant).
 * Safe to stop at any moment and to repeat from the start or from `next`: a village is either fully settled or
 * keeps its missing rows for the next run. A village whose booked receipts disagree with the calendar stops the
 * sweep (`halted`) before anything else is written — investigate by hand, receipts are never repaired. So does a
 * switch date that differs between TypeScript and the database (`switchMismatch`: one deploy is missing).
 * `apply: false` (the default) is a dry run that only reports.
 */
import type { Seed } from "@/game/world";
import type { WeddingSettlement } from "./treasury.server";

export type SweepOptions = { realm: string; apply?: boolean; after?: string | null; limit?: number };
export type SweepVillage = { seed: string } & WeddingSettlement;
export type SweepReport = {
  realm: string;
  apply: boolean;
  at: string;
  checked: number;
  complete: number;
  missing: number;
  inserted: number;
  villages: SweepVillage[];
  halted: { seed: string; mismatches: number[]; switchMismatch?: true } | null;
  errors: { seed: string; message: string }[];
  /** Resume cursor (last fully handled village id), null when the realm is done. */
  next: string | null;
};
export const SWEEP_LIMIT = 25, SWEEP_MAX = 100;

/** Pure driver (unit-tested): owned villages after the cursor, id order, at most `limit`, stop on the first mismatch. */
export async function runSweep(
  seeds: Seed[],
  settle: (s: Seed, apply: boolean) => Promise<WeddingSettlement>,
  opts: SweepOptions,
  now: number,
): Promise<SweepReport> {
  const apply = opts.apply === true;
  const limit = Math.max(1, Math.min(SWEEP_MAX, Math.floor(opts.limit ?? SWEEP_LIMIT)));
  const owned = seeds.filter((s) => !!s.user_id && (!opts.after || s.id > opts.after)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const batch = owned.slice(0, limit);
  const out: SweepReport = { realm: opts.realm, apply, at: new Date(now).toISOString(), checked: 0, complete: 0, missing: 0, inserted: 0, villages: [], halted: null, errors: [], next: null };
  let last: string | null = opts.after ?? null;
  for (const s of batch) {
    let r: WeddingSettlement;
    try { r = await settle(s, apply); }
    catch (e) {
      // a failed write leaves the village as it was (no partial index can be wrong); stop so the operator sees it
      out.errors.push({ seed: s.id, message: e instanceof Error ? e.message : String(e) });
      out.next = last;
      return out;
    }
    out.checked++;
    out.villages.push({ seed: s.id, ...r });
    out.missing += r.missing; out.inserted += r.inserted;
    if (r.mismatches.length || r.switchMismatch) {
      out.halted = { seed: s.id, mismatches: r.mismatches, ...(r.switchMismatch ? { switchMismatch: true as const } : {}) };
      out.next = last;
      return out;
    }
    if (r.missing === 0 || (apply && r.inserted === r.missing)) out.complete++;
    last = s.id;
  }
  out.next = owned.length > batch.length ? last : null;
  return out;
}

/** The trusted run: loads the realm once (same input as the treasury sync, without relocations). */
export async function sweepWeddings(opts: SweepOptions): Promise<SweepReport> {
  const { loadEconomyInput, settleWeddings } = await import("./treasury.server");
  const { economyWorldAt } = await import("@/game/economy-world");
  const { setRealm } = await import("@/game/time");
  const input = await loadEconomyInput(opts.realm);
  setRealm(opts.realm as import("@/game/time").Realm);
  const now = Date.now();
  const seeds = economyWorldAt(input, now);
  return runSweep(seeds, (s, apply) => settleWeddings(s, now, { apply }), opts, now);
}
