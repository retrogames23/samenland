CREATE TABLE public.village_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_seed uuid NOT NULL REFERENCES public.seeds(id),
  visited_seed uuid NOT NULL REFERENCES public.seeds(id),
  reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (visitor_seed, visited_seed)
);
GRANT SELECT ON public.village_visits TO anon, authenticated;
GRANT ALL ON public.village_visits TO service_role;
ALTER TABLE public.village_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see visits" ON public.village_visits FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.visit_reward(_age_hours double precision)
 RETURNS integer LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$ SELECT CASE WHEN _age_hours >= 8760 THEN 150 WHEN _age_hours >= 4380 THEN 100 WHEN _age_hours >= 2160 THEN 75 WHEN _age_hours >= 168 THEN 50 WHEN _age_hours >= 24 THEN 40 ELSE 30 END $$;

CREATE OR REPLACE FUNCTION public.claim_visit(_seed uuid, _visited uuid)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE me public.seeds; them public.seeds; r integer;
BEGIN
  SELECT * INTO me FROM public.seeds WHERE id = _seed;
  SELECT * INTO them FROM public.seeds WHERE id = _visited;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  IF them.id IS NULL OR them.id = me.id OR them.realm <> me.realm THEN RAISE EXCEPTION 'bad village'; END IF;
  IF sqrt(power(me.x - them.x, 2) + power(me.y - them.y, 2)) > 200 THEN RAISE EXCEPTION 'too far'; END IF;
  r := public.visit_reward(extract(epoch FROM (now() - them.created_at)) / 3600);
  INSERT INTO public.village_visits(visitor_seed, visited_seed, reward) VALUES (_seed, _visited, r) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  RETURN r;
END $$;
GRANT EXECUTE ON FUNCTION public.claim_visit(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; cpath text; cat timestamptz; spent integer; ev integer; tw integer; gi integer; qr integer; mk integer; rf integer; vv integer;
BEGIN
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = _seed;
  SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE to_seed = _seed OR from_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO qr FROM public.quest_claims WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO mk FROM public.market_sales WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO rf FROM public.referrals WHERE referrer_seed = _seed OR referee_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO vv FROM public.village_visits WHERE visitor_seed = _seed;
  RETURN 150 + public.village_tax(created, now()) + public.village_dowry(created, now()) + (CASE WHEN cpath = 'trade' THEN public.charter_tax(created, cat, now()) ELSE 0 END) - spent - ev - tw + gi + qr + mk + rf + vv - public.village_raids(_seed, created, now());
END $function$;