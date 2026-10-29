CREATE TABLE public.quest_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id),
  user_id uuid NOT NULL,
  quest text NOT NULL,
  reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seed_id, quest)
);
GRANT SELECT ON public.quest_claims TO anon;
GRANT SELECT, INSERT ON public.quest_claims TO authenticated;
GRANT ALL ON public.quest_claims TO service_role;
ALTER TABLE public.quest_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see quest claims" ON public.quest_claims FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners claim quests" ON public.quest_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.quest_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE order_list text[] := ARRAY['bless','build','sign','meet','ten','gift','hamlet'];
  rewards int[] := ARRAY[20,30,20,30,40,40,60]; i int;
BEGIN
  i := array_position(order_list, NEW.quest);
  IF i IS NULL THEN RAISE EXCEPTION 'unknown quest'; END IF;
  IF i > 1 AND NOT EXISTS (SELECT 1 FROM quest_claims WHERE seed_id = NEW.seed_id AND quest = order_list[i-1]) THEN
    RAISE EXCEPTION 'previous quest open';
  END IF;
  IF (NEW.quest = 'bless' AND NOT EXISTS (SELECT 1 FROM blessings WHERE seed_id = NEW.seed_id))
    OR (NEW.quest = 'build' AND NOT EXISTS (SELECT 1 FROM purchases WHERE seed_id = NEW.seed_id))
    OR (NEW.quest = 'sign' AND NOT EXISTS (SELECT 1 FROM signposts WHERE seed_id = NEW.seed_id))
    OR (NEW.quest = 'meet' AND NOT EXISTS (SELECT 1 FROM encounters WHERE seed_id = NEW.seed_id))
    OR (NEW.quest = 'gift' AND NOT EXISTS (SELECT 1 FROM gifts WHERE from_seed = NEW.seed_id)) THEN
    RAISE EXCEPTION 'quest not done';
  END IF;
  NEW.reward := rewards[i];
  NEW.created_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER quest_guard BEFORE INSERT ON public.quest_claims FOR EACH ROW EXECUTE FUNCTION public.quest_guard();

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; cpath text; cat timestamptz; spent integer; ev integer; tw integer; gi integer; qr integer;
BEGIN
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = _seed;
  SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE to_seed = _seed OR from_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO qr FROM public.quest_claims WHERE seed_id = _seed;
  RETURN 150 + public.village_tax(created, now()) + public.village_dowry(created, now()) + (CASE WHEN cpath = 'trade' THEN public.charter_tax(created, cat, now()) ELSE 0 END) - spent - ev - tw + gi + qr - public.village_raids(_seed, created, now());
END $function$;

CREATE OR REPLACE FUNCTION public.abandon_village(_seed uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM seeds WHERE id = _seed AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not your village';
  END IF;
  DELETE FROM quest_claims WHERE seed_id = _seed;
  DELETE FROM blessings WHERE seed_id = _seed;
  DELETE FROM charters WHERE seed_id = _seed;
  DELETE FROM encounters WHERE seed_id = _seed;
  DELETE FROM first_roads WHERE seed_id = _seed OR target_id = _seed;
  DELETE FROM gifts WHERE from_seed = _seed OR to_seed = _seed;
  DELETE FROM plantings WHERE seed_id = _seed;
  DELETE FROM purchases WHERE seed_id = _seed;
  DELETE FROM signposts WHERE seed_id = _seed OR target_id = _seed;
  DELETE FROM twin_votes WHERE seed_id = _seed OR partner_id = _seed;
  DELETE FROM twin_works WHERE seed_id = _seed OR partner_id = _seed;
  DELETE FROM seeds WHERE id = _seed;
END $function$;