CREATE OR REPLACE FUNCTION public.village_capped_tax_fast(_seed uuid, _at timestamp with time zone)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; days integer; d integer; p integer; a integer; at_d timestamptz; m integer; rate double precision;
 herbs timestamptz; healer timestamptz; cpath text; cat timestamptz; owner uuid; total integer:=0; run integer:=160; cap integer;
 cut timestamptz; first_day integer; c2 timestamptz; c3 timestamptz; c4 timestamptz; deltas integer[]; rec integer[]; r record;
 h bigint; rk integer := 0; rd integer := 4; g timestamptz; rt timestamptz; ri integer;
BEGIN
 SELECT s.created_at, s.user_id INTO created, owner FROM public.seeds s WHERE s.id=_seed;
 IF created IS NULL THEN RETURN 0; END IF;
 SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id=_seed LIMIT 1;
 SELECT min(created_at) FILTER (WHERE item='herbs'), min(created_at) FILTER (WHERE item IN ('healer','infirmary')),
        min(created_at) FILTER (WHERE item='chest2'), min(created_at) FILTER (WHERE item='chest3'), min(created_at) FILTER (WHERE item='chest4'),
        min(created_at) FILTER (WHERE item='guard')
   INTO herbs, healer, c2, c3, c4, g FROM public.purchases WHERE seed_id=_seed;
 days:=greatest(0,floor(extract(epoch FROM (_at-created))/86400)::integer);
 cut:=public.tax_receipt_start();
 first_day:=CASE WHEN cut IS NULL THEN 2147483647 ELSE greatest(1,ceil(extract(epoch FROM (cut-created))/86400)::integer) END;
 deltas:=array_fill(0, ARRAY[days+1]);
 rec:=array_fill(0, ARRAY[days+1]);
 FOR r IN SELECT t.day, t.income FROM public.tax_receipts t WHERE t.seed_id=_seed AND t.day>=first_day AND t.day<=days LOOP
   rec[r.day]:=r.income;
 END LOOP;
 FOR r IN SELECT greatest(0,floor(extract(epoch FROM (e.t-created))/86400))::integer k, sum(e.v)::integer v FROM (
   SELECT created_at t, -cost v FROM public.purchases WHERE seed_id=_seed
   UNION ALL SELECT created_at, -cost FROM public.encounters WHERE seed_id=_seed
   UNION ALL SELECT created_at, -cost FROM public.twin_works WHERE seed_id=_seed
   UNION ALL SELECT created_at, CASE WHEN to_seed=_seed THEN amount ELSE -amount END FROM public.gifts WHERE to_seed=_seed OR from_seed=_seed
   UNION ALL SELECT created_at, reward FROM public.quest_claims WHERE seed_id=_seed
   UNION ALL SELECT created_at, reward FROM public.market_sales WHERE seed_id=_seed
   UNION ALL SELECT created_at, reward FROM public.referrals WHERE referrer_seed=_seed OR referee_seed=_seed
   UNION ALL SELECT created_at, reward FROM public.village_visits WHERE visitor_seed=_seed
   UNION ALL SELECT created_at, reward FROM public.wonder_finds WHERE seed_id=_seed
   UNION ALL SELECT done_at, reward FROM public.princely_tasks WHERE seed_id=_seed AND done_at IS NOT NULL
 ) e GROUP BY 1 LOOP
   IF r.k < days THEN deltas[r.k+1]:=deltas[r.k+1]+r.v; END IF;
 END LOOP;
 h := ('x' || substr(replace(_seed::text, '-', ''), 1, 8))::bit(32)::bigint;
 LOOP
   rd := rd + 6 + ((h + rk * 7919) % 19)::integer;
   rt := created + make_interval(days => rd, hours => ((h + rk * 31) % 24)::integer);
   EXIT WHEN rt > _at OR rk > 2000;
   IF g IS NULL OR g > rt THEN
     ri := greatest(0, floor(extract(epoch FROM (rt-created))/86400)::integer);
     IF ri < days THEN deltas[ri+1] := deltas[ri+1] - (12 + ((h + rk * 104729) % 34)::integer); END IF;
   END IF;
   rk := rk + 1;
 END LOOP;
 FOR d IN 1..days LOOP
  run:=run+deltas[d];
  at_d:=created+make_interval(days=>d);
  IF d>=first_day THEN
   a:=rec[d];
  ELSE
   p:=public.village_tax_pop(_seed, d*24, at_d);
   a:=public.estate_assessment(p,public.village_civic_wealth(_seed,at_d));
   m:=extract(month FROM (at_d AT TIME ZONE 'UTC'))::integer;
   rate:=0.06+(CASE WHEN m IN (12,1,2) THEN 0.03 ELSE 0 END)
     -(CASE WHEN herbs IS NOT NULL AND herbs<=at_d THEN 0.015 ELSE 0 END)
     -(CASE WHEN healer IS NOT NULL AND healer<=at_d THEN 0.035 ELSE 0 END);
   rate:=greatest(0.01,rate);
   a:=a-floor(a*rate*0.4)::integer;
   IF cpath='trade' AND at_d>=cat THEN a:=a+floor(0.15*p)::integer; END IF;
  END IF;
  IF owner IS NOT NULL AND at_d >= timestamptz '2026-10-31 00:00:00+00' THEN
   cap:=CASE WHEN c4 IS NOT NULL AND c4<=at_d THEN 25000 WHEN c3 IS NOT NULL AND c3<=at_d THEN 10000 WHEN c2 IS NOT NULL AND c2<=at_d THEN 4000 ELSE 1200 END;
   a:=least(a, greatest(0, cap-run));
  END IF;
  run:=run+a; total:=total+a;
 END LOOP;
 RETURN total;
