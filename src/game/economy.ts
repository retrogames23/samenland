import { giftBalance, type Gift } from "./gifts";
import { activeBoons } from "./encounters";
import { raidLoss, floodFood } from "./disasters";
import { dowryEarned, weddingJoy, ALLIANCE_MAX, ALLIANCE_WEALTH } from "./weddings";
import { radiusOf, stageOf, effAge, links, waterNearby, twinLinks, pactOf, type Seed, type CharterPath } from "./world";

/** Starting treasury and fixed prices (Taler). Prices mirror the database purchase guard. */
export const START_TALER = 150;
export const ITEMS = { herbs: 90, hunter: 110, fisher: 120, woodcamp: 180, granary: 300, healer: 550, school: 3000, markethall: 450, guildhall: 450, library: 450, dairy: 450, firehouse: 600, guard: 800 } as const;
export type Item = keyof typeof ITEMS;
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

export function treasury(s: Seed, purchases: Purchase[], now: number, gifts: Gift[] = []) {
  const spent = purchases.filter((p) => p.seed_id === s.id).reduce((a, p) => a + p.cost, 0);
  const ev = (s.decisions ?? []).reduce((a, d) => a + d.cost, 0);
  const tw = (s.works ?? []).reduce((a, w) => a + w.cost, 0);
  return START_TALER + taxEarned(s, now) + dowryEarned(s, now) - spent - ev - tw + giftBalance(s.id, gifts) - raidLoss(s, now);
}


const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));

/** Village attributes 0–100, derived from age, trade, charter and purchased buildings. */
export function attributes(s: Seed, seeds: Seed[], purchases: Purchase[], now: number, alliances = 0) {
  const has = (i: Item) => purchases.some((p) => p.seed_id === s.id && p.item === i);
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
  b.food += floodFood(s, now); b.health += has("firehouse") ? 5 : 0; b.wealth += has("guard") ? 5 : 0;
  // weddings: a day of joy (health, prosperity) and lasting craft alliances between families
  const joy = weddingJoy(s, now);
  b.health += joy ? 10 : 0; b.wealth += (joy ? 5 : 0) + Math.min(ALLIANCE_MAX, alliances * ALLIANCE_WEALTH);
  return { food: clamp(food + b.food), health: clamp(health + b.health), wealth: clamp(wealth + b.wealth), has };
}
