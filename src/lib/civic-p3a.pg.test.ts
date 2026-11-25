// Gemeindebauten P3a, migration 0155: one stage table (civic_stage_defs ↔ civic.ts CIVIC), unlocking of Spital 2/3 and
// Waage 2, the booking path for the new stages and their effects. Runs the REAL purchase_guard (0123–0125, patched by
// 0143/0144/0147/0151/0155), the village lock from 0052 and 0142–0148 + 0151 + 0155 against a throw-away PostgreSQL
// (BUILD_MAIL_TEST_PG=postgres://...). Dates are taken from the database's own UTC day, so nothing depends on the hour.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CIVIC, CIVIC_STAGES, civicNeed, civicRaiseRange } from "@/game/civic";
import { resourceRates } from "@/game/resources";
import type { TownWay } from "@/game/character";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: P3a DB tests must run");
const d = BASE ? describe : describe.skip;
const mig = (f: string) =>
  readFileSync(new globalThis.URL(`../../drizzle/migrations/${f}`, import.meta.url), "utf8");
const M052 = mig("0052_resident_tax_receipts.sql");
const LOCK_FN = M052.slice(
  M052.indexOf("CREATE OR REPLACE FUNCTION public.tax_spend_lock()"),
  M052.indexOf("REVOKE ALL ON FUNCTION public.tax_spend_lock()"),
);
const LOCK_TRIGGER =
  /CREATE TRIGGER a_tax_spend_lock BEFORE INSERT ON public\.purchases[^\n]*/.exec(M052)![0];
