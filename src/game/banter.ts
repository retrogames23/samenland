/**
 * Speech bubbles when the mayor addresses someone: purely local and never stored.
 * Lines live in lang/banter.ts; this picks a fitting category and avoids recent repeats.
 */
import { BANTER, type BanterCat } from "./lang/banter";
import type { Lang } from "./i18n";
import type { Trait } from "./traits";
import { SEASON_BANTER } from "./lang/banter-season";
import { seasonAt } from "./season";
import { feastOn } from "./feasts";
import { FEAST_BANTER } from "./lang/banter-feast";
import { clock } from "./time";

const recent: string[] = [];
const RECENT = 40;

export type BanterCtx =
  | { who: "own"; traits: Trait[]; child: boolean; sick: boolean; night: boolean }
  | { who: "foreign"; child: boolean; night: boolean }
  | { who: "court"; role: string; night: boolean }
  | { who: "house"; own: boolean; home: boolean; night: boolean };

/** Category candidates, most specific first; the generic one always fits. */
export function banterCats(c: BanterCtx): BanterCat[] {
  if (c.who === "court") return [`court_${c.role}` as BanterCat, "court_any"];
  if (c.who === "house") {
    if (!c.home) return ["house_empty"];
    if (c.night) return ["house_night"];
    return [c.own ? "house_own" : "house_foreign"];
  }
  if (c.who === "foreign") return c.child ? ["foreign_child"] : c.night ? ["foreign_night", "foreign_any"] : ["foreign_any"];
  if (c.sick) return ["own_sick"];
  if (c.child) return ["own_child"];
  if (c.night) return ["own_night", "own_any"];
  return [...c.traits.map((t) => `own_t_${t}` as BanterCat), "own_any", "own_any", "own_craft"];
}

/** Pick a line (random, avoiding the last RECENT shown) and fill {mayor}, {town}, {name}. */
import { WEATHER_BANTER } from "./lang/banter-weather";
import { weatherAt } from "./weather";
export function banter(lang: Lang, c: BanterCtx, vars: { mayor: string; town: string; name?: string }, rnd: () => number = Math.random): string {
  const L0 = BANTER[lang] ?? BANTER.en;
  const cats = banterCats(c);
  // own villagers sometimes speak about what the season shows on the map (one pooled line among the others)
  let L: typeof L0 = L0;
  if (c.who === "own" && !c.sick && !c.child && !c.night) {
    const w = seasonAt(clock()), sk = (Object.keys(w) as (keyof typeof w)[]).reduce((a, b) => (w[b] > w[a] ? b : a));
    L = { ...L0, own_craft: [...(L0.own_craft ?? []), ...SEASON_BANTER[lang][sk]] };
    // on a feast day its lines dominate the everyday chatter (all generic categories get them)
    const fz = feastOn(clock()), fl = fz ? (FEAST_BANTER[lang]?.[fz] ?? FEAST_BANTER.en[fz] ?? []) : [];
    if (fl.length) L = { ...L, own_any: [...fl, ...fl], own_craft: [...(L.own_craft ?? []), ...fl] };
    // the weather on the map gets talked about, weather-sensitive folk most of all
    const wx = weatherAt(clock()), wk = wx.amount < 0.2 ? null : wx.kind === "drizzle" ? "rain" : wx.kind === "snow" ? "snow" : wx.kind === "storm" ? "storm" : null;
    const wl = wk ? (WEATHER_BANTER[lang] ?? WEATHER_BANTER.en)[wk] : [];
    if (wl.length) L = { ...L, own_craft: [...(L.own_craft ?? []), ...wl], own_t_weather: [...wl, ...(L.own_t_weather ?? [])] };
  }
  // one category drawn at random among those this language has, so trait lines mix with generic ones
  const have = cats.filter((k) => L[k]?.length);
  const cat = have[Math.floor(rnd() * have.length)] ?? cats[cats.length - 1]!;
  const pool = L[cat] ?? BANTER.de[cat] ?? [];
  if (!pool.length) return "…";
  const fresh = pool.filter((s) => !recent.includes(s));
  const src = fresh.length ? fresh : pool;
  const line = src[Math.floor(rnd() * src.length)]!;
  recent.push(line); if (recent.length > RECENT) recent.shift();
  return line.replace(/\{mayor\}/g, vars.mayor).replace(/\{town\}/g, vars.town).replace(/\{name\}/g, vars.name ?? "");
}
