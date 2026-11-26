-- Paket B – O1 (Vollständigkeit der Hochzeitsabrechnung) und O2 (Reihenfolge, Pending). Baut auf 0159 und 0160 (A2) auf.
--
-- Problem: ab wedding_switch_since(realm) kennt die Datenbank eine Hochzeit nur als Beleg, den der vertrauenswürdige
-- Server bucht. Bis er gebucht ist, ist der Kassenstand ein unterer Grenzwert, und jede Geld- oder Ressourcenbuchung,
-- die ihn verwendet, liefe mit einem unvollständigen Stand: ein Kauf würde als „not enough money“ abgelehnt, obwohl
-- nur die Abrechnung aussteht; die tägliche Gemeindebau-Kontorbuchung (civic_day) würde mit zu wenig Geld rechnen; und
-- purchase_material würde mit veralteten Beständen weiterarbeiten.
--
-- 1) wedding_settlement: der Vollständigkeitsnachweis je Dorf. settled_through (einschließlich): bis hierhin hat der
--    Server abgerechnet; quiet_until (ausschließlich): bis hierhin gibt es sicher keine weitere Hochzeit — es ist das
--    next_at des Ankers (A2), also unveränderlich. Geschrieben NUR von wedding_settle, in derselben Transaktion wie die
--    Belege, und nur, wenn die Belegkette ihn trägt (Anker vorhanden, next_at > settled_through).
-- 2) wedding_settled_at(seed, t): vollständig, wenn t ≤ settled_through ODER t < quiet_until — und nur, wenn der Nachweis
--    zum heutigen Anker passt (Index und next_at des höchsten Belegs). Fehlend, widersprüchlich oder nicht prüfbar =
--    NICHT vollständig. Vor dem Umschaltzeitpunkt rechnet die Datenbank jede Hochzeit selbst (immer vollständig); vor
--    dem ersten möglichen Hochzeitstermin (Gründung + 2 Tage, beide Regeln) gibt es noch keine Hochzeit.
-- 3) wedding_money_check(seed, preis) — die eine Geldprüfung aller Wächter (E2):
--      Kasse ≥ Preis                    → erlaubt (der gebuchte Stand ist ein geprüfter unterer Grenzwert: ein fehlender
--                                          Hochzeitsbeleg kann ihn nie erhöhen; Tests: paket-b.pg.test.ts B5–B7, E2-Matrix)
--      Kasse < Preis, nicht vollständig → 'wedding settlement pending' (nie „not enough money“)
--      Kasse < Preis, vollständig       → 'not enough money'
--    Eingesetzt in purchase_guard, gift_guard, encounter_guard, twin_work_guard, building_move_guard und der
--    Kontor-Prüfung von purchase_material (jeweils die eine bisherige Zeile, über die Live-Definition ersetzt).
-- 4) resource_refresh_try(seed, tag) → 'current' | 'booked' | 'inactive' | 'pending': die Ressourcenabrechnung mit
--    ausdrücklichem Ergebnis. 'pending', wenn eine offene Gemeindebau-Stufe zu buchen wäre (deren Kontorbuchung die Kasse
--    liest) und die Hochzeitsabrechnung nicht vollständig ist — dann wird NICHTS gebucht. resource_refresh_at raised bei
--    'pending' ('wedding settlement pending'), statt still zurückzukehren; purchase_material, civic_raise_budget prüfen
--    das Ergebnis ausdrücklich, resource_overview meldet es (Feld pending).
-- 5) wedding_settle(seed, rows, bis): bucht die Belege (wie wedding_receipts_book) und setzt den Nachweis atomar.
-- 6) village_balance_checked(seed): Kasse und Vollständigkeit in einem Aufruf (Server, chest-mail).
-- Unverändert: Hochzeitsregel, Geldfunktionen (village_balance, village_balance_walk, village_wedding_list), A2.

-- 1) Nachweis
CREATE TABLE IF NOT EXISTS public.wedding_settlement (
  seed_id uuid PRIMARY KEY REFERENCES public.seeds(id) ON DELETE CASCADE,
  settled_through timestamptz NOT NULL,
  quiet_until timestamptz NOT NULL,
  anchor_index integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wedding_settlement_interval CHECK (quiet_until > settled_through)
);
ALTER TABLE public.wedding_settlement ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wedding_settlement FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.wedding_settlement TO service_role;
COMMENT ON TABLE public.wedding_settlement IS
  'Paket B (O1): Vollständigkeitsnachweis der Hochzeitsabrechnung je Dorf. settled_through einschließlich, quiet_until ausschließlich (= next_at des Ankers, A2). Geschrieben nur von wedding_settle, atomar mit den Belegen; gilt nur, solange anchor_index und quiet_until zum höchsten Beleg passen (wedding_settled_at).';

