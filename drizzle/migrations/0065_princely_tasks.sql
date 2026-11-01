CREATE TABLE public.princely_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  step integer NOT NULL,
  task text NOT NULL,
  reward integer NOT NULL DEFAULT 0,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  done_at timestamptz,
  UNIQUE (seed_id, step)
);
GRANT SELECT ON public.princely_tasks TO anon, authenticated;
GRANT ALL ON public.princely_tasks TO service_role;
ALTER TABLE public.princely_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see princely tasks" ON public.princely_tasks FOR SELECT TO anon, authenticated USING (true);

-- fixed sequence of 12 decrees (mirrors src/game/princely.ts PRINCELY_TASKS)
CREATE OR REPLACE FUNCTION public.princely_task_def(_step integer, OUT task text, OUT reward integer)
 LANGUAGE sql IMMUTABLE AS $$
  SELECT (ARRAY['wonder','letter','visit','build','gift','road'])[((_step-1) % 6)+1],
         (ARRAY[40,40,50,60,60,80,80,90,100,110,120,150])[_step]
$$;

CREATE OR REPLACE FUNCTION public.princely_task_met(_seed uuid, _task text, _since timestamptz)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN CASE _task
    WHEN 'wonder' THEN EXISTS (SELECT 1 FROM wonder_finds WHERE seed_id=_seed AND created_at>_since)
    WHEN 'letter' THEN EXISTS (SELECT 1 FROM letters WHERE from_seed=_seed AND created_at>_since)
    WHEN 'visit' THEN EXISTS (SELECT 1 FROM village_visits WHERE visitor_seed=_seed AND created_at>_since)
    WHEN 'build' THEN EXISTS (SELECT 1 FROM purchases WHERE seed_id=_seed AND created_at>_since)
    WHEN 'gift' THEN EXISTS (SELECT 1 FROM gifts WHERE from_seed=_seed AND created_at>_since)
    WHEN 'road' THEN EXISTS (SELECT 1 FROM first_roads WHERE seed_id=_seed AND created_at>_since)
    ELSE false END;
END $$;

-- one call at the audience: hand in the open decree if fulfilled, else accept the next one (20 h after the last)
CREATE OR REPLACE FUNCTION public.princely_audience(_seed uuid)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me public.seeds; open public.princely_tasks; last timestamptz; n integer; d record;
BEGIN
  SELECT * INTO me FROM seeds WHERE id=_seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('princely' || _seed::text));
  SELECT * INTO open FROM princely_tasks WHERE seed_id=_seed AND done_at IS NULL LIMIT 1;
  IF open.id IS NOT NULL THEN
    IF public.princely_task_met(_seed, open.task, open.accepted_at) THEN
      UPDATE princely_tasks SET done_at=now() WHERE id=open.id; RETURN 'done';
    END IF;
    RETURN 'open';
  END IF;
  SELECT count(*), max(done_at) INTO n, last FROM princely_tasks WHERE seed_id=_seed;
  IF n >= 12 THEN RETURN 'all'; END IF;
  IF last IS NOT NULL AND last > now() - interval '20 hours' THEN RETURN 'rest'; END IF;
  SELECT * INTO d FROM public.princely_task_def(n+1);
  INSERT INTO princely_tasks(seed_id, step, task, reward) VALUES (_seed, n+1, d.task, d.reward);
  RETURN 'new';
