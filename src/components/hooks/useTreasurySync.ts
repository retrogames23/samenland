import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { settleTreasury } from "@/lib/treasury.functions";
import { coalescedRefresh } from "@/lib/treasury-refresh";
import { CLIENT_PROTOCOL } from "@/lib/client-protocol";
import { fresh } from "@/lib/fresh-auth";
import type { Seed } from "@/game/world";

export type Accounting = Awaited<ReturnType<typeof settleTreasury>>;

/** Keeps the own village's chest in step with the trusted server: books open tax days in bounded batches, refreshes every minute and after authoritative row changes. */
export function useTreasurySync(my: Seed | undefined, userId: string | null | undefined, deps: unknown[]) {
  const treasuryFn = fresh(useServerFn(settleTreasury));
  const [accounting, setAccounting] = useState<Accounting | null>(null);
  const seedRef = useRef<string | null>(null);
  seedRef.current = my?.id ?? null;
  const argsRef = useRef({ my, userId });
  argsRef.current = { my, userId };
  // one server call per refresh; a backlog beyond the server batch is booked by later refreshes
  const runRef = useRef<(() => Promise<Accounting | null>) | null>(null);
  runRef.current ??= coalescedRefresh(async () => {
    const { my, userId } = argsRef.current;
    if (!my || !userId || my.user_id !== userId) return null;
    const id = my.id;
    try {
      const result = await treasuryFn({ data: { seed: id, client: CLIENT_PROTOCOL } });
      if (seedRef.current === id) setAccounting(result);
      return result;
    } catch {
      return null;
    }
  });
  const refreshAccounting = () => runRef.current!();
  const refreshTreasury = async () => (await refreshAccounting())?.settled ?? false;
  useEffect(() => {
    if (!my || !userId || my.user_id !== userId) { setAccounting(null); return; }
    void refreshTreasury();
    const timer = setInterval(() => { void refreshTreasury(); }, 60000);
    return () => clearInterval(timer);
    // Refresh from authoritative rows, never from pointer/camera changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [my, userId, ...deps]);
  return { accounting, setAccounting, refreshAccounting, refreshTreasury };
}
