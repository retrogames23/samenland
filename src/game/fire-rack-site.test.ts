import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ITEMS, needRankOf } from "./economy";
import { specialSites, structureAt, MAP, type Seed } from "./world";

const T = Date.UTC(2026, 5, 1);
const base = { id: "rack", x: 300, y: 300, created_at: new Date(T - 200 * 864e5).toISOString(), user_id: "u", name: "R" } as unknown as Seed;

describe("fire order rack", () => {
  it("removes only the fire-order position prohibition and keeps duplicate protection", () => {
    const original = readFileSync("drizzle/migrations/0109_village_fire_order.sql", "utf8");
    const fix = readFileSync("drizzle/migrations/0111_fire_order_placement.sql", "utf8");
    const oldBlock = fix.match(/\$old\$([\s\S]*?)\$old\$/)?.[1];
    const newBlock = fix.match(/\$new\$([\s\S]*?)\$new\$/)?.[1];
    if (!oldBlock || !newBlock) throw new Error("Missing fire-order guard replacement");
    expect(original.replaceAll("''", "'")).toContain(oldBlock.trimStart());
    expect(newBlock).toBe(oldBlock
      .replace("an ordinance, no building site, once per village", "placeable rack, once per village; legacy unpositioned purchases remain valid")
      .replace("    IF NEW.x IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;\n", ""));
    expect(fix).toContain("EXECUTE replace(d, old_block, new_block)");
    const guard = readFileSync("drizzle/migrations/0105_monument_steps_no_wait_apply.sql", "utf8");
    expect(guard).toContain("IF (NEW.x IS NULL) <> (NEW.y IS NULL) THEN RAISE EXCEPTION 'bad position'");
    expect(guard).toContain("RAISE EXCEPTION 'too far'");
  });
  it("still costs 400 Mark and unlocks at rank 2", () => {
    expect(ITEMS.fireorder).toBe(400);
    expect(needRankOf("fireorder")).toBe(2);
  });
  it("is placed as its own building site where the player chose", () => {
    const s = { ...base, bought: [{ item: "fireorder", at: T, x: 304, y: 302 }] } as Seed;
    expect(specialSites(s).get(302 * MAP + 304)?.kind).toBe("firerack");
  });
  it("gives way once the fire-hook shed is bought", () => {
    const s = { ...base, bought: [{ item: "fireorder", at: T, x: 304, y: 302 }, { item: "firehouse", at: T + 30 * 864e5 }] } as Seed;
    expect(structureAt(304, 302, [s], T + 10 * 864e5)?.kind).toBe("firerack");
    expect(structureAt(304, 302, [s], T + 31 * 864e5)?.kind).not.toBe("firerack");
  });
});
