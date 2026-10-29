import { describe, expect, it } from "vitest";
import { LANDMARKS, STAGES } from "./world";

describe("bakeries", () => {
  it("a second bakery arrives with the Handelsstadt stage", () => {
    const at = LANDMARKS.filter((l) => l.kind === "bakery").map((l) => l.at).sort((a, b) => a - b);
    expect(at).toEqual([360, STAGES.find((s) => s.name === "Handelsstadt")!.from]);
  });
});
