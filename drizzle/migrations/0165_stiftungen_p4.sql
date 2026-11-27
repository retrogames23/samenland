-- 0165 Wirtschaftsumbau P4 – Stiftungen (Masterplan v6.7 Abschnitt 4.1; Entscheidungen D2, D6, D10a, D11 vom 27.11.2026).
-- Spiegel: src/game/stiftung.ts, src/game/stiftungszeit.ts. Test: src/lib/stiftung.pg.test.ts.
--
-- KEINE AKTIVIERUNG: stift_since() steht für `lab` UND öffentlich auf dem Platzhalter 2100-01-04 (D7 offen). Nach dem
-- Einspielen ist die Mechanik vorhanden, aber kein Dorf kann eine Stiftung öffnen, einzahlen oder abschließen, und es
-- entsteht keine Wirkung. Ein echtes Datum ist eine eigene, spätere Migration mit eigener Freigabe.
--
-- Regeln
--   Bau            Spital- oder Waagekomplex (G0); stiftbar, sobald seine Stufe 1 steht (Marker spital1 / waage1).
--   Öffnen         stift_open: kostenlos; Preis fest = 4 × letzte gebuchte Tagessteuer (tax_receipts); eine offene Stufe
--                  je Bau; mindestens 7 Tage zwischen zwei Öffnungen am selben Bau; nur bei höchstens 14 Tagen Rest.
--   Einzahlen      stift_deposit: Betrag frei, mindestens 1 Mark, höchstens Rest und Kassenstand (wedding_money_check),
--                  endgültig. Zeile `stift:<bau>:<n>:r<m>`. Nie eine automatische Abbuchung: keine andere Funktion
--                  und kein Tageslauf schreibt eine Stiftungszeile.
--   Stiften        stift_close: 30 Holz + 20 Stein, zuerst aus dem Lager über der Rücklage 40/30, der Rest aus dem
--                  freien Kontingent zum Kontorpreis im selben Aufruf (Zeile `stift:<bau>:<n>:k`); Marker
--                  `stift:<bau>:<n>` (0 Mark) zum Abschlusszeitpunkt. Reicht das Material nicht: Ausnahme, keine Buchung.
--   Vorrang (D2)   Kein Öffnen, kein Einzahlen, kein Kontoranteil, solange eine Gemeindebaustufe geöffnet und nicht
--                  voll bezahlt ist (civic_stages.funded_at IS NULL). Endet mit der letzten Rate.
--   Reservierung   (D6) Freies Kontingent = civic_quota − fehlender Materialbedarf der Gemeindebaustufe(n) ohne
--                  vollständiges Material (material_at IS NULL).
--   Stiftungszeit  (D11, additiv, Auftrag 2.1) Ende_neu = max(Abschluss, Ende_alt) + 14 Tage, in Zeitpunkten. Jede
--                  Abschlusszeile trägt ihr Ende (until_at) und wird nie mehr geändert. Gestiftet zum Zeitpunkt t:
--                  die jüngste bis t abgeschlossene Zeile hat until_at > t. Abschluss abgelehnt, wenn das neue Ende
--                  mehr als 28 Tage nach dem Abschluss läge. Wirkung genau einmal ×0,85: Waage → resource_kontor_at
--                  (hier), Spital → Krankheitsrisiko (sickness.ts, nur TypeScript; liest dieselben Markerzeilen).
--   Pending        stift_close bucht zuerst offene Tage über resource_refresh_try; bei 'pending' Abbruch ohne Buchung.
--   Kaufzählung    quest_guard und princely_task_met zählen keine Stiftungszeile.
--
-- Geänderte Bestandsfunktionen (aus der LIVE-Definition gepatcht, Muster 0147/0162/0163): purchase_guard,
-- resource_kontor_at, quest_guard, princely_task_met. Fehlt eine erwartete Stelle oder kommt sie nicht genau so oft
-- vor wie erwartet, bricht die Migration VOR jeder Änderung ab.
-- Bestand: keine bestehende Zeile, kein Kontostand und kein Steuerbeleg wird angefasst; ohne Stiftungszeile rechnet
-- resource_kontor_at exakt wie zuvor.

-- 0) Vorprüfung der Live-Definitionen — vor jeder Änderung -------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.p4_patch(_fn text, _pairs text[], _times integer[])
 RETURNS text LANGUAGE plpgsql AS $$
