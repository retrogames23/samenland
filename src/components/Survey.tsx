import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Parchment } from "@/components/hud/Parchment";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/game/i18n";
import { SURVEY, SURVEY_KEYS } from "@/game/lang/survey";

const db = supabase as unknown as SupabaseClient;

/** One-time player survey: the database decides eligibility (5 active days, 72h window, not yet answered).
 *  "Ask me next time" stores nothing, so it reappears on the next visit while the window runs. */
export function Survey({ userId, lang }: { userId: string | null; lang: Lang }) {
  const t = SURVEY[lang];
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(-1); // -1 invite, 0..3 questions, 4 wish, 5 thanks
  const [ans, setAns] = useState<Record<string, number>>({});
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!userId) { setOpen(false); return; }
    const id = setTimeout(() => { db.rpc("survey_open").then(({ data }) => { if (data === true) setOpen(true); }); }, 4000);
    return () => clearTimeout(id);
  }, [userId]);
  if (!open) return null;

  const submit = async (status: "answered" | "never") => {
    setBusy(true); setErr(false);
    const answers = Object.fromEntries(Object.entries(ans).map(([k, v]) => [k, v]));
    const { error } = await db.rpc("survey_submit", { _status: status, _answers: answers, _wish: wish.trim(), _lang: lang });
    setBusy(false);
    if (error) { setErr(true); return; }
    if (status === "never") setOpen(false); else setStep(5);
  };
  const later = () => setOpen(false);
  const n = SURVEY_KEYS.length + 1;

  if (step === -1) return (
    <Parchment title={t.title} later={t.later} onLater={later}>
      <p className="mt-2 text-center font-display text-xl leading-snug">{t.ask}</p>
      <p className="mt-2 text-center text-sm text-muted-foreground">{t.sub}</p>
      <div className="mt-4 flex flex-col items-center gap-2">
        <Button type="button" onClick={() => setStep(0)}>{t.yes}</Button>
        <button type="button" disabled={busy} onClick={() => submit("never")} className="hit relative text-sm text-ink/60 underline underline-offset-4 hover:text-ink">{t.never}</button>
        {err && <p className="text-sm text-destructive">{t.failed}</p>}
      </div>
    </Parchment>
  );

  if (step === 5) return (
    <Parchment title={t.title} later={t.close} onLater={later}>
      <p className="mt-3 text-center font-display text-xl leading-snug">{t.thanks}</p>
    </Parchment>
  );

  const key = SURVEY_KEYS[step];
  const q = t.qs[step];
  return (
    <Parchment title={t.title} later={t.later} onLater={later}>
      <p className="text-center text-xs text-muted-foreground">{t.step(step + 1, n)}</p>
      <div className="mx-auto mt-1 h-1 w-2/3 overflow-hidden rounded-full bg-ink/10"><div className="h-full bg-primary" style={{ width: `${((step + 1) / n) * 100}%` }} /></div>
      {q && key ? (
        <>
          <p className="mt-3 text-center font-display text-xl leading-snug">{q.q}</p>
          <div className="mt-3 grid gap-2">
            {q.a.map((a, i) => (
              <button key={i} type="button" onClick={() => { setAns((s) => ({ ...s, [key]: i })); setStep(step + 1); }}
                className={`rounded-md border px-3 py-2.5 text-start text-sm transition-colors ${ans[key] === i ? "border-primary bg-primary/10" : "border-ink/20 hover:bg-ink/5"}`}>{a}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-center font-display text-xl leading-snug">{t.wish}</p>
          <textarea dir="auto" value={wish} maxLength={2000} rows={5} onChange={(e) => setWish(e.target.value)} placeholder={t.wishHint}
            className="mt-3 w-full rounded-md border border-ink/20 bg-background/60 p-2 text-base md:text-sm" />
          {err && <p className="mt-2 text-center text-sm text-destructive">{t.failed}</p>}
        </>
      )}
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setStep(step - 1)}>{t.back}</Button>
        {!q ? <Button type="button" size="sm" disabled={busy} onClick={() => submit("answered")}>{t.send}</Button>
          : ans[key!] != null && <Button type="button" size="sm" onClick={() => setStep(step + 1)}>{t.next}</Button>}
      </div>
    </Parchment>
  );
}
