// Wirtschaftsumbau P1: Ankauf, migration 0151. Runs the REAL purchase_guard (0123–0125, patched by 0143/0144/0147/0151),
// the village lock from 0052 and 0142–0148 + 0151 against a throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...),
// own databases. Days are booked with resource_refresh_at(seed, UTC day), exactly as the lazy daily bookkeeping does.
// Every date is taken relative to the database's own UTC day, so the tests do not depend on the calendar or the hour.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ankaufItem,
  ankaufMark,
  resourceDaily,
  resourceDay,
  resourceRates,
} from "@/game/resources";
import { walkChest, type ChestEvent } from "@/game/economy";
import type { TownWay } from "@/game/character";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: Ankauf DB tests must run");
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
  mig("0123_bauhuette_only_guard.sql"),
  mig("0124_ausbau_stufen_guard.sql"),
  mig("0125_nothilfe_purchase_guard.sql"),
];
const BEFORE = [
  "0142_resources.sql",
  "0143_steingrube.sql",
  "0144_steingrube_platz.sql",
  "0145_a1_investment_material.sql",
  "0147_gemeindebauten_p2.sql",
  "0148_civic_cash_history.sql",
].map(mig);
const M151 = mig("0151_ankauf.sql");
const M118 = mig("0118_building_moves.sql");
const WALK = M118.slice(
  M118.indexOf("CREATE OR REPLACE FUNCTION public.village_balance_walk"),
  M118.indexOf("ALTER PUBLICATION"),
);
const OWNER = "00000000-0000-0000-0000-0000000000e1";
const DAY = 864e5;
/** DB resource_daily day number (days since 2000-01-01) of the UTC day starting at `d0`. */
const dayNo = (d0: number) => Math.round((d0 - Date.UTC(2000, 0, 1)) / DAY);
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xe00000 + ++n).toString(16).padStart(12, "0")}`;
const ROLES = `do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;`;

d("Ankauf P1 (0151, real guard, real PostgreSQL)", () => {
  const DB = `samenland_ankauf_${process.pid}`;
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: ReturnType<typeof postgres>;
  let today = 0; // the database's UTC day start (ms)
  let oldSeed = "";
  let oldRows: unknown = [];
  let oldLedger: unknown = [];

  /** UTC day `k` days after the database's today, as a date string for resource_refresh_at. */
  const dayStr = (k: number) => new Date(today + k * DAY).toISOString().slice(0, 10);
  const book = (id: string, k: number) =>
    sql`select public.resource_refresh_at(${id}, ${dayStr(k)}::date)`;
  /** A lab village founded at noon `ageDays` UTC days ago, certified, not yet booked. */
  const seed = async (
    o: { realm?: string; ageDays?: number; site?: TownWay; money?: number; owned?: string[] } = {},
  ) => {
    const id = nextSeed();
    const c0 = new Date(today - (o.ageDays ?? 1) * DAY + DAY / 2).toISOString();
    await sql`insert into public.seeds (id, user_id, realm, x, y, created_at)
      values (${id}, ${OWNER}, ${o.realm ?? "lab"}, 500, 340, ${c0})`;
    await sql`insert into public.rank_certificates (seed_id, rank, citizens, ways, certified_at) values (${id}, 5, 0, 0, now())`;
    await sql`insert into public.test_balance values (${id}, ${o.money ?? 1000})`;
    await sql`insert into public.village_sites (seed_id, way) values (${id}, ${o.site ?? "grain"})`;
    // buildings bought at the founding, written past the triggers (as rows that already stand in the table)
    for (const item of o.owned ?? [])
      await sql.begin(async (tx) => {
        await tx`set local session_replication_role = replica`;
        await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${id}, ${OWNER}, ${item}, 0, ${c0})`;
      });
    return { id, c0 };
  };
  const stock = async (id: string, before = "infinity") => {
    const r =
      await sql`select resource, public.resource_stock(${id}, resource, ${before}::text::timestamptz) as s from unnest(array['wood','stone']) resource`;
    return Object.fromEntries(r.map((x) => [x["resource"], x["s"]])) as {
      wood: number;
      stone: number;
    };
  };
  /** Sets the stock to exact values with ledger rows at `at` (default: one minute ago). */
  const setStock = async (id: string, wood: number, stone: number, at?: string) => {
    const s = await stock(id);
    for (const [r, delta] of [
      ["wood", wood - s.wood],
      ["stone", stone - s.stone],
    ] as const)
      if (delta !== 0)
        await sql`insert into public.resource_ledger (seed_id, resource, amount, kind, ref, at)
          values (${id}, ${r}, ${delta}, ${delta > 0 ? "prod" : "build"}, ${"test-" + r + "-" + Math.random()},
          ${at ?? new Date(Date.now() - 60000).toISOString()})`;
  };
  const credits = async (id: string) =>
    (
      await sql`select item, cost, created_at from public.purchases where seed_id = ${id} and item like 'ankauf:%' order by created_at`
    ).map((r) => ({
      item: r["item"] as string,
      cost: r["cost"] as number,
      at: new Date(r["created_at"]).getTime(),
    }));
  const cap = async (id: string, r: string, at: number) =>
    (
      await sql`select public.resource_cap(${id}, ${r}, ${new Date(at).toISOString()}::timestamptz) as c`
    )[0]!["c"] as number;
  const as = <T>(uid: string, f: (tx: postgres.TransactionSql) => Promise<T>) =>
    sql.begin(async (tx) => {
      await tx`select set_config('test.uid', ${uid}, true), set_config('test.role', 'authenticated', true)`;
      return f(tx);
    }) as Promise<T>;

  beforeAll(async () => {
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.unsafe(`create database ${DB}`);
    const u = new globalThis.URL(BASE!);
    u.pathname = `/${DB}`;
    sql = postgres(u.toString(), { max: 8, onnotice: () => {} });
    await sql.unsafe(`
      set timezone = 'UTC';
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
      create function auth.role() returns text language sql stable as $$ select nullif(current_setting('test.role', true), '') $$;
      ${ROLES}
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
      -- chest walk stand-in (as in civic.pg.test.ts): start money plus every money row up to _at, no chest cap; the
      -- real walk with its cap runs in the second suite below
      create function public.village_balance_walk(_seed uuid, _since timestamptz, _at timestamptz) returns integer language sql stable as
        $$ select coalesce((select balance from public.test_balance where seed_id = _seed), 5000)
             - coalesce((select sum(cost) from public.purchases where seed_id = _seed and created_at <= _at), 0)::int
             - coalesce((select sum(cost) from public.encounters where seed_id = _seed and created_at <= _at), 0)::int
             - coalesce((select sum(cost) from public.twin_works where seed_id = _seed and created_at <= _at), 0)::int
             - coalesce((select sum(cost) from public.building_moves where seed_id = _seed and created_at <= _at), 0)::int
             - coalesce((select sum(amount) from public.gifts where from_seed = _seed and created_at <= _at), 0)::int
             + coalesce((select sum(amount) from public.gifts where to_seed = _seed and created_at <= _at), 0)::int $$;
      create function public.village_balance(_seed uuid) returns integer language sql stable as
        $$ select public.village_balance_walk(_seed, timestamptz '2026-11-12 00:00:00+00', 'infinity') $$;
      grant usage on schema public, auth to authenticated; grant select on public.seeds to authenticated;
      grant insert, select on public.purchases to authenticated;`);
    await sql.unsafe(LOCK_FN);
    await sql.unsafe(LOCK_TRIGGER);
    for (const g of GUARD) await sql.unsafe(g);
    await sql.unsafe(
      `create trigger purchase_guard before insert on public.purchases for each row execute function public.purchase_guard();`,
    );
    for (const m of BEFORE) await sql.unsafe(m);
    today = Number(
      (
        await sql`select (extract(epoch from date_trunc('day', now() at time zone 'UTC')) * 1000)::bigint as t`
      )[0]!["t"],
    );
    // a lab village with ordinary purchases and booked days before P1: its rows must stay exactly as they are
    oldSeed = (await seed({ ageDays: 3 })).id;
    await sql`insert into public.purchases (seed_id, user_id, item, kontor_max, x, y) values (${oldSeed}, ${OWNER}, 'hunter', 0, 505, 340)`;
    await book(oldSeed, 0);
    oldRows =
      await sql`select id, item, cost, material, created_at from public.purchases where seed_id = ${oldSeed} order by id`;
    oldLedger =
      await sql`select id, resource, amount, kind, ref, at from public.resource_ledger where seed_id = ${oldSeed} order by id`;
    await sql.unsafe(M151);
    await sql.unsafe(M151); // idempotent: the guard patch, the start date and every function stay as after the first run
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  it("existing rows stay untouched; the start is the next UTC day for lab, 2100-01-04 for public maps", async () => {
    await book(oldSeed, 3);
    expect(
      await sql`select id, item, cost, material, created_at from public.purchases where seed_id = ${oldSeed} and item not like 'ankauf:%' order by id`,
    ).toEqual(oldRows);
    const ledger =
      await sql`select id, resource, amount, kind, ref, at from public.resource_ledger where seed_id = ${oldSeed} order by id`;
    for (const r of oldLedger as Record<string, unknown>[])
      expect(ledger.find((x) => x["id"] === r["id"])).toEqual(r);
    const [s] =
      await sql`select public.ankauf_since('lab') as lab, public.ankauf_since('europe') as eu, public.ankauf_since('lab-2') as l2`;
    expect(new Date(s!["lab"]).getTime()).toBe(today + DAY);
    expect(new Date(s!["eu"]).toISOString()).toBe("2100-01-04T00:00:00.000Z");
    expect(new Date(s!["l2"]).toISOString()).toBe("2100-01-04T00:00:00.000Z");
    // ordinary purchases still pass the patched guard with their price
    const id = (await seed()).id;
    await book(id, 0);
    const [p] =
      await sql`insert into public.purchases (seed_id, user_id, item, kontor_max, x, y) values (${id}, ${OWNER}, 'herbs', 0, 505, 340) returning cost`;
    expect(p!["cost"]).toBe(90);
  });

  it("only real overflow is bought: 2 Mark per wood, 3 per stone; nothing within the cap", async () => {
    // hill village with woodcamp (7 wood a day) and Steingrube (4.5 stone a day)
    const { id } = await seed({ site: "workshop", owned: ["woodcamp", "steingrube"] });
    await book(id, 0);
    const wc = await cap(id, "wood", today + DAY),
      sc = await cap(id, "stone", today + DAY);
    // room for the whole day: nothing to buy
    await setStock(id, wc - 7, sc - 5);
    await book(id, 1);
    expect(await credits(id)).toEqual([]);
    const full = await stock(id);
    expect(full.wood).toBe(wc);
    expect(full.stone).toBeLessThanOrEqual(sc);
    // three wood and every stone unit of the next day above the cap
    await setStock(id, wc - 4, sc);
    const before = await stock(id);
    await book(id, 2);
    const [c] = await credits(id);
    const w = resourceDay(7, wc, before.wood, dayNo(today + 2 * DAY)),
      s = resourceDay(4.5, sc, before.stone, dayNo(today + 2 * DAY));
    expect(w).toEqual({ prod: 4, over: 3 });
    expect(c).toEqual({
      item: ankaufItem(today + 2 * DAY),
      cost: -(3 * 2 + s.over * 3),
      at: today + 2 * DAY,
    });
    expect(s.over).toBeGreaterThan(0);
    expect(await stock(id)).toEqual({ wood: wc, stone: sc }); // the stock never exceeds the cap
  });

  it("TypeScript and the database use the same caps and rates: every day's credit matches resourceDay", async () => {
    const cases: { site: TownWay; owned: string[] }[] = [
      { site: "grain", owned: [] },
      { site: "workshop", owned: ["woodcamp"] },
      { site: "gateway", owned: ["woodcamp", "granary", "steingrube"] },
      { site: "grain", owned: ["woodcamp", "granary", "granary2", "steingrube"] },
    ];
    for (const c of cases) {
      const { id } = await seed(c);
      await book(id, 0);
      const r = resourceRates(new Set(c.owned), c.site);
      for (const res of ["wood", "stone"] as const)
        expect(await cap(id, res, today + DAY)).toBe(r[res].cap);
      await setStock(id, r.wood.cap - 2, r.stone.cap - 1);
      for (let k = 1; k <= 8; k++) {
        const d0 = today + k * DAY,
          st = await stock(id, new Date(d0).toISOString());
        const over = {
          wood: resourceDay(r.wood.rate, r.wood.cap, st.wood, dayNo(d0)).over,
          stone: resourceDay(r.stone.rate, r.stone.cap, st.stone, dayNo(d0)).over,
        };
        await book(id, k);
        const row = (await credits(id)).find((x) => x.at === d0);
        expect(Math.abs(row?.cost ?? 0)).toBe(ankaufMark(over));
        if (row) expect(row.cost).toBeLessThan(0);
      }
      expect((await credits(id)).length).toBeGreaterThan(0);
    }
  });

  it("parallel catch-ups never book a day twice; a repeated booking of the same day is ignored", async () => {
    const make = async () => {
      const { id } = await seed({ site: "workshop", owned: ["woodcamp"] });
      await book(id, 0);
      await setStock(id, 299, 99);
      return id;
    };
    const ref = await make();
    for (let k = 1; k <= 10; k++) await book(ref, k);
    const p = await make();
    await Promise.all(Array.from({ length: 8 }, () => book(p, 10)));
    const got = await credits(p),
      want = await credits(ref);
    expect(got.map((x) => [x.item, x.cost])).toEqual(want.map((x) => [x.item, x.cost]));
    expect(new Set(got.map((x) => x.item)).size).toBe(got.length);
    expect(got.length).toBe(10);
    // the same day once more, directly: the unique index keeps one row
    await sql`select public.ankauf_book(${p}, ${OWNER}, ${dayStr(3)}::date, ${new Date(today + 3 * DAY).toISOString()}::timestamptz, 5, 5)`;
    expect((await credits(p)).length).toBe(10);
    expect(
      (
        await sql`select count(*)::int as n from public.purchases where seed_id = ${p} and item = ${ankaufItem(today + 3 * DAY)}`
      )[0]!["n"],
    ).toBe(1);
  });

  it("no credit before ankauf_since: overflow of earlier days is never paid, also when caught up later", async () => {
    // founded five days ago, full from the start, never booked until now
    const { id, c0 } = await seed({ ageDays: 5, site: "workshop", owned: ["woodcamp"] });
    await sql`select public.resource_book(${id}, 'wood', 60, 'start', 'start', ${c0}::timestamptz)`;
    await sql`select public.resource_book(${id}, 'stone', 30, 'start', 'start', ${c0}::timestamptz)`;
    await setStock(id, 300, 100, new Date(Date.parse(c0) + 60000).toISOString());
    await book(id, 0); // five past days with overflow, caught up at once
    expect(await credits(id)).toEqual([]);
    expect(await stock(id)).toEqual({ wood: 300, stone: 100 });
    await book(id, 1); // the first day from ankauf_since on
    const stone = resourceDaily(0.5, dayNo(today + DAY));
    expect(await credits(id)).toEqual([
      { item: ankaufItem(today + DAY), cost: -(7 * 2 + stone * 3), at: today + DAY },
    ]);
  });

  it("no credit on a public map before its own date, even where its resources would already run", async () => {
    // only in this test database: a public-like map whose resources run since 2026-11-23 (ankauf_since stays 2100)
    await sql.unsafe(`CREATE OR REPLACE FUNCTION public.resources_since(_realm text) RETURNS timestamptz LANGUAGE sql STABLE
      AS $f$ SELECT CASE WHEN _realm IN ('lab', 'pubtest') THEN '2026-11-23 00:00:00+00'::timestamptz
        ELSE '2100-01-04 00:00:00+00'::timestamptz END $f$`);
    const { id } = await seed({ realm: "pubtest", site: "workshop", owned: ["woodcamp"] });
    await book(id, 0);
    await setStock(id, 300, 100);
    for (let k = 1; k <= 5; k++) await book(id, k);
    expect(await stock(id)).toEqual({ wood: 300, stone: 100 }); // production ran and overflowed …
    expect(await credits(id)).toEqual([]); // … but nothing was bought
    // a real public map: no resources, no credit
    const eu = (await seed({ realm: "europe" })).id;
    for (let k = 0; k <= 3; k++) await book(eu, k);
    expect(await credits(eu)).toEqual([]);
  });

  it("only the server books credits: clients and plain inserts are refused, also with a negative cost", async () => {
    const { id } = await seed();
    const item = ankaufItem(today + 2 * DAY);
    const client = await as(
      OWNER,
      (tx) =>
        tx`insert into public.purchases (seed_id, user_id, item, cost) values (${id}, ${OWNER}, ${item}, -50)`,
    ).then(
      () => "ok",
      (e: Error) => e.message,
    );
    expect(client).toContain("ankauf rows are booked by the server");
    const plain =
      await sql`insert into public.purchases (seed_id, user_id, item, cost) values (${id}, ${OWNER}, ${item}, -50)`.then(
        () => "ok",
        (e: Error) => e.message,
      );
    expect(plain).toContain("ankauf rows are booked by the server");
    const positive = await sql
      .begin(async (tx) => {
        await tx`select set_config('samenland.ankauf', 'on', true)`;
        await tx`insert into public.purchases (seed_id, user_id, item, cost) values (${id}, ${OWNER}, ${item}, 50)`;
      })
      .then(
        () => "ok",
        (e: Error) => e.message,
      );
    expect(positive).toContain("bad ankauf");
    expect(await credits(id)).toEqual([]);
  });

  it("civic_cash_from treats a credit as income, never as an outflow (same as an equal gift received)", async () => {
    const mk = async (viaGift: boolean) => {
      const { id } = await seed({ site: "workshop", owned: ["woodcamp"], money: 1000 });
      await book(id, 0);
      await setStock(id, 300, 100);
      for (let k = 1; k <= 3; k++) await book(id, k);
      const rows = await credits(id);
      if (viaGift) {
        // replace the credits by equal gifts received at the same moments
        await sql`delete from public.purchases where seed_id = ${id} and item like 'ankauf:%'`;
        for (const r of rows)
          await sql`insert into public.gifts (from_seed, to_seed, amount, created_at) values (null, ${id}, ${-r.cost}, ${new Date(r.at).toISOString()})`;
      }
      // a later outflow after the credits, then the cash a day before the first credit may spend
      await sql.begin(async (tx) => {
        await tx`set local session_replication_role = replica`;
        await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${id}, ${OWNER}, 'herbs', 900, ${new Date(today + 3.5 * DAY).toISOString()})`;
      });
      const t = new Date(today + DAY / 2).toISOString();
      return {
        cash: (await sql`select public.civic_cash_from(${id}, ${t}::timestamptz) as c`)[0]![
          "c"
        ] as number,
        credited: -rows.reduce((a, r) => a + r.cost, 0),
      };
    };
    const a = await mk(false),
      b = await mk(true);
    // three full days: 7 wood × 2 Mark each, plus every whole stone unit (0.5 a day) × 3 Mark
    let stone = 0;
    for (let k = 1; k <= 3; k++) stone += resourceDaily(0.5, dayNo(today + k * DAY));
    expect(a.credited).toBe(3 * 7 * 2 + stone * 3);
    expect(a).toEqual(b);
    // 1000 at t, the credits before the outflow of 900: the lowest point after t is 1000 + credits − 900
    expect(a.cash).toBe(1000 + a.credited - 900);
  });

  it("a purchase that first books the open days also books their credits, inside the same statement", async () => {
    // only in this test database: the lab start is today's day start, so of the two open days only today is eligible
    const since = new Date(today).toISOString();
    await sql.unsafe(`CREATE OR REPLACE FUNCTION public.ankauf_since(_realm text) RETURNS timestamptz LANGUAGE sql STABLE
      AS $f$ SELECT CASE WHEN _realm = 'lab' THEN '${since}'::timestamptz ELSE '2100-01-04 00:00:00+00'::timestamptz END $f$`);
    const { id, c0 } = await seed({ ageDays: 2, site: "workshop", owned: ["woodcamp"] });
    await sql`select public.resource_book(${id}, 'wood', 60, 'start', 'start', ${c0}::timestamptz)`;
    await sql`select public.resource_book(${id}, 'stone', 30, 'start', 'start', ${c0}::timestamptz)`;
    await setStock(id, 300, 100, new Date(Date.parse(c0) + 60000).toISOString());
    const [p] =
      await sql`insert into public.purchases (seed_id, user_id, item, kontor_max, x, y) values (${id}, ${OWNER}, 'herbs', 0, 505, 340) returning cost, material`;
    expect(p!["cost"]).toBe(90);
    const got = await credits(id);
    // yesterday overflowed too, but lies before the start; today is paid, inside the purchase's own statement
    expect(got.map((c) => c.at)).toEqual([today]);
    for (const c of got) {
      const stone = resourceDaily(0.5, dayNo(c.at));
      expect(c.cost).toBe(-(7 * 2 + stone * 3));
    }
    expect((await stock(id)).wood).toBe(300 - 5); // the purchase used its 5 wood after the days were booked
  });
});

d(
  "Ankauf P1: the chest cap of the real village_balance_walk (0118) equals treasury/walkChest",
  () => {
    const DB = `samenland_ankauf_walk_${process.pid}`;
    const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
    let sql: ReturnType<typeof postgres>;
    const SINCE = Date.parse("2026-11-12T00:00:00Z");
    const START = 1190;
    const ID = "00000000-0000-0000-0000-0000000e0001";
    // the village was founded at noon, so the walk's tax days never coincide with a credit at a UTC day start
    const C0 = Date.parse("2026-11-10T12:00:00Z");

    beforeAll(async () => {
      await admin.unsafe(`drop database if exists ${DB}`);
      await admin.unsafe(`create database ${DB}`);
      const u = new globalThis.URL(BASE!);
      u.pathname = `/${DB}`;
      sql = postgres(u.toString(), { max: 2, onnotice: () => {} });
      await sql.unsafe(`
      set timezone = 'UTC';
      ${ROLES}
      create table public.seeds (id uuid primary key, user_id uuid, created_at timestamptz not null);
      create table public.purchases (id uuid primary key default gen_random_uuid(), seed_id uuid, item text, cost integer, created_at timestamptz);
      create table public.encounters (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz);
      create table public.twin_works (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz);
      create table public.building_moves (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz);
      create table public.gifts (id uuid primary key default gen_random_uuid(), from_seed uuid, to_seed uuid, amount integer, created_at timestamptz);
      create table public.quest_claims (id uuid primary key default gen_random_uuid(), seed_id uuid, reward integer, created_at timestamptz);
      create table public.market_sales (id uuid primary key default gen_random_uuid(), seed_id uuid, reward integer, created_at timestamptz);
      create table public.referrals (id uuid primary key default gen_random_uuid(), referrer_seed uuid, referee_seed uuid, reward integer, created_at timestamptz);
      create table public.village_visits (id uuid primary key default gen_random_uuid(), visitor_seed uuid, reward integer, created_at timestamptz);
      create table public.wonder_finds (id uuid primary key default gen_random_uuid(), seed_id uuid, reward integer, created_at timestamptz);
      create table public.princely_tasks (id uuid primary key default gen_random_uuid(), seed_id uuid, reward integer, done_at timestamptz);
      create table public.tax_receipts (seed_id uuid, day integer, income integer);
      -- the walk's inputs outside this test: a fixed balance at the cut-over, no weddings, no raids
      create function public.village_balance_legacy(_seed uuid, _at timestamptz) returns integer language sql stable as $$ select ${START} $$;
      create function public.village_wedding_list(_seed uuid, _at timestamptz, _food text[]) returns table(t timestamptz, dowry integer)
        language sql stable as $$ select null::timestamptz, 0 where false $$;
      create function public.village_raid_list(_seed uuid, _from timestamptz, _to timestamptz) returns table(t timestamptz, loss integer)
        language sql stable as $$ select null::timestamptz, 0 where false $$;`);
      await sql.unsafe(WALK);
      await sql`insert into public.seeds values (${ID}, ${OWNER}, ${new Date(C0).toISOString()})`;
    });
    afterAll(async () => {
      await sql?.end();
      await admin.unsafe(`drop database if exists ${DB}`);
      await admin.end();
    });

    it("a credit only fills the room below the cap valid at its moment — in SQL exactly as in TypeScript", async () => {
      const at = (k: number) => SINCE + k * DAY;
      const rows: [string, number, number][] = [
        [ankaufItem(at(1)), -29, at(1)], // 1190 → 1200 (cap 1200), 19 lost
        ["herbs", 90, at(2) + 3600e3], // → 1110
        [ankaufItem(at(3)), -14, at(3)], // → 1124
        ["chest2", 250, at(4) + 3600e3], // → 874, cap 4000 from here
        [ankaufItem(at(5)), -29, at(5)], // → 903
      ];
      for (const [item, cost, t] of rows)
        await sql`insert into public.purchases (seed_id, item, cost, created_at) values (${ID}, ${item}, ${cost}, ${new Date(t).toISOString()})`;
      const end = new Date(at(6)).toISOString();
      const db = (
        await sql`select public.village_balance_walk(${ID}, ${new Date(SINCE).toISOString()}::timestamptz, ${end}::timestamptz) as b`
      )[0]!["b"] as number;
      // the same rows through the TypeScript walk (tax days carry 0 here: no receipts stored)
      const ev: ChestEvent[] = rows.map(([item, cost, t], i) => ({
        t,
        r: cost < 0 ? 2 : 3,
        v: -cost,
        k: `p${i}${item}`,
      }));
      const c2 = at(4) + 3600e3;
      const ts = walkChest(START, ev, (t) => (t >= c2 ? 4000 : 1200));
      expect(db).toBe(903);
      expect(ts).toBe(db);
    });
  },
);