DECLARE def text; i integer; n integer;
BEGIN
  IF to_regprocedure(_fn) IS NULL THEN RAISE EXCEPTION 'P4 0165: Funktion % fehlt', _fn; END IF;
  def := pg_get_functiondef(_fn::regprocedure);
  FOR i IN 1 .. array_length(_pairs, 1) / 2 LOOP
    n := (length(def) - length(replace(def, _pairs[2 * i - 1], ''))) / length(_pairs[2 * i - 1]);
    IF n <> _times[i] THEN
      RAISE EXCEPTION 'P4 0165: % enthält die erwartete Stelle % mal statt % mal: %', _fn, n, _times[i], _pairs[2 * i - 1]; END IF;
    def := replace(def, _pairs[2 * i - 1], _pairs[2 * i]);
  END LOOP;
  RETURN def;
END $$;
-- die vier Patches als Daten: (Funktion, Paare alt→neu, erwartete Häufigkeit je Paar)
CREATE OR REPLACE FUNCTION pg_temp.p4_plan(OUT fn text, OUT pairs text[], OUT times integer[])
 RETURNS SETOF record LANGUAGE sql AS $$
  SELECT 'public.purchase_guard()', ARRAY[
    -- a) Stiftungszeilen nur über stift_deposit / stift_close; Preis, Rest und Vorrang prüft stift_row_price
    '  IF price IS NULL THEN RAISE EXCEPTION ''unknown item''; END IF;',
    '  -- Stiftungen P4 (src/game/stiftung.ts, 0165): rows only from stift_deposit / stift_close; stift_row_price checks stage, rest and Vorrang' || chr(10) ||
    '  IF NEW.item ~ ''^stift:(spital|waage):[1-9][0-9]*(:r[1-9][0-9]*|:k)?$'' THEN' || chr(10) ||
    '    IF current_setting(''samenland.stift'', true) IS DISTINCT FROM ''on'' THEN RAISE EXCEPTION ''stift rows are booked by the server''; END IF;' || chr(10) ||
    '    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION ''bad position''; END IF;' || chr(10) ||
    '    price := public.stift_row_price(NEW.seed_id, NEW.item, NEW.cost);' || chr(10) ||
    '  END IF;' || chr(10) ||
    '  IF price IS NULL THEN RAISE EXCEPTION ''unknown item''; END IF;',
    -- b) Kontoranteil und Marker tragen den Abschlusszeitpunkt (auf Millisekunden, damit TypeScript dasselbe Ende rechnet)
    'WHEN current_setting(''samenland.ankauf'', true) = ''on'' AND NEW.item ~ ''^ankauf:[0-9]{8}$'' THEN NEW.created_at ELSE now() END;',
    'WHEN current_setting(''samenland.ankauf'', true) = ''on'' AND NEW.item ~ ''^ankauf:[0-9]{8}$'' THEN NEW.created_at WHEN current_setting(''samenland.stift'', true) = ''on'' AND NEW.item ~ ''^stift:(spital|waage):[1-9][0-9]*(:k)?$'' THEN NEW.created_at ELSE now() END;'
  ], ARRAY[1, 1]
  UNION ALL SELECT 'public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)', ARRAY[
    'AND p.item = ''waage1'' AND p.created_at <= _at) THEN 0.85 ELSE 1 END)::integer',
    'AND p.item = ''waage1'' AND p.created_at <= _at) THEN 0.85 ELSE 1 END' || chr(10) ||
    '    * CASE WHEN public.stift_endowed_at(_seed, ''waage'', _at) THEN 0.85 ELSE 1 END)::integer'
  ], ARRAY[1]
  UNION ALL SELECT 'public.quest_guard()', ARRAY[
    'item !~ ''^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$''',
    'item !~ ''^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$'' AND item !~ ''^stift:(spital|waage):[1-9][0-9]*(:r[1-9][0-9]*|:k)?$'''
  ], ARRAY[1]
  UNION ALL SELECT 'public.princely_task_met(uuid,text,timestamp with time zone)', ARRAY[
    'item !~ ''^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$''',
    'item !~ ''^(spital|waage)[1-9][0-9]*:(r[1-9][0-9]*|k[0-9]{8})$'' AND item !~ ''^stift:(spital|waage):[1-9][0-9]*(:r[1-9][0-9]*|:k)?$'''
  ], ARRAY[2]
