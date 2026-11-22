REVOKE EXECUTE ON FUNCTION public.village_balance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.village_capped_tax(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.village_balance(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.village_capped_tax(uuid, timestamptz) TO service_role;

DROP POLICY IF EXISTS "Supporter rewards are public decorations" ON public.supporter_rewards;
CREATE POLICY "Supporter decorations of existing villages are visible"
ON public.supporter_rewards FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.seeds s WHERE s.id = supporter_rewards.seed_id));