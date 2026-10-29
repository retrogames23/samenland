CREATE TABLE public.letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_seed uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  to_seed uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX letters_to_idx ON public.letters (to_seed, created_at DESC);
GRANT SELECT ON public.letters TO anon, authenticated;
GRANT ALL ON public.letters TO service_role;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone sees riders" ON public.letters FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.letter_bodies (
  letter_id uuid PRIMARY KEY REFERENCES public.letters(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid,
  body text NOT NULL
);
GRANT SELECT ON public.letter_bodies TO authenticated;
GRANT ALL ON public.letter_bodies TO service_role;
ALTER TABLE public.letter_bodies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sender and recipient read" ON public.letter_bodies FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE OR REPLACE FUNCTION public.send_letter(_from uuid, _to uuid, _body text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE rcpt uuid; lid uuid; b text := btrim(coalesce(_body, ''));
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM seeds WHERE id = _from AND user_id = auth.uid()) THEN RAISE EXCEPTION 'not your village'; END IF;
  IF _from = _to THEN RAISE EXCEPTION 'self letter'; END IF;
  IF length(b) < 1 OR length(b) > 140 THEN RAISE EXCEPTION 'bad length'; END IF;
  SELECT user_id INTO rcpt FROM seeds WHERE id = _to;
  IF NOT FOUND THEN RAISE EXCEPTION 'no village'; END IF;
  IF rcpt IS NOT NULL AND EXISTS (SELECT 1 FROM chat_blocks WHERE blocker_id = rcpt AND blocked_id = auth.uid()) THEN RAISE EXCEPTION 'blocked'; END IF;
  IF (SELECT count(*) FROM letters WHERE from_seed = _from AND created_at > now() - interval '1 day') >= 3 THEN RAISE EXCEPTION 'too many letters'; END IF;
  INSERT INTO letters (from_seed, to_seed, user_id) VALUES (_from, _to, auth.uid()) RETURNING id INTO lid;
  INSERT INTO letter_bodies (letter_id, sender_id, recipient_id, body) VALUES (lid, auth.uid(), rcpt, b);
  RETURN lid;
END $$;
REVOKE ALL ON FUNCTION public.send_letter(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_letter(uuid, uuid, text) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.letters;

CREATE OR REPLACE FUNCTION public.market_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text; tz text;
BEGIN
  SELECT realm INTO r FROM seeds WHERE id = NEW.seed_id AND created_at < now() - interval '1 day';
  IF NOT FOUND THEN RAISE EXCEPTION 'village too young'; END IF;
  tz := CASE r WHEN 'us-west' THEN 'America/Los_Angeles' WHEN 'us-east' THEN 'America/New_York' WHEN 'asia' THEN 'Asia/Tokyo' ELSE 'Europe/Berlin' END;
  NEW.day := (now() AT TIME ZONE 'utc')::date;
  NEW.reward := CASE WHEN extract(dow FROM now() AT TIME ZONE tz) = 6 THEN 20 ELSE 15 END;
  NEW.created_at := now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.abandon_village(_seed uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM seeds WHERE id = _seed AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not your village';
  END IF;
  DELETE FROM letters WHERE from_seed = _seed OR to_seed = _seed;
  DELETE FROM market_sales WHERE seed_id = _seed;
  DELETE FROM quest_claims WHERE seed_id = _seed;
  DELETE FROM blessings WHERE seed_id = _seed;
  DELETE FROM charters WHERE seed_id = _seed;
  DELETE FROM encounters WHERE seed_id = _seed;
  DELETE FROM first_roads WHERE seed_id = _seed OR target_id = _seed;
  DELETE FROM gifts WHERE from_seed = _seed OR to_seed = _seed;
  DELETE FROM plantings WHERE seed_id = _seed;
  DELETE FROM purchases WHERE seed_id = _seed;
  DELETE FROM signposts WHERE seed_id = _seed OR target_id = _seed;
  DELETE FROM twin_votes WHERE seed_id = _seed OR partner_id = _seed;
  DELETE FROM twin_works WHERE seed_id = _seed OR partner_id = _seed;
  DELETE FROM seeds WHERE id = _seed;
END $function$;