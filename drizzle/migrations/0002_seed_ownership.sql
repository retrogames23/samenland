ALTER TABLE public.seeds ADD COLUMN user_id uuid UNIQUE;
DROP POLICY "Anyone can plant seeds" ON public.seeds;
DROP POLICY "Anyone can add plantings" ON public.plantings;
REVOKE INSERT ON public.seeds FROM anon;
REVOKE INSERT ON public.plantings FROM anon;
CREATE POLICY "Users plant their one seed" ON public.seeds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners plant near their seed" ON public.plantings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = seed_id AND s.user_id = auth.uid()));