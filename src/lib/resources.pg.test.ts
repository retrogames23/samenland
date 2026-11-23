// Wirtschaft Paket 1: runs the real migration 0142 (resource ledger, lazy production, material per purchase) against a
// throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...). The test creates and drops its own database. The village
// lock is production's tax_spend_lock() + trigger from 0052; purchase_guard is a slim stand-in with the same name (so the
// same trigger order) that sets the price and checks money like the real guard does.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ITEMS } from "@/game/economy";
import { AUSBAU_PRICE } from "@/game/ausbau";
import { kontorQuote, materialNeed, resourceDaily, resourceRates } from "@/game/resources";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: resource DB tests must run");
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
const M142 = mig("0142_resources.sql");
const PRICES: Record<string, number> = { ...ITEMS, ...AUSBAU_PRICE, chest2: 250, belfry1: 400 };
const OWNER = "00000000-0000-0000-0000-0000000000a1",
  OTHER = "00000000-0000-0000-0000-0000000000a2";
const DB = `samenland_resources_${process.pid}`;
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xa00000 + ++n).toString(16).padStart(12, "0")}`;

d("Ressourcen 0142 (real PostgreSQL)", () => {
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: ReturnType<typeof postgres>;

  /** A village; "lab" is live from 2026-11-23, every public map only from 2100. */
  const seed = async (
    o: { realm?: string; ageDays?: number; user?: string; money?: number } = {},
  ) => {
    const id = nextSeed();
    await sql`insert into public.seeds (id, user_id, realm, created_at)
      values (${id}, ${o.user ?? OWNER}, ${o.realm ?? "lab"}, now() - make_interval(secs => ${(o.ageDays ?? 30) * 86400}))`;
    if (o.money != null) await sql`insert into public.test_balance values (${id}, ${o.money})`;
    return id;
  };
  /** An old purchase as it already stands in the table (before the resource economy), written past the triggers. */
  const oldPurchase = (id: string, item: string, daysAgo: number) =>
    sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at)
        values (${id}, ${OWNER}, ${item}, ${PRICES[item] ?? 0}, now() - make_interval(secs => ${daysAgo * 86400}))`;
    });
  type Bought = { ok: true; cost: number; material: unknown } | { ok: false; msg: string };
  const buy = (id: string, item: string, kontorMax: number | null = null): Promise<Bought> =>
    sql`insert into public.purchases (seed_id, user_id, item, kontor_max) values (${id}, ${OWNER}, ${item}, ${kontorMax}) returning cost, material`.then(
      (r) => ({ ok: true as const, cost: r[0]!["cost"] as number, material: r[0]!["material"] }),
      (e: Error) => ({ ok: false as const, msg: e.message }),
    );
  const stock = async (id: string) => {
    const r =
      await sql`select resource, public.resource_stock(${id}, resource) as s from unnest(array['wood','stone']) resource`;
    return Object.fromEntries(r.map((x) => [x["resource"], x["s"]])) as {
      wood: number;
      stone: number;
    };
  };
  const ledger = async (id: string) =>
    (
      await sql`select kind, resource, amount from public.resource_ledger where seed_id = ${id} order by at, kind, resource`
    ).map((r) => `${r["kind"]}:${r["resource"]}:${r["amount"]}`);
  const refreshTo = (id: string, dayOffset: number) =>
    sql`select public.resource_refresh_at(${id}, (now() at time zone 'UTC')::date + ${dayOffset}::int)`;
  const overview = async (id: string, uid = OWNER) =>
    sql.begin(async (tx) => {
      await tx`select set_config('test.uid', ${uid}, true)`;
      await tx.unsafe("set local role authenticated");
      return (await tx`select public.resource_overview(${id}) as o`)[0]!["o"] as Record<
        string,
        unknown
      >;
    });
  const balance = async (id: string) =>
    (await sql`select public.village_balance(${id}) as b`)[0]!["b"] as number;

  beforeAll(async () => {
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.unsafe(`create database ${DB}`);
    const u = new globalThis.URL(BASE!);
    u.pathname = `/${DB}`;
    sql = postgres(u.toString(), { max: 6, onnotice: () => {} });
    const prices = Object.entries(PRICES)
      .map(([k, v]) => `('${k}', ${v})`)
      .join(",");
    await sql.unsafe(`
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
      create function auth.role() returns text language sql stable as $$ select nullif(current_setting('test.role', true), '') $$;
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
        if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
      end $$;
      create table public.seeds (id uuid primary key, user_id uuid, realm text not null, created_at timestamptz not null);
      create table public.purchases (id uuid primary key default gen_random_uuid(), seed_id uuid not null references public.seeds(id),
        user_id uuid not null, item text not null, cost integer not null default 0, created_at timestamptz not null default now(), x integer, y integer);
      create unique index purchases_once on public.purchases (seed_id, item);
      create table public.test_prices (item text primary key, price integer);
      insert into public.test_prices values ${prices};
      create table public.test_balance (seed_id uuid primary key, balance integer);
      create function public.village_balance(_seed uuid) returns integer language sql stable as
        $$ select coalesce((select balance from public.test_balance where seed_id = _seed), 5000)
             - coalesce((select sum(cost) from public.purchases where seed_id = _seed), 0)::int $$;
      -- stand-in for the real purchase_guard (same name → same trigger order): price and money
      create function public.purchase_guard() returns trigger language plpgsql security definer set search_path = public as $$
        declare price integer; begin
          select p.price into price from public.test_prices p where p.item = NEW.item;
          if price is null then raise exception 'unknown item'; end if;
          NEW.cost := price; NEW.created_at := now();
          if public.village_balance(NEW.seed_id) < price then raise exception 'not enough money'; end if;
          return NEW; end $$;
      create trigger purchase_guard before insert on public.purchases for each row execute function public.purchase_guard();
      grant usage on schema public, auth to authenticated; grant select on public.seeds to authenticated;`);
    await sql.unsafe(LOCK_FN);
    await sql.unsafe(LOCK_TRIGGER);
    await sql.unsafe(M142);
    await sql.unsafe(M142); // idempotent
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  it("the trigger chain on purchases: village lock, price guard, material, then the booking after insert", async () => {
    const t =
      await sql`select t.tgname as name, case when (t.tgtype & 2) <> 0 then 'before' else 'after' end as timing
      from pg_trigger t where t.tgrelid = 'public.purchases'::regclass and not t.tgisinternal order by timing desc, t.tgname`;
    expect(t.map((r) => `${r["timing"]}:${r["name"]}`)).toEqual([
      "before:a_tax_spend_lock",
      "before:purchase_guard",
      "before:purchase_material",
      "after:purchase_material_book",
    ]);
  });

  // ---------- public maps: nothing changes until the cut-over ----------
  it("on a public map everything stays as before: same price, no material, no ledger, overview inactive", async () => {
    const id = await seed({ realm: "europe" });
    expect(await buy(id, "healer")).toEqual({ ok: true, cost: 550, material: null });
    expect(await ledger(id)).toEqual([]);
    expect(await overview(id)).toMatchObject({ active: false });
    await sql`select public.resource_refresh(${id})`;
    expect(await ledger(id)).toEqual([]);
  });

  // ---------- start, production, storage ----------
  it("a village starts with 60 wood and 30 stone and produces 1 wood and 0.5 stone a day", async () => {
    const id = await seed({ ageDays: 0.5 });
    const o = await overview(id);
    expect(o).toMatchObject({
      active: true,
      wood: { stock: 60, rate: 1, cap: 100 },
      stone: { stock: 30, rate: 0.5, cap: 100 },
    });
    await refreshTo(id, 4);
    const s = await stock(id);
    expect(s.wood).toBe(64);
    expect([31, 32]).toContain(s.stone); // 0.5 a day: two of four days
  });
  it("a woodcamp adds 4 wood a day from the next day start; storage caps production", async () => {
    const id = await seed({ ageDays: 0.2 });
    await sql`select public.resource_refresh(${id})`;
    expect(await buy(id, "woodcamp")).toMatchObject({ ok: true, cost: 240 }); // 12 wood used
    expect((await stock(id)).wood).toBe(48);
    await refreshTo(id, 1);
    expect((await stock(id)).wood).toBe(53);
    await refreshTo(id, 100);
    expect((await stock(id)).wood).toBe(300); // 100 + 200 woodcamp, never more
    expect((await stock(id)).stone).toBe(80); // 30 + 0.5 × 100 days
    await refreshTo(id, 200);
    expect((await stock(id)).stone).toBe(100); // storage full
    expect(await overview(id)).toMatchObject({ wood: { rate: 5, cap: 300 } });
  });
  it("ten days at once equal ten daily calls; repeated and parallel refreshes never double a day", async () => {
    const a = await seed({ ageDays: 0.2 });
    await sql`select public.resource_refresh(${a})`;
    await buy(a, "woodcamp");
    await refreshTo(a, 10);
    const once = await ledger(a);
    await sql`delete from public.resource_ledger where seed_id = ${a} and kind = 'prod'`;
    await sql`delete from public.resource_state where seed_id = ${a}`;
    for (let k = 0; k <= 10; k++) await refreshTo(a, k);
    expect(await ledger(a)).toEqual(once);
    await refreshTo(a, 10);
    expect(await ledger(a)).toEqual(once);
    const p = await seed({ ageDays: 20 });
    await Promise.all(Array.from({ length: 6 }, () => refreshTo(p, 5)));
    const [c] =
      await sql`select count(*)::int as n, count(distinct ref)::int as refs from public.resource_ledger where seed_id = ${p} and kind = 'prod' and resource = 'wood'`;
    expect(c!["n"]).toBe(c!["refs"]);
    expect(c!["n"]).toBe(5);
    expect((await stock(p)).wood).toBe(65);
  });
  it("production follows the same rules in TypeScript and SQL", async () => {
    for (const owned of [[], ["woodcamp"], ["granary"], ["woodcamp", "granary", "granary2"]]) {
      const id = await seed({ ageDays: 3 });
      for (const it of owned) await oldPurchase(id, it, 10);
      const r = resourceRates(new Set(owned));
      const [q] =
        await sql`select public.resource_rate(${id}, 'wood', now()) as rw, public.resource_cap(${id}, 'wood', now()) as cw,
        public.resource_rate(${id}, 'stone', now()) as rs, public.resource_cap(${id}, 'stone', now()) as cs`;
      expect([Number(q!["rw"]), q!["cw"], Number(q!["rs"]), q!["cs"]]).toEqual([
        r.wood.rate,
        r.wood.cap,
        r.stone.rate,
        r.stone.cap,
      ]);
    }
    const days =
      await sql`select g as n, public.resource_daily(0.5, date '2000-01-01' + g) as a from generate_series(1, 20) g`;
    for (const x of days) expect(x["a"]).toBe(resourceDaily(0.5, x["n"] as number));
  });

  // ---------- consumption ----------
  it("a purchase uses wood (price/20) and, from 500 Mark, stone (price/30) — money unchanged while stock suffices", async () => {
    const id = await seed({ ageDays: 0.2 });
    expect(await buy(id, "herbs")).toEqual({
      ok: true,
      cost: 90,
      material: { wood: [5, 0], stone: [0, 0], kontor: 0 },
    });
    expect(await stock(id)).toEqual({ wood: 55, stone: 30 });
    expect(await buy(id, "healer")).toEqual({
      ok: true,
      cost: 550,
      material: { wood: [28, 0], stone: [18, 0], kontor: 0 },
    });
    expect(await stock(id)).toEqual({ wood: 27, stone: 12 });
    expect(await ledger(id)).toEqual([
      "start:stone:30",
      "start:wood:60",
      "build:wood:-5",
      "build:stone:-18",
      "build:wood:-28",
    ]);
    for (const [it, p] of Object.entries(PRICES).filter(([k]) => k in ITEMS || k in AUSBAU_PRICE)) {
      const need = materialNeed(p);
      const [q] =
        await sql`select round(${p}::numeric / 20)::int as w, case when ${p} >= 500 then round(${p}::numeric / 30) else 0 end::int as s`;
      expect([q!["w"], q!["s"]], it).toEqual([need.wood, need.stone]);
    }
  });
  it("chests, monuments and other items use no material", async () => {
    const id = await seed({ ageDays: 0.2 });
    expect(await buy(id, "chest2")).toEqual({ ok: true, cost: 250, material: null });
    expect(await buy(id, "belfry1")).toEqual({ ok: true, cost: 400, material: null });
    expect(await stock(id)).toEqual({ wood: 0, stone: 0 }); // resources not even started by these
  });
  it("missing material is bought at the Kontor only within the accepted price; otherwise nothing happens", async () => {
    const id = await seed({ ageDays: 0.2, money: 3000 });
    const before = await balance(id);
    expect(await buy(id, "school")).toEqual({ ok: false, msg: "material short" }); // needs 60 wood, 40 stone
    expect(await balance(id)).toBe(before);
    expect(await ledger(id)).toEqual([]); // the refused statement leaves nothing behind, not even the first start booking
    const q = kontorQuote(materialNeed(1200), { wood: 60, stone: 30 });
    expect(q).toMatchObject({ missing: { wood: 0, stone: 10 }, cost: 60 });
    expect(await buy(id, "school", q.cost - 1)).toEqual({ ok: false, msg: "material short" });
    expect(await buy(id, "school", q.cost)).toEqual({
      ok: true,
      cost: 1260,
      material: { wood: [60, 0], stone: [40, 10], kontor: 60 },
    });
    expect(await balance(id)).toBe(before - 1260);
    expect(await stock(id)).toEqual({ wood: 0, stone: 0 });
    expect(await ledger(id)).toEqual([
      "start:stone:30",
      "start:wood:60",
      "build:stone:-40",
      "build:wood:-60",
      "kontor:stone:10",
    ]);
  });
  it("if the money does not cover price and Kontor, nothing is bought, booked or charged", async () => {
    const id = await seed({ ageDays: 0.2, money: 1220 });
    expect(await buy(id, "school", 1000)).toEqual({ ok: false, msg: "not enough money" });
    expect(await ledger(id)).toEqual([]); // even the start stock rolled back with the statement
    expect(await balance(id)).toBe(1220);
  });
  it("a failing purchase rolls back its material: no consumption without the purchase row", async () => {
    const id = await seed({ ageDays: 0.2 });
    expect(await buy(id, "hunter")).toMatchObject({ ok: true });
    const s = await stock(id);
    expect(await buy(id, "hunter")).toMatchObject({ ok: false }); // unique index rejects the repeat after the triggers
    expect(await stock(id)).toEqual(s);
    await sql
      .begin(async (tx) => {
        await tx`insert into public.purchases (seed_id, user_id, item) values (${id}, ${OWNER}, 'fisher')`;
        await tx`select 1/0`;
      })
      .catch(() => {});
    expect(await stock(id)).toEqual(s);
    expect(
      (
        await sql`select count(*)::int as n from public.purchases where seed_id = ${id} and item = 'fisher'`
      )[0]!["n"],
    ).toBe(0);
  });

  // ---------- parallel bookings ----------
  it("two parallel purchases cannot spend the same wood: one is booked, the other needs the Kontor and is refused", async () => {
    for (let round = 0; round < 5; round++) {
      const id = await seed({ ageDays: 0.2 });
      await sql`select public.resource_refresh(${id})`;
      // 60 wood: guard (750 → 38 wood, 25 stone) and dairy (350 → 18 wood) fit, millrow (700 → 35 wood) does not on top
      const res = await Promise.all([buy(id, "guard"), buy(id, "millrow")]);
      expect(
        res.filter((r) => r.ok),
        JSON.stringify(res),
      ).toHaveLength(1);
      expect(res.filter((r) => !r.ok && r.msg === "material short")).toHaveLength(1);
      const s = await stock(id);
      expect(s.wood).toBeGreaterThanOrEqual(0);
      expect(s.stone).toBeGreaterThanOrEqual(0);
    }
  });
  it("deterministic: the later purchase waits on the village lock and sees the wood already used", async () => {
    const id = await seed({ ageDays: 0.2 });
    await sql`select public.resource_refresh(${id})`;
    const A = await sql.reserve(),
      B = await sql.reserve();
    try {
      await A`begin`;
      await B`begin`;
      await A`insert into public.purchases (seed_id, user_id, item) values (${id}, ${OWNER}, 'guard')`; // 38 wood
      const [pb] = await B`select pg_backend_pid() as pid`;
      const pending =
        B`insert into public.purchases (seed_id, user_id, item) values (${id}, ${OWNER}, 'millrow')`.then(
          () => "ok",
          (e: Error) => e.message,
        );
      let waited = false;
      for (let i = 0; i < 300 && !waited; i++) {
        const [w] =
          await sql`select wait_event_type as t from pg_stat_activity where pid = ${pb!["pid"]}`;
        waited = w?.["t"] === "Lock";
        if (!waited) await new Promise((r) => setTimeout(r, 10));
      }
      expect(waited).toBe(true);
      await A`commit`;
      expect(await pending).toBe("material short");
    } finally {
      await A`rollback`.catch(() => {});
      await B`rollback`.catch(() => {});
      A.release();
      B.release();
    }
    expect(await stock(id)).toEqual({ wood: 22, stone: 5 });
  });

  // ---------- ledger integrity ----------
  it("the ledger never goes negative and is never rewritten", async () => {
    const id = await seed({ ageDays: 0.2 });
    await sql`select public.resource_refresh(${id})`;
    await expect(
      sql`select public.resource_book(${id}, 'wood', -61, 'build', 'x', now())`,
    ).rejects.toThrow("resource short");
    await expect(
      sql`update public.resource_ledger set amount = 999 where seed_id = ${id}`,
    ).rejects.toThrow("append-only");
    expect(await stock(id)).toEqual({ wood: 60, stone: 30 });
  });
  it("clients only read their own resources and cannot write or call the booking functions", async () => {
    const mine = await seed({ ageDays: 0.2 });
    const theirs = await seed({ ageDays: 0.2, user: OTHER });
    await sql`select public.resource_refresh(${mine})`;
    await sql`select public.resource_refresh(${theirs})`;
    const [p] =
      await sql`select has_table_privilege('authenticated', 'public.resource_ledger', 'insert') as i,
      has_function_privilege('authenticated', 'public.resource_book(uuid, text, integer, text, text, timestamptz)', 'execute') as b,
      has_function_privilege('authenticated', 'public.resource_refresh(uuid)', 'execute') as r,
      has_function_privilege('authenticated', 'public.resource_overview(uuid)', 'execute') as o`;
    expect(p).toEqual({ i: false, b: false, r: false, o: true });
    const seen = await sql.begin(async (tx) => {
      await tx`select set_config('test.uid', ${OWNER}, true)`;
      await tx.unsafe("set local role authenticated");
      return tx`select distinct seed_id from public.resource_ledger where seed_id in (${mine}, ${theirs})`;
    });
    expect(seen.map((r) => r["seed_id"])).toEqual([mine]);
    await expect(overview(theirs)).rejects.toThrow("not owner");
  });

  // ---------- existing villages ----------
  it("an existing village keeps its purchases and costs; owned buildings count for production from the start", async () => {
    const id = await seed({ ageDays: 200 });
    for (const [it, ago] of [
      ["woodcamp", 150],
      ["granary", 120],
      ["school", 60],
    ] as const)
      await oldPurchase(id, it, ago);
    const before =
      await sql`select item, cost, created_at, material from public.purchases where seed_id = ${id} order by item`;
    const o = await overview(id);
    expect(o).toMatchObject({
      active: true,
      wood: { rate: 5, cap: 450 },
      stone: { rate: 0.5, cap: 250 },
    });
    expect(
      await sql`select item, cost, created_at, material from public.purchases where seed_id = ${id} order by item`,
    ).toEqual(before);
    const s = await stock(id);
    expect(s.wood).toBeGreaterThanOrEqual(60); // start 60 on 23.11. plus production since, never retroactive before
    expect(
      await sql`select min(at) as t from public.resource_ledger where seed_id = ${id}`.then((r) =>
        (r[0]!["t"] as Date).toISOString(),
      ),
    ).toBe("2026-11-23T00:00:00.000Z");
  });
});
