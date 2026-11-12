/**
 * Model C — voluntary municipal projects (offline simulation only, never imported by the live game).
 * Replays the daily rows of a base run (engine.ts, real residentTax + chest caps) and adds
 * a voluntary tax diversion (default 0 %) and/or manual donations into one explicitly chosen project.
 * Rules: diversion only from Handelsstadt (rank ≥ 4) and only while a project is selected; no overfunding;
 * project money is irrevocable; a new project is only chosen on a login day (no automatic switch mid-day).
 */
import { attemptPurchases, bookCredit, offerFor, simulate } from "./engine";
import { CHEST_BASE, CHEST_CAP, START_TALER } from "../economy";
import { PROFILES, BASE_LOCATIONS } from "./profiles";
import type { DayRow, Profile, ProfileKey } from "./types";
import type { CharterPath } from "../world";
import type { TownWay } from "../character";

export type Stage = { name: string; totalCost: number; localCost: number; buildDays: number };
export type Project = { key: string; name: string; scope: "municipal" | "regional"; total: number; local: number; stages: Stage[] };

// Existing regional shares are apportioned across stages at their unchanged project ratio.
const st = (...s: [string, number, number, number?][]): Stage[] => s.map(([name, localCost, buildDays, totalCost = localCost]) => ({ name, totalCost, localCost, buildDays }));
const catalog: Omit<Project, "total" | "local">[] = [
  { key: "fountain", name: "Marktbrunnen mit Wasserkunst (Brunnensäule mit Wappentier)", scope: "municipal", stages: st(["Brunnenkump", 4000, 14], ["Wasserkunst", 8000, 21], ["Brunnensäule mit Wappentier", 12000, 30]) },
  { key: "spital", name: "Spital zum Heiligen Geist", scope: "municipal", stages: st(["Krankensaal", 10000, 21], ["Kapelle", 18000, 35], ["Wirtschaftshof", 22000, 42]) },
  { key: "waage", name: "Ratswaage & Kranhaus", scope: "municipal", stages: st(["Waagehaus", 12000, 14], ["Tretradkran", 18000, 21]) },
  { key: "school", name: "Lateinschule & Ratsbibliothek", scope: "municipal", stages: st(["Schulhaus", 20000, 21], ["Librarei", 15000, 14]) },
  { key: "wall", name: "Backsteinmauer & Wehrtürme", scope: "municipal", stages: st(["Mauerring", 25000, 28], ["Stadttor", 15000, 21], ["Wehrtürme", 20000, 21]) },
  { key: "quay", name: "Hafenkai & Tretradkran", scope: "municipal", stages: st(["Eichenbohlwerk", 25000, 21], ["Hafenkran", 20000, 21]) },
  { key: "juergen", name: "St.-Jürgen-Hospital & Siechenhof", scope: "municipal", stages: st(["Siechenhaus", 15000, 14], ["Kapelle", 10000, 14]) },
  { key: "armory", name: "Rüsthaus & Pulverturm", scope: "municipal", stages: st(["Rüsthaus", 20000, 21], ["Pulverturm", 15000, 21]) },
  { key: "bridge", name: "Steinerne Strombrücke (Eichenpfahlrost & Fangdämme)", scope: "regional", stages: st(["Pfahlrost & Fangdämme", 8000, 28, 16000], ["Bögen & Fahrbahn", 12000, 42, 24000]) },
  { key: "geleit", name: "Geleitweg & Landwehr", scope: "regional", stages: st(["Geleitweg", 9000, 21, 18000], ["Landwehr", 9000, 21, 18000]) },
  { key: "lock", name: "Flussbau & Stauschleuse", scope: "regional", stages: st(["Uferbefestigung", 6000, 14, 18000], ["Schleusenkammer", 8000, 28, 24000], ["Stautore", 6000, 14, 18000]) },
  { key: "tagfahrt", name: "Städtebund-Tagfahrtstube", scope: "regional", stages: st(["Saalbau", 7500, 21, 30000], ["Ausstattung", 5000, 14, 20000]) },
];
export const PROJECTS: Project[] = catalog.map((p) => ({ ...p,
  total: p.stages.reduce((sum, stage) => sum + stage.totalCost, 0),
  local: p.stages.reduce((sum, stage) => sum + stage.localCost, 0),
}));
export const LOCAL_VOLUME = PROJECTS.reduce((a, p) => a + p.local, 0);
export const TOTAL_VALUE = PROJECTS.reduce((a, p) => a + p.total, 0);

