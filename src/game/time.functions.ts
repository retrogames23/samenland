import { createServerFn } from "@tanstack/react-start";

/** Lightweight server time for the realm clock; no database access. */
export const getServerTime = createServerFn({ method: "GET" }).handler(async () => ({ serverTime: Date.now() }));
