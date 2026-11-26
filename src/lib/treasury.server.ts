import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { economyWorldAt, type EconomyWorld } from "@/game/economy-world";
import { residentTax } from "@/game/resident-tax";
import type { Seed } from "@/game/world";
import { planReceipts, type AnchorAudit, type BookedReceipt, type QuarantineReason, type WeddingClass, type WeddingReceiptRow } from "@/game/wedding-receipts";
import type { Realm } from "@/game/time";
import { weddingSwitchSince, type WeddingAnchor } from "@/game/weddings";

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

/**
 * `moves: true` adds building_moves (Umsetzen). Only rank certification asks for them, so the certified rank
 * counts the same village the player sees; tax assessment never does (receipts stay as booked).
 */
export async function loadEconomyInput(realm: string, opts: { moves?: boolean } = {}): Promise<EconomyWorld> {
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
    chrono("Encounters", () => db.from("encounters").select("*").in("seed_id", ids)),
    chrono("Roads", () => db.from("first_roads").select("id,seed_id,target_id,created_at").in("seed_id", ids)),
    byId("Twin votes", () => db.from("twin_votes").select("id,seed_id,partner_id,pact,created_at").in("seed_id", ids)),
    byId("Twin works", () => db.from("twin_works").select("id,seed_id,partner_id,work,cost,created_at").in("seed_id", ids)),
    byId("Gifts", () => db.from("gifts").select("id,from_seed,to_seed,kind,created_at").in("to_seed", ids)),
  ]);
  const moves = opts.moves ? await chrono("Moves", () => db.from("building_moves").select("id,seed_id,item,x,y,cost,created_at").in("seed_id", ids)) : undefined;
  return { seeds: raw, purchases, blessings, charters, encounters, roads, votes, works, gifts, ...(moves ? { moves } : {}) } as unknown as EconomyWorld;
}

