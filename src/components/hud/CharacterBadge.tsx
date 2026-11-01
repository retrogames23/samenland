import { WareIcon } from "./WareIcon";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { townCharacter, type TownWay } from "@/game/character";
import { TOWN_CHARACTER, type Lang } from "@/game/i18n";
import type { Ware } from "@/game/goods";

const WARE: Record<TownWay, Ware> = { grain: "grain", workshop: "tools", gateway: "fish" };

function Shield({ way }: { way: TownWay }) {
  return <span aria-hidden className="relative grid h-9 w-8 shrink-0 place-items-center text-wood">
    <svg viewBox="0 0 32 36" className="absolute inset-0 h-full w-full" fill="none">
      <path d="M2 3 Q16 0 30 3 L28 22 Q26 29 16 34 Q6 29 4 22 Z" className="fill-parchment stroke-wood" strokeWidth="1.5" />
      <path d="M5 6 Q16 4 27 6 L25 21 Q23 27 16 30 Q9 27 7 21 Z" className="stroke-brass" strokeWidth="1" />
    </svg>
    <span className="relative -mt-1"><WareIcon ware={WARE[way]} size={22} /></span>
  </span>;
}

export function CharacterDetails({ seed, lang }: { seed: { x: number; y: number }; lang: Lang }) {
  const c = townCharacter(seed), t = TOWN_CHARACTER[lang];
  return <div className="text-sm">
    <div className="flex items-center gap-2"><Shield way={c.main} /><b className="min-w-0 break-words">{t.names[c.main]}</b></div>
    {c.side && <p className="mt-1 text-xs text-muted-foreground">{t.side}: {t.names[c.side]}</p>}
    <p className="mt-3 text-xs text-muted-foreground">{t.landscape}</p>
    <dl className="mt-1 space-y-1">{(["grain", "workshop", "gateway"] as const).map(way => <div key={way} className="flex justify-between gap-3"><dt>{t.land[way]}</dt><dd className="shrink-0 tabular-nums">{Math.round(c.mix[way] * 100)} %</dd></div>)}</dl>
  </div>;
}

export function CharacterBadge({ seed, lang }: { seed: { x: number; y: number }; lang: Lang }) {
  const c = townCharacter(seed), t = TOWN_CHARACTER[lang];
  return <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="pointer-events-auto h-10 w-10 shrink-0" aria-label={`${t.title}: ${t.names[c.main]}`} title={t.names[c.main]}><Shield way={c.main} /></Button></PopoverTrigger>
    <PopoverContent className="max-w-[calc(100vw-2rem)]" dir={lang === "ar" ? "rtl" : "ltr"}><CharacterDetails seed={seed} lang={lang} /></PopoverContent>
  </Popover>;
}