-- 2) Vollständigkeit
CREATE OR REPLACE FUNCTION public.wedding_settled_at(_seed uuid, _at timestamptz)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE c0 timestamptz; owner uuid; rlm text; m record; top record;
BEGIN
  IF _at IS NULL THEN RETURN false; END IF;
  SELECT date_trunc('milliseconds', s.created_at), s.user_id, s.realm INTO c0, owner, rlm FROM public.seeds s WHERE s.id = _seed;
  IF c0 IS NULL THEN RETURN false; END IF;
  IF owner IS NULL THEN RETURN true; END IF;                               -- ohne Eigentümer rechnet die Datenbank selbst
  IF _at < public.wedding_switch_since(rlm) THEN RETURN true; END IF;      -- vor dem Umschaltzeitpunkt ebenso
  IF _at < c0 + interval '2 days' THEN RETURN true; END IF;                -- erste Hochzeit frühestens am 2. Tag
  IF EXISTS (SELECT 1 FROM public.wedding_quarantine q WHERE q.seed_id = _seed AND q.released_at IS NULL) THEN RETURN false; END IF;
  SELECT * INTO m FROM public.wedding_settlement w WHERE w.seed_id = _seed;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT r.wedding_index, r.next_at INTO top FROM public.wedding_receipts r WHERE r.seed_id = _seed ORDER BY r.wedding_index DESC LIMIT 1;
  IF NOT FOUND OR top.wedding_index IS DISTINCT FROM m.anchor_index OR top.next_at IS DISTINCT FROM m.quiet_until THEN RETURN false; END IF;
  RETURN _at <= m.settled_through OR _at < m.quiet_until;
END $$;
REVOKE ALL ON FUNCTION public.wedding_settled_at(uuid, timestamptz) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wedding_settled_at(uuid, timestamptz) TO service_role;

-- 3) die eine Geldprüfung (E2)
CREATE OR REPLACE FUNCTION public.wedding_money_check(_seed uuid, _price integer)
 RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF public.village_balance(_seed) >= coalesce(_price, 0) THEN RETURN; END IF;
  IF NOT public.wedding_settled_at(_seed, now()) THEN RAISE EXCEPTION 'wedding settlement pending'; END IF;
  RAISE EXCEPTION 'not enough money';
END $$;
REVOKE ALL ON FUNCTION public.wedding_money_check(uuid, integer) FROM PUBLIC, anon, authenticated, service_role;

-- 5) Buchung + Nachweis in einer Transaktion
CREATE OR REPLACE FUNCTION public.wedding_settle(_seed uuid, _rows jsonb, _through timestamptz)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE res jsonb := jsonb_build_object('inserted', 0, 'already', 0); top record;
BEGIN
  IF _through IS NULL THEN RAISE EXCEPTION 'wedding settlement needs an instant'; END IF;
  IF _through > now() + interval '5 minutes' THEN RAISE EXCEPTION 'wedding settlement in the future'; END IF;
  PERFORM pg_advisory_xact_lock(public.wedding_lock_key(_seed));
  IF NOT EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = _seed) THEN RAISE EXCEPTION 'wedding settlement for an unknown village'; END IF;
  IF EXISTS (SELECT 1 FROM public.wedding_quarantine q WHERE q.seed_id = _seed AND q.released_at IS NULL) THEN
    RAISE EXCEPTION 'wedding settlement quarantined';
  END IF;
  IF _rows IS NOT NULL AND jsonb_typeof(_rows) = 'array' AND jsonb_array_length(_rows) > 0 THEN
    res := public.wedding_receipts_book(_seed, _rows);
  END IF;
  SELECT r.wedding_index, r.next_at INTO top FROM public.wedding_receipts r WHERE r.seed_id = _seed ORDER BY r.wedding_index DESC LIMIT 1;
  -- der Nachweis nur, wenn die Kette ihn trägt: der Anker kennt die nächste Hochzeit, und sie liegt nach `_through`
  IF FOUND AND top.next_at IS NOT NULL AND top.next_at > _through THEN
    INSERT INTO public.wedding_settlement (seed_id, settled_through, quiet_until, anchor_index, updated_at)
      VALUES (_seed, _through, top.next_at, top.wedding_index, now())
      ON CONFLICT (seed_id) DO UPDATE SET
        settled_through = greatest(public.wedding_settlement.settled_through, EXCLUDED.settled_through),
        quiet_until = EXCLUDED.quiet_until, anchor_index = EXCLUDED.anchor_index, updated_at = now();
    RETURN res || jsonb_build_object('marked', true, 'quiet_until', top.next_at);
  END IF;
  RETURN res || jsonb_build_object('marked', false);
END $$;
REVOKE ALL ON FUNCTION public.wedding_settle(uuid, jsonb, timestamptz) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wedding_settle(uuid, jsonb, timestamptz) TO service_role;

