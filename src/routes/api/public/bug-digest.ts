import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Daily: collects unsent Kummerkasten reports into one mail to the game maker.
type Row = { id: string; user_id: string; kind: string; body: string; shots: string[]; context: Record<string, unknown>; created_at: string };

export const Route = createFileRoute("/api/public/bug-digest")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const db = supabaseAdmin as unknown as import("@supabase/supabase-js").SupabaseClient;
        const { data } = (await db.from("bug_reports").select("*").is("sent_at", null).order("created_at").limit(200)) as { data: Row[] | null };
        const rows = data ?? [];
        if (!rows.length) return Response.json({ sent: 0 });
        const items = [];
        const emails = new Set<string>();
        for (const r of rows) {
          const { data: seed } = await db.from("seeds").select("name, owner").eq("user_id", r.user_id).maybeSingle();
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
          const email = u?.user?.email ?? "";
          if (email) emails.add(email);
          const shots: string[] = [];
          for (const p of r.shots ?? []) {
            const { data: s } = await db.storage.from("bug-shots").createSignedUrl(p, 7 * 86400);
            if (s?.signedUrl) shots.push(s.signedUrl);
          }
          const c = r.context ?? {};
          items.push({
            kind: r.kind, body: r.body, shots, email,
            at: new Date(r.created_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" }),
            who: seed ? `${seed.owner} (${seed.name})` : r.user_id,
            context: ["realm", "lang", "screen", "url", "ua"].map((k) => c[k]).filter(Boolean).join(" · "),
          });
        }
        const day = new Date().toISOString().slice(0, 10);
        await sendTemplateEmail("bug-digest", "stephan.doerner@posteo.de", {
          templateData: { items },
          // One reporter that day → "Reply" goes straight to them.
          ...(emails.size === 1 ? { replyTo: [...emails][0] } : {}),
          idempotencyKey: `bug-digest-${day}-${rows[rows.length - 1]!.id}`,
        });
        await db.from("bug_reports").update({ sent_at: new Date().toISOString() }).in("id", rows.map((r) => r.id));
        return Response.json({ sent: rows.length });
      },
    },
  },
});
