-- Wirtschaftsumbau P3a: Gemeindebauten Stufe 2/3 — Spital 2 (Kapelle), Spital 3 (Wirtschaftshof), Waage 2
-- (Tretradkran). Mirrors src/game/civic.ts (CIVIC), resources.ts (resourceRates) and sickness.ts — change together.
--
--  Stage data in one place: civic_stage_defs (price, build days, certified rank to open, previous stage). civic_open
--  reads it; civic_stages points at it instead of a fixed list; the guard, the once-index and civic_paid use the same
--  general pattern for every stage of Spital and Waage as the purchase counting of F-P2-1 (0153), so a later stage
--  needs one row here and nothing else in the booking paths.
--    spital1  Krankensaal     10.000 Mark, 21 days, Dorf       (unchanged)
--    waage1   Waagehaus       12.000 Mark, 14 days, Dorf       (unchanged)
--    spital2  Kapelle         18.000 Mark, 35 days, Kleinstadt, after spital1 stands
--    spital3  Wirtschaftshof  22.000 Mark, 42 days, Kleinstadt, after spital2 stands
--    waage2   Tretradkran     18.000 Mark, 21 days, Kleinstadt, after waage1 stands
--  Material as before: price/200 wood, price/300 stone (90/60, 110/73, 90/60). Kontor budget stays a limit only, the
--  building price is paid in instalments, one site at a time — civic_day, civic_deposit_price and the quota unchanged.
--  Effects from the completion marker on (as every Gemeindebau): Spital 2 sickness ×0.90 on top of Spital 1 (sickness.ts,
--  together ×0.765); Spital 3 +1 wood and +0.5 stone a day (resource_rate); Waage 2 storage +100 wood and +100 stone
--  (resource_cap). Waage 1's Kontor discount stays with waage1.
-- Untouched: the Ankauf (0151: resource_refresh_at, ankauf_*), the purchase counting (0153: quest_guard,
-- princely_task_met), civic_day, the quota, the chest and every other price or rule.

-- FIRST: purchase_guard takes every stage (same patch pattern as 0143/0147/0151). Exactly the three stage patterns of
-- 0147 (instalment, server row, created_at) are generalised; the Ankauf branch of 0151 keeps its text.
DO $do$
DECLARE d text; o text := '(spital1|waage1)'; n text := '(spital|waage)[1-9][0-9]*';
BEGIN
  d := pg_get_functiondef('public.purchase_guard()'::regprocedure);
  IF position(o in d) = 0 AND (length(d) - length(replace(d, n, ''))) / length(n) = 3 THEN RETURN; END IF;
  IF (length(d) - length(replace(d, o, ''))) / length(o) <> 3 OR position(n in d) > 0 THEN
    RAISE EXCEPTION 'purchase_guard: unexpected stage patterns'; END IF;
  d := replace(d, o, n);
  IF position('samenland.ankauf' in d) = 0 OR (length(d) - length(replace(d, n, ''))) / length(n) <> 3 THEN
    RAISE EXCEPTION 'purchase_guard patch did not apply'; END IF;
  EXECUTE d;
END $do$;

CREATE TABLE IF NOT EXISTS public.civic_stage_defs (
  item text PRIMARY KEY CHECK (item ~ '^(spital|waage)[1-9][0-9]*$'),
  chain text NOT NULL CHECK (chain IN ('spital', 'waage')),
  step integer NOT NULL CHECK (step >= 1),
  price integer NOT NULL CHECK (price > 0),
  build_days integer NOT NULL CHECK (build_days > 0),
  min_rank integer NOT NULL CHECK (min_rank >= 1),
  after_item text REFERENCES public.civic_stage_defs(item),
  UNIQUE (chain, step),
  CHECK (item = chain || step::text),
  CHECK ((step = 1) = (after_item IS NULL))
);
INSERT INTO public.civic_stage_defs (item, chain, step, price, build_days, min_rank, after_item) VALUES
  ('spital1', 'spital', 1, 10000, 21, 2, NULL),
  ('waage1', 'waage', 1, 12000, 14, 2, NULL),
  ('spital2', 'spital', 2, 18000, 35, 3, 'spital1'),
  ('spital3', 'spital', 3, 22000, 42, 3, 'spital2'),
  ('waage2', 'waage', 2, 18000, 21, 3, 'waage1')
ON CONFLICT (item) DO UPDATE SET chain = EXCLUDED.chain, step = EXCLUDED.step, price = EXCLUDED.price,
  build_days = EXCLUDED.build_days, min_rank = EXCLUDED.min_rank, after_item = EXCLUDED.after_item;
ALTER TABLE public.civic_stage_defs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.civic_stage_defs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.civic_stage_defs TO service_role;

-- civic_stages: the fixed list of 0147 becomes a reference to the stage table (existing rows are spital1/waage1)
DO $do$
DECLARE c record;
BEGIN
  FOR c IN SELECT con.conname FROM pg_constraint con WHERE con.conrelid = 'public.civic_stages'::regclass
      AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%spital1%' LOOP
    EXECUTE format('ALTER TABLE public.civic_stages DROP CONSTRAINT %I', c.conname);
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint con WHERE con.conrelid = 'public.civic_stages'::regclass AND con.conname = 'civic_stages_item_fkey') THEN
    ALTER TABLE public.civic_stages ADD CONSTRAINT civic_stages_item_fkey FOREIGN KEY (item) REFERENCES public.civic_stage_defs(item);
  END IF;
END $do$;