$$;
DO $$
DECLARE r record;
BEGIN
  -- schon eingespielt (purchase_guard kennt die Stiftungszeilen): nichts erneut prüfen
  IF position('samenland.stift' in pg_get_functiondef('public.purchase_guard()'::regprocedure)) > 0 THEN RETURN; END IF;
  FOR r IN SELECT * FROM pg_temp.p4_plan() LOOP PERFORM pg_temp.p4_patch(r.fn, r.pairs, r.times); END LOOP;
  -- Voraussetzungen aus 0147–0163, auf die P4 aufbaut
  IF to_regprocedure('public.wedding_money_check(uuid,integer)') IS NULL
     OR to_regprocedure('public.resource_refresh_try(uuid,date)') IS NULL
     OR to_regprocedure('public.client_protocol_min()') IS NULL
     OR to_regprocedure('public.resource_book(uuid,text,integer,text,text,timestamp with time zone)') IS NULL
     OR to_regclass('public.civic_stages') IS NULL OR to_regclass('public.civic_quota') IS NULL THEN
    RAISE EXCEPTION 'P4 0165: Voraussetzungen aus 0147–0163 fehlen';
  END IF;
END $$;

-- 1) Schalter: Platzhalter für lab und öffentlich (keine Aktivierung) ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.stift_since(_realm text) RETURNS timestamptz
 LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT CASE WHEN _realm = 'lab' THEN timestamptz '2100-01-04 00:00:00+00' ELSE timestamptz '2100-01-04 00:00:00+00' END $$;

-- 2) Stufentabelle -----------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stift_stages (
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  bau text NOT NULL CHECK (bau IN ('spital', 'waage')),
  nr integer NOT NULL CHECK (nr >= 1),
  price integer NOT NULL CHECK (price >= 1),
  paid integer NOT NULL DEFAULT 0 CHECK (paid >= 0),
  opened_at timestamptz NOT NULL DEFAULT now(),
  funded_at timestamptz,
  done_at timestamptz,
  until_at timestamptz,
  kontor integer CHECK (kontor >= 0),
  wood_store integer CHECK (wood_store BETWEEN 0 AND 30),
  stone_store integer CHECK (stone_store BETWEEN 0 AND 20),
  PRIMARY KEY (seed_id, bau, nr),
  CONSTRAINT stift_stages_paid CHECK (paid <= price AND (funded_at IS NOT NULL) = (paid >= price)),
  CONSTRAINT stift_stages_done CHECK ((done_at IS NULL) = (until_at IS NULL) AND (done_at IS NULL OR funded_at IS NOT NULL)),
  -- Stiftungszeit je Abschluss: mindestens 14 Tage ab dem Abschluss, nie mehr als 28 Tage (Auftrag 2.1)
  CONSTRAINT stift_stages_until CHECK (until_at IS NULL OR (until_at >= done_at + interval '14 days' AND until_at <= done_at + interval '28 days'))
);
-- genau eine offene Stufe je Bau
CREATE UNIQUE INDEX IF NOT EXISTS stift_stages_one_open ON public.stift_stages (seed_id, bau) WHERE done_at IS NULL;
CREATE INDEX IF NOT EXISTS stift_stages_done_idx ON public.stift_stages (seed_id, bau, done_at);
ALTER TABLE public.stift_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read their endowments" ON public.stift_stages;
CREATE POLICY "Owners read their endowments" ON public.stift_stages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = stift_stages.seed_id AND s.user_id = auth.uid()));
REVOKE ALL ON public.stift_stages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.stift_stages TO authenticated;
GRANT ALL ON public.stift_stages TO service_role;

-- eine abgeschlossene Zeile ist Geschichte: nie mehr geändert; an einer offenen ändern sich nur Zahlung und Abschluss
CREATE OR REPLACE FUNCTION public.stift_stages_keep() RETURNS trigger
 LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.done_at IS NOT NULL THEN RAISE EXCEPTION 'stift stage is closed'; END IF;
  IF NEW.seed_id IS DISTINCT FROM OLD.seed_id OR NEW.bau IS DISTINCT FROM OLD.bau OR NEW.nr IS DISTINCT FROM OLD.nr
     OR NEW.price IS DISTINCT FROM OLD.price OR NEW.opened_at IS DISTINCT FROM OLD.opened_at
     OR NEW.paid < OLD.paid OR (OLD.funded_at IS NOT NULL AND NEW.funded_at IS DISTINCT FROM OLD.funded_at) THEN
    RAISE EXCEPTION 'stift stage is fixed'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS stift_stages_keep ON public.stift_stages;
CREATE TRIGGER stift_stages_keep BEFORE UPDATE ON public.stift_stages FOR EACH ROW EXECUTE FUNCTION public.stift_stages_keep();

