import { describe, it, expect } from "vitest";
import { rankRises, chronicle } from "./chronicle";
import { townRank } from "./rank";
import type { Seed } from "./world";

// rankRises replaces the old chronicle loop that asked townRank at every 6-hour step (480 calls over 120 days,
// ~55 s for a big town). Reference = that old loop, kept here: first step whose rank exceeds the running maximum.
const STEP = 6 * 3.6e6, D = 864e5;
function legacyRises(s: Seed, seeds: Seed[], from: number, to: number, rank: (s: Seed, seeds: Seed[], now: number) => number) {
  const out = new Map<number, number[]>();
  let prev = rank(s, seeds, from);
  for (let t = from + STEP, i = 1; ; t += STEP, i++) {
    const now = Math.min(t, to), rk = rank(s, seeds, now);
    for (let k = prev + 1; k <= rk; k++) out.set(i, [...(out.get(i) ?? []), k]);
    prev = Math.max(prev, rk);
    if (now >= to) break;
  }
  return out;
}
const s: Seed = { id: "c1", name: "Test", owner: "o", x: 320, y: 440, hue: 30, created_at: "2026-01-01T00:00:00Z" };
const t0 = Date.parse(s.created_at);
/** A rank curve given as the step moments at which ranks 1…5 are reached (never falling back). */
const curve = (from: number, ups: number[]) => (_: Seed, __: Seed[], now: number) => ups.filter((u) => now >= from + u * STEP).length;

describe("chronicle rank rises", () => {
  it("match the old step-by-step loop for every non-falling rank curve", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let run = 0; run < 400; run++) {
      const from = t0 + Math.floor(rnd() * 50) * D + rnd() * 1000, to = from + rnd() * 130 * D;
      const ups = Array.from({ length: 5 }, () => Math.floor(rnd() * 560) - 40).sort((a, b) => a - b);
      const rank = curve(from, ups);
      expect(rankRises(s, [s], from, to, rank)).toEqual(legacyRises(s, [s], from, to, rank));
    }
  });
  it("asks townRank twice when the rank stays, and about log2(480) times per rank gained", () => {
    let calls = 0;
    const from = t0, to = t0 + 120 * D, still = curve(from, [-1, 9999, 9999, 9999, 9999]), rising = curve(from, [-1, 30, 200, 201, 470]);
    rankRises(s, [s], from, to, (...a) => (calls++, still(...a)));
    expect(calls).toBe(2);
    calls = 0;
    rankRises(s, [s], from, to, (...a) => (calls++, rising(...a)));
    expect(calls).toBeLessThanOrEqual(2 + 4 * 9);
  });
  it("a rank gained and lost again inside the window is not reported (the old loop did)", () => {
    const from = t0, to = t0 + 30 * D, dip = (_: Seed, __: Seed[], now: number) => (now >= from + 40 * STEP && now < from + 80 * STEP ? 3 : 2);
    expect(legacyRises(s, [s], from, to, dip).size).toBe(1);
    expect(rankRises(s, [s], from, to, dip).size).toBe(0);
  });
  it("gives the same chronicle as the old loop for a real growing village", () => {
    for (const [a, b] of [[0, 30], [0, 120], [20, 24], [60, 75]] as const) {
      const from = t0 + a * D, to = t0 + b * D;
      expect(rankRises(s, [s], from, to)).toEqual(legacyRises(s, [s], from, to, townRank));
    }
    expect(chronicle(s, [s], t0, t0 + 30 * D).events.filter((e) => e.code === "stage").length).toBeGreaterThan(0);
  });
});

import { taxBetween, taxEarned } from "./economy";
describe("chronicle taler", () => {
  it("taxBetween equals taxEarned(to) − taxEarned(from) for any window", () => {
    const owned: Seed = { ...s, id: "c2", user_id: "u", created_at: new Date(Date.parse("2026-11-12T00:00:00Z") - 20 * D).toISOString() };
    for (const v of [s, owned]) for (const [a, b] of [[0, 30], [3.4, 9.9], [19.5, 40.25], [0, 0.5]] as const) {
      const c0 = Date.parse(v.created_at), from = c0 + a * D, to = c0 + b * D;
      expect(taxBetween(v, from, to, [v])).toBe(taxEarned(v, to, [v]) - taxEarned(v, from, [v]));
    }
  });
});
