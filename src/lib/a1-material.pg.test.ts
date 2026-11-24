// Wirtschaftsumbau A1: monument steps, guild ranks and titles use wood and stone at the half rate (migration 0145),
// chests stay free. Runs the REAL purchase_guard (0123 + 0124 + 0125, patched by 0143/0144), the village lock from 0052,
// then 0142–0145 against a throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...), own database.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MONUMENT_PRICE, RANK_PRICE, TITLE_PRICE, CHEST_PRICE } from "@/game/economy";
import { INVESTMENT_ITEMS, kontorQuote, materialOf } from "@/game/resources";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: A1 material DB tests must run");
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
  M145 = mig("0145_a1_investment_material.sql");
const OWNER = "00000000-0000-0000-0000-0000000000c1";
const DB = `samenland_a1_${process.pid}`;
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xc00000 + ++n).toString(16).padStart(12, "0")}`;
type Way = "grain" | "workshop" | "gateway";

d("A1 material for monuments, guild ranks and titles (0145, real guard, real PostgreSQL)", () => {
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: ReturnType<typeof postgres>;
  let oldSeed = "";
  let oldRows: unknown = [];

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
    // a lab village that bought a monument step before A1: its row must stay exactly as it is
    oldSeed = await seed();
    expect(await buy(oldSeed, "belfry1", null, 500)).toMatchObject({
      ok: true,
      cost: 400,
      material: null,
    });
    oldRows =
      await sql`select item, cost, material, created_at from public.purchases where seed_id = ${oldSeed}`;
    await sql.unsafe(M145);
    await sql.unsafe(M145); // idempotent
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  it("existing purchases stay untouched; the next step after the migration pays material", async () => {
    expect(
      await sql`select item, cost, material, created_at from public.purchases where seed_id = ${oldSeed}`,
    ).toEqual(oldRows);
    expect(await buy(oldSeed, "belfry2")).toEqual({
      ok: true,
      cost: 500,
      material: { wood: [13, 0], stone: [8, 0], kontor: 0 },
    });
  });

  it("with enough stock: half rate, list price, stock drops by exactly the need, no Kontor", async () => {
    const id = await seed({ charter: "craft" });
    await had(id, "guildhall");
    await setStock(id, 200, 100);
    const before = await balance(id);
    expect(await buy(id, "rank2")).toEqual({
      ok: true,
      cost: 250,
      material: { wood: [6, 0], stone: [0, 0], kontor: 0 },
    });
    expect(await buy(id, "title1")).toEqual({
      ok: true,
      cost: 500,
      material: { wood: [13, 0], stone: [8, 0], kontor: 0 },
    });
    expect(await balance(id)).toBe(before - 750);
    expect(await stock(id)).toEqual({ wood: 181, stone: 92 });
    expect((await ledgerOf(id)).sort()).toEqual(
      ["build:stone:-8", "build:wood:-13", "build:wood:-6"].sort(),
    );
  });

  it("every A1 item charges exactly what materialOf says (all monuments, ranks, titles) at the guard's own price", async () => {
    const prices: Record<string, number> = { ...MONUMENT_PRICE, ...RANK_PRICE, ...TITLE_PRICE };
    expect([...INVESTMENT_ITEMS].sort()).toEqual(Object.keys(prices).sort());
    for (const item of INVESTMENT_ITEMS) {
      const id = await seed({ charter: "trade" });
      const step = Number(item.slice(-1)),
        key = item.slice(0, -1);
      const need: string[] = ["markethall"];
      if (key === "rank") need.push(...(step === 3 ? ["rank2", "belfry4"] : []));
      else if (key === "title")
        need.push("rank2", "rank3", ...["title1", "title2"].slice(0, step - 1));
      else for (let k = 1; k < step; k++) need.push(`${key}${k}`);
      await had(id, ...need);
      await setStock(id, 500, 500);
      const placed = key !== "rank" && key !== "title" && step === 1;
      const r = await buy(id, item, 0, placed ? 500 : null);
      const m = materialOf(item)!;
      expect(r, item).toEqual({
        ok: true,
        cost: prices[item],
        material: { wood: [m.wood, 0], stone: [m.stone, 0], kontor: 0 },
      });
      expect(await stock(id), item).toEqual({ wood: 500 - m.wood, stone: 500 - m.stone });
    }
  });

  it("not enough stock: refused without Kontor permission, nothing booked, no row, money untouched", async () => {
    const id = await seed();
    await setStock(id, 5, 0);
    const before = await balance(id);
    expect(await buy(id, "belfry1", null, 500)).toEqual({ ok: false, msg: "material short" });
    expect(await buy(id, "belfry1", 19, 500)).toEqual({ ok: false, msg: "material short" }); // 5 wood missing = 20 Mark
    expect(await rows(id)).toEqual([]);
    expect(await balance(id)).toBe(before);
    expect(await stock(id)).toEqual({ wood: 5, stone: 0 });
    expect(await ledgerOf(id)).toEqual([]);
  });

  it("Kontor fills the gap only within the accepted price, and the UI quote is exactly what the server charges", async () => {
    for (const way of ["grain", "gateway"] as const) {
      const id = await seed({ site: way });
      await had(id, "belfry1", "belfry2", "belfry3");
      await setStock(id, 10, 3);
      const q = kontorQuote(materialOf("belfry4")!, { wood: 10, stone: 3 }, way);
      expect(q.need, way).toEqual({ wood: 18, stone: 12 });
      expect(q.cost, way).toBe(way === "grain" ? 86 : 77); // 8 wood × 4 + 9 stone × 6, coast × 0.9
      const before = await balance(id);
      expect(await buy(id, "belfry4", q.cost - 1)).toEqual({ ok: false, msg: "material short" });
      expect(await buy(id, "belfry4", q.cost)).toEqual({
        ok: true,
        cost: 700 + q.cost,
        material: { wood: [18, 8], stone: [12, 9], kontor: q.cost },
      });
      expect(await balance(id), way).toBe(before - 700 - q.cost);
      expect(await stock(id), way).toEqual({ wood: 0, stone: 0 });
      expect((await ledgerOf(id)).sort(), way).toEqual(
        ["kontor:wood:8", "kontor:stone:9", "build:wood:-18", "build:stone:-12"].sort(),
      );
    }
  });

  it("partial failure: money for the price but not for price + Kontor — the whole purchase rolls back", async () => {
    const id = await seed({ money: 750, charter: "craft" });
    await had(id, "guildhall", "rank2", "belfry4");
    await setStock(id, 0, 0);
    const q = kontorQuote(materialOf("rank3")!, { wood: 0, stone: 0 });
    expect(q.cost).toBe(20 * 4 + 13 * 6);
    expect(await buy(id, "rank3", q.cost)).toEqual({ ok: false, msg: "not enough money" }); // 800 alone already > 750
    await sql`update public.test_balance set balance = 850 where seed_id = ${id}`; // 800 fits, 800 + 158 does not
    expect(await buy(id, "rank3", q.cost)).toEqual({ ok: false, msg: "not enough money" });
    expect(await rows(id)).toEqual(["belfry4", "guildhall", "rank2"].sort());
    expect(await ledgerOf(id)).toEqual([]);
    expect(await stock(id)).toEqual({ wood: 0, stone: 0 });
    await sql`update public.test_balance set balance = 958 where seed_id = ${id}`;
    expect(await buy(id, "rank3", q.cost)).toMatchObject({ ok: true, cost: 958 });
  });

  it("chests stay material-free, the other rules of the guard still apply", async () => {
    const id = await seed();
    await setStock(id, 0, 0);
    expect(await buy(id, "chest2")).toEqual({ ok: true, cost: CHEST_PRICE.chest2, material: null });
    expect(await buy(id, "chest3")).toEqual({ ok: true, cost: CHEST_PRICE.chest3, material: null });
    expect(await buy(id, "title1", 1000)).toEqual({ ok: false, msg: "no charter" });
    expect(await buy(id, "belfry2", 1000)).toEqual({ ok: false, msg: "previous step open" });
    expect(await ledgerOf(id)).toEqual([]);
  });

  it("buildings keep the full rate (price/20, /30)", async () => {
    const id = await seed();
    await setStock(id, 200, 100);
    expect(await buy(id, "school", null, 500)).toEqual({
      ok: true,
      cost: 1200,
      material: { wood: [60, 0], stone: [40, 0], kontor: 0 },
    });
  });

  it("public maps before their cut-over: no material at all, exactly as before", async () => {
    const id = await seed({ realm: "europe", charter: "craft" });
    await had(id, "guildhall");
    expect(await buy(id, "rank2")).toEqual({ ok: true, cost: 250, material: null });
    expect(await buy(id, "belfry1", null, 500)).toEqual({ ok: true, cost: 400, material: null });
  });
});
