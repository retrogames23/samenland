// Runs against a real, throw-away PostgreSQL (BUILD_MAIL_TEST_PG=postgres://...) with the exact outbox SQL.
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runOutbox, type Due, type OutboxRow, type OutboxStore } from "./build-mail-outbox";
import { buildMailDue, enqueueWindow, MAIL_SINCE } from "@/game/build-mail";
import { monumentDone, specialDone, specialSites, type Seed } from "@/game/world";

const URL = process.env["BUILD_MAIL_TEST_PG"];
// In CI (CI or REQUIRE_PG set) a missing test DB is a failure, never a silent skip.
if (!URL && (process.env["CI"] || process.env["REQUIRE_PG"])) throw new Error("BUILD_MAIL_TEST_PG missing: outbox DB tests must run");
const d = URL ? describe : describe.skip;
const SQL = readFileSync(new globalThis.URL("../../db/pending/build_mail_outbox.sql", import.meta.url), "utf8");

d("build-mail outbox (real PostgreSQL)", () => {
  const sql = postgres(URL!, { max: 4, onnotice: () => {} });
  const store = (db = sql): OutboxStore => ({
    enqueue: async (x) => (await db`select public.build_mail_enqueue(${x.purchaseId}, ${x.seedId}, ${x.userId}, ${x.item}, ${new Date(x.doneAt)}) as r`)[0]!["r"],
    claim: async (n) => (await db`select * from public.build_mail_claim(${n})`) as unknown as OutboxRow[],
    finish: async (p, t, ok, e) => (await db`select public.build_mail_finish(${p}, ${t}, ${ok}, ${e ?? null}) as r`)[0]!["r"],
  });
  const due = (id: string, item = "school"): Due => ({ purchaseId: id, seedId: "00000000-0000-0000-0000-00000000000a", userId: "00000000-0000-0000-0000-00000000000b", item, doneAt: Date.now() });
  const P1 = "00000000-0000-0000-0000-000000000001";
  const rows = () => sql`select status, attempts, last_error from public.build_mail_outbox order by created_at`;
  let mails: string[] = [];
  const ok = async (r: OutboxRow) => { mails.push(r.purchase_id); return true; };

  beforeAll(async () => {
    await sql.unsafe(`do $$ begin
      if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
      if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
      if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if; end $$;
      drop table if exists public.build_mail_outbox cascade;`);
    await sql.unsafe(SQL);
  });
  beforeEach(async () => { await sql`truncate public.build_mail_outbox`; mails = []; });
  afterAll(async () => { await sql.end(); });

  it("first call: exactly one job", async () => {
    const r = await runOutbox(store(), [due(P1)], ok);
    expect(r.enqueued).toBe(1);
    expect((await rows()).length).toBe(1);
  });

  it("repeated call: no second job, no second mail", async () => {
    await runOutbox(store(), [due(P1)], ok);
    const r = await runOutbox(store(), [due(P1)], ok);
    expect(r.enqueued).toBe(0);
    expect((await rows()).length).toBe(1);
    expect(mails).toEqual([P1]);
  });

  it("two parallel calls: one job, one mail", async () => {
    const a = postgres(URL!, { max: 1 }), b = postgres(URL!, { max: 1 });
    const slow = async (r: OutboxRow) => { await new Promise((z) => setTimeout(z, 50)); return ok(r); };
    const [ra, rb] = await Promise.all([runOutbox(store(a), [due(P1)], slow), runOutbox(store(b), [due(P1)], slow)]);
    await a.end(); await b.end();
    expect(ra.enqueued + rb.enqueued).toBe(1);
    expect(ra.claimed + rb.claimed).toBe(1);
    expect(mails).toEqual([P1]);
    expect((await rows()).map((x) => x["status"])).toEqual(["sent"]);
  });

  it("successful send: status sent, never claimed again", async () => {
    await runOutbox(store(), [due(P1)], ok);
    expect((await rows())[0]!["status"]).toBe("sent");
    for (let i = 0; i < 5; i++) await runOutbox(store(), [due(P1)], ok);
    expect(mails).toEqual([P1]);
  });

  it("failed send: status failed with reason, next run retries exactly once", async () => {
    await runOutbox(store(), [due(P1)], async () => { throw new Error("gateway 503"); });
    expect(await rows()).toEqual([{ status: "failed", attempts: 1, last_error: "gateway 503" }]);
    await runOutbox(store(), [due(P1)], ok);
    expect(await rows()).toEqual([{ status: "sent", attempts: 2, last_error: null }]);
    await runOutbox(store(), [due(P1)], ok);
    expect(mails).toEqual([P1]);
  });

  it("gives up after 5 attempts; manual retry resets, sent rows cannot be reset", async () => {
    const boom = async () => { throw new Error("x"); };
    for (let i = 0; i < 7; i++) await runOutbox(store(), [due(P1)], boom);
    expect((await rows())[0]).toMatchObject({ status: "failed", attempts: 5 });
    expect((await sql`select public.build_mail_retry(${P1}) as r`)[0]!["r"]).toBe(true);
    await runOutbox(store(), [], ok);
    expect((await rows())[0]!["status"]).toBe("sent");
    expect((await sql`select public.build_mail_retry(${P1}) as r`)[0]!["r"]).toBe(false);
  });

  it("crashed worker: expired 'sending' lease is reclaimed, stale token cannot settle", async () => {
    await store().enqueue(due(P1));
    const [stale] = await store().claim(10);
    await sql`update public.build_mail_outbox set claimed_at = now() - interval '11 minutes'`;
    await runOutbox(store(), [], ok);
    expect(await store().finish(P1, stale!.claim_token, false, "late")).toBe(false);
    expect((await rows())[0]!["status"]).toBe("sent");
  });

  it("monument: no job before the whole work stands; one job after", async () => {
    const BUYS = ["20:29:37.295", "20:29:37.300", "20:29:37.302", "20:29:37.304"].map((t) => Date.parse(`2026-11-10T${t}Z`));
    const s: Seed = { id: "m", name: "P", owner: "o", x: 300, y: 300, hue: 0, created_at: "2026-04-24T00:00:00Z",
      bought: BUYS.map((at, i) => ({ item: `belfry${i + 1}`, at, ...(i ? {} : { x: 303, y: 302 }) })) };
    const placed = new Set([...specialSites(s).values()].map((v) => v.at));
    const done = monumentDone(s, [s], "belfry")!, H = 3.6e6;
    const ids = BUYS.map((_, i) => `00000000-0000-0000-0000-00000000010${i}`);
    for (let t = BUYS[0]!; t <= done + 24 * H; t += 15 * 60000) {
      const list = s.bought!.flatMap((b, i) => buildMailDue(s, b.item, b.at, placed, t, 3 * H) ? [{ ...due(ids[i]!, b.item), doneAt: done }] : []);
      if (t < done) expect(list).toEqual([]);
      await runOutbox(store(), list, ok);
    }
    expect(mails).toEqual([ids[3]]);
  });

  it("ordinary building: still mailed once at its finish", async () => {
    const at = Date.parse("2026-11-10T08:00:00Z");
    const s: Seed = { id: "b", name: "P", owner: "o", x: 300, y: 300, hue: 0, created_at: "2026-04-24T00:00:00Z", bought: [{ item: "granary", at, x: 303, y: 302 }] };
    const placed = new Set([...specialSites(s).values()].map((v) => v.at));
    const done = specialDone(s, [s], at)!, H = 3.6e6;
    for (let t = at; t <= done + 24 * H; t += 15 * 60000) {
      const list = buildMailDue(s, "granary", at, placed, t, 3 * H) ? [due(P1, "granary")] : [];
      if (t < done) expect(list).toEqual([]);
      await runOutbox(store(), list, ok);
    }
    expect(mails).toEqual([P1]);
  });

  it("cron down 6 h: every building finished meanwhile gets exactly one job afterwards", async () => {
    const H = 3.6e6, base = Math.max(MAIL_SINCE, Date.parse("2026-11-12T00:00:00Z"));
    const items = ["granary", "school", "smithy", "bakery"];
    const s: Seed = { id: "c", name: "P", owner: "o", x: 300, y: 300, hue: 0, created_at: "2026-04-24T00:00:00Z",
      bought: items.map((item, i) => ({ item, at: base + i * 2 * H, x: 303 + i * 2, y: 302 })) };
    const placed = new Set([...specialSites(s).values()].map((v) => v.at));
    const ids = items.map((_, i) => `00000000-0000-0000-0000-00000000020${i}`);
    const dones = s.bought!.map((b) => specialDone(s, [s], b.at)!);
    const tick = (t: number) => s.bought!.flatMap((b, i) => buildMailDue(s, b.item, b.at, placed, t, enqueueWindow(t)) ? [{ ...due(ids[i]!, b.item), doneAt: dones[i]! }] : []);
    const first = Math.min(...dones), outFrom = first - H, outTo = outFrom + 6 * H;
    let jobs = 0;
    for (let t = base; t <= Math.max(...dones) + 24 * H; t += 15 * 60000) {
      if (t > outFrom && t < outTo) continue; // outage
      jobs += (await runOutbox(store(), tick(t), ok)).enqueued;
    }
    const inOutage = dones.filter((x) => x > outFrom && x < outTo).length;
    expect(inOutage).toBeGreaterThan(0);
    expect(jobs).toBe(items.length);
    expect([...mails].sort()).toEqual([...ids].sort());
    expect((await rows()).every((r) => r["status"] === "sent")).toBe(true);
  });
});
