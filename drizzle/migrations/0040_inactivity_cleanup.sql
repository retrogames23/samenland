CREATE TABLE public.user_activity (
  user_id uuid PRIMARY KEY,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  warning_sent_at timestamptz,
  lang text NOT NULL DEFAULT 'de'
);
GRANT SELECT ON public.user_activity TO authenticated;
GRANT ALL ON public.user_activity TO service_role;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity readable" ON public.user_activity FOR SELECT TO authenticated USING (user_id = auth.uid());

INSERT INTO public.user_activity (user_id, last_active_at)
SELECT id, COALESCE(last_sign_in_at, created_at) FROM auth.users
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.touch_activity(_lang text DEFAULT 'de')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO user_activity (user_id, last_active_at, warning_sent_at, lang)
  VALUES (auth.uid(), now(), NULL, left(coalesce(_lang, 'de'), 5))
  ON CONFLICT (user_id) DO UPDATE SET last_active_at = now(), warning_sent_at = NULL, lang = excluded.lang;
END $$;
REVOKE ALL ON FUNCTION public.touch_activity(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.touch_activity(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.purge_user_data(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _seed uuid;
BEGIN
  FOR _seed IN SELECT id FROM seeds WHERE user_id = _uid LOOP
    DELETE FROM village_visits WHERE visitor_seed = _seed OR visited_seed = _seed;
    DELETE FROM referrals WHERE referrer_seed = _seed OR referee_seed = _seed;
    DELETE FROM letter_bodies WHERE letter_id IN (SELECT id FROM letters WHERE from_seed = _seed OR to_seed = _seed);
    DELETE FROM letters WHERE from_seed = _seed OR to_seed = _seed;
    DELETE FROM chat_messages WHERE sender_seed = _seed;
    DELETE FROM market_sales WHERE seed_id = _seed;
    DELETE FROM quest_claims WHERE seed_id = _seed;
    DELETE FROM blessings WHERE seed_id = _seed;
    DELETE FROM charters WHERE seed_id = _seed;
    DELETE FROM encounters WHERE seed_id = _seed;
    DELETE FROM first_roads WHERE seed_id = _seed OR target_id = _seed;
    DELETE FROM gift_reads WHERE gift_id IN (SELECT id FROM gifts WHERE from_seed = _seed OR to_seed = _seed);
    DELETE FROM gifts WHERE from_seed = _seed OR to_seed = _seed;
    DELETE FROM plantings WHERE seed_id = _seed;
    DELETE FROM purchases WHERE seed_id = _seed;
    DELETE FROM signposts WHERE seed_id = _seed OR target_id = _seed;
    DELETE FROM twin_votes WHERE seed_id = _seed OR partner_id = _seed;
    DELETE FROM twin_works WHERE seed_id = _seed OR partner_id = _seed;
    DELETE FROM seeds WHERE id = _seed;
  END LOOP;
  DELETE FROM chat_blocks WHERE blocker_id = _uid OR blocked_id = _uid;
  DELETE FROM build_mail WHERE user_id = _uid;
  DELETE FROM user_activity WHERE user_id = _uid;
END $$;
REVOKE ALL ON FUNCTION public.purge_user_data(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_user_data(uuid) TO service_role;