-- Wirtschaftsumbau P1: Ankauf. What a day's production would add above the storage cap is no longer lost: the Kontor
-- buys it at half its base price (wood 2, stone 3 Mark; Masterplan v6.1, Spezifikation „Ressourcenhandel und Kontor“).
-- Mirrors src/game/resources.ts (ANKAUF_PRICE, resourceDay, ankaufMark, isAnkauf) — change both together.
--
--  1 Only real overflow: resource_refresh_at books each day's production at the day start, capped by the room below the
--    storage cap (resource_cap − stock before that moment, exactly as since 0142). The part of the day's whole units
--    that did not fit is the overflow. Stock, production rows and the Gemeindebau pull stay exactly as they are.
--  2 One credit per village and UTC day: a server-booked purchase row `ankauf:YYYYMMDD` with negative cost (2·wood +
--    3·stone), dated at that day start. The chest walk (village_balance_walk, treasury in economy.ts) already books every
--    negative cost as income that only fills the room below the chest cap; the rest is lost like surplus tax. No new
--    money path, no change to village_balance. civic_cash_from counts only rows with cost > 0 as outflows, so a credit
--    never lowers the cash a Gemeindebau day may spend.
--  3 Never twice: the day loop runs under the village row lock and only over unbooked days (resource_state); the unique
--    index purchases_ankauf_once and ON CONFLICT DO NOTHING keep a day at one row even if it were reached twice.
--  4 Never retroactive: ankauf_since(realm) is fixed when this migration first runs — the lab map from the next UTC day
--    start after it, every public map from the placeholder 2100-01-04 (P6 sets the real date). Days before it, also when
--    an absent village catches them up later, get no credit. Public maps have no resources before resources_since anyway.
-- Clients can neither insert nor change these rows (purchase_guard: server setting samenland.ankauf only). Additive:
-- no existing row, price, building, chest or rule changes.

-- FIRST: purchase_guard learns the server-booked credit (same patch pattern as 0143/0147). A live guard whose text
-- differs aborts here before anything else exists.
DO $do$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.purchase_guard()'::regprocedure);
  IF position('samenland.ankauf' in d) > 0 THEN RETURN; END IF;
  d := replace(d, $s$  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;$s$,
    $s$  -- Ankauf P1 (src/game/resources.ts, 0151): one day's overflow credit, negative cost, booked only by resource_refresh_at
  IF NEW.item ~ '^ankauf:[0-9]{8}$' THEN
    IF current_setting('samenland.ankauf', true) IS DISTINCT FROM 'on' THEN RAISE EXCEPTION 'ankauf rows are booked by the server'; END IF;
    IF NEW.cost IS NULL OR NEW.cost >= 0 OR NEW.x IS NOT NULL OR NEW.y IS NOT NULL THEN RAISE EXCEPTION 'bad ankauf'; END IF;
    price := NEW.cost;
  END IF;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;$s$);
  d := replace(d, $s$AND NEW.item ~ '^(spital1|waage1)(:k[0-9]{8})?$' THEN NEW.created_at ELSE now() END;$s$,
    $s$AND NEW.item ~ '^(spital1|waage1)(:k[0-9]{8})?$' THEN NEW.created_at WHEN current_setting('samenland.ankauf', true) = 'on' AND NEW.item ~ '^ankauf:[0-9]{8}$' THEN NEW.created_at ELSE now() END;$s$);
  IF (length(d) - length(replace(d, 'samenland.ankauf', ''))) / 16 <> 2 THEN RAISE EXCEPTION 'purchase_guard patch did not apply'; END IF;
  EXECUTE d;
END $do$;

