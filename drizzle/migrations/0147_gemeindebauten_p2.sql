-- Wirtschaftsumbau P2: Gemeindebauten Stufe 1 — Spital 1 (Krankensaal, 10.000 Mark, 21 Bautage) and Waage 1
-- (Waagehaus, 12.000 Mark, 14 Bautage), both from Dorf, one site per village at a time. Mirrors src/game/civic.ts.
--
--  1 Funding: civic_open(seed, stage, budget) opens the stage with a Kontor budget the player accepts (at most the whole
--    material bought at the Kontor). Price + budget are paid in instalments as purchase rows `<stage>:r<n>` (purchase_guard
--    checks the order, the open amount and the money; the village lock serialises them). Paid money is final.
--  2 Material: from the first UTC day start after full funding, civic_day (inside resource_refresh_at, so it books every
--    day in order, with or without a login) takes wood/stone above 40 / 30 from the store, then from the shared quota
--    (4 wood + 3 stone a day, saved up to 30 days) at the Kontor price, paid only from the prepaid budget.
--  3 Building: all material in → the stage builds its days. civic_day then books the marker row `<stage>` (cost 0,
--    dated at completion) and refunds the unused budget (`<stage>:refund`, negative cost, dated that day). Only these
--    two rows are server-booked; the guard refuses them from clients.
-- Effects read the marker only (sickness.ts SPITAL_SICK, resource_kontor_at / kontorQuote ×0.85), never earlier.
-- Active only where resources run (resources_since: lab now, public maps not before a later migration).
-- No existing price, building, chest, monument, title, guild rank or the Gemeinwesen rules change.

-- FIRST: purchase_guard learns the instalments and the server rows (same patch pattern as 0143). A live guard whose
-- text differs aborts here before anything else exists.
DO $do$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.purchase_guard()'::regprocedure);
  IF position('civic_deposit_price' in d) > 0 THEN RETURN; END IF;
  d := replace(d, $s$  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;$s$,
    $s$  -- Gemeindebauten P2 (src/game/civic.ts, 0147): instalments pay an opened stage; marker and refund only from civic_day
  IF NEW.item ~ '^(spital1|waage1):r[1-9][0-9]*$' THEN
    price := public.civic_deposit_price(NEW.seed_id, NEW.item, NEW.cost);
    IF NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad position'; END IF;
  ELSIF NEW.item ~ '^(spital1|waage1)(:refund)?$' THEN
    IF current_setting('samenland.civic', true) IS DISTINCT FROM 'on' THEN RAISE EXCEPTION 'civic rows are booked by the server'; END IF;
    price := NEW.cost;
  END IF;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;$s$);
  d := replace(d, $s$NEW.cost := price; NEW.created_at := now();$s$,
    $s$NEW.cost := price; NEW.created_at := CASE WHEN current_setting('samenland.civic', true) = 'on' AND NEW.item ~ '^(spital1|waage1)(:refund)?$' THEN NEW.created_at ELSE now() END;$s$);
  IF position('civic_deposit_price' in d) = 0 OR position($s$current_setting('samenland.civic', true) = 'on'$s$ in d) = 0 THEN
    RAISE EXCEPTION 'purchase_guard patch did not apply'; END IF;
  EXECUTE d;
END $do$;

ALTER TABLE public.resource_ledger DROP CONSTRAINT IF EXISTS resource_ledger_kind_check;
ALTER TABLE public.resource_ledger ADD CONSTRAINT resource_ledger_kind_check CHECK (kind IN ('start','prod','kontor','build','civic'));

CREATE TABLE IF NOT EXISTS public.civic_stages (
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  item text NOT NULL CHECK (item IN ('spital1','waage1')),
  price integer NOT NULL CHECK (price > 0),
  budget integer NOT NULL CHECK (budget >= 0),
  need_wood integer NOT NULL, need_stone integer NOT NULL, build_days integer NOT NULL,
  wood_got integer NOT NULL DEFAULT 0, stone_got integer NOT NULL DEFAULT 0, kontor_spent integer NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  funded_at timestamptz, material_at timestamptz, done_at timestamptz,
  PRIMARY KEY (seed_id, item),
  CHECK (wood_got <= need_wood AND stone_got <= need_stone AND kontor_spent <= budget)
);
ALTER TABLE public.civic_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read their stages" ON public.civic_stages;
CREATE POLICY "Owners read their stages" ON public.civic_stages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = civic_stages.seed_id AND s.user_id = auth.uid()));
REVOKE ALL ON public.civic_stages FROM anon, authenticated;
GRANT SELECT ON public.civic_stages TO authenticated;
GRANT ALL ON public.civic_stages TO service_role;

