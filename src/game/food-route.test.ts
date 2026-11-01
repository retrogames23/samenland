import { expect, it } from "vitest";
import { farmRecipe } from "./food-route";
it("pasture workers make cheese only with a bought dairy", () => {
  expect(farmRecipe("pasture", true)).toEqual({ ware: "cheese", units: 2 });
  expect(farmRecipe("pasture", false)).toEqual({ ware: "grain", units: 4 });
});
it("terrace gardens provide the same meal equivalent as pasture cheese", () => {
  expect(farmRecipe("garden", true).units * 0.5).toBe(farmRecipe("pasture", true).units);
});