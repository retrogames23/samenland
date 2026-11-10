import { monumentDone, monumentOf, monumentSteps, specialDone, type Seed } from "./world";

/** When does this purchase row complete a building that deserves a letter? Monuments only on their last step,
 *  at monumentDone (whole work stands) — never after the first step alone. null = no letter for this row. */
export function buildMailDoneAt(s: Seed, item: string, at: number, placed: Set<number>): number | null {
  const mk = monumentOf(item);
  if (mk) {
    const steps = monumentSteps(mk);
    if (item !== steps[steps.length - 1]) return null;
    return monumentDone(s, [s], mk);
  }
  if (!placed.has(at)) return null;
  return specialDone(s, [s], at);
}

/** Is the finish inside the enqueue window? Only decides enqueueing; once-only delivery is the DB outbox's job. */
export function buildMailDue(s: Seed, item: string, at: number, placed: Set<number>, now: number, window: number): boolean {
  const done = buildMailDoneAt(s, item, at, placed);
  return done != null && done <= now && done >= now - window;
}
