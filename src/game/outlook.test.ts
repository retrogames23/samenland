import { describe, it, expect } from "vitest";
import { stageUnlocks } from "@/components/Outlook";

describe("stage outlook", () => {
  it("lists the school as a small-town unlock", () => expect(stageUnlocks(3, null, "grain").items).toContain("school"));
  it("lists the watermill as growing in the village era", () => expect(stageUnlocks(2, null, "grain").grows).toContain("watermill"));
  it("shows only the own way's monument", () => {
    const m = stageUnlocks(3, null, "grain").monuments;
    expect(m).toContain("harvest"); expect(m).not.toContain("lighthouse");
  });
});