END $$;
REVOKE EXECUTE ON FUNCTION public.princely_audience(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.princely_audience(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.princely_task_met(uuid, text, timestamptz) FROM anon, public;

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; owner uuid; spent integer; ev integer; tw integer; gi integer; qr integer; mk integer; rf integer; vv integer; wf integer; pt integer;
 dw integer; dold integer:=0; dnew integer; base integer; cap integer; since timestamptz := timestamptz '2026-10-31 00:00:00+00';
BEGIN
  SELECT s.created_at, s.user_id INTO created, owner FROM public.seeds s WHERE s.id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE to_seed = _seed OR from_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO qr FROM public.quest_claims WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO mk FROM public.market_sales WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO rf FROM public.referrals WHERE referrer_seed = _seed OR referee_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO vv FROM public.village_visits WHERE visitor_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO wf FROM public.wonder_finds WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO pt FROM public.princely_tasks WHERE seed_id = _seed AND done_at IS NOT NULL;
  SELECT coalesce(w.dowry,0) INTO dw FROM public.village_weddings(_seed, now()) w;
  IF created < since THEN SELECT coalesce(w.dowry,0) INTO dold FROM public.village_weddings(_seed, least(now(), since)) w; END IF;
  dw := coalesce(dw,0); dold := coalesce(dold,0); dnew := dw - dold;
  base := 160 + public.village_capped_tax(_seed, now()) - spent - ev - tw + gi + qr + mk + rf + vv + wf + pt;
  IF owner IS NOT NULL THEN
    SELECT CASE WHEN bool_or(item='chest4') THEN 15000 WHEN bool_or(item='chest3') THEN 6000 WHEN bool_or(item='chest2') THEN 2500 ELSE 800 END
      INTO cap FROM public.purchases WHERE seed_id = _seed AND item LIKE 'chest%';
    cap := coalesce(cap, 800);
    dnew := least(dnew, greatest(0, cap - base - dold));
  END IF;
  -- robbers can never push the chest below zero
  RETURN greatest(0, base + dold + dnew - public.village_raids(_seed, created, now()));
END $function$;

CREATE OR REPLACE FUNCTION public.village_capped_tax(_seed uuid, _at timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; days integer; d integer; p integer; a integer; at_d timestamptz; m integer; rate double precision;
 herbs timestamptz; healer timestamptz; cpath text; cat timestamptz; owner uuid; total integer:=0; run integer:=160; cap integer;
 cut timestamptz; first_day integer; c2 timestamptz; c3 timestamptz; c4 timestamptz; deltas integer[]; r record;
 h bigint; rk integer := 0; rd integer := 4; g timestamptz; rt timestamptz; ri integer;
BEGIN
 SELECT s.created_at, s.user_id INTO created, owner FROM public.seeds s WHERE s.id=_seed;
 IF created IS NULL THEN RETURN 0; END IF;
 SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id=_seed LIMIT 1;
 SELECT min(created_at) INTO herbs FROM public.purchases WHERE seed_id=_seed AND item='herbs';
 SELECT min(created_at) INTO healer FROM public.purchases WHERE seed_id=_seed AND item IN ('healer','infirmary');
 SELECT min(created_at) INTO c2 FROM public.purchases WHERE seed_id=_seed AND item='chest2';
 SELECT min(created_at) INTO c3 FROM public.purchases WHERE seed_id=_seed AND item='chest3';
 SELECT min(created_at) INTO c4 FROM public.purchases WHERE seed_id=_seed AND item='chest4';
 days:=greatest(0,floor(extract(epoch FROM (_at-created))/86400)::integer);
 cut:=public.tax_receipt_start();
 first_day:=CASE WHEN cut IS NULL THEN 2147483647 ELSE greatest(1,ceil(extract(epoch FROM (cut-created))/86400)::integer) END;
 deltas:=array_fill(0, ARRAY[days+1]);
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
 -- raids empty the chest too, so later taxes may refill it (mirrors village_raids)
 h := ('x' || substr(replace(_seed::text, '-', ''), 1, 8))::bit(32)::bigint;
 SELECT min(created_at) INTO g FROM public.purchases WHERE seed_id = _seed AND item = 'guard';
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
  p:=public.village_tax_pop(_seed, d*24, at_d);
  a:=public.estate_assessment(p,public.village_civic_wealth(_seed,at_d));
  m:=extract(month FROM (at_d AT TIME ZONE 'UTC'))::integer;
  rate:=0.06+(CASE WHEN m IN (12,1,2) THEN 0.03 ELSE 0 END)
    -(CASE WHEN herbs IS NOT NULL AND herbs<=at_d THEN 0.015 ELSE 0 END)
    -(CASE WHEN healer IS NOT NULL AND healer<=at_d THEN 0.035 ELSE 0 END);
  rate:=greatest(0.01,rate);
  a:=a-floor(a*rate*0.4)::integer;
  IF cpath='trade' AND at_d>=cat THEN a:=a+floor(0.15*p)::integer; END IF;
  IF d>=first_day THEN a:=coalesce((SELECT t.income FROM public.tax_receipts t WHERE t.seed_id=_seed AND t.day=d),0); END IF;
  IF owner IS NOT NULL AND at_d >= timestamptz '2026-10-31 00:00:00+00' THEN
   cap:=CASE WHEN c4 IS NOT NULL AND c4<=at_d THEN 15000 WHEN c3 IS NOT NULL AND c3<=at_d THEN 6000 WHEN c2 IS NOT NULL AND c2<=at_d THEN 2500 ELSE 800 END;
   a:=least(a, greatest(0, cap-run));
  END IF;
  run:=run+a; total:=total+a;
 END LOOP;
 RETURN total;
END $function$;