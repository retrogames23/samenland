CREATE TABLE public.village_dogs (
  seed_id uuid PRIMARY KEY REFERENCES public.seeds(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.village_dogs TO anon, authenticated;
GRANT INSERT, UPDATE ON public.village_dogs TO authenticated;
GRANT ALL ON public.village_dogs TO service_role;
ALTER TABLE public.village_dogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dog names are public" ON public.village_dogs FOR SELECT USING (true);
CREATE POLICY "owner names dog" ON public.village_dogs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));
CREATE POLICY "owner renames dog" ON public.village_dogs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));