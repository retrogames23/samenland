import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clock } from "@/game/time";
import { stiftSince, type StiftBau } from "@/game/stiftung";
import { CLIENT_PROTOCOL } from "@/lib/client-protocol";
import type { Seed } from "@/game/world";

/** One Bau in the overview (DB stift_overview, migration 0165). Times are ISO strings. */
export type StiftBauView = {
  built: boolean;
  until: string | null;
  endowed: boolean;
  /** Why no new stage can be opened (in the order stift_open checks); null = may be opened. */
  lock: "bau" | "vorrang" | "open" | "pause" | "full" | "tax" | null;
  lock_from: string | null;
  stage: {
    nr: number;
    price: number;
    paid: number;
    opened_at: string;
    funded_at: string | null;
    deposits: number;
  } | null;
  /** What "Stiften" would take now (only for a fully paid stage). */
  plan: {
    store: { wood: number; stone: number };
    kontor: { wood: number; stone: number };
    short: { wood: number; stone: number };
    cost: number;
    full: boolean;
  } | null;
};
export type StiftOverview = {
  active: boolean;
  from: string;
  now?: string;
  tax?: number | null;
  price?: number;
  vorrang?: { item: string; rest: number } | null;
  quota?: { wood: number; stone: number };
  reserved?: { wood: number; stone: number };
  free?: { wood: number; stone: number };
  stock?: { wood: number; stone: number };
  spital?: StiftBauView;
  waage?: StiftBauView;
};
export type StiftResult<T> = { data: T | null; error: { message?: string } | null };
type PurchaseRow = {
  id: string;
  seed_id: string;
  item: string;
  cost: number;
  created_at: string;
  x: number | null;
  y: number | null;
};
export type StiftDepositResult = {
  bau: StiftBau;
  nr: number;
  paid: number;
  price: number;
  funded: boolean;
  row: PurchaseRow;
};
export type StiftCloseResult = {
  bau: StiftBau;
  nr: number;
  done: string;
  until: string;
  kontor: number;
  rows: PurchaseRow[];
};

// the stift_* functions (migration 0165) are not in the generated types yet: one narrow untyped door
const rpc = (fn: string, args: object) =>
  (supabase.rpc as unknown as (f: string, a: object) => PromiseLike<StiftResult<unknown>>)(
    fn,
    args,
  );
type Res<T> = PromiseLike<StiftResult<T>>;

/**
 * P4 Stiftungen of the own village as the database reports them (stift_overview: read-only, books nothing) and the
 * three player actions. Display only — the database checks every action again. Before the map's switch (stiftSince:
 * the placeholder 2100 everywhere until a date is decided) nothing is asked at all, so no map sends an extra call.
 */
export function useStiftung(
  my: Seed | undefined,
  userId: string | null | undefined,
  deps: unknown[],
) {
  const [stift, setStift] = useState<StiftOverview | null>(null);
  const argsRef = useRef({ my, userId });
  argsRef.current = { my, userId };
  const active = () => {
    const { my, userId } = argsRef.current;
    return !!my && !!userId && my.user_id === userId && clock() >= stiftSince(my.realm ?? "");
  };
  const refreshStiftung = async (): Promise<StiftOverview | null> => {
    const { my } = argsRef.current;
    if (!my || !active()) {
      setStift(null);
      return null;
    }
    const id = my.id;
    const { data, error } = await (rpc("stift_overview", {
      _seed: id,
      _client: CLIENT_PROTOCOL,
    }) as Res<StiftOverview>);
    if (argsRef.current.my?.id !== id) return null;
    const next = error || !data ? null : data;
    setStift(next);
    return next;
  };
  /** Öffnen: free; the database fixes the price (4 × last booked daily tax). */
  const stiftOpen = (bau: StiftBau) =>
    rpc("stift_open", {
      _seed: argsRef.current.my?.id,
      _bau: bau,
      _client: CLIENT_PROTOCOL,
    }) as Res<{ bau: StiftBau; nr: number; price: number }>;
  /** Einzahlen: `n` is the number of this deposit, so a repeated request books once. */
  const stiftDeposit = (bau: StiftBau, n: number, amount: number) =>
    rpc("stift_deposit", {
      _seed: argsRef.current.my?.id,
      _bau: bau,
      _n: n,
      _amount: amount,
      _client: CLIENT_PROTOCOL,
    }) as Res<StiftDepositResult>;
  /** Stiften: `max` is the Kontor amount the player confirmed in the dialog — never more is paid. */
  const stiftClose = (bau: StiftBau, max: number) =>
    rpc("stift_close", {
      _seed: argsRef.current.my?.id,
      _bau: bau,
      _max: max,
      _client: CLIENT_PROTOCOL,
    }) as Res<StiftCloseResult>;
  useEffect(() => {
    void refreshStiftung();
    // refresh from authoritative rows (purchases, resources), never from pointer or camera changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [my?.id, my?.realm, userId, ...deps]);
  return { stift, refreshStiftung, stiftOpen, stiftDeposit, stiftClose };
}
