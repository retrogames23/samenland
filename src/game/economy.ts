import { giftBalance, type Gift } from "./gifts";
import { questEarned, type QuestClaim } from "./quests";
import { activeBoons } from "./encounters";
import { raidLoss, floodFood } from "./disasters";
import { dowryEarned, weddingJoy, ALLIANCE_MAX, ALLIANCE_WEALTH } from "./weddings";
import { radiusOf, stageOf, effAge, links, waterNearby, twinLinks, pactOf, monumentProgress, type Seed, type CharterPath } from "./world";

/** Starting treasury and fixed prices (Taler). Prices mirror the database purchase guard. */
export const START_TALER = 150;
export const ITEMS = { herbs: 90, hunter: 110, fisher: 120, woodcamp: 180, granary: 300, healer: 550, school: 3000, markethall: 450, guildhall: 450, library: 450, dairy: 450, firehouse: 600, guard: 800 } as const;
export type Item = keyof typeof ITEMS;
/** Prestige belfry: four paid construction steps, from Kleinstadt on (mirrored by the database purchase guard). */
export const MONUMENT_PRICE = { belfry1: 400, belfry2: 500, belfry3: 600, belfry4: 700 } as const;
export type MonumentStep = keyof typeof MONUMENT_PRICE;
export const MONUMENT_STAGE = 3;
/** Finished belfry: lasting prosperity and health (bell, clock, town pride). */
export const BELFRY_WEALTH = 15, BELFRY_HEALTH = 5;
/** Next step to pay for, or null when all are paid. */
export const nextMonumentStep = (paid: string[]): MonumentStep | null =>
  (Object.keys(MONUMENT_PRICE) as MonumentStep[]).find((k) => !paid.includes(k)) ?? null;
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

/** Taxes: 1 Taler per resident for every completed day since founding (+15 % after a trade charter). */
export function taxEarned(s: Seed, now: number) {
  const c0 = Date.parse(s.created_at);
  const days = Math.floor((now - c0) / 86400000);
  const trade = s.charter?.path === "trade" ? s.charter.at : null;
  let t = 0;
  for (let d = 1; d <= days; d++) {
    const p = popAt(d * 24);
    t += p;
    if (trade != null && c0 + d * 86400000 >= trade) t += Math.floor(TRADE_TAX * p);
  }
  return t;
}
/** Today's income per day, including the trade charter bonus. */
export const dailyTax = (s: Seed, h: number) => { const p = popAt(h); return p + (s.charter?.path === "trade" ? Math.floor(TRADE_TAX * p) : 0); };

/** Friend-invite bonus (mirrors DB referrals in village_balance): both villages get the reward. */
export const REFERRAL_TALER = 50;
export type Referral = { id: string; referrer_seed: string; referee_seed: string; reward: number; created_at: string };
export const referralClaims = (rows: Referral[]): QuestClaim[] => rows.flatMap((r) => [
  { id: `${r.id}:a`, seed_id: r.referrer_seed, quest: `ref:${r.referee_seed}`, reward: r.reward, created_at: r.created_at },
  { id: `${r.id}:b`, seed_id: r.referee_seed, quest: `ref:${r.referrer_seed}`, reward: r.reward, created_at: r.created_at },
]);

export function treasury(s: Seed, purchases: Purchase[], now: number, gifts: Gift[] = [], claims: QuestClaim[] = []) {
  const spent = purchases.filter((p) => p.seed_id === s.id).reduce((a, p) => a + p.cost, 0);
  const ev = (s.decisions ?? []).reduce((a, d) => a + d.cost, 0);
  const tw = (s.works ?? []).reduce((a, w) => a + w.cost, 0);
  return START_TALER + taxEarned(s, now) + dowryEarned(s, now) - spent - ev - tw + giftBalance(s.id, gifts) + questEarned(claims, s.id) - raidLoss(s, now);
}


const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));

/** Village attributes 0–100, derived from age, trade, charter and purchased buildings. */
export function attributes(s: Seed, seeds: Seed[], purchases: Purchase[], now: number, alliances = 0, stores?: { food: number; health: number; wealth: number }) {
  const has = (i: Item | MonumentStep) => purchases.some((p) => p.seed_id === s.id && p.item === i);
  // twins share wells, healer and school at half strength; a protective pact adds health
  const twins = twinLinks(s, seeds, now).map((l) => (l.a.id === s.id ? l.b : l.a));
  const near = (i: Item) => !has(i) && twins.some((o) => purchases.some((p) => p.seed_id === o.id && p.item === i));
  const shield = twins.some((o) => pactOf(s, o, seeds, now)?.kind === "shield");
  const trade = links(seeds).filter((l) => (l.a.id === s.id || l.b.id === s.id) && now >= l.since).length;
  const stage = stageOf(effAge(s, seeds, now));
  const path = s.charter && s.charter.at <= now ? s.charter.path : null;
  const food = clamp(40 + (has("fisher") ? (waterNearby(s.x, s.y) ? 20 : 8) : 0) + (has("granary") ? 15 : 0) + Math.min(15, trade * (path === "trade" ? 8 : 5))
    + (path === "farm" ? 15 : 0) + (has("dairy") ? 15 : 0) + (has("hunter") ? HUNTER_FOOD : 0));
  const health = clamp(40 + (has("healer") ? 30 : 0) + (food - 50) * 0.3 + (path === "culture" ? 15 : 0) + (has("library") ? 10 : 0) + (has("herbs") ? HERBS_HEALTH : 0) + (near("healer") ? 15 : 0) + (shield ? 10 : 0));
  const wealth = clamp(25 + Math.min(30, trade * 10) + (has("school") ? 20 : 0) + stage * 5 + (path === "craft" ? 10 : 0)
    + (near("school") ? 10 : 0) + (has("guildhall") ? 15 : 0) + (has("markethall") ? 15 : 0) + (has("library") ? 5 : 0) + (has("woodcamp") ? WOODCAMP_WEALTH : 0));
  const b = activeBoons(s.decisions ?? [], now);
  const rb = rankBoons(s, purchases); b.food += rb.food; b.health += rb.health; b.wealth += rb.wealth;
  const belfry = has("belfry4") && monumentProgress(s, now) >= 1;
  b.wealth += belfry ? BELFRY_WEALTH : 0; b.health += belfry ? BELFRY_HEALTH : 0;
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
