/** Night mask audit: every day painting is paired with its light mask in building-sprites.ts (nightPairs).
 * Hard errors fail; light-area findings are printed as review hints only — they never approve a mask.
 * Fingerprints live in night-masks.lock.json; after a visual check, re-approve with
 *   bun scripts/night-masks-approve.ts <key> "<note>"   (e.g. roof changed, windows identical). */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { nightPairs } from "./building-sprites";
import { audit, sha } from "./night-audit";

const file = (u: string) => path.resolve(process.cwd(), u.replace(/^\//, "").split("?")[0]!);
/** Three independent dimensions: technical (fingerprints recorded after this audit passed), visual (a person looked at day/mask/overlay),
 * decision (open = not decided; approved / rework / unlit). A passing test never sets visual or decision. */
type Lock = Record<string, { day: string; night: string | null; technical: "pass"; visual: "uninspected" | "inspected"; decision: "open" | "approved" | "rework" | "unlit"; note: string }>;
const lock: Lock = JSON.parse(readFileSync(path.resolve(__dirname, "night-masks.lock.json"), "utf8"));
const pairs = nightPairs();

describe("night masks", () => {
  it("every mask is used, and shared masks belong to the same painting", () => {
    const dir = path.resolve(process.cwd(), "src/assets/sprites/cohesive/night");
    const used = new Map<string, string>();
    for (const p of pairs) if (p.night) {
      const prev = used.get(file(p.night));
      expect(prev === undefined || prev === file(p.day), `${p.key}: mask shared with another painting`).toBe(true);
      used.set(file(p.night), file(p.day));
    }
    const orphans = readdirSync(dir).filter((f) => f.endsWith(".webp") && !used.has(path.join(dir, f)));
    expect(orphans).toEqual([]);
  });

  for (const p of pairs) it(`${p.key}`, async () => {
    const entry = lock[p.key]!;
    expect(entry, `${p.key}: not in night-masks.lock.json`).toBeTruthy();
    expect(entry.technical).toBe("pass");
    expect(["uninspected", "inspected"]).toContain(entry.visual);
    expect(["open", "approved", "rework", "unlit"]).toContain(entry.decision);
    expect(entry.visual === "inspected" || entry.decision === "open", `${p.key}: a decision needs a visual inspection`).toBe(true);
    if (!p.night) expect(entry.decision, `${p.key}: no mask must be decided unlit`).toBe("unlit");
    const day = file(p.day);
    expect(existsSync(day)).toBe(true);
    if (!p.night) { expect(entry.night, `${p.key}: lock expects a mask`).toBeNull(); expect(entry.day, `${p.key}: day painting changed — review`).toBe(sha(day)); return; }
    const night = file(p.night);
    expect(existsSync(night), `${p.key}: mask file missing`).toBe(true);
    const a = await audit(day, night);
    expect([a.nw, a.nh], `${p.key}: mask size differs from day`).toEqual([a.w, a.h]);
    expect([a.w, a.h], `${p.key}: registry crop differs from file`).toEqual(p.crop.slice(2));
    expect(a.hasAlpha, `${p.key}: mask without alpha`).toBe(true);
    expect(a.opaque, `${p.key}: mask is opaque`).toBe(false);
    if (entry.decision !== "unlit") expect(a.lit, `${p.key}: mask is empty (approve as allowEmpty or set night: null)`).toBeGreaterThan(0);
    expect(a.outside, `${p.key}: light outside the silhouette`).toBeLessThanOrEqual(Math.max(4, a.lit * 0.01));
    // fingerprints: a changed day painting makes the mask due for review
    expect(entry.day, `${p.key}: day painting changed — review mask, then run scripts/night-masks-approve.ts`).toBe(sha(day));
    expect(entry.night, `${p.key}: mask changed — review, then run scripts/night-masks-approve.ts`).toBe(sha(night));
    const warns = a.blobs.filter((b) => b.warn.length);
    if (warns.length) console.warn(`[night-mask review] ${p.key}: ${a.blobs.length} light areas; ` + warns.slice(0, 4).map((b) => `${b.w}x${b.h}@${b.x},${b.y} (${b.area}px, pos ${b.cx}/${b.cy}): ${b.warn.join(", ")}`).join("; "));
  });
});
