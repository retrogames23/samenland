// Shared throw-away PostgreSQL schema for the wedding tests (hochzeitspaket.pg.test.ts, hochzeit-anker.pg.test.ts).
// Loads the real functions from the migration files: village_civic_wealth (0044 + 0046/0050 patches), the 0107 wedding
// list (also kept as village_wedding_list_0107 for comparison), 0096 village_weddings, 0127 receipts, 0118 chest walk,
// the 0138 encounter guard, 0160 (Hochzeitspaket base and Paket A2, anchor continuation), 0161 (H7) and the wedding part of 0162
// (Paket B: completeness proof). Test support only.
import { readFileSync } from "node:fs";
import type postgres from "postgres";

export const mig = (f: string) => readFileSync(new globalThis.URL(`../../drizzle/migrations/${f}`, import.meta.url), "utf8");
/** The text from `start` to the end of the first `end` after it. */
export const block = (text: string, start: string, end: string) => {
  const a = text.indexOf(start);
  if (a < 0) throw new Error(`missing ${start}`);
  const b = text.indexOf(end, a);
  if (b < 0) throw new Error(`missing end of ${start}`);
  return text.slice(a, b + end.length);
};
export const M0107 = mig("0107_chest_cap_all_income.sql");
/** 0160 holds two parts: the Hochzeitspaket base (Teil 1) and Paket A2, the anchor continuation (Teil 2). */
const M0160_FILE = mig("0160_hochzeit_anker.sql"), TEIL2 = M0160_FILE.indexOf("-- ======================================= Teil 2:");
if (TEIL2 < 0) throw new Error("0160: Teil 2 marker missing");
/** Teil 1 of 0160: receipts version 1/2, switch instant, guard, inventory (the former base migration). */
export const M0160_BASE = M0160_FILE.slice(0, TEIL2);
export const LIST_0107 = block(M0107, "CREATE OR REPLACE FUNCTION public.village_wedding_list", "END $function$;");
export const WALK_0118 = block(mig("0118_building_moves.sql"), "CREATE OR REPLACE FUNCTION public.village_balance_walk", "END $function$;");
export function civicWealthSql() {
  // 0044 body, then the in-place patches of 0046 (roads) and 0050 (library 10, dairy, university4 15, orangery3)
  let f = block(mig("0044_civic_estates_and_school_price.sql"), "CREATE OR REPLACE FUNCTION public.village_civic_wealth", "END $$;");
  const p46 = mig("0046_trade_roads_civic_wealth.sql"), m = /replace\(definition, '([^']+)', '((?:[^']|'')+)'\)/.exec(p46)!;
  f = f.replace(m[1]!, m[2]!.replace(/''/g, "'"));
  f = f.replace("WHEN 'library' THEN 5 WHEN", "WHEN 'library' THEN 10 WHEN 'dairy' THEN 5 WHEN");
  f = f.replace("WHEN 'university4' THEN 10", "WHEN 'university4' THEN 15 WHEN 'orangery3' THEN 10");
  if (!f.includes("'dairy' THEN 5") || !f.includes("'orangery3' THEN 10") || !f.includes("first_roads")) throw new Error("civic patches");
  return f;
}

/** Teil 2 of 0160: Paket A2 (anchor continuation). */
export const M0160 = M0160_FILE.slice(TEIL2);
/** 0161: H7 (receipts: no single DELETE, no TRUNCATE, SELECT-only rights). */
export const M0161 = mig("0161_hochzeit_belegschutz.sql");
export const M0162 = mig("0162_hochzeit_vollstaendigkeit.sql");
/** The wedding part of 0162 (proof table, completeness, money check, wedding_settle, checked balance) — the rest of it
 *  patches game guards that this stub schema does not have (tested on the full schema in paket-b.pg.test.ts). */
export const M0162_WEDDING = M0162.slice(0, M0162.indexOf("-- 3b/4)"));

/** Creates the stub tables and loads the migrations. `anchor: false` stops after Teil 1 of 0160 (state before Paket A2). */
export async function prepareWeddingDb(sql: postgres.Sql, opts: { anchor?: boolean } = {}) {
  await sql.unsafe(`
    drop schema if exists auth cascade; create schema auth;
    create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create or replace function auth.role() returns text language sql stable as $$ select nullif(current_setting('test.role', true), '') $$;
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
    end $$;
    drop table if exists public.wedding_receipts, public.encounters, public.rank_certificates, public.purchases, public.charters,
      public.first_roads, public.tax_receipts, public.twin_works, public.building_moves, public.gifts, public.quest_claims,
      public.market_sales, public.referrals, public.village_visits, public.wonder_finds, public.princely_tasks, public.seeds cascade;
    create table public.seeds (id uuid primary key, user_id uuid, created_at timestamptz not null, realm text not null default 'europe');
    create table public.purchases (id uuid primary key default gen_random_uuid(), seed_id uuid not null, item text not null,
      cost integer not null default 0, created_at timestamptz not null default now());
    create table public.charters (id uuid primary key default gen_random_uuid(), seed_id uuid, path text, created_at timestamptz);
    create table public.first_roads (id uuid primary key default gen_random_uuid(), seed_id uuid, target_id uuid, created_at timestamptz);
    create or replace function public.road_done(a uuid, b uuid) returns timestamptz language sql stable as $$ select timestamptz 'infinity' $$;
    create table public.tax_receipts (seed_id uuid, day integer, income integer, primary key (seed_id, day));
    create table public.encounters (id uuid primary key default gen_random_uuid(), seed_id uuid not null references public.seeds(id),
      user_id uuid not null, event text not null, choice text not null, cost integer not null default 0, created_at timestamptz not null default now(), request_id uuid);
    create table public.rank_certificates (seed_id uuid primary key, rank integer, citizens integer, ways integer, certified_at timestamptz);
    create table public.twin_works (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz);
    create table public.building_moves (id uuid primary key default gen_random_uuid(), seed_id uuid, cost integer, created_at timestamptz);
    create table public.gifts (id uuid primary key default gen_random_uuid(), to_seed uuid, from_seed uuid, amount integer, created_at timestamptz);
    create table public.quest_claims (id uuid primary key default gen_random_uuid(), seed_id uuid, reward integer, created_at timestamptz);
    create table public.market_sales (id uuid primary key default gen_random_uuid(), seed_id uuid, reward integer, created_at timestamptz);
    create table public.referrals (id uuid primary key default gen_random_uuid(), referrer_seed uuid, referee_seed uuid, reward integer, created_at timestamptz);
    create table public.village_visits (id uuid primary key default gen_random_uuid(), visitor_seed uuid, reward integer, created_at timestamptz);
    create table public.wonder_finds (id uuid primary key default gen_random_uuid(), seed_id uuid, reward integer, created_at timestamptz);
    create table public.princely_tasks (id uuid primary key default gen_random_uuid(), seed_id uuid, reward integer, done_at timestamptz);
    -- the walk's start value and raids are not part of this package: fixed stubs
    create or replace function public.village_balance_legacy(_seed uuid, _at timestamptz) returns integer language sql stable as $$ select 100 $$;
    create or replace function public.village_raid_list(_seed uuid, _from timestamptz, _to timestamptz) returns table(t timestamptz, loss integer)
      language sql stable as $$ select null::timestamptz, 0 where false $$;
    create or replace function public.tax_spend_lock() returns trigger language plpgsql security definer set search_path = public as $$
      declare sid uuid; begin sid := (to_jsonb(NEW)->>'seed_id')::uuid; perform 1 from public.seeds where id = sid for update; return NEW; end $$;
    create trigger a_tax_spend_lock before insert on public.encounters for each row execute function public.tax_spend_lock();`);
  await sql.unsafe(civicWealthSql());
  await sql.unsafe(LIST_0107);
  await sql.unsafe(LIST_0107.replace("public.village_wedding_list(", "public.village_wedding_list_0107("));
  await sql.unsafe(block(M0107, "CREATE OR REPLACE FUNCTION public.village_weddings_legacy", "$$;"));
  await sql.unsafe(block(M0107, "CREATE OR REPLACE FUNCTION public.village_weddings_fast", "$$;"));
  await sql.unsafe(block(mig("0096_fast_treasury.sql"), "CREATE OR REPLACE FUNCTION public.village_weddings(", "$$;"));
  await sql.unsafe(WALK_0118);
  await sql.unsafe(block(M0107, "CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)", "$$;"));
  await sql.unsafe(WALK_0118.replace("public.village_balance_walk(", "public.village_balance_walk_0107(")
    .replace("public.village_wedding_list(_seed", "public.village_wedding_list_0107(_seed"));
  await sql.unsafe(mig("0127_wedding_receipts.sql"));
  await sql.unsafe(mig("0138_encounters_server_only.sql"));
  await sql.unsafe(`create trigger encounter_guard before insert on public.encounters for each row execute function public.encounter_guard();`);
  await sql.unsafe(M0160_BASE);
  if (opts.anchor ?? true) { await sql.unsafe(M0160); await sql.unsafe(M0161); await sql.unsafe(M0162_WEDDING); }
}
