CREATE TABLE public.charters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL UNIQUE REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  path text NOT NULL CHECK (path IN ('trade','craft','culture','farm')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.charters TO anon;
GRANT SELECT, INSERT ON public.charters TO authenticated;
GRANT ALL ON public.charters TO service_role;
ALTER TABLE public.charters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see charters" ON public.charters FOR SELECT USING (true);
CREATE POLICY "Owners seal their charter" ON public.charters FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));
CREATE OR REPLACE FUNCTION public.charter_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.created_at := now();
  IF NOT EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = NEW.seed_id AND s.created_at <= now() - interval '24 hours') THEN
    RAISE EXCEPTION 'village too young for a charter';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER charter_guard BEFORE INSERT ON public.charters FOR EACH ROW EXECUTE FUNCTION public.charter_guard();