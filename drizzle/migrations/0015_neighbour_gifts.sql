CREATE TABLE public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_seed uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  to_seed uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('gift','aid','thanks')),
  amount integer NOT NULL DEFAULT 0,
  note smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gifts TO anon;
GRANT SELECT, INSERT ON public.gifts TO authenticated;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gifts readable" ON public.gifts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owner sends gifts" ON public.gifts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = from_seed AND s.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.gift_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ra text; rb text;
BEGIN
  NEW.created_at := now();
  IF NEW.from_seed = NEW.to_seed THEN RAISE EXCEPTION 'self gift'; END IF;
  SELECT realm INTO ra FROM public.seeds WHERE id = NEW.from_seed;
  SELECT realm INTO rb FROM public.seeds WHERE id = NEW.to_seed;
  IF rb IS NULL OR ra IS DISTINCT FROM rb THEN RAISE EXCEPTION 'other realm'; END IF;
  IF NEW.kind = 'thanks' THEN
    NEW.amount := 0; NEW.note := greatest(0, least(2, NEW.note));
    IF NOT EXISTS (SELECT 1 FROM public.gifts g WHERE g.from_seed = NEW.to_seed AND g.to_seed = NEW.from_seed AND g.kind <> 'thanks' AND g.created_at > now() - interval '7 days') THEN RAISE EXCEPTION 'nothing to thank'; END IF;
    IF EXISTS (SELECT 1 FROM public.gifts g WHERE g.from_seed = NEW.from_seed AND g.to_seed = NEW.to_seed AND g.kind = 'thanks' AND g.created_at > now() - interval '1 day') THEN RAISE EXCEPTION 'already thanked'; END IF;
    RETURN NEW;
  END IF;
  NEW.amount := CASE NEW.kind WHEN 'gift' THEN 25 ELSE 40 END; NEW.note := 0;
  IF EXISTS (SELECT 1 FROM public.gifts g WHERE g.from_seed = NEW.from_seed AND g.kind <> 'thanks' AND g.created_at > now() - interval '1 day') THEN RAISE EXCEPTION 'one gift per day'; END IF;
  IF public.village_balance(NEW.from_seed) < NEW.amount THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER gifts_guard BEFORE INSERT ON public.gifts FOR EACH ROW EXECUTE FUNCTION public.gift_guard();

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; cpath text; cat timestamptz; spent integer; ev integer; tw integer; gi integer;
BEGIN
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = _seed;
  SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE to_seed = _seed OR from_seed = _seed;
  RETURN 150 + public.village_tax(created, now()) + public.village_dowry(created, now()) + (CASE WHEN cpath = 'trade' THEN public.charter_tax(created, cat, now()) ELSE 0 END) - spent - ev - tw + gi - public.village_raids(_seed, created, now());
END $function$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.gifts;