import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Daily: after IDLE_DAYS without visiting, the mayor gets one warning letter; GRACE_DAYS later
// (still no visit) village + account are deleted. Any visit (touch_activity) clears the warning.
export const IDLE_DAYS = 90;
export const GRACE_DAYS = 7;
const DAY = 86400000;

type Row = { user_id: string; last_active_at: string; warning_sent_at: string | null; lang: string };

export const Route = createFileRoute("/api/public/idle-sweep")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const db = supabaseAdmin as unknown as import("@supabase/supabase-js").SupabaseClient;
        const now = Date.now();
        const idleBefore = new Date(now - IDLE_DAYS * DAY).toISOString();
        const graceBefore = new Date(now - GRACE_DAYS * DAY).toISOString();
        const { data: admins } = await db.from("user_roles").select("user_id").eq("role", "admin");
        const safe = new Set((admins ?? []).map((a: { user_id: string }) => a.user_id));

        let warned = 0, deleted = 0;
        // 1) delete: warned more than GRACE_DAYS ago and still not back
        const { data: due } = (await db.from("user_activity").select("*").not("warning_sent_at", "is", null).lt("warning_sent_at", graceBefore).limit(100)) as { data: Row[] | null };
        for (const r of due ?? []) {
          if (safe.has(r.user_id) || Date.parse(r.last_active_at) > now - IDLE_DAYS * DAY) continue;
          const { error } = await db.rpc("purge_user_data", { _uid: r.user_id });
          if (error) { console.error("idle purge", error); continue; }
          const { error: e2 } = await supabaseAdmin.auth.admin.deleteUser(r.user_id);
          if (e2) console.error("idle deleteUser", e2); else deleted++;
        }
        // 2) warn: idle for IDLE_DAYS, not yet warned
        const { data: idle } = (await db.from("user_activity").select("*").is("warning_sent_at", null).lt("last_active_at", idleBefore).limit(100)) as { data: Row[] | null };
        for (const r of idle ?? []) {
          if (safe.has(r.user_id)) continue;
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
          const email = u.user?.email;
          const { data: seed } = await db.from("seeds").select("name, owner").eq("user_id", r.user_id).maybeSingle();
          if (email) {
            try {
              await sendTemplateEmail("idle-warning", email, {
                templateData: { lang: r.lang, mayor: seed?.owner ?? "", town: seed?.name ?? "Samenland" },
                idempotencyKey: `idle-warning-${r.user_id}-${r.last_active_at}`,
              });
            } catch (e) { console.error("idle mail", e); continue; }
          }
          await db.from("user_activity").update({ warning_sent_at: new Date(now).toISOString() }).eq("user_id", r.user_id);
          warned++;
        }
        return Response.json({ warned, deleted });
      },
    },
  },
});
