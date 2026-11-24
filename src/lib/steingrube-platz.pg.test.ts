// Migration 0144: the Steingrube gets a position like every placed building. Throw-away PostgreSQL
// (BUILD_MAIL_TEST_PG=postgres://...), own database, the REAL purchase_guard (0123 + 0124 + 0125), the village lock
// from 0052, 0142, 0143 and then 0144 twice — so the patch is proven on the actual function text.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ITEMS, GUILD } from "@/game/economy";
import { AUSBAU_PRICE } from "@/game/ausbau";
import {
  STEINGRUBE,
  STEINGRUBE_PRICE,
  kontorQuote,
  materialOf,
  resourceDaily,
  resourceRates,
} from "@/game/resources";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: Steingrube DB tests must run");
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
  M144 = mig("0144_steingrube_platz.sql");
const OWNER = "00000000-0000-0000-0000-0000000000b1";
const DB = `samenland_steingrube_platz_${process.pid}`;
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xb00000 + ++n).toString(16).padStart(12, "0")}`;
type Way = "grain" | "workshop" | "gateway";

d("Steingrube 0144: placed like every building (real PostgreSQL)", () => {
  let guard143 = "",
    guard144 = "",
    legacy = "";
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: ReturnType<typeof postgres>;
  let before143: string[] = [];
  let oldSeed = "";

  const seed = async (
    o: { realm?: string; ageDays?: number; site?: Way | null; money?: number } = {},
  ) => {
    const id = nextSeed();
    await sql`insert into public.seeds (id, user_id, realm, x, y, created_at)
      values (${id}, ${OWNER}, ${o.realm ?? "lab"}, 500, 340, now() - make_interval(secs => ${(o.ageDays ?? 0.2) * 86400}))`;
    await sql`insert into public.rank_certificates (seed_id, rank, citizens, ways, certified_at) values (${id}, 5, 0, 0, now())`;
    if (o.money != null) await sql`insert into public.test_balance values (${id}, ${o.money})`;
    if (o.site !== null)
      await sql`insert into public.village_sites (seed_id, way) values (${id}, ${o.site ?? "grain"})`;
    return id;
  };
  type Bought = { ok: true; cost: number; material: unknown } | { ok: false; msg: string };
  const buy = (
    id: string,
    item: string,
    kontorMax: number | null = null,
    x: number | null = null,
    y: number | null = x,
  ): Promise<Bought> =>
    sql`insert into public.purchases (seed_id, user_id, item, kontor_max, x, y) values (${id}, ${OWNER}, ${item}, ${kontorMax}, ${x}, ${y})
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
  const ledger = async (id: string) =>
    (
      await sql`select kind, resource, amount, ref from public.resource_ledger where seed_id = ${id} order by at, kind, resource`
    ).map((r) => `${r["kind"]}:${r["resource"]}:${r["amount"]}:${r["ref"]}`);
  const refreshTo = (id: string, k: number) =>
    sql`select public.resource_refresh_at(${id}, (now() at time zone 'UTC')::date + ${k}::int)`;
  /** Production booked for day today+k, per resource (0 if none). */
  const prodOn = async (id: string, k: number) => {
    const r = await sql`select resource, amount from public.resource_ledger
      where seed_id = ${id} and kind = 'prod' and ref = ((now() at time zone 'UTC')::date + ${k}::int)::text`;
    return {
      wood: 0,
      stone: 0,
      ...Object.fromEntries(r.map((x) => [x["resource"], x["amount"]])),
    } as { wood: number; stone: number };
  };
  const dayNo = async (k: number) =>
    (await sql`select ((now() at time zone 'UTC')::date + ${k}::int - date '2000-01-01') as n`)[0]![
      "n"
    ] as number;

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
    // a lab village that already has Paket-1 bookings when 0143 arrives (bought woodcamp, three days produced)
    oldSeed = nextSeed();
    await sql`insert into public.seeds values (${oldSeed}, ${OWNER}, 'lab', 500, 340, now() - interval '5 hours')`;
    await sql`insert into public.rank_certificates values (${oldSeed}, 5, 0, 0, now())`;
    await sql`insert into public.purchases (seed_id, user_id, item) values (${oldSeed}, ${OWNER}, 'woodcamp')`;
    await refreshTo(oldSeed, 3);
    before143 = await ledger(oldSeed);
    await sql.unsafe(M143);
    // a Steingrube bought under 0143 (no position) before 0144 arrives
    legacy = await seed({ site: "workshop" });
    await sql`insert into public.purchases (seed_id, user_id, item) values (${legacy}, ${OWNER}, 'steingrube')`;
    guard143 = (
      await sql`select pg_get_functiondef('public.purchase_guard()'::regprocedure) as d`
    )[0]!["d"] as string;
    await sql.unsafe(M144);
    await sql.unsafe(M144); // idempotent: a re-run finds the new form and changes nothing
    guard144 = (
      await sql`select pg_get_functiondef('public.purchase_guard()'::regprocedure) as d`
    )[0]!["d"] as string;
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  // the position line is the same for six other unplaced buildings; 0144 removes it only inside the Steingrube block
  const NEXT =
    "    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'steingrube') THEN RAISE EXCEPTION 'already built'; END IF;";
  const OLD =
    "    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;\n" +
    NEXT;
  const rate = async (id: string) =>
    Number(
      (await sql`select public.resource_rate(${id}, 'stone', now() + interval '2 days') as r`)[0]![
        "r"
      ],
    );

  it("0144 removes exactly the Steingrube position line and nothing else of the guard", async () => {
    expect(guard143.split(OLD)).toHaveLength(2); // present once before
    expect(guard144).toBe(guard143.replace(OLD, NEXT));
    expect(guard144.split("'bad position'").length).toBe(
      guard143.split("'bad position'").length - 1,
    );
    expect(guard144).toContain("price := 300 - 150;");
    expect(guard144).toContain("RAISE EXCEPTION 'already built'");
    expect(guard144).toContain("RAISE EXCEPTION 'not now'");
  });

  it("a placed Steingrube is sold for 150 Mark and 20 wood, once", async () => {
    const id = await seed();
    expect(await buy(id, "steingrube", null, 503, 344)).toEqual({
      ok: true,
      cost: 150,
      material: { wood: [20, 0], stone: [0, 0], kontor: 0 },
    });
    expect(
      (
        await sql`select x, y from public.purchases where seed_id = ${id} and item = 'steingrube'`
      )[0],
    ).toEqual({ x: 503, y: 344 });
    expect(await stock(id)).toEqual({ wood: 40, stone: 30 });
    expect(await buy(id, "steingrube", null, 505, 344)).toEqual({
      ok: false,
      msg: "already built",
    });
    expect(await buy(id, "steingrube")).toEqual({ ok: false, msg: "already built" });
  });

  it("the generic position rules apply: x and y together, at most 60 tiles away", async () => {
    const id = await seed();
    expect(await buy(id, "steingrube", null, 503, null)).toEqual({
      ok: false,
      msg: "bad position",
    });
    expect(await buy(id, "steingrube", null, null, 344)).toEqual({
      ok: false,
      msg: "bad position",
    });
    expect(await buy(id, "steingrube", null, 600, 340)).toEqual({ ok: false, msg: "too far" });
    expect(await buy(id, "steingrube", null, 540, 340)).toMatchObject({ ok: true, cost: 150 });
  });

  it("purchases without a position stay valid: the 0143 row and a new unplaced one", async () => {
    expect(
      (
        await sql`select x, y, cost from public.purchases where seed_id = ${legacy} and item = 'steingrube'`
      )[0],
    ).toEqual({ x: null, y: null, cost: 150 });
    expect(await buy(legacy, "steingrube", null, 503, 344)).toEqual({
      ok: false,
      msg: "already built",
    });
    const id = await seed();
    expect(await buy(id, "steingrube")).toEqual({
      ok: true,
      cost: 150,
      material: { wood: [20, 0], stone: [0, 0], kontor: 0 },
    });
  });

  it("production does not depend on the position: placed and unplaced give the same stone rate", async () => {
    const placed = await seed({ site: "workshop" }),
      unplaced = await seed({ site: "workshop" });
    await buy(placed, "steingrube", null, 503, 344);
    await buy(unplaced, "steingrube");
    expect(await rate(placed)).toBe(4.5);
    expect(await rate(unplaced)).toBe(4.5);
    expect(await rate(legacy)).toBe(4.5);
  });

  it("still only where resources run: a public map refuses it, placed or not", async () => {
    const pub = await seed({ realm: "europe" });
    expect(await buy(pub, "steingrube", null, 503, 344)).toEqual({ ok: false, msg: "not now" });
    expect(await buy(pub, "steingrube")).toEqual({ ok: false, msg: "not now" });
  });

  it("every other building keeps its rules and price", async () => {
    const id = await seed();
    expect(await buy(id, "herbs", null, 502, 341)).toMatchObject({ ok: true, cost: 90 });
    expect(await buy(id, "woodcamp", null, 503, null)).toEqual({ ok: false, msg: "bad position" });
    expect(await buy(id, "woodcamp", null, 600, 340)).toEqual({ ok: false, msg: "too far" });
    expect(await buy(id, "backhaus2", null, 503, 344)).toEqual({ ok: false, msg: "bad position" }); // upgrades stay unplaced
  });

  it("0144 aborts instead of patching an unexpected guard (each case rolled back)", async () => {
    const tryOn = (def: string) =>
      sql.begin(async (tx) => {
        await tx.unsafe(def);
        await tx.unsafe(M144);
      });
    // no Steingrube block from 0143
    await expect(
      tryOn(guard143.replace("price := 300 - 150;", "price := 300 - 149;")),
    ).rejects.toThrow(/block from 0143 not found/);
    // the generic position rule is missing
    await expect(
      tryOn(guard143.replace("IF (NEW.x IS NULL) <> (NEW.y IS NULL)", "IF false")),
    ).rejects.toThrow(/generic position check not found/);
    // an already patched guard whose Steingrube block differs
    await expect(
      tryOn(guard144.replace(NEXT, NEXT.replace("'already built'", "'built'"))),
    ).rejects.toThrow(/unexpected Steingrube block/);
    // nothing of it stayed
    expect(
      (await sql`select pg_get_functiondef('public.purchase_guard()'::regprocedure) as d`)[0]!["d"],
    ).toBe(guard144);
  });
});
