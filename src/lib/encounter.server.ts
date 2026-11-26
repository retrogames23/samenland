import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { economyWorldAt } from "@/game/economy-world";
import type { Realm } from "@/game/time";
import { loadEconomyInput } from "./treasury.server";
import { isSettlementPending } from "./settlement-pending";

export type EncounterRow = {
  id: string;
  seed_id: string;
  event: string;
  choice: string;
  cost: number;
  created_at: string;
};
export type DecideResult = { ok: true; row: EncounterRow } | { ok: false; code: DecideCode };
/** "full": six growth boons are active (M1 Paket 2b) — the growth answer is refused, the others stay open. */
/** "pending" (Paket B): the wedding settlement is not proven complete and the booked chest does not cover the price —
 *  nothing was booked; the client syncs and retries once. Never shown as a lack of money. */
export type DecideCode = "already" | "stale" | "poor" | "full" | "fail" | "pending";

/** Guard messages → result codes, shared by bookEncounter and the Ratsbuch (ratsbuch.server.ts). */
export function guardCode(m: string): DecideCode {
  if (isSettlementPending(m)) return "pending";
  if (m.includes("not enough money")) return "poor";
  if (m.includes("boons full")) return "full";
  if (
    m.includes("too soon") ||
    m.includes("already") ||
    m.includes("no wedding") ||
    m.includes("not now") ||
    m.includes("unknown request")
  )
    return "already";
  if (m.includes("rank too low") || m.includes("ratsbuch only")) return "stale";
  return "fail";
}

/**
 * Books one encounter answer after recomputing the open encounter on the server (M1 Paket 1). The client only
 * names the answer; the draw is verified with the same pure functions it uses, the DB guard keeps prices, gap,
 * money, wedding/history/steg windows and (0138) the rank of town-life questions. Never let the client insert.
 */
export async function bookEncounter(
  id: string,
  realm: string,
  userId: string,
  event: string,
  choice: string,
): Promise<DecideResult> {
  // with relocations: the rank certified below must match the village the player sees
  const input = await loadEconomyInput(realm, { moves: true });
  const { setRealm } = await import("@/game/time");
  setRealm(realm as Realm);
  const now = Date.now(),
    seeds = economyWorldAt(input, now),
    seed = seeds.find((s) => s.id === id);
  if (!seed) throw new Error("Missing village");
  const { verifyEncounterChoice, EVENT_RANK } = await import("@/game/encounter-verify");
  const code = verifyEncounterChoice(seed, seeds, now, event, choice);
  if (code) return { ok: false, code };
  if (EVENT_RANK[event] !== undefined) {
    // town-life questions: the DB guard reads a fresh certificate, exactly like rank-gated purchases
    const { townRank, rankInput } = await import("@/game/rank");
    const { seaWays } = await import("@/game/world");
    const rank = townRank(seed, seeds, now),
      citizens = rankInput(seed, seeds, now).citizens,
      ways = seaWays(seed, now);
    const { error: ce } = await supabaseAdmin
      .from("rank_certificates")
      .upsert(
        { seed_id: id, rank, citizens, ways, certified_at: new Date(now).toISOString() },
        { onConflict: "seed_id" },
      );
    if (ce) throw new Error("Rank certificate failed");
  }
  {
    // Hochzeitspaket + Paket B (O2): every answer, not only the wedding answer, follows the one order — weddings booked
    // and proven complete first (settleBeforeSpend), then the money action. A switch mismatch refuses the answer at any
    // time; from the switch the guard finds a wedding only in version-2 wedding_receipts and judges the price against a
    // proven-complete chest (else 'wedding settlement pending'). A settlement that cannot be completed (quarantine,
    // divergence) is a pending refusal for answers with a price or a wedding, nothing is booked; free answers stay open.
    const { weddingSwitchState, settleBeforeSpend, WeddingSettlementError } = await import("./treasury.server");
    const sw = await weddingSwitchState(realm, now).catch(() => null);
    if (!sw || (sw.mismatch && event === "wedding")) return { ok: false, code: "fail" };
    if (!sw.mismatch && now >= Math.min(sw.ts, sw.db)) {
      const problem = await settleBeforeSpend(seed, now).catch((e: unknown) => e);
      if (problem) {
        // the wedding answer needs its own booked wedding: a quarantine or divergence refuses it (fail-closed, as before);
        // a call that failed (e.g. a parallel settlement) is transient — pending, the client syncs and retries once
        const lasting = problem instanceof WeddingSettlementError && problem.reason !== "booking_failed";
        if (event === "wedding") return { ok: false, code: lasting ? "fail" : "pending" };
        // every other answer: the database judges the price against the booked lower bound (pending when it falls short)
      }
    }
  }
  const { data, error } = await supabaseAdmin
    .from("encounters")
    .insert({ seed_id: id, user_id: userId, event, choice })
    .select("id, seed_id, event, choice, cost, created_at")
    .single();
  if (error || !data) return { ok: false, code: guardCode(error?.message ?? "") };
  return { ok: true, row: data as EncounterRow };
}
