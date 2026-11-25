-- Hochzeitspaket: end of the double wedding bookkeeping (src/game/weddings.ts ↔ village_wedding_list).
--
-- From wedding_switch_since(realm) the wedding calendar is computed in ONE place only: src/game/weddings.ts
-- (weddingCalendar, unified rule: the care gate's Gemeinwesen count gemeinwesenGate + careHealthExtra for the health side).
-- The trusted server freezes it into wedding_receipts (treasury.server.ts settleWeddings, idempotent); the database
-- reads those receipts for money and for the encounter guard and never computes a wedding after the switch itself.
-- Weddings before the switch keep the legacy rule, computed here exactly as since 0107 and proven equal to the
-- receipts by wedding_receipt_diff (and by wedding-parity.pg.test.ts for the formula). Nothing booked changes.
--
-- Only ONE money function changes: village_wedding_list. village_balance_walk (0118), village_weddings_fast/legacy
-- (0107), village_weddings (0096) and encounter_guard (0141) read it and stay untouched, so the chest walk and the
-- guard switch together. Until the real dates are set both realms stay on the safe placeholder 2100-01-04: this
-- migration changes no result before then (same loop, same rows; tested in hochzeitspaket.pg.test.ts).

-- 1) The switch instant per realm. Mirrors src/game/weddings.ts weddingSwitchSince (WEDDING_SWITCH_LAB_SINCE /
--    WEDDING_SWITCH_SINCE); keep both equal (hochzeitspaket.pg.test.ts reads this file and compares).
CREATE OR REPLACE FUNCTION public.wedding_switch_since(_realm text)
 RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT CASE WHEN _realm = 'lab' THEN timestamptz '2100-01-04 00:00:00+00' ELSE timestamptz '2100-01-04 00:00:00+00' END $$;
GRANT EXECUTE ON FUNCTION public.wedding_switch_since(text) TO authenticated, service_role;

-- 2) The wedding calendar as the money reads it. Owned villages: the 0107 loop, verbatim, for weddings before the
--    switch; from the switch only stored receipts (occurred_at <= _at). Unowned villages never had a care gate in the
--    rhythm (wedStage returns the raw era) and get no receipts, so they keep the loop for all time as before.
CREATE OR REPLACE FUNCTION public.village_wedding_list(_seed uuid, _at timestamptz, _food text[])
 RETURNS TABLE(t timestamptz, dowry integer)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; uid uuid; h double precision; raw integer; st integer; f integer; hl integer;
  r double precision; p integer; w integer; days double precision; cut double precision; gap integer;
  ft timestamptz[]; ht timestamptz[]; x timestamptz; cur timestamptz; rlm text; sw timestamptz;
BEGIN
  SELECT date_trunc('milliseconds', s.created_at), s.user_id, s.realm INTO created, uid, rlm FROM public.seeds s WHERE s.id = _seed;
  IF created IS NULL THEN RETURN; END IF;
  sw := CASE WHEN uid IS NULL THEN timestamptz 'infinity' ELSE public.wedding_switch_since(rlm) END;
  SELECT coalesce(array_agg(mt) FILTER (WHERE item = ANY(_food)), '{}'),
         coalesce(array_agg(mt) FILTER (WHERE item IN ('herbs','healer')), '{}')
    INTO ft, ht FROM (SELECT item, min(created_at) mt FROM public.purchases WHERE seed_id=_seed GROUP BY item) q;
  cur := created + interval '2 days';
  WHILE cur <= _at AND cur < sw LOOP
    h := greatest(0, extract(epoch FROM (cur - created)) / 3600);
    raw := CASE WHEN h>=8760 THEN 5 WHEN h>=4380 THEN 4 WHEN h>=2160 THEN 3 WHEN h>=168 THEN 2 WHEN h>=24 THEN 1 ELSE 0 END;
    f := 0; hl := 0;
    FOREACH x IN ARRAY ft LOOP IF x <= cur THEN f := f + 1; END IF; END LOOP;
    FOREACH x IN ARRAY ht LOOP IF x <= cur THEN hl := hl + 1; END IF; END LOOP;
    IF uid IS NULL THEN st := raw; ELSE
      st := 2;
      IF f >= 1 THEN st := 3; IF f >= 2 AND hl >= 1 THEN st := 4; IF f >= 3 AND hl >= 2 THEN st := 5; END IF; END IF; END IF;
      st := least(raw, st);
    END IF;
    r := 1.6 + 0.18*sqrt(h) + 3*ln(1 + h/60);
    p := floor(3 + 0.9*power(r, 1.6))::integer;
    IF st < 5 THEN p := least(p, CASE WHEN st = 4 THEN 260 WHEN st = 3 THEN 150 ELSE 84 END); END IF;
    w := public.village_civic_wealth(_seed, cur);
    t := cur; dowry := floor(20 + w*0.6)::integer; RETURN NEXT;
    days := least(20, greatest(2, 9*sqrt(40.0 / greatest(10, p))));
    cut := (1 - 0.25*least(1, greatest(0, (w - 40) / 40.0))) * (1 - 0.04*f);
    gap := greatest(1, floor(24*days*cut + 0.5)::integer);
    cur := cur + make_interval(hours => gap);
  END LOOP;
  IF _at >= sw THEN
    RETURN QUERY SELECT r0.occurred_at, r0.dowry FROM public.wedding_receipts r0
      WHERE r0.seed_id = _seed AND r0.occurred_at >= sw AND r0.occurred_at <= _at ORDER BY r0.wedding_index;
  END IF;
