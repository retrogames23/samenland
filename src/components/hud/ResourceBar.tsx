import { Coins, Mountain, TreePine } from "lucide-react";
import type { Lang } from "@/game/i18n";
import { RESOURCE_T } from "@/game/lang/resources";
import { RESOURCES, type KontorQuote, type ResourceOverview } from "@/game/resources";

const ICON = { wood: TreePine, stone: Mountain } as const;
const fmt = (n: number, lang: Lang) =>
  n.toLocaleString(lang === "de" ? "de-DE" : undefined, { maximumFractionDigits: 1 });

/**
 * HUD chips for wood and stone: the server's stock, storage and daily production (display only). From the map's
 * Ankauf start (P1, 0151) the tooltip names the price the Kontor pays for overflow, and a coin chip shows the credit of
 * the newest booked day — the money itself is only ever booked by the database.
 */
export function ResourceBar({
  res,
  lang,
  timeZone,
  taler = (n: number) => String(n),
}: {
  res: ResourceOverview | null;
  lang: Lang;
  timeZone: string;
  taler?: (n: number) => string;
}) {
  if (!res?.active) return null;
  const rt = RESOURCE_T[lang];
  const next = new Date(res.next).toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  // the Ankauf counts from the next booked day start on; the newest booked day starts one day before `next`
  const ak = res.ankauf && Date.parse(res.ankauf.since) <= Date.parse(res.next) ? res.ankauf : null;
  const offer = ak ? ` · ${rt.ankauf(taler(ak.wood), taler(ak.stone))}` : "";
  const fresh = ak?.last && Date.parse(ak.last.at) >= Date.parse(res.next) - 864e5 ? ak.last : null;
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
            title={`${rt[r]}: ${v.stock} / ${v.cap} (${rt.store}) · ${rt.perDay(fmt(v.rate, lang))} · ${rt.next(next)}${offer}`}
          >
            <Icon aria-hidden className="h-3.5 w-3.5 text-wood md:h-4 md:w-4" />
            <span aria-label={rt[r]}>{v.stock}</span>
          </span>
        );
      })}
      {fresh && ak && (
        <span
          className="flex items-center gap-0.5 text-primary"
          title={`${rt.ankaufLast(taler(fresh.mark))} · ${rt.ankauf(taler(ak.wood), taler(ak.stone))}`}
          data-ankauf
        >
          <Coins aria-hidden className="h-3.5 w-3.5 text-wood md:h-4 md:w-4" />
          <span aria-label={rt.ankaufLast(taler(fresh.mark))}>+{fresh.mark}</span>
        </span>
      )}
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
