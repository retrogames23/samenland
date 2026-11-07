import { hash } from "./world";

/** Around 1500 light was costly (tallow, pine splints): plain homes light briefly and rarely,
 *  well-off houses a little longer, the inn stays awake longest. */
const SIMPLE = new Set(["hut", "cottage", "farmhouse", "handwerker", "fachwerk", "barn"]);
const RICH = new Set(["patrician", "villa", "steinhaus"]);

/** Stable household schedules, with no window lights in the deep night. */
/** `rise`/`set`: real sunrise/sunset in realm hours (sun.ts) — candles burn only once it is actually dark. */
export function houseLit(kind: string, seed: number, hour: number, rise = 7.2, set = 18): boolean {
  const a = hash(seed, 7, 811), b = hash(seed, 7, 812);
  const simple = SIMPLE.has(kind), rich = RICH.has(kind);
  if (hour >= 5.5 && hour < 12) return hour < rise - 0.2 && a < (simple ? 0.2 : 0.3) && hour >= 5.5 + b * 1.2;
  const evening = (hour - 18 + 24) % 24; // bedtime stays on the fixed clock
  if (evening >= 6.75) return false;
  const on = Math.max(set + 0.3 + b * 1.4, 0) - 18;
  const off = kind === "inn" ? 6.75
    : kind === "church" || kind === "townhall" ? 2.5 + a
    : simple ? 2 + a * 1.5          // in bed by about 20–21:30
    : rich ? 3.5 + a * 1.5          // candles until 21:30–23
    : 3 + a * 2.5;
  const skip = simple ? 0.35 : rich ? 0.85 : 0.75;
  if (kind !== "inn" && a > skip) return false;
  return (hour >= 12 ? hour - 18 : evening) >= on && evening < off;
}

/** Window glow strength: a single tallow light in a plain home, real candles in rich houses. */
export function lampStrength(kind: string): number {
  return SIMPLE.has(kind) ? 0.65 : 1;
}

/** Milliseconds in, gentle independent candle flutter out (never a strobe). */
export function candleFlicker(time: number, seed: number): number {
  const seconds = time / 1000;
  const phase = hash(seed, 19, 814) * Math.PI * 2;
  return 0.86 + 0.08 * Math.sin(seconds * 7 + phase) + 0.06 * Math.sin(seconds * 11.3 + phase * 1.7);
}
