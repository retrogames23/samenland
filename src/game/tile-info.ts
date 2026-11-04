// Pure hover facts for one tile: what is there, which animals live on it, and its effect on play.
import { terrain, isWater, riverDistAt, resourceAt, structureAt, type Seed, type Terrain } from "./world";
import { isDen, denOk, denBeast } from "./wildlife";
import { worldHour } from "./time";

const WILD_OK = new Set(["forest", "meadow", "grass", "hill", "fertile"]);
import { townOf } from "./people";
import type { Animal, Effect } from "./lang/tileinfo";

export type TileFacts = { terrain: Terrain; kind: string | null; seed: string | null; animals: Animal[]; effects: Effect[] };

export function tileFacts(x: number, y: number, seeds: Seed[], now: number, planted: boolean): TileFacts {
  const t = terrain(x, y), st = structureAt(x, y, seeds, now);
  const kind = planted ? null : st?.kind ?? null;
  const animals = new Set<Animal>();
  const hr = worldHour(now);
  if (hr >= 5.5 && hr <= 20.5) {
    // only animals standing on this very tile right now (same position the map draws)
    const free = (a: number, b: number) => WILD_OK.has(terrain(a, b)) && !structureAt(a, b, seeds, now);
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      const dx = x + i, dy = y + j;
      if (!isDen(dx, dy) || !denOk(dx, dy, free)) continue;
      const b = denBeast(dx, dy, now, free);
      if (Math.round(b.x) === x && Math.round(b.y) === y) animals.add(b.boar ? "boar" : "deer");
    }
  }
  if (kind === "pasture" && st && st.build === undefined && st.v > 0.35) animals.add("sheep");
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
