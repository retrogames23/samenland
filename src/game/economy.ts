import type { TownWay } from "./character";
import { giftBalance, type Gift } from "./gifts";
import { FOOD_CRAFTS } from "./food-crafts";
import { civicWealth, estateAssessment, sickLoss, sickTaxRate, prosperityAt } from "./prosperity";
import { householdsOf } from "./households";
import { residentTax } from "./resident-tax";
import { questEarned, type QuestClaim } from "./quests";
import { activeBoons } from "./encounters";
import { raidLoss, raids, floodFood, ITEM_RANK } from "./disasters";
import { dowryEarned, weddingDates, weddingJoy, ALLIANCE_MAX, ALLIANCE_WEALTH } from "./weddings";
import { speedParts, radiusOf, stageOf, effAge, ageHours, links, waterNearby, twinLinks, pactOf, monumentProgress, monumentSteps, monumentOf, MONUMENT_KEYS, type MonumentKey, type Seed, type CharterPath } from "./world";

/** Starting treasury and fixed prices (Mark). Prices mirror the database purchase guard. */
export const START_TALER = 160;
export const ITEMS = { herbs: 90, backhaus: 260, herberge: 420, beginen: 900, badestube: 700, hunter: 100, fisher: 140, woodcamp: 240, granary: 300, healer: 550, school: 1200, markethall: 450, guildhall: 450, library: 380, dairy: 350, fireorder: 400, firehouse: 600, guard: 750, bigstore: 380, stonemason: 380, smokehouse: 380, millrow: 700, hammerworks: 700, saltquay: 700 } as const;
export type Item = keyof typeof ITEMS;
/**
 * Prestige monuments built in paid steps (prices mirror the database purchase guard).
 * stage = growth stage from which the build menu offers it; bonuses apply once every step is finished.
 */
export const MONUMENTS: Record<MonumentKey, { rank: number; prices: number[]; food?: number; health?: number; wealth?: number; way?: TownWay }> = {
  belfry: { rank: 3, prices: [400, 500, 600, 700], wealth: 15, health: 5 },
  theater: { rank: 3, prices: [500, 700, 900], wealth: 15, health: 5 },
  cathedral: { rank: 4, prices: [800, 1000, 1200, 1400, 1600], wealth: 20, health: 10 },
  university: { rank: 4, prices: [700, 900, 1100, 1300], wealth: 15, health: 15 },
  exchange: { rank: 4, prices: [700, 900, 1100, 1300], wealth: 20, food: 5 },
  orangery: { rank: 4, prices: [500, 700, 900], health: 15, food: 5, wealth: 10 },
  opera: { rank: 5, prices: [1200, 1500, 1800, 2100], wealth: 25 },
  // Way monuments: one per town character, same price and same bonus total (25), so no founding site is favoured.
  harvest: { rank: 3, prices: [450, 600, 750], food: 15, health: 5, wealth: 5, way: "grain" },
  guildtower: { rank: 3, prices: [450, 600, 750], wealth: 15, health: 10, way: "workshop" },
  lighthouse: { rank: 3, prices: [450, 600, 750], wealth: 10, food: 10, health: 5, way: "gateway" },
};
/** Flat price list per step item, e.g. { belfry1: 400, …, opera4: 2100 }. */
export const MONUMENT_PRICE: Record<string, number> = Object.fromEntries(
  MONUMENT_KEYS.flatMap((k) => MONUMENTS[k].prices.map((p, i) => [`${k}${i + 1}`, p] as const)));
export type MonumentStep = string;
/** Settlement rank each monument needs; all its steps are then buyable one after another without waiting. */
export const MONUMENT_RANK = Object.fromEntries(MONUMENT_KEYS.map((k) => [k, MONUMENTS[k].rank])) as Record<MonumentKey, number>;
export const MONUMENT_STAGE = MONUMENT_RANK.belfry;
export const BELFRY_WEALTH = MONUMENTS.belfry.wealth!, BELFRY_HEALTH = MONUMENTS.belfry.health!;
/** Next step of a monument to pay for, or null when all are paid. */
export const nextMonumentStep = (paid: string[], key: MonumentKey = "belfry"): string | null =>
  monumentSteps(key).find((k) => !paid.includes(k)) ?? null;
