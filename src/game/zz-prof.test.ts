import { test } from "vitest";
import { structureAt, townStats, type Seed } from "@/game/world";
import { townOf, townPoses } from "@/game/people";
const E0 = Date.parse("2026-10-27T23:40:00Z");
const mk = (id: string, x: number, y: number): Seed => ({ id, name: id, owner: "L", hue: 1, x, y, created_at: new Date(E0).toISOString(), user_id: null } as any);
const seeds = [mk("wiek",306,420), mk("hausen",343,439), mk("au",307,460), mk("grund",343,481)];
test("prof", () => {
  for (const m of [0, 1, 2]) {
    const now = E0 + 8800 * 3.6e6 + 12 * 3.6e6 + m * 60000; // noon-ish
    let t = performance.now();
    for (let y = 340; y < 560; y++) for (let x = 230; x < 420; x++) structureAt(x, y, seeds, now);
    const a = performance.now() - t; t = performance.now();
    const tw = townOf(seeds[3]!, seeds, now); const b = performance.now() - t; t = performance.now();
    const p = townPoses(seeds[3]!, seeds, now); const c = performance.now() - t; t = performance.now();
    townPoses(seeds[3]!, seeds, now + 1000); const d = performance.now() - t;
    console.log(`min${m} structs=${a|0}ms town=${b|0}ms poses=${c|0}ms poses2=${d|0}ms n=${tw.people.length} vis=${p.length}`);
  }
}, 120000);
