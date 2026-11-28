import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOCALE, type Lang } from "@/game/i18n";
import { STIFT_T } from "@/game/lang/stiftung";
import { STIFT_BAUTEN, STIFT_DAYS, stiftRestDays, type StiftBau } from "@/game/stiftung";
import type { StiftBauView, StiftOverview } from "@/components/hooks/useStiftung";

const DAY = 864e5;

/**
 * P4 Stiftungen: one card per Bau with exactly one state and its reason (amount or date). Display only — the database
 * checks every action again (stift_open / stift_deposit / stift_close). Rendered only where Stiftungen are active.
 */
export function StiftungCard(p: {
  lang: Lang;
  stift: StiftOverview;
  /** name of a Gemeindebau stage (CIVIC_T stages) */
  stageName: (item: string) => string;
  taler: (n: number) => string;
  cash: number;
  /** the resource settlement is pending (resource_overview: pending) */
  pending: boolean;
  onOpen: (bau: StiftBau) => void;
  onDeposit: (bau: StiftBau, n: number, amount: number) => void;
  onClose: (bau: StiftBau, max: number) => void;
}) {
  const t = STIFT_T[p.lang];
  const [amount, setAmount] = useState<Partial<Record<StiftBau, string>>>({});
  const [confirm, setConfirm] = useState<StiftBau | null>(null);
  const now = p.stift.now ? Date.parse(p.stift.now) : Date.now();
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(LOCALE[p.lang], {
      weekday: "long",
      day: "numeric",
      month: "numeric",
    });
  const restDays = (v: StiftBauView) =>
    v.until ? stiftRestDays(Math.max(0, Date.parse(v.until) - now)) : 0;
  const vor = p.stift.vorrang ?? null;
  const reserved = p.stift.reserved ?? { wood: 0, stone: 0 };

  const state = (bau: StiftBau, v: StiftBauView) => {
    if (!v.built)
      return (
        <div className="mt-1 text-muted-foreground">🔒 {t.lockBau(p.stageName(`${bau}1`))}</div>
      );
    const st = v.stage;
    if (st && !st.funded_at) {
      // an open stage: pay in — unless a Gemeindebau has to be paid first
      const rest = st.price - st.paid;
      const n = Math.floor(+(amount[bau] ?? "") || 0);
      const ok = n >= 1 && n <= rest && n <= p.cash && !vor;
      return (
        <div className="mt-1 space-y-1">
          <div className="h-1.5 overflow-hidden rounded bg-ink/15">
            <div
              className="h-full bg-brass"
              style={{ width: `${(100 * st.paid) / Math.max(1, st.price)}%` }}
            />
          </div>
          <div className="text-muted-foreground">{t.paid(p.taler(st.paid), p.taler(st.price))}</div>
          {vor ? (
            <div className="font-semibold">
              ⏸ {t.lockVorrang(p.stageName(vor.item), p.taler(vor.rest))}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1">
                <Input
                  type="number"
                  inputMode="numeric"
                  className="h-7 min-w-[7rem] flex-1 text-xs"
                  min={1}
                  max={Math.min(rest, Math.max(0, p.cash))}
                  placeholder={t.amount}
                  aria-label={t.amount}
                  value={amount[bau] ?? ""}
                  onChange={(e) =>
                    setAmount({ ...amount, [bau]: e.target.value.replace(/[^0-9]/g, "") })
                  }
                />
                <Button
                  size="sm"
                  className="h-7"
                  disabled={!ok}
                  onClick={() => {
                    p.onDeposit(bau, st.deposits + 1, n);
                    setAmount({ ...amount, [bau]: "" });
                  }}
                >
                  {t.pay(p.taler(ok ? n : 0))}
                </Button>
              </div>
              <div className="text-[10px] text-muted-foreground">{t.depositHint}</div>
            </>
          )}
        </div>
      );
    }
    if (st && v.plan) {
      // fully paid: "Stiften" — with the material and the Kontor amount before the confirmation
      const pl = v.plan;
      const kontor = pl.kontor.wood + pl.kontor.stone > 0;
      const short = pl.short.wood + pl.short.stone > 0;
      const after = Math.min(restDays(v), STIFT_DAYS) + STIFT_DAYS;
      const block = p.pending ? (
        <div className="font-semibold">⏳ {t.pending}</div>
      ) : pl.full && v.until ? (
        <div className="font-semibold">
          ⏸{" "}
          {t.closeFull(
            restDays(v),
            date(new Date(Date.parse(v.until) - STIFT_DAYS * DAY).toISOString()),
          )}
        </div>
      ) : kontor && vor ? (
        <div className="font-semibold">
          ⏸ {t.kontorVorrang(p.stageName(vor.item), p.taler(vor.rest))}
        </div>
      ) : short ? (
        <div className="font-semibold">
          ⏸{" "}
          {t.short(
            pl.short.wood,
            pl.short.stone,
            pl.short.wood ? reserved.wood : 0,
            pl.short.stone ? reserved.stone : 0,
          )}
        </div>
      ) : null;
      return (
        <div className="mt-1 space-y-1">
          <div className="text-muted-foreground">{t.ready}</div>
          <div>
            {kontor
              ? t.plan(
                  pl.store.wood,
                  pl.store.stone,
                  pl.kontor.wood,
                  pl.kontor.stone,
                  p.taler(pl.cost),
                )
              : t.planStore}
          </div>
          {block ??
            (confirm === bau ? (
              <div className="space-y-1 rounded border border-brass/60 bg-brass/10 p-1.5">
                <div>
                  {kontor
                    ? t.confirm(pl.kontor.wood, pl.kontor.stone, p.taler(pl.cost), after)
                    : `${t.planStore} ${t.done(after)}`}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="h-7 flex-1"
                    disabled={kontor && pl.cost > p.cash}
                    onClick={() => {
                      setConfirm(null);
                      p.onClose(bau, pl.cost);
                    }}
                  >
                    {t.confirmYes}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 flex-1"
                    onClick={() => setConfirm(null)}
                  >
                    {t.confirmNo}
                  </Button>
                </div>
                {kontor && pl.cost > p.cash ? (
                  <div className="text-muted-foreground">{t.errors.money}</div>
                ) : null}
              </div>
            ) : (
              <Button size="sm" className="h-7 w-full" onClick={() => setConfirm(bau)}>
                {t.close(kontor ? p.taler(pl.cost) : null)}
              </Button>
            ))}
        </div>
      );
    }
    // no open stage: why a new one cannot be opened, or the opening with its price
    if (v.lock === "vorrang" && vor)
      return (
        <div className="mt-1 font-semibold">
          ⏸ {t.lockVorrang(p.stageName(vor.item), p.taler(vor.rest))}
        </div>
      );
    if (v.lock === "pause" && v.lock_from)
      return <div className="mt-1 font-semibold">⏸ {t.lockPause(date(v.lock_from))}</div>;
    if (v.lock === "full" && v.lock_from)
      return (
        <div className="mt-1 font-semibold">⏸ {t.lockFull(restDays(v), date(v.lock_from))}</div>
      );
    if (v.lock === "tax") return <div className="mt-1 text-muted-foreground">🔒 {t.lockTax}</div>;
    return (
      <div className="mt-1 space-y-1">
        <Button
          size="sm"
          className="h-7 w-full"
          disabled={v.lock !== null}
          onClick={() => p.onOpen(bau)}
        >
          {t.open(p.taler(p.stift.price ?? 0))}
        </Button>
        <div className="text-[10px] text-muted-foreground">{t.priceHint}</div>
      </div>
    );
  };

  return (
    <div className="rounded-md border border-brass/60 bg-brass/10 p-2">
      <div className="font-semibold">🕯 {t.title}</div>
      <div className="text-xs text-muted-foreground">{t.intro}</div>
      <ul className="mt-1 space-y-1.5">
        {STIFT_BAUTEN.map((bau) => {
          const v = p.stift[bau];
          if (!v) return null;
          return (
            <li key={bau} className="rounded border border-ink/15 p-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex-1 font-semibold">{t.bau[bau]}</span>
                <span
                  className={v.endowed ? "font-semibold text-primary" : "text-muted-foreground"}
                >
                  {v.endowed && v.until
                    ? `✓ ${t.endowed(restDays(v), date(v.until))}`
                    : t.notEndowed}
                </span>
              </div>
              <div>{t.effect[bau]}</div>
              {state(bau, v)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
