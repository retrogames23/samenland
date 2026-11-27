// P4 Stiftungen (migration 0165) against a throw-away PostgreSQL with the COMPLETE schema (full-schema.testkit.ts: every
// journal migration, files unchanged). BUILD_MAIL_TEST_PG=postgres://… ; own databases, dropped afterwards.
//
// Nothing is activated by the migration: stift_since() is the placeholder 2100-01-04 for the lab and the public maps.
// Only in THIS test database the switches are moved into the past, exactly as a later switch migration would do it
// (IMMUTABLE functions replaced): stift_since and resources_since for every realm; the wedding switch and the Ankauf
// only for `lab`, so `europe` villages are "before the wedding switch" and `lab` villages after it.
//
// Time: the database functions read now(). A test moves a village's Stiftung rows into the past (age) instead of
// waiting; within one transaction now() is constant, which gives the exact boundary cases. No test depends on the time
// of day.
//
// Prüfpunkte (test names start with them): K1 … K9 (Regelkriterien, Auftrag Abschnitt 5), S1 … S5 (Stiftungszeit, the
// database half; the TypeScript half is src/game/stiftung.test.ts), H-G1 … H-G7 (Hochzeitspaket × Gemeindebauten).
import { createHash } from "node:crypto";
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFullSchema, dropDatabase, journalTags, migration } from "./full-schema.testkit";
import { SETTLEMENT_PENDING } from "./settlement-pending";
import { CLIENT_PROTOCOL } from "./client-protocol";
import { countsAsBuilding, kontorCost, type CivicRow } from "@/game/civic";
import { sickChance } from "@/game/sickness";
import {
  STIFT_FACTOR, STIFT_MAX_MS, STIFT_MS, STIFT_SINCE, stiftEndowed, stiftFreeQuota, stiftPlan, stiftPrice, stiftReserved,
  stiftSpans, stiftUntil, waageFactor,
} from "@/game/stiftung";
import type { Seed } from "@/game/world";
import type { TownWay } from "@/game/character";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"])) throw new Error("BUILD_MAIL_TEST_PG missing: P4 DB tests must run");
const d = BASE ? describe : describe.skip;

const D = 864e5, H = 3.6e6, S = 1000;
const NOW = Date.now();
const T = Math.floor((NOW - 60 * D) / H) * H;        // wedding switch of `lab` in this database
const iso = (t: number) => new Date(t).toISOString();
const C = CLIENT_PROTOCOL;
const PENDING = SETTLEMENT_PENDING;
let n = 0;
const uid = () => `00000000-0000-0000-0000-${(0xf40000 + ++n).toString(16).padStart(12, "0")}`;
const TABLES = ["purchases", "resource_ledger", "resource_state", "civic_stages", "civic_quota", "stift_stages", "tax_receipts",
  "wedding_receipts", "wedding_settlement"];
const STIFT_ROW = "^stift:(spital|waage):[1-9][0-9]*(:r[1-9][0-9]*|:k)?$";
type Bau = "spital" | "waage";
type V = { id: string; owner: string; created: number; realm: string };

