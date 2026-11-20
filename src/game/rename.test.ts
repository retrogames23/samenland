import { describe, expect, it } from "vitest";
import { RENAME_WAIT, renameDaysLeft, renameReadyAt } from "./rename";

describe("village rename cooldown", () => {
  it("allows a first rename immediately and the next one after exactly seven days", () => {
    expect(RENAME_WAIT).toBe(7 * 864e5);
    expect(renameReadyAt(null)).toBe(0);
    const renamed = Date.parse("2026-11-20T20:13:00Z");
    const ready = renameReadyAt(new Date(renamed).toISOString());
    expect(ready).toBe(renamed + 7 * 864e5);
    expect(renameDaysLeft(ready, renamed)).toBe(7);
    expect(renameDaysLeft(ready, renamed + 6 * 864e5)).toBe(1);
    expect(renameDaysLeft(ready, ready)).toBe(0);
  });
});