/** Bonuses of the early buildings that work without water. */
/** Community buildings (Schritt 4): communal bakehouse, journeymen's hostel, beguinage. */
export const BACKHAUS_HEALTH = 5, HERBERGE_WEALTH = 5, BEGINEN_WEALTH = 15, BEGINEN_HEALTH = 10;
/** Badestube (ab Kleinstadt): bath, shave, cupping — health first, a little prosperity. */
export const BADESTUBE_HEALTH = 10, BADESTUBE_WEALTH = 5;
export const HUNTER_FOOD = 15, HERBS_HEALTH = 10, WOODCAMP_WEALTH = 5;
/** Guild buildings: only villages with the matching charter may buy them (mirrored in the database guard). */
export const GUILD: Partial<Record<Item, CharterPath>> = { markethall: "trade", guildhall: "craft", library: "culture", dairy: "farm" };
export const canBuy = (it: Item, path?: string) => !GUILD[it] || GUILD[it] === path;
/** Way buildings: only towns of the matching character may buy them (DB guard: one way family per village). Equal prices and bonus totals (20 / 30) per tier, so no founding site is favoured. */
export const WAY_ITEM: Partial<Record<Item, TownWay>> = { bigstore: "grain", millrow: "grain", stonemason: "workshop", hammerworks: "workshop", smokehouse: "gateway", saltquay: "gateway" };
export const WAY_BONUS: Record<string, { food?: number; health?: number; wealth?: number }> = {
  bigstore: { food: 15, wealth: 5 }, stonemason: { wealth: 10, health: 10 }, smokehouse: { food: 10, wealth: 10 },
  millrow: { food: 20, wealth: 10 }, hammerworks: { wealth: 20, health: 10 }, saltquay: { wealth: 20, food: 10 },
};
export const canBuyWay = (it: Item, way?: TownWay) => !WAY_ITEM[it] || WAY_ITEM[it] === way;
/** Trade charter: +15 % taxes for every day completed after sealing. */
export const TRADE_TAX = 0.15;
export type Purchase = { id: string; seed_id: string; item: string; cost: number; created_at: string; x?: number | null; y?: number | null };

/** Residents at a given real age (hours); same formula as the database tax function. */
export const popAt = (h: number) => Math.floor(3 + 0.9 * Math.pow(radiusOf(Math.max(0, h)), 1.6));

/** Taxpayers follow the people the land can really feed (mirrors DB village_tax_pop): untended land feeds TAX_POP_BASE, each food/health craft opens more. Sample towns are never capped. */
export const TAX_POP_BASE = 85, TAX_POP_FOOD = 25, TAX_POP_HEALTH = 15;
export const TAX_FOOD: readonly string[] = FOOD_CRAFTS, TAX_HEALTH = ["herbs", "healer", "library"];
export function taxPop(s: Seed, h: number, at: number) {
  const p = popAt(h);
  if (!s.user_id) return p;
  const own = new Set((s.bought ?? []).filter((b) => b.at <= at).map((b) => b.item));
  const cap = TAX_POP_BASE + TAX_POP_FOOD * TAX_FOOD.filter((i) => own.has(i)).length + TAX_POP_HEALTH * TAX_HEALTH.filter((i) => own.has(i)).length;
  return Math.min(p, cap);
}

/** Legacy estate assessment (before CAP_ALL_SINCE only — frozen balances, mirrors DB village_estate_tax_legacy). */
export function assessAt(s: Seed, p: number, at: number) {
  return estateAssessment(p, civicWealth(s, at));
}
/** Neighbours as they stood at `at` (same filter as economyWorldAt on the server); [s] only as a fallback for callers without a network. */
const worldAt = (s: Seed, seeds: Seed[] | undefined, at: number) => {
  const w = (seeds ?? [s]).filter((o) => Date.parse(o.created_at) <= at);
  return w.some((o) => o.id === s.id) ? w : [...w, s];
};
/** Past settlement days are stable for identical inputs: memo keyed by day plus a fingerprint of the network. */
const taxMemo = new Map<string, number>();
/** Fingerprint of every tax-relevant network input (ids, positions, founding, purchases, roads, civic roads, blessings, charter, twin votes/works, aid) — content, not counts, so any change re-assesses. */
const h32 = (k: string, v: string) => { let h = 2166136261; for (let i = 0; i < v.length; i++) h = Math.imul(h ^ v.charCodeAt(i), 16777619); return k + (h >>> 0).toString(36); };
const netKey = (seeds: Seed[]) => h32("", seeds.map((o) => JSON.stringify([o.id, o.x, o.y, o.created_at, o.user_id ?? null, o.bought ?? null, o.roads ?? null, o.civicRoads ?? null, o.blessed ?? null, o.charter ?? null, (o as { twins?: unknown }).twins ?? null, o.works ?? null, (o as { aid?: unknown }).aid ?? null])).join("|")) + ":" + seeds.length;
/** From CAP_ALL_SINCE the one trusted assessment: residentTax (real households, tile rolls, real rank with trade roads). */
function residentIncome(s: Seed, seeds: Seed[] | undefined, at: number) {
  const w = worldAt(s, seeds, at);
  const k = `${s.id}|${at}|${netKey(w)}`;
  let v = taxMemo.get(k);
  if (v === undefined) { v = residentTax(s, w, at).income; if (taxMemo.size > 5000) taxMemo.clear(); taxMemo.set(k, v); }
  return v;
}
/** One settlement day's tax (day d after founding). Before CAP_ALL_SINCE: legacy estimate (mirrors DB village_estate_tax);
 *  from then on residentTax with the full seeds network, exactly as the server receipts. */
