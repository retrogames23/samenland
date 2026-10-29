import { useMemo, useState } from "react";
import { Parchment } from "@/components/hud/Parchment";
import { Input } from "@/components/ui/input";
import { rollOf, matches } from "@/game/roll";
import type { Person, Town } from "@/game/people";
import type { DICT } from "@/game/i18n";

type T = (typeof DICT)["de"];

export function VillageRoll({ t, town, hue, onPick, onClose }: { t: T; town: Town; hue: number; onPick: (p: Person) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [job, setJob] = useState("");
  const [sort, setSort] = useState<"house" | "name" | "age">("house");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const roll = useMemo(() => rollOf(town.people), [town]);
  const big = roll.total > 300;
  const jobs = useMemo(() => [...new Set(town.people.map((p) => p.job))].sort(), [town]);
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

  return (
    <Parchment wide title={t.roll.title} later={t.close} onLater={onClose}>
      <p className="text-center text-sm italic">{t.roll.stats(roll.total, roll.households.length, roll.kids, roll.sick)}</p>
      {roll.mayor && (
        <button type="button" onClick={() => onPick(roll.mayor!)} className="mx-auto mt-3 flex items-center gap-3 rounded px-3 py-1 hover:bg-ink/10">
          <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full font-display text-lg text-primary-foreground shadow" style={{ background: `hsl(${hue} 55% 38%)` }}>✠</span>
          <span className="text-left"><b className="font-display text-xl text-ink">{roll.mayor.first} {roll.mayor.last}</b><span className="block text-xs">{jobName(roll.mayor)}</span></span>
        </button>
      )}
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
      <div className="mt-3 max-h-[50vh] overflow-auto text-sm">
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
    </Parchment>
  );
}