/** Settlement rank judged on the server from real citizens, homes and roads; stored briefly for the purchase guard. */
export async function certifyRank(id: string, realm: string) {
  const input = await loadEconomyInput(realm, { moves: true });
  const { setRealm } = await import("@/game/time");
  const { townRank, rankInput } = await import("@/game/rank");
  setRealm(realm as Realm);
  const now = Date.now(), seeds = economyWorldAt(input, now), seed = seeds.find(s => s.id === id);
  if (!seed) throw new Error("Missing village");
  const { seaWays } = await import("@/game/world");
  const rank = townRank(seed, seeds, now), citizens = rankInput(seed, seeds, now).citizens, ways = seaWays(seed, now);
  const { error } = await supabaseAdmin.from("rank_certificates").upsert({ seed_id: id, rank, citizens, ways, certified_at: new Date(now).toISOString() }, { onConflict: "seed_id" });
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

/** Rows per booking call; far below the Data API cap. Each call is one transaction (wedding_receipts_book). */
const RECEIPT_CHUNK = 500;
/** Paket A2: a village whose booked receipts cannot be continued reliably. Recorded once in wedding_quarantine
 *  (append-only, released only by hand with a note); while it is active nothing is booked for the village. */
export type WeddingQuarantine = {
  reason: QuarantineReason | "verify_failed";
  indices: number[];
  /** detected_at of the stored record (null when not recorded: dry run or the record failed) */
  since: string | null;
  recorded: boolean;
};
export type WeddingSettlement = {
  /** Paket A2 classification of the booked receipts (null: not read because of a switch mismatch or a quarantine) */
  kind: WeddingClass | null;
  /** the last booked unified-rule receipt the calendar continues from (null: no anchor yet) */
  anchor: WeddingAnchor | null;
  /** weddings known after this settlement: booked plus still to book */
  computed: number;
  booked: number;
  /** rows still to book (after the highest booked index) */
  missing: number;
  inserted: number;
  /** every divergent index; non-empty means stop */
  mismatches: number[];
  audit: AnchorAudit;
  quarantine: WeddingQuarantine | null;
  /** TypeScript and database disagree on the switch instant and the earlier one has passed */
  switchMismatch?: true;
  /** stored state re-read and checked after writing */
  verified: boolean;
};
const NO_AUDIT: AnchorAudit = { missing: [], holes: [], changed: [], unexpected: [], unanchored: [], chain: [] };

const switchCache = new Map<string, { at: number; value: number }>();
/** Tests only: forget the cached database switch dates. */
export const resetWeddingSwitchCache = () => switchCache.clear();
/** DB wedding_switch_since(realm), cached for a minute per worker. Any error other than "function not there" fails. */
async function dbWeddingSwitch(realm: string): Promise<number> {
  const hit = switchCache.get(realm), now = Date.now();
  if (hit && now - hit.at < 60_000) return hit.value;
  const { data, error } = await supabaseAdmin.rpc("wedding_switch_since" as never, { _realm: realm } as never);
  // Before migration 0159 the database computes every wedding with the legacy rule: a switch at infinity.
  // Only PostgREST's "function not found" counts as that (PGRST202); every other error fails closed.
  const missingFn = !!error && ((error as { code?: string }).code === "PGRST202" || /Could not find the function/i.test(error.message ?? ""));
  if (error && !missingFn) throw new WeddingSettlementError("switch_unavailable", "Wedding switch unavailable");
  if (!missingFn && data == null) throw new WeddingSettlementError("switch_unavailable", "Wedding switch unavailable");
  const value = missingFn ? Infinity : Date.parse(data as unknown as string);
  if (Number.isNaN(value)) throw new WeddingSettlementError("switch_unavailable", "Wedding switch unavailable");
  switchCache.set(realm, { at: now, value });
  return value;
}

/**
 * The one switch check every path uses (treasury sync, wedding answer, settlement, sweep).
 * `mismatch`: TypeScript and database name different switch instants AND the earlier of the two has been reached —
 * from then on a wedding exists that one side computes with the new rule and the other with the old one. Before
 * that instant every wedding that can exist is older than both dates, both sides compute it with the legacy rule,
 * so nothing can be booked wrongly (this is also the state between publishing code and applying the migration).
 */
export type WeddingSwitchState = { ts: number; db: number; mismatch: boolean };
export async function weddingSwitchState(realm: string, now: number): Promise<WeddingSwitchState> {
  const ts = weddingSwitchSince(realm), db = await dbWeddingSwitch(realm);
  return { ts, db, mismatch: ts !== db && Math.min(ts, db) <= now };
}

/** receipt_divergence: found now and not recorded (dry run); quarantined: recorded in wedding_quarantine;
 *  booking_failed: the booking call failed for another reason (nothing half-written: each call is one transaction). */
export type WeddingProblem = "switch_mismatch" | "switch_unavailable" | "receipt_divergence" | "quarantined" | "booking_failed";
export class WeddingSettlementError extends Error {
  constructor(readonly reason: WeddingProblem, message: string, readonly indices: number[] = []) {
    super(message);
    this.name = "WeddingSettlementError";
  }
}
/** The one verdict on a settlement, shared by every caller: null = in order, otherwise the reason to stop. */
export function weddingSettlementProblem(s: WeddingSettlement): WeddingSettlementError | null {
  if (s.switchMismatch) return new WeddingSettlementError("switch_mismatch", "Wedding switch differs between server and database");
  if (s.quarantine?.recorded) return new WeddingSettlementError("quarantined", "Wedding settlement quarantined", s.quarantine.indices);
  if (s.quarantine || s.mismatches.length) return new WeddingSettlementError("receipt_divergence", "Wedding receipts disagree with the calendar", s.mismatches);
  return null;
}
/** Fails closed for callers that must not continue (treasury sync before any write, wedding answer). */
export async function assertWeddingSwitch(realm: string, now: number) {
  const st = await weddingSwitchState(realm, now);
  if (st.mismatch) throw new WeddingSettlementError("switch_mismatch", "Wedding switch differs between server and database");
  return st;
}

/** Every stored receipt of a village with all compared fields and its anchor (index order, paged). */
export async function bookedReceipts(seedId: string): Promise<BookedReceipt[]> {
  return fetchPaged<BookedReceipt>("Wedding receipts", (c) => {
    let q = supabaseAdmin.from("wedding_receipts").select("wedding_index, occurred_at, dowry, is_grand, is_town, version, next_at").eq("seed_id", seedId);
    if (c) q = q.gt("wedding_index", c.wedding_index);
    return q.order("wedding_index").limit(PAGE);
  });
}
// wedding_quarantine and the two functions of migration 0160 are not in the generated client types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untyped = supabaseAdmin as any;
/** The active quarantine of a village (released_at IS NULL), or null. A read error fails closed. */
export async function activeQuarantine(seedId: string): Promise<WeddingQuarantine | null> {
  const { data, error } = await untyped.from("wedding_quarantine").select("reason, indices, detected_at").eq("seed_id", seedId).is("released_at", null).maybeSingle();
  if (error) throw new WeddingSettlementError("booking_failed", "Wedding quarantine unavailable");
  return data ? { reason: data.reason, indices: data.indices ?? [], since: data.detected_at ?? null, recorded: true } : null;
}
/** Records the quarantine (idempotent in the database: an active record is kept as it is). */
async function recordQuarantine(seedId: string, reason: WeddingQuarantine["reason"], indices: number[], audit: AnchorAudit): Promise<WeddingQuarantine> {
  const details = { holes: audit.holes, changed: audit.changed, unexpected: audit.unexpected, unanchored: audit.unanchored, chain: audit.chain };
  const { error } = await untyped.rpc("wedding_quarantine_set", { _seed: seedId, _reason: reason, _indices: indices, _details: details });
  if (error) { console.error("Wedding quarantine not recorded", seedId, reason, error.message); return { reason, indices, since: null, recorded: false }; }
  return (await activeQuarantine(seedId)) ?? { reason, indices, since: null, recorded: false };
}
type BookOutcome = { ok: true; inserted: number } | "conflict" | "quarantined";
/** One atomic booking call: receipt rows and their anchors (next_at) together or not at all. */
async function bookRows(seedId: string, rows: WeddingReceiptRow[]): Promise<BookOutcome> {
  const body = rows.map(({ seed_id: _s, ...r }) => r);
  const { data, error } = await untyped.rpc("wedding_receipts_book", { _seed: seedId, _rows: body });
  if (!error) return { ok: true, inserted: Number(data?.inserted ?? 0) };
  const m: string = error.message ?? "";
  if (m.includes("quarantined")) return "quarantined";
  // a concurrent settlement booked first: its rows differ or the chain moved on — re-read, never overwrite
  if (m.includes("wedding receipt conflict") || m.includes("anchor chain") || m.includes("index gap") || m.includes("duplicate key")) return "conflict";
  throw new WeddingSettlementError("booking_failed", "Wedding settlement failed");
}
/**
 * Paket A2 (Anker-Fortsetzung): books the village's weddings into wedding_receipts.
 *  - switch mismatch (weddingSwitchState): nothing is read or written.
 *  - an active quarantine: nothing is read or written; every caller stops (weddingSettlementProblem).
 *  - every booked receipt is read and checked (planReceipts): the stable legacy part field by field, the unified part
 *    as a chain (next_at of each receipt = instant of the next). A receipt that does not fit is never repaired:
 *    the village is quarantined (recorded only when applying) and nothing is written.
 *  - what is still to book continues from the anchor (the last booked unified-rule receipt) — or, before the first
 *    one, from the reference calendar. Booked weddings are never recomputed, so later purchases cannot move them.
 *  - booking goes through wedding_receipts_book: one transaction per call, per-village lock, identical repeats are
 *    no-ops, a differing row is refused. On a conflict (a parallel settlement was first) the receipts are re-read and
 *    planned again once; the winner's rows are kept as booked.
 *  - afterwards the stored state is read again and checked.
 * `apply: false` only reports (dry run).
 */
export async function settleWeddings(seed: Seed, now: number, opts: { apply?: boolean } = {}): Promise<WeddingSettlement> {
  const apply = opts.apply ?? true;
  const empty = { kind: null, anchor: null, computed: 0, booked: 0, missing: 0, inserted: 0, audit: NO_AUDIT, verified: false } as const;
  const sw = await weddingSwitchState(seed.realm ?? "", now);
  if (sw.mismatch) return { ...empty, mismatches: [], quarantine: null, switchMismatch: true };
  const held = await activeQuarantine(seed.id);
  if (held) return { ...empty, mismatches: held.indices, quarantine: held };
  // dates differ but neither has been reached: every row is older than both (filter kept as a second fence)
  const fence = Math.min(sw.ts, sw.db);
  const fenced = (rows: WeddingReceiptRow[]) => rows.filter((r) => sw.ts === sw.db || Date.parse(r.occurred_at) < fence);
  const before = await bookedReceipts(seed.id);
  let plan = planReceipts(seed, before, now);
  const report = (booked: number, p: typeof plan, extra: Partial<WeddingSettlement> = {}): WeddingSettlement => {
    const rows = fenced(p.rows);
    return { kind: p.kind, anchor: p.anchor, computed: booked + rows.length, booked, missing: rows.length, inserted: 0, mismatches: p.quarantine?.indices ?? [],
      audit: { ...p.audit, missing: rows }, quarantine: null, verified: false, ...extra };
  };
  const quarantine = async (booked: number, p: typeof plan, reason?: WeddingQuarantine["reason"]) => {
    const r = reason ?? p.quarantine!.reason, idx = p.quarantine!.indices;
    const q = apply ? await recordQuarantine(seed.id, r, idx, p.audit) : { reason: r, indices: idx, since: null, recorded: false };
    return report(booked, p, { quarantine: q });
  };
  if (plan.quarantine) return quarantine(before.length, plan);
  let rows = fenced(plan.rows);
  if (!apply || !rows.length) return report(before.length, plan);
  const planned = rows.length, kind = plan.kind;
  let inserted = 0;
  for (let attempt = 0; ; attempt++) {
    let outcome: BookOutcome = { ok: true, inserted: 0 };
    for (let i = 0; i < rows.length && typeof outcome === "object"; i += RECEIPT_CHUNK) {
      outcome = await bookRows(seed.id, rows.slice(i, i + RECEIPT_CHUNK));
      if (typeof outcome === "object") inserted += outcome.inserted; // rows this settlement stored (a parallel one may store others)
    }
    if (typeof outcome === "object") break;
    if (outcome === "quarantined") { const q = await activeQuarantine(seed.id); return report(before.length, plan, { quarantine: q ?? { reason: "verify_failed", indices: [], since: null, recorded: false } }); }
    if (attempt >= 1) throw new WeddingSettlementError("booking_failed", "Wedding settlement conflict");
    const now2 = await bookedReceipts(seed.id);
    plan = planReceipts(seed, now2, now);
    if (plan.quarantine) return quarantine(now2.length, plan);
    rows = fenced(plan.rows);
    if (!rows.length) break;
  }
  const after = await bookedReceipts(seed.id);
  const check = planReceipts(seed, after, now);
  if (check.quarantine) return { ...(await quarantine(after.length, check, "verify_failed")), kind, inserted, verified: true };
  // `kind` is the classification found before booking, `anchor` the one after it; `missing` what this settlement found
  // to book (what is left afterwards is in audit.missing); `inserted` what its own booking calls stored
  return { ...report(after.length, check), kind, missing: planned, inserted, verified: true };
}

export async function calculateTreasury(id: string, realm: string) {
  const now = Date.now();
  // Hochzeitspaket: fail closed before any read or write when server and database disagree on the wedding switch.
  await assertWeddingSwitch(realm, now);
  const cut = await supabaseAdmin.from("tax_cutover").select("at").eq("singleton", true).maybeSingle();
  if (cut.error) throw new Error("Treasury read failed");
  if (!cut.data) {
    const { data:balance, error } = await supabaseAdmin.rpc("village_balance", {_seed:id});
    if (error || balance==null) throw new Error("Balance unavailable");
    return { seed:id, balance, daily:0, population:0, earned:0, active:false, settled:true };
  }
  // Gemeindebauten (P2, 0147): book the lazy material pull first, so a completion marker (spital1) that is already
  // due exists before taxed days after it are assessed. Only where resources run; best effort — a failure only delays it.
  const { resourcesSince } = await import("@/game/resources");
  if (now >= resourcesSince(realm)) await supabaseAdmin.rpc("resource_refresh" as never, { _seed: id } as never).then(() => undefined, () => undefined);
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
  // Wedding receipts before the balance read: from the switch (weddingSwitchSince) they carry the dowries.
  // Fail closed: a switch mismatch or a divergent receipt stops the sync with an error instead of returning a
  // balance computed under an unknown rule state (weddingSettlementProblem, shared with the wedding answer and sweep).
  if (current) {
    const problem = weddingSettlementProblem(await settleWeddings(current, now));
    if (problem) { console.error("Wedding settlement stopped", id, problem.reason, problem.indices); throw problem; }
  }
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
/** Books one Zimmerleute-Nothilfe after recomputing the event on the server; the DB guard checks price, rank, money and once-only. */
export async function bookNothilfe(id: string, realm: string, userId: string, kind: "f" | "w", at: number) {
  const input = await loadEconomyInput(realm, { moves: true });
  const { setRealm } = await import("@/game/time");
  const { townRank, rankInput } = await import("@/game/rank");
  const { activeRuins } = await import("@/game/disasters");
  const { nothilfeItem } = await import("@/game/nothilfe");
  setRealm(realm as Realm);
  const now = Date.now(), seeds = economyWorldAt(input, now), seed = seeds.find(s => s.id === id);
  if (!seed) throw new Error("Missing village");
  const item = nothilfeItem(kind, at);
  if ((seed.bought ?? []).some(b => b.item === item)) return { ok: false as const, code: "already" };
  const ruin = activeRuins(seed, now).find(r => r.kind === kind && Math.floor(r.at) === at);
  if (!ruin) return { ok: false as const, code: "noRuin" };
  const { seaWays } = await import("@/game/world");
  const rank = townRank(seed, seeds, now), citizens = rankInput(seed, seeds, now).citizens, ways = seaWays(seed, now);
  const { error: ce } = await supabaseAdmin.from("rank_certificates").upsert({ seed_id: id, rank, citizens, ways, certified_at: new Date(now).toISOString() }, { onConflict: "seed_id" });
  if (ce) throw new Error("Rank certificate failed");
  const { data, error } = await supabaseAdmin.from("purchases").insert({ seed_id: id, user_id: userId, item, x: null, y: null }).select("id, seed_id, item, cost, created_at, x, y").single();
  if (error || !data) {
    const m = error?.message ?? "";
    return { ok: false as const, code: m.includes("not enough money") ? "poor" : m.includes("rank too low") ? "rank" : m.includes("already") || m.includes("duplicate") ? "already" : "fail" };
  }
  return { ok: true as const, row: data, left: ruin.left / 2 };
}
