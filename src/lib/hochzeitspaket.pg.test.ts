// Hochzeitspaket (migration 0160: base part, with Paket A2 applied on top) against a throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...).
// Loads the real functions from the migration files: village_civic_wealth (0044 + 0046/0050 patches), the 0107 wedding
// list (kept as village_wedding_list_0107 for comparison), 0096 village_weddings, 0127 receipts, 0118 chest walk,
// the 0138 encounter guard, then 0160. Proves:
//   parity  — the legacy SQL calendar equals TypeScript weddingCalendar for all food/Gemeinwesen combinations;
//   no-op   — with the placeholder switch, 0160 returns exactly what 0107 returned (list, walk, guard input);
//   switch  — from the switch the database reads only receipts: list, chest walk and guard follow them, nothing is
//             computed after the switch, the TS calendar and SQL agree across the switch end to end (also lab);
//   records — receipts cannot be rewritten, dated in the future or booked twice (also in parallel);
//   checks  — wedding_receipt_diff / wedding_receipt_inventory report missing and divergent receipts.
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Seed } from "@/game/world";
import { weddingCalendar, WEDDING_SWITCH_SINCE, WEDDING_SWITCH_LAB_SINCE } from "@/game/weddings";
import { weddingReceiptRows } from "@/game/wedding-receipts";
import { block, mig, prepareWeddingDb } from "./wedding-pg-schema";

