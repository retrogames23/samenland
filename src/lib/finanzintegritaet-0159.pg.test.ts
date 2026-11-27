// Migration 0159 (Finanzintegrität und Schema-Drift) against a throw-away PostgreSQL with the COMPLETE schema: every
// journal migration up to 0158, then 0159 as one script (one implicit transaction). BUILD_MAIL_TEST_PG=… .
// The roles anon/authenticated/service_role, RLS and auth.uid() are real PostgreSQL behaviour (full-schema.testkit.ts);
// PostgREST is not part of these tests. Never point this at a shared or production database.
//
// What is proven:
//   F1  target state: all ten foreign keys (table, column, referenced table and column, delete rule), NOT NULL, triggers
//   F2  owner, ACL, SECURITY DEFINER and search_path of abandon_village / purge_user_data unchanged; table ACLs unchanged
//   F3  abandon_village: a village with open and finished business — the other players' bookings and balances stay
//   F4  purge_user_data: a player with several villages — the same, and rows between his own villages disappear
//   F5  referrals: either side may go, the other keeps its bonus; both gone → row gone
//   F6  twin works: one side goes, the partner's half (its cost) stays
//   F7  plain FK behaviour without the functions (self-gift, two visits to deleted villages, unique keys)
//   F8  princely_errands: table missing (repo) / present without FKs and with orphans (live) / unclear rows → abort
//   F9  preflight: every deviation aborts before anything changed; NULL-safe
//   F10 rerun changes nothing
import { createHash } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFullSchema, dropDatabase, migration } from "./full-schema.testkit";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"])) throw new Error("BUILD_MAIL_TEST_PG missing: 0159 DB tests must run");
const d = BASE ? describe : describe.skip;

const TAG = "0159_finanzintegritaet_schema_drift";
const PREV = "0158_brunnen_material_companion_noop";
const D = 864e5;
let n = 0;
const uid = () => `00000000-0000-0000-0000-${(0xf10000 + ++n).toString(16).padStart(12, "0")}`;

