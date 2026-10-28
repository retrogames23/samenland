/**
 * Village chronicle: what happened between two moments, derived purely from seeds and time
 * (same functions that drive growth), so it needs no stored history. Returns codes; i18n formats them.
 */
import { effAge, stageOf, radiusOf, reachOf, LANDMARKS, links, twinSince, bornAt, structureAt, type Seed, type Kind } from "./world";
import { taxEarned } from "./economy";
import { dowryEarned } from "./weddings";
import { fires, floods, raids, raidLoss } from "./disasters";
import { townOf } from "./people";
import { journeymenTo, bridesOf } from "./wander";
import { seasonAt, type Season } from "./season";

export type ChronEvent =
  | { at: number; code: "stage"; stage: number }
  | { at: number; code: "built"; kind: Kind }
  | { at: number; code: "bought"; item: string }
  | { at: number; code: "road"; other: string; x: number; y: number }
  | { at: number; code: "twin"; other: string }
  | { at: number; code: "season"; season: Season }
  | { at: number; code: "house"; kind: Kind; x: number; y: number }
  | { at: number; code: "family"; x: number; y: number }
  | { at: number; code: "houses"; n: number }
  | { at: number; code: "families"; n: number }
  | { at: number; code: "wedding"; a: string; b: string; alliance: boolean; x: number; y: number }
  | { at: number; code: "fire"; guarded: boolean; water: boolean; dead: boolean; x: number; y: number }
  | { at: number; code: "flood"; x: number; y: number }
  | { at: number; code: "raid"; loss: number; caught: boolean; x: number; y: number }
  | { at: number; code: "journeyman"; name: string; craft: string; sex: "f" | "m"; other: string }
  | { at: number; code: "journeymen"; n: number }
  | { at: number; code: "bride"; name: string; other: string; away: boolean };

/** Homes whose completion brings a family (mirrors HOMES in people.ts). */
export const HOME_KINDS = new Set<Kind>(["hut", "suburb", "farmhouse", "cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement"] as Kind[]);
/** Over long absences many small moments are summarised into one line. */
export const CHRON_DETAIL = 6;
/** Live overlays for single houses/families appear at most this often (real ms). */
export const FEST_GAP = 8 * 6e4;

/** Homes finished between two moments; time is interpolated from growth age, so it is purely derived. */
export function homesBetween(s: Seed, seeds: Seed[], from: number, to: number) {
  const a0 = effAge(s, seeds, from), a1 = effAge(s, seeds, to), out: { at: number; kind: Kind; x: number; y: number }[] = [];
  if (a1 <= a0) return out;
  const R = Math.ceil(reachOf(s, radiusOf(a1))) + 1;
  for (let y = s.y - R; y <= s.y + R; y++) for (let x = s.x - R; x <= s.x + R; x++) {
    const b = bornAt(x, y, s);
    if (!(b > a0 && b <= a1)) continue;
    const st = structureAt(x, y, seeds, to);
    if (!st || st.seed.id !== s.id || !HOME_KINDS.has(st.kind) || st.build != null) continue;
    out.push({ at: from + ((b - a0) / (a1 - a0)) * (to - from), kind: st.kind, x, y });
  }
  return out.sort((p, q) => p.at - q.at);
}
export type Chronicle = { from: number; to: number; events: ChronEvent[]; popFrom: number; popTo: number; taler: number };

/** Show the automatic letter after this long away; a quiet banner after a day. */
export const CHRON_LETTER = 5 * 864e5, CHRON_BANNER = 864e5, CHRON_MAX = 120 * 864e5;
const STEP = 6 * 3.6e6;
/** Real residents: everyone living in a finished home (same list the map shows). */
const pop = (s: Seed, seeds: Seed[], t: number) => townOf(s, seeds, t).people.length;
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
  const homes = homesBetween(s, seeds, from, to);
  if (homes.length > CHRON_DETAIL) {
    ev.push({ at: to, code: "houses", n: homes.length }, { at: to, code: "families", n: homes.length });
  } else for (const h of homes) ev.push({ at: h.at, code: "house", kind: h.kind, x: h.x, y: h.y }, { at: Math.min(to, h.at + 6e5), code: "family", x: h.x, y: h.y });
  for (const w of townOf(s, seeds, to).weddings) if (w.at > from && w.at <= to)
    ev.push({ at: w.at, code: "wedding", a: `${w.a.first} ${w.a.last}`, b: `${w.b.first} ${w.b.maiden ?? w.b.last}`, alliance: w.alliance, x: w.a.home[0], y: w.a.home[1] });
  for (const f of fires(s, to)) if (f.at > from) ev.push({ at: f.at, code: "fire", guarded: f.guarded, water: f.water, dead: f.dead, x: f.x, y: f.y });
  for (const f of floods(s, to)) if (f.at > from) ev.push({ at: f.at, code: "flood", x: f.x, y: f.y });
  for (const r of raids(s, to)) if (r.at > from) ev.push({ at: r.at, code: "raid", loss: r.loss, caught: r.caught, x: s.x, y: s.y });
  const jm = journeymenTo(s, seeds, from, to);
  if (jm.length > CHRON_DETAIL) ev.push({ at: to, code: "journeymen", n: jm.length });
  else for (const w of jm) ev.push({ at: w.t1, code: "journeyman", name: w.name, craft: w.craft, sex: w.sex, other: w.from.name });
  for (const w of bridesOf(s, seeds, from, to)) ev.push({ at: w.t1, code: "bride", name: w.name, sex: w.sex, away: w.from.id === s.id, other: (w.from.id === s.id ? w.to : w.from).name });
  ev.sort((a, b) => a.at - b.at);
  return { from, to, events: ev, popFrom: pop(s, seeds, from), popTo: pop(s, seeds, to), taler: taxEarned(s, to) - taxEarned(s, from) + dowryEarned(s, to) - dowryEarned(s, from) - raidLoss(s, to) + raidLoss(s, from) };
}
