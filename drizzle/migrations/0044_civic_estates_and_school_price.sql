CREATE OR REPLACE FUNCTION public.village_civic_wealth(_seed uuid, _at timestamptz)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE h double precision; stage integer; path text; wealth integer; b record; titles integer[];
BEGIN
 SELECT greatest(0, extract(epoch FROM (_at-created_at))/3600) INTO h FROM public.seeds WHERE id=_seed;
 IF h IS NULL THEN RETURN 25; END IF;
 stage := CASE WHEN h>=8760 THEN 5 WHEN h>=4380 THEN 4 WHEN h>=2160 THEN 3 WHEN h>=168 THEN 2 WHEN h>=24 THEN 1 ELSE 0 END;
 SELECT c.path INTO path FROM public.charters c WHERE c.seed_id=_seed AND c.created_at<=_at;
 wealth := 25 + stage*5 + CASE WHEN path='craft' THEN 10 ELSE 0 END;
 titles := CASE path WHEN 'trade' THEN ARRAY[5,10,10] WHEN 'craft' THEN ARRAY[5,5,15] ELSE ARRAY[0,0,5] END;
 FOR b IN SELECT item, min(created_at) AS at FROM public.purchases WHERE seed_id=_seed AND created_at<=_at GROUP BY item LOOP
  wealth := wealth + CASE b.item
   WHEN 'school' THEN 20 WHEN 'guildhall' THEN 15 WHEN 'markethall' THEN 15 WHEN 'library' THEN 5 WHEN 'woodcamp' THEN 5 WHEN 'guard' THEN 5
   WHEN 'rank2' THEN CASE path WHEN 'trade' THEN 10 WHEN 'craft' THEN 5 ELSE 0 END
   WHEN 'rank3' THEN CASE WHEN path IN ('trade','farm') THEN 10 WHEN path='craft' THEN 15 ELSE 0 END
   WHEN 'title1' THEN CASE WHEN path IS NULL THEN 0 ELSE titles[1] END
   WHEN 'title2' THEN CASE WHEN path IS NULL THEN 0 ELSE titles[2] END
   WHEN 'title3' THEN CASE WHEN path IS NULL THEN 0 ELSE titles[3] END
   ELSE 0 END;
  IF b.at + interval '6 hours' <= _at THEN
   wealth := wealth + CASE b.item WHEN 'belfry4' THEN 15 WHEN 'theater3' THEN 15 WHEN 'cathedral5' THEN 20 WHEN 'university4' THEN 10 WHEN 'exchange4' THEN 20 WHEN 'opera4' THEN 25 ELSE 0 END;
  END IF;
 END LOOP;
 RETURN greatest(0,least(100,wealth));
END $$;
CREATE OR REPLACE FUNCTION public.estate_assessment(_pop integer, _wealth integer)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 WITH w AS (SELECT greatest(0,least(100,_wealth))::numeric AS n), shares AS (
 SELECT CASE WHEN n<=30 THEN n/300 WHEN n<=55 THEN 0.1+(n-30)*0.014 WHEN n<=80 THEN 0.45+(n-55)*0.004 ELSE 0.55 END AS skilled,
 CASE WHEN n<=30 THEN 0 WHEN n<=55 THEN (n-30)*0.003 WHEN n<=80 THEN 0.075+(n-55)*0.007 ELSE 0.25+(n-80)*0.0025 END AS wealthy FROM w)
 SELECT _pop + floor(_pop*skilled+0.000000001)::integer + 2*floor(_pop*wealthy+0.000000001)::integer FROM shares
$$;
CREATE OR REPLACE FUNCTION public.village_estate_tax(_seed uuid, _at timestamptz)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE created timestamptz; days integer; d integer; h double precision; r double precision; p integer; total integer:=0;
BEGIN
 SELECT created_at INTO created FROM public.seeds WHERE id=_seed;
 IF created IS NULL THEN RETURN 0; END IF;
 days:=greatest(0,floor(extract(epoch FROM (_at-created))/86400)::integer);
 FOR d IN 1..days LOOP
  h:=d*24; r:=1.6+0.18*sqrt(h)+3*ln(1+h/60);
  p:=floor(3+0.9*power(r,1.6))::integer;
  total:=total+public.estate_assessment(p,public.village_civic_wealth(_seed,created+make_interval(days=>d)));
 END LOOP;
 RETURN total;
END $$;
-- Retain every existing balance adjustment and guard; replace only the requested formulas.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.village_balance(uuid)'::regprocedure) INTO definition;
 IF position('public.village_tax(created, now())' in definition)=0 THEN RAISE EXCEPTION 'unexpected balance definition'; END IF;
 EXECUTE replace(definition,'public.village_tax(created, now())','public.village_estate_tax(_seed, now())');
 SELECT pg_get_functiondef('public.purchase_guard()'::regprocedure) INTO definition;
 IF position('WHEN ''school'' THEN 3000' in definition)=0 THEN RAISE EXCEPTION 'unexpected school price'; END IF;
 EXECUTE replace(definition,'WHEN ''school'' THEN 3000','WHEN ''school'' THEN 1200');
END $$;
REVOKE ALL ON FUNCTION public.village_civic_wealth(uuid,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.village_estate_tax(uuid,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.village_civic_wealth(uuid,timestamptz), public.village_estate_tax(uuid,timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.estate_assessment(integer,integer) TO authenticated, service_role;