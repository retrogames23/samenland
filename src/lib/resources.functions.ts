import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Certifies the caller's own village location for wood and stone production (Wirtschaft Paket 2). */
export const certifyMySite = createServerFn({ method: "POST" })
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
    const { certifySite } = await import("./resources.server");
    return certifySite(own.id);
  });
