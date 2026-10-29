REVOKE SELECT ON public.referrals FROM anon, authenticated;
GRANT SELECT (id, referrer_seed, referee_seed, reward, created_at) ON public.referrals TO anon, authenticated;
COMMENT ON POLICY "Anyone sees referrals" ON public.referrals IS 'Public by design: invite bonuses are derived on every client; referee_user is not readable (column grants).';