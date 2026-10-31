import { giftBalance, type Gift } from "./gifts";
import { civicWealth, estateAssessment, sickLoss, sickTaxRate } from "./prosperity";
import { questEarned, type QuestClaim } from "./quests";
import { activeBoons } from "./encounters";
import { raidLoss, floodFood } from "./disasters";
import { dowryEarned, weddingJoy, ALLIANCE_MAX, ALLIANCE_WEALTH } from "./weddings";
import { radiusOf, stageOf, effAge, ageHours, links, waterNearby, twinLinks, pactOf, monumentProgress, monumentSteps, MONUMENT_KEYS, type MonumentKey, type Seed, type CharterPath } from "./world";

/** Starting treasury and fixed prices (Taler). Prices mirror the database purchase guard. */
export const START_TALER = 160;
export const ITEMS = { herbs: 90, hunter: 100, fisher: 140, woodcamp: 240, granary: 300, healer: 550, school: 1200, markethall: 450, guildhall: 450, library: 380, dairy: 350, firehouse: 600, guard: 750 } as const;
export type Item = keyof typeof ITEMS;
/**
 * Prestige monuments built in paid steps (prices mirror the database purchase guard).
 * stage = growth stage from which the build menu offers it; bonuses apply once every step is finished.
 */
export const MONUMENTS: Record<MonumentKey, { stage: number; prices: number[]; food?: number; health?: number; wealth?: number }> = {
  belfry: { stage: 3, prices: [400, 500, 600, 700], wealth: 15, health: 5 },
  theater: { stage: 3, prices: [500, 700, 900], wealth: 15, health: 5 },
  cathedral: { stage: 4, prices: [800, 1000, 1200, 1400, 1600], wealth: 20, health: 10 },
  university: { stage: 4, prices: [700, 900, 1100, 1300], wealth: 15, health: 15 },
  exchange: { stage: 4, prices: [700, 900, 1100, 1300], wealth: 20, food: 5 },
  orangery: { stage: 4, prices: [500, 700, 900], health: 15, food: 5, wealth: 10 },
  opera: { stage: 5, prices: [1200, 1500, 1800, 2100], wealth: 25 },
};
/** Flat price list per step item, e.g. { belfry1: 400, …, opera4: 2100 }. */
export const MONUMENT_PRICE: Record<string, number> = Object.fromEntries(
  MONUMENT_KEYS.flatMap((k) => MONUMENTS[k].prices.map((p, i) => [`${k}${i + 1}`, p] as const)));
export type MonumentStep = string;
export const MONUMENT_STAGE = MONUMENTS.belfry.stage;
export const BELFRY_WEALTH = MONUMENTS.belfry.wealth!, BELFRY_HEALTH = MONUMENTS.belfry.health!;
/** Next step of a monument to pay for, or null when all are paid. */
export const nextMonumentStep = (paid: string[], key: MonumentKey = "belfry"): string | null =>
  monumentSteps(key).find((k) => !paid.includes(k)) ?? null;
/** Bonuses of the early buildings that work without water. */
export const HUNTER_FOOD = 15, HERBS_HEALTH = 10, WOODCAMP_WEALTH = 5;
/** Guild buildings: only villages with the matching charter may buy them (mirrored in the database guard). */
export const GUILD: Partial<Record<Item, CharterPath>> = { markethall: "trade", guildhall: "craft", library: "culture", dairy: "farm" };
export const canBuy = (it: Item, path?: string) => !GUILD[it] || GUILD[it] === path;
/** Trade charter: +15 % taxes for every day completed after sealing. */
export const TRADE_TAX = 0.15;
export type Purchase = { id: string; seed_id: string; item: string; cost: number; created_at: string; x?: number | null; y?: number | null };

/** Residents at a given real age (hours); same formula as the database tax function. */
export const popAt = (h: number) => Math.floor(3 + 0.9 * Math.pow(radiusOf(Math.max(0, h)), 1.6));

