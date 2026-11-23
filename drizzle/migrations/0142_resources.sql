-- Wirtschaft Paket 1: persistent wood and stone per village (Variante D, corrected by Phase 1.3: V1 stone only from
-- 500 Mark, V7 visible Zukauf). Additive only: nothing existing is changed; old purchases keep their cost and receive
-- no material. Active from resources_since(realm): 2026-11-23 on the admin test map "lab", far future (2100-01-04)
-- on every public map until a later migration sets the real date.
--
-- Stock = sum of resource_ledger (append-only; start, daily production, Kontor purchases, consumption). The database
-- books everything itself under the village row lock (same lock as tax_spend_lock), so stock never goes negative and
-- parallel bookings cannot spend the same wood twice. Production is booked lazily and idempotently by
-- resource_refresh (no cron): one entry per resource and UTC day at 00:00, judged only from rows before that moment,
-- so ten days at once equal ten daily calls. Mirrored by src/game/resources.ts — change both together.

CREATE OR REPLACE FUNCTION public.resources_since(_realm text)
 RETURNS timestamptz LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT CASE WHEN _realm = 'lab' THEN '2026-11-23 00:00:00+00'::timestamptz
  ELSE '2100-01-04 00:00:00+00'::timestamptz END $function$;

CREATE TABLE IF NOT EXISTS public.resource_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  resource text NOT NULL CHECK (resource IN ('wood','stone')),
  amount integer NOT NULL CHECK (amount <> 0),
  kind text NOT NULL CHECK (kind IN ('start','prod','kontor','build')),
  ref text NOT NULL,
  at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seed_id, resource, kind, ref)
);
CREATE INDEX IF NOT EXISTS resource_ledger_seed_at ON public.resource_ledger (seed_id, resource, at);
ALTER TABLE public.resource_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read their resources" ON public.resource_ledger;
CREATE POLICY "Owners read their resources" ON public.resource_ledger FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = resource_ledger.seed_id AND s.user_id = auth.uid()));
REVOKE ALL ON public.resource_ledger FROM anon, authenticated;
GRANT SELECT ON public.resource_ledger TO authenticated;
GRANT ALL ON public.resource_ledger TO service_role;

-- the last UTC day whose production is booked, per village
CREATE TABLE IF NOT EXISTS public.resource_state (
  seed_id uuid PRIMARY KEY REFERENCES public.seeds(id) ON DELETE CASCADE,
  through_day date NOT NULL
);
ALTER TABLE public.resource_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.resource_state FROM anon, authenticated;
GRANT ALL ON public.resource_state TO service_role;

-- purchases: the Kontor price the player saw and accepted (V7: never an unnoticed Zukauf), and what was used
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS kontor_max integer;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS material jsonb;

-- stock of one resource from the rows strictly before _before (default: everything)
CREATE OR REPLACE FUNCTION public.resource_stock(_seed uuid, _resource text, _before timestamptz DEFAULT 'infinity')
 RETURNS integer LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT coalesce(sum(l.amount), 0)::integer FROM public.resource_ledger l
  WHERE l.seed_id = _seed AND l.resource = _resource AND l.at < _before $function$;

-- daily production (Variante D, inland factor 1): wood 1 + 4 with a woodcamp, stone 0.5; buildings count from the
-- first day start after their purchase
CREATE OR REPLACE FUNCTION public.resource_rate(_seed uuid, _resource text, _at timestamptz)
 RETURNS numeric LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT CASE _resource
    WHEN 'wood' THEN 1 + 4 * (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'woodcamp' AND p.created_at < _at))::integer
    WHEN 'stone' THEN 0.5 ELSE 0 END::numeric $function$;

-- storage (Variante D): 100 each, woodcamp +200 wood, granary and granary2 +150 each for both
CREATE OR REPLACE FUNCTION public.resource_cap(_seed uuid, _resource text, _at timestamptz)
 RETURNS integer LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT 100
    + CASE WHEN _resource = 'wood' THEN 200 * (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'woodcamp' AND p.created_at < _at))::integer ELSE 0 END
    + 150 * (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'granary' AND p.created_at < _at))::integer
    + 150 * (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'granary2' AND p.created_at < _at))::integer $function$;

-- whole units per day from a fractional rate: day n gets floor(rate·n) − floor(rate·(n−1)) (0.5 → every second day)
CREATE OR REPLACE FUNCTION public.resource_daily(_rate numeric, _day date)
 RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $function$ SELECT (floor(_rate * (_day - date '2000-01-01')) - floor(_rate * (_day - date '2000-01-01' - 1)))::integer $function$;

-- the one booking path for every resource (start, production, Kontor, consumption); false if that row already exists
CREATE OR REPLACE FUNCTION public.resource_book(_seed uuid, _resource text, _amount integer, _kind text, _ref text, _at timestamptz)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.resource_ledger (seed_id, resource, amount, kind, ref, at) VALUES (_seed, _resource, _amount, _kind, _ref, _at)
    ON CONFLICT (seed_id, resource, kind, ref) DO NOTHING;
  RETURN FOUND;
END $function$;

-- every ledger row: under the village lock, never below zero; rows are never changed afterwards
CREATE OR REPLACE FUNCTION public.resource_ledger_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'resource ledger is append-only'; END IF;
  PERFORM 1 FROM public.seeds WHERE id = NEW.seed_id FOR UPDATE;
  IF NEW.amount < 0 AND public.resource_stock(NEW.seed_id, NEW.resource) + NEW.amount < 0 THEN
    RAISE EXCEPTION 'resource short'; END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS resource_ledger_guard ON public.resource_ledger;
