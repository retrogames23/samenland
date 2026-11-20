/**
 * Ausbaustufen (permanent upgrades of existing community buildings): only purchase rows backhaus2/3, herberge2/3,
 * granary2/3 are stored (DB purchase_guard: prices, rank certificate, base building + previous step, once).
 * Effects derive from those rows: less grain per meal (bakehouse), more journeymen (inn), more grain storage
 * (granary). Larder and walkers only — never growth, households or taxes.
 */
import type { Seed } from "./world";

export const AUSBAU_BASES = ["backhaus", "herberge", "granary"] as const;
export type AusbauBase = (typeof AUSBAU_BASES)[number];
export const AUSBAU_STEPS: Record<AusbauBase, readonly [string, string]> = {
  backhaus: ["backhaus2", "backhaus3"], herberge: ["herberge2", "herberge3"], granary: ["granary2", "granary3"],
};
/** Mirrors DB purchase_guard prices. */
export const AUSBAU_PRICE: Record<string, number> = { backhaus2: 400, backhaus3: 900, herberge2: 500, herberge3: 1100, granary2: 450, granary3: 1000 };
/** Settlement rank (2 Dorf, 3 Kleinstadt) — mirrors DB need_rank. */
export const AUSBAU_RANK: Record<string, number> = { backhaus2: 2, backhaus3: 3, herberge2: 2, herberge3: 3, granary2: 2, granary3: 3 };
export const isAusbau = (item: string) => item in AUSBAU_PRICE;
/** Bakehouse grain factor per level (1 = plain bakehouse). */
export const BACKHAUS_LEVEL_GRAIN = [0.9, 0.85, 0.8] as const;
/** Daily journeyman chance on a road touching an inn, per level. */
export const HERBERGE_LEVEL_WALZ = [0.5, 0.6, 0.7] as const;
/** Extra grain storage per granary upgrade. */
export const GRANARY_STEP_CAP = 60;

/** Upgrade level (1 = base building only, 0 = base not bought) of `base` at time t. */
export function ausbauLevel(s: Pick<Seed, "bought">, base: AusbauBase, t = Infinity): number {
  const has = (k: string) => (s.bought ?? []).some((b) => b.item === k && b.at <= t);
  if (!has(base)) return 0;
  const [a, b] = AUSBAU_STEPS[base];
  return has(a) ? (has(b) ? 3 : 2) : 1;
}
export const backhausGrain = (s: Pick<Seed, "bought">, t: number) => BACKHAUS_LEVEL_GRAIN[Math.max(0, ausbauLevel(s, "backhaus", t) - 1)]!;
export const herbergeWalz = (s: Pick<Seed, "bought">, t: number) => HERBERGE_LEVEL_WALZ[Math.max(0, ausbauLevel(s, "herberge", t) - 1)]!;
export const granaryExtra = (s: Pick<Seed, "bought">, t: number) => GRANARY_STEP_CAP * Math.max(0, ausbauLevel(s, "granary", t) - 1);
/** Next purchasable step for `base` given paid item keys (null: base missing or fully upgraded). */
export function nextAusbau(base: AusbauBase, paid: Iterable<string>): string | null {
  const p = new Set(paid);
  if (!p.has(base)) return null;
  return AUSBAU_STEPS[base].find((k) => !p.has(k)) ?? null;
}
