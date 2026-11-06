import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** The caller supplies no population, money, timestamp or simulation inputs. */
export const settleTreasury = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ seed: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: own, error } = await context.supabase.from("seeds").select("id, realm").eq("id", data.seed).eq("user_id", context.userId).maybeSingle();
    if (error || !own) throw new Error("Forbidden");
    const { calculateTreasury } = await import("./treasury.server");
    return calculateTreasury(own.id, own.realm);
  });
/** Certifies the caller's own settlement rank for rank-gated purchases. */
export const certifyMyRank = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ seed: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: own, error } = await context.supabase.from("seeds").select("id, realm").eq("id", data.seed).eq("user_id", context.userId).maybeSingle();
    if (error || !own) throw new Error("Forbidden");
    const { certifyRank } = await import("./treasury.server");
    return certifyRank(own.id, own.realm);
  });
