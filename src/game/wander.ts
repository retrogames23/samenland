/**
 * People between villages: journeymen (Wandergesellen) and messengers walking the trade roads.
 * A pure calendar from the road (seed pair) and the clock – nothing is stored, every client sees the same walkers.
 */
import { hash, links, roadProgress, type Link, type Seed } from "./world";
import { clock } from "./time";

export type WalkerKind = "journeyman" | "messenger";
export type Walker = { kind: WalkerKind; from: Seed; to: Seed; t0: number; t1: number; name: string; sex: "f" | "m"; craft: string; sd: number };

const F = ["Greta", "Ida", "Frieda", "Lotte", "Marie", "Anna", "Clara", "Hedwig", "Rosa", "Lina"];
const M = ["Otto", "Karl", "Emil", "Fritz", "Hans", "Jakob", "Franz", "Ludwig", "Konrad", "Heinrich"];
/** Crafts a journeyman can learn (job codes from people.ts). */
export const CRAFTS = ["smith", "baker", "mason", "builder", "miller", "crafter", "sawyer"];
/** Walking speed in road tiles per real second. */
export const SPEED: Record<WalkerKind, number> = { journeyman: 0.12, messenger: 0.3 };
const DAY = 864e5;

const roadId = (l: Link) => (l.a.x * 7 + l.b.y * 13 + l.a.y * 31) | 0;

/** Walkers that start on road l during UTC day d (0–2 per day: a journeyman some days, a messenger most days). */
export function walkersOn(l: Link, d: number): Walker[] {
  const sn = roadId(l), n = l.tiles.length, out: Walker[] = [];
  const add = (kind: WalkerKind, k: number) => {
    const fwd = hash(sn, d * 4 + k, 1502) < 0.5, sd = sn * 31 + d * 5 + k;
    const t0 = d * DAY + (7 + hash(sn, d * 4 + k, 1503) * 8) * 3.6e6;
    const sex = kind === "journeyman" ? (hash(sd, 1, 1504) < 0.2 ? "f" : "m") : (hash(sd, 1, 1504) < 0.4 ? "f" : "m");
    const names = sex === "f" ? F : M;
    out.push({ kind, from: fwd ? l.a : l.b, to: fwd ? l.b : l.a, t0, t1: t0 + (n / SPEED[kind]) * 1000, sd, sex,
      name: names[Math.floor(hash(sd, 2, 1504) * names.length)]!, craft: CRAFTS[Math.floor(hash(sd, 3, 1504) * CRAFTS.length)]! });
  };
  if (hash(sn, d, 1501) < 0.3) add("journeyman", 0);
  if (hash(sn, d, 1505) < 0.6) add("messenger", 1);
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
