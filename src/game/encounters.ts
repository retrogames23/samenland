/**
 * Daily encounters ("Schulzen-Entscheidungen"): which encounter a village meets on a UTC day is a pure
 * function of (seed id, day); only the chosen answer is stored. Effects are temporary boons derived from
 * the decision timestamp, so every client computes the same bonuses. Costs mirror the database guard.
 */
export type Effect = { h?: number; growth?: number; food?: number; health?: number; wealth?: number };
export type Choice = { cost: number; fx: Effect };
export const ENCOUNTERS = {
  journeyman: { host: { cost: 30, fx: { h: 72, growth: 0.15 } }, settle: { cost: 80, fx: { h: 168, growth: 0.08, wealth: 5 } }, pass: { cost: 0, fx: {} } },
  merchant: { market: { cost: 50, fx: { h: 48, wealth: 15 } }, inn: { cost: 20, fx: { h: 48, health: 5, wealth: 5 } }, pass: { cost: 0, fx: {} } },
  boundary: { common: { cost: 0, fx: { h: 72, health: 10 } }, award: { cost: -20, fx: {} }, tavern: { cost: 10, fx: { h: 72, health: 8, wealth: 5 } } },
  ruin: { shrine: { cost: 60, fx: { h: 120, growth: 0.1, health: 5 } }, stones: { cost: 0, fx: { h: 48, wealth: 5 } } },
  harvest: { feast: { cost: 40, fx: { h: 48, food: 10, health: 10 } }, store: { cost: 0, fx: { h: 96, food: 15 } } },
  healer: { invite: { cost: 35, fx: { h: 96, health: 15 } }, pass: { cost: 0, fx: {} } },
} as const satisfies Record<string, Record<string, Choice>>;
export type EventKey = keyof typeof ENCOUNTERS;
export const EVENT_KEYS = Object.keys(ENCOUNTERS) as EventKey[];
export type Decision = { event: string; choice: string; at: number; cost: number };

/** Villages meet their first visitor once they are this many hours old. */
export const ENCOUNTER_FROM = 6;
const DAY = 86400000;
export const dayOf = (t: number) => Math.floor(t / DAY);

function strHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}
/** The encounter waiting for a village on the UTC day of `now`: cycles through a per-village shuffled order, so it never repeats on consecutive days. */
export function eventOf(seedId: string, now: number): EventKey {
  const order = [...EVENT_KEYS].sort((p, q) => strHash(`${seedId}:${p}`) - strHash(`${seedId}:${q}`));
  return order[((dayOf(now) % order.length) + order.length) % order.length]!;
}
export const choicesOf = (e: EventKey) => Object.keys(ENCOUNTERS[e]) as string[];
export const choiceOf = (e: string, c: string): Choice | undefined => (ENCOUNTERS as Record<string, Record<string, Choice>>)[e]?.[c];

/** Open encounter for today, or null when too young or already decided today. */
export function pendingEncounter(seed: { id: string; created_at: string }, decisions: Decision[], now: number): EventKey | null {
  if (now - Date.parse(seed.created_at) < ENCOUNTER_FROM * 3.6e6) return null;
  if (decisions.some((d) => dayOf(d.at) === dayOf(now))) return null;
  return eventOf(seed.id, now);
}

/** Sum of attribute boons active at `now`. */
export function activeBoons(decisions: Decision[], now: number) {
  const r = { food: 0, health: 0, wealth: 0 };
  for (const d of decisions) {
    const fx = choiceOf(d.event, d.choice)?.fx;
    if (!fx?.h || d.at > now || now - d.at >= fx.h * 3.6e6) continue;
    r.food += fx.food ?? 0; r.health += fx.health ?? 0; r.wealth += fx.wealth ?? 0;
  }
  return r;
}
/** Extra growth hours accumulated from encounter boons (monotonic, like the blessing). */
export function boonHours(decisions: Decision[], now: number) {
  let h = 0;
  for (const d of decisions) {
    const fx = choiceOf(d.event, d.choice)?.fx;
    if (!fx?.growth || !fx.h || d.at > now) continue;
    h += Math.min(now - d.at, fx.h * 3.6e6) / 3.6e6 * fx.growth;
  }
  return h;
}
