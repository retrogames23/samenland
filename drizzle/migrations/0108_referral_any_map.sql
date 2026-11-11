-- Invites no longer bind the newcomer to the inviter's map: the bonus works across maps.
CREATE OR REPLACE FUNCTION public.claim_referral(_seed uuid, _ref uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me public.seeds; them public.seeds;
BEGIN
  SELECT * INTO me FROM public.seeds WHERE id = _seed;
  SELECT * INTO them FROM public.seeds WHERE id = _ref;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  IF them.id IS NULL OR them.user_id IS NULL OR them.user_id = auth.uid() THEN RAISE EXCEPTION 'bad referrer'; END IF;
  IF them.created_at > now() - interval '24 hours' THEN RAISE EXCEPTION 'referrer not hamlet'; END IF;
  IF me.created_at < now() - interval '2 days' THEN RAISE EXCEPTION 'too late'; END IF;
  IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.created_at < now() - interval '2 days') THEN RAISE EXCEPTION 'not a new account'; END IF;
  INSERT INTO public.referrals(referrer_seed, referee_seed, referee_user) VALUES (_ref, _seed, auth.uid());
  RETURN 50;
END $$;
REVOKE ALL ON FUNCTION public.claim_referral(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral(uuid, uuid) TO authenticated;
