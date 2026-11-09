// Parchment decision windows split out of Game.tsx (behaviour unchanged).
import { Parchment } from "@/components/hud/Parchment";
import { Button } from "@/components/ui/button";
import { ART } from "@/game/decisions";
import type { DecisionKind } from "@/game/decision-order";
import { DICT, TOWN_CHARACTER, type Lang } from "@/game/i18n";
import { clock } from "@/game/time";
import { townRank } from "@/game/rank";
import { townOf, poseOf, jobKey, type Person } from "@/game/people";
import { ENCOUNTERS, choiceOf } from "@/game/encounters";
import { pendingAll, isCommons, commonsVoices, adviceIdx, bakeCost } from "@/game/commons";
import { COMMONS_TEXT } from "@/game/lang/commons";
import { fillLife } from "@/game/lang/village-life";
import { townCharacter, type TownWay } from "@/game/character";
import {
  effAge, roadCandidates, roadHours, roadBuilding, charterReady, CHARTER_PATHS, PACTS,
  type Seed, type CharterPath, type PactKind,
} from "@/game/world";

type T = (typeof DICT)["de"];
type Later = (k: DecisionKind, ms?: number) => void;

export const PATH_ICON: Record<string, string> = { trade: "⚖️", craft: "🔨", culture: "📜", farm: "🌾" };
export const CHAR_ICON: Record<TownWay, string> = { grain: "🌾", workshop: "⚒", gateway: "⚓" };
const wayOf = (p: { x: number; y: number }) => townCharacter(p).main;

