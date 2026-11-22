/**
 * River current (display only). Flow direction per river tile comes from the water path to the sea: a breadth-first
 * distance from open sea through river water (riverDistAt < 0), so every reach — tributaries included — points
 * downstream along its own course. The live overlay in render.ts draws streaks and glints that drift along it.
 * Never changes rivers, terrain, floods or anything mechanical; recomputed only when the map geometry changes.
 */
import { MAP, hash, isWater, onGeoChange, riverDistAt, terrain, vnoise } from "./world";

export const FLOW_BLOCK = 16;
const NB8: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
let seaDist: Uint16Array | null = null;
let blocks: Map<number, Int32Array> | null = null;
const flowCache = new Map<number, [number, number] | null>();
onGeoChange(() => { seaDist = null; blocks = null; flowCache.clear(); });

const isRiver = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP && y < MAP && riverDistAt(x, y) < 0 && isWater(terrain(x, y));
const isSea = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP && y < MAP && isWater(terrain(x, y)) && riverDistAt(x, y) >= 0;

/** Steps along river water to the open sea (0 = sea, 65535 = not river water or not connected). Built once per map. */
function field(): Uint16Array {
  if (seaDist) return seaDist;
  const d = new Uint16Array(MAP * MAP).fill(65535), q = new Int32Array(MAP * MAP);
  let head = 0, tail = 0;
  const idx = new Map<number, number[]>();
  for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
    if (!isRiver(x, y)) continue;
    const b = Math.floor(y / FLOW_BLOCK) * 4096 + Math.floor(x / FLOW_BLOCK);
    let l = idx.get(b); if (!l) idx.set(b, (l = [])); l.push(y * MAP + x);
    for (const [dx, dy] of NB8) if (isSea(x + dx, y + dy)) { d[y * MAP + x] = 1; q[tail++] = y * MAP + x; break; }
  }
  while (head < tail) {
    const k = q[head++]!, x = k % MAP, y = (k / MAP) | 0, nd = d[k]! + 1;
    for (const [dx, dy] of NB8) {
      const nx = x + dx, ny = y + dy, nk = ny * MAP + nx;
      if (nx < 0 || ny < 0 || nx >= MAP || ny >= MAP || d[nk]! <= nd || !isRiver(nx, ny)) continue;
      d[nk] = nd; q[tail++] = nk;
    }
  }
  blocks = new Map([...idx].map(([b, l]) => [b, Int32Array.from(l)]));
  return (seaDist = d);
}
/** Steps along river water to the open sea (test/diagnostics; 65535 = none). */
export const seaStepsAt = (x: number, y: number) => field()[y * MAP + x]!;
/** River tiles of one 16×16 block (k = y·MAP + x), so the overlay visits only water in view. */
export function riverBlock(bx: number, by: number): Int32Array | undefined {
  field(); return blocks!.get(by * 4096 + bx);
}
/** Unit downstream direction in tile coordinates for a river tile, smoothed over its neighbourhood so the current
 *  follows the course instead of the tile grid; null where no connected river water is. */
export function riverFlow(x: number, y: number): [number, number] | null {
  const k = y * MAP + x, hit = flowCache.get(k); if (hit !== undefined) return hit;
  const d = field(); let out: [number, number] | null = null;
  if (d[k]! < 65535) {
    let vx = 0, vy = 0;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      const cx = x + i, cy = y + j; if (cx < 0 || cy < 0 || cx >= MAP || cy >= MAP) continue;
      const c = d[cy * MAP + cx]!; if (c === 65535) continue;
      for (const [dx, dy] of NB8) {
        const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= MAP || ny >= MAP) continue;
        const n = isSea(nx, ny) ? 0 : d[ny * MAP + nx]!; if (n === 65535) continue;
        const l = Math.hypot(dx, dy); vx += ((c - n) * dx) / l; vy += ((c - n) * dy) / l;
      }
    }
    const l = Math.hypot(vx, vy); if (l > 1e-6) out = [vx / l, vy / l];
  }
  if (flowCache.size > 60_000) flowCache.clear();
  flowCache.set(k, out); return out;
}

