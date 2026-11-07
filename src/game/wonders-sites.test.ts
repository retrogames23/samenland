import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { setRealm, type Realm } from "./time";
import { wonders, resetWonders } from "./wonders";

// Every wonder a client can find must be known to the server's wonder_sites, or claim_wonder rejects it.
const dir = "drizzle/migrations";
const known = new Set<string>();
for (const f of readdirSync(dir).filter((n) => n.endsWith(".sql"))) for (const m of readFileSync(`${dir}/${f}`, "utf8").matchAll(/\('((?:wreck|cave|oak|ruin|caravan|spring):\d+:\d+)'/g)) known.add(m[1]!);

describe("wonder sites", () => {
  for (const r of ["europe", "europe-2", "us-west", "us-east", "asia"] as Realm[]) {
    it(`server knows every wonder on ${r}`, () => {
      setRealm(r); resetWonders();
      const missing = wonders().filter((w) => !known.has(w.key));
      expect(missing).toEqual([]);
    });
  }
});
