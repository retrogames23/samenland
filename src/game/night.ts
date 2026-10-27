import { hash } from "./world";

/** Stable household schedules, with no window lights in the deep night. */
export function houseLit(kind: string, seed: number, hour: number): boolean {
  const a = hash(seed, 7, 811), b = hash(seed, 7, 812);
  if (hour >= 5.5 && hour < 7.2) return a < 0.3 && hour >= 5.5 + b * 1.2;
  const evening = (hour - 18 + 24) % 24;
  if (evening >= 6.75) return false;
  const on = 0.3 + b * 1.4;
  const off = kind === "inn" ? 6.75 : kind === "church" || kind === "townhall" ? 2.5 + a : 3 + a * 2.5;
  if (kind !== "inn" && a > 0.75) return false;
  return evening >= on && evening < off;
}

/** Milliseconds in, gentle independent candle flutter out (never a strobe). */
export function candleFlicker(time: number, seed: number): number {
  const seconds = time / 1000;
  const phase = hash(seed, 19, 814) * Math.PI * 2;
  return 0.86 + 0.08 * Math.sin(seconds * 7 + phase) + 0.06 * Math.sin(seconds * 11.3 + phase * 1.7);
}
