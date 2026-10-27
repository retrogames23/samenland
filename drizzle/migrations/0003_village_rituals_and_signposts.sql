CREATE TABLE public.blessings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('bell','well')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blessings TO anon;
GRANT SELECT, INSERT ON public.blessings TO authenticated;
GRANT ALL ON public.blessings TO service_role;
ALTER TABLE public.blessings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see blessings" ON public.blessings FOR SELECT USING (true);
CREATE POLICY "Owners bless their own village" ON public.blessings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));
CREATE INDEX blessings_seed_idx ON public.blessings(seed_id, created_at);

CREATE OR REPLACE FUNCTION public.blessing_cooldown() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.created_at := now();
  IF EXISTS (SELECT 1 FROM public.blessings b WHERE b.seed_id = NEW.seed_id AND b.created_at > now() - interval '24 hours') THEN
    RAISE EXCEPTION 'cooldown' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER blessings_cooldown BEFORE INSERT ON public.blessings FOR EACH ROW EXECUTE FUNCTION public.blessing_cooldown();

CREATE TABLE public.signposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seed_id, target_id)
);
GRANT SELECT ON public.signposts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signposts TO authenticated;
GRANT ALL ON public.signposts TO service_role;
ALTER TABLE public.signposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read signposts" ON public.signposts FOR SELECT USING (true);
CREATE POLICY "Owners place signposts" ON public.signposts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));
CREATE POLICY "Owners edit signposts" ON public.signposts FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners remove signposts" ON public.signposts FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.blessings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signposts;