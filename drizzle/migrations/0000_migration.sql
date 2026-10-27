CREATE TABLE public.seeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 32),
  owner text NOT NULL CHECK (char_length(owner) BETWEEN 1 AND 32),
  x integer NOT NULL CHECK (x BETWEEN 0 AND 511),
  y integer NOT NULL CHECK (y BETWEEN 0 AND 511),
  hue integer NOT NULL DEFAULT 20 CHECK (hue BETWEEN 0 AND 360),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.seeds TO anon, authenticated;
GRANT ALL ON public.seeds TO service_role;
ALTER TABLE public.seeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seeds" ON public.seeds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can plant seeds" ON public.seeds FOR INSERT TO anon, authenticated WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.seeds;
INSERT INTO public.seeds (name, owner, x, y, hue, created_at) VALUES
 ('Moosbach','Wanda',230,250,25, now() - interval '20 days'),
 ('Lindenau','Otto',290,215,200, now() - interval '6 days'),
 ('Kleeheim','Ida',260,310,120, now() - interval '2 days');