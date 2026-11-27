// Hochzeitspaket: the HTTP endpoint /api/public/wedding-sweep with the REAL cron authentication and a mocked sweep
// (mock: no database). Proves: wrong or missing secret never reaches the sweep, bad input is refused, the default is
// a dry run, a halt or an error answers 409, a thrown error never answers 200.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SweepOptions, SweepReport } from "./wedding-sweep.server";

const calls: SweepOptions[] = [];
const next = { report: null as SweepReport | null, throws: null as Error | null };
vi.mock("@/lib/wedding-sweep.server", () => ({
  sweepWeddings: async (o: SweepOptions) => {
    calls.push(o);
    if (next.throws) throw next.throws;
    return next.report!;
  },
}));
const { Route } = await import("@/routes/api/public/wedding-sweep");
type Handler = (ctx: { request: Request }) => Promise<Response>;
const POST = (Route.options as unknown as { server: { handlers: { POST: Handler } } }).server.handlers.POST;

const report = (p: Partial<SweepReport> = {}): SweepReport => ({ realm: "europe", apply: false, at: "", checked: 0, complete: 0, missing: 0, inserted: 0, villages: [], halted: null, quarantined: [], errors: [], next: null, ...p });
const req = (body: unknown, auth: string | null = "Bearer s3cret") =>
  new Request("https://x/api/public/wedding-sweep", { method: "POST", headers: { "content-type": "application/json", ...(auth ? { authorization: auth } : {}) }, body: typeof body === "string" ? body : JSON.stringify(body) });

beforeEach(() => { process.env["LOVABLE_CRON_SECRET"] = "s3cret"; delete process.env["LOVABLE_CRON_SECRET_PREVIOUS"]; calls.length = 0; next.report = report(); next.throws = null; });
afterEach(() => { delete process.env["LOVABLE_CRON_SECRET"]; });

describe("wedding-sweep endpoint", () => {
  it("wrong, missing or malformed secret: 401, the sweep is never called", async () => {
    for (const a of ["Bearer nope", null, "s3cret", "Bearer s3cret extra"]) expect((await POST({ request: req({ realm: "europe" }, a) })).status).toBe(401);
    expect(calls).toEqual([]);
  });
  it("no secret configured on the server: 500, the sweep is never called", async () => {
    delete process.env["LOVABLE_CRON_SECRET"];
    expect((await POST({ request: req({ realm: "europe" }) })).status).toBe(500);
    expect(calls).toEqual([]);
  });
  it("bad JSON or unknown realm: 400, the sweep is never called", async () => {
    expect((await POST({ request: req("{nope") })).status).toBe(400);
    expect((await POST({ request: req({ realm: "mars" }) })).status).toBe(400);
    expect((await POST({ request: req({}) })).status).toBe(400);
    expect(calls).toEqual([]);
  });
  it("default is a dry run; only a literal true applies; cursor and limit are passed through", async () => {
    await POST({ request: req({ realm: "europe" }) });
    await POST({ request: req({ realm: "europe", apply: "true" }) });
    await POST({ request: req({ realm: "lab", apply: true, after: "abc", limit: 7 }) });
    expect(calls).toEqual([
      { realm: "europe", apply: false, after: null },
      { realm: "europe", apply: false, after: null },
      { realm: "lab", apply: true, after: "abc", limit: 7 },
    ]);
  });
  it("halt (divergence or switch mismatch) and errors answer 409 with the report; a clean run 200", async () => {
    next.report = report({ halted: { seed: "s", reason: "switch_mismatch", mismatches: [], switchMismatch: true } });
    const h = await POST({ request: req({ realm: "europe", apply: true }) });
    expect(h.status).toBe(409);
    expect((await h.json()).halted.reason).toBe("switch_mismatch");
    next.report = report({ errors: [{ seed: "s", message: "Wedding switch unavailable" }], next: "r" });
    expect((await POST({ request: req({ realm: "europe", apply: true }) })).status).toBe(409);
    next.report = report();
    expect((await POST({ request: req({ realm: "europe" }) })).status).toBe(200);
  });
  it("a thrown error (e.g. the realm could not be loaded) is never a 200", async () => {
    next.throws = new Error("Economy input failed");
    await expect(POST({ request: req({ realm: "europe", apply: true }) })).rejects.toThrow("Economy input failed");
  });
});