-- 6) Kasse mit Vollständigkeit
CREATE OR REPLACE FUNCTION public.village_balance_checked(_seed uuid)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT jsonb_build_object('balance', public.village_balance(_seed), 'settled', public.wedding_settled_at(_seed, now())) $$;
REVOKE ALL ON FUNCTION public.village_balance_checked(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.village_balance_checked(uuid) TO service_role;

-- 3b/4) die bestehenden Funktionen gezielt über ihre Live-Definition anpassen (Muster aus 0046). Jede erwartete Stelle muss
--       genau einmal vorkommen, sonst bricht die Migration ab — eine abweichende Live-Definition wird so sichtbar.
--       CREATE OR REPLACE behält Eigentümer und Rechte der Funktionen.
CREATE OR REPLACE FUNCTION pg_temp.paket_b_patch(_fn text, _pairs text[])
 RETURNS text LANGUAGE plpgsql AS $$
DECLARE def text; i integer; n integer;
BEGIN
  def := pg_get_functiondef(_fn::regprocedure);
  FOR i IN 1 .. array_length(_pairs, 1) / 2 LOOP
    n := (length(def) - length(replace(def, _pairs[2 * i - 1], ''))) / length(_pairs[2 * i - 1]);
    -- erneuter Lauf: die Stelle ist schon ersetzt (alte Fassung fehlt, neue steht genau einmal da) → überspringen
    CONTINUE WHEN n = 0 AND (length(def) - length(replace(def, _pairs[2 * i], ''))) / length(_pairs[2 * i]) = 1;
    IF n <> 1 THEN RAISE EXCEPTION 'Paket B: % enthält die erwartete Stelle % mal statt einmal: %', _fn, n, _pairs[2 * i - 1]; END IF;
    def := replace(def, _pairs[2 * i - 1], _pairs[2 * i]);
  END LOOP;
  RETURN def;
END $$;

-- 3b) die Geldprüfung der fünf Wächter
DO $$ BEGIN
  EXECUTE pg_temp.paket_b_patch('public.purchase_guard()', ARRAY[
    'IF public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION ''not enough money''; END IF;',
    'PERFORM public.wedding_money_check(NEW.seed_id, price);']);
  EXECUTE pg_temp.paket_b_patch('public.gift_guard()', ARRAY[
    'IF public.village_balance(NEW.from_seed) < NEW.amount THEN RAISE EXCEPTION ''not enough money''; END IF;',
    'PERFORM public.wedding_money_check(NEW.from_seed, NEW.amount);']);
  EXECUTE pg_temp.paket_b_patch('public.encounter_guard()', ARRAY[
    'IF price > 0 AND public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION ''not enough money''; END IF;',
    'IF price > 0 THEN PERFORM public.wedding_money_check(NEW.seed_id, price); END IF;']);
  EXECUTE pg_temp.paket_b_patch('public.twin_work_guard()', ARRAY[
    'IF public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION ''not enough money''; END IF;',
    'PERFORM public.wedding_money_check(NEW.seed_id, price);']);
  EXECUTE pg_temp.paket_b_patch('public.building_move_guard()', ARRAY[
    'IF public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION ''not enough money''; END IF;',
    'PERFORM public.wedding_money_check(NEW.seed_id, price);']);
END $$;