export function taxOnDay(s: Seed, d: number, seeds?: Seed[]) {
  const c0 = Date.parse(s.created_at), at = c0 + d * 86400000;
  if (s.user_id && at >= CAP_ALL_SINCE) return residentIncome(s, seeds, at);
  const trade = s.charter?.path === "trade" ? s.charter.at : null;
  const p = taxPop(s, d * 24, at);
  const a = assessAt(s, p, at);
  return a - sickLoss(a, sickTaxRate(s, at)) + (trade != null && at >= trade ? Math.floor(TRADE_TAX * p) : 0);
}
/** Historical estate assessments (1/2/3 Mark), plus the existing +15% base trade-charter bonus — uncapped. */
export function taxEarned(s: Seed, now: number, seeds?: Seed[]) {
  const days = Math.floor((now - Date.parse(s.created_at)) / 86400000);
  let t = 0;
  for (let d = 1; d <= days; d++) t += taxOnDay(s, d, seeds);
  return t;
}
/** Today's income per day, including the trade charter bonus. */
export const dailyTax = (s: Seed, h: number, seeds?: Seed[]) => {
  const at = Date.parse(s.created_at) + h * 3.6e6;
  if (s.user_id && at >= CAP_ALL_SINCE) return residentTax(s, worldAt(s, seeds, at), at).income;
  const p = taxPop(s, h, at); const a = assessAt(s, p, at);
  return a - sickLoss(a, sickTaxRate(s, at)) + (s.charter?.path === "trade" && s.charter.at <= at ? Math.floor(TRADE_TAX * p) : 0);
};


/** Friend-invite bonus (mirrors DB referrals in village_balance): both villages get the reward. */
export const REFERRAL_TALER = 50;
export type Referral = { id: string; referrer_seed: string; referee_seed: string; reward: number; created_at: string };
export const referralClaims = (rows: Referral[]): QuestClaim[] => rows.flatMap((r) => [
  { id: `${r.id}:a`, seed_id: r.referrer_seed, quest: `ref:${r.referee_seed}`, reward: r.reward, created_at: r.created_at },
  { id: `${r.id}:b`, seed_id: r.referee_seed, quest: `ref:${r.referrer_seed}`, reward: r.reward, created_at: r.created_at },
]);

/** Mayor visit welcome gift by the visited town's raw age (mirrors DB visit_reward): 30 → 150 Mark. */
export const VISIT_STEPS: [number, number][] = [[8760, 150], [4380, 100], [2160, 75], [168, 50], [24, 40], [0, 30]];
export const visitReward = (h: number) => VISIT_STEPS.find(([a]) => h >= a)![1];
export type Visit = { id: string; visitor_seed: string; visited_seed: string; reward: number; created_at: string };
export const visitClaims = (rows: Visit[]): QuestClaim[] => rows.map((v) => ({ id: `${v.id}:v`, seed_id: v.visitor_seed, quest: `visit:${v.visited_seed}`, reward: v.reward, created_at: v.created_at }));

// ---------------- treasure chest (Gemeindetruhe) ----------------
/**
 * The village chest holds only so many Mark: once full, the day's taxes find no room and stay with the burghers.
 * Expansions are purchase rows chest2..4 (prices/ages mirror the DB purchase_guard); the cap applies to settlement
 * days from CHEST_SINCE on, so balances earned before the rule are never cut (mirrors DB village_capped_tax).
 */
