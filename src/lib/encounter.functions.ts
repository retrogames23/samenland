import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Schulzen-Entscheidung: the server recomputes the open encounter itself; the client only names its answer. */
export const decideEncounter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        seed: z.string().uuid(),
        event: z.string().min(1).max(32),
        choice: z.string().min(1).max(32),
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
    const { bookEncounter } = await import("./encounter.server");
    return bookEncounter(own.id, own.realm, context.userId, data.event, data.choice);
  });
