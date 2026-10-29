import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Deletes the caller's own villages, game data and login account for good. */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const { error: e1 } = await supabaseAdmin.rpc("purge_user_data", { _uid: uid });
    if (e1) { console.error("purge failed", e1); return { ok: false }; }
    const { error: e2 } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (e2) { console.error("delete user failed", e2); return { ok: false }; }
    return { ok: true };
  });