-- the shared daily quota, accrued by civic_day for every booked day (login-independent), capped at 30 days
CREATE TABLE IF NOT EXISTS public.civic_quota (
  seed_id uuid PRIMARY KEY REFERENCES public.seeds(id) ON DELETE CASCADE,
  wood integer NOT NULL CHECK (wood BETWEEN 0 AND 120),
  stone integer NOT NULL CHECK (stone BETWEEN 0 AND 90),
  through_day date NOT NULL
);
ALTER TABLE public.civic_quota ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read their quota" ON public.civic_quota;
CREATE POLICY "Owners read their quota" ON public.civic_quota FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = civic_quota.seed_id AND s.user_id = auth.uid()));
REVOKE ALL ON public.civic_quota FROM anon, authenticated;
GRANT SELECT ON public.civic_quota TO authenticated;
GRANT ALL ON public.civic_quota TO service_role;

-- each instalment number once; marker and refund once (also double-request protection on top of the village lock)
CREATE UNIQUE INDEX IF NOT EXISTS purchases_civic_once ON public.purchases (seed_id, item)
  WHERE item ~ '^(spital1|waage1)(:refund|:r[1-9][0-9]*)?$';

-- Kontor price at a moment: wood 4, stone 6; coast −10 %; with a finished Waage 1 −15 % (round half up)
CREATE OR REPLACE FUNCTION public.resource_kontor_at(_seed uuid, _wood integer, _stone integer, _at timestamptz)
 RETURNS integer LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT round((_wood * 4 + _stone * 6)
    * CASE WHEN (SELECT v.way FROM public.village_sites v WHERE v.seed_id = _seed) = 'gateway' THEN 0.9 ELSE 1 END
    * CASE WHEN EXISTS (SELECT 1 FROM public.purchases p WHERE p.seed_id = _seed AND p.item = 'waage1' AND p.created_at <= _at) THEN 0.85 ELSE 1 END)::integer $function$;
CREATE OR REPLACE FUNCTION public.resource_kontor(_seed uuid, _wood integer, _stone integer)
 RETURNS integer LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT public.resource_kontor_at(_seed, _wood, _stone, now()) $function$;

-- open a stage: owner, resources active, certified Dorf, one site at a time, budget within the whole material's price
CREATE OR REPLACE FUNCTION public.civic_open(_seed uuid, _item text, _budget integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c0 timestamptz; rlm text; owner uuid; price integer; days integer; nw integer; ns integer; maxb integer;
BEGIN
  SELECT s.created_at, s.realm, s.user_id INTO c0, rlm, owner FROM public.seeds s WHERE s.id = _seed FOR UPDATE;
  IF c0 IS NULL OR (coalesce(auth.role(), '') <> 'service_role' AND (auth.uid() IS NULL OR owner IS DISTINCT FROM auth.uid())) THEN
    RAISE EXCEPTION 'not owner'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('purchase:' || _seed::text));
  IF now() < greatest(public.resources_since(rlm), c0) THEN RAISE EXCEPTION 'not now'; END IF;
  price := CASE _item WHEN 'spital1' THEN 10000 WHEN 'waage1' THEN 12000 ELSE NULL END;
  days := CASE _item WHEN 'spital1' THEN 21 WHEN 'waage1' THEN 14 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  IF EXISTS (SELECT 1 FROM public.civic_stages c WHERE c.seed_id = _seed AND c.item = _item) THEN RAISE EXCEPTION 'already built'; END IF;
  IF EXISTS (SELECT 1 FROM public.civic_stages c WHERE c.seed_id = _seed AND (c.done_at IS NULL OR c.done_at > now())) THEN
    RAISE EXCEPTION 'site busy'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.rank_certificates rc WHERE rc.seed_id = _seed AND rc.rank >= 2 AND rc.certified_at > now() - interval '15 minutes') THEN
    RAISE EXCEPTION 'rank too low'; END IF;
  nw := round(price::numeric / 200); ns := round(price::numeric / 300);
  maxb := public.resource_kontor_at(_seed, nw, ns, now());
  IF _budget IS NULL OR _budget < 0 OR _budget > maxb THEN RAISE EXCEPTION 'bad budget'; END IF;
  INSERT INTO public.civic_stages (seed_id, item, price, budget, need_wood, need_stone, build_days)
    VALUES (_seed, _item, price, _budget, nw, ns, days);
  RETURN jsonb_build_object('item', _item, 'price', price, 'budget', _budget, 'wood', nw, 'stone', ns, 'days', days);