export function EncounterDialog({ t, lang, my, seeds, slow, cash, later, decide, focus, setWho }: {
  t: T; lang: Lang; my: Seed; seeds: Seed[]; slow: number; cash: number;
  later: Later; decide: (event: string, choice: string) => void;
  focus: (x: number, y: number) => void; setWho: (p: Person) => void;
}) {
  const ev = pendingAll(my, my.decisions ?? [], clock(), effAge(my, seeds, clock()), townRank(my, seeds, slow));
  const fxText = (e: string, c: string) => {
    const ch = choiceOf(e, c)!; const f = ch.fx as { h?: number; growth?: number; food?: number; health?: number; wealth?: number };
    const parts = [f.growth ? t.enc.growth(Math.round(f.growth * 100)) : "", f.food ? `+${f.food} ${t.enc.food}` : "", f.health ? `+${f.health} ${t.enc.health}` : "", f.wealth ? `+${f.wealth} ${t.enc.wealth}` : ""].filter(Boolean);
    return parts.length && f.h ? `${parts.join(" · ")} · ${t.enc.lasts(f.h)}` : parts.join(" · ");
  };
  const created = Date.parse(my.created_at);
  return (
    <Parchment image={ev ? ART[ev] : undefined} title={ev ? t.enc.events[ev]![0] : t.enc.title} later={t.enc.later} onLater={() => later("encounter")}>
      {!ev ? <p className="mt-2 text-sm text-muted-foreground">{t.enc.decided}</p> : (
        <>
          {(() => {
            const w = ev === "wedding" ? townOf(my, seeds, clock()).weddings.filter((x) => x.at <= clock()).pop() : undefined;
            const live = w && clock() - w.at < 3 * 3600e3;
            return <>
              <p className="mt-2 text-center font-display text-xl leading-snug">{live ? t.enc.couple(`${w.a.first} ${w.a.last}`, `${w.b.first} ${w.b.maiden ?? w.b.last}`) : isCommons(ev) ? (() => { const v = commonsVoices(ev, townOf(my, seeds, clock()).people, (my.decisions ?? []).filter((d) => isCommons(d.event)).length); const nm = (p: Person | null) => p ? `${p.first} ${p.last}` : null; return fillLife(t.enc.events[ev]![1], nm(v.asker), nm(v.other), lang); })() : t.enc.events[ev]![1]}</p>
              {isCommons(ev) && (() => {
                const ct = COMMONS_TEXT[lang], nw = clock(), tw = townOf(my, seeds, nw);
                const n = (my.decisions ?? []).filter((d) => isCommons(d.event)).length;
                const v = commonsVoices(ev, tw.people, n);
                const jobOf = (p: Person) => t.job[jobKey(p)]?.[p.sex === "f" ? 0 : 1] ?? p.job;
                const show = (p: Person) => { const tw2 = townOf(my, seeds, clock()), q = tw2.people.find((x) => x.id === p.id); const z = q ? poseOf(q, tw2, seeds, clock()) : null; later("encounter", 6e4); if (z) focus(z.x, z.y); if (q) setWho(q); };
                return <>
                  {v.asker && <p className="mt-2 text-center text-xs text-muted-foreground">{ct.asks(`${v.asker.first} ${v.asker.last}`, jobOf(v.asker))} <button type="button" className="hit relative underline decoration-dotted" onClick={() => show(v.asker!)}>{ct.find}</button></p>}
                  {v.advisor && <div className="mt-3 rounded-md border border-brass/50 bg-brass/10 p-2 text-sm">
                    <div className="text-xs font-semibold text-wood">{ct.counsel(`${v.advisor.first} ${v.advisor.last}`, v.herb ? ct.roles.herb : ct.roles.elder)}</div>
                    <div className="italic">{ct.advice[ev]?.[adviceIdx(nw)]}</div>
                  </div>}
                </>;
              })()}
              {live && <div className="mt-2 text-center"><button type="button" className="rounded-md border-2 border-brass px-3 py-1 text-sm font-semibold text-wood hover:bg-brass/20" onClick={() => { const nw = clock(), tw = townOf(my, seeds, nw), p = tw.people.find((q) => q.id === w.a.id); const z = p ? poseOf(p, tw, seeds, nw) : null; later("encounter", 6e4); if (z) focus(z.x, z.y); if (p) setWho(p); }}>{t.enc.look}</button></div>}
            </>;
          })()}
          <div className="mt-4 grid gap-2">
            {Object.keys(ENCOUNTERS[ev]).map((c) => {
              const cost = bakeCost(my, ev, c, choiceOf(ev, c)!.cost), poor = cost > cash, fx = fxText(ev, c);
              return (
                <button key={c} type="button" disabled={poor} onClick={() => decide(ev, c)} className="rounded-md border-2 border-border p-2 text-left hover:border-brass hover:bg-brass/20 disabled:opacity-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-wood">{t.enc.choices[`${ev}:${c}`]}</span>
                    <span className="text-xs font-semibold tabular-nums">{cost > 0 ? t.taler(cost) : cost < 0 ? t.enc.gain(-cost) : t.enc.free}</span>
                  </div>
                  {(fx || poor) && <div className="text-xs text-muted-foreground">{poor ? t.enc.poor : fx}</div>}
                </button>
              );
            })}
          </div>
        </>
      )}
      <h3 className="mt-5 font-display text-2xl text-wood">{t.enc.chronicle}</h3>
      {(my.decisions ?? []).length === 0 ? <p className="text-xs text-muted-foreground">{t.enc.none}</p> : (
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {[...(my.decisions ?? [])].reverse().slice(0, 8).map((d) => (
            <li key={d.at}>{t.enc.dayN(Math.floor((d.at - created) / 86400000) + 1)}: {t.enc.events[d.event]?.[0]} – {t.enc.choices[`${d.event}:${d.choice}`]}</li>
          ))}
        </ul>
      )}
    </Parchment>
  );
}

