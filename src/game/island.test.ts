import { describe, it, expect } from "vitest";
import { setBiome } from "./biome";
import { landmassSize, remoteIsle } from "./island";
describe("remote islet warning", () => {
  it("flags small Asia islands (76 and 590 tiles) below 1500 land tiles", () => {
    setBiome("asia");
    expect(landmassSize(280, 180, 5000)).toBe(76);
    expect(landmassSize(182, 95, 5000)).toBe(590);
    expect(remoteIsle(280, 180)).toBe(true);
    expect(remoteIsle(182, 95)).toBe(true);
  });
  it("does not flag the large Europe heartland", () => {
    setBiome("europe");
    expect(remoteIsle(520, 480)).toBe(false);
  });
});
