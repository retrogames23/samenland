/** Mayor's tasks: a fixed chain of early milestones. Rewards mirror the database quest guard. */
export const QUESTS = ["bless", "build", "sign", "meet", "ten", "gift", "hamlet"] as const;
export type Quest = (typeof QUESTS)[number];
export const QUEST_REWARD: Record<Quest, number> = { bless: 20, build: 30, sign: 20, meet: 30, ten: 40, gift: 40, hamlet: 60 };
export type QuestClaim = { id: string; seed_id: string; quest: string; reward: number; created_at: string };

export type QuestCtx = {
  blessings: number; purchases: number; signposts: number; encounters: number; giftsSent: number;
  residents: number; stage: number;
};

/** Progress toward a quest as [have, need]. */
export function questProgress(q: Quest, c: QuestCtx): [number, number] {
  switch (q) {
    case "bless": return [Math.min(1, c.blessings), 1];
    case "build": return [Math.min(1, c.purchases), 1];
    case "sign": return [Math.min(1, c.signposts), 1];
    case "meet": return [Math.min(1, c.encounters), 1];
    case "ten": return [Math.min(10, c.residents), 10];
    case "gift": return [Math.min(1, c.giftsSent), 1];
    case "hamlet": return [Math.min(1, c.stage), 1];
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
