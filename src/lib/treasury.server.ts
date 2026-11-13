import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { economyWorldAt, type EconomyWorld } from "@/game/economy-world";
import { residentTax } from "@/game/resident-tax";
import type { Seed } from "@/game/world";
import type { Realm } from "@/game/time";

const DAY = 86400000;
/** Days simulated per request; kept small so a full map stays inside the worker CPU budget. */
const BATCH = 7;
/** One bounded batch per request; old earnings remain handled by the legacy database function. */
/** Every simulation input of one realm, read with service rights; the caller supplies nothing. */
/** Rows per request; at or below the Data API cap, so a full page always means "ask again". */
export const PAGE = 1000;
type Page<T> = PromiseLike<{ data: T[] | null; error: { message?: string } | null }>;
/**
 * Keyset pagination: `page(after)` returns the rows strictly after the last row read (null = first page),
 * in a unique total order. Rows inserted meanwhile never shift pages already read. A short (or empty)
 * page ends the read; a page error or `data === null` aborts it — a partial result is never returned.
 */
export async function fetchPaged<T>(label: string, page: (after: T | null) => Page<T>, size = PAGE): Promise<T[]> {
  const out: T[] = [];
  for (let after: T | null = null; ;) {
    const { data, error } = await page(after);
    if (error) throw new Error(`${label} unavailable (after ${out.length} rows): ${error.message ?? "error"}`);
    if (data == null) throw new Error(`${label} unavailable (after ${out.length} rows): no data`);
    out.push(...data);
    if (data.length < size) return out;
    after = data[data.length - 1]!;
  }
}
type Chrono = { created_at: string; id: string };
/** Cursor filter for order (created_at, id); values quoted for PostgREST. */
export const afterChrono = (c: Chrono) => `created_at.gt."${c.created_at}",and(created_at.eq."${c.created_at}",id.gt."${c.id}")`;

export async function loadEconomyInput(realm: string): Promise<EconomyWorld> {
  const db = supabaseAdmin;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Q = any;
  const chrono = (label: string, base: () => Q) => fetchPaged<Chrono>(label, (c) => { let q = base(); if (c) q = q.or(afterChrono(c)); return q.order("created_at").order("id").limit(PAGE); });
  const byId = (label: string, base: () => Q) => fetchPaged<{ id: string }>(label, (c) => { let q = base(); if (c) q = q.gt("id", c.id); return q.order("id").limit(PAGE); });
  const raw = await chrono("Seeds", () => db.from("seeds").select("*").eq("realm", realm)) as unknown as Seed[];
  const ids = raw.map(s => s.id);
  const [purchases, blessings, charters, encounters, roads, votes, works, gifts] = await Promise.all([
    chrono("Purchases", () => db.from("purchases").select("id,seed_id,item,created_at,x,y").in("seed_id", ids)),
    byId("Blessings", () => db.from("blessings").select("id,seed_id,created_at").in("seed_id", ids)),
    byId("Charters", () => db.from("charters").select("id,seed_id,path,created_at").in("seed_id", ids)),
    chrono("Encounters", () => db.from("encounters").select("id,seed_id,event,choice,cost,created_at").in("seed_id", ids)),
    chrono("Roads", () => db.from("first_roads").select("id,seed_id,target_id,created_at").in("seed_id", ids)),
    byId("Twin votes", () => db.from("twin_votes").select("id,seed_id,partner_id,pact,created_at").in("seed_id", ids)),
    byId("Twin works", () => db.from("twin_works").select("id,seed_id,partner_id,work,cost,created_at").in("seed_id", ids)),
    byId("Gifts", () => db.from("gifts").select("id,from_seed,to_seed,kind,created_at").in("to_seed", ids)),
  ]);
  return { seeds: raw, purchases, blessings, charters, encounters, roads, votes, works, gifts } as unknown as EconomyWorld;
}

/** Settlement rank judged on the server from real citizens, homes and roads; stored briefly for the purchase guard. */
export async function certifyRank(id: string, realm: string) {
  const input = await loadEconomyInput(realm);
  const { setRealm } = await import("@/game/time");
  const { townRank, rankInput } = await import("@/game/rank");
  setRealm(realm as Realm);
  const now = Date.now(), seeds = economyWorldAt(input, now), seed = seeds.find(s => s.id === id);
  if (!seed) throw new Error("Missing village");
  const rank = townRank(seed, seeds, now), citizens = rankInput(seed, seeds, now).citizens;
  const { error } = await supabaseAdmin.from("rank_certificates").upsert({ seed_id: id, rank, citizens, certified_at: new Date(now).toISOString() }, { onConflict: "seed_id" });
  if (error) throw new Error("Rank certificate failed");
  return { rank };
}