-- 3) Stiftungszeit, Vorrang, Reservierung ------------------------------------------------------------------------------
-- Ende der Stiftungszeit, wie es zum Zeitpunkt _at gebucht war (jüngste bis dahin abgeschlossene Zeile)
CREATE OR REPLACE FUNCTION public.stift_until_at(_seed uuid, _bau text, _at timestamptz) RETURNS timestamptz
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT s.until_at FROM public.stift_stages s
   WHERE s.seed_id = _seed AND s.bau = _bau AND s.done_at <= _at ORDER BY s.done_at DESC, s.nr DESC LIMIT 1 $$;
-- gestiftet zum Zeitpunkt _at: _at < Ende (genau ein Faktor, gleich wie viele Stufen im Vorrat liegen)
CREATE OR REPLACE FUNCTION public.stift_endowed_at(_seed uuid, _bau text, _at timestamptz) RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT coalesce(_at < public.stift_until_at(_seed, _bau, _at), false) $$;
-- Baustellen-Vorrang: die geöffnete, nicht voll bezahlte Gemeindebaustufe (NULL = keine)
CREATE OR REPLACE FUNCTION public.stift_vorrang(_seed uuid) RETURNS text
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT c.item FROM public.civic_stages c WHERE c.seed_id = _seed AND c.funded_at IS NULL ORDER BY c.opened_at LIMIT 1 $$;
-- Reservierung: was der Gemeindebaustelle ohne vollständiges Material noch fehlt
CREATE OR REPLACE FUNCTION public.stift_reserved(_seed uuid, OUT wood integer, OUT stone integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT coalesce(sum(greatest(0, c.need_wood - c.wood_got)), 0)::integer, coalesce(sum(greatest(0, c.need_stone - c.stone_got)), 0)::integer
   FROM public.civic_stages c WHERE c.seed_id = _seed AND c.material_at IS NULL $$;
-- freies Kontingent für Stiftungen = gemeinsames Kontingent − Reservierung
CREATE OR REPLACE FUNCTION public.stift_free_quota(_seed uuid, OUT wood integer, OUT stone integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT greatest(0, coalesce((SELECT q.wood FROM public.civic_quota q WHERE q.seed_id = _seed), 0) - r.wood),
          greatest(0, coalesce((SELECT q.stone FROM public.civic_quota q WHERE q.seed_id = _seed), 0) - r.stone)
   FROM public.stift_reserved(_seed) r $$;

-- 4) Preis und Zulässigkeit einer Stiftungszeile (von purchase_guard gerufen) ------------------------------------------
CREATE OR REPLACE FUNCTION public.stift_row_price(_seed uuid, _item text, _cost integer) RETURNS integer
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE b text := split_part(_item, ':', 2); n integer := split_part(_item, ':', 3)::integer; kind text := split_part(_item, ':', 4);
  st record; cnt integer;
BEGIN
  SELECT * INTO st FROM public.stift_stages s WHERE s.seed_id = _seed AND s.bau = b AND s.nr = n FOR UPDATE;
  IF NOT FOUND OR st.done_at IS NOT NULL THEN RAISE EXCEPTION 'stage not open'; END IF;
  IF kind = '' THEN  -- Abschlussmarker: 0 Mark, nur für eine voll bezahlte Stufe
    IF st.funded_at IS NULL THEN RAISE EXCEPTION 'not funded'; END IF;
    RETURN 0;
  END IF;
  -- Baustellen-Vorrang (D2): gilt für jede Geldzeile einer Stiftung
  IF public.stift_vorrang(_seed) IS NOT NULL THEN RAISE EXCEPTION 'civic site first'; END IF;
  IF kind = 'k' THEN  -- Kontoranteil des Abschlusses
    IF st.funded_at IS NULL THEN RAISE EXCEPTION 'not funded'; END IF;
    IF _cost IS NULL OR _cost < 1 THEN RAISE EXCEPTION 'bad amount'; END IF;
    RETURN _cost;
  END IF;
  -- Einzahlung r<m>: fortlaufend, mindestens 1 Mark, höchstens der offene Rest
  IF st.funded_at IS NOT NULL THEN RAISE EXCEPTION 'already funded'; END IF;
  SELECT count(*) INTO cnt FROM public.purchases p WHERE p.seed_id = _seed AND p.item ~ ('^stift:' || b || ':' || n || ':r[0-9]+$');
  IF substring(kind from 2)::integer <> cnt + 1 THEN RAISE EXCEPTION 'previous step open'; END IF;
  IF _cost IS NULL OR _cost < 1 OR _cost > st.price - st.paid THEN RAISE EXCEPTION 'bad amount'; END IF;
  RETURN _cost;
END $$;

-- 5) Bestandsfunktionen patchen (Live-Definition; oben schon geprüft) ---------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  IF position('samenland.stift' in pg_get_functiondef('public.purchase_guard()'::regprocedure)) > 0 THEN RETURN; END IF;
  FOR r IN SELECT * FROM pg_temp.p4_plan() LOOP EXECUTE pg_temp.p4_patch(r.fn, r.pairs, r.times); END LOOP;
  IF position('samenland.stift' in pg_get_functiondef('public.purchase_guard()'::regprocedure)) = 0
     OR position('stift_endowed_at' in pg_get_functiondef('public.resource_kontor_at(uuid,integer,integer,timestamp with time zone)'::regprocedure)) = 0 THEN
    RAISE EXCEPTION 'P4 0165: Patch nicht angewendet'; END IF;
