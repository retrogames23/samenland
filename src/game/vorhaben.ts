/**
 * Gemeindevorhaben — voluntary, repeatable spending from Weiler to Hansestadt (no upkeep, nothing expires, never forced).
 * Only numbered purchase rows are stored (bauhuette1…, armen1…, fest1…, pflaster1…); the DB purchase_guard mirrors
 * price per certified rank, numbering, rank and pause. Every effect is derived from those rows and the clock.
 */
import type { Seed } from "./world";

export type VorhabenKey = "bauhuette" | "armen" | "fest" | "pflaster";
const H = 3.6e6, DAY = 864e5;
/**
 * Price = max(floor for the rank, share × the village's last booked daily tax, rounded to 10 Mark), so the works stay
 * meaningful at every size instead of becoming pocket change. Floors index = rank 0…5 (0 = not offered). Mirrors DB purchase_guard
 * (which reads the newest tax_receipts row).
 */
export const VORHABEN: Record<VorhabenKey, { rank: number; prices: readonly number[]; share: number; len: number; gap: number }> = {
  // Bauhütte: hired carpenters for 72 h — running bought builds finish 12 h earlier, rebuilds after fire/flood run twice as fast
  bauhuette: { rank: 1, prices: [0, 60, 120, 250, 450, 700], share: 1, len: 72 * H, gap: 3 * DAY },
  // Armenspeisung: soup on the square, sickness risk halved for 48 h
  armen: { rank: 1, prices: [0, 40, 80, 160, 300, 450], share: 0.5, len: 48 * H, gap: 7 * DAY },
  // Bürgerfest: stalls, the market flag and the whole town gathering at the seat; nobody falls sick that day
  fest: { rank: 3, prices: [0, 0, 0, 500, 900, 1400], share: 3, len: 24 * H, gap: 14 * DAY },
  // Wegeausbau: paves one more finished trade road of the village with cobbles (permanent, once per road)
  pflaster: { rank: 2, prices: [0, 0, 300, 300, 300, 300], share: 2, len: Infinity, gap: 0 },
};
export const VORHABEN_KEYS = Object.keys(VORHABEN) as VorhabenKey[];
const RE = /^(bauhuette|armen|fest|pflaster)([1-9][0-9]*)$/;
export const vorhabenOf = (item: string): VorhabenKey | null => (RE.exec(item)?.[1] as VorhabenKey | undefined) ?? null;
export function vorhabenPrice(k: VorhabenKey, rank: number, dayTax = 0): number {
  const floor = VORHABEN[k].prices[Math.max(0, Math.min(5, rank))] ?? 0;
  return floor ? Math.max(floor, 10 * Math.round((VORHABEN[k].share * Math.max(0, dayTax)) / 10)) : 0;
}
/** Newest booked daily tax from the receipts (settlement day → income), 0 when none. */
export const lastDayTax = (receipts?: Readonly<Record<number, number>>) => {
  if (!receipts) return 0; let d = -1, v = 0;
  for (const [k, x] of Object.entries(receipts)) if (+k > d) { d = +k; v = x; }
  return v;
};
/** Next numbered key (unique (seed_id, item) index blocks double payment). */
export const nextVorhaben = (k: VorhabenKey, paid: Iterable<string>) => { let n = 0; for (const p of paid) if (vorhabenOf(p) === k) n++; return `${k}${n + 1}`; };
export const vorhabenTimes = (s: Pick<Seed, "bought">, k: VorhabenKey) => (s.bought ?? []).filter((b) => vorhabenOf(b.item) === k).map((b) => b.at).sort((a, b) => a - b);
export const vorhabenOpen = (s: Pick<Seed, "bought">, k: VorhabenKey, t: number) => vorhabenTimes(s, k).some((a) => t >= a && t < a + VORHABEN[k].len);
/** Earliest moment the next one may be paid (−Infinity when none yet). */
export function vorhabenReady(s: Pick<Seed, "bought">, k: VorhabenKey): number { const ts = vorhabenTimes(s, k); return ts.length ? ts[ts.length - 1]! + VORHABEN[k].gap : -Infinity; }
/** Paved roads paid up to t. */
export const pavedCount = (s: Pick<Seed, "bought">, t: number) => vorhabenTimes(s, "pflaster").filter((a) => a <= t).length;
/** Sickness factor at t (Armenspeisung halves, Bürgerfest clears). */
export const careFactor = (s: Pick<Seed, "bought">, t: number) => (vorhabenOpen(s, "fest", t) ? 0 : vorhabenOpen(s, "armen", t) ? 0.5 : 1);
/**
 * Is this trade road paved at t? Each village paves its own finished roads in the order they were finished
 * (doneAt, then partner id); either end's paving counts. Pure, so every client sees the same cobbles.
 */
type L = { a: Seed; b: Seed; doneAt: number };
export function isPaved(l: L, all: readonly L[], t: number): boolean {
  if (l.doneAt > t) return false;
  for (const s of [l.a, l.b]) {
    const n = pavedCount(s, t); if (!n) continue;
    const mine = all.filter((o) => (o.a.id === s.id || o.b.id === s.id) && o.doneAt <= t)
      .sort((x, y) => x.doneAt - y.doneAt || (x.a.id + x.b.id).localeCompare(y.a.id + y.b.id));
    if (mine.indexOf(l) > -1 && mine.indexOf(l) < n) return true;
  }
  return false;
}
