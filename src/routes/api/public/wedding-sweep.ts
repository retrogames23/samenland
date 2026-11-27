import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Hochzeitspaket: controlled wedding-receipt sweep (src/lib/wedding-sweep.server.ts). Not scheduled by itself — run
// only on release, one realm and one bounded batch per request:
//   POST {"realm":"europe"}                          dry run, reports what is missing
//   POST {"realm":"europe","apply":true,"after":id}  books the missing receipts of the next batch
// Repeat with `next` until it is null. `halted` or `errors` stop the run for inspection.

export const Route = createFileRoute("/api/public/wedding-sweep")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        let body: { realm?: unknown; apply?: unknown; after?: unknown; limit?: unknown };
        try { body = (await request.json()) as typeof body; } catch { return new Response("Bad request", { status: 400 }); }
        const { REALMS } = await import("@/game/time");
        if (typeof body.realm !== "string" || !(body.realm === "lab" || (REALMS as string[]).includes(body.realm)))
          return new Response("Unknown realm", { status: 400 });
        const { sweepWeddings } = await import("@/lib/wedding-sweep.server");
        const report = await sweepWeddings({
          realm: body.realm,
          apply: body.apply === true,
          after: typeof body.after === "string" ? body.after : null,
          ...(typeof body.limit === "number" ? { limit: body.limit } : {}),
        });
        return Response.json(report, { status: report.halted || report.errors.length ? 409 : 200 });
      },
    },
  },
});
