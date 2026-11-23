// M1 Paket 1b: runs the real 0138 encounter_guard against a throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...).
// Proves: clients cannot insert any more, only the service role books; price and time come from the guard; the
// 6 h gap and the village lock serialise parallel answers; town-life questions need a fresh rank certificate;
// steg, wedding and money checks stay as before.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const URL = process.env["BUILD_MAIL_TEST_PG"];
if (!URL && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: encounter guard DB tests must run");
const d = URL ? describe : describe.skip;
const GUARD = readFileSync(
  new globalThis.URL("../../drizzle/migrations/0138_encounters_server_only.sql", import.meta.url),
  "utf8",
);

const OWNER = "00000000-0000-0000-0000-0000000000b1";
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xc00000 + ++n).toString(16).padStart(12, "0")}`;

d("encounter_guard 0138 (real PostgreSQL)", () => {
  const sql = postgres(URL!, { max: 4, onnotice: () => {} });
  const seed = async (ageDays = 30) => {
    const id = nextSeed();
    await sql`insert into public.seeds (id, user_id, created_at) values (${id}, ${OWNER}, now() - make_interval(days => ${ageDays}))`;
    return id;
  };
  /** Insert as the trusted server (service role); returns "ok" or the guard's message. */
  const server = (
    id: string,
    event: string,
    choice: string,
    extra: { cost?: number; at?: string } = {},
  ) =>
    sql
      .begin(async (tx) => {
        await tx`select set_config('test.role', 'service_role', true)`;
        await tx`insert into public.encounters (seed_id, user_id, event, choice, cost, created_at)
          values (${id}, ${OWNER}, ${event}, ${choice}, ${extra.cost ?? 0}, ${extra.at ?? null}::timestamptz)`;
      })
      .then(() => "ok")
      .catch((e: Error) => e.message);
  const cert = (id: string, rank: number, ageMin = 1) =>
    sql`insert into public.rank_certificates (seed_id, rank, citizens, ways, certified_at) values (${id}, ${rank}, 0, 0, now() - make_interval(mins => ${ageMin}))
      on conflict (seed_id) do update set rank = excluded.rank, certified_at = excluded.certified_at`;

  beforeAll(async () => {
    await sql.unsafe(`
      drop schema if exists auth cascade; create schema auth;
      create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
      create or replace function auth.role() returns text language sql stable as $$ select nullif(current_setting('test.role', true), '') $$;
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
      end $$;
      drop table if exists public.encounters, public.rank_certificates, public.purchases, public.test_balance, public.seeds cascade;
      create table public.seeds (id uuid primary key, user_id uuid, created_at timestamptz not null);
      create table public.encounters (id uuid primary key default gen_random_uuid(), seed_id uuid not null references public.seeds(id),
        user_id uuid not null, event text not null, choice text not null, cost integer not null default 0, created_at timestamptz not null default now());
      create table public.purchases (seed_id uuid, item text);
      create table public.rank_certificates (seed_id uuid primary key, rank integer, citizens integer, ways integer, certified_at timestamptz);
      create table public.test_balance (seed_id uuid primary key, balance integer);
      create or replace function public.village_balance(_seed uuid) returns integer language sql stable as
        $$ select coalesce((select balance from public.test_balance where seed_id = _seed), 1000) $$;
      create or replace function public.village_weddings(_seed uuid, _at timestamptz) returns table(last_at timestamptz) language sql stable as
        $$ select nullif(current_setting('test.wedding', true), '')::timestamptz $$;
      -- 0010: owners could insert directly; 0052: the per-village spend lock runs before every guard
      grant usage on schema public, auth to authenticated;
      grant select, insert on public.encounters to authenticated; grant select on public.seeds to authenticated;
      alter table public.encounters enable row level security;
      create policy "Anyone can see encounters" on public.encounters for select using (true);
      create policy "Owners decide encounters" on public.encounters for insert to authenticated
        with check (user_id = auth.uid() and exists (select 1 from public.seeds s where s.id = encounters.seed_id and s.user_id = auth.uid()));
      create or replace function public.tax_spend_lock() returns trigger language plpgsql security definer set search_path = public as $$
        declare sid uuid; begin sid := (to_jsonb(NEW)->>'seed_id')::uuid; perform 1 from public.seeds where id = sid for update; return NEW; end $$;
      create trigger a_tax_spend_lock before insert on public.encounters for each row execute function public.tax_spend_lock();`);
    await sql.unsafe(GUARD);
    await sql.unsafe(
      `create trigger encounter_guard before insert on public.encounters for each row execute function public.encounter_guard();`,
    );
  });
  beforeEach(async () => {
    await sql`truncate public.encounters, public.rank_certificates, public.test_balance`;
  });
  afterAll(async () => {
    await sql.end();
  });

  it("P1-D: the owner can no longer insert directly — the INSERT right is gone", async () => {
    const id = await seed();
    const r = await sql
      .begin(async (tx) => {
        await tx`select set_config('test.uid', ${OWNER}, true), set_config('test.role', 'authenticated', true)`;
        await tx.unsafe("set local role authenticated");
        await tx`insert into public.encounters (seed_id, user_id, event, choice) values (${id}, ${OWNER}, 'cow', 'sell')`;
      })
      .then(() => "ok")
      .catch((e: Error) => e.message);
    expect(r).toMatch(/permission denied/);
    const [p] =
      await sql`select count(*)::int as n from pg_policies where tablename = 'encounters' and policyname = 'Owners decide encounters'`;
    expect(p!["n"]).toBe(0);
  });
  it("P1-D: even with table rights, the guard refuses every non-service role", async () => {
    const id = await seed();
    const r = await sql
      .begin(async (tx) => {
        await tx`select set_config('test.role', 'authenticated', true)`;
        await tx`insert into public.encounters (seed_id, user_id, event, choice) values (${id}, ${OWNER}, 'cow', 'sell')`;
      })
      .then(() => "ok")
      .catch((e: Error) => e.message);
    expect(r).toBe("server only");
  });
  it("P1-$: the server books; price and time are the guard's, never the caller's", async () => {
    const id = await seed();
    expect(await server(id, "cow", "sell", { cost: 999, at: "2020-01-01T00:00:00Z" })).toBe("ok");
    const [row] =
      await sql`select cost, created_at > now() - interval '1 minute' as fresh from public.encounters where seed_id = ${id}`;
    expect(row!["cost"]).toBe(-30);
    expect(row!["fresh"]).toBe(true);
    expect(await server(await seed(), "dragon", "slay")).toBe("unknown encounter");
  });
  it("P1-G: one answer per 6 h window, also for parallel requests", async () => {
    const id = await seed();
    expect(await server(id, "merchant", "pass")).toBe("ok");
    expect(await server(id, "cow", "sell")).toBe("too soon");
    const other = await seed();
    const both = await Promise.all([
      server(other, "cow", "sell"),
      server(other, "boundary", "award"),
    ]);
    expect(both.filter((x) => x === "ok")).toHaveLength(1);
    expect(both.filter((x) => x === "too soon")).toHaveLength(1);
    const [c] =
      await sql`select count(*)::int as n from public.encounters where seed_id = ${other}`;
    expect(c!["n"]).toBe(1);
  });
  it("P1-R3/R4/R5: town-life questions need a fresh certificate of the required rank", async () => {
    const cases: [string, string, number][] = [
      ["bier", "zoll", 3],
      ["wache", "loskauf", 3],
      ["stoerer", "dulden", 3],
      ["gast", "frei", 4],
      ["seuche", "offen", 4],
      ["hansetag", "gefolge", 5],
    ];
    for (const [e, c, need] of cases) {
      const none = await seed();
      expect(await server(none, e, c), `${e} without certificate`).toBe("rank too low");
      const low = await seed();
      await cert(low, need - 1);
      expect(await server(low, e, c), `${e} rank ${need - 1}`).toBe("rank too low");
      const stale = await seed();
      await cert(stale, need, 20);
      expect(await server(stale, e, c), `${e} stale certificate`).toBe("rank too low");
      const ok = await seed();
      await cert(ok, need);
      expect(await server(ok, e, c), `${e} rank ${need}`).toBe("ok");
    }
    // village-life questions need no certificate
    expect(await server(await seed(), "lichtstube", "reigen")).toBe("ok");
  });
  it("P1-S: the footbridge is decided once per village", async () => {
    const id = await seed();
    expect(await server(id, "steg", "together")).toBe("ok");
    await sql`update public.encounters set created_at = now() - interval '8 days' where seed_id = ${id}`;
    expect(await server(id, "steg", "carpenter")).toBe("already decided");
  });
  it("P1-H: the wedding feast only during a real wedding and once", async () => {
    const id = await seed();
    expect(await server(id, "wedding", "feast")).toBe("no wedding");
    const at = new Date(Date.now() - 3600e3).toISOString();
    const inWedding = (ev: string, ch: string) =>
      sql
        .begin(async (tx) => {
          await tx`select set_config('test.role', 'service_role', true), set_config('test.wedding', ${at}, true)`;
          await tx`insert into public.encounters (seed_id, user_id, event, choice) values (${id}, ${OWNER}, ${ev}, ${ch})`;
        })
        .then(() => "ok")
        .catch((e: Error) => e.message);
    expect(await inWedding("wedding", "feast")).toBe("ok");
    expect(await inWedding("wedding", "gift")).toBe("already decided");
  });
  it("money: a paid answer needs the Mark in the chest", async () => {
    const id = await seed();
    await sql`insert into public.test_balance values (${id}, 10)`;
    expect(await server(id, "ruin", "shrine")).toBe("not enough money");
    expect(await server(id, "ruin", "stones")).toBe("ok");
  });
});
