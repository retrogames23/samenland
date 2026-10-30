import { expect, test } from "vitest";
import { effAge, stageOf, careStage, type Seed } from "./world";
import { townOf } from "./people";

const E0 = Date.parse("2026-01-01T00:00:00Z"), day = 864e5;
const mk = (bought: string[] = []): Seed => ({ id: "p", name: "p", owner: "L", hue: 1, x: 306, y: 420, created_at: new Date(E0).toISOString(), user_id: "u",
  bought: bought.map((item) => ({ item, at: E0 })) } as Seed);

test("a neglected player town never passes the Dorf era", () => {
  const s = mk();
  expect(careStage(s, E0 + 900 * day)).toBe(2);
  expect(stageOf(effAge(s, [s], E0 + 900 * day))).toBe(2);
});
test("one food craft opens Kleinstadt, all care opens Metropole", () => {
  expect(careStage(mk(["fisher"]), E0 + day)).toBe(3);
  expect(careStage(mk(["fisher", "hunter", "herbs"]), E0 + day)).toBe(4);
  expect(careStage(mk(["fisher", "hunter", "granary", "herbs", "healer"]), E0 + day)).toBe(5);
});
test("without food crafts families move away and the town settles lower", () => {
  const t = E0 + 200 * day;
  const poor = townOf(mk(), [mk()], t).people.length;
  const fed = mk(["fisher", "hunter", "granary", "dairy", "herbs", "healer"]);
  expect(townOf(fed, [fed], t).people.length).toBeGreaterThan(poor);
});
test("an untended player town settles as a village of at most 32 households", () => {
  const s = mk(), t = Date.parse("2026-07-01T00:00:00Z");
  const homes = townOf(s, [s], t).people.filter((p) => p.role === "head").length;
  expect(homes).toBeLessThanOrEqual(32);
  expect(homes).toBeGreaterThanOrEqual(24);
});
