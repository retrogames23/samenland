-- Wirtschaft Paket 2: Steingrube, Steinbruch-Auftrag (V2) and location factors (Variante D, Phase 1.2/1.3). Additive;
-- builds on 0142 and changes nothing already booked. Still only where resources_since(realm) has passed (lab now).
--
-- Location (Phase 1.2 table, Variante D original): the village's main way from townCharacter, certified once by the
-- trusted server (terrain never changes; SQL cannot compute it):
--   grain    = Binnenland : woodcamp +4 wood, Steingrube +3 stone
--   workshop = Wald/Hügel : woodcamp +6 wood, Steingrube +4 stone
--   gateway  = Küste      : woodcamp +3 wood, Steingrube +1 stone, Kontor −10 %
-- Base production (1 wood, 0.5 stone) stays for everyone; no location surcharges (Phase 1.3: no measurable effect).
-- Production days are booked only once the location is certified, so no day is ever judged with a wrong factor.

CREATE TABLE IF NOT EXISTS public.village_sites (
  seed_id uuid PRIMARY KEY REFERENCES public.seeds(id) ON DELETE CASCADE,
  way text NOT NULL CHECK (way IN ('grain','workshop','gateway')),
  certified_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.village_sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read their site" ON public.village_sites;
CREATE POLICY "Owners read their site" ON public.village_sites FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = village_sites.seed_id AND s.user_id = auth.uid()));
REVOKE ALL ON public.village_sites FROM anon, authenticated;
GRANT SELECT ON public.village_sites TO authenticated;
GRANT ALL ON public.village_sites TO service_role;

-- a certified location is final (terrain is fixed)
CREATE OR REPLACE FUNCTION public.village_site_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ BEGIN RAISE EXCEPTION 'village site is final'; END $function$;
DROP TRIGGER IF EXISTS village_site_guard ON public.village_sites;
CREATE TRIGGER village_site_guard BEFORE UPDATE ON public.village_sites FOR EACH ROW EXECUTE FUNCTION public.village_site_guard();

-- daily production with location: wood 1 + woodcamp 4/6/3, stone 0.5 + Steingrube 3/4/1 (uncertified counts as grain
-- for display only; resource_refresh_at books no production before certification)
CREATE OR REPLACE FUNCTION public.resource_rate(_seed uuid, _resource text, _at timestamptz)
 RETURNS numeric LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT CASE _resource
    WHEN 'wood' THEN 1 + (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'woodcamp' AND p.created_at < _at))::integer
      * CASE (SELECT v.way FROM public.village_sites v WHERE v.seed_id = _seed) WHEN 'workshop' THEN 6 WHEN 'gateway' THEN 3 ELSE 4 END
    WHEN 'stone' THEN 0.5 + (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'steingrube' AND p.created_at < _at))::integer
      * CASE (SELECT v.way FROM public.village_sites v WHERE v.seed_id = _seed) WHEN 'workshop' THEN 4 WHEN 'gateway' THEN 1 ELSE 3 END
    ELSE 0 END::numeric $function$;

-- as 0142, but production days wait for the certified location (start stock does not)
CREATE OR REPLACE FUNCTION public.resource_refresh_at(_seed uuid, _today date)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c0 timestamptz; rlm text; t0 timestamptz; thru date; d date; d0 timestamptz; r text; amt integer; room integer;
BEGIN
  SELECT st.through_day INTO thru FROM public.resource_state st WHERE st.seed_id = _seed;
  IF thru IS NOT NULL AND thru >= _today THEN RETURN; END IF;
  SELECT s.created_at, s.realm INTO c0, rlm FROM public.seeds s WHERE s.id = _seed FOR UPDATE;
  IF c0 IS NULL THEN RETURN; END IF;
  t0 := greatest(public.resources_since(rlm), c0);
  IF t0 >= (_today + 1)::timestamp AT TIME ZONE 'UTC' THEN RETURN; END IF;
  PERFORM public.resource_book(_seed, 'wood', 60, 'start', 'start', t0);
  PERFORM public.resource_book(_seed, 'stone', 30, 'start', 'start', t0);
  IF NOT EXISTS (SELECT 1 FROM public.village_sites v WHERE v.seed_id = _seed) THEN RETURN; END IF;
  SELECT st.through_day INTO thru FROM public.resource_state st WHERE st.seed_id = _seed;
  d := greatest(thru + 1, (t0 AT TIME ZONE 'UTC')::date + 1);
  WHILE d <= _today LOOP
    d0 := d::timestamp AT TIME ZONE 'UTC';
    FOREACH r IN ARRAY ARRAY['wood','stone'] LOOP
      amt := public.resource_daily(public.resource_rate(_seed, r, d0), d);
      room := public.resource_cap(_seed, r, d0) - public.resource_stock(_seed, r, d0);
      amt := least(amt, greatest(room, 0));
      IF amt > 0 THEN PERFORM public.resource_book(_seed, r, amt, 'prod', d::text, d0); END IF;
    END LOOP;
    d := d + 1;
  END LOOP;
  INSERT INTO public.resource_state (seed_id, through_day) VALUES (_seed, _today)
    ON CONFLICT (seed_id) DO UPDATE SET through_day = greatest(public.resource_state.through_day, EXCLUDED.through_day);
END $function$;

-- the Kontor price for missing units: wood 4, stone 6 Mark; −10 % on the coast (rounded half up)
CREATE OR REPLACE FUNCTION public.resource_kontor(_seed uuid, _wood integer, _stone integer)
 RETURNS integer LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT round((_wood * 4 + _stone * 6)
    * CASE WHEN (SELECT v.way FROM public.village_sites v WHERE v.seed_id = _seed) = 'gateway' THEN 0.9 ELSE 1 END)::integer $function$;

