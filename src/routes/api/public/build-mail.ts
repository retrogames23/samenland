import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Scheduled every 15 min: writes a parchment letter to opted-in mayors whose bought building just finished.
// Completion is derived from purchase time + specialBuild(seed) in builders' work hours (specialDone), exactly as the game computes it. Once-only delivery: DB outbox build_mail_outbox (src/lib/build-mail-outbox.ts).

export const Route = createFileRoute("/api/public/build-mail")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { specialSites, monumentOf } = await import("@/game/world");
        const { buildMailDue, enqueueWindow } = await import("@/game/build-mail");
        const { setRealm } = await import("@/game/time");
        const { DICT } = await import("@/game/i18n");
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const now = Date.now();
        const WINDOW = enqueueWindow(now); // catch-up after outages; outbox key dedupes

        const { data: opts } = (await await (supabaseAdmin as unknown as import("@supabase/supabase-js").SupabaseClient).from("build_mail").select("user_id, lang").eq("enabled", true)) as { data: { user_id: string; lang: string }[] | null };
        if (!opts?.length) return Response.json({ sent: 0 });
        const { data: seeds } = await supabaseAdmin.from("seeds").select("*").in("user_id", opts.map((o) => o.user_id)).neq("realm", "lab");
        if (!seeds?.length) return Response.json({ sent: 0 });
        const ids = seeds.map((s) => s.id);
        const [{ data: buys }, { data: chs }] = await Promise.all([
          supabaseAdmin.from("purchases").select("id, seed_id, item, created_at, x, y").in("seed_id", ids),
          supabaseAdmin.from("charters").select("seed_id, path, created_at").in("seed_id", ids),
        ]);

        const { buildMailDoneAt } = await import("@/game/build-mail");
        const { runOutbox, rpcStore } = await import("@/lib/build-mail-outbox");
        const due: import("@/lib/build-mail-outbox").Due[] = [];
        for (const s0 of seeds) {
          const mine = (buys ?? []).filter((b) => b.seed_id === s0.id);
          if (!mine.length) continue;
          const ch = (chs ?? []).find((c) => c.seed_id === s0.id);
          const s = {
            ...s0,
            bought: mine.map((b) => ({ item: b.item, at: Date.parse(b.created_at), x: b.x, y: b.y })).sort((a, b) => a.at - b.at),
            ...(ch ? { charter: { path: ch.path, at: Date.parse(ch.created_at) } } : {}),
          } as unknown as import("@/game/world").Seed;
          // night rest follows the village's own realm clock
          setRealm((s0.realm ?? "europe") as import("@/game/time").Realm);
          const placed = new Set([...specialSites(s).values()].map((v) => v.at));
          for (const b of mine) {
            if (!buildMailDue(s, b.item, Date.parse(b.created_at), placed, now, WINDOW)) continue;
            due.push({ purchaseId: b.id, seedId: s0.id, userId: s0.user_id!, item: b.item, doneAt: buildMailDoneAt(s, b.item, Date.parse(b.created_at), placed)! });
          }
        }
        const rpc = (fn: string, args: Record<string, unknown>) =>
          (supabaseAdmin as unknown as import("@supabase/supabase-js").SupabaseClient).rpc(fn, args) as unknown as Promise<{ data: unknown; error: { message: string } | null }>;
        const result = await runOutbox(rpcStore(rpc), due, async (row) => {
          const s0 = seeds.find((x) => x.id === row.seed_id);
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
          const email = u.user?.email;
          if (!email || !s0) return false; // nothing deliverable; settle as done so it is not retried forever
          const lang = (opts.find((o) => o.user_id === row.user_id)?.lang ?? "de") as keyof typeof DICT;
          const mk = monumentOf(row.item);
          const building = DICT[lang].items[(mk ? `${mk}1` : row.item) as keyof (typeof DICT)["de"]["items"]]?.[0] ?? row.item;
          const r = await sendTemplateEmail("building-done", email, {
            templateData: { lang, mayor: s0.owner, town: s0.name, building },
            idempotencyKey: `building-done-${row.purchase_id}`, // second, external guard layer
          });
          return r.sent;
        });
        return Response.json(result);
      },
    },
  },
});
