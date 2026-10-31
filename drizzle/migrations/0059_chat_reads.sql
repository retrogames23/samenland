CREATE TABLE public.chat_reads (
  user_id uuid NOT NULL,
  channel text NOT NULL,
  seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel)
);
GRANT SELECT, INSERT, UPDATE ON public.chat_reads TO authenticated;
GRANT ALL ON public.chat_reads TO service_role;
ALTER TABLE public.chat_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reads select" ON public.chat_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own reads insert" ON public.chat_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND length(channel) <= 64);
CREATE POLICY "own reads update" ON public.chat_reads FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.purge_chat_reads() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN DELETE FROM public.chat_reads WHERE user_id = OLD.user_id; RETURN OLD; END $$;
CREATE TRIGGER purge_chat_reads AFTER DELETE ON public.user_activity FOR EACH ROW EXECUTE FUNCTION public.purge_chat_reads();