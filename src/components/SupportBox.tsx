import dogSit from "@/assets/sprites/support/dog-sit.webp";
import { useCallback, useMemo, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { SUPPORT } from "@/game/lang/support";
import type { Lang } from "@/game/i18n";
import { REWARDS, SUPPORT_PRICES, allowedSet, type RewardKey, type SupportPrice } from "@/game/supporter";
import { getStripe, getStripeEnvironment, paymentsTestMode } from "@/lib/stripe";
import { createSupportCheckout } from "@/lib/support.functions";
import { SUPPORT_ART } from "@/game/support-art";
import { DOG } from "@/game/lang/dog";

export function SupportBox({ lang, seedId, owned, signedIn, hasDog, dogName, onDogName }: { lang: Lang; seedId: string | null; owned: Set<string>; signedIn: boolean; hasDog?: boolean; dogName?: string; onDogName?: (n: string) => Promise<boolean> }) {
  const t = SUPPORT[lang], dt = DOG[lang];
  const [dn, setDn] = useState(dogName ?? ""); const [dnOk, setDnOk] = useState(false);
  const [picked, setPicked] = useState<RewardKey[]>([]);
  const [newDog, setNewDog] = useState("");
  const reward = picked[0] ?? null;
  const [price, setPrice] = useState<SupportPrice | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const r = await createSupportCheckout({ data: { priceId: price!, rewards: picked, seedId: seedId!, returnUrl: `${window.location.origin}/?support=thanks`, environment: getStripeEnvironment(), ...(picked.includes("dog") && newDog.trim() && { dogName: newDog.trim().slice(0, 20) }) } });
    if ("error" in r) { const m = r.error === "taken" ? t.taken : r.error; setErr(m); throw new Error(m); }
    return r.clientSecret;
  }, [price, picked, seedId, t.taken, newDog]);
  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  const prices = (Object.keys(SUPPORT_PRICES) as SupportPrice[]).filter((p) => picked.length > 0 && allowedSet(p, picked));

  return (
    <div className="space-y-3 text-sm">
      {hasDog && onDogName && (
        <form className="flex items-end gap-2 rounded border border-primary/30 p-2" onSubmit={async (e) => { e.preventDefault(); const n = dn.trim().slice(0, 20); if (n) setDnOk(await onDogName(n)); }}>
          <img src={dogSit} alt="" className="h-10 w-10 object-contain" />
          <label className="flex-1 text-xs">{dt.label}
            <input value={dn} maxLength={20} onChange={(e) => { setDn(e.target.value); setDnOk(false); }} placeholder={dt.placeholder} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
          </label>
          <Button size="sm" type="submit">{dnOk ? dt.saved : dt.save}</Button>
        </form>
      )}
      {paymentsTestMode && <p className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-center text-xs">{t.test}</p>}
      <p>{t.intro}</p>
      <p className="rounded border border-border bg-background/50 p-2 text-xs font-semibold">⚖️ {t.cosmetic}</p>
      {!signedIn ? <p className="italic">{t.signIn}</p> : !seedId ? <p className="italic">{t.needVillage}</p> : price && reward ? (
        <div className="space-y-2">
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="overflow-hidden rounded bg-background">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={options}><EmbeddedCheckout /></EmbeddedCheckoutProvider>
          </div>
          <Button size="sm" variant="secondary" className="w-full" onClick={() => { setPrice(null); setErr(null); }}>{t.back}</Button>
        </div>
      ) : (
        <>
          <div className="text-xs font-semibold uppercase tracking-wider">{t.pick}</div>
          <p className="text-xs italic text-muted-foreground">{t.two}</p>
          {([3, 5, 10] as const).map((tier) => (
            <div key={tier} className="space-y-1">
              <div className="text-xs text-muted-foreground">{tier === 3 ? t.tier3 : tier === 5 ? t.tier5 : t.tier10}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {REWARDS.filter((r) => r.tier === tier).map((r) => {
                  const has = owned.has(r.key), on = picked.includes(r.key);
                  return (
                    <button key={r.key} type="button" disabled={has} onClick={() => setPicked((p) => on ? p.filter((k) => k !== r.key) : p.length >= 2 ? [p[1]!, r.key] : [...p, r.key])}
                      className={`flex items-center gap-2 rounded border p-1.5 text-start transition disabled:opacity-45 ${on ? "border-primary bg-primary/15" : "border-border bg-background/40 hover:border-primary/60"}`}>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                        {(SUPPORT_ART[r.key] ?? (r.key === "dog" ? dogSit : null)) ? <img src={SUPPORT_ART[r.key] ?? dogSit} alt="" className="max-h-10 max-w-10 object-contain" loading="lazy" /> : <span className="text-2xl">⚜️</span>}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold leading-tight">{t.names[r.key]}</span>
                        <span className="block text-[10px] leading-tight text-muted-foreground">{has ? t.owned : t.desc[r.key]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {picked.includes("dog") && (
            <label className="block rounded border border-primary/30 p-2 text-xs">{dt.label}
              <input value={newDog} maxLength={20} onChange={(e) => setNewDog(e.target.value)} placeholder={dt.placeholder} className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
            </label>
          )}
          {reward && (
            <>
              <div className="text-xs font-semibold uppercase tracking-wider">{t.amount}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {prices.map((p) => <Button key={p} size="sm" onClick={() => setPrice(p)}>{t.pay(SUPPORT_PRICES[p])}</Button>)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
