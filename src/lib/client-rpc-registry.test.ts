// Paket C (Abschnitt 5): every direct database path of the browser client is in CLIENT_RPCS / CLIENT_TABLE_WRITES.
// Scans the client code (everything under src/ except server functions, API routes, tests and generated types) for RPC
// names — also the indirect `(supabase.rpc as …)("name", …)` and `rpc("name", …)` forms — and for table writes.
// A new path fails this test until it is classified (money? pending? protection?).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLIENT_RPCS, CLIENT_TABLE_WRITES } from "./client-rpc-registry";
import { CLIENT_PROTOCOL } from "./client-protocol";

const ROOT = new globalThis.URL("../", import.meta.url).pathname;
const SERVER = /\.test\.|testkit|\.server\.ts$|\.functions\.ts$|[\\/]routes[\\/]api[\\/]|integrations[\\/]supabase[\\/](types|client\.server)|[\\/]server\.ts$|[\\/]test[\\/]/;
function files(d: string, out: string[] = []) {
  for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) files(p, out); else if (/\.(ts|tsx)$/.test(f)) out.push(p); }
  return out;
}
const client = files(ROOT).filter((f) => !SERVER.test(f));
const src = client.map((f) => [f, readFileSync(f, "utf8")] as const);

/** RPC names: `.rpc("x"`, `rpc("x"` (a bound rpc) and `…)("x", {` right after an rpc cast. */
function rpcNames() {
  const out = new Map<string, string>();
  for (const [f, s] of src) {
    for (const m of s.matchAll(/\brpc\(\s*["']([a-z_0-9]+)["']/g)) out.set(m[1]!, f);
    for (const m of s.matchAll(/rpc(?:\.bind\([^)]*\))?\s+as\s+unknown\s+as\s+\([^)]*\)\s*=>\s*[A-Za-z<>{}\s:|;,?.[\]a-z]*\)\s*\(\s*["']([a-z_0-9]+)["']/g)) out.set(m[1]!, f);
    for (const m of s.matchAll(/>\)\s*\(\s*["']([a-z_0-9]+)["']\s*,/g)) out.set(m[1]!, f);
  }
  return out;
}
function tableWrites() {
  const out = new Map<string, string>();
  for (const [f, s] of src) for (const m of s.matchAll(/\.from\(\s*["']([a-z_0-9]+)["']\s*\)/g)) {
    const stmt = s.slice(m.index!, m.index! + 400).split(/;\s*\n|\n\s*\n/)[0]!;
    if (/\.(insert|upsert|update|delete)\(/.test(stmt)) out.set(m[1]!, f);
  }
  return out;
}

describe("Paket C – Registry der direkten Client-Wege", () => {
  it("every RPC the client code calls is classified, and every classified RPC is still called (or kept for old clients)", () => {
    const found = rpcNames();
    const missing = [...found.keys()].filter((n) => !(n in CLIENT_RPCS));
    expect(missing, "unclassified client RPC").toEqual([]);
    // old signatures stay in the registry for old clients although the current client calls only the v2 names
    const oldOnly = ["civic_raise_budget", "resource_overview"];
    for (const n of Object.keys(CLIENT_RPCS)) if (!oldOnly.includes(n)) expect(found.has(n), `registry entry ${n} no longer called`).toBe(true);
    for (const n of oldOnly) expect(found.has(n), `the current client must not call the old signature ${n}`).toBe(false);
  });
  it("every table the client code writes is classified", () => {
    const found = tableWrites();
    expect([...found.keys()].filter((t) => !(t in CLIENT_TABLE_WRITES)), "unclassified client table write").toEqual([]);
    for (const t of Object.keys(CLIENT_TABLE_WRITES)) expect(found.has(t), `registry entry ${t} no longer written`).toBe(true);
  });
  it("the money/resource RPCs that know pending are the versioned ones, called with the client protocol", () => {
    const pendingRpcs = Object.entries(CLIENT_RPCS).filter(([, p]) => p.pending).map(([n]) => n).sort();
    // (P4, migration 0165: the two Stiftung money actions carry the protocol from the start — no old signature exists)
    expect(pendingRpcs).toEqual(["civic_raise_budget", "civic_raise_budget_v2", "resource_overview", "resource_overview_v2", "stift_close", "stift_deposit"]);
    const all = src.map(([, s]) => s).join("\n");
    expect(all).toMatch(/\("civic_raise_budget_v2", \{[^}]*_client: CLIENT_PROTOCOL/);
    expect(all).toMatch(/\("resource_overview_v2",\s*\{[^}]*_client: CLIENT_PROTOCOL/);
    for (const f of ["stift_open", "stift_deposit", "stift_close", "stift_overview"]) expect(all).toMatch(new RegExp(`\\("${f}",\\s*\\{[^}]*_client: CLIENT_PROTOCOL`));
    expect(CLIENT_PROTOCOL).toBeGreaterThanOrEqual(2);
  });
  it("money expenses through table writes are exactly the guarded ones that can be pending", () => {
    const exp = Object.entries(CLIENT_TABLE_WRITES).filter(([, p]) => p.geld === "ausgabe").map(([n]) => n).sort();
    expect(exp).toEqual(["building_moves", "gifts", "purchases", "twin_works"]);
    for (const n of exp) expect(CLIENT_TABLE_WRITES[n]!.pending).toBe(true);
  });
});
