// Hochzeitspaket: real settleWeddings, sweep driver, calculateTreasury and bookEncounter against an IN-MEMORY
// wedding_receipts table (mock, not PostgreSQL). The fake emulates the booking call of 0160 (wedding_receipts_book:
// one call all-or-nothing, identical repeat = no-op, differing row = conflict, anchor chain, quarantine refusal) and
// wedding_quarantine. The version trigger of 0159 and the real locking are NOT emulated here — those are tested on real
// PostgreSQL in hochzeitspaket.pg.test.ts and hochzeit-anker.pg.test.ts.
// Covers: Korrektur A (full comparison of the stable legacy part, seven cases — since Paket A2 a divergence quarantines
// the village), Korrektur C (switchMismatch fail-closed in sweep, treasury sync and wedding answer; normal state; error
// mid-sweep and restart), plus idempotency and cursor resume.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Seed } from "@/game/world";
import { weddingReceiptRows, type WeddingReceiptRow } from "@/game/wedding-receipts";

type Row = WeddingReceiptRow;
const PLACEHOLDER = "2100-01-04T00:00:00+00:00";
type Quarantine = { seed_id: string; reason: string; indices: number[]; detected_at: string; released_at: string | null };
const db = {
  rows: [] as Row[], quarantine: [] as Quarantine[], upserts: 0, failAfter: Infinity, writes: [] as Row[], reads: [] as string[],
  encounters: [] as { seed_id: string; event: string; choice: string }[],
  /** what the database's wedding_switch_since answers (null = function missing, "error" = other failure) */
  dbSwitch: PLACEHOLDER as string | null | "error",
  /** what this code's weddingSwitchSince answers (null = the real constant) */
  tsSwitch: null as number | null,
};

