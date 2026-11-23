// Wirtschaft Paket 2: Steingrube, Steinbruch-Auftrag and location factors (migration 0143) against a throw-away
// PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...), own database. Unlike the Paket-1 test this one runs the REAL
// purchase_guard as production has it (0123 + the patches 0124, 0125), the village lock from 0052, then 0142 and 0143 —
// so the guard patch for the Steingrube is proven on the actual function text.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { kontorQuote, materialOf, resourceDaily, resourceRates } from "@/game/resources";

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
  M143 = mig("0143_steingrube.sql");
const OWNER = "00000000-0000-0000-0000-0000000000b1";
const DB = `samenland_steingrube_${process.pid}`;
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xb00000 + ++n).toString(16).padStart(12, "0")}`;
type Way = "grain" | "workshop" | "gateway";

d("Steingrube 0143 on the real purchase guard (real PostgreSQL)", () => {
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
  ): Promise<Bought> =>
    sql`insert into public.purchases (seed_id, user_id, item, kontor_max, x, y) values (${id}, ${OWNER}, ${item}, ${kontorMax}, ${x}, ${x})
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
    await sql.unsafe(M143); // idempotent, the guard patch included
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  it("0143 changes no booked row: Paket-1 production stays as it was", async () => {
    expect(before143.filter((l) => l.startsWith("prod:wood:5"))).toHaveLength(3); // 1 + 4 under Paket 1
    expect(await ledger(oldSeed)).toEqual(before143);
    // without a certified location no further day is booked (production waits, nothing is judged with a guess)
    await refreshTo(oldSeed, 6);
    expect(await ledger(oldSeed)).toEqual(before143);
    await sql`insert into public.village_sites (seed_id, way) values (${oldSeed}, 'grain')`;
    await refreshTo(oldSeed, 6);
    expect((await ledger(oldSeed)).filter((l) => l.startsWith("prod:wood:5"))).toHaveLength(6);
  });

  // ---------- Steingrube on the real guard ----------
  it("the real purchase_guard sells the Steingrube for 150 Mark (300 − 150 Steinbruch-Auftrag) and 20 wood, once", async () => {
    const id = await seed();
    expect(await buy(id, "steingrube")).toEqual({
      ok: true,
      cost: 150,
      material: { wood: [20, 0], stone: [0, 0], kontor: 0 },
    });
    expect(await stock(id)).toEqual({ wood: 40, stone: 30 });
    expect(await buy(id, "steingrube")).toEqual({ ok: false, msg: "already built" });
    expect(
      (
        await sql`select count(*)::int as n from pg_indexes where indexname = 'purchases_steingrube_once'`
      )[0]!["n"],
    ).toBe(1);
  });
  it("the Steingrube is never placed and never sold where it could not produce (public map before the cut-over)", async () => {
    const id = await seed();
    expect(await buy(id, "steingrube", null, 501)).toEqual({ ok: false, msg: "bad position" });
    const pub = await seed({ realm: "europe" });
    expect(await buy(pub, "steingrube")).toEqual({ ok: false, msg: "not now" });
    expect(await ledger(pub)).toEqual([]);
    expect(await buy(pub, "herbs")).toEqual({ ok: true, cost: 90, material: null }); // public: unchanged as before
  });
  it("the real guard still prices every other building as before (material only on top)", async () => {
    const id = await seed();
    expect(await buy(id, "woodcamp")).toMatchObject({ ok: true, cost: 240 });
    expect(await buy(id, "granary")).toMatchObject({ ok: true, cost: 300 });
    expect(await buy(id, "nonsense")).toEqual({ ok: false, msg: "unknown item" });
  });

  // ---------- location ----------
  it("production follows the certified location: wood 5 / 7 / 4 with a woodcamp, stone 3.5 / 4.5 / 1.5 with a Steingrube", async () => {
    for (const way of ["grain", "workshop", "gateway"] as const) {
      const id = await seed({ site: way });
      await buy(id, "woodcamp");
      await buy(id, "steingrube");
      await refreshTo(id, 4);
      const want = resourceRates(new Set(["woodcamp", "steingrube"]), way);
      for (let k = 1; k <= 4; k++) {
        const got = await prodOn(id, k),
          day = await dayNo(k);
        expect(got, `${way} day +${k}`).toEqual({
          wood: resourceDaily(want.wood.rate, day),
          stone: resourceDaily(want.stone.rate, day),
        });
      }
      const r =
        await sql`select public.resource_rate(${id}, 'wood', now() + interval '1 day') as w, public.resource_rate(${id}, 'stone', now() + interval '1 day') as s`;
      expect([Number(r[0]!["w"]), Number(r[0]!["s"])], way).toEqual([
        want.wood.rate,
        want.stone.rate,
      ]);
    }
  });
  it("a certified location is final", async () => {
    const id = await seed({ site: "gateway" });
    await expect(
      sql`update public.village_sites set way = 'workshop' where seed_id = ${id}`,
    ).rejects.toThrow("village site is final");
  });
  it("the coast pays 90 % at the Kontor, only with that accepted price; inland pays full, no surcharge", async () => {
    for (const [way, price] of [
      ["gateway", 54],
      ["grain", 60],
      ["workshop", 60],
    ] as const) {
      const id = await seed({ site: way });
      const q = kontorQuote(materialOf("school")!, { wood: 60, stone: 30 }, way);
      expect(q.cost, way).toBe(price);
      expect(await buy(id, "school", q.cost - 1), way).toEqual({
        ok: false,
        msg: "material short",
      });
      expect(await buy(id, "school", q.cost), way).toMatchObject({ ok: true, cost: 1200 + price });
    }
  });

  // ---------- the point of Paket 2 ----------
  it("with a Steingrube stone comes without lasting Kontor purchases: the school after ten days needs none", async () => {
    const id = await seed();
    await buy(id, "woodcamp"); // 12 wood
    await buy(id, "steingrube"); // 20 wood
    await refreshTo(id, 10);
    const s = await stock(id);
    expect(s.stone).toBeGreaterThanOrEqual(40); // 30 + about 35
    expect(s.wood).toBeGreaterThanOrEqual(60); // 28 + 50
    expect(await buy(id, "school")).toEqual({
      ok: true,
      cost: 1200,
      material: { wood: [60, 0], stone: [40, 0], kontor: 0 },
    });
  });
  // ---------- catch-up after a late location certificate ----------
  const prodRows = async (id: string) =>
    (
      await sql`select resource, amount, ref from public.resource_ledger where seed_id = ${id} and kind = 'prod' order by ref, resource`
    ).map((r) => `${r["ref"]}:${r["resource"]}:${r["amount"]}`);
  const certify = (id: string, way: Way) =>
    sql`insert into public.village_sites (seed_id, way) values (${id}, ${way})`;

  it("without a location only the start stock is booked — no production, no processing state, however often refreshed", async () => {
    const id = await seed({ site: null });
    await buy(id, "woodcamp");
    for (const k of [0, 2, 5, 5]) await refreshTo(id, k);
    await sql`select public.resource_refresh(${id})`;
    expect(await ledger(id)).toEqual([
      `start:stone:30:start`,
      `start:wood:60:start`,
      expect.stringMatching(/^build:wood:-12:/),
    ]);
    expect(
      (await sql`select count(*)::int as n from public.resource_state where seed_id = ${id}`)[0]![
        "n"
      ],
    ).toBe(0);
  });
  it("a late certificate books every open day exactly once — identical to a village certified from the start", async () => {
    for (const way of ["grain", "workshop", "gateway"] as const) {
      const early = await seed({ site: way }),
        late = await seed({ site: null });
      for (const id of [early, late]) {
        await buy(id, "woodcamp");
        await buy(id, "steingrube");
      }
      await refreshTo(early, 6);
      await refreshTo(late, 3); // nothing yet
      expect(await prodRows(late), way).toEqual([]);
      await certify(late, way);
      await Promise.all(Array.from({ length: 5 }, () => refreshTo(late, 6))); // parallel catch-up
      await refreshTo(late, 6);
      expect(await prodRows(late), way).toEqual(await prodRows(early));
      const [dup] =
        await sql`select count(*)::int as n from (select resource, ref from public.resource_ledger
        where seed_id = ${late} and kind = 'prod' group by resource, ref having count(*) > 1) x`;
      expect(dup!["n"], way).toBe(0);
      expect(
        (await prodRows(late)).filter((r) => r.includes(":wood:")),
        way,
      ).toHaveLength(6);
    }
  });
  it("UTC day boundaries: production starts at the first 00:00 UTC strictly after the start, never on the start day", async () => {
    const at = async (sqlTime: string, way: Way = "grain") => {
      const id = nextSeed();
      await sql.unsafe(
        `insert into public.seeds values ('${id}', '${OWNER}', 'lab', 500, 340, ${sqlTime})`,
      );
      await certify(id, way);
      await refreshTo(id, 3);
      const refs =
        await sql`select distinct ((ref::date) - (now() at time zone 'UTC')::date) as k from public.resource_ledger
        where seed_id = ${id} and kind = 'prod' order by 1`;
      const start =
        await sql`select at from public.resource_ledger where seed_id = ${id} and kind = 'start' limit 1`;
      return {
        days: refs.map((r) => r["k"] as number),
        start: (start[0]!["at"] as Date).toISOString(),
      };
    };
    const lateToday = await at(
      `((now() at time zone 'UTC')::date + interval '23 hours 30 minutes') at time zone 'UTC'`,
    );
    expect(lateToday.days).toEqual([1, 2, 3]); // started 23:30 UTC today → first delivery tomorrow 00:00
    expect(lateToday.start.endsWith("T23:30:00.000Z")).toBe(true);
    const midnight = await at(
      `((now() at time zone 'UTC')::date + 1)::timestamp at time zone 'UTC'`,
    );
    expect(midnight.days).toEqual([2, 3]); // started exactly at 00:00 tomorrow → first delivery the day after
  });
  it("village_sites: RLS lets owners read only their own row; clients can neither write nor change it", async () => {
    const mine = await seed({ site: "gateway" });
    const theirs = nextSeed();
    await sql`insert into public.seeds values (${theirs}, '00000000-0000-0000-0000-0000000000b2', 'lab', 500, 340, now())`;
    await certify(theirs, "grain");
    const [p] =
      await sql`select has_table_privilege('authenticated', 'public.village_sites', 'insert') as i,
      has_table_privilege('authenticated', 'public.village_sites', 'update') as u,
      has_table_privilege('anon', 'public.village_sites', 'select') as a,
      has_table_privilege('authenticated', 'public.village_sites', 'select') as s,
      has_function_privilege('authenticated', 'public.resource_kontor(uuid, integer, integer)', 'execute') as k`;
    expect(p).toEqual({ i: false, u: false, a: false, s: true, k: false });
    const seen = await sql.begin(async (tx) => {
      await tx`select set_config('test.uid', ${OWNER}, true)`;
      await tx.unsafe("set local role authenticated");
      return tx`select seed_id, way from public.village_sites where seed_id in (${mine}, ${theirs})`;
    });
    expect(seen.map((r) => `${r["seed_id"]}:${r["way"]}`)).toEqual([`${mine}:gateway`]);
    await expect(
      sql`update public.village_sites set way = 'grain' where seed_id = ${mine}`,
    ).rejects.toThrow("village site is final");
  });

  it("the overview reports the location (null until certified) for the council's offer", async () => {
    const certified = await seed({ site: "workshop" }),
      open = await seed({ site: null });
    const ov = (id: string) =>
      sql.begin(async (tx) => {
        await tx`select set_config('test.uid', ${OWNER}, true)`;
        await tx.unsafe("set local role authenticated");
        return (await tx`select public.resource_overview(${id}) as o`)[0]!["o"] as Record<
          string,
          unknown
        >;
      });
    expect(await ov(certified)).toMatchObject({ active: true, site: "workshop" });
    expect(await ov(open)).toMatchObject({
      active: true,
      site: null,
      wood: { stock: 60 },
      stone: { stock: 30 },
    });
  });
});
