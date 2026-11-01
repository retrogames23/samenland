import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { REWARD_KEYS } from "@/game/supporter";

// Grants the chosen cosmetic decoration once a contribution is paid.
// Security: every request must carry a valid Stripe signature.
async function grant(session: any, env: StripeEnv) {
  const m = session.metadata ?? {};
  const keys = String(m.reward ?? "").split(",").filter((k: string) => REWARD_KEYS.includes(k as never)).slice(0, 2);
  if (!m.seedId || !keys.length) { console.error("support webhook: missing metadata", session.id); return; }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const per = Math.round((session.amount_total ?? 0) / keys.length);
  for (const [i, reward] of keys.entries()) {
    // first reward keeps the plain session id; a second one gets a suffix (session id is unique)
    const { error } = await supabaseAdmin.from("supporter_rewards").upsert(
      { seed_id: m.seedId, reward, amount_cents: per, stripe_session_id: i ? `${session.id}:${reward}` : session.id, environment: env },
      { onConflict: "stripe_session_id", ignoreDuplicates: true },
    );
    if (error && error.code !== "23505") throw error;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        try {
          const event = await verifyWebhook(request, rawEnv);
          const s = event.data.object;
          if (event.type === "checkout.session.completed" && s.payment_status !== "unpaid") await grant(s, rawEnv);
          else if (event.type === "checkout.session.async_payment_succeeded") await grant(s, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