class Query implements PromiseLike<{ data: unknown; error: unknown; count?: number | null }> {
  private f: ((r: Row) => boolean)[] = [];
  private desc = false;
  private lim = Infinity;
  private single = false;
  private up: Row[] | null = null;
  constructor(private table: string) {}
  select(_c?: string) { return this; }
  eq(k: keyof Row, v: unknown) { this.f.push((r) => r[k] === v); return this; }
  gt(k: keyof Row, v: number) { this.f.push((r) => (r[k] as number) > v); return this; }
  is(k: string, v: null) { this.f.push((r) => ((r as unknown as Record<string, unknown>)[k] ?? null) === v); return this; }
  order(_k: string, o?: { ascending?: boolean }) { this.desc = o?.ascending === false; return this; }
  limit(n: number) { this.lim = n; return this; }
  maybeSingle() { this.single = true; return this; }
  upsert(rows: Row[], o: { onConflict: string; ignoreDuplicates: boolean }) {
    expect(o).toEqual({ onConflict: "seed_id,wedding_index", ignoreDuplicates: true });
    this.up = rows; return this;
  }
  insert(row: { seed_id: string; event: string; choice: string }) {
    db.encounters.push(row);
    return { select: () => ({ single: async () => ({ data: { id: "e1", ...row, cost: 0, created_at: new Date().toISOString() }, error: null }) }) };
  }
  then<A, B>(ok?: ((v: { data: unknown; error: unknown; count?: number | null }) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve(this.run()).then(ok, bad);
  }
  private run() {
    db.reads.push(this.table);
    if (this.table === "tax_cutover") return { data: null, error: null };
    if (this.table === "wedding_quarantine") {
      const q = db.quarantine.filter((r) => this.f.every((g) => g(r as unknown as Row)));
      return { data: q[0] ?? null, error: null };
    }
    if (this.up) {
      if (++db.upserts > db.failAfter) return { data: null, error: { message: "network down" } };
      const next = [...db.rows]; // one statement = all or nothing, like PostgreSQL
      for (const r of this.up) {
        if (next.some((x) => x.seed_id === r.seed_id && x.wedding_index === r.wedding_index)) continue; // ON CONFLICT DO NOTHING
        if (next.some((x) => x.seed_id === r.seed_id && Date.parse(x.occurred_at) === Date.parse(r.occurred_at)))
          return { data: null, error: { message: "duplicate key value violates unique constraint" } };
        next.push({ ...r });
      }
      db.writes.push(...next.slice(db.rows.length));
      db.rows = next;
      return { data: null, error: null };
    }
    const hit = db.rows.filter((r) => this.f.every((g) => g(r))).sort((a, b) => (this.desc ? b.wedding_index - a.wedding_index : a.wedding_index - b.wedding_index));
    const out = hit.slice(0, this.lim).map(({ seed_id: _s, ...r }) => r);
    return this.single ? { data: out[0] ?? null, error: null } : { data: out, error: null };
  }
}
/** The booking call of migration 0160 as the fake sees it (one call = one transaction). */
function bookCall(seed: string, rows: Omit<Row, "seed_id">[]) {
  if (++db.upserts > db.failAfter) return { data: null, error: { message: "network down" } };
  if (db.quarantine.some((q) => q.seed_id === seed && !q.released_at)) return { data: null, error: { message: "wedding settlement quarantined" } };
  const next = [...db.rows];
  let ins = 0;
  for (const [i, r] of rows.entries()) {
    const p = rows[i - 1];
    if (p && (r.wedding_index !== p.wedding_index + 1 || Date.parse(r.occurred_at) !== Date.parse(p.next_at))) return { data: null, error: { message: "wedding booking rows do not form a chain" } };
    const e = next.find((x) => x.seed_id === seed && x.wedding_index === r.wedding_index);
    if (e) {
      if (JSON.stringify({ ...e, seed_id: seed }) !== JSON.stringify({ seed_id: seed, ...r })) return { data: null, error: { message: `wedding receipt conflict at index ${r.wedding_index}` } };
      continue;
    }
    const prev = next.find((x) => x.seed_id === seed && x.wedding_index === r.wedding_index - 1);
    if (prev ? prev.next_at && Date.parse(prev.next_at) !== Date.parse(r.occurred_at) : r.wedding_index !== 0) return { data: null, error: { message: "wedding receipt breaks the anchor chain" } };
    if (next.some((x) => x.seed_id === seed && Date.parse(x.occurred_at) === Date.parse(r.occurred_at))) return { data: null, error: { message: "duplicate key value violates unique constraint" } };
    next.push({ seed_id: seed, ...r } as Row); ins++;
  }
  db.writes.push(...next.slice(db.rows.length));
  db.rows = next;
  return { data: { inserted: ins }, error: null };
}
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: {
  from: (t: string) => new Query(t),
  rpc: async (fn: string, args: Record<string, unknown>) => {
    db.reads.push(`rpc:${fn}`);
    if (fn === "village_balance") return { data: 123, error: null };
    if (fn === "wedding_receipts_book") return bookCall(args["_seed"] as string, args["_rows"] as Omit<Row, "seed_id">[]);
    if (fn === "wedding_quarantine_set") {
      const seed = args["_seed"] as string;
      if (!db.quarantine.some((q) => q.seed_id === seed && !q.released_at))
        db.quarantine.push({ seed_id: seed, reason: args["_reason"] as string, indices: args["_indices"] as number[], detected_at: new Date().toISOString(), released_at: null });
      return { data: 1, error: null };
    }
    expect(fn).toBe("wedding_switch_since"); expect(typeof args["_realm"]).toBe("string");
    if (db.dbSwitch === "error") return { data: null, error: { code: "57014", message: "canceling statement due to statement timeout" } };
    return db.dbSwitch == null ? { data: null, error: { code: "PGRST202", message: "Could not find the function public.wedding_switch_since(_realm) in the schema cache" } } : { data: db.dbSwitch, error: null };
  },
} }));
vi.mock("@/game/weddings", async (orig) => {
  const m = await orig<typeof import("@/game/weddings")>();
  return { ...m, weddingSwitchSince: (r: string | null | undefined) => db.tsSwitch ?? m.weddingSwitchSince(r) };
});
// bookEncounter: the economy load and the draw check are not under test here
const world = { seeds: [] as Seed[] };
vi.mock("@/game/economy-world", async (orig) => ({ ...(await orig<object>()), economyWorldAt: () => world.seeds }));
vi.mock("@/game/encounter-verify", () => ({ verifyEncounterChoice: () => null, EVENT_RANK: {} }));
vi.mock("./treasury.server", async (orig) => ({ ...(await orig<object>()), loadEconomyInput: async () => ({}) }));

