import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resourcesSince, type ResourceOverview } from "@/game/resources";
import { clock } from "@/game/time";
import type { Seed } from "@/game/world";

/**
 * Wood and stone of the own village, as the database books them (resource_overview: books open production first).
 * Display only — every purchase is checked again by the database. Before a map's cut-over nothing is requested at
 * all, so public maps send no extra call and work unchanged even without migration 0142.
 */
export function useResources(
  my: Seed | undefined,
  userId: string | null | undefined,
  deps: unknown[],
) {
  const [res, setRes] = useState<ResourceOverview | null>(null);
  const argsRef = useRef({ my, userId });
  argsRef.current = { my, userId };
  const refreshResources = async (): Promise<ResourceOverview | null> => {
    const { my, userId } = argsRef.current;
    if (!my || !userId || my.user_id !== userId || clock() < resourcesSince(my.realm ?? "")) {
      setRes(null);
      return null;
    }
    const id = my.id;
    const { data, error } = await supabase.rpc("resource_overview", { _seed: id });
    if (argsRef.current.my?.id !== id) return null;
    const next = error || !data ? null : (data as unknown as ResourceOverview);
    setRes(next);
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
