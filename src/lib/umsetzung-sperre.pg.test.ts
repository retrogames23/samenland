// Gebäudeumsetzung (migration 0149): the village row lock must fire before the move's money check. Against a throw-away
// PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...), own database. Uses the REAL tax_spend_lock (0052), the REAL
// building_moves triggers, move_price and building_move_guard (0118); the chest is a stand-in (start money minus purchases
// and moves). Each race runs once on the 0118 order (documents the old overdraft) and once after 0149.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: building move lock DB tests must run");
const d = BASE ? describe : describe.skip;
const mig = (f: string) =>
  readFileSync(new globalThis.URL(`../../drizzle/migrations/${f}`, import.meta.url), "utf8");
const M052 = mig("0052_resident_tax_receipts.sql");
const M118 = mig("0118_building_moves.sql");
const between = (s: string, a: string, b: string) =>
  s.slice(s.indexOf(a), s.indexOf(b, s.indexOf(a)));
const LOCK_FN = between(
  M052,
  "CREATE OR REPLACE FUNCTION public.tax_spend_lock()",
  "REVOKE ALL ON FUNCTION public.tax_spend_lock()",
);
const PURCHASE_LOCK =
  /CREATE TRIGGER a_tax_spend_lock BEFORE INSERT ON public\.purchases[^\n]*/.exec(M052)![0];
const MOVES_TABLE = between(M118, "CREATE TABLE public.building_moves", "CREATE INDEX");
const MOVE_PRICE = between(M118, "CREATE OR REPLACE FUNCTION public.move_price", "\n$$;") + "\n$$;";
const MOVE_GUARD = between(
  M118,
  "CREATE OR REPLACE FUNCTION public.building_move_guard()",
  "CREATE TRIGGER building_moves_lock",
);
const MOVE_TRIGGERS =
  /CREATE TRIGGER building_moves_lock[^\n]*\nCREATE TRIGGER building_moves_guard[^\n]*/.exec(
    M118,
  )![0];
