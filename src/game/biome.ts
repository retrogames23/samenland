import type { Realm } from "./time";

/**
 * Regional island look per realm (pure, display only): ground/foliage tint and tree mix.
 * Terrain, coordinates and buildings stay identical, so existing villages keep every tile.
 */
export type Biome = "heartland" | "elbe" | "marsh" | "halligen" | "bodden" | "moor" | "westwild" | "westwood" | "heath";
export const BIOME_OF: Record<Realm, Biome> = { europe: "heartland", "europe-2": "elbe", "europe-3": "marsh", "us-west-2": "halligen", "us-east-2": "bodden", "asia-2": "moor", lab: "heartland", "us-west": "westwild", "us-east": "westwood", asia: "heath" };

type Look = {
  /** Multiply-style RGB shift for grass/meadow/forest ground and leaves. */
  green: [number, number, number];
  /** Shift for rock and mountain stone. */
  stone: [number, number, number];
  sand: [number, number, number];
  water: [number, number, number];
  /** Share of conifers (0..1 scale applied on top of the tile's default) and birches. */
  conifer: number; birch: number;
  /** Heather speckles on meadow/grass (0..1). */
  heather: number;
};
const LOOK: Record<Biome, Look | null> = {
  heartland: null,
  // Elbwerder: same north German flora and fauna as Altenland, only the island differs
  elbe: null,
  // Störwerder: river marsh — alder and willow green, few pines, almost no heather
  marsh: { green: [0.93, 1.0, 0.93], stone: [0.95, 0.95, 0.96], sand: [0.96, 0.95, 0.9], water: [0.88, 0.94, 0.96], conifer: 0.05, birch: 0.22, heather: 0 },
  // Hallighörn: Halligen and tidal flats — salt-meadow greens, wind-bent oaks, hardly any pine
  halligen: { green: [0.92, 0.98, 1.0], stone: [0.92, 0.95, 1.0], sand: [0.98, 0.96, 0.9], water: [0.84, 0.93, 1.0], conifer: 0.06, birch: 0.12, heather: 0.01 },
  // Boddenholm: Baltic beech woods on chalky cliffs
  bodden: { green: [0.97, 1.02, 0.94], stone: [1.04, 1.03, 1.0], sand: [1.0, 0.99, 0.95], water: [0.88, 0.96, 1.02], conifer: 0.07, birch: 0.2, heather: 0 },
  // Moorgeest: raised bog with moor birch and heather, Scots pine on the sandy rim
  moor: { green: [0.98, 0.94, 0.88], stone: [0.82, 0.8, 0.82], sand: [1.02, 0.98, 0.9], water: [0.86, 0.88, 0.9], conifer: 0.3, birch: 0.45, heather: 0.05 },
  // All islands are north German landscapes around 1500 (no native spruce/fir in the lowland: conifers = Scots pine).
  // Westeroog: North Frisian tidal coast — wind-shorn oaks, hawthorn scrub, few pines, salt-meadow greens
  westwild: { green: [0.9, 0.96, 0.98], stone: [0.9, 0.94, 1.0], sand: [0.95, 0.94, 0.9], water: [0.85, 0.95, 1.0], conifer: 0.12, birch: 0.15, heather: 0.02 },
  // Möwenwerder: Baltic bodden coast — oak/beech woods with moor birch and alder carr
  westwood: { green: [0.94, 1.0, 0.96], stone: [0.95, 0.95, 0.97], sand: [0.97, 0.96, 0.92], water: [0.9, 0.97, 1.0], conifer: 0.08, birch: 0.3, heather: 0 },
  // Sandwerder: Geest and Lüneburg-style heath — open Scots pine, birch, heather and pale dunes
  heath: { green: [1.04, 0.94, 0.86], stone: [0.78, 0.78, 0.82], sand: [1.05, 1.02, 0.94], water: [0.92, 0.96, 0.98], conifer: 0.4, birch: 0.4, heather: 0.06 },
};

let biome: Biome = "heartland";
export const setBiome = (r: Realm) => { biome = BIOME_OF[r]; };
export const biomeKey = () => biome;
export const biomeLook = () => LOOK[biome];

/** Tree pick: conifer threshold and birch threshold for a tile's random v. */
export function treeKind(v: number, conifer: number): "fir" | "birch" | "oak" {
  const l = LOOK[biome];
  if (!l) return v < conifer ? "fir" : v > 0.82 ? "birch" : "oak";
  const c = l.conifer > 0.5 ? Math.max(conifer, l.conifer) : Math.min(conifer, l.conifer);
  return v < c ? "fir" : v > 1 - l.birch ? "birch" : "oak";
}
