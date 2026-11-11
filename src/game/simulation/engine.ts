/**
 * Deterministic 730-day economy simulation using the real game formulas (offline tool, not part of the live game).
 * Game rules used as-is: taxOnDay, weddingDates, townRank/rankInput, careStage, prices, rank gates, chest caps,
 * chronological cap (surplus lost at the moment's cap). Player behaviour comes only from profiles.ts.
 */
import { ITEMS, MONUMENTS, CHEST_BASE, CHEST_CAP, CHEST_PRICE, CHEST_STAGE, RANK_PRICE, RANK_STAGE, TITLE_PRICE, TITLE_STAGE, START_TALER, taxOnDay, canBuy, canBuyWay, GUILD_OF, type Item } from "../economy";
import { ITEM_RANK } from "../disasters";
import { weddingDates } from "../weddings";
import { QUESTS, QUEST_REWARD, WAY_SMALL, WAY_BIG } from "../quests";
import { PRINCELY_REWARDS } from "../princely";
import { townRank } from "../rank";
import { townCharacter } from "../character";
import type { Seed } from "../world";
import { LOCATIONS, VISIT_GIFT, WONDER_FIND } from "./profiles";
import type { Booking, DayRow, SimConfig, SimResult } from "./types";

const DAY = 86400000;
/** Quest index → town rank the quest's milestone needs (assumption: other quest conditions are met by then). */
export const questRank = (i: number) => (i <= 6 ? 1 : i <= 11 ? 2 : i <= 15 ? 3 : i <= 17 ? 4 : 5);
/** Care purchases first, in this order (assumption). */
export const CARE_ORDER = ["hunter", "herbs", "granary", "fisher", "healer"];
const CIVIC = ["backhaus", "herberge", "woodcamp", "beginen", "badestube", "school", "firehouse", "guard"];
const MON_ORDER = ["belfry", "theater", "cathedral", "university", "exchange", "orangery", "opera"] as const;
const WAY_MON = { grain: "harvest", workshop: "guildtower", gateway: "lighthouse" } as const;

/** Pure chest booking: credit fills only the room below the current cap; the rest is lost. */
export function bookCredit(balance: number, cap: number, amount: number) {
  const booked = Math.max(0, Math.min(amount, cap - balance));
  return { balance: balance + booked, booked, lost: amount - booked };
}

