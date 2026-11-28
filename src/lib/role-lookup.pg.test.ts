// Only throw-away databases: no sign-ins, tokens, or live game bookings.
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFullSchema, dropDatabase } from "./full-schema.testkit";

const base = process.env["BUILD_MAIL_TEST_PG"];
if (!base && (process.env["CI"] || process.env["REQUIRE_PG"])) {
  throw new Error("BUILD_MAIL_TEST_PG missing: role lookup DB tests must run");
}
const suite = base ? describe : describe.skip;
const ADMIN = "00000000-0000-0000-0000-000000168001";
const PLAYER = "00000000-0000-0000-0000-000000168002";
const DB = "security_role_lookup_test";

suite("role lookup: real PostgreSQL caller permissions", () => {
  let sql: postgres.Sql;
  const as = <R>(role: "anon" | "authenticated" | "service_role", uid: string, f: (tx: postgres.TransactionSql) => Promise<R>) =>
    sql.begin(async (tx) => {
      await tx.unsafe(`set local role ${role}`);
      await tx`select set_config('test.uid', ${uid}, true)`;
      return f(tx);
    });

  beforeAll(async () => {
    if (!base) throw new Error("Isolated test database required");
    sql = postgres(await buildFullSchema(base, DB), { max: 1, onnotice: () => {} });
    await sql`insert into auth.users (id) values (${ADMIN}), (${PLAYER})`;
    await sql`insert into public.user_roles (user_id, role) values (${ADMIN}, 'admin'), (${PLAYER}, 'user')`;
  }, 120_000);
  afterAll(async () => {
    if (sql) await sql.end();
    if (base) await dropDatabase(base, DB);
  });

  it("anonymous callers cannot execute role lookups", async () => {
    await expect(as("anon", "", (tx) => tx`select public.has_role(${ADMIN}, 'admin')`)).rejects.toMatchObject({ code: "42501" });
  });
  it("an administrator can still verify their own admin role", async () => {
    const [row] = await as("authenticated", ADMIN, (tx) => tx`select public.has_role(${ADMIN}, 'admin') as allowed`);
    expect(row?.["allowed"]).toBe(true);
  });
  it("a player can verify their own user role", async () => {
    const [row] = await as("authenticated", PLAYER, (tx) => tx`select public.has_role(${PLAYER}, 'user') as allowed`);
    expect(row?.["allowed"]).toBe(true);
  });
  it("a player cannot learn another account's admin role", async () => {
    const [row] = await as("authenticated", PLAYER, (tx) => tx`select public.has_role(${ADMIN}, 'admin') as allowed`);
    expect(row?.["allowed"]).toBe(false);
  });
  it("a player cannot grant themselves admin access", async () => {
    const [row] = await as("authenticated", PLAYER, (tx) => tx`select public.has_role(${PLAYER}, 'admin') as allowed`);
    expect(row?.["allowed"]).toBe(false);
  });
  it("trusted service callers retain role checks", async () => {
    const [row] = await as("service_role", "", (tx) => tx`select public.has_role(${ADMIN}, 'admin') as allowed`);
    expect(row?.["allowed"]).toBe(true);
  });
  it("the actual seed guard retains the administrator exception", async () => {
    await as("service_role", "", async (tx) => {
      await tx`insert into public.seeds (name, owner, x, y, hue, user_id, realm)
        values ('Role test A', 'Fixture', 100, 100, 1, ${ADMIN}, 'lab'),
               ('Role test B', 'Fixture', 110, 110, 1, ${ADMIN}, 'europe-4')`;
      const [row] = await tx`select count(*)::int as n from public.seeds where user_id = ${ADMIN}`;
      expect(row?.["n"]).toBe(2);
    });
  });
  it("the actual seed guard still rejects a second ordinary village", async () => {
    await expect(as("service_role", "", (tx) => tx`insert into public.seeds (name, owner, x, y, hue, user_id, realm)
      values ('Role test C', 'Fixture', 120, 120, 1, ${PLAYER}, 'lab'),
             ('Role test D', 'Fixture', 130, 130, 1, ${PLAYER}, 'europe-4')`)).rejects.toMatchObject({ code: "23505" });
  });
});