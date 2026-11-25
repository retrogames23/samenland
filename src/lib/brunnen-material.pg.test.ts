// P3b Marktbrunnen-Material (migration 0157, Masterplan v6.1 Variante A): the fountain steps take wood price/200 and
// stone price/300 through purchase_material — store first, the Kontor only up to kontor_max, a normal purchase. Runs
// the REAL purchase_guard (0123–0125, patched by 0143/0144), the village lock from 0052 and 0142–0145 + 0157 against a
// throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...), own database.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FOUNTAIN_PRICE, FOUNTAIN_STEPS } from "@/game/civic-fountain";
import { kontorQuote, materialOf } from "@/game/resources";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: P3b fountain material DB tests must run");
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
const M142 = mig("0142_resources.sql"),
  M143 = mig("0143_steingrube.sql"),
  M144 = mig("0144_steingrube_platz.sql"),
  M145 = mig("0145_a1_investment_material.sql"),
  M157 = mig("0157_brunnen_material.sql");
const OWNER = "00000000-0000-0000-0000-0000000000b7";
const DB = `samenland_p3b_${process.pid}`;
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xb70000 + ++n).toString(16).padStart(12, "0")}`;
type Way = "grain" | "workshop" | "gateway";

d("P3b Marktbrunnen material (0157, real guard, real PostgreSQL)", () => {
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: ReturnType<typeof postgres>;
  let oldSeed = "";
  let oldRows: unknown = [];
  let fnBefore: Record<string, string> = {};

  const seed = async (o: { realm?: string; site?: Way; money?: number; charter?: string } = {}) => {
    const id = nextSeed();
    await sql`insert into public.seeds (id, user_id, realm, x, y, created_at)
      values (${id}, ${OWNER}, ${o.realm ?? "lab"}, 500, 340, now() - interval '5 hours')`;
    await sql`insert into public.rank_certificates (seed_id, rank, citizens, ways, certified_at) values (${id}, 5, 0, 2, now())`;
    await sql`insert into public.test_balance values (${id}, ${o.money ?? 20000})`;
    await sql`insert into public.village_sites (seed_id, way) values (${id}, ${o.site ?? "grain"})`;
    if (o.charter)
      await sql`insert into public.charters (seed_id, path) values (${id}, ${o.charter})`;
    await sql`select public.resource_refresh(${id})`;
    return id;
  };
  /** Earlier purchases as they already stand in the table, written past every trigger (no price, no material). */
  const had = (id: string, ...items: string[]) =>
    sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      for (const it of items)
        await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${id}, ${OWNER}, ${it}, 0, now() - interval '1 hour')`;
    });
  /** Sets the stock to exactly wood / stone with one test booking per resource. */
  const setStock = async (id: string, wood: number, stone: number) => {
    const s = await stock(id);
    for (const [r, delta] of [
      ["wood", wood - s.wood],
      ["stone", stone - s.stone],
    ] as const)
      if (delta !== 0)
        await sql`insert into public.resource_ledger (seed_id, resource, amount, kind, ref, at)
          values (${id}, ${r}, ${delta}, ${delta > 0 ? "prod" : "build"}, ${"test-" + r + "-" + Math.random()}, now() - interval '1 minute')`;
  };
  type Bought = { ok: true; cost: number; material: unknown } | { ok: false; msg: string };
  const buy = (
    id: string,
    item: string,
    kontorMax: number | null = null,
    x: number | null = null,
  ): Promise<Bought> =>
    sql`insert into public.purchases (seed_id, user_id, item, kontor_max, x, y) values (${id}, ${OWNER}, ${item}, ${kontorMax}, ${x}, ${x === null ? null : 340})
      returning cost, material`.then(
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
  const balance = async (id: string) =>
    (await sql`select public.village_balance(${id}) as b`)[0]!["b"] as number;
  const rows = async (id: string) =>
    (
      await sql`select item from public.purchases where seed_id = ${id} order by created_at, item`
    ).map((r) => r["item"]);
  const ledgerOf = async (id: string) =>
    (
      await sql`select kind, resource, amount from public.resource_ledger where seed_id = ${id} and kind in ('kontor','build') and ref not like 'test-%' order by kind, resource`
    ).map((r) => `${r["kind"]}:${r["resource"]}:${r["amount"]}`);

  beforeAll(async () => {
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.unsafe(`create database ${DB}`);
    const u = new globalThis.URL(BASE!);
    u.pathname = `/${DB}`;
    sql = postgres(u.toString(), { max: 6, onnotice: () => {} });
    await sql.unsafe(`
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
      create function public.village_balance(_seed uuid) returns integer language sql stable as
        $$ select coalesce((select balance from public.test_balance where seed_id = _seed), 5000)
             - coalesce((select sum(cost) from public.purchases where seed_id = _seed), 0)::int $$;
      grant usage on schema public, auth to authenticated; grant select on public.seeds to authenticated;`);
    await sql.unsafe(LOCK_FN);
    await sql.unsafe(LOCK_TRIGGER);
    for (const g of GUARD) await sql.unsafe(g);
    await sql.unsafe(
      `create trigger purchase_guard before insert on public.purchases for each row execute function public.purchase_guard();`,
    );
    await sql.unsafe(M142);
    await sql.unsafe(M143);
    await sql.unsafe(M144);
    await sql.unsafe(M145);
    // a lab village that paid fountain1 before P3b: its row must stay exactly as it is
    oldSeed = await seed();
    expect(await buy(oldSeed, "fountain1")).toEqual({ ok: true, cost: 4000, material: null });
    oldRows =
      await sql`select item, cost, material, created_at from public.purchases where seed_id = ${oldSeed}`;
    fnBefore = await functions();
    await sql.unsafe(M157);
    await sql.unsafe(M157); // idempotent
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });
  /** md5 of every function body in public, so a change outside purchase_material is seen. */
  async function functions() {
    const r = await sql`select p.oid::regprocedure::text as f, md5(p.prosrc) as m from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1`;
    return Object.fromEntries(r.map((x) => [x["f"] as string, x["m"] as string]));
  }
  const allSteps = (id: string) => had(id, "markethall");

  it("only purchase_material changes; old fountain rows stay; the next step after the migration pays material", async () => {
    const after = await functions();
    expect(Object.keys(after)).toEqual(Object.keys(fnBefore));
    expect(Object.keys(after).filter((f) => after[f] !== fnBefore[f])).toEqual([
      "purchase_material()",
    ]);
    expect(
      await sql`select item, cost, material, created_at from public.purchases where seed_id = ${oldSeed}`,
    ).toEqual(oldRows);
    await setStock(oldSeed, 200, 200);
    expect(await buy(oldSeed, "fountain2")).toEqual({
      ok: true,
      cost: 8000,
      material: { wood: [40, 0], stone: [27, 0], kontor: 0 },
    });
  });

  it("the three steps take 20/13, 40/27, 60/40 at the guard's own price, from the store, exactly as materialOf", async () => {
    const id = await seed({ money: 50000 });
    await setStock(id, 300, 300);
    const before = await balance(id);
    let w = 300,
      st = 300;
    for (const k of FOUNTAIN_STEPS) {
      const m = materialOf(k)!;
      expect(await buy(id, k), k).toEqual({
        ok: true,
        cost: FOUNTAIN_PRICE[k],
        material: { wood: [m.wood, 0], stone: [m.stone, 0], kontor: 0 },
      });
      w -= m.wood;
      st -= m.stone;
      expect(await stock(id), k).toEqual({ wood: w, stone: st });
    }
    expect([w, st]).toEqual([300 - 120, 300 - 80]);
    expect(await balance(id)).toBe(before - 24000);
    expect((await ledgerOf(id)).sort()).toEqual(
      [
        "build:wood:-20",
        "build:stone:-13",
        "build:wood:-40",
        "build:stone:-27",
        "build:wood:-60",
        "build:stone:-40",
      ].sort(),
    );
  });

  it("the Kontor fills only the missing units, only within kontor_max, and the quote is exactly what the server charges", async () => {
    for (const way of ["grain", "gateway"] as const) {
      const id = await seed({ site: way });
      await setStock(id, 12, 5);
      const q = kontorQuote(materialOf("fountain1")!, { wood: 12, stone: 5 }, way);
      expect(q.missing, way).toEqual({ wood: 8, stone: 8 });
      expect(q.cost, way).toBe(way === "grain" ? 80 : 72); // 8 × 4 + 8 × 6, coast × 0.9
      const before = await balance(id);
      expect(await buy(id, "fountain1")).toEqual({ ok: false, msg: "material short" }); // no limit given
      expect(await buy(id, "fountain1", q.cost - 1)).toEqual({ ok: false, msg: "material short" });
      expect(await rows(id)).toEqual([]);
      expect(await balance(id)).toBe(before);
      expect(await buy(id, "fountain1", q.cost + 500)).toEqual({
        ok: true,
        cost: 4000 + q.cost, // a higher limit is never spent: only the real Kontor price
        material: { wood: [20, 8], stone: [13, 8], kontor: q.cost },
      });
      expect(await balance(id), way).toBe(before - 4000 - q.cost);
      expect(await stock(id), way).toEqual({ wood: 0, stone: 0 });
      expect((await ledgerOf(id)).sort(), way).toEqual(
        ["kontor:wood:8", "kontor:stone:8", "build:wood:-20", "build:stone:-13"].sort(),
      );
    }
  });

  it("money for the price but not for price + Kontor: the whole purchase rolls back", async () => {
    const id = await seed({ money: 4050 });
    await setStock(id, 0, 0);
    const q = kontorQuote(materialOf("fountain1")!, { wood: 0, stone: 0 });
    expect(q.cost).toBe(20 * 4 + 13 * 6);
    expect(await buy(id, "fountain1", q.cost)).toEqual({ ok: false, msg: "not enough money" });
    expect(await rows(id)).toEqual([]);
    expect(await ledgerOf(id)).toEqual([]);
    await sql`update public.test_balance set balance = ${4000 + q.cost} where seed_id = ${id}`;
    expect(await buy(id, "fountain1", q.cost)).toMatchObject({ ok: true, cost: 4000 + q.cost });
  });

  it("a normal purchase: no instalments, no site, the guard's order and once-per-step rules unchanged", async () => {
    const id = await seed();
    await setStock(id, 300, 300);
    expect(await buy(id, "fountain2", 1000)).toEqual({ ok: false, msg: "previous step open" });
    expect(await buy(id, "fountain1", 1000, 500)).toEqual({ ok: false, msg: "bad position" });
    expect((await buy(id, "fountain1:r1", 1000)).ok).toBe(false);
    expect(await buy(id, "fountain1", 1000)).toMatchObject({ ok: true, cost: 4000 });
    expect(await buy(id, "fountain1", 1000)).toEqual({ ok: false, msg: "step already paid" });
    expect(await rows(id)).toEqual(["fountain1"]);
    expect(
      (
        await sql`select count(*)::int as n from information_schema.tables where table_name = 'civic_stages'`
      )[0]!["n"],
    ).toBe(0); // nothing of the Gemeindebau booking is involved
  });

  it("other purchases keep their rates: buildings price/20 and /30, A1 half rate, chests free", async () => {
    const id = await seed();
    await setStock(id, 300, 300);
    expect(await buy(id, "school", null, 500)).toEqual({
      ok: true,
      cost: 1200,
      material: { wood: [60, 0], stone: [40, 0], kontor: 0 },
    });
    expect(await buy(id, "belfry1", null, 501)).toEqual({
      ok: true,
      cost: 400,
      material: { wood: [10, 0], stone: [0, 0], kontor: 0 },
    });
    expect(await buy(id, "chest2")).toMatchObject({ ok: true, material: null });
  });

  it("public maps before their cut-over: no material for the fountain, exactly as before", async () => {
    const id = await seed({ realm: "europe" });
    await allSteps(id);
    expect(await buy(id, "fountain1")).toEqual({ ok: true, cost: 4000, material: null });
  });
});
