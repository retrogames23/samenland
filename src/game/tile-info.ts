// Pure hover facts for one tile: what is there, which animals live on it, and its effect on play.
import { terrain, isWater, riverDistAt, resourceAt, structureAt, type Seed, type Terrain } from "./world";
import { isDen, isBoar } from "./wildlife";
import { townOf } from "./people";
import type { Animal, Effect } from "./lang/tileinfo";

export type TileFacts = { terrain: Terrain; kind: string | null; seed: string | null; animals: Animal[]; effects: Effect[] };

export function tileFacts(x: number, y: number, seeds: Seed[], now: number, planted: boolean): TileFacts {
  const t = terrain(x, y), st = structureAt(x, y, seeds, now);
  const kind = planted ? null : st?.kind ?? null;
  const animals = new Set<Animal>();
  if (!kind || kind === "field" || kind === "pasture") {
    // a den's animal roams its own tile and the eight neighbours
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (isDen(x + i, y + j) && !isWater(terrain(x + i, y + j))) animals.add(isBoar(x + i, y + j) ? "boar" : "deer");
  }
  if (kind === "pasture") animals.add("sheep");
  if (kind === "coop") animals.add("hen");
  const sd = st?.seed ?? null;
  if (sd && townOf(sd, seeds, now).cows.some(([cx, cy]) => cx === x && cy === y)) animals.add("cow");
  const fx: Effect[] = [];
  if (planted) fx.push("planted");
  if (t === "mountain" || t === "deep") fx.push("noBuild");
  else if (t === "water") fx.push("fish", "noBuild");
  else if (t === "hill") fx.push("slope");
  else if (t === "forest") fx.push("wood");
  else if (t === "fertile") fx.push("fertile");
  if (!isWater(t) && riverDistAt(x, y) >= 0 && riverDistAt(x, y) < 1.5) fx.push("shore");
  if (resourceAt(x, y) === "stone") fx.push("stone");
  return { terrain: t, kind, seed: sd?.name ?? null, animals: [...animals], effects: fx };
}
