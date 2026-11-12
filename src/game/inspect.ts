import { structureAt, FLAT, type Kind, type Seed } from "./world";
import { townOf, type Person } from "./people";

const LOW: ReadonlySet<string> = new Set(["coop", "hut", "well", "hay", "fence", "campfire", "stall", "garden", "field", "market", "pasture", "herbhut"]);

/** Paved open ground: a tap here means the ground itself, never a roof from the tile in front. */
const PAVED: ReadonlySet<string> = new Set(["square", "street", "path", "road", "avenue", "bridge"]);
/** Only really tall buildings reach two tiles back on screen. */
const TALL: ReadonlySet<string> = new Set(["church", "factory", "cathedral", "belfry", "townhall", "seat3", "patrician", "steinhaus", "fachwerk", "guildtower", "lighthouse", "university", "opera", "exchange"]);

export type Inspect = { x: number; y: number; kind: Kind; seed: Seed; build: number | null; doneAt: number | null; residents: Person[]; workers: Person[] };

/** Building or site under a click. Sprites rise above their tile, so tiles in front (+x/+y) are tried too. */
export function inspectAt(x: number, y: number, seeds: Seed[], now: number): Inspect | null {
  for (const [dx, dy] of [[0, 0], [1, 1], [1, 0], [0, 1], [2, 2]] as const) {
    const tx = x + dx, ty = y + dy;
    const st = structureAt(tx, ty, seeds, now);
    if (!dx && !dy && st && PAVED.has(st.kind)) return null;
    if (dx === 2 && st && !TALL.has(st.kind)) continue;
    // a click on an own garden/pasture opens it, never the roof of a neighbour
    const own = !dx && !dy && !!st && LOW.has(st.kind);
    if (!st || (!own && FLAT.has(st.kind) && st.kind !== "market" && st.kind !== "field")) continue;
    // low things have no roof rising over tiles in front: only a click on their own tile counts
    if ((dx || dy) && LOW.has(st.kind)) continue;
    const people = townOf(st.seed, seeds, now).people;
    const near = (t: [number, number] | null, r: number) => !!t && Math.abs(t[0] - tx) <= r && Math.abs(t[1] - ty) <= r;
    const build = st.build === undefined ? null : st.build;
    return {
      x: tx, y: ty, kind: st.kind, seed: st.seed, build, doneAt: st.doneAt ?? null,
      residents: build === null ? people.filter((p) => p.home[0] === tx && p.home[1] === ty) : [],
      workers: people.filter((p) => p.home !== p.work && near(p.work, build === null ? 0 : 1.5) && (build === null || p.job === "builder")),
    };
  }
  return null;
}
