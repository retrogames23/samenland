CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realm text NOT NULL,
  sender_id uuid NOT NULL,
  sender_seed uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  recipient_id uuid,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_realm_idx ON public.chat_messages (realm, created_at DESC);
CREATE INDEX chat_messages_dm_idx ON public.chat_messages (recipient_id, sender_id, created_at DESC);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read tavern and own letters" ON public.chat_messages FOR SELECT TO authenticated
  USING (recipient_id IS NULL OR sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Write as yourself from your village" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = sender_seed AND s.user_id = auth.uid()));

CREATE TABLE public.chat_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.chat_blocks TO authenticated;
GRANT ALL ON public.chat_blocks TO service_role;
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own blocks" ON public.chat_blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "Add own blocks" ON public.chat_blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid() AND blocked_id <> auth.uid());
CREATE POLICY "Remove own blocks" ON public.chat_blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

CREATE OR REPLACE FUNCTION public.chat_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.created_at := now();
  NEW.body := btrim(NEW.body);
  IF length(NEW.body) < 1 OR length(NEW.body) > 300 THEN RAISE EXCEPTION 'bad length'; END IF;
  SELECT s.realm INTO NEW.realm FROM public.seeds s WHERE s.id = NEW.sender_seed;
  IF NEW.recipient_id = NEW.sender_id THEN RAISE EXCEPTION 'self letter'; END IF;
  IF EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.sender_id = NEW.sender_id AND m.created_at > now() - interval '2 seconds') THEN
    RAISE EXCEPTION 'too fast'; END IF;
  IF NEW.recipient_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.chat_blocks b WHERE b.blocker_id = NEW.recipient_id AND b.blocked_id = NEW.sender_id) THEN
    RAISE EXCEPTION 'blocked'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER chat_guard BEFORE INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.chat_guard();

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;