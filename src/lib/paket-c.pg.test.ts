// Paket C (migration 0162: H7 Variante 2, Rechte, versionierte Client-RPCs, Aktivierungsinventar) against a throw-away
// PostgreSQL with the COMPLETE schema and Supabase's default privileges (full-schema.testkit.ts). BUILD_MAIL_TEST_PG=… .
// These are PostgreSQL tests: roles anon/authenticated/service_role, RLS and auth.uid() are real PostgreSQL behaviour;
// PostgREST itself (HTTP, schema cache, overload resolution, JWT → role) is NOT part of them — see docs/hochzeitspaket-betrieb.md.
//
// PAKET_C_OUT=<dir> writes the rights overviews (before = schema up to 0161, after = with 0162) as JSON and Markdown.
//
// Abnahme: C-H7 (Abschnitt 3), C-R (Rechte, Abschnitt 4), C-K (Client-Wege, Abschnitt 5), C-I (Inventar, Abschnitt 8).
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLIENT_GATE_LEAD, CLIENT_PROTOCOL } from "./client-protocol";
import { CLIENT_RPCS, CLIENT_TABLE_WRITES, NOT_IN_MIGRATIONS } from "./client-rpc-registry";
import { buildFullSchema, dropDatabase } from "./full-schema.testkit";
import { type RightsEntry, ROLES, key, rightsDiff, rightsMarkdown, rightsReport } from "./rights-audit.testkit";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"])) throw new Error("BUILD_MAIL_TEST_PG missing: Paket C DB tests must run");
const d = BASE ? describe : describe.skip;
const OUT = process.env["PAKET_C_OUT"];

const D = 864e5, H = 3.6e6;
const NOW = Date.now();
const T = Math.floor((NOW - 6 * D) / H) * H;        // europe: switch instant in the past (after activation)
const PLACEHOLDER = "2100-01-04T00:00:00Z";           // production today
const iso = (t: number) => new Date(t).toISOString();
let n = 0;
const uid = () => `00000000-0000-0000-0000-${(0xc10000 + ++n).toString(16).padStart(12, "0")}`;
const FOOD = "array['fisher','hunter','granary','dairy']";

/** Objects of the wedding / settlement / money / resource paths: listed first in the readable overview. */
const FOCUS = ["wedding_receipts", "wedding_settlement", "wedding_quarantine", "wedding_quarantine_id_seq", "village_weddings", "village_weddings_fast",
  "village_weddings_legacy", "village_wedding_list", "village_balance", "village_balance_checked", "village_balance_legacy", "village_balance_walk",
  "wedding_settle", "wedding_receipts_book", "wedding_settled_at", "wedding_money_check", "wedding_lock_key", "wedding_receipt_guard", "wedding_receipt_keep",
  "wedding_receipt_diff", "wedding_receipt_inventory", "wedding_anchor_inventory", "wedding_activation_inventory", "wedding_quarantine_set",
  "wedding_quarantine_release", "wedding_quarantine_guard", "wedding_switch_since", "client_protocol_min", "client_gate_lead", "client_gate_open",
  "civic_raise_budget", "civic_raise_budget_v2", "civic_open", "resource_overview", "resource_overview_v2", "resource_refresh", "resource_refresh_at",
  "resource_refresh_try", "resource_book", "resource_ledger", "resource_state", "civic_stages", "civic_quota", "purchases", "gifts", "twin_works",
  "building_moves", "encounters", "market_sales", "quest_claims", "purchase_guard", "gift_guard", "encounter_guard", "twin_work_guard",
  "building_move_guard", "purchase_material", "purchase_material_book", "claim_visit", "claim_referral", "claim_wonder", "princely_audience",
  "abandon_village", "purge_user_data"];