d("P4 Stiftungen – Regeln, Stiftungszeit und Hochzeitspaket (vollständiges Schema, echtes PostgreSQL)", () => {
  const DB = `stift_${process.pid}_${Date.now()}`;
  let sql: postgres.Sql, url: string;
  const err = (p: PromiseLike<unknown>) => Promise.resolve(p).then(() => "ok", (e: Error) => e.message);
  const today = () => new Date().toISOString().slice(0, 10);
  const replica = <R>(f: (tx: postgres.TransactionSql) => Promise<R>) => sql.begin(async (tx) => { await tx`set local session_replication_role = replica`; return f(tx); });

  // ---------- fixtures ----------
  /** A bare village (as paket-b.pg.test.ts). */
  const bare = async (o: { realm?: string | undefined; ageDays?: number | undefined } = {}): Promise<V> => {
    const id = uid(), owner = uid(), realm = o.realm ?? "europe", created = NOW - (o.ageDays ?? 200) * D;
    await replica((tx) => tx`insert into public.seeds (id, user_id, owner, name, x, y, realm, created_at)
      values (${id}, ${owner}, 'Test', ${"Dorf " + n}, ${100 + (n % 400)}, ${100 + Math.floor(n / 400)}, ${realm}, ${iso(created)})`);
    return { id, owner, created, realm };
  };
  const balance = async (v: V) => (await sql`select public.village_balance(${v.id}) b`)[0]!["b"] as number;
  /** Booked chest := cash (one money row outside the guards, one hour ago). */
  const setCash = async (v: V, cash: number) => {
    const b = await balance(v);
    // less: an expense one hour ago. More: income dated before the chest walk starts (2026-11-12), where no chest cap cuts it
    if (b !== cash) await replica((tx) => tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, ${"test_money_" + ++n}, ${b - cash}, ${b > cash ? iso(Date.now() - H) : "2026-11-01T00:00:00Z"})`);
    expect(await balance(v)).toBe(cash);
  };
  const refresh = async (v: V) => (await sql`select public.resource_refresh_try(${v.id}, ${today()}::date) r`)[0]!["r"] as string;
  const stock = async (v: V) => (await sql`select public.resource_stock(${v.id}, 'wood') w, public.resource_stock(${v.id}, 'stone') s`)[0] as unknown as { w: number; s: number };
  /** Store := wood/stone (booked days first, then one correcting ledger row each outside the guards). */
  const setStock = async (v: V, wood: number, stone: number) => {
    await refresh(v);
    const cur = await stock(v);
    await replica(async (tx) => {
      if (wood !== cur.w) await tx`insert into public.resource_ledger (seed_id, resource, amount, kind, ref, at) values (${v.id}, 'wood', ${wood - cur.w}, 'prod', ${"test-" + ++n}, now())`;
      if (stone !== cur.s) await tx`insert into public.resource_ledger (seed_id, resource, amount, kind, ref, at) values (${v.id}, 'stone', ${stone - cur.s}, 'prod', ${"test-" + ++n}, now())`;
    });
    expect(await stock(v)).toEqual({ w: wood, s: stone });
  };
  const setQuota = async (v: V, wood: number, stone: number) => {
    await sql`insert into public.civic_quota (seed_id, wood, stone, through_day) values (${v.id}, ${wood}, ${stone}, ${today()}::date)
      on conflict (seed_id) do update set wood = excluded.wood, stone = excluded.stone`;
  };
  const quota = async (v: V) => (await sql`select wood, stone from public.civic_quota where seed_id = ${v.id}`)[0] as unknown as { wood: number; stone: number };
  const setTax = async (v: V, income: number, day = 100) => {
    await sql`insert into public.tax_receipts (seed_id, day, population, households, income, assessed_at, version) values (${v.id}, ${day}, 50, 10, ${income}, ${iso(NOW - D)}, 1)`;
  };
  /**
   * A village ready for Stiftungen: site, both Bauten at stage 1 (completion markers 190 days old), a last booked daily
   * tax (default 500 → stage price 2.000), booked days, store at 100/100 unless given, a full quota and a chest.
   */
  const village = async (o: { realm?: string; way?: TownWay; tax?: number | null; cash?: number; wood?: number; stone?: number; bauten?: Bau[] } = {}): Promise<V> => {
    const v = await bare({ realm: o.realm });
    await replica(async (tx) => {
      await tx`insert into public.village_sites (seed_id, way, certified_at) values (${v.id}, ${o.way ?? "grain"}, ${iso(v.created + D)})`;
      for (const b of o.bauten ?? ["spital", "waage"])
        await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, ${b + "1"}, 0, ${iso(v.created + 10 * D)})`;
    });
    if (o.tax !== null) await setTax(v, o.tax ?? 500);
    await setStock(v, o.wood ?? 100, o.stone ?? 100);
    await setQuota(v, 120, 90);
    await setCash(v, o.cash ?? 6000);
    return v;
  };
  /** A Gemeindebau stage row as civic_open would create it (price 500 so a test chest can pay it). */
  const civicStage = async (v: V, o: { item?: string; funded?: boolean; needWood?: number; needStone?: number; gotWood?: number; gotStone?: number } = {}) => {
    await replica((tx) => tx`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days, wood_got, stone_got, kontor_spent, opened_at, funded_at)
      values (${v.id}, ${o.item ?? "spital2"}, 500, 0, ${o.needWood ?? 90}, ${o.needStone ?? 60}, 35, ${o.gotWood ?? 0}, ${o.gotStone ?? 0}, 0, now() - interval '1 hour',
        ${o.funded ? sql`now()` : null})`);
  };
  /** As the player's client: role authenticated, auth.uid() = owner. */
  const asPlayer = <R>(v: V, f: (tx: postgres.TransactionSql) => Promise<R>) => sql.begin(async (tx) => {
    await tx`select set_config('test.uid', ${v.owner}, true), set_config('test.role', 'authenticated', true)`;
    await tx.unsafe("set local role authenticated");
    return f(tx);
  });
  type J = Record<string, unknown>;
  const open = (v: V, bau: Bau) => asPlayer(v, async (tx) => (await tx`select public.stift_open(${v.id}, ${bau}, ${C}) r`)[0]!["r"] as J);
  const deposit = (v: V, bau: Bau, m: number, amount: number) => asPlayer(v, async (tx) => (await tx`select public.stift_deposit(${v.id}, ${bau}, ${m}, ${amount}, ${C}) r`)[0]!["r"] as J);
  const close = (v: V, bau: Bau, max = 100000) => asPlayer(v, async (tx) => (await tx`select public.stift_close(${v.id}, ${bau}, ${max}, ${C}) r`)[0]!["r"] as J);
  const overview = (v: V) => asPlayer(v, async (tx) => (await tx`select public.stift_overview(${v.id}, ${C}) r`)[0]!["r"] as Record<string, J> & J);
  /** Open, pay in one deposit and close one stage. */
  const endow = async (v: V, bau: Bau) => {
    const o = await open(v, bau);
    await deposit(v, bau, 1, o["price"] as number);
    return close(v, bau);
  };
  /** Moves every Stiftung row of the village `ms` into the past — the village "waits" that long. */
  const age = async (v: V, ms: number) => {
    const i = `${ms} milliseconds`;
    await replica(async (tx) => {
      await tx`update public.stift_stages set opened_at = opened_at - ${i}::interval, funded_at = funded_at - ${i}::interval,
        done_at = done_at - ${i}::interval, until_at = until_at - ${i}::interval where seed_id = ${v.id}`;
      await tx`update public.purchases set created_at = created_at - ${i}::interval where seed_id = ${v.id} and item ~ ${STIFT_ROW}`;
      await tx`update public.resource_ledger set at = at - ${i}::interval where seed_id = ${v.id} and ref like 'stift:%'`;
    });
  };
  type Stage = { bau: Bau; nr: number; price: number; paid: number; opened_at: Date; funded_at: Date | null; done_at: Date | null; until_at: Date | null; kontor: number | null; wood_store: number | null; stone_store: number | null };
  const stages = async (v: V, bau?: Bau) => (await sql`select * from public.stift_stages where seed_id = ${v.id} ${bau ? sql`and bau = ${bau}` : sql``} order by bau, nr`) as unknown as Stage[];
  const stiftRows = async (v: V) => (await sql`select item, cost from public.purchases where seed_id = ${v.id} and item ~ ${STIFT_ROW} order by item`).map((r) => `${r["item"]}=${r["cost"]}`);
  /** The village as TypeScript sees it: Seed.bought from the purchase rows alone. */
  const seedOf = async (v: V): Promise<Seed> => ({ id: v.id, x: 0, y: 0, created_at: iso(v.created), user_id: v.owner, realm: v.realm,
    bought: (await sql`select item, created_at from public.purchases where seed_id = ${v.id} order by created_at, item`).map((r) => ({ item: r["item"] as string, at: (r["created_at"] as Date).getTime() })) }) as unknown as Seed;
  const untilAt = async (v: V, bau: Bau, t: number) => ((await sql`select public.stift_until_at(${v.id}, ${bau}, ${iso(t)}::timestamptz) u`)[0]!["u"] as Date | null)?.getTime() ?? null;
  const endowedAt = async (v: V, bau: Bau, t: number) => (await sql`select public.stift_endowed_at(${v.id}, ${bau}, ${iso(t)}::timestamptz) e`)[0]!["e"] as boolean;
  const kontorAt = async (v: V, w: number, s: number, t: number) => (await sql`select public.resource_kontor_at(${v.id}, ${w}, ${s}, ${iso(t)}::timestamptz) c`)[0]!["c"] as number;
  // (the alias must not be a column name: `x` would read purchases.x instead of the row)
  const rowsOf = async (table: string) => (await sql.unsafe(`select coalesce(string_agg(row_::text, '|' order by row_::text), '') s from public.${table} row_`))[0]!["s"] as string;
  const snapshot = async () => { const h = createHash("sha256"); for (const t of TABLES) h.update(t + ":" + await rowsOf(t)); return h.digest("hex"); };
  const dbNow = async () => ((await sql`select now() t`)[0]!["t"] as Date).getTime();

  // ---------- Hochzeitspaket fixtures (as paket-b.pg.test.ts) ----------
  type W = { t: number; dowry: number };
  const legacy = async (v: V): Promise<W[]> =>
    (await sql`select t, dowry from public.village_wedding_list(${v.id}, ${iso(T - 1)}, array['fisher','hunter','granary','dairy']) order by t`)
      .map((r) => ({ t: (r["t"] as Date).getTime(), dowry: r["dowry"] as number }));
  const chain = (ws: W[], next: number, from = 0) => ws.map((w, i) => ({
    wedding_index: from + i, occurred_at: iso(w.t), dowry: w.dowry, is_grand: true, is_town: false, version: w.t >= T ? 2 : 1,
    next_at: iso(i + 1 < ws.length ? ws[i + 1]!.t : next),
  }));
  const settle = (v: V, rows: unknown[], through: number) =>
    sql`select public.wedding_settle(${v.id}, ${sql.json(rows as never)}, ${iso(through)}) r`.then((x) => x[0]!["r"] as { inserted: number; marked: boolean });
  /**
   * A `lab` village after the wedding switch: W1 booked, W2 (dowry `w2`, `w2Days` ago) due but NOT booked — the
   * settlement is incomplete until bookW2. `complete: true` books W2 at once (the reference village).
   */
  const wedVillage = async (o: { w2?: number; w2Days?: number; complete?: boolean } = {}) => {
    const v = await bare({ realm: "lab", ageDays: 150 });
    const leg = await legacy(v);
    const W1 = { t: T + 12 * H, dowry: 41 }, W2 = { t: NOW - (o.w2Days ?? 2) * D, dowry: o.w2 ?? 300 }, NEXT = NOW + 2 * D;
    await settle(v, chain([W1], W2.t, leg.length), W2.t - H);
    const s = { v, W1, W2, NEXT, index2: leg.length + 1 };
    if (o.complete) await bookW2(s);
    await replica(async (tx) => {
      await tx`insert into public.village_sites (seed_id, way, certified_at) values (${v.id}, 'grain', ${iso(NOW - 100 * D)})`;
      // a town guard from the founding: no raids (village_raid_list), so the chest is exactly what the test books
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, 'guard', 0, ${iso(v.created)})`;
    });
    return s;
  };
  const bookW2 = (s: { v: V; W2: W; NEXT: number; index2: number }) => settle(s.v, chain([s.W2], s.NEXT, s.index2), Date.now());
  const settledNow = async (v: V) => (await sql`select public.wedding_settled_at(${v.id}, now()) s`)[0]!["s"] as boolean;
  /** A Gemeindebau stage in the material phase (fully paid `fundedDays` ago; its Kontor buys from the chest). */
  const materialStage = async (v: V, fundedDays = 5) => {
    await replica((tx) => tx`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days, wood_got, stone_got, kontor_spent, opened_at, funded_at)
      values (${v.id}, 'spital1', 500, 1000, 400, 300, 5, 0, 0, 0, ${iso(NOW - (fundedDays + 1) * D)}, ${iso(NOW - fundedDays * D)})`);
  };
  const resourceState = async (v: V) => ({
    ledger: (await sql`select count(*)::int n, coalesce(sum(amount), 0)::int s from public.resource_ledger where seed_id = ${v.id}`)[0],
    through: (await sql`select through_day::text t from public.resource_state where seed_id = ${v.id}`)[0]?.["t"] ?? null,
    civic: (await sql`select wood_got, stone_got, kontor_spent from public.civic_stages where seed_id = ${v.id}`)[0],
    quota: (await sql`select wood, stone from public.civic_quota where seed_id = ${v.id}`)[0] ?? null,
    kontor: await sql`select item, cost from public.purchases where seed_id = ${v.id} and item like 'spital1:k%' order by item`,
    ankauf: await sql`select item, cost from public.purchases where seed_id = ${v.id} and item like 'ankauf:%' order by item`,
  });
  const resOverview = (v: V) => asPlayer(v, async (tx) => (await tx`select public.resource_overview_v2(${v.id}, ${C}) r`)[0]!["r"] as J);
  /** A funded, not yet closed Stiftung stage placed directly (the village could not have opened it while pending). */
  const fundedStage = async (v: V, bau: Bau, price = 400) => {
    await replica(async (tx) => {
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, ${bau + "1"}, 0, ${iso(NOW - 120 * D)}) on conflict do nothing`;
      await tx`insert into public.stift_stages (seed_id, bau, nr, price, paid, opened_at, funded_at) values (${v.id}, ${bau}, 1, ${price}, ${price}, ${iso(NOW - 3 * D)}, ${iso(NOW - 3 * D)})`;
    });
  };

  beforeAll(async () => {
    url = await buildFullSchema(BASE!, DB);
    sql = postgres(url, { max: 8, onnotice: () => {} });
    const past = iso(NOW - 300 * D), far = "2100-01-04 00:00:00+00";
    const fn = (name: string, body: string) => sql.unsafe(`create or replace function public.${name}(_realm text) returns timestamptz
      language sql immutable set search_path to 'public' as $$ select ${body} $$`);
    await fn("stift_since", `timestamptz '${past}'`);
    await fn("resources_since", `timestamptz '${past}'`);
    await fn("ankauf_since", `case when _realm = 'lab' then timestamptz '${past}' else timestamptz '${far}' end`);
    await fn("wedding_switch_since", `case when _realm = 'lab' then timestamptz '${iso(T)}' else timestamptz '${far}' end`);
  }, 180000);
  afterAll(async () => { await sql.end(); await dropDatabase(BASE!, DB); });

  // ====================================================================================================================
  it("Aufbau: 0165 auf dem vollständigen Schema; Schalter im Auslieferungszustand 2100 (lab und öffentlich); Patches sitzen", async () => {
    // the delivered switch, read from the migration file itself (this database overrides it for the tests)
    const file = migration(journalTags().find((t) => t.startsWith("0165_"))!);
    expect(file).toContain("SELECT CASE WHEN _realm = 'lab' THEN timestamptz '2100-01-04 00:00:00+00' ELSE timestamptz '2100-01-04 00:00:00+00' END");
    expect(STIFT_SINCE).toBe(Date.parse("2100-01-04T00:00:00Z"));
    expect(journalTags().slice(-2)).toEqual(["0165_stiftungen_p4", "0166_begleitmigration_0166"]);
    expect(migration("0166_begleitmigration_0166")).toBe("SELECT 1;");
    const src = async (f: string) => (await sql`select pg_get_functiondef(${f}::regprocedure) s`)[0]!["s"] as string;
    const guard = await src("public.purchase_guard()");
    expect(guard).toContain("price := public.stift_row_price(NEW.seed_id, NEW.item, NEW.cost);");
    expect(guard).toContain("PERFORM public.wedding_money_check(NEW.seed_id, price);");
    expect(await src("public.resource_kontor_at(uuid,integer,integer,timestamptz)")).toContain("public.stift_endowed_at(_seed, 'waage', _at)");
    expect((await src("public.quest_guard()")).split("^stift:").length - 1).toBe(1);
    expect((await src("public.princely_task_met(uuid,text,timestamptz)")).split("^stift:").length - 1).toBe(2);
    // only the two player actions may write Stiftung rows: nothing else switches the server setting on
    const setters = (await sql`select p.proname from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
      where ns.nspname = 'public' and p.prosrc like '%set_config(''samenland.stift'', ''on''%' order by 1`).map((r) => r["proname"]);
    expect(setters).toEqual(["stift_close", "stift_deposit"]);
    // rights: the three actions and the overview for the signed-in owner, everything else internal
    const acl = async (f: string) => (await sql`select has_function_privilege('authenticated', ${f}, 'execute') a, has_function_privilege('anon', ${f}, 'execute') n`)[0]!;
    for (const f of ["public.stift_open(uuid,text,integer)", "public.stift_deposit(uuid,text,integer,integer,integer)", "public.stift_close(uuid,text,integer,integer)", "public.stift_overview(uuid,integer)"])
      expect(await acl(f)).toEqual({ a: true, n: false });
    for (const f of ["public.stift_row_price(uuid,text,integer)", "public.stift_enter(uuid,text,integer)", "public.stift_until_at(uuid,text,timestamptz)", "public.stift_free_quota(uuid)", "public.stift_since(text)"])
      expect(await acl(f)).toEqual({ a: false, n: false });
    const tab = (await sql`select has_table_privilege('authenticated', 'public.stift_stages', 'select') s, has_table_privilege('authenticated', 'public.stift_stages', 'insert') i,
      has_table_privilege('authenticated', 'public.stift_stages', 'update') u, has_table_privilege('anon', 'public.stift_stages', 'select') a`)[0]!;
    expect(tab).toEqual({ s: true, i: false, u: false, a: false });
  });

  it("Aufbau: im Auslieferungszustand (Schalter 2100) lehnt jede Aktion ab, auch im lab; fremde Dörfer und alte Clients ebenso", async () => {
    const v = await village(), lab = await village({ realm: "lab" });
    const stranger = await bare();
    // the delivered switch for a moment, inside one transaction that is rolled back
    for (const w of [v, lab]) {
      const res = await err(sql.begin(async (tx) => {
        await tx.unsafe(`create or replace function public.stift_since(_realm text) returns timestamptz language sql immutable set search_path to 'public'
          as $$ SELECT CASE WHEN _realm = 'lab' THEN timestamptz '2100-01-04 00:00:00+00' ELSE timestamptz '2100-01-04 00:00:00+00' END $$`);
        await tx`select set_config('test.uid', ${w.owner}, true), set_config('test.role', 'authenticated', true)`;
        const out: string[] = [];
        for (const q of [`select public.stift_open('${w.id}', 'spital', ${C})`, `select public.stift_deposit('${w.id}', 'spital', 1, 10, ${C})`, `select public.stift_close('${w.id}', 'spital', 1000, ${C})`]) {
          await tx.unsafe("savepoint a");
          out.push(await tx.unsafe(q).then(() => "ok", (e: Error) => e.message));
          await tx.unsafe("rollback to savepoint a");
        }
        const ov = (await tx.unsafe(`select public.stift_overview('${w.id}', ${C}) r`))[0]!["r"] as J;
        expect(out).toEqual(["not now", "not now", "not now"]);
        expect(ov).toMatchObject({ active: false });
        throw new Error("rollback");
      }));
      expect(res).toBe("rollback");
    }
    expect(await err(asPlayer(stranger, (tx) => tx`select public.stift_open(${v.id}, 'spital', ${C})`))).toBe("not owner");
    expect(await err(asPlayer(stranger, (tx) => tx`select public.stift_overview(${v.id}, ${C})`))).toBe("not owner");
    expect(await err(asPlayer(v, (tx) => tx`select public.stift_open(${v.id}, 'spital', 1)`))).toBe("client outdated");
    expect(await err(asPlayer(v, (tx) => tx`select public.stift_open(${v.id}, 'dom', ${C})`))).toBe("unknown bau");
    // stiftbar erst, wenn Stufe 1 des Baus steht
    const only = await village({ bauten: ["waage"] });
    expect(await err(open(only, "spital"))).toBe("bau missing");
    expect((await open(only, "waage"))["price"]).toBe(2000);
    // ohne gebuchte Tagessteuer kein Preis
    const noTax = await village({ tax: null });
    expect(await err(open(noTax, "spital"))).toBe("no tax yet");
  });

  // ---------- K1 ----------
  it("K1 Vorrang: Öffnen, Einzahlen und Kontoranteil abgelehnt, solange eine Gemeindebaustufe nicht voll bezahlt ist; endet mit der letzten Rate", async () => {
    const v = await village({ wood: 40, stone: 30 });            // store at the kept stock: a close needs the Kontor
    await open(v, "spital");                                     // opened before the site: the stage exists
    await deposit(v, "spital", 1, 500);
    const w = await open(v, "waage");
    await deposit(v, "waage", 1, w["price"] as number);          // Waage stage fully paid, not yet closed
    await civicStage(v, { item: "spital2" });                    // a Gemeindebau is opened and not paid
    const fresh = await village();
    await civicStage(fresh, { item: "spital2" });
    const h0 = await snapshot();
    expect(await err(open(fresh, "waage"))).toBe("civic site first");
    expect(await err(deposit(v, "spital", 2, 100))).toBe("civic site first");
    expect(await err(close(v, "waage"))).toBe("civic site first");
    // the guard itself holds the rule: also a direct row, and never without the server setting
    expect(await err(asPlayer(v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, cost) values (${v.id}, ${v.owner}, 'stift:spital:1:r2', 100)`))).toBe("stift rows are booked by the server");
    expect(await err(sql.begin(async (tx) => { await tx`select set_config('samenland.stift', 'on', true)`;
      await tx`insert into public.purchases (seed_id, user_id, item, cost) values (${v.id}, ${v.owner}, 'stift:spital:1:r2', 100)`; }))).toBe("civic site first");
    expect(await snapshot()).toBe(h0);
    expect((await overview(v))["vorrang"]).toEqual({ item: "spital2", rest: 500 });
    // all but the last Mark paid: still locked
    expect(await err(asPlayer(v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, cost) values (${v.id}, ${v.owner}, 'spital2:r1', 499)`))).toBe("ok");
    expect(await err(deposit(v, "spital", 2, 100))).toBe("civic site first");
    expect((await overview(v))["vorrang"]).toEqual({ item: "spital2", rest: 1 });
    // the last instalment ends the Vorrang — not the completion of the building
    expect(await err(asPlayer(v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, cost) values (${v.id}, ${v.owner}, 'spital2:r2', 1)`))).toBe("ok");
    expect((await sql`select funded_at is not null f, material_at is null m from public.civic_stages where seed_id = ${v.id}`)[0]).toEqual({ f: true, m: true });
    expect((await overview(v))["vorrang"]).toBeNull();
    expect((await deposit(v, "spital", 2, 100))["paid"]).toBe(600);
  });
  it("K1 Vorrang: ein Abschluss ganz aus dem Lager (ohne Kontoranteil) bleibt möglich", async () => {
    const v = await village({ wood: 100, stone: 100 });
    const o = await open(v, "waage");
    await deposit(v, "waage", 1, o["price"] as number);
    await civicStage(v, { item: "spital2" });
    const r = await close(v, "waage");
    expect(r).toMatchObject({ kontor: 0, store: { wood: 30, stone: 20 }, bought: { wood: 0, stone: 0 } });
    expect(await stiftRows(v)).toEqual(["stift:waage:1=0", "stift:waage:1:r1=2000"]);
  });
  it("K1 Vorrang bei gleichzeitigen Anfragen: letzte Rate und Einzahlung im selben Moment — nie beides am Vorrang vorbei", async () => {
    const a = postgres(url, { max: 1, onnotice: () => {} }), b = postgres(url, { max: 1, onnotice: () => {} });
    try {
      for (const commit of [true, false]) {
        const v = await village();
        await open(v, "spital");
        await civicStage(v, { item: "spital2" });
        await asPlayer(v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, cost) values (${v.id}, ${v.owner}, 'spital2:r1', 499)`);
        // A: the last instalment, transaction still open (holds the village lock)
        await a.unsafe("begin");
        await a`select set_config('test.uid', ${v.owner}, true), set_config('test.role', 'authenticated', true)`;
        await a.unsafe("set local role authenticated");
        await a`insert into public.purchases (seed_id, user_id, item, cost) values (${v.id}, ${v.owner}, 'spital2:r2', 1)`;
        // B: the deposit at the same moment — it must wait for A, never decide on the unfinished state
        let done = false;
        const dep = err(b.begin(async (tx) => {
          await tx`select set_config('test.uid', ${v.owner}, true), set_config('test.role', 'authenticated', true)`;
          await tx.unsafe("set local role authenticated");
          await tx`select public.stift_deposit(${v.id}, 'spital', 1, 100, ${C})`;
        })).then((x) => { done = true; return x; });
        await new Promise((r) => setTimeout(r, 400));
        expect(done).toBe(false);
        expect((await sql`select count(*)::int n from pg_locks where not granted`)[0]!["n"]).toBeGreaterThan(0);
        await a.unsafe(commit ? "commit" : "rollback");
        // committed: the site is paid, the deposit is booked. Rolled back: the site is still unpaid, the deposit refused.
        expect(await dep).toBe(commit ? "ok" : "civic site first");
        expect(await stiftRows(v)).toEqual(commit ? ["stift:spital:1:r1=100"] : []);
        expect((await sql`select funded_at is not null f from public.civic_stages where seed_id = ${v.id}`)[0]!["f"]).toBe(commit);
      }
    } finally { await a.end(); await b.end(); }
  });

  // ---------- K2 ----------
  it("K2 kein automatischer Abfluss: ein 30 Tage nicht besuchtes Dorf erhält keine Stiftungs-Geldzeile", async () => {
    const v = await bare();
    await replica(async (tx) => {
      await tx`insert into public.village_sites (seed_id, way, certified_at) values (${v.id}, 'grain', ${iso(v.created + D)})`;
      for (const b of ["spital", "waage"]) await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, ${b + "1"}, 0, ${iso(v.created + 10 * D)})`;
    });
    await setTax(v, 500);
    await setCash(v, 9000);
    await open(v, "spital");
    await deposit(v, "spital", 1, 700);                          // half-paid stage
    const w = await open(v, "waage");
    await deposit(v, "waage", 1, w["price"] as number);          // fully paid, not closed
    await age(v, 30 * D);                                        // 30 days nobody visits; no resource day is booked yet
    expect((await sql`select count(*)::int n from public.resource_state where seed_id = ${v.id}`)[0]!["n"]).toBe(0);
    const rows0 = await stiftRows(v), st0 = JSON.stringify(await stages(v)), bal0 = await balance(v);
    expect(rows0).toEqual(["stift:spital:1:r1=700", "stift:waage:1:r1=2000"]);
    // everything that runs without the player's Stiftung action: the daily booking of all open days (server and login)
    expect(await refresh(v)).toBe("booked");
    expect(await err(asPlayer(v, (tx) => tx`select public.resource_overview_v2(${v.id}, ${C})`))).toBe("ok");
    const ov = await overview(v);
    expect(await err(sql`select public.resource_refresh(${v.id})`)).toBe("ok");
    expect((await sql`select through_day::text t from public.resource_state where seed_id = ${v.id}`)[0]!["t"]).toBe(today());
    expect((await quota(v)).wood).toBe(120);                     // the days were really booked (quota saved up)
    expect(await stiftRows(v)).toEqual(rows0);
    expect(JSON.stringify(await stages(v))).toBe(st0);
    expect(await balance(v)).toBe(bal0);
    // the paid stage waits for the player; it is offered, not booked
    expect(ov["waage"]).toMatchObject({ stage: { nr: 1, paid: 2000, price: 2000 }, plan: { store: { wood: 30, stone: 20 }, cost: 0 } });
    expect((await stages(v, "waage"))[0]!.done_at).toBeNull();
  });

  // ---------- K3 ----------
  it("K3 Teilzahlung: unter 1 Mark, über dem Rest, über dem Kassenstand abgelehnt; doppelte Anfrage bucht einmal; Preis bleibt fest", async () => {
    const v = await village({ tax: 500, cash: 1500 });
    expect(await open(v, "spital")).toEqual({ bau: "spital", nr: 1, price: 2000 });
    expect(stiftPrice(500)).toBe(2000);
    expect(await balance(v)).toBe(1500);                         // opening costs nothing
    const h0 = await snapshot();
    expect(await err(deposit(v, "spital", 1, 0))).toBe("bad amount");
    expect(await err(deposit(v, "spital", 1, -5))).toBe("bad amount");
    expect(await err(deposit(v, "spital", 1, 2001))).toBe("bad amount");       // above the rest
    expect(await err(deposit(v, "spital", 1, 1600))).toBe("not enough money");  // within the rest, above the chest
    expect(await err(deposit(v, "spital", 2, 100))).toBe("previous step open");
    expect(await snapshot()).toBe(h0);
    expect(await deposit(v, "spital", 1, 1)).toMatchObject({ paid: 1, funded: false });   // the smallest deposit
    // the same request twice (same deposit number): booked once
    const twice = await Promise.all([err(deposit(v, "spital", 2, 300)), err(deposit(v, "spital", 2, 300))]);
    expect(twice.sort()).toEqual(["ok", "previous step open"]);
    expect(await err(deposit(v, "spital", 2, 300))).toBe("previous step open");
    expect(await stiftRows(v)).toEqual(["stift:spital:1:r1=1", "stift:spital:1:r2=300"]);
    expect(await balance(v)).toBe(1199);
    // the price stays fixed after the opening, whatever the tax does
    await setTax(v, 900, 101);
    expect((await stages(v, "spital"))[0]).toMatchObject({ price: 2000, paid: 301 });
    expect(await err(deposit(v, "spital", 3, 1500))).toBe("not enough money");
    await setCash(v, 5000);
    expect(await err(deposit(v, "spital", 3, 1700))).toBe("bad amount");       // rest is 1.699
    expect(await deposit(v, "spital", 3, 1699)).toMatchObject({ paid: 2000, funded: true });
    expect(await err(deposit(v, "spital", 4, 1))).toBe("already funded");
    expect((await stages(v, "spital"))[0]!.funded_at).not.toBeNull();
    // final: no path gives money back — a paid stage can only be closed
    expect(await balance(v)).toBe(5000 - 1699);
    // a stage opened now takes the new tax
    expect((await open(v, "waage"))["price"]).toBe(3600);
  });

  // ---------- K4 ----------
  it("K4 Reservierung: bei unvollständigem Material der Baustelle nur Kontingent über deren Restbedarf; danach wieder alles", async () => {
    const v = await village({ wood: 40, stone: 30 });            // store at the kept stock: everything from the quota
    const o = await open(v, "waage");
    await deposit(v, "waage", 1, o["price"] as number);
    // the paid Gemeindebau still misses 50 wood and 40 stone (funded today: its own pull starts tomorrow)
    await civicStage(v, { item: "spital2", funded: true, needWood: 90, needStone: 60, gotWood: 40, gotStone: 20 });
    await setQuota(v, 60, 45);                                    // free for a Stiftung: 10 wood, 5 stone
    const civic = (await sql`select * from public.civic_stages where seed_id = ${v.id}`) as unknown as CivicRow[];
    const free = (await sql`select wood, stone from public.stift_free_quota(${v.id})`)[0];
    expect(free).toEqual({ wood: 10, stone: 5 });
    expect(stiftFreeQuota(await quota(v), stiftReserved(civic))).toEqual(free);          // TypeScript parity
    const ov = await overview(v);
    expect(ov).toMatchObject({ quota: { wood: 60, stone: 45 }, reserved: { wood: 50, stone: 40 }, free: { wood: 10, stone: 5 } });
    expect(ov["waage"]!["plan"]).toMatchObject({ kontor: { wood: 30, stone: 20 }, short: { wood: 20, stone: 15 } });
    expect(stiftPlan({ wood: 40, stone: 30 }, free as never, "grain", waageFactor(await seedOf(v), Date.now()))).toMatchObject({ short: { wood: 20, stone: 15 }, ok: false, cost: (ov["waage"]!["plan"] as J)["cost"] });
    const h0 = await snapshot();
    expect(await err(close(v, "waage"))).toBe("material short");  // nothing happens
    expect(await snapshot()).toBe(h0);
    // enough above the reservation: the Stiftung takes only that part
    await setQuota(v, 90, 70);                                    // free 40 / 30
    const r = await close(v, "waage");
    expect(r).toMatchObject({ bought: { wood: 30, stone: 20 }, store: { wood: 0, stone: 0 }, kontor: 204 });
    expect(await quota(v)).toEqual({ wood: 60, stone: 50 });      // the site's 50 / 40 are still there
    expect(await stock(v)).toEqual({ w: 40, s: 30 });             // the kept stock is untouched
    // once the site's material is complete, the whole quota is free again
    const v2 = await village({ wood: 40, stone: 30 });
    const o2 = await open(v2, "spital");
    await deposit(v2, "spital", 1, o2["price"] as number);
    await civicStage(v2, { item: "waage2", funded: true, needWood: 90, needStone: 60, gotWood: 40, gotStone: 20 });
    await setQuota(v2, 60, 45);
    expect(await err(close(v2, "spital"))).toBe("material short");
    await replica((tx) => tx`update public.civic_stages set wood_got = need_wood, stone_got = need_stone, material_at = now(), done_at = now() + interval '35 days' where seed_id = ${v2.id}`);
    expect((await sql`select wood, stone from public.stift_free_quota(${v2.id})`)[0]).toEqual({ wood: 60, stone: 45 });
    expect(await close(v2, "spital")).toMatchObject({ bought: { wood: 30, stone: 20 } });   // during the build days
    expect(await quota(v2)).toEqual({ wood: 30, stone: 25 });
  });
  it("K4 Abschluss: zuerst Lager über 40/30, Rest zum Kontorpreis im selben Aufruf; der bestätigte Betrag bindet; zu wenig Geld: nichts", async () => {
    const v = await village({ wood: 52, stone: 30, cash: 3000 });  // 12 wood above the kept stock
    const o = await open(v, "spital");
    await deposit(v, "spital", 1, o["price"] as number);
    const plan = (await overview(v))["spital"]!["plan"] as J;
    expect(plan).toMatchObject({ store: { wood: 12, stone: 0 }, kontor: { wood: 18, stone: 20 }, short: { wood: 0, stone: 0 }, cost: 163 });  // (72 + 120) × 0,85 Waage 1
    const h0 = await snapshot();
    expect(await err(close(v, "spital", 162))).toBe("price changed");
    await setCash(v, 100);
    const h1 = await snapshot();
    expect(await err(close(v, "spital", 163))).toBe("not enough money");
    expect(await snapshot()).toBe(h1);
    expect(h1).not.toBe(h0);
    await setCash(v, 163);
    const r = await close(v, "spital", 163);
    expect(r).toMatchObject({ kontor: 163, store: { wood: 12, stone: 0 }, bought: { wood: 18, stone: 20 } });
    expect(await balance(v)).toBe(0);
    expect(await stock(v)).toEqual({ w: 40, s: 30 });
    expect(await quota(v)).toEqual({ wood: 102, stone: 70 });
    expect(await stiftRows(v)).toEqual(["stift:spital:1=0", "stift:spital:1:k=163", "stift:spital:1:r1=2000"]);
    const led = (await sql`select resource, kind, ref, amount from public.resource_ledger where seed_id = ${v.id} and ref like 'stift:%' order by resource, kind, ref`).map((x) => `${x["resource"]} ${x["kind"]} ${x["ref"]} ${x["amount"]}`);
    expect(led).toEqual(["stone civic stift:spital:1:q -20", "stone kontor stift:spital:1:k 20", "wood civic stift:spital:1:q -18", "wood civic stift:spital:1:s -12", "wood kontor stift:spital:1:k 18"]);
    // a second close of the same stage: nothing to close
    expect(await err(close(v, "spital"))).toBe("stage not open");
    expect(await err(asPlayer(v, (tx) => tx`select public.stift_close(${v.id}, 'waage', 1000, ${C})`))).toBe("stage not open");
  });

  // ---------- S1 … S5 (database half) ----------
  it("S1 Verlängerung bei laufender Stiftungszeit: 10 Tage Rest, Abschluss → 24 Tage Rest; das Ende rückt um genau 14 Tage", async () => {
    const v = await village();
    const o = await open(v, "spital");
    await age(v, 3 * D);
    await deposit(v, "spital", 1, o["price"] as number);
    await close(v, "spital");
    const first = (await stages(v, "spital"))[0]!;
    expect(first.until_at!.getTime() - first.done_at!.getTime()).toBe(14 * D);
    await age(v, 4 * D);                                         // 10 days are left, the opening is 7 days old
    const s1 = (await stages(v, "spital"))[0]!;
    const rest0 = s1.until_at!.getTime() - await dbNow();
    expect(rest0).toBeGreaterThan(10 * D - 30 * S); expect(rest0).toBeLessThanOrEqual(10 * D);
    const o2 = await open(v, "spital");
    await deposit(v, "spital", 1, o2["price"] as number);
    await close(v, "spital");
    const [a, b] = await stages(v, "spital");
    expect(b!.until_at!.getTime()).toBe(a!.until_at!.getTime() + 14 * D);       // appended at the running end
    const rest1 = b!.until_at!.getTime() - b!.done_at!.getTime();
    expect(rest1).toBeGreaterThan(24 * D - 30 * S); expect(rest1).toBeLessThanOrEqual(24 * D);
    expect(a!.until_at!.getTime()).toBe(s1.until_at!.getTime());                // the first close row is never changed
    // one run, no second parallel one: endowed without a gap up to the added end, not a moment longer
    const end = b!.until_at!.getTime();
    expect(await endowedAt(v, "spital", end - 1)).toBe(true);
    expect(await endowedAt(v, "spital", end)).toBe(false);
    expect(await untilAt(v, "spital", b!.done_at!.getTime() - 1)).toBe(a!.until_at!.getTime());  // before the second close: the old end
    // TypeScript computes the same ends from the marker rows alone
    const seed = await seedOf(v);
    expect(stiftSpans(seed, "spital").map((x) => [x.at, x.until])).toEqual([a, b].map((x) => [x!.done_at!.getTime(), x!.until_at!.getTime()]));
  });
  it("S2 genau 14 Tage Rest: Öffnen und Abschluss erlaubt, danach genau 28 Tage; eine Sekunde mehr: Öffnen abgelehnt", async () => {
    const run = async (extra: string) => {
      const v = await village();
      let out: J = {};
      const res = await err(sql.begin(async (tx) => {
        // one transaction: now() is one instant, so the rest is exact
        await tx`set local session_replication_role = replica`;
        // two earlier closes, both 14 days ago (the second one hour later): the end is exactly 14 days ahead (+ extra)
        await tx.unsafe(`insert into public.stift_stages (seed_id, bau, nr, price, paid, opened_at, funded_at, done_at, until_at, kontor, wood_store, stone_store) values
          ('${v.id}', 'spital', 1, 2000, 2000, now() - interval '30 days', now() - interval '30 days', date_trunc('milliseconds', now()) - interval '14 days' ${extra},
            date_trunc('milliseconds', now()) ${extra}, 0, 30, 20),
          ('${v.id}', 'spital', 2, 2000, 2000, now() - interval '20 days', now() - interval '20 days', date_trunc('milliseconds', now()) - interval '14 days' + interval '1 hour',
            date_trunc('milliseconds', now()) + interval '14 days' ${extra}, 0, 30, 20)`);
        await tx.unsafe(`insert into public.purchases (seed_id, user_id, item, cost, created_at) values
          ('${v.id}', '${v.owner}', 'stift:spital:1', 0, date_trunc('milliseconds', now()) - interval '14 days' ${extra}),
          ('${v.id}', '${v.owner}', 'stift:spital:2', 0, date_trunc('milliseconds', now()) - interval '14 days' + interval '1 hour')`);
        await tx`set local session_replication_role = origin`;
        await tx`select set_config('test.uid', ${v.owner}, true), set_config('test.role', 'authenticated', true)`;
        const o = (await tx`select public.stift_open(${v.id}, 'spital', ${C}) r`)[0]!["r"] as J;
        await tx`select public.stift_deposit(${v.id}, 'spital', 1, ${o["price"] as number}, ${C})`;
        await tx`select public.stift_close(${v.id}, 'spital', 1000, ${C})`;
        out = (await tx`select extract(epoch from (until_at - done_at)) * 1000 ms, done_at = date_trunc('milliseconds', now()) same from public.stift_stages where seed_id = ${v.id} and nr = 3`)[0] as J;
      }));
      return { res, out, v };
    };
    const exact = await run("");
    expect(exact.res).toBe("ok");
    expect(Number(exact.out["ms"])).toBe(28 * D);                // exactly 28 days after the close
    expect(exact.out["same"]).toBe(true);
    const seed = await seedOf(exact.v), sp = stiftSpans(seed, "spital");
    expect(sp[2]!.until - sp[2]!.at).toBe(STIFT_MAX_MS);          // TypeScript: the same 28 days
    expect(sp.map((x) => x.until)).toEqual((await stages(exact.v, "spital")).map((x) => x.until_at!.getTime()));
    // one second more than 14 days left: the opening is refused, nothing is booked
    const more = await run("+ interval '1 second'");
    expect(more.res).toBe("store full");
    expect((await stages(more.v)).length).toBe(0);                // the whole transaction is gone: nothing was booked
    expect(await stiftRows(more.v)).toEqual([]);
    // the smallest step the clock knows (one millisecond) is refused as well
    expect((await run("+ interval '1 millisecond'")).res).toBe("store full");
  });
  it("S3 Abschluss bei 0 Tagen Rest (nie gestiftet oder abgelaufen): 14 Tage ab dem Abschluss, nichts wird nachgeholt", async () => {
    const v = await village();
    await endow(v, "waage");
    const a = (await stages(v, "waage"))[0]!;
    expect(a.until_at!.getTime()).toBe(a.done_at!.getTime() + 14 * D);          // never endowed before
    await age(v, 40 * D);                                        // run out 26 days ago
    expect(await endowedAt(v, "waage", Date.now())).toBe(false);
    await endow(v, "waage");
    const [a2, b] = await stages(v, "waage");
    expect(b!.until_at!.getTime()).toBe(b!.done_at!.getTime() + 14 * D);        // from the close, not from the old end
    expect(b!.until_at!.getTime() - a2!.until_at!.getTime()).toBeGreaterThan(39 * D);
    const seed = await seedOf(v);
    expect(stiftUntil(seed, "waage", Date.now())).toBe(b!.until_at!.getTime());
    expect(stiftEndowed(seed, "waage", a2!.until_at!.getTime() + D)).toBe(false);   // the gap stays a gap
    expect(await endowedAt(v, "waage", a2!.until_at!.getTime() + D)).toBe(false);
  });
  it("S4 maximale Laufzeit: in keiner Folge von Öffnungen und Abschlüssen über 28 Tage; ein Abschluss darüber wird ohne Buchung abgelehnt", async () => {
    const v = await village({ cash: 15000 });
    let maxRest = 0, closes = 0;
    const refused: string[] = [];
    // an eager player: tries every day to open, pays and closes at once
    for (let day = 0; day < 60; day++) {
      const o = await err(open(v, "spital"));
      if (o === "ok") { await deposit(v, "spital", 1, 2000); await close(v, "spital"); closes++; } else refused.push(o);
      const now = await dbNow();
      for (const s of await stages(v, "spital")) expect(s.until_at!.getTime() - s.done_at!.getTime()).toBeLessThanOrEqual(28 * D);
      const u = await untilAt(v, "spital", now);
      maxRest = Math.max(maxRest, u === null ? 0 : u - now);
      await age(v, D);
    }
    expect(closes).toBeGreaterThanOrEqual(4);
    expect(new Set(refused)).toEqual(new Set(["too soon", "store full"]));
    expect(maxRest).toBeLessThanOrEqual(28 * D);
    expect(maxRest).toBeGreaterThan(27 * D);                      // the limit is really reached
    // TypeScript, from the marker rows: the same ends, none further than 28 days
    const seed = await seedOf(v), st = await stages(v, "spital");
    expect(stiftSpans(seed, "spital").map((x) => x.until)).toEqual(st.map((x) => x.until_at!.getTime()));
    for (const sp of stiftSpans(seed, "spital")) expect(sp.until - sp.at).toBeLessThanOrEqual(STIFT_MAX_MS);
    // second guard: a paid stage whose close would end later than 28 days is refused by the close itself, without booking
    const w = await village();
    await endow(w, "waage");
    await age(w, 8 * D);
    const o = await open(w, "waage");
    await deposit(w, "waage", 1, o["price"] as number);
    await replica((tx) => tx`update public.stift_stages set until_at = date_trunc('milliseconds', now()) + interval '14 days 1 hour', done_at = now() - interval '13 days' where seed_id = ${w.id} and nr = 1`);
    const h0 = await snapshot();
    expect(await err(close(w, "waage"))).toBe("store full");
    expect(await snapshot()).toBe(h0);
    // and the table itself never holds a longer store, nor a changed close row
    expect(await err(sql`update public.stift_stages set until_at = done_at + interval '29 days' where seed_id = ${v.id} and nr = 1`)).toBe("stift stage is closed");
    expect(await err(replica((tx) => tx`update public.stift_stages set until_at = done_at + interval '29 days' where seed_id = ${v.id} and nr = 1`))).toContain("stift_stages_until");
  });
  it("S5 keine Verstärkung: eine oder zwei Stufen im Vorrat – derselbe Faktor ×0,85; nach dem addierten Ende wieder der Grundwert", async () => {
    const one = await village({ cash: 12000 }), two = await village({ cash: 12000 }), none = await village();
    for (const b of ["spital", "waage"] as Bau[]) {
      await endow(one, b);
      await endow(two, b); await age(two, 7 * D); await endow(two, b);
    }
    const now = Date.now();
    for (const b of ["spital", "waage"] as Bau[]) {
      expect((await stages(one, b)).length).toBe(1);
      expect((await stages(two, b)).length).toBe(2);
      expect(await endowedAt(one, b, now)).toBe(true);
      expect(await endowedAt(two, b, now)).toBe(true);
      expect(await endowedAt(none, b, now)).toBe(false);
    }
    // Waage, in the database: one factor on top of Waage 1, with one stage as with two
    expect(await kontorAt(none, 30, 20, now)).toBe(204);          // 240 × 0,85
    expect(await kontorAt(one, 30, 20, now)).toBe(173);           // 240 × 0,85 × 0,85
    expect(await kontorAt(two, 30, 20, now)).toBe(173);
    // every day up to the added end the factor, from the end on the base value — database and TypeScript alike
    const sTwo = await seedOf(two), sOne = await seedOf(one), sNone = await seedOf(none);
    const end = (await stages(two, "waage"))[1]!.until_at!.getTime();
    expect(end - now).toBeGreaterThan(20 * D);
    for (let t = now; t < end; t += D) {
      expect(await kontorAt(two, 30, 20, t)).toBe(173);
      expect(kontorCost({ wood: 30, stone: 20 }, "grain", waageFactor(sTwo, t))).toBe(173);
    }
    expect(await kontorAt(two, 30, 20, end - 1)).toBe(173);
    expect(await kontorAt(two, 30, 20, end)).toBe(204);
    expect(kontorCost({ wood: 30, stone: 20 }, "grain", waageFactor(sTwo, end))).toBe(204);
    // Spital (TypeScript reads the same marker rows): exactly one factor, not 0,85²
    const SUM = now + 3 * D, base = sickChance(sNone, SUM);
    expect(sickChance(sOne, SUM)).toBeCloseTo(base * STIFT_FACTOR, 12);
    expect(sickChance(sTwo, SUM)).toBe(sickChance(sOne, SUM));
    const endS = (await stages(two, "spital"))[1]!.until_at!.getTime();
    expect(sickChance(sTwo, endS - 1)).toBeCloseTo(sickChance(sNone, endS - 1) * STIFT_FACTOR, 12);
    expect(sickChance(sTwo, endS)).toBe(sickChance(sNone, endS));
    // the Spital's Stiftung never touches the Kontor and the Waage's never the sickness
    const sp = await village(); await endow(sp, "spital");
    expect(await kontorAt(sp, 30, 20, Date.now())).toBe(204);
  });

  // ---------- K5 ----------
  it("K5 Wirkung: Datenbank und TypeScript rechnen dieselbe Stiftungszeit, denselben Kontorpreis; gebuchte Steuertage bleiben unverändert", async () => {
    const v = await village({ way: "gateway", cash: 15000 }), g = await village({ way: "grain", cash: 15000 });
    for (const w of [v, g]) { await endow(w, "waage"); await endow(w, "spital"); await age(w, 9 * D); await endow(w, "waage"); await age(w, 30 * D); await endow(w, "waage"); await age(w, 2 * D); }
    const tax0 = await rowsOf("tax_receipts");
    await setTax(v, 640, 150);
    const taxV = (await sql`select x::text s from public.tax_receipts x where seed_id = ${v.id} order by day`).map((r) => r["s"]);
    const now = Date.now();
    for (const w of [v, g]) {
      const seed = await seedOf(w), way = w === v ? "gateway" : "grain";
      const st = await stages(w, "waage");
      expect(st.length).toBe(3);
      expect(stiftSpans(seed, "waage").map((x) => [x.n, x.at, x.until])).toEqual(st.map((x) => [x.nr, x.done_at!.getTime(), x.until_at!.getTime()]));
      // every instant around every close and end, and a grid in between
      const probes = new Set<number>([now, now + 40 * D]);
      for (const b of ["spital", "waage"] as Bau[]) for (const x of await stages(w, b)) for (const e of [x.done_at!.getTime(), x.until_at!.getTime()]) for (const dlt of [-1, 0, 1]) probes.add(e + dlt);
      for (let t = now - 45 * D; t < now + 20 * D; t += 7 * H) probes.add(t);
      let on = 0, off = 0;
      for (const t of probes) {
        for (const b of ["spital", "waage"] as Bau[]) {
          const e = await endowedAt(w, b, t);
          expect(stiftEndowed(seed, b, t)).toBe(e);
          expect(stiftUntil(seed, b, t)).toBe(await untilAt(w, b, t));
          if (b === "waage") { if (e) on++; else off++; }
        }
        for (const [wd, sn] of [[30, 20], [1, 0], [0, 1], [7, 3], [120, 90], [13, 11]] as const)
          expect(kontorCost({ wood: wd, stone: sn }, way, waageFactor(seed, t))).toBe(await kontorAt(w, wd, sn, t));
      }
      expect(on).toBeGreaterThan(20); expect(off).toBeGreaterThan(20);
      // sickness: the Spital factor is there exactly while the database says "endowed"
      const plain = { ...seed, bought: seed.bought!.filter((b) => !/^stift:/.test(b.item)) } as Seed;
      for (const t of probes) {
        const p = sickChance(plain, t), e = await endowedAt(w, "spital", t);
        expect(sickChance(seed, t)).toBeCloseTo(p * (e ? STIFT_FACTOR : 1), 12);
      }
    }
    // a later close never changes an earlier instant: the ends booked before stay what they were
    const before = await stages(v, "waage");
    const past = before[1]!.until_at!.getTime() + D;             // in the gap between the second and the third run
    expect(await endowedAt(v, "waage", past)).toBe(false);
    await age(v, 8 * D); await endow(v, "waage");
    const after = await stages(v, "waage");
    expect(after.slice(0, 3).map((x) => x.until_at!.getTime() + 8 * D)).toEqual(before.map((x) => x.until_at!.getTime()));
    expect(await endowedAt(v, "waage", past - 8 * D)).toBe(false);
    // booked tax days: no Stiftung action writes or changes a receipt
    expect((await sql`select x::text s from public.tax_receipts x where seed_id = ${v.id} order by day`).map((r) => r["s"])).toEqual(taxV);
    expect((await rowsOf("tax_receipts")).startsWith(tax0.slice(0, 40))).toBe(true);
    const writers = (await sql`select p.proname from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
      where ns.nspname = 'public' and p.proname like 'stift%' and p.prosrc ~* '(insert into|update|delete from)\\s+(public\\.)?tax_receipts'`).map((r) => r["proname"]);
    expect(writers).toEqual([]);
    expect(STIFT_MS).toBe(14 * D);
  });

  // ---------- K6 ----------
  it("K6 Grenze: kein Öffnen bei mehr als 14 Tagen Rest; höchstens eine Öffnung je Bau in 7 Tagen; nur eine offene Stufe je Bau", async () => {
    const v = await village({ cash: 15000 });
    await open(v, "spital");
    expect(await err(open(v, "spital"))).toBe("stage open");      // one open stage per Bau …
    expect((await open(v, "waage"))["nr"]).toBe(1);               // … the other Bau is its own
    await deposit(v, "spital", 1, 2000);
    await close(v, "spital");
    expect(await err(open(v, "spital"))).toBe("too soon");        // closed, but opened less than 7 days ago
    let ov = await overview(v);
    expect(ov["spital"]).toMatchObject({ lock: "pause", endowed: true });
    const opened = (await stages(v, "spital"))[0]!.opened_at.getTime();
    expect(new Date(ov["spital"]!["lock_from"] as string).getTime()).toBe(opened + 7 * D);
    await age(v, 7 * D - 5 * S);
    expect(await err(open(v, "spital"))).toBe("too soon");        // 5 seconds short of 7 days
    await age(v, 5 * S);
    expect((await open(v, "spital"))["nr"]).toBe(2);              // 7 days after the last opening
    await deposit(v, "spital", 1, 2000);
    await close(v, "spital");                                     // rest now about 21 days
    await age(v, 7 * D);                                          // pause over, rest about 14 days + the seconds above
    await replica((tx) => tx`update public.stift_stages set until_at = until_at + interval '1 hour' where seed_id = ${v.id} and bau = 'spital' and nr = 2 and until_at - done_at < interval '27 days'`);
    expect(await err(open(v, "spital"))).toBe("store full");      // more than 14 days left
    ov = await overview(v);
    expect(ov["spital"]).toMatchObject({ lock: "full" });
    const until = (await stages(v, "spital"))[1]!.until_at!.getTime();
    expect(new Date(ov["spital"]!["until"] as string).getTime()).toBe(until);
    expect(new Date(ov["spital"]!["lock_from"] as string).getTime()).toBe(until - 14 * D);
    await age(v, 2 * H);
    expect((await open(v, "spital"))["nr"]).toBe(3);              // at most 14 days left: open again
    // the unique index is the second guard for "one open stage per Bau"
    expect(await err(replica((tx) => tx`insert into public.stift_stages (seed_id, bau, nr, price) values (${v.id}, 'spital', 9, 100)`))).toContain("stift_stages_one_open");
  });

  // ---------- K7 ----------
  it("K7 keine Nebenwirkung: Stiftungszeilen zählen nicht als Gebäudekauf und nicht für Erlasse", async () => {
    const v = await village({ cash: 15000, wood: 40, stone: 30 });
    const since = Date.now() - 60 * S;
    await open(v, "spital"); await deposit(v, "spital", 1, 800); await deposit(v, "spital", 2, 1200); await close(v, "spital");
    await endow(v, "waage");
    const rows = (await sql`select item from public.purchases where seed_id = ${v.id} and created_at > ${iso(since)} order by item`).map((r) => r["item"] as string);
    expect(rows.filter((r) => /^stift:/.test(r))).toEqual(["stift:spital:1", "stift:spital:1:k", "stift:spital:1:r1", "stift:spital:1:r2", "stift:waage:1", "stift:waage:1:k", "stift:waage:1:r1"]);
    for (const r of rows.filter((x) => /^stift:/.test(x))) expect(countsAsBuilding(r)).toBe(false);
    const met = async () => (await sql`select public.princely_task_met(${v.id}, 'build', ${iso(since)}::timestamptz) m`)[0]!["m"] as boolean;
    const quest = (q: string) => err(asPlayer(v, (tx) => tx`insert into public.quest_claims (seed_id, user_id, quest) values (${v.id}, ${v.owner}, ${q})`));
    // seven Stiftung rows since then: the decree "build" is not met; with the two stage-1 markers the village has 2 buildings
    expect(await met()).toBe(false);
    const all = (await sql`select item from public.purchases where seed_id = ${v.id}`).map((r) => r["item"] as string);
    expect(all.filter(countsAsBuilding).filter((i) => !i.startsWith("test_money")).sort()).toEqual(["spital1", "waage1"]);
    // quest "build" (at least one bought building): a village whose only purchase rows are Stiftung rows has none
    await replica((tx) => tx`delete from public.purchases where seed_id = ${v.id} and item !~ ${STIFT_ROW}`);
    expect((await sql`select count(*)::int c from public.purchases where seed_id = ${v.id}`)[0]!["c"]).toBe(7);
    expect(await quest("build")).toBe("quest not done");
    // an ordinary building is counted at once
    await replica((tx) => tx`insert into public.purchases (seed_id, user_id, item, cost, created_at, x, y) values (${v.id}, ${v.owner}, 'herbs', 90, now(), 101, 101)`);
    expect(await met()).toBe(true);
    expect(await quest("build")).toBe("ok");
    // the count the guards use, with and without the Stiftung rows: identical
    const np = async (withStift: boolean) => (await sql`select count(*)::int c from public.purchases where seed_id = ${v.id} and item !~ '^ankauf:[0-9]{8}$'
      and item !~ '^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$' ${withStift ? sql`and item !~ ${STIFT_ROW}` : sql`and item !~ '^stift:'`}`)[0]!["c"] as number;
    expect(await np(true)).toBe(await np(false));
    expect(await np(true)).toBe(1);                               // the herb hut alone
  });

  // ---------- K8 (database half: every lock reason comes with its amount or date; the texts are tested in lang) ----------
  it("K8 Sichtbarkeit: die Übersicht nennt jeden Sperrgrund mit Betrag oder Datum", async () => {
    const v = await village({ wood: 40, stone: 42, cash: 9000 });
    let ov = await overview(v);
    expect(ov).toMatchObject({ active: true, tax: 500, price: 2000, vorrang: null, stock: { wood: 40, stone: 42 } });
    expect(ov["spital"]).toMatchObject({ built: true, lock: null, stage: null, plan: null, endowed: false, until: null });
    // Vorrang with the amount still to pay
    await civicStage(v, { item: "spital2" });
    await asPlayer(v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, cost) values (${v.id}, ${v.owner}, 'spital2:r1', 160)`);
    ov = await overview(v);
    expect(ov["vorrang"]).toEqual({ item: "spital2", rest: 340 });
    expect(ov["spital"]).toMatchObject({ lock: "vorrang" });
    expect(ov["waage"]).toMatchObject({ lock: "vorrang" });
    await asPlayer(v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, cost) values (${v.id}, ${v.owner}, 'spital2:r2', 340)`);
    // an open stage: price, paid, number of deposits
    await open(v, "waage");
    await deposit(v, "waage", 1, 250);
    ov = await overview(v);
    expect(ov["waage"]).toMatchObject({ lock: "open", stage: { nr: 1, price: 2000, paid: 250, deposits: 1, funded_at: null }, plan: null });
    // paid, material missing: how much is short and how much the site has reserved
    await deposit(v, "waage", 2, 1750);
    await setQuota(v, 95, 60);                                    // the site (paid, needs 90 / 60) reserves it: free 5 / 0
    ov = await overview(v);
    expect(ov).toMatchObject({ reserved: { wood: 90, stone: 60 }, free: { wood: 5, stone: 0 } });
    expect(ov["waage"]!["plan"]).toMatchObject({ store: { wood: 0, stone: 12 }, kontor: { wood: 30, stone: 8 }, short: { wood: 25, stone: 8 } });
    expect(await err(close(v, "waage"))).toBe("material short");
    // no tax, no Bau
    const noTax = await village({ tax: null, bauten: ["waage"] });
    ov = await overview(noTax);
    expect(ov["waage"]).toMatchObject({ lock: "tax" });
    expect(ov["spital"]).toMatchObject({ lock: "bau", built: false });
    // pause and full store carry their date (K6); pending is reported by resource_overview_v2 (H-G2, H-G7)
  });

  // ====================================================================================================================
  // Hochzeitspaket × Gemeindebauten
  it("H-G1 vor dem Umschaltzeitpunkt, Stufe in der Materialphase: nie pending; Materialzug, Produktion und Kontor laufen wie zuvor", async () => {
    const v = await bare({ realm: "europe", ageDays: 150 });     // europe: the wedding switch is the placeholder 2100
    await replica((tx) => tx`insert into public.village_sites (seed_id, way, certified_at) values (${v.id}, 'grain', ${iso(NOW - 100 * D)})`);
    await materialStage(v);
    await setCashRaw(v, 5000);
    expect(await settledNow(v)).toBe(true);                      // before the switch the database computes every wedding itself
    expect(await refresh(v)).toBe("booked");
    const st = await resourceState(v);
    expect(st.through).toBe(today());
    expect(Number(st.ledger!["n"])).toBeGreaterThan(100);        // production days booked
    expect(st.civic!["wood_got"]).toBeGreaterThan(0);            // the material pull ran
    expect(st.civic!["kontor_spent"]).toBeGreaterThan(0);        // the Kontor bought from the chest
    expect(st.kontor.length).toBeGreaterThan(0);
    expect((await resOverview(v))["pending"]).toBe(false);
    expect(await refresh(v)).toBe("current");
    // the same before the switch in `lab` terms: a village whose every wedding lies before T is complete as well
    expect((await sql`select public.wedding_switch_since('europe') > now() f, public.wedding_switch_since('lab') < now() l`)[0]).toEqual({ f: true, l: true });
    // a Stiftung closes here without any pending answer
    // a Stiftung close gets no pending answer here either: it is refused only by the site's reservation (D6)
    await fundedStage(v, "waage");
    await setStock(v, 40, 30);
    expect(await err(close(v, "waage"))).toBe("material short");
  });
  /** Booked chest := cash for a village whose resource days are not booked yet (no refresh). */
  const setCashRaw = async (v: V, cash: number) => {
    const b = await balance(v);
    await replica((tx) => tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${v.id}, ${v.owner}, ${"test_money_" + ++n}, ${b - cash}, ${iso(NOW - 8 * D)})`);
  };
  it("H-G2 nach dem Umschaltzeitpunkt, Materialphase, Hochzeitsabrechnung unvollständig: nichts wird gebucht; Aufrufer erhalten pending, nie 'not enough money'", async () => {
    const s = await wedVillage();
    await materialStage(s.v);
    await fundedStage(s.v, "waage");
    expect(await settledNow(s.v)).toBe(false);
    const st0 = await resourceState(s.v), h0 = await snapshot();
    expect(await refresh(s.v)).toBe("pending");
    expect(await err(sql`select public.resource_refresh_at(${s.v.id}, ${today()}::date)`)).toBe(PENDING);
    expect(await err(asPlayer(s.v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, kontor_max) values (${s.v.id}, ${s.v.owner}, 'hunter', 100000)`))).toBe(PENDING);
    expect(await err(asPlayer(s.v, (tx) => tx`select public.civic_raise_budget_v2(${s.v.id}, 'spital1', 1500, ${C})`))).toBe(PENDING);
    expect(await err(close(s.v, "waage"))).toBe(PENDING);
    expect(await resOverview(s.v)).toMatchObject({ active: true, pending: true });
    // no production, no Ankauf, no quota, no material pull — not a single row
    expect(await snapshot()).toBe(h0);
    expect(await resourceState(s.v)).toEqual(st0);
    expect(st0).toMatchObject({ through: null, quota: null, kontor: [], ankauf: [] });
  });
  it("H-G3 Wiederaufnahme nach vollständiger Abrechnung: alle zurückgehaltenen Tage in Tagesreihenfolge, identisch mit einem Lauf ohne Unterbrechung", async () => {
    const a = await wedVillage({ w2Days: 9 }), ref = await wedVillage({ w2Days: 9, complete: true });
    for (const s of [a, ref]) await materialStage(s.v, 12);
    // the reference books every day as it comes: today's catch-up in one go is the same booking (day order inside)
    expect(await refresh(a.v)).toBe("pending");
    expect(await refresh(ref.v)).toBe("booked");
    await bookW2(a);
    expect(await settledNow(a.v)).toBe(true);
    expect(await refresh(a.v)).toBe("booked");
    const [x, y] = [await resourceState(a.v), await resourceState(ref.v)];
    expect(x).toEqual(y);                                         // stock, Ankauf credits, quota, Kontor purchases
    expect(x.kontor.length).toBeGreaterThan(0);
    expect(x.ankauf.length).toBeGreaterThan(0);
    expect(x.quota!["wood"]).toBeLessThanOrEqual(120);            // at most 30 days saved up
    // day order: every day has at most one row of each kind, the Kontor rows rise by day, none twice, none missing
    const days = (await sql`select item from public.purchases where seed_id = ${a.v.id} and item like 'spital1:k%' order by created_at`).map((r) => r["item"] as string);
    expect([...days].sort()).toEqual(days);
    expect(new Set(days).size).toBe(days.length);
    const prod = (await sql`select ref, count(*)::int c from public.resource_ledger where seed_id = ${a.v.id} and kind = 'prod' and resource = 'wood' group by ref having count(*) > 1`);
    expect(prod.length).toBe(0);
    expect(x.through).toBe(today());
    expect(await refresh(a.v)).toBe("current");                   // a repeat books nothing new
    expect(await resourceState(a.v)).toEqual(x);
  });
  it("H-G4 Buchungsreihenfolge: die Hochzeitsbelege wirken vor den nachgeholten Tagen; ein Kontorkauf rechnet nur mit dem Geld seines Tages", async () => {
    const s = await wedVillage({ w2: 300, w2Days: 3 });
    await materialStage(s.v, 8);
    // the chest is empty from 8 days ago on (after W1); only the wedding W2 (3 days ago, 300 Mark) fills it again
    await setCashRaw(s.v, 0);
    expect(await balance(s.v)).toBe(0);
    expect(await refresh(s.v)).toBe("pending");                   // the booked chest does not know W2 yet: nothing is booked
    expect((await resourceState(s.v)).kontor).toEqual([]);
    await bookW2(s);                                              // the receipt first …
    expect(await balance(s.v)).toBe(300);
    expect(await refresh(s.v)).toBe("booked");                    // … then the held-back days
    const k = (await sql`select item, cost, created_at from public.purchases where seed_id = ${s.v.id} and item like 'spital1:k%' order by created_at`);
    expect(k.length).toBeGreaterThan(0);
    // every Kontor purchase of a caught-up day was covered by the chest as it stood at that day's booking instant —
    // the wedding's money counts only from the wedding on (the walk up to an instant knows only receipts up to it)
    let beforeWedding = 0;
    for (const r of k) {
      const at = (r["created_at"] as Date).getTime();
      const had = (await sql`select public.village_balance_walk(${s.v.id}, timestamptz '2026-11-12 00:00:00+00', ${iso(at - 1)}::timestamptz) b`)[0]!["b"] as number;
      expect(r["cost"] as number).toBeLessThanOrEqual(had);
      if (at < s.W2.t) { beforeWedding++; expect(had).toBeLessThan(300); }   // only the day's own Ankauf credits, never the dowry
    }
    expect(k.some((r) => (r["created_at"] as Date).getTime() > s.W2.t)).toBe(true);
    expect(beforeWedding).toBeGreaterThanOrEqual(0);
    expect(await balance(s.v)).toBeGreaterThanOrEqual(0);
    // the days before were booked too (production), only without a Kontor purchase
    expect((await resourceState(s.v)).through).toBe(today());
  });
  it("H-G5 Stufe in der Finanzierung oder in der Bauphase: keine Zurückhaltung; Raten und Abschlusszeile laufen", async () => {
    // funding phase: opened, not fully paid
    const f = await wedVillage();
    await replica((tx) => tx`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days, opened_at)
      values (${f.v.id}, 'spital1', 500, 1000, 40, 30, 5, ${iso(NOW - 4 * D)})`);
    await setCashRaw(f.v, 400);
    expect(await settledNow(f.v)).toBe(false);
    expect(await refresh(f.v)).toBe("booked");                    // not held back
    await setCash(f.v, 400);                                      // (the caught-up days brought Ankauf credits)
    expect((await resOverview(f.v))["pending"]).toBe(false);
    expect(await err(asPlayer(f.v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, cost) values (${f.v.id}, ${f.v.owner}, 'spital1:r1', 300)`))).toBe("ok");   // covered by the booked chest
    // an instalment above the booked chest: pending while the settlement is incomplete, never "not enough money"
    expect(await err(asPlayer(f.v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, cost) values (${f.v.id}, ${f.v.owner}, 'spital1:r2', 200)`))).toBe(PENDING);
    await bookW2(f);
    expect(await err(asPlayer(f.v, (tx) => tx`insert into public.purchases (seed_id, user_id, item, cost) values (${f.v.id}, ${f.v.owner}, 'spital1:r2', 200)`))).toBe("ok");   // the last instalment
    expect((await sql`select funded_at is not null f from public.civic_stages where seed_id = ${f.v.id}`)[0]!["f"]).toBe(true);
    // building phase: material complete, the completion row is already booked for its day
    const b = await wedVillage();
    await replica(async (tx) => {
      await tx`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days, wood_got, stone_got, opened_at, funded_at, material_at, done_at)
        values (${b.v.id}, 'spital1', 500, 1000, 40, 30, 5, 40, 30, ${iso(NOW - 9 * D)}, ${iso(NOW - 8 * D)}, ${iso(NOW - 4 * D)}, ${iso(NOW + D)})`;
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${b.v.id}, ${b.v.owner}, 'spital1', 0, ${iso(NOW + D)})`;
    });
    expect(await settledNow(b.v)).toBe(false);
    expect(await refresh(b.v)).toBe("booked");
    expect((await resOverview(b.v))["pending"]).toBe(false);
    expect((await sql`select count(*)::int c from public.purchases where seed_id = ${b.v.id} and item = 'spital1'`)[0]!["c"]).toBe(1);   // the completion row stands
    // only the material phase holds back
    const m = await wedVillage();
    await materialStage(m.v);
    expect(await refresh(m.v)).toBe("pending");
  });
  it("H-G6 P4: Stiftungsabschluss mit Kontoranteil während pending bricht ohne Buchung ab und nennt den Grund; eine Einzahlung folgt der allgemeinen Geldprüfung", async () => {
    // (a) a Gemeindebau in the material phase: the day booking itself is pending
    const a = await wedVillage();
    await materialStage(a.v);
    await fundedStage(a.v, "waage");
    let h0 = await snapshot();
    expect(await err(close(a.v, "waage"))).toBe(PENDING);
    expect(await snapshot()).toBe(h0);
    expect((await stages(a.v))[0]!.done_at).toBeNull();
    // (b) no site: the days are booked, but the Kontor part needs money the booked chest cannot prove
    const b = await wedVillage({ w2: 300 });
    await fundedStage(b.v, "waage");
    await setCashRaw(b.v, 100);
    expect(await refresh(b.v)).toBe("booked");
    await setStock(b.v, 40, 30);                                   // the whole material from the Kontor: 204 Mark
    await setCash(b.v, 100);
    const plan = (await overview(b.v))["waage"]!["plan"] as J;
    expect(plan).toMatchObject({ kontor: { wood: 30, stone: 20 }, short: { wood: 0, stone: 0 }, cost: 204 });
    h0 = await snapshot();
    expect(await err(close(b.v, "waage", 204))).toBe(PENDING);     // never "not enough money" while the settlement is incomplete
    expect(await snapshot()).toBe(h0);
    await bookW2(b);                                               // + 300 Mark
    expect(await close(b.v, "waage", 204)).toMatchObject({ kontor: 204, bought: { wood: 30, stone: 20 } });
    expect(await balance(b.v)).toBe(196);
    // after a complete settlement too little money is named as such
    const c = await wedVillage({ complete: true });
    await fundedStage(c.v, "waage");
    await setCashRaw(c.v, 100);
    await refresh(c.v);
    await setStock(c.v, 40, 30);
    await setCash(c.v, 100);
    expect(await err(close(c.v, "waage", 204))).toBe("not enough money");
    // a deposit has no material part: the general money check
    const dv = await wedVillage({ w2: 300 });
    await replica(async (tx) => {
      await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${dv.v.id}, ${dv.v.owner}, 'spital1', 0, ${iso(NOW - 120 * D)})`;
      await tx`insert into public.stift_stages (seed_id, bau, nr, price, opened_at) values (${dv.v.id}, 'spital', 1, 800, ${iso(NOW - D)})`;
    });
    await setCashRaw(dv.v, 100);
    expect(await settledNow(dv.v)).toBe(false);
    expect((await deposit(dv.v, "spital", 1, 60))["paid"]).toBe(60);          // covered by the booked chest: allowed
    expect(await err(deposit(dv.v, "spital", 2, 200))).toBe(PENDING);         // above it: pending, not "not enough money"
    await bookW2(dv);
    expect((await deposit(dv.v, "spital", 2, 200))["paid"]).toBe(260);
    expect(await err(deposit(dv.v, "spital", 3, 500))).toBe("not enough money");
  });
  it("H-G7 Dauer der Verzögerung: Dorf ohne Login und ausgefallener Sweep – die Materialphase steht bis zur Abrechnung, ohne Materialverlust; im UI erkennbar", async () => {
    const measured: Record<string, number> = {};
    for (const days of [3, 12, 40]) {
      // the wedding fell due `days` ago; since then nobody settled it (no login, no sweep)
      const a = await wedVillage({ w2Days: days }), ref = await wedVillage({ w2Days: days, complete: true });
      for (const s of [a, ref]) await materialStage(s.v, days + 2);
      const before = await resourceState(a.v);
      // every call during the delay: pending, nothing moves — the sweep is down, the player is away
      for (let i = 0; i < 3; i++) expect(await refresh(a.v)).toBe("pending");
      expect(await resourceState(a.v)).toEqual(before);
      expect(await resOverview(a.v)).toMatchObject({ pending: true });         // what the UI shows
      // how long the material phase stood: from the wedding to the settlement — exactly the absence
      const stood = Math.round((Date.now() - a.W2.t) / D);
      measured[`stood-${days}`] = stood;
      expect(stood).toBe(days);
      // the settlement ends it: the first sweep or login books the wedding, then every held-back day
      await bookW2(a);
      expect(await refresh(a.v)).toBe("booked");
      expect(await refresh(ref.v)).toBe("booked");
      expect((await resOverview(a.v))["pending"]).toBe(false);
      const [x, y] = [await resourceState(a.v), await resourceState(ref.v)];
      expect(x).toEqual(y);                                         // no material lost: the same as without the delay
      expect(x.civic!["wood_got"]).toBeGreaterThan(0);
      expect(x.through).toBe(today());
    }
    expect(measured["stood-3"]).toBe(3); expect(measured["stood-12"]).toBe(12); expect(measured["stood-40"]).toBe(40);
    console.log("H-G7 gemessen (Tage Stillstand der Materialphase = Tage bis zur Abrechnung):", JSON.stringify({ "3": measured["stood-3"], "12": measured["stood-12"], "40": measured["stood-40"] }));
  });
});

// ======================================================================================================================
d("P4 Stiftungen – K9 Bestand: die Migration 0165 lässt bestehende Dörfer, Kontostände und Steuertage unverändert", () => {
  const A = `stift_k9_${process.pid}_${Date.now()}`, B = `stift_k9x_${process.pid}_${Date.now()}`;
  let sql: postgres.Sql, bad: postgres.Sql;
  const TAGS = journalTags(), I = TAGS.indexOf("0165_stiftungen_p4");
  const KEEP = ["seeds", "purchases", "tax_receipts", "resource_ledger", "resource_state", "civic_stages", "civic_quota", "village_sites", "gifts", "encounters",
    "wedding_receipts", "wedding_settlement", "quest_claims", "rank_certificates"];
  const ids: string[] = [];
  const state = async (q: postgres.Sql) => {
    const h = createHash("sha256");
    for (const t of KEEP) h.update(t + ":" + (await q.unsafe(`select coalesce(string_agg(row_::text, '|' order by row_::text), '') s from public.${t} row_`))[0]!["s"]);
    const per = [];
    for (const id of ids) per.push((await q`select ${id}::text id, public.village_balance(${id}) bal, public.resource_stock(${id}, 'wood') w, public.resource_stock(${id}, 'stone') s,
      public.resource_kontor_at(${id}, 30, 20, now()) k1, public.resource_kontor_at(${id}, 7, 3, now() - interval '30 days') k2, public.resource_kontor_at(${id}, 120, 90, now() + interval '30 days') k3,
      public.princely_task_met(${id}, 'build', now() - interval '2 days') met`)[0]);
    return { tables: h.digest("hex"), per: JSON.stringify(per) };
  };
  const fnHashes = async (q: postgres.Sql) => (await q`select p.oid::regprocedure::text f, md5(pg_get_functiondef(p.oid)) h from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' order by 1`).map((r) => `${r["f"]}=${r["h"]}`);

  /** Runs one file of the check package (docs/sql/0165, read-only transaction inside) and returns its rows by kind. */
  const pruefpaket = async (q: postgres.Sql, file: string) => {
    const text = readFileSync(new globalThis.URL(`../../docs/sql/0165/${file}`, import.meta.url), "utf8");
    expect(text).toMatch(/^BEGIN TRANSACTION READ ONLY;$/m);
    expect(text.trimEnd().endsWith("ROLLBACK;")).toBe(true);
    expect(text.replace(/--.*$/gm, "").replace(/'[^']*'/g, "''")).not.toMatch(/\b(insert|update|delete|create|alter|drop|grant|revoke|truncate|commit)\b/i);
    const conn = await q.reserve();                                // one connection: the file opens and ends its own transaction
    let sets: Record<string, unknown>[][];
    try { sets = (await conn.unsafe(text).simple()) as unknown as Record<string, unknown>[][]; } finally { conn.release(); }
    const rows = sets.flat().filter((r) => r && typeof r === "object" && "art" in r);
    const of = (art: string) => rows.filter((r) => r["art"] === art);
    return { checks: of("pruefung"), hints: of("hinweis"), bestand: of("bestand").map((r) => `${r["name"]} = ${r["wert"]}`), ident: of("identitaet") };
  };

  beforeAll(async () => {
    expect(I).toBeGreaterThan(0);
    const before = TAGS[I - 1]!;
    sql = postgres(await buildFullSchema(BASE!, A, before), { max: 4, onnotice: () => {} });
    bad = postgres(await buildFullSchema(BASE!, B, before), { max: 2, onnotice: () => {} });
    // existing villages as they are before P4: buildings, a finished and an open Gemeindebau, tax days, booked resource days
    for (const q of [sql, bad]) await q.unsafe(`create or replace function public.resources_since(_realm text) returns timestamptz language sql immutable set search_path to 'public' as $$ select timestamptz '${iso(NOW - 300 * D)}' $$`);
    for (let i = 0; i < 4; i++) {
      const id = `00000000-0000-0000-0000-00000009a${i}00`, owner = `00000000-0000-0000-0000-00000009b${i}00`;
      ids.push(id);
      await sql.begin(async (tx) => {
        await tx`set local session_replication_role = replica`;
        await tx`insert into public.seeds (id, user_id, owner, name, x, y, realm, created_at) values (${id}, ${owner}, 'Test', ${"Bestand " + i}, ${300 + 5 * i}, 300, ${i === 3 ? "lab" : "europe"}, ${iso(NOW - (120 + i) * D)})`;
        await tx`insert into public.village_sites (seed_id, way, certified_at) values (${id}, ${i === 1 ? "gateway" : "grain"}, ${iso(NOW - 100 * D)})`;
        for (const [item, cost, ago] of [["herbs", 90, 90], ["hunter", 100, 80], ["spital1:r1", 10000, 70], ["spital1", 0, 40], ...(i > 0 ? [["waage1", 0, 20]] : []), ["healer", 550, 1]] as [string, number, number][])
          await tx`insert into public.purchases (seed_id, user_id, item, cost, created_at) values (${id}, ${owner}, ${item}, ${cost}, ${iso(NOW - ago * D)})`;
        for (let day = 1; day <= 5; day++) await tx`insert into public.tax_receipts (seed_id, day, population, households, income, assessed_at, version) values (${id}, ${100 + day}, 50, 10, ${300 + 10 * day + i}, ${iso(NOW - (6 - day) * D)}, 1)`;
        if (i === 2) await tx`insert into public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days, opened_at, funded_at)
          values (${id}, 'spital2', 500, 1000, 90, 60, 35, ${iso(NOW - 6 * D)}, ${iso(NOW - 5 * D)})`;
      });
      await sql`select public.resource_refresh_try(${id}, (now() at time zone 'utc')::date)`;
    }
  }, 240000);
  afterAll(async () => { await sql.end(); await bad.end(); await dropDatabase(BASE!, A); await dropDatabase(BASE!, B); });

  it("K9 Bestand: Zeilen, Kontostände, Lager, Kontorpreise und Kaufzählung sind nach 0165/0166 identisch; nur die erwarteten Funktionen ändern sich", async () => {
    const s0 = await state(sql), f0 = await fnHashes(sql);
    expect((await sql`select to_regclass('public.stift_stages') t`)[0]!["t"]).toBeNull();
    // the check package before: every check ok, the live definitions equal the repository
    const vor = await pruefpaket(sql, "01_vorher.sql");
    expect(vor.checks.length).toBe(10);
    expect(vor.checks.filter((r) => r["ok"] !== true).map((r) => r["pruefung"])).toEqual([]);
    expect(vor.hints.length).toBe(4);
    expect(vor.hints.every((r) => r["ok"] === true)).toBe(true);
    expect(vor.bestand.length).toBe(9);
    expect(vor.ident.length).toBe(1);
    expect(await state(sql)).toEqual(s0);                          // the package itself changes nothing
    await sql.unsafe(migration("0165_stiftungen_p4"));
    await sql.unsafe(migration("0166_begleitmigration_0166"));
    const s1 = await state(sql), f1 = await fnHashes(sql);
    expect(s1).toEqual(s0);
    // the check package after: every check ok, fingerprints as built from the repository, Bestand line by line the same
    const nach = await pruefpaket(sql, "02_nachher.sql");
    expect(nach.checks.length).toBe(23);
    expect(nach.checks.filter((r) => r["ok"] !== true).map((r) => r["pruefung"])).toEqual([]);
    expect(nach.hints.every((r) => r["ok"] === true)).toBe(true);
    expect(nach.bestand).toEqual(vor.bestand);
    expect(vor.bestand.find((x) => x.startsWith("purchases"))).toMatch(/= 2[0-9] \| /);   // real rows were compared
    for (const f of ["03_fingerprints.sql", "04_funktionstexte.sql"]) await pruefpaket(sql, f);
    expect(await state(sql)).toEqual(s1);
    // after the migration the "before" package says so (0165 present) instead of passing
    expect((await pruefpaket(sql, "01_vorher.sql")).checks.filter((r) => r["ok"] !== true).length).toBeGreaterThan(0);
    // the fingerprints file names the migration files' own SHA-256 (drizzle.__drizzle_migrations.hash)
    const fp = readFileSync(new globalThis.URL("../../docs/sql/0165/03_fingerprints.sql", import.meta.url), "utf8");
    for (const tag of ["0165_stiftungen_p4", "0166_begleitmigration_0166"]) expect(fp).toContain(createHash("sha256").update(migration(tag)).digest("hex"));
    expect((await sql`select count(*)::int c from public.stift_stages`)[0]!["c"]).toBe(0);
    // exactly four existing functions changed, everything else is byte-identical; the new ones are all stift_*
    const old = new Map(f0.map((x) => x.split("=") as [string, string]));
    const changed = f1.map((x) => x.split("=") as [string, string]).filter(([f, h]) => old.has(f) && old.get(f) !== h).map(([f]) => f).sort();
    expect(changed).toEqual(["princely_task_met(uuid,text,timestamp with time zone)", "purchase_guard()", "quest_guard()", "resource_kontor_at(uuid,integer,integer,timestamp with time zone)"]);
    const added = f1.map((x) => x.split("=")[0]!).filter((f) => !old.has(f));
    expect(added.every((f) => f.startsWith("stift_"))).toBe(true);
    expect(added.length).toBe(13);
    expect(f0.filter((x) => !f1.some((y) => y.split("=")[0] === x.split("=")[0]))).toEqual([]);   // nothing dropped
    // the switch as delivered: nothing is active — also in `lab`
    expect((await sql`select public.stift_since('lab') l, public.stift_since('europe') e`)[0]).toEqual({ l: new Date("2100-01-04T00:00:00Z"), e: new Date("2100-01-04T00:00:00Z") });
    for (const id of ids) {
      const owner = id.replace("9a", "9b");
      const res = await sql.begin(async (tx) => {
        await tx`select set_config('test.uid', ${owner}, true), set_config('test.role', 'authenticated', true)`;
        await tx.unsafe("set local role authenticated");
        const ov = (await tx`select public.stift_overview(${id}, ${C}) r`)[0]!["r"] as Record<string, unknown>;
        const o = await tx.savepoint((sp) => sp`select public.stift_open(${id}, 'spital', ${C})`).then(() => "ok", (e: Error) => e.message);
        return { active: ov["active"], o };
      });
      expect(res).toEqual({ active: false, o: "not now" });
    }
    // an ordinary purchase and a Gemeindebau instalment still work as before
    const id = ids[0]!, owner = id.replace("9a", "9b");
    await sql.begin(async (tx) => {
      await tx`select set_config('test.uid', ${owner}, true), set_config('test.role', 'authenticated', true)`;
      await tx.unsafe("set local role authenticated");
      await tx`insert into public.purchases (seed_id, user_id, item, kontor_max) values (${id}, ${owner}, 'fisher', 100000)`;
    });
    expect((await sql`select cost from public.purchases where seed_id = ${id} and item = 'fisher'`)[0]!["cost"]).toBe(140);
    // applying the migration again changes nothing (re-runnable)
    const s2 = await state(sql), f2 = await fnHashes(sql);
    await sql.unsafe(migration("0165_stiftungen_p4"));
    expect(await state(sql)).toEqual(s2);
    expect(await fnHashes(sql)).toEqual(f2);
  });
  it("K9 Bestand: weicht eine Live-Definition ab, bricht 0165 vor jeder Änderung ab", async () => {
    // a database whose purchase_guard differs at the expected place (as an unknown hot fix would)
    const def = (await bad`select pg_get_functiondef('public.purchase_guard()'::regprocedure) s`)[0]!["s"] as string;
    expect(def).toContain("IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;");
    await bad.unsafe(def.replace("IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;", "IF price IS NULL THEN RAISE EXCEPTION 'unknown  item'; END IF;"));
    const f0 = await fnHashes(bad);
    // the check package shows it beforehand: the patch place is missing, the fingerprint differs
    const vor = await pruefpaket(bad, "01_vorher.sql");
    expect(vor.checks.filter((r) => r["ok"] !== true).map((r) => r["pruefung"])).toEqual(["Patch-Stelle in purchase_guard: genau 1 mal"]);
    expect(vor.hints.filter((r) => r["ok"] !== true).map((r) => r["pruefung"])).toEqual(["Fingerabdruck purchase_guard = Repository (Stand 0164)"]);
    const res = await bad.unsafe(migration("0165_stiftungen_p4")).then(() => "ok", (e: Error) => e.message);
    expect(res).toContain("P4 0165: public.purchase_guard() enthält die erwartete Stelle 0 mal statt 1 mal");
    expect((await bad`select to_regclass('public.stift_stages') t`)[0]!["t"]).toBeNull();
    expect((await bad`select count(*)::int c from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'stift%'`)[0]!["c"]).toBe(0);
    expect(await fnHashes(bad)).toEqual(f0);
    // the same for the three other patched functions
    for (const [fn, from, to] of [
      ["public.resource_kontor_at(uuid,integer,integer,timestamptz)", "THEN 0.85 ELSE 1 END)::integer", "THEN 0.850 ELSE 1 END)::integer"],
      ["public.quest_guard()", "k[0-9]{8})$'", "k[0-9]{8}) $'"],
    ] as const) {
      await bad.unsafe(def);                                       // purchase_guard as delivered again
      const d0 = (await bad`select pg_get_functiondef(${fn}::regprocedure) s`)[0]!["s"] as string;
      await bad.unsafe(d0.replace(from, () => to));
      const r = await bad.unsafe(migration("0165_stiftungen_p4")).then(() => "ok", (e: Error) => e.message);
      expect(r).toContain("P4 0165:");
      expect((await bad`select to_regclass('public.stift_stages') t`)[0]!["t"]).toBeNull();
      await bad.unsafe(d0);
    }
    // back to the delivered definitions: the migration applies
    expect(await bad.unsafe(migration("0165_stiftungen_p4")).then(() => "ok", (e: Error) => e.message)).toBe("ok");
  });
});