const T = await import("./treasury.server");
const { settleWeddings, resetWeddingSwitchCache, calculateTreasury, weddingSettlementProblem } = T;
const { runSweep } = await import("./wedding-sweep.server");
const { bookEncounter } = await import("./encounter.server");

const D = 864e5, H = 3.6e6, c0 = Date.parse("2026-03-01T00:00:00Z"), NOW = c0 + 260 * D;
const CARE = ["fisher", "hunter", "granary", "herbs", "healer"].map((item) => ({ item, at: c0 + D }));
const villages: Seed[] = Array.from({ length: 12 }, (_, i) => ({
  id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`, user_id: `u${i}`, realm: "europe", x: 0, y: 0,
  created_at: new Date(c0 + i * 7 * D).toISOString(), bought: i % 2 ? CARE : [],
}) as unknown as Seed);
const unowned = { ...villages[0]!, id: "00000000-0000-0000-0000-0000000000ff", user_id: null } as Seed;
const all = [...villages, unowned];
const settle = (s: Seed, apply: boolean) => settleWeddings(s, NOW, { apply });
const expected = () => villages.flatMap((s) => weddingReceiptRows(s, NOW));
const key = (r: Row) => `${r.seed_id}#${r.wedding_index}`;
const sorted = (r: Row[]) => JSON.stringify([...r].sort((a, b) => key(a).localeCompare(key(b))));
const snapshot = () => sorted(db.rows);
const pastSwitch = () => new Date(Date.now() - 2 * D).toISOString();

/** Today's live state: most villages complete, some with 1–2 newest receipts not settled yet. */
function seedLiveState() {
  db.dbSwitch = PLACEHOLDER; db.tsSwitch = null; resetWeddingSwitchCache();
  db.rows = []; db.quarantine = []; db.upserts = 0; db.failAfter = Infinity; db.writes = []; db.reads = []; db.encounters = [];
  villages.forEach((s, i) => {
    const rows = weddingReceiptRows(s, NOW), drop = i % 3; // 0, 1 or 2 newest missing
    db.rows.push(...rows.slice(0, rows.length - drop));
  });
}
beforeEach(seedLiveState);

describe("Korrektur A: settleWeddings compares every booked receipt (no count/index shortcut)", () => {
  const v = villages[0]!; // complete in the live state
  const own = () => db.rows.filter((r) => r.seed_id === v.id);
  const replace = (idx: number, patch: Partial<Row>) => { const i = db.rows.findIndex((r) => r.seed_id === v.id && r.wedding_index === idx); db.rows[i] = { ...db.rows[i]!, ...patch }; };
  const run = async () => { const before = snapshot(); const r = await settleWeddings(v, NOW); return { r, unchanged: snapshot() === before }; };

  it("A1 complete index range, wrong dowry: divergence, nothing written", async () => {
    replace(2, { dowry: own()[2]!.dowry + 1 });
    const { r, unchanged } = await run();
    expect(r.audit.changed).toEqual([{ index: 2, fields: ["dowry"] }]);
    expect(weddingSettlementProblem(r)?.reason).toBe("quarantined");
    expect(r.quarantine).toMatchObject({ reason: "legacy_divergent", indices: [2], recorded: true });
    expect(unchanged).toBe(true);
  });
  it("A2 complete index range, wrong instant: divergence", async () => {
    replace(1, { occurred_at: new Date(Date.parse(own()[1]!.occurred_at) + H).toISOString() });
    const { r, unchanged } = await run();
    expect(r.audit.changed).toEqual([{ index: 1, fields: ["occurred_at"] }]);
    expect(r.mismatches).toEqual([1]);
    expect(unchanged).toBe(true);
  });
  it("A3 complete index range, wrong version: divergence", async () => {
    replace(0, { version: 2 });
    const { r, unchanged } = await run();
    expect(r.audit.changed).toEqual([{ index: 0, fields: ["version"] }]);
    expect(unchanged).toBe(true);
  });
  it("A4 missing middle index: hole = divergence, not filled", async () => {
    db.rows = db.rows.filter((r) => !(r.seed_id === v.id && r.wedding_index === 3));
    const { r, unchanged } = await run();
    expect(r.audit.holes).toEqual([3]);
    expect(r.inserted).toBe(0);
    expect(unchanged).toBe(true);
  });
  it("A5 missing first receipt: hole; missing last ones: settled normally", async () => {
    db.rows = db.rows.filter((r) => !(r.seed_id === v.id && r.wedding_index === 0));
    const first = await run();
    expect(first.r.audit.holes).toEqual([0]);
    expect(first.unchanged).toBe(true);
    seedLiveState();
    const n = own().length;
    db.rows = db.rows.filter((r) => !(r.seed_id === v.id && r.wedding_index >= n - 2));
    const last = await settleWeddings(v, NOW);
    expect(last.mismatches).toEqual([]);
    expect(last.inserted).toBe(2);
    expect(last.verified).toBe(true);
    expect(own().length).toBe(n);
  });
  it("A6 an unexpected receipt beyond the calendar: divergence", async () => {
    const top = own().at(-1)!;
    db.rows.push({ ...top, wedding_index: top.wedding_index + 1, occurred_at: new Date(NOW - 1000).toISOString() });
    const { r, unchanged } = await run();
    expect(r.audit.unexpected).toEqual([top.wedding_index + 1]);
    expect(unchanged).toBe(true);
  });
  it("A7 correct complete set: in order, nothing written, every receipt was read", async () => {
    const { r, unchanged } = await run();
    expect(weddingSettlementProblem(r)).toBeNull();
    expect(r.booked).toBe(own().length);
    expect(r.computed).toBe(own().length);
    expect(r.inserted).toBe(0);
    expect(unchanged).toBe(true);
  });
  it("a concurrent writer that wins a key with other content is caught by the read-back", async () => {
    const n = own().length;
    db.rows = db.rows.filter((r) => !(r.seed_id === v.id && r.wedding_index === n - 1));
    // simulate: between our read and our booking call someone books index n-1 with a wrong dowry. Since Paket A2 the
    // booking call refuses the differing row (conflict); the settlement re-reads, finds the divergence and quarantines.
    const good = weddingReceiptRows(v, NOW).at(-1)!;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as { rpc: (f: string, a: Record<string, unknown>) => Promise<unknown> };
    const rpc = admin.rpc;
    admin.rpc = async (fn, args) => {
      if (fn === "wedding_receipts_book") { db.rows.push({ ...good, dowry: good.dowry + 9 }); admin.rpc = rpc; }
      return rpc(fn, args);
    };
    const r = await settleWeddings(v, NOW);
    expect(db.rows.filter((x) => x.seed_id === v.id && x.wedding_index === n - 1)).toEqual([{ ...good, dowry: good.dowry + 9 }]); // the winner's row stays
    expect(db.writes).toEqual([]); // nothing overwritten, nothing added by this settlement
    expect(r.audit.changed).toEqual([{ index: n - 1, fields: ["dowry"] }]);
    expect(weddingSettlementProblem(r)?.reason).toBe("quarantined");
  });
});

describe("wedding receipt sweep (in-memory)", () => {
  it("dry run reports what is missing and writes nothing", async () => {
    const before = snapshot();
    const r = await runSweep(all, settle, { realm: "europe", limit: 100 }, NOW);
    expect(r.apply).toBe(false);
    expect(r.checked).toBe(12); // the unowned village is never touched
    expect(r.missing).toBe(expected().length - db.rows.length);
    expect(r.inserted).toBe(0);
    expect(snapshot()).toBe(before);
  });
  it("apply adds every missing receipt exactly once and leaves every existing one byte-identical", async () => {
    const before = new Map(db.rows.map((r) => [key(r), JSON.stringify(r)]));
    const r = await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(r.halted).toBeNull();
    expect(r.errors).toEqual([]);
    expect(r.missing).toBeGreaterThanOrEqual(8);
    expect(r.inserted).toBe(r.missing);
    expect(r.complete).toBe(12);
    expect(new Set(db.writes.map(key)).size).toBe(db.writes.length);
    for (const w of db.writes) expect(before.has(key(w))).toBe(false);
    for (const [k, val] of before) expect(JSON.stringify(db.rows.find((x) => key(x) === k))).toBe(val);
    expect(snapshot()).toBe(sorted(expected()));
    expect(r.next).toBeNull();
  });
  it("a repeated sweep books nothing (idempotent)", async () => {
    await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    const done = snapshot(), n = db.upserts;
    const again = await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(again.inserted).toBe(0);
    expect(again.missing).toBe(0);
    expect(db.upserts).toBe(n);
    expect(snapshot()).toBe(done);
  });
  it("interleaved sweeps (Promise.all, single JS thread) cannot double-book", async () => {
    await Promise.all([1, 2, 3].map(() => runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW)));
    expect(snapshot()).toBe(sorted(expected()));
  });
  it("C5 an error mid-run stops with a cursor; resuming (or restarting) ends in exactly the expected state", async () => {
    db.failAfter = 3;
    const first = await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(first.errors).toHaveLength(1);
    expect(first.checked).toBeLessThan(12);
    expect(first.halted).toBeNull();
    db.failAfter = Infinity;
    let r = await runSweep(all, settle, { realm: "europe", apply: true, after: first.next, limit: 4 }, NOW);
    while (r.next) r = await runSweep(all, settle, { realm: "europe", apply: true, after: r.next, limit: 4 }, NOW);
    expect(snapshot()).toBe(sorted(expected()));
    const done = snapshot();
    await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(snapshot()).toBe(done);
  });
  it("batches walk the realm in id order with a resume cursor", async () => {
    const seen: string[] = [];
    let r = await runSweep(all, settle, { realm: "europe", limit: 5 }, NOW);
    seen.push(...r.villages.map((x) => x.seed));
    while (r.next) { r = await runSweep(all, settle, { realm: "europe", after: r.next, limit: 5 }, NOW); seen.push(...r.villages.map((x) => x.seed)); }
    expect(seen).toEqual(villages.map((s) => s.id));
  });
  it("Paket A2: a divergent village is quarantined and listed; nothing is written there, the sweep goes on", async () => {
    const victim = villages[5]!;
    const i = db.rows.findIndex((r) => r.seed_id === victim.id && r.wedding_index === 1);
    db.rows[i] = { ...db.rows[i]!, dowry: db.rows[i]!.dowry + 7 };
    const dry = await runSweep(all, settle, { realm: "europe", after: villages[4]!.id, limit: 100 }, NOW);
    expect(dry.quarantined).toEqual([{ seed: victim.id, reason: "legacy_divergent", indices: [1], recorded: false }]);
    expect(db.quarantine).toEqual([]); // a dry run records nothing
    const r = await runSweep(all, settle, { realm: "europe", apply: true, after: villages[4]!.id, limit: 100 }, NOW);
    expect(r.halted).toBeNull();
    expect(r.quarantined).toEqual([{ seed: victim.id, reason: "legacy_divergent", indices: [1], recorded: true }]);
    expect(db.writes.filter((w) => w.seed_id === victim.id)).toEqual([]);
    expect(r.next).toBeNull();
    // every other village after the cursor is complete
    const want = villages.slice(5).filter((s) => s.id !== victim.id).flatMap((s) => weddingReceiptRows(s, NOW));
    expect(sorted(db.rows.filter((x) => want.some((w) => key(w) === key(x))))).toBe(sorted(want));
    // a later run keeps it in quarantine without reading or writing its receipts
    const again = await runSweep(all, settle, { realm: "europe", apply: true, after: villages[4]!.id, limit: 100 }, NOW);
    expect(again.quarantined).toEqual([{ seed: victim.id, reason: "legacy_divergent", indices: [1], recorded: true }]);
  });
});

describe("Korrektur C: switchMismatch fails closed everywhere (one shared verdict)", () => {
  it("C3 sweep: switchMismatch with no receipt mismatch halts before anything is read or written", async () => {
    db.dbSwitch = new Date(NOW - 10 * D).toISOString(); // the database switched before NOW, this code still says 2100
    const r = await runSweep(all, settle, { realm: "europe", apply: true, limit: 100 }, NOW);
    expect(r.halted).toMatchObject({ seed: villages[0]!.id, reason: "switch_mismatch", mismatches: [], switchMismatch: true });
    expect(r.villages[0]).toMatchObject({ switchMismatch: true, mismatches: [], inserted: 0 });
    expect(db.writes).toEqual([]);
    expect(db.reads.filter((t) => t === "wedding_receipts")).toEqual([]);
  });
  it("C3 also when this code switched first and the database did not (migration missing: function absent)", async () => {
    db.tsSwitch = NOW - 10 * D; db.dbSwitch = null;
    const r = await settleWeddings(villages[1]!, NOW);
    expect(r).toMatchObject({ switchMismatch: true, mismatches: [], inserted: 0 });
    expect(weddingSettlementProblem(r)?.reason).toBe("switch_mismatch");
  });
  it("C2 treasury sync: switchMismatch stops with an error before any read or write", async () => {
    db.dbSwitch = pastSwitch();
    await expect(calculateTreasury(villages[0]!.id, "europe")).rejects.toMatchObject({ name: "WeddingSettlementError", reason: "switch_mismatch" });
    expect(db.reads).toEqual(["rpc:wedding_switch_since"]);
    expect(db.writes).toEqual([]);
  });
  it("C2 treasury sync: the database's switch function failing (not missing) also stops it", async () => {
    db.dbSwitch = "error";
    await expect(calculateTreasury(villages[0]!.id, "europe")).rejects.toMatchObject({ reason: "switch_unavailable" });
  });
  it("C4 treasury sync, normal state: passes the check and continues", async () => {
    const r = await calculateTreasury(villages[0]!.id, "europe"); // tax_cutover not set: balance path
    expect(r).toMatchObject({ seed: villages[0]!.id, balance: 123 });
    expect(db.reads.slice(0, 2)).toEqual(["rpc:wedding_switch_since", "tax_cutover"]);
  });
  it("dates differ but neither has been reached at the settlement instant: no mismatch (all weddings are older than both)", async () => {
    db.dbSwitch = new Date(NOW + 5 * D).toISOString();
    const r = await settleWeddings(villages[4]!, NOW);
    expect(weddingSettlementProblem(r)).toBeNull();
    expect(r.audit.missing).toEqual([]);
  });
  it("C4 before migration 0159 (function missing) and both dates in the future: no mismatch, settlement works", async () => {
    db.dbSwitch = null;
    const r = await settleWeddings(villages[2]!, NOW);
    expect(weddingSettlementProblem(r)).toBeNull();
    expect(r.verified).toBe(true);
  });

  const v = villages[3]!;
  it("C1 wedding answer: switchMismatch with no receipt mismatch refuses the booking", async () => {
    world.seeds = [v];
    db.dbSwitch = pastSwitch();
    expect(await bookEncounter(v.id, "europe", "u3", "wedding", "feast")).toEqual({ ok: false, code: "fail" });
    expect(db.encounters).toEqual([]);
    expect(db.writes).toEqual([]);
  });
  it("C1 wedding answer: other answers are not affected by the wedding switch", async () => {
    world.seeds = [v];
    db.dbSwitch = pastSwitch();
    expect(await bookEncounter(v.id, "europe", "u3", "harvest", "keep")).toMatchObject({ ok: true });
  });
  it("C1 wedding answer after the switch: settles first; a divergent receipt refuses the booking", async () => {
    world.seeds = [v];
    const t = Date.now() - 2 * D; db.tsSwitch = t; db.dbSwitch = new Date(t).toISOString();
    const i = db.rows.findIndex((r) => r.seed_id === v.id && r.wedding_index === 0);
    db.rows[i] = { ...db.rows[i]!, dowry: db.rows[i]!.dowry + 3 };
    expect(await bookEncounter(v.id, "europe", "u3", "wedding", "feast")).toEqual({ ok: false, code: "fail" });
    expect(db.encounters).toEqual([]);
  });
  it("C4 wedding answer, normal state after the switch: receipts settled and verified, answer booked", async () => {
    world.seeds = [v];
    const t = Date.now() - 2 * D; db.tsSwitch = t; db.dbSwitch = new Date(t).toISOString();
    const before = db.rows.filter((r) => r.seed_id === v.id).length;
    expect(await bookEncounter(v.id, "europe", "u3", "wedding", "feast")).toMatchObject({ ok: true });
    expect(db.encounters).toHaveLength(1);
    expect(db.rows.filter((r) => r.seed_id === v.id).length).toBeGreaterThanOrEqual(before);
  });
  it("C4 wedding answer, normal state before the switch: no settlement needed, answer booked", async () => {
    world.seeds = [v];
    expect(await bookEncounter(v.id, "europe", "u3", "wedding", "feast")).toMatchObject({ ok: true });
    expect(db.reads.filter((x) => x === "wedding_receipts")).toEqual([]);
  });
});
