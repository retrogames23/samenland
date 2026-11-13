import { useEffect, useState } from "react";
import { Parchment } from "@/components/hud/Parchment";
import type { Lang } from "@/game/i18n";
import { REWORK } from "@/game/lang/rework";

const KEY = (u: string) => `samenland:rework-2026-11:${u}`;

/** Shown once per account and browser after sign-in. */
export function ReworkNotice({ userId, lang }: { userId: string | null; lang: Lang }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
    if (!userId) return;
    try { if (!localStorage.getItem(KEY(userId))) setOpen(true); } catch { /* private mode */ }
  }, [userId]);
  if (!open || !userId) return null;
  const t = REWORK[lang] ?? REWORK.de;
  const close = () => { try { localStorage.setItem(KEY(userId), "1"); } catch { /* ignore */ } setOpen(false); };
  return (
    <Parchment title={t.title} later={t.ok} onLater={close}>
      <p className="mt-2 text-center font-display text-xl leading-snug text-ink">{t.body}</p>
      <p className="mt-2 text-center text-sm text-muted-foreground">{t.note}</p>
    </Parchment>
  );
}
