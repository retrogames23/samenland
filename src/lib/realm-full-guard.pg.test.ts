// Runs the real realm_full_guard migration against a throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...).
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const URL = process.env["BUILD_MAIL_TEST_PG"];
if (!URL && (process.env["CI"] || process.env["REQUIRE_PG"])) throw new Error("BUILD_MAIL_TEST_PG missing: realm guard DB tests must run");
const d = URL ? describe : describe.skip;
const GUARD = readFileSync(new globalThis.URL("../../drizzle/migrations/0136_europa_iv_realm_guard.sql", import.meta.url), "utf8");

const VICTORIA = "00000000-0000-0000-0000-0000000000a1";
const JOHANNA = "00000000-0000-0000-0000-0000000000a2";
const UNVERIFIED = "00000000-0000-0000-0000-0000000000a3";
const STRANGER = "00000000-0000-0000-0000-0000000000a4";
const ADMIN = "00000000-0000-0000-0000-0000000000a5";

d("realm_full_guard (real PostgreSQL)", () => {
  const sql = postgres(URL!, { max: 1, onnotice: () => {} });
  const found = (uid: string, realm: string) =>
    sql.begin(async (tx) => {
      await tx`select set_config('test.uid', ${uid}, true)`;
      await tx`insert into public.seeds (realm, user_id) values (${realm}, ${uid})`;
      throw new Error("rollback");
    }).catch((e: Error & { code?: string }) => (e.message === "rollback" ? "ok" : e.message));
  const fill = (realm: string, n: number) => sql`insert into public.seeds (realm, user_id) select ${realm}, gen_random_uuid() from generate_series(1, ${n})`;

  beforeAll(async () => {
    await sql.unsafe(`
      drop schema if exists auth cascade; create schema auth;
      create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
      create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
      drop table if exists public.seeds cascade; drop table if exists public.user_roles cascade;
      create table public.seeds (id uuid primary key default gen_random_uuid(), realm text not null, user_id uuid);
      create table public.user_roles (user_id uuid, role text);
      create or replace function public.has_role(_u uuid, _r text) returns boolean language sql stable as $$ select exists (select 1 from public.user_roles where user_id = _u and role = _r) $$;`);
    await sql.unsafe(GUARD);
    await sql.unsafe(`create trigger seeds_realm_full before insert on public.seeds for each row execute function public.realm_full_guard();`);
    await sql`insert into auth.users values
      (${VICTORIA}, 'Victoria.Halper@gmail.com', now()), (${JOHANNA}, 'johanna.mellentin@gmail.com', now()),
      (${UNVERIFIED}, 'victoria.halper@gmail.com', null), (${STRANGER}, 'someone@example.com', now()), (${ADMIN}, 'admin@example.com', now())`;
    await sql`insert into public.user_roles values (${ADMIN}, 'admin')`;
  });
  beforeEach(async () => {
    await sql`alter table public.seeds disable trigger seeds_realm_full`;
    await sql`truncate public.seeds`;
    await fill("europe", 92); await fill("europe-2", 60); await fill("europe-3", 60);
    await sql`alter table public.seeds enable trigger seeds_realm_full`;
  });
  afterAll(async () => { await sql.end(); });

  it("both verified exception accounts may found on the full Europa I", async () => {
    expect(await found(VICTORIA, "europe")).toBe("ok");
    expect(await found(JOHANNA, "europe")).toBe("ok");
  });
  it("an unverified account with the same e-mail gets no exception", async () => {
    expect(await found(UNVERIFIED, "europe")).toBe("realm_full");
  });
  it("other accounts are refused, whatever the client claims", async () => {
    expect(await found(STRANGER, "europe")).toBe("realm_full");
    expect(await found("00000000-0000-0000-0000-0000000000ff", "europe")).toBe("realm_full");
  });
  it("the exception applies only to Europa I", async () => {
    expect(await found(VICTORIA, "europe-2")).toBe("realm_full");
  });
  it("admins stay exempt everywhere", async () => {
    expect(await found(ADMIN, "europe")).toBe("ok");
    expect(await found(ADMIN, "europe-2")).toBe("ok");
  });
  it("chained maps refuse from 60, the last map stays open", async () => {
    expect(await found(STRANGER, "europe-3")).toBe("realm_full"); // Europa III now leads on to Europa IV
    expect(await found(STRANGER, "europe-4")).toBe("ok"); // terminal map not guarded
    await sql`alter table public.seeds disable trigger seeds_realm_full`;
    await sql`delete from public.seeds where realm = 'europe-2' and ctid in (select ctid from public.seeds where realm = 'europe-2' limit 1)`;
    await sql`alter table public.seeds enable trigger seeds_realm_full`;
    expect(await found(STRANGER, "europe-2")).toBe("ok"); // 59 → room
    await fill("asia", 0);
    expect(await found(STRANGER, "asia")).toBe("ok");
  });
});
