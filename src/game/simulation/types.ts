/** Economy simulation types (offline analysis tool, never imported by the live game). */
import type { CharterPath } from "../world";

export type ProfileKey = "gelegenheit" | "regelmaessig" | "optimierer" | "vielspieler" | "sparsam";
export type LocationKey = string;

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

export type DayRow = { day: number; rank: number; population: number; households: number; balance: number; cap: number; income: number; tax: number; booked: number; lost: number; spent: number; raid: number;
  /** Cumulative Mark invested so far (wealth = balance + invested). */ invested: number;
  /** Legal purchases still open / open among those unlocked at the current rank. */ open: number; openUnlocked: number };

export type SimResult = {
  profile: ProfileKey; charter: CharterPath; location: LocationKey; way: string;
  days: number;
  hansestadtDay: number | null;
  rankDays: Record<number, number>;
  /** State 1: last day the profile bought anything (its strategy buys nothing more afterwards). */
  strategyDoneDay: number | null;
  /** State 2: first day every purchase unlocked at the current rank was made (may be lost again on a rank-up). */
  unlockedDoneDay: number | null;
  /** State 3: first day every legally available investment of this town is made (null = never). */
  saturationDay: number | null;
  /** Days from state 3 to the end of the run without any purchase option. */
  idleDays: number;
  /** Total legal investment volume of this town (charter + town way), optional twin works excluded. */
  volume: number;
  overflowDays: number;
  population: number; households: number;
  /** Final day: physical dwellings, households per building kind, dwellings by number of families ("1"…"4"). */
  housing: { houses: number; byKind: Record<string, number>; occupancy: Record<string, number> };
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
