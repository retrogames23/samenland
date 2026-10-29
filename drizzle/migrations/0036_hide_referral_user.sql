REVOKE SELECT ON public.referrals FROM anon, authenticated;
GRANT SELECT (id, referrer_seed, referee_seed, reward, created_at) ON public.referrals TO anon, authenticated;
GRANT ALL ON public.referrals TO service_role;