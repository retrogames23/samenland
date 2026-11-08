/** Records a visual approval of a night mask in src/game/night-masks.lock.json (fingerprints of day + mask).
 * usage: bun scripts/night-masks-approve.ts <key|--all> "<note>" [--allow-empty]
 * Use after checking the pair in the Figure-Lab (night masks card): e.g. roof repainted, window geometry unchanged. */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { nightPairs } from "../src/game/building-sprites";
import { sha } from "../src/game/night-audit";

const [key, note, flag] = process.argv.slice(2);
if (!key || !note) throw new Error('usage: bun scripts/night-masks-approve.ts <key|--all> "<note>" [--allow-empty]');
const lockFile = path.resolve("src/game/night-masks.lock.json");
const lock = JSON.parse(readFileSync(lockFile, "utf8")) as Record<string, object>;
const file = (u: string) => { const p = u.split("?")[0]; return p.startsWith(process.cwd()) ? p : path.resolve(p.replace(/^\//, "")); };
const date = new Date().toISOString().slice(0, 10);
let n = 0;
for (const p of nightPairs()) {
  if (key !== "--all" && p.key !== key) continue;
  const prev = lock[p.key] as { allowEmpty?: boolean } | undefined;
  lock[p.key] = { day: sha(file(p.day)), night: p.night ? sha(file(p.night)) : null, approved: `${date}: ${note}`, ...(flag === "--allow-empty" || prev?.allowEmpty ? { allowEmpty: true } : {}) };
  n++;
}
if (!n) throw new Error(`unknown key ${key}`);
writeFileSync(lockFile, JSON.stringify(Object.fromEntries(Object.entries(lock).sort()), null, 1) + "\n");
console.log(`approved ${n}`);
