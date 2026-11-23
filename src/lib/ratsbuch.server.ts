import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { BOON_LIMIT, RATSBUCH_KINDS, RATSBUCH_OPEN } from "@/game/encounters";
import { requestChoices, type RequestChoice, type RequestKind } from "@/game/ratsbuch";
import { guardCode, type DecideCode, type EncounterRow } from "./encounter.server";

/**
 * Ratsbuch backend (M1 Paket 2b). The database is the authority: ratsbuch_refresh creates the day's request lazily and
 * idempotently, encounter_guard books an accepted request (open, own, matching, < 6 boons, money) and closes it in the
 * same statement, ratsbuch_decline closes one for free. This module only calls them and reports the outcome.
 */
export type RatsbuchRequest = {
  id: string;
  day: string;
  kind: RequestKind;
  at: string;
  choices: RequestChoice[];
};
export type RatsbuchBook = {
  requests: RatsbuchRequest[];
  active: number;
  limit: number;
  open: number;
};
export type AcceptResult =
  { ok: true; row: EncounterRow & { request_id: string } } | { ok: false; code: DecideCode };

const isKind = (k: string): k is RequestKind => (RATSBUCH_KINDS as readonly string[]).includes(k);

/** Refill (lazy, idempotent) and read the book: open requests with the answers that can still take effect. */
export async function loadRatsbuch(seedId: string): Promise<RatsbuchBook> {
  const { error: re } = await supabaseAdmin.rpc("ratsbuch_refresh", { _seed: seedId });
  if (re) throw new Error("Ratsbuch refresh failed");
  const [reqs, act] = await Promise.all([
    supabaseAdmin
      .from("ratsbuch_requests")
      .select("id, day, kind, created_at")
      .eq("seed_id", seedId)
      .eq("status", "open")
      .order("day"),
    supabaseAdmin.rpc("active_boons", { _seed: seedId, _at: new Date().toISOString() }),
  ]);
  if (reqs.error || act.error) throw new Error("Ratsbuch read failed");
  const active = act.data ?? 0;
  return {
    requests: (reqs.data ?? [])
      .filter((r) => isKind(r.kind))
      .map((r) => ({
        id: r.id,
        day: r.day,
        kind: r.kind as RequestKind,
        at: r.created_at,
        choices: requestChoices(r.kind as RequestKind, active),
      })),
    active,
    limit: BOON_LIMIT,
    open: RATSBUCH_OPEN,
  };
}

/** Accept an open request with one of its answers; the guard re-checks everything in the booking statement. */
export async function acceptRatsbuch(
  seedId: string,
  userId: string,
  requestId: string,
  choice: string,
): Promise<AcceptResult> {
  const { data: req, error: qe } = await supabaseAdmin
    .from("ratsbuch_requests")
    .select("kind")
    .eq("id", requestId)
    .eq("seed_id", seedId)
    .maybeSingle();
  if (qe) throw new Error("Ratsbuch read failed");
  if (!req || !isKind(req.kind)) return { ok: false, code: "already" };
  const { data, error } = await supabaseAdmin
    .from("encounters")
    .insert({ seed_id: seedId, user_id: userId, event: req.kind, choice, request_id: requestId })
    .select("id, seed_id, event, choice, cost, created_at, request_id")
    .single();
  if (error || !data) return { ok: false, code: guardCode(error?.message ?? "") };
  return { ok: true, row: data as EncounterRow & { request_id: string } };
}

/** Decline an open request (free, frees its place; the next request still comes only the next day). */
export async function declineRatsbuch(seedId: string, requestId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("ratsbuch_decline", {
    _seed: seedId,
    _request: requestId,
  });
  if (error) throw new Error("Ratsbuch decline failed");
  return data === true;
}
