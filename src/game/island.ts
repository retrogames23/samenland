import { terrain, buildable } from "./world";
/** Below this many connected land tiles a founding spot counts as a remote islet (warning only, never a block). */
export const ISLE_MIN = 1500;
/** Size of the 4-connected buildable landmass at (x, y), counted up to `cap` tiles — pure from terrain. */
export function landmassSize(x: number, y: number, cap = ISLE_MIN): number {
  if (!buildable(terrain(x, y))) return 0;
  const seen = new Set<number>([y * 4096 + x]), st: [number, number][] = [[x, y]];
  while (st.length && seen.size < cap) {
    const [cx, cy] = st.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + dx, ny = cy + dy, k = ny * 4096 + nx;
      if (nx < 0 || ny < 0 || nx >= 1024 || ny >= 1024 || seen.has(k) || !buildable(terrain(nx, ny))) continue;
      seen.add(k); st.push([nx, ny]);
    }
  }
  return seen.size;
}
export const remoteIsle = (x: number, y: number) => landmassSize(x, y) < ISLE_MIN;
