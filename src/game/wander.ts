import { NAMES_F, NAMES_M, SURNAMES } from "./names";
/**
 * People between villages: journeymen (Wandergesellen) and messengers walking the trade roads.
 * A pure calendar from the road (seed pair) and the clock – nothing is stored, every client sees the same walkers.
 */
import { ageHours, GROWTH_PACE, hash, links, roadProgress, stageOf, type Link, type Seed } from "./world";
import { clock, worldHour, worldWeekday } from "./time";

export type WalkerKind = "journeyman" | "messenger" | "bridal" | "family" | "gift" | "aid" | "letter" | "rider" | "trader" | "transit";
export type Walker = { kind: WalkerKind; from: Seed; to: Seed; t0: number; t1: number; name: string; sex: "f" | "m"; craft: string; sd: number; /** road share covered: from p0 to p1 (default 0→1) */ p0?: number; p1?: number; /** through-traffic: true start and final goal beyond this road */ origin?: Seed; dest?: Seed };

const F = NAMES_F, M = NAMES_M;
/** Crafts a journeyman can learn (job codes from people.ts). */
export const CRAFTS = ["smith", "baker", "mason", "builder", "miller", "crafter", "sawyer"];
/** Walking speed in road tiles per real second. */
export const SPEED: Record<WalkerKind, number> = { journeyman: 0.12, messenger: 0.3, bridal: 0.1, family: 0.07, gift: 0.15, aid: 0.2, letter: 0.3, rider: 0.6, trader: 0.1, transit: 0.16 };
const SUR = SURNAMES;
/** Days a house stands empty after its family moved away, before newcomers fill it again. */
export const VACANT_DAYS = 12;
const DAY = 864e5;

const roadId = (l: Link) => (l.a.x * 7 + l.b.y * 13 + l.a.y * 31) | 0;

/**
 * Where a cross-village couple settles: the town offering more – prosperity (growth stage) plus room for a
 * new household (towns in their first ~3 months are still building plenty of fresh houses). Ties: coin toss.
 * Returns +1 to settle in l.b, -1 for l.a, 0 for a tie.
 */
export function homeDraw(l: Link, at: number): number {
  const pull = (s: Seed) => { const h = ageHours(s, at); return stageOf(h * GROWTH_PACE) + (h < 2160 ? 1 : 0); };
  return Math.sign(pull(l.b) - pull(l.a));
}

/** Daily journeyman chance on a road touching a Gesellenherberge (0.3 otherwise). */
export const HERBERGE_WALZ = 0.5;
/** Walkers that start on road l during UTC day d (0–2 per day: a journeyman some days, a messenger most days). */
export function walkersOn(l: Link, d: number): Walker[] {
  const sn = roadId(l), n = l.tiles.length, out: Walker[] = [];
  const add = (kind: WalkerKind, k: number) => {
    let fwd = hash(sn, d * 4 + k, 1502) < 0.5;
    const sd = sn * 31 + d * 5 + k;
    const t0 = d * DAY + (7 + hash(sn, d * 4 + k, 1503) * 8) * 3.6e6;
    // the spouse from the less attractive town walks over to the new shared home – bride or groom alike
    if (kind === "bridal") { const w = homeDraw(l, d * DAY); if (w) fwd = w > 0; }
    const sex = kind === "bridal" ? (hash(sd, 1, 1504) < 0.5 ? "f" : "m") : kind === "journeyman" ? (hash(sd, 1, 1504) < 0.2 ? "f" : "m") : (hash(sd, 1, 1504) < 0.4 ? "f" : "m");
    if (kind === "family") { const w = homeDraw(l, d * DAY); fwd = w > 0; }
    const names = kind === "family" ? SUR : sex === "f" ? F : M;
    out.push({ kind, from: fwd ? l.a : l.b, to: fwd ? l.b : l.a, t0, t1: t0 + (n / SPEED[kind]) * 1000, sd, sex,
      name: names[Math.floor(hash(sd, 2, 1504) * names.length)]!, craft: CRAFTS[Math.floor(hash(sd, 3, 1504) * CRAFTS.length)]! });
  };
  // a Gesellenherberge at either end draws journeymen on the Walz more often (purchase rows only, so all clients agree)
  const inn = [l.a, l.b].some((t) => t.bought?.some((b) => b.item === "herberge" && b.at <= d * DAY));
  if (hash(sn, d, 1501) < (inn ? HERBERGE_WALZ : 0.3)) add("journeyman", 0);
  if (hash(sn, d, 1505) < 0.6) add("messenger", 1);
  // a bride from one town marries into the neighbour and walks over in her wedding dress (~every 25 days per road)
  if (hash(sn, d, 1506) < 0.04) add("bridal", 2);
  // a household packs its cart and moves to the neighbour offering more (~every 20 days per road, only on an imbalance)
  if (hash(sn, d, 1507) < 0.05 && homeDraw(l, d * DAY) !== 0) add("family", 3);
  out.push(...tradersOn(l, d));
  return out;
}

