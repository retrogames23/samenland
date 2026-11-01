/** Settlement rank judged from what actually stands and lives in a town — never from the clock. */
export type RankInput = { citizens: number; homes: number; roads: number };
/** [citizens, occupied dwellings, finished trade roads] needed for Weiler … Metropole. */
export const RANK_NEED: readonly [number, number, number][] = [
  [15, 4, 0], [40, 10, 0], [80, 25, 0], [150, 45, 1], [300, 90, 2],
];
export function rankOf({ citizens, homes, roads }: RankInput) {
  let r = 0;
  for (const [c, h, rd] of RANK_NEED) { if (citizens >= c && homes >= h && roads >= rd) r++; else break; }
  return r;
}
/** What is still missing for the next rank (null at Metropole). */
export function nextRankNeed(i: RankInput) {
  const need = RANK_NEED[rankOf(i)];
  if (!need) return null;
  return { citizens: Math.max(0, need[0] - i.citizens), homes: Math.max(0, need[1] - i.homes), roads: Math.max(0, need[2] - i.roads) };
}

import { townOf, citizensOf } from "./people";
import { links, type Seed } from "./world";
/** Each resident family occupies one dwelling, including separate floors of the same house. */
export function rankInput(s: Seed, seeds: Seed[], now: number): RankInput {
  const c = citizensOf(townOf(s, seeds, now));
  const homes = new Set(c.map((p) => p.hh ?? p.home[0] * 1024 + p.home[1])).size;
  const roads = links(seeds).filter((l) => (l.a.id === s.id || l.b.id === s.id) && now >= l.since).length;
  return { citizens: c.length, homes, roads };
}
export const townRank = (s: Seed, seeds: Seed[], now: number) => rankOf(rankInput(s, seeds, now));
