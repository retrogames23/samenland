CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  item text NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seed_id, item)
);
GRANT SELECT ON public.purchases TO anon;
GRANT SELECT, INSERT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see purchases" ON public.purchases FOR SELECT USING (true);
CREATE POLICY "Owners buy for their village" ON public.purchases FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));

-- Mirrors taxEarned() in src/game/economy.ts: 1 copper per resident per full day, population from age.
CREATE OR REPLACE FUNCTION public.village_tax(_created timestamptz, _at timestamptz)
RETURNS integer LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE days integer := floor(extract(epoch FROM (_at - _created)) / 86400); total integer := 0; d integer; h double precision; r double precision;
BEGIN
  FOR d IN 1..greatest(days, 0) LOOP
    h := d * 24;
    r := 1.6 + 0.18 * sqrt(h) + 3 * ln(1 + h / 60);
    total := total + floor(3 + 0.9 * power(r, 1.6))::integer;
  END LOOP;
  RETURN total;
END $$;

CREATE OR REPLACE FUNCTION public.purchase_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE price integer; created timestamptz; spent integer;
BEGIN
  price := CASE NEW.item WHEN 'fisher' THEN 300 WHEN 'granary' THEN 500 WHEN 'healer' THEN 800 WHEN 'school' THEN 1500 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  NEW.cost := price; NEW.created_at := now();
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = NEW.seed_id;
  SELECT coalesce(sum(p.cost), 0) INTO spent FROM public.purchases p WHERE p.seed_id = NEW.seed_id;
  IF 100 + public.village_tax(created, now()) - spent < price THEN RAISE EXCEPTION 'not enough money'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER purchase_guard BEFORE INSERT ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.purchase_guard();
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;