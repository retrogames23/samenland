DROP POLICY IF EXISTS "Read tax rules start" ON public.tax_cutover;
REVOKE SELECT ON public.tax_cutover FROM anon, authenticated;
GRANT ALL ON public.tax_cutover TO service_role;

DROP POLICY IF EXISTS "Anyone sees referrals" ON public.referrals;
REVOKE SELECT ON public.referrals FROM anon, authenticated;
GRANT SELECT (id, referrer_seed, referee_seed, reward, created_at) ON public.referrals TO authenticated;
CREATE POLICY "Signed-in players see referral bonuses" ON public.referrals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id IN (referrer_seed, referee_seed)));

DROP POLICY IF EXISTS "Anyone can see visits" ON public.village_visits;
REVOKE SELECT ON public.village_visits FROM anon;
GRANT SELECT ON public.village_visits TO authenticated;
CREATE POLICY "Signed-in players see visits" ON public.village_visits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id IN (visitor_seed, visited_seed)));