import { worldHour } from "./time";
import { hash, terrain, isWater, structureAt, MAP, type Seed } from "./world";
import { treeKind } from "./biome";
import { seasonAt } from "./season";

export type FarmAnimal = "pig" | "goose" | "goat";
/** September–November, following the same shared seasonal calendar as the painted trees. */
export const mastSeason = (now: number) => seasonAt(now).autumn >= 0.5;
export function farmAnimalKind(f: { free: boolean; nearVillage: boolean; oak: boolean; shore: boolean; hutBeside: boolean; autumn: boolean }): FarmAnimal | null {
  if (!f.free || !f.nearVillage) return null;
  if (f.hutBeside) return "goat";
  if (f.shore) return "goose";
  return f.oak && f.autumn ? "pig" : null;
}
/** Sparse tile-local dressing; no town scan, no stored herd and no economic inputs. */
export function farmAnimalsAt(x: number, y: number, seeds: Seed[], now: number, ponds?: Set<number>): FarmAnimal | null {
  if (animalsSleeping(now) || hash(x, y, 1510) >= 0.12) return null;
  if (!seeds.some(s => Math.hypot(x - s.x, y - s.y) <= 18)) return null;
  const tr = terrain(x, y);
  if (isWater(tr) || tr === "mountain" || structureAt(x, y, seeds, now) || ponds?.has(y * MAP + x)) return null;
  const open = tr !== "forest";
  let shore = false, hutBeside = false;
  if (open) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]] as const) {
    const nx = x + dx, ny = y + dy;
    shore ||= isWater(terrain(nx, ny)) || !!ponds?.has(ny * MAP + nx);
    const st = structureAt(nx, ny, seeds, now);
    // Only one possible goat tile per hut: its open southern neighbour, selected by the hut hash.
    hutBeside ||= dy === -1 && st?.kind === "hut" && st.build === undefined && !st.flood && hash(nx, ny, 1511) < 0.45;
  }
  // mast pigs keep to the wood's edge near the village, never deep inside the forest
  const edge = tr === "forest" && ([[1, 0], [0, 1], [-1, 0], [0, -1]] as const).some(([dx, dy]) => { const n = terrain(x + dx, y + dy); return n !== "forest" && !isWater(n) && n !== "mountain"; });
  const oak = edge && treeKind(hash(x, y, 18), 0.6) === "oak";
  return farmAnimalKind({ free: true, nearVillage: true, oak, shore, hutBeside, autumn: mastSeason(now) });
}

/** Gentle daytime grazing/steps within one open tile. Frame cadence is tied to distance, not bobbing. */
export function farmAnimalPose(sd: number, k: number, now: number) {
  const p = sheepPose(sd, k, now);
  return { ...p, frame: p.walking ? Math.floor(now / 240 + k) & 3 : 1 };
}

/** Share of lowland pastures grazed by cattle (Hallenhaus country c. 1500); the rest keep sheep. */
export const COW_SHARE = 0.65;
/** Which herd grazes a pasture tile: slopes and lean sand keep sheep, lowland mostly cattle. Display only. */
export function herdAt(x: number, y: number): "cow" | "sheep" {
  const t = terrain(x, y);
  if (t === "hill" || t === "sand" || t === "mountain") return "sheep";
  return hash(x, y, 1509) < COW_SHARE ? "cow" : "sheep";
}

/** Shared realm night: sheep rest from 21:00 through 05:59, never the viewer's local time. */
export function animalsSleeping(now: number): boolean {
  const hour = worldHour(now);
  return hour >= 21 || hour < 6;
}

/** Pure sheep routine in screen-space offsets; frozen at dusk throughout the night. */
export function sheepPose(sd: number, k: number, now: number) {
  const sleeping = animalsSleeping(now), hr = worldHour(now);
  const elapsed = hr >= 21 ? hr - 21 : hr + 3;
  const t = sleeping ? now - elapsed * 3.6e6 : now;
  // long calm grazing stops, then an unhurried walk of a visible distance to the next tuft
  const cycle = 16000 + hash(sd, k, 5) * 12000, walkMs = 3500 + hash(sd, k, 6) * 1500;
  const tt = t + hash(sd, k, 7) * cycle, i = Math.floor(tt / cycle), u = tt - i * cycle;
  // each sheep keeps its own zone of the pasture so the flock never stacks, but roams it widely
  const lx = (k - 1) * 5, ly = (k % 2 ? 1.4 : -0.8);
  const spot = (j: number): [number, number] => {
    let x = lx + (hash(sd, k * 31 + j, 8) - 0.5) * 6, y = ly + (hash(sd, k * 31 + j, 9) - 0.5) * 3.6;
    const r = Math.abs(x) / 10.5 + Math.abs(y) / 5.2; // stay inside the fenced rhombus
    if (r > 1) { x /= r; y /= r; }
    return [x, y];
  };
  const a = spot(i), b = spot(i + 1), into = u - (cycle - walkMs);
  if (into > 0) {
    const f = into / walkMs, e = f * f * (3 - 2 * f);
    return { dx: a[0] + (b[0] - a[0]) * e, dy: a[1] + (b[1] - a[1]) * e, walking: !sleeping, flip: b[0] < a[0], graze: false, sleeping };
  }
  const prev = spot(i - 1);
  // head down most of the stop; now and then it lifts its head for a few seconds to chew and look round
  return { dx: a[0], dy: a[1], walking: false, flip: a[0] < prev[0], graze: !sleeping && Math.sin(u / 4200 + k * 1.7) <= 0.9, sleeping };
}