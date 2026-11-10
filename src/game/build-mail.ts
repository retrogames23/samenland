import { monumentDone, monumentOf, monumentSteps, specialDone, type Seed } from "./world";

/** Should the "building finished" letter go out for this purchase row now? Monuments are announced once,
 *  on their last step, when monumentDone says the whole work stands — never after the first step alone. */
export function buildMailDue(s: Seed, item: string, at: number, placed: Set<number>, now: number, window: number): boolean {
  const mk = monumentOf(item);
  let done: number | null;
  if (mk) {
    const steps = monumentSteps(mk);
    if (item !== steps[steps.length - 1]) return false;
    done = monumentDone(s, [s], mk);
  } else {
    if (!placed.has(at)) return false;
    done = specialDone(s, [s], at);
  }
  return done != null && done <= now && done >= now - window;
}
