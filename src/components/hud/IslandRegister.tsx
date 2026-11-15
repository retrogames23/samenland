import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Seed } from "@/game/world";
import type { Ware } from "@/game/goods";
import type { Lang } from "@/game/i18n";
import { REGISTER } from "@/game/lang/register";
import { WareIcon } from "./WareIcon";

export type RegisterRow = {
  seed: Seed; ready: boolean; rank: string; way: string; wayKey: string;
  citizens: number; homes: number; wares: Ware[];
  link: "road" | "building" | null; rideMin: number | null; dist: number | null; mine: boolean;
};
const WAY_MARK: Record<string, string> = { grain: "🌾", workshop: "⚒️", gateway: "⚓" };

/** Island register: whole-map overview of every town; tapping a name flies there. Display only. */
export function IslandRegister({ lang, island, rows, wayNames, onGo, details }: {
  lang: Lang; island: string; rows: RegisterRow[]; wayNames: Record<string, string>;
  onGo: (s: Seed) => void; details: (s: Seed) => ReactNode;
}) {
  const R = REGISTER[lang];
  const [sort, setSort] = useState<"pop" | "dist" | "name">("pop");
  const [open, setOpen] = useState<string | null>(null);
  const total = rows.reduce((a, r) => a + r.citizens, 0);
  const ways = new Map<string, number>();
  for (const r of rows) ways.set(r.wayKey, (ways.get(r.wayKey) ?? 0) + 1);
  const sorted = [...rows].sort((a, b) => {
    if (a.mine !== b.mine) return a.mine ? -1 : 1;
    if (sort === "name") return a.seed.name.localeCompare(b.seed.name, lang);
    if (sort === "dist") return (a.dist ?? 1e9) - (b.dist ?? 1e9);
    return b.citizens - a.citizens;
  });
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-wood/40 bg-muted/40 px-3 py-2">
        <div className="font-display text-base font-bold text-foreground">{island}</div>
        <div className="text-xs text-muted-foreground">{R.places(rows.length)} · {R.citizens(total)}</div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-foreground">
          {[...ways].map(([k, c]) => <span key={k}>{WAY_MARK[k] ?? "•"} {wayNames[k] ?? k} {c}</span>)}
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs" role="group" aria-label={R.sortBy}>
        <span className="text-muted-foreground">{R.sortBy}:</span>
        {(["pop", "dist", "name"] as const).map((k) => (
          <button key={k} onClick={() => setSort(k)} className={`hit rounded-full border px-2 py-0.5 ${sort === k ? "border-primary bg-primary/15 text-primary" : "border-border text-foreground"}`}>
            {k === "pop" ? R.byPop : k === "dist" ? R.byDist : R.byName}
          </button>
        ))}
      </div>
      <ul className="max-h-[50vh] space-y-1 overflow-y-auto overflow-x-hidden">
        {sorted.map((r) => {
          const s = r.seed, isOpen = open === s.id;
          return (
            <li key={s.id} className={`rounded px-2 py-1 ${r.mine ? "bg-primary/10" : ""}`}>
              <div className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 text-base leading-none">{WAY_MARK[r.wayKey] ?? "•"}</span>
                <div className="min-w-0 flex-1">
                  <button className="hit max-w-full truncate text-start font-semibold text-foreground underline-offset-2 hover:underline" title={R.goTo} onClick={() => onGo(s)}>{s.name}</button>
                  <div className={`text-xs text-muted-foreground ${r.ready ? "" : "animate-pulse"}`}>
                    {r.ready ? <>{r.rank} · {R.citizens(r.citizens)} · {R.homes(r.homes)}</> : "…"}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                    {r.wares.map((w) => <WareIcon key={w} ware={w} size={18} />)}
                    {r.mine ? <span className="text-primary">{R.mine}</span>
                      : r.link === "road" ? <span className="text-primary">{R.road}</span>
                      : r.link === "building" ? <span>{R.building}</span>
                      : r.rideMin != null && <span>{R.ride(r.rideMin)}</span>}
                  </div>
                </div>
                <button className="hit shrink-0 rounded p-1 text-muted-foreground hover:bg-accent" aria-expanded={isOpen} aria-label={isOpen ? R.less : R.more} onClick={() => setOpen(isOpen ? null : s.id)}>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              {isOpen && <div className="mt-1 border-t border-border pt-1">{details(s)}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
