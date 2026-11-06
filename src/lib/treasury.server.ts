import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { economyWorldAt, type EconomyWorld } from "@/game/economy-world";
import { residentTax } from "@/game/resident-tax";
import type { Seed } from "@/game/world";
import type { Realm } from "@/game/time";

const DAY = 86400000;
/** One bounded batch per request; old earnings remain handled by the legacy database function. */
/** Every simulation input of one realm, read with service rights; the caller supplies nothing. */
export async function loadEconomyInput(realm: string): Promise<EconomyWorld> {
  const ss = await supabaseAdmin.from("seeds").select("*").eq("realm", realm).order("created_at").order("id");
  if (ss.error) throw new Error("Seeds unavailable");
  const raw = (ss.data ?? []) as Seed[], ids = raw.map(s => s.id);
  const [p, b, c, e, r, v, w, g] = await Promise.all([
    supabaseAdmin.from("purchases").select("seed_id,item,created_at,x,y").in("seed_id", ids).order("created_at"),
    supabaseAdmin.from("blessings").select("seed_id,created_at").in("seed_id", ids),
    supabaseAdmin.from("charters").select("seed_id,path,created_at").in("seed_id", ids),
    supabaseAdmin.from("encounters").select("seed_id,event,choice,cost,created_at").in("seed_id", ids).order("created_at"),
    supabaseAdmin.from("first_roads").select("seed_id,target_id,created_at").in("seed_id", ids).order("created_at"),
    supabaseAdmin.from("twin_votes").select("seed_id,partner_id,pact,created_at").in("seed_id", ids),
    supabaseAdmin.from("twin_works").select("seed_id,partner_id,work,cost,created_at").in("seed_id", ids),
    supabaseAdmin.from("gifts").select("id,from_seed,to_seed,kind,created_at").in("to_seed", ids),
  ]);
  if ([p,b,c,e,r,v,w,g].some(q => q.error)) throw new Error("Simulation inputs unavailable");
  return { seeds: raw, purchases: p.data ?? [], blessings: b.data ?? [], charters: c.data ?? [], encounters: e.data ?? [], roads: r.data ?? [], votes: v.data ?? [], works: w.data ?? [], gifts: g.data ?? [] };
}

/** Settlement rank judged on the server from real citizens, homes and roads; stored briefly for the purchase guard. */
export async function certifyRank(id: string, realm: string) {
  const input = await loadEconomyInput(realm);
  const { setRealm } = await import("@/game/time");
  const { townRank } = await import("@/game/rank");
  setRealm(realm as Realm);
  const now = Date.now(), seeds = economyWorldAt(input, now), seed = seeds.find(s => s.id === id);
  if (!seed) throw new Error("Missing village");
  const rank = townRank(seed, seeds, now);
  const { error } = await supabaseAdmin.from("rank_certificates").upsert({ seed_id: id, rank, certified_at: new Date(now).toISOString() }, { onConflict: "seed_id" });
  if (error) throw new Error("Rank certificate failed");
  return { rank };
}

export async function calculateTreasury(id: string, realm: string) {
  const now = Date.now();
  const [ss, cut, receipts] = await Promise.all([
    supabaseAdmin.from("seeds").select("*").eq("realm", realm).order("created_at").order("id"),
    supabaseAdmin.from("tax_cutover").select("at").eq("singleton", true).maybeSingle(),
    supabaseAdmin.from("tax_receipts").select("day, income").eq("seed_id", id).order("day"),
  ]);
  if (ss.error || cut.error || receipts.error) throw new Error("Treasury read failed");
  if (!cut.data) {
    const { data:balance, error } = await supabaseAdmin.rpc("village_balance", {_seed:id});
    if (error || balance==null) throw new Error("Balance unavailable");
    return { seed:id, balance, daily:0, population:0, earned:0, active:false, settled:true };
  }
  const raw = (ss.data ?? []) as Seed[], target = raw.find(s => s.id === id);
  if (!target) throw new Error("Missing village");
  const ids = raw.map(s => s.id);
  const [p, b, c, e, r, v, w, g] = await Promise.all([
    supabaseAdmin.from("purchases").select("seed_id,item,created_at,x,y").in("seed_id", ids).order("created_at"),
    supabaseAdmin.from("blessings").select("seed_id,created_at").in("seed_id", ids),
    supabaseAdmin.from("charters").select("seed_id,path,created_at").in("seed_id", ids),
    supabaseAdmin.from("encounters").select("seed_id,event,choice,cost,created_at").in("seed_id", ids).order("created_at"),
    supabaseAdmin.from("first_roads").select("seed_id,target_id,created_at").in("seed_id", ids).order("created_at"),
    supabaseAdmin.from("twin_votes").select("seed_id,partner_id,pact,created_at").in("seed_id", ids),
    supabaseAdmin.from("twin_works").select("seed_id,partner_id,work,cost,created_at").in("seed_id", ids),
    supabaseAdmin.from("gifts").select("id,from_seed,to_seed,kind,created_at").in("to_seed", ids),
  ]);
  if ([p,b,c,e,r,v,w,g].some(q => q.error)) throw new Error("Simulation inputs unavailable");
  const input: EconomyWorld = { seeds: raw, purchases: p.data ?? [], blessings: b.data ?? [], charters: c.data ?? [], encounters: e.data ?? [], roads: r.data ?? [], votes: v.data ?? [], works: w.data ?? [], gifts: g.data ?? [] };
  // Lazy import avoids loading visual art; the realm is fixed for this synchronous calculation.
  const { setRealm } = await import("@/game/time");
  setRealm(realm as Realm);
  const created = Date.parse(target.created_at), days = Math.max(0, Math.floor((now-created)/DAY));
  const first = cut.data ? Math.max(1, Math.ceil((Date.parse(cut.data.at)-created)/DAY)) : days+1;
  const recorded = new Set((receipts.data ?? []).map(r => r.day));
  const pending: number[] = [];
  for (let d=first; d<=days && pending.length<14; d++) if (!recorded.has(d)) pending.push(d);
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
  const { data:confirmed, error:confirmationError } = await supabaseAdmin.from("tax_receipts").select("income").eq("seed_id",id);
  if (confirmationError) throw new Error("Receipt verification failed");
  const completed = (confirmed ?? []).reduce((n,r)=>n+r.income,0);
  return { seed:id, balance, daily:daily?.income ?? 0, population:daily?.population ?? 0, earned:completed, active:!!cut.data, settled:pending.length<14 || pending[pending.length-1]===days };
}