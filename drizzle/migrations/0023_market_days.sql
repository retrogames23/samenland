CREATE TABLE public.market_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seed_id, day)
);
GRANT SELECT ON public.market_sales TO anon;
GRANT SELECT, INSERT ON public.market_sales TO authenticated;
GRANT ALL ON public.market_sales TO service_role;
ALTER TABLE public.market_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see market sales" ON public.market_sales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners hold market" ON public.market_sales FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.market_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM seeds WHERE id = NEW.seed_id AND created_at < now() - interval '1 day') THEN
    RAISE EXCEPTION 'village too young';
  END IF;
  NEW.day := (now() AT TIME ZONE 'utc')::date;
  NEW.reward := 15;
  NEW.created_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER market_guard BEFORE INSERT ON public.market_sales FOR EACH ROW EXECUTE FUNCTION public.market_guard();

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; cpath text; cat timestamptz; spent integer; ev integer; tw integer; gi integer; qr integer; mk integer;
BEGIN
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = _seed;
  SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE to_seed = _seed OR from_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO qr FROM public.quest_claims WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO mk FROM public.market_sales WHERE seed_id = _seed;
  RETURN 150 + public.village_tax(created, now()) + public.village_dowry(created, now()) + (CASE WHEN cpath = 'trade' THEN public.charter_tax(created, cat, now()) ELSE 0 END) - spent - ev - tw + gi + qr + mk - public.village_raids(_seed, created, now());
END $function$;