/** Mayor's tasks: a fixed chain of milestones across all eras. Rewards mirror the database quest guard. */
export const QUESTS = [
  "bless", "build", "sign", "meet", "ten", "gift", "hamlet",
  // Dorf era
  "road", "bless7", "buy3", "village",
  // Kleinstadt era
  "gifts5", "fifty", "roads2", "town",
  // Handelsstadt era
  "buy6", "hundred", "merchant",
  // Metropole
  "metro",
] as const;
export type Quest = (typeof QUESTS)[number];
export const QUEST_REWARD: Record<Quest, number> = {
  bless: 20, build: 30, sign: 20, meet: 30, ten: 40, gift: 40, hamlet: 60,
  road: 60, bless7: 80, buy3: 100, village: 120,
  gifts5: 120, fifty: 150, roads2: 150, town: 200,
  buy6: 250, hundred: 300, merchant: 400,
  metro: 600,
};
/** Way-specific quests: buy6 needs the small way building, metro the big one (mirrored by DB quest_guard). */
export const WAY_SMALL = ["bigstore", "stonemason", "smokehouse"];
export const WAY_BIG = ["millrow", "hammerworks", "saltquay"];
export const WAY_QUESTS: readonly Quest[] = ["buy6", "metro"];
/** Text key for a quest: way quests have one variant per town way. */
export const questKey = (q: Quest, way?: string) => (way && WAY_QUESTS.includes(q) ? `${q}:${way}` : q);
export type QuestClaim = { id: string; seed_id: string; quest: string; reward: number; created_at: string };

export type QuestCtx = {
  blessings: number; purchases: number; signposts: number; encounters: number; giftsSent: number;
  residents: number; stage: number; roads?: number;
  /** Own way buildings bought: small = Großspeicher/Steinmetzhütte/Räucherei, big = Windmühlenreihe/Hammerwerk/Salzkontor. */
  waySmall?: boolean; wayBig?: boolean;
};

const need = (have: number, n: number): [number, number] => [Math.min(n, have), n];

/** Progress toward a quest as [have, need]. */
export function questProgress(q: Quest, c: QuestCtx): [number, number] {
  switch (q) {
    case "bless": return need(c.blessings, 1);
    case "build": return need(c.purchases, 1);
    case "sign": return need(c.signposts, 1);
    case "meet": return need(c.encounters, 1);
    case "ten": return need(c.residents, 10);
    case "gift": return need(c.giftsSent, 1);
    case "hamlet": return need(c.stage, 1);
    case "road": return need(c.roads ?? 0, 1);
    case "bless7": return need(c.blessings, 7);
    case "buy3": return need(c.purchases, 3);
    case "village": return [c.stage >= 2 ? 1 : 0, 1];
    case "gifts5": return need(c.giftsSent, 5);
    case "fifty": return need(c.residents, 50);
    case "roads2": return need(c.roads ?? 0, 2);
    case "town": return [c.stage >= 3 ? 1 : 0, 1];
    case "buy6": return need(c.waySmall ? c.purchases : Math.min(c.purchases, 5), 6);
    case "hundred": return need(c.residents, 150);
    case "merchant": return [c.stage >= 4 ? 1 : 0, 1];
    case "metro": return [(c.stage >= 5 ? 1 : 0) + (c.wayBig ? 1 : 0), 2];
  }
}

/** The current open quest (first unclaimed in order), or null when the chain is complete. */
export function questState(claims: QuestClaim[], seedId: string, c: QuestCtx) {
  const done = new Set(claims.filter((x) => x.seed_id === seedId).map((x) => x.quest));
  const quest = QUESTS.find((q) => !done.has(q));
  if (!quest) return null;
  const [have, need] = questProgress(quest, c);
  return { quest, index: QUESTS.indexOf(quest), have, need, ready: have >= need, reward: QUEST_REWARD[quest] };
}

export const questEarned = (claims: QuestClaim[], seedId: string) =>
  claims.filter((x) => x.seed_id === seedId).reduce((a, x) => a + x.reward, 0);
