import { useMemo, useState, type ReactNode } from "react";
import { Parchment } from "@/components/hud/Parchment";
import { Input } from "@/components/ui/input";
import { rollOf, matches } from "@/game/roll";
import type { Person, Town } from "@/game/people";
import type { DICT, Lang } from "@/game/i18n";
import { censusOf } from "@/game/census";
import { CENSUS } from "@/game/lang/census";

type T = (typeof DICT)["de"];

export function VillageRoll({ t, lang = "de", town, hue, character, onPick, onClose }: { t: T; lang?: Lang; town: Town; hue: number; character?: ReactNode; onPick: (p: Person) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"roll" | "book">("roll");
  const [q, setQ] = useState("");
  const [job, setJob] = useState("");
  const [sort, setSort] = useState<"house" | "name" | "age">("house");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const roll = useMemo(() => rollOf(town.people), [town]);
  const big = roll.total > 300;
  const jobs = useMemo(() => [...new Set(roll.households.flatMap((h) => h.people.map((p) => p.job)))].sort(), [roll]);
  const by = useMemo(() => new Map(town.people.map((p) => [p.id, p])), [town]);
  const jobName = (p: Person) => p.job === "mayor" && p.seed?.mayor_gender === "d" ? t.gender.d : t.job[p.job]?.[p.sex === "f" ? 0 : 1] ?? p.job;
  const kin = (p: Person) => {
    const sp = p.spouse != null ? by.get(p.spouse) : undefined;
    const base = p.role === "spouse" || (sp && p.role !== "head") ? t.roll.spouse(p.sex, sp?.first ?? "") : p.role ? t.roll.role[p.role]?.[p.sex === "f" ? 0 : 1] ?? "" : "";
    return [base, p.maiden ? t.roll.maiden(p.maiden) : ""].filter(Boolean).join(" · ");
  };
  const row = (p: Person) => (
    <li key={p.id}>
      <button type="button" onClick={() => onPick(p)} className="flex w-full items-baseline justify-between gap-3 rounded px-2 py-1 text-left hover:bg-ink/10">
        <span><b className="text-ink">{p.first} {p.last}</b>{p.sick && <span className="ml-1 text-xs text-destructive">· {t.roll.sickTag}</span>}<span className="block text-xs text-muted-foreground">{kin(p)}</span></span>
        <span className="shrink-0 text-right text-xs">{jobName(p)}<span className="block text-muted-foreground">{t.roll.age(p.age)}</span></span>
      </button>
    </li>
  );
  const filtering = !!q || !!job || sort !== "house";
  const flat = useMemo(() => {
    if (!filtering) return [];
    const all = roll.households.flatMap((h) => h.people).filter((p) => matches(p, q, job));
    if (sort === "name") all.sort((a, b) => a.first.localeCompare(b.first));
    if (sort === "age") all.sort((a, b) => b.age - a.age);
    return all;
  }, [roll, q, job, sort, filtering]);

  return (
    <Parchment wide title={t.roll.title} later={t.close} onLater={onClose}>
      <p className="text-center text-sm italic">{t.roll.stats(roll.total, roll.households.length, roll.kids, roll.sick)}</p>
      <div role="tablist" className="mt-3 flex justify-center gap-1 border-b border-ink/25">
        {(["roll", "book"] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px rounded-t border border-b-0 px-3 py-1 font-display text-base ${tab === k ? "border-ink/25 bg-parchment text-ink" : "border-transparent text-muted-foreground hover:text-ink"}`}>
            {k === "roll" ? CENSUS[lang].tabRoll : CENSUS[lang].tabBook}
          </button>
        ))}
      </div>
      {tab === "book" ? <CensusBook lang={lang} town={town} /> : <>
      {roll.mayor && (
        <button type="button" onClick={() => onPick(roll.mayor!)} className="mx-auto mt-3 flex items-center gap-3 rounded px-3 py-1 hover:bg-ink/10">
          <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full font-display text-lg text-primary-foreground shadow" style={{ background: `hsl(${hue} 55% 38%)` }}>✠</span>
          <span className="text-left"><b className="font-display text-xl text-ink">{roll.mayor.first} {roll.mayor.last}</b><span className="block text-xs">{jobName(roll.mayor)}</span></span>
        </button>
      )}
      {character && <div className="mt-3 border-y border-border py-3">{character}</div>}
      <div className="sticky top-0 z-10 -mx-2 mt-3 flex flex-wrap gap-2 bg-parchment px-2 py-2 pe-12 shadow-[0_6px_6px_-6px_hsl(0_0%_0%/0.25)]">
        <Input className="h-8 min-w-0 flex-1" placeholder={t.roll.search} value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label={t.roll.job} className="h-8 rounded-md border border-border bg-card px-2 text-sm" value={job} onChange={(e) => setJob(e.target.value)}>
          <option value="">{t.roll.allJobs}</option>
          {jobs.map((j) => <option key={j} value={j}>{t.job[j]?.[1] ?? j}</option>)}
        </select>
        <select aria-label={t.roll.sort} className="h-8 rounded-md border border-border bg-card px-2 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="house">{t.roll.byHouse}</option>
          <option value="name">{t.roll.byName}</option>
          <option value="age">{t.roll.byAge}</option>
        </select>
      </div>
      <div className="mt-1 text-sm">
        {filtering ? (
          flat.length ? <ul>{flat.map(row)}</ul> : <p className="text-center text-muted-foreground">{t.roll.none}</p>
        ) : roll.households.map((h) => {
          const shown = !big || open.has(h.key);
          return (
            <section key={h.key} className="mb-2">
              <button type="button" className="w-full border-b border-ink/20 px-2 text-left font-display text-lg text-ink" onClick={() => big && setOpen((s) => { const n = new Set(s); n.has(h.key) ? n.delete(h.key) : n.add(h.key); return n; })}>
                {t.roll.family(h.name, h.people.length)}{big ? (shown ? " ▾" : " ▸") : ""}
              </button>
              {shown && <ul>{h.people.map(row)}</ul>}
            </section>
          );
        })}
      </div>
      </>}
    </Parchment>
  );
}

/** Ink tally: one stroke per soul, bundled in fives like a scribe's count. */
function Tally({ n }: { n: number }) {
  const fives = Math.floor(n / 5), rest = n % 5;
  const show = Math.min(fives, 24);
  return (
    <span aria-hidden className="font-display tracking-tight text-ink/80">
      {Array.from({ length: show }, (_, i) => <span key={i} className="me-1 line-through decoration-ink/70">||||</span>)}
      {fives > show ? "… " : ""}{"|".repeat(rest)}
    </span>
  );
}

function CensusBook({ lang, town }: { lang: Lang; town: Town }) {
  const c = useMemo(() => censusOf(town.people), [town]);
  const L = CENSUS[lang];
  const keys = ["ordinary", "skilled", "wealthy"] as const;
  const top = keys.reduce((a, k) => (c.estates[k].hearths > c.estates[a].hearths ? k : a), "ordinary" as (typeof keys)[number]);
  const H = ({ children }: { children: ReactNode }) => <h3 className="mt-4 border-b border-ink/20 font-display text-lg text-ink">{children}</h3>;
  const ages = c.ages.reduce((a, b) => a + b, 0) || 1;
  const trades: number[] = [c.trades.food, c.trades.craft, c.trades.common];
  return (
    <div className="mt-2 px-1 text-sm">
      <H>{L.estatesH}</H>
      <ul className="mt-1 space-y-1">
        {keys.map((k, i) => (
          <li key={k} className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span><b className="text-ink">{"I".repeat(i + 1)}.</b> {L.estates[i]}</span>
            <span className="text-xs text-muted-foreground">{L.hearths(c.estates[k].hearths, c.estates[k].souls)}</span>
            <span className="basis-full"><Tally n={c.estates[k].hearths} /></span>
          </li>
        ))}
      </ul>
      {c.souls > 0 && <p className="mt-2 text-center italic">„{L.verdict[keys.indexOf(top)]}“</p>}
      <H>{L.agesH}</H>
      <div aria-hidden className="mt-2 flex h-3 overflow-hidden rounded-sm border border-ink/40">
        {c.ages.map((n, i) => <span key={i} style={{ width: `${(n / ages) * 100}%`, opacity: 0.2 + i * 0.22 }} className="border-e border-ink/40 bg-ink last:border-e-0" />)}
      </div>
      <ul className="mt-1 grid grid-cols-2 gap-x-3 text-xs">
        {c.ages.map((n, i) => <li key={i} className="flex justify-between"><span>{L.ages[i]}</span><b className="text-ink">{n}</b></li>)}
      </ul>
      <H>{L.tradesH}</H>
      <ul className="mt-1 space-y-1">
        {trades.map((n, i) => <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3"><span>{L.trades[i]} <b className="text-ink">{n}</b></span><span className="basis-full"><Tally n={n} /></span></li>)}
      </ul>
      <H>{L.kinH}</H>
      <ul className="mt-1 space-y-0.5">
        <li>{L.couples(c.couples)}</li>
        <li>{L.widowed(c.widowed)}</li>
        <li>{L.newcomers(c.newcomers)}</li>
      </ul>
    </div>
  );
}
