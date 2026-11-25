import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { JOB_WORK, standPoseOf, standSheetOf, type FolkSprite } from "./folk-sprites";

// Every figure kind folkOf (render.ts) can hand to drawFolk, festive kinds included.
const KINDS: FolkSprite[] = [
  "man",
  "woman",
  "toddler",
  "child",
  "girl",
  "youth",
  "youthF",
  "porter",
  "porterF",
  "builder",
  "builderF",
  "farmer",
  "farmerF",
  "woodcutter",
  "woodcutterF",
  "mason",
  "masonF",
  "priest",
  "watchman",
  "elder",
  "elderF",
  "wealthy",
  "wealthyF",
  "bride",
  "groom",
  "robber",
];

describe("standing picture at work without a work sheet of one's own", () => {
  it("the plain villager at work stands in man-stand8, the same picture as at rest", () => {
    expect(standPoseOf("man", true)).toEqual(["manStand8", 1, 0]);
    expect(standPoseOf("man", true)).toEqual(standPoseOf("man", false));
  });
  it("at rest every kind keeps exactly its previous stand mapping", () => {
    for (const k of KINDS) expect(standPoseOf(k, false), k).toEqual(standSheetOf(k));
  });
  it("at work every other kind keeps its single picture (no stand sheet) as before", () => {
    for (const k of KINDS) if (k !== "man") expect(standPoseOf(k, true), k).toBeNull();
  });
  it("trades with a work sheet of their own still have it (drawn before the standing branch)", () => {
    for (const j of [
      "smith",
      "fisher",
      "woodcutter",
      "mason",
      "builder",
      "herbalist",
      "healer",
      "hunter",
    ] as const) {
      expect(JOB_WORK[j], j).toBeDefined();
    }
  });
});

// Order of the branches in drawFolk: the fallback may only reach figures that nothing earlier has drawn.
describe("drawFolk branch order (source)", () => {
  const src = readFileSync(new URL("./render.ts", import.meta.url), "utf8");
  const body = src.slice(
    src.indexOf("function drawFolk("),
    src.indexOf("function drawSheetSheared("),
  );
  it("the work sheet is drawn and returns before the standing branch", () => {
    const work = body.indexOf("if (mow) {"),
      ret = body.indexOf("return [X, Y - hgt];", work),
      stand = body.indexOf("standPoseOf(k, q.working)");
    expect(work).toBeGreaterThan(0);
    expect(ret).toBeGreaterThan(work);
    expect(stand).toBeGreaterThan(ret);
  });
  it("walking and resting on the walk8 cycle stay limited to villagers not at work", () => {
    expect(body).toContain('const refMan = k === "man" && !q.working && q.p.job !== "mayor";');
    expect(body).toContain("const w8 = refMan && !rigged ? walkSheet(k) : null;");
  });
  it("standPoseOf is used once, in the standing branch only", () => {
    expect(src.split("standPoseOf(").length - 1).toBe(1);
  });
});