-- overview as 0142 plus the certified location (null = the trusted server still has to certify it)
CREATE OR REPLACE FUNCTION public.resource_overview(_seed uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c0 timestamptz; rlm text; owner uuid; t0 timestamptz; nxt timestamptz; out jsonb := '{}'::jsonb; r text;
BEGIN
  SELECT s.created_at, s.realm, s.user_id INTO c0, rlm, owner FROM public.seeds s WHERE s.id = _seed;
  IF c0 IS NULL OR (coalesce(auth.role(), '') <> 'service_role' AND (auth.uid() IS NULL OR owner IS DISTINCT FROM auth.uid())) THEN
    RAISE EXCEPTION 'not owner'; END IF;
  t0 := greatest(public.resources_since(rlm), c0);
  IF now() < t0 THEN RETURN jsonb_build_object('active', false, 'from', t0); END IF;
  PERFORM public.resource_refresh(_seed);
  nxt := ((now() AT TIME ZONE 'UTC')::date + 1)::timestamp AT TIME ZONE 'UTC';
  FOREACH r IN ARRAY ARRAY['wood','stone'] LOOP
    out := out || jsonb_build_object(r, jsonb_build_object('stock', public.resource_stock(_seed, r),
      'rate', public.resource_rate(_seed, r, nxt), 'cap', public.resource_cap(_seed, r, nxt)));
  END LOOP;
  RETURN out || jsonb_build_object('active', true, 'from', t0, 'next', nxt,
    'site', (SELECT v.way FROM public.village_sites v WHERE v.seed_id = _seed));
END $function$;

-- material as 0142; the Steingrube uses a fixed 20 wood (Variante D) and the Kontor follows resource_kontor
CREATE OR REPLACE FUNCTION public.purchase_material()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE rlm text; c0 timestamptz; nw integer; ns integer; mw integer; ms integer; kontor integer;
BEGIN
  NEW.material := NULL;
  IF NEW.item NOT IN ('herbs','backhaus','herberge','beginen','badestube','hunter','fisher','woodcamp','granary','healer',
      'school','markethall','guildhall','library','dairy','fireorder','firehouse','guard','bigstore','stonemason',
      'smokehouse','millrow','hammerworks','saltquay','backhaus2','backhaus3','herberge2','herberge3','granary2','granary3',
      'steingrube') THEN
    RETURN NEW; END IF;
  SELECT s.realm, s.created_at INTO rlm, c0 FROM public.seeds s WHERE s.id = NEW.seed_id;
  IF now() < greatest(public.resources_since(rlm), c0) THEN RETURN NEW; END IF;
  PERFORM public.resource_refresh(NEW.seed_id);
  IF NEW.item = 'steingrube' THEN nw := 20; ns := 0;
  ELSE
    nw := round(NEW.cost::numeric / 20);
    ns := CASE WHEN NEW.cost >= 500 THEN round(NEW.cost::numeric / 30) ELSE 0 END;
  END IF;
  mw := greatest(0, nw - public.resource_stock(NEW.seed_id, 'wood'));
  ms := greatest(0, ns - public.resource_stock(NEW.seed_id, 'stone'));
  kontor := public.resource_kontor(NEW.seed_id, mw, ms);
  IF kontor > coalesce(NEW.kontor_max, 0) THEN RAISE EXCEPTION 'material short'; END IF;
  NEW.material := jsonb_build_object('wood', jsonb_build_array(nw, mw), 'stone', jsonb_build_array(ns, ms), 'kontor', kontor);
  IF kontor > 0 THEN
    NEW.cost := NEW.cost + kontor;
    IF public.village_balance(NEW.seed_id) < NEW.cost THEN RAISE EXCEPTION 'not enough money'; END IF;
  END IF;
  RETURN NEW;
END $function$;

-- purchase_guard learns the Steingrube (same patch pattern as 0124/0125): 300 Mark minus 150 from the Steinbruch-Auftrag
-- of the council, which every village holds until its first and only Steingrube; unplaced; once; only where the
-- village's resources run — elsewhere it could not produce, and nothing without effect may be sold
DO $do$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.purchase_guard()'::regprocedure);
  IF position('steingrube' in d) > 0 THEN RETURN; END IF;
  d := replace(d, $s$  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;$s$,
    $s$  -- Steingrube (src/game/resources.ts STEINGRUBE_PRICE − STEINBRUCH_AUFTRAG), Wirtschaft Paket 2
  IF NEW.item = 'steingrube' THEN
    price := 300 - 150;
    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
    IF EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id AND item = 'steingrube') THEN RAISE EXCEPTION 'already built'; END IF;
    IF now() < (SELECT greatest(public.resources_since(s.realm), s.created_at) FROM public.seeds s WHERE s.id = NEW.seed_id) THEN RAISE EXCEPTION 'not now'; END IF;
  END IF;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;$s$);
  IF (length(d) - length(replace(d, 'steingrube', ''))) / 10 < 2 THEN RAISE EXCEPTION 'purchase_guard patch did not apply'; END IF;
  EXECUTE d;
END $do$;
CREATE UNIQUE INDEX IF NOT EXISTS purchases_steingrube_once ON public.purchases (seed_id, item) WHERE item = 'steingrube';

REVOKE ALL ON FUNCTION public.resource_kontor(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resource_kontor(uuid, integer, integer) TO service_role;
