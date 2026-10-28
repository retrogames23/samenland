/**
 * Neighbourly gestures: Taler gifts, disaster aid and thank-you letters between villages.
 * Only the gift rows are stored (DB guard enforces prices, one per day and the treasury);
 * carts, faster rebuilding and treasury effects are derived purely from those rows.
 */
export type GiftKind = "gift" | "aid" | "thanks";
export type Gift = { id: string; from_seed: string; to_seed: string; kind: string; amount: number; note: number; created_at: string };
/** Prices mirrored by public.gift_guard. */
export const GIFT_TALER = 25, AID_TALER = 40;
/** Days a received gift can still be thanked for. */
export const THANK_DAYS = 7;
/** Hours after a disaster in which neighbourly aid speeds up rebuilding. */
export const AID_WINDOW = 72 * 3.6e6;
/** Aid makes rebuilding this many times faster. */
export const AID_SPEED = 2;

/** Net Taler effect of gifts on a seed's treasury (mirrors village_balance). */
export const giftBalance = (seedId: string, gifts: Gift[]) =>
  gifts.reduce((a, g) => a + (g.to_seed === seedId ? g.amount : g.from_seed === seedId ? -g.amount : 0), 0);

/** Whether this seed already sent a paid gift within the last 24 hours. */
export const sentToday = (seedId: string, gifts: Gift[], now: number) =>
  gifts.some((g) => g.from_seed === seedId && g.kind !== "thanks" && now - Date.parse(g.created_at) < 864e5);

/** Received gifts the owner may still thank for (newest per sender, not yet thanked). */
export function thankable(seedId: string, gifts: Gift[], now: number): Gift[] {
  const out = new Map<string, Gift>();
  for (const g of gifts) {
    if (g.to_seed !== seedId || g.kind === "thanks" || now - Date.parse(g.created_at) > THANK_DAYS * 864e5) continue;
    const thanked = gifts.some((x) => x.kind === "thanks" && x.from_seed === seedId && x.to_seed === g.from_seed && Date.parse(x.created_at) >= Date.parse(g.created_at));
    if (!thanked) out.set(g.from_seed, g);
  }
  return [...out.values()];
}

/** Rebuild speed factor for a disaster that ended at `end`: faster when aid arrived around it. */
export const aidFactor = (aid: number[] | undefined, end: number) =>
  aid?.some((a) => a >= end - AID_WINDOW && a <= end + AID_WINDOW) ? AID_SPEED : 1;
