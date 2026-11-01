import { useCallback, useMemo, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { SUPPORT } from "@/game/lang/support";
import type { Lang } from "@/game/i18n";
import { REWARDS, SUPPORT_PRICES, allowed, type RewardKey, type SupportPrice } from "@/game/supporter";
import { getStripe, getStripeEnvironment, paymentsTestMode } from "@/lib/stripe";
import { createSupportCheckout } from "@/lib/support.functions";
import { SUPPORT_ART } from "@/game/support-art";

export function SupportBox({ lang, seedId, owned, signedIn }: { lang: Lang; seedId: string | null; owned: Set<string>; signedIn: boolean }) {
  const t = SUPPORT[lang];
  const [reward, setReward] = useState<RewardKey | null>(null);
  const [price, setPrice] = useState<SupportPrice | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const r = await createSupportCheckout({ data: { priceId: price!, reward: reward!, seedId: seedId!, returnUrl: `${window.location.origin}/?support=thanks`, environment: getStripeEnvironment() } });
    if ("error" in r) { const m = r.error === "taken" ? t.taken : r.error; setErr(m); throw new Error(m); }
    return r.clientSecret;
  }, [price, reward, seedId, t.taken]);
  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  const prices = (Object.keys(SUPPORT_PRICES) as SupportPrice[]).filter((p) => reward && allowed(p, reward));

  return (
    <div className="space-y-3 text-sm">
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
          {([3, 5] as const).map((tier) => (
            <div key={tier} className="space-y-1">
              <div className="text-xs text-muted-foreground">{tier === 3 ? t.tier3 : t.tier5}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {REWARDS.filter((r) => r.tier === tier).map((r) => {
                  const has = owned.has(r.key), on = reward === r.key;
                  return (
                    <button key={r.key} type="button" disabled={has} onClick={() => setReward(r.key)}
                      className={`flex items-center gap-2 rounded border p-1.5 text-start transition disabled:opacity-45 ${on ? "border-primary bg-primary/15" : "border-border bg-background/40 hover:border-primary/60"}`}>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                        {SUPPORT_ART[r.key] ? <img src={SUPPORT_ART[r.key]} alt="" className="max-h-10 max-w-10 object-contain" loading="lazy" /> : <span className="text-2xl">⚜️</span>}
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