-- 4) Ressourcenabrechnung mit ausdrücklichem Ergebnis: resource_refresh_try entsteht aus der Live-Definition von
--    resource_refresh_at (gleicher Ablauf, gleiche Buchungen); neu ist nur das Ergebnis und die Pending-Sperre vor der
--    ersten Buchung.
DO $$ BEGIN
  IF to_regprocedure('public.resource_refresh_try(uuid,date)') IS NOT NULL THEN RETURN; END IF; -- erneuter Lauf
  EXECUTE pg_temp.paket_b_patch('public.resource_refresh_at(uuid,date)', ARRAY[
    'FUNCTION public.resource_refresh_at(_seed uuid, _today date)' || chr(10) || ' RETURNS void',
    'FUNCTION public.resource_refresh_try(_seed uuid, _today date)' || chr(10) || ' RETURNS text',
    'IF thru IS NOT NULL AND thru >= _today THEN RETURN; END IF;',
    'IF thru IS NOT NULL AND thru >= _today THEN RETURN ''current''; END IF;',
    'IF c0 IS NULL THEN RETURN; END IF;',
    'IF c0 IS NULL THEN RETURN ''inactive''; END IF;',
    'IF t0 >= (_today + 1)::timestamp AT TIME ZONE ''UTC'' THEN RETURN; END IF;',
    'IF t0 >= (_today + 1)::timestamp AT TIME ZONE ''UTC'' THEN RETURN ''inactive''; END IF;' || chr(10) ||
    '  -- Paket B (O2): eine offene Gemeindebau-Stufe bucht ihr Kontor aus der Kasse (civic_day/civic_cash_from) — nur mit' || chr(10) ||
    '  -- vollständiger Hochzeitsabrechnung; sonst wird nichts gebucht und der Aufrufer erfährt es ausdrücklich' || chr(10) ||
    '  IF EXISTS (SELECT 1 FROM public.civic_stages c WHERE c.seed_id = _seed AND c.material_at IS NULL' || chr(10) ||
    '      AND c.funded_at < _today::timestamp AT TIME ZONE ''UTC'') AND NOT public.wedding_settled_at(_seed, now()) THEN' || chr(10) ||
    '    RETURN ''pending'';' || chr(10) ||
    '  END IF;',
    'IF NOT EXISTS (SELECT 1 FROM public.village_sites v WHERE v.seed_id = _seed) THEN RETURN; END IF;',
    'IF NOT EXISTS (SELECT 1 FROM public.village_sites v WHERE v.seed_id = _seed) THEN RETURN ''inactive''; END IF;',
    -- nach der Dorfsperre erneut gelesen: hat ein paralleler Aufruf die Tage schon gebucht, ist nichts mehr zu tun
    'SELECT st.through_day INTO thru FROM public.resource_state st WHERE st.seed_id = _seed;' || chr(10) || '  d := greatest(',
    'SELECT st.through_day INTO thru FROM public.resource_state st WHERE st.seed_id = _seed;' || chr(10) ||
    '  IF thru IS NOT NULL AND thru >= _today THEN RETURN ''current''; END IF;' || chr(10) || '  d := greatest(',
    'ON CONFLICT (seed_id) DO UPDATE SET through_day = greatest(public.resource_state.through_day, EXCLUDED.through_day);' || chr(10) || 'END',
    'ON CONFLICT (seed_id) DO UPDATE SET through_day = greatest(public.resource_state.through_day, EXCLUDED.through_day);' || chr(10) || '  RETURN ''booked'';' || chr(10) || 'END']);
  IF position('RETURN;' in pg_get_functiondef('public.resource_refresh_try(uuid,date)'::regprocedure)) > 0 THEN
    RAISE EXCEPTION 'Paket B: resource_refresh_try hat noch ein RETURN ohne Ergebnis';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.resource_refresh_try(uuid, date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resource_refresh_try(uuid, date) TO service_role;

-- resource_refresh_at bleibt als Aufruf erhalten (Rechte unverändert), kehrt aber bei 'pending' nie mehr still zurück
CREATE OR REPLACE FUNCTION public.resource_refresh_at(_seed uuid, _today date)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF public.resource_refresh_try(_seed, _today) = 'pending' THEN RAISE EXCEPTION 'wedding settlement pending'; END IF;
END $$;

-- purchase_material: erst die Abrechnung mit Ergebnis, bei 'pending' Abbruch vor jeder Verwendung des Bestands;
-- die Kontor-Geldprüfung über dieselbe Geldprüfung wie die Wächter. resource_overview meldet 'pending';
-- civic_raise_budget prüft das Ergebnis ausdrücklich.
DO $$ BEGIN
  EXECUTE pg_temp.paket_b_patch('public.purchase_material()', ARRAY[
    'PERFORM public.resource_refresh(NEW.seed_id);',
    'IF public.resource_refresh_try(NEW.seed_id, (now() AT TIME ZONE ''UTC'')::date) = ''pending'' THEN RAISE EXCEPTION ''wedding settlement pending''; END IF;',
    'IF public.village_balance(NEW.seed_id) < NEW.cost THEN RAISE EXCEPTION ''not enough money''; END IF;',
    'PERFORM public.wedding_money_check(NEW.seed_id, NEW.cost);']);
  EXECUTE pg_temp.paket_b_patch('public.resource_overview(uuid)', ARRAY[
    'DECLARE c0 timestamptz;',
    'DECLARE rs text; c0 timestamptz;',
    'PERFORM public.resource_refresh(_seed);',
    'rs := public.resource_refresh_try(_seed, (now() AT TIME ZONE ''UTC'')::date);',
    'RETURN out || jsonb_build_object(''active'', true,',
    'RETURN out || jsonb_build_object(''pending'', rs = ''pending'', ''active'', true,']);
  EXECUTE pg_temp.paket_b_patch('public.civic_raise_budget(uuid,text,integer)', ARRAY[
    'PERFORM public.resource_refresh_at(_seed, (now() AT TIME ZONE ''UTC'')::date);',
    'IF public.resource_refresh_try(_seed, (now() AT TIME ZONE ''UTC'')::date) = ''pending'' THEN RAISE EXCEPTION ''wedding settlement pending''; END IF;']);
END $$;
