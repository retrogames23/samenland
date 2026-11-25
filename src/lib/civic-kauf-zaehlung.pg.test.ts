// Fehlerpaket F-P2-1, migration 0153: what counts as a bought building for quests (quest_guard: build, buy3) and the
// decree "build" (princely_task_met). Runs the real quest_guard (0102, reach as patched by 0113), princely_task_met
// (0081), the real purchase_guard chain and 0142–0148 + 0151 + 0153 against a throw-away PostgreSQL
// (BUILD_MAIL_TEST_PG=postgres://...). Rows are written past the triggers, exactly as they stand after the server
// booked them; only the counting is under test. TypeScript countsAsBuilding (civic.ts) must agree on every row.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { countsAsBuilding } from "@/game/civic";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: F-P2-1 DB tests must run");
const d = BASE ? describe : describe.skip;
const mig = (f: string) =>
  readFileSync(new globalThis.URL(`../../drizzle/migrations/${f}`, import.meta.url), "utf8");
const M052 = mig("0052_resident_tax_receipts.sql");
const LOCK_FN = M052.slice(
  M052.indexOf("CREATE OR REPLACE FUNCTION public.tax_spend_lock()"),
  M052.indexOf("REVOKE ALL ON FUNCTION public.tax_spend_lock()"),
);
const M102 = mig("0102_lonely_quests_unpaid.sql");
const QUEST_GUARD = M102.slice(
  M102.indexOf("CREATE OR REPLACE FUNCTION public.quest_guard()"),
  M102.indexOf("ALTER TABLE public.village_visits"),
);
// 0113's quest_guard step as it ran live (neighbour reach 80 -> 120)
const Q113 = `DO $m$ DECLARE d text; BEGIN d := pg_get_functiondef('public.quest_guard()'::regprocedure);
  EXECUTE replace(d, 'power(o.y - me.y, 2)) <= 80', 'power(o.y - me.y, 2)) <= 120'); END $m$;`;