END $$;

-- 6) Die drei Spieleraktionen ------------------------------------------------------------------------------------------
-- gemeinsamer Einstieg: Protokoll, Dorfsperre (Zeilensperre wie a_tax_spend_lock + Kaufsperre), Besitzer, Schalter
CREATE OR REPLACE FUNCTION public.stift_enter(_seed uuid, _bau text, _client integer) RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE c0 timestamptz; rlm text; owner uuid;
BEGIN
  IF coalesce(_client, 0) < public.client_protocol_min() THEN RAISE EXCEPTION 'client outdated'; END IF;
  SELECT s.created_at, s.realm, s.user_id INTO c0, rlm, owner FROM public.seeds s WHERE s.id = _seed FOR UPDATE;
  IF c0 IS NULL OR (coalesce(auth.role(), '') <> 'service_role' AND (auth.uid() IS NULL OR owner IS DISTINCT FROM auth.uid())) THEN
    RAISE EXCEPTION 'not owner'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('purchase:' || _seed::text));
  IF now() < greatest(public.stift_since(rlm), public.resources_since(rlm), c0) THEN RAISE EXCEPTION 'not now'; END IF;
  IF _bau IS NULL OR _bau NOT IN ('spital', 'waage') THEN RAISE EXCEPTION 'unknown bau'; END IF;
  RETURN owner;
END $$;

-- Öffnen: kostenlos; legt die Stufe mit festem Preis an
CREATE OR REPLACE FUNCTION public.stift_open(_seed uuid, _bau text, _client integer) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE tax integer; p integer; n integer; rest interval;
BEGIN
  PERFORM public.stift_enter(_seed, _bau, _client);
  IF NOT EXISTS (SELECT 1 FROM public.purchases x WHERE x.seed_id = _seed AND x.item = _bau || '1' AND x.created_at <= now()) THEN
    RAISE EXCEPTION 'bau missing'; END IF;
  IF public.stift_vorrang(_seed) IS NOT NULL THEN RAISE EXCEPTION 'civic site first'; END IF;
  IF EXISTS (SELECT 1 FROM public.stift_stages s WHERE s.seed_id = _seed AND s.bau = _bau AND s.done_at IS NULL) THEN
    RAISE EXCEPTION 'stage open'; END IF;
  IF EXISTS (SELECT 1 FROM public.stift_stages s WHERE s.seed_id = _seed AND s.bau = _bau AND s.opened_at > now() - interval '7 days') THEN
    RAISE EXCEPTION 'too soon'; END IF;
  -- dieselbe Uhr wie der Abschluss (auf Millisekunden): wer hier öffnen darf, überschreitet beim Abschluss nie 28 Tage
  rest := public.stift_until_at(_seed, _bau, now()) - date_trunc('milliseconds', now());
  IF rest > interval '14 days' THEN RAISE EXCEPTION 'store full'; END IF;
  SELECT tr.income INTO tax FROM public.tax_receipts tr WHERE tr.seed_id = _seed ORDER BY tr.day DESC LIMIT 1;
  p := 4 * coalesce(tax, 0);
  IF p < 1 THEN RAISE EXCEPTION 'no tax yet'; END IF;
  SELECT coalesce(max(s.nr), 0) + 1 INTO n FROM public.stift_stages s WHERE s.seed_id = _seed AND s.bau = _bau;
  INSERT INTO public.stift_stages (seed_id, bau, nr, price) VALUES (_seed, _bau, n, p);
  RETURN jsonb_build_object('bau', _bau, 'nr', n, 'price', p);
END $$;

