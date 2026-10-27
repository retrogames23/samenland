import { radiusOf, stageOf, effAge, links, waterNearby, type Seed } from "./world";

/** Starting treasury and fixed prices (Taler). Prices mirror the database purchase guard. */
export const START_TALER = 150;
export const ITEMS = { fisher: 120, granary: 300, healer: 900, school: 3000 } as const;
export type Item = keyof typeof ITEMS;
export type Purchase = { id: string; seed_id: string; item: string; cost: number; created_at: string; x?: number | null; y?: number | null };

/** Residents at a given real age (hours); same formula as the database tax function. */
export const popAt = (h: number) => Math.floor(3 + 0.9 * Math.pow(radiusOf(Math.max(0, h)), 1.6));

/** Taxes: 1 Taler per resident for every completed day since founding. */
export function taxEarned(s: Seed, now: number) {
  const days = Math.floor((now - Date.parse(s.created_at)) / 86400000);
  let t = 0;
  for (let d = 1; d <= days; d++) t += popAt(d * 24);
  return t;
}

export function treasury(s: Seed, purchases: Purchase[], now: number) {
  const spent = purchases.filter((p) => p.seed_id === s.id).reduce((a, p) => a + p.cost, 0);
  return START_TALER + taxEarned(s, now) - spent;
}


const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)));

/** Village attributes 0–100, derived from age, trade and purchased buildings. */
export function attributes(s: Seed, seeds: Seed[], purchases: Purchase[], now: number) {
  const has = (i: Item) => purchases.some((p) => p.seed_id === s.id && p.item === i);
  const trade = links(seeds).filter((l) => (l.a.id === s.id || l.b.id === s.id) && now >= l.since).length;
  const stage = stageOf(effAge(s, seeds, now));
  const food = clamp(40 + (has("fisher") ? (waterNearby(s.x, s.y) ? 20 : 8) : 0) + (has("granary") ? 15 : 0) + Math.min(15, trade * 5));
  const health = clamp(40 + (has("healer") ? 30 : 0) + (food - 50) * 0.3);
  const wealth = clamp(25 + Math.min(30, trade * 10) + (has("school") ? 20 : 0) + stage * 5);
  return { food, health, wealth, has };
}
