/** Settlement rank judged from what actually stands and lives in a town — never from the clock. */
export type RankInput = { citizens: number; homes: number; roads: number };
/** [citizens, occupied homes, finished trade roads] needed for Weiler … Metropole. */
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
