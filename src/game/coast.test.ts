import { expect, test } from "vitest";
import { landShape, townStats, type Seed } from "./world";
const mk = (id: string, x: number, y: number) => ({ id, name: id, x, y, created_at: "2026-06-01T00:00:00Z", hue: 0 }) as unknown as Seed;
test("a harbour town grows inland and reaches at least 80% of an inland town's buildings", () => {
  const now = Date.parse("2028-06-01");
  const coast = mk("a", 306, 420), inland = mk("b", 343, 481);
  expect(landShape(coast).k).toBeGreaterThan(1.5);
  expect(landShape(inland).k).toBe(1);
  expect(townStats(coast, [coast], now).buildings).toBeGreaterThan(0.8 * townStats(inland, [inland], now).buildings);
});
