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
export type DecideResult = { ok: true; row: EncounterRow } | { ok: false; code: DecideCode };
/** "full": six growth boons are active (M1 Paket 2b) — the growth answer is refused, the others stay open. */
export type DecideCode = "already" | "stale" | "poor" | "full" | "fail";

/** Guard messages → result codes, shared by bookEncounter and the Ratsbuch (ratsbuch.server.ts). */
export function guardCode(m: string): DecideCode {
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
  if (event === "wedding") {
    // Hochzeitspaket: from the switch the guard finds a wedding only in wedding_receipts, so the trusted server
    // books the calendar first (idempotent; moves never enter the calendar, exactly as in the treasury sync).
    const { weddingSwitchSince } = await import("@/game/weddings");
    if (now >= weddingSwitchSince(realm)) {
      const { settleWeddings } = await import("./treasury.server");
      const { moves: _moves, ...plain } = seed;
      const w = await settleWeddings(plain, now);
      if (w.mismatches.length) return { ok: false, code: "fail" };
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