export function RoadDialog({ t, lang, my, seeds, now, charters, pick, setPick, later, focus, seal }: {
  t: T; lang: Lang; my: Seed; seeds: Seed[]; now: number; charters: { seed_id: string; path: string }[];
  pick: string | null; setPick: (id: string) => void; later: Later; focus: (x: number, y: number) => void; seal: () => void;
}) {
  const list = roadCandidates(my, seeds);
  return (
    <Parchment image={ART["road"]} title={t.road.title} later={t.enc.later} onLater={() => later("road")}>
      <p className="mt-2 text-sm text-center">{t.road.intro}</p>
      {list.length === 0 ? <p className="mt-4 text-sm font-semibold">{t.road.none}</p> : (
        <>
          <div className="mt-4 grid gap-2">
            {list.map((o) => {
              const c = wayOf(o), ch = charters.find((x) => x.seed_id === o.id)?.path;
              return (
                <div key={o.id} onClick={() => setPick(o.id)} className={`flex cursor-pointer items-center gap-2 rounded-md border-2 p-2 ${pick === o.id ? "border-brass bg-brass/20" : "border-border"}`}>
                  <button type="button" aria-pressed={pick === o.id} onClick={() => setPick(o.id)} className="flex-1 py-1 text-left">
                    <div className="font-semibold text-wood">{o.name}</div>
                    <div className="text-xs text-muted-foreground">{t.road.dist(Math.round(Math.hypot(o.x - my.x, o.y - my.y)))} · ⏳ {roadHours(my, o)} h · {CHAR_ICON[c]} {TOWN_CHARACTER[lang].names[c]}{ch ? ` · ${PATH_ICON[ch]} ${t.charter.paths[ch]![0]}` : ""}</div>
                  </button>
                  <Button size="sm" variant="secondary" onClick={() => { focus(o.x, o.y); later("road"); }}>{t.road.look}</Button>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{t.road.final}</span>
            <Button disabled={!pick || !!roadBuilding(my, now, seeds)} onClick={seal}>{t.road.seal}</Button>
          </div>
        </>
      )}
    </Parchment>
  );
}

export function PactDialog({ t, my, partner, pick, setPick, later, seal }: {
  t: T; my: Seed; partner: Seed; pick: PactKind | null; setPick: (p: PactKind) => void; later: Later; seal: () => void;
}) {
  const theirs = (partner.votes ?? []).filter((v) => v.partner === my.id).sort((a, b) => b.at - a.at)[0];
  return (
    <Parchment image={ART["charter"]} title={t.twin.title(my.name, partner.name)} later={t.enc.later} onLater={() => later("pact")}>
      <p className="mt-2 text-sm text-center">{t.twin.intro}</p>
      {theirs && <p className="mt-2 text-center text-sm font-semibold">{t.twin.partnerChose(t.twin.pacts[theirs.pact]![0])}</p>}
      <div className="mt-4 grid gap-2">
        {PACTS.map((p) => (
          <button key={p} type="button" aria-pressed={pick === p} onClick={() => setPick(p)}
            className={`rounded-md border-2 p-2 text-left ${pick === p ? "border-brass bg-brass/20" : "border-border hover:border-brass/60"}`}>
            <div className="font-semibold text-wood">{t.twin.pacts[p]![0]}</div>
            <div className="text-xs text-muted-foreground">{t.twin.pacts[p]![1]}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-end"><Button disabled={!pick} onClick={seal}>{t.twin.seal}</Button></div>
    </Parchment>
  );
}

export function CharterDialog({ t, my, now, pick, setPick, later, seal }: {
  t: T; my: Seed; now: number; pick: CharterPath | null; setPick: (p: CharterPath) => void; later: Later; seal: () => void;
}) {
  return (
    <Parchment wide image={ART["charter"]} title={`${t.charter.title} · ${my.name}`} later={t.enc.later} onLater={() => later("charter")}>
      <p className="mt-2 text-sm text-center">{t.charter.intro}</p>
      {!charterReady(my.created_at, now) ? (
        <p className="mt-4 text-sm font-semibold">{t.charter.locked}</p>
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {CHARTER_PATHS.map((p) => {
              const [name, style, bonus, builds] = t.charter.paths[p]!;
              return (
                <button key={p} type="button" onClick={() => setPick(p)} aria-pressed={pick === p}
                  className={`rounded-md border-2 p-3 text-left transition ${pick === p ? "border-brass bg-brass/20" : "border-border hover:border-brass/60"}`}>
                  <div className="font-display text-2xl leading-none text-wood">{PATH_ICON[p]} {name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{style}</div>
                  <div className="mt-2 text-xs"><b>+</b> {bonus}</div>
                  <div className="mt-1 text-xs"><b>{t.charter.buildings}:</b> {builds}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{t.charter.final}</span>
            <Button disabled={!pick} onClick={seal}>{t.charter.sealBtn}</Button>
          </div>
        </>
      )}
    </Parchment>
  );
}