/** Expected effective ACL (PUBLIC, anon, authenticated, service_role) of the critical objects after 0162 — machine-readable. */
const T_ = (p: string, a: string, au: string, s: string) => ({ PUBLIC: p, anon: a, authenticated: au, service_role: s });
const SRV = T_("", "", "", "X"), CLIENT = T_("", "", "X", "X"), NOBODY = T_("", "", "", "");
const EXPECTED: Record<string, Record<string, string>> = {
  "table wedding_receipts": T_("", "", "r", "r"),
  "table wedding_settlement": T_("", "", "", "r"),
  "table wedding_quarantine": T_("", "", "", "r"),
  "function wedding_settle(_seed uuid, _rows jsonb, _through timestamp with time zone)": SRV,
  "function wedding_receipts_book(_seed uuid, _rows jsonb)": SRV,
  "function wedding_settled_at(_seed uuid, _at timestamp with time zone)": SRV,
  "function wedding_quarantine_set(_seed uuid, _reason text, _indices integer[], _details jsonb)": SRV,
  "function wedding_quarantine_release(_seed uuid, _note text)": SRV,
  "function wedding_receipt_inventory()": SRV,
  "function wedding_anchor_inventory()": SRV,
  "function wedding_activation_inventory()": SRV,
  "function wedding_receipt_diff(_seed uuid)": SRV,
  "function wedding_money_check(_seed uuid, _price integer)": NOBODY,
  "function wedding_lock_key(_seed uuid)": NOBODY,
  "function village_balance(_seed uuid)": SRV,
  "function village_balance_checked(_seed uuid)": SRV,
  "function village_weddings(_seed uuid, _at timestamp with time zone)": SRV,
  "function village_wedding_list(_seed uuid, _at timestamp with time zone, _food text[])": SRV,
  "function client_protocol_min()": SRV,
  "function client_gate_lead()": SRV,
  "function client_gate_open(_seed uuid)": SRV,
  "function resource_refresh_try(_seed uuid, _today date)": SRV,
  "function resource_refresh_at(_seed uuid, _today date)": SRV,
  "function resource_book(_seed uuid, _resource text, _amount integer, _kind text, _ref text, _at timestamp with time zone)": SRV,
  "function civic_raise_budget(_seed uuid, _item text, _budget integer)": CLIENT,
  "function civic_raise_budget_v2(_seed uuid, _item text, _budget integer, _client integer)": CLIENT,
  "function resource_overview(_seed uuid)": CLIENT,
  "function resource_overview_v2(_seed uuid, _client integer)": CLIENT,
  "function civic_open(_seed uuid, _item text, _budget integer)": CLIENT,
  "function claim_visit(_seed uuid, _visited uuid)": CLIENT,
  "function abandon_village(_seed uuid)": CLIENT,
  "function purge_user_data(_uid uuid)": SRV,
};
/** Every privilege change 0162 makes, with the call path that justifies it (a change without a reason fails the test). */
const CHANGES: Record<string, string> = {
  "table wedding_receipts": "H7: nur noch SELECT; geschrieben nur über wedding_receipts_book / wedding_settle (SECURITY DEFINER, Eigentümer); kein Client, kein Server schreibt direkt",
  "function village_weddings(_seed uuid, _at timestamp with time zone)": "kein Client-Aufruf; intern nur aus SECURITY-DEFINER-Funktionen des Eigentümers (encounter_guard, village_balance_walk)",
  "function claim_visit(_seed uuid, _visited uuid)": "Geld-Einnahme; nur der angemeldete Client ruft sie (Game.tsx) — anon/PUBLIC entzogen",
  "function civic_raise_budget(_seed uuid, _item text, _budget integer)": "Altsignatur: jetzt Weiterleitung mit Gate (Rechte unverändert, Definition neu)",
  "function resource_overview(_seed uuid)": "Altsignatur: jetzt Weiterleitung mit Gate (Rechte unverändert, Definition neu)",
  "function civic_raise_budget_v2(_seed uuid, _item text, _budget integer, _client integer)": "neu: Client-Weg mit Protokoll (Game.tsx)",
  "function resource_overview_v2(_seed uuid, _client integer)": "neu: Client-Weg mit Protokoll (useResources.ts)",
  "function client_protocol_min()": "neu: Protokollkonstante, nur service_role / intern",
  "function client_gate_lead()": "neu: Gate-Vorlauf, nur service_role / intern",
  "function client_gate_open(_seed uuid)": "neu: Gate-Prüfung, nur service_role / intern",
  "function wedding_receipt_keep()": "neu: H7-Trigger (EXECUTE wird beim Feuern nicht geprüft) — niemandem gewährt",
  "function wedding_activation_inventory()": "neu: Vorabprüfung, nur service_role",
};

