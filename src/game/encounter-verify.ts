/**
 * Server authority for encounter answers (M1 Paket 1). The trusted server recomputes the open encounter with the
 * very same pure functions the client draws with (pendingAll → pendingEncounter / commonsDue / historyDue) and
 * accepts an answer only for that encounter. Atmosphere, draw, prices and texts are untouched: this module only
 * compares. Prices stay the job of the DB encounter_guard.
 */
import { ENCOUNTERS } from "./encounters";
import { pendingAll } from "./commons";
import { effAge, type Seed } from "./world";
import { townRank } from "./rank";

/** Client and server clocks drift a little; the DB guard grants the same 120 s on its 6 h gap. */
export const VERIFY_TOLERANCE = 120e3;
/** Town-life questions and the settlement rank commonsOptions requires for them — mirrored by DB encounter_guard (0138). */
export const EVENT_RANK: Readonly<Record<string, number>> = {
  brot: 3,
  stoerer: 3,
  bier: 3,
  torschluss: 3,
  wache: 3,
  gast: 4,
  seuche: 4,
  kaper: 4,
  strand: 4,
  hansetag: 5,
};
export type VerifyCode = "stale" | "fail";

const choicesOfAny = (event: string): string[] | null => {
  const e = (ENCOUNTERS as Record<string, Record<string, unknown>>)[event];
  return e ? Object.keys(e) : null;
};

/** The encounter open for `seed` at `t`, exactly as the client computes it. */
export function openEncounterAt(seed: Seed, seeds: Seed[], t: number): string | null {
  return pendingAll(
    seed,
    seed.decisions ?? [],
    t,
    effAge(seed, seeds, t),
    townRank(seed, seeds, t),
  );
}

/**
 * null when `event`/`choice` is a valid answer to the encounter open at `now` (or `now - VERIFY_TOLERANCE`),
 * "fail" for an answer that does not exist, "stale" for an encounter that is not the open one.
 */
export function verifyEncounterChoice(
  seed: Seed,
  seeds: Seed[],
  now: number,
  event: string,
  choice: string,
): VerifyCode | null {
  const choices = choicesOfAny(event);
  if (!choices || !choices.includes(choice)) return "fail";
  for (const t of [now, now - VERIFY_TOLERANCE])
    if (openEncounterAt(seed, seeds, t) === event) return null;
  return "stale";
}