export type Strategy = "tax_only" | "surplus_only" | "hybrid";
export type ModelCConfig = { profile: Profile; strategy: Strategy; taxRate?: number; order?: string[]; hanseRank?: number; charter?: CharterPath; way?: TownWay };
export type CDay = { day: number; rank: number; grossTax: number; otherIncome: number; taxToProjects: number; toChestGross: number;
  booked: number; lost: number; spent: number; chest: number; cap: number; manual: number; raid: number; balance: number; project: string | null; funded: number; completed: number; open: number; openUnlocked: number };
export type ModelCResult = { days: CDay[]; completed: { key: string; fundedDay: number; doneDay: number }[];
  bought: { item: string; day: number; cost: number }[]; owned: string[]; spent: number; taxToProjects: number; manual: number;
  invested: number; lost: number; finalBalance: number; idleDays: number; errors: string[] };

/** Replays base daily rows with Model C and its OWN purchases (attemptPurchases from engine.ts), own chest stage and cap.
 *  Order per day: credits (against the cap valid at day start) → login purchases → manual donation → raid. Pure and deterministic.
 *  Raid loss uses the base row's raid amount, capped by Model C's own balance. */
export function modelC(base: DayRow[], start: number, cfg: ModelCConfig): ModelCResult {
  const P = cfg.profile, rate = cfg.strategy === "surplus_only" ? 0 : (cfg.taxRate ?? 0), hanse = cfg.hanseRank ?? 4;
  const charter = cfg.charter ?? "trade", way = cfg.way ?? "grain", all = offerFor(charter, way);
  const queue = (cfg.order ?? PROJECTS.map((p) => p.key)).map((k) => PROJECTS.find((p) => p.key === k)!);
  const caps = [CHEST_BASE, CHEST_CAP.chest2, CHEST_CAP.chest3, CHEST_CAP.chest4];
  let balance = start, chest = 0, active: Project | null = null, funded = 0, next = 0, sumTax = 0, sumManual = 0, sumLost = 0, completedCost = 0, idle = 0, sumSpent = 0;
  const owned = new Set<string>(), bought: ModelCResult["bought"] = [];
  const completed: ModelCResult["completed"] = [], days: CDay[] = [], errors: string[] = [];
  let buildUntil = 0;
  for (const r of base) {
    const login = (r.day - 1) % P.loginEvery === 0, cap = caps[chest]!;
    if (!active && login && next < queue.length && r.rank >= hanse) { active = queue[next++]!; funded = 0; }
    const grossTax = r.tax, other = r.income - r.tax, room = active ? active.local - funded : 0;
    const taxToProjects = active && r.rank >= hanse ? Math.min(room, Math.floor(grossTax * rate)) : 0;
    funded += taxToProjects; sumTax += taxToProjects;
    const toChestGross = grossTax - taxToProjects + other;
    const b = bookCredit(balance, cap, toChestGross); balance = b.balance; sumLost += b.lost;
    let spend = 0;
    if (login) {
      const buy = (item: string, cost: number, reserve = P.reserve) => {
        if (owned.has(item) || balance < cost + reserve) return false;
        balance -= cost; spend += cost; owned.add(item); bought.push({ item, day: r.day, cost }); return true;
      };
      chest = attemptPurchases({ day: r.day, rank: r.rank, chest, profile: P, charter, way, owned, buy });
    }
    sumSpent += spend;
    let manual = 0;
    if (active && login && cfg.strategy !== "tax_only" && r.rank >= hanse) {
      manual = Math.max(0, Math.min(active.local - funded, balance - P.reserve)); balance -= manual; funded += manual; sumManual += manual;
    }
    const raid = Math.min(balance, r.raid); balance -= raid;
    if (active && funded >= active.local) {
      const build = active.stages.reduce((a, s) => a + s.buildDays, 0);
      buildUntil = Math.max(buildUntil, r.day) + build;
      completed.push({ key: active.key, fundedDay: r.day, doneDay: buildUntil }); completedCost += active.local; active = null; funded = 0;
    }
    const open = all.filter((o) => !owned.has(o.item)), openUnlocked = open.filter((o) => o.rank <= r.rank).length;
    if (!active && next >= queue.length && openUnlocked === 0) idle++;
    const prev = days.at(-1)?.balance ?? start;
    if (grossTax + other !== taxToProjects + toChestGross) errors.push(`d${r.day} split`);
    if (b.booked + b.lost !== toChestGross) errors.push(`d${r.day} chest`);
    if (balance !== prev + b.booked - spend - manual - raid) errors.push(`d${r.day} balance`);
    if (sumTax + sumManual !== completedCost + funded) errors.push(`d${r.day} projects`);
    if (balance < 0 || balance > cap) errors.push(`d${r.day} range`);
    days.push({ day: r.day, rank: r.rank, grossTax, otherIncome: other, taxToProjects, toChestGross, booked: b.booked, lost: b.lost, spent: spend, chest, cap,
      manual, raid, balance, project: active?.key ?? null, funded, completed: completed.length, open: open.length, openUnlocked });
  }
  if (errors.length) throw new Error(`Model C ledger broken: ${errors.slice(0, 5).join(", ")}`);
  return { days, completed, bought, owned: [...owned], spent: sumSpent, taxToProjects: sumTax, manual: sumManual, invested: sumTax + sumManual, lost: sumLost, finalBalance: balance, idleDays: idle, errors };
}

