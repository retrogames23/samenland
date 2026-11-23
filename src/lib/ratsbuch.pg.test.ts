// M1 Paket 2b: runs the real 0139 → 0140 → 0141 migrations (Ratsbuch, encounter_guard) against a throw-away PostgreSQL
// (BUILD_MAIL_TEST_PG=postgres://...). The test creates and drops its own database, so it never touches the tables of
// the other *.pg.test.ts files. Covers P2-Q, P2-6, P2-I, P2-4, P2-A, P2-F, P2-V and the transition (Altbestand).
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const BASE = process.env["BUILD_MAIL_TEST_PG"];
if (!BASE && (process.env["CI"] || process.env["REQUIRE_PG"]))
  throw new Error("BUILD_MAIL_TEST_PG missing: Ratsbuch DB tests must run");
const d = BASE ? describe : describe.skip;
const mig = (f: string) =>
  readFileSync(new globalThis.URL(`../../drizzle/migrations/${f}`, import.meta.url), "utf8");
const M139 = mig("0139_encounters_server_only.sql"),
  M140 = mig("0140_boon_effects.sql"),
  M141 = mig("0141_ratsbuch.sql");

const OWNER = "00000000-0000-0000-0000-0000000000e1",
  OTHER = "00000000-0000-0000-0000-0000000000e2";
const GROWTH: Record<string, string> = {
  journeyman: "host",
  orphan: "adopt",
  widow: "shelter",
  monk: "copy",
  ruin: "shrine",
  surveyor: "map",
};
let n = 0;
const nextSeed = () => `00000000-0000-0000-0000-${(0xe00000 + ++n).toString(16).padStart(12, "0")}`;
const DB = `samenland_ratsbuch_${process.pid}`;