END $function$;

-- one instalment: the next number, at least 1 Mark, at most what is still open (called by purchase_guard under its lock)
CREATE OR REPLACE FUNCTION public.civic_deposit_price(_seed uuid, _item text, _amount integer)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE base text := split_part(_item, ':', 1); n integer := substring(_item from ':r([0-9]+)$')::integer; st record; cnt integer; paid integer;
BEGIN
  SELECT * INTO st FROM public.civic_stages c WHERE c.seed_id = _seed AND c.item = base FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'stage not open'; END IF;
  IF st.funded_at IS NOT NULL THEN RAISE EXCEPTION 'already funded'; END IF;
  SELECT count(*), coalesce(sum(p.cost), 0) INTO cnt, paid FROM public.purchases p
    WHERE p.seed_id = _seed AND p.item ~ ('^' || base || ':r[0-9]+$');
  IF n <> cnt + 1 THEN RAISE EXCEPTION 'previous step open'; END IF;
  IF _amount IS NULL OR _amount < 1 OR _amount > st.price + st.budget - paid THEN RAISE EXCEPTION 'bad amount'; END IF;
  RETURN _amount;
END $function$;

-- after an instalment: fully paid (price + budget) → funded now
CREATE OR REPLACE FUNCTION public.civic_paid()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE base text;
BEGIN
  IF NEW.item !~ '^(spital1|waage1):r[1-9][0-9]*$' THEN RETURN NEW; END IF;
  base := split_part(NEW.item, ':', 1);
  UPDATE public.civic_stages c SET funded_at = NEW.created_at
    WHERE c.seed_id = NEW.seed_id AND c.item = base AND c.funded_at IS NULL
      AND (SELECT coalesce(sum(p.cost), 0) FROM public.purchases p WHERE p.seed_id = NEW.seed_id AND p.item ~ ('^' || base || ':r[0-9]+$')) >= c.price + c.budget;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS civic_paid ON public.purchases;
CREATE TRIGGER civic_paid AFTER INSERT ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.civic_paid();

