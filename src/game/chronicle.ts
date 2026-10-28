/**
 * Village chronicle: what happened between two moments, derived purely from seeds and time
 * (same functions that drive growth), so it needs no stored history. Returns codes; i18n formats them.
 */
import { effAge, stageOf, radiusOf, LANDMARKS, links, twinSince, type Seed, type Kind } from "./world";
import { taxEarned } from "./economy";
import { seasonAt, type Season } from "./season";

export type ChronEvent =
  | { at: number; code: "stage"; stage: number }
  | { at: number; code: "built"; kind: Kind }
  | { at: number; code: "bought"; item: string }
  | { at: number; code: "road"; other: string; x: number; y: number }
  | { at: number; code: "twin"; other: string }
  | { at: number; code: "season"; season: Season };
export type Chronicle = { from: number; to: number; events: ChronEvent[]; popFrom: number; popTo: number; taler: number };

/** Show the automatic letter after this long away; a quiet banner after a day. */
export const CHRON_LETTER = 5 * 864e5, CHRON_BANNER = 864e5, CHRON_MAX = 120 * 864e5;
const STEP = 6 * 3.6e6;
const pop = (h: number) => Math.floor(3 + 0.9 * Math.pow(radiusOf(Math.max(0, h)), 1.6));
const dominant = (now: number) => { const w = seasonAt(now); return (Object.keys(w) as Season[]).reduce((a, b) => (w[b] > w[a] ? b : a)); };

export function chronicle(s: Seed, seeds: Seed[], from: number, to: number): Chronicle {
  from = Math.max(from, to - CHRON_MAX, Date.parse(s.created_at));
  const ev: ChronEvent[] = [];
  let prevAge = effAge(s, seeds, from), prevSeason = dominant(from);
  for (let t = from + STEP; ; t += STEP) {
    const now = Math.min(t, to), age = effAge(s, seeds, now);
    const st0 = stageOf(prevAge), st1 = stageOf(age);
    for (let k = st0 + 1; k <= st1; k++) ev.push({ at: now, code: "stage", stage: k });
    for (const l of LANDMARKS) if (l.at > prevAge && l.at <= age) ev.push({ at: now, code: "built", kind: l.kind });
    const se = dominant(now); if (se !== prevSeason) ev.push({ at: now, code: "season", season: se }); prevSeason = se;
    prevAge = age;
    if (now >= to) break;
  }
  for (const b of s.bought ?? []) if (b.at > from && b.at <= to) ev.push({ at: b.at, code: "bought", item: b.item });
  for (const l of links(seeds)) {
    if (l.a.id !== s.id && l.b.id !== s.id) continue;
    const o = l.a.id === s.id ? l.b : l.a;
    if (l.since > from && l.since <= to) ev.push({ at: l.since, code: "road", other: o.name, x: o.x, y: o.y });
    const tw = twinSince(l, seeds);
    if (tw != null && tw > from && tw <= to) ev.push({ at: tw, code: "twin", other: o.name });
  }
  ev.sort((a, b) => a.at - b.at);
  return { from, to, events: ev, popFrom: pop(effAge(s, seeds, from)), popTo: pop(effAge(s, seeds, to)), taler: taxEarned(s, to) - taxEarned(s, from) };
}
