CREATE TABLE public.first_roads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL UNIQUE REFERENCES public.seeds(id),
  target_id uuid NOT NULL REFERENCES public.seeds(id),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.first_roads TO anon;
GRANT SELECT, INSERT ON public.first_roads TO authenticated;
GRANT ALL ON public.first_roads TO service_role;
ALTER TABLE public.first_roads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see first roads" ON public.first_roads FOR SELECT USING (true);
CREATE POLICY "Owners choose their first road" ON public.first_roads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = first_roads.seed_id AND s.user_id = auth.uid()));
CREATE OR REPLACE FUNCTION public.first_road_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.seeds; b public.seeds;
BEGIN
  SELECT * INTO a FROM public.seeds WHERE id = NEW.seed_id;
  SELECT * INTO b FROM public.seeds WHERE id = NEW.target_id;
  IF a.id = b.id OR sqrt(power(a.x - b.x, 2) + power(a.y - b.y, 2)) > 80 THEN
    RAISE EXCEPTION 'target out of reach';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER first_road_guard BEFORE INSERT ON public.first_roads FOR EACH ROW EXECUTE FUNCTION public.first_road_guard();