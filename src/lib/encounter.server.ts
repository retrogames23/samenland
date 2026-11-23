import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { economyWorldAt } from "@/game/economy-world";
import type { Realm } from "@/game/time";
import { loadEconomyInput } from "./treasury.server";

export type EncounterRow = {
  id: string;
  seed_id: string;
  event: string;
  choice: string;
  cost: number;
  created_at: string;
};
export type DecideResult =
  { ok: true; row: EncounterRow } | { ok: false; code: "already" | "stale" | "poor" | "fail" };

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
  const input = await loadEconomyInput(realm);
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
  const { data, error } = await supabaseAdmin
    .from("encounters")
    .insert({ seed_id: id, user_id: userId, event, choice })
    .select("id, seed_id, event, choice, cost, created_at")
    .single();
  if (error || !data) {
    const m = error?.message ?? "";
    return {
      ok: false,
      code: m.includes("not enough money")
        ? "poor"
        : m.includes("too soon") ||
            m.includes("already") ||
            m.includes("no wedding") ||
            m.includes("not now")
          ? "already"
          : m.includes("rank too low")
            ? "stale"
            : "fail",
    };
  }
  return { ok: true, row: data as EncounterRow };
}
