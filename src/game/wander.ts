/**
 * People between villages: journeymen (Wandergesellen) and messengers walking the trade roads.
 * A pure calendar from the road (seed pair) and the clock – nothing is stored, every client sees the same walkers.
 */
import { ageHours, GROWTH_PACE, hash, links, roadProgress, stageOf, type Link, type Seed } from "./world";
import { clock } from "./time";

export type WalkerKind = "journeyman" | "messenger" | "bridal";
export type Walker = { kind: WalkerKind; from: Seed; to: Seed; t0: number; t1: number; name: string; sex: "f" | "m"; craft: string; sd: number };

const F = ["Greta", "Ida", "Frieda", "Lotte", "Marie", "Anna", "Clara", "Hedwig", "Rosa", "Lina"];
const M = ["Otto", "Karl", "Emil", "Fritz", "Hans", "Jakob", "Franz", "Ludwig", "Konrad", "Heinrich"];
/** Crafts a journeyman can learn (job codes from people.ts). */
export const CRAFTS = ["smith", "baker", "mason", "builder", "miller", "crafter", "sawyer"];
/** Walking speed in road tiles per real second. */
export const SPEED: Record<WalkerKind, number> = { journeyman: 0.12, messenger: 0.3, bridal: 0.1 };
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
    const names = sex === "f" ? F : M;
    out.push({ kind, from: fwd ? l.a : l.b, to: fwd ? l.b : l.a, t0, t1: t0 + (n / SPEED[kind]) * 1000, sd, sex,
      name: names[Math.floor(hash(sd, 2, 1504) * names.length)]!, craft: CRAFTS[Math.floor(hash(sd, 3, 1504) * CRAFTS.length)]! });
  };
  if (hash(sn, d, 1501) < 0.3) add("journeyman", 0);
  if (hash(sn, d, 1505) < 0.6) add("messenger", 1);
  // a bride from one town marries into the neighbour and walks over in her wedding dress (~every 25 days per road)
  if (hash(sn, d, 1506) < 0.04) add("bridal", 2);
  return out;
}

/** Walkers currently on the open road l. */
export function walkersNow(l: Link, now = clock()): Walker[] {
  if (roadProgress(l, now) < 1) return [];
  const d = Math.floor(now / DAY), out: Walker[] = [];
  for (const dd of [d - 1, d]) for (const w of walkersOn(l, dd)) if (w.t0 >= l.since && now >= w.t0 && now < w.t1) out.push(w);
  return out;
}

/** Progress (0..1) of a walker along the road from its start town. */
export const walkProgress = (w: Walker, now: number) => Math.max(0, Math.min(1, (now - w.t0) / (w.t1 - w.t0)));

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
