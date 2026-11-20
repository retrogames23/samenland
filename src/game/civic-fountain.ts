/**
 * Marktbrunnen mit Wasserkunst — first municipal investment (pilot). Only purchase rows fountain1..3 are stored
 * (DB purchase_guard: prices, order, once per step, Handelsstadt certificate, money, unique index against double
 * payment); build progress and fire protection are derived from those rows and the clock — never stored.
 */
import type { Seed } from "./world";

export const FOUNTAIN_STEPS = ["fountain1", "fountain2", "fountain3"] as const;
export type FountainStep = (typeof FOUNTAIN_STEPS)[number];
/** Mirrors DB purchase_guard prices. */
export const FOUNTAIN_PRICE: Record<FountainStep, number> = { fountain1: 4000, fountain2: 8000, fountain3: 12000 };
/** Build days per step (real days). */
export const FOUNTAIN_DAYS: Record<FountainStep, number> = { fountain1: 14, fountain2: 21, fountain3: 30 };
/** Settlement rank for the first step (Handelsstadt) — mirrors DB need_rank. */
export const FOUNTAIN_RANK = 4;
const DAY = 864e5;
export const isFountain = (item: string): item is FountainStep => (FOUNTAIN_STEPS as readonly string[]).includes(item);

/** Build chain: each paid step starts when paid or when the previous step stands, whichever is later. */
export function fountainChain(s: Seed, until = Infinity): { item: FountainStep; at: number; start: number; done: number }[] {
  const out: { item: FountainStep; at: number; start: number; done: number }[] = [];
  let prev = -Infinity;
  for (const step of FOUNTAIN_STEPS) {
    const b = (s.bought ?? []).find((x) => x.item === step && x.at <= until);
    if (!b) break;
    const start = Math.max(b.at, prev); prev = start + FOUNTAIN_DAYS[step] * DAY;
    out.push({ item: step, at: b.at, start, done: prev });
  }
  return out;
}
/** Finished steps at t. */
export const fountainDone = (s: Seed, t: number) => fountainChain(s, t).filter((c) => c.done <= t).length;
/** Next step to pay, or null when all three are paid. */
export const nextFountainStep = (paid: Iterable<string>): FountainStep | null => { const p = new Set(paid); return FOUNTAIN_STEPS.find((k) => !p.has(k)) ?? null; };

/** Market core: fires starting within this many tiles of the town centre. */
export const FOUNTAIN_CORE = 6;
/** Step 1 (Brunnenkump): burning tiles in the market core halved (rounded up, at least 1). */
export const fountainTiles = (tiles: number, steps: number, core: boolean) => (steps >= 1 && core ? Math.max(1, Math.ceil(tiles / 2)) : tiles);
/** Step 2 (Wasserkunst): bucket chains start sooner — fires in the market core are put out 25 % faster. */
export const FOUNTAIN_BURN = 0.75;
export const fountainBurn = (steps: number, core: boolean) => (steps >= 2 && core ? FOUNTAIN_BURN : 1);