-- one booked day (called by resource_refresh_at after that day's production, under the village lock)
CREATE OR REPLACE FUNCTION public.civic_day(_seed uuid, _d date, _d0 timestamptz)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE st record; q record; t timestamptz := _d0 + interval '1 second'; tw integer; ts integer; bw integer; bs integer;
  c integer := 0; owner uuid; done timestamptz; refund integer;
BEGIN
  -- the quota grows every booked day, with or without a site (4 wood + 3 stone, at most 30 days)
  INSERT INTO public.civic_quota (seed_id, wood, stone, through_day) VALUES (_seed, 4, 3, _d)
    ON CONFLICT (seed_id) DO UPDATE SET wood = least(120, public.civic_quota.wood + 4), stone = least(90, public.civic_quota.stone + 3),
      through_day = _d WHERE public.civic_quota.through_day < _d;
  SELECT * INTO st FROM public.civic_stages c
    WHERE c.seed_id = _seed AND c.funded_at < _d0 AND c.material_at IS NULL ORDER BY c.opened_at LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  -- Gemeindebauten first (Material-Vorrang): later Stiftungen take from store and quota only after this
  -- 1 store above the 40 wood / 30 stone kept for ordinary buildings
  tw := least(st.need_wood - st.wood_got, greatest(0, public.resource_stock(_seed, 'wood', t) - 40));
  ts := least(st.need_stone - st.stone_got, greatest(0, public.resource_stock(_seed, 'stone', t) - 30));
  IF tw > 0 THEN PERFORM public.resource_book(_seed, 'wood', -tw, 'civic', st.item || ':s:' || _d, t); END IF;
  IF ts > 0 THEN PERFORM public.resource_book(_seed, 'stone', -ts, 'civic', st.item || ':s:' || _d, t); END IF;
  -- 2 the quota at the Kontor, paid from the prepaid budget only
  SELECT * INTO q FROM public.civic_quota WHERE seed_id = _seed FOR UPDATE;
  bw := least(st.need_wood - st.wood_got - tw, q.wood);
  bs := least(st.need_stone - st.stone_got - ts, q.stone);
  LOOP
    c := public.resource_kontor_at(_seed, bw, bs, _d0);
    EXIT WHEN c <= st.budget - st.kontor_spent OR (bw = 0 AND bs = 0);
    IF bw > 0 THEN bw := bw - 1; ELSE bs := bs - 1; END IF;
  END LOOP;
  IF bw = 0 AND bs = 0 THEN c := 0; END IF;
  IF bw > 0 THEN
    PERFORM public.resource_book(_seed, 'wood', bw, 'kontor', st.item || ':k:' || _d, t);
    PERFORM public.resource_book(_seed, 'wood', -bw, 'civic', st.item || ':q:' || _d, t);
  END IF;
  IF bs > 0 THEN
    PERFORM public.resource_book(_seed, 'stone', bs, 'kontor', st.item || ':k:' || _d, t);
    PERFORM public.resource_book(_seed, 'stone', -bs, 'civic', st.item || ':q:' || _d, t);
  END IF;
  UPDATE public.civic_quota SET wood = wood - bw, stone = stone - bs WHERE seed_id = _seed;
  UPDATE public.civic_stages SET wood_got = wood_got + tw + bw, stone_got = stone_got + ts + bs, kontor_spent = kontor_spent + c
    WHERE seed_id = _seed AND item = st.item;
  -- 3 all material in: build days, then the marker (effects) and the unused budget back
  IF st.wood_got + tw + bw >= st.need_wood AND st.stone_got + ts + bs >= st.need_stone THEN
    done := _d0 + make_interval(days => st.build_days);
    UPDATE public.civic_stages SET material_at = _d0, done_at = done WHERE seed_id = _seed AND item = st.item;
    SELECT s.user_id INTO owner FROM public.seeds s WHERE s.id = _seed;
    refund := st.budget - st.kontor_spent - c;
    PERFORM set_config('samenland.civic', 'on', true);
    INSERT INTO public.purchases (seed_id, user_id, item, cost, created_at) VALUES (_seed, owner, st.item, 0, done);
    IF refund > 0 THEN
      INSERT INTO public.purchases (seed_id, user_id, item, cost, created_at) VALUES (_seed, owner, st.item || ':refund', -refund, t);
    END IF;
    PERFORM set_config('samenland.civic', 'off', true);
  END IF;
END $function$;

-- resource_refresh_at as 0143, plus civic_day after each day's production
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
    PERFORM public.civic_day(_seed, d, d0);
    d := d + 1;
  END LOOP;
  INSERT INTO public.resource_state (seed_id, through_day) VALUES (_seed, _today)
    ON CONFLICT (seed_id) DO UPDATE SET through_day = greatest(public.resource_state.through_day, EXCLUDED.through_day);
END $function$;

REVOKE ALL ON FUNCTION public.resource_kontor_at(uuid, integer, integer, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resource_kontor_at(uuid, integer, integer, timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.resource_kontor(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resource_kontor(uuid, integer, integer) TO service_role;
REVOKE ALL ON FUNCTION public.civic_open(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.civic_open(uuid, text, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.civic_deposit_price(uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.civic_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.civic_day(uuid, date, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.civic_day(uuid, date, timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.resource_refresh_at(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resource_refresh_at(uuid, date) TO service_role;
