// Paket A2 (Anker-Fortsetzung, migration 0160) against a throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...).
// The REAL trusted-server code (treasury.server.ts settleWeddings, activeQuarantine, weddingSettlementProblem) runs
// against the real database through a small PostgREST stand-in for the three calls it makes (select on
// wedding_receipts / wedding_quarantine, rpc). Schema and migrations: wedding-pg-schema.ts (0160, both parts).
//
// Test-only change, stated openly: the switch instant is fixed in the code (placeholder 2100-01-04) and 0160's guard
// refuses receipts dated after now() + 5 minutes. To book unified-rule weddings with the REAL rule, this file replaces
// exactly the `now()` of that one future check by a test clock (setting test.now) — every other line of the guard,
// the booking call and the quarantine are the migration's text (asserted below). The same for the one future check of
// wedding_settle (0162, Paket B), which settleWeddings now calls for the completeness proof.
//
// Abnahmekriterien (test names start with the criterion): A2-K1 … A2-K7, A2-K9 (A2-K8: hochzeit-regel-golden.test.ts,
// hochzeit-anker.test.ts and the parity test in hochzeitspaket.pg.test.ts).
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Seed } from "@/game/world";
import { weddingReceiptRows, planReceipts, type BookedReceipt, type WeddingReceiptRow } from "@/game/wedding-receipts";
import { WEDDING_SWITCH_SINCE } from "@/game/weddings";
import { M0160, M0162, block, prepareWeddingDb } from "./wedding-pg-schema";

const URL = process.env["BUILD_MAIL_TEST_PG"];
if (!URL && (process.env["CI"] || process.env["REQUIRE_PG"])) throw new Error("BUILD_MAIL_TEST_PG missing: Paket A2 DB tests must run");
const d = URL ? describe : describe.skip;

// ---- PostgREST stand-in over postgres.js (only what settleWeddings uses) ----
const pg = vi.hoisted(() => ({ sql: null as unknown as import("postgres").Sql }));
vi.mock("@/integrations/supabase/client.server", () => {
  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v);
  const clean = (r: Record<string, unknown>) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, iso(v)]));
  const ident = (s: string) => { if (!/^[a-z_]+$/.test(s)) throw new Error(`bad identifier ${s}`); return s; };
  const from = (table: string) => {
    const where: string[] = [], params: unknown[] = [];
    let cols = "*", order = "", limit = "", single = false;
    const q = {
      select(c: string) { cols = c.split(",").map((x) => ident(x.trim())).join(", "); return q; },
      eq(k: string, v: unknown) { params.push(v); where.push(`${ident(k)} = $${params.length}`); return q; },
      gt(k: string, v: unknown) { params.push(v); where.push(`${ident(k)} > $${params.length}`); return q; },
      is(k: string, v: null) { if (v !== null) throw new Error("is: only null"); where.push(`${ident(k)} is null`); return q; },
      order(k: string) { order = ` order by ${ident(k)}`; return q; },
      limit(n: number) { limit = ` limit ${Math.floor(n)}`; return q; },
      maybeSingle() { single = true; return q; },
      async run() {
        try {
          const rows = await pg.sql.unsafe(`select ${cols} from public.${ident(table)}${where.length ? " where " + where.join(" and ") : ""}${order}${limit}`, params as never[]);
          const out = rows.map((r) => clean(r as Record<string, unknown>));
          return { data: single ? out[0] ?? null : out, error: null };
        } catch (e) { return { data: null, error: { message: (e as Error).message } }; }
      },
      then<A, B>(ok?: ((v: unknown) => A) | null, bad?: ((e: unknown) => B) | null) { return q.run().then(ok, bad); },
    };
    return q;
  };
  const TYPES: Record<string, string> = { _seed: "uuid", _realm: "text", _rows: "jsonb", _reason: "text", _indices: "integer[]", _details: "jsonb", _note: "text", _through: "timestamptz", _today: "date" };
  const rpc = async (fn: string, args: Record<string, unknown>) => {
    const keys = Object.keys(args);
    const vals = keys.map((k) => args[k]); // postgres.js serializes jsonb parameters itself (no JSON.stringify here)
    try {
      const [r] = await pg.sql.unsafe(`select public.${ident(fn)}(${keys.map((k, i) => `${ident(k)} := $${i + 1}::${TYPES[k] ?? "text"}`).join(", ")}) as r`, vals as never[]);
      return { data: iso((r as Record<string, unknown>)["r"]), error: null };
    } catch (e) { return { data: null, error: { message: (e as Error).message, code: (e as { code?: string }).code } }; }
  };
  return { supabaseAdmin: { from, rpc } };
});

