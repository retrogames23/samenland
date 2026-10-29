CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_seed uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  referee_seed uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  referee_user uuid NOT NULL UNIQUE,
  reward integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO anon, authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone sees referrals" ON public.referrals FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.claim_referral(_seed uuid, _ref uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me public.seeds; them public.seeds;
BEGIN
  SELECT * INTO me FROM public.seeds WHERE id = _seed;
  SELECT * INTO them FROM public.seeds WHERE id = _ref;
  IF me.id IS NULL OR me.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not your village'; END IF;
  IF them.id IS NULL OR them.user_id IS NULL OR them.user_id = auth.uid() THEN RAISE EXCEPTION 'bad referrer'; END IF;
  IF them.realm <> me.realm THEN RAISE EXCEPTION 'other map'; END IF;
  IF them.created_at > now() - interval '24 hours' THEN RAISE EXCEPTION 'referrer not hamlet'; END IF;
  IF me.created_at < now() - interval '2 days' THEN RAISE EXCEPTION 'too late'; END IF;
  IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.created_at < now() - interval '2 days') THEN RAISE EXCEPTION 'not a new account'; END IF;
  INSERT INTO public.referrals(referrer_seed, referee_seed, referee_user) VALUES (_ref, _seed, auth.uid());
  RETURN 50;
END $$;
REVOKE ALL ON FUNCTION public.claim_referral(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.village_balance(_seed uuid)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE created timestamptz; cpath text; cat timestamptz; spent integer; ev integer; tw integer; gi integer; qr integer; mk integer; rf integer;
BEGIN
  SELECT s.created_at INTO created FROM public.seeds s WHERE s.id = _seed;
  SELECT c.path, c.created_at INTO cpath, cat FROM public.charters c WHERE c.seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO spent FROM public.purchases WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO ev FROM public.encounters WHERE seed_id = _seed;
  SELECT coalesce(sum(cost),0) INTO tw FROM public.twin_works WHERE seed_id = _seed;
  SELECT coalesce(sum(CASE WHEN to_seed = _seed THEN amount ELSE -amount END),0) INTO gi FROM public.gifts WHERE to_seed = _seed OR from_seed = _seed;
  SELECT coalesce(sum(reward),0) INTO qr FROM public.quest_claims WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO mk FROM public.market_sales WHERE seed_id = _seed;
  SELECT coalesce(sum(reward),0) INTO rf FROM public.referrals WHERE referrer_seed = _seed OR referee_seed = _seed;
  RETURN 150 + public.village_tax(created, now()) + public.village_dowry(created, now()) + (CASE WHEN cpath = 'trade' THEN public.charter_tax(created, cat, now()) ELSE 0 END) - spent - ev - tw + gi + qr + mk + rf - public.village_raids(_seed, created, now());
END $function$;