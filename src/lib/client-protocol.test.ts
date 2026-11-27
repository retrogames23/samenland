// Abschluss Paket B, Punkt 3 (alte Clients) und Punkt 1 (Ratsbuch, Serverseite).
//   K  a client from before Paket B is reloaded by the server before the switch can make anything pending; the gate
//      never fires while the switch is the placeholder; current clients always send their protocol.
//   R  acceptRatsbuch settles the weddings (with proof) before its money-relevant insert.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isRedirect, redirect } from "@tanstack/react-router";
import { CLIENT_GATE_LEAD, CLIENT_PROTOCOL, RELOAD_TARGET, clientOutdated } from "./client-protocol";
import { weddingSwitchSince, WEDDING_SWITCH_SINCE } from "@/game/weddings";

const src = (p: string) => readFileSync(new globalThis.URL(`../${p}`, import.meta.url), "utf8");
const lib = (p: string) => readFileSync(new globalThis.URL(`../../node_modules/${p}`, import.meta.url), "utf8");

describe("Paket B – Mindestversion alter Clients vor der Umschaltung", () => {
  const T = weddingSwitchSince("europe");
  it("K1 the gate: old callers (no protocol, or below it) from CLIENT_GATE_LEAD before the switch on; current callers never", () => {
    expect(clientOutdated(undefined, "europe", T - CLIENT_GATE_LEAD - 1)).toBe(false);
    expect(clientOutdated(undefined, "europe", T - CLIENT_GATE_LEAD)).toBe(true);
    expect(clientOutdated(1, "europe", T + 1)).toBe(true);
    expect(clientOutdated(CLIENT_PROTOCOL, "europe", T + 365 * 864e5)).toBe(false);
    expect(clientOutdated(CLIENT_PROTOCOL, "lab", weddingSwitchSince("lab"))).toBe(false);
  });
  it("K1 today (switch on the placeholder 2100-01-04) the gate never fires, so nothing changes before Paket C", () => {
    expect(WEDDING_SWITCH_SINCE).toBe(Date.UTC(2100, 0, 4));
    expect(clientOutdated(undefined, "europe", Date.now())).toBe(false);
    expect(clientOutdated(undefined, "lab", Date.now())).toBe(false);
  });
  it("K2 the answer is a redirect that reloads the document (the old tab loads the current client)", () => {
    const r = redirect(RELOAD_TARGET);
    expect(isRedirect(r)).toBe(true);
    expect(r.options).toMatchObject({ to: "/", reloadDocument: true });
  });
  it("K2 the installed libraries follow it: useServerFn navigates on a thrown redirect, navigate with reloadDocument sets window.location", () => {
    const usf = lib("@tanstack/react-start/dist/esm/useServerFn.js");
    expect(usf).toContain("if (isRedirect(err))");
    expect(usf).toContain("return router.navigate(router.resolveRedirect(err).options)");
    const core = lib("@tanstack/router-core/dist/esm/router.js");
    expect(core).toMatch(/if \(hrefScheme \|\| reloadDocument\) \{[\s\S]{0,400}return documentNavigation\(this, reloadHref, rest\);/);
    expect(core).toMatch(/async function documentNavigation[\s\S]{0,900}else window\.location\.href = href;/);
  });
  it("K3 all three server functions an old client calls before a money action check the gate before any work", () => {
    const tf = src("lib/treasury.functions.ts"), ef = src("lib/encounter.functions.ts");
    for (const [file, name, work] of [[tf, "settleTreasury", "calculateTreasury("], [tf, "callNothilfe", "bookNothilfe("], [ef, "decideEncounter", "bookEncounter("]] as const) {
      const body = file.slice(file.indexOf(`export const ${name}`));
      const gate = body.indexOf("if (clientOutdated(data.client, own.realm, Date.now())) throw redirect(RELOAD_TARGET);");
      expect(gate, name).toBeGreaterThan(0);
      expect(gate, name).toBeLessThan(body.indexOf(work));
      expect(body.slice(0, gate), name).toContain("client: z.number().int().optional()");
    }
  });
  it("K4 the current client sends its protocol with every one of these calls", () => {
    expect(src("components/hooks/useTreasurySync.ts")).toContain("treasuryFn({ data: { seed: id, client: CLIENT_PROTOCOL } })");
    const game = src("components/Game.tsx");
    expect(game).toContain("decideFn({ data: { seed: my.id, event, choice, client: CLIENT_PROTOCOL } })");
    expect(game).toContain("nothilfeFn({ data: { seed: my.id, kind, at, client: CLIENT_PROTOCOL } })");
    expect(game.match(/\b(decideFn|nothilfeFn)\(\{ data: \{/g)?.length).toBe(2);       // no call without the protocol
    expect(src("components/hooks/useTreasurySync.ts").match(/treasuryFn\(\{ data:/g)?.length).toBe(1);
  });
});

describe("Paket B – Ratsbuch-Annahme folgt O2 (Serverseite)", () => {
  it("R3 acceptRatsbuch settles the weddings with their proof before the encounter insert; pending maps to its own code", () => {
    const rb = src("lib/ratsbuch.server.ts");
    const body = rb.slice(rb.indexOf("export async function acceptRatsbuch"));
    const settle = body.indexOf("settleBeforeSpendById(seedId, Date.now())");
    expect(settle).toBeGreaterThan(0);
    expect(settle).toBeLessThan(body.indexOf('.from("encounters")'));
    expect(body).toContain("guardCode(error?.message");
    const tre = src("lib/treasury.server.ts");
    const fn = tre.slice(tre.indexOf("export async function settleBeforeSpendById"));
    expect(fn.indexOf("if (now < Math.min(sw.ts, sw.db)) return null;")).toBeLessThan(fn.indexOf("loadEconomyInput(realm)")); // no realm load before the switch
    expect(fn).toContain("return settleBeforeSpend(seed, now);");
  });
});
