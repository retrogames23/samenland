import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Ratsbuch endpoints: only the village's own player reads or answers its book (same owner check as decideEncounter).

/** Ratsbuch (M1 Paket 2b): refills lazily and returns the open requests with the answers that can still take effect. */
export const getRatsbuch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ seed: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: own, error } = await context.supabase
      .from("seeds")
      .select("id")
      .eq("id", data.seed)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !own) throw new Error("Forbidden");
    const { loadRatsbuch } = await import("./ratsbuch.server");
    return loadRatsbuch(own.id);
  });

/** Accept a request: the client names request and answer; price, limit and validity are the database's. */
export const acceptRatsbuchRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        seed: z.string().uuid(),
        request: z.string().uuid(),
        choice: z.string().min(1).max(32),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: own, error } = await context.supabase
      .from("seeds")
      .select("id")
      .eq("id", data.seed)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !own) throw new Error("Forbidden");
    const { acceptRatsbuch } = await import("./ratsbuch.server");
    return acceptRatsbuch(own.id, context.userId, data.request, data.choice);
  });

/** Decline a request: free, frees its place. */
export const declineRatsbuchRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ seed: z.string().uuid(), request: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: own, error } = await context.supabase
      .from("seeds")
      .select("id")
      .eq("id", data.seed)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !own) throw new Error("Forbidden");
    const { declineRatsbuch } = await import("./ratsbuch.server");
    return { ok: await declineRatsbuch(own.id, data.request) };
  });