const M149 = mig("0149_umsetzung_sperre.sql");
const OWNER = "00000000-0000-0000-0000-0000000000e1";
const DB = `samenland_moves_${process.pid}`;
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xe00000 + ++n).toString(16).padStart(12, "0")}`;

d("Gebäudeumsetzung: Dorfsperre vor der Kassenprüfung (0149, real PostgreSQL)", () => {
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: postgres.Sql;
  const seed = async (money: number) => {
    const id = nextSeed();
    await sql`insert into public.seeds (id, user_id, x, y) values (${id}, ${OWNER}, 500, 500)`;
    await sql`insert into public.test_balance values (${id}, ${money})`;
    // two built buildings that may be moved (herbs 20 Mark, backhaus 50 Mark), bought for free
    await sql`insert into public.purchases (seed_id, user_id, item, cost) values (${id}, ${OWNER}, 'herbs', 0), (${id}, ${OWNER}, 'backhaus', 0)`;
    return id;
  };
  const balance = async (id: string) =>
    (await sql`select public.village_balance(${id}) as b`)[0]!["b"] as number;
  const triggers = async () =>
    (
      await sql`select c.relname as t, g.tgname as n from pg_trigger g join pg_class c on c.oid = g.tgrelid
        where not g.tgisinternal order by c.relname, g.tgname collate "C"`
    ).map((r) => `${r["t"]}.${r["n"]}`);
  /** A holds the village with a spend in an open transaction; B moves a building meanwhile; then A commits. */
  const race = async (
    id: string,
    spend: (A: postgres.ReservedSql) => Promise<unknown>,
    move: string,
  ) => {
    const A = await sql.reserve(),
      B = await sql.reserve();
    try {
      await A`begin`;
      await spend(A);
      const [pb] = await B`select pg_backend_pid() as pid`;
      const pending =
        B`insert into public.building_moves (seed_id, user_id, item, x, y) values (${id}, ${OWNER}, ${move}, 505, 505)`.then(
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
      expect(waited).toBe(true); // B is blocked by A's village lock (before 0149: only after its money check)
      await A`commit`;
      return await pending;
    } finally {
      await A`rollback`.catch(() => {});
      A.release();
      B.release();
    }
  };
  const buy = (id: string, cost: number) => (A: postgres.ReservedSql) =>
    A`insert into public.purchases (seed_id, user_id, item, cost) values (${id}, ${OWNER}, 'spend', ${cost})`;
  const moveFirst = (id: string) => (A: postgres.ReservedSql) =>
    A`insert into public.building_moves (seed_id, user_id, item, x, y) values (${id}, ${OWNER}, 'herbs', 505, 505)`;

  beforeAll(async () => {
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.unsafe(`create database ${DB}`);
    const u = new globalThis.URL(BASE!);
    u.pathname = `/${DB}`;
    sql = postgres(u.toString(), { max: 6, onnotice: () => {} });
    await sql.unsafe(`
      create table public.seeds (id uuid primary key, user_id uuid, x integer, y integer, created_at timestamptz not null default now());
      create table public.purchases (id uuid primary key default gen_random_uuid(), seed_id uuid not null references public.seeds(id),
        user_id uuid not null, item text not null, cost integer not null default 0, created_at timestamptz not null default now());
      create table public.test_balance (seed_id uuid primary key, balance integer);
      ${MOVES_TABLE}
      create function public.village_balance(_seed uuid) returns integer language sql stable as
        $$ select (select balance from public.test_balance where seed_id = _seed)
             - coalesce((select sum(cost) from public.purchases where seed_id = _seed), 0)::int
             - coalesce((select sum(cost) from public.building_moves where seed_id = _seed), 0)::int $$;`);
    await sql.unsafe(LOCK_FN);
    await sql.unsafe(PURCHASE_LOCK);
    await sql.unsafe(MOVE_PRICE);
    await sql.unsafe(MOVE_GUARD);
    await sql.unsafe(MOVE_TRIGGERS);
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  it("before 0149 (order of 0118): a move racing with a purchase passes on the old balance — the chest goes negative", async () => {
    expect((await triggers()).filter((t) => t.startsWith("building_moves."))).toEqual([
      "building_moves.building_moves_guard",
      "building_moves.building_moves_lock",
    ]);
    const id = await seed(100);
    expect(await race(id, buy(id, 90), "herbs")).toBe("ok");
    expect(await balance(id)).toBe(-10);
  });

  it("0149 renames only the move lock trigger, so it fires first; every other trigger stays; idempotent", async () => {
    const before = await triggers();
    await sql.unsafe(M149);
    await sql.unsafe(M149);
    const after = await triggers();
    expect(after.filter((t) => t.startsWith("building_moves."))).toEqual([
      "building_moves.a_tax_spend_lock",
      "building_moves.building_moves_guard",
    ]);
    expect(after.filter((t) => !t.startsWith("building_moves."))).toEqual(
      before.filter((t) => !t.startsWith("building_moves.")),
    );
    const fn = await sql`select p.proname from pg_trigger g join pg_proc p on p.oid = g.tgfoid
      where g.tgrelid = 'public.building_moves'::regclass and g.tgname = 'a_tax_spend_lock'`;
    expect(fn[0]!["proname"]).toBe("tax_spend_lock");
  });

  it("after 0149: a move racing with a purchase waits for the lock and is refused on the reduced balance", async () => {
    const id = await seed(100);
    expect(await race(id, buy(id, 90), "herbs")).toBe("not enough money");
    expect(await balance(id)).toBe(10);
  });

  it("after 0149: two parallel moves of one village — the second waits and sees the first (never both on one balance)", async () => {
    const id = await seed(30);
    expect(await race(id, moveFirst(id), "backhaus")).toMatch(/move busy|not enough money/);
    expect(await balance(id)).toBe(10);
  });
});
