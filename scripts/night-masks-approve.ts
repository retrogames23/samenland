/** Records the review state of a night mask in src/game/night-masks.lock.json (fingerprints of day + mask).
 * usage: bun scripts/night-masks-approve.ts <key|--all> <status> "<note>"
 *   status: unchecked | reviewed | approved | unlit
 *   - unchecked: technically checked only (tests pass), never looked at
 *   - reviewed:  looked at (day / mask / overlay), rework still open
 *   - approved:  looked at and released
 *   - unlit:     looked at, deliberately without night light (empty or no mask)
 * A passing test is never a visual approval; only a person sets reviewed/approved/unlit. */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { nightPairs } from "../src/game/building-sprites";
import { sha } from "../src/game/night-audit";

const STATUS = ["unchecked", "reviewed", "approved", "unlit"];
const [key, status, note] = process.argv.slice(2);
if (!key || !STATUS.includes(status ?? "") || !note) throw new Error('usage: bun scripts/night-masks-approve.ts <key|--all> <unchecked|reviewed|approved|unlit> "<note>"');
const lockFile = path.resolve("src/game/night-masks.lock.json");
const lock = JSON.parse(readFileSync(lockFile, "utf8")) as Record<string, object>;
const file = (u: string) => { const p = u.split("?")[0]!; return p.startsWith(process.cwd()) ? p : path.resolve(p.replace(/^\//, "")); };
const date = new Date().toISOString().slice(0, 10);
let n = 0;
for (const p of nightPairs()) {
  if (key !== "--all" && p.key !== key) continue;
  lock[p.key] = { day: sha(file(p.day)), night: p.night ? sha(file(p.night)) : null, status, note: `${date}: ${note}` };
  n++;
}
if (!n) throw new Error(`unknown key ${key}`);
writeFileSync(lockFile, JSON.stringify(Object.fromEntries(Object.entries(lock).sort()), null, 1) + "\n");
console.log(`${status} ${n}`);
