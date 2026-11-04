REVOKE SELECT ON public.supporter_rewards FROM anon, authenticated;
GRANT SELECT (id, seed_id, reward, environment, created_at) ON public.supporter_rewards TO anon, authenticated;