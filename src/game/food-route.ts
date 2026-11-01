import type { Kind } from "./world";
/** Two meals per worker: cheese is ready food; grain needs two sheaves per meal. */
export function farmRecipe(kind: Kind | null, dairy: boolean): { ware: "grain" | "cheese"; units: number } {
  return kind === "pasture" && dairy ? { ware: "cheese", units: 2 } : { ware: "grain", units: 4 };
}