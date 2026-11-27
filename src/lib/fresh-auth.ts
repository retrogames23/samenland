import { supabase } from "@/integrations/supabase/client";
import { withFreshAuth } from "./server-call";

/** A server function that, refused for its token, refreshes the browser session once and calls again (server-call.ts). */
export const fresh = <A extends unknown[], R>(call: (...a: A) => Promise<R>) =>
  withFreshAuth(call, () => supabase.auth.refreshSession());
