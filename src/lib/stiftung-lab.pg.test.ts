// P4 Schritt 2b – Lab-Aktivierung der Stiftungen (migration 0169) against a throw-away PostgreSQL with the COMPLETE
// schema (full-schema.testkit.ts: every journal migration, files unchanged). BUILD_MAIL_TEST_PG=postgres://… ; own
// databases, dropped afterwards.
//
// Unlike stiftung.pg.test.ts this file overrides NO switch: it tests the delivered state. Only `lab` is active; the four
// public time zones and their overflow maps stay off. The rules themselves are tested in stiftung.pg.test.ts.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFullSchema, dropDatabase, journalTags, migration } from "./full-schema.testkit";
import { CLIENT_PROTOCOL } from "./client-protocol";
import { STIFT_SINCE, STIFT_SINCE_LAB, stiftSince, stiftUntil, waageFactor } from "@/game/stiftung";
import { kontorCost } from "@/game/civic";
import type { Seed } from "@/game/world";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"])) throw new Error("BUILD_MAIL_TEST_PG missing: P4 DB tests must run");
const d = BASE ? describe : describe.skip;

const D = 864e5, H = 3.6e6;
const NOW = Date.now();
const iso = (t: number) => new Date(t).toISOString();
const C = CLIENT_PROTOCOL;
const LAB = "2026-11-28T00:00:00.000Z", OFF = "2100-01-04T00:00:00.000Z";
const PUBLIC = ["europe", "us-west", "us-east", "asia", "europe-2", "europe-3", "europe-4", "us-west-2", "us-east-2", "asia-2"];
const TAG = "0169_stiftungen_lab_aktivierung", COMPANION = "0170_begleitmigration_0170";
let n = 0;
const uid = () => `00000000-0000-0000-0000-${(0xf50000 + ++n).toString(16).padStart(12, "0")}`;
type V = { id: string; owner: string; realm: string };
type J = Record<string, unknown>;
const err = (p: PromiseLike<unknown>) => Promise.resolve(p).then(() => "ok", (e: Error) => e.message);
const fnHashes = async (q: postgres.Sql) => (await q`select p.oid::regprocedure::text f, md5(pg_get_functiondef(p.oid)) h, p.proacl::text acl, p.provolatile v, p.prosecdef sd, pg_get_userbyid(p.proowner) o
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace where ns.nspname = 'public' and p.prokind = 'f' order by 1`).map((r) => `${r["f"]}=${r["h"]}|${r["acl"]}|${r["v"]}|${r["sd"]}|${r["o"]}`);
const since = async (q: postgres.Sql, realm: string | null) => ((await q`select public.stift_since(${realm}) t`)[0]!["t"] as Date).toISOString();
/** A village that could endow (stage 1 of both Bauten stands, a booked daily tax, a site), three days old. */
const village = async (q: postgres.Sql, realm: string): Promise<V> => {
  const id = uid(), owner = uid();
  await q.begin(async (tx) => {
    await tx`set local session_replication_role = replica`;
    await tx`insert into public.seeds (id, user_id, owner, name, x, y, realm, created_at) values (${id}, ${owner}, 'Test', ${"Dorf " + n}, ${100 + (n % 400)}, ${120 + Math.floor(n / 400)}, ${realm}, ${iso(NOW - 3 * D)})`;
    await tx`insert into public.village_sites (seed_id, way, certified_at) values (${id}, 'grain', ${iso(NOW - 3 * D + H)})`;
    for (const b of ["spital1", "waage1"]) await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${id}, ${owner}, ${b}, 0, ${iso(NOW - 2 * D)})`;
    await tx`insert into public.tax_receipts (seed_id, day, population, households, income, assessed_at, version) values (${id}, 2, 50, 10, 500, ${iso(NOW - D)}, 1)`;
  });
  return { id, owner, realm };
};
const asPlayer = <R>(q: postgres.Sql, v: V, f: (tx: postgres.TransactionSql) => Promise<R>) => q.begin(async (tx) => {
  await tx`select set_config('test.uid', ${v.owner}, true), set_config('test.role', 'authenticated', true)`;
  await tx.unsafe("set local role authenticated");
  return f(tx);
});
const open = (q: postgres.Sql, v: V, bau: string) => asPlayer(q, v, async (tx) => (await tx`select public.stift_open(${v.id}, ${bau}, ${C}) r`)[0]!["r"] as J);
const deposit = (q: postgres.Sql, v: V, bau: string, m: number, a: number) => asPlayer(q, v, async (tx) => (await tx`select public.stift_deposit(${v.id}, ${bau}, ${m}, ${a}, ${C}) r`)[0]!["r"] as J);
const close = (q: postgres.Sql, v: V, bau: string) => asPlayer(q, v, async (tx) => (await tx`select public.stift_close(${v.id}, ${bau}, 100000, ${C}) r`)[0]!["r"] as J);
const overview = (q: postgres.Sql, v: V) => asPlayer(q, v, async (tx) => (await tx`select public.stift_overview(${v.id}, ${C}) r`)[0]!["r"] as J & Record<string, J>);
const stiftRows = async (q: postgres.Sql, v: V) => (await q`select item, cost from public.purchases where seed_id = ${v.id} and item like 'stift:%' order by item`).map((r) => `${r["item"]}=${r["cost"]}`);
/** Chest and store for a close entirely from the store (outside the guards; the rules are tested elsewhere). */
const provide = async (q: postgres.Sql, v: V) => {
  await q`select public.resource_refresh_try(${v.id}, (now() at time zone 'utc')::date)`;
  await q.begin(async (tx) => {
    await tx`set local session_replication_role = replica`;
    await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, 'test_money', -6000, '2026-11-01T00:00:00Z')`;
    for (const r of ["wood", "stone"]) await tx`insert into public.resource_ledger (seed_id, resource, amount, kind, ref, at) values (${v.id}, ${r}, 60, 'prod', ${"test-" + ++n}, now())`;
  });
};
/** A minimal live journal as drizzle keeps it, so the check package can read it. */
const journal = async (q: postgres.Sql, tags: string[]) => {
  await q.unsafe("create schema if not exists drizzle; create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)");
  const when = JSON.parse(readFileSync(new globalThis.URL("../../drizzle/migrations/meta/_journal.json", import.meta.url), "utf8")) as { entries: { tag: string; when: number }[] };
  for (const t of tags) await q`insert into drizzle.__drizzle_migrations (hash, created_at) values (${createHash("sha256").update(migration(t)).digest("hex")}, ${when.entries.find((e) => e.tag === t)!.when})`;
};
const pruefpaket = async (q: postgres.Sql, file: string) => {
  const text = readFileSync(new globalThis.URL(`../../docs/sql/0169/${file}`, import.meta.url), "utf8");
  expect(text).toMatch(/^BEGIN TRANSACTION READ ONLY;$/m);
  expect(text.trimEnd().endsWith("ROLLBACK;")).toBe(true);
  expect(text.replace(/--.*$/gm, "").replace(/'[^']*'/g, "''")).not.toMatch(/\b(insert|update|delete|create|alter|drop|grant|revoke|truncate|commit)\b/i);
  const conn = await q.reserve();
  let sets: J[][];
  try { sets = (await conn.unsafe(text).simple()) as unknown as J[][]; } finally { conn.release(); }
  const rows = sets.flat().filter((r) => r && typeof r === "object" && "art" in r);
  const of = (art: string) => rows.filter((r) => r["art"] === art);
  return { checks: of("pruefung"), schalter: of("schalter").map((r) => `${r["welt"]}:${r["aktiv"]}`), bestand: of("bestand").map((r) => `${r["name"]} = ${r["wert"]}`), journal: of("journal") };
};

d("P4 Schritt 2b – Lab-Aktivierung (0169): nur lab ist aktiv, jede andere Welt bleibt abgeschaltet", () => {
  const A = `stiftlab_${process.pid}_${Date.now()}`;
  let sql: postgres.Sql;
  beforeAll(async () => { sql = postgres(await buildFullSchema(BASE!, A), { max: 6, onnotice: () => {} }); }, 180000);
  afterAll(async () => { await sql.end(); await dropDatabase(BASE!, A); });

  it("L1 Schalter im Auslieferungszustand: lab = 28.11.2026 00:00 UTC; europe, us-west, us-east, asia und alle Überlaufkarten = 04.01.2100; Datenbank und TypeScript gleich", async () => {
    expect(journalTags().slice(-2)).toEqual([TAG, COMPANION]);
    expect(migration(COMPANION)).toBe("SELECT 1;");
    expect(await since(sql, "lab")).toBe(LAB);
    expect(iso(stiftSince("lab"))).toBe(LAB);
    expect(STIFT_SINCE_LAB).toBe(Date.parse(LAB));
    for (const r of [...PUBLIC, "", "LAB", "Lab", "lab ", "lab-2", "unknown"]) {
      expect(await since(sql, r), r).toBe(OFF);
      expect(iso(stiftSince(r)), r).toBe(OFF);
    }
    expect(await since(sql, null)).toBe(OFF);
    expect(iso(stiftSince(null))).toBe(OFF);
    expect(STIFT_SINCE).toBe(Date.parse(OFF));
    // every realm the client knows (time.ts REALM_NEXT chains) except lab is off in the database too
    const realms = (await import("@/game/time")) as unknown as { REALM_NEXT?: Record<string, string> };
    const chain = new Set<string>(Object.entries(realms.REALM_NEXT ?? {}).flat());
    expect(chain.size).toBeGreaterThan(4);
    for (const r of chain) if (r !== "lab") { expect(await since(sql, r), r).toBe(OFF); expect(iso(stiftSince(r)), r).toBe(OFF); }
  });

  it("L2 Isolation: nur ein Lab-Dorf kann öffnen, einzahlen und stiften; dieselben Dörfer in jeder anderen Welt werden abgelehnt und sehen nichts", async () => {
    const lab = await village(sql, "lab");
    const others: V[] = [];
    for (const r of PUBLIC) others.push(await village(sql, r));
    for (const v of others) {
      expect(await err(open(sql, v, "spital")), v.realm).toBe("not now");
      expect(await err(deposit(sql, v, "spital", 1, 10)), v.realm).toBe("not now");
      expect(await err(close(sql, v, "spital")), v.realm).toBe("not now");
      expect(await overview(sql, v), v.realm).toMatchObject({ active: false });
      expect(await stiftRows(sql, v)).toEqual([]);
    }
    expect((await sql`select count(*)::int c from public.stift_stages`)[0]!["c"]).toBe(0);
    // lab: the regular course, with no switch overridden anywhere
    const ov = await overview(sql, lab);
    expect(ov).toMatchObject({ active: true, tax: 500, price: 2000 });
    expect(ov["spital"]).toMatchObject({ built: true, lock: null });
    expect(await open(sql, lab, "waage")).toEqual({ bau: "waage", nr: 1, price: 2000 });
    await provide(sql, lab);
    expect(await deposit(sql, lab, "waage", 1, 800)).toMatchObject({ paid: 800, funded: false });
    expect(await deposit(sql, lab, "waage", 2, 1200)).toMatchObject({ paid: 2000, funded: true });
    const r = await close(sql, lab, "waage");
    expect(r).toMatchObject({ bau: "waage", nr: 1, kontor: 0, store: { wood: 30, stone: 20 } });
    expect(await stiftRows(sql, lab)).toEqual(["stift:waage:1=0", "stift:waage:1:r1=800", "stift:waage:1:r2=1200"]);
    // 14 days of Stiftungszeit, the same in the database and in TypeScript
    const st = (await sql`select done_at, until_at from public.stift_stages where seed_id = ${lab.id}`)[0]!;
    expect((st["until_at"] as Date).getTime() - (st["done_at"] as Date).getTime()).toBe(14 * D);
    const seed = { id: lab.id, bought: (await sql`select item, created_at from public.purchases where seed_id = ${lab.id}`).map((x) => ({ item: x["item"] as string, at: (x["created_at"] as Date).getTime() })) } as unknown as Seed;
    expect(stiftUntil(seed, "waage", Date.now())).toBe((st["until_at"] as Date).getTime());
    // the effect acts in lab only: Kontor price ×0,85 on top of Waage 1 — a public village with the same buildings pays the old price
    const price = async (v: V) => (await sql`select public.resource_kontor_at(${v.id}, 30, 20, now()) c`)[0]!["c"] as number;
    expect(await price(lab)).toBe(173);
    expect(kontorCost({ wood: 30, stone: 20 }, "grain", waageFactor(seed, Date.now()))).toBe(173);
    for (const v of others) expect(await price(v), v.realm).toBe(204);
    // only lab rows exist
    expect((await sql`select distinct s.realm from public.stift_stages t join public.seeds s on s.id = t.seed_id`).map((x) => x["realm"])).toEqual(["lab"]);
    expect((await sql`select count(*)::int c from public.purchases p join public.seeds s on s.id = p.seed_id where p.item like 'stift:%' and s.realm <> 'lab'`)[0]!["c"]).toBe(0);
  });

  it("L3 kein rückwirkender Effekt: die Aktivierung allein bucht nichts – kein Tageslauf und kein Login erzeugt eine Stiftungszeile", async () => {
    const lab = await village(sql, "lab");
    expect(await sql`select public.resource_refresh_try(${lab.id}, (now() at time zone 'utc')::date)`.then(() => "ok")).toBe("ok");
    expect(await err(asPlayer(sql, lab, (tx) => tx`select public.resource_overview_v2(${lab.id}, ${C})`))).toBe("ok");
    await overview(sql, lab);
    expect(await stiftRows(sql, lab)).toEqual([]);
    expect((await sql`select count(*)::int c from public.stift_stages where seed_id = ${lab.id}`)[0]!["c"]).toBe(0);
  });
});

d("P4 Schritt 2b – Migration 0169: ändert genau eine Funktion, ist wiederholbar, bricht bei unerwartetem Stand ab; Rücknahme", () => {
  const TAGS = journalTags(), I = TAGS.indexOf(TAG);
  const B = `stiftlab_m_${process.pid}_${Date.now()}`, X = `stiftlab_x_${process.pid}_${Date.now()}`;
  let sql: postgres.Sql, old: postgres.Sql;
  beforeAll(async () => {
    expect(I).toBeGreaterThan(0);
    sql = postgres(await buildFullSchema(BASE!, B, TAGS[I - 1]!), { max: 4, onnotice: () => {} });
    old = postgres(await buildFullSchema(BASE!, X, "0164_begleitmigration_0164"), { max: 2, onnotice: () => {} });
  }, 240000);
  afterAll(async () => { await sql.end(); await old.end(); await dropDatabase(BASE!, B); await dropDatabase(BASE!, X); });

  it("M1 vor 0169 ist alles aus; 0169 ändert genau stift_since (Körper), sonst keine Funktion, kein Recht, keine Tabelle; Prüfpaket vorher/nachher bestanden", async () => {
    await journal(sql, TAGS.slice(Math.max(0, I - 3), I));
    for (const r of ["lab", ...PUBLIC]) expect(await since(sql, r)).toBe(OFF);
    const lab = await village(sql, "lab"), eu = await village(sql, "europe");
    expect(await err(open(sql, lab, "spital"))).toBe("not now");
    const f0 = await fnHashes(sql);
    const tables0 = (await sql`select c.relname, c.relacl::text acl, c.relrowsecurity r from pg_class c join pg_namespace ns on ns.oid = c.relnamespace where ns.nspname = 'public' and c.relkind in ('r', 'v', 'S') order by 1`).map((x) => JSON.stringify(x));
    const vor = await pruefpaket(sql, "01_vorher.sql");
    expect(vor.checks.length).toBe(6);
    expect(vor.checks.filter((r) => r["ok"] !== true).map((r) => r["pruefung"])).toEqual([]);
    expect(vor.schalter.filter((x) => x.endsWith(":true"))).toEqual([]);
    expect(vor.schalter.length).toBe(11);

    await sql.unsafe(migration(TAG));
    await sql.unsafe(migration(COMPANION));
    await journal(sql, [TAG, COMPANION]);
    const f1 = await fnHashes(sql);
    const changed = f1.filter((x, i) => x !== f0[i]).map((x) => x.split("=")[0]);
    expect(f1.length).toBe(f0.length);
    expect(changed).toEqual(["stift_since(text)"]);
    // of stift_since only the body changed: rights, volatility, definer and owner are the same
    const meta = (l: string[]) => l.find((x) => x.startsWith("stift_since(text)="))!.split("|").slice(1).join("|");
    expect(meta(f1)).toBe(meta(f0));
    expect((await sql`select has_function_privilege('authenticated', 'public.stift_since(text)', 'execute') a, has_function_privilege('anon', 'public.stift_since(text)', 'execute') n, has_function_privilege('service_role', 'public.stift_since(text)', 'execute') s`)[0]).toEqual({ a: false, n: false, s: true });
    expect((await sql`select c.relname, c.relacl::text acl, c.relrowsecurity r from pg_class c join pg_namespace ns on ns.oid = c.relnamespace where ns.nspname = 'public' and c.relkind in ('r', 'v', 'S') order by 1`).map((x) => JSON.stringify(x))).toEqual(tables0);
    expect(await since(sql, "lab")).toBe(LAB);
    for (const r of PUBLIC) expect(await since(sql, r)).toBe(OFF);
    // the same villages: lab may open now, europe still may not
    expect((await open(sql, lab, "spital"))["price"]).toBe(2000);
    expect(await err(open(sql, eu, "spital"))).toBe("not now");

    const nach = await pruefpaket(sql, "02_nachher.sql");
    expect(nach.checks.length).toBe(23);
    expect(nach.checks.filter((r) => r["ok"] !== true).map((r) => r["pruefung"])).toEqual([]);
    expect(nach.schalter.filter((x) => x.endsWith(":true"))).toEqual(["lab:true"]);
    expect(nach.journal.length).toBe(4);
    // (the stage opened above is the only difference of the Bestand block; without it the block is identical)
    expect(nach.bestand.filter((x) => !x.startsWith("stift_stages"))).toEqual(vor.bestand.filter((x) => !x.startsWith("stift_stages")));
    // after the migration the "before" file says so instead of passing
    expect((await pruefpaket(sql, "01_vorher.sql")).checks.filter((r) => r["ok"] !== true).length).toBeGreaterThan(0);
    // the documented hash is the file's hash (drizzle.__drizzle_migrations.hash)
    const doc = readFileSync(new globalThis.URL("../../docs/p4-lab-aktivierung.md", import.meta.url), "utf8");
    for (const t of [TAG, COMPANION]) expect(doc).toContain(createHash("sha256").update(migration(t)).digest("hex"));
  });

  it("M2 wiederholbar: erneutes Einspielen ändert nichts", async () => {
    const f = await fnHashes(sql), rows = (await sql`select count(*)::int c from public.stift_stages`)[0]!["c"];
    expect(await err(sql.unsafe(migration(TAG)))).toBe("ok");
    expect(await fnHashes(sql)).toEqual(f);
    expect((await sql`select count(*)::int c from public.stift_stages`)[0]!["c"]).toBe(rows);
    expect(await since(sql, "lab")).toBe(LAB);
  });

  it("M3 Rücknahme (docs/p4-lab-aktivierung.md): lab wieder auf dem Platzhalter – neue Aktionen gesperrt, Gebuchtes bleibt und wirkt bis zu seinem Ende", async () => {
    const lab = await village(sql, "lab");
    await open(sql, lab, "waage");
    await provide(sql, lab);
    await deposit(sql, lab, "waage", 1, 2000);
    await close(sql, lab, "waage");
    const price = async () => (await sql`select public.resource_kontor_at(${lab.id}, 30, 20, now()) c`)[0]!["c"] as number;
    expect(await price()).toBe(173);
    const doc = readFileSync(new globalThis.URL("../../docs/p4-lab-aktivierung.md", import.meta.url), "utf8");
    const back = /```sql\n(CREATE OR REPLACE FUNCTION public\.stift_since[\s\S]*?)```/.exec(doc)![1]!;
    const res = await err(sql.begin(async (tx) => {
      await tx.unsafe(back);
      expect(((await tx`select public.stift_since('lab') t`)[0]!["t"] as Date).toISOString()).toBe(OFF);
      await tx`select set_config('test.uid', ${lab.owner}, true), set_config('test.role', 'authenticated', true)`;
      const o = await tx.savepoint((sp) => sp`select public.stift_open(${lab.id}, 'spital', ${C})`).then(() => "ok", (e: Error) => e.message);
      expect(o).toBe("not now");
      expect((await tx`select count(*)::int c from public.stift_stages where seed_id = ${lab.id} and done_at is not null`)[0]!["c"]).toBe(1);
      expect((await tx`select public.resource_kontor_at(${lab.id}, 30, 20, now()) c`)[0]!["c"]).toBe(173);
      expect((await tx`select has_function_privilege('authenticated', 'public.stift_since(text)', 'execute') a`)[0]!["a"]).toBe(false);
      throw new Error("rollback");
    }));
    expect(res).toBe("rollback");
    expect(await since(sql, "lab")).toBe(LAB);                    // the test left the activation in place
  });

  it("M4 Fehlerbehandlung: steht ein Schalter unerwartet, oder fehlt 0165, bricht 0169 vor jeder Änderung ab", async () => {
    // a public map already active (must never be overwritten silently)
    const f0 = await fnHashes(sql);
    const tamper = (lab: string, eu: string) => `create or replace function public.stift_since(_realm text) returns timestamptz language sql immutable set search_path to 'public'
      as $$ SELECT CASE WHEN _realm = 'lab' THEN timestamptz '${lab}' WHEN _realm = 'europe' THEN timestamptz '${eu}' ELSE timestamptz '2100-01-04 00:00:00+00' END $$`;
    for (const [lab, eu, msg] of [
      ["2100-01-04 00:00:00+00", "2026-12-07 00:00:00+00", "P4 0169: stift_since(europe) steht nicht auf dem Platzhalter"],
      ["2026-12-01 00:00:00+00", "2100-01-04 00:00:00+00", "P4 0169: stift_since(lab) steht unerwartet auf"],
    ] as const) {
      const res = await err(sql.begin(async (tx) => {
        await tx.unsafe(tamper(lab, eu));
        const before = ((await tx`select md5(pg_get_functiondef('public.stift_since(text)'::regprocedure)) h`)[0]!["h"]) as string;
        const r = await tx.savepoint((sp) => sp.unsafe(migration(TAG))).then(() => "ok", (e: Error) => e.message);
        expect(r).toContain(msg);
        expect((await tx`select md5(pg_get_functiondef('public.stift_since(text)'::regprocedure)) h`)[0]!["h"]).toBe(before);
        throw new Error("rollback");
      }));
      expect(res).toBe("rollback");
    }
    expect(await fnHashes(sql)).toEqual(f0);
    // a database without 0165 (schema up to 0164)
    const g0 = await fnHashes(old);
    expect(await err(old.unsafe(migration(TAG)))).toContain("P4 0169: 0165 fehlt");
    expect(await fnHashes(old)).toEqual(g0);
    expect((await old`select to_regprocedure('public.stift_since(text)') f`)[0]!["f"]).toBeNull();
  });
});