/** Taxpayers follow the people the land can really feed (mirrors DB village_tax_pop): untended land feeds TAX_POP_BASE, each food/health craft opens more. Sample towns are never capped. */
export const TAX_POP_BASE = 85, TAX_POP_FOOD = 25, TAX_POP_HEALTH = 15;
export const TAX_FOOD = ["fisher", "hunter", "granary", "dairy"], TAX_HEALTH = ["herbs", "healer"];
export function taxPop(s: Seed, h: number, at: number) {
  const p = popAt(h);
  if (!s.user_id) return p;
  const own = new Set((s.bought ?? []).filter((b) => b.at <= at).map((b) => b.item));
  const cap = TAX_POP_BASE + TAX_POP_FOOD * TAX_FOOD.filter((i) => own.has(i)).length + TAX_POP_HEALTH * TAX_HEALTH.filter((i) => own.has(i)).length;
  return Math.min(p, cap);
}

/** One settlement day's tax (day d after founding): estate assessment minus sick loss plus trade bonus. Mirrors DB village_estate_tax. */
export function taxOnDay(s: Seed, d: number) {
  const c0 = Date.parse(s.created_at), at = c0 + d * 86400000;
  const trade = s.charter?.path === "trade" ? s.charter.at : null;
  const p = taxPop(s, d * 24, at);
  const a = estateAssessment(p, civicWealth(s, at));
  return a - sickLoss(a, sickTaxRate(s, at)) + (trade != null && at >= trade ? Math.floor(TRADE_TAX * p) : 0);
}
/** Historical estate assessments (1/2/3 Taler), plus the existing +15% base trade-charter bonus — uncapped. */
export function taxEarned(s: Seed, now: number) {
  const days = Math.floor((now - Date.parse(s.created_at)) / 86400000);
  let t = 0;
  for (let d = 1; d <= days; d++) t += taxOnDay(s, d);
  return t;
}
/** Today's income per day, including the trade charter bonus. */
export const dailyTax = (s: Seed, h: number) => { const at = Date.parse(s.created_at) + h * 3.6e6, p = taxPop(s, h, at); const a = estateAssessment(p, civicWealth(s, at)); return a - sickLoss(a, sickTaxRate(s, at)) + (s.charter?.path === "trade" && s.charter.at <= at ? Math.floor(TRADE_TAX * p) : 0); };

// ---------------- treasure chest (Gemeindetruhe) ----------------
/**
 * The village chest holds only so many Taler: once full, the day's taxes find no room and stay with the burghers.
 * Expansions are purchase rows chest2..4 (prices/ages mirror the DB purchase_guard); the cap applies to settlement
 * days from CHEST_SINCE on, so balances earned before the rule are never cut (mirrors DB village_capped_tax).
 */
export const CHEST_SINCE = Date.parse("2026-10-31T00:00:00Z");
export const CHEST_BASE = 800;
export const CHEST_STEPS = ["chest2", "chest3", "chest4"] as const;
export type ChestStep = (typeof CHEST_STEPS)[number];
export const CHEST_CAP = { chest2: 2500, chest3: 6000, chest4: 15000 } as const;
export const CHEST_PRICE = { chest2: 250, chest3: 800, chest4: 2000 } as const;
/** Real age (hours): Dorf, Handelsstadt, Großstadt. */
export const CHEST_HOURS = { chest2: 168, chest3: 2160, chest4: 4380 } as const;
/** Warning threshold for the optional overflow letter. */
export const CHEST_WARN = 0.9;
type Owned = { seed_id: string; item: string; created_at: string };
/** Chest level 1..4 owned at time `at`. */
export const chestLevel = (seedId: string, purchases: Owned[], at = Infinity) =>
  1 + CHEST_STEPS.filter((k) => purchases.some((p) => p.seed_id === seedId && p.item === k && Date.parse(p.created_at) <= at)).length;
export const chestCap = (seedId: string, purchases: Owned[], at = Infinity) => {
  const l = chestLevel(seedId, purchases, at);
  return l === 1 ? CHEST_BASE : CHEST_CAP[CHEST_STEPS[l - 2]!];
};
/** Why the next expansion cannot be bought yet, or null. */
export function chestBlock(s: Seed, purchases: Owned[], now: number): null | "age" | "max" {
  const l = chestLevel(s.id, purchases);
  if (l === 4) return "max";
  return (now - Date.parse(s.created_at)) / 3.6e6 < CHEST_HOURS[CHEST_STEPS[l - 1]!] ? "age" : null;
}

