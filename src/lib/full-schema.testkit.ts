// Test support (Paket B): a throw-away database with the COMPLETE schema — every migration of the drizzle journal, in
// journal order, files unchanged — so the real guards (purchase_guard, gift_guard, encounter_guard, twin_work_guard,
// building_move_guard), purchase_material, the resource and Gemeindebau booking and the A2/B wedding functions run
// together. Only the parts Supabase itself provides (roles, auth, storage, the realtime publication) are stand-ins.
// Never point this at a shared or production database: it creates and drops its own database.
import { readFileSync } from "node:fs";
import postgres from "postgres";

const DIR = new globalThis.URL("../../drizzle/migrations/", import.meta.url);
export const PLATFORM = `
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text, created_at timestamptz not null default now(),
  last_sign_in_at timestamptz, raw_user_meta_data jsonb default '{}'::jsonb);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select nullif(current_setting('test.role', true), '') $$;
grant usage on schema auth to anon, authenticated, service_role;
create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean default false);
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
alter table storage.objects enable row level security;
do $$ begin if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then create publication supabase_realtime; end if; end $$;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on functions to service_role;
`;

/** Tags of the journal in order. */
export function journalTags(): string[] {
  const j = JSON.parse(readFileSync(new globalThis.URL("meta/_journal.json", DIR), "utf8")) as { entries: { tag: string }[] };
  return j.entries.map((e) => e.tag);
}
export const migration = (tag: string) => readFileSync(new globalThis.URL(`${tag}.sql`, DIR), "utf8");

/** Creates `name` from scratch and applies every journal migration (optionally only up to and including `upTo`). */
export async function buildFullSchema(adminUrl: string, name: string, upTo?: string): Promise<string> {
  const admin = postgres(adminUrl, { max: 1, onnotice: () => {} });
  try {
    await admin.unsafe(`drop database if exists ${name} with (force)`);
    await admin.unsafe(`create database ${name}`);
  } finally { await admin.end(); }
  const u = new globalThis.URL(adminUrl); u.pathname = `/${name}`;
  const sql = postgres(u.toString(), { max: 1, onnotice: () => {} });
  try {
    await sql.unsafe(PLATFORM);
    for (const tag of journalTags()) {
      try { await sql.unsafe(migration(tag)); } catch (e) { throw new Error(`migration ${tag}: ${(e as Error).message}`); }
      if (tag === upTo) break;
    }
  } finally { await sql.end(); }
  return u.toString();
}
export async function dropDatabase(adminUrl: string, name: string) {
  const admin = postgres(adminUrl, { max: 1, onnotice: () => {} });
  try { await admin.unsafe(`drop database if exists ${name} with (force)`); } finally { await admin.end(); }
}
