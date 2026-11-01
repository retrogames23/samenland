import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SUPPORT_PRICES, allowedSet, REWARD_KEYS, type SupportPrice } from "@/game/supporter";

type Result = { clientSecret: string } | { error: string };

export const createSupportCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { priceId: string; rewards: string[]; seedId: string; returnUrl: string; environment: "sandbox" | "live" }) => {
    if (!(d.priceId in SUPPORT_PRICES)) throw new Error("Invalid price");
    if (!Array.isArray(d.rewards) || !d.rewards.every((k) => (REWARD_KEYS as string[]).includes(k)) || !allowedSet(d.priceId as SupportPrice, d.rewards)) throw new Error("Reward not available for this amount");
    if (!/^[0-9a-f-]{36}$/.test(d.seedId)) throw new Error("Invalid village");
    if (d.environment !== "sandbox" && d.environment !== "live") throw new Error("Invalid environment");
    if (!/^https?:\/\//.test(d.returnUrl) || d.returnUrl.length > 500) throw new Error("Invalid return url");
    return d;
  })
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    const { data: seed } = await supabase.from("seeds").select("id, user_id").eq("id", data.seedId).maybeSingle();
    if (!seed || seed.user_id !== userId) return { error: "not_yours" };
    const { data: had } = await supabase.from("supporter_rewards").select("id").eq("seed_id", data.seedId).in("reward", data.rewards).eq("environment", data.environment).limit(1);
    if (had?.length) return { error: "taken" };
    const { data: { user } } = await supabase.auth.getUser();
    try {
      const { createStripeClient } = await import("@/lib/stripe.server");
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const price = prices.data[0]; if (!price) return { error: "Price not found" };
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      const product = await stripe.products.retrieve(productId);
      let customer: string | undefined;
      const found = await stripe.customers.search({ query: `metadata['userId']:'${userId}'`, limit: 1 });
      if (found.data.length) customer = found.data[0]!.id;
      else if (user?.email) {
        const ex = await stripe.customers.list({ email: user.email, limit: 1 });
        if (ex.data.length) { customer = ex.data[0]!.id; await stripe.customers.update(customer, { metadata: { ...ex.data[0]!.metadata, userId } }); }
      }
      if (!customer) customer = (await stripe.customers.create({ ...(user?.email && { email: user.email }), metadata: { userId } })).id;
      const meta = { userId, seedId: data.seedId, reward: data.rewards.join(","), managed_payments: "true" };
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer,
        payment_intent_data: { description: product.name, metadata: meta },
        metadata: meta,
        managed_payments: { enabled: true },
      } as Stripe.Checkout.SessionCreateParams);
      return { clientSecret: session.client_secret ?? "" };
    } catch (e) {
      const { getStripeErrorMessage } = await import("@/lib/stripe.server");
      return { error: getStripeErrorMessage(e) };
    }
  });