const URL = process.env["BUILD_MAIL_TEST_PG"];
if (!URL && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: Hochzeitspaket DB tests must run");
const d = URL ? describe : describe.skip;

const D = 864e5, H = 3.6e6, FOOD4 = ["fisher", "hunter", "granary", "dairy"], GEMEIN = ["herbs", "healer", "library", "badestube", "beginen"];
const OWNER = "00000000-0000-0000-0000-0000000000c1";
let n = 0;
const nextId = () => `00000000-0000-0000-0000-${(0xd00000 + ++n).toString(16).padStart(12, "0")}`;

d("Hochzeitspaket 0160 (real PostgreSQL)", () => {
  let sql: postgres.Sql;
  let admin: postgres.Sql | null = null;
  let dbName: string | null = null;

  type V = { seed: Seed; charter?: { path: string; at: number } };
  /** Creates the village in the DB and returns the matching TypeScript Seed. */
  const make = async (created: number, bought: [string, number][], opts: { realm?: string; owner?: string | null; charter?: [string, number] } = {}): Promise<V> => {
    const id = nextId(), realm = opts.realm ?? "europe", owner = opts.owner === undefined ? OWNER : opts.owner;
    await sql`insert into public.seeds (id, user_id, created_at, realm) values (${id}, ${owner}, ${new Date(created).toISOString()}, ${realm})`;
    for (const [item, at] of bought) await sql`insert into public.purchases (seed_id, item, created_at) values (${id}, ${item}, ${new Date(at).toISOString()})`;
    if (opts.charter) await sql`insert into public.charters (seed_id, path, created_at) values (${id}, ${opts.charter[0]}, ${new Date(opts.charter[1]).toISOString()})`;
    const seed = { id, user_id: owner, realm, x: 0, y: 0, created_at: new Date(created).toISOString(), bought: bought.map(([item, at]) => ({ item, at })),
      ...(opts.charter ? { charter: { path: opts.charter[0], at: opts.charter[1] } } : {}) } as unknown as Seed;
    return { seed };
  };
  const list = async (id: string, at: number, fn = "village_wedding_list") =>
    (await sql.unsafe(`select t, dowry from public.${fn}($1, $2, array['fisher','hunter','granary','dairy']) order by t`, [id, new Date(at).toISOString()]))
      .map((r) => [new Date(r["t"] as string).getTime(), r["dowry"] as number]);
  const tsList = (s: Seed, at: number) => weddingCalendar(s, at).map((w) => [w.at, w.dowry]);
  const insertReceipts = async (rows: ReturnType<typeof weddingReceiptRows>) => {
    for (const r of rows) await sql`insert into public.wedding_receipts ${sql(r)} on conflict (seed_id, wedding_index) do nothing`;
  };
  const setSwitch = (europe: string, lab: string) => sql.unsafe(`create or replace function public.wedding_switch_since(_realm text) returns timestamptz
      language sql immutable set search_path to 'public' as $$ select case when _realm = 'lab' then timestamptz '${lab}' else timestamptz '${europe}' end $$`);
  const asServer = (id: string, event: string, choice: string) =>
    sql.begin(async (tx) => {
      await tx`select set_config('test.role', 'service_role', true)`;
      await tx`insert into public.encounters (seed_id, user_id, event, choice) values (${id}, ${OWNER}, ${event}, ${choice})`;
    }).then(() => "ok").catch((e: Error) => e.message);

  beforeAll(async () => {
    // own database when allowed, so this file never collides with other DB tests on the shared public schema
    admin = postgres(URL!, { max: 1, onnotice: () => {} });
    dbName = `hochzeit_${process.pid}_${Date.now()}`;
    try {
      await admin.unsafe(`create database ${dbName}`);
      const u = new globalThis.URL(URL!); u.pathname = `/${dbName}`;
      sql = postgres(u.toString(), { max: 6, onnotice: () => {} });
    } catch { dbName = null; sql = postgres(URL!, { max: 6, onnotice: () => {} }); }
    await prepareWeddingDb(sql);
  }, 120000);
  afterAll(async () => {
    await sql.end();
    if (admin) { if (dbName) await admin.unsafe(`drop database if exists ${dbName} with (force)`).catch(() => {}); await admin.end(); }
  });

  it("the switch dates in 0160 equal weddings.ts (both on the placeholder)", async () => {
    const [r] = await sql`select public.wedding_switch_since('lab') as lab, public.wedding_switch_since('europe') as eu, public.wedding_switch_since('asia-2') as as2`;
    expect(new Date(r!["lab"] as string).getTime()).toBe(WEDDING_SWITCH_LAB_SINCE);
    expect(new Date(r!["eu"] as string).getTime()).toBe(WEDDING_SWITCH_SINCE);
    expect(new Date(r!["as2"] as string).getTime()).toBe(WEDDING_SWITCH_SINCE);
  });

  it("the encounter guard's wedding check is the same in 0138 (tested here) and the live 0141", () => {
    const branch = (t: string) => block(t, "SELECT w.last_at INTO wed_at FROM public.village_weddings(NEW.seed_id, now()) w;", "RAISE EXCEPTION 'already decided'; END IF;");
    expect(branch(mig("0141_ratsbuch.sql"))).toBe(branch(mig("0138_encounters_server_only.sql")));
  });

  // ---------- parity and no-op before the switch ----------
  const AT = Date.parse("2026-11-20T12:00:00Z");
  const villages: V[] = [];
  it("parity: legacy SQL calendar = TypeScript weddingCalendar for every food/Gemeinwesen combination", async () => {
    let k = 0;
    for (let food = 0; food <= 4; food++) for (let mask = 0; mask < 32; mask++) {
      const c0 = AT - (120 + 7 * (k % 30)) * D - (k % 24) * H - (k % 7) * 1001;
      const bought: [string, number][] = [
        ...FOOD4.slice(0, food).map((i, j) => [i, c0 + (3 + 11 * j) * D + j * 37_000] as [string, number]),
        ...GEMEIN.filter((_, j) => mask & (1 << j)).map((i, j) => [i, c0 + (9 + 13 * j) * D + j * 1234] as [string, number]),
      ];
      if (k % 3 === 0) bought.push(["school", c0 + 30 * D]);
      if (k % 5 === 0) bought.push(["guildhall", c0 + 50 * D], ["markethall", c0 + 60 * D]);
      if (k % 7 === 0) bought.push(["rank2", c0 + 70 * D], ["title1", c0 + 80 * D]);
      if (k % 11 === 0) bought.push(["orangery3", c0 + 40 * D], ["university4", c0 + 41 * D], ["woodcamp", c0 + 42 * D]);
      const opts = k % 4 === 0 ? { charter: [["trade", "craft", "farm"][k % 3]!, c0 + 20 * D] as [string, number] } : {};
      const v = await make(c0, bought, opts);
      villages.push(v);
      expect(await list(v.seed.id, AT), `village ${k}: ${food} food, mask ${mask}`).toEqual(tsList(v.seed, AT));
      k++;
    }
    for (const owner of [null, OWNER]) {
      const v = await make(AT - 400 * D, [["library", AT - 399 * D], ["fisher", AT - 300 * D]], { owner });
      villages.push(v);
      expect(await list(v.seed.id, AT)).toEqual(tsList(v.seed, AT));
    }
    expect(villages.length).toBe(162);
  }, 120000);

  it("no-op: with the placeholder switch 0160 returns exactly what 0107 did (list, chest walk, guard input)", async () => {
    for (const v of villages) {
      const id = v.seed.id;
      expect(await list(id, AT)).toEqual(await list(id, AT, "village_wedding_list_0107"));
      const [w] = await sql`select public.village_balance_walk(${id}, timestamptz '2026-11-12 00:00:00+00', now()) as a,
                                   public.village_balance_walk_0107(${id}, timestamptz '2026-11-12 00:00:00+00', now()) as b`;
      expect(w!["a"]).toBe(w!["b"]);
      const [g] = await sql`select (select last_at from public.village_weddings(${id}, now())) as a,
                                   (select max(t) from public.village_wedding_list_0107(${id}, now(), array['fisher','hunter','granary','dairy'])) as b`;
      expect(g!["a"]).toEqual(g!["b"]);
    }
  }, 120000);

  // ---------- across the switch, end to end with TypeScript ----------
  it("across the switch (placeholder 2100-01-04): SQL computes up to it and reads the TS receipts after it", async () => {
    await sql.unsafe("alter table public.wedding_receipts disable trigger wedding_receipts_guard"); // receipts dated 2100
    try {
      const c0 = Date.UTC(2099, 9, 1), at = WEDDING_SWITCH_SINCE + 150 * D;
      const base: [string, number][] = [["fisher", c0 + D], ["hunter", c0 + D], ["granary", c0 + D], ["school", c0 + D]];
      for (const extra of [[], ["herbs"], ["library"], ["badestube"], ["beginen"], ["herbs", "healer", "library", "badestube", "beginen"]]) {
        const v = await make(c0, [...base, ...extra.map((i) => [i, c0 + 2 * D] as [string, number])]);
        const rows = weddingReceiptRows(v.seed, at);
        // nothing booked after the switch: the database knows no wedding there (it never computes one)
        const before = await list(v.seed.id, at);
        expect(before.every(([t]) => t! < WEDDING_SWITCH_SINCE), extra.join(",")).toBe(true);
        expect(before).toEqual(tsList(v.seed, at).filter(([t]) => t! < WEDDING_SWITCH_SINCE));
        await insertReceipts(rows);
        expect(await list(v.seed.id, at), extra.join(",")).toEqual(tsList(v.seed, at));
      }
      // lab: no receipts before its switch (the loop pays them), receipts after it
      const lab = await make(c0, [...base, ["library", c0 + 2 * D]], { realm: "lab" });
      await insertReceipts(weddingReceiptRows(lab.seed, at));
      expect(await list(lab.seed.id, at)).toEqual(tsList(lab.seed, at));
      // unowned: raw era, no receipts, loop for all time as before
      const free = await make(c0, [["library", c0 + D]], { owner: null });
      expect(await list(free.seed.id, at)).toEqual(tsList(free.seed, at));
      expect(await list(free.seed.id, at)).toEqual(await list(free.seed.id, at, "village_wedding_list_0107"));
    } finally {
      await sql.unsafe("alter table public.wedding_receipts enable trigger wedding_receipts_guard");
    }
  }, 120000);

  // ---------- switch active now: money and guard read receipts ----------
  it("switch active: chest walk, village_weddings and encounter_guard follow the receipts only", async () => {
    const T = Date.now() - 10 * D;
    await setSwitch(new Date(T).toISOString(), "2100-01-04 00:00:00+00");
    try {
      const v = await make(Date.now() - 60 * D, [["fisher", Date.now() - 59 * D], ["herbs", Date.now() - 59 * D]]);
      const id = v.seed.id;
      const legacy = (await list(id, Date.now(), "village_wedding_list_0107")).filter(([t]) => t! < T);
      expect(legacy.length).toBeGreaterThan(2);
      // the legacy part (as the settle writes it) …
      for (const [i, [t, dw]] of legacy.entries())
        await sql`insert into public.wedding_receipts (seed_id, wedding_index, occurred_at, dowry, is_grand, is_town, version)
          values (${id}, ${i}, ${new Date(t!).toISOString()}, ${dw!}, true, false, 1)`;
      const walk = async () => (await sql`select public.village_balance(${id}) as b`)[0]!["b"] as number;
      const afterLegacy = await walk();
      // … no wedding computed after the switch, even though the old loop would have one
      const old = (await list(id, Date.now(), "village_wedding_list_0107")).filter(([t]) => t! >= T);
      expect(old.length).toBeGreaterThan(0);
      expect(await list(id, Date.now())).toEqual(legacy);
      expect(await asServer(id, "wedding", "feast")).toBe("no wedding");
      // a unified-rule wedding booked by the server one hour ago: money, list and guard see exactly it
      const fresh = Date.now() - H, mid = T + 2 * D;
      // (0160 / Paket A2: every version-2 receipt carries its anchor next_at, and the next one starts there)
      await sql`insert into public.wedding_receipts (seed_id, wedding_index, occurred_at, dowry, is_grand, is_town, version, next_at) values
        (${id}, ${legacy.length}, ${new Date(mid).toISOString()}, 41, true, false, 2, ${new Date(fresh).toISOString()}),
        (${id}, ${legacy.length + 1}, ${new Date(fresh).toISOString()}, 42, true, false, 2, ${new Date(fresh + 3 * D).toISOString()})`;
      expect(await list(id, Date.now())).toEqual([...legacy, [mid, 41], [fresh, 42]]);
      expect(await walk()).toBe(afterLegacy + 41 + 42);
      const [w] = await sql`select n, dowry, last_at from public.village_weddings(${id}, now())`;
      expect(w!["n"]).toBe(legacy.length + 2);
      expect(new Date(w!["last_at"] as string).getTime()).toBe(fresh);
      expect(await asServer(id, "wedding", "feast")).toBe("ok");
      expect(await asServer(id, "wedding", "gift")).toBe("already decided");
      // the shadow check still compares only what SQL computes (before the switch): nothing to report
      expect(await sql`select * from public.wedding_receipt_diff(${id})`).toHaveLength(0);
      const [inv] = await sql`select * from public.wedding_receipt_inventory() where seed_id = ${id}`;
      expect([inv!["belege"], inv!["fehlt"], inv!["weicht_ab"], inv!["luecken"], inv!["doppelt"]]).toEqual([legacy.length + 2, 0, 0, 0, 0]);
    } finally {
      await setSwitch("2100-01-04 00:00:00+00", "2100-01-04 00:00:00+00");
    }
  }, 120000);

  // ---------- receipts as records ----------
  it("receipts: never rewritten, never in the future, never twice (also in parallel)", async () => {
    const v = await make(Date.now() - 90 * D, [["fisher", Date.now() - 89 * D]]);
    const rows = weddingReceiptRows(v.seed, Date.now());
    expect(rows.length).toBeGreaterThan(3);
    await Promise.all([1, 2, 3, 4, 5].map(() => sql.begin(async (tx) => {
      for (const r of rows) await tx`insert into public.wedding_receipts ${tx(r)} on conflict (seed_id, wedding_index) do nothing`;
    })));
    const [c] = await sql`select count(*)::int as n, count(distinct wedding_index)::int as i from public.wedding_receipts where seed_id = ${v.seed.id}`;
    expect([c!["n"], c!["i"]]).toEqual([rows.length, rows.length]);
    const err = (p: Promise<unknown>) => p.then(() => "ok").catch((e: Error) => e.message);
    expect(await err(sql`update public.wedding_receipts set dowry = dowry + 1 where seed_id = ${v.seed.id}`)).toBe("wedding receipts are immutable");
    expect(await err(sql`insert into public.wedding_receipts (seed_id, wedding_index, occurred_at, dowry, is_grand, is_town)
      values (${v.seed.id}, 999, now() + interval '1 day', 35, true, false)`)).toBe("wedding receipt in the future");
    // a second receipt for an instant: since 0160 the anchor chain refuses it before UNIQUE(seed_id, occurred_at) is reached
    expect(await err(sql`insert into public.wedding_receipts (seed_id, wedding_index, occurred_at, dowry, is_grand, is_town)
      values (${v.seed.id}, ${rows.length}, ${rows[0]!.occurred_at}, 35, true, false)`)).toBe("wedding receipt breaks the anchor chain");
    expect(await sql`select * from public.wedding_receipt_diff(${v.seed.id})`).toHaveLength(0);
  });

  it("checks: inventory reports missing and divergent receipts per village", async () => {
    const miss = await make(Date.now() - 90 * D, [["hunter", Date.now() - 80 * D]]);
    const rows = weddingReceiptRows(miss.seed, Date.now());
    await insertReceipts(rows.slice(0, rows.length - 2));
    const bad = await make(Date.now() - 90 * D, [["hunter", Date.now() - 80 * D]]);
    const b = weddingReceiptRows(bad.seed, Date.now());
    await insertReceipts([...b.slice(0, 1), { ...b[1]!, dowry: b[1]!.dowry + 5 }, ...b.slice(2)]);
    const inv = await sql`select * from public.wedding_receipt_inventory() where seed_id in (${miss.seed.id}, ${bad.seed.id}) order by seed_id`;
    expect(inv.map((r) => [r["fehlt"], r["weicht_ab"], r["doppelt"]])).toEqual([[2, 0, 0], [0, 1, 0]]);
    const diff = await sql`select * from public.wedding_receipt_diff(${miss.seed.id})`;
    expect(diff.map((r) => r["receipt_at"])).toEqual([null, null]);
    // the sweep would add exactly those two: afterwards the village is in sync
    await insertReceipts(rows);
    expect(await sql`select * from public.wedding_receipt_diff(${miss.seed.id})`).toHaveLength(0);
  });

  // ---------- Korrektur B: version boundary enforced by PostgreSQL ----------
  describe("Korrektur B: receipt version boundary in the database", () => {
    const T = Date.now() - 10 * D;
    const err = (p: Promise<unknown>) => p.then(() => "ok").catch((e: Error) => e.message);
    // since 0160 (Paket A2) every receipt carries its anchor next_at; a version-2 receipt cannot be booked without it
    // (version-1 rows here stand for receipts booked before 0160: no anchor)
    const rec = (id: string, i: number, at: number, version: number, dowry = 30, next: number | null = version === 2 ? at + H : null) =>
      ({ seed_id: id, wedding_index: i, occurred_at: new Date(at).toISOString(), dowry, is_grand: true, is_town: false, version, next_at: next == null ? null : new Date(next).toISOString() });
    const ins = (r: ReturnType<typeof rec>, tx: postgres.Sql | postgres.TransactionSql = sql) =>
      tx`insert into public.wedding_receipts ${tx(r)} on conflict (seed_id, wedding_index) do nothing`;
    beforeAll(async () => { await setSwitch(new Date(T).toISOString(), new Date(T).toISOString()); });
    afterAll(async () => { await setSwitch("2100-01-04 00:00:00+00", "2100-01-04 00:00:00+00"); });

    it("B1 version 1 before the switch is accepted; B2 version 2 from the switch is accepted", async () => {
      const v = await make(Date.now() - 60 * D, [["fisher", Date.now() - 59 * D]]);
      expect(await err(ins(rec(v.seed.id, 0, T - D, 1)))).toBe("ok");
      expect(await err(ins(rec(v.seed.id, 1, T, 2, 30, T + D)))).toBe("ok"); // exactly at the switch: new rule
      expect(await err(ins(rec(v.seed.id, 2, T + D, 2)))).toBe("ok");
    });
    it("B3 version 1 from the switch is refused (also the default version and exactly at T)", async () => {
      const v = await make(Date.now() - 60 * D, [["fisher", Date.now() - 59 * D]]);
      expect(await err(ins(rec(v.seed.id, 0, T, 1)))).toBe("wedding receipt version 2 required from the switch");
      expect(await err(sql`insert into public.wedding_receipts (seed_id, wedding_index, occurred_at, dowry, is_grand, is_town)
        values (${v.seed.id}, 1, ${new Date(T + D).toISOString()}, 30, true, false)`)).toBe("wedding receipt version 2 required from the switch");
      expect(await sql`select 1 from public.wedding_receipts where seed_id = ${v.seed.id}`).toHaveLength(0);
    });
    it("B4 version 2 before the switch is refused", async () => {
      const v = await make(Date.now() - 60 * D, [["fisher", Date.now() - 59 * D]]);
      expect(await err(ins(rec(v.seed.id, 0, T - 1, 2)))).toBe("wedding receipt version 1 required before the switch");
    });
    it("B3 an old worker after the switch books nothing: its one statement (all rows, version 1) fails as a whole", async () => {
      const v = await make(Date.now() - 60 * D, [["fisher", Date.now() - 59 * D], ["herbs", Date.now() - 59 * D]]);
      // what the code on main sends: the whole calendar, every row version 1, one upsert
      const legacy = (await list(v.seed.id, Date.now(), "village_wedding_list_0107"));
      const rows = legacy.map(([t, dw], i) => rec(v.seed.id, i, t!, 1, dw!));
      expect(rows.some((r) => Date.parse(r.occurred_at) >= T)).toBe(true);
      expect(await err(sql`insert into public.wedding_receipts ${sql(rows)} on conflict (seed_id, wedding_index) do nothing`))
        .toBe("wedding receipt version 2 required from the switch");
      expect(await sql`select 1 from public.wedding_receipts where seed_id = ${v.seed.id}`).toHaveLength(0);
      // and the money still sees no wedding after the switch (the database never computes one there)
      expect((await list(v.seed.id, Date.now())).every(([t]) => t! < T)).toBe(true);
    });
    it("B5 mixed stock: chest walk, list and guard use the legacy loop before T and only version-2 receipts from T — never a version-1 fallback", async () => {
      const v = await make(Date.now() - 60 * D, [["fisher", Date.now() - 59 * D], ["herbs", Date.now() - 59 * D]]);
      const id = v.seed.id;
      const legacy = (await list(id, Date.now(), "village_wedding_list_0107")).filter(([t]) => t! < T);
      for (const [i, [t, dw]] of legacy.entries()) await ins(rec(id, i, t!, 1, dw!));
      const balance = async () => (await sql`select public.village_balance(${id}) as b`)[0]!["b"] as number;
      const base = await balance();
      // a stray version-1 receipt after T (e.g. written before the trigger existed): must not count, not even as fallback
      const at = Date.now() - H;
      await sql.unsafe("alter table public.wedding_receipts disable trigger wedding_receipts_guard");
      try { await ins(rec(id, legacy.length, at, 1, 77)); }
      finally { await sql.unsafe("alter table public.wedding_receipts enable trigger wedding_receipts_guard"); }
      expect(await list(id, Date.now())).toEqual(legacy);
      expect(await balance()).toBe(base);
      expect(await asServer(id, "wedding", "feast")).toBe("no wedding");
      const [inv] = await sql`select falsche_version from public.wedding_receipt_inventory() where seed_id = ${id}`;
      expect(inv!["falsche_version"]).toBe(1);
      // a valid version-2 receipt from T: counted, guard open
      // remove the stray row again (since 0161 only with the H7 trigger disabled — a test-only step, like its insertion)
      await sql.unsafe("alter table public.wedding_receipts disable trigger wedding_receipts_keep");
      try { await sql`delete from public.wedding_receipts where seed_id = ${id} and wedding_index = ${legacy.length}`; }
      finally { await sql.unsafe("alter table public.wedding_receipts enable trigger wedding_receipts_keep"); }
      await ins(rec(id, legacy.length, at, 2, 44));
      expect(await list(id, Date.now())).toEqual([...legacy, [at, 44]]);
      expect(await balance()).toBe(base + 44);
      expect(await asServer(id, "wedding", "feast")).toBe("ok");
    });
    it("B6 parallel and repeated writes: each index once, the wrong version never wins, nothing is rewritten", async () => {
      const v = await make(Date.now() - 60 * D, [["fisher", Date.now() - 59 * D]]);
      const id = v.seed.id;
      const good = [0, 1, 2, 3].map((i) => rec(id, i, T + (i + 1) * H, 2, 30 + i));
      const old = good.map((r) => ({ ...r, version: 1, dowry: r.dowry + 100 })); // an old worker racing the new one
      const results = await Promise.all([
        ...[1, 2, 3, 4, 5].map(() => sql.begin(async (tx) => { for (const r of good) await ins(r, tx); }).then(() => "ok", (e: Error) => e.message)),
        ...[1, 2].map(() => sql.begin(async (tx) => { for (const r of old) await ins(r, tx); }).then(() => "ok", (e: Error) => e.message)),
      ]);
      expect(results.slice(0, 5)).toEqual(["ok", "ok", "ok", "ok", "ok"]);
      expect(results.slice(5)).toEqual(["wedding receipt version 2 required from the switch", "wedding receipt version 2 required from the switch"]);
      const stored = await sql`select wedding_index, dowry, version from public.wedding_receipts where seed_id = ${id} order by wedding_index`;
      expect(stored.map((r) => [r["wedding_index"], r["dowry"], r["version"]])).toEqual(good.map((r) => [r.wedding_index, r.dowry, 2]));
      for (const r of good) await ins(r); // repeat after "abort": no change
      expect(await sql`select count(*)::int as n from public.wedding_receipts where seed_id = ${id}`).toEqual([{ n: 4 }]);
    });
    it("the shadow check flags a wrong version before the switch", async () => {
      const v = await make(Date.now() - 60 * D, [["fisher", Date.now() - 59 * D]]);
      const legacy = (await list(v.seed.id, Date.now(), "village_wedding_list_0107")).filter(([t]) => t! < T);
      await sql.unsafe("alter table public.wedding_receipts disable trigger wedding_receipts_guard");
      try { for (const [i, [t, dw]] of legacy.entries()) await ins(rec(v.seed.id, i, t!, i === 1 ? 2 : 1, dw!)); }
      finally { await sql.unsafe("alter table public.wedding_receipts enable trigger wedding_receipts_guard"); }
      const diff = await sql`select idx from public.wedding_receipt_diff(${v.seed.id})`;
      expect(diff.map((r) => r["idx"])).toEqual([1]);
    });
  });

  // ---------- integrity facts (documented as found, not changed by this package) ----------
  // ---------- integrity (Paket C, migration 0161 / H7; before it a direct DELETE was possible — finding H7) ----------
  it("integrity (0161): UPDATE, a single DELETE and TRUNCATE refused; only the village purge (CASCADE) removes receipts", async () => {
    const v = await make(Date.now() - 90 * D, [["fisher", Date.now() - 89 * D]]);
    await insertReceipts(weddingReceiptRows(v.seed, Date.now()));
    const n = async () => (await sql`select count(*)::int as n from public.wedding_receipts where seed_id = ${v.seed.id}`)[0]!["n"] as number;
    const before = await n();
    expect(before).toBeGreaterThan(2);
    const err = (p: Promise<unknown>) => p.then(() => "ok").catch((e: Error) => e.message);
    expect(await err(sql`update public.wedding_receipts set dowry = dowry where seed_id = ${v.seed.id}`)).toBe("wedding receipts are immutable");
    expect(await err(sql`delete from public.wedding_receipts where seed_id = ${v.seed.id} and wedding_index = 0`)).toBe("wedding receipts are kept");
    expect(await err(sql`truncate public.wedding_receipts`)).toBe("wedding receipts are kept");
    expect(await n()).toBe(before);
    await sql`delete from public.seeds where id = ${v.seed.id}`; // the purge path (CASCADE): the receipts go with the village
    expect(await n()).toBe(0);
    const [p] = await sql`select has_table_privilege('service_role', 'public.wedding_receipts', 'DELETE') as del,
                                 has_table_privilege('service_role', 'public.wedding_receipts', 'TRUNCATE') as tru,
                                 has_table_privilege('service_role', 'public.wedding_receipts', 'INSERT') as srv_ins,
                                 has_table_privilege('authenticated', 'public.wedding_receipts', 'INSERT') as auth_ins,
                                 has_table_privilege('authenticated', 'public.wedding_receipts', 'SELECT') as auth_sel`;
    expect(p).toEqual({ del: false, tru: false, srv_ins: false, auth_ins: false, auth_sel: true });
  });
});
