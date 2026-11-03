import type { QuestClaim } from "./quests";

/** The prince's decrees: a fixed sequence of 12 (mirrors DB princely_task_def). Favour = decrees fulfilled. */
export const PRINCELY_KINDS = ["wonder", "letter", "visit", "build", "gift", "road"] as const;
/** "court" = Hofdienst: swap target (DB princely_swap), fulfilled by speaking to the gardener and the groom on the estate (DB princely_errand). */
export type PrincelyKind = (typeof PRINCELY_KINDS)[number] | "court";
export const PRINCELY_SWAP_H = 24;
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

/** The prince's messenger in the village (pure, never stored): rides in when a dispatch is due, waits by the mayor's seat, rides off once it is taken. */
export const HERALD_RIDE_S = 25;
/** Hours after a decree was handed out until the messenger comes back for the report. */
export const HERALD_RETURN_H = 6;
export type HeraldVisit = { phase: "arrive" | "wait" | "leave"; p: number; t: number };
export function heraldVisit(rows: PrincelyRow[], seedId: string, now: number): HeraldVisit | null {
  const mine = rows.filter((r) => r.seed_id === seedId);
  if (!mine.length) return null; // the first decree is always granted at court
  const ride = HERALD_RIDE_S * 1000, open = mine.find((r) => !r.done_at);
  const leave = (from: number): HeraldVisit | null => (now >= from && now - from < ride ? { phase: "leave", p: (now - from) / ride, t: now - from } : null);
  let arrive: number;
  if (open) {
    const acc = Date.parse(open.accepted_at);
    if (open.step > 1) { const l = leave(acc); if (l) return l; }
    arrive = acc + HERALD_RETURN_H * 3600e3;
  } else {
    const last = Math.max(...mine.map((r) => Date.parse(r.done_at!)));
    const l = leave(last); if (l) return l;
    if (mine.length >= PRINCELY_COUNT) return null;
    arrive = last + PRINCELY_REST_H * 3600e3;
  }
  if (now < arrive) return null;
  const t = now - arrive;
  return t < ride ? { phase: "arrive", p: t / ride, t } : { phase: "wait", p: 1, t };
}
