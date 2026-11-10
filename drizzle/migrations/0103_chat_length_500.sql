CREATE OR REPLACE FUNCTION public.chat_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('chat' || NEW.sender_id::text));
  NEW.created_at := now();
  NEW.body := btrim(NEW.body);
  IF length(NEW.body) < 1 OR length(NEW.body) > 500 THEN RAISE EXCEPTION 'bad length'; END IF;
  SELECT s.realm INTO NEW.realm FROM public.seeds s WHERE s.id = NEW.sender_seed;
  IF NEW.recipient_id = NEW.sender_id THEN RAISE EXCEPTION 'self letter'; END IF;
  IF EXISTS (SELECT 1 FROM public.chat_messages m WHERE m.sender_id = NEW.sender_id AND m.created_at > now() - interval '2 seconds') THEN
    RAISE EXCEPTION 'too fast'; END IF;
  IF NEW.recipient_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.chat_blocks b WHERE b.blocker_id = NEW.recipient_id AND b.blocked_id = NEW.sender_id) THEN
    RAISE EXCEPTION 'blocked'; END IF;
  RETURN NEW;
END $function$;