d("0159 Finanzintegrität und Schema-Drift (vollständiges Schema, echtes PostgreSQL)", () => {
  const VOR = `fi159_vor_${process.pid}`;
  const dbs: string[] = [];
  const admin = () => postgres(BASE!, { max: 1, onnotice: () => {} });
  const url = (name: string) => { const u = new globalThis.URL(BASE!); u.pathname = `/${name}`; return u.toString(); };
  /** A fresh copy of the schema as of 0158 (plus the stand-ins the live database has and no migration creates). */
  const fresh = async (label: string) => {
    const name = `fi159_${label}_${process.pid}`;
    const a = admin();
    try { await a.unsafe(`drop database if exists ${name} with (force)`); await a.unsafe(`create database ${name} template ${VOR}`); } finally { await a.end(); }
    dbs.push(name);
    return postgres(url(name), { max: 4, onnotice: () => {} });
  };
  const apply = (sql: postgres.Sql) => sql.unsafe(migration(TAG));
  const err = (p: PromiseLike<unknown>) => Promise.resolve(p).then(() => "ok", (e: Error) => e.message);
  /** Everything 0159 may touch, as one hash: functions (text, owner, ACL, config), constraints, triggers, columns, table ACLs. */
  const catalog = async (sql: postgres.Sql) => (await sql`
    select md5(string_agg(x, E'\n' order by x)) h from (
      select 'fn ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') ' || pg_get_userbyid(p.proowner) || ' ' || coalesce(p.proacl::text, '-') || ' ' ||
             p.prosecdef::text || ' ' || coalesce(array_to_string(p.proconfig, ','), '') || ' ' || md5(p.prosrc) x from pg_proc p where p.pronamespace = 'public'::regnamespace
      union all select 'con ' || conrelid::regclass::text || ' ' || conname || ' ' || pg_get_constraintdef(oid) || ' ' || convalidated::text from pg_constraint where connamespace = 'public'::regnamespace
      union all select 'trg ' || tgrelid::regclass::text || ' ' || tgname || ' ' || tgenabled::text from pg_trigger where not tgisinternal
      union all select 'col ' || a.attrelid::regclass::text || '.' || a.attname || ' ' || a.attnotnull::text from pg_attribute a join pg_class c on c.oid = a.attrelid
                 where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and a.attnum > 0 and not a.attisdropped
      union all select 'rel ' || c.relname || ' ' || coalesce(c.relacl::text, '-') || ' ' || c.relrowsecurity::text from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
    ) q`)[0]!["h"] as string;
  const rowsHash = async (sql: postgres.Sql, tables: string[]) => {
    const h = createHash("sha256");
    for (const t of tables) h.update((await sql.unsafe(`select coalesce(string_agg(x::text, '|' order by x::text), '') s from public.${t} x`))[0]!["s"] as string);
    return h.digest("hex");
  };

  // ---------- test data ----------
  type V = { id: string; owner: string };
  const village = async (sql: postgres.Sql, owner = uid(), realm = "europe", ageDays = 30): Promise<V> => {
    const id = uid();
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into auth.users (id) values (${owner}) on conflict do nothing`;
      await tx`insert into public.seeds (id, user_id, owner, name, x, y, realm, created_at)
        values (${id}, ${owner}, 'Test', ${"Dorf F" + n}, ${n % 500}, ${Math.floor(n / 500) * 7 + (n % 7)}, ${realm}, ${new Date(Date.now() - ageDays * D).toISOString()})`;
    });
    return { id, owner };
  };
  /** Rows are inserted with the guards off (replica): the tests are about deletion, not about the rules for booking. */
  const put = (sql: postgres.Sql, table: string, row: Record<string, unknown>) => sql.begin(async (tx) => {
    await tx`set local session_replication_role = replica`;
    return (await tx`insert into public.${tx(table)} ${tx(row as never)} returning *`)[0]!;
  });
  const ago = (days: number) => new Date(Date.now() - days * D).toISOString();
  const gift = (sql: postgres.Sql, from: V, to: V, amount = 40, kind = "gift") =>
    put(sql, "gifts", { from_seed: from.id, to_seed: to.id, user_id: from.owner, kind, amount, created_at: ago(3) }).then((r) => r["id"] as string);
  const visit = (sql: postgres.Sql, visitor: V, visited: V, reward = 50) =>
    put(sql, "village_visits", { visitor_seed: visitor.id, visited_seed: visited.id, reward, created_at: ago(4) }).then((r) => r["id"] as string);
  const referral = (sql: postgres.Sql, referrer: V, referee: V) =>
    put(sql, "referrals", { referrer_seed: referrer.id, referee_seed: referee.id, referee_user: referee.owner, reward: 50, created_at: ago(5) }).then((r) => r["id"] as string);
  const work = (sql: postgres.Sql, s: V, partner: V, cost = 120) =>
    put(sql, "twin_works", { seed_id: s.id, partner_id: partner.id, user_id: s.owner, work: "bridge", cost, created_at: ago(2) }).then((r) => r["id"] as string);
  const task = (sql: postgres.Sql, s: V, step: number, done: boolean) =>
    put(sql, "princely_tasks", { seed_id: s.id, step, task: "court", reward: done ? 80 : 0, accepted_at: ago(6), done_at: done ? ago(1) : null }).then((r) => r["id"] as string);
  const errand = (sql: postgres.Sql, s: V, taskId: string, e: string) =>
    put(sql, "princely_errands", { seed_id: s.id, task_id: taskId, errand: e }).then((r) => r["id"] as string);
  const balance = async (sql: postgres.Sql, v: V) => (await sql`select public.village_balance(${v.id}) b`)[0]!["b"] as number;
  const one = async (sql: postgres.Sql, table: string, id: string) => (await sql`select * from public.${sql(table)} where id = ${id}`)[0];
  const count = async (sql: postgres.Sql, q: string, p: unknown[] = []) => (await sql.unsafe(`select count(*)::int n from ${q}`, p as never[]))[0]!["n"] as number;
  const asPlayer = (sql: postgres.Sql, v: V, q: (tx: postgres.TransactionSql) => Promise<unknown>) => err(sql.begin(async (tx) => {
    await tx`select set_config('test.uid', ${v.owner}, true), set_config('test.role', 'authenticated', true)`;
    await tx.unsafe("set local role authenticated");
    await q(tx);
  }));
  const asRole = (sql: postgres.Sql, role: "anon" | "service_role" | "authenticated", q: (tx: postgres.TransactionSql) => Promise<unknown>) => err(sql.begin(async (tx) => {
    await tx`select set_config('test.role', ${role}, true)`;
    await tx.unsafe(`set local role ${role}`);
    await q(tx);
  }));

  let sql: postgres.Sql;        // the migrated database of the functional tests
  let before = "";              // catalog facts before 0159, for F2
  beforeAll(async () => {
    await buildFullSchema(BASE!, VOR, PREV);
    const v = postgres(url(VOR), { max: 1, onnotice: () => {} });
    // live has this table (generated types, purge_user_data deletes from it) but no migration creates it — stand-in only
    await v.unsafe("create table if not exists public.build_mail (user_id uuid primary key, enabled boolean, lang text)");
    before = JSON.stringify(await facts(v));
    await v.end();
    sql = await fresh("main");
    await apply(sql);
  }, 300000);
  afterAll(async () => {
    await sql?.end();
    if (BASE) for (const name of [...dbs, VOR]) await dropDatabase(BASE, name);
  });
  const facts = async (s: postgres.Sql) => ({
    fns: await s`select p.proname, pg_get_userbyid(p.proowner) owner, p.proacl::text acl, p.prosecdef, p.proconfig::text cfg, p.provolatile, pg_get_function_identity_arguments(p.oid) args, p.prorettype::regtype::text ret
      from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('abandon_village', 'purge_user_data') order by 1`,
    rels: await s`select c.relname, c.relacl::text acl, c.relrowsecurity rls, pg_get_userbyid(c.relowner) owner from pg_class c
      where c.relnamespace = 'public'::regnamespace and c.relname in ('gifts', 'referrals', 'village_visits', 'twin_works', 'gift_reads', 'seeds', 'princely_tasks') order by 1`,
    policies: await s`select tablename, policyname, cmd, roles::text, qual, with_check from pg_policies where schemaname = 'public'
      and tablename in ('gifts', 'referrals', 'village_visits', 'twin_works') order by 1, 2`,
  });

  // ================= F1 / F2: catalog =================
  it("F1 Zielzustand: zehn Fremdschlüssel mit Tabelle, Spalte, Ziel und Löschregel; NOT NULL; Trigger", async () => {
    const fks = await sql`select c.conrelid::regclass::text tbl, c.conname, pg_get_constraintdef(c.oid) def, c.convalidated ok from pg_constraint c
      where c.contype = 'f' and c.conrelid::regclass::text in ('gifts', 'referrals', 'village_visits', 'twin_works', 'princely_errands') order by 1, 2`;
    expect(fks.map((f) => `${f["tbl"]} ${f["conname"]}: ${f["def"]}${f["ok"] ? "" : " NOT VALID"}`)).toEqual([
      "gifts gifts_from_seed_fkey: FOREIGN KEY (from_seed) REFERENCES seeds(id) ON DELETE SET NULL",
      "gifts gifts_to_seed_fkey: FOREIGN KEY (to_seed) REFERENCES seeds(id) ON DELETE SET NULL",
      "princely_errands princely_errands_seed_id_fkey: FOREIGN KEY (seed_id) REFERENCES seeds(id) ON DELETE CASCADE",
      "princely_errands princely_errands_task_id_fkey: FOREIGN KEY (task_id) REFERENCES princely_tasks(id) ON DELETE CASCADE",
      "referrals referrals_referee_seed_fkey: FOREIGN KEY (referee_seed) REFERENCES seeds(id) ON DELETE SET NULL",
      "referrals referrals_referrer_seed_fkey: FOREIGN KEY (referrer_seed) REFERENCES seeds(id) ON DELETE SET NULL",
      "twin_works twin_works_partner_id_fkey: FOREIGN KEY (partner_id) REFERENCES seeds(id) ON DELETE SET NULL",
      "twin_works twin_works_seed_id_fkey: FOREIGN KEY (seed_id) REFERENCES seeds(id) ON DELETE CASCADE",
      "village_visits village_visits_visited_seed_fkey: FOREIGN KEY (visited_seed) REFERENCES seeds(id) ON DELETE SET NULL",
      "village_visits village_visits_visitor_seed_fkey: FOREIGN KEY (visitor_seed) REFERENCES seeds(id) ON DELETE CASCADE",
    ]);
    const nn = await sql`select a.attrelid::regclass::text || '.' || a.attname c, a.attnotnull nn from pg_attribute a
      where a.attrelid::regclass::text in ('gifts', 'referrals', 'village_visits', 'twin_works', 'princely_errands')
        and a.attname in ('from_seed', 'to_seed', 'referrer_seed', 'referee_seed', 'visitor_seed', 'visited_seed', 'seed_id', 'partner_id', 'task_id') order by 1`;
    expect(Object.fromEntries(nn.map((r) => [r["c"], r["nn"]]))).toEqual({
      "gifts.from_seed": false, "gifts.to_seed": false, "referrals.referee_seed": false, "referrals.referrer_seed": false,
      "village_visits.visitor_seed": true, "village_visits.visited_seed": false, "twin_works.seed_id": true, "twin_works.partner_id": false,
      "princely_errands.seed_id": true, "princely_errands.task_id": true,
    });
    const trg = await sql`select tgrelid::regclass::text || '.' || tgname t from pg_trigger where tgname like '%orphan_cleanup' order by 1`;
    expect(trg.map((r) => r["t"])).toEqual(["gifts.gifts_orphan_cleanup", "referrals.referrals_orphan_cleanup"]);
    // the unique keys the rules rely on are still there
    expect(await count(sql, "pg_constraint where contype = 'u' and conname in ('village_visits_visitor_seed_visited_seed_key', 'twin_works_seed_id_partner_id_key', 'referrals_referee_user_key')")).toBe(3);
  });
  it("F2 Eigentümer, Rechte, SECURITY DEFINER und search_path beider Funktionen sowie Tabellenrechte und Policies sind unverändert; die neue Trigger-Funktion ist niemandem gewährt", async () => {
    expect(JSON.stringify(await facts(sql))).toBe(before);
    const f = (await facts(sql)).fns;
    expect(f.map((x) => [x["proname"], x["owner"], x["prosecdef"], x["cfg"]])).toEqual([["abandon_village", "postgres", true, "{search_path=public}"], ["purge_user_data", "postgres", true, "{search_path=public}"]]);
    const ex = async (role: string, fn: string) => (await sql.unsafe(`select has_function_privilege($1, $2, 'EXECUTE') ok`, [role, fn]))[0]!["ok"];
    const m: Record<string, boolean[]> = {};
    for (const fn of ["public.abandon_village(uuid)", "public.purge_user_data(uuid)", "public.finance_orphan_cleanup()"]) m[fn] = [await ex("anon", fn), await ex("authenticated", fn), await ex("service_role", fn)] as boolean[];
    expect(m).toEqual({ "public.abandon_village(uuid)": [false, true, true], "public.purge_user_data(uuid)": [false, false, true], "public.finance_orphan_cleanup()": [false, false, false] });
    expect((await sql`select proacl::text a from pg_proc where proname = 'finance_orphan_cleanup'`)[0]!["a"]).toBe("{postgres=X/postgres}");
    // really refused, not only by the catalog
    const v = await village(sql);
    expect(await asRole(sql, "anon", (tx) => tx`select public.abandon_village(${v.id})`)).toMatch(/permission denied for function abandon_village/);
    expect(await asPlayer(sql, v, (tx) => tx`select public.purge_user_data(${v.owner})`)).toMatch(/permission denied for function purge_user_data/);
    expect(await asPlayer(sql, v, (tx) => tx`select public.finance_orphan_cleanup()`)).toMatch(/permission denied for function finance_orphan_cleanup/);
    // the client still cannot change or delete booking rows (RLS: no UPDATE/DELETE policy)
    const o = await village(sql), g = await gift(sql, v, o);
    await asPlayer(sql, v, (tx) => tx`update public.gifts set to_seed = null where id = ${g}`);
    await asPlayer(sql, v, (tx) => tx`delete from public.gifts where id = ${g}`);
    expect((await one(sql, "gifts", g))!["to_seed"]).toBe(o.id);
  });

  // ================= F3: abandon_village =================
  it("F3 Dorfaufgabe mit offenen und abgeschlossenen Vorgängen: Geschenke, Besuche, Empfehlung und Partnerwerke der anderen bleiben, ihre Kassenstände sind unverändert", async () => {
    const a = await village(sql), b = await village(sql), c = await village(sql), keep = await village(sql);
    const gOut = await gift(sql, a, b, 40);          // a → b: b's income
    const gIn = await gift(sql, b, a, 25);           // b → a: b's expense
    const gOther = await gift(sql, b, c, 10);        // untouched
    await sql.begin(async (tx) => { await tx`set local session_replication_role = replica`; await tx`insert into public.gift_reads (user_id, gift_id) values (${b.owner}, ${gOut})`; });
    const vOut = await visit(sql, a, b);             // a visited b: a's income, goes with a
    const vIn = await visit(sql, b, a, 75);          // b visited a: b's income
    const vIn2 = await visit(sql, c, a, 30);         // c visited a: c's income
    const ref = await referral(sql, a, b);           // both earn
    const wMine = await work(sql, a, b, 120);        // finished work: both halves paid
    const wPartner = await work(sql, b, a, 120);
    const wOpenPartner = await work(sql, c, a, 90);  // open work: only c paid so far
    const tDone = await task(sql, a, 1, true), tOpen = await task(sql, a, 2, false);
    const e1 = await errand(sql, a, tDone, "gardener"), e2 = await errand(sql, a, tOpen, "groom");
    const tKeep = await task(sql, keep, 1, false), eKeep = await errand(sql, keep, tKeep, "gardener");
    await put(sql, "purchases", { seed_id: a.id, user_id: a.owner, item: "herbs", cost: 90, created_at: ago(2) });

    const bal = { b: await balance(sql, b), c: await balance(sql, c), keep: await balance(sql, keep) };
    // a foreign player cannot abandon it
    expect(await asPlayer(sql, b, (tx) => tx`select public.abandon_village(${a.id})`)).toBe("not your village");
    expect(await count(sql, "public.seeds where id = $1", [a.id])).toBe(1);
    expect(await asPlayer(sql, a, (tx) => tx`select public.abandon_village(${a.id})`)).toBe("ok");
    expect(await count(sql, "public.seeds where id = $1", [a.id])).toBe(0);

    // the other players' bookings stay, with the deleted side empty
    expect(await one(sql, "gifts", gOut)).toMatchObject({ from_seed: null, to_seed: b.id, amount: 40 });
    expect(await one(sql, "gifts", gIn)).toMatchObject({ from_seed: b.id, to_seed: null, amount: 25 });
    expect(await one(sql, "gifts", gOther)).toMatchObject({ from_seed: b.id, to_seed: c.id });
    expect(await count(sql, "public.gift_reads where gift_id = $1", [gOut])).toBe(1);
    expect(await one(sql, "village_visits", vIn)).toMatchObject({ visitor_seed: b.id, visited_seed: null, reward: 75 });
    expect(await one(sql, "village_visits", vIn2)).toMatchObject({ visitor_seed: c.id, visited_seed: null, reward: 30 });
    expect(await one(sql, "referrals", ref)).toMatchObject({ referrer_seed: null, referee_seed: b.id, reward: 50 });
    expect(await one(sql, "twin_works", wPartner)).toMatchObject({ seed_id: b.id, partner_id: null, cost: 120 });
    expect(await one(sql, "twin_works", wOpenPartner)).toMatchObject({ seed_id: c.id, partner_id: null, cost: 90 });
    // the village's own bookings go with it
    expect(await one(sql, "village_visits", vOut)).toBeUndefined();
    expect(await one(sql, "twin_works", wMine)).toBeUndefined();
    expect(await count(sql, "public.princely_tasks where id = any($1::uuid[])", [[tDone, tOpen]])).toBe(0);
    expect(await count(sql, "public.princely_errands where id = any($1::uuid[])", [[e1, e2]])).toBe(0);
    expect(await count(sql, "public.purchases where seed_id = $1", [a.id])).toBe(0);
    expect(await one(sql, "princely_errands", eKeep)).toBeTruthy();
    // nobody else's balance moved
    expect({ b: await balance(sql, b), c: await balance(sql, c), keep: await balance(sql, keep) }).toEqual(bal);
    // nothing dangles
    for (const [t, col] of [["gifts", "from_seed"], ["gifts", "to_seed"], ["referrals", "referrer_seed"], ["referrals", "referee_seed"], ["village_visits", "visitor_seed"],
      ["village_visits", "visited_seed"], ["twin_works", "seed_id"], ["twin_works", "partner_id"], ["princely_errands", "seed_id"]] as const)
      expect(await count(sql, `public.${t} x where x.${col} is not null and not exists (select 1 from public.seeds s where s.id = x.${col})`), `${t}.${col}`).toBe(0);
  });

  // ================= F4: purge_user_data =================
  it("F4 Kontolöschung eines Spielers mit mehreren Dörfern: Gegenbuchungen anderer bleiben, Zeilen zwischen den eigenen Dörfern verschwinden", async () => {
    const owner = uid();
    // one village per player and map (seeds_user_realm_key): several villages = several maps
    const a1 = await village(sql, owner, "europe"), a2 = await village(sql, owner, "lab"), a3 = await village(sql, owner, "asia");
    const b = await village(sql), c = await village(sql);
    const gOwn = await gift(sql, a1, a2);            // between his own villages: both sides go → row goes
    const gOut = await gift(sql, a2, b, 60), gIn = await gift(sql, c, a3, 35);
    await sql.begin(async (tx) => { await tx`set local session_replication_role = replica`;
      await tx`insert into public.gift_reads (user_id, gift_id) values (${owner}, ${gIn}), (${b.owner}, ${gOut})`; });
    const vOwn = await visit(sql, a1, a2), vOut = await visit(sql, a1, b), vIn = await visit(sql, b, a2, 100), vIn2 = await visit(sql, b, a3, 40);
    const refIn = await referral(sql, b, a1);        // a1 was referred by b: b keeps its bonus
    const wOwnA = await work(sql, a1, a2), wOwnB = await work(sql, a2, a1);
    const wOut = await work(sql, a3, c, 150), wIn = await work(sql, c, a3, 150);
    const t1 = await task(sql, a1, 1, true), t2 = await task(sql, a2, 1, false);
    const e1 = await errand(sql, a1, t1, "gardener"), e2 = await errand(sql, a2, t2, "groom");
    const bal = { b: await balance(sql, b), c: await balance(sql, c) };

    expect(await asRole(sql, "authenticated", (tx) => tx`select public.purge_user_data(${owner})`)).toMatch(/permission denied/);
    expect(await asRole(sql, "service_role", (tx) => tx`select public.purge_user_data(${owner})`)).toBe("ok");

    expect(await count(sql, "public.seeds where user_id = $1", [owner])).toBe(0);
    expect(await one(sql, "gifts", gOwn)).toBeUndefined();
    expect(await one(sql, "gifts", gOut)).toMatchObject({ from_seed: null, to_seed: b.id, amount: 60 });
    expect(await one(sql, "gifts", gIn)).toMatchObject({ from_seed: c.id, to_seed: null, amount: 35 });
    // the other player's read mark stays, the purged user's own is gone
    expect((await sql`select user_id from public.gift_reads where gift_id = any(${[gIn, gOut]}::uuid[])`).map((r) => r["user_id"])).toEqual([b.owner]);
    expect(await one(sql, "village_visits", vOwn)).toBeUndefined();
    expect(await one(sql, "village_visits", vOut)).toBeUndefined();
    expect(await one(sql, "village_visits", vIn)).toMatchObject({ visitor_seed: b.id, visited_seed: null, reward: 100 });
    expect(await one(sql, "village_visits", vIn2)).toMatchObject({ visitor_seed: b.id, visited_seed: null, reward: 40 });
    expect(await one(sql, "referrals", refIn)).toMatchObject({ referrer_seed: b.id, referee_seed: null });
    expect(await count(sql, "public.twin_works where id = any($1::uuid[])", [[wOwnA, wOwnB, wOut]])).toBe(0);
    expect(await one(sql, "twin_works", wIn)).toMatchObject({ seed_id: c.id, partner_id: null, cost: 150 });
    expect(await count(sql, "public.princely_tasks where id = any($1::uuid[])", [[t1, t2]])).toBe(0);
    expect(await count(sql, "public.princely_errands where id = any($1::uuid[])", [[e1, e2]])).toBe(0);
    expect({ b: await balance(sql, b), c: await balance(sql, c) }).toEqual(bal);
  });

  // ================= F5 / F6 =================
  it("F5 Empfehlung: Löscht eine Seite ihr Dorf, behält die andere ihre Gegenbuchung; sind beide weg, verschwindet die Zeile", async () => {
    const a = await village(sql), b = await village(sql), x = await village(sql), y = await village(sql);
    const r1 = await referral(sql, a, b), r2 = await referral(sql, x, y);
    const balB = await balance(sql, b), balX = await balance(sql, x);
    expect(await asPlayer(sql, a, (tx) => tx`select public.abandon_village(${a.id})`)).toBe("ok");      // the referrer goes
    expect(await one(sql, "referrals", r1)).toMatchObject({ referrer_seed: null, referee_seed: b.id, reward: 50 });
    expect(await balance(sql, b)).toBe(balB);
    expect(await asRole(sql, "service_role", (tx) => tx`select public.purge_user_data(${y.owner})`)).toBe("ok");   // the referee goes
    expect(await one(sql, "referrals", r2)).toMatchObject({ referrer_seed: x.id, referee_seed: null, reward: 50 });
    expect(await balance(sql, x)).toBe(balX);
    // RLS: the remaining side still sees its row
    let seen = 0;
    await asPlayer(sql, b, async (tx) => { seen = (await tx`select count(*)::int n from public.referrals where id = ${r1}`)[0]!["n"] as number; });
    expect(seen).toBe(1);
    // the second side goes too → nobody books it any more
    expect(await asPlayer(sql, b, (tx) => tx`select public.abandon_village(${b.id})`)).toBe("ok");
    expect(await one(sql, "referrals", r1)).toBeUndefined();
  });
  it("F6 Partnerwerk: Wird nur eine Seite gelöscht, bleibt die Hälfte des Partners (seine Ausgabe) bestehen; er kann mit einem neuen Partner erneut bauen", async () => {
    const a = await village(sql), b = await village(sql), c = await village(sql);
    await work(sql, a, b, 200);
    const wb = await work(sql, b, a, 200);
    const bal = await balance(sql, b);
    expect(await asPlayer(sql, a, (tx) => tx`select public.abandon_village(${a.id})`)).toBe("ok");
    expect(await one(sql, "twin_works", wb)).toMatchObject({ seed_id: b.id, partner_id: null, cost: 200, work: "bridge" });
    expect(await balance(sql, b)).toBe(bal);
    // a second partner later deleted: two rows (b, NULL) do not collide on the unique key (seed_id, partner_id)
    const wb2 = await work(sql, b, c, 80);
    expect(await asRole(sql, "service_role", (tx) => tx`select public.purge_user_data(${c.owner})`)).toBe("ok");
    expect(await count(sql, "public.twin_works where seed_id = $1 and partner_id is null", [b.id])).toBe(2);
    expect(await one(sql, "twin_works", wb2)).toMatchObject({ partner_id: null, cost: 80 });
    // and b's own rows go with b
    expect(await asPlayer(sql, b, (tx) => tx`select public.abandon_village(${b.id})`)).toBe("ok");
    expect(await count(sql, "public.twin_works where id = any($1::uuid[])", [[wb, wb2]])).toBe(0);
  });

  // ================= F7: the foreign keys alone =================
  it("F7 FK-Regeln ohne die Funktionen: DELETE FROM seeds allein wirkt richtig (Selbstgeschenk, zwei Besuche bei gelöschten Dörfern, Löschreihenfolge)", async () => {
    const a = await village(sql), b = await village(sql), c = await village(sql), v = await village(sql);
    const gSelf = await gift(sql, a, a), gAB = await gift(sql, a, b), gBA = await gift(sql, b, a);
    const v1 = await visit(sql, v, a), v2 = await visit(sql, v, b), vOwn = await visit(sql, a, c);
    const r = await referral(sql, a, b);
    const w = await work(sql, c, a);
    const tk = await task(sql, a, 1, false), e = await errand(sql, a, tk, "gardener");
    const del = (s: V) => sql`delete from public.seeds where id = ${s.id}`;
    await del(a);
    expect(await one(sql, "gifts", gSelf)).toBeUndefined();                 // both sides were a
    expect(await one(sql, "gifts", gAB)).toMatchObject({ from_seed: null, to_seed: b.id });
    expect(await one(sql, "gifts", gBA)).toMatchObject({ from_seed: b.id, to_seed: null });
    expect(await one(sql, "village_visits", vOwn)).toBeUndefined();         // a's own income: CASCADE
    expect(await one(sql, "village_visits", v1)).toMatchObject({ visitor_seed: v.id, visited_seed: null });
    expect(await one(sql, "referrals", r)).toMatchObject({ referrer_seed: null, referee_seed: b.id });
    expect(await one(sql, "twin_works", w)).toMatchObject({ seed_id: c.id, partner_id: null });
    expect(await count(sql, "public.princely_errands where id = $1", [e])).toBe(0);     // via seed AND via task
    await del(b);
    expect(await one(sql, "gifts", gAB)).toBeUndefined();                   // now both sides are gone
    expect(await one(sql, "gifts", gBA)).toBeUndefined();
    expect(await one(sql, "referrals", r)).toBeUndefined();
    // two visits whose hosts are both deleted: (v, NULL) twice, no unique violation
    expect(await one(sql, "village_visits", v2)).toMatchObject({ visitor_seed: v.id, visited_seed: null });
    expect(await count(sql, "public.village_visits where visitor_seed = $1 and visited_seed is null", [v.id])).toBe(2);
    // a task deleted alone takes its errands with it
    const t2 = await task(sql, c, 1, false), e2 = await errand(sql, c, t2, "groom");
    await sql`delete from public.princely_tasks where id = ${t2}`;
    expect(await count(sql, "public.princely_errands where id = $1", [e2])).toBe(0);
    // a reference to a village that does not exist is refused
    const gc = await gift(sql, c, v);
    expect(await err(sql`update public.gifts set to_seed = ${uid()} where id = ${gc}`)).toMatch(/violates foreign key constraint "gifts_to_seed_fkey"/);
    expect(await err(sql`insert into public.princely_errands (seed_id, task_id, errand) values (${c.id}, ${uid()}, 'x')`)).toMatch(/violates foreign key constraint "princely_errands_task_id_fkey"/);
    expect(await err(sql`update public.village_visits set visited_seed = ${uid()} where id = ${v2}`)).toMatch(/violates foreign key constraint "village_visits_visited_seed_fkey"/);
    expect(await err(sql`update public.village_visits set visitor_seed = null where id = ${v2}`)).toMatch(/null value in column "visitor_seed"/);
    expect(await err(sql`update public.twin_works set seed_id = null where id = ${w}`)).toMatch(/null value in column "seed_id"/);
  });

  // ================= F8: princely_errands =================
  describe("F8 princely_errands", () => {
    const liveTable = `create table public.princely_errands (id uuid primary key default gen_random_uuid(), seed_id uuid not null, task_id uuid not null,
      errand text not null, created_at timestamptz not null default now()); alter table public.princely_errands enable row level security;`;
    it("F8 Tabelle fehlt (Repo-Stand): wird mit beiden Fremdschlüsseln, RLS und Leserecht nur für den Eigentümer angelegt", async () => {
      const cols = await sql`select column_name c, data_type t, is_nullable nn from information_schema.columns where table_schema = 'public' and table_name = 'princely_errands' order by ordinal_position`;
      expect(cols.map((c) => `${c["c"]} ${c["t"]} ${c["nn"]}`)).toEqual(["id uuid NO", "seed_id uuid NO", "task_id uuid NO", "errand text NO", "created_at timestamp with time zone NO"]);
      const a = await village(sql), b = await village(sql);
      const e = await errand(sql, a, await task(sql, a, 1, false), "gardener");
      const see = async (v: V) => { let k = -1; await asPlayer(sql, v, async (tx) => { k = (await tx`select count(*)::int n from public.princely_errands where id = ${e}`)[0]!["n"] as number; }); return k; };
      expect([await see(a), await see(b)]).toEqual([1, 0]);
      expect(await asPlayer(sql, a, (tx) => tx`delete from public.princely_errands where id = ${e}`)).toMatch(/permission denied for table princely_errands/);
      expect(await asRole(sql, "anon", (tx) => tx`select 1 from public.princely_errands`)).toMatch(/permission denied for table princely_errands/);
    });
    it("F8 Tabelle vorhanden wie live (ohne Fremdschlüssel) mit verwaisten Zeilen: vollständig verwaiste werden entfernt, gültige bleiben, Rechte und Policies der Tabelle bleiben", async () => {
      const s = await fresh("errands");
      try {
        await s.unsafe(liveTable + `create policy "live policy" on public.princely_errands for select to authenticated using (true); grant select on public.princely_errands to anon;`);
        const a = await village(s), b = await village(s);
        const ta = await task(s, a, 1, false), tb = await task(s, b, 1, true);
        const good1 = await errand(s, a, ta, "gardener"), good2 = await errand(s, b, tb, "groom");
        // fully orphaned (what abandon_village left behind until now): neither the village nor the task exists
        const gone1 = await errand(s, { id: uid(), owner: uid() }, uid(), "gardener"), gone2 = await errand(s, { id: uid(), owner: uid() }, uid(), "groom");
        // the village is missing, the task (of another village) exists: belongs to nobody either
        const gone3 = await errand(s, { id: uid(), owner: uid() }, tb, "gardener");
        const acl0 = (await s`select relacl::text a from pg_class where oid = 'public.princely_errands'::regclass`)[0]!["a"];
        expect(await err(apply(s))).toBe("ok");
        expect((await s`select id from public.princely_errands order by id`).map((r) => r["id"])).toEqual([good1, good2].sort());
        void gone1; void gone2; void gone3;
        expect((await s`select relacl::text a from pg_class where oid = 'public.princely_errands'::regclass`)[0]!["a"]).toBe(acl0);
        expect((await s`select policyname from pg_policies where tablename = 'princely_errands'`).map((r) => r["policyname"])).toEqual(["live policy"]);
        expect(await count(s, "pg_constraint where conrelid = 'public.princely_errands'::regclass and contype = 'f'")).toBe(2);
        // and from now on the village takes them with it
        expect(await asPlayer(s, a, (tx) => tx`select public.abandon_village(${a.id})`)).toBe("ok");
        expect(await count(s, "public.princely_errands where id = $1", [good1])).toBe(0);
      } finally { await s.end(); }
    });
    it("F8 nullbare Spalten wie bei einer älteren Live-Tabelle: Zeilen ohne Dorf (NULL) werden entfernt; die Spalten sind danach NOT NULL", async () => {
      const s = await fresh("errands_null");
      try {
        await s.unsafe(`create table public.princely_errands (id uuid primary key default gen_random_uuid(), seed_id uuid, task_id uuid, errand text not null, created_at timestamptz not null default now())`);
        const a = await village(s), ta = await task(s, a, 1, false);
        const good = await errand(s, a, ta, "gardener");
        await s`insert into public.princely_errands (seed_id, task_id, errand) values (null, null, 'x'), (null, ${ta}, 'y'), (${uid()}, null, 'z')`;
        expect(await err(apply(s))).toBe("ok");
        expect((await s`select id from public.princely_errands`).map((r) => r["id"])).toEqual([good]);
        expect(await count(s, "pg_attribute where attrelid = 'public.princely_errands'::regclass and attname in ('seed_id', 'task_id') and attnotnull")).toBe(2);
      } finally { await s.end(); }
    });
    it.each([
      ["Dorf vorhanden, Auftrag fehlt", (a: V) => `insert into public.princely_errands (seed_id, task_id, errand) values ('${a.id}', gen_random_uuid(), 'x')`, /1 Zeilen eines bestehenden Dorfes ohne zugehörigen Auftrag/],
      ["Dorf vorhanden, Auftrag NULL", (a: V) => `alter table public.princely_errands alter column task_id drop not null; insert into public.princely_errands (seed_id, task_id, errand) values ('${a.id}', null, 'x')`, /1 Zeilen eines bestehenden Dorfes ohne zugehörigen Auftrag/],
      ["Auftrag gehört einem anderen Dorf", (a: V, tOther: string) => `insert into public.princely_errands (seed_id, task_id, errand) values ('${a.id}', '${tOther}', 'x')`, /1 Zeilen, deren Auftrag einem anderen Dorf gehört/],
      ["unerwarteter Fremdschlüssel", () => `alter table public.princely_errands add constraint pe_fk foreign key (seed_id) references public.seeds(id) not valid`, /unerwarteter Fremdschlüssel pe_fk auf princely_errands/],
      ["falscher Spaltentyp", () => `alter table public.princely_errands alter column task_id type text`, /princely_errands\.task_id ist text statt uuid/],
    ] as const)("F8 unklarer Fall „%s“: Migration bricht ab, nichts ist geändert oder gelöscht", async (label, prep, message) => {
      const s = await fresh(`errands_x${++n}`);
      try {
        await s.unsafe(liveTable);
        const a = await village(s), b = await village(s), tb = await task(s, b, 1, false);
        await errand(s, { id: uid(), owner: uid() }, uid(), "orphan");      // would be removed — must survive the abort
        await gift(s, a, b);
        await s.unsafe((prep as (a: V, t: string) => string)(a, tb));
        const c0 = await catalog(s), r0 = await rowsHash(s, ["princely_errands", "gifts"]);
        expect(await err(apply(s)), label).toMatch(message);
        expect(await catalog(s)).toBe(c0);
        expect(await rowsHash(s, ["princely_errands", "gifts"])).toBe(r0);
      } finally { await s.end(); }
    });
  });

  // ================= F9: preflight =================
  describe("F9 Preflight", () => {
    const cases: [string, string, RegExp][] = [
      ["FK verweist auf eine andere Tabelle", `alter table public.gifts drop constraint gifts_to_seed_fkey; alter table public.gifts add constraint gifts_to_seed_fkey foreign key (to_seed) references public.princely_tasks(id) on delete cascade not valid`, /gifts_to_seed_fkey verweist auf princely_tasks\(id\) statt seeds\(id\)/],
      ["FK verweist auf eine andere Spalte", `alter table public.seeds add column alt uuid unique; alter table public.twin_works drop constraint twin_works_partner_id_fkey; alter table public.twin_works add constraint twin_works_partner_id_fkey foreign key (partner_id) references public.seeds(alt) on delete cascade not valid`, /twin_works_partner_id_fkey verweist auf seeds\(alt\) statt seeds\(id\)/],
      ["anderes Löschverhalten als erwartet", `alter table public.referrals drop constraint referrals_referee_seed_fkey; alter table public.referrals add constraint referrals_referee_seed_fkey foreign key (referee_seed) references public.seeds(id) on delete restrict`, /referrals_referee_seed_fkey hat Löschverhalten r – erwartet c \(Ist\) oder n \(Ziel\)/],
      ["eigene Buchungsseite ohne CASCADE", `alter table public.twin_works drop constraint twin_works_seed_id_fkey; alter table public.twin_works add constraint twin_works_seed_id_fkey foreign key (seed_id) references public.seeds(id)`, /twin_works_seed_id_fkey hat Löschverhalten a/],
      ["anderer Constraint-Name", `alter table public.village_visits rename constraint village_visits_visited_seed_fkey to vv_fk`, /village_visits\.visited_seed: Fremdschlüssel heißt vv_fk statt village_visits_visited_seed_fkey/],
      ["zweiter Fremdschlüssel auf derselben Spalte", `alter table public.gifts add constraint gifts_from_seed_fkey2 foreign key (from_seed) references public.seeds(id)`, /gifts\.from_seed: 2 Fremdschlüssel statt genau einem/],
      ["Fremdschlüssel fehlt", `alter table public.village_visits drop constraint village_visits_visitor_seed_fkey`, /village_visits\.visitor_seed: 0 Fremdschlüssel statt genau einem/],
      ["Fremdschlüssel NOT VALID", `alter table public.gifts drop constraint gifts_from_seed_fkey; alter table public.gifts add constraint gifts_from_seed_fkey foreign key (from_seed) references public.seeds(id) on delete cascade not valid`, /gifts_from_seed_fkey ist NOT VALID/],
      ["ON UPDATE CASCADE", `alter table public.gifts drop constraint gifts_from_seed_fkey; alter table public.gifts add constraint gifts_from_seed_fkey foreign key (from_seed) references public.seeds(id) on delete cascade on update cascade`, /gifts_from_seed_fkey hat ON UPDATE c statt NO ACTION/],
      ["CHECK auf einer Spalte, die NULL werden soll", `alter table public.gifts add constraint gifts_no_self check (from_seed <> to_seed)`, /CHECK-Constraint gifts\.gifts_no_self verwendet eine Spalte, die NULL werden soll/],
      ["eindeutiger Schlüssel fehlt", `alter table public.twin_works drop constraint twin_works_seed_id_partner_id_key`, /eindeutiger Schlüssel twin_works\(\{seed_id,partner_id\}\) liegt 0 mal vor/],
      ["weitere Tabelle verweist auf gifts", `create table public.gift_notes (gift_id uuid references public.gifts(id))`, /unerwarteter Verweis gift_notes_gift_id_fkey \(gift_notes\) auf gifts mit Löschverhalten a/],
      ["gift_reads ohne CASCADE", `alter table public.gift_reads drop constraint gift_reads_gift_id_fkey; alter table public.gift_reads add constraint gift_reads_gift_id_fkey foreign key (gift_id) references public.gifts(id)`, /unerwarteter Verweis gift_reads_gift_id_fkey \(gift_reads\) auf gifts mit Löschverhalten a/],
      ["Funktion weicht ab (erwartete Stelle fehlt)", `create or replace function public.abandon_village(_seed uuid) returns void language plpgsql security definer set search_path to 'public' as $f$ begin delete from seeds where id = _seed; end $f$`, /abandon_village enthält die erwartete Stelle 0 mal statt einmal: DELETE FROM village_visits/],
      ["Funktion ohne SECURITY DEFINER", `alter function public.purge_user_data(uuid) security invoker`, /public\.purge_user_data ist nicht SECURITY DEFINER/],
      ["überladene Funktion", `create function public.abandon_village(_seed uuid, _x int) returns void language sql as 'select'`, /public\.abandon_village liegt 2 mal vor statt einmal/],
      ["Spalte mit anderem Typ", `alter table public.twin_works drop constraint twin_works_partner_id_fkey; alter table public.twin_works alter column partner_id type text`, /twin_works\.partner_id ist text statt uuid/],
    ];
    it.each(cases)("F9 „%s“: bricht ab, bevor etwas geändert ist", async (label, prep, message) => {
      const s = await fresh(`pre${++n}`);
      try {
        const a = await village(s), b = await village(s);
        await gift(s, a, b); await visit(s, a, b); await work(s, a, b);
        await s.unsafe(prep);
        const c0 = await catalog(s), r0 = await rowsHash(s, ["gifts", "referrals", "village_visits", "twin_works"]);
        expect(await err(apply(s)), label).toMatch(message);
        expect(await catalog(s)).toBe(c0);
        expect(await rowsHash(s, ["gifts", "referrals", "village_visits", "twin_works"])).toBe(r0);
        expect(await count(s, "pg_proc where proname = 'finance_orphan_cleanup'")).toBe(0);
      } finally { await s.end(); }
    });
    it("F9 Zeilen, die auf ein fehlendes Dorf verweisen, werden gefunden — auch neben NULL-Werten (kein NOT IN)", async () => {
      const s = await fresh("pre_null");
      try {
        const a = await village(s), b = await village(s);
        await gift(s, a, b);
        // a dangling reference next to a NULL: NOT IN (…NULL…) would find nothing, NOT EXISTS finds it
        await s.unsafe(`alter table public.village_visits alter column visited_seed drop not null`);
        await put(s, "village_visits", { visitor_seed: a.id, visited_seed: null, reward: 1 });
        await put(s, "village_visits", { visitor_seed: a.id, visited_seed: uid(), reward: 1 });
        const c0 = await catalog(s);
        expect(await err(apply(s))).toMatch(/village_visits\.visited_seed: 1 Zeilen verweisen auf ein fehlendes Dorf/);
        expect(await catalog(s)).toBe(c0);
      } finally { await s.end(); }
    });
    it("F9 vorhandene Daten bleiben beim Einspielen unverändert (nur Löschregeln und NOT NULL ändern sich)", async () => {
      const s = await fresh("data");
      try {
        const a = await village(s), b = await village(s), c = await village(s);
        await gift(s, a, b); await gift(s, b, c, 15, "thanks"); await visit(s, a, b); await visit(s, c, a); await referral(s, a, b); await work(s, a, b); await work(s, b, a);
        const t = ["gifts", "referrals", "village_visits", "twin_works", "seeds"];
        const r0 = await rowsHash(s, t), bal = [await balance(s, a), await balance(s, b), await balance(s, c)];
        expect(await err(apply(s))).toBe("ok");
        expect(await rowsHash(s, t)).toBe(r0);
        expect([await balance(s, a), await balance(s, b), await balance(s, c)]).toEqual(bal);
      } finally { await s.end(); }
    });
  });

  // ================= F10 =================
  it("F10 erneutes Einspielen ändert nichts (Katalog und Daten gleich)", async () => {
    const t = ["gifts", "referrals", "village_visits", "twin_works", "princely_errands"];
    const c0 = await catalog(sql), r0 = await rowsHash(sql, t);
    expect(await err(apply(sql))).toBe("ok");
    expect(await err(apply(sql))).toBe("ok");
    expect(await catalog(sql)).toBe(c0);
    expect(await rowsHash(sql, t)).toBe(r0);
  });
});