END $function$;

CREATE OR REPLACE FUNCTION public.village_weddings_fast(_seed uuid, _at timestamp with time zone)
 RETURNS TABLE(n integer, dowry integer, last_at timestamp with time zone)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; uid uuid; t timestamptz; h double precision; raw integer; st integer; f integer; hl integer;
  r double precision; p integer; w integer; days double precision; cut double precision; gap integer;
  ft timestamptz[]; ht timestamptz[]; x timestamptz;
BEGIN
  n := 0; dowry := 0; last_at := NULL;
  SELECT date_trunc('milliseconds', s.created_at), s.user_id INTO created, uid FROM public.seeds s WHERE s.id = _seed;
  IF created IS NULL THEN RETURN NEXT; RETURN; END IF;
  SELECT coalesce(array_agg(mt) FILTER (WHERE item IN ('fisher','hunter','granary','dairy','markethall','guildhall')), '{}'),
         coalesce(array_agg(mt) FILTER (WHERE item IN ('herbs','healer')), '{}')
    INTO ft, ht FROM (SELECT item, min(created_at) mt FROM public.purchases WHERE seed_id=_seed GROUP BY item) q;
  t := created + interval '2 days';
  WHILE t <= _at LOOP
    h := greatest(0, extract(epoch FROM (t - created)) / 3600);
    raw := CASE WHEN h>=8760 THEN 5 WHEN h>=4380 THEN 4 WHEN h>=2160 THEN 3 WHEN h>=168 THEN 2 WHEN h>=24 THEN 1 ELSE 0 END;
    f := 0; hl := 0;
    FOREACH x IN ARRAY ft LOOP IF x <= t THEN f := f + 1; END IF; END LOOP;
    FOREACH x IN ARRAY ht LOOP IF x <= t THEN hl := hl + 1; END IF; END LOOP;
    IF uid IS NULL THEN st := raw; ELSE
      st := 2;
      IF f >= 1 THEN st := 3; IF f >= 2 AND hl >= 1 THEN st := 4; IF f >= 3 AND hl >= 2 THEN st := 5; END IF; END IF; END IF;
      st := least(raw, st);
    END IF;
    r := 1.6 + 0.18*sqrt(h) + 3*ln(1 + h/60);
    p := floor(3 + 0.9*power(r, 1.6))::integer;
    IF st < 5 THEN p := least(p, CASE WHEN st = 4 THEN 260 WHEN st = 3 THEN 150 ELSE 84 END); END IF;
    w := public.village_civic_wealth(_seed, t);
    n := n + 1; dowry := dowry + floor(20 + w*0.6)::integer; last_at := t;
    days := least(20, greatest(2, 9*sqrt(40.0 / greatest(10, p))));
    cut := (1 - 0.25*least(1, greatest(0, (w - 40) / 40.0))) * (1 - 0.04*f);
    gap := greatest(1, floor(24*days*cut + 0.5)::integer);
    t := t + make_interval(hours => gap);
  END LOOP;
  RETURN NEXT;
END $function$;

REVOKE ALL ON FUNCTION public.village_capped_tax_fast(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.village_weddings_fast(uuid, timestamptz) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE s record; a integer; b integer; wa record; wb record; t timestamptz := now();
BEGIN
  FOR s IN SELECT id FROM public.seeds LOOP
    a := public.village_capped_tax(s.id, t); b := public.village_capped_tax_fast(s.id, t);
    IF a IS DISTINCT FROM b THEN RAISE EXCEPTION 'tax mismatch % % %', s.id, a, b; END IF;
    SELECT * INTO wa FROM public.village_weddings(s.id, t); SELECT * INTO wb FROM public.village_weddings_fast(s.id, t);
    IF wa.n IS DISTINCT FROM wb.n OR wa.dowry IS DISTINCT FROM wb.dowry OR wa.last_at IS DISTINCT FROM wb.last_at THEN
      RAISE EXCEPTION 'wedding mismatch %', s.id; END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.village_capped_tax(_seed uuid, _at timestamp with time zone)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.village_capped_tax_fast(_seed, _at) $$;

CREATE OR REPLACE FUNCTION public.village_weddings(_seed uuid, _at timestamp with time zone)
 RETURNS TABLE(n integer, dowry integer, last_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT * FROM public.village_weddings_fast(_seed, _at) $$;

CREATE INDEX IF NOT EXISTS tax_receipts_seed_day_idx ON public.tax_receipts (seed_id, day);
CREATE INDEX IF NOT EXISTS purchases_seed_item_idx ON public.purchases (seed_id, item, created_at);