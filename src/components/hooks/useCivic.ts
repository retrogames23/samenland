import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resourcesSince } from "@/game/resources";
import { clock } from "@/game/time";
import type { CivicRow } from "@/game/civic";
import type { Seed } from "@/game/world";

// civic_stages / civic_quota (migration 0147) are not in the generated types yet: one narrow untyped door
type Q = { eq: (c: string, v: string) => Promise<{ data: unknown; error: unknown }> };
const table = (name: string) =>
  (supabase as unknown as { from: (t: string) => { select: (c: string) => Q } }).from(name);

/**
 * Gemeindebauten of the own village as the database books them (civic_stages, civic_quota). Display only — every
 * open and instalment is checked again by the database. Like useResources: nothing is asked before the map's cut-over.
 * The material pull itself is booked by resource_refresh (resource_overview), so callers refresh resources first.
 */
export function useCivic(my: Seed | undefined, userId: string | null | undefined, deps: unknown[]) {
  const [rows, setRows] = useState<CivicRow[]>([]);
  const [quota, setQuota] = useState<{ wood: number; stone: number } | null>(null);
  const argsRef = useRef({ my, userId });
  argsRef.current = { my, userId };
  const refreshCivic = async () => {
    const { my, userId } = argsRef.current;
    if (!my || !userId || my.user_id !== userId || clock() < resourcesSince(my.realm ?? "")) {
      setRows([]);
      setQuota(null);
      return;
    }
    const id = my.id;
    const [st, q] = await Promise.all([
      table("civic_stages").select("*").eq("seed_id", id),
      table("civic_quota").select("wood, stone").eq("seed_id", id),
    ]);
    if (argsRef.current.my?.id !== id) return;
    setRows(st.error || !Array.isArray(st.data) ? [] : (st.data as CivicRow[]));
    const qa =
      q.error || !Array.isArray(q.data)
        ? null
        : ((q.data[0] as { wood: number; stone: number } | undefined) ?? null);
    setQuota(qa);
  };
  useEffect(() => {
    void refreshCivic();
    // refresh from authoritative rows (purchases, resources), never from pointer or camera changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [my?.id, my?.realm, userId, ...deps]);
  return { civic: rows, quota, refreshCivic };
}
