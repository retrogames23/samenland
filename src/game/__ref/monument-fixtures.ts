/* Test-only fixtures (never imported by the game) for monument-chain-identity tests. */
import {
  monumentChain, stepsDone, stepsPaid, guildtowerDone, specialDone, monumentProgress, lighthouseDone, cathedralDone, universityDone,
  schuettingDone, operaDone, careFoodExtra, seaWays, withChainMemo, chainMemoCfg, MONUMENT_KEYS, type Seed, type CharterPath,
} from "../world";
import { workClock, type Realm } from "../time";

/**
 * Test-only fixtures for the identity of the monument-chain memo (world.ts withChainMemo) with the plain computation (chainMemoCfg.on = false):
 * every function below is evaluated once inside one memo scope (many repeated and non-chronological queries share it)
 * and once on the reference path; all timestamps and tax figures must be exactly equal.
 */
export const DAY = 864e5, H = 3.6e6;
export const C0 = Date.parse("2025-10-01T00:00:00Z");

type Buy = [item: string, day: number];
export function town(id: string, at: readonly [number, number], charter: CharterPath | null, buys: Buy[], realm: Realm = "europe"): Seed[] {
  const [x, y] = at;
  const s: Seed = { id, name: id, owner: "t", x, y, hue: 0, realm, user_id: "u-" + id, created_at: new Date(C0).toISOString(),
    ...(charter ? { charter: { path: charter, at: C0 + DAY } } : {}),
    bought: buys.map(([item, d]) => ({ item, at: C0 + Math.round(d * DAY) })),
    roads: [{ target: "nb1", at: C0 + 14 * DAY }, { target: "nb2", at: C0 + 45 * DAY }], civicRoads: [{ at: C0 + 14 * DAY }, { at: C0 + 45 * DAY }] };
  const nb = (nid: string, dx: number): Seed => ({ id: nid, name: nid, owner: "nb", x: x + dx, y, hue: 0, realm, created_at: new Date(C0 - 60 * DAY).toISOString() });
  return [s, nb("nb1", 15), nb("nb2", -15)];
}
export const steps = (k: string, n: number, d: number, gap = 0): Buy[] => Array.from({ length: n }, (_, i) => [`${k}${i + 1}`, d + i * gap] as Buy);
export const care: Buy[] = [["hunter", 1], ["herbs", 1], ["fisher", 2], ["granary", 3], ["healer", 5], ["backhaus", 8], ["dairy", 30], ["markethall", 60], ["guildhall", 70], ["library", 90], ["school", 100]];
/** Purchase days around the 2026 DST switches (Berlin 29 Mar / 25 Oct, US 8 Mar / 1 Nov) and Bauhütte/Freimarkt windows. */
export const SPRING = (Date.parse("2026-03-29T00:30:00Z") - C0) / DAY, AUTUMN = (Date.parse("2026-10-25T00:45:00Z") - C0) / DAY, US = (Date.parse("2026-03-08T09:30:00Z") - C0) / DAY;
export type Scenario = { name: string; seeds: () => Seed[] };
/** Way monuments are exclusive per town way (harvest: grain, guildtower: workshop, lighthouse: gateway). */
export const SCENARIOS: Scenario[] = [
  { name: "craft workshop light: Zunftturm, belfry, theater, orangery with Bauhütte, Freimarkt, woodcamp, Herberge, rank2", seeds: () => town("c2", [166, 613], "craft", [
    ...care, ["woodcamp", 20], ["herberge", 25], ["rank2", 40], ["bauhuette1", 1], ["bauhuette2", 150.25], ["bauhuette3", SPRING - 0.5], ["bauhuette4", AUTUMN], ["freimarkt1", 151.5], ["freimarkt2", SPRING + 0.1], ["freimarkt3", AUTUMN + 0.3],
    ...steps("guildtower", 3, 150, 0.4), ...steps("belfry", 4, 150.1, 0), ...steps("theater", 3, 152, 1.3), ...steps("orangery", 3, AUTUMN - 0.2, 0.1)]) },
  { name: "trade gateway: lighthouse, Schütting, Artushof (guarded chains), purchases out of order", seeds: () => town("t1", [200, 200], "trade", [
    ...care.slice().reverse(), ["smokehouse", 120], ["saltquay", 121],
    ["exchange3", 260], ["lighthouse2", 251], ["exchange1", 250], ["lighthouse1", 250], ["opera2", 300], ["exchange2", 255], ["lighthouse3", 251], ["opera1", 300], ["exchange4", 262], ["opera4", 302], ["opera3", 301],
    ["bauhuette1", 249.9], ["freimarkt1", 250.4], ["freimarkt2", 258]]) },
  { name: "farm grain: Erntedankhalle, Dom, Universität, Orangerie, Schütting without modifiers", seeds: () => town("f1", [500, 340], "farm", [
    ...care, ...steps("harvest", 3, 134, 1), ...steps("cathedral", 5, 360, 1), ...steps("university", 4, 360, 1), ...steps("exchange", 4, 360, 1), ...steps("orangery", 3, 360, 1)]) },
  { name: "culture village: belfry and theater bought the same moment, no charter modifiers", seeds: () => town("k1", [500, 340], "culture", [
    ...care.slice(0, 5), ...steps("belfry", 4, 90, 0), ...steps("theater", 3, 90, 0), ["guildtower1", 95]]) },
];
/** Heaviest case (Testebene 3 only): craft workshop town with all seven general monuments plus Zunftturm and every
 *  build-speed modifier; the plain computation needs ~5 s per stepsDone here. */
