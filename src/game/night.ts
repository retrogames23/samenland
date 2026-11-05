import { hash } from "./world";

/** Stable household schedules, with no window lights in the deep night. */
/** `rise`/`set`: real sunrise/sunset in realm hours (sun.ts) — candles burn only once it is actually dark. */
export function houseLit(kind: string, seed: number, hour: number, rise = 7.2, set = 18): boolean {
  const a = hash(seed, 7, 811), b = hash(seed, 7, 812);
  if (hour >= 5.5 && hour < 12) return hour < rise - 0.2 && a < 0.3 && hour >= 5.5 + b * 1.2;
  const evening = (hour - 18 + 24) % 24; // bedtime stays on the fixed clock
  if (evening >= 6.75) return false;
  const on = Math.max(set + 0.3 + b * 1.4, 0) - 18;
  const off = kind === "inn" ? 6.75 : kind === "church" || kind === "townhall" ? 2.5 + a : 3 + a * 2.5;
  if (kind !== "inn" && a > 0.75) return false;
  return (hour >= 12 ? hour - 18 : evening) >= on && evening < off;
}

/** Milliseconds in, gentle independent candle flutter out (never a strobe). */
export function candleFlicker(time: number, seed: number): number {
  const seconds = time / 1000;
  const phase = hash(seed, 19, 814) * Math.PI * 2;
  return 0.86 + 0.08 * Math.sin(seconds * 7 + phase) + 0.06 * Math.sin(seconds * 11.3 + phase * 1.7);
}
