import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { certifyMySite } from "@/lib/resources.functions";
import { resourcesSince, type ResourceOverview } from "@/game/resources";
import { clock } from "@/game/time";
import { CLIENT_PROTOCOL } from "@/lib/client-protocol";
import type { Seed } from "@/game/world";

/**
 * Wood and stone of the own village, as the database books them (resource_overview: books open production first).
 * Display only — every purchase is checked again by the database. Before a map's cut-over nothing is requested at
 * all, so public maps send no extra call and work unchanged even without migration 0142. A village without a
 * certified location (0143: production waits for it) asks the trusted server once to certify it, then reloads.
 */
export function useResources(
  my: Seed | undefined,
  userId: string | null | undefined,
  deps: unknown[],
) {
  const [res, setRes] = useState<ResourceOverview | null>(null);
  const certifyFn = useServerFn(certifyMySite);
  const asked = useRef<string | null>(null);
  const argsRef = useRef({ my, userId });
  argsRef.current = { my, userId };
  const refreshResources = async (): Promise<ResourceOverview | null> => {
    const { my, userId } = argsRef.current;
    if (!my || !userId || my.user_id !== userId || clock() < resourcesSince(my.realm ?? "")) {
      setRes(null);
      return null;
    }
    const id = my.id;
    // Paket C: the versioned path (migration 0162); the old resource_overview refuses from 7 days before the switch
    const { data, error } = await (supabase.rpc as unknown as (f: string, a: object) => PromiseLike<{ data: unknown; error: unknown }>)("resource_overview_v2", { _seed: id, _client: CLIENT_PROTOCOL });
    if (argsRef.current.my?.id !== id) return null;
    const next = error || !data ? null : (data as unknown as ResourceOverview);
    setRes(next);
    if (next?.active && next.site === null && asked.current !== id) {
      asked.current = id;
      try {
        await certifyFn({ data: { seed: id } });
        return await refreshResources();
      } catch {
        asked.current = null; // try again with the next refresh
        return next;
      }
    }
    return next;
  };
  useEffect(() => {
    void refreshResources();
    if (!my || !userId || my.user_id !== userId || clock() < resourcesSince(my.realm ?? "")) return;
    const timer = setInterval(() => void refreshResources(), 60000);
    return () => clearInterval(timer);
    // refresh from authoritative rows (purchases), never from pointer or camera changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [my?.id, my?.realm, userId, ...deps]);
  return { res, refreshResources };
}
