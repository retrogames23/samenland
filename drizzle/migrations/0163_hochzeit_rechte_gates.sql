-- 0163 Hochzeit C – Rechte, versionierte Client-Wege (RPC-Gates) und Vorabprüfung. Baut auf 0160–0162 auf.
-- (Der Belegschutz H7 steht in 0161.)
-- Ändert keine Geldregel und keinen Buchungsweg; der Umschaltzeitpunkt bleibt der Platzhalter 2100-01-04.
--
-- 2) Rechte, jeweils durch einen Aufrufweg begründet (Test: paket-c.pg.test.ts):
--      village_weddings: kein Client ruft sie auf, intern nur über SECURITY-DEFINER-Funktionen des Eigentümers
--        (encounter_guard, village_balance_walk) → PUBLIC, anon, authenticated entzogen.
--      claim_visit (Besuchsbelohnung, Geld): nur der angemeldete Client ruft sie auf → PUBLIC, anon entzogen.
-- 3) Alte Clients, direkte RPCs: civic_raise_budget und resource_overview sind die beiden direkt erreichbaren RPCs, die
--    Ressourcen/Geld buchen und 'pending' kennen. Neue Clients rufen civic_raise_budget_v2 / resource_overview_v2 mit
--    _client (Protokoll ≥ client_protocol_min()) auf; die alten Signaturen bleiben für alte Clients und verweigern ab
--    client_gate_lead() vor dem Umschaltzeitpunkt ('client outdated') — dieselbe 7-Tage-Regel wie die Server-Gates
--    (src/lib/client-protocol.ts). Eigene Namen statt Überladungen: PostgREST wählt dann nie zwischen zwei Signaturen.

