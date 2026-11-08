/** Mayor's tasks: a fixed chain of milestones across all eras. Rewards mirror the database quest guard. */
export const QUESTS = [
  "bless", "build", "sign", "meet", "ten", "gift", "hamlet",
  // Dorf era
  // resident goals lead up to each rank-up, never trail behind it
  "road", "bless7", "buy3", "fifty", "village",
  // Kleinstadt era
  "gifts5", "roads2", "hundred", "town",
  // Handelsstadt era
  "buy6", "merchant",
  // Hansestadt
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
    case "bless7": return need(c.blessings, 3);
    case "buy3": return need(c.purchases, 3);
    case "village": return [c.stage >= 2 ? 1 : 0, 1];
    case "gifts5": return need(c.giftsSent, 3);
    case "fifty": return need(c.residents, 50);
    case "roads2": return need(c.roads ?? 0, 2);
    case "town": return [c.stage >= 3 ? 1 : 0, 1];
    case "buy6": return need(c.waySmall ? c.purchases : Math.min(c.purchases, 5), 6);
    case "hundred": return need(c.residents, 150);
    case "merchant": return [c.stage >= 4 ? 1 : 0, 1];
    case "metro": return [(c.stage >= 5 ? 1 : 0) + (c.wayBig ? 1 : 0), 2];
  }
}

/** Three independent tracks (mirrored by DB quest_guard): a slow daily task in one never blocks the others. */
export const TRACKS: readonly (readonly Quest[])[] = [
  ["build", "ten", "hamlet", "road", "buy3", "fifty", "village", "roads2", "hundred", "town", "buy6", "merchant", "metro"],
  ["meet", "sign", "gift", "gifts5"],
  ["bless", "bless7"],
];
export const trackOf = (q: Quest) => TRACKS.findIndex((t) => t.includes(q));

/** The open quest of every unfinished track. */
export function questHeads(claims: QuestClaim[], seedId: string, c: QuestCtx) {
  const done = new Set(claims.filter((x) => x.seed_id === seedId).map((x) => x.quest));
  return TRACKS.flatMap((t, track) => {
    const quest = t.find((q) => !done.has(q));
    if (!quest) return [];
    const [have, need] = questProgress(quest, c);
    return [{ quest, track, index: QUESTS.indexOf(quest), have, need, ready: have >= need, reward: QUEST_REWARD[quest] }];
  });
}

/** The quest shown on the card: a ready one first, else the earliest open one; null when all tracks are done. */
export function questState(claims: QuestClaim[], seedId: string, c: QuestCtx) {
  const heads = questHeads(claims, seedId, c).sort((a, b) => a.index - b.index);
  return heads.find((h) => h.ready) ?? heads[0] ?? null;
}

export const questEarned = (claims: QuestClaim[], seedId: string) =>
  claims.filter((x) => x.seed_id === seedId).reduce((a, x) => a + x.reward, 0);
