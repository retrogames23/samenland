/** Records the review state of a night mask in src/game/night-masks.lock.json (fingerprints of day + mask).
 * usage: bun scripts/night-masks-approve.ts <key|--all> <decision> "<note>"
 *   decision: open | approved | rework | unlit
 *   - open:     technical fingerprints only, visual = uninspected (never looked at)
 *   - approved / rework / unlit: a person looked at day / mask / overlay → visual = inspected
 * Three separate dimensions: technical (audit passed, fingerprints recorded), visual, decision.
 * A passing test is never a visual approval; only a person sets approved/rework/unlit. */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { nightPairs } from "../src/game/building-sprites";
import { sha } from "../src/game/night-audit";

const DECISION = ["open", "approved", "rework", "unlit"];
const [key, decision, note] = process.argv.slice(2);
if (!key || !DECISION.includes(decision ?? "") || !note) throw new Error('usage: bun scripts/night-masks-approve.ts <key|--all> <open|approved|rework|unlit> "<note>"');
const lockFile = path.resolve("src/game/night-masks.lock.json");
const lock = JSON.parse(readFileSync(lockFile, "utf8")) as Record<string, object>;
const file = (u: string) => { const p = u.split("?")[0]!; return p.startsWith(process.cwd()) ? p : path.resolve(p.replace(/^\//, "")); };
const date = new Date().toISOString().slice(0, 10);
let n = 0;
for (const p of nightPairs()) {
  if (key !== "--all" && p.key !== key) continue;
  lock[p.key] = { day: sha(file(p.day)), night: p.night ? sha(file(p.night)) : null, technical: "pass", visual: decision === "open" ? "uninspected" : "inspected", decision, note: `${date}: ${note}` };
  n++;
}
if (!n) throw new Error(`unknown key ${key}`);
writeFileSync(lockFile, JSON.stringify(Object.fromEntries(Object.entries(lock).sort()), null, 1) + "\n");
console.log(`${decision} ${n}`);