/** Saturday market: hours (realm clock) the stalls stand at the road's midpoint. */
export const MARKET_OPEN = 9, MARKET_CLOSE = 17;
/** Realm-clock timestamp of hour h on UTC day d (realm day centred on that UTC noon). */
export function atHour(d: number, h: number) {
  const noon = d * DAY + 12 * 3.6e6;
  return noon + (h - worldHour(noon)) * 3.6e6;
}
export const isMarketDate = (d: number) => worldWeekday(d * DAY + 12 * 3.6e6) === 6;
/** Traders: 2–3 per town walk to the neighbour's village square before opening and home after closing (pure from road and day). */
export function tradersOn(l: Link, d: number): Walker[] {
  if (!isMarketDate(d) || l.tiles.length < 7) return [];
  const sn = roadId(l), n = l.tiles.length, out: Walker[] = [], trip = (n / SPEED.trader) * 1000;
  for (const [side, other, k0] of [[l.a, l.b, 0], [l.b, l.a, 5]] as const) {
    const cnt = 2 + (hash(sn, d + k0, 1520) < 0.5 ? 1 : 0);
    for (let k = 0; k < cnt; k++) {
      const sd = sn * 37 + d * 11 + k0 + k, sex = hash(sd, 1, 1521) < 0.5 ? "f" : "m", names = sex === "f" ? F : M;
      const name = names[Math.floor(hash(sd, 2, 1521) * names.length)]!;
      const go = atHour(d, MARKET_OPEN) - trip - hash(sd, 3, 1521) * 1.8e6, back = atHour(d, MARKET_CLOSE) + hash(sd, 4, 1521) * 1.8e6;
      out.push({ kind: "trader", from: side, to: other, t0: go, t1: go + trip, sd, sex, name, craft: "", p0: 0, p1: 1 });
      out.push({ kind: "trader", from: other, to: side, t0: back, t1: back + trip, sd, sex, name, craft: "", p0: 0, p1: 1 });
    }
  }
  return out;
}
/** Is the Saturday market on the village squares open right now? */
export const marketOpen = (now: number) => { const h = worldHour(now) % 24; return worldWeekday(now) === 6 && h >= MARKET_OPEN && h < MARKET_CLOSE; };

/** Mounted messenger: arrival time from the straight distance (10 min – 2 h), never stored. */
export const RIDE_MIN = 6e5, RIDE_MAX = 72e5, RIDE_PER_TILE = 4000;
export const rideTime = (a: Seed, b: Seed) => Math.max(RIDE_MIN, Math.min(RIDE_MAX, Math.hypot(a.x - b.x, a.y - b.y) * RIDE_PER_TILE));
export const letterArrives = (from: Seed, to: Seed, at: number) => at + rideTime(from, to);
/** Riders for stored letter rows on road l. */
export function riderWalkers(l: Link): Walker[] {
  const out: Walker[] = [];
  for (const [from, to] of [[l.a, l.b], [l.b, l.a]] as const) for (const g of from.letters ?? []) {
    if (g.to !== to.id) continue;
    const sd = Math.floor(hash(g.at % 1e9, 9, 1530) * 1e6);
    out.push({ kind: "rider", from, to, t0: g.at, t1: letterArrives(from, to, g.at), sd, sex: "m", name: M[sd % M.length]!, craft: "" });
  }
  return out;
}

