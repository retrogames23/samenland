import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { redirect } from "@tanstack/react-router";
import { clientOutdated, RELOAD_TARGET } from "./client-protocol";

/** The caller supplies no population, money, timestamp or simulation inputs. */
export const settleTreasury = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ seed: z.string().uuid(), client: z.number().int().optional() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: own, error } = await context.supabase.from("seeds").select("id, realm").eq("id", data.seed).eq("user_id", context.userId).maybeSingle();
    if (error || !own) throw new Error("Forbidden");
    // Paket B: a client from before Paket B is reloaded before the switch can make anything pending (client-protocol.ts)
    if (clientOutdated(data.client, own.realm, Date.now())) throw redirect(RELOAD_TARGET);
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
/** Zimmerleute-Nothilfe: the server recomputes the concrete ruin itself; the client only names which one it means. */
export const callNothilfe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ seed: z.string().uuid(), kind: z.enum(["f", "w"]), at: z.number().int().nonnegative(), client: z.number().int().optional() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: own, error } = await context.supabase.from("seeds").select("id, realm, user_id").eq("id", data.seed).eq("user_id", context.userId).maybeSingle();
    if (error || !own) throw new Error("Forbidden");
    if (clientOutdated(data.client, own.realm, Date.now())) throw redirect(RELOAD_TARGET);
    const { bookNothilfe } = await import("./treasury.server");
    return bookNothilfe(own.id, own.realm, context.userId, data.kind, data.at);
  });