const { settleWeddings, weddingSettlementProblem, resetWeddingSwitchCache } = await import("./treasury.server");

const D = 864e5, H = 3.6e6, T = WEDDING_SWITCH_SINCE, C0 = T - 320 * D;
const OWNER = "00000000-0000-0000-0000-0000000000a2";
let n = 0;
const nextId = () => `00000000-0000-0000-0000-${(0xa20000 + ++n).toString(16).padStart(12, "0")}`;

d("Paket A2 – Anker-Fortsetzung (real PostgreSQL, real settleWeddings)", () => {
  let sql: postgres.Sql;
  let admin: postgres.Sql | null = null;
  let dbName: string | null = null;
  const err = (p: PromiseLike<unknown>) => Promise.resolve(p).then(() => "ok", (e: Error) => e.message);

  /** Creates the village (seed row + purchases) and returns the matching TypeScript Seed. */
  const make = async (created: number, bought: [string, number][], opts: { realm?: string; charter?: [string, number] } = {}): Promise<Seed> => {
    const id = nextId(), realm = opts.realm ?? "europe";
    await sql`insert into public.seeds (id, user_id, created_at, realm) values (${id}, ${OWNER}, ${new Date(created).toISOString()}, ${realm})`;
    for (const [item, at] of bought) await sql`insert into public.purchases (seed_id, item, created_at) values (${id}, ${item}, ${new Date(at).toISOString()})`;
    return { id, user_id: OWNER, realm, x: 0, y: 0, created_at: new Date(created).toISOString(), bought: bought.map(([item, at]) => ({ item, at })),
      ...(opts.charter ? { charter: { path: opts.charter[0], at: opts.charter[1] } } : {}) } as unknown as Seed;
  };
  /** A later purchase: in the database (as the player would book it) and in the TypeScript village. */
  const later = async (s: Seed, act: "herberge" | "woodcamp" | "craft", at: number): Promise<Seed> => {
    if (act === "craft") { await sql`insert into public.charters (seed_id, path, created_at) values (${s.id}, 'craft', ${new Date(at).toISOString()})`; return { ...s, charter: { path: "craft", at } } as Seed; }
    await sql`insert into public.purchases (seed_id, item, created_at) values (${s.id}, ${act}, ${new Date(at).toISOString()})`;
    return { ...s, bought: [...(s.bought ?? []), { item: act, at }] };
  };
  const receipts = async (id: string) => (await sql`select wedding_index, occurred_at, dowry, is_grand, is_town, version, next_at
      from public.wedding_receipts where seed_id = ${id} order by wedding_index`).map((r) => ({
    wedding_index: r["wedding_index"] as number, occurred_at: (r["occurred_at"] as Date).toISOString(), dowry: r["dowry"] as number,
    is_grand: r["is_grand"] as boolean, is_town: r["is_town"] as boolean, version: r["version"] as number,
    next_at: r["next_at"] ? (r["next_at"] as Date).toISOString() : null })) as BookedReceipt[];
  /** Every anchor points at the next receipt, indices run on without a gap. */
  const chainOk = (b: BookedReceipt[]) => b.every((r, i) => i === 0 || (r.wedding_index === b[i - 1]!.wedding_index + 1 && r.occurred_at === b[i - 1]!.next_at));
  const money = async (id: string, at: number) => (await sql`select t, dowry from public.village_wedding_list(${id}, ${new Date(at).toISOString()}, array['fisher','hunter','granary','dairy']) order by t`)
    .map((r) => [(r["t"] as Date).getTime(), r["dowry"] as number]);
  const book = (id: string, rows: (WeddingReceiptRow | BookedReceipt)[], tx: postgres.Sql | postgres.TransactionSql = sql) =>
    tx`select public.wedding_receipts_book(${id}, ${tx.json(rows.map((r) => { const { seed_id: _s, ...x } = r as WeddingReceiptRow; return x; }) as never)}) as r`.then((x) => x[0]!["r"] as { inserted: number; already: number });
  const disabled = async (f: () => Promise<unknown>) => {
    await sql.unsafe("alter table public.wedding_receipts disable trigger wedding_receipts_guard");
    try { await f(); } finally { await sql.unsafe("alter table public.wedding_receipts enable trigger wedding_receipts_guard"); }
  };

  beforeAll(async () => {
    admin = postgres(URL!, { max: 1, onnotice: () => {} });
    dbName = `anker_${process.pid}_${Date.now()}`;
    try {
      await admin.unsafe(`create database ${dbName}`);
      const u = new globalThis.URL(URL!); u.pathname = `/${dbName}`;
      sql = postgres(u.toString(), { max: 8, onnotice: () => {}, connection: { "test.now": "2100-12-31 00:00:00+00" } as never });
    } catch { dbName = null; sql = postgres(URL!, { max: 8, onnotice: () => {}, connection: { "test.now": "2100-12-31 00:00:00+00" } as never }); }
    pg.sql = sql;
    await prepareWeddingDb(sql);
    // test clock for the one future check (see header); the rest of the guard stays the migration's text
    const guard = block(M0160, "CREATE OR REPLACE FUNCTION public.wedding_receipt_guard()", "END $$;");
    const line = "IF NEW.occurred_at > now() + interval '5 minutes' THEN";
    expect(guard.split(line).length).toBe(2);
    await sql.unsafe(guard.replace(line, "IF NEW.occurred_at > coalesce(nullif(current_setting('test.now', true), '')::timestamptz, now()) + interval '5 minutes' THEN"));
    // Paket B: the same test clock for the one future check of wedding_settle (0162), nothing else changed
    const settleFn = block(M0162, "CREATE OR REPLACE FUNCTION public.wedding_settle(", "END $$;");
    const sline = "IF _through > now() + interval '5 minutes' THEN";
    expect(settleFn.split(sline).length).toBe(2);
    await sql.unsafe(settleFn.replace(sline, "IF _through > coalesce(nullif(current_setting('test.now', true), '')::timestamptz, now()) + interval '5 minutes' THEN"));
    resetWeddingSwitchCache();
  }, 120000);
  afterAll(async () => {
    await sql.end();
    if (admin) { if (dbName) await admin.unsafe(`drop database if exists ${dbName} with (force)`).catch(() => {}); await admin.end(); }
  });

  it("setup: database switch = code switch (placeholder), test clock active, 0160 objects present", async () => {
    const [r] = await sql`select public.wedding_switch_since('europe') as sw, current_setting('test.now') as now,
      to_regclass('public.wedding_quarantine') is not null as q, to_regprocedure('public.wedding_receipts_book(uuid,jsonb)') is not null as b`;
    expect(new Date(r!["sw"] as string).getTime()).toBe(T);
    expect(r).toMatchObject({ q: true, b: true });
  });

  // ---------- A2-K1 / A2-K2 / A2-K9: booked weddings stay, continuation from the anchor ----------
  type Base = { name: string; steps: [string, number][] };
  const BASES: Base[] = [
    { name: "Dom 1–3", steps: [["cathedral1", 0], ["cathedral2", 1], ["cathedral3", 2]] },
    { name: "Universität 1–3", steps: [["university1", 0], ["university2", 1], ["university3", 2]] },
    { name: "Dom 1–3 + Universität 1–3", steps: [["cathedral1", 0], ["cathedral2", 1], ["cathedral3", 2], ["university1", 3], ["university2", 4], ["university3", 5]] },
  ];
  /** (P, X) pairs where the reference recomputation WOULD move a booked wedding after the action — so the test bites. */
  function bitingCases(base: Base, act: "herberge" | "woodcamp" | "craft", want: number) {
    const out: { P: number; X: number }[] = [];
    for (let i = 0; i < 40 && out.length < want; i++) {
      const P = T - 6 * D + i * 18 * H;
      const s0 = { id: `probe-${base.name}-${act}-${i}`, user_id: OWNER, realm: "europe", x: 0, y: 0, created_at: new Date(C0).toISOString(),
        bought: [["fisher", C0 + D], ["hunter", C0 + 2 * D], ...base.steps.map(([it, k]) => [it, P + k])].map(([item, at]) => ({ item, at })) } as unknown as Seed;
      const ref = weddingReceiptRows(s0, T + 70 * D).filter((r) => Date.parse(r.occurred_at) >= T && Date.parse(r.occurred_at) < T + 55 * D);
      for (const X of ref.filter((_, k) => k % 3 === 0).map((r) => Date.parse(r.occurred_at) + 30 * 60e3)) {
        const s1 = act === "craft" ? { ...s0, id: s0.id + "c" + X, charter: { path: "craft", at: X + H } } : { ...s0, id: s0.id + "b" + X, bought: [...s0.bought!, { item: act, at: X + H }] };
        const h = (s: Seed) => weddingReceiptRows(s, X).map((r) => `${r.wedding_index}|${r.occurred_at}|${r.dowry}|${r.is_town}|${r.is_grand}`).join(";");
        if (h({ ...s0, id: s0.id + "x" + X } as Seed) !== h(s1 as Seed)) { out.push({ P, X }); break; }
      }
    }
    return out;
  }

  for (const act of ["herberge", "woodcamp", "craft"] as const) {
    it(`A2-K1/A2-K9 later ${act}: booked receipts and the money stay byte-identical, no quarantine (cases where recomputation would move them)`, async () => {
      let cases = 0;
      for (const base of BASES) for (const { P, X } of bitingCases(base, act, 3)) {
        const s0 = await make(C0, [["fisher", C0 + D], ["hunter", C0 + 2 * D], ...base.steps.map(([it, k]) => [it, P + k] as [string, number])]);
        const r0 = await settleWeddings(s0, X);
        expect(weddingSettlementProblem(r0)).toBeNull();
        expect(r0.kind).toBe("initial");
        const booked = await receipts(s0.id);
        expect(booked.length).toBeGreaterThan(10);
        expect(booked.some((r) => r.version === 2)).toBe(true);
        expect(booked.every((r) => r.next_at !== null)).toBe(true);
        const moneyBefore = await money(s0.id, X);
        // the later action, then a settlement 40 days on (with the reference rule it would move booked weddings)
        const s1 = await later(s0, act, X + H);
        expect(weddingReceiptRows(s1, X).map((r) => r.occurred_at + r.dowry)).not.toEqual(booked.map((r) => r.occurred_at + r.dowry));
        const r1 = await settleWeddings(s1, X + 40 * D);
        expect(weddingSettlementProblem(r1), `${base.name} P=${new Date(P).toISOString()}`).toBeNull();
        expect(r1.kind).toBe("anchored");
        const after = await receipts(s0.id);
        expect(after.slice(0, booked.length)).toEqual(booked);       // A2-K1: unchanged, field by field (incl. next_at)
        expect(await money(s0.id, X)).toEqual(moneyBefore);           // the money up to X too
        // A2-K2: the first new receipt starts at the stored anchor, with the next index; the chain holds in the DB
        const last = booked[booked.length - 1]!, first = after[booked.length]!;
        expect(first.wedding_index).toBe(last.wedding_index + 1);
        expect(first.occurred_at).toBe(last.next_at);
        expect(chainOk(after)).toBe(true);
        cases++;
      }
      expect(cases).toBeGreaterThanOrEqual(3);
    }, 300000);
  }

  // ---------- Paket B (B13): the real settleWeddings writes the proof with the anchor, also after a retroactive factor ----------
  it("B13 settleWeddings writes the completeness proof atomically with the receipts; it follows the anchor across a later Herberge", async () => {
    const { P, X } = bitingCases(BASES[0]!, "herberge", 1)[0]!;
    const s0 = await make(C0, [["fisher", C0 + D], ["hunter", C0 + 2 * D], ...BASES[0]!.steps.map(([it, k]) => [it, P + k] as [string, number])]);
    const proof = async () => (await sql`select settled_through, quiet_until, anchor_index from public.wedding_settlement where seed_id = ${s0.id}`)
      .map((r) => ({ through: (r["settled_through"] as Date).getTime(), quiet: (r["quiet_until"] as Date).getTime(), index: r["anchor_index"] as number }))[0];
    const r0 = await settleWeddings(s0, X);
    expect(r0.marked).toBe(true);
    let b = await receipts(s0.id);
    expect(await proof()).toEqual({ through: X, quiet: Date.parse(b.at(-1)!.next_at!), index: b.at(-1)!.wedding_index });
    const s1 = await later(s0, "herberge", X + H);
    const r1 = await settleWeddings(s1, X + 30 * D);
    expect(weddingSettlementProblem(r1)).toBeNull();
    b = await receipts(s0.id);
    expect(await proof()).toEqual({ through: X + 30 * D, quiet: Date.parse(b.at(-1)!.next_at!), index: b.at(-1)!.wedding_index });
    expect((await sql`select public.wedding_settled_at(${s0.id}, ${new Date(X + 30 * D).toISOString()}) s`)[0]!["s"]).toBe(true);
  });

  // ---------- A2-K3: initial state ----------
  it("A2-K3 a village without weddings: inventory 'ohne_belege', first settlement books from index 0 and anchors it", async () => {
    const s = await make(T - 60 * D, [["fisher", T - 59 * D]]);
    const inv = async () => (await sql`select klasse, belege, hoechster_index, naechste from public.wedding_anchor_inventory() where seed_id = ${s.id}`)[0]!;
    expect(await inv()).toMatchObject({ klasse: "ohne_belege", belege: 0 });
    // before day 2: nothing to book, still initial
    const early = await settleWeddings(s, Date.parse(s.created_at) + D);
    expect(early).toMatchObject({ kind: "initial", anchor: null, inserted: 0, missing: 0 });
    expect(await inv()).toMatchObject({ klasse: "ohne_belege" });
    const r = await settleWeddings(s, T + 20 * D);
    expect(r).toMatchObject({ kind: "initial", verified: true });
    const b = await receipts(s.id);
    expect(b[0]).toMatchObject({ wedding_index: 0, occurred_at: new Date(Date.parse(s.created_at) + 2 * D).toISOString() });
    expect(chainOk(b)).toBe(true);
    expect(r.anchor).toEqual({ k: b.at(-1)!.wedding_index, at: Date.parse(b.at(-1)!.occurred_at), next: Date.parse(b.at(-1)!.next_at!) });
    expect(await inv()).toMatchObject({ klasse: "verankert", belege: b.length, hoechster_index: b.at(-1)!.wedding_index });
    // the database refuses a first receipt that does not start at index 0 (europe)
    const t = await make(T - 60 * D, []);
    const row = weddingReceiptRows(t, T + 20 * D)[3]!;
    expect(await err(book(t.id, [row]))).toBe("wedding receipt index gap");
  });

  // ---------- A2-K4: quarantine ----------
  describe("A2-K4 non-reconstructible stock is quarantined, never repaired", () => {
    const stock = async (mutate: (rows: WeddingReceiptRow[]) => WeddingReceiptRow[]) => {
      const s = await make(C0, [["fisher", C0 + D], ["hunter", C0 + 2 * D], ["cathedral1", T - D], ["cathedral2", T - D + 1], ["cathedral3", T - D + 2]]);
      const rows = mutate(weddingReceiptRows(s, T + 30 * D));
      // stock as it could exist from before 0160 (written without the A2 guard)
      await disabled(async () => { for (const r of rows) await sql`insert into public.wedding_receipts ${sql(r as never)}`; });
      return s;
    };
    it("A2-K4 unified receipts without anchor: quarantined 'unanchored', recorded once, nothing written, every booking path refused", async () => {
      const s = await stock((rows) => rows.map((r) => (r.version === 2 ? { ...r, next_at: null as unknown as string } : r)));
      const before = await receipts(s.id);
      const r = await settleWeddings(s, T + 60 * D);
      expect(weddingSettlementProblem(r)?.reason).toBe("quarantined");
      expect(r.quarantine).toMatchObject({ reason: "unanchored", recorded: true });
      expect(await receipts(s.id)).toEqual(before);                               // not repaired, nothing added
      const q = await sql`select reason, indices, released_at from public.wedding_quarantine where seed_id = ${s.id}`;
      expect(q).toHaveLength(1);
      expect(q[0]!["indices"]).toEqual(before.filter((x) => x.version === 2).map((x) => x.wedding_index));
      // again: the active record stops before any receipt is read; still one record
      const again = await settleWeddings(s, T + 61 * D);
      expect(again).toMatchObject({ kind: null, inserted: 0, quarantine: { reason: "unanchored", recorded: true } });
      expect(await sql`select 1 from public.wedding_quarantine where seed_id = ${s.id}`).toHaveLength(1);
      // the booking call and a direct insert (e.g. an old server) are refused too
      const next = { ...before.at(-1)!, wedding_index: before.at(-1)!.wedding_index + 1, occurred_at: new Date(T + 40 * D).toISOString(), next_at: new Date(T + 45 * D).toISOString() };
      expect(await err(book(s.id, [next]))).toBe("wedding settlement quarantined");
      expect(await err(sql`insert into public.wedding_receipts ${sql({ seed_id: s.id, ...next } as never)}`)).toBe("wedding settlement quarantined");
      const [inv] = await sql`select klasse, quarantaene, v2_ohne_anker from public.wedding_anchor_inventory() where seed_id = ${s.id}`;
      expect(inv).toMatchObject({ klasse: "quarantaene", quarantaene: "unanchored" });
      expect(inv!["v2_ohne_anker"]).toBeGreaterThan(0);
    });
    it("A2-K4 legacy receipt that differs: 'legacy_divergent'; broken chain: 'chain_break' (both recorded, nothing written)", async () => {
      const a = await stock((rows) => rows.map((r, i) => (i === 3 ? { ...r, dowry: r.dowry + 5 } : r)));
      expect((await settleWeddings(a, T + 60 * D)).quarantine).toMatchObject({ reason: "legacy_divergent", indices: [3], recorded: true });
      const b = await stock((rows) => { const i = rows.findIndex((r) => r.version === 2); return rows.map((r, k) => (k === i + 2 ? { ...r, occurred_at: new Date(Date.parse(r.occurred_at) + H).toISOString() } : r)); });
      const before = await receipts(b.id);
      const r = await settleWeddings(b, T + 60 * D);
      expect(r.quarantine).toMatchObject({ reason: "chain_break", recorded: true });
      expect(await receipts(b.id)).toEqual(before);
      const [inv] = await sql`select klasse, kettenbrueche from public.wedding_anchor_inventory() where seed_id = ${b.id}`;
      expect(inv).toMatchObject({ klasse: "quarantaene" });
      expect(inv!["kettenbrueche"]).toBeGreaterThan(0);
    });
    it("A2-K4 the record is traceable: not editable, not deletable while the village exists, released only with a note", async () => {
      const s = await stock((rows) => rows.map((r, i) => (i === 1 ? { ...r, dowry: 0 } : r)));
      await settleWeddings(s, T + 60 * D);
      expect(await err(sql`update public.wedding_quarantine set reason = 'chain_break' where seed_id = ${s.id}`)).toBe("wedding quarantine records are immutable");
      expect(await err(sql`delete from public.wedding_quarantine where seed_id = ${s.id}`)).toBe("wedding quarantine records are kept");
      expect(await err(sql`select public.wedding_quarantine_release(${s.id}, 'kurz')`)).toBe("wedding quarantine release needs a note");
      await sql`select public.wedding_quarantine_release(${s.id}, 'Belege von Hand geprüft, Freigabe durch Stephan')`;
      const [q] = await sql`select reason, released_at, release_note from public.wedding_quarantine where seed_id = ${s.id}`;
      expect(q!["released_at"]).not.toBeNull();
      expect(await err(sql`update public.wedding_quarantine set release_note = 'anders' where seed_id = ${s.id}`)).toBe("wedding quarantine records are immutable");
      // released but still divergent: the next settlement quarantines again (new record), it never repairs
      const r = await settleWeddings(s, T + 61 * D);
      expect(r.quarantine).toMatchObject({ reason: "legacy_divergent", recorded: true });
      expect(await sql`select 1 from public.wedding_quarantine where seed_id = ${s.id}`).toHaveLength(2);
      // the village purge still removes everything (ON DELETE CASCADE; single receipts cannot be deleted since 0161)
      await sql`delete from public.seeds where id = ${s.id}`;
      expect(await sql`select 1 from public.wedding_receipts where seed_id = ${s.id}`).toHaveLength(0);
      expect(await sql`select 1 from public.wedding_quarantine where seed_id = ${s.id}`).toHaveLength(0);
    });
    it("A2-K4 privileges: quarantine and the 0160 functions are for the service role only", async () => {
      const [p] = await sql`select
        has_table_privilege('authenticated', 'public.wedding_quarantine', 'SELECT') as auth_sel,
        has_table_privilege('service_role', 'public.wedding_quarantine', 'SELECT') as srv_sel,
        has_table_privilege('service_role', 'public.wedding_quarantine', 'INSERT') as srv_ins,
        has_table_privilege('service_role', 'public.wedding_quarantine', 'DELETE') as srv_del,
        has_function_privilege('authenticated', 'public.wedding_receipts_book(uuid,jsonb)', 'EXECUTE') as auth_book,
        has_function_privilege('anon', 'public.wedding_quarantine_set(uuid,text,integer[],jsonb)', 'EXECUTE') as anon_set,
        has_function_privilege('service_role', 'public.wedding_receipts_book(uuid,jsonb)', 'EXECUTE') as srv_book`;
      expect(p).toEqual({ auth_sel: false, srv_sel: true, srv_ins: false, srv_del: false, auth_book: false, anon_set: false, srv_book: true });
    });
  });

  // ---------- A2-K5: atomic ----------
  it("A2-K5 receipt and anchor are stored together or not at all", async () => {
    const s = await make(T - 60 * D, [["fisher", T - 59 * D]]);
    const rows = weddingReceiptRows(s, T + 20 * D);
    expect(rows.length).toBeGreaterThan(8);
    const count = async () => (await sql`select count(*)::int as n from public.wedding_receipts where seed_id = ${s.id}`)[0]!["n"] as number;
    // one bad row at the end of a call: none of the call's rows is stored
    const v2 = rows.findIndex((r) => r.version === 2);
    for (const [name, bad] of [
      ["chain", [...rows.slice(0, 6), { ...rows[6]!, occurred_at: new Date(Date.parse(rows[6]!.occurred_at) + 1).toISOString() }]],
      ["missing anchor", [...rows.slice(0, v2), { ...rows[v2]!, next_at: null }]],
      ["future", [...rows.slice(0, 6), { ...rows[6]!, occurred_at: "2101-06-01T00:00:00.000Z", next_at: "2101-06-02T00:00:00.000Z" }]],
      ["wrong version", [...rows.slice(0, v2), { ...rows[v2]!, version: 1 }]],
    ] as [string, WeddingReceiptRow[]][]) {
      expect(await err(book(s.id, bad)), name).not.toBe("ok");
      expect(await count(), name).toBe(0);
    }
    // a direct version-2 insert without anchor is refused by the guard
    await book(s.id, rows.slice(0, v2));
    expect(await err(sql`insert into public.wedding_receipts ${sql({ ...rows[v2]!, next_at: null } as never)}`)).toBe("wedding receipt anchor required");
    // a good call stores every row with its anchor
    expect(await book(s.id, rows.slice(v2))).toEqual({ inserted: rows.length - v2, already: 0 });
    const b = await receipts(s.id);
    expect(b.length).toBe(rows.length);
    expect(b.every((r) => r.next_at !== null)).toBe(true);
    expect(chainOk(b)).toBe(true);
    // the anchor cannot be rewritten afterwards
    expect(await err(sql`update public.wedding_receipts set next_at = next_at + interval '1 hour' where seed_id = ${s.id}`)).toBe("wedding receipts are immutable");
  });

  // ---------- A2-K6: repeats ----------
  it("A2-K6 repeated identical bookings create no double booking", async () => {
    const s = await make(T - 60 * D, [["fisher", T - 59 * D], ["hunter", T - 58 * D]]);
    const r1 = await settleWeddings(s, T + 25 * D);
    const b1 = await receipts(s.id);
    expect(r1.inserted).toBe(b1.length);
    const r2 = await settleWeddings(s, T + 25 * D);
    expect(r2).toMatchObject({ inserted: 0, missing: 0 });
    expect(await receipts(s.id)).toEqual(b1);
    // the booking call itself: an identical repeat is a no-op, an overlapping one adds only the new tail
    const rows = weddingReceiptRows(s, T + 25 * D);
    expect(await book(s.id, rows)).toEqual({ inserted: 0, already: rows.length });
    const t = await make(T - 60 * D, [["fisher", T - 59 * D]]);
    const all = weddingReceiptRows(t, T + 25 * D);
    expect(await book(t.id, all.slice(0, 5))).toEqual({ inserted: 5, already: 0 });
    expect(await book(t.id, all.slice(0, 9))).toEqual({ inserted: 4, already: 5 });
    expect((await receipts(t.id)).length).toBe(9);
    // a repeat with a different anchor or dowry for a booked index is refused, the booked row stays
    expect(await err(book(t.id, [{ ...all[8]!, next_at: new Date(Date.parse(all[8]!.next_at) + H).toISOString() }]))).toBe("wedding receipt conflict at index 8");
    expect(await err(book(t.id, [{ ...all[2]!, dowry: all[2]!.dowry + 1 }]))).toBe("wedding receipt conflict at index 2");
    expect((await receipts(t.id))[8]!.next_at).toBe(all[8]!.next_at);
  });

  // ---------- A2-K7: parallel ----------
  it("A2-K7 parallel settlements of one village: one consistent chain, no double booking, no quarantine", async () => {
    for (let round = 0; round < 3; round++) {
      const s = await make(C0, [["fisher", C0 + D], ["hunter", C0 + 2 * D], ["cathedral1", T - 2 * D], ["cathedral2", T - 2 * D + 1], ["cathedral3", T - 2 * D + 2]]);
      const at = T + (20 + round * 7) * D;
      const results = await Promise.all(Array.from({ length: 8 }, () => settleWeddings({ ...s }, at)));
      for (const r of results) expect(weddingSettlementProblem(r)).toBeNull();
      const b = await receipts(s.id);
      const want = planReceipts(s, [], at).rows;
      expect(b.length).toBe(want.length);
      expect(new Set(b.map((r) => r.wedding_index)).size).toBe(b.length);
      expect(chainOk(b)).toBe(true);
      expect(results.reduce((a, r) => a + r.inserted, 0)).toBe(b.length);      // every row booked by exactly one call
      expect(await sql`select 1 from public.wedding_quarantine where seed_id = ${s.id}`).toHaveLength(0);
    }
  }, 120000);
  it("A2-K7 parallel booking calls with conflicting content: exactly one wins, its rows and anchors are kept whole", async () => {
    const s = await make(T - 60 * D, [["fisher", T - 59 * D]]);
    const rows = weddingReceiptRows(s, T + 20 * D);
    const variants = [0, 1, 2, 3, 4, 5].map((k) => rows.map((r, i) => (i === rows.length - 1 ? { ...r, dowry: r.dowry + k, next_at: new Date(Date.parse(r.next_at) + k * H).toISOString() } : r)));
    const out = await Promise.all(variants.map((v) => sql.begin((tx) => book(s.id, v, tx)).then(() => "ok", (e: Error) => e.message)));
    expect(out.filter((x) => x === "ok")).toHaveLength(1);
    for (const x of out.filter((y) => y !== "ok")) expect(x).toMatch(/^wedding receipt conflict at index \d+$/);
    const win = variants[out.indexOf("ok")]!;
    const b = await receipts(s.id);
    expect(b).toEqual(win.map(({ seed_id: _s, ...r }) => r));
    expect(chainOk(b)).toBe(true);
  });
});
