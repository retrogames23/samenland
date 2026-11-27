/**
 * Hochzeitspaket: controlled settlement sweep for wedding receipts (one realm, one bounded batch per request).
 *
 * Same calendar and same booking as the treasury sync (settleWeddings, Paket A2): only indices after the highest
 * receipt are sent, continued from the anchor; existing receipts are never rewritten, parallel runs cannot double-book
 * (wedding_receipts_book: per-village lock, identical repeats are no-ops, PK + UNIQUE instant + anchor chain).
 * Safe to stop at any moment and to repeat from the start or from `next`: a village is either fully settled or
 * keeps its missing rows for the next run. A village whose booked receipts cannot be continued reliably is
 * quarantined (wedding_quarantine, recorded only with apply) and listed in `quarantined`; nothing is written there
 * and the sweep goes on with the next village — receipts are never repaired. A switch date that differs between
 * TypeScript and the database (`switchMismatch`: one deploy is missing) stops the whole sweep (`halted`).
 * `apply: false` (the default) is a dry run that only reports.
 */
import type { Seed } from "@/game/world";
import { weddingSettlementProblem, type WeddingSettlement, type WeddingProblem } from "./treasury.server";

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
  halted: { seed: string; reason: WeddingProblem; mismatches: number[]; switchMismatch?: true } | null;
  /** Paket A2: villages that are (or would be, in a dry run) quarantined; nothing was written there */
  quarantined: { seed: string; reason: string; indices: number[]; recorded: boolean }[];
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
  const out: SweepReport = { realm: opts.realm, apply, at: new Date(now).toISOString(), checked: 0, complete: 0, missing: 0, inserted: 0, villages: [], halted: null, quarantined: [], errors: [], next: null };
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
    const problem = weddingSettlementProblem(r);
    if (problem && (problem.reason === "quarantined" || problem.reason === "receipt_divergence")) {
      out.quarantined.push({ seed: s.id, reason: r.quarantine?.reason ?? problem.reason, indices: r.mismatches, recorded: !!r.quarantine?.recorded });
      last = s.id;
      continue;
    }
    if (problem) {
      out.halted = { seed: s.id, reason: problem.reason, mismatches: r.mismatches, ...(r.switchMismatch ? { switchMismatch: true as const } : {}) };
      out.next = last;
      return out;
    }
    if (r.missing === 0 || (apply && r.verified && r.audit.missing.length === 0)) out.complete++;
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