const CSV_HEAD = "profile;charter;location;strategy;taxRate;completed365;invested365;completed730;invested730;taxToProjects;manual;lost;finalBalance;idleDays;errors";
if (import.meta.main) {
  const [pa = "regelmaessig", ca = "trade", la = "base", sa = "all", ra = "all", da = "730"] = process.argv.slice(2);
  const profiles = pa === "all" ? (Object.keys(PROFILES) as ProfileKey[]) : [pa as ProfileKey];
  const charters = (ca === "all" ? ["trade", "craft", "culture", "farm"] : [ca]) as CharterPath[];
  const locs = la === "base" || la === "all" ? BASE_LOCATIONS : [la];
  const rates = ra === "all" ? [0, 0.05, 0.1, 0.2, 0.3] : [Number(ra)];
  const strategies: Strategy[] = sa === "all" ? ["tax_only", "surplus_only", "hybrid"] : [sa as Strategy];
  console.log(CSV_HEAD);
  for (const p of profiles) for (const c of charters) for (const l of locs) {
    const base = simulate({ profile: PROFILES[p], charter: c, location: l, days: Number(da) });
    for (const s of strategies) for (const t of s === "surplus_only" ? [0] : rates) {
      if (s === "hybrid" && t === 0) continue;
      const m = modelC(base.daily, START_TALER, { profile: PROFILES[p], strategy: s, taxRate: t, charter: c, way: base.way as TownWay });
      const at = (d: number) => m.days[Math.min(d, m.days.length) - 1];
      const inv = (d: number) => m.days.slice(0, d).reduce((a, x) => a + x.taxToProjects + x.manual, 0);
      console.log([p, c, l, s, t, at(365)?.completed ?? 0, inv(365), at(730)?.completed ?? 0, inv(730), m.taxToProjects, m.manual, m.lost, m.finalBalance, m.idleDays, m.errors.length].join(";"));
    }
  }
}
