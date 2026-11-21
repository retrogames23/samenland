import { describe, expect, it } from "vitest";
import { ownSites, type WonderFind } from "./wonders";

const row = (id: string, seed: string, site: string, realm = "europe"): WonderFind =>
  ({ id, seed_id: seed, site, realm, first: false, reward: 50, created_at: "2026-11-20T10:00:00Z" });

describe("ownSites (Landmarks mit Entdeckung der eigenen Siedlung)", () => {
  const rows = [row("1", "A", "oak:10:20"), row("2", "B", "cave:30:40"), row("3", "A", "ruin:5:6")];
  it("contains only the own village's discoveries", () => {
    expect([...ownSites(rows, "A")].sort()).toEqual(["oak:10:20", "ruin:5:6"]);
  });
  it("another village's find does not count as own", () => {
    expect(ownSites(rows, "B").has("oak:10:20")).toBe(false);
    expect(ownSites(rows, "B").has("cave:30:40")).toBe(true);
  });
  it("is empty without an own village", () => {
    expect(ownSites(rows, null).size).toBe(0);
    expect(ownSites(rows, undefined).size).toBe(0);
    expect(ownSites(rows, "Z").size).toBe(0);
  });
});
