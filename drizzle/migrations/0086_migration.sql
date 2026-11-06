CREATE OR REPLACE FUNCTION public.purge_user_data(_uid uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _seed uuid;
BEGIN
  FOR _seed IN SELECT id FROM seeds WHERE user_id = _uid LOOP
    DELETE FROM village_visits WHERE visitor_seed = _seed OR visited_seed = _seed;
    DELETE FROM wonder_finds WHERE seed_id = _seed;
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
    DELETE FROM princely_errands WHERE seed_id = _seed;
    DELETE FROM princely_tasks WHERE seed_id = _seed;
    DELETE FROM knighthoods WHERE seed_id = _seed;
    DELETE FROM rank_certificates WHERE seed_id = _seed;
    DELETE FROM tax_receipts WHERE seed_id = _seed;
    DELETE FROM village_dogs WHERE seed_id = _seed;
    DELETE FROM supporter_rewards WHERE seed_id = _seed;
    DELETE FROM seeds WHERE id = _seed;
  END LOOP;
  DELETE FROM letter_bodies WHERE sender_id = _uid OR recipient_id = _uid;
  DELETE FROM chat_messages WHERE sender_id = _uid OR recipient_id = _uid;
  DELETE FROM chat_blocks WHERE blocker_id = _uid OR blocked_id = _uid;
  DELETE FROM chat_reads WHERE user_id = _uid;
  DELETE FROM gift_reads WHERE user_id = _uid;
  DELETE FROM feast_reads WHERE user_id = _uid;
  DELETE FROM chest_mail WHERE user_id = _uid;
  DELETE FROM build_mail WHERE user_id = _uid;
  DELETE FROM survey_answers WHERE user_id = _uid;
  DELETE FROM user_days WHERE user_id = _uid;
  DELETE FROM bug_reports WHERE user_id = _uid;
  DELETE FROM user_activity WHERE user_id = _uid;
END $function$;
REVOKE ALL ON FUNCTION public.purge_user_data(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_user_data(uuid) TO service_role;

-- serialize concurrent requests per village/sender before checking limits
CREATE OR REPLACE FUNCTION public.blessing_cooldown()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('bless' || NEW.seed_id::text));
  NEW.created_at := now();
  IF EXISTS (SELECT 1 FROM public.blessings b WHERE b.seed_id = NEW.seed_id AND b.created_at >= public.realm_day_start(NEW.seed_id)) THEN
    RAISE EXCEPTION 'cooldown' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.chat_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('chat' || NEW.sender_id::text));
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
END $function$;

CREATE OR REPLACE FUNCTION public.claim_wonder(_seed uuid, _site text)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE me public.seeds; w public.wonder_sites; isfirst boolean; r integer;
BEGIN
  SELECT * INTO me FROM public.seeds WHERE id = _seed;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  SELECT * INTO w FROM public.wonder_sites WHERE key = _site;
  IF w.key IS NULL THEN RAISE EXCEPTION 'unknown site'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('wonderday' || _seed::text));
  IF (SELECT count(*) FROM public.wonder_finds WHERE seed_id = _seed AND created_at >= public.realm_day_start(_seed)) >= 3 THEN RAISE EXCEPTION 'too many'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_site || coalesce(me.realm, '')));
  isfirst := NOT EXISTS (SELECT 1 FROM public.wonder_finds WHERE site = _site AND realm = coalesce(me.realm, 'europe') AND first);
  r := CASE WHEN isfirst THEN 60 ELSE 50 END;
  INSERT INTO public.wonder_finds(seed_id, site, realm, first, reward) VALUES (_seed, _site, coalesce(me.realm, 'europe'), isfirst, r) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  RETURN r;
END $function$;