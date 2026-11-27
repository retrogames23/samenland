import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { redirect } from "@tanstack/react-router";
import { clientOutdated, RELOAD_TARGET } from "./client-protocol";

/** Schulzen-Entscheidung: the server recomputes the open encounter itself; the client only names its answer. */
export const decideEncounter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        seed: z.string().uuid(),
        event: z.string().min(1).max(32),
        choice: z.string().min(1).max(32),
        client: z.number().int().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: own, error } = await context.supabase
      .from("seeds")
      .select("id, realm, user_id")
      .eq("id", data.seed)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !own) throw new Error("Forbidden");
    // Paket B: a client from before Paket B is reloaded before the switch can make anything pending (client-protocol.ts)
    if (clientOutdated(data.client, own.realm, Date.now())) throw redirect(RELOAD_TARGET);
    const { bookEncounter } = await import("./encounter.server");
    return bookEncounter(own.id, own.realm, context.userId, data.event, data.choice);
  });