/** Ledger entries besides tax/dowry/raids with their time — the same rows DB village_balance sums. */
function ledger(s: Seed, purchases: Purchase[], gifts: Gift[], claims: QuestClaim[]) {
  const out: [number, number][] = [];
  for (const p of purchases) if (p.seed_id === s.id) out.push([Date.parse(p.created_at), -p.cost]);
  for (const d of s.decisions ?? []) out.push([d.at, -d.cost]);
  for (const w of s.works ?? []) out.push([w.at, -w.cost]);
  for (const g of gifts) if (g.to_seed === s.id || g.from_seed === s.id) out.push([Date.parse(g.created_at), g.to_seed === s.id ? g.amount : -g.amount]);
  for (const c of claims) if (c.seed_id === s.id) out.push([Date.parse(c.created_at), c.reward]);
  return out;
}

/**
 * Taxes that actually reached the chest: day by day, entries booked before the settlement count, and from
 * CHEST_SINCE on the day's tax only fills the room left below the chest cap. Mirrors DB village_capped_tax.
 */
export function cappedTax(s: Seed, purchases: Purchase[], now: number, gifts: Gift[] = [], claims: QuestClaim[] = []) {
  const c0 = Date.parse(s.created_at);
  const days = Math.floor((now - c0) / 86400000);
  const byDay = new Map<number, number>();
  for (const [at, v] of ledger(s, purchases, gifts, claims)) {
    const k = Math.max(0, Math.floor((at - c0) / 86400000));
    byDay.set(k, (byDay.get(k) ?? 0) + v);
  }
  const mine = purchases.filter((p) => p.seed_id === s.id);
  let run = START_TALER, tax = 0;
  for (let d = 1; d <= days; d++) {
    run += byDay.get(d - 1) ?? 0;
    const at = c0 + d * 86400000;
    let a = taxOnDay(s, d);
    if (at >= CHEST_SINCE && s.user_id) a = Math.min(a, Math.max(0, chestCap(s.id, mine, at) - run));
    run += a; tax += a;
  }
  return tax;
}

export function treasury(s: Seed, purchases: Purchase[], now: number, gifts: Gift[] = [], claims: QuestClaim[] = []) {
  const spent = purchases.filter((p) => p.seed_id === s.id).reduce((a, p) => a + p.cost, 0);
  const ev = (s.decisions ?? []).reduce((a, d) => a + d.cost, 0);
  const tw = (s.works ?? []).reduce((a, w) => a + w.cost, 0);
  return START_TALER + cappedTax(s, purchases, now, gifts, claims) + dowryEarned(s, now) - spent - ev - tw + giftBalance(s.id, gifts) + questEarned(claims, s.id) - raidLoss(s, now);
}


const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));
/** Base values before buildings; a full larder (supply 1) adds SUPPLY_FOOD. */
export const FOOD_BASE = 20, HEALTH_BASE = 25, SUPPLY_FOOD = 30;
/** Residents one hut serves fully; above that its bonus shrinks, but never below PER_HEAD_MIN. */
export const PER_HEAD_POP = 25, PER_HEAD_MIN = 0.4;
export const perHead = (pop: number) => Math.max(PER_HEAD_MIN, Math.min(1, PER_HEAD_POP / Math.max(1, pop)));

