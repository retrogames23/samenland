import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Scheduled every 15 min: writes a parchment letter to opted-in mayors whose bought building just finished.
// Completion is derived from purchase time + specialBuild(seed), exactly as the game computes it; nothing is stored.
const WINDOW = 3 * 3600000;

export const Route = createFileRoute("/api/public/build-mail")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { specialBuild, specialSites, sawmillUp } = await import("@/game/world");
        const { DICT } = await import("@/game/i18n");
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const now = Date.now();

        const { data: opts } = (await await (supabaseAdmin as unknown as import("@supabase/supabase-js").SupabaseClient).from("build_mail").select("user_id, lang").eq("enabled", true)) as { data: { user_id: string; lang: string }[] | null };
        if (!opts?.length) return Response.json({ sent: 0 });
        const { data: seeds } = await supabaseAdmin.from("seeds").select("*").in("user_id", opts.map((o) => o.user_id)).neq("realm", "lab");
        if (!seeds?.length) return Response.json({ sent: 0 });
        const ids = seeds.map((s) => s.id);
        const [{ data: buys }, { data: chs }] = await Promise.all([
          supabaseAdmin.from("purchases").select("id, seed_id, item, created_at, x, y").in("seed_id", ids),
          supabaseAdmin.from("charters").select("seed_id, path, created_at").in("seed_id", ids),
        ]);

        let sent = 0;
        for (const s0 of seeds) {
          const mine = (buys ?? []).filter((b) => b.seed_id === s0.id);
          if (!mine.length) continue;
          const ch = (chs ?? []).find((c) => c.seed_id === s0.id);
          const s = {
            ...s0,
            bought: mine.map((b) => ({ item: b.item, at: Date.parse(b.created_at), x: b.x, y: b.y })).sort((a, b) => a.at - b.at),
            ...(ch ? { charter: { path: ch.path, at: Date.parse(ch.created_at) } } : {}),
          } as unknown as import("@/game/world").Seed;
          const dur = specialBuild(s, sawmillUp(s, [s], now));
          const placed = new Set([...specialSites(s).values()].map((v) => v.at));
          const lang = (opts.find((o) => o.user_id === s0.user_id)?.lang ?? "de") as keyof typeof DICT;
          for (const b of mine) {
            const done = Date.parse(b.created_at) + dur;
            if (!placed.has(Date.parse(b.created_at)) || done > now || done < now - WINDOW) continue;
            const { data: u } = await supabaseAdmin.auth.admin.getUserById(s0.user_id!);
            const email = u.user?.email;
            if (!email) continue;
            const building = DICT[lang].items[b.item as keyof (typeof DICT)["de"]["items"]]?.[0] ?? b.item;
            try {
              const r = await sendTemplateEmail("building-done", email, {
                templateData: { lang, mayor: s0.owner, town: s0.name, building },
                idempotencyKey: `building-done-${b.id}`,
              });
              if (r.sent) sent++;
            } catch (e) {
              console.error("build-mail", e);
            }
          }
        }
        return Response.json({ sent });
      },
    },
  },
});