export const HEAVY: Scenario = { name: "craft workshop heavy: seven general monuments, Zunftturm, Bauhütte, Freimarkt, woodcamp, Herberge, rank2", seeds: () => town("c1", [166, 613], "craft", [
  ...care, ["woodcamp", 20], ["herberge", 25], ["rank2", 40], ["bauhuette1", 1], ["bauhuette2", 150.25], ["bauhuette3", SPRING - 0.5], ["bauhuette4", AUTUMN], ["freimarkt1", 151.5], ["freimarkt2", SPRING + 0.1], ["freimarkt3", AUTUMN + 0.3],
  ...steps("guildtower", 3, 150, 0.4), ...steps("belfry", 4, 150.1, 0), ...steps("theater", 3, 152, 1.3), ...steps("cathedral", 5, SPRING, 0.2), ...steps("university", 4, SPRING + 0.05, 0),
  ...steps("exchange", 4, US, 2), ...steps("orangery", 3, AUTUMN - 0.2, 0.1), ...steps("opera", 4, AUTUMN + 1, 0)]) };

/** Query times (at most `max`): reference finish times ±1 ms and step starts first, then purchase times ±, random
 *  times; shuffled and partly repeated in reverse order. */
export function times(s: Seed, max = 90): number[] {
  const ts: number[] = [], late: number[] = [];
  chainMemoCfg.on = false;
  for (const k of MONUMENT_KEYS) for (const c of monumentChain(s, k)) ts.push(c.done - 1, c.done, c.start);
  chainMemoCfg.on = true;
  for (const b of s.bought ?? []) late.push(b.at - 1, b.at, b.at + H);
  let r = 12345;
  const rnd = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 12; i++) late.push(C0 + Math.floor(rnd() * 420 * DAY));
  let out = [...new Set(ts)];
  if (out.length > max * 0.7) out = out.filter((_, i) => i % Math.ceil(out.length / (max * 0.7)) === 0);
  const rest = [...new Set(late)].filter((t) => !out.includes(t));
  out = out.concat(rest.filter((_, i) => i % Math.max(1, Math.ceil(rest.length / (max - out.length))) === 0));
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j]!, out[i]!]; }
  return [...out, ...out.slice(0, 20).reverse()];
}
/** Everything the brief names, for one time; specialDone with the full map and the town alone. */
export function probe(seeds: Seed[], t: number) {
  const s = seeds[0]!;
  return {
    wc: workClock(t), gt: guildtowerDone(s, t), sd: specialDone(s, [s], t), sdAll: specialDone(s, seeds, t), sea: seaWays(s, t), food: careFoodExtra(s, t),
    light: lighthouseDone(s, t), dom: cathedralDone(s, t), uni: universityDone(s, t), ex: schuettingDone(s, t), op: operaDone(s, t),
    m: MONUMENT_KEYS.map((k) => ({ k, chain: monumentChain(s, k, t), steps: stepsDone(s, k, t), paid: stepsPaid(s, k, t), prog: monumentProgress(s, t, k) })),
  };
}
export function both<T>(f: () => T): { memo: T; ref: T; hits: number } {
  chainMemoCfg.on = true; const h0 = chainMemoCfg.hits;
  const memo = withChainMemo(f);
  const hits = chainMemoCfg.hits - h0;
  chainMemoCfg.on = false;
  try { return { memo, ref: f(), hits }; } finally { chainMemoCfg.on = true; }
}

