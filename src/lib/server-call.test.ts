import { describe, it, expect, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { withFreshAuth, isUnauthorized, callFault } from "./server-call";

// Hilde (Nebelmühle): every answer to an open encounter ended in the generic "could not be decided". A thrown server
// call was swallowed without a reason; an auth refusal (the one failure that books nothing for sure) was never retried.
describe("server calls with a refreshed session", () => {
  it("retries once after an auth refusal, with a refreshed session in between", async () => {
    const order: string[] = [];
    const call = vi.fn(async (x: number) => {
      order.push("call");
      if (order.filter((o) => o === "call").length === 1)
        throw new Error("Unauthorized: Invalid token");
      return x * 2;
    });
    const refresh = vi.fn(async () => void order.push("refresh"));
    expect(await withFreshAuth(call, refresh)(21)).toBe(42);
    expect(order).toEqual(["call", "refresh", "call"]);
  });

  it("gives up after one retry and reports the refusal", async () => {
    const call = vi.fn(async () => {
      throw new Error("Unauthorized: No authorization header provided");
    });
    await expect(
      withFreshAuth(call, async () => {
        throw new Error("offline");
      })(),
    ).rejects.toThrow("Unauthorized:");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("never retries any other thrown error (outcome unknown)", async () => {
    for (const e of [
      new Error("Forbidden"),
      new TypeError("Failed to fetch"),
      new Error("Rank certificate failed"),
    ]) {
      const call = vi.fn(async () => {
        throw e;
      });
      const refresh = vi.fn(async () => undefined);
      await expect(withFreshAuth(call, refresh)()).rejects.toBe(e);
      expect(call).toHaveBeenCalledTimes(1);
      expect(refresh).not.toHaveBeenCalled();
    }
  });

  it("names the fault", () => {
    expect(callFault(new Error("Unauthorized: Invalid token"))).toBe("auth");
    expect(callFault(new TypeError("Failed to fetch"))).toBe("net");
    expect(callFault(new Error("Missing village"))).toBe("server");
    expect(isUnauthorized("Unauthorized: x")).toBe(false);
  });

  it("only requireSupabaseAuth throws 'Unauthorized:' — no handler does, so the retry can never repeat a booking", () => {
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((f) =>
        f.isDirectory()
          ? walk(join(d, f.name))
          : /\.tsx?$/.test(f.name) && !/\.test\./.test(f.name)
            ? [join(d, f.name)]
            : [],
      );
    const hits = walk("src").filter((f) => /["'`]Unauthorized:/.test(readFileSync(f, "utf8")));
    expect(hits.map((f) => f.replace(/\\/g, "/")).sort()).toEqual([
      "src/integrations/supabase/auth-middleware.ts",
      "src/lib/server-call.ts",
    ]);
    // and the middleware refuses before next(): every such throw precedes the handler
    const mw = readFileSync("src/integrations/supabase/auth-middleware.ts", "utf8");
    expect(mw.lastIndexOf("Unauthorized:")).toBeLessThan(mw.indexOf("return next("));
  });
});