d("Paket C – Rechte, Integrität, Client-Wege (vollständiges Schema, Supabase-Standardrechte, echtes PostgreSQL)", () => {
  const DB = `paketc_${process.pid}_${Date.now()}`;
  let sql: postgres.Sql;
  let before: RightsEntry[] = [], after: RightsEntry[] = [];
  const err = (p: PromiseLike<unknown>) => Promise.resolve(p).then(() => "ok", (e: Error) => e.message);
  const setSwitch = (europe: string, lab: string) => sql.unsafe(`create or replace function public.wedding_switch_since(_realm text) returns timestamptz
      language sql immutable set search_path to 'public' as $$ select case when _realm = 'lab' then timestamptz '${lab}' else timestamptz '${europe}' end $$`);

  type V = { id: string; owner: string; created: number; realm: string };
  const village = async (o: { realm?: string; ageDays?: number } = {}): Promise<V> => {
    const id = uid(), owner = uid(), realm = o.realm ?? "europe", created = NOW - (o.ageDays ?? 10) * D;
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into auth.users (id) values (${owner}) on conflict do nothing`;
      await tx`insert into public.seeds (id, user_id, owner, name, x, y, realm, created_at)
        values (${id}, ${owner}, 'Test', ${"Dorf C" + n}, ${300 + n}, ${300 + n}, ${realm}, ${iso(created)})`;
    });
    return { id, owner, created, realm };
  };
  const asPlayer = (v: V, f: (tx: postgres.TransactionSql) => Promise<unknown>) => err(sql.begin(async (tx) => {
    await tx`select set_config('test.uid', ${v.owner}, true), set_config('test.role', 'authenticated', true)`;
    await tx.unsafe("set local role authenticated");
    await f(tx);
  }));
  const asRole = (role: "anon" | "service_role", f: (tx: postgres.TransactionSql) => Promise<unknown>) => err(sql.begin(async (tx) => {
    await tx`select set_config('test.role', ${role}, true)`;
    await tx.unsafe(`set local role ${role}`);
    await f(tx);
  }));
  type W = { t: number; dowry: number };
  const legacyUpTo = async (v: V, at: number): Promise<W[]> =>
    (await sql.unsafe(`select t, dowry from public.village_wedding_list($1, $2, ${FOOD}) order by t`, [v.id, iso(at)]))
      .map((r) => ({ t: (r["t"] as Date).getTime(), dowry: r["dowry"] as number }));
  const sw = async (v: V) => ((await sql`select public.wedding_switch_since(${v.realm}) s`)[0]!["s"] as Date).getTime();
  const chain = async (v: V, ws: W[], next: number | null, from = 0) => {
    const s = await sw(v);
    return ws.map((w, i) => ({ wedding_index: from + i, occurred_at: iso(w.t), dowry: w.dowry, is_grand: true, is_town: false,
      version: w.t >= s ? 2 : 1, next_at: next === null && i + 1 === ws.length ? null : iso(i + 1 < ws.length ? ws[i + 1]!.t : next!) }));
  };
  const settle = (v: V, rows: unknown[], through: number) =>
    sql`select public.wedding_settle(${v.id}, ${sql.json(rows as never)}, ${iso(through)}) r`.then((x) => x[0]!["r"] as { inserted: number; marked: boolean });
  const state = async (v: V) => {
    const h = createHash("sha256");
    h.update((await sql`select coalesce(string_agg(x::text, '|' order by x.wedding_index), '') s from public.wedding_receipts x where seed_id = ${v.id}`)[0]!["s"] as string);
    h.update((await sql`select coalesce(string_agg(x::text, '|'), '') s from public.wedding_settlement x where seed_id = ${v.id}`)[0]!["s"] as string);
    return h.digest("hex");
  };
  const count = async (v: V) => ({
    receipts: (await sql`select count(*)::int n from public.wedding_receipts where seed_id = ${v.id}`)[0]!["n"] as number,
    proof: (await sql`select count(*)::int n from public.wedding_settlement where seed_id = ${v.id}`)[0]!["n"] as number,
  });
  /** A village with every wedding up to the last settlement booked (switch T in the past: legacy before, v2 after) and its proof. */
  const settledVillage = async () => {
    const v = await village({ ageDays: 60 });
    const ws = await legacyUpTo(v, NOW - 2 * D);          // the calendar up to two days ago (instants and dowries as booked)
    const next = NOW + 2 * D;
    await settle(v, await chain(v, ws, next), NOW);
    return { v, ws, next };
  };

  beforeAll(async () => {
    const vor = `${DB}_vor`;
    const urlVor = await buildFullSchema(BASE!, vor, "0161_hochzeit_vollstaendigkeit");
    const s0 = postgres(urlVor, { max: 1, onnotice: () => {} });
    before = await rightsReport(s0);
    await s0.end(); await dropDatabase(BASE!, vor);
    const url = await buildFullSchema(BASE!, DB);
    sql = postgres(url, { max: 8, onnotice: () => {} });
    after = await rightsReport(sql);
    if (OUT) {
      mkdirSync(OUT, { recursive: true });
      writeFileSync(`${OUT}/rechte_vorher.json`, JSON.stringify(before, null, 1));
      writeFileSync(`${OUT}/rechte_nachher.json`, JSON.stringify(after, null, 1));
      writeFileSync(`${OUT}/rechte_vorher.md`, rightsMarkdown("Rechteübersicht vorher (Migrationen bis 0161, Supabase-Standardrechte)", before, FOCUS));
      writeFileSync(`${OUT}/rechte_nachher.md`, rightsMarkdown("Rechteübersicht nachher (mit 0162)", after, FOCUS));
      const diff = rightsDiff(before, after).map((c) => ({ ...c, begruendung: CHANGES[c.object] ?? null }));
      writeFileSync(`${OUT}/rechte_aenderungen.json`, JSON.stringify(diff, null, 1));
    }
    // the inventory tests switch europe to the production placeholder themselves; until then: europe after the switch,
    // lab far before it (old clients still allowed)
    await setSwitch(iso(T), iso(NOW + 30 * D));
    // two tables the live database has (generated types, purge_user_data) but no migration creates — stand-ins only
    await sql.unsafe(`create table if not exists public.build_mail (user_id uuid primary key, enabled boolean, lang text);
      create table if not exists public.princely_errands (id uuid primary key default gen_random_uuid(), seed_id uuid, task_id uuid, errand text)`);
  }, 300000);
  afterAll(async () => { await sql?.end(); if (BASE) await dropDatabase(BASE, DB); });

  // ================= Abschnitt 3: H7 Variante 2 =================
  describe("C-H7 einzelne Belege sind unveränderlich, auch für service_role; CASCADE bleibt", () => {
    it("C-H7 DELETE, TRUNCATE, UPDATE und direkter INSERT scheitern als service_role (Recht) und als Eigentümer (Trigger); Kette, Anker und Nachweis bleiben gleich", async () => {
      const { v } = await settledVillage();
      const other = await settledVillage();
      const c0 = await count(v);
      expect(c0.receipts).toBeGreaterThan(1);
      expect(c0.proof).toBe(1);
      const h0 = await state(v), ho = await state(other.v);
      const top = (await sql`select * from public.wedding_receipts where seed_id = ${v.id} order by wedding_index desc limit 1`)[0]!;
      const row = { ...top, wedding_index: (top["wedding_index"] as number) + 1, occurred_at: new Date(NOW - D), next_at: null };
      // service_role: the privilege is gone (as over PostgREST with the service key)
      const srv = {
        delete: await asRole("service_role", (tx) => tx`delete from public.wedding_receipts where seed_id = ${v.id} and wedding_index = 0`),
        deleteAll: await asRole("service_role", (tx) => tx`delete from public.wedding_receipts where seed_id = ${v.id}`),
        truncate: await asRole("service_role", (tx) => tx.unsafe("truncate public.wedding_receipts")),
        update: await asRole("service_role", (tx) => tx`update public.wedding_receipts set dowry = dowry + 1 where seed_id = ${v.id}`),
        insert: await asRole("service_role", (tx) => tx`insert into public.wedding_receipts ${tx(row as never)}`),
      };
      expect(srv).toEqual({ delete: "permission denied for table wedding_receipts", deleteAll: "permission denied for table wedding_receipts",
        truncate: "permission denied for table wedding_receipts", update: "permission denied for table wedding_receipts", insert: "permission denied for table wedding_receipts" });
      // the table owner (migrations, SQL editor) has every privilege: the triggers still refuse
      const own = {
        delete: await err(sql`delete from public.wedding_receipts where seed_id = ${v.id} and wedding_index = 0`),
        deleteAll: await err(sql`delete from public.wedding_receipts where seed_id = ${v.id}`),
        truncate: await err(sql.unsafe("truncate public.wedding_receipts")),
        truncateCascade: await err(sql.unsafe("truncate public.wedding_receipts cascade")),
        update: await err(sql`update public.wedding_receipts set dowry = dowry + 1 where seed_id = ${v.id}`),
      };
      expect(own).toEqual({ delete: "wedding receipts are kept", deleteAll: "wedding receipts are kept", truncate: "wedding receipts are kept",
        truncateCascade: "wedding receipts are kept", update: "wedding receipts are immutable" });
      // the client (authenticated, owner of the village): no write privilege at all
      const cli = {
        delete: await asPlayer(v, (tx) => tx`delete from public.wedding_receipts where seed_id = ${v.id}`),
        insert: await asPlayer(v, (tx) => tx`insert into public.wedding_receipts ${tx(row as never)}`),
        read: await asPlayer(v, async (tx) => { const r = await tx`select count(*)::int n from public.wedding_receipts where seed_id = ${v.id}`; if (r[0]!["n"] !== c0.receipts) throw new Error("rls read"); }),
      };
      expect(cli).toEqual({ delete: "permission denied for table wedding_receipts", insert: "permission denied for table wedding_receipts", read: "ok" });
      expect(await state(v)).toBe(h0);
      expect(await state(other.v)).toBe(ho);
      expect(await count(v)).toEqual(c0);
    });
    it("C-H7 die reguläre Buchung (wedding_settle, wedding_receipts_book) als service_role funktioniert weiter — auch nach abgewiesenen Versuchen", async () => {
      const v = await village({ ageDays: 60 });
      const ws = await legacyUpTo(v, NOW - 2 * D);
      expect(ws.length).toBeGreaterThan(2);
      const head = ws.slice(0, -1), last = ws[ws.length - 1]!;
      // first part through wedding_receipts_book (A2: the server's book call), as service_role
      let booked: unknown;
      expect(await asRole("service_role", async (tx) => {
        booked = (await tx`select public.wedding_receipts_book(${v.id}, ${tx.json((await chain(v, head, last.t)) as never)}) r`)[0]!["r"];
      })).toBe("ok");
      expect(booked).toMatchObject({ inserted: head.length });
      expect(await err(sql`delete from public.wedding_receipts where seed_id = ${v.id}`)).toBe("wedding receipts are kept");
      // then the settlement with its proof (O2), as service_role
      let r: unknown;
      expect(await asRole("service_role", async (tx) => {
        r = (await tx`select public.wedding_settle(${v.id}, ${tx.json((await chain(v, [last], NOW + 2 * D, head.length)) as never)}, ${iso(NOW)}) r`)[0]!["r"];
      })).toBe("ok");
      expect(r).toMatchObject({ inserted: 1, marked: true });
      expect((await count(v))).toEqual({ receipts: ws.length, proof: 1 });
      expect((await sql`select public.wedding_settled_at(${v.id}, now()) s`)[0]!["s"]).toBe(true);
      // repeating the same booking is idempotent (no update path needed)
      expect(await settle(v, await chain(v, [last], NOW + 2 * D, head.length), NOW)).toMatchObject({ inserted: 0 });
    });
    it("C-H7 CASCADE: Dorfaufgabe (abandon_village, Client) und Kontolöschung (purge_user_data, Server) nehmen Belege und Nachweis mit — nur die des Dorfes", async () => {
      const a = await settledVillage(), b = await settledVillage(), keep = await settledVillage();
      const hk = await state(keep.v);
      expect((await count(a.v)).receipts).toBeGreaterThan(0);
      // a foreign player cannot abandon the village
      expect(await asPlayer(keep.v, (tx) => tx`select public.abandon_village(${a.v.id})`)).toBe("not your village");
      expect(await asPlayer(a.v, (tx) => tx`select public.abandon_village(${a.v.id})`)).toBe("ok");
      expect(await count(a.v)).toEqual({ receipts: 0, proof: 0 });
      // purge as the server (idle sweep / account deletion)
      expect(await asRole("service_role", (tx) => tx`select public.purge_user_data(${b.v.owner})`)).toBe("ok");
      expect(await count(b.v)).toEqual({ receipts: 0, proof: 0 });
      expect(await asPlayer(keep.v, (tx) => tx`select public.purge_user_data(${keep.v.owner})`)).toMatch(/permission denied for function purge_user_data/);
      expect(await state(keep.v)).toBe(hk);
      // a quarantine record goes with the village too (FK), so nothing dangles
      const q = await settledVillage();
      await sql`select public.wedding_quarantine_set(${q.v.id}, 'legacy_divergent', '{1}', '{}'::jsonb)`;
      expect(await asPlayer(q.v, (tx) => tx`select public.abandon_village(${q.v.id})`)).toBe("ok");
      expect((await sql`select count(*)::int n from public.wedding_quarantine where seed_id = ${q.v.id}`)[0]!["n"]).toBe(0);
    });
  });

  // ================= Abschnitt 4: Rechteaudit =================
  describe("C-R Rechte: vorher/nachher, jede Änderung begründet", () => {
    it("C-R die kritischen Objekte haben genau die erwarteten Rechte (PUBLIC, anon, authenticated, service_role)", () => {
      const byKey = new Map(after.map((e) => [key(e), e]));
      const wrong: string[] = [];
      for (const [k, exp] of Object.entries(EXPECTED)) {
        const e = byKey.get(k);
        if (!e) { wrong.push(`${k}: fehlt`); continue; }
        const got = e.kind === "table" ? e.effective! : e.privileges;
        for (const r of ROLES) if ((got[r] ?? "") !== exp[r]) wrong.push(`${k} ${r}: ${got[r] || "–"} statt ${exp[r] || "–"}`);
      }
      expect(wrong).toEqual([]);
    });
    it("C-R jede Rechteänderung von 0162 ist im Änderungsverzeichnis mit Aufrufweg begründet, und keine andere Änderung", () => {
      const diff = rightsDiff(before, after).map((c) => c.object);
      expect(diff.filter((k) => !(k in CHANGES)), "Änderung ohne Begründung").toEqual([]);
      // every listed change is real (definition-only changes of the old signatures are not ACL changes and are not in the diff)
      expect(Object.keys(CHANGES).filter((k) => !diff.includes(k) && !/civic_raise_budget\(|resource_overview\(/.test(k)), "begründet, aber nicht geändert").toEqual([]);
      // the H7 table: write privileges removed for every API role
      const wr = before.find((e) => key(e) === "table wedding_receipts")!, wa = after.find((e) => key(e) === "table wedding_receipts")!;
      expect(wr.privileges.service_role).toBe("rawdDxt");
      expect([wa.privileges.anon, wa.privileges.authenticated, wa.privileges.service_role]).toEqual(["", "r", "r"]);
    });
    it("C-R allgemeine Regeln im ganzen Schema public: keine Überladung, jede DEFINER-Funktion mit search_path, anon ohne schreibende Funktion und ohne wirksame Tabellen-Schreibrechte", () => {
      const fns = after.filter((e) => e.kind === "function");
      const names = new Map<string, number>(); for (const f of fns) names.set(f.name, (names.get(f.name) ?? 0) + 1);
      expect([...names].filter(([, c]) => c > 1), "überladene Funktionen (PostgREST müsste wählen)").toEqual([]);
      expect(fns.filter((f) => f.definer && !f.searchPath).map((f) => f.name), "SECURITY DEFINER ohne search_path").toEqual([]);
      expect(after.filter((e) => e.kind === "table" && /[awd]/.test(e.effective!.anon + e.effective!.PUBLIC)).map((e) => e.name), "anon kann schreiben").toEqual([]);
      expect(after.filter((e) => e.kind === "table" && !e.rls).map((e) => e.name), "Tabelle ohne RLS").toEqual([]);
    });
    it("C-R anon darf keine VOLATILE-Funktion ausführen (Trigger-Funktionen ausgenommen); die anon-ausführbaren DEFINER-Funktionen sind nur lesend", async () => {
      const rows = await sql`select p.proname, p.provolatile, p.prosecdef from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
        and p.prorettype <> 'trigger'::regtype and has_function_privilege('anon', p.oid, 'EXECUTE') order by 1`;
      expect(rows.filter((r) => r["provolatile"] === "v").map((r) => r["proname"])).toEqual([]);
      // unverändert gelassen, weil STABLE und nur aus öffentlich lesbaren Daten abgeleitet (Kalender, Rolle für RLS)
      expect(rows.filter((r) => r["prosecdef"]).map((r) => r["proname"]).sort()).toEqual(["has_role", "road_done", "tax_receipt_start", "village_raids"]);
    });
    it("C-R die Rechteübersichten sind vollständig (jede Tabelle, Sicht, Sequenz und jede Funktionssignatur) und maschinenlesbar", async () => {
      const [c] = await sql`select (select count(*)::int from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','v','m','S','p')) rel,
        (select count(*)::int from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind = 'f') fn`;
      // + the two stand-in tables created after the report
      expect(after.length).toBe(c!["rel"] + c!["fn"] - 2);
      expect(after.filter((e) => e.kind === "function").length).toBe(c!["fn"]);
      for (const e of after) for (const r of ROLES) expect(typeof e.privileges[r]).toBe("string");
      if (OUT) expect(JSON.parse(readFileSync(`${OUT}/rechte_nachher.json`, "utf8")).length).toBe(after.length);
    });
  });

  // ================= Abschnitt 5: Client-Wege und alte Protokolle =================
  describe("C-K direkte Client-Wege, alte Clients und civic_raise_budget", () => {
    it("C-K jede direkt erreichbare mutierende RPC und jede wirksam beschreibbare Tabelle ist in der Registry erfasst — und umgekehrt", () => {
      const reach = after.filter((e) => e.kind === "function" && e.returns !== "trigger" && (e.privileges.authenticated === "X" || e.privileges.anon === "X"));
      const vol = new Set<string>();
      return sql`select proname from pg_proc where pronamespace = 'public'::regnamespace and provolatile = 'v'`.then((r) => {
        for (const x of r) vol.add(x["proname"] as string);
        const mutating = reach.filter((e) => vol.has(e.name)).map((e) => e.name).sort();
        expect(mutating.filter((m) => !(m in CLIENT_RPCS)), "mutierende Client-RPC ohne Klassifizierung").toEqual([]);
        const inDb = new Set(after.filter((e) => e.kind === "function").map((e) => e.name));
        expect(Object.keys(CLIENT_RPCS).filter((k) => !inDb.has(k)).sort()).toEqual(NOT_IN_MIGRATIONS.filter((x) => x in CLIENT_RPCS));
        for (const [k, p] of Object.entries(CLIENT_RPCS)) if (inDb.has(k) && p.geld !== "lesend") expect(mutating, k).toContain(k);
        const writable = after.filter((e) => e.kind === "table" && /[awd]/.test(e.effective!.authenticated)).map((e) => e.name).sort();
        expect(writable.filter((t) => !(t in CLIENT_TABLE_WRITES)), "beschreibbare Tabelle ohne Klassifizierung").toEqual([]);
        expect(Object.keys(CLIENT_TABLE_WRITES).filter((t) => !writable.includes(t)).sort()).toEqual(NOT_IN_MIGRATIONS.filter((x) => x in CLIENT_TABLE_WRITES));
      });
    });
    it("C-K die DB-Konstanten sind die des TypeScript-Gates (Protokoll 2, 7 Tage)", async () => {
      const [c] = await sql`select public.client_protocol_min() p, extract(epoch from public.client_gate_lead())::bigint * 1000 l`;
      expect(c!["p"]).toBe(CLIENT_PROTOCOL);
      expect(Number(c!["l"])).toBe(CLIENT_GATE_LEAD);
    });
    /** a lab village (switch = `labSwitch`) with an open Gemeindebau stage — the old and new budget paths reach the stage checks */
    const civicCase = async () => {
      const v = await village({ realm: "lab", ageDays: 40 });
      return v;
    };
    const tables = ["civic_stages", "resource_ledger", "resource_state", "purchases"];
    const snap = async () => { const h = createHash("sha256"); for (const t of tables) h.update((await sql.unsafe(`select coalesce(string_agg(x::text, '|' order by x::text), '') s from public.${t} x`))[0]!["s"] as string); return h.digest("hex"); };
    const calls = (v: V) => ({
      oldRaise: () => asPlayer(v, (tx) => tx`select public.civic_raise_budget(${v.id}, 'spital1', 900)`),
      oldOverview: () => asPlayer(v, (tx) => tx`select public.resource_overview(${v.id})`),
      v2Raise: (c: number | null) => asPlayer(v, (tx) => tx`select public.civic_raise_budget_v2(${v.id}, 'spital1', 900, ${c})`),
      v2Overview: (c: number | null) => asPlayer(v, (tx) => tx`select public.resource_overview_v2(${v.id}, ${c})`),
    });
    it("C-K Umschaltzeitpunkt in 30 Tagen (Gate zu): alte Signaturen werden an v2 weitergeleitet und laufen dieselben Prüfungen; v2 mit Protokoll 2 läuft", async () => {
      await setSwitch(iso(T), iso(NOW + 30 * D));
      const c = calls(await civicCase());
      expect(await c.oldRaise()).toBe("stage not open");      // delegated: v2's own checks answer, not the gate
      expect(await c.oldOverview()).toBe("ok");
      expect(await c.v2Raise(2)).toBe("stage not open");
      expect(await c.v2Overview(2)).toBe("ok");
    });
    it("C-K Umschaltzeitpunkt in 3 Tagen (innerhalb T−7d): alte Signaturen verweigern vor jedem Zugriff ('client outdated'), nichts wird gebucht; v2 läuft", async () => {
      await setSwitch(iso(T), iso(NOW + 3 * D));
      const v = await civicCase(), c = calls(v);
      const h0 = await snap();
      expect(await c.oldRaise()).toBe("client outdated");
      expect(await c.oldOverview()).toBe("client outdated");
      expect(await snap()).toBe(h0);
      expect(await c.v2Raise(2)).toBe("stage not open");
      expect(await c.v2Overview(2)).toBe("ok");
    });
    it("C-K nach dem Umschaltzeitpunkt (europe, Schalter in der Vergangenheit): alt verweigert, v2 läuft", async () => {
      const v = await village({ ageDays: 40 }), c = calls(v);
      expect(await c.oldRaise()).toBe("client outdated");
      expect(await c.oldOverview()).toBe("client outdated");
      expect(await c.v2Overview(2)).toBe("ok");
    });
    it("C-K v2 ohne oder mit altem Protokoll wird immer abgewiesen (auch weit vor dem Umschalten); anon kommt gar nicht hinein; fremde Dörfer bleiben zu", async () => {
      await setSwitch(iso(T), iso(NOW + 30 * D));
      const v = await civicCase(), c = calls(v);
      for (const p of [null, 0, 1]) {
        expect(await c.v2Raise(p), String(p)).toBe("client outdated");
        expect(await c.v2Overview(p), String(p)).toBe("client outdated");
      }
      expect(await c.v2Raise(CLIENT_PROTOCOL + 1)).toBe("stage not open");    // newer clients pass
      for (const f of ["civic_raise_budget_v2(null::uuid, 'x', 1, 2)", "resource_overview_v2(null::uuid, 2)", "civic_raise_budget(null::uuid, 'x', 1)", "resource_overview(null::uuid)"])
        expect(await asRole("anon", (tx) => tx.unsafe(`select public.${f}`)), f).toMatch(/^permission denied for function /);
      const stranger = await civicCase();
      expect(await asPlayer(stranger, (tx) => tx`select public.resource_overview_v2(${v.id}, 2)`)).toBe("not owner");
      expect(await asPlayer(stranger, (tx) => tx`select public.civic_raise_budget_v2(${v.id}, 'spital1', 900, 2)`)).toBe("not owner");
    });
    it("C-K genau eine Signatur je Client-RPC-Name (PostgREST muss nie zwischen Überladungen wählen)", async () => {
      const r = await sql`select proname, count(*)::int n from pg_proc where pronamespace = 'public'::regnamespace and proname = any(${Object.keys(CLIENT_RPCS)}) group by 1`;
      for (const x of r) expect(x["n"], x["proname"] as string).toBe(1);
    });
    it("C-K Pending über v2 bleibt ohne Teilbuchung (Verweis: paket-b B3 lab, civic_raise_budget_v2/resource_overview_v2 mit offener Stufe)", () => {
      // B3 in paket-b.pg.test.ts runs exactly this on the full schema: civic_raise_budget_v2 → 'wedding settlement pending',
      // resource_overview_v2 → { pending: true }, every table unchanged. Not duplicated here.
      expect(readFileSync(new globalThis.URL("./paket-b.pg.test.ts", import.meta.url), "utf8")).toContain("public.civic_raise_budget_v2(${s.v.id}, 'spital1', 1500, 2)`)).toBe(PENDING)");
    });
  });

  // ================= Abschnitt 8: Inventar / Sweep-Vorabprüfung (lokal, Testdaten) =================
  describe("C-I Vorabprüfung vor der Aktivierung (Produktionszustand: Schalter 2100, nur lesend)", () => {
    it("C-I jede Klasse wird erkannt; nur bereit/jung/nachholen blockieren nicht; die Checklisten-SQL läuft nur lesend und meldet die Blocker", async () => {
      await setSwitch(PLACEHOLDER, PLACEHOLDER);
      const mk = async (ageDays = 30) => village({ ageDays });
      const young = await mk(1);
      const empty = await mk();
      const ready = await mk(), catchUp = await mk(), old = await mk(), contra = await mk(), quar = await mk();
      const all = async (v: V) => legacyUpTo(v, NOW);
      const future = async (v: V) => (await legacyUpTo(v, NOW + 40 * D)).find((w) => w.t > NOW)!.t;
      // vollständig: alle fälligen Hochzeiten mit Anker gebucht
      await settle(ready, await chain(ready, await all(ready), await future(ready)), NOW);
      // nachholen: die letzte fällige Hochzeit fehlt, der Anker zeigt auf sie
      { const ws = await all(catchUp); await settle(catchUp, await chain(catchUp, ws.slice(0, -1), ws[ws.length - 1]!.t), ws[ws.length - 1]!.t - H); }
      // rekonstruierbar: alte Belege ohne Anker (wie vom Stand vor A2 geschrieben) — als Eigentümer eingefügt
      for (const r of await chain(old, (await all(old)).slice(0, 3), null)) await sql`insert into public.wedding_receipts ${sql({ seed_id: old.id, ...r, next_at: null } as never)}`;
      // widersprüchlich: ein Beleg, der vom Kalender abweicht
      { const ws = await all(contra); const rows = await chain(contra, ws.slice(0, 2), null); rows[1]!.dowry += 7;
        for (const r of rows) await sql`insert into public.wedding_receipts ${sql({ seed_id: contra.id, ...r, next_at: null } as never)}`; }
      // Quarantäne
      await settle(quar, await chain(quar, await all(quar), await future(quar)), NOW);
      await sql`select public.wedding_quarantine_set(${quar.id}, 'legacy_divergent', '{1}', '{}'::jsonb)`;

      const ids = [young, empty, ready, catchUp, old, contra, quar].map((v) => v.id);
      const inv = new Map((await asRows(`select seed_id, klasse, status, grund, abweichungen from public.wedding_activation_inventory() where seed_id = any($1::uuid[])`, [ids]))
        .map((r) => [r["seed_id"] as string, r]));
      const st = (v: V) => [inv.get(v.id)!["klasse"], inv.get(v.id)!["status"]];
      expect({ young: st(young), empty: st(empty), ready: st(ready), catchUp: st(catchUp), old: st(old), contra: st(contra), quar: st(quar) }).toEqual({
        young: ["ohne_belege", "jung"], empty: ["ohne_belege", "blockiert"], ready: ["verankert", "bereit"], catchUp: ["verankert", "nachholen"],
        old: ["alt_rekonstruierbar", "blockiert"], contra: ["widerspruechlich", "blockiert"], quar: ["quarantaene", "blockiert"] });
      for (const v of [empty, old, contra, quar]) expect(inv.get(v.id)!["grund"]).toBeTruthy();
      expect(inv.get(catchUp.id)!["grund"]).toMatch(/^1 fällige Hochzeit/);

      // the checklist file: every statement runs read-only as service_role and the blocking query lists exactly the blockers
      const file = readFileSync(new globalThis.URL("../../docs/sql/hochzeit_vorabpruefung.sql", import.meta.url), "utf8");
      const stmts = file.split(/;\s*\n/).map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
      expect(stmts.length).toBeGreaterThanOrEqual(5);
      const h0 = createHash("sha256").update(JSON.stringify(await asRows("select seed_id::text, wedding_index, occurred_at::text, next_at::text from public.wedding_receipts order by 1, 2", []))).digest("hex");
      const results: Record<string, unknown>[][] = [];
      expect(await asRole("service_role", async (tx) => {
        await tx.unsafe("set transaction read only");
        for (const s of stmts) results.push(await tx.unsafe(s) as unknown as Record<string, unknown>[]);
      })).toBe("ok");
      const blockers = results.find((r) => r.length > 0 && "status" in r[0]! && r.every((x) => x["status"] === "blockiert"));
      expect(blockers, "Abfrage der Blocker").toBeTruthy();
      expect(blockers!.filter((r) => ids.includes(r["seed_id"] as string)).map((r) => r["seed_id"]).sort()).toEqual([empty.id, old.id, contra.id, quar.id].sort());
      const h1 = createHash("sha256").update(JSON.stringify(await asRows("select seed_id::text, wedding_index, occurred_at::text, next_at::text from public.wedding_receipts order by 1, 2", []))).digest("hex");
      expect(h1).toBe(h0);
      // the client cannot run it
      expect(await asPlayer(ready, (tx) => tx`select * from public.wedding_activation_inventory()`)).toMatch(/permission denied for function wedding_activation_inventory/);
      if (OUT) writeFileSync(`${OUT}/vorabpruefung_testlauf.json`, JSON.stringify(results.map((r) => r.filter((x) => !("seed_id" in x) || ids.includes(x["seed_id"] as string))), null, 1));
      await setSwitch(iso(T), iso(NOW + 30 * D));
    });
  });
  const asRows = (q: string, p: unknown[]) => sql.unsafe(q, p as never[]) as unknown as Promise<Record<string, unknown>[]>;
});
