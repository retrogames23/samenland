CREATE TABLE public.plantings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('tree','flower','lantern')),
  x integer NOT NULL CHECK (x BETWEEN 0 AND 511),
  y integer NOT NULL CHECK (y BETWEEN 0 AND 511),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.plantings TO anon, authenticated;
GRANT ALL ON public.plantings TO service_role;
ALTER TABLE public.plantings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plantings" ON public.plantings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add plantings" ON public.plantings FOR INSERT TO anon, authenticated WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.plantings;