END $function$;

-- 3) Shadow check, now bounded to what SQL still computes: weddings before the switch. The lab map keeps no receipts
--    before its switch (its dowries come from the loop above), so it has nothing to compare there.
--      receipt_at IS NULL -> receipt not written yet (settle and re-run)
--      sql_at IS NULL     -> a receipt SQL does not know: a real divergence, investigate
CREATE OR REPLACE FUNCTION public.wedding_receipt_diff(_seed uuid)
 RETURNS TABLE(idx integer, receipt_at timestamptz, sql_at timestamptz, receipt_dowry integer, sql_dowry integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH n AS (
    SELECT least(now(), public.wedding_switch_since(s.realm)) AS at, public.wedding_switch_since(s.realm) AS sw,
           s.realm = 'lab' AS lab
      FROM public.seeds s WHERE s.id = _seed
  ),
  sqll AS (
    SELECT (row_number() OVER (ORDER BY l.t) - 1)::integer AS idx, l.t, l.dowry
      FROM n, public.village_wedding_list(_seed, n.at, ARRAY['fisher','hunter','granary','dairy']) l
     WHERE NOT n.lab AND l.t < n.sw
  ),
  rec AS (
    SELECT r.wedding_index AS idx, r.occurred_at, r.dowry
      FROM n, public.wedding_receipts r
     WHERE r.seed_id = _seed AND NOT n.lab AND r.occurred_at <= n.at AND r.occurred_at < n.sw
  )
  SELECT coalesce(s.idx, r.idx), r.occurred_at, s.t, r.dowry, s.dowry
    FROM sqll s FULL JOIN rec r ON r.idx = s.idx
   WHERE r.idx IS NULL OR s.idx IS NULL OR r.occurred_at <> s.t OR r.dowry <> s.dowry
   ORDER BY 1
$$;
REVOKE ALL ON FUNCTION public.wedding_receipt_diff(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wedding_receipt_diff(uuid) TO service_role;

-- 4) Inventory for the release and after every sweep (service role only, read-only): one row per owned village.
--      fehlt     = legacy weddings (before the switch, up to now) without a receipt
--      weicht_ab = legacy receipts whose instant or dowry differ, or receipts SQL does not know
--      luecken   = holes in the receipt indices from the switch on (index must run on without a gap after the
--                  legacy weddings; the newest unsettled weddings after the switch are visible only to the TS sweep)
--      doppelt   = two receipts on one index or one instant (impossible by PK/UNIQUE; listed as proof)
CREATE OR REPLACE FUNCTION public.wedding_receipt_inventory()
 RETURNS TABLE(seed_id uuid, realm text, belege integer, fehlt integer, weicht_ab integer, luecken integer, doppelt integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT s.id, s.realm,
    (SELECT count(*)::integer FROM public.wedding_receipts r WHERE r.seed_id = s.id),
    (SELECT count(*)::integer FROM public.wedding_receipt_diff(s.id) d WHERE d.receipt_at IS NULL),
    (SELECT count(*)::integer FROM public.wedding_receipt_diff(s.id) d WHERE d.receipt_at IS NOT NULL),
    (SELECT count(*)::integer FROM (
        SELECT r.wedding_index, r.occurred_at, lag(r.wedding_index) OVER (ORDER BY r.wedding_index) AS prev
          FROM public.wedding_receipts r WHERE r.seed_id = s.id) g
      WHERE g.occurred_at >= public.wedding_switch_since(s.realm) AND g.prev IS NOT NULL AND g.wedding_index <> g.prev + 1),
    (SELECT (count(*) - count(DISTINCT r.wedding_index))::integer + (count(*) - count(DISTINCT r.occurred_at))::integer
       FROM public.wedding_receipts r WHERE r.seed_id = s.id)
  FROM public.seeds s WHERE s.user_id IS NOT NULL ORDER BY s.id
$$;
REVOKE ALL ON FUNCTION public.wedding_receipt_inventory() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wedding_receipt_inventory() TO service_role;

-- 5) Receipts are economic records: never rewritten, never dated in the future. Deleting stays possible only through
--    the existing seed purge (ON DELETE CASCADE), so a village's own history goes with it as before.
CREATE OR REPLACE FUNCTION public.wedding_receipt_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'wedding receipts are immutable'; END IF;
  IF NEW.occurred_at > now() + interval '5 minutes' THEN RAISE EXCEPTION 'wedding receipt in the future'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.wedding_receipt_guard() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS wedding_receipts_guard ON public.wedding_receipts;
CREATE TRIGGER wedding_receipts_guard BEFORE INSERT OR UPDATE ON public.wedding_receipts
  FOR EACH ROW EXECUTE FUNCTION public.wedding_receipt_guard();

COMMENT ON TABLE public.wedding_receipts IS
  'Server-derived wedding records frozen from src/game/weddings.ts weddingCalendar (index = WedDate.k). Version 1 = legacy rule (before wedding_switch_since, mirrored by village_wedding_list), 2 = unified rule (from it; the only money record). Immutable.';
