/**
 * Paket B – Mindestversion der Clients vor der echten Umschaltung (Voraussetzung für Paket C).
 *
 * Clients from before Paket B cannot tell "wedding settlement pending" from a lack of money — most clearly the
 * Gemeinschaftswerk, which shows "zu wenig Geld" for every refusal (main c8dcba4, Game.tsx payWork). The server can not
 * change an old client's texts, but it can stop it from working: every money action of an old client first calls one
 * of three server functions (settleTreasury via prepareSpend/refreshTreasury, decideEncounter, callNothilfe), and all
 * three go through useServerFn, which follows a thrown redirect. From CLIENT_GATE_LEAD before the wedding switch of
 * the realm, these functions answer a caller without CLIENT_PROTOCOL with a redirect that reloads the document — the
 * old tab loads the current client before any pending answer can exist (pending exists only from the switch on).
 * Current clients send `client: CLIENT_PROTOCOL` with these calls. While the switch is the placeholder 2100-01-04,
 * the gate never fires.
 */
import { weddingSwitchSince } from "@/game/weddings";

/** 2 = understands "wedding settlement pending" (Paket B). Raise together with a server change old clients cannot handle. */
export const CLIENT_PROTOCOL = 2;
/** The gate opens this long before the realm's wedding switch (Paket C must deploy at least this early). */
export const CLIENT_GATE_LEAD = 7 * 864e5;
/** True when the caller must reload before it may continue. */
export const clientOutdated = (client: number | undefined, realm: string | null | undefined, now: number): boolean =>
  (client ?? 0) < CLIENT_PROTOCOL && now >= weddingSwitchSince(realm) - CLIENT_GATE_LEAD;
/** The redirect the server functions throw for an outdated caller: a full document load of the game. */
export const RELOAD_TARGET = { to: "/", reloadDocument: true } as const;