-- Einzahlen: eine bewusste Spieleraktion; _n = erwartete Nummer der Einzahlung (doppelte Anfrage bucht einmal)
CREATE OR REPLACE FUNCTION public.stift_deposit(_seed uuid, _bau text, _n integer, _amount integer, _client integer) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE owner uuid; st record; item text; pid uuid; at0 timestamptz; np integer;
BEGIN
  owner := public.stift_enter(_seed, _bau, _client);
  SELECT * INTO st FROM public.stift_stages s WHERE s.seed_id = _seed AND s.bau = _bau AND s.done_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'stage not open'; END IF;
  IF _n IS NULL OR _n < 1 THEN RAISE EXCEPTION 'previous step open'; END IF;
  item := 'stift:' || _bau || ':' || st.nr || ':r' || _n;
  -- purchase_guard prüft Vorrang, Reihenfolge, Betrag (stift_row_price) und den Kassenstand (wedding_money_check)
  PERFORM set_config('samenland.stift', 'on', true);
  INSERT INTO public.purchases (seed_id, user_id, item, cost) VALUES (_seed, owner, item, _amount) RETURNING id, created_at INTO pid, at0;
  PERFORM set_config('samenland.stift', 'off', true);
  np := st.paid + _amount;
  UPDATE public.stift_stages s SET paid = np, funded_at = CASE WHEN np >= s.price THEN at0 ELSE NULL END
    WHERE s.seed_id = _seed AND s.bau = _bau AND s.nr = st.nr;
  RETURN jsonb_build_object('bau', _bau, 'nr', st.nr, 'paid', np, 'price', st.price, 'funded', np >= st.price,
    'row', jsonb_build_object('id', pid, 'seed_id', _seed, 'item', item, 'cost', _amount, 'created_at', at0, 'x', NULL, 'y', NULL));
END $$;

-- Stiften: Abschluss der voll bezahlten Stufe; _max = der im Dialog bestätigte Kontorbetrag (nie mehr als das)
CREATE OR REPLACE FUNCTION public.stift_close(_seed uuid, _bau text, _max integer, _client integer) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE owner uuid; st record; rs text; done timestamptz; prev timestamptz; nu timestamptz; base text;
  tw integer; ts integer; bw integer; bs integer; fw integer; fs integer; c integer := 0; rows jsonb := '[]'::jsonb; r record;
