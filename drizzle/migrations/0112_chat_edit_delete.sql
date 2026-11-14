ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;
GRANT UPDATE (body), DELETE ON public.chat_messages TO authenticated;
CREATE POLICY "Edit own messages" ON public.chat_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Delete own messages" ON public.chat_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());
CREATE OR REPLACE FUNCTION public.chat_edit_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.sender_id <> OLD.sender_id OR NEW.sender_seed <> OLD.sender_seed OR NEW.realm <> OLD.realm
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'only text'; END IF;
  NEW.body := btrim(NEW.body);
  IF length(NEW.body) < 1 OR length(NEW.body) > 500 THEN RAISE EXCEPTION 'bad length'; END IF;
  IF NEW.body <> OLD.body THEN NEW.edited_at := now(); ELSE NEW.edited_at := OLD.edited_at; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER chat_edit_guard BEFORE UPDATE ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.chat_edit_guard();