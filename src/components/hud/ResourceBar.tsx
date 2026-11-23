import { Mountain, TreePine } from "lucide-react";
import type { Lang } from "@/game/i18n";
import { RESOURCE_T } from "@/game/lang/resources";
import { RESOURCES, type KontorQuote, type ResourceOverview } from "@/game/resources";

const ICON = { wood: TreePine, stone: Mountain } as const;
const fmt = (n: number, lang: Lang) =>
  n.toLocaleString(lang === "de" ? "de-DE" : undefined, { maximumFractionDigits: 1 });

/** HUD chips for wood and stone: the server's stock, storage and daily production (display only). */
export function ResourceBar({
  res,
  lang,
  timeZone,
}: {
  res: ResourceOverview | null;
  lang: Lang;
  timeZone: string;
}) {
  if (!res?.active) return null;
  const rt = RESOURCE_T[lang];
  const next = new Date(res.next).toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  return (
    <span className="flex shrink-0 items-center gap-1.5 md:gap-2" data-resources>
      {RESOURCES.map((r) => {
        const Icon = ICON[r],
          v = res[r],
          full = v.stock >= v.cap;
        return (
          <span
            key={r}
            className={`flex items-center gap-0.5 ${full ? "text-primary" : ""}`}
            title={`${rt[r]}: ${v.stock} / ${v.cap} (${rt.store}) · ${rt.perDay(fmt(v.rate, lang))} · ${rt.next(next)}`}
          >
            <Icon aria-hidden className="h-3.5 w-3.5 text-wood md:h-4 md:w-4" />
            <span aria-label={rt[r]}>{v.stock}</span>
          </span>
        );
      })}
    </span>
  );
}

/** One line under a building's price: the material it uses and, if the stock is short, the Kontor surcharge. */
export function MaterialLine({
  q,
  lang,
  taler,
}: {
  q: KontorQuote | null;
  lang: Lang;
  taler: (n: number) => string;
}) {
  if (!q || (!q.need.wood && !q.need.stone)) return null;
  const rt = RESOURCE_T[lang];
  const parts = (s: { wood: number; stone: number }) =>
    RESOURCES.filter((r) => s[r] > 0)
      .map((r) => `${s[r]} ${rt[r]}`)
      .join(" · ");
  return (
    <div className="text-[11px] text-muted-foreground" data-material>
      {rt.need}: {parts(q.need)}
      {q.cost > 0 && (
        <div className="text-destructive">{rt.kontor(parts(q.missing), taler(q.cost))}</div>
      )}
    </div>
  );
}
