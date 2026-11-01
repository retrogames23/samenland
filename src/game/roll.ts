// Village roll ("Dorf-Rolle"): pure grouping of a town's people into households for the register.
// Derived on demand from townOf().people — nothing stored. Only citizens (residents of a home) form
// households and count in `total`; the mayor is listed apart, travelling guests not at all.
import { isCitizen, type Person } from "./people";

export type Household = { key: number; name: string; people: Person[] };
export type Roll = { mayor: Person | null; households: Household[]; total: number; kids: number; sick: number };

const RANK: Record<string, number> = { head: 0, spouse: 1, elder: 2, child: 3, lodger: 4 };

export function rollOf(people: readonly Person[]): Roll {
  const mayor = people.find((p) => p.role === "mayor") ?? null;
  const citizens = people.filter(isCitizen);
  const by = new Map<number, Person[]>();
  for (const p of citizens) {
    const k = p.hh ?? p.home[0] * 1024 + p.home[1];
    const group = by.get(k) ?? [];
    group.push(p); by.set(k, group);
  }
  const households: Household[] = [...by.entries()].map(([key, ps]) => {
    ps.sort((a, b) => (RANK[a.role ?? "lodger"] ?? 5) - (RANK[b.role ?? "lodger"] ?? 5) || b.age - a.age);
    return { key, name: (ps.find((p) => p.role === "head") ?? ps[0]!).last, people: ps };
  });
  households.sort((a, b) => a.name.localeCompare(b.name) || a.key - b.key);
  return { mayor, households, total: citizens.length, kids: citizens.filter((p) => p.job === "child").length, sick: citizens.filter((p) => p.sick).length };
}

export function matches(p: Person, q: string, job: string): boolean {
  if (job && p.job !== job) return false;
  if (!q) return true;
  const s = q.toLowerCase();
  return `${p.first} ${p.last} ${p.maiden ?? ""}`.toLowerCase().includes(s);
}