export const CHEST_SINCE = Date.parse("2026-10-31T00:00:00Z");
export const CHEST_BASE = 1200;
export const CHEST_STEPS = ["chest2", "chest3", "chest4"] as const;
export type ChestStep = (typeof CHEST_STEPS)[number];
export const CHEST_CAP = { chest2: 4000, chest3: 10000, chest4: 25000 } as const;
export const CHEST_PRICE = { chest2: 250, chest3: 800, chest4: 2000 } as const;
/** Real age (hours): Dorf, Handelsstadt, Großstadt. */
/** Settlement rank (townRank) each expansion needs: Dorf, Kleinstadt, Handelsstadt — mirrors DB purchase_guard need_rank. */
export const CHEST_STAGE = { chest2: 2, chest3: 3, chest4: 4 } as const;
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
export function chestBlock(s: Seed, purchases: Owned[], townRank: number): null | "rank" | "max" {
  const l = chestLevel(s.id, purchases);
  if (l === 4) return "max";
  return townRank < CHEST_STAGE[CHEST_STEPS[l - 1]!] ? "rank" : null;
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
/** Raids empty the chest too, so later taxes may refill it (mirrors DB village_capped_tax). */
function raidLedger(s: Seed, now: number): [number, number][] {
  return raids(s, now).filter((r) => r.loss > 0).map((r) => [r.at, -r.loss]);
}

/**
 * Taxes that actually reached the chest: day by day, entries booked before the settlement count, and from
 * CHEST_SINCE on the day's tax only fills the room left below the chest cap. Mirrors DB village_capped_tax.
 */
export function cappedTax(s: Seed, purchases: Purchase[], now: number, gifts: Gift[] = [], claims: QuestClaim[] = [], before = Infinity) {
  const c0 = Date.parse(s.created_at);
  const days = Math.floor((now - c0) / 86400000);
  const byDay = new Map<number, number>();
  for (const [at, v] of [...ledger(s, purchases, gifts, claims), ...raidLedger(s, now)]) {
    const k = Math.max(0, Math.floor((at - c0) / 86400000));
    byDay.set(k, (byDay.get(k) ?? 0) + v);
  }
  const mine = purchases.filter((p) => p.seed_id === s.id);
  let run = START_TALER, tax = 0;
  for (let d = 1; d <= days; d++) {
    run += byDay.get(d - 1) ?? 0;
    const at = c0 + d * 86400000;
    if (at >= before) break; // the day exactly at the walk start belongs to the walk (full network)
    let a = taxOnDay(s, d);
    if (at >= CHEST_SINCE && s.user_id) a = Math.min(a, Math.max(0, chestCap(s.id, mine, at) - run));
    run += a; tax += a;
  }
  return tax;
}

/** Pre-rule balance formula: taxes capped day by day, dowries after CHEST_SINCE capped once, other income uncapped. */
function legacyTreasury(s: Seed, purchases: Purchase[], now: number, gifts: Gift[] = [], claims: QuestClaim[] = [], before = Infinity) {
  const spent = purchases.filter((p) => p.seed_id === s.id).reduce((a, p) => a + p.cost, 0);
  const ev = (s.decisions ?? []).reduce((a, d) => a + d.cost, 0);
  const tw = (s.works ?? []).reduce((a, w) => a + w.cost, 0);
  const base = START_TALER + cappedTax(s, purchases, now, gifts, claims, before) - spent - ev - tw + giftBalance(s.id, gifts) + questEarned(claims, s.id);
  const dOld = Date.parse(s.created_at) < CHEST_SINCE ? dowryEarned(s, Math.min(now, CHEST_SINCE)) : 0;
  let dNew = dowryEarned(s, now) - dOld;
  if (s.user_id) dNew = Math.min(dNew, Math.max(0, chestCap(s.id, purchases, now) - base - dOld));
  return Math.max(0, base + dOld + dNew - raidLoss(s, now));
}

/**
 * From CAP_ALL_SINCE on, the chest is walked booking by booking: every credit (tax, dowry, market, wonder,
 * decree, quest, visit, referral, gift, encounter reward) only fills the room below the cap valid at that
 * moment, the surplus is lost for good; spending makes room for later credits. The balance at
 * CAP_ALL_SINCE is the unchanged legacy result, so no existing balance is touched. Mirrors DB village_balance.
 * Same-time order: tax 0, dowry 1, other credits 2, debits 3, raids 4, then key.
 */
export const CAP_ALL_SINCE = Date.parse("2026-11-12T00:00:00Z");
export type ChestEvent = { t: number; r: number; v: number; k: string };
export function walkChest(start: number, events: ChestEvent[], capAt: (t: number) => number) {
  let bal = start;
  const sorted = [...events].sort((a, b) => a.t - b.t || a.r - b.r || (a.k < b.k ? -1 : a.k > b.k ? 1 : 0));
  for (const e of sorted) {
    if (e.r === 4) bal = Math.max(0, bal - e.v);
    else if (e.v > 0) bal += Math.min(e.v, Math.max(0, capAt(e.t) - bal));
    else bal += e.v;
  }
  return Math.max(0, bal);
}

/** `receipts` (settlement day → income) are the stored tax_receipts: a booked day is binding (also 0), only unbooked days
 *  are forecast via taxOnDay. The result stays a forecast — the authoritative chest is DB village_balance (accounting.balance). */
export function treasury(s: Seed, purchases: Purchase[], now: number, gifts: Gift[] = [], claims: QuestClaim[] = [], since = CAP_ALL_SINCE, seeds?: Seed[], receipts?: Readonly<Record<number, number>>) {
  if (!s.user_id || now < since) return legacyTreasury(s, purchases, now, gifts, claims);
  const T = since, pre = (iso: string) => Date.parse(iso) < T;
  const pre0 = { ...s, decisions: (s.decisions ?? []).filter((d) => d.at < T), works: (s.works ?? []).filter((w) => w.at < T) };
  const start = legacyTreasury(pre0, purchases.filter((p) => pre(p.created_at)), T, gifts.filter((g) => pre(g.created_at)), claims.filter((c) => pre(c.created_at)), T);
  const ev: ChestEvent[] = [];
  const c0 = Date.parse(s.created_at);
  for (let d = Math.max(1, Math.ceil((T - c0) / 86400000)); c0 + d * 86400000 <= now; d++) ev.push({ t: c0 + d * 86400000, r: 0, v: receipts?.[d] ?? taxOnDay(s, d, seeds), k: `d${d}` });
  for (const w of weddingDates(s, now)) if (w.at > T) ev.push({ t: w.at, r: 1, v: w.dowry, k: `w${w.k}` });
  ledger(s, purchases, gifts, claims).forEach(([t, v], i) => { if (t >= T && t <= now && v !== 0) ev.push({ t, r: v > 0 ? 2 : 3, v, k: `l${i}` }); });
  for (const r of raids(s, now)) if (r.at > T && r.loss > 0) ev.push({ t: r.at, r: 4, v: r.loss, k: `r${r.at}` });
  const mine = purchases.filter((p) => p.seed_id === s.id);
  return walkChest(start, ev, (t) => chestCap(s.id, mine, t));
}

const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));
/** Soft ceiling: values count fully up to SOFT_KNEE, above that they approach 100 ever more slowly,
 * so late prestige buildings stay visible instead of vanishing into a hard cap. */
