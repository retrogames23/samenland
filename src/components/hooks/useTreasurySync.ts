import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { settleTreasury } from "@/lib/treasury.functions";
import type { Seed } from "@/game/world";

export type Accounting = Awaited<ReturnType<typeof settleTreasury>>;

/** Keeps the own village's chest in step with the trusted server: books open tax days in bounded batches, refreshes every minute and after authoritative row changes. */
export function useTreasurySync(my: Seed | undefined, userId: string | null | undefined, deps: unknown[]) {
  const treasuryFn = useServerFn(settleTreasury);
  const [accounting, setAccounting] = useState<Accounting | null>(null);
  const seedRef = useRef<string | null>(null);
  seedRef.current = my?.id ?? null;
  const refreshTreasury = async () => {
    if (!my || !userId || my.user_id !== userId) return false;
    const id = my.id;
    try {
      let result = await treasuryFn({ data: { seed: id } });
      for (let batch = 0; !result.settled && batch < 7; batch++) result = await treasuryFn({ data: { seed: id } });
      if (seedRef.current === id) setAccounting(result);
      return result.settled;
    } catch {
      return false;
    }
  };
  useEffect(() => {
    if (!my || !userId || my.user_id !== userId) { setAccounting(null); return; }
    void refreshTreasury();
    const timer = setInterval(() => { void refreshTreasury(); }, 60000);
    return () => clearInterval(timer);
    // Refresh from authoritative rows, never from pointer/camera changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [my, userId, ...deps]);
  return { accounting, setAccounting, refreshTreasury };
}