d("Ratsbuch 0141 (real PostgreSQL)", () => {
  const admin = postgres(BASE!, { max: 1, onnotice: () => {} });
  let sql: ReturnType<typeof postgres>;

  /** The cut-over for a test: hours relative to now (negative = in the past); "far" restores the shipped date. */
  const since = (hoursAgo: number | "far") =>
    sql.unsafe(
      `create or replace function public.ratsbuch_since() returns timestamptz language sql stable set search_path to 'public' as $f$ select ${
        hoursAgo === "far"
          ? `'2100-01-04 00:00:00+00'::timestamptz`
          : `now() - interval '${hoursAgo} hours'`
      } $f$`,
    );
  const seed = async (ageDays = 30, user = OWNER) => {
    const id = nextSeed();
    await sql`insert into public.seeds (id, user_id, created_at) values (${id}, ${user}, now() - make_interval(days => ${ageDays}))`;
    return id;
  };
  /** History rows as they already stand in the table (Altbestand), written past the guard like a migration would. */
  const history = (id: string, event: string, choice: string, hoursAgo: number, cost = 0) =>
    sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`;
      await tx`insert into public.encounters (seed_id, user_id, event, choice, cost, created_at)
        values (${id}, ${OWNER}, ${event}, ${choice}, ${cost}, now() - make_interval(secs => ${hoursAgo * 3600}))`;
    });
  /** A request placed directly (test control of its kind); the refill logic itself is tested separately. */
  const request = async (id: string, kind: string, daysAgo = 0) =>
    (
      await sql`insert into public.ratsbuch_requests (seed_id, day, kind, created_at)
        values (${id}, (now() at time zone 'UTC')::date - ${daysAgo}::int, ${kind}, now()) returning id`
    )[0]!["id"] as string;
  /** Book as the trusted server (service role), as decideEncounter / acceptRatsbuch do; "ok" or the guard's message. */
  const book = (
    id: string,
    event: string,
    choice: string,
    req: string | null = null,
    wedding: string | null = null,
  ) =>
    sql
      .begin(async (tx) => {
        await tx`select set_config('test.role', 'service_role', true), set_config('test.wedding', ${wedding ?? ""}, true)`;
        await tx`insert into public.encounters (seed_id, user_id, event, choice, request_id) values (${id}, ${OWNER}, ${event}, ${choice}, ${req})`;
      })
      .then(() => "ok")
      .catch((e: Error) => e.message);
  const refresh = async (id: string, dayOffset: number | null = null) =>
    (dayOffset === null
      ? await sql`select public.ratsbuch_refresh(${id}) as n`
      : await sql`select public.ratsbuch_refresh_at(${id}, (now() at time zone 'UTC')::date + ${dayOffset}::int) as n`)[0]![
      "n"
    ] as number;
  const decline = async (id: string, req: string) =>
    (await sql`select public.ratsbuch_decline(${id}, ${req}) as ok`)[0]!["ok"] as boolean;
  const active = async (id: string) =>
    (await sql`select public.active_boons(${id}, now()) as n`)[0]!["n"] as number;
  const status = async (req: string) =>
    (await sql`select status from public.ratsbuch_requests where id = ${req}`)[0]![
      "status"
    ] as string;
  const rows = async (id: string) =>
    (
      await sql`select count(*)::int as n, coalesce(sum(cost), 0)::int as cost from public.encounters where seed_id = ${id}`
    )[0]!;
  const book6 = async (id: string, k = 6) => {
    for (let i = 0; i < k; i++) await history(id, "ruin", "shrine", 10 + i, 60); // 120 h boons, older than the 6 h gap
  };
  const cert = (id: string, rank: number) =>
    sql`insert into public.rank_certificates (seed_id, rank, citizens, ways, certified_at) values (${id}, ${rank}, 0, 0, now())
      on conflict (seed_id) do update set rank = excluded.rank, certified_at = excluded.certified_at`;

  beforeAll(async () => {
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.unsafe(`create database ${DB}`);
    const u = new globalThis.URL(BASE!);
    u.pathname = `/${DB}`;
    sql = postgres(u.toString(), { max: 6, onnotice: () => {} });
    await sql.unsafe(`
      create schema auth;
      create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
      create or replace function auth.role() returns text language sql stable as $$ select nullif(current_setting('test.role', true), '') $$;
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
        if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
      end $$;
      create table public.seeds (id uuid primary key, user_id uuid, created_at timestamptz not null);
      create table public.encounters (id uuid primary key default gen_random_uuid(), seed_id uuid not null references public.seeds(id),
        user_id uuid not null, event text not null, choice text not null, cost integer not null default 0, created_at timestamptz not null default now());
      create table public.purchases (seed_id uuid, item text);
      create table public.rank_certificates (seed_id uuid primary key, rank integer, citizens integer, ways integer, certified_at timestamptz);
      create table public.test_balance (seed_id uuid primary key, balance integer);
      create or replace function public.village_balance(_seed uuid) returns integer language sql stable as
        $$ select coalesce((select balance from public.test_balance where seed_id = _seed), 1000)
             - coalesce((select sum(cost) from public.encounters where seed_id = _seed), 0)::int $$;
      create or replace function public.village_weddings(_seed uuid, _at timestamptz) returns table(last_at timestamptz) language sql stable as
        $$ select nullif(current_setting('test.wedding', true), '')::timestamptz $$;
      grant usage on schema public, auth to authenticated;
      grant select, insert on public.encounters to authenticated; grant select on public.seeds to authenticated;
      alter table public.encounters enable row level security;
      create policy "Anyone can see encounters" on public.encounters for select using (true);
      create policy "Owners decide encounters" on public.encounters for insert to authenticated
        with check (user_id = auth.uid() and exists (select 1 from public.seeds s where s.id = encounters.seed_id and s.user_id = auth.uid()));
      create or replace function public.tax_spend_lock() returns trigger language plpgsql security definer set search_path = public as $$
        declare sid uuid; begin sid := (to_jsonb(NEW)->>'seed_id')::uuid; perform 1 from public.seeds where id = sid for update; return NEW; end $$;
      create trigger a_tax_spend_lock before insert on public.encounters for each row execute function public.tax_spend_lock();`);
    // production order: 0139 (guard, server only) → 0140 (boon_effects) → 0141 (Ratsbuch); 0141 twice proves it idempotent
    await sql.unsafe(M139);
    await sql.unsafe(
      `create trigger encounter_guard before insert on public.encounters for each row execute function public.encounter_guard();`,
    );
    await sql.unsafe(M140);
    await sql.unsafe(M141);
    await sql.unsafe(M141);
  });
  beforeEach(async () => {
    await since(24 * 30); // the Ratsbuch is live (cut-over 30 days ago) unless a test says otherwise
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${DB}`);
    await admin.end();
  });

  // ---------- 1. acceptance below the limit (P2-Q) ----------
  it("1: an open request is accepted with its growth answer; price and time are the guard's, the request closes", async () => {
    const id = await seed();
    expect(await refresh(id)).toBe(4);
    const [q] =
      await sql`select id, kind from public.ratsbuch_requests where seed_id = ${id} and status = 'open' order by day limit 1`;
    const kind = q!["kind"] as string;
    expect(await book(id, kind, GROWTH[kind]!, q!["id"])).toBe("ok");
    const [r] =
      await sql`select cost, created_at > now() - interval '1 minute' as fresh, request_id from public.encounters where seed_id = ${id}`;
    expect(r!["cost"]).toBe(
      { journeyman: 30, orphan: 20, widow: 40, monk: 45, ruin: 60, surveyor: 40 }[kind],
    );
    expect(r!["fresh"]).toBe(true);
    expect(r!["request_id"]).toBe(q!["id"]);
    expect(await status(q!["id"])).toBe("accepted");
    expect(await active(id)).toBe(1); // effective from the booking moment (rule 2)
  });

  // ---------- 2 + 7. refusal at six, without cost ----------
  it("2/7: with six active boons a growth answer is refused — no row, no cost, the request stays open", async () => {
    const id = await seed();
    await book6(id);
    const before = await rows(id);
    const q = await request(id, "monk");
    expect(await book(id, "monk", "copy", q)).toBe("boons full");
    expect(await rows(id)).toEqual(before);
    expect(await status(q)).toBe("open");
    // and no money is taken when the chest is short either
    const poor = await seed();
    await sql`insert into public.test_balance values (${poor}, 10)`;
    const q2 = await request(poor, "ruin");
    expect(await book(poor, "ruin", "shrine", q2)).toBe("not enough money");
    expect(await rows(poor)).toEqual({ n: 0, cost: 0 });
    expect(await status(q2)).toBe("open");
  });

  // ---------- 3 + 4. the moment counts; an expired boon frees its place ----------
  it("3/4: boons count by time; after one expires the next growth answer is accepted again", async () => {
    const id = await seed();
    await book6(id, 5);
    await history(id, "journeyman", "host", 71.5, 30); // 72 h boon, still active for 30 minutes
    expect(await active(id)).toBe(6);
    const q = await request(id, "widow");
    expect(await book(id, "widow", "shelter", q)).toBe("boons full");
    await sql`update public.encounters set created_at = now() - interval '72 hours' where seed_id = ${id} and event = 'journeyman'`;
    expect(await active(id)).toBe(5);
    expect(await book(id, "widow", "shelter", q)).toBe("ok");
    expect(await active(id)).toBe(6);
  });

  // ---------- 6. occasion answers count and are limited (P2-A) ----------
  it("6: wedding feast, Lichtstube, Gast frei and Störer dulden are refused at six; their other answers go on", async () => {
    const wed = new Date(Date.now() - 3600e3).toISOString();
    const cases: [string, string, string, number, string | null][] = [
      ["wedding", "feast", "gift", 0, wed],
      ["lichtstube", "reigen", "andacht", 0, null],
      ["gast", "frei", "streng", 4, null],
      ["stoerer", "dulden", "zunft", 3, null],
    ];
    for (const [ev, grow, other, rank, w] of cases) {
      const full = await seed();
      await book6(full);
      if (rank) await cert(full, rank);
      expect(await book(full, ev, grow, null, w), `${ev}:${grow} at six`).toBe("boons full");
      expect(await rows(full), `${ev}: nothing booked`).toEqual({ n: 6, cost: 360 });
      expect(await book(full, ev, other, null, w), `${ev}:${other}`).toBe("ok");
      const free = await seed();
      await book6(free, 5);
      if (rank) await cert(free, rank);
      expect(await book(free, ev, grow, null, w), `${ev}:${grow} at five`).toBe("ok");
      expect(await active(free), `${ev}:${grow} counts`).toBe(6);
    }
  });
  it("6: an occasion boon takes a place in the shared limit; the orphan's apprenticeship takes none", async () => {
    const a = await seed();
    await book6(a, 5);
    await history(a, "stoerer", "dulden", 8, -10);
    expect(await active(a)).toBe(6);
    expect(await book(a, "ruin", "shrine", await request(a, "ruin"))).toBe("boons full");
    const b = await seed();
    await book6(b, 5);
    const orphan = await request(b, "orphan");
    expect(await book(b, "orphan", "apprentice", orphan)).toBe("ok");
    expect(await active(b)).toBe(5);
    expect(await book(b, "monk", "copy", await request(b, "monk", 1))).toBe("ok");
    expect(await active(b)).toBe(6);
  });
  it("6: at six the orphan request still offers and books the free apprenticeship, never the adoption", async () => {
    const id = await seed();
    await book6(id);
    const q = await request(id, "orphan");
    expect(await book(id, "orphan", "adopt", q)).toBe("boons full");
    expect(await book(id, "orphan", "apprentice", q)).toBe("ok");
    expect(await status(q)).toBe("accepted");
  });

  // ---------- 8. lazy idempotent refill (P2-I) ----------
  it("8: refresh twice equals once; parallel refreshes never double a day", async () => {
    const id = await seed();
    const snap = async (x: string) =>
      (
        await sql`select day::text, kind from public.ratsbuch_requests where seed_id = ${x} order by day`
      ).map((r) => `${r["day"]}:${r["kind"]}`);
    expect(await refresh(id)).toBe(4);
    const one = await snap(id);
    expect(await refresh(id)).toBe(4);
    expect(await snap(id)).toEqual(one);
    const par = await seed();
    const res = await Promise.all(Array.from({ length: 6 }, () => refresh(par)));
    expect(res).toEqual([4, 4, 4, 4, 4, 4]);
    const [c] =
      await sql`select count(*)::int as n, count(distinct day)::int as days from public.ratsbuch_requests where seed_id = ${par}`;
    expect(c).toEqual({ n: 4, days: 4 });
  });
  it("8: ten days at once equal ten daily calls, also with full boon days in between", async () => {
    await since(24 * 10);
    const id = await seed(12);
    // six 72 h boons booked on day 1 at noon: active at the start of days 2, 3 and 4 → no request on those days
    const day1noon = (
      await sql`select extract(epoch from now() - (((now() at time zone 'UTC')::date - 9)::timestamp at time zone 'UTC' + interval '12 hours')) / 3600 as h`
    )[0]!["h"] as number;
    for (let i = 0; i < 6; i++)
      await history(id, "journeyman", "host", Number(day1noon) - i / 60, 30);
    const snap = async () =>
      (
        await sql`select day::text, kind, status from public.ratsbuch_requests where seed_id = ${id} order by day`
      ).map((r) => `${r["day"]}:${r["kind"]}:${r["status"]}`);
    await refresh(id);
    const once = await snap();
    await sql`delete from public.ratsbuch_requests where seed_id = ${id}`;
    await sql`delete from public.ratsbuch_state where seed_id = ${id}`;
    for (let k = -10; k <= 0; k++) await refresh(id, k);
    expect(await snap()).toEqual(once);
    const days = (
      await sql`select ((now() at time zone 'UTC')::date - day)::int as ago from public.ratsbuch_requests where seed_id = ${id} order by day`
    ).map((r) => r["ago"]);
    expect(days).toEqual([10, 9, 5, 4]); // day 0, day 1, then nothing while full (days 2–4), then days 5 and 6 — max four
  });

  // ---------- 9. at most four (P2-4) ----------
  it("9: never more than four open requests; a decline frees a place, refilled only the next day", async () => {
    const id = await seed();
    expect(await refresh(id)).toBe(4); // the cut-over was 30 days ago: four days fill the book, the rest is skipped
    const [c] =
      await sql`select count(*)::int as n from public.ratsbuch_requests where seed_id = ${id}`;
    expect(c!["n"]).toBe(4);
    const [q] =
      await sql`select id from public.ratsbuch_requests where seed_id = ${id} order by day limit 1`;
    expect(await decline(id, q!["id"])).toBe(true);
    expect(await decline(id, q!["id"])).toBe(false); // only once
    expect(await status(q!["id"])).toBe("declined");
    expect(await rows(id)).toEqual({ n: 0, cost: 0 }); // declining is free
    expect(await refresh(id)).toBe(3); // same day: no new request
    expect(await refresh(id, 1)).toBe(4); // next day: one new request
    expect(await refresh(id, 5)).toBe(4);
  });
  it("8/2: no request is created while six boons are active at the day's start", async () => {
    await since(1); // cut-over today or yesterday; the boons below were booked before both days began
    const id = await seed();
    for (let i = 0; i < 6; i++) await history(id, "widow", "shelter", 50 + i, 40); // 168 h boons
    expect(await refresh(id)).toBe(0);
  });

  // ---------- 10. parallel acceptances (P2-6) ----------
  it("10: at five boons two parallel acceptances never exceed six — exactly one is booked", async () => {
    for (let round = 0; round < 5; round++) {
      const id = await seed();
      await book6(id, 5);
      const a = await request(id, "ruin", 1),
        b = await request(id, "monk", 0);
      const res = await Promise.all([book(id, "ruin", "shrine", a), book(id, "monk", "copy", b)]);
      expect(
        res.filter((x) => x === "ok"),
        res.join(","),
      ).toHaveLength(1);
      expect(res.filter((x) => x === "boons full")).toHaveLength(1);
      expect(await active(id)).toBe(6);
      // an occasion answer racing a request is serialised the same way
      const id2 = await seed();
      await book6(id2, 5);
      const c = await request(id2, "widow");
      const res2 = await Promise.all([
        book(id2, "lichtstube", "reigen"),
        book(id2, "widow", "shelter", c),
      ]);
      expect(
        res2.filter((x) => x === "ok"),
        res2.join(","),
      ).toHaveLength(1);
      expect(await active(id2)).toBe(6);
    }
  });

  // ---------- 11. double acceptance and foreign or mismatched requests ----------
  it("11: a request is accepted once — sequentially and in parallel; foreign or mismatched ones are refused", async () => {
    const id = await seed();
    const q = await request(id, "journeyman");
    expect(await book(id, "journeyman", "host", q)).toBe("ok");
    expect(await book(id, "journeyman", "settle", q)).toBe("already decided");
    const p = await seed();
    const pq = await request(p, "monk");
    const both = await Promise.all([book(p, "monk", "copy", pq), book(p, "monk", "copy", pq)]);
    expect(both.filter((x) => x === "ok")).toHaveLength(1);
    expect((await rows(p))["n"]).toBe(1);
    const other = await seed(30, OTHER);
    const oq = await request(other, "ruin");
    expect(await book(id, "ruin", "shrine", oq)).toBe("unknown request"); // someone else's request
    const m = await request(id, "monk", 1);
    expect(await book(id, "journeyman", "host", m)).toBe("unknown request"); // wrong kind
    expect(await book(id, "monk", "teach", m)).toBe("unknown encounter"); // no effect = decline, never booked
    expect(await status(m)).toBe("open");
    const [ix] =
      await sql`select count(*)::int as n from pg_indexes where indexname = 'encounters_request_id_key'`;
    expect(ix!["n"]).toBe(1);
  });

  // ---------- 12. transition: running boons, old windows, history ----------
  it("12: Altbestand above six stays untouched and runs out; no new growth until it is below six", async () => {
    const id = await seed();
    for (let i = 0; i < 8; i++) await history(id, "journeyman", "host", 20 + i, 30);
    const before =
      await sql`select id, event, choice, cost, created_at from public.encounters where seed_id = ${id} order by created_at`;
    expect(await active(id)).toBe(8);
    expect(await book(id, "lichtstube", "reigen")).toBe("boons full");
    expect(
      await sql`select id, event, choice, cost, created_at from public.encounters where seed_id = ${id} order by created_at`,
    ).toEqual(before);
    await sql`update public.encounters set created_at = created_at - interval '60 hours' where seed_id = ${id}`;
    expect(await active(id)).toBe(0);
    expect(await book(id, "lichtstube", "reigen")).toBe("ok");
  });
  it("12 / P2-F: a window opened before the cut-over keeps its growth visitor for 24 h, never after", async () => {
    await since(2);
    const a = await seed();
    await history(a, "merchant", "pass", 7); // window opened before the cut-over (2 h ago)
    expect(await book(a, "journeyman", "host")).toBe("ok"); // within the grace
    const lim = await seed();
    await book6(lim, 5);
    await sql`update public.encounters set created_at = now() - interval '7 hours' where seed_id = ${lim}`; // all before the cut-over
    await history(lim, "ruin", "shrine", 6.5, 60);
    expect(await book(lim, "monk", "copy")).toBe("boons full"); // the limit holds in the grace too
    await since(25);
    const b = await seed();
    await history(b, "merchant", "pass", 30);
    expect(await book(b, "journeyman", "host")).toBe("ratsbuch only"); // grace over
    expect(await book(b, "journeyman", "pass")).toBe("ok"); // narrative answers are not affected
    await since(10);
    const c = await seed();
    await history(c, "merchant", "pass", 7); // window opened after the cut-over
    expect(await book(c, "orphan", "adopt")).toBe("ratsbuch only");
  });
  it("12: with the shipped far-future cut-over everything behaves exactly as after Paket 1", async () => {
    await since("far");
    const id = await seed();
    for (let i = 0; i < 7; i++) await history(id, "ruin", "shrine", 10 + i, 60);
    expect(await book(id, "journeyman", "host")).toBe("ok"); // 8th growth boon: no limit before the cut-over
    expect(await refresh(id)).toBe(0); // no requests
    const q = await request(id, "monk");
    await sql`update public.encounters set created_at = now() - interval '7 hours' where seed_id = ${id}`;
    expect(await book(id, "monk", "copy", q)).toBe("not now");
    const fresh = await seed();
    expect(await book(fresh, "cow", "sell")).toBe("ok");
    expect(await book(fresh, "merchant", "pass")).toBe("too soon"); // the gap is unchanged
  });

  // ---------- 13. narrative encounters ----------
  it("13: narrative answers stay free and possible at six boons; Ratsbuch rows never move the visitor gap", async () => {
    const id = await seed();
    await book6(id);
    expect(await book(id, "cow", "show")).toBe("ok");
    const g = await seed();
    await history(g, "merchant", "pass", 7);
    expect(await book(g, "ruin", "shrine", await request(g, "ruin"))).toBe("ok"); // a Ratsbuch row right now…
    expect(await book(g, "minstrel", "play")).toBe("ok"); // …does not block the next visitor (gap from the merchant)
    expect(await book(g, "healer", "pass")).toBe("too soon");
  });

  // ---------- rights and draw ----------
  it("clients cannot write the book or call its functions; owners read only their own requests", async () => {
    const mine = await seed();
    const theirs = await seed(30, OTHER);
    await request(mine, "monk");
    await request(theirs, "ruin");
    const [p] = await sql`select
      has_function_privilege('authenticated', 'public.ratsbuch_refresh(uuid)', 'execute') as r,
      has_function_privilege('authenticated', 'public.ratsbuch_decline(uuid, uuid)', 'execute') as d,
      has_function_privilege('authenticated', 'public.ratsbuch_refresh_at(uuid, date)', 'execute') as ra,
      has_function_privilege('service_role', 'public.ratsbuch_refresh(uuid)', 'execute') as s,
      has_table_privilege('authenticated', 'public.ratsbuch_requests', 'insert') as i,
      has_table_privilege('authenticated', 'public.ratsbuch_requests', 'update') as u`;
    expect(p).toEqual({ r: false, d: false, ra: false, s: true, i: false, u: false });
    const seen = await sql.begin(async (tx) => {
      await tx`select set_config('test.uid', ${OWNER}, true)`;
      await tx.unsafe("set local role authenticated");
      return tx`select seed_id from public.ratsbuch_requests where seed_id in (${mine}, ${theirs})`;
    });
    expect(seen.map((r) => r["seed_id"])).toEqual([mine]);
  });
  it("P2-V: requests follow the weights 12/10/7/7/3/3; no surveyor before day 7", async () => {
    const [young] =
      await sql`select count(*)::int as n from (select public.ratsbuch_kind(gen_random_uuid(), current_date, 100) as k from generate_series(1, 4000)) x where k = 'surveyor'`;
    expect(young!["n"]).toBe(0);
    const dist =
      await sql`select k, count(*)::int as n from (select public.ratsbuch_kind(gen_random_uuid(), current_date - g % 50, 500) as k from generate_series(1, 42000) g) x group by k`;
    const share = Object.fromEntries(dist.map((r) => [r["k"], (r["n"] as number) / 42000]));
    const want: Record<string, number> = {
      journeyman: 12,
      orphan: 10,
      widow: 7,
      monk: 7,
      ruin: 3,
      surveyor: 3,
    };
    for (const [k, w] of Object.entries(want))
      expect(Math.abs(share[k]! - w / 42), k).toBeLessThan(0.01);
  });
});