/** Village attributes 0–100, derived from age, trade, charter, larder and purchased buildings. */
export function attributes(s: Seed, seeds: Seed[], purchases: Purchase[], now: number, alliances = 0, stores?: { food: number; health: number; wealth: number; supply?: number }) {
  const has = (i: Item | MonumentStep) => purchases.some((p) => p.seed_id === s.id && p.item === i);
  // twins share wells, healer and school at half strength; a protective pact adds health
  const twins = twinLinks(s, seeds, now).map((l) => (l.a.id === s.id ? l.b : l.a));
  const near = (i: Item) => !has(i) && twins.some((o) => purchases.some((p) => p.seed_id === o.id && p.item === i));
  const shield = twins.some((o) => pactOf(s, o, seeds, now)?.kind === "shield");
  const trade = links(seeds).filter((l) => (l.a.id === s.id || l.b.id === s.id) && now >= l.since).length;
  const stage = stageOf(effAge(s, seeds, now));
  const path = s.charter && s.charter.at <= now ? s.charter.path : null;
  // single huts feed/heal a small village fully; in bigger towns their share shrinks (per-capita need)
  const k = perHead(popAt(ageHours(s, now)));
  const supply = stores?.supply ?? 0;
  const food = clamp(FOOD_BASE + SUPPLY_FOOD * supply + k * ((has("fisher") ? (waterNearby(s.x, s.y) ? 20 : 8) : 0) + (has("hunter") ? HUNTER_FOOD : 0) + (has("granary") ? 15 : 0) + (has("dairy") ? 15 : 0))
    + Math.min(15, trade * (path === "trade" ? 8 : 5)) + (path === "farm" ? 15 : 0));
  const health = clamp(HEALTH_BASE + (food - 50) * 0.3 + k * ((has("healer") ? 20 : 0) + (has("herbs") ? HERBS_HEALTH : 0) + (has("library") ? 10 : 0))
    + (path === "culture" ? 15 : 0) + (near("healer") ? 15 : 0) + (shield ? 10 : 0));
  const wealth = clamp(25 + Math.min(30, trade * 10) + (has("school") ? 20 : 0) + stage * 5 + (path === "craft" ? 10 : 0)
    + (near("school") ? 10 : 0) + (has("guildhall") ? 15 : 0) + (has("markethall") ? 15 : 0) + (has("library") ? 10 : 0) + (has("dairy") ? 5 : 0) + (has("woodcamp") ? WOODCAMP_WEALTH : 0));
  const b = activeBoons(s.decisions ?? [], now);
  const rb = rankBoons(s, purchases); b.food += rb.food; b.health += rb.health; b.wealth += rb.wealth;
  const tb = titleBoons(s, purchases); b.food += tb.food; b.health += tb.health; b.wealth += tb.wealth;
  for (const k of MONUMENT_KEYS) {
    const m = MONUMENTS[k];
    if (!has(`${k}${m.prices.length}` as Item) || monumentProgress(s, now, k) < 1) continue;
    b.food += m.food ?? 0; b.health += m.health ?? 0; b.wealth += m.wealth ?? 0;
  }
  b.food += floodFood(s, now); b.health += has("firehouse") ? 5 : 0; b.wealth += has("guard") ? 5 : 0;
  // weddings: a day of joy (health, prosperity) and lasting craft alliances between families
  const joy = weddingJoy(s, now);
  b.health += joy ? 10 : 0; b.wealth += (joy ? 5 : 0) + Math.min(ALLIANCE_MAX, alliances * ALLIANCE_WEALTH);
  if (stores) { b.food += stores.food; b.health += stores.health; b.wealth += stores.wealth; }
  return { food: clamp(food + b.food), health: clamp(health + b.health), wealth: clamp(wealth + b.wealth), has };
}

// ---------------- guild ranks (Lehrling · Geselle · Meister) ----------------
/** Rank steps bought as purchases; prices, ages and requirements mirror the database purchase guard. */
export const RANK_PRICE = { rank2: 250, rank3: 800 } as const;
export type RankStep = keyof typeof RANK_PRICE;
/** Real age (hours) before each exam: Dorf for journeymen, Handelsstadt for masters. */
export const RANK_HOURS = { rank2: 168, rank3: 4380 } as const;
export const RANK_ROADS = 2;
export const GUILD_OF: Record<CharterPath, Item> = { trade: "markethall", craft: "guildhall", culture: "library", farm: "dairy" };
/** Current rank 0 (no charter) … 3 (master), derived from purchase rows. */
export const rankOf = (s: Seed, purchases: { seed_id: string; item: string }[]) => {
  if (!s.charter) return 0;
  const own = purchases.filter((p) => p.seed_id === s.id).map((p) => p.item);
  return own.includes("rank3") ? 3 : own.includes("rank2") ? 2 : 1;
};
/** Rank from Seed.bought (for pure world code). */
export const rankOfSeed = (s: Seed) => rankOf(s, (s.bought ?? []).map((b) => ({ seed_id: s.id, item: b.item })));
/** Why the next exam is not open yet, or null when it may be paid. */
export function rankBlock(s: Seed, purchases: { seed_id: string; item: string }[], now: number, roads: number): null | "charter" | "age" | "guild" | "belfry" | "roads" | "max" {
  const r = rankOf(s, purchases);
  if (r === 0) return "charter";
  if (r === 3) return "max";
  const step: RankStep = r === 1 ? "rank2" : "rank3";
  if ((now - Date.parse(s.created_at)) / 3.6e6 < RANK_HOURS[step]) return "age";
  const own = (i: string) => purchases.some((p) => p.seed_id === s.id && p.item === i);
  if (step === "rank2") return own(GUILD_OF[s.charter!.path]) ? null : "guild";
  if (!own("belfry4")) return "belfry";
  return roads >= RANK_ROADS ? null : "roads";
}
/** Attribute bonuses per path and rank (journeyman, master) — derived, never stored. */
export const RANK_BONUS: Record<CharterPath, [Partial<Record<"food" | "health" | "wealth", number>>, Partial<Record<"food" | "health" | "wealth", number>>]> = {
  trade: [{ wealth: 10 }, { wealth: 10, food: 10 }],
  craft: [{ wealth: 5 }, { wealth: 15 }],
  culture: [{ health: 10 }, { health: 20 }],
  farm: [{ food: 10 }, { food: 10, wealth: 10 }],
};
/** Craft journeymen build 20 % faster; farm journeymen store 40 more sheaves. */
export const CRAFT_RANK_BUILD = 0.8, FARM_RANK_GRAIN = 40;
export function rankBoons(s: Seed, purchases: { seed_id: string; item: string }[]) {
  const r = rankOf(s, purchases), out = { food: 0, health: 0, wealth: 0 };
  if (!s.charter || r < 2) return out;
  for (const b of RANK_BONUS[s.charter.path].slice(0, r - 1)) for (const k of ["food", "health", "wealth"] as const) out[k] += b[k] ?? 0;
  return out;
}

