import type { QuestClaim } from "./economy";

/** The prince's decrees: a fixed sequence of 12 (mirrors DB princely_task_def). Favour = decrees fulfilled. */
export const PRINCELY_KINDS = ["wonder", "letter", "visit", "build", "gift", "road"] as const;
export type PrincelyKind = (typeof PRINCELY_KINDS)[number];
export const PRINCELY_REWARDS = [40, 40, 50, 60, 60, 80, 80, 90, 100, 110, 120, 150];
export const PRINCELY_COUNT = PRINCELY_REWARDS.length;
export const PRINCELY_REST_H = 20;

export const princelyTask = (step: number): { kind: PrincelyKind; reward: number } => ({
  kind: PRINCELY_KINDS[(step - 1) % PRINCELY_KINDS.length]!,
  reward: PRINCELY_REWARDS[step - 1] ?? 0,
});

export type PrincelyRow = { id: string; seed_id: string; step: number; task: string; reward: number; accepted_at: string; done_at: string | null };

/** Fulfilled decrees count into the chest at the moment they were handed in (mirrors village_balance). */
export const princelyClaims = (rows: PrincelyRow[]): QuestClaim[] =>
  rows.filter((r) => r.done_at).map((r) => ({ id: `${r.id}:p`, seed_id: r.seed_id, quest: `prince:${r.step}`, reward: r.reward, created_at: r.done_at! }));

export const favourOf = (rows: PrincelyRow[], seedId: string) => rows.filter((r) => r.seed_id === seedId && r.done_at).length;
export const openTaskOf = (rows: PrincelyRow[], seedId: string) => rows.find((r) => r.seed_id === seedId && !r.done_at) ?? null;
