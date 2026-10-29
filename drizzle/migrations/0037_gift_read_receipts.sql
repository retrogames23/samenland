CREATE TABLE public.gift_reads (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  gift_id uuid NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, gift_id)
);
GRANT SELECT, INSERT ON public.gift_reads TO authenticated;
GRANT ALL ON public.gift_reads TO service_role;
ALTER TABLE public.gift_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players read their own receipts" ON public.gift_reads FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Recipients mark their gifts read" ON public.gift_reads FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.gifts g JOIN public.seeds s ON s.id = g.to_seed WHERE g.id = gift_id AND s.user_id = (SELECT auth.uid())));