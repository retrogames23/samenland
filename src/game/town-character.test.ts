import { describe, expect, it } from "vitest";
import { characterFromTerrain, townCharacter } from "./character";
import { MAP, terrain, type Terrain } from "./world";

describe("three founding routes", () => {
  it("gives flat land the breadbasket route", () => {
    expect(characterFromTerrain(["grass", "fertile", "forest"]).main).toBe("grain");
  });
  it("gives hills and mountain foothills the workshop route", () => {
    expect(characterFromTerrain(["hill", "mountain", "grass"]).main).toBe("workshop");
  });
  it("gives coast and river surroundings the gateway route", () => {
    expect(characterFromTerrain(["water", "sand", "grass"]).main).toBe("gateway");
  });
  it("a beach site with 30 % water and shore is a gateway", () => {
    const tiles: Terrain[] = [...Array(30).fill("water"), ...Array(70).fill("grass")];
    expect(characterFromTerrain(tiles).main).toBe("gateway");
  });
  it("27 % sea water stays breadbasket", () => {
    expect(characterFromTerrain([...Array(27).fill("water"), ...Array(73).fill("grass")]).main).toBe("grain");
  });
  it("river water counts 1.8 times: 16 % river makes a gateway", () => {
    expect(characterFromTerrain([...Array(16).fill("water"), ...Array(84).fill("grass")], 16).main).toBe("gateway");
  });
  it("retains a mixed landscape as a secondary route", () => {
    expect(characterFromTerrain(["grass", "grass", "hill", "hill"])).toEqual({ main: "grain", side: "workshop", mix: { grain: 0.5, workshop: 0.5, gateway: 0 } });
  });
  it("never treats terrain outside the map as ocean", () => {
    const tiles: Terrain[] = [];
    for (let y = 0; y <= 14; y += 2) for (let x = 0; x <= 14; x += 2) if (x * x + y * y <= 196) tiles.push(terrain(x, y));
    expect(townCharacter({ x: 0, y: 0 })).toEqual(characterFromTerrain(tiles));
  });
  it("depends on founding position, not age or population", () => {
    const fresh = { x: MAP / 2, y: MAP / 2, created_at: "2026-11-01", population: 1 };
    const old = { ...fresh, created_at: "2024-01-01", population: 1000 };
    expect(townCharacter(fresh)).toEqual(townCharacter(old));
  });
});