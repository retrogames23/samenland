import { expect, it, vi } from "vitest";
vi.mock("./world", () => ({ monumentOf: () => null, monumentSteps: () => [], monumentDone: () => 0, specialDone: (_s: unknown, _a: unknown, at: number) => at + 3600000 }));
import { buildMailDue } from "./build-mail";
const H = 3600000, now = Date.parse("2026-11-16T12:07:00Z"), win = 7 * 24 * H;
it("no letter for buildings finished long before opting in", () => {
  expect(buildMailDue({} as never, "granary", now - 100 * H, new Set([now - 100 * H]), now, win, now - 3 * H)).toBe(false);
});
it("letter for the building finished after opting in", () => {
  expect(buildMailDue({} as never, "markethall", now - 2 * H, new Set([now - 2 * H]), now, win, now - 3 * H)).toBe(true);
});
