GRANT SELECT ON public.supporter_rewards TO anon, authenticated;
GRANT ALL ON public.supporter_rewards TO service_role;
GRANT SELECT ON public.village_dogs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.village_dogs TO authenticated;
GRANT ALL ON public.village_dogs TO service_role;