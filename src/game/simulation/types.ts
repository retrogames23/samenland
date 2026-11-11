/** Economy simulation types (offline analysis tool, never imported by the live game). */
import type { CharterPath } from "../world";

export type ProfileKey = "gelegenheit" | "regelmaessig" | "optimierer" | "vielspieler" | "sparsam";
export type LocationKey = "coast" | "plain" | "hill";

/** Behaviour assumptions of one player type — these are MODEL ASSUMPTIONS, not game rules. */
export type Profile = {
  key: ProfileKey;
  label: string;
  /** Logs in every n days (purchases, quests, decrees only happen on login days). */
  loginEvery: number;
  /** Mark kept back after every purchase. */
  reserve: number;
  chest: boolean; civic: boolean; titles: boolean; guildRanks: boolean; way: boolean;
  /** Monuments only from this day on (null = never). */
  monumentsFrom: number | null;
  /** Fraction of the quest chain claimed when due (1 = every quest as soon as possible). */
  quests: boolean;
  /** Decrees handed in every n login days (null = never). */
  princeEvery: number | null;
  /** Wonder finds per week (50 Mark each) and visits per week (assumed 60 Mark gift). */
  wondersPerWeek: number; visitsPerWeek: number;
};

export type SimConfig = {
  profile: Profile;
  charter: CharterPath;
  location: LocationKey;
  days?: number;
  /** Rank is recounted every n days until Hansestadt (townRank is expensive). */
  rankEvery?: number;
  start?: string;
};

export type Booking = {
  day: number; kind: "credit" | "debit"; source: string;
  amount: number; booked: number; lost: number; balance: number; cap: number;
};

export type DayRow = { day: number; rank: number; balance: number; cap: number; income: number; tax: number; booked: number; lost: number; spent: number };

export type SimResult = {
  profile: ProfileKey; charter: CharterPath; location: LocationKey; way: string;
  days: number;
  hansestadtDay: number | null;
  rankDays: Record<number, number>;
  saturationDay: number | null;
  firstOverflowDay: number | null;
  /** First day from which ≥ 50 % of the following 30 days overflowed. */
  regularOverflowDay: number | null;
  gross: number; booked: number; lost: number; spent: number; finalBalance: number;
  taxShare: number; lostShare: number;
  bySource: Record<string, number>;
  bought: { item: string; day: number; cost: number }[];
  remaining: string[];
  /** Averages per phase: before Hansestadt, Hansestadt → saturation, after saturation. */
  phases: { name: string; from: number; to: number; incomePerDay: number; spentPerDay: number; lostShare: number; balanceEnd: number }[];
  daily: DayRow[];
  ledger: Booking[];
};
