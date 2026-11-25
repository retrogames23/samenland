-- Wirtschaftsumbau P2, Nachtrag zu 0147: a caught-up historical day may only buy at the Kontor with money the village
-- really had then — and still had at every later moment until now. 0147 read today's village_balance, so money that
-- came in later (a gift, a reward) could finance an earlier day's Kontor purchase and date material and completion
-- too early. Only the cash check of civic_day changes; limit, instalments, store, quota and marker stay as in 0147.
--
-- Separate migration on purpose: 0147 stays byte-identical, so a database that already registered 0147 just runs this
-- one (both statements are CREATE OR REPLACE, no data change; civic_stages is empty outside the lab).
--
-- civic_cash_from(seed, t) = the minimum of the chest walk (village_balance_walk, same start as village_balance) at t,
-- at every later money outflow of the village (purchases, encounters, twin works, building moves, gifts sent, raids)
-- and now. Between those points the walk only rises (income, capped by the chest), so a debit at t that fits this
-- minimum leaves the balance non-negative at every moment after t; later income can never pay for it. At one moment the
-- walk books income before outflows, so the walk at an outflow's time is the low point of that moment. All outflow
-- tables take the village row lock (tax_spend_lock) like resource_refresh_at does, so no outflow is committed between
-- this check and the Kontor row.

CREATE OR REPLACE FUNCTION public.civic_cash_from(_seed uuid, _t timestamptz)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT greatest(0, least(
    public.village_balance(_seed),
    public.village_balance_walk(_seed, timestamptz '2026-11-12 00:00:00+00', _t),
    (SELECT min(public.village_balance_walk(_seed, timestamptz '2026-11-12 00:00:00+00', o.at)) FROM (
        SELECT p.created_at AS at FROM public.purchases p WHERE p.seed_id = _seed AND p.cost > 0 AND p.created_at > _t
        UNION SELECT e.created_at FROM public.encounters e WHERE e.seed_id = _seed AND e.cost > 0 AND e.created_at > _t
        UNION SELECT w.created_at FROM public.twin_works w WHERE w.seed_id = _seed AND w.cost > 0 AND w.created_at > _t
        UNION SELECT m.created_at FROM public.building_moves m WHERE m.seed_id = _seed AND m.cost > 0 AND m.created_at > _t
        UNION SELECT g.created_at FROM public.gifts g WHERE g.from_seed = _seed AND g.to_seed IS DISTINCT FROM _seed AND g.amount > 0 AND g.created_at > _t
        UNION SELECT x.t FROM public.village_raid_list(_seed, _t, now()) x WHERE x.loss > 0
      ) o)))
$function$;
REVOKE ALL ON FUNCTION public.civic_cash_from(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.civic_cash_from(uuid, timestamptz) TO service_role;

-- civic_day exactly as 0147, only the cash line changed
CREATE OR REPLACE FUNCTION public.civic_day(_seed uuid, _d date, _d0 timestamptz)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE st record; q record; t timestamptz := _d0 + interval '1 second'; tw integer; ts integer; bw integer; bs integer;
  c integer := 0; owner uuid; done timestamptz; cash integer;
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
  -- 2 the quota at the Kontor: paid from the village chest, never beyond the confirmed limit nor the chest (budget 0: none)
  SELECT * INTO q FROM public.civic_quota WHERE seed_id = _seed FOR UPDATE;
  bw := least(st.need_wood - st.wood_got - tw, q.wood);
  bs := least(st.need_stone - st.stone_got - ts, q.stone);
  -- 0148: the lowest chest balance from this day's booking time until now (civic_cash_from), never today's money
  cash := CASE WHEN bw > 0 OR bs > 0 THEN public.civic_cash_from(_seed, t) ELSE 0 END;
  LOOP
    c := public.resource_kontor_at(_seed, bw, bs, _d0);
    EXIT WHEN c <= least(st.budget - st.kontor_spent, cash) OR (bw = 0 AND bs = 0);
    IF bw > 0 THEN bw := bw - 1; ELSE bs := bs - 1; END IF;
  END LOOP;
  IF bw = 0 AND bs = 0 THEN c := 0; END IF;
  SELECT s.user_id INTO owner FROM public.seeds s WHERE s.id = _seed;
  IF c > 0 THEN
    -- the day's Kontor purchase as its own money row (purchase_guard checks the chest once more)
    PERFORM set_config('samenland.civic', 'on', true);
    INSERT INTO public.purchases (seed_id, user_id, item, cost, created_at) VALUES (_seed, owner, st.item || ':k' || to_char(_d, 'YYYYMMDD'), c, t);
    PERFORM set_config('samenland.civic', 'off', true);
  END IF;
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
  -- 3 all material in: build days, then the marker (effects) dated at completion
  IF st.wood_got + tw + bw >= st.need_wood AND st.stone_got + ts + bs >= st.need_stone THEN
    done := _d0 + make_interval(days => st.build_days);
    UPDATE public.civic_stages SET material_at = _d0, done_at = done WHERE seed_id = _seed AND item = st.item;
    PERFORM set_config('samenland.civic', 'on', true);
    INSERT INTO public.purchases (seed_id, user_id, item, cost, created_at) VALUES (_seed, owner, st.item, 0, done);
    PERFORM set_config('samenland.civic', 'off', true);
  END IF;
END $function$;

REVOKE ALL ON FUNCTION public.civic_day(uuid, date, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.civic_day(uuid, date, timestamptz) TO service_role;
