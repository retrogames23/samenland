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
    // purge is idempotent and the caller is still signed in, so a failed login removal can simply be retried
    let e2: unknown = null;
    for (let i = 0; i < 3; i++) {
      ({ error: e2 } = await supabaseAdmin.auth.admin.deleteUser(uid));
      if (!e2) break;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
    if (e2) { console.error("delete user failed", e2); return { ok: false }; }
    return { ok: true };
  });
