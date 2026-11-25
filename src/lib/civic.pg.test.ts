// Wirtschaftsumbau P2: Gemeindebauten Stufe 1 (Spital 1, Waage 1), migration 0147. Runs the REAL purchase_guard
// (0123–0125, patched by 0143/0144/0147), the village lock from 0052 and 0142–0147 against a throw-away PostgreSQL
// (BUILD_MAIL_TEST_PG=postgres://...), own database. Days are booked with resource_refresh_at(seed, future day),
// exactly as the lazy daily bookkeeping does after an absence.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CIVIC,
  CIVIC_QUOTA,
  CIVIC_QUOTA_MAX,
  CIVIC_KEEP,
  civicBudgetMax,
  civicNeed,
  kontorCost,
} from "@/game/civic";
import { kontorQuote } from "@/game/resources";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: Gemeindebau DB tests must run");
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
const LATER = [
  "0142_resources.sql",
  "0143_steingrube.sql",
  "0144_steingrube_platz.sql",
  "0145_a1_investment_material.sql",
].map(mig);
const M147 = mig("0147_gemeindebauten_p2.sql");
const OWNER = "00000000-0000-0000-0000-0000000000d1",
  OTHER = "00000000-0000-0000-0000-0000000000d2";
const DB = `samenland_civic_${process.pid}`;
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xd00000 + ++n).toString(16).padStart(12, "0")}`;

d("Gemeindebauten P2 (0147, real guard, real PostgreSQL)", () => {
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: ReturnType<typeof postgres>;
  let oldSeed = "";
  let oldRows: unknown = [];

  const seed = async (o: { realm?: string; money?: number; rank?: number; site?: string } = {}) => {
    const id = nextSeed();
    await sql`insert into public.seeds (id, user_id, realm, x, y, created_at)
      values (${id}, ${OWNER}, ${o.realm ?? "lab"}, 500, 340, now() - interval '5 hours')`;
    await sql`insert into public.rank_certificates (seed_id, rank, citizens, ways, certified_at) values (${id}, ${o.rank ?? 2}, 0, 0, now())`;
    await sql`insert into public.test_balance values (${id}, ${o.money ?? 30000})`;
    await sql`insert into public.village_sites (seed_id, way) values (${id}, ${o.site ?? "grain"})`;
    await sql`select public.resource_refresh(${id})`;
    return id;
  };
  /** Runs one statement as the given user, the way PostgREST does for an authenticated request. */
  const as = <T>(uid: string, f: (tx: postgres.TransactionSql) => Promise<T>) =>
    sql.begin(async (tx) => {
      await tx`select set_config('test.uid', ${uid}, true), set_config('test.role', 'authenticated', true)`;
      return f(tx);
    }) as Promise<T>;
  const open = (id: string, item: string, budget: number, uid = OWNER) =>
    as(uid, (tx) => tx`select public.civic_open(${id}, ${item}, ${budget}) as r`).then(
      (r) => ({ ok: true as const, r: r[0]!["r"] }),
      (e: Error) => ({ ok: false as const, msg: e.message }),
    );
  const pay = (id: string, item: string, k: number, amount: number) =>
    sql`insert into public.purchases (seed_id, user_id, item, cost) values (${id}, ${OWNER}, ${`${item}:r${k}`}, ${amount}) returning cost`.then(
      (r) => ({ ok: true as const, cost: r[0]!["cost"] as number }),
      (e: Error) => ({ ok: false as const, msg: e.message }),
    );
  const day = (id: string, k: number) =>
    sql`select public.resource_refresh_at(${id}, current_date + ${k}::int)`;
  const stage = async (id: string, item: string) =>
    (await sql`select * from public.civic_stages where seed_id = ${id} and item = ${item}`)[0];
  const quota = async (id: string) =>
    (await sql`select wood, stone from public.civic_quota where seed_id = ${id}`)[0];
  const stock = async (id: string) => {
    const r =
      await sql`select resource, public.resource_stock(${id}, resource) as s from unnest(array['wood','stone']) resource`;
    return Object.fromEntries(r.map((x) => [x["resource"], x["s"]])) as {
      wood: number;
      stone: number;
    };
  };
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
  const balance = async (id: string) =>
    (await sql`select public.village_balance(${id}) as b`)[0]!["b"] as number;
  const rows = async (id: string) =>
    (
      await sql`select item, cost from public.purchases where seed_id = ${id} order by created_at, item`
    ).map((r) => `${r["item"]}=${r["cost"]}`);
  /** Opens and fully pays a stage (price + budget), returns its id. */
  const funded = async (
    item: "spital1" | "waage1",
    budget: number,
    o: Parameters<typeof seed>[0] = {},
  ) => {
    const id = await seed(o);
    expect(await open(id, item, budget)).toMatchObject({ ok: true });
    expect(await pay(id, item, 1, CIVIC[item].price + budget)).toEqual({
      ok: true,
      cost: CIVIC[item].price + budget,
    });
    return id;
  };

  beforeAll(async () => {
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.unsafe(`create database ${DB}`);
    const u = new globalThis.URL(BASE!);
    u.pathname = `/${DB}`;
    sql = postgres(u.toString(), { max: 8, onnotice: () => {} });
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
      -- chest stand-in: start money minus every row that already counts (refunds are negative, i.e. money back)
      create function public.village_balance(_seed uuid) returns integer language sql stable as
        $$ select coalesce((select balance from public.test_balance where seed_id = _seed), 5000)
             - coalesce((select sum(cost) from public.purchases where seed_id = _seed and created_at <= now()), 0)::int $$;
      grant usage on schema public, auth to authenticated; grant select on public.seeds to authenticated;`);
    await sql.unsafe(LOCK_FN);
    await sql.unsafe(LOCK_TRIGGER);
    for (const g of GUARD) await sql.unsafe(g);
    await sql.unsafe(
      `create trigger purchase_guard before insert on public.purchases for each row execute function public.purchase_guard();`,
    );
    for (const m of LATER) await sql.unsafe(m);
    // a lab village with ordinary purchases before P2: its rows and stock must stay exactly as they are
    oldSeed = await seed();
    await sql`insert into public.purchases (seed_id, user_id, item, kontor_max, x, y) values (${oldSeed}, ${OWNER}, 'hunter', 0, 505, 340)`;
    oldRows =
      await sql`select item, cost, material, created_at from public.purchases where seed_id = ${oldSeed}`;
    await sql.unsafe(M147);
    await sql.unsafe(M147); // idempotent
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  it("existing rows stay untouched; chests, monuments and ordinary buildings keep their prices", async () => {
    expect(
      await sql`select item, cost, material, created_at from public.purchases where seed_id = ${oldSeed}`,
    ).toEqual(oldRows);
    const id = await seed({ rank: 4 });
    for (const [item, cost] of [
      ["chest2", 250],
      ["herbs", 90],
    ] as const) {
      const r =
        await sql`insert into public.purchases (seed_id, user_id, item, kontor_max, x, y) values (${id}, ${OWNER}, ${item}, 1000, ${item === "herbs" ? 505 : null}, ${item === "herbs" ? 340 : null}) returning cost`;
      expect(r[0]!["cost"]).toBe(cost);
    }
  });

  it("1/3 Spital 1 and Waage 1 open from Dorf (certified rank 2), not below; owner only; budget within the full material price", async () => {
    expect(await open(await seed({ rank: 1 }), "spital1", 0)).toEqual({
      ok: false,
      msg: "rank too low",
    });
    const id = await seed();
    expect(await open(id, "spital1", 0, OTHER)).toEqual({ ok: false, msg: "not owner" });
    expect(await open(id, "spital1", civicBudgetMax("spital1", "grain", false) + 1)).toEqual({
      ok: false,
      msg: "bad budget",
    });
    expect(await open(id, "spital1", -1)).toEqual({ ok: false, msg: "bad budget" });
    expect(await open(id, "spital1", civicBudgetMax("spital1", "grain", false))).toEqual({
      ok: true,
      r: { item: "spital1", price: 10000, budget: 398, wood: 50, stone: 33, days: 21 },
    });
    const w = await seed({ site: "gateway" });
    expect(await open(w, "waage1", civicBudgetMax("waage1", "gateway", false))).toEqual({
      ok: true,
      r: { item: "waage1", price: 12000, budget: 432, wood: 60, stone: 40, days: 14 },
    });
  });

  it("5 material is price/200 wood and price/300 stone (TS and DB agree)", async () => {
    expect(civicNeed("spital1")).toEqual({ wood: 50, stone: 33 });
    expect(civicNeed("waage1")).toEqual({ wood: 60, stone: 40 });
    for (const item of ["spital1", "waage1"] as const) {
      const id = await seed();
      await open(id, item, 0);
      const s = await stage(id, item);
      expect({ wood: s!["need_wood"], stone: s!["need_stone"] }).toEqual(civicNeed(item));
    }
  });

  it("13 no stage on a public map (resources not active there)", async () => {
    expect(await open(await seed({ realm: "europe" }), "spital1", 0)).toEqual({
      ok: false,
      msg: "not now",
    });
  });

  it("instalments: in order, never more than still open, only with money; fully paid = funded; marker/refund never from clients", async () => {
    const id = await seed({ money: 4000 });
    expect(await pay(id, "spital1", 1, 100)).toEqual({ ok: false, msg: "stage not open" });
    await open(id, "spital1", 100);
    expect(await pay(id, "spital1", 2, 100)).toEqual({ ok: false, msg: "previous step open" });
    expect(await pay(id, "spital1", 1, 0)).toEqual({ ok: false, msg: "bad amount" });
    expect(await pay(id, "spital1", 1, 5000)).toEqual({ ok: false, msg: "not enough money" });
    expect(await pay(id, "spital1", 1, 4000)).toEqual({ ok: true, cost: 4000 });
    expect(await pay(id, "spital1", 1, 1)).toMatchObject({ ok: false }); // number used once
    expect((await stage(id, "spital1"))!["funded_at"]).toBeNull();
    await sql`update public.test_balance set balance = balance + 10000 where seed_id = ${id}`;
    expect(await pay(id, "spital1", 2, 6101)).toEqual({ ok: false, msg: "bad amount" });
    expect(await pay(id, "spital1", 2, 6100)).toEqual({ ok: true, cost: 6100 });
    expect((await stage(id, "spital1"))!["funded_at"]).not.toBeNull();
    expect(await pay(id, "spital1", 3, 1)).toEqual({ ok: false, msg: "already funded" });
    for (const item of ["spital1", "spital1:refund"])
      await expect(
        sql`insert into public.purchases (seed_id, user_id, item, cost) values (${id}, ${OWNER}, ${item}, -500)`,
      ).rejects.toThrow("civic rows are booked by the server");
  });

  it("10 one site at a time: a second stage waits until the first stands", async () => {
    const id = await funded("waage1", 0, { money: 60000 });
    expect(await open(id, "spital1", 0)).toEqual({ ok: false, msg: "site busy" });
    expect(await open(id, "waage1", 0)).toEqual({ ok: false, msg: "already built" });
  });

  it("6/7 daily pull without login: store above 40/30 first, then the quota (4/3 a day, max 30 days) from the budget", async () => {
    const id = await funded("spital1", civicBudgetMax("spital1", "grain", false));
    await setStock(id, CIVIC_KEEP.wood + 10, CIVIC_KEEP.stone + 5);
    const q0 = (await quota(id))!; // today may already be booked (the village was founded yesterday UTC)
    await day(id, 1); // first day start after funding (production of that day lands before the pull)
    const s1 = await stage(id, "spital1"),
      st1 = await stock(id);
    expect(st1).toEqual({ wood: CIVIC_KEEP.wood, stone: CIVIC_KEEP.stone }); // store above the keep and the day's production taken
    expect(s1!["wood_got"]).toBe(10 + 1 + q0["wood"] + CIVIC_QUOTA.wood); // above keep + 1 production + quota
    expect(s1!["stone_got"] - 5 - q0["stone"] - CIVIC_QUOTA.stone).toBeGreaterThanOrEqual(0); // + 0 or 1 (stone 0.5 a day)
    expect(s1!["stone_got"] - 5 - q0["stone"] - CIVIC_QUOTA.stone).toBeLessThanOrEqual(1);
    expect(await quota(id)).toEqual({ wood: 0, stone: 0 });
    // a long absence: 40 days booked at once — the quota never holds more than 30 days
    const q = await seed();
    await day(q, 40);
    expect(await quota(q)).toEqual(CIVIC_QUOTA_MAX);
  });

  it("2/4 completion: build days after the material, marker dated at completion, unused budget refunded; Waage 1 makes the Kontor 15 % cheaper", async () => {
    const budget = civicBudgetMax("waage1", "grain", false);
    const id = await funded("waage1", budget, { money: 40000 });
    for (let k = 1; k <= 40 && !(await stage(id, "waage1"))!["material_at"]; k++) await day(id, k);
    const s = await stage(id, "waage1");
    expect(s!["wood_got"]).toBe(60);
    expect(s!["stone_got"]).toBe(40);
    expect(Date.parse(s!["done_at"]) - Date.parse(s!["material_at"])).toBe(
      CIVIC.waage1.days * 864e5,
    );
    const marker =
      await sql`select cost, created_at from public.purchases where seed_id = ${id} and item = 'waage1'`;
    expect(marker[0]!["cost"]).toBe(0);
    expect(Date.parse(marker[0]!["created_at"])).toBe(Date.parse(s!["done_at"]));
    const refund =
      await sql`select cost from public.purchases where seed_id = ${id} and item = 'waage1:refund'`;
    expect(refund.length ? -refund[0]!["cost"] : 0).toBe(budget - s!["kontor_spent"]);
    // before completion no discount, from the marker on ×0.85 (DB and TS)
    const before = (
      await sql`select public.resource_kontor_at(${id}, 10, 10, ${s!["done_at"]}::timestamptz - interval '1 second') as c`
    )[0]!["c"];
    const after = (
      await sql`select public.resource_kontor_at(${id}, 10, 10, ${s!["done_at"]}::timestamptz) as c`
    )[0]!["c"];
    expect(before).toBe(kontorCost({ wood: 10, stone: 10 }, "grain", false));
    expect(after).toBe(kontorCost({ wood: 10, stone: 10 }, "grain", true));
    expect(after).toBe(
      kontorQuote({ wood: 10, stone: 10 }, { wood: 0, stone: 0 }, "grain", true).cost,
    );
    expect(after).toBe(Math.round(100 * 0.85));
  });

  it("budget 0: only store material, never the Kontor; the chest is never touched by the pull", async () => {
    const id = await funded("spital1", 0, { money: 20000 });
    const money = await balance(id),
      q0 = (await quota(id))!;
    await day(id, 1);
    const s = await stage(id, "spital1");
    expect(s!["kontor_spent"]).toBe(0);
    expect(await balance(id)).toBe(money);
    expect(await quota(id)).toEqual({
      wood: q0["wood"] + CIVIC_QUOTA.wood,
      stone: q0["stone"] + CIVIC_QUOTA.stone,
    }); // saved for later
  });

  it("9 Gemeindebau first: the pull takes the store before the quota, the quota only for the open rest", async () => {
    const id = await funded("spital1", civicBudgetMax("spital1", "grain", false));
    await setStock(id, 400, 400);
    const q0 = (await quota(id))!;
    await day(id, 1);
    expect(await quota(id)).toEqual({
      wood: q0["wood"] + CIVIC_QUOTA.wood,
      stone: q0["stone"] + CIVIC_QUOTA.stone,
    }); // the whole need came from the store, the quota stayed for later (Stiftungen, P4)
    expect((await stage(id, "spital1"))!["material_at"]).not.toBeNull();
  });

  it("11 parallel instalments and opens: one wins, nothing booked twice", async () => {
    const id = await seed({ money: 50000 });
    const opens = await Promise.all([
      open(id, "spital1", 0),
      open(id, "waage1", 0),
      open(id, "spital1", 0),
    ]);
    expect(opens.filter((o) => o.ok)).toHaveLength(1);
    const item = (await sql`select item from public.civic_stages where seed_id = ${id}`)[0]![
      "item"
    ] as "spital1" | "waage1";
    const pays = await Promise.all([1, 1, 1].map(() => pay(id, item, 1, 1000)));
    expect(pays.filter((p) => p.ok)).toHaveLength(1);
    const days = await Promise.all([day(id, 3), day(id, 3), day(id, 3)]).then(
      () =>
        sql`select count(*)::int as n from public.resource_ledger where seed_id = ${id} and kind = 'prod'`,
    );
    expect(days[0]!["n"]).toBe(2 * 3); // wood + stone rows per day, each day once
  });

  it("12 history: before the marker nothing acts (no Waage discount, no Spital row); rows outside the stage untouched", async () => {
    const id = await funded("spital1", 0);
    const r0 = await rows(id);
    expect(r0).toEqual([`spital1:r1=${CIVIC.spital1.price}`]);
    expect(
      await sql`select 1 from public.purchases where seed_id = ${id} and item = 'spital1'`,
    ).toHaveLength(0);
  });
});
