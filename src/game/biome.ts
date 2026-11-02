import type { Realm } from "./time";

/**
 * Regional island look per realm (pure, display only): ground/foliage tint and tree mix.
 * Terrain, coordinates and buildings stay identical, so existing villages keep every tile.
 */
export type Biome = "heartland" | "westwild" | "westwood" | "heath";
export const BIOME_OF: Record<Realm, Biome> = { europe: "heartland", lab: "heartland", "us-west": "westwild", "us-east": "westwood", asia: "heath" };

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
  // rough Atlantic islands: dark spruce woods, cool moss and grey granite
  westwild: { green: [0.86, 0.95, 1.02], stone: [0.9, 0.94, 1.0], sand: [0.92, 0.92, 0.9], water: [0.85, 0.95, 1.0], conifer: 0.92, birch: 0.05, heather: 0 },
  // wooded coast: mixed spruce and birch, fresh cool greens
  westwood: { green: [0.92, 1.0, 0.98], stone: [0.95, 0.95, 0.97], sand: [0.97, 0.96, 0.92], water: [0.9, 0.97, 1.0], conifer: 0.7, birch: 0.25, heather: 0 },
  // windswept trading isle: heath, pale dunes, dark basalt
  heath: { green: [1.04, 0.94, 0.86], stone: [0.78, 0.78, 0.82], sand: [1.05, 1.02, 0.94], water: [0.92, 0.96, 0.98], conifer: 0.35, birch: 0.45, heather: 0.06 },
};

let biome: Biome = "heartland";
export const setBiome = (r: Realm) => { biome = BIOME_OF[r]; };
export const biomeKey = () => biome;
export const biomeLook = () => LOOK[biome];

/** Tree pick: conifer threshold and birch threshold for a tile's random v. */
export function treeKind(v: number, conifer: number): "fir" | "birch" | "oak" {
  const l = LOOK[biome];
  if (!l) return v < conifer ? "fir" : v > 0.82 ? "birch" : "oak";
  const c = Math.max(conifer, l.conifer);
  return v < c ? "fir" : v > 1 - l.birch ? "birch" : "oak";
}
