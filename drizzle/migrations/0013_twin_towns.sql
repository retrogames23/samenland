CREATE TABLE public.twin_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pact text NOT NULL CHECK (pact IN ('trade','shield','culture')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.twin_votes TO anon;
GRANT SELECT, INSERT ON public.twin_votes TO authenticated;
GRANT ALL ON public.twin_votes TO service_role;
ALTER TABLE public.twin_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see twin votes" ON public.twin_votes FOR SELECT USING (true);
CREATE POLICY "Owners vote for their village" ON public.twin_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));

CREATE TABLE public.twin_works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  work text NOT NULL CHECK (work IN ('bridge','hall','tower')),
  cost integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seed_id, partner_id)
);
GRANT SELECT ON public.twin_works TO anon;
GRANT SELECT, INSERT ON public.twin_works TO authenticated;
GRANT ALL ON public.twin_works TO service_role;
ALTER TABLE public.twin_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see twin works" ON public.twin_works FOR SELECT USING (true);
CREATE POLICY "Owners pay their half" ON public.twin_works FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.twin_vote_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.seed_id = NEW.partner_id THEN RAISE EXCEPTION 'same village'; END IF;
  NEW.created_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER twin_vote_guard BEFORE INSERT ON public.twin_votes FOR EACH ROW EXECUTE FUNCTION public.twin_vote_guard();

CREATE OR REPLACE FUNCTION public.twin_work_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE price integer; other text;
BEGIN
  IF NEW.seed_id = NEW.partner_id THEN RAISE EXCEPTION 'same village'; END IF;
  price := CASE NEW.work WHEN 'bridge' THEN 200 WHEN 'hall' THEN 300 WHEN 'tower' THEN 250 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown work'; END IF;
  SELECT w.work INTO other FROM public.twin_works w WHERE w.seed_id = NEW.partner_id AND w.partner_id = NEW.seed_id;
  IF other IS NOT NULL AND other <> NEW.work THEN RAISE EXCEPTION 'partner chose another work'; END IF;
  NEW.cost := price; NEW.created_at := now();
  IF public.village_balance(NEW.seed_id) < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER twin_work_guard BEFORE INSERT ON public.twin_works FOR EACH ROW EXECUTE FUNCTION public.twin_work_guard();

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE created timestamptz; cpath text; cat timestamptz; spent integer; ev integer; tw integer;
BEGIN
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = _seed;
  SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  RETURN 150 + public.village_tax(created, now()) + (CASE WHEN cpath = 'trade' THEN public.charter_tax(created, cat, now()) ELSE 0 END) - spent - ev - tw;
END $$;