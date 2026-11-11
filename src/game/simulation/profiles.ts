import type { Profile, ProfileKey } from "./types";

/** Five explicit player strategies. All numbers here are assumptions about behaviour, not game rules. */
export const PROFILES: Record<ProfileKey, Profile> = {
  gelegenheit: { key: "gelegenheit", label: "Gelegenheitsspieler", loginEvery: 4, reserve: 250, chest: true, civic: true, titles: false, guildRanks: true, way: false, monumentsFrom: null, quests: true, princeEvery: null, wondersPerWeek: 0, visitsPerWeek: 0 },
  regelmaessig: { key: "regelmaessig", label: "Regelmäßig", loginEvery: 1, reserve: 100, chest: true, civic: true, titles: true, guildRanks: true, way: true, monumentsFrom: 90, quests: true, princeEvery: 3, wondersPerWeek: 1, visitsPerWeek: 0.5 },
  optimierer: { key: "optimierer", label: "Optimierer", loginEvery: 1, reserve: 0, chest: true, civic: true, titles: true, guildRanks: true, way: true, monumentsFrom: 0, quests: true, princeEvery: 1, wondersPerWeek: 3, visitsPerWeek: 1 },
  vielspieler: { key: "vielspieler", label: "Vielspieler", loginEvery: 1, reserve: 0, chest: true, civic: true, titles: true, guildRanks: true, way: true, monumentsFrom: 0, quests: true, princeEvery: 1, wondersPerWeek: 21, visitsPerWeek: 3 },
  sparsam: { key: "sparsam", label: "Sparsam", loginEvery: 2, reserve: 400, chest: false, civic: false, titles: false, guildRanks: false, way: false, monumentsFrom: null, quests: true, princeEvery: null, wondersPerWeek: 0, visitsPerWeek: 0 },
};

/** Founding spots on the europe map with a known town character (checked via townCharacter). */
export const LOCATIONS = { coast: [200, 200], plain: [120, 294], hill: [166, 613] } as const;
/** Assumed visit gift (game: 30–150 depending on the host town). */
export const VISIT_GIFT = 60;
export const WONDER_FIND = 50;
