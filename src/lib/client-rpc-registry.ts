// Paket C: every way the browser client can change something in the database directly (RPC with the anon key + the
// player's JWT, or a table write through PostgREST), with what it does to money/resources and what protects it.
// Two tests keep this list complete:
//   client-rpc-registry.test.ts  scans the client code: every RPC name and every table write must be listed here.
//   paket-c.pg.test.ts            reads the database: every VOLATILE function authenticated/anon may execute and every
//                                 table authenticated may write (privilege AND RLS policy) must be listed here — also
//                                 the ones the client code does not call, because a manipulated client can call them.
// Server functions (*.functions.ts / *.server.ts, service_role) are not client paths; encounters, the wedding booking
// and the treasury settlement run only there.

/** geld: what the path does to the chest / resources. pending: can refuse with 'wedding settlement pending' (or
 *  report pending: true) — the client must never treat that as success. */
export type ClientPath = {
  geld: "ausgabe" | "einnahme" | "ressourcen" | "loeschung" | "keins" | "lesend" | "unbekannt";
  pending: boolean;
  schutz: string;
};

export const CLIENT_RPCS: Record<string, ClientPath> = {
  civic_raise_budget_v2: { geld: "ressourcen", pending: true,
    schutz: "Protokoll ≥ client_protocol_min() (_client), sonst 'client outdated'; resource_refresh_try vor jeder Änderung, pending → Ausnahme ohne Teilbuchung; Client: retryOnPending (settleTreasury, dann einmal neu)" },
  civic_raise_budget: { geld: "ressourcen", pending: true,
    schutz: "Altsignatur alter Clients: bis T−7d Weiterleitung an civic_raise_budget_v2 (dieselbe Prüfung), ab T−7d 'client outdated' vor jedem Zugriff" },
  resource_overview_v2: { geld: "ressourcen", pending: true,
    schutz: "Protokoll ≥ client_protocol_min(); bucht fällige Ressourcentage über resource_refresh_try, pending → bucht nichts und meldet pending: true (Client zeigt keinen Erfolg)" },
  resource_overview: { geld: "ressourcen", pending: true,
    schutz: "Altsignatur alter Clients: bis T−7d Weiterleitung an resource_overview_v2, ab T−7d 'client outdated'" },
  civic_open: { geld: "keins", pending: false, schutz: "legt nur die Ausbaustufe mit Budget an (keine Kassenbuchung; gezahlt wird später über den Kontor in resource_refresh_try)" },
  claim_visit: { geld: "einnahme", pending: false, schutz: "nur angemeldet (0163: anon/PUBLIC entzogen); Einnahme ohne Kassenprüfung, vom Kassendeckel begrenzt; kein pending" },
  claim_referral: { geld: "einnahme", pending: false, schutz: "nur angemeldet; Einnahme ohne Kassenprüfung; kein pending" },
  claim_wonder: { geld: "einnahme", pending: false, schutz: "nur angemeldet; Einnahme ohne Kassenprüfung; kein pending" },
  princely_audience: { geld: "einnahme", pending: false, schutz: "nur angemeldet; Belohnung (Einnahme), keine Kassenprüfung; kein pending" },
  princely_knight: { geld: "keins", pending: false, schutz: "nur angemeldet; keine Kassenbuchung" },
  princely_swap: { geld: "keins", pending: false, schutz: "nur angemeldet; keine Kassenbuchung" },
  princely_errand: { geld: "unbekannt", pending: false,
    schutz: "vom Client aufgerufen und in den generierten Typen vorhanden, aber in KEINER Migration des Repos — lokal nicht prüfbar (siehe Betriebsdoku, Live-Prüfung nur lesend)" },
  abandon_village: { geld: "loeschung", pending: false, schutz: "nur das eigene Dorf (auth.uid); Hochzeitsbelege und -nachweis gehen per FK CASCADE mit verloren (Entscheidung, dokumentiert)" },
  rename_seed: { geld: "keins", pending: false, schutz: "nur das eigene Dorf" },
  send_letter: { geld: "keins", pending: false, schutz: "nur angemeldet" },
  survey_submit: { geld: "keins", pending: false, schutz: "nur angemeldet" },
  touch_activity: { geld: "keins", pending: false, schutz: "nur angemeldet" },
  update_mayor: { geld: "keins", pending: false, schutz: "nur das eigene Dorf" },
  survey_open: { geld: "lesend", pending: false, schutz: "STABLE, nur lesend" },
  village_last_seen: { geld: "lesend", pending: false, schutz: "STABLE, nur lesend" },
};

export const CLIENT_TABLE_WRITES: Record<string, ClientPath> = {
  purchases: { geld: "ausgabe", pending: true, schutz: "purchase_guard → wedding_money_check (pending/zu wenig Geld); Client: prepareSpend → settleTreasury (ab T−7d Gate für alte Clients)" },
  gifts: { geld: "ausgabe", pending: true, schutz: "gift_guard → wedding_money_check; Client: prepareSpend" },
  twin_works: { geld: "ausgabe", pending: true, schutz: "twin_work_guard → wedding_money_check; Client: prepareSpend" },
  building_moves: { geld: "ausgabe", pending: true, schutz: "building_move_guard → wedding_money_check; Client: prepareSpend" },
  market_sales: { geld: "einnahme", pending: false, schutz: "market_guard; Einnahme ohne Kassenprüfung, kein pending" },
  quest_claims: { geld: "einnahme", pending: false, schutz: "quest_guard; Einnahme ohne Kassenprüfung, kein pending" },
  seeds: { geld: "keins", pending: false, schutz: "RLS auth.uid() = user_id; Gründung" },
  charters: { geld: "keins", pending: false, schutz: "charter_guard (keine Kassenbuchung)" },
  blessings: { geld: "keins", pending: false, schutz: "blessing_cooldown (keine Kassenbuchung)" },
  first_roads: { geld: "keins", pending: false, schutz: "first_road_guard (keine Kassenbuchung)" },
  plantings: { geld: "keins", pending: false, schutz: "sapling_guard (keine Kassenbuchung)" },
  twin_votes: { geld: "keins", pending: false, schutz: "twin_vote_guard (keine Kassenbuchung)" },
  signposts: { geld: "keins", pending: false, schutz: "RLS eigenes Dorf" },
  village_dogs: { geld: "keins", pending: false, schutz: "RLS eigenes Dorf" },
  chat_messages: { geld: "keins", pending: false, schutz: "chat_guard / chat_edit_guard" },
  chat_blocks: { geld: "keins", pending: false, schutz: "RLS eigener Nutzer" },
  chat_reads: { geld: "keins", pending: false, schutz: "RLS eigener Nutzer" },
  feast_reads: { geld: "keins", pending: false, schutz: "RLS eigener Nutzer" },
  gift_reads: { geld: "keins", pending: false, schutz: "RLS eigener Nutzer" },
  chest_mail: { geld: "keins", pending: false, schutz: "RLS eigener Nutzer" },
  build_mail: { geld: "keins", pending: false,
    schutz: "vom Client beschrieben und in den generierten Typen vorhanden, aber in KEINER Migration des Repos angelegt — lokal nicht prüfbar" },
  bug_reports: { geld: "keins", pending: false, schutz: "bug_report_guard" },
};
/** In the client code and the generated types, but created by no migration of this repository (schema drift). */
export const NOT_IN_MIGRATIONS = ["princely_errand", "build_mail"] as const;
