import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { gaitFrame, walkBob } from "./figure";

/** Sheets that currently fail the lint (docs/walk-animation-guide.md). Shrink this list as they are
 * redrawn — never grow it: a new or replaced sheet must pass every check before it ships. */
const KNOWN_BAD = new Set([
  "deer-walk.webp", "hunter-walk.webp", "man-walk.webp", "ox-walk.webp", "toddler-walk.webp", "youth-walk4.webp",
  "groom-walk4.webp", "mason-walk4.webp", "mayor-mid-walk4.webp", "mayor-old-walk4.webp", "mayor-walk4.webp",
  "mayor-young-walk4.webp", "porter-walk4.webp", "robber-walk4.webp", "watchman-walk4.webp", "woodcutter-walk4.webp",
]);

describe("walk cycle maths", () => {
  it("visits every leg frame once per cycle in order, without skips", () => {
    const seen: number[] = [];
    for (let i = 0; i < 400; i++) {
      const f = gaitFrame((i / 400) * 6.2832);
      if (seen[seen.length - 1] !== f) seen.push(f);
    }
    expect(seen).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it("bobs the body down only (never above standing height) and returns to rest at contact", () => {
    for (let i = 0; i <= 100; i++) expect(walkBob((i / 100) * 6.2832, 100)).toBeLessThanOrEqual(0);
    expect(walkBob(0, 100)).toBeCloseTo(0);
  });
});

describe("painted walk sheets", () => {
  const report = JSON.parse(
    (() => { try { return execFileSync("python3", ["scripts/check-walk-sheets.py"], { encoding: "utf8" }); }
      catch (e) { return (e as { stdout: string }).stdout; } })(),
  ) as Record<string, string[]>;
  for (const [file, errs] of Object.entries(report)) {
    const name = file.split("/").pop()!;
    it(`${name}: stride, ground line, centring and torso stay consistent`, () => {
      if (KNOWN_BAD.has(name)) expect(errs.length, `${name} passes now — remove it from KNOWN_BAD`).toBeGreaterThan(0);
      else expect(errs).toEqual([]);
    });
  }
});
