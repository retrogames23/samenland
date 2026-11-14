import { describe, expect, it, afterEach } from "vitest";
import { setRealm, REALMS, REALM_TZ, REALM_FULL, REALM_NEXT, openRealm, type Realm } from "./time";
import { ISLAND } from "./islands";
import { BIOME_OF } from "./biome";
import { terrain, buildable, MAP } from "./world";

afterEach(() => setRealm("europe"));
const NEW: [Realm, string, Realm][] = [["europe-3", "Störwerder", "europe"], ["us-west-2", "Hallighörn", "us-west"], ["us-east-2", "Boddenholm", "us-east"], ["asia-2", "Moorgeest", "asia"]];
describe("new islands", () => {
  for (const [r, name, parent] of NEW) it(`${name} is public, on its time zone's clock, with its own land`, () => {
    expect(REALMS).toContain(r);
    expect(ISLAND[r]).toBe(name);
    expect(REALM_TZ[r]).toBe(REALM_TZ[parent]);
    expect(new Set(Object.values(BIOME_OF)).size).toBe(Object.keys(BIOME_OF).length - 1); // only lab shares heartland
    setRealm(r); let land = 0, n = 0;
    for (let y = 0; y < MAP; y += 16) for (let x = 0; x < MAP; x += 16) { n++; if (buildable(terrain(x, y))) land++; }
    expect(land / n).toBeGreaterThan(0.3);
  });
});
describe("overflow chain", () => {
  it("sends newcomers on from 60 villages", () => {
    expect(REALM_FULL).toBe(60);
    expect(openRealm("europe", (q) => (q === "europe" ? 59 : 0))).toBe("europe");
    expect(openRealm("europe", (q) => (q === "europe" ? 60 : 0))).toBe("europe-2");
    expect(openRealm("europe", (q) => (q === "europe-3" ? 0 : 60))).toBe("europe-3");
    expect(openRealm("europe", () => 999)).toBe("europe-3");
    expect(openRealm("asia", (q) => (q === "asia" ? 60 : 0))).toBe("asia-2");
    expect(REALM_NEXT["us-west"]).toBe("us-west-2");
    expect(REALM_NEXT["us-east"]).toBe("us-east-2");
  });
});