export const SOFT_KNEE = 50, SOFT_SPAN = 60;
export const soften = (v: number) => clamp(v <= SOFT_KNEE ? v : SOFT_KNEE + (100 - SOFT_KNEE) * (1 - Math.exp(-(v - SOFT_KNEE) / SOFT_SPAN)));
/** Prosperity per finished trade road: degressive, but every road still counts. */
export const ROAD_WEALTH = [10, 8, 6, 4], ROAD_WEALTH_TAIL = 3;
export const roadWealth = (n: number) => { let w = 0; for (let i = 0; i < n; i++) w += ROAD_WEALTH[i] ?? ROAD_WEALTH_TAIL; return w; };
/** Base values before buildings; a full larder (supply 1) adds SUPPLY_FOOD. */
export const FOOD_BASE = 20, HEALTH_BASE = 25, SUPPLY_FOOD = 20;
/** Residents one hut serves fully; above that its bonus shrinks, but never below PER_HEAD_MIN. */
export const PER_HEAD_POP = 25, PER_HEAD_MIN = 0.3;
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
  const b = activeBoons(s.decisions ?? [], now);
  const rb = rankBoons(s, purchases); b.food += rb.food; b.health += rb.health;
  const tb = titleBoons(s, purchases); b.food += tb.food; b.health += tb.health;
  for (const k of MONUMENT_KEYS) {
    const m = MONUMENTS[k];
    // every finished step gives its share; the last step completes the full bonus
    const f = monumentProgress(s, now, k); if (f <= 0) continue;
    b.food += Math.round((m.food ?? 0) * f); b.health += Math.round((m.health ?? 0) * f);
  }
  for (const [it, wb] of Object.entries(WAY_BONUS)) if (has(it as Item)) { b.food += wb.food ?? 0; b.health += wb.health ?? 0; }
  b.health += has("backhaus") ? BACKHAUS_HEALTH : 0;
  if (has("beginen")) b.health += BEGINEN_HEALTH;
  if (has("badestube")) { b.health += BADESTUBE_HEALTH; }
  b.food += floodFood(s, now); b.health += has("firehouse") ? 5 : 0;
  // weddings: a day of joy (health, prosperity) and lasting craft alliances between families
  const joy = weddingJoy(s, now);
  b.health += joy ? 10 : 0;
  if (stores) { b.food += stores.food; b.health += stores.health; }
  // Wohlstand comes only from prosperityAt (same source as estates, house paint and resident tax); no side bonuses.
  return { food: soften(food + b.food), health: soften(health + b.health), wealth: Math.round(prosperityAt(s, now, householdsOf(s, seeds, now).reduce((n, h) => n + h.size, 0))), has };
}

