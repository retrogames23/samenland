CREATE TABLE public.feast_reads (
  user_id uuid NOT NULL,
  feast text NOT NULL CHECK (char_length(feast) <= 40),
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, feast)
);
GRANT SELECT, INSERT ON public.feast_reads TO authenticated;
GRANT ALL ON public.feast_reads TO service_role;
ALTER TABLE public.feast_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own feast reads select" ON public.feast_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own feast reads insert" ON public.feast_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());