import { Parchment } from "@/components/hud/Parchment";
import { Button } from "@/components/ui/button";
import { CharacterDetails } from "@/components/hud/CharacterBadge";
import { profileOf } from "@/game/profile";
import { PROFILE } from "@/game/lang/profile";
import { MAYOR } from "@/game/lang/mayor";
import type { DICT, Lang } from "@/game/i18n";
import type { Seed } from "@/game/world";

type T = (typeof DICT)["de"];

export function TownProfile({ t, lang, town, me, seeds, now, onLook, onClose }: { t: T; lang: Lang; town: Seed; me: Seed | null; seeds: Seed[]; now: number; onLook: () => void; onClose: () => void }) {
  const p = profileOf(town, me, seeds, now), d = PROFILE[lang], m = MAYOR[lang];
  const g = (xs: string[]) => xs.map((x) => t.trade.goods[x] ?? x).join(", ");
  const kind = (k: string) => t.kind[k as keyof typeof t.kind] ?? (t.kinds as Record<string, string>)[k] ?? k;
  const role = town.mayor_gender === "w" ? m.w : town.mayor_gender === "d" ? m.d : m.m;
  const traits = (town.mayor_traits ?? []).map((k) => (t.person.traits as Record<string, string>)[k] ?? k);
  const row = (a: string, b: string) => <div className="flex items-baseline justify-between gap-3"><span className="text-muted-foreground">{a}</span><span className="text-end">{b}</span></div>;
  const v = p.vs;
  return (
    <Parchment wide title={town.name} later={t.close} onLater={onClose}>
      <p className="text-center text-sm italic">{t.stages[p.rank]} · {d.people(p.citizens, p.homes)}</p>
      <div className="mt-3 space-y-1 text-sm">
        {row(role, [town.owner, town.mayor_age ? m.years(town.mayor_age) : "", ...traits].filter(Boolean).join(" · "))}
        {row(d.charter, p.charter ? t.charter.paths[p.charter]?.[0] ?? p.charter : d.noCharter)}
        {row(d.exp, g(p.exports))}
        {row(d.imp, g(p.imports))}
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <div className="font-display text-sm">{d.built}</div>
        {p.buildings.length ? <div className="mt-1 flex flex-wrap gap-1">{p.buildings.map((k) => <span key={k} className="rounded border border-border px-2 py-0.5 text-xs">{kind(k)}</span>)}</div>
          : <p className="text-xs text-muted-foreground">{d.noBuilt}</p>}
      </div>
      {v && me && (
        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="font-display">{d.vsTitle(me.name)}</div>
          <p>{v.sameWay ? d.sameWay : d.otherWay}</p>
          {v.sameCharter && <p>{d.sameCharter}</p>}
          <p>{v.rankDiff > 0 ? d.bigger : v.rankDiff < 0 ? d.smaller : d.sameSize}</p>
          {v.theyGive.length > 0 && <p>{d.theyGive(g(v.theyGive))}</p>}
          {v.weGive.length > 0 && <p>{d.weGive(g(v.weGive))}</p>}
          <p>{v.road ? d.road : d.noRoad} {d.ride(v.rideMin)}</p>
          {v.gifts > 0 && <p>{d.gifts(v.gifts)}</p>}
          <p className="pt-1 text-center text-xs italic text-muted-foreground">{d.note}</p>
        </div>
      )}
      <div className="mt-3 border-t border-border pt-3"><CharacterDetails seed={town} lang={lang} /></div>
      <div className="mt-4 flex justify-center"><Button type="button" size="sm" onClick={onLook}>{d.look}</Button></div>
    </Parchment>
  );
}
