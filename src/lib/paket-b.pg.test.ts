// Paket B (migration 0162: O1 Vollständigkeitsnachweis, O2 Reihenfolge und Pending, purchase_material-Fix) against a
// throw-away PostgreSQL with the COMPLETE schema (full-schema.testkit.ts: every journal migration 0000–0162, files
// unchanged). BUILD_MAIL_TEST_PG=postgres://… ; own database.
//
// The switch instant is moved into the past exactly as a switch migration would do it (IMMUTABLE wedding_switch_since).
// Weddings after it exist for the money only as receipts; they are written here through the real booking calls
// (wedding_settle / wedding_receipts_book) with chosen instants and dowries, so every case is exact. The client's
// actions run with its real role and RLS (authenticated, auth.uid()), server actions as service_role.
//
// Abnahmekriterien (test names start with them): B1 … B13.
import { createHash } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFullSchema, dropDatabase } from "./full-schema.testkit";
import { SETTLEMENT_PENDING, isSettlementPending } from "./settlement-pending";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"])) throw new Error("BUILD_MAIL_TEST_PG missing: Paket B DB tests must run");
const d = BASE ? describe : describe.skip;

const D = 864e5, H = 3.6e6;
const NOW = Date.now();
const T = Math.floor((NOW - 6 * D) / H) * H;        // switch instant of both realms in this database
const iso = (t: number) => new Date(t).toISOString();
let n = 0;
const uid = () => `00000000-0000-0000-0000-${(0xb10000 + ++n).toString(16).padStart(12, "0")}`;
const TABLES = ["purchases", "resource_ledger", "resource_state", "civic_stages", "civic_quota", "wedding_receipts", "wedding_settlement",
  "encounters", "gifts", "twin_works", "building_moves", "wedding_quarantine"];
const PENDING = SETTLEMENT_PENDING;

