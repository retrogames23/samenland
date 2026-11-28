/**
 * P4 Stiftungszeit (D11, additive) — the dependency-free core of stiftung.ts, so sickness.ts can read it without an
 * import cycle (resources.ts → world.ts → … → sickness.ts). Rules and wording: see stiftung.ts.
 */
import type { Seed } from "./world";

const STIFT_ROW = /^stift:(spital|waage):[1-9][0-9]*(:r[1-9][0-9]*|:k)?$/;
export const STIFT_BAUTEN = ["spital", "waage"] as const;
export type StiftBau = (typeof STIFT_BAUTEN)[number];
export const isStiftBau = (b: string): b is StiftBau =>
  (STIFT_BAUTEN as readonly string[]).includes(b);

/** Price of a stage: this many times the last booked daily tax, fixed when the stage is opened. */
export const STIFT_TAX_DAYS = 4;
/** Material of every stage. */
export const STIFT_NEED = { wood: 30, stone: 20 } as const;
const DAY = 864e5;
/** Stiftungszeit one close gives. */
export const STIFT_DAYS = 14;
/** The store of Stiftungszeit never exceeds this (checked again by the close itself). */
export const STIFT_MAX_DAYS = 28;
/** A new stage opens only while at most this much Stiftungszeit is left (exactly this much is allowed). */
export const STIFT_OPEN_REST_DAYS = 14;
/** At least this long between two openings at the same Bau. */
export const STIFT_PAUSE_DAYS = 7;
/** The one extra factor while a Bau is endowed: Spital sickness risk, Waage Kontor prices. */
export const STIFT_FACTOR = 0.85;
export const STIFT_MS = STIFT_DAYS * DAY,
  STIFT_MAX_MS = STIFT_MAX_DAYS * DAY,
  STIFT_OPEN_REST_MS = STIFT_OPEN_REST_DAYS * DAY,
  STIFT_PAUSE_MS = STIFT_PAUSE_DAYS * DAY;

/**
 * Start of Stiftungen per map (DB stift_since, migrations 0165 and 0169). Only the admin test map `lab` is active
 * (P4 Schritt 2b, migration 0169: 2026-11-28 00:00 UTC). Every other map — europe, us-west, us-east, asia and their
 * overflow maps — stays on the placeholder: no public date is decided (D7); a real date is its own later migration and
 * decision. Stiftungen never act backwards (every row is a player action), so a start in the past books nothing.
 */
export const STIFT_SINCE = Date.UTC(2100, 0, 4);
export const STIFT_SINCE_LAB = Date.UTC(2026, 10, 28);
export const stiftSince = (realm: string | null | undefined) => (realm === "lab" ? STIFT_SINCE_LAB : STIFT_SINCE);

/** Row names (DB purchase_guard, migration 0165). */
export const stiftMarker = (bau: StiftBau, n: number) => `stift:${bau}:${n}`;
export const stiftDeposit = (bau: StiftBau, n: number, m: number) => `stift:${bau}:${n}:r${m}`;
export const stiftKontor = (bau: StiftBau, n: number) => `stift:${bau}:${n}:k`;
const MARKER_RE = /^stift:(spital|waage):([1-9][0-9]*)$/;
export const isStiftMarker = (item: string) => MARKER_RE.test(item);
/** Deposit rows of one stage. */
export const isStiftDeposit = (bau: StiftBau, n: number, item: string) =>
  STIFT_ROW.test(item) && item.startsWith(`stift:${bau}:${n}:r`);

/** Price of a stage opened now (DB stift_open): STIFT_TAX_DAYS × last booked daily tax. */
export const stiftPrice = (lastTax: number) => STIFT_TAX_DAYS * Math.max(0, Math.round(lastTax));

/** New end of the Stiftungszeit when a stage is closed at `at` (2.1): the 14 days start at the running end, else now. */
export const stiftExtend = (at: number, until: number | null) =>
  Math.max(at, until ?? at) + STIFT_MS;
/** May a close at `at` be booked? Never an end further than STIFT_MAX_DAYS away (second guard of the 28-day limit). */
export const stiftCloseAllowed = (at: number, until: number | null) =>
  stiftExtend(at, until) <= at + STIFT_MAX_MS;

/** One closed stage: when it was closed and the end of the Stiftungszeit booked with it. */
export type StiftSpan = { n: number; at: number; until: number };
type Bought = NonNullable<Seed["bought"]>;
const spanCache = new WeakMap<Bought, { len: number; by: Record<StiftBau, StiftSpan[]> }>();
/**
 * The closes of a Bau in time order with their booked ends, folded from the marker rows alone (their created_at is
 * the close instant). Mirrors DB stift_stages.until_at exactly: until = max(at, previous until) + 14 days.
 */
export function stiftSpans(s: Pick<Seed, "bought">, bau: StiftBau): StiftSpan[] {
  const bought = s.bought;
  if (!bought?.length) return [];
  const hit = spanCache.get(bought);
  if (hit && hit.len === bought.length) return hit.by[bau];
  const by: Record<StiftBau, StiftSpan[]> = { spital: [], waage: [] };
  const rows = bought
    .map((b) => ({ m: MARKER_RE.exec(b.item), at: b.at }))
    .filter((r): r is { m: RegExpExecArray; at: number } => r.m !== null)
    .sort((a, b) => a.at - b.at || Number(a.m[2]) - Number(b.m[2]));
  for (const r of rows) {
    const list = by[r.m[1] as StiftBau];
    const prev = list.length ? list[list.length - 1]!.until : null;
    list.push({ n: Number(r.m[2]), at: r.at, until: stiftExtend(r.at, prev) });
  }
  spanCache.set(bought, { len: bought.length, by });
  return by[bau];
}
/** End of the Stiftungszeit as booked by `at` (the latest close up to then); null = never endowed by then. */
export function stiftUntil(s: Pick<Seed, "bought">, bau: StiftBau, at: number): number | null {
  let until: number | null = null;
  for (const sp of stiftSpans(s, bau)) {
    if (sp.at > at) break;
    until = sp.until;
  }
  return until;
}
/** Is the Bau endowed at `at`? (now < Ende, with the end booked by then — DB stift_endowed_at.) */
export function stiftEndowed(s: Pick<Seed, "bought">, bau: StiftBau, at: number): boolean {
  const until = stiftUntil(s, bau, at);
  return until !== null && at < until;
}
/** Stiftungszeit left at `at` in ms (0 = none). */
export function stiftRest(s: Pick<Seed, "bought">, bau: StiftBau, at: number): number {
  const until = stiftUntil(s, bau, at);
  return until === null ? 0 : Math.max(0, until - at);
}
/** Whole days shown for a rest: rounded up (2.1 "die Anzeige rundet die Resttage auf"). */
export const stiftRestDays = (ms: number) => Math.max(0, Math.ceil(ms / DAY - 1e-9));