/** Walkers currently on the open road l. */
export function walkersNow(l: Link, now = clock(), all?: Link[]): Walker[] {
  if (roadProgress(l, now) < 1) return [];
  const d = Math.floor(now / DAY), out: Walker[] = [];
  for (const dd of [d - 1, d]) for (const w of walkersOn(l, dd)) if (w.t0 >= l.since && now >= w.t0 && now < w.t1) out.push(w);
  for (const w of giftWalkers(l)) if (now >= w.t0 && now < w.t1) out.push(w);
  for (const w of riderWalkers(l)) if (now >= w.t0 && now < w.t1) out.push(w);
  if (all) for (const dd of [d - 1, d]) for (const w of throughOn(l, all, dd, now)) if (now >= w.t0 && now < w.t1) out.push(w);
  return out;
}

/** Rest at the hub town between the two legs of a through journey. */
export const THROUGH_REST = 20 * 6e4;
const sharedEnd = (l: Link, k: Link) => (l.a.id === k.a.id || l.a.id === k.b.id ? l.a : l.b.id === k.a.id || l.b.id === k.b.id ? l.b : null);
const far = (l: Link, id: string) => (l.a.id === id ? l.b : l.a);
/**
 * Trade networks made visible: carts and journeymen travel A → hub → C over two finished roads when A and C
 * have no direct road. Pure calendar from the road pair and the UTC day; returns the leg that runs on road l.
 */
export function throughOn(l: Link, all: Link[], d: number, now: number): Walker[] {
  const out: Walker[] = [];
  for (const k of all) {
    if (k === l) continue;
    const hub = sharedEnd(l, k); if (!hub) continue;
    const x = far(l, hub.id), y = far(k, hub.id);
    if (x.id === y.id || all.some((m) => (m.a.id === x.id && m.b.id === y.id) || (m.a.id === y.id && m.b.id === x.id))) continue;
    if (roadProgress(l, now) < 1 || roadProgress(k, now) < 1) continue;
    const [p, q] = x.id < y.id ? [x, y] : [y, x];
    const pn = (hash(p.x * 31 + q.x, p.y * 17 + q.y, 1601) * 1e6) | 0;
    const add = (kind: WalkerKind, slot: number) => {
      const sd = pn * 7 + d * 3 + slot, fwd = hash(sd, d, 1602) < 0.5, origin = fwd ? p : q, dest = fwd ? q : p;
      const first = origin.id === x.id ? l : k, second = first === l ? k : l;
      const t0 = d * DAY + (6 + hash(sd, d, 1603) * 6) * 3.6e6, sp = SPEED[kind];
      const mid = t0 + (first.tiles.length / sp) * 1000, t2 = mid + THROUGH_REST;
      const sex = hash(sd, 1, 1604) < 0.2 ? "f" : "m", names = sex === "f" ? F : M;
      const base = { kind, sd, sex, origin, dest, name: names[Math.floor(hash(sd, 2, 1604) * names.length)]!, craft: CRAFTS[Math.floor(hash(sd, 3, 1604) * CRAFTS.length)]! } as const;
      if (first === l) out.push({ ...base, from: origin, to: hub, t0, t1: mid });
      else out.push({ ...base, from: hub, to: dest, t0: t2, t1: t2 + (second.tiles.length / sp) * 1000 });
    };
    if (hash(pn, d, 1605) < 0.7) add("transit", 0);
    if (hash(pn, d, 1606) < 0.5) add("transit", 1);
    if (hash(pn, d, 1607) < 0.3) add("journeyman", 2);
  }
  return out;
}

