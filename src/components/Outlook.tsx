import { RANK_NEED, rankInput } from "@/game/rank";
import { LANDMARKS, STAGES, type Seed } from "@/game/world";
import { ITEMS, MONUMENTS, canBuy, canBuyWay, type Item } from "@/game/economy";
import { ITEM_STAGE } from "@/game/disasters";
import { OUTLOOK } from "@/game/lang/outlook";
import type { DICT, Lang } from "@/game/i18n";
import type { TownWay } from "@/game/character";

type T = (typeof DICT)["de"];

/** What a given stage brings: organic landmarks (by growth age) and build-menu unlocks (by stage). Pure. */
export function stageUnlocks(stage: number, charter: string | null | undefined, way: TownWay | undefined) {
  const lo = STAGES[stage]?.from ?? Infinity, hi = STAGES[stage + 1]?.from ?? Infinity;
  const grows = [...new Set(LANDMARKS.filter((l) => l.at >= lo && l.at < hi && (stage === 0 ? true : l.at > 0)).map((l) => l.kind))];
  const items = (Object.keys(ITEMS) as Item[]).filter((it) => (ITEM_STAGE[it] ?? 0) === stage && canBuy(it, charter as never) && canBuyWay(it, way));
  const monuments = (Object.keys(MONUMENTS) as (keyof typeof MONUMENTS)[]).filter((k) => MONUMENTS[k].stage === stage && (!MONUMENTS[k].way || MONUMENTS[k].way === way));
  return { grows, items, monuments };
}

export function Outlook({ t, lang, my, seeds, now, rank, charter, way }: { t: T; lang: Lang; my: Seed; seeds: Seed[]; now: number; rank: number; charter: string | null | undefined; way: TownWay | undefined }) {
  const o = OUTLOOK[lang];
  const inp = rankInput(my, seeds, now);
  const need = RANK_NEED[rank];
  const kn = (k: string) => (t as unknown as { kind: Record<string, string> }).kind[k] ?? k;
  const names = (s: number) => {
    const u = stageUnlocks(s, charter, way);
    return {
      grows: u.grows.map(kn),
      unlocks: [...u.items.map((it) => t.items[it]?.[0] ?? it), ...u.monuments.map((k) => t.items[`${k}1`]?.[0] ?? k)],
    };
  };
  const Bar = ({ label, have, want }: { label: string; have: number; want: number }) => want <= 0 ? null : (
    <div>
      <div className="flex justify-between"><span>{label}</span><span>{Math.min(have, want)} / {want}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10"><div className={`h-full ${have >= want ? "bg-primary" : "bg-brass"}`} style={{ width: `${Math.min(1, have / want) * 100}%` }} /></div>
    </div>
  );
  const List = ({ s }: { s: number }) => {
    const n = names(s);
    return (
      <div className="space-y-0.5">
        {n.grows.length > 0 && <div><span className="text-muted-foreground">🌱 {o.grows}:</span> {n.grows.join(", ")}</div>}
        {n.unlocks.length > 0 && <div><span className="text-muted-foreground">🔨 {o.unlocks}:</span> {n.unlocks.join(", ")}</div>}
      </div>
    );
  };
  return (
    <div className="rounded-md border border-brass/60 bg-brass/10 p-2 text-xs">
      <div className="font-semibold">🧭 {o.title}</div>
      {!need ? <div className="mt-1 text-primary">{o.max}</div> : (
        <div className="mt-1 space-y-1.5">
          <div className="font-semibold text-wood">{o.next(t.stages[rank + 1] ?? "")}</div>
          <Bar label={o.cit} have={inp.citizens} want={need[0]} />
          <Bar label={o.homes} have={inp.homes} want={need[1]} />
          <Bar label={o.roads} have={inp.roads} want={need[2]} />
          <List s={rank + 1} />
        </div>
      )}
      <details className="mt-2 border-t border-brass/40 pt-1.5">
        <summary className="cursor-pointer font-semibold">{o.all}</summary>
        <ol className="mt-1 space-y-1.5">
          {STAGES.map((_, s) => {
            const nd = s > 0 ? RANK_NEED[s - 1]! : null;
            return (
              <li key={s} className={s <= rank ? "opacity-70" : ""}>
                <div className="font-semibold">{s <= rank ? "✓" : "○"} {t.stages[s]}{s === rank ? ` · ${o.now}` : ""}</div>
                {nd && <div className="text-muted-foreground">{nd[0]} {o.cit} · {nd[1]} {o.homes}{nd[2] ? ` · ${nd[2]} ${o.roads}` : ""}</div>}
                <List s={s} />
              </li>
            );
          })}
        </ol>
      </details>
    </div>
  );
}