// ---------------- mayor's titles (Amt & Würden) ----------------
/** Honorary titles bought as purchase rows title1..3; prices, ages and requirements mirror the database purchase guard. */
export const TITLE_PRICE = { title1: 500, title2: 1200, title3: 2500 } as const;
export type TitleStep = keyof typeof TITLE_PRICE;
export const TITLE_STEPS: TitleStep[] = ["title1", "title2", "title3"];
/** Real age (hours) before each appointment: Kleinstadt, Handelsstadt, Metropole. */
export const TITLE_HOURS = { title1: 2160, title2: 4380, title3: 8760 } as const;
/** Guild rank required for each appointment (journeyman, master, master). */
export const TITLE_RANK = { title1: 2, title2: 3, title3: 3 } as const;
/** Current title 0 (none) … 3, derived from purchase rows. */
export const titleOf = (s: Seed, purchases: { seed_id: string; item: string }[]) => {
  const own = purchases.filter((p) => p.seed_id === s.id).map((p) => p.item);
  return own.includes("title3") ? 3 : own.includes("title2") ? 2 : own.includes("title1") ? 1 : 0;
};
export const titleOfSeed = (s: Seed) => titleOf(s, (s.bought ?? []).map((b) => ({ seed_id: s.id, item: b.item })));
/** Why the next appointment is not open yet, or null when it may be paid. */
export function titleBlock(s: Seed, purchases: { seed_id: string; item: string }[], now: number): null | "charter" | "age" | "rank" | "max" {
  if (!s.charter) return "charter";
  const n = titleOf(s, purchases);
  if (n === 3) return "max";
  const step = TITLE_STEPS[n]!;
  if ((now - Date.parse(s.created_at)) / 3.6e6 < TITLE_HOURS[step]) return "age";
  return rankOf(s, purchases) >= TITLE_RANK[step] ? null : "rank";
}
/** Attribute bonuses per path for each title — derived, never stored. */
export const TITLE_BONUS: Record<CharterPath, Partial<Record<"food" | "health" | "wealth", number>>[]> = {
  trade: [{ wealth: 5 }, { wealth: 10 }, { wealth: 10, food: 5 }],
  craft: [{ wealth: 5 }, { wealth: 5, health: 5 }, { wealth: 15 }],
  culture: [{ health: 5 }, { health: 10 }, { health: 10, wealth: 5 }],
  farm: [{ food: 5 }, { food: 10 }, { food: 10, health: 5 }],
};
export function titleBoons(s: Seed, purchases: { seed_id: string; item: string }[]) {
  const n = titleOf(s, purchases), out = { food: 0, health: 0, wealth: 0 };
  if (!s.charter) return out;
  for (const b of TITLE_BONUS[s.charter.path].slice(0, n)) for (const k of ["food", "health", "wealth"] as const) out[k] += b[k] ?? 0;
  return out;
}
