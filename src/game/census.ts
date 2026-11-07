// Seelen- und Standesbuch: pure tallies of a town's citizens for the second roll tab.
// Derived on demand from townOf().people — nothing stored, every client sees the same book.
import { isCitizen, type Person, type Job } from "./people";
import type { Estate } from "./prosperity";

export type Census = {
  souls: number;
  /** Hearths and souls per estate (household estate = its head's). */
  estates: Record<Estate, { hearths: number; souls: number }>;
  /** The four ages: under 14, 14–20, 21–49, 50 and older. */
  ages: [number, number, number, number];
  /** Livelihood of working citizens: food, craft, common good. */
  trades: { food: number; craft: number; common: number };
  couples: number; widowed: number; newcomers: number;
};

const FOOD: Job[] = ["farmer", "fisher", "hunter", "herbalist", "miller", "baker"];
const COMMON: Job[] = ["priest", "teacher", "healer", "firewarden", "watchman", "innkeeper"];
const IDLE: Job[] = ["child", "retired", "homemaker", "mayor"];

export function ageBand(age: number): 0 | 1 | 2 | 3 {
  return age < 14 ? 0 : age <= 20 ? 1 : age < 50 ? 2 : 3;
}

export function tradeOf(job: Job): "food" | "craft" | "common" | null {
  if (IDLE.includes(job)) return null;
  return FOOD.includes(job) ? "food" : COMMON.includes(job) ? "common" : "craft";
}

export function censusOf(people: readonly Person[]): Census {
  const cs = people.filter(isCitizen);
  const estates: Census["estates"] = { ordinary: { hearths: 0, souls: 0 }, skilled: { hearths: 0, souls: 0 }, wealthy: { hearths: 0, souls: 0 } };
  const hh = new Map<number, Person[]>();
  for (const p of cs) { const k = p.hh ?? p.home[0] * 1024 + p.home[1]; (hh.get(k) ?? hh.set(k, []).get(k)!).push(p); }
  for (const ps of hh.values()) {
    const head = ps.find((p) => p.role === "head") ?? ps[0]!;
    const e = estates[head.estate ?? "ordinary"];
    e.hearths++; e.souls += ps.length;
  }
  const ages: Census["ages"] = [0, 0, 0, 0];
  const trades = { food: 0, craft: 0, common: 0 };
  const ids = new Set(cs.map((p) => p.id));
  let married = 0, widowed = 0, newcomers = 0;
  for (const p of cs) {
    ages[ageBand(p.age)]++;
    const tr = tradeOf(p.job); if (tr) trades[tr]++;
    if (p.spouse != null) { if (ids.has(p.spouse)) married++; else widowed++; }
    if (p.arrive) newcomers++;
  }
  return { souls: cs.length, estates, ages, trades, couples: Math.floor(married / 2), widowed, newcomers };
}