const M081 = mig("0081_repeat_visits_for_decree.sql");
const TASK_MET = M081.slice(M081.indexOf("CREATE OR REPLACE FUNCTION public.princely_task_met"));
const CHAIN = [
  "0123_bauhuette_only_guard.sql",
  "0124_ausbau_stufen_guard.sql",
  "0125_nothilfe_purchase_guard.sql",
];
const LATER = [
  "0142_resources.sql",
  "0143_steingrube.sql",
  "0144_steingrube_platz.sql",
  "0145_a1_investment_material.sql",
  "0147_gemeindebauten_p2.sql",
  "0148_civic_cash_history.sql",
  "0151_ankauf.sql",
];
const M153 = mig("0153_civic_kauf_zaehlung.sql");
const OWNER = "00000000-0000-0000-0000-0000000000f1";
const DAY = 864e5;
const T0 = Date.parse("2026-12-01T00:00:00Z"); // decree taken at T0; every row below is dated after it
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xf00000 + ++n).toString(16).padStart(12, "0")}`;

/** Money rows of one Gemeindebau stage as the server books them: instalments, daily Kontor rows, marker last. */
const stage = (s: string, marker: boolean) => [
  `${s}:r1`,
  `${s}:r2`,
  `${s}:r3`,
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => `${s}:k202612${String(d).padStart(2, "0")}`),
  ...(marker ? [s] : []),
];

d("F-P2-1: Gemeindebau-Geldzeilen zählen nicht als Gebäudekauf (0153)", () => {
  const DB = `samenland_fp21_${process.pid}`;
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: ReturnType<typeof postgres>;

  /** A village whose purchase table holds exactly `items`, one row per item, dated after T0 in order. */
  const village = async (items: string[]) => {
    const id = nextSeed();
    await sql`insert into public.seeds (id, user_id, realm, x, y, created_at) values (${id}, ${OWNER}, 'lab', 500, 340, '2026-11-20T00:00:00Z')`;
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      for (const [i, item] of items.entries())
        await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at)
          values (${id}, ${OWNER}, ${item}, ${item.startsWith("ankauf:") ? -10 : 100}, ${new Date(T0 + (i + 1) * 3600e3).toISOString()})`;
    });
    return id;
  };
  /** Claims a quest through the real quest_guard; earlier steps of its track are written past the trigger. */
  const claim = async (id: string, quest: string, before: string[] = []) => {
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      for (const q of before)
        await tx`insert into public.quest_claims (seed_id, user_id, quest) values (${id}, ${OWNER}, ${q})`;
    });
    return sql`insert into public.quest_claims (seed_id, user_id, quest) values (${id}, ${OWNER}, ${quest})`.then(
      () => "ok",
      (e: Error) => (e.message.includes("quest not done") ? "not done" : e.message),
    );
  };
  const decree = async (id: string, since = T0) =>
    (
      await sql`select public.princely_task_met(${id}, 'build', ${new Date(since).toISOString()}::timestamptz) as m`
    )[0]!["m"] as boolean;
  /** The quest count np exactly as quest_guard computes it after 0153 (read from the live function text). */
  const npSql = async (id: string) => {
    const [r] = await sql`select pg_get_functiondef('public.quest_guard()'::regprocedure) as d`;
    const line =
      /SELECT count\(\*\) INTO np FROM purchases WHERE seed_id = NEW\.seed_id([^;]*);/.exec(
        r!["d"] as string,
      )!;
    const [c] = await sql.unsafe(
      `select count(*)::int as n from public.purchases where seed_id = $1${line[1]!.replaceAll("NEW.seed_id", "$1")}`,
      [id],
    );
    return c!["n"] as number;
  };

  beforeAll(async () => {
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.unsafe(`create database ${DB}`);
    const u = new globalThis.URL(BASE!);
    u.pathname = `/${DB}`;
    sql = postgres(u.toString(), { max: 4, onnotice: () => {} });
    await sql.unsafe(`
      set timezone = 'UTC';
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create function auth.role() returns text language sql stable as $$ select 'service_role'::text $$;
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
      create table public.first_roads (seed_id uuid, target_id uuid, created_at timestamptz);
      create function public.road_done(a uuid, b uuid) returns timestamptz language sql stable as $$ select now() $$;
      create table public.tax_receipts (seed_id uuid, day integer, income integer);
      create table public.encounters (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz not null);
      create table public.twin_works (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz not null);
      create table public.building_moves (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz not null);
      create table public.gifts (id uuid primary key default gen_random_uuid(), from_seed uuid, to_seed uuid, amount integer, created_at timestamptz not null);
      create function public.village_raid_list(_seed uuid, _from timestamptz, _to timestamptz) returns table(t timestamptz, loss integer)
        language sql stable as $$ select null::timestamptz, 0 where false $$;
      create function public.village_balance_walk(_seed uuid, _since timestamptz, _at timestamptz) returns integer language sql stable as $$ select 100000 $$;
      create function public.village_balance(_seed uuid) returns integer language sql stable as $$ select 100000 $$;
      create table public.quest_claims (id uuid primary key default gen_random_uuid(), seed_id uuid not null references public.seeds(id),
        user_id uuid not null, quest text not null, reward integer not null default 0, created_at timestamptz not null default now(), unique (seed_id, quest));
      create table public.blessings (seed_id uuid);
      create table public.signposts (seed_id uuid);
      create table public.letters (from_seed uuid, created_at timestamptz);
      create table public.village_visits (visitor_seed uuid, created_at timestamptz, last_at timestamptz);
      create table public.wonder_finds (seed_id uuid, created_at timestamptz);
      create table public.princely_tasks (id uuid primary key default gen_random_uuid(), seed_id uuid, task text, done_at timestamptz);
      create table public.princely_errands (task_id uuid, seed_id uuid, errand text);`);
    await sql.unsafe(LOCK_FN);
    await sql.unsafe(QUEST_GUARD);
    await sql.unsafe(Q113);
    await sql.unsafe(
      `create trigger quest_guard before insert on public.quest_claims for each row execute function public.quest_guard();`,
    );
    await sql.unsafe(TASK_MET);
    for (const f of CHAIN) await sql.unsafe(mig(f));
    await sql.unsafe(`create trigger a_tax_spend_lock before insert on public.purchases for each row execute function public.tax_spend_lock();
      create trigger purchase_guard before insert on public.purchases for each row execute function public.purchase_guard();`);
    for (const f of LATER) await sql.unsafe(mig(f));
    await sql.unsafe(M153);
    await sql.unsafe(M153); // idempotent: a re-run finds the new text and changes nothing
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  it("instalments and daily Kontor rows are no building: neither quest build nor the decree", async () => {
    const id = await village([...stage("spital1", false), ...stage("waage1", false)]); // 24 money rows, no marker
    expect(await npSql(id)).toBe(0);
    expect(await claim(id, "build")).toBe("not done");
    expect(await decree(id)).toBe(false); // rows after the decree was taken, and ≥ 8 in all
  });

  it("a finished stage counts exactly once, by its completion marker", async () => {
    const id = await village(stage("spital1", true));
    expect(await npSql(id)).toBe(1);
    expect(await claim(id, "build")).toBe("ok");
    expect(await decree(id)).toBe(true);
    expect(await decree(id, T0 + 30 * DAY)).toBe(false); // the marker before the decree does not count for it
  });

  it("later stages of Spital and Waage follow the same rule without a new patch", async () => {
    const id = await village([
      ...stage("spital2", true),
      ...stage("spital3", false),
      ...stage("waage2", true),
    ]);
    expect(await npSql(id)).toBe(2); // the two markers spital2 and waage2
  });

  it("ordinary purchases count as before; buy3 = two buildings + one finished stage", async () => {
    const id = await village(["hunter", ...stage("waage1", true), "fisher"]);
    expect(await npSql(id)).toBe(3);
    expect(await claim(id, "buy3", ["build", "ten", "hamlet", "road"])).toBe("ok");
    const two = await village(["hunter", ...stage("waage1", false), "fisher"]);
    expect(await claim(two, "buy3", ["build", "ten", "hamlet", "road"])).toBe("not done");
  });

  it("Ankauf credits stay excluded (0151)", async () => {
    const id = await village(["ankauf:20261202", "ankauf:20261203", ...stage("spital1", false)]);
    expect(await npSql(id)).toBe(0);
    expect(await decree(id)).toBe(false);
  });

  it("the decree's rule of 8: seven buildings and any number of money rows are not enough, the eighth is", async () => {
    const seven = ["hunter", "fisher", "herbs", "healer", "granary", "woodcamp", "dairy"];
    const id = await village([...seven, ...stage("spital1", false), "ankauf:20261204"]);
    expect(await decree(id, T0 + 30 * DAY)).toBe(false);
    const eight = await village([...seven, ...stage("spital1", true)]);
    expect(await decree(eight, T0 + 30 * DAY)).toBe(true);
  });

  it("TypeScript countsAsBuilding agrees with the database rule on every kind of row", async () => {
    const items = [
      "hunter",
      "herbs",
      "chest2",
      "spital1",
      "waage1",
      "spital2",
      "waage12",
      "spital1:r1",
      "spital1:r12",
      "waage1:k20261202",
      "spital3:k20270101",
      "waage2:r1",
      "ankauf:20261202",
      "nothilfe-f1763654400000",
      "freimarkt1",
      "spital1:x1", // no money row form: counts like any other unknown row (the guard never sells it)
    ];
    const id = await village(items);
    const counted =
      await sql`select item from public.purchases where seed_id = ${id} and item !~ '^ankauf:[0-9]{8}$' and item !~ '^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$' order by created_at`;
    expect(counted.map((r) => r["item"])).toEqual(items.filter(countsAsBuilding));
    expect(await npSql(id)).toBe(items.filter(countsAsBuilding).length);
  });
});
