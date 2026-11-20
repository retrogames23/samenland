import { expect, it } from "vitest";

/**
 * Server contexts (workerd, SSR) expose a `localStorage` global whose *access* throws
 * NotSupportedError, so a plain `typeof localStorage !== "undefined"` guard is not enough:
 * importing the sun module must survive that. Regression for the blocked rank certification
 * ("Der Bau wurde abgelehnt") that also refused the Freimarkt purchase.
 */
it("imports the sun module when localStorage access throws", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() { throw new Error("LocalStorage is not supported in this context."); },
  });
  try {
    const mod = await import("./sun?throwing-storage");
    expect(typeof mod.sunTimes).toBe("function");
    expect(mod.isAlwaysDay()).toBe(false);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete (globalThis as Record<string, unknown>).localStorage;
  }
});