-- the start of the Ankauf per map, fixed at the first run of this migration (never moved by a re-run)
DO $do$
BEGIN
  IF to_regprocedure('public.ankauf_since(text)') IS NOT NULL THEN RETURN; END IF;
  EXECUTE format($f$CREATE FUNCTION public.ankauf_since(_realm text)
 RETURNS timestamptz LANGUAGE sql STABLE SET search_path TO 'public'
AS $b$ SELECT CASE WHEN _realm = 'lab' THEN %L::timestamptz ELSE '2100-01-04 00:00:00+00'::timestamptz END $b$$f$,
    to_char((date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day'), 'YYYY-MM-DD HH24:MI:SS') || '+00');
END $do$;

-- price per unit of overflow: half the Kontor base price (wood 4, stone 6), no location factor, no Waage discount
CREATE OR REPLACE FUNCTION public.ankauf_price(_seed uuid, _resource text, _at timestamptz)
 RETURNS integer LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$ SELECT CASE _resource WHEN 'wood' THEN 2 WHEN 'stone' THEN 3 ELSE 0 END $function$;

CREATE UNIQUE INDEX IF NOT EXISTS purchases_ankauf_once ON public.purchases (seed_id, item) WHERE item ~ '^ankauf:[0-9]{8}$';

-- one day's credit (called by resource_refresh_at under the village lock); nothing for an empty day
CREATE OR REPLACE FUNCTION public.ankauf_book(_seed uuid, _owner uuid, _d date, _d0 timestamptz, _wood integer, _stone integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE mark integer := _wood * public.ankauf_price(_seed, 'wood', _d0) + _stone * public.ankauf_price(_seed, 'stone', _d0);
BEGIN
  IF mark <= 0 OR _owner IS NULL THEN RETURN; END IF;
  PERFORM set_config('samenland.ankauf', 'on', true);
  INSERT INTO public.purchases (seed_id, user_id, item, cost, created_at)
    VALUES (_seed, _owner, 'ankauf:' || to_char(_d, 'YYYYMMDD'), -mark, _d0)
    ON CONFLICT (seed_id, item) WHERE item ~ '^ankauf:[0-9]{8}$' DO NOTHING;
  PERFORM set_config('samenland.ankauf', 'off', true);
END $function$;

-- resource_refresh_at as 0147, plus the day's overflow credit after its production (before the Gemeindebau pull)
CREATE OR REPLACE FUNCTION public.resource_refresh_at(_seed uuid, _today date)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c0 timestamptz; rlm text; owner uuid; t0 timestamptz; ak timestamptz; thru date; d date; d0 timestamptz; r text;
  amt integer; room integer; ow integer; os integer;
BEGIN
  SELECT st.through_day INTO thru FROM public.resource_state st WHERE st.seed_id = _seed;
  IF thru IS NOT NULL AND thru >= _today THEN RETURN; END IF;
  SELECT s.created_at, s.realm, s.user_id INTO c0, rlm, owner FROM public.seeds s WHERE s.id = _seed FOR UPDATE;
  IF c0 IS NULL THEN RETURN; END IF;
  t0 := greatest(public.resources_since(rlm), c0);
  IF t0 >= (_today + 1)::timestamp AT TIME ZONE 'UTC' THEN RETURN; END IF;
  PERFORM public.resource_book(_seed, 'wood', 60, 'start', 'start', t0);
  PERFORM public.resource_book(_seed, 'stone', 30, 'start', 'start', t0);
  IF NOT EXISTS (SELECT 1 FROM public.village_sites v WHERE v.seed_id = _seed) THEN RETURN; END IF;
  ak := public.ankauf_since(rlm);
  SELECT st.through_day INTO thru FROM public.resource_state st WHERE st.seed_id = _seed;
  d := greatest(thru + 1, (t0 AT TIME ZONE 'UTC')::date + 1);
  WHILE d <= _today LOOP
    d0 := d::timestamp AT TIME ZONE 'UTC';
    ow := 0; os := 0;
    FOREACH r IN ARRAY ARRAY['wood','stone'] LOOP
      amt := public.resource_daily(public.resource_rate(_seed, r, d0), d);
      room := public.resource_cap(_seed, r, d0) - public.resource_stock(_seed, r, d0);
      -- P1: the whole units above the storage cap are the day's overflow
      IF r = 'wood' THEN ow := amt - least(amt, greatest(room, 0)); ELSE os := amt - least(amt, greatest(room, 0)); END IF;
      amt := least(amt, greatest(room, 0));
      IF amt > 0 THEN PERFORM public.resource_book(_seed, r, amt, 'prod', d::text, d0); END IF;
    END LOOP;
    IF d0 >= ak AND (ow > 0 OR os > 0) THEN PERFORM public.ankauf_book(_seed, owner, d, d0, ow, os); END IF;
    PERFORM public.civic_day(_seed, d, d0);
    d := d + 1;
  END LOOP;
  INSERT INTO public.resource_state (seed_id, through_day) VALUES (_seed, _today)
    ON CONFLICT (seed_id) DO UPDATE SET through_day = greatest(public.resource_state.through_day, EXCLUDED.through_day);
END $function$;

-- overview as 0143 plus the Ankauf: start, price per unit and the newest credit (display only)
CREATE OR REPLACE FUNCTION public.resource_overview(_seed uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE c0 timestamptz; rlm text; owner uuid; t0 timestamptz; nxt timestamptz; out jsonb := '{}'::jsonb; r text; last jsonb;
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
  SELECT jsonb_build_object('at', p.created_at, 'mark', -p.cost) INTO last FROM public.purchases p
    WHERE p.seed_id = _seed AND p.item ~ '^ankauf:[0-9]{8}$' ORDER BY p.created_at DESC LIMIT 1;
  RETURN out || jsonb_build_object('active', true, 'from', t0, 'next', nxt,
    'site', (SELECT v.way FROM public.village_sites v WHERE v.seed_id = _seed),
    'ankauf', jsonb_build_object('since', public.ankauf_since(rlm),
      'wood', public.ankauf_price(_seed, 'wood', nxt), 'stone', public.ankauf_price(_seed, 'stone', nxt), 'last', last));
END $function$;

REVOKE ALL ON FUNCTION public.ankauf_since(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ankauf_since(text) TO service_role;
REVOKE ALL ON FUNCTION public.ankauf_price(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ankauf_price(uuid, text, timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.ankauf_book(uuid, uuid, date, timestamptz, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ankauf_book(uuid, uuid, date, timestamptz, integer, integer) TO service_role;
REVOKE ALL ON FUNCTION public.resource_refresh_at(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resource_refresh_at(uuid, date) TO service_role;
REVOKE ALL ON FUNCTION public.resource_overview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resource_overview(uuid) TO authenticated, service_role;