const GUARD = [
  "0123_bauhuette_only_guard.sql",
  "0124_ausbau_stufen_guard.sql",
  "0125_nothilfe_purchase_guard.sql",
];
const BEFORE = [
  "0142_resources.sql",
  "0143_steingrube.sql",
  "0144_steingrube_platz.sql",
  "0145_a1_investment_material.sql",
  "0147_gemeindebauten_p2.sql",
  "0148_civic_cash_history.sql",
  "0151_ankauf.sql",
  "0153_civic_kauf_zaehlung.sql",
];
const M155 = mig("0155_gemeindebauten_p3a.sql");
// 0151 also patches the purchase counting: the live quest_guard (0102) and princely_task_met (0081) must exist
const M102 = mig("0102_lonely_quests_unpaid.sql");
const QUEST_GUARD = M102.slice(
  M102.indexOf("CREATE OR REPLACE FUNCTION public.quest_guard()"),
  M102.indexOf("ALTER TABLE public.village_visits"),
);
const M081 = mig("0081_repeat_visits_for_decree.sql");
const TASK_MET = M081.slice(M081.indexOf("CREATE OR REPLACE FUNCTION public.princely_task_met"));
const OWNER = "00000000-0000-0000-0000-0000000000c3";
const DAY = 864e5;
/** Functions 0155 must leave byte-identical: the Ankauf (P1) and every other step of the Gemeindebau booking. */
const UNTOUCHED = [
  "resource_refresh_at(uuid,date)",
  "resource_overview(uuid)",
  "ankauf_book(uuid,uuid,date,timestamptz,integer,integer)",
  "ankauf_price(uuid,text,timestamptz)",
  "ankauf_since(text)",
  "civic_day(uuid,date,timestamptz)",
  "civic_deposit_price(uuid,text,integer)",
  "civic_cash_from(uuid,timestamptz)",
  "resource_kontor_at(uuid,integer,integer,timestamptz)",
  "purchase_material()",
  "quest_guard()", // purchase counting F-P2-1 (0151/0153)
  "princely_task_met(uuid,text,timestamptz)",
];
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xc30000 + ++n).toString(16).padStart(12, "0")}`;

d("Gemeindebauten P3a (0155, real guard, real PostgreSQL)", () => {
  const DB = `samenland_p3a_${process.pid}`;
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: ReturnType<typeof postgres>;
  let today = 0;
  let before: Record<string, string> = {};

  const dayStr = (k: number) => new Date(today + k * DAY).toISOString().slice(0, 10);
  const book = (id: string, k: number) =>
    sql`select public.resource_refresh_at(${id}, ${dayStr(k)}::date)`;
  const md5s = async (sigs: string[]) => {
    const out: Record<string, string> = {};
    for (const s of sigs)
      out[s] = (
        await sql`select md5(p.prosrc) as m from pg_proc p where p.oid = to_regprocedure(${"public." + s})`
      )[0]!["m"] as string;
    return out;
  };
  /** A lab village founded `age` days ago (default yesterday noon), certified at `rank`, with a site and its production
   *  booked through day `through` (default today). */
  const seed = async (
    o: {
      rank?: number;
      site?: TownWay;
      stock?: [number, number];
      age?: number;
      through?: number;
    } = {},
  ) => {
    const id = nextSeed();
    await sql`insert into public.seeds (id, user_id, realm, x, y, created_at)
      values (${id}, ${OWNER}, 'lab', 500, 340, ${new Date(today - (o.age ?? 0.5) * DAY).toISOString()})`;
    await sql`insert into public.rank_certificates (seed_id, rank, citizens, ways, certified_at) values (${id}, ${o.rank ?? 3}, 0, 0, now())`;
    await sql`insert into public.test_balance values (${id}, 100000)`;
    await sql`insert into public.village_sites (seed_id, way) values (${id}, ${o.site ?? "grain"})`;
    await book(id, o.through ?? 0);
    if (o.stock)
      for (const [r, v] of [
        ["wood", o.stock[0]],
        ["stone", o.stock[1]],
      ] as const)
        await sql`insert into public.resource_ledger (seed_id, resource, amount, kind, ref, at)
          values (${id}, ${r}, ${v}, 'prod', ${"test-" + r}, ${new Date(Date.now() - 60000).toISOString()})`;
    return id;
  };
  /** A finished stage as civic_day leaves it: its civic_stages row and its marker, both dated in the past. */
  const finished = async (id: string, stage: string) => {
    const t = new Date(Date.now() - 3600e3).toISOString();
    await sql`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days, funded_at, material_at, done_at)
      values (${id}, ${stage}, 1, 0, 0, 0, 1, ${t}, ${t}, ${t})`;
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${id}, ${OWNER}, ${stage}, 0, ${t})`;
    });
  };
  const as = <T>(f: (tx: postgres.TransactionSql) => Promise<T>, uid = OWNER) =>
    sql.begin(async (tx) => {
      await tx`select set_config('test.uid', ${uid}, true), set_config('test.role', 'authenticated', true)`;
      return f(tx);
    }) as Promise<T>;
  const raise = (id: string, stage: string, budget: number, uid = OWNER) =>
    as((tx) => tx`select public.civic_raise_budget(${id}, ${stage}, ${budget}) as r`, uid).then(
      (r) => r[0]!["r"] as Record<string, number | string>,
      (e: Error) => e.message,
    );
  const stage = async (id: string, item: string) =>
    (
      await sql`select budget, kontor_spent, wood_got, stone_got, need_wood, need_stone, funded_at, material_at
        from public.civic_stages where seed_id = ${id} and item = ${item}`
    )[0]!;
  const spent = async (id: string) =>
    Number(
      (
        await sql`select coalesce(sum(cost), 0) as c from public.purchases where seed_id = ${id} and cost > 0`
      )[0]!["c"],
    );
  const open = (id: string, stage: string, budget = 0) =>
    as((tx) => tx`select public.civic_open(${id}, ${stage}, ${budget}) as r`).then(
      (r) => r[0]!["r"] as Record<string, number | string>,
      (e: Error) => e.message,
    );
  const pay = (id: string, item: string, cost: number) =>
    as(
      (tx) =>
        tx`insert into public.purchases (seed_id, user_id, item, cost) values (${id}, ${OWNER}, ${item}, ${cost}) returning cost`,
    ).then(
      () => "ok",
      (e: Error) => e.message,
    );
  const rows = async (id: string) =>
    (
      await sql`select item, cost, created_at from public.purchases where seed_id = ${id} order by created_at, item`
    ).map((r) => ({
      item: r["item"] as string,
      cost: r["cost"] as number,
      at: new Date(r["created_at"]).getTime(),
    }));

  beforeAll(async () => {
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.unsafe(`create database ${DB}`);
    const u = new globalThis.URL(BASE!);
    u.pathname = `/${DB}`;
    sql = postgres(u.toString(), { max: 4, onnotice: () => {} });
    await sql.unsafe(`
      set timezone = 'UTC';
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
      create function auth.role() returns text language sql stable as $$ select nullif(current_setting('test.role', true), '') $$;
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
        if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
      end $$;
      create table public.seeds (id uuid primary key, user_id uuid, realm text not null, x integer, y integer, created_at timestamptz not null);
      create table public.purchases (id uuid primary key default gen_random_uuid(), seed_id uuid not null references public.seeds(id),
        user_id uuid not null, item text not null, cost integer not null default 0, created_at timestamptz not null default now(), x integer, y integer);
      create table public.charters (seed_id uuid, path text);
      create table public.rank_certificates (seed_id uuid primary key, rank integer, citizens integer, ways integer, certified_at timestamptz);
      create table public.first_roads (seed_id uuid, target_id uuid);
      create function public.road_done(a uuid, b uuid) returns timestamptz language sql stable as $$ select now() - interval '1 day' $$;
      create table public.test_balance (seed_id uuid primary key, balance integer);
      create table public.tax_receipts (seed_id uuid, day integer, income integer);
      create table public.encounters (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz not null);
      create table public.twin_works (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz not null);
      create table public.building_moves (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz not null);
      create table public.gifts (id uuid primary key default gen_random_uuid(), from_seed uuid, to_seed uuid, amount integer, created_at timestamptz not null);
      create function public.village_raid_list(_seed uuid, _from timestamptz, _to timestamptz) returns table(t timestamptz, loss integer)
        language sql stable as $$ select null::timestamptz, 0 where false $$;
      create function public.village_balance_walk(_seed uuid, _since timestamptz, _at timestamptz) returns integer language sql stable as
        $$ select coalesce((select balance from public.test_balance where seed_id = _seed), 5000)
             - coalesce((select sum(cost) from public.purchases where seed_id = _seed and created_at <= _at), 0)::int $$;
      create function public.village_balance(_seed uuid) returns integer language sql stable as
        $$ select public.village_balance_walk(_seed, timestamptz '2026-11-12 00:00:00+00', 'infinity') $$;
      create table public.quest_claims (id uuid primary key default gen_random_uuid(), seed_id uuid, user_id uuid, quest text, reward integer default 0, created_at timestamptz default now());
      create table public.blessings (seed_id uuid);
      create table public.signposts (seed_id uuid);
      create table public.letters (from_seed uuid, created_at timestamptz);
      create table public.village_visits (visitor_seed uuid, created_at timestamptz, last_at timestamptz);
      create table public.wonder_finds (seed_id uuid, created_at timestamptz);
      create table public.princely_tasks (id uuid primary key default gen_random_uuid(), seed_id uuid, task text, done_at timestamptz);
      create table public.princely_errands (task_id uuid, seed_id uuid, errand text);
      alter table public.first_roads add column created_at timestamptz;
      grant usage on schema public, auth to authenticated; grant select on public.seeds to authenticated;
      grant insert, select on public.purchases to authenticated;`);
    await sql.unsafe(QUEST_GUARD);
    await sql.unsafe(TASK_MET);
    await sql.unsafe(LOCK_FN);
    await sql.unsafe(LOCK_TRIGGER);
    for (const g of GUARD) await sql.unsafe(mig(g));
    await sql.unsafe(
      `create trigger purchase_guard before insert on public.purchases for each row execute function public.purchase_guard();`,
    );
    for (const m of BEFORE) await sql.unsafe(mig(m));
    today = Number(
      (
        await sql`select (extract(epoch from date_trunc('day', now() at time zone 'UTC')) * 1000)::bigint as t`
      )[0]!["t"],
    );
    before = await md5s(UNTOUCHED);
    await sql.unsafe(M155);
    await sql.unsafe(M155); // idempotent: guard, table, constraint, index and functions stay as after the first run
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  it("one stage table, equal to civic.ts CIVIC; the Ankauf and the rest of the booking path stay byte-identical", async () => {
    const defs =
      await sql`select item, price, build_days, min_rank, after_item from public.civic_stage_defs order by item`;
    expect(defs.map((r) => r["item"]).sort()).toEqual([...CIVIC_STAGES].sort());
    for (const r of defs) {
      const c = CIVIC[r["item"] as keyof typeof CIVIC];
      expect(
        [r["price"], r["build_days"], r["min_rank"], r["after_item"]],
        r["item"] as string,
      ).toEqual([c.price, c.days, c.rank, c.after]);
    }
    expect(Object.values(before).every((m) => /^[0-9a-f]{32}$/.test(m))).toBe(true);
    expect(await md5s(UNTOUCHED)).toEqual(before);
    const [g] = await sql`select pg_get_functiondef('public.purchase_guard()'::regprocedure) as d`;
    const guard = g!["d"] as string;
    expect(guard).not.toContain("(spital1|waage1)");
    expect(guard.split("(spital|waage)[1-9][0-9]*").length - 1).toBe(3);
    expect(guard.split("samenland.ankauf").length - 1).toBe(2); // P1 untouched
    // no stage outside the table
    const id = await seed();
    await expect(
      sql`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days) values (${id}, 'spital9', 1, 0, 0, 0, 1)`,
    ).rejects.toThrow(/foreign key/);
  });

  it("Spital 2 opens only from Kleinstadt and only once Spital 1 stands; stage 1 still opens from Dorf", async () => {
    const dorf = await seed({ rank: 2 });
    expect(await open(dorf, "spital2")).toContain("previous stage open");
    await finished(dorf, "spital1");
    expect(await open(dorf, "spital2")).toContain("rank too low");
    expect(await open(dorf, "waage1")).toMatchObject({ item: "waage1", price: 12000 }); // P2 path unchanged
    const klein = await seed({ rank: 3 });
    await finished(klein, "spital1");
    expect(await open(klein, "spital2")).toEqual({
      item: "spital2",
      price: 18000,
      budget: 0,
      wood: civicNeed("spital2").wood,
      stone: civicNeed("spital2").stone,
      days: 35,
    });
  });

  it("Spital 3 follows Spital 2 (no Handelsstadt needed); Waage 2 follows Waage 1; a stage still building blocks", async () => {
    const id = await seed({ rank: 3 });
    expect(await open(id, "spital3")).toContain("previous stage open");
    expect(await open(id, "waage2")).toContain("previous stage open");
    await finished(id, "spital1");
    await finished(id, "spital2");
    expect(await open(id, "spital3")).toMatchObject({
      price: 22000,
      wood: 110,
      stone: 73,
      days: 42,
    });
    const w = await seed({ rank: 3 });
    // Waage 1 material complete, still building: marker dated in the future → not yet standing
    const soon = new Date(Date.now() + 5 * DAY).toISOString();
    await sql`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days, funded_at, material_at, done_at)
      values (${w}, 'waage1', 1, 0, 0, 0, 1, now(), now(), ${soon})`;
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${w}, ${OWNER}, 'waage1', 0, ${soon})`;
    });
    expect(await open(w, "waage2")).toMatch(/site busy|previous stage open/);
    const w2 = await seed({ rank: 3 });
    await finished(w2, "waage1");
    expect(await open(w2, "waage2")).toMatchObject({ price: 18000, wood: 90, stone: 60, days: 21 });
  });

  it("a new stage books like stage 1: instalments, server-only marker and Kontor rows, material, build days", async () => {
    const id = await seed({ rank: 3, stock: [400, 300] });
    await finished(id, "spital1");
    expect(await open(id, "spital2")).toMatchObject({ item: "spital2" });
    // clients may pay instalments in order, but never book the marker or a Kontor row
    expect(await pay(id, "spital2:r2", 100)).toContain("previous step open");
    expect(await pay(id, "spital2:r1", 10000)).toBe("ok");
    expect(await pay(id, "spital2", 0)).toContain("civic rows are booked by the server");
    expect(await pay(id, `spital2:k${dayStr(1).replaceAll("-", "")}`, 5)).toContain(
      "civic rows are booked by the server",
    );
    expect(await pay(id, "spital2:r2", 9000)).toContain("bad amount"); // only 8.000 open
    expect(await pay(id, "spital2:r2", 8000)).toBe("ok");
    const st =
      await sql`select funded_at from public.civic_stages where seed_id = ${id} and item = 'spital2'`;
    expect(st[0]!["funded_at"]).not.toBeNull();
    await book(id, 1); // store above 40/30 holds the whole material
    const [s] =
      await sql`select wood_got, stone_got, material_at, done_at from public.civic_stages where seed_id = ${id} and item = 'spital2'`;
    expect([s!["wood_got"], s!["stone_got"]]).toEqual([90, 60]);
    expect(new Date(s!["done_at"]).getTime()).toBe(today + DAY + 35 * DAY);
    const marker = (await rows(id)).filter((r) => r.item === "spital2");
    expect(marker).toEqual([{ item: "spital2", cost: 0, at: today + DAY + 35 * DAY }]);
  });

  it("with a Kontor budget the new stage buys its daily quota as its own money rows, within the limit", async () => {
    const id = await seed({ rank: 3 });
    await finished(id, "waage1");
    const [mx] = await sql`select public.resource_kontor_at(${id}, 90, 60, now()) as m`;
    const budget = Math.floor((mx!["m"] as number) / 2);
    expect(await open(id, "waage2", budget)).toMatchObject({ budget });
    expect(await pay(id, "waage2:r1", 18000)).toBe("ok");
    for (let k = 1; k <= 3; k++) await book(id, k);
    const k = (await rows(id)).filter((r) => /^waage2:k[0-9]{8}$/.test(r.item));
    expect(k.length).toBeGreaterThan(0);
    const [s] =
      await sql`select kontor_spent, budget from public.civic_stages where seed_id = ${id} and item = 'waage2'`;
    expect(s!["kontor_spent"]).toBe(k.reduce((a, r) => a + r.cost, 0));
    expect(s!["kontor_spent"] as number).toBeLessThanOrEqual(s!["budget"] as number);
  });

  it("Spital 3 and Waage 2 act on production and storage exactly as resourceRates says, from their marker on", async () => {
    for (const site of ["grain", "workshop", "gateway"] as const) {
      const id = await seed({ rank: 3, site });
      const at = new Date(today + DAY).toISOString();
      const db = async () =>
        Object.fromEntries(
          await Promise.all(
            (["wood", "stone"] as const).map(async (r) => [
              r,
              {
                rate: Number(
                  (
                    await sql`select public.resource_rate(${id}, ${r}, ${at}::timestamptz) as v`
                  )[0]!["v"],
                ),
                cap: (
                  await sql`select public.resource_cap(${id}, ${r}, ${at}::timestamptz) as v`
                )[0]!["v"] as number,
              },
            ]),
          ),
        );
      expect(await db()).toEqual(resourceRates(new Set(), site));
      await finished(id, "spital3");
      await finished(id, "waage2");
      expect(await db()).toEqual(resourceRates(new Set(["spital3", "waage2"]), site));
    }
  });

  it("civic_raise_budget: owner only, only upwards, at most the full Kontor price; instalments and building price unchanged", async () => {
    expect(
      (
        await sql`select has_function_privilege('anon', 'public.civic_raise_budget(uuid,text,integer)', 'execute') as a,
          has_function_privilege('authenticated', 'public.civic_raise_budget(uuid,text,integer)', 'execute') as u`
      )[0],
    ).toEqual({ a: false, u: true });
    const id = await seed({ rank: 2 });
    expect(await raise(id, "spital1", 100)).toContain("stage not open");
    expect(await open(id, "spital1", 200)).toMatchObject({ budget: 200 });
    const max = civicRaiseRange(
      { budget: 200, need_wood: 50, need_stone: 33, material_at: null },
      "grain",
      false,
    )!.max;
    expect(max).toBe(398); // 50 × 4 + 33 × 6, the same cap civic_open uses
    expect(await raise(id, "spital1", 300, "00000000-0000-0000-0000-0000000000ff")).toContain(
      "not owner",
    );
    expect(await raise(id, "spital1", 200)).toContain("bad budget"); // not higher
    expect(await raise(id, "spital1", 150)).toContain("bad budget"); // never lower
    expect(await raise(id, "spital1", max + 1)).toContain("bad budget"); // never beyond the full Kontor price
    // while still funding: the limit rises, nothing is paid or reserved, the instalments stay bound to the building price
    expect(await raise(id, "spital1", 300)).toEqual({
      item: "spital1",
      budget: 300,
      spent: 0,
      max,
    });
    expect(await raise(id, "spital1", max)).toMatchObject({ budget: max });
    expect(await spent(id)).toBe(0);
    expect(await pay(id, "spital1:r1", 10001)).toContain("bad amount");
    expect(await pay(id, "spital1:r1", 4000)).toBe("ok");
    expect(await pay(id, "spital1:r2", 6000)).toBe("ok");
    expect((await stage(id, "spital1"))["funded_at"]).not.toBeNull();
    expect(await spent(id)).toBe(10000); // the instalments only — the Kontor limit is no money
  });

  it("civic_raise_budget books every open day with the old limit first; the new limit acts from the next day, never back", async () => {
    // funded three days ago, budget 0, production booked only through day −3: days −2, −1 and today are still open
    const id = await seed({ rank: 2, age: 4, through: -3 });
    expect(await open(id, "spital1", 0)).toMatchObject({ budget: 0 });
    expect(await pay(id, "spital1:r1", 10000)).toBe("ok");
    await sql`update public.civic_stages set funded_at = ${new Date(today - 3 * DAY + 3600e3).toISOString()}
      where seed_id = ${id} and item = 'spital1'`;
    const before = await spent(id);
    const r = await raise(id, "spital1", 300);
    expect(r).toMatchObject({ budget: 300, spent: 0 });
    // the open days were booked up to today — with the old limit 0: store material only, no Kontor row
    const [thru] =
      await sql`select through_day::text as d from public.resource_state where seed_id = ${id}`;
    expect(thru!["d"]).toBe(dayStr(0));
    const s0 = await stage(id, "spital1");
    expect(s0["wood_got"] as number).toBeGreaterThan(0);
    expect([s0["kontor_spent"], s0["budget"], s0["material_at"]]).toEqual([0, 300, null]);
    expect((await rows(id)).filter((x) => x.item.startsWith("spital1:k"))).toEqual([]);
    expect(await spent(id)).toBe(before); // nothing paid by the raise
    // the next day buys its quota at the Kontor within the new limit, as its own money row dated that day
    await book(id, 1);
    const k = (await rows(id)).filter((x) => x.item.startsWith("spital1:k"));
    expect(k.map((x) => [x.item, x.at])).toEqual([
      [`spital1:k${dayStr(1).replaceAll("-", "")}`, today + DAY + 1000],
    ]);
    const s1 = await stage(id, "spital1");
    expect(s1["kontor_spent"]).toBe(k[0]!.cost);
    expect(k[0]!.cost).toBeGreaterThan(0);
    expect(k[0]!.cost).toBeLessThanOrEqual(300);
    // a second raise later leaves the booked day 1 as it is
    await raise(id, "spital1", 398).then(() => undefined);
    expect((await rows(id)).filter((x) => x.item.startsWith("spital1:k"))).toEqual(k);
  });

  it("civic_raise_budget refuses once the material is complete", async () => {
    const id = await seed({ rank: 3, stock: [400, 300] });
    await open(id, "waage1", 0);
    expect(await pay(id, "waage1:r1", 12000)).toBe("ok");
    await book(id, 1);
    expect((await stage(id, "waage1"))["material_at"]).not.toBeNull();
    expect(await raise(id, "waage1", 10)).toContain("material complete");
  });
});
