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

/** Tile offsets nearest first (rings 1–6, fixed order) — deterministic placement. */
const RING: [number, number][] = [];
for (let r = 1; r <= 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) RING.push([dx, dy]);
const OPEN = new Set(["street", "path", "square"]);
const MARKET = new Set(["square", "well", "market"]);
/**
 * Fountain tile (display only): 1) a paved market square tile by the seat, else by the founding point, within 6 tiles, 2) free ground beside the well/market (village market place), 3) free dry ground by the seat whose
 * neighbours are open (never pressed into a house, field or yard), 4) any free dry tile by the founding point.
 * `kindAt` returns the structure kind or null; `free` says the tile is dry, buildable and not taken by a decoration.
 */
export function pickFountainTile(seat: [number, number], centre: [number, number], kindAt: (x: number, y: number) => string | null, free: (x: number, y: number) => boolean): [number, number] | null {
  const open = (x: number, y: number) => { const k = kindAt(x, y); return k == null || OPEN.has(k); };
  const neighboursOpen = (x: number, y: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([i, j]) => open(x + i!, y + j!));
  // the market square: paved tiles by the seat first, then around the founding point (squares grow from there)
  for (const o of [seat, centre]) for (const [dx, dy] of RING) { const x = o[0] + dx, y = o[1] + dy; if (kindAt(x, y) === "square" && free(x, y)) return [x, y]; }
  // villages without paved squares: the open ground beside the well or market stalls is the market place
  const byMarket = (x: number, y: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => MARKET.has(kindAt(x + i!, y + j!) ?? ""));
  for (const o of [seat, centre]) for (const [dx, dy] of RING) { const x = o[0] + dx, y = o[1] + dy; if (kindAt(x, y) == null && free(x, y) && byMarket(x, y)) return [x, y]; }
  for (const [dx, dy] of RING) { const x = seat[0] + dx, y = seat[1] + dy; if (kindAt(x, y) == null && free(x, y) && neighboursOpen(x, y)) return [x, y]; }
  for (const [dx, dy] of RING) { const x = centre[0] + dx, y = centre[1] + dy; if (kindAt(x, y) == null && free(x, y)) return [x, y]; }
  return null;
}
