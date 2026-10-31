import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Scheduled every few hours: warns opted-in mayors whose village chest is nearly full.
// Balance comes from the authoritative DB village_balance; at most one letter per RESEND window.
const RESEND = 3 * 864e5;

export const Route = createFileRoute("/api/public/chest-mail")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { chestCap, CHEST_WARN } = await import("@/game/economy");
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const db = supabaseAdmin as unknown as import("@supabase/supabase-js").SupabaseClient;
        const now = Date.now();

        const { data: opts } = (await db.from("chest_mail").select("user_id, lang, last_sent_at").eq("enabled", true)) as { data: { user_id: string; lang: string; last_sent_at: string | null }[] | null };
        const due = (opts ?? []).filter((o) => !o.last_sent_at || now - Date.parse(o.last_sent_at) > RESEND);
        if (!due.length) return Response.json({ sent: 0 });
        const { data: seeds } = await supabaseAdmin.from("seeds").select("id, user_id, name, owner").in("user_id", due.map((o) => o.user_id)).neq("realm", "lab");
        if (!seeds?.length) return Response.json({ sent: 0 });
        const { data: buys } = await supabaseAdmin.from("purchases").select("seed_id, item, created_at").in("seed_id", seeds.map((s) => s.id)).like("item", "chest%");

        let sent = 0;
        for (const s of seeds) {
          const cap = chestCap(s.id, buys ?? []);
          const { data: bal, error } = await db.rpc("village_balance", { _seed: s.id });
          if (error || typeof bal !== "number" || bal < cap * CHEST_WARN) continue;
          const o = due.find((x) => x.user_id === s.user_id)!;
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(s.user_id!);
          const email = u.user?.email;
          if (!email) continue;
          try {
            const r = await sendTemplateEmail("chest-full", email, {
              templateData: { lang: o.lang, mayor: s.owner, town: s.name, cash: Math.min(bal, cap), cap },
              idempotencyKey: `chest-full-${s.id}-${Math.floor(now / RESEND)}`,
            });
            if (r.sent) sent++;
            await db.from("chest_mail").update({ last_sent_at: new Date(now).toISOString() }).eq("user_id", s.user_id!);
          } catch (e) {
            console.error("chest-mail", e);
          }
        }
        return Response.json({ sent });
      },
    },
  },
});
