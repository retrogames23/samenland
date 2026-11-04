import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Parchment } from "@/components/hud/Parchment";
import { Input } from "@/components/ui/input";
import { rollOf, matches } from "@/game/roll";
import type { Person, Town } from "@/game/people";
import type { DICT } from "@/game/i18n";

type T = (typeof DICT)["de"];

export function VillageRoll({ t, town, hue, character, onPick, onClose }: { t: T; town: Town; hue: number; character?: ReactNode; onPick: (p: Person) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [job, setJob] = useState("");
  const [sort, setSort] = useState<"house" | "name" | "age">("house");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const roll = useMemo(() => rollOf(town.people), [town]);
  const big = roll.total > 300;
  const jobs = useMemo(() => [...new Set(roll.households.flatMap((h) => h.people.map((p) => p.job)))].sort(), [roll]);
  const by = useMemo(() => new Map(town.people.map((p) => [p.id, p])), [town]);
  const jobName = (p: Person) => t.job[p.job]?.[p.sex === "f" ? 0 : 1] ?? p.job;
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
  // show a soft fade + chevron while the roll can be scrolled further down
  const checkMore = () => { const el = listRef.current; if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8); };
  useEffect(checkMore, [roll, filtering, flat, open]);

  return (
    <Parchment wide title={t.roll.title} later={t.close} onLater={onClose}>
      <p className="text-center text-sm italic">{t.roll.stats(roll.total, roll.households.length, roll.kids, roll.sick)}</p>
      {roll.mayor && (
        <button type="button" onClick={() => onPick(roll.mayor!)} className="mx-auto mt-3 flex items-center gap-3 rounded px-3 py-1 hover:bg-ink/10">
          <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full font-display text-lg text-primary-foreground shadow" style={{ background: `hsl(${hue} 55% 38%)` }}>✠</span>
          <span className="text-left"><b className="font-display text-xl text-ink">{roll.mayor.first} {roll.mayor.last}</b><span className="block text-xs">{jobName(roll.mayor)}</span></span>
        </button>
      )}
      {character && <div className="mt-3 border-y border-border py-3">{character}</div>}
      <div className="mt-3 flex flex-wrap gap-2">
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
      <div className="relative mt-3">
        <div ref={listRef} onScroll={checkMore} className="max-h-[50vh] overflow-auto text-sm">
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
        {more && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-parchment to-transparent">
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 animate-bounce text-ink/50">▾</span>
          </div>
        )}
      </div>
    </Parchment>
  );
}