d("Paket B – O1/O2, Pending und Ressourcenabrechnung (vollständiges Schema, echtes PostgreSQL)", () => {
  const DB = `paketb_${process.pid}_${Date.now()}`;
  let sql: postgres.Sql;
  const err = (p: PromiseLike<unknown>) => Promise.resolve(p).then(() => "ok", (e: Error) => e.message);

  type V = { id: string; owner: string; created: number; realm: string };
  /** A village with owner; built around the game guards (replica), as the other DB tests do. */
  const village = async (o: { realm?: string | undefined; ageDays?: number | undefined; x?: number; y?: number; noRaids?: boolean } = {}): Promise<V> => {
    const id = uid(), owner = uid(), realm = o.realm ?? "europe", created = NOW - (o.ageDays ?? 10) * D;
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into public.seeds (id, user_id, owner, name, x, y, realm, created_at)
        values (${id}, ${owner}, 'Test', ${"Dorf " + n}, ${o.x ?? 100 + n}, ${o.y ?? 100 + n}, ${realm}, ${iso(created)})`;
      // a guard from the founding: no raids (village_raid_list), so a chest can sit exactly at its cap
      if (o.noRaids) await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${id}, ${owner}, 'guard', 0, ${iso(created)})`;
    });
    return { id, owner, created, realm };
  };
  /** Money rows outside the game guards: negative cost = income (capped by the chest), positive = expense. */
  const money = async (v: V, cost: number, at: number) => {
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, ${"test_money_" + ++n}, ${cost}, ${iso(at)})`;
    });
  };
  const rowsOf = async (table: string) => (await sql.unsafe(`select coalesce(string_agg(x::text, '|' order by x::text), '') s from public.${table} x`))[0]!["s"] as string;
  const snapshot = async () => { const h = createHash("sha256"); for (const t of TABLES) h.update(t + ":" + await rowsOf(t)); return h.digest("hex"); };
  const balance = async (v: V) => (await sql`select public.village_balance(${v.id}) b`)[0]!["b"] as number;
  const settledNow = async (v: V) => (await sql`select public.wedding_settled_at(${v.id}, now()) s`)[0]!["s"] as boolean;
  /** As the player's client: role authenticated, auth.uid() = owner. Returns "ok" or the database message. */
  const asPlayer = (v: V, f: (tx: postgres.TransactionSql) => Promise<unknown>) => err(sql.begin(async (tx) => {
    await tx`select set_config('test.uid', ${v.owner}, true), set_config('test.role', 'authenticated', true)`;
    await tx.unsafe("set local role authenticated");
    await f(tx);
  }));
  const asServer = (f: (tx: postgres.TransactionSql) => Promise<unknown>) => err(sql.begin(async (tx) => {
    await tx`select set_config('test.role', 'service_role', true)`;
    await tx.unsafe("set local role service_role");
    await f(tx);
  }));
  const buy = (v: V, item: string, extra: { kontor_max?: number } = {}) =>
    asPlayer(v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, kontor_max) values (${v.id}, ${v.owner}, ${item}, ${extra.kontor_max ?? null})`);

  type W = { t: number; dowry: number };
  /** The legacy weddings (before T) as the database computes them, and the chain rows for chosen later weddings. */
  const legacy = async (v: V): Promise<W[]> =>
    (await sql`select t, dowry from public.village_wedding_list(${v.id}, ${iso(T - 1)}, array['fisher','hunter','granary','dairy']) order by t`)
      .map((r) => ({ t: (r["t"] as Date).getTime(), dowry: r["dowry"] as number }));
  const chain = (v: V, ws: W[], next: number, from = 0) => ws.map((w, i) => ({
    wedding_index: from + i, occurred_at: iso(w.t), dowry: w.dowry, is_grand: true, is_town: false, version: w.t >= T ? 2 : 1,
    next_at: iso(i + 1 < ws.length ? ws[i + 1]!.t : next),
  }));
  const settle = (v: V, rows: unknown[], through: number) =>
    sql`select public.wedding_settle(${v.id}, ${sql.json(rows as never)}, ${iso(through)}) r`.then((x) => x[0]!["r"] as { inserted: number; marked: boolean });
  /**
   * The standard case: legacy weddings booked, W1 (after T) booked, W2 (2 days ago, dowry `w2`) due but NOT booked;
   * the proof was written up to just before W2 (the last settlement). `complete: true` books W2 as well (proof up to now).
   */
  const scenario = async (o: { realm?: string; w2?: number; complete?: boolean; ageDays?: number; noRaids?: boolean } = {}) => {
    const v = await village({ realm: o.realm, ageDays: o.ageDays, noRaids: o.noRaids ?? false });
    const leg = await legacy(v);
    const W1 = { t: T + 12 * H, dowry: 41 }, W2 = { t: NOW - 2 * D, dowry: o.w2 ?? 500 }, NEXT = NOW + 2 * D;
    const lab = v.realm === "lab";
    const booked = [...(lab ? [] : leg), W1];
    await settle(v, chain(v, booked, W2.t, lab ? leg.length : 0), W2.t - H);
    if (o.complete) await settle(v, chain(v, [W2], NEXT, (lab ? leg.length : 0) + booked.length), NOW);
    return { v, leg, W1, W2, NEXT, index2: (lab ? leg.length : 0) + booked.length };
  };
  const bookW2 = (s: Awaited<ReturnType<typeof scenario>>) => settle(s.v, chain(s.v, [s.W2], s.NEXT, s.index2), Date.now());

  beforeAll(async () => {
    const url = await buildFullSchema(BASE!, DB);
    sql = postgres(url, { max: 8, onnotice: () => {} });
    await sql.unsafe(`create or replace function public.wedding_switch_since(_realm text) returns timestamptz
      language sql immutable set search_path to 'public' as $$ select timestamptz '${iso(T)}' $$`);
  }, 120000);
  afterAll(async () => { await sql.end(); await dropDatabase(BASE!, DB); });

  it("setup: 0162 applied on the full schema; the five guards and purchase_material use the one money check", async () => {
    const src = async (f: string) => (await sql`select pg_get_functiondef(${f}::regprocedure) s`)[0]!["s"] as string;
    for (const g of ["purchase_guard()", "gift_guard()", "encounter_guard()", "twin_work_guard()", "building_move_guard()", "purchase_material()"])
      expect(await src(`public.${g}`), g).toContain("public.wedding_money_check(");
    expect(await src("public.resource_refresh_try(uuid,date)")).toContain("RETURN 'pending'");
  });

  // ---------- B1 / B2: the wedding is settled before the money / resource booking that depends on it ----------
  it("B1 the wedding is booked (with its proof) before a dependent chest booking: refused as pending before, accepted after", async () => {
    const s = await scenario({ w2: 500 });
    const v = s.v;
    // the chest without W2 is too small for the gift but would be enough with W2 (true balance)
    const low = await balance(v);
    await money(v, low - 10, NOW - D);                       // spend down to 10 Mark (booked lower bound)
    expect(await balance(v)).toBe(10);
    const other = await village();
    expect(await settledNow(v)).toBe(false);
    expect(await asPlayer(v, (tx) => tx`insert into public.gifts (from_seed, to_seed, user_id, kind) values (${v.id}, ${other.id}, ${v.owner}, 'gift')`)).toBe(PENDING);
    // the trusted server books W2 and the proof (O2 steps 2–3), then the same action goes through and pays from the full chest
    const r = await bookW2(s);
    expect(r).toMatchObject({ inserted: 1, marked: true });
    expect(await settledNow(v)).toBe(true);
    expect(await balance(v)).toBeGreaterThanOrEqual(10 + 500 - 1200);  // W2 counted (below the chest cap)
    const before = await balance(v);
    expect(await asPlayer(v, (tx) => tx`insert into public.gifts (from_seed, to_seed, user_id, kind) values (${v.id}, ${other.id}, ${v.owner}, 'gift')`)).toBe("ok");
    expect(await balance(v)).toBe(before - 25);
  });

  /** A lab village with a site and an open Gemeindebau stage whose Kontor buys from the chest (as in civic.pg.test.ts). */
  const labWithStage = async (complete: boolean) => {
    const s = await scenario({ realm: "lab", ageDays: 150, complete, w2: 300 });
    await sql`insert into public.village_sites (seed_id, way, certified_at) values (${s.v.id}, 'grain', ${iso(NOW - 100 * D)})`;
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days, wood_got, stone_got, kontor_spent, opened_at, funded_at)
        values (${s.v.id}, 'spital1', 500, 1000, 400, 300, 5, 0, 0, 0, ${iso(NOW - 6 * D)}, ${iso(NOW - 5 * D)})`;
    });
    return s;
  };
  const resourceState = async (v: V) => ({
    ledger: (await sql`select count(*)::int n, coalesce(sum(amount), 0)::int s from public.resource_ledger where seed_id = ${v.id}`)[0],
    through: (await sql`select through_day from public.resource_state where seed_id = ${v.id}`)[0]?.["through_day"] ?? null,
    civic: (await sql`select wood_got, stone_got, kontor_spent from public.civic_stages where seed_id = ${v.id}`)[0],
    kontor: (await sql`select count(*)::int n, coalesce(sum(cost), 0)::int s from public.purchases where seed_id = ${v.id} and item like 'spital1:k%'`)[0],
  });
  it("B2 the wedding is booked before the dependent resource booking: pending books nothing; afterwards the same as booking in the right order", async () => {
    const a = await labWithStage(false), ref = await labWithStage(true);
    const today = new Date().toISOString().slice(0, 10);
    const st0 = await resourceState(a.v), h0 = await snapshot();
    expect((await sql`select public.resource_refresh_try(${a.v.id}, ${today}::date) r`)[0]!["r"]).toBe("pending");
    expect(await snapshot()).toBe(h0);                          // nothing booked at all, not even the start rows
    expect(await resourceState(a.v)).toEqual(st0);
    expect(await err(sql`select public.resource_refresh_at(${a.v.id}, ${today}::date)`)).toBe(PENDING); // never a silent return
    expect(await err(sql`select public.resource_refresh(${a.v.id})`)).toBe(PENDING);
    // the server books W2 (O2), then the resource booking runs — exactly as for the village settled in the right order
    await bookW2(a);
    expect((await sql`select public.resource_refresh_try(${a.v.id}, ${today}::date) r`)[0]!["r"]).toBe("booked");
    expect((await sql`select public.resource_refresh_try(${ref.v.id}, ${today}::date) r`)[0]!["r"]).toBe("booked");
    const [x, y] = [await resourceState(a.v), await resourceState(ref.v)];
    expect(x).toEqual(y);
    expect(x.civic!["kontor_spent"]).toBeGreaterThan(0);        // the Kontor really bought from the chest
    expect((await sql`select public.resource_refresh_try(${a.v.id}, ${today}::date) r`)[0]!["r"]).toBe("current"); // repeat: nothing new
  });

  // ---------- B3: no partial booking anywhere while pending ----------
  it("B3 incomplete settlement: every money and resource path refuses with pending and leaves every table unchanged", async () => {
    const s = await scenario({ w2: 500 });
    const v = s.v, other = await village();
    await money(v, (await balance(v)) - 5, NOW - D);           // booked chest: 5 Mark
    await sql.begin(async (tx) => { await tx`set local session_replication_role = replica`;
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at, x, y) values (${v.id}, ${v.owner}, 'fisher', 0, ${iso(NOW - 3 * D)}, 101, 101)`; });
    const h0 = await snapshot();
    const seedRow = (await sql`select x, y from public.seeds where id = ${v.id}`)[0]!;
    const results = {
      purchase: await buy(v, "hunter"),
      gift: await asPlayer(v, (tx) => tx`insert into public.gifts (from_seed, to_seed, user_id, kind) values (${v.id}, ${other.id}, ${v.owner}, 'gift')`),
      twin: await asPlayer(v, (tx) => tx`insert into public.twin_works (seed_id, partner_id, user_id, work) values (${v.id}, ${other.id}, ${v.owner}, 'bridge')`),
      move: await asPlayer(v, (tx) => tx`insert into public.building_moves (seed_id, user_id, item, x, y) values (${v.id}, ${v.owner}, 'fisher', ${seedRow["x"]}, ${seedRow["y"]})`),
    };
    expect(results).toEqual({ purchase: PENDING, gift: PENDING, twin: PENDING, move: PENDING });
    expect(await snapshot()).toBe(h0);
  });
  it("B3 lab: purchase_material, civic_raise_budget and resource_overview with an open stage: pending, nothing partial", async () => {
    const s = await labWithStage(false);
    const h0 = await snapshot();
    expect(await buy(s.v, "hunter", { kontor_max: 100000 })).toBe(PENDING);
    expect(await asPlayer(s.v, (tx) => tx`select public.civic_raise_budget_v2(${s.v.id}, 'spital1', 1500, 2)`)).toBe(PENDING);
    expect(await snapshot()).toBe(h0);
    let ov: Record<string, unknown> = {};
    expect(await asPlayer(s.v, async (tx) => { ov = (await tx`select public.resource_overview_v2(${s.v.id}, 2) r`)[0]!["r"] as Record<string, unknown>; })).toBe("ok");
    expect(ov).toMatchObject({ active: true, pending: true });
    expect(await snapshot()).toBe(h0);
  });

  // ---------- B4: pending is not "not enough money" ----------
  it("B4 pending and lack of money are different answers, with no shared words", async () => {
    const pend = await scenario({ w2: 500 }), done = await scenario({ w2: 500, complete: true });
    for (const s of [pend, done]) await money(s.v, (await balance(s.v)) - 50, NOW - D);  // booked chest 50 < hunter 100
    expect(await buy(pend.v, "hunter")).toBe(PENDING);
    expect(await buy(done.v, "hunter")).toBe("not enough money");
    expect(isSettlementPending("not enough money")).toBe(false);
    expect(PENDING.includes("money") || PENDING.includes("enough")).toBe(false);
  });

  // ---------- B5 / B6: E2 lower bound ----------
  it("B5 a booked lower bound that covers the price allows the purchase while the settlement is incomplete (also exactly)", async () => {
    const a = await scenario({ w2: 500 }), b = await scenario({ w2: 500 });
    await money(a.v, (await balance(a.v)) - 140, NOW - D);     // 140 ≥ hunter 100
    await money(b.v, (await balance(b.v)) - 100, NOW - D);     // exactly 100
    expect(await settledNow(a.v)).toBe(false);
    expect(await buy(a.v, "hunter")).toBe("ok");
    expect(await buy(b.v, "hunter")).toBe("ok");
    expect(await balance(b.v)).toBe(0);
  });
  it("B6 a lower bound one Mark short leads to pending, never to a booking", async () => {
    const s = await scenario({ w2: 500 });
    await money(s.v, (await balance(s.v)) - 99, NOW - D);
    const h0 = await snapshot();
    expect(await buy(s.v, "hunter")).toBe(PENDING);
    expect(await snapshot()).toBe(h0);
  });

  // ---------- B7: the four chest caps, exact boundary ----------
  describe("B7 chest caps 1.200 / 4.000 / 10.000 / 25.000 with the exact boundary", () => {
    const CAPS: [number, string[]][] = [[1200, []], [4000, ["chest2"]], [10000, ["chest2", "chest3"]], [25000, ["chest2", "chest3", "chest4"]]];
    const check = (v: V, price: number) => err(sql`select public.wedding_money_check(${v.id}, ${price})`);
    for (const [cap, chests] of CAPS) {
      it(`B7 cap ${cap}: at the cap, 20 below and at zero; the missing dowry never raises the chest`, async () => {
        for (const complete of [false, true]) {
          const s = await scenario({ w2: 5000, complete, noRaids: true });
          const v = s.v;
          for (const c of chests) await sql.begin(async (tx) => { await tx`set local session_replication_role = replica`;
            await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, ${c}, 0, ${iso(T - D)})`; });
          // pivot right after W1: deep into the red, then a credit the cap cuts to exactly the cap (as in T16)
          await money(v, 10_000_000, s.W1.t + H);
          await money(v, -20_000_000, s.W1.t + H + 1000);
          expect(await balance(v)).toBe(cap);                   // the cap binds (W2's 5.000 would be cut at the cap anyway)
          expect(await check(v, cap)).toBe("ok");               // exactly the cap: allowed
          expect(await check(v, cap + 1)).toBe(complete ? "not enough money" : PENDING);
          await money(v, 20, NOW - D);                          // 20 below the cap
          expect(await balance(v)).toBe(cap - 20);
          expect(await check(v, cap - 20)).toBe("ok");
          expect(await check(v, cap - 19)).toBe(complete ? "not enough money" : PENDING);
          await money(v, cap, NOW - D + 1000);                  // zero
          expect(await balance(v)).toBe(0);
          expect(await check(v, 0)).toBe("ok");
          expect(await check(v, 1)).toBe(complete ? "not enough money" : PENDING);
        }
      });
    }
  });

  // ---------- E2 regression in the implemented code: missing receipts never raise the chest, all walk sources ----------
  it("B5/B7 E2: with every walk source (gifts in/out, quests, market, referrals, visits, wonders, decrees, expenses, credits) and each cap, a missing receipt never raises village_balance", async () => {
    let cmp = 0, lower = 0;
    for (const [cap, chests] of [[1200, []], [4000, ["chest2"]], [10000, ["chest2", "chest3"]], [25000, ["chest2", "chest3", "chest4"]]] as [number, string[]][]) {
      const v = await village({ ageDays: 10 }), other = await village();
      const leg = await legacy(v);
      const post: W[] = Array.from({ length: 6 }, (_, i) => ({ t: T + 6 * H + i * 19 * H, dowry: 300 + 97 * i }));
      await settle(v, chain(v, [...leg, ...post], NOW + D), NOW);
      await sql.begin(async (tx) => {
        await tx`set local session_replication_role = replica`;
        for (const c of chests) await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, ${c}, 0, ${iso(T - D)})`;
        const at = (k: number) => iso(T + 3 * H + k * 7 * H);
        await tx`insert into public.gifts (from_seed, to_seed, user_id, kind, amount, created_at) values (${other.id}, ${v.id}, ${other.owner}, 'gift', 25, ${at(1)}), (${v.id}, ${other.id}, ${v.owner}, 'gift', 25, ${at(2)})`;
        await tx`insert into public.quest_claims (seed_id, user_id, quest, reward, created_at) values (${v.id}, ${v.owner}, 'q-test', 120, ${at(3)})`;
        await tx`insert into public.market_sales (seed_id, user_id, small, reward, day, created_at) values (${v.id}, ${v.owner}, true, 60, ${at(4).slice(0, 10)}::date, ${at(4)})`;
        await tx`insert into public.wonder_finds (seed_id, site, realm, reward, created_at) values (${v.id}, ${"w" + n}, 'europe', 80, ${at(5)})`;
        await tx`insert into public.referrals (referrer_seed, referee_seed, referee_user, reward, created_at) values (${v.id}, ${other.id}, ${other.owner}, 150, ${at(7)})`;
        await tx`insert into public.village_visits (visitor_seed, visited_seed, reward, created_at) values (${v.id}, ${other.id}, 10, ${at(9)})`;
        await tx`insert into public.princely_tasks (seed_id, step, task, reward, done_at) values (${v.id}, 1, 'build', 200, ${at(11)})`;
        await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, 'test_spend_a', ${Math.floor(cap / 3)}, ${at(6)}), (${v.id}, ${v.owner}, 'test_credit_b', ${-cap}, ${at(8)}), (${v.id}, ${v.owner}, 'test_spend_c', ${cap - 15}, ${at(10)})`;
      });
      const probes = [...post.flatMap((w) => [w.t - 1, w.t + 1]), NOW - H];
      const walk = async () => { const r: number[] = []; for (const p of probes) r.push((await sql`select public.village_balance_walk(${v.id}, '2026-11-12 00:00:00+00', ${iso(p)}) b`)[0]!["b"] as number); r.push(await balance(v)); return r; };
      const full = await walk();
      const idx = post.map((_, i) => leg.length + i);
      const subsets = [[idx[0]!], [idx[2]!], [idx[5]!], [idx[0]!, idx[5]!], idx, [idx[1]!, idx[3]!], [idx[4]!]];
      for (const sub of subsets) {
        await sql.begin(async (tx) => {
          // simulate missing receipts inside a transaction that is rolled back; since 0161 a single DELETE is refused, so
          // the test switches the triggers off for this transaction only (session_replication_role = replica)
          await tx`set local session_replication_role = replica`;
          await tx`delete from public.wedding_receipts where seed_id = ${v.id} and wedding_index = any(${sub})`;
          const part: number[] = [];
          for (const p of probes) part.push((await tx`select public.village_balance_walk(${v.id}, '2026-11-12 00:00:00+00', ${iso(p)}) b`)[0]!["b"] as number);
          part.push((await tx`select public.village_balance(${v.id}) b`)[0]!["b"] as number);
          part.forEach((b, i) => { cmp++; expect(b, `cap ${cap}, missing ${sub.join(",")}, probe ${i}`).toBeLessThanOrEqual(full[i]!); if (b < full[i]!) lower++; });
          throw new Error("rollback");
        }).catch((e: Error) => { if (e.message !== "rollback") throw e; });
      }
    }
    expect(cmp).toBeGreaterThan(300);
    expect(lower).toBeGreaterThan(0);                          // the test measures something
  });
  it("B5 E2 is bound to the walk's tested event sources: a new source in village_balance_walk fails this test", async () => {
    const def = (await sql`select pg_get_functiondef('public.village_balance_walk(uuid,timestamptz,timestamptz)'::regprocedure) s`)[0]!["s"] as string;
    const sources = [...new Set([...def.matchAll(/FROM public\.([a-z_]+)/g)].map((m) => m[1]))].sort();
    // the event sources the E2 regression above covers (raids via village_raid_list, weddings via village_wedding_list;
    // seeds only for the founding date). A new source must be added to that test before E2 may rely on it.
    expect(sources).toEqual(["building_moves", "encounters", "gifts", "market_sales", "princely_tasks", "purchases", "quest_claims",
      "referrals", "seeds", "tax_receipts", "twin_works", "village_raid_list", "village_visits", "village_wedding_list", "wonder_finds"]);
  });

  // ---------- B8 / B9: purchase_material, the known Kontor case ----------
  it("B8/B9 purchase_material: pending never uses the stale stock — no surcharge, no material, every table unchanged; after the settlement the correct material", async () => {
    const s = await labWithStage(false);
    const h0 = await snapshot();
    const st0 = await resourceState(s.v);
    expect(st0.through).toBeNull();                             // the stale stock: resources never booked (0 / 0)
    expect(await buy(s.v, "hunter", { kontor_max: 100000 })).toBe(PENDING);
    expect(await snapshot()).toBe(h0);                          // purchases, ledger, state, stages, quota, receipts, … unchanged
    expect((await sql`select count(*)::int n from public.purchases where seed_id = ${s.v.id} and item = 'hunter'`)[0]!["n"]).toBe(0);
    // the right order: weddings, then the resource booking inside purchase_material — wood from the store, no Kontor
    await bookW2(s);
    let row: Record<string, unknown> = {};
    expect(await asPlayer(s.v, async (tx) => { row = (await tx`insert into public.purchases (seed_id, user_id, item, kontor_max) values (${s.v.id}, ${s.v.owner}, 'hunter', 100000) returning cost, material`)[0]!; })).toBe("ok");
    expect(row["cost"]).toBe(100);                              // the old fault charged 120 (Kontor surcharge 20)
    expect(row["material"]).toEqual({ wood: [5, 0], stone: [0, 0], kontor: 0 });  // the old fault stored [5, 5]
  });

  // ---------- B10: repeats and parallel calls ----------
  it("B10 repeated and parallel settlements, purchases and resource bookings never double anything", async () => {
    const s = await scenario({ w2: 500 });
    const rows = chain(s.v, [s.W2], s.NEXT, s.index2);
    const out = await Promise.all(Array.from({ length: 6 }, () => settle(s.v, rows, Date.now())));
    expect(out.reduce((a, r) => a + r.inserted, 0)).toBe(1);
    expect(out.every((r) => r.marked)).toBe(true);
    expect((await sql`select count(*)::int n from public.wedding_receipts where seed_id = ${s.v.id} and wedding_index = ${s.index2}`)[0]!["n"]).toBe(1);
    expect((await sql`select count(*)::int n from public.wedding_settlement where seed_id = ${s.v.id}`)[0]!["n"]).toBe(1);
    // parallel purchases of the same building: exactly one
    const buys = await Promise.all(Array.from({ length: 5 }, () => buy(s.v, "hunter")));
    expect(buys.filter((x) => x === "ok")).toHaveLength(1);
    expect((await sql`select count(*)::int n from public.purchases where seed_id = ${s.v.id} and item = 'hunter'`)[0]!["n"]).toBe(1);
    // parallel pending purchases: none stored
    const p = await scenario({ w2: 500 });
    await money(p.v, (await balance(p.v)) - 50, NOW - D);
    const pend = await Promise.all(Array.from({ length: 5 }, () => buy(p.v, "hunter")));
    expect(pend.every((x) => x === PENDING)).toBe(true);
    expect((await sql`select count(*)::int n from public.purchases where seed_id = ${p.v.id} and item = 'hunter'`)[0]!["n"]).toBe(0);
    // parallel resource bookings after the settlement: one books, the others find it current
    const l = await labWithStage(true);
    const today = new Date().toISOString().slice(0, 10);
    const rs = await Promise.all(Array.from({ length: 4 }, () => sql`select public.resource_refresh_try(${l.v.id}, ${today}::date) r`.then((x) => x[0]!["r"] as string)));
    expect(rs.filter((x) => x === "booked")).toHaveLength(1);
    expect(rs.filter((x) => x === "current")).toHaveLength(3);
    const dup = await sql`select ref, resource, kind, count(*)::int n from public.resource_ledger where seed_id = ${l.v.id} group by 1, 2, 3 having count(*) > 1`;
    expect(dup).toEqual([]);
  });

  // ---------- B11: a timeout and a client retry never double an action ----------
  it("B11 an action committed but answered with a timeout: a repeat is refused by the database, never booked twice", async () => {
    const s = await scenario({ w2: 500, complete: true });
    expect(await buy(s.v, "hunter")).toBe("ok");               // committed — imagine the response was lost
    expect(await buy(s.v, "hunter")).toMatch(/duplicate key|already/);  // a blind repeat cannot buy twice
    const other = await village();
    expect(await asPlayer(s.v, (tx) => tx`insert into public.gifts (from_seed, to_seed, user_id, kind) values (${s.v.id}, ${other.id}, ${s.v.owner}, 'gift')`)).toBe("ok");
    expect(await asPlayer(s.v, (tx) => tx`insert into public.gifts (from_seed, to_seed, user_id, kind) values (${s.v.id}, ${other.id}, ${s.v.owner}, 'gift')`)).toBe("one gift per day");
    expect((await sql`select count(*)::int n from public.purchases where seed_id = ${s.v.id} and item = 'hunter'`)[0]!["n"]).toBe(1);
  });

  // ---------- B12: one binding order for every path ----------
  it("B12 the catalog: no money check outside wedding_money_check, no resource booking that ignores its result", async () => {
    const fns = await sql`select p.proname, p.prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'`;
    const direct = fns.filter((f) => /village_balance\([^)]*\)\s*</.test(f["prosrc"] as string)).map((f) => f["proname"]);
    expect(direct).toEqual(["wedding_money_check"].filter((x) => direct.includes(x)));
    expect(direct.filter((x) => x !== "wedding_money_check")).toEqual([]);
    const refreshCallers = fns.filter((f) => /resource_refresh(_at)?\(/.test(f["prosrc"] as string)).map((f) => f["proname"] as string).sort();
    // resource_refresh → resource_refresh_at → resource_refresh_try (raises on pending); everything else uses the result
    expect(refreshCallers).toEqual(["resource_refresh"]);
    const tryCallers = fns.filter((f) => /resource_refresh_try\(/.test(f["prosrc"] as string)).map((f) => f["proname"] as string).sort();
    // (0163: the client RPCs are the versioned _v2 paths; their old signatures delegate to them or refuse)
    // (0165 P4: stift_close books the open days first and refuses on pending, see stiftung.pg.test.ts H-G6)
    expect(tryCallers).toEqual(["civic_raise_budget_v2", "purchase_material", "resource_overview_v2", "resource_refresh_at", "stift_close"]);
  });
  it("B12 the wedding answer (encounter_guard, server only) follows the same rule: booked live wedding, pending without proof, money after it", async () => {
    // the live wedding booked one hour ago, but by a call without the proof (as a server before Paket B): not verifiable
    const v = await village(), leg = await legacy(v);
    const W1 = { t: T + 12 * H, dowry: 41 }, LIVE = { t: NOW - H, dowry: 44 };
    await sql`select public.wedding_receipts_book(${v.id}, ${sql.json(chain(v, [...leg, W1, LIVE], NOW + 3 * D) as never)})`;
    await money(v, (await balance(v)) - 30, NOW - 2 * H);        // booked chest 30 < feast 60
    expect(await settledNow(v)).toBe(false);
    const feast = () => asServer((tx) => tx`insert into public.encounters (seed_id, user_id, event, choice) values (${v.id}, ${v.owner}, 'wedding', 'feast')`);
    expect(await feast()).toBe(PENDING);
    await settle(v, [], Date.now());                             // the proof (O2 step 3), nothing new to book
    expect(await settledNow(v)).toBe(true);
    expect(await feast()).toBe("not enough money");              // now a real lack of money
    await money(v, -100, NOW - H / 2);
    expect(await feast()).toBe("ok");
  });

  // ---------- B13: anchor, chain and proof stay consistent ----------
  it("B13 the proof is written only with a chain that carries it, matches the anchor, and stops counting when the chain changes", async () => {
    const s = await scenario({ w2: 500 });
    const v = s.v;
    const proof = async () => (await sql`select settled_through, quiet_until, anchor_index from public.wedding_settlement where seed_id = ${v.id}`)[0]!;
    const top = async () => (await sql`select wedding_index, next_at from public.wedding_receipts where seed_id = ${v.id} order by wedding_index desc limit 1`)[0]!;
    const p0 = await proof(), t0 = await top();
    expect(p0["anchor_index"]).toBe(t0["wedding_index"]);
    expect((p0["quiet_until"] as Date).getTime()).toBe((t0["next_at"] as Date).getTime());
    expect((p0["quiet_until"] as Date).getTime()).toBeGreaterThan((p0["settled_through"] as Date).getTime());
    // a claim beyond the next wedding is never written (W2 is due and not booked): the proof stays as it was
    expect(await settle(v, [], Date.now())).toMatchObject({ inserted: 0, marked: false });
    expect(await proof()).toEqual(p0);
    expect(await settledNow(v)).toBe(false);
    // inclusive / exclusive edges of the interval
    const at = async (t: number) => (await sql`select public.wedding_settled_at(${v.id}, ${iso(t)}) s`)[0]!["s"] as boolean;
    const thru = (p0["settled_through"] as Date).getTime(), quiet = (p0["quiet_until"] as Date).getTime();
    expect([await at(thru), await at(quiet - 1), await at(quiet)]).toEqual([true, true, false]);
    // a booking call that fails changes neither receipts nor proof (atomic)
    const bad = chain(v, [s.W2], s.NEXT, s.index2).map((r) => ({ ...r, occurred_at: iso(s.W2.t + 1) }));
    expect(await err(settle(v, bad, Date.now()))).toBe("wedding receipt breaks the anchor chain");
    expect(await proof()).toEqual(p0);
    // booking W2 moves anchor and proof together; settled_through only grows
    await bookW2(s);
    const p1 = await proof(), t1 = await top();
    expect(p1["anchor_index"]).toBe(t1["wedding_index"]);
    expect((p1["quiet_until"] as Date).getTime()).toBe(s.NEXT);
    expect((p1["settled_through"] as Date).getTime()).toBeGreaterThan(thru);
    expect(await settledNow(v)).toBe(true);
    // the chain changes behind the proof (a receipt removed by hand — since 0161 only with the triggers switched off, as
    // here): the proof no longer matches — not complete
    expect(await err(sql`delete from public.wedding_receipts where seed_id = ${v.id} and wedding_index = ${t1["wedding_index"]}`)).toBe("wedding receipts are kept");
    await sql.begin(async (tx) => { await tx`set local session_replication_role = replica`;
      await tx`delete from public.wedding_receipts where seed_id = ${v.id} and wedding_index = ${t1["wedding_index"]}`; });
    expect(await settledNow(v)).toBe(false);
    // a quarantine is never complete
    const q = await scenario({ w2: 500, complete: true });
    expect(await settledNow(q.v)).toBe(true);
    await sql`select public.wedding_quarantine_set(${q.v.id}, 'legacy_divergent', '{1}', '{}'::jsonb)`;
    expect(await settledNow(q.v)).toBe(false);
    expect(await err(settle(q.v, [], Date.now()))).toBe("wedding settlement quarantined");
  });
  it("B13 before the switch and before the first possible wedding nothing is pending; the proof table is service-role only", async () => {
    const young = await village({ ageDays: 1 });               // first wedding only on day 2
    expect(await settledNow(young)).toBe(true);
    expect((await sql`select public.wedding_settled_at(${young.id}, ${iso(T - 1)}) s`)[0]!["s"]).toBe(true);
    const [p] = await sql`select has_table_privilege('authenticated', 'public.wedding_settlement', 'SELECT') a,
      has_table_privilege('service_role', 'public.wedding_settlement', 'INSERT') si,
      has_function_privilege('authenticated', 'public.wedding_settle(uuid,jsonb,timestamptz)', 'EXECUTE') ae,
      has_function_privilege('authenticated', 'public.wedding_money_check(uuid,integer)', 'EXECUTE') am,
      has_function_privilege('service_role', 'public.wedding_settle(uuid,jsonb,timestamptz)', 'EXECUTE') se`;
    expect(p).toEqual({ a: false, si: false, ae: false, am: false, se: true });
  });

  // ---------- Abschluss Paket B, Punkt 1: Ratsbuch-Annahme ----------
  describe("R Ratsbuch-Annahme (encounter_guard mit request_id, ratsbuch_close, ratsbuch_refresh)", () => {
    const RT = ["ratsbuch_requests", "ratsbuch_state"];
    const snap = async () => (await snapshot()) + "|" + (await Promise.all(RT.map(rowsOf))).join("|");
    const request = async (v: V, kind: string, daysAgo = 0) => {
      const id = uid();
      await sql.begin(async (tx) => { await tx`set local session_replication_role = replica`;
        await tx`insert into public.ratsbuch_requests (id, seed_id, day, kind, status, created_at) values (${id}, ${v.id}, ${new Date(NOW - daysAgo * D).toISOString().slice(0, 10)}::date, ${kind}, 'open', now())`; });
      return id;
    };
    // what acceptRatsbuch (ratsbuch.server.ts) inserts, as the server role
    const accept = (v: V, req: string, event: string, choice: string) =>
      asServer((tx) => tx`insert into public.encounters (seed_id, user_id, event, choice, request_id) values (${v.id}, ${v.owner}, ${event}, ${choice}, ${req})`);
    beforeAll(async () => {
      await sql.unsafe(`create or replace function public.ratsbuch_since() returns timestamptz language sql stable set search_path to 'public'
        as $$ select timestamptz '${iso(NOW - 2 * D)}' $$`);
    });
    afterAll(async () => {
      await sql.unsafe(`create or replace function public.ratsbuch_since() returns timestamptz language sql stable set search_path to 'public'
        as $$ select '2100-01-04 00:00:00+00'::timestamptz $$`);
    });
    it("R1 a paid answer changes money: while pending it stores nothing at all (no encounter, no closed or refreshed request); after the settlement it books", async () => {
      const s = await scenario({ w2: 500 });
      await money(s.v, (await balance(s.v)) - 10, NOW - D);     // booked chest 10 < journeyman:host 30
      const req = await request(s.v, "journeyman");
      const h0 = await snap();
      expect(await accept(s.v, req, "journeyman", "host")).toBe(PENDING);
      expect(await snap()).toBe(h0);                             // incl. ratsbuch_requests/ratsbuch_state: the refresh inside the guard rolled back
      expect((await sql`select status from public.ratsbuch_requests where id = ${req}`)[0]!["status"]).toBe("open");
      await bookW2(s);
      const before = await balance(s.v);
      expect(await accept(s.v, req, "journeyman", "host")).toBe("ok");
      expect((await sql`select status from public.ratsbuch_requests where id = ${req}`)[0]!["status"]).toBe("accepted");
      expect((await sql`select cost from public.encounters where request_id = ${req}`)[0]!["cost"]).toBe(30);
      expect(await balance(s.v)).toBe(before - 30);              // the only money effect: the answer's price
    });
    it("R2 the free paths never touch money or resources: the free answer and the decline book no money row, also while pending", async () => {
      const s = await scenario({ w2: 500 });
      await money(s.v, (await balance(s.v)) - 10, NOW - D);
      const MONEY = ["purchases", "gifts", "twin_works", "building_moves", "resource_ledger", "civic_stages", "wedding_receipts", "wedding_settlement"];
      const moneyRows = async () => (await Promise.all(MONEY.map(rowsOf))).join("|");
      const m0 = await moneyRows(), b0 = await balance(s.v);
      const free = await request(s.v, "orphan");
      expect(await accept(s.v, free, "orphan", "apprentice")).toBe("ok");      // price 0: no money check, no money row
      expect((await sql`select cost from public.encounters where request_id = ${free}`)[0]!["cost"]).toBe(0);
      const dec = await request(s.v, "monk", 5);  // a day before ratsbuch_since: the refresh never creates it
      expect((await sql`select public.ratsbuch_decline(${s.v.id}, ${dec}) r`)[0]!["r"]).toBe(true);
      expect(await moneyRows()).toBe(m0);
      expect(await balance(s.v)).toBe(b0);
    });
  });

  // ---------- Abschluss Paket B, Punkt 2: Ereignisse mit identischem Zeitstempel ----------
  describe("Z identical timestamps: one deterministic order (t, class, key) in SQL and TypeScript; within a class the order cannot matter", () => {
    type Ev = { t: number; r: number; v: number; k: string };
    /** TypeScript walkChest, the client mirror of village_balance_walk (economy.ts). */
    let walkChest: (start: number, events: Ev[], capAt: (t: number) => number) => number;
    beforeAll(async () => { ({ walkChest } = await import("@/game/economy")); });
    const walkAt = async (v: V, t: number) => (await sql`select public.village_balance_walk(${v.id}, '2026-11-12 00:00:00+00', ${iso(t)}) b`)[0]!["b"] as number;
    const row = async (tx: postgres.TransactionSql, v: V, cost: number, at: number, id?: string) =>
      tx`insert into public.purchases (id, seed_id, user_id, item, cost, created_at) values (${id ?? crypto.randomUUID()}, ${v.id}, ${v.owner}, ${"test_tie_" + ++n}, ${cost}, ${iso(at)})`;
    /**
     * A village whose chest sits at `start` just before the instant `tt`, which is also one of its tax days (tax income
     * 150) and the instant of a booked wedding (dowry 300); at `tt` further: two credits (+200, +90), a received gift (+25),
     * two expenses (−250, −60). `ids` chooses the purchase ids, i.e. the key order inside a class.
     */
    const tie = async (cap: number, chests: string[], start: "cap" | "cap-20" | "zero", ids: [string, string, string, string]) => {
      const v = await village({ ageDays: 10, noRaids: true }), other = await village();
      const c0 = ((await sql`select created_at from public.seeds where id = ${v.id}`)[0]!["created_at"] as Date).getTime();
      let day = Math.ceil((T + 12 * H - c0) / D); const tt = c0 + day * D;               // a tax day after the switch
      const leg = await legacy(v);
      await settle(v, chain(v, [...leg, { t: tt, dowry: 300 }], NOW + D), NOW);
      await sql.begin(async (tx) => {
        await tx`set local session_replication_role = replica`;
        for (const c of chests) await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, ${c}, 0, ${iso(T - D)})`;
        // the chest before tt: deep into the red, then a credit the cap cuts to exactly the cap, then down to the start
        await row(tx, v, 10_000_000, tt - 3 * H); await row(tx, v, -20_000_000, tt - 2 * H);
        if (start !== "cap") await row(tx, v, start === "zero" ? cap : 20, tt - H);
        await tx`insert into public.tax_receipts (seed_id, day, population, households, income, assessed_at, version) values (${v.id}, ${day}, 50, 10, 150, ${iso(tt)}, 1)`;
        await row(tx, v, -200, tt, ids[0]); await row(tx, v, -90, tt, ids[1]);
        await row(tx, v, 250, tt, ids[2]); await row(tx, v, 60, tt, ids[3]);
        await tx`insert into public.gifts (from_seed, to_seed, user_id, kind, amount, created_at) values (${other.id}, ${v.id}, ${other.owner}, 'gift', 25, ${iso(tt)})`;
      });
      void day;
      return { v, tt };
    };
    const capOf = (cap: number) => () => cap;
    const EVENTS = (tt: number): Ev[] => [
      { t: tt, r: 0, v: 150, k: "d1" }, { t: tt, r: 1, v: 300, k: "w1" },
      { t: tt, r: 2, v: 200, k: "a" }, { t: tt, r: 2, v: 90, k: "b" }, { t: tt, r: 2, v: 25, k: "g" },
      { t: tt, r: 3, v: -250, k: "c" }, { t: tt, r: 3, v: -60, k: "e" },
    ];
    // purchase ids whose first character fixes the key order: ascending in one village, reversed in the other
    const ids = (lead: string[]) => lead.map((c) => c.repeat(8) + crypto.randomUUID().slice(8)) as [string, string, string, string];
    const LOW = () => ids(["1", "2", "3", "4"]), HIGH = () => ids(["f", "e", "d", "c"]);
    for (const [cap, chests] of [[1200, []], [4000, ["chest2"]], [10000, ["chest2", "chest3"]], [25000, ["chest2", "chest3", "chest4"]]] as [number, string[]][]) {
      it(`Z cap ${cap}: SQL = TypeScript at the same instant (at the cap, 20 below, zero); reversed keys give the same chest`, async () => {
        let bites = 0;
        for (const start of ["cap", "cap-20", "zero"] as const) {
          const a = await tie(cap, chests, start, LOW()), b = await tie(cap, chests, start, HIGH());
          const startA = await walkAt(a.v, a.tt - 1), startB = await walkAt(b.v, b.tt - 1);
          expect(startA).toBe(start === "cap" ? cap : start === "cap-20" ? cap - 20 : 0);
          expect(startB).toBe(startA);
          const sqlA = await walkAt(a.v, a.tt), sqlB = await walkAt(b.v, b.tt);
          expect(sqlB).toBe(sqlA);                                // key order inside a class (ids, collation) does not matter
          const ts = walkChest(startA, EVENTS(a.tt), capOf(cap));
          expect(sqlA).toBe(ts);                                  // SQL and TypeScript agree
          // every permutation inside the classes gives the same result (the class functions commute) …
          const shuffled = EVENTS(a.tt).map((e, i) => ({ ...e, k: String.fromCharCode(122 - i) }));
          expect(walkChest(startA, shuffled, capOf(cap))).toBe(ts);
          // … but the class order matters at the cap: debits before credits would give another chest. Both sides use
          // credits first (r 0–2), then debits (r 3), then raids (r 4), so this never happens.
          const debitsFirst = EVENTS(a.tt).map((e) => (e.r === 3 ? { ...e, r: -1 } : e));
          if (walkChest(startA, debitsFirst, capOf(cap)) !== ts) bites++;
        }
        expect(bites).toBeGreaterThan(0);                         // the test would notice another class order
      });
    }
    it("Z the same-instant order is written down identically in both places", async () => {
      const def = (await sql`select pg_get_functiondef('public.village_balance_walk(uuid,timestamptz,timestamptz)'::regprocedure) s`)[0]!["s"] as string;
      expect(def).toContain("ORDER BY t, r, k");
      expect(def).toContain("CASE WHEN q.v > 0 THEN 2 ELSE 3 END");
      const { readFileSync } = await import("node:fs");
      const eco = readFileSync(new globalThis.URL("../game/economy.ts", import.meta.url), "utf8");
      expect(eco).toContain("a.t - b.t || a.r - b.r ||");
      expect(eco).toContain("r: v > 0 ? 2 : 3");
    });
  });
});

// ---------- before the switch (today's production state): 0162 changes nothing ----------
d("Paket B – vor dem Umschaltzeitpunkt (Platzhalter 2100): 0162 verändert nichts (Vergleich mit einem Schema bis 0160)", () => {
  const A = `paketb_vor_${process.pid}_${Date.now()}`, B = `paketb_ohne_${process.pid}_${Date.now()}`;
  let withB: postgres.Sql, without: postgres.Sql;
  beforeAll(async () => {
    withB = postgres(await buildFullSchema(BASE!, A), { max: 2, onnotice: () => {} });
    without = postgres(await buildFullSchema(BASE!, B, "0161_hochzeit_belegschutz"), { max: 2, onnotice: () => {} });
  }, 120000);
  afterAll(async () => { await withB.end(); await without.end(); await dropDatabase(BASE!, A); await dropDatabase(BASE!, B); });

  /** The same lab village (same ids, same rows) with a site, an open Gemeindebau stage and a chest of `cash` Mark. */
  const prepare = async (sql: postgres.Sql, id: string, owner: string, cash: number) => {
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into public.seeds (id, user_id, owner, name, x, y, realm, created_at) values (${id}, ${owner}, 'Test', 'Vergleich', 300, 300, 'lab', ${iso(NOW - 150 * D)})`;
      await tx`insert into public.village_sites (seed_id, way, certified_at) values (${id}, 'grain', ${iso(NOW - 100 * D)})`;
      await tx`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days, wood_got, stone_got, kontor_spent, opened_at, funded_at)
        values (${id}, 'spital1', 500, 1000, 400, 300, 5, 0, 0, 0, ${iso(NOW - 6 * D)}, ${iso(NOW - 5 * D)})`;
      const bal = (await tx`select public.village_balance(${id}) b`)[0]!["b"] as number;
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${id}, ${owner}, 'test_money_vgl', ${bal - cash}, ${iso(NOW - 4 * D)})`;
    });
  };
  const state = async (sql: postgres.Sql, id: string) => ({
    // rows of a purchase carry its random id and its own now(): compared without them (same purchase, same amounts)
    ledger: (await sql`select resource, kind, ref, amount, at from public.resource_ledger where seed_id = ${id} order by resource, kind, amount, ref`)
      .map((r) => (/^[0-9a-f-]{36}$/.test(r["ref"] as string) ? { resource: r["resource"], kind: r["kind"], amount: r["amount"], ref: "purchase" } : { ...r })),
    stage: await sql`select wood_got, stone_got, kontor_spent, material_at from public.civic_stages where seed_id = ${id}`,
    kontor: await sql`select item, cost, created_at from public.purchases where seed_id = ${id} and item like 'spital1:k%' order by item`,
    balance: (await sql`select public.village_balance(${id}) b`)[0]!["b"],
  });
  const buy = (sql: postgres.Sql, id: string, owner: string, item: string) => sql.begin(async (tx) => {
    await tx`select set_config('test.uid', ${owner}, true)`; await tx.unsafe("set local role authenticated");
    return (await tx`insert into public.purchases (seed_id, user_id, item, kontor_max) values (${id}, ${owner}, ${item}, 100000) returning cost, material`)[0];
  }).then((r) => ({ ok: true, cost: r!["cost"], material: r!["material"] }), (e: Error) => ({ ok: false, err: e.message }));

  it("resource booking with an open Gemeindebau, purchase_material and a refused purchase give byte-identical results", async () => {
    for (const cash of [5000, 60]) {
      const id = uid(), owner = uid();
      await prepare(withB, id, owner, cash); await prepare(without, id, owner, cash);
      expect((await withB`select public.wedding_settled_at(${id}, now()) s`)[0]!["s"]).toBe(true); // before the switch: complete
      const today = new Date().toISOString().slice(0, 10);
      expect((await withB`select public.resource_refresh_try(${id}, ${today}::date) r`)[0]!["r"]).toBe("booked");
      await without`select public.resource_refresh_at(${id}, ${today}::date)`;
      expect(await state(withB, id)).toEqual(await state(without, id));
      const [x, y] = [await buy(withB, id, owner, "hunter"), await buy(without, id, owner, "hunter")];
      expect(x).toEqual(y);
      const [p, q] = [await buy(withB, id, owner, "herbs"), await buy(without, id, owner, "herbs")];  // 90: too expensive for the 60-Mark chest (after the hunter)
      expect(p).toEqual(q);
      if (cash === 60) expect(p).toEqual({ ok: false, err: "not enough money" });                     // never pending before the switch
      expect(await state(withB, id)).toEqual(await state(without, id));
    }
  });
});