/** Progress (0..1) of a walker along the road from its start town. */
export const walkProgress = (w: Walker, now: number) => { const f = Math.max(0, Math.min(1, (now - w.t0) / (w.t1 - w.t0))); return (w.p0 ?? 0) + ((w.p1 ?? 1) - (w.p0 ?? 0)) * f; };

/** Journeymen who arrived in town s between two moments (for the chronicle). */
export function journeymenTo(s: Seed, seeds: Seed[], from: number, to: number): Walker[] {
  const out: Walker[] = [];
  for (const l of links(seeds)) {
    if (l.a.id !== s.id && l.b.id !== s.id) continue;
    for (let d = Math.floor(from / DAY) - 1; d <= Math.floor(to / DAY); d++)
      for (const w of walkersOn(l, d)) if (w.kind === "journeyman" && w.to.id === s.id && w.t0 >= l.since && w.t1 > from && w.t1 <= to) out.push(w);
  }
  return out.sort((a, b) => a.t1 - b.t1);
}

/** Brides who married between town s and a neighbour between two moments (either direction). */
export function bridesOf(s: Seed, seeds: Seed[], from: number, to: number): Walker[] {
  const out: Walker[] = [];
  for (const l of links(seeds)) {
    if (l.a.id !== s.id && l.b.id !== s.id) continue;
    for (let d = Math.floor(from / DAY) - 1; d <= Math.floor(to / DAY); d++)
      for (const w of walkersOn(l, d)) if (w.kind === "bridal" && w.t0 >= l.since && w.t1 > from && w.t1 <= to) out.push(w);
  }
  return out.sort((a, b) => a.t1 - b.t1);
}

/** Families that moved away from or into town s between two moments (either direction). */
export function movesOf(s: Seed, seeds: Seed[], from: number, to: number): Walker[] {
  const out: Walker[] = [];
  for (const l of links(seeds)) {
    if (l.a.id !== s.id && l.b.id !== s.id) continue;
    for (let d = Math.floor(from / DAY) - 1; d <= Math.floor(to / DAY); d++)
      for (const w of walkersOn(l, d)) if (w.kind === "family" && w.t0 >= l.since && w.t1 > from && w.t1 <= to) out.push(w);
  }
  return out.sort((a, b) => a.t1 - b.t1);
}

/** Families that left town s and whose house still stands empty at time now (house chosen by the walker's sd). */
export function leaversOf(s: Seed, seeds: Seed[], now: number): Walker[] {
  const out: Walker[] = [];
  for (const l of links(seeds)) {
    if (l.a.id !== s.id && l.b.id !== s.id) continue;
    if (roadProgress(l, now) < 1) continue;
    for (let d = Math.floor(now / DAY) - VACANT_DAYS; d <= Math.floor(now / DAY); d++)
      for (const w of walkersOn(l, d)) if (w.kind === "family" && w.from.id === s.id && w.t0 >= l.since && w.t0 <= now && now < w.t0 + VACANT_DAYS * DAY) out.push(w);
  }
  return out;
}

/** Carts and letter-carriers for stored gift rows: they leave the sender when sent and travel the road. */
export function giftWalkers(l: Link): Walker[] {
  const out: Walker[] = [], n = l.tiles.length;
  for (const [from, to] of [[l.a, l.b], [l.b, l.a]] as const) for (const g of from.sent ?? []) {
    if (g.to !== to.id) continue;
    const kind: WalkerKind = g.kind === "thanks" ? "letter" : g.kind, sd = Math.floor(hash(g.at % 1e9, 7, 1508) * 1e6);
    const sex = hash(sd, 1, 1509) < 0.4 ? "f" : "m", names = sex === "f" ? F : M;
    out.push({ kind, from, to, t0: g.at, t1: g.at + (n / SPEED[kind]) * 1000, sd, sex, name: names[Math.floor(hash(sd, 2, 1509) * names.length)]!, craft: "" });
  }
  return out;
}