BEGIN
  owner := public.stift_enter(_seed, _bau, _client);
  SELECT * INTO st FROM public.stift_stages s WHERE s.seed_id = _seed AND s.bau = _bau AND s.done_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'stage not open'; END IF;
  IF st.funded_at IS NULL THEN RAISE EXCEPTION 'not funded'; END IF;
  -- 1 offene Tage zuerst (Produktion, Kontingent, Materialzug der Gemeindebaustelle); pending: nichts wird gebucht
  rs := public.resource_refresh_try(_seed, (now() AT TIME ZONE 'UTC')::date);
  IF rs = 'pending' THEN RAISE EXCEPTION 'wedding settlement pending'; END IF;
  IF rs = 'inactive' THEN RAISE EXCEPTION 'not now'; END IF;
  -- 2 Stiftungszeit additiv: Ende_neu = max(Abschluss, Ende_alt) + 14 Tage; nie mehr als 28 Tage Vorrat
  done := date_trunc('milliseconds', now());
  prev := public.stift_until_at(_seed, _bau, done);
  nu := greatest(done, coalesce(prev, done)) + interval '14 days';
  IF nu > done + interval '28 days' THEN RAISE EXCEPTION 'store full'; END IF;
  -- 3 Material: Lager über der Rücklage 40/30, der Rest aus dem freien Kontingent zum Kontorpreis
  tw := least(30, greatest(0, public.resource_stock(_seed, 'wood') - 40));
  ts := least(20, greatest(0, public.resource_stock(_seed, 'stone') - 30));
  bw := 30 - tw; bs := 20 - ts;
  IF bw > 0 OR bs > 0 THEN
    IF public.stift_vorrang(_seed) IS NOT NULL THEN RAISE EXCEPTION 'civic site first'; END IF;
    SELECT f.wood, f.stone INTO fw, fs FROM public.stift_free_quota(_seed) f;
    IF bw > fw OR bs > fs THEN RAISE EXCEPTION 'material short'; END IF;
    c := public.resource_kontor_at(_seed, bw, bs, done);
    IF _max IS NULL OR c > _max THEN RAISE EXCEPTION 'price changed'; END IF;
  END IF;
  base := 'stift:' || _bau || ':' || st.nr;
  PERFORM set_config('samenland.stift', 'on', true);
  IF c > 0 THEN
    -- der Kontoranteil als eigene Geldzeile: purchase_guard prüft Vorrang und Kassenstand (wedding_money_check)
    INSERT INTO public.purchases (seed_id, user_id, item, cost, created_at) VALUES (_seed, owner, base || ':k', c, done);
  END IF;
  IF bw > 0 THEN
    PERFORM public.resource_book(_seed, 'wood', bw, 'kontor', base || ':k', done);
    PERFORM public.resource_book(_seed, 'wood', -bw, 'civic', base || ':q', done);
  END IF;
  IF bs > 0 THEN
    PERFORM public.resource_book(_seed, 'stone', bs, 'kontor', base || ':k', done);
    PERFORM public.resource_book(_seed, 'stone', -bs, 'civic', base || ':q', done);
  END IF;
  IF tw > 0 THEN PERFORM public.resource_book(_seed, 'wood', -tw, 'civic', base || ':s', done); END IF;
  IF ts > 0 THEN PERFORM public.resource_book(_seed, 'stone', -ts, 'civic', base || ':s', done); END IF;
  IF bw > 0 OR bs > 0 THEN
    UPDATE public.civic_quota q SET wood = q.wood - bw, stone = q.stone - bs WHERE q.seed_id = _seed;
  END IF;
  -- 4 Marker (0 Mark) zum Abschlusszeitpunkt: die Wirkung liest nur ihn
  INSERT INTO public.purchases (seed_id, user_id, item, cost, created_at) VALUES (_seed, owner, base, 0, done);
  PERFORM set_config('samenland.stift', 'off', true);
  UPDATE public.stift_stages s SET done_at = done, until_at = nu, kontor = c, wood_store = tw, stone_store = ts
    WHERE s.seed_id = _seed AND s.bau = _bau AND s.nr = st.nr;
  FOR r IN SELECT p.id, p.seed_id, p.item, p.cost, p.created_at, p.x, p.y FROM public.purchases p
      WHERE p.seed_id = _seed AND p.item IN (base, base || ':k') ORDER BY p.item LOOP
    rows := rows || to_jsonb(r);
  END LOOP;
  RETURN jsonb_build_object('bau', _bau, 'nr', st.nr, 'done', done, 'until', nu, 'kontor', c,
    'store', jsonb_build_object('wood', tw, 'stone', ts), 'bought', jsonb_build_object('wood', bw, 'stone', bs), 'rows', rows);
END $$;

-- 7) Übersicht für die Oberfläche: rein lesend (bucht nichts) -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stift_overview(_seed uuid, _client integer) RETURNS jsonb
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE c0 timestamptz; rlm text; owner uuid; t0 timestamptz; tax integer; vor record; q record; res record; fr record;
  b text; st record; built boolean; until timestamptz; last_open timestamptz; lock text; lock_from timestamptz;
  tw integer; ts integer; bw integer; bs integer; plan jsonb; out jsonb := '{}'::jsonb; sw integer; ss integer;
