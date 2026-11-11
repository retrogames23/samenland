import type { Profile, ProfileKey } from "./types";
import type { TownWay } from "../character";

/** Five explicit player strategies. All numbers here are assumptions about behaviour, not game rules. */
export const PROFILES: Record<ProfileKey, Profile> = {
  gelegenheit: { key: "gelegenheit", label: "Gelegenheitsspieler", loginEvery: 4, reserve: 250, chest: true, civic: true, titles: false, guildRanks: true, way: false, monumentsFrom: null, quests: true, princeEvery: null, wondersPerWeek: 0, visitsPerWeek: 0 },
  regelmaessig: { key: "regelmaessig", label: "Regelmäßig", loginEvery: 1, reserve: 100, chest: true, civic: true, titles: true, guildRanks: true, way: true, monumentsFrom: 90, quests: true, princeEvery: 3, wondersPerWeek: 1, visitsPerWeek: 0.5 },
  optimierer: { key: "optimierer", label: "Optimierer", loginEvery: 1, reserve: 0, chest: true, civic: true, titles: true, guildRanks: true, way: true, monumentsFrom: 0, quests: true, princeEvery: 1, wondersPerWeek: 3, visitsPerWeek: 1 },
  vielspieler: { key: "vielspieler", label: "Vielspieler", loginEvery: 1, reserve: 0, chest: true, civic: true, titles: true, guildRanks: true, way: true, monumentsFrom: 0, quests: true, princeEvery: 1, wondersPerWeek: 21, visitsPerWeek: 3 },
  sparsam: { key: "sparsam", label: "Sparsam", loginEvery: 2, reserve: 400, chest: false, civic: false, titles: false, guildRanks: false, way: false, monumentsFrom: null, quests: true, princeEvery: null, wondersPerWeek: 0, visitsPerWeek: 0 },
};

/**
 * Founding spots on the europe map (deterministic probes, chosen by scanning terrain).
 * `base` spots form the 60-scenario matrix (one per town way); the others are location probes:
 * free = open land, trap = dry founding centre with an outer water barrier, tight = little usable land.
 */
export const LOCATIONS: Record<string, { at: readonly [number, number]; way: TownWay; kind: "base" | "free" | "trap" | "tight" }> = {
  grain: { at: [500, 340], way: "grain", kind: "base" },
  workshop: { at: [166, 613], way: "workshop", kind: "base" },
  gateway: { at: [200, 200], way: "gateway", kind: "base" },
  "grain-free": { at: [440, 180], way: "grain", kind: "free" },
  "grain-trap": { at: [120, 294], way: "grain", kind: "trap" },
  "grain-trap2": { at: [440, 140], way: "grain", kind: "trap" },
  "workshop-free": { at: [400, 200], way: "workshop", kind: "free" },
  "workshop-tight": { at: [440, 420], way: "workshop", kind: "tight" },
  "gateway-river": { at: [580, 340], way: "gateway", kind: "free" },
  "gateway-trap": { at: [600, 920], way: "gateway", kind: "trap" },
  "gateway-tight": { at: [520, 120], way: "gateway", kind: "tight" },
};
export const BASE_LOCATIONS = Object.keys(LOCATIONS).filter((k) => LOCATIONS[k]!.kind === "base");
export const PROBE_LOCATIONS = Object.keys(LOCATIONS).filter((k) => LOCATIONS[k]!.kind !== "base");
/** Assumed visit gift (game: 30–150 depending on the host town). */
export const VISIT_GIFT = 60;
export const WONDER_FIND = 50;
