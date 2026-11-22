/**
 * Offline evaluation of finished simulation runs (JSON from run.ts) — report only, never imported by the game.
 * bun src/game/simulation/phase-report.ts <dir> <out.json>
 *
 * Per scenario: rank days, income by source, spending by category, cap losses, and a day-by-day classification of
 * the investment situation. "Open" uses exactly the purchase gates of engine.ts attemptPurchases (same constants);
 * it adds the Ausbaustufen, which offerFor/openUnlocked leave out. Bauhütte (repeatable) is not counted as an open
 * investment. Classification of each day (end-of-day balance and ownership):
 *   none     – nothing open for this profile's strategy at its current rank
 *   money    – something open, but the balance cannot pay the cheapest item plus the profile reserve
 *   capBlock – the cheapest open item costs more than the current chest cap (unpayable until a chest upgrade)
 *   ready    – something open and affordable (bought on the next login day)
 * Two views: "strategy" (the profile's own flags, e.g. Gelegenheit never buys monuments) and "all" (every legal item).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { ITEMS, MONUMENTS, CHEST_PRICE, CHEST_STAGE, RANK_PRICE, RANK_STAGE, TITLE_PRICE, TITLE_STAGE, canBuy, canBuyWay, GUILD_OF, type Item } from "../economy";
import { ITEM_RANK } from "../disasters";
import { WAY_SMALL, WAY_BIG } from "../quests";
import { AUSBAU_BASES, AUSBAU_STEPS, AUSBAU_PRICE, AUSBAU_RANK } from "../ausbau";
import { CARE_ORDER, CIVIC, WAY_MON } from "./engine";
import { PROFILES } from "./profiles";
import type { SimResult, Profile } from "./types";
import type { TownWay } from "../character";
import type { CharterPath } from "../world";

const MON_ORDER = ["belfry", "theater", "cathedral", "university", "exchange", "orangery", "opera"] as const;
type Open = { item: string; cost: number; group: string };

/** Items a town could buy on `day` at `rank` with `owned`, gated exactly like attemptPurchases (flags from P). */
export function openItems(P: Profile, charter: CharterPath, way: TownWay, day: number, rank: number, owned: Set<string>, all: boolean): Open[] {
  const o: Open[] = [], add = (item: string, cost: number, group: string) => { if (!owned.has(item)) o.push({ item, cost, group }); };
  const f = all ? { chest: true, guildRanks: true, civic: true, titles: true, ausbau: true, way: true, mon: true } :
    { chest: P.chest, guildRanks: P.guildRanks, civic: P.civic, titles: P.titles, ausbau: !!P.ausbau, way: P.way, mon: P.monumentsFrom !== null && day >= P.monumentsFrom };
  if (f.chest) { const k = (["chest2", "chest3", "chest4"] as const).find((c) => !owned.has(c)); if (k && rank >= CHEST_STAGE[k]) add(k, CHEST_PRICE[k], "chest"); }
  for (const it of CARE_ORDER) if (rank >= Math.max(0, ITEM_RANK[it] ?? 0)) add(it, ITEMS[it as Item], "care");
  if (f.guildRanks || f.civic) add(GUILD_OF[charter], ITEMS[GUILD_OF[charter]], "guild");
  if (f.guildRanks) {
    if (rank >= RANK_STAGE.rank2) add("rank2", RANK_PRICE.rank2, "guildrank");
    if (rank >= RANK_STAGE.rank3 && owned.has("belfry4") && owned.has("rank2")) add("rank3", RANK_PRICE.rank3, "guildrank");
  }
  if (f.titles) for (const k of ["title1", "title2", "title3"] as const) if (rank >= TITLE_STAGE[k] && (k === "title1" || owned.has(k === "title2" ? "title1" : "title2"))) add(k, TITLE_PRICE[k], "title");
  if (f.civic) for (const it of CIVIC) if (rank >= (ITEM_RANK[it] ?? 0)) add(it, ITEMS[it as Item], "civic");
  if (f.ausbau) for (const b of AUSBAU_BASES) for (const k of AUSBAU_STEPS[b]) if (owned.has(b) && rank >= AUSBAU_RANK[k]! && (k.endsWith("2") || owned.has(`${b}2`))) add(k, AUSBAU_PRICE[k]!, "ausbau");
  if (f.way) for (const it of [...WAY_SMALL, ...WAY_BIG]) if (canBuyWay(it as Item, way) && rank >= (ITEM_RANK[it] ?? 0)) add(it, ITEMS[it as Item], "way");
  if (f.mon) for (const m of [WAY_MON[way], ...MON_ORDER]) {
    if (rank < MONUMENTS[m].rank) continue;
    const i = MONUMENTS[m].prices.findIndex((_, j) => !owned.has(`${m}${j + 1}`));
    if (i >= 0) add(`${m}${i + 1}`, MONUMENTS[m].prices[i]!, m === WAY_MON[way] ? "way-monument" : "monument");
  }
  void canBuy;
  return o;
}
const group = (item: string) => /^chest/.test(item) ? "chest" : /^rank\d/.test(item) ? "guildrank" : /^title/.test(item) ? "title"
  : /^bauhuette/.test(item) ? "bauhuette" : /[23]$/.test(item) && /^(backhaus|herberge|granary)/.test(item) ? "ausbau"
  : /\d$/.test(item) ? "monument" : CARE_ORDER.includes(item) ? "care" : CIVIC.includes(item) ? "civic"
  : [...WAY_SMALL, ...WAY_BIG].includes(item) ? "way" : "guild";