export function simulate(cfg: SimConfig): SimResult {
  const days = cfg.days ?? 730, every = cfg.rankEvery ?? 10, P = cfg.profile;
  const c0 = Date.parse(cfg.start ?? "2026-11-12T00:00:00Z");
  const [x, y] = LOCATIONS[cfg.location];
  const way = townCharacter({ x, y }).main;
  const seed: Seed = { id: `sim-${P.key}-${cfg.charter}-${cfg.location}`, name: "Sim", owner: "sim", x, y, hue: 0, realm: "europe", user_id: "sim",
    created_at: new Date(c0).toISOString(), charter: { path: cfg.charter, at: c0 + DAY }, bought: [], roads: [], civicRoads: [] };
  const nb = (id: string, dx: number): Seed => ({ id, name: id, owner: "nb", x: x + dx, y, hue: 0, realm: "europe", created_at: new Date(c0 - 60 * DAY).toISOString() });
  const seeds = [seed, nb("nb1", 15), nb("nb2", -15)];

  let balance = START_TALER, chest = 0, rank = 1, hanse: number | null = null;
  const caps = [CHEST_BASE, CHEST_CAP.chest2, CHEST_CAP.chest3, CHEST_CAP.chest4];
  const ledger: Booking[] = [], daily: DayRow[] = [], bySource: Record<string, number> = { start: START_TALER };
  const bought: SimResult["bought"] = [], owned = new Set<string>(), rankDays: Record<number, number> = { 1: 0 };
  let gross = START_TALER, booked = START_TALER, lost = 0, spent = 0, firstOverflow: number | null = null;
  let q = 0, pr = 0, prLogin = 0, wedSeen = 0, day = 0, dayIncome = 0, dayTax = 0, dayBooked = 0, dayLost = 0, daySpent = 0;

  const credit = (source: string, amount: number) => {
    if (amount <= 0) return;
    const r = bookCredit(balance, caps[chest]!, amount);
    balance = r.balance; gross += amount; booked += r.booked; lost += r.lost; bySource[source] = (bySource[source] ?? 0) + amount;
    dayIncome += amount; dayBooked += r.booked; dayLost += r.lost; if (source === "tax") dayTax += amount;
    if (r.lost > 0 && firstOverflow === null) firstOverflow = day;
    ledger.push({ day, kind: "credit", source, amount, booked: r.booked, lost: r.lost, balance, cap: caps[chest]! });
  };
  const buy = (item: string, cost: number, reserve = P.reserve) => {
    if (owned.has(item) || balance < cost + reserve) return false;
    balance -= cost; spent += cost; daySpent += cost; owned.add(item);
    seed.bought!.push({ item, at: c0 + day * DAY }); bought.push({ item, day, cost });
    ledger.push({ day, kind: "debit", source: item, amount: cost, booked: -cost, lost: 0, balance, cap: caps[chest]! });
    return true;
  };

  /** Every purchase the town could still make (for saturation and "remaining" options). */
  const offer = (): { item: string; cost: number; rank: number }[] => {
    const o: { item: string; cost: number; rank: number }[] = [];
    for (const it of [...CARE_ORDER, GUILD_OF[cfg.charter], ...CIVIC, ...WAY_SMALL, ...WAY_BIG] as Item[]) {
      if (!canBuy(it, cfg.charter) || !canBuyWay(it, way)) continue;
      if (!(it in ITEMS)) continue;
      o.push({ item: it, cost: ITEMS[it as keyof typeof ITEMS], rank: Math.max(1, ITEM_RANK[it] ?? 0) });
    }
    (["chest2", "chest3", "chest4"] as const).forEach((k) => o.push({ item: k, cost: CHEST_PRICE[k], rank: CHEST_STAGE[k] }));
    (["rank2", "rank3"] as const).forEach((k) => o.push({ item: k, cost: RANK_PRICE[k], rank: RANK_STAGE[k] }));
    (["title1", "title2", "title3"] as const).forEach((k) => o.push({ item: k, cost: TITLE_PRICE[k], rank: TITLE_STAGE[k] }));
    for (const m of [...MON_ORDER, WAY_MON[way]]) MONUMENTS[m].prices.forEach((p, i) => o.push({ item: `${m}${i + 1}`, cost: p, rank: MONUMENTS[m].rank }));
    return o.filter((e) => !owned.has(e.item));
  };
  let saturation: number | null = null;

  for (day = 1; day <= days; day++) {
    const now = c0 + day * DAY;
    dayIncome = dayTax = dayBooked = dayLost = daySpent = 0;
    if (day === 14) { seed.roads!.push({ target: "nb1", at: now }); seed.civicRoads!.push({ at: now }); }
    if (day === 45) { seed.roads!.push({ target: "nb2", at: now }); seed.civicRoads!.push({ at: now }); }
    if (hanse === null && (day % every === 0 || day === 1)) {
      const r = townRank(seed, [...seeds], now);
      for (let k = rank + 1; k <= r; k++) rankDays[k] = day;
      rank = Math.max(rank, r);
      if (rank >= 5) hanse = day;
    }
    credit("tax", taxOnDay(seed, day));
    const weds = weddingDates(seed, now);
    for (const w of weds.slice(wedSeen)) credit("dowry", w.dowry);
    wedSeen = weds.length;

    if ((day - 1) % P.loginEvery === 0) {
      if (P.quests) while (q < QUESTS.length && questRank(q) <= rank) { credit("quest", QUEST_REWARD[QUESTS[q]!]); q++; }
      if (P.princeEvery && ++prLogin % P.princeEvery === 0 && pr < PRINCELY_REWARDS.length && rank >= 2) credit("prince", PRINCELY_REWARDS[pr++]!);
      const perDay = (w: number) => Math.floor((day * w) / 7) - Math.floor(((day - P.loginEvery) * w) / 7);
      for (let i = 0; i < Math.min(3 * P.loginEvery, perDay(P.wondersPerWeek)); i++) credit("wonder", WONDER_FIND);
      for (let i = 0; i < perDay(P.visitsPerWeek); i++) credit("visit", VISIT_GIFT);

      // purchases, cheapest strategic order
      if (P.chest) for (const [i, k] of (["chest2", "chest3", "chest4"] as const).entries()) if (chest === i && rank >= CHEST_STAGE[k] && buy(k, CHEST_PRICE[k], 0)) chest++;
      for (const it of CARE_ORDER) if (rank >= Math.max(0, ITEM_RANK[it] ?? 0)) buy(it, ITEMS[it as keyof typeof ITEMS]);
      if (P.guildRanks || P.civic) buy(GUILD_OF[cfg.charter], ITEMS[GUILD_OF[cfg.charter] as keyof typeof ITEMS]);
      if (P.guildRanks) {
        if (rank >= RANK_STAGE.rank2) buy("rank2", RANK_PRICE.rank2);
        if (rank >= RANK_STAGE.rank3 && owned.has("belfry4") && owned.has("rank2")) buy("rank3", RANK_PRICE.rank3);
      }
      if (P.titles) for (const k of ["title1", "title2", "title3"] as const) if (rank >= TITLE_STAGE[k] && (k === "title1" || owned.has(k === "title2" ? "title1" : "title2"))) buy(k, TITLE_PRICE[k]);
      if (P.civic) for (const it of CIVIC) if (rank >= (ITEM_RANK[it] ?? 0)) buy(it, ITEMS[it as keyof typeof ITEMS]);
      if (P.way) for (const it of [...WAY_SMALL, ...WAY_BIG]) if (canBuyWay(it as Item, way) && rank >= (ITEM_RANK[it] ?? 0)) buy(it, ITEMS[it as keyof typeof ITEMS]);
      if (P.monumentsFrom !== null && day >= P.monumentsFrom) for (const m of [WAY_MON[way], ...MON_ORDER]) {
        if (rank < MONUMENTS[m].rank) continue;
        const i = MONUMENTS[m].prices.findIndex((_, j) => !owned.has(`${m}${j + 1}`));
        if (i >= 0 && !buy(`${m}${i + 1}`, MONUMENTS[m].prices[i]!)) break;
      }
    }
    if (saturation === null && hanse !== null && P.monumentsFrom !== null && offer().length === 0) saturation = day;
    daily.push({ day, rank, balance, cap: caps[chest]!, income: dayIncome, tax: dayTax, booked: dayBooked, lost: dayLost, spent: daySpent });
  }

  let regular: number | null = null;
  for (let d = 0; d + 30 <= daily.length && regular === null; d++) if (daily.slice(d, d + 30).filter((r) => r.lost > 0).length >= 15) regular = daily[d]!.day;
  const phase = (name: string, from: number, to: number) => {
    const rows = daily.filter((r) => r.day >= from && r.day <= to), n = Math.max(1, rows.length), inc = rows.reduce((a, r) => a + r.income, 0);
    return { name, from, to, incomePerDay: Math.round(inc / n), spentPerDay: Math.round(rows.reduce((a, r) => a + r.spent, 0) / n),
      lostShare: inc ? +(rows.reduce((a, r) => a + r.lost, 0) / inc).toFixed(3) : 0, balanceEnd: rows.at(-1)?.balance ?? balance };
  };
  const h = hanse ?? days, s = saturation ?? days;
  return { profile: P.key, charter: cfg.charter, location: cfg.location, way, days, hansestadtDay: hanse, rankDays, saturationDay: saturation,
    firstOverflowDay: firstOverflow, regularOverflowDay: regular, gross, booked, lost, spent, finalBalance: balance,
    taxShare: +(bySource.tax! / gross).toFixed(3), lostShare: +(lost / gross).toFixed(3), bySource, bought,
    remaining: offer().map((o) => o.item),
    phases: [phase("bis Hansestadt", 1, h), phase("Hansestadt bis Sättigung", h + 1, Math.max(h, s)), phase("nach Sättigung", Math.max(h, s) + 1, days)],
    daily, ledger };
}
