/**
 * Personality traits and thoughts: pure functions of a villager's id and the world clock.
 * Nothing is stored — every client derives the same character for the same person.
 */
import { hash } from "./world";

export const TRAITS = ["early", "owl", "sociable", "homebody", "storyteller", "weather", "nature", "diligent", "cheerful", "worrier", "pious", "curious"] as const;
export type Trait = (typeof TRAITS)[number];
/** Pairs that cannot share one person. */
const CLASH: [Trait, Trait][] = [["early", "owl"], ["sociable", "homebody"], ["cheerful", "worrier"]];

/** One or two fixed traits per person. */
export function traitsOf(id: number): Trait[] {
  const a = TRAITS[Math.floor(hash(id, 41, 1201) * TRAITS.length)]!;
  if (hash(id, 42, 1201) < 0.4) return [a];
  const b = TRAITS[Math.floor(hash(id, 43, 1201) * TRAITS.length)]!;
  if (b === a || CLASH.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return [a];
  return [a, b];
}
export const hasTrait = (id: number, t: Trait) => traitsOf(id).includes(t);

export type ThoughtCtx = {
  act: string; working: boolean; sick: boolean; caring: boolean; sunday: boolean; season: string;
  newlywed: boolean; baby: boolean; child: boolean; night: boolean;
};
/** Thought code for a person right now (changes every couple of game hours). */
export function thoughtOf(id: number, c: ThoughtCtx, now: number): string {
  if (c.sick) return "sick";
  if (c.caring) return "caring";
  if (c.newlywed) return "newlywed";
  const tr = traitsOf(id);
  const opts: string[] = [];
  if (c.baby) opts.push("baby");
  if (c.sunday) opts.push(tr.includes("pious") ? "pious" : "sunday");
  if (c.night || c.act === "sleep") opts.push("dream");
  else if (c.child) opts.push("play", c.act === "school" ? "school" : "play");
  else if (c.working) opts.push(tr.includes("diligent") ? "diligent" : "work");
  else opts.push("rest");
  opts.push(`season_${c.season}`);
  for (const t of tr) opts.push(`t_${t}`);
  return opts[Math.floor(hash(id, Math.floor(now / 7.2e6), 1202) * opts.length)]!;
}
