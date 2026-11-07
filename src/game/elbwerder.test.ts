import { describe, expect, it, afterEach } from "vitest";
import { setRealm, REALMS, REALM_TZ, EUROPE_FULL } from "./time";
import { ISLAND } from "./islands";
import { BIOME_OF } from "./biome";
import { terrain } from "./world";

afterEach(() => setRealm("europe"));
describe("Elbwerder (Europa II)", () => {
  it("opens to newcomers once Altenland holds 60 villages", () => expect(EUROPE_FULL).toBe(60));
  it("is a public map on the Berlin clock named Elbwerder", () => {
    expect(REALMS).toContain("europe-2");
    expect(REALM_TZ["europe-2"]).toBe("Europe/Berlin");
    expect(ISLAND["europe-2"]).toBe("Elbwerder");
  });
  it("shares Altenland's flora but has its own island shape", () => {
    expect(BIOME_OF["europe-2"]).not.toBe("heartland");
    const sample = () => { let s = ""; for (let y = 0; y < 1024; y += 64) for (let x = 0; x < 1024; x += 64) s += terrain(x, y)[0]; return s; };
    setRealm("europe"); const eu = sample();
    setRealm("europe-2"); expect(sample()).not.toBe(eu);
  });
});
