import { streetHouse } from "./street-layout";
import { structureAt, FLAT, FOOT2, type Kind, type Seed, type Structure } from "./world";
import { townOf, type Person } from "./people";
import { rebuildAt } from "./disasters";

const LOW: ReadonlySet<string> = new Set(["coop", "hut", "well", "hay", "fence", "campfire", "stall", "garden", "field", "market", "pasture", "herbhut"]);

/** Paved open ground: a tap here means the ground itself, never a roof from the tile in front. */
const PAVED: ReadonlySet<string> = new Set(["square", "street", "path", "road", "avenue", "bridge"]);
/** Only really tall buildings reach two tiles back on screen. */
const TALL: ReadonlySet<string> = new Set(["church", "factory", "cathedral", "belfry", "townhall", "seat3", "patrician", "steinhaus", "fachwerk", "guildtower", "lighthouse", "university", "opera", "exchange", "beginenhof", "orangery"]);

/** Tiles in front of the click to try, nearest first; offsets beyond [2,2] only match 2×2 ensembles (their sprite covers them). */
const INSPECT_OFFSETS: readonly (readonly [number, number])[] = [
  [0, 0], [1, 1], [1, 0], [0, 1], [2, 2],
  [2, 1], [1, 2], [2, 0], [0, 2], [3, 1], [1, 3], [3, 2], [2, 3], [3, 3], [4, 2], [2, 4], [3, 4], [4, 3],
];

/** True when a 2×2 ensemble's wide sprite is painted over this tile (so a tap means the building, not the ground). */
export function ensembleOver(x: number, y: number, seeds: Seed[], now: number): boolean {
  for (const [dx, dy] of INSPECT_OFFSETS) {
    const st = structureAt(x + dx, y + dy, seeds, now);
    if (st && FOOT2.has(st.kind) && st.build === undefined) return true;
  }
  return false;
}

export type Inspect = {
  x: number; y: number; kind: Kind; seed: Seed; build: number | null; doneAt: number | null; residents: Person[]; workers: Person[];
  /** "f" / "w" while this site is a rebuild after a fire / flood (doneAt then is the end of that rebuild) */
  rebuild: "f" | "w" | null;
};

/** Building or site under a click. Sprites rise above their tile, so tiles in front (+x/+y) are tried too. */
export function inspectAt(x: number, y: number, seeds: Seed[], now: number): Inspect | null {
  for (const [dx, dy] of INSPECT_OFFSETS) {
    let tx = x + dx, ty = y + dy;
    let st = structureAt(tx, ty, seeds, now);
    // the paved back tiles of a 2×2 ensemble belong to the building on its front tile
    const owner = st?.kind === "square" ? ensembleFront(tx, ty, st, seeds, now) : null;
    if (owner) { tx = owner[0]; ty = owner[1]; st = owner[2]; }
    if (!dx && !dy && st && PAVED.has(st.kind)) return null;
    // wide 2×2 ensembles paint up to four tiles back; ordinary tall houses reach two
    if ((dx > 2 || dy > 2 || dx !== dy) && (dx >= 2 || dy >= 2) && st && !FOOT2.has(st.kind)) continue;
    if (dx === 2 && dy === 2 && st && !TALL.has(st.kind)) continue;
    // a click on an own garden/pasture opens it, never the roof of a neighbour
    const own = !dx && !dy && !!st && LOW.has(st.kind);
    if (!st || (!own && FLAT.has(st.kind) && st.kind !== "market" && st.kind !== "field")) continue;
    // low things have no roof rising over tiles in front: only a click on their own tile counts
    if ((dx || dy) && LOW.has(st.kind)) continue;
    const people = townOf(st.seed, seeds, now).people;
    const near = (t: [number, number] | null, r: number) => !!t && Math.abs(t[0] - tx) <= r && Math.abs(t[1] - ty) <= r;
    const build = st.build === undefined ? null : st.build;
    const ruin = build !== null && !st.fire ? rebuildAt(st.seed, tx, ty, now) : null;
    return {
      x: tx, y: ty, kind: st.kind, seed: st.seed, build, doneAt: ruin ? now + ruin.left : (st.doneAt ?? null), rebuild: ruin?.kind ?? null,
      residents: build === null ? people.filter((p) => p.home[0] === tx && p.home[1] === ty) : [],
      workers: people.filter((p) => p.home !== p.work && near(p.work, build === null ? 0 : 1.5) && (build === null || p.job === "builder")),
    };
  }
  return null;
}

/** Front tile of the 2×2 ensemble whose paved back tile this is (same village), else null. */
function ensembleFront(x: number, y: number, sq: Structure, seeds: Seed[], now: number): [number, number, Structure] | null {
  for (const [i, j] of [[1, 0], [0, 1], [1, 1]] as const) {
    const f = structureAt(x + i, y + j, seeds, now);
    if (f && FOOT2.has(f.kind) && f.seed.id === sq.seed.id) return [x + i, y + j, f];
  }
  return null;
}

/** Kind as painted on the map (street-front repaint included), so the Schaukasten only opens a diorama matching what the player sees. Paint-only, never used for mechanics. */
/** Same street set as render.ts PATHLIKE (keep equal). */
const STREETISH: ReadonlySet<string> = new Set(["path", "street", "square", "well", "market", "road", "bridge", "avenue"]);
export function paintedKind(ins: Inspect, seeds: Seed[], now: number): Kind {
  const st = structureAt(ins.x, ins.y, seeds, now);
  if (!st) return ins.kind;
  return streetHouse(st, ins.x, ins.y, (rx, ry) => { const k = structureAt(rx, ry, seeds, now)?.kind; return !!k && STREETISH.has(k); }).kind;
}