/** Current speed in tiles per second: calm at the banks, fastest mid-stream, gently varying along the river. */
export function flowSpeed(x: number, y: number, bank: number): number {
  const mid = Math.min(1, Math.max(0, -bank / 1.4));
  return (0.18 + 0.3 * mid) * (0.8 + 0.4 * vnoise(x / 11, y / 11, 977));
}

export const STREAKS = 3, TRAVEL = 1.8;
/** One streak of a river tile at time t (ms): where it is (tile coords, along the flow), how visible (0..1, fading in
 *  and out at both ends of its run so nothing pops), and its lateral offset. Each run starts at a new lateral spot,
 *  so the same place never repeats on a fixed beat. */
export function streakAt(x: number, y: number, i: number, t: number, speed: number, flow: [number, number], room = 1): { px: number; py: number; a: number } {
  const cyc = (t / 1000) * speed / TRAVEL + hash(x, y, 980 + i), n = Math.floor(cyc), ph = cyc - n;
  const lat = (hash(x * 31 + n, y, 990 + i) - 0.5) * 0.9 * Math.min(1, Math.max(0, room)), along = (hash(x, y * 17 + n, 995 + i) - 0.5) * 0.5 + (ph - 0.5) * TRAVEL;
  const [fx, fy] = flow;
  return { px: x + fx * along - fy * lat, py: y + fy * along + fx * lat, a: Math.sin(Math.PI * ph) };
}
/** Slowly drifting light/dark patches carried by the current (0..1): streaks gather in moving bands, never a uniform grid. */
export function flowPatch(x: number, y: number, t: number, flow: [number, number], speed: number): number {
  const s = (t / 1000) * speed * 0.55;
  return vnoise((x - flow[0] * s) / 3.2, (y - flow[1] * s) / 3.2, 983);
}
/** Zoom density 0..1 for one streak: far zooms keep fewer streaks; a soft edge fades streaks in/out while zooming. */
export function zoomKeep(x: number, y: number, i: number, keep: number): number {
  return Math.min(1, Math.max(0, (keep - hash(x, y, 1000 + i)) / 0.12));
}

/** Per-block static data for the overlay, built once: tile coords, downstream direction, speed and free water to the
 *  nearest bank (tiles) of every river tile — crests never reach onto the sand. */
export type FlowBlock = { n: number; x: Int16Array; y: Int16Array; fx: Float32Array; fy: Float32Array; sp: Float32Array; room: Float32Array };
const blockData = new Map<number, FlowBlock | null>();
onGeoChange(() => blockData.clear());
export function flowBlock(bx: number, by: number): FlowBlock | null {
  const key = by * 4096 + bx, hit = blockData.get(key); if (hit !== undefined) return hit;
  const ks = riverBlock(bx, by); let out: FlowBlock | null = null;
  if (ks?.length) {
    const xs: number[] = [], ys: number[] = [], fxs: number[] = [], fys: number[] = [], sps: number[] = [], rooms: number[] = [];
    for (const k of ks) {
      const x = k % MAP, y = (k / MAP) | 0, bank = riverDistAt(x, y), f = riverFlow(x, y);
      if (!f || bank > -0.15) continue; // the wet rim stays calm: no streaks running onto the sand
      xs.push(x); ys.push(y); fxs.push(f[0]); fys.push(f[1]); sps.push(flowSpeed(x, y, bank)); rooms.push(-bank - 0.25);
    }
    if (xs.length) out = { n: xs.length, x: Int16Array.from(xs), y: Int16Array.from(ys), fx: Float32Array.from(fxs), fy: Float32Array.from(fys), sp: Float32Array.from(sps), room: Float32Array.from(rooms) };
  }
  blockData.set(key, out); return out;
}