CREATE TRIGGER resource_ledger_guard BEFORE INSERT OR UPDATE ON public.resource_ledger FOR EACH ROW EXECUTE FUNCTION public.resource_ledger_guard();

-- lazy, idempotent bookkeeping up to _today: start stock (60 wood, 30 stone) once at the village's start, then one
-- production entry per resource for every UTC day start after it, capped by the storage at that moment
CREATE OR REPLACE FUNCTION public.resource_refresh_at(_seed uuid, _today date)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c0 timestamptz; rlm text; t0 timestamptz; thru date; d date; d0 timestamptz; r text; amt integer; room integer;
BEGIN
  -- nothing new to book: skip the lock (a stale read only leads to the locked pass below)
  SELECT st.through_day INTO thru FROM public.resource_state st WHERE st.seed_id = _seed;
  IF thru IS NOT NULL AND thru >= _today THEN RETURN; END IF;
  SELECT s.created_at, s.realm INTO c0, rlm FROM public.seeds s WHERE s.id = _seed FOR UPDATE;
  IF c0 IS NULL THEN RETURN; END IF;
  t0 := greatest(public.resources_since(rlm), c0);
  IF t0 >= (_today + 1)::timestamp AT TIME ZONE 'UTC' THEN RETURN; END IF;
  PERFORM public.resource_book(_seed, 'wood', 60, 'start', 'start', t0);
  PERFORM public.resource_book(_seed, 'stone', 30, 'start', 'start', t0);
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
CREATE OR REPLACE FUNCTION public.resource_refresh(_seed uuid)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT public.resource_refresh_at(_seed, (now() AT TIME ZONE 'UTC')::date) $function$;

-- the own village's stocks for the HUD (books open production first); owner or trusted server only
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
  RETURN out || jsonb_build_object('active', true, 'from', t0, 'next', nxt);
END $function$;

-- a bought building uses material (Variante D + V1): wood price/20, stone price/30 only from 500 Mark; what is missing
-- is bought at the Kontor (wood 4, stone 6 Mark) only within the price the player accepted (kontor_max). Runs after
-- purchase_guard (trigger name order), which has set the price and checked rank and money for it.
CREATE OR REPLACE FUNCTION public.purchase_material()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE rlm text; c0 timestamptz; nw integer; ns integer; mw integer; ms integer; kontor integer;
BEGIN
  NEW.material := NULL;
  IF NEW.item NOT IN ('herbs','backhaus','herberge','beginen','badestube','hunter','fisher','woodcamp','granary','healer',
      'school','markethall','guildhall','library','dairy','fireorder','firehouse','guard','bigstore','stonemason',
      'smokehouse','millrow','hammerworks','saltquay','backhaus2','backhaus3','herberge2','herberge3','granary2','granary3') THEN
    RETURN NEW; END IF;
  SELECT s.realm, s.created_at INTO rlm, c0 FROM public.seeds s WHERE s.id = NEW.seed_id;
  IF now() < greatest(public.resources_since(rlm), c0) THEN RETURN NEW; END IF;
  PERFORM public.resource_refresh(NEW.seed_id);
  nw := round(NEW.cost::numeric / 20);
  ns := CASE WHEN NEW.cost >= 500 THEN round(NEW.cost::numeric / 30) ELSE 0 END;
  mw := greatest(0, nw - public.resource_stock(NEW.seed_id, 'wood'));
  ms := greatest(0, ns - public.resource_stock(NEW.seed_id, 'stone'));
  kontor := mw * 4 + ms * 6;
  IF kontor > coalesce(NEW.kontor_max, 0) THEN RAISE EXCEPTION 'material short'; END IF;
  NEW.material := jsonb_build_object('wood', jsonb_build_array(nw, mw), 'stone', jsonb_build_array(ns, ms), 'kontor', kontor);
  IF kontor > 0 THEN
    NEW.cost := NEW.cost + kontor;
    IF public.village_balance(NEW.seed_id) < NEW.cost THEN RAISE EXCEPTION 'not enough money'; END IF;
  END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS purchase_material ON public.purchases;
CREATE TRIGGER purchase_material BEFORE INSERT ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.purchase_material();

-- books the Kontor delivery and the consumption in the same statement as the purchase (rolled back together)
CREATE OR REPLACE FUNCTION public.purchase_material_book()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r text; need integer; bought integer;
BEGIN
  IF NEW.material IS NULL THEN RETURN NEW; END IF;
  FOREACH r IN ARRAY ARRAY['wood','stone'] LOOP
    need := (NEW.material -> r ->> 0)::integer; bought := (NEW.material -> r ->> 1)::integer;
    IF bought > 0 AND NOT public.resource_book(NEW.seed_id, r, bought, 'kontor', NEW.id::text, NEW.created_at) THEN
      RAISE EXCEPTION 'resource already booked'; END IF;
    IF need > 0 AND NOT public.resource_book(NEW.seed_id, r, -need, 'build', NEW.id::text, NEW.created_at) THEN
      RAISE EXCEPTION 'resource already booked'; END IF;
  END LOOP;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS purchase_material_book ON public.purchases;
CREATE TRIGGER purchase_material_book AFTER INSERT ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.purchase_material_book();

REVOKE ALL ON FUNCTION public.resource_book(uuid, text, integer, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resource_refresh_at(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resource_refresh(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resource_overview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resource_book(uuid, text, integer, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.resource_refresh_at(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.resource_refresh(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.resource_overview(uuid) TO authenticated, service_role;