// ---------------- guild ranks (Lehrling · Geselle · Meister) ----------------
/** Rank steps bought as purchases; prices, ages and requirements mirror the database purchase guard. */
export const RANK_PRICE = { rank2: 250, rank3: 800 } as const;
export type RankStep = keyof typeof RANK_PRICE;
/** Settlement rank (townRank) before each exam: Dorf for journeymen, Handelsstadt for masters — mirrors DB need_rank. */
export const RANK_STAGE = { rank2: 2, rank3: 4 } as const;
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
export function rankBlock(s: Seed, purchases: { seed_id: string; item: string }[], townRank: number, roads: number): null | "charter" | "age" | "guild" | "belfry" | "roads" | "max" {
  const r = rankOf(s, purchases);
  if (r === 0) return "charter";
  if (r === 3) return "max";
  const step: RankStep = r === 1 ? "rank2" : "rank3";
  if (townRank < RANK_STAGE[step]) return "age";
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
/** Settlement rank (townRank) each appointment needs: Kleinstadt, Handelsstadt, Hansestadt — mirrors DB purchase_guard need_rank. */
export const TITLE_STAGE = { title1: 3, title2: 4, title3: 5 } as const;
/** Guild rank required for each appointment (journeyman, master, master). */
export const TITLE_RANK = { title1: 2, title2: 3, title3: 3 } as const;
/** Current title 0 (none) … 3, derived from purchase rows. */
export const titleOf = (s: Seed, purchases: { seed_id: string; item: string }[]) => {
  const own = purchases.filter((p) => p.seed_id === s.id).map((p) => p.item);
  return own.includes("title3") ? 3 : own.includes("title2") ? 2 : own.includes("title1") ? 1 : 0;
};
export const titleOfSeed = (s: Seed) => titleOf(s, (s.bought ?? []).map((b) => ({ seed_id: s.id, item: b.item })));
/** Why the next appointment is not open yet, or null when it may be paid. */
export function titleBlock(s: Seed, purchases: { seed_id: string; item: string }[], townRank: number): null | "charter" | "age" | "rank" | "max" {
  if (!s.charter) return "charter";
  const n = titleOf(s, purchases);
  if (n === 3) return "max";
  const step = TITLE_STEPS[n]!;
  if (townRank < TITLE_STAGE[step]) return "age";
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

/** Settlement rank a purchase key needs before the server accepts it — mirrors DB purchase_guard need_rank exactly
 *  (monuments: first step only; later steps need the previous one). Age or elapsed time is never part of it. */
export function needRankOf(item: string): number {
  const mk = monumentOf(item);
  if (mk) return /1$/.test(item) ? MONUMENT_RANK[mk] : 0;
  return ({ ...TITLE_STAGE, ...CHEST_STAGE, ...RANK_STAGE } as Record<string, number>)[item] ?? ITEM_RANK[item] ?? 0;
}
export const rankAllows = (item: string, townRank: number) => townRank >= needRankOf(item);