type Cls = "none" | "money" | "capBlock" | "ready";
export function analyse(r: SimResult) {
  const P = PROFILES[r.profile], way = r.way as TownWay;
  const P2 = { ...P, repeat: true, ausbau: true };
  const byDay = new Map<number, string[]>();
  for (const b of r.bought) byDay.set(b.day, [...(byDay.get(b.day) ?? []), b.item]);
  const owned = new Set<string>();
  const count = { strategy: { none: 0, money: 0, capBlock: 0, ready: 0 }, all: { none: 0, money: 0, capBlock: 0, ready: 0 } };
  const dorf = { from: r.rankDays[2] ?? null, to: r.rankDays[3] ?? null };
  const dorfCount = { strategy: { none: 0, money: 0, capBlock: 0, ready: 0 }, all: { none: 0, money: 0, capBlock: 0, ready: 0 } };
  let dorfLost = 0, dorfIncome = 0, dorfDays = 0, dorfNoneLost = 0, exhaustedDay: number | null = null;
  const unlock: Record<string, number> = {};
  for (const row of r.daily) {
    for (const it of byDay.get(row.day) ?? []) owned.add(it);
    const cls = (all: boolean): Cls => {
      const o = openItems(P2, r.charter, way, row.day, row.rank, owned, all);
      for (const x of openItems(P2, r.charter, way, row.day, row.rank, new Set(), true)) unlock[x.item] ??= row.day;
      if (!o.length) return "none";
      const min = Math.min(...o.map((x) => x.cost + (x.group === "chest" ? 0 : P.reserve)));
      if (Math.min(...o.map((x) => x.cost)) > row.cap) return "capBlock";
      return row.balance >= min ? "ready" : "money";
    };
    const cs = cls(false), ca = cls(true);
    count.strategy[cs]++; count.all[ca]++;
    const inDorf = dorf.from !== null && row.day >= dorf.from && (dorf.to === null || row.day < dorf.to);
    if (inDorf) {
      dorfDays++; dorfCount.strategy[cs]++; dorfCount.all[ca]++; dorfLost += row.lost; dorfIncome += row.income;
      if (cs === "none") { dorfNoneLost += row.lost; exhaustedDay ??= row.day; }
    }
  }
  const spentBy: Record<string, number> = {};
  for (const b of r.bought) spentBy[group(b.item)] = (spentBy[group(b.item)] ?? 0) + b.cost;
  const notBought = openItems(P2, r.charter, way, r.days, r.daily.at(-1)!.rank, owned, true).map((o) => o.item);
  const dorfBuys = r.bought.filter((b) => dorf.from !== null && b.day >= dorf.from && (dorf.to === null || b.day < dorf.to)).map((b) => ({ item: b.item, day: b.day, cost: b.cost }));
  return { scenario: `${r.profile}-${r.charter}-${r.location}`, profile: r.profile, charter: r.charter, location: r.location,
    rankDays: r.rankDays, hansestadtDay: r.hansestadtDay, gross: r.gross, bySource: r.bySource, spent: r.spent, spentBy, lost: r.lost, lostShare: r.lostShare,
    firstOverflowDay: r.firstOverflowDay, regularOverflowDay: r.regularOverflowDay, finalBalance: r.finalBalance,
    purchases: r.bought.filter((b) => !b.item.startsWith("bauhuette")).length, bauhuette: r.bought.filter((b) => b.item.startsWith("bauhuette")).length,
    lastPurchaseDay: r.bought.filter((b) => !b.item.startsWith("bauhuette")).at(-1)?.day ?? null,
    notBought, days: count, dorf: { ...dorf, days: dorfDays, cls: dorfCount, lost: dorfLost, income: dorfIncome, lostWhileNone: dorfNoneLost, firstNoneDay: exhaustedDay, buys: dorfBuys },
    unlock, bought: r.bought.map((b) => [b.item, b.day]) };
}

if (import.meta.main) {
  const [dir = "/tmp/sim-out", out = "/tmp/sim-report.json"] = process.argv.slice(2);
  const rows = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => analyse(JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as SimResult));
  writeFileSync(out, JSON.stringify(rows));
  console.log(rows.length, "scenarios →", out);
}