/**
 * Booked tax days from `first` on. Days are booked in ascending order, so normally they form one gap-free
 * run first..max: then only count and max are read. If the run has a hole (count ≠ span), every day is
 * read as before, so no day is ever skipped or booked twice.
 */
export async function bookedDays(id: string, first: number): Promise<{ has(d: number): boolean }> {
  const [top, n] = await Promise.all([
    supabaseAdmin.from("tax_receipts").select("day").eq("seed_id", id).gte("day", first).order("day", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("tax_receipts").select("day", { count: "exact", head: true }).eq("seed_id", id).gte("day", first),
  ]);
  if (top.error || n.error) throw new Error("Treasury read failed");
  const max = top.data?.day ?? first - 1, count = n.count ?? 0;
  if (count === max - first + 1) return { has: (d) => d >= first && d <= max };
  const all = await fetchPaged<{ day: number }>("Tax receipts", (c) => supabaseAdmin.from("tax_receipts").select("day").eq("seed_id", id).gte("day", c ? c.day + 1 : first).order("day").limit(PAGE));
  return new Set(all.map(r => r.day));
}

export async function calculateTreasury(id: string, realm: string) {
  const now = Date.now();
  const cut = await supabaseAdmin.from("tax_cutover").select("at").eq("singleton", true).maybeSingle();
  if (cut.error) throw new Error("Treasury read failed");
  if (!cut.data) {
    const { data:balance, error } = await supabaseAdmin.rpc("village_balance", {_seed:id});
    if (error || balance==null) throw new Error("Balance unavailable");
    return { seed:id, balance, daily:0, population:0, earned:0, active:false, settled:true };
  }
  // one shared read of all simulation inputs (previously duplicated here)
  const input = await loadEconomyInput(realm);
  const target = input.seeds.find(s => s.id === id);
  if (!target) throw new Error("Missing village");
  // Lazy import avoids loading visual art; the realm is fixed for this synchronous calculation.
  const { setRealm } = await import("@/game/time");
  setRealm(realm as Realm);
  const created = Date.parse(target.created_at), days = Math.max(0, Math.floor((now-created)/DAY));
  const first = cut.data ? Math.max(1, Math.ceil((Date.parse(cut.data.at)-created)/DAY)) : days+1;
  const recorded = await bookedDays(id, first);
  const pending: number[] = [];
  for (let d=first; d<=days && pending.length<BATCH; d++) if (!recorded.has(d)) pending.push(d);
  const rows = pending.map(d => {
    const at = created+d*DAY, seeds = economyWorldAt(input, at), seed = seeds.find(s => s.id===id);
    if (!seed) throw new Error("Missing historical village");
    const tax = residentTax(seed, seeds, at);
    return { seed_id:id, day:d, population:tax.population, households:tax.households, income:tax.income, assessed_at:new Date(at).toISOString(), version:1 };
  });
  if (rows.length) {
    const { error } = await supabaseAdmin.from("tax_receipts").upsert(rows, { onConflict:"seed_id,day", ignoreDuplicates:true });
    if (error) throw new Error("Tax settlement failed");
  }
  const currentSeeds = economyWorldAt(input, now), current = currentSeeds.find(s => s.id===id);
  setRealm(realm as Realm);
  const daily = current ? residentTax(current, currentSeeds, now) : null;
  const { data:balance, error:balanceError } = await supabaseAdmin.rpc("village_balance", {_seed:id});
  if (balanceError || balance==null) throw new Error("Balance unavailable");
  const { data:confirmed, error:confirmationError } = await supabaseAdmin.rpc("village_receipt_total", {_seed:id});
  if (confirmationError) throw new Error("Receipt verification failed");
  const completed = Number(confirmed ?? 0);
  const settled = pending.length<BATCH || pending[pending.length-1]===days;
  // every stored receipt from the cutover on (paged by day), so the client never re-assesses a booked day
  const rec = await fetchPaged<{ day: number; income: number }>("Tax receipts", (c) => supabaseAdmin.from("tax_receipts").select("day, income").eq("seed_id", id).gte("day", c ? c.day + 1 : first).order("day").limit(PAGE));
  const receipts: Record<number, number> = {};
  for (const r of rec) receipts[r.day] = r.income;
  return { seed:id, balance, daily:daily?.income ?? 0, population:daily?.population ?? 0, earned:completed, active:!!cut.data, settled, receipts };
}