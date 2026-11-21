import { describe, it, expect } from "vitest";
import { simulate } from "./engine";
import { PROFILES } from "./profiles";
import { resetBirthCache } from "../world";

/** Testebene 3: one scenario must give the same result alone (fresh caches) and after other scenarios in one process. */
const P = { ...PROFILES.gelegenheit, repeat: true, ausbau: true };
const run = (location: string, days: number) => JSON.stringify(simulate({ profile: P, charter: "farm", location, days, rankEvery: 10 }));

describe("simulation: single and multi-scenario runs agree", () => {
  // the caches are reset before each "alone" run and before each sequence, as in a fresh process
  it("workshop alone = workshop after grain; gateway alone = gateway after workshop (60 days)", () => {
    resetBirthCache(); const workshop = run("workshop", 60);
    resetBirthCache(); const gateway = run("gateway", 60);
    resetBirthCache(); run("grain", 60);
    expect(run("workshop", 60)).toBe(workshop);
    resetBirthCache(); run("workshop", 60);
    expect(run("gateway", 60)).toBe(gateway);
  });
});