BEGIN
  IF coalesce(_client, 0) < public.client_protocol_min() THEN RAISE EXCEPTION 'client outdated'; END IF;
  SELECT s.created_at, s.realm, s.user_id INTO c0, rlm, owner FROM public.seeds s WHERE s.id = _seed;
  IF c0 IS NULL OR (coalesce(auth.role(), '') <> 'service_role' AND (auth.uid() IS NULL OR owner IS DISTINCT FROM auth.uid())) THEN
    RAISE EXCEPTION 'not owner'; END IF;
  t0 := greatest(public.stift_since(rlm), public.resources_since(rlm), c0);
  IF now() < t0 THEN RETURN jsonb_build_object('active', false, 'from', t0); END IF;
  SELECT tr.income INTO tax FROM public.tax_receipts tr WHERE tr.seed_id = _seed ORDER BY tr.day DESC LIMIT 1;
  SELECT c.item, c.price - coalesce((SELECT sum(p.cost) FROM public.purchases p WHERE p.seed_id = _seed AND p.item ~ ('^' || c.item || ':r[0-9]+$')), 0) AS rest
    INTO vor FROM public.civic_stages c WHERE c.seed_id = _seed AND c.funded_at IS NULL ORDER BY c.opened_at LIMIT 1;
  SELECT coalesce((SELECT x.wood FROM public.civic_quota x WHERE x.seed_id = _seed), 0) AS wood,
         coalesce((SELECT x.stone FROM public.civic_quota x WHERE x.seed_id = _seed), 0) AS stone INTO q;
  SELECT r.wood, r.stone INTO res FROM public.stift_reserved(_seed) r;
  SELECT f.wood, f.stone INTO fr FROM public.stift_free_quota(_seed) f;
  sw := public.resource_stock(_seed, 'wood'); ss := public.resource_stock(_seed, 'stone');
  FOREACH b IN ARRAY ARRAY['spital', 'waage'] LOOP
    built := EXISTS (SELECT 1 FROM public.purchases x WHERE x.seed_id = _seed AND x.item = b || '1' AND x.created_at <= now());
    until := public.stift_until_at(_seed, b, now());
    SELECT * INTO st FROM public.stift_stages s WHERE s.seed_id = _seed AND s.bau = b AND s.done_at IS NULL;
    SELECT max(s.opened_at) INTO last_open FROM public.stift_stages s WHERE s.seed_id = _seed AND s.bau = b;
    lock := NULL; lock_from := NULL; plan := NULL;
    -- Sperrgrund für das Öffnen, in der Reihenfolge von stift_open
    IF NOT built THEN lock := 'bau';
    ELSIF vor.item IS NOT NULL THEN lock := 'vorrang';
    ELSIF st.nr IS NOT NULL THEN lock := 'open';
    ELSIF last_open > now() - interval '7 days' THEN lock := 'pause'; lock_from := last_open + interval '7 days';
    ELSIF until - now() > interval '14 days' THEN lock := 'full'; lock_from := until - interval '14 days';
    ELSIF 4 * coalesce(tax, 0) < 1 THEN lock := 'tax';
    END IF;
    IF st.nr IS NOT NULL AND st.funded_at IS NOT NULL THEN
      tw := least(30, greatest(0, sw - 40)); ts := least(20, greatest(0, ss - 30)); bw := 30 - tw; bs := 20 - ts;
      plan := jsonb_build_object('store', jsonb_build_object('wood', tw, 'stone', ts), 'kontor', jsonb_build_object('wood', bw, 'stone', bs),
        'short', jsonb_build_object('wood', greatest(0, bw - fr.wood), 'stone', greatest(0, bs - fr.stone)),
        'cost', public.resource_kontor_at(_seed, bw, bs, now()),
        'full', until - now() > interval '14 days');
    END IF;
    out := out || jsonb_build_object(b, jsonb_build_object('built', built, 'until', until,
      'endowed', coalesce(now() < until, false), 'lock', lock, 'lock_from', lock_from, 'plan', plan,
      'stage', CASE WHEN st.nr IS NULL THEN NULL ELSE jsonb_build_object('nr', st.nr, 'price', st.price, 'paid', st.paid,
        'opened_at', st.opened_at, 'funded_at', st.funded_at,
        'deposits', (SELECT count(*) FROM public.purchases p WHERE p.seed_id = _seed AND p.item ~ ('^stift:' || b || ':' || st.nr || ':r[0-9]+$'))) END));
  END LOOP;
  RETURN out || jsonb_build_object('active', true, 'from', t0, 'now', now(), 'tax', tax, 'price', 4 * coalesce(tax, 0),
    'vorrang', CASE WHEN vor.item IS NULL THEN NULL ELSE jsonb_build_object('item', vor.item, 'rest', vor.rest) END,
    'quota', jsonb_build_object('wood', q.wood, 'stone', q.stone),
    'reserved', jsonb_build_object('wood', res.wood, 'stone', res.stone),
    'free', jsonb_build_object('wood', fr.wood, 'stone', fr.stone),
    'stock', jsonb_build_object('wood', sw, 'stone', ss));
END $$;

-- 8) Rechte: die drei Aktionen und die Übersicht für den angemeldeten Besitzer (wie civic_open); alles andere intern ---
REVOKE ALL ON FUNCTION public.stift_since(text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stift_since(text) TO service_role;
REVOKE ALL ON FUNCTION public.stift_stages_keep() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_until_at(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_endowed_at(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_vorrang(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_reserved(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_free_quota(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_row_price(uuid, text, integer) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_enter(uuid, text, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stift_until_at(uuid, text, timestamptz), public.stift_endowed_at(uuid, text, timestamptz),
  public.stift_vorrang(uuid), public.stift_reserved(uuid), public.stift_free_quota(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.stift_open(uuid, text, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stift_open(uuid, text, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_deposit(uuid, text, integer, integer, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stift_deposit(uuid, text, integer, integer, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_close(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stift_close(uuid, text, integer, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.stift_overview(uuid, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stift_overview(uuid, integer) TO authenticated, service_role;