-- 2) Rechte ------------------------------------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.village_weddings(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_visit(uuid, uuid) FROM PUBLIC, anon;

-- 3) Versionierte Client-Wege -------------------------------------------------------------------------------------------
-- Spiegel von src/lib/client-protocol.ts (CLIENT_PROTOCOL, CLIENT_GATE_LEAD); paket-c.pg.test.ts vergleicht beide.
CREATE OR REPLACE FUNCTION public.client_protocol_min() RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT 2 $$;
CREATE OR REPLACE FUNCTION public.client_gate_lead() RETURNS interval LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT interval '7 days' $$;
-- ab wann alte Client-Wege für dieses Dorf verweigert werden (7 Tage vor seinem Umschaltzeitpunkt)
CREATE OR REPLACE FUNCTION public.client_gate_open(_seed uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT coalesce((SELECT now() >= public.wedding_switch_since(s.realm) - public.client_gate_lead() FROM public.seeds s WHERE s.id = _seed), true) $$;
REVOKE ALL ON FUNCTION public.client_protocol_min() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.client_gate_lead() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.client_gate_open(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.client_protocol_min(), public.client_gate_lead(), public.client_gate_open(uuid) TO service_role;

-- die neuen Wege entstehen aus der Live-Definition (gleicher Ablauf, gleiche Prüfungen, Muster aus 0046/0162); jede erwartete
-- Stelle muss genau einmal vorkommen, sonst bricht die Migration ab
CREATE OR REPLACE FUNCTION pg_temp.paket_c_patch(_fn text, _pairs text[])
 RETURNS text LANGUAGE plpgsql AS $$
DECLARE def text; i integer; n integer;
BEGIN
  def := pg_get_functiondef(_fn::regprocedure);
  FOR i IN 1 .. array_length(_pairs, 1) / 2 LOOP
    n := (length(def) - length(replace(def, _pairs[2 * i - 1], ''))) / length(_pairs[2 * i - 1]);
    IF n <> 1 THEN RAISE EXCEPTION 'Paket C: % enthält die erwartete Stelle % mal statt einmal: %', _fn, n, _pairs[2 * i - 1]; END IF;
    def := replace(def, _pairs[2 * i - 1], _pairs[2 * i]);
  END LOOP;
  RETURN def;
END $$;
DO $$ BEGIN
  IF to_regprocedure('public.civic_raise_budget_v2(uuid,text,integer,integer)') IS NULL THEN
    EXECUTE pg_temp.paket_c_patch('public.civic_raise_budget(uuid,text,integer)', ARRAY[
      'FUNCTION public.civic_raise_budget(_seed uuid, _item text, _budget integer)',
      'FUNCTION public.civic_raise_budget_v2(_seed uuid, _item text, _budget integer, _client integer)',
      chr(10) || 'BEGIN' || chr(10),
      chr(10) || 'BEGIN' || chr(10) || '  IF coalesce(_client, 0) < public.client_protocol_min() THEN RAISE EXCEPTION ''client outdated''; END IF;' || chr(10)]);
  END IF;
  IF to_regprocedure('public.resource_overview_v2(uuid,integer)') IS NULL THEN
    EXECUTE pg_temp.paket_c_patch('public.resource_overview(uuid)', ARRAY[
      'FUNCTION public.resource_overview(_seed uuid)',
      'FUNCTION public.resource_overview_v2(_seed uuid, _client integer)',
      chr(10) || 'BEGIN' || chr(10),
      chr(10) || 'BEGIN' || chr(10) || '  IF coalesce(_client, 0) < public.client_protocol_min() THEN RAISE EXCEPTION ''client outdated''; END IF;' || chr(10)]);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.civic_raise_budget_v2(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.civic_raise_budget_v2(uuid, text, integer, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.resource_overview_v2(uuid, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resource_overview_v2(uuid, integer) TO authenticated, service_role;

-- die alten Signaturen: bis 7 Tage vor dem Umschaltzeitpunkt unverändert (über den neuen Weg), danach verweigert.
-- CREATE OR REPLACE behält Eigentümer und Rechte (authenticated, service_role).
CREATE OR REPLACE FUNCTION public.civic_raise_budget(_seed uuid, _item text, _budget integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF public.client_gate_open(_seed) THEN RAISE EXCEPTION 'client outdated'; END IF;
  RETURN public.civic_raise_budget_v2(_seed, _item, _budget, public.client_protocol_min());
END $$;
CREATE OR REPLACE FUNCTION public.resource_overview(_seed uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF public.client_gate_open(_seed) THEN RAISE EXCEPTION 'client outdated'; END IF;
  RETURN public.resource_overview_v2(_seed, public.client_protocol_min());
END $$;

-- 4) Vorabprüfung vor der Aktivierung (nur lesend, service_role): je Dorf mit Eigentümer Klasse, Nachweis und ob es die
--    Aktivierung blockiert. Die Klassen kommen aus wedding_anchor_inventory (0160); der Nachweis aus wedding_settlement.
--      bereit       verankert, alle fälligen Hochzeiten gebucht, keine Abweichung, keine Quarantäne      (vollständig)
--      jung         noch keine Hochzeit möglich (jünger als 2 Tage) — bereit
--      nachholen    verankert, aber seit dem Anker ist eine Hochzeit fällig geworden, die der Sweep noch nicht gebucht
--                   hat (erklärt: der nächste Sweep bucht sie). Blockiert nicht für sich; bleibt ein Dorf über zwei
--                   Sweeps hinweg „nachholen“, gilt es als blockiert (Checkliste)
--      blockiert    alles andere: alt_rekonstruierbar und ohne_belege älter als 2 Tage (rekonstruierbar: Sweep),
--                   widerspruechlich, quarantaene, Abweichungen in wedding_receipt_inventory
CREATE OR REPLACE FUNCTION public.wedding_activation_inventory()
 RETURNS TABLE(seed_id uuid, realm text, klasse text, belege integer, anker_naechste timestamptz, nachweis_bis timestamptz,
               nachweis_ruhig_bis timestamptz, abweichungen integer, quarantaene text, status text, grund text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT a.seed_id, a.realm, a.klasse, a.belege, a.naechste, w.settled_through, w.quiet_until,
    coalesce(i.fehlt + i.weicht_ab + i.luecken + i.doppelt + i.falsche_version, 0),
    a.quarantaene,
    CASE WHEN a.klasse = 'verankert' AND coalesce(i.weicht_ab + i.luecken + i.doppelt + i.falsche_version, 0) = 0
           THEN CASE WHEN coalesce(i.fehlt, 0) = 0 THEN 'bereit' ELSE 'nachholen' END
         WHEN a.klasse = 'ohne_belege' AND s.created_at > now() - interval '2 days' THEN 'jung'
         ELSE 'blockiert' END,
    CASE WHEN a.klasse = 'quarantaene' THEN 'Quarantäne ' || a.quarantaene || ' – von Hand klären'
         WHEN a.klasse = 'widerspruechlich' THEN 'Belege widersprüchlich – von Hand klären, nichts reparieren'
         WHEN a.klasse = 'alt_rekonstruierbar' THEN 'höchster Beleg ohne Anker – Sweep, nächste Hochzeit abwarten'
         WHEN a.klasse = 'ohne_belege' AND s.created_at <= now() - interval '2 days' THEN 'keine Belege – Sweep laufen lassen'
         WHEN coalesce(i.weicht_ab + i.luecken + i.doppelt + i.falsche_version, 0) > 0 THEN 'Inventar meldet Abweichungen'
         WHEN a.klasse = 'verankert' AND coalesce(i.fehlt, 0) > 0 THEN i.fehlt || ' fällige Hochzeit(en) noch nicht gebucht – nächster Sweep'
         ELSE NULL END
  FROM public.wedding_anchor_inventory() a
  JOIN public.seeds s ON s.id = a.seed_id
  LEFT JOIN public.wedding_receipt_inventory() i ON i.seed_id = a.seed_id
  LEFT JOIN public.wedding_settlement w ON w.seed_id = a.seed_id
$$;
REVOKE ALL ON FUNCTION public.wedding_activation_inventory() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wedding_activation_inventory() TO service_role;

COMMENT ON TABLE public.wedding_receipts IS
  'Server-derived wedding records (index = WedDate.k). Version 1 = legacy rule (before wedding_switch_since), 2 = unified rule (from it; the only money record). History: never recomputed (A2, next_at anchors the continuation), never updated, never deleted or truncated one by one (0161, also for service_role); removed only with the village (FK CASCADE). Written only by wedding_receipts_book / wedding_settle.';
