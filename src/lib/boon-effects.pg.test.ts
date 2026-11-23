// M1 Paket 2a (P2-E): runs the real 0140 boon_effects/active_boons against a throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...).
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const URL = process.env["BUILD_MAIL_TEST_PG"];
if (!URL && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: boon effect DB tests must run");
const d = URL ? describe : describe.skip;
const MIG = readFileSync(
  new globalThis.URL("../../drizzle/migrations/0140_boon_effects.sql", import.meta.url),
  "utf8",
);
const SEED = "00000000-0000-0000-0000-0000000000d1";

d("active_boons 0140 (real PostgreSQL)", () => {
  const sql = postgres(URL!, { max: 1, onnotice: () => {} });
  const count = async (at: string) =>
    (await sql`select public.active_boons(${SEED}, ${at}::timestamptz) as n`)[0]!["n"] as number;

  beforeAll(async () => {
    await sql.unsafe(`
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
        if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
      end $$;
      drop table if exists public.boon_effects, public.encounters cascade;
      create table public.encounters (id uuid primary key default gen_random_uuid(), seed_id uuid not null, user_id uuid,
        event text not null, choice text not null, cost integer not null default 0, created_at timestamptz not null);`);
    await sql.unsafe(MIG);
    await sql.unsafe(MIG); // idempotent: a second run changes nothing
    await sql`insert into public.encounters (seed_id, event, choice, created_at) values
      (${SEED}, 'journeyman', 'host', '2026-06-01T00:00:00Z'),
      (${SEED}, 'orphan', 'adopt', '2026-06-01T12:00:00Z'),
      (${SEED}, 'merchant', 'pass', '2026-06-01T13:00:00Z'),
      (${SEED}, 'lichtstube', 'reigen', '2026-06-02T00:00:00Z')`;
  });
  afterAll(async () => {
    await sql.end();
  });

  it("holds exactly the eleven growth answers", async () => {
    const [r] = await sql`select count(*)::int as n from public.boon_effects`;
    expect(r!["n"]).toBe(11);
  });
  it("counts a boon from its booking time until the end of its hours, narrative answers never", async () => {
    expect(await count("2026-05-31T23:59:59Z")).toBe(0);
    expect(await count("2026-06-01T00:00:00Z")).toBe(1); // starts at booking
    expect(await count("2026-06-02T00:00:00Z")).toBe(3); // host, adopt, reigen; merchant:pass is no boon
    expect(await count("2026-06-03T23:59:59Z")).toBe(3);
    expect(await count("2026-06-04T00:00:00Z")).toBe(2); // host ends after exactly 72 h
    expect(await count("2026-06-07T00:00:00Z")).toBe(1); // reigen ends after 120 h
    expect(await count("2026-06-08T12:00:00Z")).toBe(0); // adopt ends after 168 h
  });
  it("is closed to clients", async () => {
    const [r] =
      await sql`select has_function_privilege('authenticated', 'public.active_boons(uuid, timestamptz)', 'execute') as a,
      has_function_privilege('service_role', 'public.active_boons(uuid, timestamptz)', 'execute') as s`;
    expect(r!["a"]).toBe(false);
    expect(r!["s"]).toBe(true);
  });
});