-- each instalment number once, the marker once, one Kontor row per stage and day — now for every stage
DROP INDEX IF EXISTS public.purchases_civic_once;
CREATE UNIQUE INDEX purchases_civic_once ON public.purchases (seed_id, item)
  WHERE item ~ '^(spital|waage)[1-9][0-9]*(:k[0-9]{8}|:r[1-9][0-9]*)?$';

-- open a stage: as 0147, but price, days, rank and the previous stage come from civic_stage_defs
CREATE OR REPLACE FUNCTION public.civic_open(_seed uuid, _item text, _budget integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c0 timestamptz; rlm text; owner uuid; def record; nw integer; ns integer; maxb integer;
BEGIN
  SELECT s.created_at, s.realm, s.user_id INTO c0, rlm, owner FROM public.seeds s WHERE s.id = _seed FOR UPDATE;
  IF c0 IS NULL OR (coalesce(auth.role(), '') <> 'service_role' AND (auth.uid() IS NULL OR owner IS DISTINCT FROM auth.uid())) THEN
    RAISE EXCEPTION 'not owner'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('purchase:' || _seed::text));
  IF now() < greatest(public.resources_since(rlm), c0) THEN RAISE EXCEPTION 'not now'; END IF;
  SELECT * INTO def FROM public.civic_stage_defs d WHERE d.item = _item;
  IF NOT FOUND THEN RAISE EXCEPTION 'unknown item'; END IF;
  IF EXISTS (SELECT 1 FROM public.civic_stages c WHERE c.seed_id = _seed AND c.item = _item) THEN RAISE EXCEPTION 'already built'; END IF;
  IF EXISTS (SELECT 1 FROM public.civic_stages c WHERE c.seed_id = _seed AND (c.done_at IS NULL OR c.done_at > now())) THEN
    RAISE EXCEPTION 'site busy'; END IF;
  IF def.after_item IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.purchases p
      WHERE p.seed_id = _seed AND p.item = def.after_item AND p.created_at <= now()) THEN
    RAISE EXCEPTION 'previous stage open'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.rank_certificates rc WHERE rc.seed_id = _seed AND rc.rank >= def.min_rank
      AND rc.certified_at > now() - interval '15 minutes') THEN
    RAISE EXCEPTION 'rank too low'; END IF;
  nw := round(def.price::numeric / 200); ns := round(def.price::numeric / 300);
  maxb := public.resource_kontor_at(_seed, nw, ns, now());
  IF _budget IS NULL OR _budget < 0 OR _budget > maxb THEN RAISE EXCEPTION 'bad budget'; END IF;
  INSERT INTO public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days)
    VALUES (_seed, _item, def.price, _budget, nw, ns, def.build_days);
  RETURN jsonb_build_object('item', _item, 'price', def.price, 'budget', _budget, 'wood', nw, 'stone', ns, 'days', def.build_days);
END $function$;

-- after an instalment: building price fully paid → funded now (as 0147, for every stage)
CREATE OR REPLACE FUNCTION public.civic_paid()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE base text;
BEGIN
  IF NEW.item !~ '^(spital|waage)[1-9][0-9]*:r[1-9][0-9]*$' THEN RETURN NEW; END IF;
  base := split_part(NEW.item, ':', 1);
  UPDATE public.civic_stages c SET funded_at = NEW.created_at
    WHERE c.seed_id = NEW.seed_id AND c.item = base AND c.funded_at IS NULL
      AND (SELECT coalesce(sum(p.cost), 0) FROM public.purchases p WHERE p.seed_id = NEW.seed_id AND p.item ~ ('^' || base || ':r[0-9]+$')) >= c.price;
  RETURN NEW;
END $function$;

-- production as 0143, plus Spital 3 (Wirtschaftshof): +1 wood and +0.5 stone a day from its completion marker on
CREATE OR REPLACE FUNCTION public.resource_rate(_seed uuid, _resource text, _at timestamptz)
 RETURNS numeric LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT CASE _resource
    WHEN 'wood' THEN 1 + (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'woodcamp' AND p.created_at < _at))::integer
      * CASE (SELECT v.way FROM public.village_sites v WHERE v.seed_id = _seed) WHEN 'workshop' THEN 6 WHEN 'gateway' THEN 3 ELSE 4 END
      + (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'spital3' AND p.created_at < _at))::integer
    WHEN 'stone' THEN 0.5 + (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'steingrube' AND p.created_at < _at))::integer
      * CASE (SELECT v.way FROM public.village_sites v WHERE v.seed_id = _seed) WHEN 'workshop' THEN 4 WHEN 'gateway' THEN 1 ELSE 3 END
      + 0.5 * (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'spital3' AND p.created_at < _at))::integer
    ELSE 0 END::numeric $function$;

-- storage as 0142, plus Waage 2 (Tretradkran): +100 wood and +100 stone from its completion marker on
CREATE OR REPLACE FUNCTION public.resource_cap(_seed uuid, _resource text, _at timestamptz)
 RETURNS integer LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT 100
    + CASE WHEN _resource = 'wood' THEN 200 * (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'woodcamp' AND p.created_at < _at))::integer ELSE 0 END
    + 150 * (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'granary' AND p.created_at < _at))::integer
    + 150 * (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'granary2' AND p.created_at < _at))::integer
    + 100 * (EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'waage2' AND p.created_at < _at))::integer $function$;

REVOKE ALL ON FUNCTION public.civic_open(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.civic_open(uuid, text, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.civic_paid() FROM PUBLIC, anon, authenticated;
